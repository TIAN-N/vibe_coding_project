# 璺綉璺濈璁＄畻绯荤粺寮€鍙戣凯浠ｆ棩蹇?
## 2026-07-05 Iteration 0锛氶渶姹傛緞娓呬笌鏂规璁捐

### 宸茬‘璁ら渶姹?
- 璺綉杈规棤鏂瑰悜锛屾寜鏃犲悜鍥惧鐞嗐€?- CSV 鍙湁涓€鍒楋紝鍒楀悕涓?`WKT`銆?- WKT 涓?`LINESTRING`锛岃〃绀鸿矾鐢卞嚑浣曘€?- 璺濈杈撳嚭鍗曚綅涓虹背锛屼繚鐣?1 浣嶅皬鏁般€?- 璧风偣鍜岀粓鐐逛笉鍦ㄨ矾缃戣妭鐐逛笂鏃讹紝鍚搁檮鍒版渶杩戣矾缃戣妭鐐广€?- 鍗曟婧愬鏈€鐭矾鏌ヨ鐩爣涓?1 绉掑唴瀹屾垚銆?- 闇€瑕佹祴璇曞嚑鐧剧背銆佸嚑鍗冪背銆佸嚑鍗佸崈绫充笁绫绘煡璇€?- 鍚庣閲囩敤 Python FastAPI銆?- 鍓嶇閲囩敤寮€婧愪笖鏃犻渶 API key 鐨勫湴鍥剧粍浠躲€?- 鍏佽浣跨敤 Leaflet + OpenStreetMap 鍦ㄧ嚎搴曞浘銆?- 杩滅▼浠撳簱 URL 涓?`https://github.com/TIAN-N/vibe_coding_project.git`銆?
### 浠撳簱妫€鏌ョ粨鏋?
- 宸ヤ綔鍖烘牴鐩綍锛歚D:\vibe_coding_project`
- 鐩爣鐩綍锛歚road_network_calculator`
- 杩滅▼浠撳簱锛?
```text
origin https://github.com/TIAN-N/vibe_coding_project.git
```

- 鏅€?git 鍛戒护鍙?safe.directory 闄愬埗锛屽悗缁?git 鎿嶄綔闇€浣跨敤锛?
```text
git -c safe.directory=D:/vibe_coding_project ...
```

- 褰撳墠瀛樺湪涓€涓笌鏈换鍔℃棤鍏崇殑宸蹭慨鏀规枃浠讹細

```text
.claude/settings.local.json
```

鍚庣画鎻愪氦鏃堕渶瑕侀伩鍏嶆妸璇ユ枃浠剁撼鍏ユ湰浠诲姟鎻愪氦銆?
### 鏈疆浜у嚭

- 鏂板 `docs/design.md`
- 鏂板 `docs/iteration_log.md`

### 寰呯敤鎴风‘璁?
- 鏄惁鎺ュ彈璁捐鏂囨。涓殑渚濊禆銆佺畻娉曡矾绾裤€佸墠绔柟妗堝拰 mock 鏁版嵁绛栫暐銆?- 鐢ㄦ埛纭鍚庤繘鍏?Iteration 1/2锛屽紑濮嬪伐绋嬮鏋朵笌绠楁硶鏍稿績瀹炵幇銆?
## 2026-07-05 Iteration 1锛氬伐绋嬮鏋朵笌鏍稿績鑳藉姏瀹炵幇

### 宸插畬鎴?
- 鍒涘缓 Python 鍖?`road_network`銆?- 瀹炵幇 `RoadNetworkLoader`锛?  - CSV 娴佸紡璇诲彇銆?  - `WKT` 鍒楁牎楠屻€?  - `LINESTRING` 瑙ｆ瀽銆?  - 鑺傜偣鍧愭爣閲忓寲鍘婚噸銆?  - 鏃犲悜杈规瀯寤恒€?  - Haversine 杈归暱璁＄畻銆?  - CSR 閭绘帴鍥炬瀯寤恒€?  - `scipy.spatial.cKDTree` 鏈€杩戣妭鐐圭储寮曘€?- 瀹炵幇 `RoadDistanceCalculator`锛?  - 璧风偣銆佺粓鐐规渶杩戣矾缃戣妭鐐瑰惛闄勩€?  - 鍙屽悜 Dijkstra 鏈€鐭矾銆?  - 璺緞鍧愭爣杩樺師銆?  - 鏌ヨ鑰楁椂缁熻銆?- 鍒涘缓 FastAPI 鏈嶅姟锛?  - `POST /api/network/upload`
  - `POST /api/route`
  - `GET /api/network/status`
- 鍒涘缓 Leaflet + OpenStreetMap 鍓嶇椤甸潰锛?  - CSV 涓婁紶銆?  - 婧愬缁忕含搴﹁緭鍏ャ€?  - 璺緞銆佸惛闄勭偣鍜岃€楁椂灞曠ず銆?- 鍒涘缓 mock 鏁版嵁鐢熸垚鑴氭湰銆?- 鍒涘缓 benchmark 鑴氭湰銆?- 鍒涘缓杞婚噺娴嬭瘯鑴氭湰 `scripts/run_tests.py`銆?
### 褰撳墠楠岃瘉缁撴灉

