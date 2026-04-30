/** ERP V22 FULL SAFE - Code.gs - Backend dong bo voi Index.html V22; giu nguyen schema va ham google.script.run */
/** MINI ERP V6 - Sidebar UI backend
 * Schema: CONFIG_USERS, NHAN_SU, BAO_CAO_TONG, BAO_CAO_CHI_TIET, GIAO_VIEC, TANG_CA_THANG, SETTINGS
 * Date format: dd/MM/yyyy
 */

const SHEET = {
  CONFIG: 'CONFIG_USERS',
  NS: 'NHAN_SU',
  TONG: 'BAO_CAO_TONG',
  CT: 'BAO_CAO_CHI_TIET',
  GV: 'GIAO_VIEC',
  TC_THANG: 'TANG_CA_THANG',
  SET: 'SETTINGS'
};

const LOAI = {
  VANG: 'Báo cáo vắng',
  TANG_CA: 'Tăng ca',
  BIEN_DONG: 'Biến động nhân sự'
};

function doGet() {
  return HtmlService.createHtmlOutputFromFile('Index')
    .setTitle('Báo cáo nhân sự')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function ss_(){ return SpreadsheetApp.getActiveSpreadsheet(); }
function sh_(name){
  const s = ss_().getSheetByName(name);
  if (!s) throw new Error('Thiếu sheet: ' + name);
  return s;
}
function tz_(){ return Session.getScriptTimeZone(); }
function fmtDate_(d){ return Utilities.formatDate(new Date(d), tz_(), 'dd/MM/yyyy'); }
function fmtTime_(d){ return Utilities.formatDate(new Date(d), tz_(), 'dd/MM/yyyy HH:mm:ss'); }
function fmtMonth_(d){ return Utilities.formatDate(new Date(d), tz_(), 'MM/yyyy'); }
function txt_(v){ return String(v == null ? '' : v).trim(); }
function num_(v){ const n = Number(v); return isNaN(n) ? 0 : n; }
function saveMeta_(payload){ return { savedAt: fmtTime_(new Date()), requestId: txt_(payload && payload.requestId) }; }


/* ================= V30.9 DATA CONSISTENCY FIX =================
 * Mục tiêu: lưu ở đâu thì đọc đúng ở đó.
 * - Chuẩn hóa ngày dd/MM/yyyy cho mọi hàm đọc/ghi.
 * - So khớp bộ phận không lệch hoa/thường/dấu/khoảng trắng.
 * - Ghi có lock + flush để UI đọc lại thấy ngay dữ liệu vừa lưu.
================================================================ */
function bpKey_(v){ return noAccent_(txt_(v)).replace(/\s+/g,' ').trim(); }
function sameBp_(a,b){ return bpKey_(a) === bpKey_(b); }
function requireCore_(ngay, boPhan){
  ngay = normDate_(ngay);
  boPhan = txt_(boPhan);
  if (!ngay || !boPhan) throw new Error('Thiếu ngày hoặc bộ phận.');
  return {ngay:ngay, boPhan:boPhan};
}
function withDocLock_(fn){
  const lock = LockService.getDocumentLock();
  lock.waitLock(20000);
  try { return fn(); }
  finally { try { SpreadsheetApp.flush(); } catch(e) {} lock.releaseLock(); }
}
function normalizeItems_(items){
  if (!Array.isArray(items)) return [];
  return items.map(x => {
    if (typeof x === 'string') return {maNv:txt_(x), tenNv:'', boPhanGoc:''};
    return {
      maNv: txt_(x.maNv || x.ma || x.code),
      tenNv: txt_(x.tenNv || x.ten || x.name),
      boPhanGoc: txt_(x.boPhanGoc || x.boPhan || x.department),
      trangThai: txt_(x.trangThai || 'Có phép'),
      lyDo: txt_(x.lyDo),
      ghiChu: txt_(x.ghiChu),
      selected: x.selected === true
    };
  }).filter(x => x.maNv);
}
function getNhanSuTheoBoPhanRaw_(boPhan){
  boPhan = txt_(boPhan);
  const data = sh_(SHEET.NS).getDataRange().getDisplayValues();
  const out = [];
  for (let i=1;i<data.length;i++){
    const ma = txt_(data[i][0]);
    const ten = txt_(data[i][1]);
    const bp = txt_(data[i][2]);
    const tt = txt_(data[i][3]);
    if (!ma || !ten || !active_(tt)) continue;
    if (sameBp_(bp, boPhan)) out.push({maNv:ma, tenNv:ten, boPhan:bp, trangThai:tt});
  }
  return out;
}
function isTangCa_(loai){ return txt_(loai) === LOAI.TANG_CA || txt_(loai) === 'Tăng ca'; }


/* ================= V30.12 VERCEL MATCH FIX =================
 * Ghi nhớ một màn nhập liệu đã từng được lưu, kể cả khi lưu 0 nhân viên.
 * Nhờ vậy frontend không tự chọn lại toàn bộ sau khi người dùng đã bỏ chọn hết.
================================================================ */
function entryStateKeyV312_(ngay, boPhan, loaiBaoCao, chiTiet){
  const raw = normDate_(ngay) + '|' + txt_(boPhan) + '|' + txt_(loaiBaoCao) + '|' + txt_(chiTiet);
  return 'ERP_V30_12_SAVED_' + noAccent_(raw).replace(/[^a-z0-9]+/g, '_').slice(0, 220);
}
function markEntrySavedV312_(ngay, boPhan, loaiBaoCao, chiTiet){
  try { PropertiesService.getDocumentProperties().setProperty(entryStateKeyV312_(ngay, boPhan, loaiBaoCao, chiTiet), fmtTime_(new Date())); } catch(e) {}
}
function hasEntrySavedV312_(ngay, boPhan, loaiBaoCao, chiTiet){
  try { return !!PropertiesService.getDocumentProperties().getProperty(entryStateKeyV312_(ngay, boPhan, loaiBaoCao, chiTiet)); } catch(e) { return false; }
}

function taoMa12So(){
  const d = new Date();
  const y = String(d.getFullYear()).slice(-2);
  const m = ('0' + (d.getMonth() + 1)).slice(-2);
  const day = ('0' + d.getDate()).slice(-2);
  const rand = Math.floor(100000 + Math.random() * 900000);
  return y + m + day + rand;
}
function noAccent_(v){
  return txt_(v)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g,'')
    .replace(/đ/g,'d')
    .replace(/Đ/g,'d');
}

