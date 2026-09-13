'use strict'
const { app, BaseWindow, WebContentsView, session, ipcMain, Menu } = require('electron')
const path = require('path')
const { Tor } = require('./tor')

// ---------------------------------------------------------------------------
// 1. Switch a livello di processo: vanno impostati PRIMA di app.whenReady()
// ---------------------------------------------------------------------------
const tor = new Tor()

app.commandLine.appendSwitch('proxy-server', tor.proxyUrl)
// niente bypass: nemmeno loopback esce fuori dal proxy
app.commandLine.appendSwitch('proxy-bypass-list', '<-loopback>')
// nessuna risoluzione DNS diretta: il DNS viaggia dentro il SOCKS5 di Tor
app.commandLine.appendSwitch('host-resolver-rules', 'MAP * ~NOTFOUND , EXCLUDE 127.0.0.1')
app.commandLine.appendSwitch('force-webrtc-ip-handling-policy', 'disable_non_proxied_udp')
app.commandLine.appendSwitch('disable-webrtc-hw-encoding')
app.commandLine.appendSwitch('disable-background-networking')
app.commandLine.appendSwitch('disable-sync')
app.commandLine.appendSwitch('disable-domain-reliability')
app.commandLine.appendSwitch('no-pings')
app.commandLine.appendSwitch('disable-breakpad')
app.commandLine.appendSwitch('metrics-recording-only')
app.commandLine.appendSwitch('disable-http-cache')
app.commandLine.appendSwitch('dns-prefetch-disable')
app.commandLine.appendSwitch('disable-features', [
  'NetworkPrediction',
  'PrivacySandboxSettings4',
  'InterestFeedContentSuggestions',
  'Translate',
  'MediaRouter',
  'OptimizationHints',
  'AutofillServerCommunication'
].join(','))

// ---------------------------------------------------------------------------
// 2. Identita' uniforme (allineata a Tor Browser: Firefox ESR / Windows)
// ---------------------------------------------------------------------------
const UA = 'Mozilla/5.0 (Windows NT 10.0; rv:128.0) Gecko/20100101 Firefox/128.0'
const ACCEPT_LANG = 'en-US,en;q=0.5'
const HOME = 'https://duckduckgo.com/'
const CHROME_H = 88
const STEP_W = 200
const STEP_H = 100

let win = null
let chrome = null           // la UI (barra + tab)
let anonSession = null
let jsEnabled = true
let torReady = false
const tabs = new Map()      // id -> WebContentsView
let activeId = null
let nextId = 1

// ---------------------------------------------------------------------------
// 3. Hardening della sessione di navigazione
// ---------------------------------------------------------------------------
function hardenSession (ses) {
  ses.setUserAgent(UA, ACCEPT_LANG)
  ses.setProxy({ proxyRules: tor.proxyUrl, proxyBypassRules: '<-loopback>' })
  ses.setSpellCheckerEnabled(false)

  // nessun permesso, mai
  ses.setPermissionRequestHandler((_wc, _perm, cb) => cb(false))
  ses.setPermissionCheckHandler(() => false)
  ses.setDevicePermissionHandler(() => false)
  ses.setDisplayMediaRequestHandler(() => {})

  // kill-switch + HTTPS only + niente schemi esotici
  ses.webRequest.onBeforeRequest((details, cb) => {
    if (!torReady) return cb({ cancel: true })
    let u
    try { u = new URL(details.url) } catch (_) { return cb({ cancel: true }) }
    if (u.protocol === 'http:') {
      u.protocol = 'https:'
      return cb({ redirectURL: u.toString() })
    }
    if (u.protocol !== 'https:' && u.protocol !== 'devtools:' && u.protocol !== 'blob:' && u.protocol !== 'data:') {
      return cb({ cancel: true })
    }
    cb({ cancel: false })
  })

  // header coerenti e minimi
  ses.webRequest.onBeforeSendHeaders((details, cb) => {
    const h = details.requestHeaders
    h['User-Agent'] = UA
    h['Accept-Language'] = ACCEPT_LANG
    h['Upgrade-Insecure-Requests'] = '1'
    delete h['X-Requested-With']
    delete h['X-DevTools-Emulate-Network-Conditions-Client-Id']
    delete h['DNT']
    delete h['Sec-CH-UA']
    delete h['Sec-CH-UA-Mobile']
    delete h['Sec-CH-UA-Platform']
    delete h['Sec-CH-UA-Full-Version-List']
    // Referer solo same-origin
    if (h.Referer) {
      try {
        if (new URL(h.Referer).origin !== new URL(details.url).origin) delete h.Referer
      } catch (_) { delete h.Referer }
    }
    cb({ requestHeaders: h })
  })
}