杞婚噺娴嬭瘯锛?
```text
PASS test_geometry
PASS test_loader_and_calculator
PASS total=2
```

灏忓瀷 mock 鏁版嵁锛?
```text
generated data\mock_small.csv nodes=900 edges=1740
load rows_edges=1740 nodes=900 edges=1740 time=0.137s invalid_rows=0
query short distance=197.6m snap=0.14ms search=0.05ms total=0.20ms path_nodes=3
query medium distance=1976.0m snap=0.04ms search=0.96ms total=1.01ms path_nodes=21
query long distance=5729.7m snap=0.04ms search=3.04ms total=3.10ms path_nodes=59
```

涓瀷 mock 鏁版嵁锛?
```text
generated data\mock_medium.csv nodes=90000 edges=179400
load rows_edges=179400 nodes=90000 edges=179400 time=1.845s invalid_rows=0
query short distance=197.6m snap=0.23ms search=0.87ms total=1.12ms path_nodes=3
query medium distance=2963.9m snap=0.07ms search=2.85ms total=2.94ms path_nodes=31
query long distance=58975.8m snap=0.08ms search=366.79ms total=367.20ms path_nodes=599
```

璇硶缂栬瘧妫€鏌ワ細

```text
python -m compileall road_network app scripts
```

缁撴灉锛氶€氳繃銆?
### 鐜闄愬埗

- 褰撳墠鐜宸叉湁锛?  - `numpy 1.24.3`
  - `scipy 1.10.1`
- 褰撳墠鐜缂哄け锛?  - `pytest`
  - `fastapi`
- 鎵ц `python -m pip install -r requirements.txt` 鏃讹紝pip 浠ｇ悊鏃犳硶杩炴帴锛屼緷璧栧畨瑁呭け璐ャ€?- 鍥犳鏈疆宸查獙璇佹牳蹇冪畻娉曘€佽剼鏈拰璇硶缂栬瘧锛汧astAPI 绔埌绔湇鍔￠渶鍦ㄤ緷璧栧畨瑁呮垚鍔熷悗杩愯楠岃瘉銆?
### 涓嬩竴姝?
- 淇鍙戠幇鐨勯棶棰樸€?- 鏇存柊 README 鍜岃璁℃枃妗ｇ姸鎬併€?- 寤虹珛 git commit銆?- 鎺ㄩ€佽繙绋嬩粨搴撱€?
## 2026-07-05 Iteration 2锛氳矾缃戝睍绀恒€佹壒閲忔煡璇笌浜や簰澧炲己璁捐

### 鏂板闇€姹?
- 涓婁紶璺綉鍚庡湪 GIS 鍦板浘鏄剧ず璺綉鍥惧眰锛岄粯璁ら潚鑹茬嚎鏉°€?- 鏀寔鐢ㄦ埛鎺у埗璺綉鍥惧眰棰滆壊銆佺嚎鍨嬨€侀€忔槑搴︺€佹渶澶х粯鍒舵暟閲忓拰鏄鹃殣銆?- 閬垮厤鐧句竾璺綉鍦ㄦ祻瑙堝櫒涓€娆℃€у叏閲忔覆鏌擄紝閲囩敤鍚庣鎶芥牱鍜屽墠绔垎鎵圭粯鍒躲€?- 澧炲姞鎵归噺缁忕含搴﹁緭鍏ユ锛屾敮鎸佹瘡琛?4 涓暟瀛楋細

```text
100.491389 13.75 100.53485 13.7465
```

- 淇濆瓨鍘嗗彶鏌ヨ璁板綍锛岀偣鍑诲巻鍙茶褰曞彲鍥炴斁璧风粓鐐瑰拰璺緞銆?- 璧风偣鎴栫粓鐐硅窛绂昏矾缃戞渶杩戣妭鐐硅秴杩?1km 鏃讹紝鍚搁檮澶辫触锛屼笉鎵ц瀵昏矾銆?- 澧炲姞涓嫳鏂囩晫闈㈠垏鎹€?- 琛ュ厖 README锛岃 Python 鍒濆鑰呭彲浠ユ寜姝ラ浣跨敤宸ュ叿鎴栧紩鐢ㄦ牳蹇冪被銆?
### 璁捐鍐崇瓥