function parseDate_(v){
  if (Object.prototype.toString.call(v) === '[object Date]' && !isNaN(v)) return v;
  const s = txt_(v);
  if (!s) return null;
  let m = s.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (m) return new Date(+m[3], +m[2]-1, +m[1]);
  m = s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (m) return new Date(+m[1], +m[2]-1, +m[3]);
  const d = new Date(s);
  return isNaN(d) ? null : d;
}
function normDate_(v){ const d = parseDate_(v); return d ? fmtDate_(d) : ''; }
function active_(v){
  const s = txt_(v).toLowerCase();
  if (!s) return true;
  return ['làm việc bình thường','lam viec binh thuong','đang làm việc','dang lam viec','đang làm','dang lam','hoạt động','hoat dong','active'].includes(s);
}
function setting_(key, def){
  const data = sh_(SHEET.SET).getDataRange().getDisplayValues();
  for (let i=1;i<data.length;i++){
    if (txt_(data[i][0]) === key) return txt_(data[i][1]) || def;
  }
  return def;
}
function roleLabel_(role){
  const r = txt_(role);
  return r || 'Tổ trưởng';
}

function appInit(){
  return {
    today: fmtDate_(new Date()),
    nowStr: fmtTime_(new Date()),
    appName: setting_('APP_NAME','MINI ERP'),
    primaryColor: setting_('PRIMARY_COLOR','#0f7a43')
  };
}

/* LOGIN */
function getDanhSachBoPhan(){
  const data = sh_(SHEET.CONFIG).getDataRange().getDisplayValues();
  const rows = [];
  for (let i=1;i<data.length;i++){
    const bp = txt_(data[i][0]);
    if (!bp || !active_(data[i][4])) continue;
    rows.push({boPhan:bp, thuTu:num_(data[i][6]) || 9999});
  }
  rows.sort((a,b)=> a.thuTu-b.thuTu || a.boPhan.localeCompare(b.boPhan,'vi'));
  return rows.map(x=>x.boPhan);
}
function loginBoPhan(boPhan, matKhau){
  boPhan = txt_(boPhan);
  matKhau = txt_(matKhau);
  if (!boPhan) throw new Error('Bạn chưa chọn bộ phận.');
  if (!matKhau) throw new Error('Bạn chưa nhập mật khẩu.');

  const data = sh_(SHEET.CONFIG).getDataRange().getDisplayValues();
  for (let i=1;i<data.length;i++){
    if (txt_(data[i][0]) === boPhan && txt_(data[i][1]) === matKhau && active_(data[i][4])){
      return {
        boPhan: txt_(data[i][0]),
        tenToTruong: txt_(data[i][2]),
        vaiTro: txt_(data[i][3]) || 'Tổ trưởng',
        roleLabel: roleLabel_(data[i][3]),
        today: fmtDate_(new Date()),
        nowStr: fmtTime_(new Date()),
        primaryColor: setting_('PRIMARY_COLOR','#0f7a43')
      };
    }
  }
  throw new Error('Bộ phận hoặc mật khẩu không đúng.');
}

/* CONFIG USERS - FOR MANAGER TASK */
function getDanhSachToTruong(){
  const data = sh_(SHEET.CONFIG).getDataRange().getDisplayValues();
  const out = [];
  for (let i=1;i<data.length;i++){
    const boPhan = txt_(data[i][0]);
    const ten = txt_(data[i][2]);
    const vaiTro = txt_(data[i][3]);
    const tt = txt_(data[i][4]);
    if (!boPhan || !ten || !active_(tt)) continue;
    const role = vaiTro.toLowerCase();
    if (role === 'tổ trưởng' || role === 'to truong') {
      out.push({boPhan, tenToTruong: ten, vaiTro});
    }
  }
  return out;
}

/* NHAN_SU */
function searchNhanSu(boPhanIgnored, keyword){
  const kw = noAccent_(keyword);
  const data = sh_(SHEET.NS).getDataRange().getDisplayValues();
  const out = [];
  for (let i=1;i<data.length;i++){
    const ma = txt_(data[i][0]);
    const ten = txt_(data[i][1]);
    const bp = txt_(data[i][2]);
    const tt = txt_(data[i][3]);
    if (!ma || !ten || !active_(tt)) continue;
    const haystack = noAccent_(ma + ' ' + ten + ' ' + bp);
    if (!kw || haystack.includes(kw)){
      out.push({maNv:ma, tenNv:ten, boPhan:bp, trangThai:tt});
    }
  }
  return out.slice(0, 80);
}
function getThongTinNhanSu(){
  const data = sh_(SHEET.NS).getDataRange().getDisplayValues();
  const out = [];
  for (let i=1;i<data.length;i++){
    if (!txt_(data[i][0])) continue;
    out.push({maNv:txt_(data[i][0]), tenNv:txt_(data[i][1]), boPhan:txt_(data[i][2]), trangThai:txt_(data[i][3]), ghiChu:txt_(data[i][4])});
  }
  return out;
}

