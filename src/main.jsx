import React, { useEffect, useMemo, useState } from 'react'
import { createRoot } from 'react-dom/client'
import './styles.css'

const API_URL = 'https://script.google.com/macros/s/AKfycby0VCyaEdk0BGqFVflht1sGPdgH8uNgHcga1QXzEldTyMQGyqyTnjw_84z01puO6YrqvA/exec'
const API_KEY = ''
const OFFLINE_QUEUE_KEY = 'erp_v30_offline_queue'
const SESSION_KEY = 'erp_v30_session'
const CACHE_KEY = 'erp_v30_client_cache'
const DRAFT_PREFIX = 'erp_v30_draft_v12'
const PRELOAD_PREFIX = 'erp_v30_today_preload_v18'
const LAST_DEPT_KEY = 'erp_v30_last_department'
const BOOT_KEY = 'erp_v30_boot_init_v18'
const PRELOAD_TTL_MS = 6 * 60 * 60 * 1000

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
  { title: 'NHẬP LIỆU', items: [{ id: 'tang-ca', icon: '🕒', label: 'Tăng ca' }, { id: 'bien-dong', icon: '👥', label: 'Biến động' }, { id: 'vang', icon: '🧾', label: 'Vắng mặt' }, { id: 'giao-viec', icon: '📝', label: 'Giao việc' }] },
  { title: 'TIỆN ÍCH', items: [{ id: 'in-tang-ca', icon: '🖨️', label: 'In tăng ca' }, { id: 'bang-thang', icon: '🔢', label: 'Bảng tăng ca' }, { id: 'nhan-su', icon: '👤', label: 'Danh sách nhân sự' }, { id: 'tai-khoan', icon: '🔐', label: 'Tài khoản' }] },
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
    if (postError && postError.offline) throw postError
    try {
      return await apiJsonp(action, args)
    } catch (jsonpError) {
      if (jsonpError && jsonpError.offline) throw jsonpError
      throw markServerError(jsonpError?.message || postError?.message || 'API lỗi, không phải offline.')
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
function queueSave(action, args) {
  const q = readJson(OFFLINE_QUEUE_KEY, [])
  q.push({ id: Date.now() + '-' + Math.random().toString(16).slice(2), action, args, time: new Date().toISOString() })
  writeJson(OFFLINE_QUEUE_KEY, q)
  return q.length
}
async function syncQueue() {
  const q = readJson(OFFLINE_QUEUE_KEY, [])
  if (!q.length || !navigator.onLine) return 0
  const remain = []
  for (const item of q) {
    try { await api(item.action, item.args) } catch { remain.push(item) }
  }
  writeJson(OFFLINE_QUEUE_KEY, remain)
  return q.length - remain.length
}

function MenuContent({ onSelect, syncCount, onLogout }) {
  return <div className="menu-content">
    {menuGroups.map(group => <div key={group.title}>
      <div className="section-title">{group.title}</div>
      {group.items.map(item => <div className="menu-item" key={item.id} onClick={() => onSelect(item.id)}><span className="menu-icon">{item.icon}</span><span>{item.label}</span></div>)}
    </div>)}
    {onLogout && <button className="logout-button" onClick={onLogout}>↩ Đăng xuất / Đăng nhập lại</button>}
    <div className="retention">Dữ liệu được lưu trữ tối đa<br /><b>45 ngày gần nhất</b>{syncCount > 0 && <><br /><b>Chờ đồng bộ: {syncCount}</b></>}</div>
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
    setBusy(true); setMsg('⏳ Đang đăng nhập và nạp dữ liệu vào máy...')
    try {
      let preload = getPreloadedToday(department)
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
  if (saving || String(msg || '').includes('Đang lưu')) return 'saving'
  if (String(msg || '').includes('ĐÃ LƯU') || String(msg || '').includes('THÀNH CÔNG')) return 'saved'
  if (String(msg || '').includes('Offline') || String(msg || '').includes('lưu tạm')) return 'offline'
  if (String(msg || '').includes('CHƯA LƯU') || String(msg || '').includes('Lỗi') || String(msg || '').includes('lỗi')) return 'error'
  return 'idle'
}
function saveButtonClass(base, msg, saving) { return `${base} save-state-${saveStateFromMsg(msg, saving)}` }
function BootSplash({ text = 'Đang tải dữ liệu gốc...' }) {
  return <main className="boot-screen"><div className="boot-card"><img className="boot-logo" src="/logo-ph.png" alt="Nhà Phúc Hậu" /><div className="boot-title">Quản lý sản xuất</div><div className="boot-spinner" /><div className="boot-text">{text}</div></div></main>
}

function ReportScreen({ session }) {
  const [data, setData] = useState(null), [form, setForm] = useState({ tongCongNhan: '', coMat: '', ghiChu: '' }), [msg, setMsg] = useState('')
  const [saving, setSaving] = useState(false)
  useEffect(() => { api('getBaoCaoTong', [today(), session.boPhan]).then(r => { setData(r); setForm({ tongCongNhan: r.TONG_CONG_NHAN || '', coMat: r.CO_MAT || '', ghiChu: r.GHI_CHU || '' }) }).catch(e => setMsg(e.message)) }, [session.boPhan])
  const rows = [['Tổng công nhân', form.tongCongNhan || 0, 'var(--color-blue)'], ['Có mặt', form.coMat || 0, 'var(--color-green)'], ['Vắng sáng', data?.VANG_BUOI_SANG || 0, 'var(--color-orange)'], ['Vắng chiều', data?.VANG_BUOI_CHIEU || 0, 'var(--color-orange)'], ['Vắng cả ngày', data?.VANG_CA_NGAY || 0, 'var(--color-red)']]
  async function save() {
    if (saving) return
    const requestId = `bc_${Date.now()}_${Math.random().toString(16).slice(2)}`
    const payload = { requestId, ngay: today(), boPhan: session.boPhan, toTruong: session.tenToTruong, tongCongNhan: form.tongCongNhan, coMat: form.coMat, ghiChu: form.ghiChu }
    setSaving(true); setMsg('⏳ Đang lưu dữ liệu...')
    try {
      const r = await api('saveBaoCaoTong', [payload])
      setMsg(`✅ ĐÃ LƯU THÀNH CÔNG${r?.savedAt ? ' lúc ' + r.savedAt : ''}`)
    } catch (e) {
      if (e.offline) { const n = queueSave('saveBaoCaoTong', [payload]); setMsg(`📡 Offline thật: đã lưu tạm trên máy, chờ đồng bộ (${n}).`) }
      else { setMsg(`❌ CHƯA LƯU: ${e.message || 'Lỗi Apps Script.'}`) }
    } finally { setSaving(false) }
  }
  return <div className="card">{rows.map(([label, number, color]) => <div className="kpi-row" key={label}><div className="kpi-label">{label}</div><div className="kpi-number" style={{ color }}>{number}</div></div>)}
    <label className="field-label">Tổng công nhân</label><input className="form-control form-control-sm" value={form.tongCongNhan} onChange={e => setForm({ ...form, tongCongNhan: e.target.value })} />
    <label className="field-label">Có mặt</label><input className="form-control form-control-sm" value={form.coMat} onChange={e => setForm({ ...form, coMat: e.target.value })} />
    <label className="field-label">Ghi chú</label><input className="form-control form-control-sm" value={form.ghiChu} onChange={e => setForm({ ...form, ghiChu: e.target.value })} />
    <div style={{ height: 12 }} /><button className={saveButtonClass("primary-button", msg, saving)} disabled={saving} onClick={save}>{saving ? 'Đang lưu...' : msg.includes('ĐÃ LƯU') ? 'Đã lưu xong' : msg.includes('CHƯA LƯU') ? 'Lưu lại' : 'Nhập / Cập nhật báo cáo'}</button><Status text={msg} />
  </div>
}
function CompanyScreen() {
  const [data, setData] = useState({ rows: [], tongCN: 0, coMat: 0, vangSang: 0, vangChieu: 0, vangCaNgay: 0 }), [msg, setMsg] = useState('')
  useEffect(() => { api('getBaoCaoTongCongTy', [today()]).then(setData).catch(e => setMsg(e.message)) }, [])
  const totals = [['Tổng công nhân', data.tongCN || 0, 'var(--color-blue)'], ['Có mặt', data.coMat || 0, 'var(--color-green)'], ['Vắng buổi sáng', data.vangSang || 0, 'var(--color-orange)'], ['Vắng buổi chiều', data.vangChieu || 0, 'var(--color-orange)'], ['Vắng cả ngày', data.vangCaNgay || 0, 'var(--color-red)']]
  return <><div className="summary-kpi-card"><div className="summary-kpi-grid">{totals.map(([label, value, color]) => <div className="summary-kpi" key={label}><div className="summary-kpi-label">{label}</div><div className="summary-kpi-number" style={{ color }}>{value}</div></div>)}</div></div>
    <div className="summary-table-card"><div className="summary-title">Tổng hợp bộ phận</div><div className="table-scroll"><table className="summary-table"><thead><tr><th>STT</th><th>Bộ phận</th><th>Tổ trưởng</th><th>Tổng CN</th><th>Có mặt</th><th>Vắng sáng</th><th>Vắng chiều</th><th>Vắng cả ngày</th></tr></thead><tbody>{(data.rows || []).map((r, i) => <tr key={r.boPhan || i}><td>{i + 1}</td><td>{r.boPhan}</td><td>{r.toTruong}</td><td>{r.tongCongNhan}</td><td className="text-green">{r.coMat}</td><td className="text-orange">{r.vangBuoiSang}</td><td className="text-orange">{r.vangBuoiChieu}</td><td className="text-red">{r.vangCaNgay}</td></tr>)}</tbody></table></div><Status text={msg} ok={false} /></div></>
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
  const saved = bundleRows.filter(x => x.selected === true)
  const savedMap = new Map(saved.map(x => [x.maNv, x]))
  const hasSavedBefore = bundle?.hasSavedBefore === true || saved.length > 0

  let base = cacheRows.map(normalizeRow).map(p => {
    const old = savedMap.get(p.maNv)
    return old ? { ...p, ...old, selected: old.selected === true } : { ...p, selected: false, boPhanGoc: p.boPhanGoc || p.boPhan || session.boPhan }
  })
  const baseSet = new Set(base.map(x => x.maNv))
  saved.forEach(x => { if (!baseSet.has(x.maNv)) base.push({ ...x, selected: true, outside: true }) })

  const localDraft = readJson(draftKeyFor(session, type, title), null)
  if (!hasSavedBefore && localDraft && Array.isArray(localDraft.items)) {
    const draftMap = new Map(localDraft.items.map(x => [x.maNv, x]))
    base = base.map(p => ({ ...p, selected: draftMap.has(p.maNv), trangThai: draftMap.get(p.maNv)?.trangThai || p.trangThai }))
    return { rows: base.slice().sort((a,b)=>(b.selected?1:0)-(a.selected?1:0)), batDau: localDraft.batDau || '', ketThuc: localDraft.ketThuc || '', soGio: localDraft.soGio || '', hasSavedBefore: true }
  }

  if (type === 'Tăng ca' && !hasSavedBefore) base = base.map(p => ({ ...p, selected: true }))
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
  const [rows, setRows] = useState([])
  const [msg, setMsg] = useState('')
  const [batDau, setBatDau] = useState('')
  const [ketThuc, setKetThuc] = useState('')
  const soGio = calcOvertimeHours(batDau, ketThuc)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [kw, setKw] = useState('')
  const [remoteResults, setRemoteResults] = useState([])

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
          setMsg(e.offline ? 'Đang offline thật: dùng dữ liệu tạm trên máy.' : 'API lỗi: đang dùng dữ liệu tạm trên máy.')
        } else if (!preBundle) {
          setRows(sortPickRows((staff || []).map(normalizeRow).map(p => ({ ...p, selected: false })), session.boPhan))
          setMsg(e.message || 'Không tải được dữ liệu.')
        }
      })
      .finally(() => alive && setLoading(false))
    return () => { alive = false }
  }, [title, type, session.boPhan, cache])

  const selectedCount = rows.filter(x => x.selected).length
  const inTeamCount = rows.filter(x => x.selected && sameDeptRow(x, session.boPhan) && !x.outside).length
  const outsideCount = rows.filter(x => x.selected && (x.outside || !sameDeptRow(x, session.boPhan))).length
  const totalHours = type === 'Tăng ca' ? (Number(soGio || 0) * selectedCount).toFixed(2) : ''
  const allStaff = useMemo(() => {
    const pre = getPreloadedToday(session.boPhan)
    const list = cache?.nhanSuAll || pre?.cache?.nhanSuAll || cache?.today?.cache?.nhanSuAll || []
    const map = new Map()
    ;[...list, ...rows].forEach(x => { const p = normalizeRow(x); if (p.maNv) map.set(p.maNv, p) })
    return Array.from(map.values())
  }, [cache, rows, session.boPhan])
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

  function defaultStatus() { return type === 'Biến động' ? 'Tăng' : 'Có phép' }
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
    const loaiBaoCao = type === 'Vắng mặt' ? 'Báo cáo vắng' : type === 'Biến động' ? 'Biến động nhân sự' : type
    const items = rows.filter(x => x.selected).map(x => ({
      maNv: x.maNv,
      tenNv: x.tenNv,
      boPhanGoc: x.boPhanGoc || x.boPhan || session.boPhan,
      trangThai: type === 'Vắng mặt' ? (x.trangThai === 'Không phép' ? 'Không phép' : 'Có phép') : type === 'Biến động' ? (x.trangThai === 'Giảm' ? 'Giảm' : 'Tăng') : 'Đã chọn',
    }))
    const requestId = `nl_${Date.now()}_${Math.random().toString(16).slice(2)}`
    const payload = { requestId, localDraftAt: Date.now(), ngay: today(), boPhan: session.boPhan, toTruong: session.tenToTruong, chiTiet: title, items, batDau, ketThuc, soGio, loaiBaoCao, ghiChu: '' }
    writeJson(draftKeyFor(session, type, title), payload)
    setSaving(true); setMsg('⏳ Đang lưu dữ liệu...')
    try {
      const r = await api(type === 'Vắng mặt' ? 'saveChiTietVang' : 'saveNhapLieu', [payload])
      setMsg(`✅ ĐÃ LƯU THÀNH CÔNG ${items.length} người${r?.savedAt ? ' lúc ' + r.savedAt : ''}`)
      clearJson(draftKeyFor(session, type, title))
      onSaved?.()
    } catch (e) {
      if (e.offline) {
        const n = queueSave(type === 'Vắng mặt' ? 'saveChiTietVang' : 'saveNhapLieu', [payload])
        setMsg(`📡 Offline thật: đã lưu tạm trên máy, chờ đồng bộ (${n}).`)
        onSaved?.()
      } else {
        setMsg(`❌ CHƯA LƯU: ${e.message || 'Lỗi Apps Script.'}`)
      }
    } finally { setSaving(false) }
  }

  const actionControls = (p) => <div className="row-actions-lite" onClick={e => e.stopPropagation()}>
    <button className={p.selected ? 'secondary-button mini selected-mini' : 'primary-button mini'} onClick={() => toggle(p.maNv)}>{p.selected ? 'Đã chọn' : 'Chọn'}</button>
    {type === 'Vắng mặt' && <select className="mini status-mini" value={p.trangThai === 'Không phép' ? 'Không phép' : 'Có phép'} onChange={e => setStatus(p.maNv, e.target.value)}><option>Có phép</option><option>Không phép</option></select>}
    {type === 'Biến động' && <select className="mini status-mini" value={p.trangThai === 'Giảm' ? 'Giảm' : 'Tăng'} onChange={e => setStatus(p.maNv, e.target.value)}><option>Tăng</option><option>Giảm</option></select>}
  </div>

  return <div className="modal-overlay"><div className="modal-panel"><div className="modal-head-lite"><b>{title}</b><button onClick={onClose}>×</button></div>
    {type === 'Tăng ca' && <div className="overtime-compact-grid">
      <div><label className="field-label overtime-label">Bắt đầu</label><select className="form-control form-control-sm time-select-control" value={batDau} onChange={e => setBatDau(e.target.value)}><option value="">-- Chọn giờ --</option>{timeOptions.map(v => <option key={v} value={v}>{v}</option>)}</select></div>
      <div><label className="field-label overtime-label">Kết thúc</label><select className="form-control form-control-sm time-select-control" value={ketThuc} onChange={e => setKetThuc(e.target.value)}><option value="">-- Chọn giờ --</option>{timeOptions.map(v => <option key={v} value={v}>{v}</option>)}</select></div>
      <div><label className="field-label overtime-label">Số giờ</label><input className="form-control form-control-sm overtime-hours-input" value={soGio} readOnly /></div>
    </div>}
    <div className="note-compact">✅ Đã chọn: <b>{selectedCount}</b> nhân viên <span className="note-mini">Trong tổ: {inTeamCount} · Ngoài tổ: {outsideCount}{type === 'Tăng ca' ? ` · Tổng TG: ${totalHours} giờ` : ''}</span></div>
    {loading && <div className="note-compact">Đang tải dữ liệu...</div>}
    <div className="pick-scroll-area">
      <div className="pick-section-row"><b>1. Chọn nhân viên trong tổ</b><span>{session.boPhan}</span><em>{rows.filter(x => sameDeptRow(x, session.boPhan) && !x.outside).length}</em></div>
      <div className="pick-section-row"><b>2. Thêm nhân viên từ bộ phận khác</b><em>{outsideCount}</em></div>
      <div className="external-search-box"><span className="search-ico">⌕</span><input value={kw} onChange={e => setKw(e.target.value)} placeholder="Nhập tên, mã số (có dấu hoặc không dấu)..." />{kw && <button onClick={() => setKw('')}>×</button>}</div>
      {kw && <div className="external-results">{searchResults.length ? searchResults.map(p => {
        const current = rows.find(x => x.maNv === p.maNv) || p
        return <div className={`pick-row-lite external ${current.selected ? 'selected' : ''}`} key={`sr_${p.maNv}`}>
          <div><b>{p.tenNv}</b><div className="small-text">{p.maNv} · {p.boPhanGoc || p.boPhan}</div></div>
          <div className="row-actions-lite">
            <button className={current.selected ? 'secondary-button mini selected-mini' : 'primary-button mini'} onClick={() => current.selected ? toggle(p.maNv) : addExternal(p)}>{current.selected ? 'Đã chọn' : 'Chọn'}</button>
            {type === 'Vắng mặt' && <select className="mini status-mini" value={current.trangThai === 'Không phép' ? 'Không phép' : 'Có phép'} onChange={e => { current.selected ? setStatus(p.maNv, e.target.value) : addExternal({ ...p, trangThai: e.target.value }) }}><option>Có phép</option><option>Không phép</option></select>}
            {type === 'Biến động' && <select className="mini status-mini" value={current.trangThai === 'Giảm' ? 'Giảm' : 'Tăng'} onChange={e => { current.selected ? setStatus(p.maNv, e.target.value) : addExternal({ ...p, trangThai: e.target.value }) }}><option>Tăng</option><option>Giảm</option></select>}
          </div>
        </div>
      }) : <div className="note-compact">Không thấy nhân viên phù hợp.</div>}</div>}
      <div className="pick-list-lite">{rows.map(p => <div className={`pick-row-lite ${p.selected ? 'selected' : ''} ${(p.outside || !sameDeptRow(p, session.boPhan)) ? 'outside' : ''}`} key={p.maNv} onClick={() => toggle(p.maNv)}><div><b>{p.tenNv}</b><div className="small-text">{p.maNv} · {p.boPhanGoc || p.boPhan}{(p.outside || !sameDeptRow(p, session.boPhan)) ? ' · ngoài tổ' : ''}{type === 'Tăng ca' && <> · Giờ TC: {batDau || '--:--'} → {ketThuc || '--:--'} = {soGio || '0'} giờ</>}</div></div>{actionControls(p)}</div>)}</div>
    </div>
    <div className="savebar-lite"><button className={saveButtonClass('primary-button', msg, saving)} disabled={saving} onClick={save}>{saving ? 'Đang lưu...' : msg.includes('ĐÃ LƯU') ? 'Đã lưu xong' : msg.includes('CHƯA LƯU') ? 'Lưu lại' : '💾 Lưu / Cập nhật'}</button><Status text={msg} ok={!msg.includes('Vui lòng') && !msg.includes('lỗi') && !msg.includes('Lỗi') && !msg.includes('CHƯA LƯU')} /></div></div></div>
}