- 璺綉棰勮鎺ュ彛杩斿洖鎶芥牱杈癸紝涓嶇洿鎺ヨ繑鍥炲叏閲忕櫨涓囪竟銆?- 鍘嗗彶鏌ヨ瀛樺偍鍦ㄦ祻瑙堝櫒 `localStorage`锛岄伩鍏嶆柊澧炴暟鎹簱渚濊禆銆?- 鎵归噺鏌ヨ绗竴鐗堟寜椤哄簭涓茶璋冪敤鍚庣锛屼繚璇佸疄鐜扮ǔ瀹氾紱鍚庣画濡傛湁澶ч噺鎵瑰鐞嗛渶姹傚彲鏀逛负鍚庣鎵归噺骞跺彂鎴栧悗鍙颁换鍔°€?- 鍚搁檮闃堝€兼斁鍦ㄥ悗绔粺涓€鏍￠獙锛屽墠绔彧璐熻矗鎻愮ず銆?
### 宸插畬鎴愬疄鐜?
- 鏂板 `GET /api/network/preview`锛?  - 杩斿洖鎶芥牱璺綉绾挎銆?  - 鏀寔 `limit` 鎺у埗鏈€澶ц繑鍥炵嚎娈垫暟銆?- 鏂板 `POST /api/routes/batch`锛?  - 鏀寔鎵归噺婧愬鏌ヨ銆?  - 鍗曟鏈€澶?200 鏉°€?- 鎵╁睍 `POST /api/route`锛?  - 澧炲姞 1000m 鏈€澶у惛闄勮窛绂绘牎楠屻€?  - 璧风偣鎴栫粓鐐圭璺綉瓒呰繃 1km 鏃惰繑鍥?400 閿欒銆?- 鎵╁睍 `RoadDistanceCalculator.shortest_path`锛?  - 鏀寔 `max_snap_distance_m`銆?  - 杩斿洖璧风偣鍜岀粓鐐瑰惛闄勮窛绂汇€?- 鍓嶇鏂板锛?  - 璺綉鍥惧眰鎶芥牱灞曠ず銆?  - 璺綉棰滆壊銆佺嚎鍨嬨€侀€忔槑搴︺€佹渶澶х嚎娈垫暟銆佹樉闅愭帶鍒躲€?  - 鎵归噺杈撳叆鍜岀粨鏋滃垪琛ㄣ€?  - 鏌ヨ鍘嗗彶璁板綍涓庣偣鍑诲洖鏀俱€?  - 涓嫳鏂囧垏鎹€?- README 宸查噸鍐欎负闈㈠悜 Python 鍒濆鑰呯殑瀹屾暣浣跨敤鏁欑▼銆?
### 楠岃瘉缁撴灉

```text
python scripts\run_tests.py
PASS test_geometry
PASS test_loader_and_calculator
PASS total=2
```

```text
python -m pytest
4 passed, 1 skipped
```

璇存槑锛歚tests/test_api.py` 鍥犲綋鍓嶇幆澧冪己灏?`httpx` 琚烦杩囥€俙httpx>=0.24` 宸插姞鍏?`requirements.txt`锛屼緷璧栧畬鏁寸幆澧冧細鎵ц FastAPI TestClient 娴嬭瘯銆?
```text
python -m compileall road_network app scripts
Result: passed
```

## 2026-07-05 Iteration 3锛氬ぇ瑙勬ā璺綉灞€閮ㄨ繛缁覆鏌撲紭鍖?
### 闂鍒嗘瀽

鐢ㄦ埛涓婁紶 Bangkok CSV 鍚庯紝璺綉鍥惧眰鏄剧ず涓轰笉杩炵画鐨勭墖娈碉紝浣嗙畻璺粨鏋滆繛缁€傛帓鏌ュ彂鐜帮細

- Bangkok 璺綉鍏辨湁 97,016 涓妭鐐广€?03,865 鏉℃棤鍚戣竟銆?- 榛樿鍥惧眰棰勮鍙繑鍥?5,000 鏉¤竟銆?- 鏃ф帴鍙ｆ寜鍏ㄥ浘杈瑰簭鍒楀仛闂撮殧鎶芥牱锛岀害姣?20 鏉¤竟鏄剧ず 1 鏉°€?- 绠楄矾浣跨敤瀹屾暣 CSR 鍥撅紝璺綉涓昏繛閫氬垎閲忓崰姣旂害 97.81%锛屾墍浠ヨ矾寰勫彲浠ヨ繛缁€?
缁撹锛氫笉杩炵画涓昏鏄叏鍥炬娊鏍烽瑙堥€犳垚鐨?UI 瑙嗚鍋囪薄锛屼笉鏄師濮嬭矾缃戞垨绠楁硶鍥炬柇瑁傘€?
### 鏈疆瀹炵幇

- `RoadNetwork` 澧炲姞鏃犲悜杈圭鐐规暟缁勶細
  - `edge_u`
  - `edge_v`
- `RoadNetworkLoader` 鍦ㄦ瀯寤?CSR 鏃跺悓姝ヨ緭鍑烘棤鍚戣竟鏁扮粍銆?- 璺綉 metadata 澧炲姞杈圭晫锛?  - `min_lon`
  - `min_lat`
  - `max_lon`
  - `max_lat`
- 鏂板鎺ュ彛锛?
```http
GET /api/network/viewport?west=...&south=...&east=...&north=...&limit=12000
```

- `viewport` 鎺ュ彛鎸夊綋鍓嶅湴鍥?bbox 瀵硅竟鍋氬悜閲忓寲杩囨护銆?- 鑻ュ眬閮ㄨ竟鏁拌秴杩?`limit`锛屽彧鍦ㄥ綋鍓嶈閲庡唴鎶芥牱锛岃€屼笉鏄叏鍥炬娊鏍枫€?- 鍓嶇涓婁紶璺綉鍚庤嚜鍔ㄧ缉鏀惧埌璺綉杈圭晫銆?- 鍓嶇鐩戝惉鍦板浘 `moveend` 鍜?`zoomend`锛岄槻鎶栧姞杞藉綋鍓嶈閲庤矾缃戙€?- 鍓嶇缁х画浣跨敤鍒嗘壒缁樺埗锛岄伩鍏嶅ぇ閲?polyline 涓€娆℃€ч樆濉?UI銆?
### 楠岃瘉缁撴灉