/* BAO_CAO */
function maBaoCao_(ngay, boPhan){
  const d = parseDate_(ngay) || new Date();
  return Utilities.formatDate(d, tz_(), 'yyyyMMdd') + '_' + txt_(boPhan).toUpperCase().replace(/\s+/g,'_');
}
function findTongRow_(ngay, boPhan){
  const core = requireCore_(ngay, boPhan);
  const data = sh_(SHEET.TONG).getDataRange().getDisplayValues();
  for (let i=1;i<data.length;i++){
    if (normDate_(data[i][1]) === core.ngay && sameBp_(data[i][3], core.boPhan)) return i+1;
  }
  return 0;
}
function countVang_(ngay, boPhan){
  const core = requireCore_(ngay, boPhan);
  const data = sh_(SHEET.CT).getDataRange().getDisplayValues();
  let sang=0, chieu=0, caNgay=0;
  for (let i=1;i<data.length;i++){
    if (normDate_(data[i][2]) !== core.ngay) continue;
    if (!sameBp_(data[i][4], core.boPhan)) continue;
    if (txt_(data[i][5]) !== LOAI.VANG) continue;
    const ct = txt_(data[i][6]);
    if (ct === 'Vắng buổi sáng') sang++;
    else if (ct === 'Vắng buổi chiều') chieu++;
    else if (ct === 'Vắng cả ngày') caNgay++;
  }
  return {sang, chieu, caNgay, tong:sang+chieu+caNgay};
}
function ensureTong_(ngay, boPhan, toTruong){
  ngay = normDate_(ngay);
  boPhan = txt_(boPhan);
  const s = sh_(SHEET.TONG);
  let row = findTongRow_(ngay, boPhan);
  if (!row){
    const c = countVang_(ngay, boPhan);
    s.appendRow([maBaoCao_(ngay, boPhan), ngay, txt_(toTruong), boPhan, '', '', c.sang, c.chieu, c.caNgay, c.tong, '', fmtTime_(new Date())]);
    row = s.getLastRow();
  }
  return row;
}
function refreshTongCounts_(ngay, boPhan, toTruong){
  const row = ensureTong_(ngay, boPhan, toTruong);
  const c = countVang_(ngay, boPhan);
  sh_(SHEET.TONG).getRange(row, 7, 1, 4).setValues([[c.sang,c.chieu,c.caNgay,c.tong]]);
  sh_(SHEET.TONG).getRange(row, 12).setValue(fmtTime_(new Date()));
}
function getBaoCaoTong(ngay, boPhan){
  ngay = normDate_(ngay);
  boPhan = txt_(boPhan);
  const s = sh_(SHEET.TONG);
  const row = findTongRow_(ngay, boPhan);
  const c = countVang_(ngay, boPhan);
  if (!row){
    return {exists:false, NGAY:ngay, BO_PHAN:boPhan, TONG_CONG_NHAN:'', CO_MAT:'', VANG_BUOI_SANG:c.sang, VANG_BUOI_CHIEU:c.chieu, VANG_CA_NGAY:c.caNgay, VANG_TONG:c.tong, GHI_CHU:''};
  }
  const v = s.getRange(row,1,1,s.getLastColumn()).getDisplayValues()[0];
  return {
    exists:true,
    MA_BAO_CAO:txt_(v[0]), NGAY:normDate_(v[1]), TO_TRUONG:txt_(v[2]), BO_PHAN:txt_(v[3]),
    TONG_CONG_NHAN:txt_(v[4]), CO_MAT:txt_(v[5]),
    VANG_BUOI_SANG:c.sang, VANG_BUOI_CHIEU:c.chieu, VANG_CA_NGAY:c.caNgay, VANG_TONG:c.tong,
    GHI_CHU:txt_(v[10])
  };
}
function saveBaoCaoTong(payload){
  return withDocLock_(function(){
    const ngay = normDate_(payload.ngay);
    const boPhan = txt_(payload.boPhan);
    const toTruong = txt_(payload.toTruong);
    if (!ngay || !boPhan) throw new Error('Thiếu ngày hoặc bộ phận.');
    const c = countVang_(ngay, boPhan);
    const meta = saveMeta_(payload);
    const rowData = [maBaoCao_(ngay, boPhan), ngay, toTruong, boPhan, txt_(payload.tongCongNhan), txt_(payload.coMat), c.sang, c.chieu, c.caNgay, c.tong, txt_(payload.ghiChu), meta.savedAt];
    const s = sh_(SHEET.TONG);
    const row = findTongRow_(ngay, boPhan);
    if (row) s.getRange(row,1,1,rowData.length).setValues([rowData]);
    else s.appendRow(rowData);
    return {ok:true, message: row ? 'Đã cập nhật báo cáo.' : 'Đã lưu báo cáo.', savedAt: meta.savedAt, requestId: meta.requestId, ngay: ngay, boPhan: boPhan};
  });
}

function getChiTiet(ngay, boPhan, loai, chiTiet){
  const core = requireCore_(ngay, boPhan);
  loai = txt_(loai); chiTiet = txt_(chiTiet);
  const data = sh_(SHEET.CT).getDataRange().getDisplayValues();
  const out = [];
  for (let i=1;i<data.length;i++){
    if (normDate_(data[i][2]) !== core.ngay) continue;
    if (!sameBp_(data[i][4], core.boPhan)) continue;
    if (txt_(data[i][5]) !== loai) continue;
    if (txt_(data[i][6]) !== chiTiet) continue;
    out.push({
      maChiTiet:txt_(data[i][0]), maNv:txt_(data[i][7]), tenNv:txt_(data[i][8]), boPhanGoc:txt_(data[i][9]),
      trangThai:txt_(data[i][10]), batDau:txt_(data[i][11]), ketThuc:txt_(data[i][12]), soGio:txt_(data[i][13]),
      toChuyenDen:txt_(data[i][14]), lyDo:txt_(data[i][15]), nguon:txt_(data[i][16]), ghiChu:txt_(data[i][17]), selected:true
    });
  }
  return out;
}
function getChiTietVang(ngay, boPhan, chiTiet){ return getChiTiet(ngay, boPhan, LOAI.VANG, chiTiet); }
function getChiTietNhapLieu(ngay, boPhan, loaiBaoCao, chiTiet){
  const saved = getChiTiet(ngay, boPhan, loaiBaoCao, chiTiet);
  if (!isTangCa_(loaiBaoCao)) return saved;
  const savedMap = {};
  saved.forEach(x => savedMap[x.maNv] = x);
  const dept = getNhanSuTheoBoPhanRaw_(boPhan);
  const out = dept.map(r => {
    const old = savedMap[r.maNv];
    if (old) return Object.assign({}, old, {boPhanGoc: old.boPhanGoc || r.boPhan, selected:true});
    return {maNv:r.maNv, tenNv:r.tenNv, boPhanGoc:r.boPhan, trangThai:r.trangThai, batDau:'', ketThuc:'', soGio:'', selected:false, deptDefault:true};
  });
  const deptKeys = {};
  dept.forEach(r => deptKeys[r.maNv] = true);
  saved.forEach(x => { if (!deptKeys[x.maNv]) out.push(Object.assign({}, x, {selected:true, outside:true})); });
  return out;
}
function deleteMatchingCT_(ngay, boPhan, loai, chiTiet){
  const core = requireCore_(ngay, boPhan);
  loai = txt_(loai); chiTiet = txt_(chiTiet);
  const s = sh_(SHEET.CT);
  const data = s.getDataRange().getDisplayValues();
  const rows = [];
  for (let i=1;i<data.length;i++){
    if (normDate_(data[i][2]) === core.ngay && sameBp_(data[i][4], core.boPhan) && txt_(data[i][5]) === loai && txt_(data[i][6]) === chiTiet){
      rows.push(i+1);
    }
  }
  for (let i=rows.length-1;i>=0;i--) s.deleteRow(rows[i]);
}
function appendCT_(rows){
  if (!rows.length) return;
  const s = sh_(SHEET.CT);
  s.getRange(s.getLastRow()+1,1,rows.length,rows[0].length).setValues(rows);
}
function saveChiTietVang(payload){
  return withDocLock_(function(){
    const core = requireCore_(payload.ngay, payload.boPhan);
    const ngay = core.ngay;
    const boPhan = core.boPhan;
    const chiTiet = txt_(payload.chiTiet);
    const items = normalizeItems_(payload.items);
    deleteMatchingCT_(ngay, boPhan, LOAI.VANG, chiTiet);
    const maBC = maBaoCao_(ngay, boPhan);
    const now = fmtTime_(new Date());
    const rows = items.map(x => [
      taoMa12So(), maBC, ngay, txt_(payload.toTruong), boPhan, LOAI.VANG, chiTiet,
      txt_(x.maNv), txt_(x.tenNv), txt_(x.boPhanGoc || boPhan), txt_(x.trangThai || 'Có phép'),
      '', '', '', '', txt_(x.lyDo), 'Nhập liệu', txt_(x.ghiChu), now
    ]);
    appendCT_(rows);
    refreshTongCounts_(ngay, boPhan, payload.toTruong);
    clearNhapLieuCacheV24_(ngay, boPhan, LOAI.VANG);
    markEntrySavedV312_(ngay, boPhan, LOAI.VANG, chiTiet);
    const meta = saveMeta_(payload);
    return {ok:true, message:'Đã lưu chi tiết vắng.', saved: rows.length, savedAt: meta.savedAt, requestId: meta.requestId, ngay:ngay, boPhan:boPhan};
  });
}

