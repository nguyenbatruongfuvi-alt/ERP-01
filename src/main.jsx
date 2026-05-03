import React, { useEffect, useMemo, useState } from 'react'
import { createRoot } from 'react-dom/client'
import './styles.css'

const API_URL = 'https://script.google.com/macros/s/AKfycby0VCyaEdk0BGqFVflht1sGPdgH8uNgHcga1QXzEldTyMQGyqyTnjw_84z01puO6YrqvA/exec'
const API_KEY = ''
const OFFLINE_QUEUE_KEY = 'erp_v30_offline_queue'
const SESSION_KEY = 'erp_v30_session'
const CACHE_KEY = 'erp_v30_client_cache'
const DRAFT_PREFIX = 'erp_v30_draft_v13'
const LOCAL_SAVE_PREFIX = 'erp_v30_local_first_v27'
const PRELOAD_PREFIX = 'erp_v30_today_preload_v28'
const LAST_DEPT_KEY = 'erp_v30_last_department'
const BOOT_KEY = 'erp_v30_boot_init_v18'
const PRELOAD_TTL_MS = 6 * 60 * 60 * 1000
const SMART_REFRESH_MS = 60 * 1000
let SYNC_QUEUE_RUNNING = false

function pad2(n) { return String(n).padStart(2, '0') }

const fallbackDepartments = ['Trộn Đường', 'Đóng Gói', 'Xếp Xoài', 'Ngâm Đường 1', 'Ngâm Đường 2', 'Quản Lý']
const today = () => { const d = new Date(); return `${pad2(d.getDate())}/${pad2(d.getMonth() + 1)}/${d.getFullYear()}` }
const monthNow = () => `${String(new Date().getMonth() + 1).padStart(2, '0')}/${new Date().getFullYear()}`
const timeOptions = Array.from({ length: 48 }, (_, i) => `${String(Math.floor(i / 2)).padStart(2, '0')}:${i % 2 ? '30' : '00'}`)
function calcOvertimeHours(start, end) {
  if (!start || !end) return ''
  const [sh, sm] = start.split(':').map(Number)
  const [eh, em] = end.split(':').map(Number)
  let sMin = sh * 60 + sm
  let eMin = eh * 60 + em
  if (eMin < sMin) eMin += 1440
  return ((eMin - sMin) / 60).toFixed(2)
}

function stripVietnamese(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .trim()
}
function personSearchText(p) {
  return stripVietnamese(`${p?.maNv || p?.ma || ''} ${p?.tenNv || p?.ten || ''} ${p?.boPhanGoc || p?.boPhan || ''}`)
}

const menuGroups = [
  { title: 'BÁO CÁO', items: [{ id: 'bao-cao', icon: '📋', label: 'Báo cáo bộ phận' }, { id: 'tong-cty', icon: '📊', label: 'Báo cáo công ty' }] },
  { title: 'NHẬP LIỆU', items: [{ id: 'tang-ca', icon: '🕒', label: 'Tăng ca' }, { id: 'bien-dong', icon: '👥', label: 'Biến động' }, { id: 'vang', icon: '🧾', label: 'Vắng mặt' }, { id: 'ngay-le', icon: '🗓️', label: 'Đăng ký làm ngày lễ' }, { id: 'giao-viec', icon: '📝', label: 'Giao việc' }] },
  { title: 'TIỆN ÍCH', items: [{ id: 'in-tang-ca', icon: '🖨️', label: 'In báo cáo' }, { id: 'nhan-su', icon: '👤', label: 'Danh sách nhân sự' }, { id: 'tai-khoan', icon: '🔐', label: 'Tài khoản' }] },
]

function markOfflineError(err) {
  const e = err instanceof Error ? err : new Error(String(err || 'Mất kết nối.'))
  e.offline = true
  return e
}
function markServerError(err) {
  const e = err instanceof Error ? err : new Error(String(err || 'Lỗi máy chủ.'))
  e.offline = false
  return e
}

function apiJsonp(action, args = []) {
  return new Promise((resolve, reject) => {
    const callbackName = 'erpV30Cb_' + Date.now() + '_' + Math.random().toString(36).slice(2)
    const script = document.createElement('script')
    const params = new URLSearchParams({
      api: '1',
      action,
      args: JSON.stringify(args),
      apiKey: API_KEY,
      callback: callbackName,
      t: String(Date.now()),
    })

    const timer = window.setTimeout(() => {
      cleanup()
      reject(navigator.onLine ? markServerError('Không nhận được phản hồi từ Apps Script.') : markOfflineError('Mất mạng.'))
    }, 30000)

    function cleanup() {
      window.clearTimeout(timer)
      try { delete window[callbackName] } catch {}
      if (script.parentNode) script.parentNode.removeChild(script)
    }

    window[callbackName] = (json) => {
      cleanup()
      if (!json || !json.ok) reject(markServerError(json?.error || 'Apps Script trả lỗi.'))
      else resolve(json.data)
    }

    script.onerror = () => {
      cleanup()
      reject(navigator.onLine ? markServerError('Không tải được Apps Script API. Kiểm tra deploy Anyone.') : markOfflineError('Mất mạng.'))
    }
    script.src = API_URL + '?' + params.toString()
    document.body.appendChild(script)
  })
}

async function api(action, args = []) {
  if (!navigator.onLine) throw markOfflineError('Máy đang offline thật.')

  // V30.33: dùng JSONP trước để tránh CORS/preflight của Google Apps Script trên Vercel.
  // POST chỉ là fallback cho môi trường nội bộ; trình duyệt có thể chặn CORS nên không gọi POST trước nữa.
  try {
    return await apiJsonp(action, args)
  } catch (jsonpError) {
    if (jsonpError && jsonpError.offline) throw jsonpError

    try {
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8', 'Cache-Control': 'no-cache' },
        body: JSON.stringify({ action, args, apiKey: API_KEY }),
        redirect: 'follow',
      })
      const json = await res.json()
      if (!json.ok) throw markServerError(json.error || 'Apps Script trả lỗi.')
      return json.data
    } catch (postError) {
      throw markServerError(jsonpError?.message || postError?.message || 'API lỗi.')
    }
  }
}
function readJson(key, fallback) { try { return JSON.parse(localStorage.getItem(key) || '') || fallback } catch { return fallback } }
function writeJson(key, value) { localStorage.setItem(key, JSON.stringify(value)) }
function clearJson(key) { localStorage.removeItem(key) }
function preloadKeyFor(boPhan, ngay = today()) { return `${PRELOAD_PREFIX}_${ngay}_${boPhan}` }
function loaiForType(type) { return type === 'Vắng mặt' ? 'Báo cáo vắng' : type === 'Biến động' ? 'Biến động nhân sự' : type }
function getPreloadedToday(boPhan) { return readJson(preloadKeyFor(boPhan), null) }
function setPreloadedToday(boPhan, data) { if (boPhan && data) writeJson(preloadKeyFor(boPhan, data.ngay || today()), { ...data, cachedAt: Date.now() }) }
function isFreshPreload(data) { return !!(data && data.ngay === today() && Date.now() - Number(data.cachedAt || 0) < PRELOAD_TTL_MS) }
function applyPreloadToCache(boPhan, data) {
  if (!data) return null
  const cache = data.cache || readJson(CACHE_KEY, null) || {}
  const merged = { ...cache, today: data, nhanSuBoPhan: data.cache?.nhanSuBoPhan || cache.nhanSuBoPhan || [] }
  writeJson(CACHE_KEY, merged)
  if (boPhan) writeJson(LAST_DEPT_KEY, boPhan)
  return merged
}
async function refreshTodayData(boPhan) {
  if (!boPhan || !navigator.onLine) return getPreloadedToday(boPhan)
  try {
    const data = await api('getTodayBootstrapV318', [boPhan, today()])
    setPreloadedToday(boPhan, data)
    applyPreloadToCache(boPhan, data)
    return data
  } catch {
    try {
      const cache = await api('getClientCache', [boPhan])
      const data = { ngay: today(), boPhan, cache, counts: {}, bundles: {}, loadedAt: new Date().toISOString() }
      setPreloadedToday(boPhan, data)
      applyPreloadToCache(boPhan, data)
      return data
    } catch { return getPreloadedToday(boPhan) }
  }
}
async function preloadTodayData(boPhan, opts = {}) {
  if (!boPhan) return null
  const cached = getPreloadedToday(boPhan)
  if (cached && (!opts.force || isFreshPreload(cached))) {
    if (opts.background !== false && navigator.onLine) refreshTodayData(boPhan).catch(() => {})
    return cached
  }
  if (!navigator.onLine) return cached
  return refreshTodayData(boPhan)
}
function localKey(kind, parts = []) { return `${LOCAL_SAVE_PREFIX}_${kind}_${parts.filter(Boolean).join('_')}` }
function loginCacheKey(boPhan) { return localKey('login_cache', [stripVietnamese(boPhan || '')]) }
function saveLoginCache(boPhan, password, session, cacheData, preloadData) {
  if (!boPhan || !session) return
  writeJson(loginCacheKey(boPhan), {
    boPhan,
    password: String(password || ''),
    session,
    cache: cacheData || null,
    preload: preloadData || null,
    savedAt: new Date().toISOString()
  })
}
function readLoginCache(boPhan) { return readJson(loginCacheKey(boPhan), null) }
function queueSave(action, args, meta = {}) {
  const q = readJson(OFFLINE_QUEUE_KEY, [])
  const requestId = meta.requestId || args?.[0]?.requestId || Date.now() + '-' + Math.random().toString(16).slice(2)
  const exists = q.some(x => x.requestId === requestId || x.id === requestId)
  if (!exists) q.push({ id: requestId, requestId, action, args, status: 'pending', tries: 0, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), meta })
  writeJson(OFFLINE_QUEUE_KEY, q)
  window.dispatchEvent(new Event('erp-queue-change'))
  return q.length
}
function updateQueuedItem(id, patch) {
  const q = readJson(OFFLINE_QUEUE_KEY, [])
  writeJson(OFFLINE_QUEUE_KEY, q.map(x => (x.id === id || x.requestId === id) ? { ...x, ...patch, updatedAt: new Date().toISOString() } : x))
  window.dispatchEvent(new Event('erp-queue-change'))
}
async function syncQueue() {
  let q = readJson(OFFLINE_QUEUE_KEY, [])
  if (!q.length || !navigator.onLine) return 0
  if (SYNC_QUEUE_RUNNING) return 0
  SYNC_QUEUE_RUNNING = true
  let synced = 0
  const remain = []
  try {
    for (const item of q) {
      try {
        updateQueuedItem(item.id, { status: 'syncing', tries: Number(item.tries || 0) + 1 })
        await api(item.action, item.args)
        synced += 1
      } catch (e) {
        remain.push({ ...item, status: 'error', error: e?.message || 'Chưa đồng bộ được', tries: Number(item.tries || 0) + 1, updatedAt: new Date().toISOString() })
      }
    }
    writeJson(OFFLINE_QUEUE_KEY, remain)
    window.dispatchEvent(new Event('erp-queue-change'))
    if (synced > 0) {
      const lastDept = readJson(LAST_DEPT_KEY, '')
      if (lastDept) refreshTodayData(lastDept).catch(() => {})
      if (lastDept) smartRefreshCompanyReport(lastDept, { force: true }).catch(() => {})
    }
    return synced
  } finally {
    SYNC_QUEUE_RUNNING = false
  }
}
function getLocalCount(boPhan, loai, title) {
  const pre = getPreloadedToday(boPhan)
  return Number(pre?.counts?.[loai]?.[title] || 0)
}
function saveLocalNhapLieu(session, type, title, payload) {
  const loai = payload.loaiBaoCao || loaiForType(type)
  const old = getPreloadedToday(session.boPhan) || { ngay: today(), boPhan: session.boPhan, counts: {}, bundles: {}, cache: readJson(CACHE_KEY, null) || {} }
  old.counts = old.counts || {}; old.counts[loai] = old.counts[loai] || {}
  old.counts[loai][title] = (payload.items || []).length
  old.bundles = old.bundles || {}; old.bundles[loai] = old.bundles[loai] || {}
  old.bundles[loai][title] = {
    hasSavedBefore: true,
    items: (payload.items || []).map(x => ({ ...x, selected: true, batDau: payload.batDau || '', ketThuc: payload.ketThuc || '', soGio: payload.soGio || '' })),
    batDau: payload.batDau || '', ketThuc: payload.ketThuc || '', soGio: payload.soGio || '',
    localOnly: true, savedAt: new Date().toISOString()
  }
  setPreloadedToday(session.boPhan, old)
  applyPreloadToCache(session.boPhan, old)
  writeJson(localKey('nhaplieu', [today(), session.boPhan, type, title]), payload)
}