Bangkok 鍏ㄥ浘锛?
```text
nodes=97016
edges=103865
```

鏇艰胺涓績 bbox锛?
```text
matched_edges=26028
returned_edges=12000
total_edges=103865
```

杩欒鏄庢柊鎺ュ彛宸茬粡浠庘€滃叏鍥炬娊鏍封€濆垏鎹负鈥滃綋鍓嶈閲庡眬閮ㄥ姞杞解€濄€傜敤鎴疯繘涓€姝ユ斁澶у悗锛宍matched_edges` 浼氶檷浣庯紝鏄剧ず浼氭洿鎺ヨ繎灞€閮ㄥ畬鏁磋矾缃戙€?
## 2026-07-06 Iteration 4锛氬紓姝ヤ笂浼犲姞杞戒笌杩涘害鏉?
### 闇€姹?
- 鏈姞杞借矾缃戞暟鎹椂锛屽彧淇濈暀涓婁紶璺綉鏁版嵁鍖哄煙銆?- 璺綉鍔犺浇瀹屾垚鍚庯紝鍐嶆樉绀哄浘灞傝缃€佸璺煡璇€佹壒閲忔煡璇€佺粨鏋滃拰鍘嗗彶璁板綍绛夊姛鑳姐€?- 鐧句竾绾ф垨鍗冧竾绾?CSV 鍔犺浇鏈熼棿锛屽墠绔渶瑕佹樉绀哄姩鎬佽繘搴︽潯銆?
### 瀹炵幇

- `RoadNetworkLoader.load_csv` 澧炲姞 `progress_callback`銆?- CSV 瑙ｆ瀽闃舵鎸夋枃浠跺瓧鑺傝鍙栦綅缃及绠?10%-70% 鐨勮繘搴︺€?- CSR 鏋勫缓闃舵鎶ュ憡 72%銆?- KDTree 绌洪棿绱㈠紩鏋勫缓闃舵鎶ュ憡 88%銆?- 瀹屾垚鍚庢姤鍛?100%銆?- 鍚庣鏂板寮傛涓婁紶鎺ュ彛锛?
```text
POST /api/network/upload/start
GET /api/network/upload/status/{job_id}
```

- FastAPI 鍚庣浣跨敤鍚庡彴绾跨▼鎵ц璺綉鍔犺浇浠诲姟銆?- 鍓嶇涓婁紶鎸夐挳涓嬫柟鏂板绾挎€ц繘搴︽潯銆?- 鍓嶇閫氳繃杞 job status 鏇存柊杩涘害鏉°€?- 鍓嶇鏂板 `.requires-network` 鍖哄煙鎺у埗锛屾湭鍔犺浇鏃堕殣钘忔牳蹇冨姛鑳藉尯銆?
### 楠岃瘉

```text
node --check web\app.js
passed

python scripts\run_tests.py
PASS total=2

python -m pytest
6 passed, 1 skipped

python -m compileall road_network app scripts
passed
```

寮傛涓婁紶鎺ュ彛楠岃瘉锛?
```text
POST /api/network/upload/start -> job_id
GET /api/network/upload/status/{job_id}
state=running stage=building_index progress=88.0 nodes=900 edges=1740
state=done stage=done progress=100.0 nodes=900 edges=1740
```

## 2026-07-06 Iteration 5锛氬鍏夌紗璺緞鍙犲姞涓?CoNET 鏍囪瘑

### 闇€姹?
- 鎵归噺鏌ヨ鐨勫缁勮捣缁堢偣璁＄畻鍚庯紝鎵€鏈夋垚鍔熷厜缂嗚矾寰勯粯璁ゅ悓鏃舵樉绀哄埌 GIS 鍦板浘銆?- 姣忔潯璺緞榛樿闅忔満鎴栬疆鎹娇鐢ㄤ笉鍚岄鑹层€?- 鍗曟潯 `Calculate Route` 鏌ヨ涓嶅啀娓呴櫎鏃ц矾寰勶紝鑰屾槸浣滀负鍙鐞嗗浘灞備繚鐣欍€?- 鍘嗗彶璁板綍鏀寔鏄剧ず/鍙栨秷鏄剧ず鏌愭潯鎴栧鏉¤矾寰勩€?- 鍘嗗彶璺緞鏀寔鑷畾涔夐鑹层€佺矖缁嗐€佺嚎娈垫牱寮忋€?- 閲嶅婧愬璺敱涓嶉噸澶嶈褰曘€?- 椤甸潰宸︿晶鏍忛《閮ㄥ鍔?CoNET 浜у搧 Logo 鍜?favicon銆?
### 瀹炵幇

- 鏂板缁熶竴鍓嶇璺緞鍥惧眰瀹瑰櫒锛?
```text
routeOverlayLayer
routeOverlays
```

- 鏂板璺緞绠＄悊鍑芥暟锛?  - `addOrUpdateRouteOverlay`
  - `removeRouteOverlay`
  - `setRouteOverlayVisible`
  - `updateRouteOverlayStyle`
  - `focusRouteOverlay`
- 鍘嗗彶璁板綍浣跨敤 `routeKey()` 鎸夋簮瀹垮潗鏍囧幓閲嶃€?- 鎵归噺鏌ヨ鎴愬姛缁撴灉榛樿鍐欏叆鍘嗗彶骞舵樉绀哄埌鍦板浘銆?- 鍘嗗彶鍒楄〃姣忔潯璁板綍澧炲姞鏄剧ず寮€鍏炽€侀鑹层€佺矖缁嗐€佺嚎鍨嬪拰瀹氫綅鎸夐挳銆?- 鏂板 `web/favicon.svg`銆?- 宸︿晶鏍忛《閮ㄦ柊澧?CoNET 鍝佺墝鍖恒€?
### 楠岃瘉

```text
node --check web\app.js
passed