/* ================= V24 SAFE SPEED CACHE ================= */
function cacheKeyV24_(prefix, ngay, boPhan, loai){
  return prefix + '_' + noAccent_(normDate_(ngay) + '_' + txt_(boPhan) + '_' + txt_(loai)).replace(/[^a-z0-9_]/g,'_');
}
function clearNhapLieuCacheV24_(ngay, boPhan, loai){
  try {
    const cache = CacheService.getScriptCache();
    cache.remove(cacheKeyV24_('COUNTS', ngay, boPhan, loai));
    cache.remove(cacheKeyV24_('TONGQUAN', ngay, boPhan, ''));
  } catch(e) {}
}

function saveNhapLieu(payload){
  return withDocLock_(function(){
    const core = requireCore_(payload.ngay, payload.boPhan);
    const ngay = core.ngay;
    const boPhan = core.boPhan;
    const loai = txt_(payload.loaiBaoCao);
    const chiTiet = txt_(payload.chiTiet);
    let items = normalizeItems_(payload.items);
    if (Array.isArray(payload.items) && payload.items.some(x => x && typeof x === 'object' && Object.prototype.hasOwnProperty.call(x, 'selected'))) {
      items = normalizeItems_(payload.items.filter(x => x && x.selected === true));
    }
    deleteMatchingCT_(ngay, boPhan, loai, chiTiet);
    const maBC = maBaoCao_(ngay, boPhan);
    const now = fmtTime_(new Date());
    const rows = items.map(x => [
      taoMa12So(), maBC, ngay, txt_(payload.toTruong), boPhan, loai, chiTiet,
      txt_(x.maNv), txt_(x.tenNv), txt_(x.boPhanGoc || boPhan), txt_(x.trangThai),
      txt_(payload.batDau), txt_(payload.ketThuc), txt_(payload.soGio), txt_(payload.toChuyenDen),
      txt_(x.lyDo), 'Nhập liệu', txt_(payload.ghiChu), now
    ]);
    appendCT_(rows);
    ensureTong_(ngay, boPhan, payload.toTruong);
    if (loai === LOAI.TANG_CA) updateTangCaThang_(ngay, boPhan);
    clearNhapLieuCacheV24_(ngay, boPhan, loai);
    markEntrySavedV312_(ngay, boPhan, loai, chiTiet);
    const meta = saveMeta_(payload);
    return {ok:true, message:'Đã lưu nhập liệu.', saved: rows.length, savedAt: meta.savedAt, requestId: meta.requestId, ngay:ngay, boPhan:boPhan};
  });
}
function getTongQuanNhapLieu(ngay, boPhan){
  ngay = normDate_(ngay);
  boPhan = txt_(boPhan);
  const data = sh_(SHEET.CT).getDataRange().getDisplayValues();
  const overtime = {'Tăng ca sáng':{count:0,batDau:'',ketThuc:'',soGio:''},'Tăng ca trưa':{count:0,batDau:'',ketThuc:'',soGio:''},'Tăng ca chiều':{count:0,batDau:'',ketThuc:'',soGio:''},'Tăng ca đột xuất':{count:0,batDau:'',ketThuc:'',soGio:''}};
  const bienDong = {'Công nhân mới':0,'Nghỉ việc':0,'Xin về sớm':0,'Điều động sang tổ khác':0};
  for (let i=1;i<data.length;i++){
    if (normDate_(data[i][2]) !== ngay || !sameBp_(data[i][4], boPhan)) continue;
    const loai = txt_(data[i][5]), ct = txt_(data[i][6]);
    if (loai === LOAI.TANG_CA && overtime[ct]){
      overtime[ct].count++;
      overtime[ct].batDau = overtime[ct].batDau || txt_(data[i][11]);
      overtime[ct].ketThuc = overtime[ct].ketThuc || txt_(data[i][12]);
      overtime[ct].soGio = overtime[ct].soGio || txt_(data[i][13]);
    }
    if (loai === LOAI.BIEN_DONG && bienDong.hasOwnProperty(ct)) bienDong[ct]++;
  }
  return {overtime,bienDong};
}

/* TONG CONG TY */
function getBaoCaoTongCongTy(ngay){
  ngay = normDate_(ngay);
  const config = sh_(SHEET.CONFIG).getDataRange().getDisplayValues();
  const data = sh_(SHEET.TONG).getDataRange().getDisplayValues();
  const rows = [];
  let tongCN=0, coMat=0, vangSang=0, vangChieu=0, vangCaNgay=0;
  const reported = {};
  for (let i=1;i<data.length;i++){
    if (normDate_(data[i][1]) !== ngay) continue;
    const bp = txt_(data[i][3]);
    const r = {
      boPhan:bp, toTruong:txt_(data[i][2]), tongCongNhan:num_(data[i][4]), coMat:num_(data[i][5]),
      vangBuoiSang:num_(data[i][6]), vangBuoiChieu:num_(data[i][7]), vangCaNgay:num_(data[i][8]), vangTong:num_(data[i][9])
    };
    rows.push(r);
    reported[bp] = true;
    tongCN += r.tongCongNhan; coMat += r.coMat; vangSang += r.vangBuoiSang; vangChieu += r.vangBuoiChieu; vangCaNgay += r.vangCaNgay;
  }
  const chuaBaoCao = [];
  for (let i=1;i<config.length;i++){
    const bp = txt_(config[i][0]);
    if (!bp || !active_(config[i][4])) continue;
    if (!reported[bp]) chuaBaoCao.push(bp);
  }
  return {rows,tongCN,coMat,vangSang,vangChieu,vangCaNgay,chuaBaoCao};
}

