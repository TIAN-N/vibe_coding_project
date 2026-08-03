# PyCharm 查看 SQLite 数据库

数据库文件：

```text
D:\vibe_coding_project\Agent_plan_tool\backend\data\topo_visual.db
```

## PyCharm Professional

1. 打开 `View > Tool Windows > Database`。
2. 点击 `+ > Data Source > SQLite`。
3. 在 `File` 中选择上面的 `topo_visual.db`。
4. 首次使用时点击 PyCharm 提示的 `Download missing driver files`。
5. 点击 `Test Connection`，成功后点击 `OK`。
6. 展开 `main > tables`，可查看数据、表结构和索引。
7. 右键数据源并选择 `New > Query Console`，执行 SQL。

SQLite 驱动由 PyCharm 管理，不需要安装 Python 包。本工程查询数据库使用 Python 标准库 `sqlite3`，也不需要额外依赖。

## PyCharm Community

Community 版本通常没有完整的 Database 工具窗口，可以在插件市场安装 `Database Navigator`，或者直接在 PyCharm Terminal 中执行：

```powershell
cd D:\vibe_coding_project\Agent_plan_tool\backend
python -c "import sqlite3; c=sqlite3.connect(r'data\topo_visual.db'); print(c.execute('SELECT id, version_name, created_at FROM data_versions ORDER BY created_at DESC').fetchall()); c.close()"
```

## 常用 SQL

查看所有规划版本：

```sql
SELECT id, version_name, parse_timestamp, folder_name, created_at
FROM data_versions
ORDER BY created_at DESC;
```

统计每个版本的数据量：

```sql
SELECT
    v.id,
    v.version_name,
    (SELECT COUNT(*) FROM device_rows d WHERE d.version_id = v.id) AS device_count,
    (SELECT COUNT(*) FROM link_rows l WHERE l.version_id = v.id) AS link_count,
    (SELECT COUNT(*) FROM ring_chain_rows r WHERE r.version_id = v.id) AS ring_chain_count
FROM data_versions v
ORDER BY v.created_at DESC;
```

查询某个版本的 PE 网元：

```sql
SELECT ne_name, role, longitude, latitude, raw_data_json
FROM device_rows
WHERE version_id = '20260731162545'
  AND UPPER(role) = 'PE'
ORDER BY ne_name;
```

查询链路端点：

```sql
SELECT src_ne_name, sink_ne_name, route_wkt
FROM link_rows
WHERE version_id = '20260731162545'
ORDER BY src_ne_name, sink_ne_name;
```

查询环链路径：

```sql
SELECT category, name, root1, root2, member_num, member_path
FROM ring_chain_rows
WHERE version_id = '20260731162545'
ORDER BY category, name;
```

查看样式模板版本：

```sql
SELECT id, name, scope, version_id, updated_at
FROM style_templates
ORDER BY updated_at DESC;
```

查看外部 API 最近发布给网页的过滤、高亮、定位状态：

```sql
SELECT version_id, revision, view, actions_json, updated_at
FROM topology_view_states
ORDER BY updated_at DESC;
```

检查数据库完整性：

```sql
PRAGMA integrity_check;
```

请不要使用文本编辑器打开并保存 `.db` 文件。查看数据库时可以保持 FastAPI 服务运行，但手工执行更新或删除 SQL 前建议先停止服务并备份数据库。