python scripts\run_tests.py
PASS total=2
```
## 2026-07-08 Iteration 6锛氭壒閲忔簮瀹挎枃浠惰矾鐢辫绠?
### 闇€姹?
- 璺綉鍔犺浇瀹屾垚鍚庯紝鏀寔涓婁紶婧愬瀵?CSV銆?- 杈撳叆鍒椾负 `Src NE Name`銆乣Sink NE Name`銆乣Src Lon`銆乣Src Lat`銆乣Sink Lon`銆乣Sink Lat`銆?- 鍚庣鎵归噺璁＄畻姣忎竴瀵规簮瀹跨殑璺綉璺濈鍜屽畬鏁磋矾鐢便€?- 杈撳嚭 CSV 杩藉姞 `Straight Distance`銆乣Distance`銆乣Route`銆乣Error Detail`銆?- 鎴愬姛鏃?`Error Detail` 涓虹┖锛涘け璐ユ椂鐩存帴鍐欏叆鍘熷洜锛屼笉鍐嶈緭鍑?`Status` 鍒椼€?- 鐩寸嚎璺濈闃堝€奸粯璁?30km锛屽崟浣?km銆?- 榛樿 `workers=4`銆?- 澶ц矾缃戜笅骞跺彂璁＄畻鍏变韩褰撳墠鍐呭瓨涓殑 CSR 鍥惧拰绌洪棿绱㈠紩锛岄伩鍏嶅鍒惰矾缃戙€?- 鍓嶇鏄剧ず寮傛浠诲姟杩涘害鏉°€佸畬鎴愭暟/鎬绘暟銆佹垚鍔熸暟銆佸け璐ユ暟銆侀槇鍊艰烦杩囨暟銆?- 璁＄畻瀹屾垚鍚庢敮鎸佷笅杞界粨鏋?CSV銆?- 鏀寔鎸夋簮缃戝厓鍚嶇О鍜屽缃戝厓鍚嶇О鎼滅储棰勮璺敱锛屽苟鍦?GIS 鍦板浘鍥炴斁銆?
### 瀹炵幇

- 鏂板 `road_network/batch_router.py`锛?  - `BatchRouteCalculator`
  - 娴佸紡璇诲彇婧愬瀵?CSV銆?  - 鐩寸嚎璺濈闃堝€艰繃婊ゃ€?  - 璋冪敤 `RoadDistanceCalculator.shortest_path()`銆?  - 杈撳嚭 `LINESTRING(...)` 璺敱銆?  - 骞跺彂璁＄畻缁撴灉鎸夎緭鍏ヨ椤哄簭鍐欏嚭銆?  - 淇濈暀鍓?1000 鏉℃垚鍔熺粨鏋滅敤浜庡墠绔瑙堛€?- 鎵╁睍 `app/main.py`锛?  - `POST /api/batch-routes/upload/start`
  - `GET /api/batch-routes/status/{job_id}`
  - `GET /api/batch-routes/download/{job_id}`
  - `GET /api/batch-routes/preview/{job_id}`
  - 鎵归噺浠诲姟鍚姩鏃舵崟鑾峰綋鍓?`_network` 鍜?`_calculator` 寮曠敤锛岄伩鍏嶄换鍔¤繍琛屼腑琚柊涓婁紶璺綉褰卞搷銆?- 鎵╁睍 `web/index.html`銆乣web/app.js`銆乣web/styles.css`锛?  - 鏂板鎵归噺婧愬鏂囦欢涓婁紶鍗＄墖銆?  - 鏂板闃堝€煎拰 workers 杈撳叆銆?  - 鏂板鎵归噺浠诲姟杩涘害鏉°€?  - 鏂板缁撴灉涓嬭浇鎸夐挳銆?  - 鏂板婧愬缃戝厓鍚嶇О鎼滅储棰勮銆?  - 鐐瑰嚮棰勮璺敱鍚庡姞鍏ュ湴鍥惧浘灞傚拰鍘嗗彶娓呭崟銆?- 鏂板 `DT_test`锛?  - `test_batch_route_functional.py`
  - `performance_dt.py`
  - `README.md`

### 楠岃瘉

```text
node --check web\app.js
passed

python -m compileall app road_network DT_test
passed