function saveLocalBaoCaoTong(session, payload) {
  const key = localKey('bao_cao_tong', [payload.ngay, session.boPhan])
  writeJson(key, { ...payload, localOnly: true, savedAt: new Date().toISOString() })
  const old = getPreloadedToday(session.boPhan) || { ngay: today(), boPhan: session.boPhan, counts: {}, bundles: {}, cache: readJson(CACHE_KEY, null) || {} }
  old.baoCaoTong = { ...(old.baoCaoTong || {}), [session.boPhan]: payload }
  setPreloadedToday(session.boPhan, old)
  applyPreloadToCache(session.boPhan, old)
}
function saveLocalGiaoViec(session, payload) {
  const key = localKey('giaoviec_view', [payload.giaoChoBoPhan || session.boPhan])
  const list = readJson(key, [])
  writeJson(key, [{ ...payload, localOnly: true, synced: false }, ...list.filter(x => x.requestId !== payload.requestId)])
  writeJson(localKey('giaoviec_sent', [session.boPhan]), [{ ...payload, localOnly: true, synced: false }, ...readJson(localKey('giaoviec_sent', [session.boPhan]), []).filter(x => x.requestId !== payload.requestId)].slice(0, 200))
}


// =========================
// V30.34 COMPANY REPORT CACHE FIX
// Đọc mọi cache cũ/mới theo cùng 1 chuẩn để Báo cáo công ty mở ra ngay, không chờ API.
// =========================
const UNIFIED_COMPANY_CACHE_KEY = 'erp_v30_unified_cache_v32'
const COMPANY_CACHE_TTL_MS = 5 * 60 * 1000
function normalizeCompanyReport(value) {
  if (!value) return null
  const data = value.data && value.data.rows ? value.data : value
  if (!data || !Array.isArray(data.rows)) return null
  return {
    ...data,
    tongCN: Number(data.tongCN || data.TONG_CN || 0),
    coMat: Number(data.coMat || data.CO_MAT || 0),
    vangSang: Number(data.vangSang || data.VANG_SANG || data.vangBuoiSang || 0),
    vangChieu: Number(data.vangChieu || data.VANG_CHIEU || data.vangBuoiChieu || 0),
    vangCaNgay: Number(data.vangCaNgay || data.VANG_CA_NGAY || 0),
    rows: data.rows || []
  }
}
function findCompanyReportDeep(value, depth = 0) {
  if (!value || depth > 5) return null
  const direct = normalizeCompanyReport(value)
  if (direct) return direct
  if (Array.isArray(value)) return null
  if (typeof value !== 'object') return null
  const preferredKeys = ['baoCaoCongTy', 'companyReport', 'bao_cao_cong_ty', 'reportCompany', 'data', 'today', 'cache', 'departments']
  for (const key of preferredKeys) {
    if (value[key]) {
      const found = findCompanyReportDeep(value[key], depth + 1)
      if (found) return found
    }
  }
  for (const key of Object.keys(value)) {
    if (preferredKeys.includes(key)) continue
    const found = findCompanyReportDeep(value[key], depth + 1)
    if (found) return found
  }
  return null
}
function findCompanyReportCache(ngay = today()) {
  const candidates = [
    UNIFIED_COMPANY_CACHE_KEY,
    localKey('bao_cao_cong_ty', [ngay]),
    `${LOCAL_SAVE_PREFIX}_bao_cao_cong_ty_${ngay}`,
    `${LOCAL_SAVE_PREFIX}_bao_cao_cong_ty_${ngay.replaceAll('/', '-')}`,
    CACHE_KEY,
  ]
  for (const key of candidates) {
    const raw = readJson(key, null)
    const found = findCompanyReportDeep(raw)
    if (found) return { data: found, key, cachedAt: Number(raw?.cachedAt || raw?.lastSync || raw?.updatedAt || 0) || 0 }
  }
  // Fallback: quét toàn bộ localStorage để tương thích các bản cũ đã từng lưu bằng tên key khác.
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (!key || !key.includes('erp_v30')) continue
    const raw = readJson(key, null)
    const found = findCompanyReportDeep(raw)
    if (found) return { data: found, key, cachedAt: Number(raw?.cachedAt || raw?.lastSync || raw?.updatedAt || 0) || 0 }
  }
  return null
}
function saveCompanyReportCache(data, ngay = today(), boPhan = '') {
  const report = normalizeCompanyReport(data)
  if (!report) return
  const cachedAt = Date.now()
  writeJson(localKey('bao_cao_cong_ty', [ngay]), { data: report, cachedAt })

  const unified = readJson(UNIFIED_COMPANY_CACHE_KEY, { version: 34, departments: {}, lastSync: 0 }) || { version: 34, departments: {}, lastSync: 0 }
  const deptKey = stripVietnamese(boPhan || readJson(LAST_DEPT_KEY, '') || 'cong_ty') || 'cong_ty'
  unified.version = 34
  unified.lastSync = cachedAt
  unified.companyReport = report
  unified.baoCaoCongTy = report
  unified.departments = unified.departments || {}
  unified.departments[deptKey] = {
    ...(unified.departments[deptKey] || {}),
    boPhan: boPhan || readJson(LAST_DEPT_KEY, '') || '',
    today: {
      ...((unified.departments[deptKey] || {}).today || {}),
      ngay,
      baoCaoCongTy: report,
      companyReport: report,
      cachedAt,
    }
  }
  writeJson(UNIFIED_COMPANY_CACHE_KEY, unified)
}
async function smartRefreshCompanyReport(boPhan = '', opts = {}) {
  if (!navigator.onLine) return findCompanyReportCache(today())?.data || null
  const local = findCompanyReportCache(today())
  const isFresh = local?.cachedAt && Date.now() - Number(local.cachedAt || 0) < COMPANY_CACHE_TTL_MS
  if (local?.data && isFresh && !opts.force) return local.data
  const data = await api('getBaoCaoTongCongTy', [today()])
  const next = normalizeCompanyReport(data)
  if (next) {
    saveCompanyReportCache(next, today(), boPhan || readJson(LAST_DEPT_KEY, ''))
    window.dispatchEvent(new CustomEvent('erp-company-report-updated', { detail: next }))
  }
  return next
}
function queueSummary() {
  const q = readJson(OFFLINE_QUEUE_KEY, [])
  const error = q.filter(x => x.status === 'error').length
  const syncing = q.filter(x => x.status === 'syncing').length
  const pending = q.length - error - syncing
  return { total: q.length, pending, syncing, error }
}
function networkStateText() {
  const q = queueSummary()
  if (!q.total) return 'Đã đồng bộ'
  if (q.error) return `Chờ đồng bộ: ${q.total} / lỗi: ${q.error}`
  return `Chờ đồng bộ: ${q.total}`
}

function MenuContent({ onSelect, syncCount, onLogout }) {
  return <div className="menu-content">
    {menuGroups.map(group => <div key={group.title}>
      <div className="section-title">{group.title}</div>
      {group.items.map(item => <div className="menu-item" key={item.id} onClick={() => onSelect(item.id)}><span className="menu-icon">{item.icon}</span><span>{item.label}</span></div>)}
    </div>)}
    {onLogout && <button className="logout-button" onClick={onLogout}>↩ Đăng xuất / Đăng nhập lại</button>}
    <div className="retention">Dữ liệu lưu trên máy trước<br /><b>45 ngày gần nhất</b>{syncCount > 0 && <><br /><b>{networkStateText()}</b></>}</div>
  </div>
}

