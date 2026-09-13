'use strict'
// Gira nel main world di ogni pagina, PRIMA di qualsiasi script del sito.
// Obiettivo: chiudere i canali che rivelano IP reale, hardware, locale e
// restituire valori uniformi invece di valori "unici".

;(function () {
  const def = (obj, prop, value) => {
    try {
      Object.defineProperty(obj, prop, { get: () => value, configurable: false, enumerable: true })
    } catch (_) {}
  }
  const kill = (obj, prop) => { try { delete obj[prop] } catch (_) {} try { obj[prop] = undefined } catch (_) {} }

  // --- 1. WebRTC: il leak di IP piu' comune ---------------------------------
  for (const k of ['RTCPeerConnection', 'webkitRTCPeerConnection', 'mozRTCPeerConnection',
    'RTCDataChannel', 'RTCSessionDescription', 'RTCIceCandidate', 'webkitRTCPeerConnection']) {
    kill(window, k)
  }

  // --- 2. Hardware / dispositivi -------------------------------------------
  kill(navigator, 'mediaDevices')
  kill(navigator, 'getUserMedia')
  kill(navigator, 'webkitGetUserMedia')
  kill(navigator, 'bluetooth')
  kill(navigator, 'usb')
  kill(navigator, 'serial')
  kill(navigator, 'hid')
  kill(navigator, 'getBattery')
  kill(navigator, 'connection')
  kill(navigator, 'getGamepads')
  kill(window, 'BatteryManager')

  def(navigator, 'hardwareConcurrency', 2)      // valore uniforme Tor Browser
  def(navigator, 'deviceMemory', 8)
  def(navigator, 'maxTouchPoints', 0)
  def(navigator, 'webdriver', false)
  def(navigator, 'plugins', Object.freeze([]))
  def(navigator, 'mimeTypes', Object.freeze([]))
  def(navigator, 'doNotTrack', null)

  // --- 3. Identita' locale: sempre en-US / UTC / Windows --------------------
  def(navigator, 'language', 'en-US')
  def(navigator, 'languages', Object.freeze(['en-US', 'en']))
  def(navigator, 'platform', 'Win32')
  def(navigator, 'oscpu', 'Windows NT 10.0; Win64; x64')
  def(navigator, 'vendor', '')
  def(navigator, 'productSub', '20100101')
  def(navigator, 'buildID', '20181001000000')

  // fuso orario sempre UTC: il timezone e' uno dei segnali piu' identificanti
  Date.prototype.getTimezoneOffset = function () { return 0 }
  const utcString = Date.prototype.toUTCString
  Date.prototype.toString = function () { return utcString.call(this).replace('GMT', 'GMT+0000 (UTC)') }
  Date.prototype.toTimeString = function () { return utcString.call(this).split(' ').slice(4).join(' ') + ' (UTC)' }
  Date.prototype.toLocaleString = function () { return this.toISOString().replace('T', ' ').slice(0, 19) }
  Date.prototype.toLocaleDateString = function () { return this.toISOString().slice(0, 10) }
  Date.prototype.toLocaleTimeString = function () { return this.toISOString().slice(11, 19) }
  if (window.Intl && Intl.DateTimeFormat) {
    const ODTF = Intl.DateTimeFormat
    const patched = function (loc, opts) {
      return new ODTF('en-US', Object.assign({}, opts, { timeZone: 'UTC' }))
    }
    patched.prototype = ODTF.prototype
    patched.supportedLocalesOf = ODTF.supportedLocalesOf.bind(ODTF)
    try { Intl.DateTimeFormat = patched } catch (_) {}
  }

  // --- 4. Schermo: riporto la viewport, non il monitor reale ----------------
  const s = window.screen
  def(s, 'width', window.innerWidth); def(s, 'height', window.innerHeight)
  def(s, 'availWidth', window.innerWidth); def(s, 'availHeight', window.innerHeight)
  def(s, 'availLeft', 0); def(s, 'availTop', 0)
  def(s, 'colorDepth', 24); def(s, 'pixelDepth', 24)
  def(window, 'devicePixelRatio', 1)
  def(window, 'outerWidth', window.innerWidth)
  def(window, 'outerHeight', window.innerHeight)
  def(window, 'screenX', 0); def(window, 'screenY', 0)

  // --- 5. Canvas / WebGL / Audio: niente lettura di impronte ----------------
  const blank = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=='
  if (window.HTMLCanvasElement) {
    HTMLCanvasElement.prototype.toDataURL = function () { return blank }
    HTMLCanvasElement.prototype.toBlob = function (cb) { cb && cb(new Blob([], { type: 'image/png' })) }
  }
  if (window.CanvasRenderingContext2D) {
    const gid = CanvasRenderingContext2D.prototype.getImageData
    CanvasRenderingContext2D.prototype.getImageData = function (x, y, w, h) {
      const d = gid.call(this, x, y, w, h)
      d.data.fill(0)
      return d
    }
  }
  if (window.OffscreenCanvas) kill(window, 'OffscreenCanvas')
  for (const k of ['WebGLRenderingContext', 'WebGL2RenderingContext', 'WebGPU', 'GPU']) kill(window, k)
  if (window.HTMLCanvasElement) {
    const gc = HTMLCanvasElement.prototype.getContext
    HTMLCanvasElement.prototype.getContext = function (type, ...rest) {
      if (/webgl|webgpu|bitmaprenderer/i.test(String(type))) return null
      return gc.call(this, type, ...rest)
    }
  }
  for (const k of ['AudioContext', 'webkitAudioContext', 'OfflineAudioContext', 'webkitOfflineAudioContext']) kill(window, k)
  kill(window, 'SpeechSynthesis'); kill(window, 'speechSynthesis')

  // --- 6. Storage persistente e sensori -----------------------------------
  kill(navigator, 'storage')
  kill(navigator, 'credentials')
  kill(navigator, 'keyboard')
  kill(navigator, 'locks')
  kill(navigator, 'presentation')
  kill(navigator, 'scheduling')
  kill(navigator, 'userAgentData')
  for (const k of ['Accelerometer', 'Gyroscope', 'Magnetometer', 'AmbientLightSensor',
    'DeviceOrientationEvent', 'DeviceMotionEvent', 'IdleDetector', 'NetworkInformation',
    'Notification', 'PushManager', 'ReportingObserver']) kill(window, k)

  // --- 7. Timer a bassa risoluzione: blocca i fingerprint temporali --------
  const round = t => Math.floor(t / 100) * 100
  if (window.performance) {
    const now = performance.now.bind(performance)
    performance.now = () => round(now())
    kill(performance, 'memory')
  }
  const RealD = Date.now.bind(Date)
  Date.now = () => round(RealD())
})()