python -m pytest DT_test tests -rs
9 passed, 2 skipped, 2 warnings
```

璇存槑锛?
- 2 涓?FastAPI `TestClient` 娴嬭瘯鍥犲綋鍓嶇幆澧冪己灏戝彲鐢?`httpx` 琚烦杩囥€?- `requirements.txt` 宸插寘鍚?`httpx>=0.24`锛屽畬鏁村畨瑁呬緷璧栧悗浼氭墽琛屾帴鍙ｆ祴璇曘€?
### 鎬ц兘 DT

澶ц妯″悎鎴愯矾缃戯細

```text
python DT_test\performance_dt.py --grid-size 500 --pairs 200 --workers 4
```

缁撴灉锛?
```text
WKT rows=499000
nodes=250000
undirected_edges=499000
pairs=200
load_seconds=5.883
batch_seconds=3.854
avg_ms_per_pair=19.269
success=200
failed=0
```

鎶ュ憡宸蹭繚瀛橈細

```text
docs/batch_route_performance_dt_report.md
```

## 2026-07-08 Iteration 7锛氭浖璋疯矾缃戣妭鐐规簮瀹垮涓庡墠绔巻鍙茬紦瀛樻竻鐞?
### 闂

- 涔嬪墠鐢ㄤ簬 HTML 绔埌绔祴璇曠殑鍚堟垚婧愬瀵逛笉鍦ㄦ浖璋风湡瀹炶矾缃戦檮杩戯紝涓婁紶鏇艰胺璺綉鍚庢棤娉曟湁鏁堥獙璇佹壒閲忚矾鐢辫绠椼€?- 鏈嶅姟閲嶅惎鍚庯紝鍓嶇 `localStorage` 涓粛淇濈暀鏃у巻鍙茶矾鐢憋紱鍗充娇鍚庣褰撳墠鏈姞杞借矾缃戯紝鍦板浘浠嶅彲鑳芥樉绀轰箣鍓嶇殑鍘嗗彶璺緞銆?
### 瀹炵幇

- 鏂板鑴氭湰锛?
```text
scripts/generate_source_sink_pairs.py
```

- 鑴氭湰璇诲彇鎸囧畾 WKT 璺綉 CSV锛屾瀯寤鸿矾缃戝浘鍚庤绠楁渶澶ц繛閫氬垎閲忥紝骞朵粠鐪熷疄璺綉鑺傜偣涓殢鏈烘娊鏍锋簮瀹跨偣銆?- 鐢熸垚鐨勬簮瀹跨偣鐩存帴钀藉湪璺綉鑺傜偣涓婏紝鍚搁檮璺濈涓?0锛屽苟涓旀潵鑷悓涓€杩為€氬垎閲忋€?- 榛樿鎺у埗鐩寸嚎璺濈鍦?0.5km 鍒?25km锛岄伩鍏嶈 30km 榛樿闃堝€艰繃婊ゃ€?- 鏂板鏇艰胺鎵归噺婧愬娴嬭瘯鏂囦欢锛?
```text
data/bangkok_source_sink_pairs.csv
```

- 鍓嶇鏂板 `clearRouteCache()`锛?  - 娓呯┖鍦板浘涓婄殑鍘嗗彶 route overlay銆?  - 娓呯┖ `localStorage` 涓殑鍘嗗彶璺敱銆?  - 娓呯┖鎵归噺鏌ヨ缁撴灉鍜屾壒閲忔枃浠堕瑙堢粨鏋溿€?- `GET /api/network/status` 杩斿洖鏈姞杞借矾缃戞椂锛岃嚜鍔ㄦ竻鐞嗘棫缂撳瓨銆?- 鏂拌矾缃戝姞杞藉畬鎴愭椂锛屼篃鑷姩娓呯悊鏃ц矾鐢憋紝閬垮厤涓嶅悓璺綉鐨勫巻鍙茬粨鏋滄贩鐢ㄣ€?
### 楠岃瘉

鐢熸垚鍛戒护锛?
```text
python scripts\generate_source_sink_pairs.py --network-csv data\osm_bangkok_roads.csv --output data\bangkok_source_sink_pairs.csv --count 300 --min-distance-km 0.5 --max-distance-km 25 --seed 20260708
```

鐢熸垚缁撴灉锛?
```text
network nodes=97016
edges=103865
largest component nodes=94891
wrote pairs=300
```

鎵归噺绠楁硶鏍￠獙锛?
```text
total=300
success=300
failed=0
skipped_by_threshold=0
elapsed_s=30.81
```

## 2026-07-08 Iteration 8锛氭壒閲忛瑙堣嚜鍔ㄤ笂鍥句笌涓嬭浇鏂囦欢鍚嶄紭鍖?
### 闂

- 鐢ㄦ埛鐐瑰嚮 `Search Preview Routes` 鍚庯紝椤甸潰鍙湪宸︿晶鐢熸垚鍖归厤缁撴灉鍒楄〃锛涢渶瑕佸啀鐐瑰嚮鍒楄〃椤规墠浼氬湪 GIS 鍦板浘鏄剧ず璺嚎銆?- 杩欎釜浜や簰涓嶅鐩存帴锛屽鏄撹鍒や负棰勮鏌ヨ娌℃湁杩斿洖璺敱銆?- 鎵归噺缁撴灉涓嬭浇鏂囦欢鍚嶄娇鐢?job uuid锛屼笉鏂逛究浜哄伐璇嗗埆鐢熸垚鏃堕棿銆?
### 瀹炵幇

- `Search Preview Routes` 鏌ヨ鎴愬姛鍚庯紝濡傛灉杩斿洖鑷冲皯涓€鏉￠瑙堢粨鏋滐紝鍓嶇鑷姩灏嗙涓€鏉″尮閰嶈矾鐢辨樉绀哄埌 GIS 鍦板浘銆?- 鍒楄〃浠嶇劧淇濈暀锛岀敤鎴峰彲浠ョ偣鍑诲叾浠栭瑙堢粨鏋滃垏鎹㈠湴鍥炬樉绀恒€?- 鑷姩鏄剧ず鏃跺悓姝ュ啓鍏?History锛屽苟鏄剧ず婧愬缃戝厓鍚嶇О鏍囩銆?- 涓嬭浇鏂囦欢鍚嶆敼涓哄垎閽熺骇鏃堕棿鎴筹細

```text
batch_route_result_YYYYMMDDHHMM.csv
```

绀轰緥锛?
```text
batch_route_result_202607081240.csv
```

### 楠岃瘉

```text
node --check web\app.js
passed