function LoginScreen({ departments, setSession, setDepartments, setCache }) {
  const [department, setDepartment] = useState(() => readJson(LAST_DEPT_KEY, ''))
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [msg, setMsg] = useState('')
  const [busy, setBusy] = useState(false)
  const [preloading, setPreloading] = useState(false)

  useEffect(() => {
    const boot = readJson(BOOT_KEY, null)
    if (boot?.boPhanList?.length) setDepartments(boot.boPhanList)
    api('getLoginInitFast').then(r => {
      writeJson(BOOT_KEY, r)
      setDepartments(r.boPhanList || fallbackDepartments)
    }).catch(() => {})
  }, [])

  useEffect(() => {
    if (!department) return
    let alive = true
    const cached = getPreloadedToday(department)
    if (cached?.cache) {
      const merged = applyPreloadToCache(department, cached)
      if (merged) setCache(merged)
      setMsg('✅ Đã có dữ liệu lưu trên điện thoại. Đăng nhập sẽ vào nhanh.')
    } else {
      setMsg('⏳ Đang tải sẵn dữ liệu bộ phận...')
    }
    setPreloading(!cached)
    preloadTodayData(department).then(data => {
      if (!alive) return
      const merged = applyPreloadToCache(department, data)
      if (merged) setCache(merged)
      setMsg(data ? '✅ Đã tải sẵn dữ liệu hôm nay. Có thể đăng nhập.' : '⚠️ Chưa tải được dữ liệu, vẫn có thể đăng nhập nếu mạng ổn.')
    }).catch(() => {
      if (!alive) return
      setMsg(cached ? '✅ Đang dùng dữ liệu đã lưu trên điện thoại.' : '⚠️ Chưa tải được dữ liệu bộ phận.')
    }).finally(() => { if (alive) setPreloading(false) })
    return () => { alive = false }
  }, [department])

  async function doLogin() {
    if (!department) { setMsg('Vui lòng chọn bộ phận.'); return }
    if (busy) return
    setBusy(true); setMsg(navigator.onLine ? '⏳ Đang đăng nhập và nạp dữ liệu vào máy...' : '📴 Máy đang offline: đang mở dữ liệu đã lưu...')
    try {
      let preload = getPreloadedToday(department)
      const cachedSession = readJson(SESSION_KEY, null)
      const cachedCache = readJson(CACHE_KEY, null)

      // OFFLINE-FIRST LOGIN: ưu tiên cache đăng nhập riêng theo bộ phận.
      // Đã từng đăng nhập online bộ phận nào thì bộ phận đó vẫn đăng nhập offline được,
      // kể cả sau khi bấm Đăng xuất / Đăng nhập lại.
      if (!navigator.onLine) {
        const loginCache = readLoginCache(department)
        const sameDeptSession = cachedSession && String(cachedSession.boPhan || '') === String(department || '')
        const passwordOk = loginCache ? String(loginCache.password || '') === String(password || '') : sameDeptSession
        const offlineSession = loginCache?.session || (sameDeptSession ? cachedSession : null)
        const offlineCache = loginCache?.cache || cachedCache
        const offlinePreload = loginCache?.preload || preload
        if (offlineSession && passwordOk) {
          if (offlinePreload) applyPreloadToCache(department, offlinePreload)
          if (offlineCache) setCache(offlineCache)
          writeJson(SESSION_KEY, offlineSession)
          writeJson(LAST_DEPT_KEY, department)
          setMsg('✅ Đã đăng nhập offline bằng dữ liệu lưu trên máy.')
          setSession({ ...offlineSession, offlineMode: true, todayPreloaded: !!offlinePreload })
        } else if (offlineSession && !passwordOk) {
          setMsg('❌ Mật khẩu offline không đúng với lần đăng nhập đã lưu.')
        } else {
          setMsg('❌ Máy đang offline. Hãy đăng nhập online bộ phận này 1 lần để lưu dữ liệu offline.')
        }
        setBusy(false)
        return
      }

      if (!preload?.cache) {
        setMsg('⏳ Lần đầu đăng nhập: đang tải dữ liệu bộ phận về điện thoại...')
        preload = await preloadTodayData(department, { background: false })
      } else {
        preloadTodayData(department).catch(() => {})
      }
      const merged = applyPreloadToCache(department, preload)
      if (merged) setCache(merged)
      const info = await api('loginBoPhan', [department, password])
      const session = { ...info, todayPreloaded: !!preload, loggedAt: Date.now() }
      writeJson(SESSION_KEY, session)
      writeJson(LAST_DEPT_KEY, department)
      saveLoginCache(department, password, session, merged, preload)
      api('getBaoCaoTongCongTy', [today()]).then(r => saveCompanyReportCache(r, today(), department)).catch(() => {})
      setSession(session)
    } catch (e) { setMsg(e.message || 'Đăng nhập lỗi.') }
    setBusy(false)
  }
  function chooseDepartment(value) { setDepartment(value); setPassword(''); if (value) writeJson(LAST_DEPT_KEY, value) }
  return <main className="login-screen">
    <div className="login-logo-slot"><img className="login-logo-img" src="/logo-ph.png" alt="Nhà Phúc Hậu" /></div>
    <div className="login-brand login-brand-centered"><span>Quản lý sản xuất</span></div>
    <label className="form-label">Bộ phận</label>
    <select className="form-control" value={department} autoComplete="off" onChange={e => chooseDepartment(e.target.value)}><option value="">-- Chọn bộ phận --</option>{departments.map(name => <option key={name} value={name}>{name}</option>)}</select>
    <label className="form-label">Mật khẩu</label>
    <div className="password-wrap">
      <input className="form-control password-input" type={showPass ? 'text' : 'password'} name="erp_login_passcode" autoComplete="new-password" autoCorrect="off" autoCapitalize="off" spellCheck={false} placeholder="Nhập mật khẩu" value={password} onChange={e => setPassword(e.target.value)} onKeyDown={e => e.key === 'Enter' && doLogin()} />
      <button type="button" className="eye-button" onClick={() => setShowPass(v => !v)} aria-label={showPass ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}>{showPass ? '🙈' : '👁'}</button>
    </div>
    <div style={{ height: 24 }} /><button className="primary-button" style={{ height: 56, fontSize: 22 }} disabled={busy} onClick={doLogin}>{busy ? 'Đang nạp dữ liệu...' : preloading ? 'Đăng nhập khi dữ liệu đang tải' : 'Đăng nhập'}</button>
    {msg && <div className={`msg ${msg.includes('✅') || msg.includes('⏳') ? 'ok' : 'err'}`}>{msg}</div>}
  </main>
}
function HomeScreen({ onSelect, syncCount, session, onLogout }) {
  return <>
    <AppHeader session={session} onMenu={() => {}} />
    <main className="home-screen home-screen-with-header"><MenuContent onSelect={onSelect} syncCount={syncCount} onLogout={onLogout} /></main>
  </>
}
function AppHeader({ session, onMenu }) { return <header className="app-header"><button className="icon-button" onClick={onMenu}>☰</button><div className="header-center"><div className="header-title">Quản lý sản xuất</div><div className="header-sub">{session?.tenToTruong || 'Nguyễn Thị Diễm'} · TT: {session?.boPhan || ''}</div></div></header> }
function SideMenu({ open, onClose, onSelect, syncCount, onLogout }) { return <><aside className={`side-menu ${open ? 'open' : ''}`}><div className="side-brand"><span>Quản lý sản xuất</span></div><MenuContent onSelect={onSelect} syncCount={syncCount} onLogout={onLogout} /></aside><div className={`backdrop ${open ? 'show' : ''}`} onClick={onClose} /></> }
function Chrome({ setScreen, session, children, syncCount, onLogout }) { return <><AppHeader session={session} onMenu={() => setScreen('home')} /><main className="page">{children}</main></> }
function Status({ text, ok = true }) { return text ? <div className={`msg ${ok ? 'ok' : 'err'}`}>{text}</div> : null }
function saveStateFromMsg(msg, saving) {
  const text = String(msg || '')
  if (saving || text.includes('Đang lưu') || text.includes('Đang đồng bộ') || text.includes('Đang tạo')) return 'saving'
  if (text.includes('CHƯA LƯU') || text.includes('Chưa') || text.includes('Lỗi') || text.includes('lỗi') || text.includes('❌')) return 'error'
  if (text.includes('Offline') || text.includes('offline') || text.includes('chờ đồng bộ') || text.includes('lưu tạm') || text.includes('Sẽ tự đồng bộ')) return 'offline'
  if (text.includes('ĐÃ ĐỒNG BỘ') || text.includes('THÀNH CÔNG') || text.includes('ĐÃ LƯU') || text.includes('Đã lưu')) return 'saved'
  return 'idle'
}
function saveButtonClass(base, msg, saving) { return `${base} save-state-${saveStateFromMsg(msg, saving)}` }
function BootSplash({ text = 'Đang tải dữ liệu gốc...' }) {
  return <main className="boot-screen"><div className="boot-card"><img className="boot-logo" src="/logo-ph.png" alt="Nhà Phúc Hậu" /><div className="boot-title">Quản lý sản xuất</div><div className="boot-spinner" /><div className="boot-text">{text}</div></div></main>
}

