# -*- coding: utf-8 -*-
"""
通用组环可视化查看器生成器 (Canvas 高性能版)
生成 docs/viewer.html —— 自包含、不绑定数据的查看器:
打开后上传任意用例的 viz_data.json (data/<CASE>/output/) 即渲染。

大规模优化:
  - Canvas 2D 渲染(非 SVG): 数千节点/边一次性批量绘制, 无 DOM 开销
  - 链路按"颜色+线宽"分组, 每组一次 stroke; 节点视口裁剪
  - 命中检测用空间网格(hover/点击), 取代逐元素事件监听
  - 仅在 平移/缩放/切换图层/选择 时重绘(经 rAF 合并); hover 只更新浮层div
"""
import os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DOCS = os.path.join(ROOT, "docs")
os.makedirs(DOCS, exist_ok=True)

HTML = r"""<!DOCTYPE html>
<html lang="zh-CN"><head><meta charset="utf-8"/>
<title>组环可视化查看器</title>
<style>
  :root{--bg:#f3efe7;--stage:#f7f4ee;--panel:#fbf9f4;--line:#e6e0d4;--txt:#454b54;
        --mut:#9a9488;--accent:#2c9c7d;--accent2:#3b86c4;}
  *{box-sizing:border-box;} body{margin:0;font-family:"Segoe UI","Microsoft YaHei",sans-serif;
    background:var(--bg);color:var(--txt);-webkit-font-smoothing:antialiased;overflow:hidden;}
  #wrap{display:flex;height:100vh;}
  #side{width:310px;flex:0 0 310px;background:var(--panel);border-right:1px solid var(--line);
        padding:18px;overflow:auto;box-shadow:1px 0 6px rgba(120,110,90,.06);}
  #stage{flex:1;position:relative;background:var(--stage);}
  canvas{display:block;width:100%;height:100%;cursor:grab;} canvas.drag{cursor:grabbing;}
  h1{font-size:16px;margin:0 0 4px;color:#3a4048;} h2{font-size:12px;color:var(--mut);margin:18px 0 8px;
     text-transform:uppercase;letter-spacing:.06em;font-weight:600;}
  .stat{display:flex;justify-content:space-between;font-size:13px;padding:4px 0;border-bottom:1px solid #efeae0;}
  .stat b{color:var(--accent);font-variant-numeric:tabular-nums;}
  label.tog{display:flex;align-items:center;gap:8px;font-size:13px;padding:5px 0;cursor:pointer;color:#555b63;}
  .legend{font-size:12px;line-height:1.95;}
  .sw{display:inline-block;width:14px;height:14px;border-radius:3px;vertical-align:-2px;margin-right:6px;}
  .swl{display:inline-block;width:18px;height:0;border-top-width:3px;border-top-style:solid;vertical-align:4px;margin-right:6px;}
  #tip{position:absolute;pointer-events:none;background:#fffefb;border:1px solid var(--line);color:#454b54;
       padding:7px 10px;border-radius:8px;font-size:12px;display:none;z-index:9;max-width:240px;line-height:1.5;
       box-shadow:0 4px 14px rgba(120,110,90,.18);}
  #hud{position:absolute;left:10px;bottom:10px;font-size:11px;color:var(--mut);background:#fffefbcc;
       border:1px solid var(--line);border-radius:6px;padding:3px 8px;pointer-events:none;}
  button{background:#efebe2;color:#4a505a;border:1px solid var(--line);border-radius:8px;
         padding:7px 10px;font-size:12px;cursor:pointer;margin-top:6px;width:100%;transition:.15s;}
  button:hover{background:#e7e1d4;}
  .hint{font-size:11px;color:var(--mut);line-height:1.6;margin-top:6px;}
  code{background:#efeae0;padding:1px 4px;border-radius:4px;font-size:11px;}
  #drop{border:2px dashed #cfc7b6;border-radius:10px;padding:16px;text-align:center;font-size:13px;
        color:var(--mut);cursor:pointer;background:#f6f2ea;transition:.15s;}
  #drop.hover{border-color:var(--accent);color:var(--accent);background:#eef6f1;}
  #drop b{color:var(--accent2);}
  #prompt{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;flex-direction:column;
          color:var(--mut);font-size:15px;gap:10px;text-align:center;pointer-events:none;}
  #prompt .big{font-size:46px;opacity:.5;} #caseTag{color:var(--accent2);font-weight:700;}
</style></head>
<body><div id="wrap">
  <div id="side">
    <h1>组环可视化查看器</h1>
    <div class="hint">上传任意用例的 <b>viz_data.json</b>（<code>data/&lt;用例&gt;/output/</code>）即渲染。Canvas 高性能版，支持千级网元。</div>
    <h2>数据</h2>
    <div id="drop">点击选择 或 拖拽<br><b>viz_data.json</b> 到此</div>
    <input type="file" id="file" accept=".json,application/json" style="display:none"/>
    <div class="hint">当前用例：<span id="caseTag">未加载</span></div>
    <h2>规模统计</h2><div id="stats"><div class="hint">尚未加载数据</div></div>
    <h2>图层</h2>
    <label class="tog"><input type="checkbox" id="t-existing" checked> 现有环</label>
    <label class="tog"><input type="checkbox" id="t-new" checked> 新增链路</label>
    <label class="tog"><input type="checkbox" id="t-broken" checked> splice 断开旧边</label>
    <label class="tog"><input type="checkbox" id="t-label"> 名称标签（缩放后显示）</label>
    <button id="reset">重置视图 / 取消高亮</button>
    <h2>图例</h2>
    <div class="legend">
      <span class="sw" style="background:#3a4048;border:1px solid #fff"></span>ASG（汇聚/锚点）<br>
      <span class="sw" style="background:#7f8c9b"></span>现有 CSG<br>
      <span class="sw" style="background:#ef5350;border:1.5px solid #fff"></span>新增 CSG（孤点）<br>
      <span class="sw" style="background:#fdeccb;border:2px dashed #dd9116"></span>现网单归 CSG（spur）<br>
      <span class="swl" style="border-color:#b3ada0"></span>现有链路<br>
      <span class="swl" style="border-color:#1f9e7a;border-top-width:4px"></span>新增 · fiber_extension<br>
      <span class="swl" style="border-color:#2b86c8;border-top-width:4px"></span>新增 · loop_insertion<br>
      <span class="swl" style="border-color:#8b5cf6;border-top-width:4px"></span>新增 · new_loop<br>
      <span class="swl" style="border-color:#dd9116;border-top-width:4px"></span>新增 · remediation<br>
      <span class="swl" style="border-color:#e0561f;border-top-style:dashed"></span>splice 断开旧边<br>
    </div>
    <div class="hint">滚轮缩放 · 拖拽平移 · 悬停看详情 · 点击节点高亮其环 · 点击空白还原</div>
  </div>
  <div id="stage">
    <canvas id="cv"></canvas>
    <div id="tip"></div><div id="hud"></div>
    <div id="prompt"><div class="big">⬆</div><div>请上传 viz_data.json 开始可视化</div></div>
  </div>
</div>
<script>
const cv=document.getElementById('cv'), ctx=cv.getContext('2d'), tip=document.getElementById('tip'), hud=document.getElementById('hud');
const METHOD_COLOR={fiber_extension:'#1f9e7a',loop_insertion:'#2b86c8',new_loop:'#8b5cf6',remediation:'#dd9116'};
function ringColor(id,type){ if(id==null) return '#b3ada0';
  const h=(id*137.508)%360; return type==='new'?`hsl(${h},55%,52%)`:`hsl(${h},42%,46%)`; }
function edgeColor(e){ return e.ringType==='new' ? (METHOD_COLOR[e.method]||'#1f9e7a') : ringColor(e.ring,e.ringType); }

let DATA=null, NID={}, ringType={}, selected=null;
let view={cx:0,cy:0,scale:1}, fitScale=1, dpr=Math.max(1,window.devicePixelRatio||1);
let cssW=0, cssH=0, grid=null, GCELL=0, incident=null;

function resize(){
  cssW=cv.clientWidth; cssH=cv.clientHeight;
  cv.width=Math.round(cssW*dpr); cv.height=Math.round(cssH*dpr);
  requestRedraw();
}
window.addEventListener('resize',resize);

// 经纬度 -> 世界坐标(米)
function project(){
  const la0=DATA.nodes.reduce((s,n)=>s+n.lat,0)/DATA.nodes.length;
  const kx=Math.cos(la0*Math.PI/180)*111320, ky=111320;
  DATA.nodes.forEach(n=>{ n.wx=n.lon*kx; n.wy=-n.lat*ky; });
  // 命中网格
  let minx=1e18,miny=1e18,maxx=-1e18,maxy=-1e18;
  DATA.nodes.forEach(n=>{minx=Math.min(minx,n.wx);miny=Math.min(miny,n.wy);maxx=Math.max(maxx,n.wx);maxy=Math.max(maxy,n.wy);});
  view.cx=(minx+maxx)/2; view.cy=(miny+maxy)/2;
  const spanx=Math.max(1,maxx-minx), spany=Math.max(1,maxy-miny);
  fitScale=Math.min(cssW/spanx, cssH/spany)*0.92; view.scale=fitScale;
  GCELL=Math.max(spanx,spany)/120 || 1;
  grid=new Map();
  DATA.nodes.forEach((n,i)=>{ const k=Math.floor(n.wx/GCELL)+'_'+Math.floor(n.wy/GCELL);
    (grid.get(k)||grid.set(k,[]).get(k)).push(i); });
  incident=DATA.nodes.map(()=>[]);
  DATA.edges.forEach((e,ei)=>{ const a=NID[e.u], b=NID[e.v];
    if(a!=null) incident[a].push(ei); if(b!=null) incident[b].push(ei); });
}
function sx(wx){ return (wx-view.cx)*view.scale + cssW/2; }
function sy(wy){ return (wy-view.cy)*view.scale + cssH/2; }
function toWorld(px,py){ return [ (px-cssW/2)/view.scale+view.cx, (py-cssH/2)/view.scale+view.cy ]; }

let rafPending=false;
function requestRedraw(){ if(rafPending)return; rafPending=true; requestAnimationFrame(redraw); }
function on(id){const e=document.getElementById(id);return e&&e.checked;}

function redraw(){
  rafPending=false;
  ctx.setTransform(dpr,0,0,dpr,0,0);
  ctx.fillStyle='#f7f4ee'; ctx.fillRect(0,0,cssW,cssH);
  if(!DATA) return;
  const M=40, vis=n=>{const x=sx(n.wx),y=sy(n.wy); return x>=-M&&x<=cssW+M&&y>=-M&&y<=cssH+M;};
  // 预存屏幕坐标
  DATA.nodes.forEach(n=>{ n._x=sx(n.wx); n._y=sy(n.wy); });
  // 链路: 按 颜色|线宽|是否暗 分组, 每组一次 stroke
  const groups=new Map();
  const showExist=on('t-existing'), showNew=on('t-new');
  for(const e of DATA.edges){
    if(e.ringType==='existing' && !showExist) continue;
    if(e.ringType==='new' && !showNew) continue;
    const a=DATA.nodes[NID[e.u]], b=DATA.nodes[NID[e.v]]; if(!a||!b) continue;
    if((a._x<-M||a._x>cssW+M||a._y<-M||a._y>cssH+M)&&(b._x<-M||b._x>cssW+M||b._y<-M||b._y>cssH+M)) continue;
    const dim=selected!=null && e.ring!==selected;
    const w=e.ringType==='new'?2.2:1.1;
    const key=edgeColor(e)+'|'+w+'|'+(dim?1:0);
    let g=groups.get(key); if(!g){g=[]; groups.set(key,g);} g.push(a._x,a._y,b._x,b._y);
  }
  for(const [key,segs] of groups){
    const [col,w,dim]=key.split('|');
    ctx.strokeStyle=col; ctx.lineWidth=+w; ctx.globalAlpha=dim==='1'?0.10:0.9; ctx.lineCap='round';
    ctx.beginPath();
    for(let i=0;i<segs.length;i+=4){ ctx.moveTo(segs[i],segs[i+1]); ctx.lineTo(segs[i+2],segs[i+3]); }
    ctx.stroke();
  }
  ctx.globalAlpha=1;
  // 节点(视口裁剪)
  for(const n of DATA.nodes){
    if(n._x<-M||n._x>cssW+M||n._y<-M||n._y>cssH+M) continue;
    const dim=selected!=null && n.ring!==selected && n.role!=='asg';
    ctx.globalAlpha=dim?0.18:1;
    if(n.role==='asg'){
      ctx.fillStyle='#3a4048'; ctx.strokeStyle='#fff'; ctx.lineWidth=1.4;
      ctx.fillRect(n._x-6,n._y-6,12,12); ctx.strokeRect(n._x-6,n._y-6,12,12);
    }else{
      const single=n.dual===false;
      ctx.beginPath(); ctx.arc(n._x,n._y, n.isNew?4.5:(single?4.2:3.0), 0, 6.2832);
      ctx.fillStyle=n.isNew?'#ef5350':(single?'#fdeccb':ringColor(n.ring,ringType[n.ring]));
      ctx.fill();
      if(single){ctx.strokeStyle='#dd9116';ctx.lineWidth=2;ctx.setLineDash([2,2]);ctx.stroke();ctx.setLineDash([]);}
      else if(n.isNew){ctx.strokeStyle='#fff';ctx.lineWidth=1.2;ctx.stroke();}
    }
    ctx.globalAlpha=1;
  }
  // 标签
  const showLbl=on('t-label');
  if(view.scale>fitScale*1.6 || showLbl){
    ctx.fillStyle='#3a4048'; ctx.font='11px Segoe UI'; ctx.textAlign='center';
    let cnt=0;
    for(const n of DATA.nodes){
      if(n._x<0||n._x>cssW||n._y<0||n._y>cssH) continue;
      const isA=n.role==='asg';
      if(isA){ if(view.scale>fitScale*1.4){ctx.fillStyle='#3a4048';ctx.fillText(n.id,n._x,n._y-9);} }
      else if(showLbl && view.scale>fitScale*3.2 && cnt<400){
        ctx.fillStyle='#8a857a'; ctx.font='9px Segoe UI'; ctx.fillText(n.id,n._x,n._y-7); cnt++;
      }
    }
    ctx.textAlign='left';
  }
  // splice 断开旧边: 画在最上层(否则会被其它边/节点盖住), 醒目虚线 + 端点 ✕
  if(on('t-broken') && DATA.broken && DATA.broken.length){
    ctx.strokeStyle='#e0561f'; ctx.lineWidth=2.6; ctx.setLineDash([7,4]); ctx.lineCap='butt'; ctx.beginPath();
    let mids=[];
    DATA.broken.forEach(([u,v])=>{const a=DATA.nodes[NID[u]],b=DATA.nodes[NID[v]];if(!a||!b)return;
      ctx.moveTo(a._x,a._y); ctx.lineTo(b._x,b._y); mids.push([(a._x+b._x)/2,(a._y+b._y)/2]);});
    ctx.stroke(); ctx.setLineDash([]);
    ctx.strokeStyle='#c2410c'; ctx.lineWidth=2; const r=4;
    ctx.beginPath();
    mids.forEach(([x,y])=>{ctx.moveTo(x-r,y-r);ctx.lineTo(x+r,y+r);ctx.moveTo(x+r,y-r);ctx.lineTo(x-r,y+r);});
    ctx.stroke();
  }
  hud.textContent=`缩放 ${(view.scale/fitScale).toFixed(1)}×  ·  节点 ${DATA.nodes.length}  ·  链路 ${DATA.edges.length}`
                  + (DATA.broken&&DATA.broken.length?`  ·  splice断边 ${DATA.broken.length}`:'');
}

// ---- 命中检测(空间网格) ----
function nearestNode(px,py){
  const [wx,wy]=toWorld(px,py); const cx=Math.floor(wx/GCELL), cy=Math.floor(wy/GCELL);
  let best=null, bd=10/view.scale; bd=bd*bd;   // 10px 阈值(世界平方)
  for(let dx=-1;dx<=1;dx++)for(let dy=-1;dy<=1;dy++){
    const arr=grid.get((cx+dx)+'_'+(cy+dy)); if(!arr)continue;
    for(const i of arr){const n=DATA.nodes[i]; const d=(n.wx-wx)**2+(n.wy-wy)**2; if(d<bd){bd=d;best=i;}}
  }
  return best;
}
function nearestEdge(px,py){
  // 候选: 附近节点的关联边; 屏幕空间点到线段距离
  const [wx,wy]=toWorld(px,py); const cx=Math.floor(wx/GCELL), cy=Math.floor(wy/GCELL);
  const seen=new Set(); let best=null, bd=6;
  for(let dx=-1;dx<=1;dx++)for(let dy=-1;dy<=1;dy++){
    const arr=grid.get((cx+dx)+'_'+(cy+dy)); if(!arr)continue;
    for(const i of arr) for(const ei of incident[i]){
      if(seen.has(ei))continue; seen.add(ei);
      const e=DATA.edges[ei]; const a=DATA.nodes[NID[e.u]], b=DATA.nodes[NID[e.v]]; if(!a||!b)continue;
      const d=segDist(px,py,sx(a.wx),sy(a.wy),sx(b.wx),sy(b.wy)); if(d<bd){bd=d;best=ei;}
    }
  }
  return best;
}
function segDist(px,py,x1,y1,x2,y2){
  const dx=x2-x1,dy=y2-y1, L=dx*dx+dy*dy; let t=L?((px-x1)*dx+(py-y1)*dy)/L:0; t=Math.max(0,Math.min(1,t));
  const ex=x1+t*dx-px, ey=y1+t*dy-py; return Math.sqrt(ex*ex+ey*ey);
}

// ---- 交互 ----
let drag=false, lx, ly, moved=false;
cv.addEventListener('mousedown',e=>{drag=true;moved=false;lx=e.clientX;ly=e.clientY;cv.classList.add('drag');});
window.addEventListener('mouseup',e=>{
  if(drag&&!moved){ // 点击: 选择节点所在环
    const r=cv.getBoundingClientRect(); const i=nearestNode(e.clientX-r.left,e.clientY-r.top);
    if(i!=null && DATA.nodes[i].ring!=null){ selected=(selected===DATA.nodes[i].ring?null:DATA.nodes[i].ring); }
    else selected=null;
    requestRedraw();
  }
  drag=false; cv.classList.remove('drag');
});
window.addEventListener('mousemove',e=>{
  const r=cv.getBoundingClientRect(); const px=e.clientX-r.left, py=e.clientY-r.top;
  if(drag){ moved=true; view.cx-=(e.clientX-lx)/view.scale; view.cy-=(e.clientY-ly)/view.scale;
    lx=e.clientX; ly=e.clientY; requestRedraw(); hideTip(); return; }
  if(!DATA){return;}
  // hover: 节点优先, 否则边
  const i=nearestNode(px,py);
  if(i!=null){ const n=DATA.nodes[i];
    const rg=n.ring!=null?`环#${n.ring} (${ringType[n.ring]==='new'?'新建':'现有'})`:'（不规整/分支）';
    const dh=n.dual===false?'<br><b style="color:#dd9116">单归（仅一条到ASG路径）</b>':'';
    showTip(e,`<b>${n.id}</b><br>角色 ${n.role.toUpperCase()}${n.isNew?' · <b style="color:#ef5350">新增孤点</b>':''}<br>所属 ${rg}${dh}`); return; }
  const ei=nearestEdge(px,py);
  if(ei!=null){ const ed=DATA.edges[ei]; const ml={fiber_extension:'fiber_extension(双锚绕接)',loop_insertion:'loop_insertion(插环)',new_loop:'new_loop(新环到ASG)',remediation:'remediation(现网整改)'};
    showTip(e,`链路 ${ed.u} — ${ed.v}<br>${ed.isNew?'<b style="color:'+edgeColor(ed)+'">新增 · '+(ml[ed.method]||ed.method)+'</b>':'原有链路'}<br>成本 ${ed.cost} m`); return; }
  hideTip();
});
function showTip(e,html){const r=cv.getBoundingClientRect();tip.innerHTML=html;tip.style.display='block';
  tip.style.left=(e.clientX-r.left+14)+'px';tip.style.top=(e.clientY-r.top+14)+'px';}
function hideTip(){tip.style.display='none';}
cv.addEventListener('wheel',e=>{e.preventDefault(); if(!DATA)return;
  const r=cv.getBoundingClientRect(); const px=e.clientX-r.left, py=e.clientY-r.top;
  const [wx,wy]=toWorld(px,py); const f=e.deltaY<0?1.15:1/1.15;
  view.scale=Math.min(fitScale*60, Math.max(fitScale*0.5, view.scale*f));
  // 保持光标下世界点不动
  view.cx=wx-(px-cssW/2)/view.scale; view.cy=wy-(py-cssH/2)/view.scale;
  requestRedraw();
},{passive:false});

// ---- 控件 / 上传 ----
['t-existing','t-new','t-broken','t-label'].forEach(id=>document.getElementById(id).addEventListener('change',requestRedraw));
document.getElementById('reset').addEventListener('click',()=>{ if(DATA){project(); selected=null; requestRedraw(); }});
function fillStats(){
  const S=DATA.stats||{};
  document.getElementById('caseTag').textContent=S.case||DATA.case||'(未命名)';
  document.getElementById('stats').innerHTML=[
    ['ASG 数',S.asg],['CSG 总数',S.csg],['新增孤点',S.isolated],
    ['现有环 / 新增簇',(S.existing_rings??'-')+' / '+(S.new_rings??'-')],
    ['fiber_extension',S.fiber_ext??'-'],['loop_insertion',S.inserted??'-'],
    ['new_loop',S.into_new??'-'],['remediation(整改)',S.remediation??'-'],
    ['新增光缆链路',S.new_links],['新增光缆(km)',S.total_km],['最大环节点(报告)',S.ring_max??'-'],
    ['现网整改后剩余单归',S.preexisting_single_homed??0],
  ].map(([k,v])=>`<div class="stat"><span>${k}</span><b>${v??'-'}</b></div>`).join('');
}
function loadObj(obj){
  if(!obj||!obj.nodes||!obj.edges){alert('数据结构无效：应包含 nodes / edges');return;}
  DATA=obj; selected=null; NID={}; ringType={};
  DATA.nodes.forEach((n,i)=>NID[n.id]=i);
  DATA.rings.forEach(r=>ringType[r.id]=r.type);
  resize(); project(); fillStats();
  document.getElementById('prompt').style.display='none';
  requestRedraw();
}
function handleFile(f){const r=new FileReader();r.onload=ev=>{try{loadObj(JSON.parse(ev.target.result));}catch(err){alert('JSON 解析失败：'+err.message);}};r.readAsText(f);}
const fileInput=document.getElementById('file'), drop=document.getElementById('drop');
drop.addEventListener('click',()=>fileInput.click());
fileInput.addEventListener('change',e=>{if(e.target.files[0])handleFile(e.target.files[0]);});
['dragenter','dragover'].forEach(ev=>drop.addEventListener(ev,e=>{e.preventDefault();drop.classList.add('hover');}));
['dragleave','drop'].forEach(ev=>drop.addEventListener(ev,e=>{e.preventDefault();drop.classList.remove('hover');}));
drop.addEventListener('drop',e=>{const f=e.dataTransfer.files[0];if(f)handleFile(f);});
const stage=document.getElementById('stage');
stage.addEventListener('dragover',e=>e.preventDefault());
stage.addEventListener('drop',e=>{e.preventDefault();const f=e.dataTransfer.files[0];if(f)handleFile(f);});
resize();
</script></body></html>"""

def main():
    path = os.path.join(DOCS, "viewer.html")
    with open(path, "w", encoding="utf-8") as f:
        f.write(HTML)
    print(f"已生成查看器(Canvas高性能版) {path}")
    print("用法: 浏览器打开后, 上传 data/<用例>/output/viz_data.json")

if __name__ == "__main__":
    main()