/* TANG CA THANG */
function updateTangCaThang_(ngay, boPhan){
  const d = parseDate_(ngay);
  if (!d) return;
  const thang = fmtMonth_(d);
  const tc = sh_(SHEET.TC_THANG);
  const lastCol = tc.getLastColumn();
  const headers = tc.getRange(1,1,1,lastCol).getDisplayValues()[0].map(txt_);
  const col = {};
  headers.forEach((h,i)=>col[h]=i);
  const ct = sh_(SHEET.CT).getDataRange().getDisplayValues();
  const byNv = {};
  for (let i=1;i<ct.length;i++){
    if (txt_(ct[i][5]) !== LOAI.TANG_CA) continue;
    if (txt_(ct[i][4]) !== boPhan) continue;
    const dr = parseDate_(ct[i][2]);
    if (!dr || fmtMonth_(dr) !== thang) continue;
    const ma = txt_(ct[i][7]), ten = txt_(ct[i][8]);
    if (!ma) continue;
    const day = +Utilities.formatDate(dr, tz_(), 'd');
    if (!byNv[ma]) byNv[ma] = {ma,ten,days:{},tong:0};
    byNv[ma].days[day] = (byNv[ma].days[day] || 0) + num_(ct[i][13]);
    byNv[ma].tong += num_(ct[i][13]);
  }
  const lastRow = tc.getLastRow();
  const old = lastRow>1 ? tc.getRange(2,1,lastRow-1,lastCol).getValues() : [];
  const keep = old.filter(r => !(txt_(r[0]) === thang && txt_(r[1]) === boPhan));
  const add = Object.values(byNv).sort((a,b)=>a.ma.localeCompare(b.ma,'vi')).map(x=>{
    const row = new Array(lastCol).fill('');
    if (col.THANG != null) row[col.THANG] = thang;
    if (col.BO_PHAN != null) row[col.BO_PHAN] = boPhan;
    if (col.MA_NV != null) row[col.MA_NV] = x.ma;
    if (col.TEN_NV != null) row[col.TEN_NV] = x.ten;
    for (let day=1;day<=31;day++) if (col[String(day)] != null) row[col[String(day)]] = x.days[day] || '';
    if (col.TONG_GIO != null) row[col.TONG_GIO] = x.tong;
    return row;
  });
  if (lastRow > 1) tc.getRange(2,1,lastRow-1,lastCol).clearContent();
  const finalRows = keep.concat(add);
  if (finalRows.length) tc.getRange(2,1,finalRows.length,lastCol).setValues(finalRows);
}
function getDanhSachTangCaXemTruoc(kieu, boPhan, tuNgay, denNgay, thang){
  const data = sh_(SHEET.CT).getDataRange().getDisplayValues();
  const byNv = {};
  let start = null, end = null;

  if (kieu === 'THEO_THANG') {
    thang = txt_(thang);
    if (!thang) throw new Error('Chưa nhập tháng.');
  } else {
    start = parseDate_(tuNgay);
    end = parseDate_(denNgay || tuNgay);
    if (!start || !end) throw new Error('Chưa nhập từ ngày / đến ngày.');
    if (end < start) throw new Error('Đến ngày không được nhỏ hơn từ ngày.');
  }

  for (let i=1;i<data.length;i++){
    if (txt_(data[i][5]) !== LOAI.TANG_CA) continue;
    if (boPhan && boPhan !== 'Tất cả' && txt_(data[i][4]) !== txt_(boPhan)) continue;

    const d = parseDate_(data[i][2]);
    if (!d) continue;

    if (kieu === 'THEO_THANG') {
      if (fmtMonth_(d) !== thang) continue;
    } else {
      if (d < start || d > end) continue;
    }

    const ma = txt_(data[i][7]);
    const ten = txt_(data[i][8]);
    const bpGoc = txt_(data[i][9]);
    if (!ma) continue;

    const day = +Utilities.formatDate(d, tz_(), 'd');
    const ngayKey = fmtDate_(d);

    if (!byNv[ma]) byNv[ma] = {maNv:ma, tenNv:ten, boPhanGoc:bpGoc, days:{}, dates:{}, tong:0};
    byNv[ma].days[day] = (byNv[ma].days[day] || 0) + num_(data[i][13]);
    byNv[ma].dates[ngayKey] = (byNv[ma].dates[ngayKey] || 0) + num_(data[i][13]);
    byNv[ma].tong += num_(data[i][13]);
  }

  const rows = Object.values(byNv).sort((a,b)=>a.maNv.localeCompare(b.maNv,'vi'));
  const totalsByDay = {};
  rows.forEach(r=>Object.keys(r.days).forEach(d=>totalsByDay[d]=(totalsByDay[d]||0)+r.days[d]));

  const tongSoGio = rows.reduce((s,r)=>s+r.tong,0);
  return {
    rows,
    totalsByDay,
    tongSoNhanVien: rows.length,
    tongSoGio,
    ngayCoTangCa: Object.keys(totalsByDay).length,
    tbGioNguoi: rows.length ? tongSoGio / rows.length : 0
  };
}


function exportTangCaExcelDownload(kieu, boPhan, tuNgay, denNgay, thang){
  try {
    const r = getDanhSachTangCaXemTruoc(kieu, boPhan, tuNgay, denNgay, thang);
    const now = new Date();
    const fileName = 'Danh_sach_tang_ca_' + Utilities.formatDate(now, tz_(), 'yyyyMMdd_HHmmss') + '.xlsx';
    const tmp = SpreadsheetApp.create(fileName.replace(/\.xlsx$/,''));
    const sh = tmp.getActiveSheet();
    sh.setName('Tang ca');

    const headers = ['Mã NV','Tên NV','Bộ phận'];
    for (let d=1; d<=31; d++) headers.push(String(d));
    headers.push('Tổng giờ');
    const colCount = headers.length;

    function fitRow_(row){
      row = Array.isArray(row) ? row : [];
      const out = row.slice(0, colCount);
      while (out.length < colCount) out.push('');
      return out;
    }

    const values = [];
    values.push(fitRow_(['DANH SÁCH TĂNG CA']));
    values.push(fitRow_([]));
    values.push(fitRow_(headers));

    (r.rows || []).forEach(x => {
      const row = [x.maNv || '', x.tenNv || '', x.boPhanGoc || ''];
      for (let d=1; d<=31; d++) row.push(x.days && x.days[d] ? x.days[d] : '');
      row.push(Number(x.tong || 0));
      values.push(fitRow_(row));
    });

    const totalRow = ['TỔNG', '', ''];
    for (let d=1; d<=31; d++) totalRow.push(r.totalsByDay && r.totalsByDay[d] ? r.totalsByDay[d] : '');
    totalRow.push(Number(r.tongSoGio || 0));
    values.push(fitRow_(totalRow));

    sh.clear();
    sh.getRange(1, 1, values.length, colCount).setValues(values);

    try {
      sh.getRange(1,1,1,colCount).merge().setFontWeight('bold').setFontSize(16).setHorizontalAlignment('center');
      sh.getRange(3,1,1,colCount).setFontWeight('bold').setBackground('#e8f5ee');
      sh.getRange(values.length,1,1,colCount).setFontWeight('bold').setBackground('#fff4d6');
      sh.setFrozenRows(3);
      sh.autoResizeColumns(1, colCount);
      sh.getRange(4,4,Math.max(values.length-3,1),32).setNumberFormat('0.##');
    } catch(formatErr) {}

    SpreadsheetApp.flush();

    const id = tmp.getId();
    const gid = sh.getSheetId();
    const exportUrl = 'https://docs.google.com/spreadsheets/d/' + id + '/export?format=xlsx&gid=' + gid;
    const resp = UrlFetchApp.fetch(exportUrl, {
      headers: { Authorization: 'Bearer ' + ScriptApp.getOAuthToken() },
      muteHttpExceptions: true
    });

    const code = resp.getResponseCode();
    if (code < 200 || code >= 300) {
      throw new Error('Không tải được file Excel. Mã lỗi: ' + code);
    }

    const blob = resp.getBlob().setName(fileName);

    // Xóa file tạm để Drive không bị đầy. Nếu lỗi thì bỏ qua.
    try { DriveApp.getFileById(id).setTrashed(true); } catch(cleanErr) {}

    return {
      ok:true,
      fileName:fileName,
      mimeType:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      base64:Utilities.base64Encode(blob.getBytes()),
      tongSoNhanVien:r.tongSoNhanVien || 0,
      tongSoGio:r.tongSoGio || 0
    };
  } catch(err) {
    return {ok:false, message:'Không xuất được Excel: ' + (err && err.message ? err.message : String(err))};
  }
}