function ReportScreen({ session }) {
  const [data, setData] = useState(null), [form, setForm] = useState({ tongCongNhan: '', coMat: '', ghiChu: '' }), [msg, setMsg] = useState('')
  const [saving, setSaving] = useState(false)
  useEffect(() => { const local = readJson(localKey('bao_cao_tong', [today(), session.boPhan]), null); if (local) { setForm({ tongCongNhan: local.tongCongNhan || '', coMat: local.coMat || '', ghiChu: local.ghiChu || '' }); setMsg('Đang hiển thị dữ liệu đã lưu trên máy.') } api('getBaoCaoTong', [today(), session.boPhan]).then(r => { setData(r); if (!local) setForm({ tongCongNhan: r.TONG_CONG_NHAN || '', coMat: r.CO_MAT || '', ghiChu: r.GHI_CHU || '' }) }).catch(e => { if (!local) setMsg(e.message) }) }, [session.boPhan])
  const rows = [['Tổng công nhân', form.tongCongNhan || 0, 'var(--color-blue)'], ['Có mặt', form.coMat || 0, 'var(--color-green)'], ['Vắng sáng', data?.VANG_BUOI_SANG || 0, 'var(--color-orange)'], ['Vắng chiều', data?.VANG_BUOI_CHIEU || 0, 'var(--color-orange)'], ['Vắng cả ngày', data?.VANG_CA_NGAY || 0, 'var(--color-red)']]
  async function save() {
    if (saving) return
    const requestId = `bc_${Date.now()}_${Math.random().toString(16).slice(2)}`
    const payload = { requestId, ngay: today(), boPhan: session.boPhan, toTruong: session.tenToTruong, tongCongNhan: form.tongCongNhan, coMat: form.coMat, ghiChu: form.ghiChu }
    setSaving(true)
    saveLocalBaoCaoTong(session, payload)
    const n = queueSave('saveBaoCaoTong', [payload], { requestId, screen: 'bao-cao' })
    setMsg(`💾 ĐÃ LƯU TRÊN MÁY. Đang đồng bộ nền (${n}).`)
    setSaving(false)
    if (navigator.onLine) syncQueue().then(() => {
      const left = readJson(OFFLINE_QUEUE_KEY, []).length
      setMsg(left ? `💾 Đã lưu trên máy. Còn ${left} mục chờ đồng bộ.` : '✅ ĐÃ ĐỒNG BỘ THÀNH CÔNG')
    }).catch(() => setMsg('💾 Đã lưu trên máy. Sẽ tự đồng bộ khi mạng ổn.'))
  }
  return <div className="card">{rows.map(([label, number, color]) => <div className="kpi-row" key={label}><div className="kpi-label">{label}</div><div className="kpi-number" style={{ color }}>{number}</div></div>)}
    <label className="field-label">Tổng công nhân</label><input className="form-control form-control-sm" value={form.tongCongNhan} onChange={e => setForm({ ...form, tongCongNhan: e.target.value })} />
    <label className="field-label">Có mặt</label><input className="form-control form-control-sm" value={form.coMat} onChange={e => setForm({ ...form, coMat: e.target.value })} />
    <label className="field-label">Ghi chú</label><input className="form-control form-control-sm" value={form.ghiChu} onChange={e => setForm({ ...form, ghiChu: e.target.value })} />
    <div style={{ height: 12 }} /><button className={saveButtonClass("primary-button", msg, saving)} disabled={saving} onClick={save}>{saving ? 'Đang lưu...' : msg.includes('ĐÃ LƯU') ? 'Đã lưu xong' : msg.includes('CHƯA LƯU') ? 'Lưu lại' : 'Nhập / Cập nhật báo cáo'}</button><Status text={msg} />
  </div>
}
function CompanyScreen({ session }) {
  const defaultCompanyData = { rows: [], tongCN: 0, coMat: 0, vangSang: 0, vangChieu: 0, vangCaNgay: 0 }
  const initialCache = findCompanyReportCache(today())
  const [data, setData] = useState(() => initialCache?.data || defaultCompanyData)
  const [msg, setMsg] = useState(() => initialCache?.data ? '⚡ Đang hiển thị dữ liệu đã lưu trên máy.' : '')
  useEffect(() => {
    const loadLocal = () => {
      const local = findCompanyReportCache(today())
      if (local?.data) {
        setData(local.data)
        setMsg('⚡ Đang hiển thị dữ liệu đã lưu trên máy.')
      }
      return local
    }
    const local = loadLocal()
    const onUpdated = (event) => {
      if (event?.detail) {
        setData(event.detail)
        setMsg('✅ Đã cập nhật báo cáo công ty.')
      } else {
        loadLocal()
      }
    }
    window.addEventListener('erp-company-report-updated', onUpdated)

    if (!navigator.onLine) {
      if (!local?.data) setMsg('Máy đang offline. Chưa có dữ liệu báo cáo công ty lưu trên máy.')
      return () => window.removeEventListener('erp-company-report-updated', onUpdated)
    }

    smartRefreshCompanyReport(session?.boPhan || readJson(LAST_DEPT_KEY, '')).catch(e => { if (!local?.data) setMsg(e.message) })
    const onFocus = () => smartRefreshCompanyReport(session?.boPhan || readJson(LAST_DEPT_KEY, '')).catch(() => {})
    const onOnline = () => smartRefreshCompanyReport(session?.boPhan || readJson(LAST_DEPT_KEY, ''), { force: true }).catch(() => {})
    window.addEventListener('focus', onFocus)
    window.addEventListener('online', onOnline)
    const t = setInterval(() => smartRefreshCompanyReport(session?.boPhan || readJson(LAST_DEPT_KEY, '')).catch(() => {}), SMART_REFRESH_MS)
    return () => {
      window.removeEventListener('erp-company-report-updated', onUpdated)
      window.removeEventListener('focus', onFocus)
      window.removeEventListener('online', onOnline)
      clearInterval(t)
    }
  }, [session?.boPhan])
  const totals = [['Tổng công nhân', data.tongCN || 0, 'var(--color-blue)'], ['Có mặt', data.coMat || 0, 'var(--color-green)'], ['Vắng buổi sáng', data.vangSang || 0, 'var(--color-orange)'], ['Vắng buổi chiều', data.vangChieu || 0, 'var(--color-orange)'], ['Vắng cả ngày', data.vangCaNgay || 0, 'var(--color-red)']]
  return <><div className="summary-kpi-card"><div className="summary-kpi-grid">{totals.map(([label, value, color]) => <div className="summary-kpi" key={label}><div className="summary-kpi-label">{label}</div><div className="summary-kpi-number" style={{ color }}>{value}</div></div>)}</div></div>
    <div className="summary-table-card"><div className="summary-title">Tổng hợp bộ phận</div><div className="table-scroll"><table className="summary-table"><thead><tr><th>STT</th><th>Bộ phận</th><th>Tổ trưởng</th><th>Tổng CN</th><th>Có mặt</th><th>Vắng sáng</th><th>Vắng chiều</th><th>Vắng cả ngày</th></tr></thead><tbody>{(data.rows || []).map((r, i) => <tr key={r.boPhan || i}><td>{i + 1}</td><td>{r.boPhan}</td><td>{r.toTruong}</td><td>{r.tongCongNhan}</td><td className="text-green">{r.coMat}</td><td className="text-orange">{r.vangBuoiSang}</td><td className="text-orange">{r.vangBuoiChieu}</td><td className="text-red">{r.vangCaNgay}</td></tr>)}</tbody></table></div><Status text={msg} ok={!msg.includes('offline') && !msg.includes('lỗi')} /></div></>
}
function useStaff(session, cache) {
  const preload = session?.boPhan ? getPreloadedToday(session.boPhan) : null
  const cachedStaff = cache?.nhanSuBoPhan || preload?.cache?.nhanSuBoPhan || []
  const [staff, setStaff] = useState(cachedStaff)
  useEffect(() => {
    const rows = cache?.nhanSuBoPhan || getPreloadedToday(session.boPhan)?.cache?.nhanSuBoPhan || []
    if (rows.length) setStaff(rows)
  }, [cache, session.boPhan])
  useEffect(() => {
    if ((cache?.nhanSuBoPhan || []).length) return
    preloadTodayData(session.boPhan, { background: false }).then(data => {
      const rows = data?.cache?.nhanSuBoPhan || []
      if (rows.length) setStaff(rows)
    }).catch(() => {})
  }, [session.boPhan])
  return staff
}
function DataEntryScreen({ type, items, session, cache }) {
  const staff = useStaff(session, cache)
  const loai = loaiForType(type)
  const preload = cache?.today?.boPhan === session.boPhan ? cache.today : getPreloadedToday(session.boPhan)
  const [counts, setCounts] = useState(() => preload?.counts?.[loai] || {})
  const [open, setOpen] = useState(null)
  useEffect(() => {
    const pre = getPreloadedToday(session.boPhan)
    if (pre?.counts?.[loai]) setCounts(pre.counts[loai])
    api('getCountsByLoai', [today(), session.boPhan, loai]).then(setCounts).catch(() => {})
  }, [type, session.boPhan])
  function refreshCounts() {
    const pre = getPreloadedToday(session.boPhan)
    if (pre?.counts?.[loai]) setCounts(pre.counts[loai])
    api('getCountsByLoai', [today(), session.boPhan, loai]).then(c => {
      setCounts(c)
      const old = getPreloadedToday(session.boPhan) || { ngay: today(), boPhan: session.boPhan, counts: {}, bundles: {} }
      old.counts = { ...(old.counts || {}), [loai]: c }
      setPreloadedToday(session.boPhan, old)
    }).catch(() => {})
  }
  return <><div className="card">{items.map(item => <div className="tile-card" key={item} onClick={() => setOpen(item)}><div className="tile-title">{item}</div><div className="tile-sub">SL: {counts[item] || 0} người</div></div>)}</div>{open && <PickModal title={open} type={type} staff={staff} session={session} cache={cache} onClose={() => setOpen(null)} onSaved={refreshCounts} />}</>
}
function draftKeyFor(session, type, title) {
  return `${DRAFT_PREFIX}_${today()}_${session.boPhan}_${type}_${title}`
}
function normalizeRow(row) {
  return {
    maNv: row.maNv || row.ma || '',
    tenNv: row.tenNv || row.ten || '',
    boPhan: row.boPhan || row.boPhanGoc || '',
    boPhanGoc: row.boPhanGoc || row.boPhan || '',
    trangThai: row.trangThai || '',
    selected: row.selected === true,
    outside: row.outside === true,
    batDau: row.batDau || '',
    ketThuc: row.ketThuc || '',
    soGio: row.soGio || '',
  }
}
function mergeBundleRows(bundle, staff, session, type, title) {
  const cacheRows = bundle?.cache?.nhanSuBoPhan || staff || []
  const bundleRows = (bundle?.items || []).map(normalizeRow)
  const saved = bundleRows.filter(x => x.selected === true && (type !== 'Tăng ca' || x.batDau || x.ketThuc || x.soGio))
  const savedMap = new Map(saved.map(x => [x.maNv, x]))
  const hasSavedBefore = bundle?.hasSavedBefore === true || saved.length > 0

  let base = cacheRows.map(normalizeRow).map(p => {
    const old = savedMap.get(p.maNv)
    return old ? { ...p, ...old, selected: old.selected === true } : { ...p, selected: false, boPhanGoc: p.boPhanGoc || p.boPhan || session.boPhan }
  })
  const baseSet = new Set(base.map(x => x.maNv))
  saved.forEach(x => { if (!baseSet.has(x.maNv)) base.push({ ...x, selected: true, outside: true }) })

  // Riêng Tăng ca: nếu chưa có dữ liệu đã lưu thật sự kèm giờ tăng ca,
  // không lấy trạng thái chọn từ cache/draft cũ để tránh mở ra bị chọn sẵn toàn bộ.
  if (type === 'Tăng ca' && !hasSavedBefore) {
    return { rows: base.map(p => ({ ...p, selected: false, trangThai: '' })), batDau: '', ketThuc: '', soGio: '', hasSavedBefore: false }
  }

  const localDraft = readJson(draftKeyFor(session, type, title), null)
  if (!hasSavedBefore && localDraft && Array.isArray(localDraft.items)) {
    const draftMap = new Map(localDraft.items.map(x => [x.maNv, x]))
    base = base.map(p => ({ ...p, selected: draftMap.has(p.maNv), trangThai: draftMap.get(p.maNv)?.trangThai || p.trangThai }))
    return { rows: base.slice().sort((a,b)=>(b.selected?1:0)-(a.selected?1:0)), batDau: localDraft.batDau || '', ketThuc: localDraft.ketThuc || '', soGio: localDraft.soGio || '', hasSavedBefore: true }
  }

  // Không tự động chọn sẵn nhân viên cho mục Tăng ca.
  const first = saved.find(x => x.batDau || x.ketThuc || x.soGio) || saved[0] || {}
  // Luôn đưa người đã lưu/đã chọn lên đầu để mở lại nhìn thấy ngay.
  const selectedOrder = new Set(saved.filter(x => x.selected !== false).map(x => x.maNv))
  base = base.slice().sort((a, b) => {
    const as = a.selected ? 1 : 0
    const bs = b.selected ? 1 : 0
    if (bs !== as) return bs - as
    const ao = selectedOrder.has(a.maNv) ? 1 : 0
    const bo = selectedOrder.has(b.maNv) ? 1 : 0
    if (bo !== ao) return bo - ao
    return String(a.maNv || '').localeCompare(String(b.maNv || ''), 'vi', { numeric: true })
  })
  return { rows: base, batDau: first.batDau || '', ketThuc: first.ketThuc || '', soGio: first.soGio || '', hasSavedBefore }
}
function sameDeptRow(p, dept) { return stripVietnamese(p?.boPhanGoc || p?.boPhan) === stripVietnamese(dept) }
function sortPickRows(list, dept) {
  return (list || []).slice().sort((a, b) => {
    const as = a.selected ? 1 : 0
    const bs = b.selected ? 1 : 0
    if (bs !== as) return bs - as
    const ao = (a.outside || !sameDeptRow(a, dept)) ? 1 : 0
    const bo = (b.outside || !sameDeptRow(b, dept)) ? 1 : 0
    if (ao !== bo) return ao - bo
    return String(a.maNv || '').localeCompare(String(b.maNv || ''), 'vi', { numeric: true })
  })
}

