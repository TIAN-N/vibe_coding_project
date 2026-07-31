#!/usr/bin/env python
# -*- coding: utf-8 -*-
#  Copyright (c) Huawei Technologies Co., Ltd. 2025-2026. All rights reserved.

# !/usr/bin/env python
# -*- coding: utf-8 -*-
#  Copyright (c) Huawei Technologies Co., Ltd. 2025-2026. All rights reserved.
import math
import copy
from itertools import combinations
from typing import List, Union, Tuple, Dict, Any, Callable
import pandas as pd
import numpy as np
import networkx as nx
import matplotlib
import matplotlib.pyplot as plt
import logging
import json


matplotlib.use('Agg')

logger = logging.getLogger(__name__)


class SubTopoVisualize:
    """
    环链可视化V2版本
    优化点：
    1. 类初始化入参改为文件路径，在类初始化时加载数据构建拓扑
    2. 网元名称标注在节点下方
    3. 保持mark_edges类似的子图标记思路
    """

    def __init__(self,
                 ip_link_path: str,
                 device_path: str,
                 result_path: str, root_list=None):
        """
        初始化可视化类

        :param ip_link_path: ip_link文件路径(CSV格式，包含Src NE Name, Sink NE Name等列)
        :param device_path: device文件路径(CSV格式，包含NE Name, Role等列)
        :param result_path: 环链识别结果路径(JSON格式，包含rings和links)
        """
        # 加载数据文件
        self.ip_link_df = self._load_ip_link(ip_link_path)
        self.device_df = self._load_device(device_path)
        self.result_data = self._load_result(result_path)

        # 提取环链分析结果
        self.rings_analysis = self.result_data.get('rings', [])
        self.links_analysis = self.result_data.get('links', [])

        # 构建网元角色映射
        self.ne_role_map = self._build_ne_role_map()

        # 构建节点和边
        self.device_nodes = pd.unique(
            self.ip_link_df[['Src NE Name', 'Sink NE Name']].values.ravel()
        ).tolist()
        self.device_nodes.sort()

        # 构建边列表 (使用设备名)
        self.device_edges = list(
            map(tuple, self.ip_link_df[['Src NE Name', 'Sink NE Name']].values)
        )
        # 构建图
        logger.info("开始构建网络图...")
        self.graph = None
        self.asg_graph = None
        self.csg_graph = None
        self.core_graph = None
        self.pos = None
        self._construct_graph()

        # 标记子图
        self.marked_graph = nx.Graph()

        # 设置绘图（延迟初始化，在绘图时才创建）
        self._fig = None
        self._layout_computed = False
        self.root_list = root_list

    @staticmethod
    def _load_ip_link(ip_link_path: str) -> pd.DataFrame:
        """加载ip_link CSV文件"""
        df = pd.read_csv(ip_link_path)
        # 确保列名存在
        required_cols = ['Src NE Name', 'Sink NE Name']
        for col in required_cols:
            if col not in df.columns:
                raise ValueError(f"ip_link文件缺少必需列: {col}")
        return df

    @staticmethod
    def _load_device(device_path: str) -> pd.DataFrame:
        """加载device CSV文件"""
        df = pd.read_csv(device_path)
        # 确保列名存在
        if 'NE Name' not in df.columns:
            raise ValueError("device文件缺少必需列: NE Name")
        return df

    @staticmethod
    def _load_result(result_path: str) -> Dict[str, Any]:
        """加载环链识别结果文件，支持JSON和CSV格式"""
        if result_path.endswith('.json'):
            with open(result_path, 'r', encoding='utf-8') as f:
                data = json.load(f)
                return {
                    'rings': data.get('rings', []),
                    'links': data.get('links', [])
                }
        elif result_path.endswith('.csv'):
            # CSV格式处理
            df = pd.read_csv(result_path)
            df['Category'] = df['Category'].str.lower()

            # 分离Ring和Link
            rings_data = df[df['Category'] == 'ring'].to_dict('records')
            links_data = df[df['Category'] == 'link'].to_dict('records')

            # 转换为统一格式
            rings = []
            for r in rings_data:
                member_path = r['Member_path'].split('->')
                rings.append({
                    'Ring Label': r.get('Label', ''),
                    'Ring Member': member_path,
                    'Name': r.get('Name', ''),
                    'Index': r.get('Index', 0)
                })

            links = []
            for l in links_data:
                member_path = l['Member_path'].split('->')
                links.append({
                    'Link Label': l.get('Label', ''),
                    'Link Member': member_path,
                    'Name': l.get('Name', ''),
                    'Index': l.get('Index', 0)
                })

            return {'rings': rings, 'links': links}
        else:
            raise ValueError(f"不支持的结果文件格式: {result_path}")

    def _build_ne_role_map(self) -> Dict[str, str]:
        """构建网元角色映射 (NE Name -> role)"""
        role_map = {}
        for _, row in self.device_df.iterrows():
            ne_name = row.get('NE Name')
            role = row.get('Role', 'unknown')
            if pd.notna(ne_name):
                role_map[str(ne_name)] = str(role).lower() if pd.notna(role) else 'unknown'
        return role_map

    def _construct_graph(self):
        """
        根据节点列表与边列表构建图
        """
        # 创建图
        G = nx.Graph()
        asg_list = []
        csg_list = []
        core_list = []

        # 添加节点，根据角色分配到不同子图
        for index, node in enumerate(self.device_nodes):
            node_id = node
            G.add_node(node_id)

            # 根据角色分配子图
            role = self.ne_role_map.get(node, 'unknown')
            if role == 'asg':
                asg_list.append(node_id)
            elif role == 'csg':
                csg_list.append(node_id)
            else:  # core或其他
                core_list.append(node_id)

        asg_G = G.subgraph(asg_list)
        csg_G = G.subgraph(csg_list)
        core_G = G.subgraph(core_list)

        # 添加边
        for edge in self.device_edges:
            G.add_edge(edge[0], edge[1])

        # 延迟布局计算 - 使用更快的spring布局
        self.graph = G
        self.asg_graph = asg_G
        self.csg_graph = csg_G
        self.core_graph = core_G
        self.pos = None

    def _compute_layout(self):
        """延迟计算布局（首次绘图时调用）"""
        if self.pos is not None:
            return self.pos
        if len(self.device_df) > 1000:
            self.pos = nx.spring_layout(self.graph, k=0.5, iterations=50, seed=42)
        else:
            self.pos = nx.kamada_kawai_layout(self.graph)
        self._layout_computed = True
        logger.info("布局计算完成")
        return self.pos

    def _get_device_gis_info(self) -> Dict[str, Tuple[float, float]]:
        """
        从device表获取网元的经纬度信息

        :return: 字典 {node_name: (longitude, latitude)}
        """
        gis_info = {}
        for _, row in self.device_df.iterrows():
            ne_name = row.get('NE Name')
            if pd.notna(ne_name):
                longitude = row.get('Longitude')
                latitude = row.get('Latitude')
                if pd.notna(longitude) and pd.notna(latitude):
                    try:
                        gis_info[str(ne_name)] = (float(longitude), float(latitude))
                    except (ValueError, TypeError):
                        pass
        return gis_info

    def _fill_missing_gis_by_neighbors(self, gis_info: Dict[str, Tuple[float, float]]) -> Dict[
        str, Tuple[float, float]]:
        """
        为缺失经纬度的网元通过相邻网元计算默认经纬度

        :param gis_info: 已有经纬度的网元字典
        :return: 填充后的经纬度字典
        """
        filled_gis = gis_info.copy()
        missing_nodes = set(self.device_nodes) - set(gis_info.keys())

        if not missing_nodes:
            return filled_gis

        connected_graph = nx.Graph()
        for edge in self.device_edges:
            connected_graph.add_edge(edge[0], edge[1])

        for node in missing_nodes:
            neighbors = list(connected_graph.neighbors(node))
            neighbors_with_gis = [n for n in neighbors if n in gis_info]

            if neighbors_with_gis:
                lons, lats = zip(*[gis_info[n] for n in neighbors_with_gis])
                filled_gis[node] = (sum(lons) / len(lons), sum(lats) / len(lats))
                logger.info(f"网元 {node} 缺失经纬度，通过相邻节点 {neighbors_with_gis} 计算重心: {filled_gis[node]}")
            else:
                all_lons = [v[0] for v in gis_info.values()]
                all_lats = [v[1] for v in gis_info.values()]
                if all_lons and all_lats:
                    center_lon = sum(all_lons) / len(all_lons)
                    center_lat = sum(all_lats) / len(all_lats)
                    filled_gis[node] = (center_lon, center_lat)
                    logger.info(f"网元 {node} 无相邻有经纬度节点，使用全局重心: {filled_gis[node]}")
                else:
                    raise ValueError(f"无法为网元 {node} 计算经纬度: 所有设备均缺失经纬度信息")

        return filled_gis

    def _resolve_overlapping_coords(self, gis_info: Dict[str, Tuple[float, float]],
                                    offset_scale: float = 0.001) -> Dict[str, Tuple[float, float]]:
        """
        处理经纬度重叠的节点，添加微小偏移

        :param gis_info: 经纬度信息字典
        :param offset_scale: 偏移缩放因子
        :return: 处理后的经纬度字典
        """
        coord_to_nodes = {}
        for node, coord in gis_info.items():
            coord_key = (round(coord[0], 6), round(coord[1], 6))
            if coord_key not in coord_to_nodes:
                coord_to_nodes[coord_key] = []
            coord_to_nodes[coord_key].append(node)

        resolved_gis = gis_info.copy()
        overlapping_count = 0

        for coord_key, nodes in coord_to_nodes.items():
            if len(nodes) > 1:
                overlapping_count += 1
                base_lon, base_lat = coord_key
                num_nodes = len(nodes)

                for i, node in enumerate(nodes):
                    angle = 2 * math.pi * i / num_nodes
                    offset_lon = offset_scale * math.cos(angle) * (i + 1) / num_nodes
                    offset_lat = offset_scale * math.sin(angle) * (i + 1) / num_nodes
                    resolved_gis[node] = (base_lon + offset_lon, base_lat + offset_lat)

        return resolved_gis

    def _map_gis_to_canvas_coords(self, gis_info: Dict[str, Tuple[float, float]],
                                  canvas_width: float = 1000.0,
                                  canvas_height: float = 1000.0,
                                  padding: float = 50.0) -> Dict[str, Tuple[float, float]]:
        """
        将经纬度映射到画布平面坐标

        :param gis_info: 经纬度信息字典
        :param canvas_width: 画布宽度
        :param canvas_height: 画布高度
        :param padding: 边距
        :return: 节点到画布坐标的映射
        """
        lons = [coord[0] for coord in gis_info.values()]
        lats = [coord[1] for coord in gis_info.values()]

        min_lon, max_lon = min(lons), max(lons)
        min_lat, max_lat = min(lats), max(lats)

        lon_range = max_lon - min_lon if max_lon != min_lon else 1
        lat_range = max_lat - min_lat if max_lat != min_lat else 1

        available_width = canvas_width - 2 * padding
        available_height = canvas_height - 2 * padding

        scale_x = available_width / lon_range
        scale_y = available_height / lat_range
        scale = min(scale_x, scale_y)

        canvas_coords = {}
        for node, (lon, lat) in gis_info.items():
            x = padding + (lon - min_lon) * scale
            y = canvas_height - padding - (lat - min_lat) * scale
            canvas_coords[node] = np.array([x, y])

        return canvas_coords

    def compute_layout_base_gis(self) -> Dict[str, Tuple[float, float]]:
        """
        基于GIS经纬度计算拓扑布局

        使用device表中的Longitude和Latitude确定每个节点在画布中的唯一位置。
        处理经纬度缺失和重叠的情况。

        :return: 节点到画布坐标的映射字典
        """

        gis_info = self._get_device_gis_info()

        if len(gis_info) == 0:
            logger.warning("未获取到任何经纬度信息，回退到默认布局算法")
            self._compute_layout()
            return self.pos

        filled_gis = self._fill_missing_gis_by_neighbors(gis_info)

        resolved_gis = self._resolve_overlapping_coords(filled_gis)

        self.pos = self._map_gis_to_canvas_coords(resolved_gis)
        self._layout_computed = True

        return self.pos

    def _calculate_adaptive_sizes(self, canvas_size: int = None) -> Dict[str, Any]:
        """
        根据画布大小和节点/边数量计算自适应的大小参数

        :param canvas_size: 画布大小（英寸），如果为None则自动计算
        :return: 包含各种大小参数的字典
        """
        num_nodes = len(self.device_nodes)

        # 自动计算画布大小
        if canvas_size is None:
            if num_nodes > 500:
                canvas_size = 80
            elif num_nodes > 200:
                canvas_size = 60
            elif num_nodes > 100:
                canvas_size = 50
            else:
                canvas_size = 40

        # 计算节点密度因子（用于缩放）
        # 密度越高，节点越小
        density_factor = math.sqrt(num_nodes) / 10
        density_factor = max(0.3, min(density_factor, 2.0))  # 限制在0.3-2.0之间

        # 根据画布大小计算基准节点大小
        base_node_size = (canvas_size ** 2) / math.sqrt(num_nodes + 1)
        base_node_size = max(30, min(base_node_size, 500))  # 限制范围

        # 不同类型节点的相对大小
        node_sizes = {
            'asg': base_node_size * 2,
            'csg': base_node_size * 1.0,
            'core': base_node_size * 3
        }

        # 根据密度因子调整
        for key in node_sizes:
            node_sizes[key] = max(20, node_sizes[key] / density_factor)

        # 计算标签字体大小
        # 字体大小与节点数量成反比
        font_size = max(2, min(12, 8 * (20 / math.sqrt(num_nodes + 1))))
        font_size = font_size / density_factor * 0.8

        # 边宽度
        line_width = max(0.2, min(2.0, 0.8 / density_factor))

        # 标签偏移量
        label_offset = 0.01 * (canvas_size / 50)

        return {
            'node_sizes': node_sizes,
            'font_size': font_size,
            'line_width': line_width,
            'label_offset': label_offset,
            'canvas_size': canvas_size,
            'density_factor': density_factor
        }

    def _resolve_node_overlap(self, pos: Dict[str, np.ndarray],
                              min_distance: float = None) -> Dict[str, np.ndarray]:
        """
        解决节点位置重叠问题，对重叠节点添加微小偏移

        :param pos: 节点位置字典
        :param min_distance: 最小距离阈值，默认根据节点数量自动计算
        :return: 处理后的位置字典
        """
        pos = {k: np.array(v) for k, v in pos.items()}
        num_nodes = len(pos)

        if min_distance is None:
            all_coords = np.array(list(pos.values()))
            x_range = all_coords[:, 0].max() - all_coords[:, 0].min()
            y_range = all_coords[:, 1].max() - all_coords[:, 1].min()
            canvas_range = max(x_range, y_range, 1)
            min_distance = canvas_range * 0.01

        resolved_pos = pos.copy()
        overlap_count = 0

        nodes = list(pos.keys())
        for i, node_i in enumerate(nodes):
            for j in range(i + 1, len(nodes)):
                node_j = nodes[j]
                diff = resolved_pos[node_i] - resolved_pos[node_j]
                distance = np.linalg.norm(diff)

                if distance < min_distance and distance > 0:
                    overlap_count += 1
                    overlap_dir = diff / distance
                    offset = (min_distance - distance) / 2 + 0.001
                    resolved_pos[node_i] = resolved_pos[node_i] + overlap_dir * offset
                    resolved_pos[node_j] = resolved_pos[node_j] - overlap_dir * offset

        if overlap_count > 0:
            logger.info(f"已解决 {overlap_count} 对节点重叠问题")

        return resolved_pos

    def draw_base_graph(self,
                        line_width: Union[float, List[float]] = None,
                        save_path: str = None,
                        canvas_size: int = None,
                        show_legend: bool = True,
                        use_gis_layout: bool = False):
        """
        绘制基础网络图

        :param line_width: 边的宽度，如果为None则自适应计算
        :param save_path: 保存路径，如果为None则不保存
        :param canvas_size: 画布大小（英寸），如果为None则自动计算
        :param show_legend: 是否显示网元角色图例
        :param use_gis_layout: 是否使用GIS经纬度布局
        """
        logger.info("开始绘制基础网络图...")
        # 延迟计算布局
        if use_gis_layout:
            self.compute_layout_base_gis()
        else:
            self._compute_layout()

        self.pos = self._resolve_node_overlap(self.pos)

        # 计算自适应大小
        sizes = self._calculate_adaptive_sizes(canvas_size)

        # 如果未指定边宽度，使用自适应宽度
        if line_width is None:
            line_width = sizes['line_width']

        canvas_size = sizes['canvas_size']
        dpi = 500 if canvas_size <= 50 else 300  # 大画布降低dpi以提高性能

        plt.figure(figsize=(canvas_size, canvas_size), dpi=dpi)
        plt.clf()
        plt.axis('off')

        # 使用自适应节点大小
        node_sizes = sizes['node_sizes']
        font_size = sizes['font_size']
        label_offset = sizes['label_offset']

        # 根据节点类型设置不同的颜色和大小
        # ASG节点 - 方形，红色
        nx.draw_networkx_nodes(self.asg_graph, self.pos,
                               node_size=node_sizes['asg'], node_color='orange', node_shape='s',
                               edgecolors="gray", linewidths=0.3, alpha=1)

        # CSG节点 - 三角形，灰色
        nx.draw_networkx_nodes(self.csg_graph, self.pos,
                               node_size=node_sizes['csg'], node_color='grey', node_shape='^',
                               edgecolors="gray", linewidths=0.3, alpha=1)

        # 其他节点 - 圆形，浅蓝色
        nx.draw_networkx_nodes(self.core_graph, self.pos,
                               node_size=node_sizes['core'], node_color='red', node_shape='o',
                               edgecolors="gray", linewidths=0.3, alpha=1)

        # 标签坐标向下偏移（标注在节点下方）
        label_pos = copy.deepcopy(self.pos)
        for p in label_pos.values():
            p[1] -= label_offset

        # 设备名称标签
        nx.draw_networkx_labels(self.graph, label_pos, font_size=font_size)

        # 绘制边
        nx.draw_networkx_edges(self.graph, self.pos, width=line_width, alpha=0.7)

        # 添加图例
        if show_legend:
            self._add_legend(node_sizes, font_size)

        if save_path:
            plt.savefig(save_path, dpi=dpi, bbox_inches='tight')
            print(f"基础图已保存至: {save_path}")

    def _add_legend(self, node_sizes: Dict[str, float] = None, font_size: float = 8.0):
        """
        添加网元角色图例

        :param node_sizes: 节点大小字典（用于设置图例中节点的大小）
        :param font_size: 字体大小
        """
        from matplotlib.lines import Line2D

        # 创建图例元素
        legend_elements = []

        # ASG节点图例 - 方形，红色
        asg_size = node_sizes['asg'] / 10 if node_sizes else 24
        legend_elements.append(
            Line2D([0], [0], marker='s', color='w', markerfacecolor='#FF6B6B',
                   markersize=math.sqrt(asg_size), label='ASG', markeredgecolor='gray')
        )

        # CSG节点图例 - 三角形，灰色
        csg_size = node_sizes['csg'] / 10 if node_sizes else 14
        legend_elements.append(
            Line2D([0], [0], marker='^', color='w', markerfacecolor='#95A5A6',
                   markersize=math.sqrt(csg_size), label='CSG', markeredgecolor='gray')
        )

        # Core节点图例 - 圆形，蓝色
        core_size = node_sizes['core'] / 10 if node_sizes else 18
        legend_elements.append(
            Line2D([0], [0], marker='o', color='w', markerfacecolor='#5DADE2',
                   markersize=math.sqrt(core_size), label='Core', markeredgecolor='gray')
        )

        # 添加图例到右上角，避开可能与节点重叠的区域
        ax = plt.gca()
        pos_array = np.array(list(self.pos.values()))
        x_min, x_max = pos_array[:, 0].min(), pos_array[:, 0].max()
        y_min, y_max = pos_array[:, 1].min(), pos_array[:, 1].max()

        # 计算图例边界框（基于字体大小估算）
        legend_height = len(legend_elements) * font_size * 0.015
        legend_width = font_size * 0.8

        # 检查左上角是否有节点靠近
        left_nodes = sum(
            1 for x, y in pos_array if x < x_min + (x_max - x_min) * 0.15 and y > y_max - (y_max - y_min) * 0.15)

        # 如果左上角有节点靠近，放到右上角
        if left_nodes > 0:
            loc = 'upper right'
            bbox_to_anchor = (1.0, 1.0)
        else:
            loc = 'upper left'
            bbox_to_anchor = (0, 1)

        plt.legend(handles=legend_elements, loc=loc, bbox_to_anchor=bbox_to_anchor,
                   fontsize=font_size * 3, framealpha=1.0, edgecolor='gray')

    def mark_edges(self,
                   edges: List[Tuple[Union[str, int], Union[str, int]]],
                   pos: dict,
                   color: str = 'red',
                   width: float = 3):
        """
        对图的指定边进行标记，颜色默认为红色

        :param edges: 需要标记的边列表 [('node_a', 'node_b'), ...]
        :param pos: 每个节点到坐标的映射
        :param color: 标记颜色
        :param width: 边的宽度
        """
        # 创建一个新的子图，添加所有需要标记的节点和边
        marked_graph = nx.Graph()

        for edge in edges:
            node1 = edge[0]
            node2 = edge[1]
            marked_graph.add_node(node1)
            marked_graph.add_node(node2)
            marked_graph.add_edge(node1, node2)

        if len(edges) == 0:
            logger.warning("警告: 未提供边，无法计算中心点")
            return

        # 求重心，用于边偏移
        positions = [[], []]
        for edge in edges:
            try:
                x0, y0 = pos[edge[0]]
                x1, y1 = pos[edge[1]]
                positions[0].extend([x0, x1])
                positions[1].extend([y0, y1])
            except (KeyError, ValueError, IndexError) as e:
                logger.warning(f"跳过边 {edge}，错误: {e}")
                continue

        if len(positions[0]) == 0:
            logger.warning("未找到有效的边坐标")
            return

        center_x = sum(positions[0]) / len(positions[0])
        center_y = sum(positions[1]) / len(positions[1])

        # 随机生成偏移量（使用 np.random 确保种子统一控制）
        disturbed_pos = dict()
        dist = np.random.randint(3, 6) / 2500 * np.random.choice([1, 0, -1])

        # 节点沿着重心连线进行移动
        for index, node_pos in pos.items():
            dx, dy = node_pos[0] - center_x, node_pos[1] - center_y
            radius = math.sqrt(dx * dx + dy * dy)
            if radius == 0:
                new_x, new_y = node_pos[0], node_pos[1]
            else:
                new_radius = radius + dist
                scale = new_radius / radius
                new_dx = dx * scale
                new_dy = dy * scale
                new_x = new_dx + center_x
                new_y = new_dy + center_y
            disturbed_pos[index] = np.array([new_x, new_y])

        nx.draw_networkx_edges(marked_graph, disturbed_pos,
                               width=width, alpha=1, edge_color=color)

    def ring_link_visualize(self,
                            ring_type_list: List[str] = None,
                            link_type_list: List[str] = None,
                            ring_color: str = 'red',
                            link_color: str = 'blue',
                            save_path: str = None,
                            use_gis_layout: bool = False):
        """
        同时可视化环和链

        :param ring_type_list: 环类型列表
        :param link_type_list: 链类型列表
        :param ring_color: 环的高亮颜色
        :param link_color: 链的高亮颜色
        :param save_path: 保存路径
        """
        logger.info("开始绘制环链组合可视化图...")

        # 绘制基础图
        self.draw_base_graph(use_gis_layout=use_gis_layout)

        # 先绘制链（蓝色）
        if link_type_list:
            self._draw_links(link_type_list, link_color)

        # 后绘制环（红色），确保环在上层
        if ring_type_list:
            self._draw_rings(ring_type_list, ring_color)

    def _draw_rings(self, ring_type_list: List[str], color: str):
        """绘制环"""
        rings = self.rings_analysis
        for ring in rings:
            ring_label = ring.get('Ring Label', '')
            if "所有环" not in ring_type_list and ring_label not in ring_type_list:
                continue

            ring_members = ring.get('Ring Member', [])
            if not ring_members:
                continue

            edges_to_mark = []
            for node1, node2 in combinations(ring_members, 2):
                if (node1, node2) in self.device_edges or (node2, node1) in self.device_edges:
                    edges_to_mark.append((node1, node2))

            if edges_to_mark:
                self.mark_edges(edges_to_mark, self.pos, color)

    def _draw_links(self, link_type_list: List[str], color: str):
        """绘制链"""
        links = self.links_analysis
        for link in links:
            link_label = link.get('Link Label', '')

            if '所有链' not in link_type_list and link_label not in link_type_list:
                continue

            link_members = link.get('Link Member', [])
            if not link_members or len(link_members) < 2:
                continue

            edges_to_mark = [(link_members[i - 1], link_members[i]) for i in range(1, len(link_members))]

            if edges_to_mark:
                self.mark_edges(edges_to_mark, self.pos, color)

    def get_statistics(self) -> Dict[str, Any]:
        """
        获取网络统计信息

        :return: 包含统计信息的字典
        """
        stats = {
            'total_nodes': len(self.device_nodes),
            'total_edges': len(self.device_edges),
            'asg_count': len(self.asg_graph.nodes()),
            'csg_count': len(self.csg_graph.nodes()),
            'core_count': len(self.core_graph.nodes()),
            'ring_count': len(self.rings_analysis),
            'link_count': len(self.links_analysis),
        }
        return stats

    def export_topology_json(self, save_path: str = None, rehome_device_df=None) -> Dict[str, Any]:
        """
        导出拓扑数据为JSON格式，供前端交互式可视化使用

        :param save_path: 保存路径，如果为None则返回数据字典
        :return: 包含节点、边、环、链信息的字典
        """
        if not rehome_device_df.empty:
            nodes_location = dict(
                zip(rehome_device_df["NE Name"], zip(rehome_device_df["Latitude"], rehome_device_df["Longitude"])))
        else:
            nodes_location = {}

        logic_pos = self._compute_layout()
        gis_pos = self.compute_layout_base_gis()

        logic_svg_width = 2246.4
        logic_svg_height = 2232.0
        gis_svg_width = 2246.4
        gis_svg_height = 2232.0

        min_x_logic, max_x_logic, min_y_logic, max_y_logic = self._calculate_bounds(logic_pos)
        scale_logic, offset_x_logic, offset_y_logic = self._calculate_scale_and_offset(
            logic_svg_width, logic_svg_height, min_x_logic, max_x_logic, min_y_logic, max_y_logic)
        to_svg_coords_logic = self._create_svg_coords_converter(logic_svg_height, scale_logic, offset_x_logic,
                                                                offset_y_logic)

        min_x_gis, max_x_gis, min_y_gis, max_y_gis = self._calculate_bounds(gis_pos)
        scale_gis, offset_x_gis, offset_y_gis = self._calculate_scale_and_offset(
            gis_svg_width, gis_svg_height, min_x_gis, max_x_gis, min_y_gis, max_y_gis)
        to_svg_coords_gis = self._create_svg_coords_converter(gis_svg_height, scale_gis, offset_x_gis, offset_y_gis)

        sizes = self._calculate_adaptive_sizes()
        nodes = self._build_nodes_with_both_layouts(to_svg_coords_logic, to_svg_coords_gis, logic_pos, gis_pos,
                                                    nodes_location)
        edges = self._build_edges_with_both_layouts(to_svg_coords_logic, to_svg_coords_gis, logic_pos, gis_pos)
        rings = self._build_rings()
        links = self._build_links()

        topology_data = self._build_topology_data(nodes, edges, rings, links, sizes)

        if save_path:
            self._save_to_file(save_path, topology_data)

        return topology_data

    def _calculate_bounds(self, pos: Dict[str, np.ndarray] = None) -> Tuple[float, float, float, float]:
        """计算所有节点的边界框"""
        if pos is None:
            pos = self.pos
        min_x = min(v[0] for v in pos.values())
        max_x = max(v[0] for v in pos.values())
        min_y = min(v[1] for v in pos.values())
        max_y = max(v[1] for v in pos.values())
        return min_x, max_x, min_y, max_y

    def _calculate_scale_and_offset(self, svg_width: float, svg_height: float, min_x: float, max_x: float, min_y: float,
                                    max_y: float) -> Tuple[float, float, float]:
        """计算缩放比例和偏移"""
        padding = 50
        range_x = max_x - min_x if max_x != min_x else 1
        range_y = max_y - min_y if max_y != min_y else 1
        scale_x = (svg_width - 2 * padding) / range_x
        scale_y = (svg_height - 2 * padding) / range_y
        scale = min(scale_x, scale_y)
        offset_x = padding + (svg_width - 2 * padding - range_x * scale) / 2 - min_x * scale
        offset_y = padding + (svg_height - 2 * padding - range_y * scale) / 2 - min_y * scale
        return scale, offset_x, offset_y

    def _create_svg_coords_converter(self, svg_height: float, scale: float, offset_x: float, offset_y: float):
        """创建坐标转换函数"""

        def to_svg_coords(x: float, y: float) -> Tuple[float, float]:
            return x * scale + offset_x, svg_height - (y * scale + offset_y)

        return to_svg_coords

    def _build_nodes(self, to_svg_coords: Callable[[float, float], Tuple[float, float]]) -> List[Dict[str, Any]]:
        """构建节点数据"""
        nodes = []
        for node_id in self.device_nodes:
            role = self.ne_role_map.get(node_id, 'unknown')
            node_x_location, node_y_location = self.pos[node_id]
            svg_x, svg_y = to_svg_coords(node_x_location, node_y_location)

            node_type, color, shape = self._get_node_style(role)

            nodes.append({
                'id': node_id,
                'name': node_id,
                'type': node_type,
                'color': color,
                'shape': shape,
                'x': float(svg_x),
                'y': float(svg_y)
            })
        return nodes

    def _build_nodes_with_both_layouts(self, to_svg_coords_logic, to_svg_coords_gis, logic_pos, gis_pos,
                                       nodes_location):
        nodes = []
        for node_id in self.device_nodes:
            role = self.ne_role_map.get(node_id, 'unknown')

            logic_x, logic_y = logic_pos[node_id]
            svg_logic_x, svg_logic_y = to_svg_coords_logic(logic_x, logic_y)

            gis_x, gis_y = gis_pos[node_id]
            svg_gis_x, svg_gis_y = to_svg_coords_gis(gis_x, gis_y)

            node_type, color, shape = self._get_node_style(role)
            default_lat = sum([nodes_location[key][0] for key in nodes_location.keys()]) / len(nodes_location)
            default_lon = sum([nodes_location[key][1] for key in nodes_location.keys()]) / len(nodes_location)

            nodes.append({
                'id': node_id,
                'name': node_id,
                'type': node_type,
                'color': color,
                'shape': shape,
                'logic': {'x': float(svg_logic_x), 'y': float(svg_logic_y)},
                'gis': {'x': float(svg_gis_x), 'y': float(svg_gis_y)},
                'latitude': nodes_location[node_id][0] if node_id in nodes_location else default_lat,
                'longitude': nodes_location[node_id][1] if node_id in nodes_location else default_lon,
            })
        return nodes

    def _build_edges_with_both_layouts(self, to_svg_coords_logic, to_svg_coords_gis, logic_pos, gis_pos):
        edges = []
        for edge in self.device_edges:
            if edge[0] in logic_pos and edge[1] in logic_pos:
                logic_x1, logic_y1 = logic_pos[edge[0]]
                logic_x2, logic_y2 = logic_pos[edge[1]]
                svg_logic_x1, svg_logic_y1 = to_svg_coords_logic(logic_x1, logic_y1)
                svg_logic_x2, svg_logic_y2 = to_svg_coords_logic(logic_x2, logic_y2)

                gis_x1, gis_y1 = gis_pos[edge[0]]
                gis_x2, gis_y2 = gis_pos[edge[1]]
                svg_gis_x1, svg_gis_y1 = to_svg_coords_gis(gis_x1, gis_y1)
                svg_gis_x2, svg_gis_y2 = to_svg_coords_gis(gis_x2, gis_y2)
                edges.append({
                    'source': edge[0],
                    'target': edge[1],
                    'logic': {'x1': float(svg_logic_x1), 'y1': float(svg_logic_y1), 'x2': float(svg_logic_x2),
                              'y2': float(svg_logic_y2)},
                    'gis': {'x1': float(svg_gis_x1), 'y1': float(svg_gis_y1), 'x2': float(svg_gis_x2),
                            'y2': float(svg_gis_y2)}
                })
        return edges

    def _get_node_style(self, role: str) -> Tuple[str, str, str]:
        """根据角色确定节点类型和样式"""
        if role == 'asg':
            return 'asg', '#FF6B6B', 'square'
        elif role == 'csg':
            return 'csg', '#95A5A6', 'triangle'
        else:
            return 'core', '#5DADE2', 'circle'

    def _build_edges(self, to_svg_coords: Callable[[float, float], Tuple[float, float]]) -> List[Dict[str, Any]]:
        """构建边数据"""
        edges = []
        for edge in self.device_edges:
            if edge[0] in self.pos and edge[1] in self.pos:
                x1, y1 = self.pos[edge[0]]
                x2, y2 = self.pos[edge[1]]
                svg_x1, svg_y1 = to_svg_coords(x1, y1)
                svg_x2, svg_y2 = to_svg_coords(x2, y2)
                edges.append({
                    'source': edge[0],
                    'target': edge[1],
                    'x1': float(svg_x1),
                    'y1': float(svg_y1),
                    'x2': float(svg_x2),
                    'y2': float(svg_y2)
                })
        return edges

    def _build_rings(self) -> List[Dict[str, Any]]:
        """构建环数据"""
        rings = []
        for ring in self.rings_analysis:
            ring_members = ring.get('Ring Member', [])
            ring_label = ring.get('Ring Label', '')
            ring_name = ring.get('Name', '')
            ring_edges = self.append_ring_edges(ring_members, ring_label)
            rings.append({
                'label': ring_label,
                'members': ring_members,
                'edges': ring_edges,
                'name': ring_name
            })
        return rings

    def append_ring_edges(self, ring_members, ring_label):
        """构建环要呈现的连接"""
        ring_edges = []
        for i in range(len(ring_members) - 1):
            node1 = ring_members[i]
            node2 = ring_members[i + 1]
            if (node1, node2) in self.device_edges or (node2, node1) in self.device_edges:
                ring_edges.append([node1, node2])
        if ring_label != '开环':
            node1 = ring_members[-1]
            node2 = ring_members[0]
            if (node1, node2) in self.device_edges or (node2, node1) in self.device_edges:
                ring_edges.append([node1, node2])
        return ring_edges

    def _build_links(self) -> List[Dict[str, Any]]:
        """构建链数据"""
        links = []
        for link in self.links_analysis:
            link_members = link.get('Link Member', [])
            link_label = link.get('Link Label', '')
            link_edges = []
            if link_members and len(link_members) >= 2:
                for i in range(1, len(link_members)):
                    link_edges.append([link_members[i - 1], link_members[i]])
            links.append({
                'label': link_label,
                'members': link_members,
                'edges': link_edges
            })
        return links

    def _build_topology_data(self, nodes: List[Dict[str, Any]], edges: List[Dict[str, Any]],
                             rings: List[Dict[str, Any]], links: List[Dict[str, Any]], sizes: Dict[str, float]) -> Dict[
        str, Any]:
        """构建输出数据"""
        return {
            'nodes': nodes,
            'edges': edges,
            'rings': rings,
            'links': links,
            'statistics': self.get_statistics(),
            'layout': {
                'canvas_width': sizes['canvas_size'] * 100,
                'canvas_height': sizes['canvas_size'] * 100
            }
        }

    @staticmethod
    def _save_to_file(save_path: str, topology_data: Dict[str, Any]) -> None:
        """保存拓扑数据到文件"""
        with open(save_path, 'w', encoding='utf-8') as f:
            json.dump(topology_data, f, ensure_ascii=False, indent=2)