// Giữ tên hàm cũ để không phá cấu trúc nếu nơi khác còn gọi.
function exportTangCaExcelShare(kieu, boPhan, tuNgay, denNgay, thang){
  return exportTangCaExcelDownload(kieu, boPhan, tuNgay, denNgay, thang);
}

/* GIAO VIEC */
function getDanhSachCongViec(boPhan, vaiTro){
  const data = sh_(SHEET.GV).getDataRange().getDisplayValues();
  const out = [];
  const isQuanLy = txt_(vaiTro).toLowerCase() === 'quản lý' || txt_(vaiTro).toLowerCase() === 'quan ly';
  for (let i=1;i<data.length;i++){
    if (!isQuanLy && txt_(data[i][3]) !== boPhan) continue;
    out.push({
      maCongViec:txt_(data[i][0]), ngayGiao:txt_(data[i][1]), nguoiGiao:txt_(data[i][2]), boPhan:txt_(data[i][3]), toTruong:txt_(data[i][4]),
      tenCongViec:txt_(data[i][5]), noiDung:txt_(data[i][6]), mucDo:txt_(data[i][7]), trangThai:txt_(data[i][8]), hanBaoCao:txt_(data[i][9]), ghiChu:txt_(data[i][12])
    });
  }
  return out.reverse();
}
function saveCongViec(payload){
  if (!txt_(payload.boPhanNhan) || !txt_(payload.toTruongNhan)) throw new Error('Chưa chọn tổ trưởng nhận việc.');
  sh_(SHEET.GV).appendRow([
    taoMa12So(), fmtDate_(new Date()), txt_(payload.nguoiGiao || 'Quản lý'),
    txt_(payload.boPhanNhan), txt_(payload.toTruongNhan), txt_(payload.tenCongViec), txt_(payload.noiDungCongViec),
    txt_(payload.mucDo || 'Bình thường'), 'Chưa bắt đầu', txt_(payload.hanBaoCao), '', '', txt_(payload.ghiChu), ''
  ]);
  return {ok:true, message:'Đã lưu công việc.'};
}


/* LICH SU / XEM LAI DU LIEU DA NHAP */
function getLichSuNhapLieu(ngay, boPhan){
  ngay = normDate_(ngay);
  boPhan = txt_(boPhan);
  const data = sh_(SHEET.CT).getDataRange().getDisplayValues();
  const out = [];
  for (let i=1;i<data.length;i++){
    if (normDate_(data[i][2]) !== ngay) continue;
    if (!sameBp_(data[i][4], boPhan)) continue;
    out.push({
      ngay: normDate_(data[i][2]),
      boPhanBaoCao: txt_(data[i][4]),
      loaiBaoCao: txt_(data[i][5]),
      chiTiet: txt_(data[i][6]),
      maNv: txt_(data[i][7]),
      tenNv: txt_(data[i][8]),
      boPhanGoc: txt_(data[i][9]),
      trangThai: txt_(data[i][10]),
      batDau: txt_(data[i][11]),
      ketThuc: txt_(data[i][12]),
      soGio: txt_(data[i][13]),
      ghiChu: txt_(data[i][17]),
      capNhatLuc: txt_(data[i][18])
    });
  }
  return out.reverse();
}


function getNhanSuTheoBoPhan(boPhan){
  const target = noAccent_(boPhan);
  const data = sh_(SHEET.NS).getDataRange().getDisplayValues();
  const out = [];
  for (let i=1;i<data.length;i++){
    const ma = txt_(data[i][0]);
    const ten = txt_(data[i][1]);
    const bp = txt_(data[i][2]);
    const tt = txt_(data[i][3]);
    if (!ma || !ten || !active_(tt)) continue;
    if (noAccent_(bp) === target) out.push({maNv:ma, tenNv:ten, boPhan:bp, trangThai:tt});
  }
  return out;
}

function getCountsByLoai(ngay, boPhan, loai){
  ngay = normDate_(ngay);
  boPhan = txt_(boPhan);
  loai = txt_(loai);
  const cache = CacheService.getScriptCache();
  const key = cacheKeyV24_('COUNTS', ngay, boPhan, loai);
  const cached = cache.get(key);
  if (cached) {
    try { return JSON.parse(cached); } catch(e) {}
  }

  const data = sh_(SHEET.CT).getDataRange().getDisplayValues();
  const out = {};
  if (loai === LOAI.TANG_CA) {
    out['Tăng ca sáng'] = 0;
    out['Tăng ca trưa'] = 0;
    out['Tăng ca chiều'] = 0;
    out['Tăng ca đột xuất'] = 0;
  }

  for (let i=1;i<data.length;i++){
    if (normDate_(data[i][2]) !== ngay) continue;
    if (txt_(data[i][4]) !== boPhan) continue;
    if (txt_(data[i][5]) !== loai) continue;
    const ct = txt_(data[i][6]);
    out[ct] = (out[ct] || 0) + 1;
  }

  cache.put(key, JSON.stringify(out), 60);
  return out;
}


function doiMatKhau(boPhan, matKhauCu, matKhauMoi){
  boPhan = txt_(boPhan);
  matKhauCu = txt_(matKhauCu);
  matKhauMoi = txt_(matKhauMoi);

  if (!boPhan) throw new Error('Thiếu bộ phận.');
  if (!matKhauCu) throw new Error('Chưa nhập mật khẩu cũ.');
  if (!matKhauMoi) throw new Error('Chưa nhập mật khẩu mới.');
  if (matKhauMoi.length < 6) throw new Error('Mật khẩu mới phải có ít nhất 6 ký tự.');
  if (matKhauCu === matKhauMoi) throw new Error('Mật khẩu mới không được trùng mật khẩu cũ.');

  const s = sh_(SHEET.CONFIG);
  const data = s.getDataRange().getDisplayValues();

  for (let i=1;i<data.length;i++){
    if (txt_(data[i][0]) === boPhan && txt_(data[i][1]) === matKhauCu && active_(data[i][4])){
      s.getRange(i+1, 2).setValue(matKhauMoi);
      return {ok:true, message:'Đã đổi mật khẩu thành công.'};
    }
  }

  throw new Error('Mật khẩu cũ không đúng.');
}