function PickModal({ title, type, staff, session, cache, onClose, onSaved }) {
  const isTransfer = title === 'Điều động sang tổ khác'
  const isHoliday = type === 'Làm ngày lễ'
  const [rows, setRows] = useState([])
  const [msg, setMsg] = useState('')
  const [batDau, setBatDau] = useState('')
  const [ketThuc, setKetThuc] = useState('')
  const soGio = calcOvertimeHours(batDau, ketThuc)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [kw, setKw] = useState('')
  const [remoteResults, setRemoteResults] = useState([])
  const [inTeamOpen, setInTeamOpen] = useState(true)
  const [outsideOpen, setOutsideOpen] = useState(true)
  const [transferTarget, setTransferTarget] = useState('')
  const [holidayFrom, setHolidayFrom] = useState(() => toInputDate(today()))
  const [holidayTo, setHolidayTo] = useState(() => toInputDate(today()))

  useEffect(() => {
    let alive = true
    const loai = loaiForType(type)
    const pre = (cache?.today?.boPhan === session.boPhan ? cache.today : getPreloadedToday(session.boPhan))
    const preBundle = pre?.bundles?.[loai]?.[title]
    if (preBundle) {
      const merged = mergeBundleRows(preBundle, staff, session, type, title)
      setRows(sortPickRows(merged.rows, session.boPhan))
      if (type === 'Tăng ca') { setBatDau(merged.batDau || ''); setKetThuc(merged.ketThuc || '') }
      setLoading(false)
    } else {
      setLoading(true)
    }
    api('getNhapLieuBundleV309', [today(), session.boPhan, loai, title])
      .then(bundle => {
        if (!alive) return
        const merged = mergeBundleRows(bundle, staff, session, type, title)
        setRows(sortPickRows(merged.rows, session.boPhan))
        if (type === 'Tăng ca') {
          setBatDau(merged.batDau || '')
          setKetThuc(merged.ketThuc || '')
        }
        const old = getPreloadedToday(session.boPhan) || { ngay: today(), boPhan: session.boPhan, counts: {}, bundles: {} }
        old.bundles = old.bundles || {}; old.bundles[loai] = old.bundles[loai] || {}; old.bundles[loai][title] = bundle
        setPreloadedToday(session.boPhan, old)
      })
      .catch(e => {
        if (!alive) return
        const localDraft = readJson(draftKeyFor(session, type, title), null)
        if (localDraft && Array.isArray(localDraft.items)) {
          const map = new Map(localDraft.items.map(x => [x.maNv, x]))
          setRows(sortPickRows((staff || []).map(normalizeRow).map(p => ({ ...p, selected: map.has(p.maNv), trangThai: map.get(p.maNv)?.trangThai || p.trangThai })), session.boPhan))
          setBatDau(localDraft.batDau || '')
          setKetThuc(localDraft.ketThuc || '')
          setTransferTarget(localDraft.toChuyenDen || localDraft.boPhanChuyenDen || '')
          setMsg(e.offline ? 'Đang offline thật: dùng dữ liệu tạm trên máy.' : 'API lỗi: đang dùng dữ liệu tạm trên máy.')
        } else if (!preBundle) {
          setRows(sortPickRows((staff || []).map(normalizeRow).map(p => ({ ...p, selected: false })), session.boPhan))
          setMsg(e.message || 'Không tải được dữ liệu.')
        }
      })
      .finally(() => alive && setLoading(false))
    return () => { alive = false }
  }, [title, type, session.boPhan, cache])

  const selectedRows = rows.filter(x => x.selected)
  const selectedCount = selectedRows.length
  const inTeamRows = rows.filter(x => sameDeptRow(x, session.boPhan) && !x.outside)
  const outsideRows = rows.filter(x => x.outside || !sameDeptRow(x, session.boPhan))
  const inTeamCount = selectedRows.filter(x => sameDeptRow(x, session.boPhan) && !x.outside).length
  const outsideCount = selectedRows.filter(x => x.outside || !sameDeptRow(x, session.boPhan)).length
  const totalHours = type === 'Tăng ca' ? (Number(soGio || 0) * selectedCount).toFixed(2) : ''
  const allStaff = useMemo(() => {
    const pre = getPreloadedToday(session.boPhan)
    const list = cache?.nhanSuAll || pre?.cache?.nhanSuAll || cache?.today?.cache?.nhanSuAll || []
    const map = new Map()
    ;[...list, ...rows, ...staff].forEach(x => { const p = normalizeRow(x); if (p.maNv) map.set(p.maNv, p) })
    return Array.from(map.values())
  }, [cache, rows, staff, session.boPhan])
  const departmentOptions = useMemo(() => {
    const set = new Set([...(cache?.boPhanList || []), ...fallbackDepartments])
    allStaff.forEach(p => { const bp = p.boPhanGoc || p.boPhan; if (bp) set.add(bp) })
    return Array.from(set).filter(x => stripVietnamese(x) !== stripVietnamese(session.boPhan))
  }, [allStaff, cache, session.boPhan])
  const searchResults = useMemo(() => {
    const q = stripVietnamese(kw)
    if (!q) return []
    const rowMap = new Map(rows.map(x => [x.maNv, x]))
    const local = allStaff
      .filter(p => !sameDeptRow(p, session.boPhan))
      .filter(p => personSearchText(p).includes(q))
      .slice(0, 8)
      .map(p => ({ ...p, outside: true, selected: rowMap.get(p.maNv)?.selected === true, trangThai: rowMap.get(p.maNv)?.trangThai || p.trangThai }))
    const map = new Map(local.map(p => [p.maNv, p]))
    remoteResults.forEach(x => {
      const p = normalizeRow(x)
      if (p.maNv && !sameDeptRow(p, session.boPhan) && !map.has(p.maNv)) map.set(p.maNv, { ...p, outside: true, selected: rowMap.get(p.maNv)?.selected === true, trangThai: rowMap.get(p.maNv)?.trangThai || p.trangThai })
    })
    return Array.from(map.values()).slice(0, 8)
  }, [kw, allStaff, rows, remoteResults, session.boPhan])
  useEffect(() => {
    const q = kw.trim()
    if (!q || q.length < 2) { setRemoteResults([]); return }
    const timer = setTimeout(() => {
      api('searchNhanSu', [session.boPhan, q]).then(list => setRemoteResults(list || [])).catch(() => {})
    }, 220)
    return () => clearTimeout(timer)
  }, [kw, session.boPhan])

  function defaultStatus() { return type === 'Vắng mặt' ? 'Có phép' : 'Đã chọn' }
  function toggle(ma) { setRows(list => sortPickRows(list.map(x => x.maNv === ma ? { ...x, selected: !x.selected, trangThai: x.trangThai || defaultStatus() } : x), session.boPhan)) }
  function setStatus(ma, value) { setRows(list => list.map(x => x.maNv === ma ? { ...x, trangThai: value } : x)) }
  function addExternal(p) {
    const person = { ...normalizeRow(p), boPhanGoc: p.boPhanGoc || p.boPhan || '', outside: true, selected: true, trangThai: p.trangThai || defaultStatus() }
    setRows(list => {
      const exists = list.some(x => x.maNv === person.maNv)
      const next = exists ? list.map(x => x.maNv === person.maNv ? { ...x, ...person, selected: true } : x) : [person, ...list]
      return sortPickRows(next, session.boPhan)
    })
  }

  async function save() {
    if (saving) return
    if (type === 'Tăng ca' && (!batDau || !ketThuc || !soGio)) {
      setMsg('Vui lòng chọn giờ bắt đầu và giờ kết thúc.')
      return
    }
    if (isTransfer && !transferTarget.trim()) {
      setMsg('Vui lòng chọn tổ chuyển đến trước khi lưu.')
      return
    }
    const loaiBaoCao = type === 'Vắng mặt' ? 'Báo cáo vắng' : type === 'Biến động' ? 'Biến động nhân sự' : type
    const items = selectedRows.map(x => ({
      maNv: x.maNv,
      tenNv: x.tenNv,
      boPhanGoc: x.boPhanGoc || x.boPhan || session.boPhan,
      trangThai: type === 'Vắng mặt' ? (x.trangThai === 'Không phép' ? 'Không phép' : 'Có phép') : (isTransfer ? `Điều động sang ${transferTarget.trim()} (hỗ trợ)` : 'Đã chọn'),
      boPhanChuyenDen: isTransfer ? transferTarget.trim() : '',
      toChuyenDen: isTransfer ? transferTarget.trim() : '',
      hoTro: isTransfer ? true : false,
    }))
    const requestId = `nl_${Date.now()}_${Math.random().toString(16).slice(2)}`
    const payload = { requestId, localDraftAt: Date.now(), ngay: today(), boPhan: session.boPhan, toTruong: session.tenToTruong, chiTiet: title, items, batDau, ketThuc, soGio, loaiBaoCao, tuNgay: isHoliday ? fromInputDate(holidayFrom) : '', denNgay: isHoliday ? fromInputDate(holidayTo) : '', boPhanChuyenDen: isTransfer ? transferTarget.trim() : '', toChuyenDen: isTransfer ? transferTarget.trim() : '', ghiChu: isTransfer ? `Điều động sang ${transferTarget.trim()} - hiển thị tại tổ nhận là (hỗ trợ)` : (isHoliday ? `Đăng ký làm ngày lễ từ ${fromInputDate(holidayFrom)} đến ${fromInputDate(holidayTo)}` : '') }
    writeJson(draftKeyFor(session, type, title), payload)
    saveLocalNhapLieu(session, type, title, payload)
    const action = type === 'Vắng mặt' ? 'saveChiTietVang' : 'saveNhapLieu'
    const n = queueSave(action, [payload], { requestId, screen: type, title })
    clearJson(draftKeyFor(session, type, title))
    setSaving(false)
    setMsg(`💾 ĐÃ LƯU TRÊN MÁY ${items.length} người. Đang đồng bộ nền (${n}).`)
    onSaved?.()
    if (navigator.onLine) syncQueue().then(() => {
      const left = readJson(OFFLINE_QUEUE_KEY, []).length
      setMsg(left ? `💾 Đã lưu trên máy. Còn ${left} mục chờ đồng bộ.` : `✅ ĐÃ ĐỒNG BỘ THÀNH CÔNG ${items.length} người${isTransfer ? ` sang ${transferTarget.trim()} (hỗ trợ)` : ''}`)
      onSaved?.()
    }).catch(() => setMsg(`💾 Đã lưu trên máy. Sẽ tự đồng bộ khi mạng ổn.`))
  }

  const actionControls = (p) => <div className="row-actions-lite" onClick={e => e.stopPropagation()}>
    <button className={p.selected ? 'secondary-button mini selected-mini' : 'primary-button mini'} onClick={() => toggle(p.maNv)}>{p.selected ? 'Đã chọn' : 'Chọn'}</button>
    {type === 'Vắng mặt' && <select className="mini status-mini" value={p.trangThai === 'Không phép' ? 'Không phép' : 'Có phép'} onChange={e => setStatus(p.maNv, e.target.value)}><option>Có phép</option><option>Không phép</option></select>}
  </div>
  const renderPerson = (p, prefix = '') => <div className={`pick-row-lite ${p.selected ? 'selected' : ''} ${(p.outside || !sameDeptRow(p, session.boPhan)) ? 'outside' : ''}`} key={`${prefix}${p.maNv}`} onClick={() => toggle(p.maNv)}>
    <div className="person-info-lite"><b>{p.tenNv}{(p.outside || !sameDeptRow(p, session.boPhan)) && !isTransfer ? ' (hỗ trợ)' : ''}</b><div className="small-text">{p.maNv} · {p.boPhanGoc || p.boPhan}{(p.outside || !sameDeptRow(p, session.boPhan)) ? ' · ngoài tổ' : ''}{type === 'Tăng ca' && <> · Giờ TC: {batDau || '--:--'} → {ketThuc || '--:--'} = {soGio || '0'} giờ</>}</div></div>{actionControls(p)}</div>

  return <div className="modal-overlay"><div className="modal-panel modal-v23"><div className="modal-head-lite modal-head-green"><button className="modal-back" onClick={onClose}>←</button><b>{title}</b><button className="modal-close" onClick={onClose}>×</button></div>
    <div className="modal-fixed-top">
      {type === 'Tăng ca' && <div className="overtime-compact-grid">
        <div><label className="field-label overtime-label">Bắt đầu</label><select className="form-control form-control-sm time-select-control" value={batDau} onChange={e => setBatDau(e.target.value)}><option value="">-- Chọn giờ --</option>{timeOptions.map(v => <option key={v} value={v}>{v}</option>)}</select></div>
        <div><label className="field-label overtime-label">Kết thúc</label><select className="form-control form-control-sm time-select-control" value={ketThuc} onChange={e => setKetThuc(e.target.value)}><option value="">-- Chọn giờ --</option>{timeOptions.map(v => <option key={v} value={v}>{v}</option>)}</select></div>
        <div><label className="field-label overtime-label">Số giờ</label><input className="form-control form-control-sm overtime-hours-input" value={soGio} readOnly /></div>
      </div>}
      {isTransfer && <div className="transfer-target-box"><label className="field-label">Tổ chuyển đến</label><select className="form-control form-control-sm" value={transferTarget} onChange={e => setTransferTarget(e.target.value)}><option value="">Chọn tổ chuyển đến</option>{departmentOptions.map(bp => <option key={bp} value={bp}>{bp}</option>)}</select></div>}
      {isHoliday && <div className="grid2-lite"><div><label className="field-label">Từ ngày</label><input type="date" className="form-control form-control-sm" value={holidayFrom} onChange={e => setHolidayFrom(e.target.value)} /></div><div><label className="field-label">Đến ngày</label><input type="date" className="form-control form-control-sm" value={holidayTo} onChange={e => setHolidayTo(e.target.value)} /></div></div>}
      <div className="note-compact summary-v23"><div>✅ Đã chọn: <b>{selectedCount}</b> nhân viên</div><span>Trong tổ: {inTeamCount} · Ngoài tổ: {outsideCount}{type === 'Tăng ca' ? ` · Tổng TG: ${totalHours} giờ` : ''}{isHoliday ? ` · Ngày lễ: ${fromInputDate(holidayFrom)} - ${fromInputDate(holidayTo)}` : ''}</span>{isTransfer && transferTarget && <span>Chuyển đến: <b>{transferTarget}</b> · sang tổ nhận sẽ hiện <b>(hỗ trợ)</b></span>}</div>
      {loading && <div className="note-compact loading-v23">Đang tải dữ liệu...</div>}
      <div className="pick-section-row" onClick={() => setInTeamOpen(v => !v)}><div><b>1. Chọn nhân viên trong tổ</b> <span>({session.boPhan})</span></div><div className="section-right"><em>{inTeamRows.length}</em><i>{inTeamOpen ? '⌄' : '›'}</i></div></div>
      <div className="pick-section-row" onClick={() => setOutsideOpen(v => !v)}><div><b>2. Thêm nhân viên từ bộ phận khác</b></div><div className="section-right"><em>{outsideCount}</em><i>{outsideOpen ? '⌃' : '›'}</i></div></div>
      {outsideOpen && <div className="external-search-box"><span className="search-ico">⌕</span><input value={kw} onChange={e => setKw(e.target.value)} placeholder="Nhập tên, mã số (có dấu hoặc không dấu)..." />{kw && <button onClick={() => setKw('')}>×</button>}</div>}
    </div>
    <div className="pick-scroll-area">
      {kw && outsideOpen && <div className="external-results">{searchResults.length ? searchResults.map(p => {
        const current = rows.find(x => x.maNv === p.maNv) || p
        return <div className={`pick-row-lite external ${current.selected ? 'selected' : ''}`} key={`sr_${p.maNv}`}>
          <div className="person-info-lite"><b>{p.tenNv} (hỗ trợ)</b><div className="small-text">{p.maNv} · {p.boPhanGoc || p.boPhan}</div></div>
          <div className="row-actions-lite">
            <button className={current.selected ? 'secondary-button mini selected-mini' : 'primary-button mini'} onClick={() => current.selected ? toggle(p.maNv) : addExternal(p)}>{current.selected ? 'Đã chọn' : 'Chọn'}</button>
            {type === 'Vắng mặt' && <select className="mini status-mini" value={current.trangThai === 'Không phép' ? 'Không phép' : 'Có phép'} onChange={e => { current.selected ? setStatus(p.maNv, e.target.value) : addExternal({ ...p, trangThai: e.target.value }) }}><option>Có phép</option><option>Không phép</option></select>}
          </div>
        </div>
      }) : <div className="note-compact">Không thấy nhân viên phù hợp.</div>}</div>}
      {inTeamOpen && <div className="pick-list-lite main-list-v23">{inTeamRows.map(p => renderPerson(p, 'in_'))}</div>}
      {outsideOpen && outsideRows.length > 0 && <div className="pick-list-lite outside-list-v23">{outsideRows.map(p => renderPerson(p, 'out_'))}</div>}
    </div>
    <div className="savebar-lite"><button className={saveButtonClass('primary-button', msg, saving)} disabled={saving} onClick={save}>{saving ? 'Đang lưu...' : msg.includes('ĐÃ ĐỒNG BỘ') ? 'Đã đồng bộ' : msg.includes('ĐÃ LƯU TRÊN MÁY') || msg.includes('Đã lưu trên máy') ? 'Đã lưu trên máy' : msg.includes('CHƯA LƯU') ? 'Lưu lại' : `Lưu (${selectedCount} nhân viên)`}</button><Status text={msg} ok={!msg.includes('Vui lòng') && !msg.includes('lỗi') && !msg.includes('Lỗi') && !msg.includes('CHƯA LƯU')} /></div></div></div>
}