python -m compileall app road_network DT_test scripts
passed

python -m pytest DT_test tests -q
10 passed, 2 skipped, 2 warnings
```

## 2026-07-08 Iteration 9锛氭壒閲忕粨鏋滈瑙堟悳绱㈠彲闈犳€т笌缃戝厓鍚嶇О鑱旀兂

### 闂

- 鐢ㄦ埛鐢?`BKK_SRC_00002` 鍜?`BKK_SINK_00002` 鐐瑰嚮 `Search Preview Routes` 鍚庯紝鍓嶇娌℃湁鏄剧ず GIS 璺緞锛屼篃娌℃湁鍐欏叆 History銆?- 涓嬭浇鐨勭粨鏋?CSV 涓婧愬瀵瑰凡缁忔垚鍔熻绠楋紝璇存槑闂鍑哄湪棰勮妫€绱㈤摼璺紝鑰屼笉鏄璺畻娉曘€?- 鏃у疄鐜扮殑棰勮鎺ュ彛鍙煡璇㈠悗绔唴瀛樹腑鐨?`preview_rows`锛屾病鏈変互鏈€缁堢粨鏋?CSV 涓哄噯锛涗竴鏃﹀唴瀛橀瑙堟牱鏈己澶辨垨鍓嶇浠诲姟鐘舵€佷笉瀹屾暣锛岄瑙堟煡璇㈠氨鍙兘鏌ヤ笉鍒颁笅杞芥枃浠朵腑宸叉湁鐨勬垚鍔熻矾鐢便€?
### 瀹炵幇

- `GET /api/batch-routes/preview/{job_id}` 鏀逛负浼樺厛鎵弿宸茬敓鎴愮殑缁撴灉 CSV銆?- 棰勮鏌ヨ鐜板湪涓庝笅杞?CSV 淇濇寔涓€鑷达細涓嬭浇鏂囦欢涓瓨鍦ㄧ殑鎴愬姛璺敱锛屾悳绱㈤瑙堜篃鑳借繑鍥炲苟鍦?GIS 鍦板浘鏄剧ず銆?- 棰勮鍝嶅簲鏂板锛?  - `matched_tasks`
  - `message`
- 褰撴簮瀹垮涓嶅瓨鍦ㄤ簬浠诲姟娓呭崟涓椂锛屽墠绔樉绀猴細

```text
杈撳叆鐨勬簮瀹垮涓嶅湪缁欏畾鐨勪换鍔℃竻鍗曚腑銆?```

- 褰撴簮瀹垮瀛樺湪浣嗘病鏈夋垚鍔熻矾绾挎椂锛屽墠绔樉绀猴細

```text
璇ユ簮瀹垮鍦ㄤ换鍔℃竻鍗曚腑锛屼絾娌℃湁鎴愬姛绠楀嚭鐨勮矾鐢便€?```

- 鏂板鍚嶇О鑱旀兂鎺ュ彛锛?
```text
GET /api/batch-routes/names/{job_id}?src=...&sink=...
```

- 鍓嶇 `Search Src Name` 鍜?`Search Sink Name` 澧炲姞 `datalist`銆?- 鐢ㄦ埛杈撳叆 `BKK` 鏃讹紝浼氳嚜鍔ㄦ诞鐜版簮缃戝厓/瀹跨綉鍏冨€欓€夊悕绉般€?- 鍚嶇О鍊欓€変粠鏈€缁堢粨鏋?CSV 涓В鏋愶紝閬垮厤鍙緷璧栧墠绔紦瀛樸€?
### 楠岃瘉

鏂板 DT 鐢ㄤ緥楠岃瘉 `BKK_SRC_00002 / BKK_SINK_00002` 杩欑被璁板綍鍙互浠庣粨鏋?CSV 琚瑙堟壂鎻忓懡涓紝骞朵笖鍚嶇О鑱旀兂鑳借繑鍥炲搴斿€欓€夈€?
```text
node --check web\app.js
passed

python -m compileall app road_network DT_test scripts
passed