function wipe () {
  if (!anonSession) return Promise.resolve()
  return Promise.all([
    anonSession.clearStorageData(),
    anonSession.clearCache(),
    anonSession.clearAuthCache(),
    anonSession.clearHostResolverCache(),
    anonSession.clearCodeCaches({})
  ]).catch(() => {})
}

// ---------------------------------------------------------------------------
// 4. Layout: letterboxing (viewport quantizzata 200x100 come Tor Browser)
// ---------------------------------------------------------------------------
function layout () {
  if (!win) return
  const { width, height } = win.getContentBounds()
  chrome.setBounds({ x: 0, y: 0, width, height: CHROME_H })
  const availW = width
  const availH = height - CHROME_H
  const w = Math.max(STEP_W, Math.floor(availW / STEP_W) * STEP_W)
  const h = Math.max(STEP_H, Math.floor(availH / STEP_H) * STEP_H)
  const x = Math.floor((availW - w) / 2)
  const y = CHROME_H + Math.floor((availH - h) / 2)
  for (const [id, v] of tabs) {
    v.setBounds(id === activeId ? { x, y, width: w, height: h } : { x: 0, y: 0, width: 0, height: 0 })
  }
}

// ---------------------------------------------------------------------------
// 5. Tab
// ---------------------------------------------------------------------------
function sendState (id) {
  const v = tabs.get(id)
  if (!v || !chrome || chrome.webContents.isDestroyed()) return
  const wc = v.webContents
  chrome.webContents.send('tab:state', {
    id,
    url: wc.getURL(),
    title: wc.getTitle() || 'Nuova scheda',
    loading: wc.isLoading(),
    canBack: wc.navigationHistory.canGoBack(),
    canForward: wc.navigationHistory.canGoForward(),
    active: id === activeId
  })
}

function createTab (url) {
  const id = nextId++
  const view = new WebContentsView({
    webPreferences: {
      session: anonSession,
      preload: path.join(__dirname, 'preload-site.js'),
      sandbox: true,
      contextIsolation: false,   // il preload deve patchare il main world
      nodeIntegration: false,
      webgl: false,
      plugins: false,
      spellcheck: false,
      backgroundThrottling: false,
      javascript: jsEnabled,
      safeDialogs: true,
      disableBlinkFeatures: 'AutomationControlled,WebBluetooth,WebUSB,Serial,IdleDetection'
    }
  })
  const wc = view.webContents
  wc.setWebRTCIPHandlingPolicy('disable_non_proxied_udp')
  wc.setAudioMuted(false)
  wc.setWindowOpenHandler(({ url: u }) => { createTab(u); return { action: 'deny' } })

  for (const ev of ['did-start-loading', 'did-stop-loading', 'did-navigate', 'did-navigate-in-page', 'page-title-updated']) {
    wc.on(ev, () => sendState(id))
  }
  wc.on('did-fail-load', (_e, code, desc, validated) => {
    if (code === -3) return
    wc.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(
      `<body style="background:#111;color:#bbb;font:14px system-ui;padding:40px">
       <h2 style="color:#e05">Caricamento bloccato o fallito</h2>
       <p>${desc} (${code})</p><p style="color:#666">${validated || ''}</p></body>`))
  })

  tabs.set(id, view)
  win.contentView.addChildView(view)
  activeId = id
  layout()
  wc.loadURL(url || HOME)
  if (chrome) chrome.webContents.send('tab:created', { id })
  sendState(id)
  return id
}

function closeTab (id) {
  const v = tabs.get(id)
  if (!v) return
  win.contentView.removeChildView(v)
  v.webContents.close()
  tabs.delete(id)
  if (chrome) chrome.webContents.send('tab:closed', { id })
  if (activeId === id) {
    activeId = tabs.size ? [...tabs.keys()][tabs.size - 1] : null
    if (activeId) sendState(activeId)
  }
  if (!tabs.size) createTab(HOME)
  layout()
}

function active () { return activeId ? tabs.get(activeId) : null }