function StaffScreen({ session, cache }) { const staff = useStaff(session, cache); return <div className="card"><div className="table-scroll"><table className="summary-table staff-table"><thead><tr><th>Mã NV</th><th>Tên NV</th><th>Bộ phận</th><th>Trạng thái</th></tr></thead><tbody>{staff.map(row => <tr key={row.maNv}><td>{row.maNv}</td><td>{row.tenNv}</td><td>{row.boPhan}</td><td>{row.trangThai}</td></tr>)}</tbody></table></div></div> }
function AccountScreen({ session, setSession }) {
  const [oldPass, setOldPass] = useState(''), [newPass, setNewPass] = useState(''), [again, setAgain] = useState(''), [msg, setMsg] = useState('')
  async function change() { if (newPass !== again) return setMsg('Mật khẩu nhập lại không khớp.'); try { const r = await api('doiMatKhau', [session.boPhan, oldPass, newPass]); setMsg(r.message || 'Đã đổi mật khẩu.'); setOldPass(''); setNewPass(''); setAgain('') } catch (e) { setMsg(e.message) } }
  return <><div className="card"><div className="section-label">Thông tin cá nhân</div><div className="meta-list account-info"><div className="meta-line">Bộ phận: <b>{session.boPhan}</b></div><div className="meta-line">Tổ Trưởng: <b>{session.tenToTruong}</b></div><div className="meta-line">Vai trò: <b>{session.roleLabel || session.vaiTro}</b></div><div className="meta-line">Ngày: <b>{session.today || today()}</b></div></div></div><div className="card"><div className="section-label">Đổi mật khẩu</div><label className="field-label">Mật khẩu cũ</label><input className="form-control form-control-sm" type="password" placeholder="Nhập mật khẩu cũ" value={oldPass} onChange={e => setOldPass(e.target.value)} /><label className="field-label">Mật khẩu mới</label><input className="form-control form-control-sm" type="password" placeholder="Tối thiểu 6 ký tự" value={newPass} onChange={e => setNewPass(e.target.value)} /><label className="field-label">Nhập lại mật khẩu mới</label><input className="form-control form-control-sm" type="password" placeholder="Nhập lại mật khẩu mới" value={again} onChange={e => setAgain(e.target.value)} /><div style={{ height: 12 }} /><button className="primary-button" onClick={change}>Cập nhật mật khẩu</button><Status text={msg} ok={!msg.includes('không') && !msg.includes('lỗi')} /></div></>
}
function isManagerRole(session) { return stripVietnamese(session?.vaiTro || session?.roleLabel || '').includes('quan ly') }
function TaskScreen({ session }) {
  const manager = isManagerRole(session)
  const [jobs, setJobs] = useState([])
  const [leaders, setLeaders] = useState([])
  const [leaderId, setLeaderId] = useState('')
  const [tenCongViec, setTenCongViec] = useState('')
  const [noiDung, setNoiDung] = useState('')
  const [han, setHan] = useState(() => today())
  const [msg, setMsg] = useState('')
  const [saving, setSaving] = useState(false)
  useEffect(() => {
    if (manager) {
      const boot = readJson(BOOT_KEY, null)
      const cached = boot?.toTruongList || boot?.leaders || []
      if (cached.length) { setLeaders(cached); setLeaderId(String(cached[0].maNv || cached[0].ma || cached[0].tenNv || cached[0].ten || '')) }
      api('getDanhSachToTruong', []).then(list => {
        const arr = list || []
        setLeaders(arr)
        if (arr.length) setLeaderId(String(arr[0].maNv || arr[0].ma || arr[0].tenNv || arr[0].ten || ''))
      }).catch(() => {
        if (!cached.length) {
          const fallback = [{ tenNv: session.tenToTruong || 'Lưu Văn Hùng Anh', boPhan: session.boPhan || 'Ngâm Đường 2' }]
          setLeaders(fallback); setLeaderId(fallback[0].tenNv)
        }
      })
    } else {
      const local = readJson(localKey('giaoviec_view', [session.boPhan]), [])
      if (local.length) setJobs(local)
      api('getDanhSachCongViec', [session.boPhan, session.vaiTro]).then(r => { setJobs(r || []); writeJson(localKey('giaoviec_view', [session.boPhan]), r || []) }).catch(() => {})
    }
  }, [session.boPhan, session.vaiTro])
  function leaderLabel(x) { return `${x.tenNv || x.ten || x.name || ''}${x.boPhan || x.boPhanGoc ? ` (${x.boPhan || x.boPhanGoc})` : ''}`.trim() }
  function resetForm() { setTenCongViec(''); setNoiDung(''); setHan(today()); setMsg('') }
  function saveTask() {
    if (saving) return
    const leader = leaders.find(x => String(x.maNv || x.ma || x.tenNv || x.ten || '') === leaderId) || leaders[0]
    if (!leader) return setMsg('Chưa có danh sách tổ trưởng.')
    if (!tenCongViec.trim()) return setMsg('Vui lòng nhập tên công việc.')
    if (!noiDung.trim()) return setMsg('Vui lòng nhập nội dung công việc.')
    const requestId = `gv_${Date.now()}_${Math.random().toString(16).slice(2)}`
    const payload = { requestId, ngayGiao: today(), nguoiGiao: session.tenToTruong || session.ten || session.boPhan, boPhanNguoiGiao: session.boPhan, giaoChoMaNv: leader.maNv || leader.ma || '', giaoChoTen: leader.tenNv || leader.ten || leader.name || '', giaoChoBoPhan: leader.boPhan || leader.boPhanGoc || '', tenCongViec: tenCongViec.trim(), noiDung: noiDung.trim(), hanHoanThanh: han, trangThai: 'Đang chờ' }
    writeJson(localKey('giaoviec_form_last', [session.boPhan]), payload)
    saveLocalGiaoViec(session, payload)
    const n = queueSave('saveGiaoViec', [payload], { requestId, screen: 'giao-viec' })
    setMsg(`💾 ĐÃ LƯU TRÊN MÁY. Đang đồng bộ nền (${n}).`)
    setSaving(false)
    if (navigator.onLine) syncQueue().then(() => setMsg(readJson(OFFLINE_QUEUE_KEY, []).length ? '💾 Đã lưu trên máy, còn mục chờ đồng bộ.' : '✅ ĐÃ ĐỒNG BỘ GIAO VIỆC.')).catch(() => {})
  }
  if (!manager) return <div className="card">{jobs.length ? jobs.map((j, i) => <div className="task-card" key={i}><div className="task-title">{j.tieuDe || j.tenCongViec || j.noiDung || 'Công việc'}</div><div className="meta-line">Trạng thái: <b>{j.trangThai || 'Đang chờ'}</b></div></div>) : <><p className="page-note">Danh sách công việc được giao.</p><div className="task-card"><div className="task-title">Chưa có công việc</div><div className="meta-line">Trạng thái: <b>Đang chờ</b></div></div></>}</div>
  return <><div className="screen-title-row"><span className="screen-title-icon">📝</span><h1>Giao việc</h1></div><div className="card task-form-card"><label className="field-label">Tổ trưởng</label><select className="form-control form-control-sm" value={leaderId} onChange={e => setLeaderId(e.target.value)}>{leaders.map((x, i) => <option key={i} value={String(x.maNv || x.ma || x.tenNv || x.ten || '')}>{leaderLabel(x)}</option>)}</select><label className="field-label">Tên công việc</label><input className="form-control form-control-sm" placeholder="Nhập tên công việc" value={tenCongViec} onChange={e => setTenCongViec(e.target.value)} /><label className="field-label">Nội dung công việc</label><div className="textarea-wrap"><textarea className="form-control task-textarea" maxLength={500} placeholder="Nhập nội dung chi tiết công việc" value={noiDung} onChange={e => setNoiDung(e.target.value)} /><span>{noiDung.length}/500</span></div><label className="field-label">Ngày hoàn thành</label><input className="form-control form-control-sm" value={han} onChange={e => setHan(e.target.value)} /><div className="note-compact">ℹ️ Công việc sẽ được lưu và thông báo cho Tổ trưởng.</div><button className="secondary-button" onClick={resetForm}>↻ Nhập lại</button><div style={{height:10}} /><button className={saveButtonClass('primary-button', msg, saving)} disabled={saving} onClick={saveTask}>💾 Lưu giao việc</button><Status text={msg} ok={!msg.includes('Vui lòng') && !msg.includes('Chưa')} /></div></>
}
function toInputDate(v) {
  const d = new Date()
  if (!v) return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(v)) { const [dd, mm, yy] = v.split('/'); return `${yy}-${mm}-${dd}` }
  return v
}
function fromInputDate(v) { if (!v) return ''; const [yy, mm, dd] = v.split('-'); return `${dd}/${mm}/${yy}` }
function monthStartInput() { const d = new Date(); return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-01` }
function monthEndInput() { const d = new Date(); return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(new Date(d.getFullYear(), d.getMonth()+1, 0).getDate())}` }
function PrintOvertimeScreen({ session, departments }) {
  const overtimeTypes = ['Tất cả', 'Tăng ca sáng', 'Tăng ca trưa', 'Tăng ca chiều', 'Tăng ca đột xuất']
  const [rows, setRows] = useState([]), [msg, setMsg] = useState(''), [bp, setBp] = useState('Tất cả'), [thang, setThang] = useState(monthNow())
  const [loaiTangCa, setLoaiTangCa] = useState('Tất cả')
  const [tuNgay, setTuNgay] = useState(monthStartInput()), [denNgay, setDenNgay] = useState(monthEndInput()), [busy, setBusy] = useState(false), [fileUrl, setFileUrl] = useState('')
  const cacheKey = localKey('in_tang_ca_preview', [bp, loaiTangCa, tuNgay, denNgay, thang])
  useEffect(() => { const cached = readJson(cacheKey, null); if (cached?.rows) { setRows(cached.rows); setMsg('Đang hiển thị dữ liệu đã lưu trên máy.') } }, [bp, loaiTangCa, tuNgay, denNgay, thang])
  function validateRange() { if (tuNgay && denNgay && tuNgay > denNgay) { setMsg('Từ ngày không được lớn hơn đến ngày.'); return false } return true }
  async function load() {
    if (!validateRange()) return
    setBusy(true)
    setMsg('⏳ Đang lấy dữ liệu xem trước...')
    try {
      const r = await api('getDanhSachTangCaXemTruoc', ['THEO_KHOANG_NGAY', bp, fromInputDate(tuNgay), fromInputDate(denNgay), thang, loaiTangCa])
      const data = r?.rows || []
      setRows(data)
      writeJson(cacheKey, { rows: data, cachedAt: Date.now(), loaiTangCa })
      setMsg(r?.message || `✅ Đã tải ${data.length} dòng xem trước.`)
    } catch (e) { setMsg(e.message || 'Không xem trước được.') }
    finally { setBusy(false) }
  }
  async function exportExcel() {
    if (!validateRange()) return
    setBusy(true)
    setMsg('⏳ Đang tạo file Excel...')
    try {
      const r = await api('exportTangCaExcel', [{ boPhan: bp, tuNgay: fromInputDate(tuNgay), denNgay: fromInputDate(denNgay), thang, loaiTangCa }])
      const url = r?.url || r?.fileUrl || r?.downloadUrl || ''
      setFileUrl(url)
      setMsg(url ? `✅ Đã tạo file Excel (${loaiTangCa}). Có thể mở link hoặc gửi qua Zalo.` : '✅ Đã gửi yêu cầu xuất Excel.')
      if (url) window.open(url, '_blank')
    } catch (e) { setMsg(`❌ Chưa xuất được Excel: ${e.message || 'Lỗi Apps Script.'}`) }
    finally { setBusy(false) }
  }
  async function shareZalo() {
    if (!fileUrl) { setMsg('❌ Chưa có link Excel để gửi.'); return }
    const shareText = `File tăng ca: ${fileUrl}`
    if (navigator.share) {
      try {
        await navigator.share({ title: 'File tăng ca', text: shareText, url: fileUrl })
        setMsg('✅ Đã mở bảng chia sẻ. Chọn Zalo để gửi link.')
        return
      } catch (e) {
        if (e && e.name === 'AbortError') return
      }
    }
    try {
      await navigator.clipboard.writeText(fileUrl)
      setMsg('✅ Đã copy link. Mở Zalo và dán gửi cho người nhận.')
    } catch (e) {
      window.prompt('Copy link này để gửi qua Zalo:', fileUrl)
      setMsg('✅ Hãy copy link rồi dán vào Zalo.')
    }
  }
  return <><div className="screen-title-row"><span className="screen-title-icon">🖨️</span><h1>In báo cáo</h1></div><div className="card print-overtime-card"><label className="field-label">Bộ phận</label><select className="form-control form-control-sm" value={bp} onChange={e => setBp(e.target.value)}><option>Tất cả</option>{departments.map(x => <option key={x}>{x}</option>)}</select><label className="field-label">Loại tăng ca</label><select className="form-control form-control-sm" value={loaiTangCa} onChange={e => setLoaiTangCa(e.target.value)}>{overtimeTypes.map(x => <option key={x} value={x}>{x}</option>)}</select><div className="date-range-grid"><div><label className="field-label">Từ ngày</label><input type="date" className="form-control form-control-sm" value={tuNgay} onChange={e => setTuNgay(e.target.value)} /></div><div><label className="field-label">Đến ngày</label><input type="date" className="form-control form-control-sm" value={denNgay} onChange={e => setDenNgay(e.target.value)} /></div></div><label className="field-label">Tháng</label><input className="form-control form-control-sm" value={thang} onChange={e => setThang(e.target.value)} /><div className="note-compact">ℹ️ Dữ liệu lấy từ BAO_CAO_CHI_TIET. Có thể lọc: sáng, trưa, chiều, đột xuất hoặc tất cả.</div><button className="secondary-button" disabled={busy} onClick={load}>👁️ Xem trước</button><div style={{ height: 10 }} /><button className="primary-button export-button" disabled={busy} onClick={exportExcel}>📥 Xuất Excel</button>{fileUrl && <><div style={{ height: 10 }} /><button className="secondary-button" onClick={shareZalo}>📲 Gửi link qua Zalo</button><div className="excel-link-box">{fileUrl}</div></>}<Status text={msg} ok={!msg.includes('❌') && !msg.includes('không được')} />{rows.length > 0 && <div className="table-scroll" style={{ marginTop: 12 }}><table className="summary-table"><tbody>{rows.slice(0, 20).map((r, i) => <tr key={(r.maNv || '') + '_' + i}><td>{r.maNv}</td><td>{r.tenNv}</td><td>{r.boPhanGoc || r.boPhan}</td><td>{r.chiTiet || loaiTangCa}</td><td>{r.tong || r.soGio || ''}</td></tr>)}</tbody></table></div>}</div></>
}
function ScreenRouter({ screen, session, cache, departments, setSession }) { if (screen === 'bao-cao') return <ReportScreen session={session} />; if (screen === 'tong-cty') return <CompanyScreen session={session} />; if (screen === 'tang-ca') return <DataEntryScreen type="Tăng ca" items={['Tăng ca sáng', 'Tăng ca trưa', 'Tăng ca chiều', 'Tăng ca đột xuất']} session={session} cache={cache} />; if (screen === 'bien-dong') return <DataEntryScreen type="Biến động" items={['Công nhân mới', 'Nghỉ việc', 'Xin về sớm', 'Điều động sang tổ khác']} session={session} cache={cache} />; if (screen === 'vang') return <DataEntryScreen type="Vắng mặt" items={['Vắng buổi sáng', 'Vắng buổi chiều', 'Vắng cả ngày']} session={session} cache={cache} />; if (screen === 'ngay-le') return <DataEntryScreen type="Làm ngày lễ" items={['Đăng ký làm ngày lễ']} session={session} cache={cache} />; if (screen === 'giao-viec') return <TaskScreen session={session} />; if (screen === 'in-tang-ca') return <PrintOvertimeScreen session={session} departments={departments} />; if (screen === 'nhan-su') return <StaffScreen session={session} cache={cache} />; if (screen === 'tai-khoan') return <AccountScreen session={session} setSession={setSession} />; return <ReportScreen session={session} /> }
function App() {
  const savedSession = readJson(SESSION_KEY, null)
  const [booting, setBooting] = useState(true)
  const [bootText, setBootText] = useState('Đang tải dữ liệu gốc...')
  const [screen, setScreen] = useState(() => savedSession ? 'home' : 'login')
  const [departments, setDepartments] = useState(() => readJson(BOOT_KEY, null)?.boPhanList || fallbackDepartments)
  const [session, setSession] = useState(() => savedSession)
  const [cache, setCache] = useState(() => readJson(CACHE_KEY, null))
  const [syncCount, setSyncCount] = useState(() => readJson(OFFLINE_QUEUE_KEY, []).length)

  useEffect(() => {
    let alive = true
    async function boot() {
      const cachedBoot = readJson(BOOT_KEY, null)
      const last = readJson(LAST_DEPT_KEY, '')
      const cachedToday = last ? getPreloadedToday(last) : null
      if (cachedBoot?.boPhanList?.length) setDepartments(cachedBoot.boPhanList)
      if (cachedToday?.cache) {
        const merged = applyPreloadToCache(last, cachedToday)
        if (merged) setCache(merged)
        setBootText('Đang mở dữ liệu đã lưu trên điện thoại...')
      } else if (savedSession) {
        setBootText('Đang mở phiên đăng nhập đã lưu...')
      }
      setTimeout(() => { if (alive) setBooting(false) }, cachedBoot || savedSession ? 120 : 300)
      if (!navigator.onLine) return
      api('getLoginInitFast').then(init => {
        if (!alive) return
        writeJson(BOOT_KEY, init)
        setDepartments(init.boPhanList || fallbackDepartments)
      }).catch(() => {})
      if (last) preloadTodayData(last).then(data => { if (alive) { const merged = applyPreloadToCache(last, data); if (merged) setCache(merged) } }).catch(() => {})
    }
    boot()
    return () => { alive = false }
  }, [])

  useEffect(() => {
    const updateCount = () => setSyncCount(readJson(OFFLINE_QUEUE_KEY, []).length)
    const run = () => syncQueue().then(updateCount).catch(updateCount)
    const onVisible = () => { if (document.visibilityState === 'visible') run() }
    window.addEventListener('online', run)
    window.addEventListener('focus', run)
    document.addEventListener('visibilitychange', onVisible)
    window.addEventListener('erp-queue-change', updateCount)
    const t = setInterval(run, 5000)
    run()
    return () => { window.removeEventListener('online', run); window.removeEventListener('focus', run); document.removeEventListener('visibilitychange', onVisible); window.removeEventListener('erp-queue-change', updateCount); clearInterval(t) }
  }, [])

  useEffect(() => {
    if (!session?.boPhan) return
    const run = () => {
      if (!navigator.onLine) return
      preloadTodayData(session.boPhan).then(data => { const merged = applyPreloadToCache(session.boPhan, data); if (merged) setCache(merged) }).catch(() => {})
      smartRefreshCompanyReport(session.boPhan).catch(() => {})
    }
    const onVisible = () => { if (document.visibilityState === 'visible') run() }
    window.addEventListener('focus', run)
    window.addEventListener('online', run)
    document.addEventListener('visibilitychange', onVisible)
    const t = setInterval(run, SMART_REFRESH_MS)
    run()
    return () => { window.removeEventListener('focus', run); window.removeEventListener('online', run); document.removeEventListener('visibilitychange', onVisible); clearInterval(t) }
  }, [session?.boPhan])
  function handleSession(info) { setSession(info); setScreen('home') }
  function logout() { clearJson(SESSION_KEY); setSession(null); setScreen('login') }
  if (booting) return <div className="app-shell"><BootSplash text={bootText} /></div>
  if (screen === 'login') return <div className="app-shell"><LoginScreen departments={departments} setDepartments={setDepartments} setSession={handleSession} setCache={setCache} /></div>
  if (!session) return <div className="app-shell"><LoginScreen departments={departments} setDepartments={setDepartments} setSession={handleSession} setCache={setCache} /></div>
  if (screen === 'home') return <div className="app-shell"><HomeScreen onSelect={setScreen} syncCount={syncCount} session={session} onLogout={logout} /></div>
  return <div className="app-shell"><Chrome setScreen={setScreen} session={session} syncCount={syncCount} onLogout={logout}><ScreenRouter screen={screen} session={session} cache={cache} departments={departments} setSession={setSession} /></Chrome></div>
}

createRoot(document.getElementById('root')).render(<App />)
if ('serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    try {
      const reg = await navigator.serviceWorker.register('/sw.js')
      reg.update()
      setInterval(() => reg.update(), 60 * 60 * 1000)
      reg.addEventListener('updatefound', () => {
        const newWorker = reg.installing
        if (!newWorker) return
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            newWorker.postMessage({ type: 'SKIP_WAITING' })
          }
        })
      })
      let refreshing = false
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (refreshing) return
        refreshing = true
        window.location.reload()
      })
    } catch {}
  })
}