function getBangTangCaThang(thang, boPhan){
  thang = txt_(thang);
  boPhan = txt_(boPhan || 'Tất cả');

  const s = sh_(SHEET.TC_THANG);
  const lastRow = s.getLastRow();
  const lastCol = s.getLastColumn();

  if (lastRow < 2) {
    return {headers: [], rows: [], message: 'Chưa có dữ liệu tăng ca tháng.'};
  }

  const headers = s.getRange(1, 1, 1, lastCol).getDisplayValues()[0].map(txt_);
  const data = s.getRange(2, 1, lastRow - 1, lastCol).getDisplayValues();

  const rows = data.filter(r => {
    const rThang = txt_(r[0]);
    const rBoPhan = txt_(r[1]);
    if (thang && rThang !== thang) return false;
    if (boPhan && boPhan !== 'Tất cả' && rBoPhan !== boPhan) return false;
    return txt_(r[2]) || txt_(r[3]);
  });

  return {
    headers: headers,
    rows: rows,
    message: rows.length ? '' : 'Chưa có dữ liệu tăng ca tháng này.'
  };
}


function getClientCache(boPhan){
  boPhan = txt_(boPhan);
  const bpList = getDanhSachBoPhan();
  const nsData = sh_(SHEET.NS).getDataRange().getDisplayValues();
  const nhanSuAll = [];
  const nhanSuBoPhan = [];
  for (let i=1;i<nsData.length;i++){
    const ma = txt_(nsData[i][0]);
    const ten = txt_(nsData[i][1]);
    const bp = txt_(nsData[i][2]);
    const tt = txt_(nsData[i][3]);
    if (!ma || !ten || !active_(tt)) continue;
    const row = {maNv:ma, tenNv:ten, boPhan:bp, boPhanGoc:bp, trangThai:tt, selected:false};
    nhanSuAll.push(row);
    if (sameBp_(bp, boPhan)) nhanSuBoPhan.push(row);
  }
  return {ok:true, schema:'ERP_V30_9', boPhan:boPhan, boPhanList: bpList, nhanSuAll: nhanSuAll, nhanSuBoPhan: nhanSuBoPhan, loadedAt: fmtTime_(new Date())};
}

function getNhapLieuBundleV309(ngay, boPhan, loaiBaoCao, chiTiet){
  const n = normDate_(ngay);
  const bp = txt_(boPhan);
  const loai = txt_(loaiBaoCao);
  const ct = txt_(chiTiet);
  const items = getChiTietNhapLieu(n, bp, loai, ct);
  const savedAny = items.some(function(x){ return x && x.selected === true; });
  return {ok:true, ngay: n, boPhan: bp, loaiBaoCao: loai, chiTiet: ct, items: items, hasSavedBefore: hasEntrySavedV312_(n, bp, loai, ct) || savedAny, cache: getClientCache(bp)};
}


function getTodayBootstrapV315(boPhan, ngay){
  const n = normDate_(ngay || new Date());
  const bp = txt_(boPhan);
  const loaiTangCa = LOAI.TANG_CA;
  const loaiBienDong = LOAI.BIEN_DONG;
  const loaiVang = LOAI.VANG;
  const tangCaList = ['Tăng ca sáng','Tăng ca trưa','Tăng ca chiều','Tăng ca đột xuất'];
  const bienDongList = ['Công nhân mới','Nghỉ việc','Xin về sớm','Điều động sang tổ khác'];
  const vangList = ['Vắng buổi sáng','Vắng buổi chiều','Vắng cả ngày'];
  const cache = getClientCache(bp);
  const counts = {};
  counts[loaiTangCa] = getCountsByLoai(n, bp, loaiTangCa);
  counts[loaiBienDong] = getCountsByLoai(n, bp, loaiBienDong);
  counts[loaiVang] = getCountsByLoai(n, bp, loaiVang);
  const bundles = {};
  bundles[loaiTangCa] = {};
  bundles[loaiBienDong] = {};
  bundles[loaiVang] = {};
  tangCaList.forEach(function(ct){ bundles[loaiTangCa][ct] = getNhapLieuBundleV309(n, bp, loaiTangCa, ct); });
  bienDongList.forEach(function(ct){ bundles[loaiBienDong][ct] = getNhapLieuBundleV309(n, bp, loaiBienDong, ct); });
  vangList.forEach(function(ct){ bundles[loaiVang][ct] = getNhapLieuBundleV309(n, bp, loaiVang, ct); });
  return {ok:true, ngay:n, boPhan:bp, cache:cache, counts:counts, bundles:bundles, loadedAt:fmtTime_(new Date())};
}

/* ================= V23.5 FAST LOGIN INIT =================
 * Một lần gọi duy nhất trước đăng nhập: màu + danh sách bộ phận.
 * Có cache để lần mở sau không phải đọc lại nhiều sheet.
 */
function getLoginInitFast(){
  const cache = CacheService.getScriptCache();
  const key = 'LOGIN_INIT_FAST_V235';
  const cached = cache.get(key);
  if (cached) {
    try { return JSON.parse(cached); } catch(e) {}
  }

  let primary = '#0f7a43';
  try { primary = setting_('PRIMARY_COLOR','#0f7a43'); } catch(e) {}

  const data = sh_(SHEET.CONFIG).getDataRange().getDisplayValues();
  const rows = [];
  for (let i=1;i<data.length;i++){
    const bp = txt_(data[i][0]);
    if (!bp || !active_(data[i][4])) continue;
    rows.push({boPhan:bp, thuTu:num_(data[i][6]) || 9999});
  }
  rows.sort((a,b)=> a.thuTu-b.thuTu || a.boPhan.localeCompare(b.boPhan,'vi'));

  const out = {
    today: fmtDate_(new Date()),
    nowStr: fmtTime_(new Date()),
    primaryColor: primary,
    boPhanList: rows.map(x=>x.boPhan)
  };
  cache.put(key, JSON.stringify(out), 300);
  return out;
}
function appSetup(){ Object.values(SHEET).forEach(name=>sh_(name)); return 'OK'; }
function installDailyCleanupTrigger(){ return 'Chưa bật dọn dữ liệu trong bản V6.'; }
function cleanupOldData(){ return 'OK'; }


/* ================= V23 API WRAPPER FOR VERCEL FRONTEND =================
 * Giữ nguyên toàn bộ hàm cũ bên trên.
 * Vercel gọi POST tới Web App Apps Script, payload:
 * { action: "tenHam", args: [thamSo1, thamSo2], apiKey: "..." }
 *
 * Bảo mật:
 * - Nếu Script Properties có API_KEY thì request phải gửi đúng apiKey.
 * - Nếu chưa set API_KEY thì hệ thống vẫn chạy để bạn test nhanh.
====================================================================== */