function StaffScreen({ session, cache }) { const staff = useStaff(session, cache); return <div className="card"><div className="table-scroll"><table className="summary-table staff-table"><thead><tr><th>Mã NV</th><th>Tên NV</th><th>Bộ phận</th><th>Trạng thái</th></tr></thead><tbody>{staff.map(row => <tr key={row.maNv}><td>{row.maNv}</td><td>{row.tenNv}</td><td>{row.boPhan}</td><td>{row.trangThai}</td></tr>)}</tbody></table></div></div> }
function AccountScreen({ session, setSession }) {
  const [oldPass, setOldPass] = useState(''), [newPass, setNewPass] = useState(''), [again, setAgain] = useState(''), [msg, setMsg] = useState('')
  async function change() { if (newPass !== again) return setMsg('Mật khẩu nhập lại không khớp.'); try { const r = await api('doiMatKhau', [session.boPhan, oldPass, newPass]); setMsg(r.message || 'Đã đổi mật khẩu.'); setOldPass(''); setNewPass(''); setAgain('') } catch (e) { setMsg(e.message) } }
  return <><div className="card"><div className="section-label">Thông tin cá nhân</div><div className="meta-list account-info"><div className="meta-line">Bộ phận: <b>{session.boPhan}</b></div><div className="meta-line">Tổ Trưởng: <b>{session.tenToTruong}</b></div><div className="meta-line">Vai trò: <b>{session.roleLabel || session.vaiTro}</b></div><div className="meta-line">Ngày: <b>{session.today || today()}</b></div></div></div><div className="card"><div className="section-label">Đổi mật khẩu</div><label className="field-label">Mật khẩu cũ</label><input className="form-control form-control-sm" type="password" placeholder="Nhập mật khẩu cũ" value={oldPass} onChange={e => setOldPass(e.target.value)} /><label className="field-label">Mật khẩu mới</label><input className="form-control form-control-sm" type="password" placeholder="Tối thiểu 6 ký tự" value={newPass} onChange={e => setNewPass(e.target.value)} /><label className="field-label">Nhập lại mật khẩu mới</label><input className="form-control form-control-sm" type="password" placeholder="Nhập lại mật khẩu mới" value={again} onChange={e => setAgain(e.target.value)} /><div style={{ height: 12 }} /><button className="primary-button" onClick={change}>Cập nhật mật khẩu</button><Status text={msg} ok={!msg.includes('không') && !msg.includes('lỗi')} /></div></>
}
function TaskScreen({ session }) { const [jobs, setJobs] = useState([]); useEffect(() => { api('getDanhSachCongViec', [session.boPhan, session.vaiTro]).then(setJobs).catch(() => {}) }, [session]); return <div className="card">{jobs.length ? jobs.map((j, i) => <div className="task-card" key={i}><div className="task-title">{j.tieuDe || j.noiDung || 'Công việc'}</div><div className="meta-line">Trạng thái: <b>{j.trangThai || 'Đang chờ'}</b></div></div>) : <><p className="page-note">Danh sách công việc được giao.</p><div className="task-card"><div className="task-title">Chưa có công việc</div><div className="meta-line">Trạng thái: <b>Đang chờ</b></div></div></>}</div> }
function PrintOvertimeScreen({ session, departments }) { const [rows, setRows] = useState([]), [msg, setMsg] = useState(''), [bp, setBp] = useState('Tất cả'), [thang, setThang] = useState(monthNow()); async function load() { try { const r = await api('getDanhSachTangCaXemTruoc', ['THEO_THANG', bp, '', '', thang]); setRows(r.rows || []); setMsg(r.message || '') } catch (e) { setMsg(e.message) } } return <div className="card"><div className="section-label">Bộ phận</div><select className="form-control form-control-sm" value={bp} onChange={e => setBp(e.target.value)}><option>Tất cả</option>{departments.map(x => <option key={x}>{x}</option>)}</select><label className="field-label">Tháng</label><input className="form-control form-control-sm" value={thang} onChange={e => setThang(e.target.value)} /><div className="note-compact">ℹ️ Dữ liệu 45 ngày gần nhất.</div><button className="secondary-button" onClick={load}>👁️ Xem trước</button><Status text={msg} /><div className="table-scroll" style={{ marginTop: 12 }}><table className="summary-table"><tbody>{rows.slice(0, 20).map(r => <tr key={r.maNv}><td>{r.maNv}</td><td>{r.tenNv}</td><td>{r.boPhanGoc}</td><td>{r.tong}</td></tr>)}</tbody></table></div></div> }
function MonthOvertimeScreen({ session }) { const [data, setData] = useState(null), [thang, setThang] = useState(monthNow()), [msg, setMsg] = useState(''); async function load() { try { setData(await api('getBangTangCaThang', [thang, session.boPhan])); setMsg('') } catch (e) { setMsg(e.message) } } return <div className="card"><label className="field-label">Chọn tháng</label><input className="form-control form-control-sm" value={thang} onChange={e => setThang(e.target.value)} /><div style={{ height: 12 }} /><button className="primary-button" onClick={load}>Xem dữ liệu</button><Status text={msg} ok={false} />{data && <div className="table-scroll" style={{ marginTop: 12 }}><table className="summary-table"><thead><tr>{(data.headers || []).map(h => <th key={h}>{h}</th>)}</tr></thead><tbody>{(data.rows || []).map((r, i) => <tr key={i}>{(data.headers || []).map((h, j) => <td key={h}>{Array.isArray(r) ? r[j] : r[h]}</td>)}</tr>)}</tbody></table></div>}</div> }
function ScreenRouter({ screen, session, cache, departments, setSession }) { if (screen === 'bao-cao') return <ReportScreen session={session} />; if (screen === 'tong-cty') return <CompanyScreen />; if (screen === 'tang-ca') return <DataEntryScreen type="Tăng ca" items={['Tăng ca sáng', 'Tăng ca trưa', 'Tăng ca chiều', 'Tăng ca đột xuất']} session={session} cache={cache} />; if (screen === 'bien-dong') return <DataEntryScreen type="Biến động" items={['Công nhân mới', 'Nghỉ việc', 'Xin về sớm', 'Điều động sang tổ khác']} session={session} cache={cache} />; if (screen === 'vang') return <DataEntryScreen type="Vắng mặt" items={['Vắng buổi sáng', 'Vắng buổi chiều', 'Vắng cả ngày']} session={session} cache={cache} />; if (screen === 'giao-viec') return <TaskScreen session={session} />; if (screen === 'in-tang-ca') return <PrintOvertimeScreen session={session} departments={departments} />; if (screen === 'bang-thang') return <MonthOvertimeScreen session={session} />; if (screen === 'nhan-su') return <StaffScreen session={session} cache={cache} />; if (screen === 'tai-khoan') return <AccountScreen session={session} setSession={setSession} />; return <ReportScreen session={session} /> }
function App() {
  const [booting, setBooting] = useState(true)
  const [bootText, setBootText] = useState('Đang tải dữ liệu gốc...')
  const [screen, setScreen] = useState('login')
  const [departments, setDepartments] = useState(() => readJson(BOOT_KEY, null)?.boPhanList || fallbackDepartments)
  const [session, setSession] = useState(null)
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
      }
      setTimeout(() => { if (alive) setBooting(false) }, cachedBoot ? 120 : 300)
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

  useEffect(() => { const run = () => syncQueue().then(() => setSyncCount(readJson(OFFLINE_QUEUE_KEY, []).length)); window.addEventListener('online', run); const t = setInterval(run, 60000); return () => { window.removeEventListener('online', run); clearInterval(t) } }, [])
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