function toUrl (input) {
  const s = String(input || '').trim()
  if (!s) return HOME
  if (/^https?:\/\//i.test(s)) return s
  if (/^[\w.-]+\.[a-z]{2,}(\/|$|:)/i.test(s) || /\.onion(\/|$)/i.test(s)) return 'https://' + s
  return 'https://duckduckgo.com/?q=' + encodeURIComponent(s)
}

// ---------------------------------------------------------------------------
// 6. IPC dalla UI
// ---------------------------------------------------------------------------
ipcMain.handle('nav', async (_e, action, payload) => {
  const v = active()
  const wc = v && v.webContents
  switch (action) {
    case 'go': if (wc) wc.loadURL(toUrl(payload)); break
    case 'back': if (wc && wc.navigationHistory.canGoBack()) wc.navigationHistory.goBack(); break
    case 'forward': if (wc && wc.navigationHistory.canGoForward()) wc.navigationHistory.goForward(); break
    case 'reload': if (wc) wc.reloadIgnoringCache(); break
    case 'stop': if (wc) wc.stop(); break
    case 'home': if (wc) wc.loadURL(HOME); break
  }
})

ipcMain.handle('tab', async (_e, action, id) => {
  if (action === 'new') return createTab(HOME)
  if (action === 'close') return closeTab(id)
  if (action === 'activate') { activeId = id; layout(); sendState(id) }
})

ipcMain.handle('tor:new-identity', async () => {
  await tor.newIdentity()
  await wipe()
  for (const [id, v] of tabs) { v.webContents.reloadIgnoringCache(); sendState(id) }
  return true
})

ipcMain.handle('js:toggle', async () => {
  jsEnabled = !jsEnabled
  // le webPreferences sono immutabili: ricreo le tab con il nuovo valore
  const urls = [...tabs.entries()].map(([id, v]) => [id, v.webContents.getURL()])
  for (const [id] of urls) closeTabSilently(id)
  for (const [, u] of urls) createTab(u)
  return jsEnabled
})

function closeTabSilently (id) {
  const v = tabs.get(id)
  if (!v) return
  win.contentView.removeChildView(v)
  v.webContents.close()
  tabs.delete(id)
  if (chrome) chrome.webContents.send('tab:closed', { id })
}

// PANIC: cancella tutto e chiude
ipcMain.handle('panic', async () => { await wipe(); app.exit(0) })

// ---------------------------------------------------------------------------
// 7. Avvio
// ---------------------------------------------------------------------------
function createWindow () {
  win = new BaseWindow({
    width: 1000,
    height: 700 + CHROME_H,
    minWidth: 600,
    minHeight: 400,
    backgroundColor: '#101014',
    title: 'AnonBrowser',
    autoHideMenuBar: true
  })
  Menu.setApplicationMenu(null)

  chrome = new WebContentsView({
    webPreferences: {
      preload: path.join(__dirname, 'preload-ui.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    }
  })
  chrome.webContents.loadFile(path.join(__dirname, 'ui', 'index.html'))
  win.contentView.addChildView(chrome)
  win.on('resize', layout)
  layout()
}

function torStatus (state, detail) {
  torReady = state === 'ready'
  console.error('[tor]', state, detail || '')
  if (chrome && !chrome.webContents.isDestroyed()) {
    chrome.webContents.send('tor:status', { state, detail })
  }
}

// Il sandbox di Chromium richiede un utente non-root. In container che girano
// come root si disattiva esplicitamente con ANON_NO_SANDBOX=1.
if (process.env.ANON_NO_SANDBOX === '1') app.commandLine.appendSwitch('no-sandbox')
else app.enableSandbox()
app.on('window-all-closed', () => app.quit())
app.on('before-quit', () => { wipe(); tor.stop() })
process.on('exit', () => tor.stop())

app.whenReady().then(async () => {
  anonSession = session.fromPartition('anon-ephemeral', { cache: false }) // in-memory: niente su disco
  hardenSession(anonSession)
  createWindow()

  const onReady = () => {
    torStatus('ready', 'circuito attivo')
    if (!tabs.size) createTab(HOME)
  }

  tor.on('progress', p => { if (p < 100) torStatus('bootstrap', p + '%') })
  tor.on('ready', onReady)   // copre anche il bootstrap lento, oltre il timeout
  tor.on('down', () => torStatus('down', 'Tor non attivo — traffico bloccato'))

  chrome.webContents.once('did-finish-load', async () => {
    torStatus('bootstrap', '0%')
    try {
      await tor.start()
    } catch (err) {
      // il processo tor resta vivo e continua a provare: il kill-switch tiene
      torStatus('error', err.message)
    }
  })
})