function jsonV23_(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function checkApiKeyV23_(apiKey) {
  const expected = PropertiesService.getScriptProperties().getProperty('API_KEY');
  if (!expected) return true; // chưa cấu hình thì cho phép để test
  return String(apiKey || '') === String(expected);
}

function doPost(e) {
  try {
    const body = e && e.postData && e.postData.contents ? e.postData.contents : '{}';
    const req = JSON.parse(body);
    const action = String(req.action || '').trim();
    const args = Array.isArray(req.args) ? req.args : [];

    if (!checkApiKeyV23_(req.apiKey)) {
      return jsonV23_({ ok: false, error: 'API_KEY không hợp lệ.' });
    }

    const API = {
      appInit: appInit,
      getLoginInitFast: getLoginInitFast,
      getDanhSachBoPhan: getDanhSachBoPhan,
      loginBoPhan: loginBoPhan,
      getDanhSachToTruong: getDanhSachToTruong,
      searchNhanSu: searchNhanSu,
      getThongTinNhanSu: getThongTinNhanSu,
      getBaoCaoTong: getBaoCaoTong,
      saveBaoCaoTong: saveBaoCaoTong,
      getChiTietVang: getChiTietVang,
      getChiTietNhapLieu: getChiTietNhapLieu,
      saveChiTietVang: saveChiTietVang,
      saveNhapLieu: saveNhapLieu,
      getTongQuanNhapLieu: getTongQuanNhapLieu,
      getBaoCaoTongCongTy: getBaoCaoTongCongTy,
      getDanhSachTangCaXemTruoc: getDanhSachTangCaXemTruoc,
      exportTangCaExcelShare: exportTangCaExcelShare,
      getDanhSachCongViec: getDanhSachCongViec,
      saveCongViec: saveCongViec,
      getLichSuNhapLieu: getLichSuNhapLieu,
      getNhanSuTheoBoPhan: getNhanSuTheoBoPhan,
      getCountsByLoai: getCountsByLoai,
      doiMatKhau: doiMatKhau,
      getBangTangCaThang: getBangTangCaThang,
      getClientCache: getClientCache,
      getNhapLieuBundleV309: getNhapLieuBundleV309,
      appSetup: appSetup,
      installDailyCleanupTrigger: installDailyCleanupTrigger,
      cleanupOldData: cleanupOldData,
    };

    if (!action || !API[action]) {
      return jsonV23_({ ok: false, error: 'Action không hợp lệ hoặc chưa được mở API: ' + action });
    }

    const data = API[action].apply(null, args);
    return jsonV23_({ ok: true, data: data });
  } catch (err) {
    return jsonV23_({
      ok: false,
      error: err && err.message ? err.message : String(err),
      stack: err && err.stack ? String(err.stack).slice(0, 1200) : ''
    });
  }
}


/* ================= V30.4 API BRIDGE FOR VERCEL / VITE =================
 * Mục đích: Vercel không dùng được google.script.run, nên mở cổng HTTP API.
 * Hỗ trợ:
 * - POST: { action, args, apiKey }
 * - GET/JSONP: ?action=loginBoPhan&args=[...]&callback=...
 * - Nếu không có action/api thì vẫn mở giao diện Apps Script cũ.
====================================================================== */

function apiMapV304_() {
  return {
    appInit: appInit,
    getLoginInitFast: getLoginInitFast,
    getDanhSachBoPhan: getDanhSachBoPhan,
    loginBoPhan: loginBoPhan,
    getDanhSachToTruong: getDanhSachToTruong,
    searchNhanSu: searchNhanSu,
    getThongTinNhanSu: getThongTinNhanSu,
    getBaoCaoTong: getBaoCaoTong,
    saveBaoCaoTong: saveBaoCaoTong,
    getChiTietVang: getChiTietVang,
    getChiTietNhapLieu: getChiTietNhapLieu,
    saveChiTietVang: saveChiTietVang,
    saveNhapLieu: saveNhapLieu,
    getTongQuanNhapLieu: getTongQuanNhapLieu,
    getBaoCaoTongCongTy: getBaoCaoTongCongTy,
    getDanhSachTangCaXemTruoc: getDanhSachTangCaXemTruoc,
    exportTangCaExcelShare: exportTangCaExcelShare,
    getDanhSachCongViec: getDanhSachCongViec,
    saveCongViec: saveCongViec,
    getLichSuNhapLieu: getLichSuNhapLieu,
    getNhanSuTheoBoPhan: getNhanSuTheoBoPhan,
    getCountsByLoai: getCountsByLoai,
    doiMatKhau: doiMatKhau,
    getBangTangCaThang: getBangTangCaThang,
    getClientCache: getClientCache,
    getNhapLieuBundleV309: getNhapLieuBundleV309,
    appSetup: appSetup,
    installDailyCleanupTrigger: installDailyCleanupTrigger,
    cleanupOldData: cleanupOldData
  };
}

function apiResponseV304_(payload, callback) {
  const text = JSON.stringify(payload);
  if (callback) {
    const safeCallback = String(callback).replace(/[^a-zA-Z0-9_.$]/g, '');
    return ContentService
      .createTextOutput(safeCallback + '(' + text + ');')
      .setMimeType(ContentService.MimeType.JAVASCRIPT);
  }
  return ContentService
    .createTextOutput(text)
    .setMimeType(ContentService.MimeType.JSON);
}

function parseArgsV304_(raw) {
  if (!raw) return [];
  try { return JSON.parse(raw); } catch (e) { return []; }
}

function handleApiV304_(action, args, apiKey, callback) {
  try {
    action = String(action || '').trim();
    args = Array.isArray(args) ? args : [];

    if (!checkApiKeyV23_(apiKey)) {
      return apiResponseV304_({ ok:false, error:'API_KEY không hợp lệ.' }, callback);
    }

    const API = apiMapV304_();
    if (!action || !API[action]) {
      return apiResponseV304_({ ok:false, error:'Action không hợp lệ hoặc chưa được mở API: ' + action }, callback);
    }

    const data = API[action].apply(null, args);
    return apiResponseV304_({ ok:true, data:data }, callback);
  } catch (err) {
    return apiResponseV304_({
      ok:false,
      error: err && err.message ? err.message : String(err),
      stack: err && err.stack ? String(err.stack).slice(0, 1200) : ''
    }, callback);
  }
}

function doGet(e) {
  const p = e && e.parameter ? e.parameter : {};
  if (p.action || p.api === '1') {
    return handleApiV304_(p.action, parseArgsV304_(p.args), p.apiKey, p.callback);
  }
  return HtmlService.createHtmlOutputFromFile('Index')
    .setTitle('Báo cáo nhân sự')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}