python -m pytest DT_test tests -q
11 passed, 2 skipped, 2 warnings
```

## 2026-07-08 Iteration 10锛氭壒閲忓璺嚜閫傚簲鎬ц兘浼樺寲

### 闂

鏇艰胺 300 瀵规簮瀹挎壒閲忚绠椾粛闇€瑕佸崄鍑犵鍒颁笁鍗佺锛屼富瑕佺摱棰堝湪姣忎竴瀵规簮瀹块兘鐙珛鎵ц Python `heapq` 鍙屽悜 Dijkstra銆傜嚎绋嬪苟鍙戝彈 GIL 褰卞搷锛屾棤娉曞厖鍒嗗埄鐢ㄥ鏍搞€?
### 杩囩▼

鍏堝皾璇曚綆椋庨櫓浼樺寲锛?
- Dijkstra workspace 澶嶇敤銆?- 鎵归噺鍚搁檮缂撳瓨銆?
瀹炴祴鍙戠幇璇ユ柟妗堟病鏈夊甫鏉ユ敹鐩婏紝鍘熷洜鏄綋鍓嶅浘瑙勬ā涓?NumPy 鍏ㄩ噺鍒濆鍖栦笉鏄富鐡堕锛孭ython 灞?touched-node 閲嶇疆鍜岀嚎绋嬪紑閿€鍙嶈€屾姷娑堟敹鐩娿€?
闅忓悗鏀逛负寮曞叆 SciPy C 瀹炵幇鎵归噺 Dijkstra锛?
- 灏?CSR 鍥捐浆鎹负 `scipy.sparse.csr_matrix`銆?- 瀵瑰悓涓€鎵规簮鑺傜偣浣跨敤 `scipy.sparse.csgraph.dijkstra` 鎵归噺璁＄畻銆?- 浣跨敤杩斿洖鐨?predecessor 鐭╅樀杩樺師姣忔潯璺緞銆?- 淇濇寔杈撳嚭 `Distance` 鍜?`Route` 涓庡師绠楁硶涓€鑷淬€?
### 鑷€傚簲绛栫暐

涓嶆槸鎵€鏈夎矾缃戦兘閫傚悎 SciPy 鎵归噺鐭╅樀鏂规銆傚浜庤秴澶ц矾缃戯紝`source_count x node_count` 璺濈鐭╅樀鍜屽墠椹辩煩闃靛彲鑳借繃澶с€傚洜姝ゅ綋鍓嶇瓥鐣ヤ负锛?
```text
if total_rows <= 20000 and node_count <= 500000:
    use SciPy batch Dijkstra
else:
    use streaming Python bidirectional Dijkstra
```

### 鏇艰胺 300 瀵归獙璇?
```text
network=data/osm_bangkok_roads.csv
pairs=data/bangkok_source_sink_pairs.csv
nodes=97016
edges=103865
pairs=300
```

缁撴灉锛?
```text
legacy_s=35.598
optimized_s=6.594
speedup=5.398x
avg_ms_per_pair=21.981
success=300
failed=0
distance_mismatches=0
```

### 澶у浘 DT 楠岃瘉

```text
python DT_test\performance_dt.py --grid-size 500 --pairs 200 --workers 4
```

缁撴灉锛?
```text
WKT rows=499000
nodes=250000
edges=499000
batch_seconds=5.280
avg_ms_per_pair=26.398
success=200
failed=0
```

璇ュ浘鏈秴杩?`SCIPY_BATCH_MAX_NODES=500000`锛屽彲浣跨敤 SciPy 鎵归噺 Dijkstra锛涜秴杩?50 涓囪妭鐐瑰悗鍐嶅洖閫€鍒颁綆鍐呭瓨娴佸紡璺緞銆??
### 楠岃瘉

```text
python -m pytest tests DT_test -q
11 passed, 2 skipped, 2 warnings

python -m compileall road_network app DT_test scripts
passed
```

## 2026-07-08 Iteration 11：SciPy 批量引擎回退阈值调整到 50 万节点

### 需求

用户确认大规模路网的回退阈值可以设为 50 万节点级；超过该阈值后，再回退到低内存占用的流式算路方案。

### 实现

将批量路由自适应阈值调整为：

```text
SCIPY_BATCH_MAX_ROWS = 20000
SCIPY_BATCH_MAX_NODES = 500000
```

当前策略：

```text
if total_rows <= 20000 and node_count <= 500000:
    use SciPy batch Dijkstra
else:
    use streaming Python bidirectional Dijkstra
```

### DT 结果

```text
python DT_test\performance_dt.py --grid-size 500 --pairs 200 --workers 4
```

结果：

```text
nodes=250000
edges=499000
pairs=200
batch_seconds=12.794
avg_ms_per_pair=63.968
success=200
failed=0
```

说明：

- 25 万节点未超过 50 万节点阈值，因此本次走 SciPy 批量 Dijkstra。
- 超过 50 万节点后才回退到低内存流式 Python 双向 Dijkstra。

## 2026-07-08 Iteration 12：批量结果 CSV 路由列名调整

### 需求

用户要求下载结果 CSV 中的路由列名从：

```text
Route
```

调整为：

```text
Route WKT
```

### 实现

- `road_network/batch_router.py` 输出列调整为 `Route WKT`。
- 后端预览接口改为检查 `Route WKT`。
- 前端批量预览地图显示优先读取 `Route WKT`，并保留对旧 `Route` 字段的兼容。
- DT 测试同步调整，确保结果 CSV 新字段名被覆盖验证。
- 当前设计文档和 README 同步更新。
