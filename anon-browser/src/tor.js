'use strict'
// Avvio e controllo di un'istanza Tor dedicata al browser.
// Porte alte per non collidere con un tor di sistema gia' attivo.

const { spawn, spawnSync } = require('child_process')
const { EventEmitter } = require('events')
const net = require('net')
const fs = require('fs')
const os = require('os')
const path = require('path')

const SOCKS_PORT = 9250
const CONTROL_PORT = 9251

const BIN_CANDIDATES = [
  process.env.ANON_TOR_BINARY,
  '/usr/bin/tor',
  '/usr/sbin/tor',
  '/usr/local/bin/tor',
  '/opt/homebrew/bin/tor',
  'C:\\Program Files\\Tor\\tor.exe',
  'C:\\Program Files (x86)\\Tor\\tor.exe'
].filter(Boolean)

function findBinary () {
  for (const c of BIN_CANDIDATES) {
    try { if (fs.statSync(c).isFile()) return c } catch (_) {}
  }
  const probe = spawnSync(process.platform === 'win32' ? 'where' : 'which', ['tor'], { encoding: 'utf8' })
  const found = (probe.stdout || '').split(/\r?\n/).map(s => s.trim()).filter(Boolean)[0]
  return found || null
}

class Tor extends EventEmitter {
  constructor () {
    super()
    this.proc = null
    this.ready = false
    this.progress = 0
    this.dataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'anonbrowser-tor-'))
    this.socksPort = SOCKS_PORT
    this.controlPort = CONTROL_PORT
  }

  get proxyUrl () { return `socks5://127.0.0.1:${this.socksPort}` }

  writeTorrc () {
    const rc = [
      `SocksPort 127.0.0.1:${this.socksPort} IsolateDestAddr IsolateDestPort`,
      `ControlPort 127.0.0.1:${this.controlPort}`,
      'CookieAuthentication 1',
      `DataDirectory ${this.dataDir}`,
      'ClientOnly 1',
      'AvoidDiskWrites 1',
      'SafeLogging 1',
      // niente DNS/traffico in chiaro fuori dal circuito
      'SocksPolicy accept 127.0.0.1',
      'SocksPolicy reject *'
    ].join('\n') + '\n'
    const p = path.join(this.dataDir, 'torrc')
    fs.writeFileSync(p, rc, { mode: 0o600 })
    return p
  }

  start () {
    return new Promise((resolve, reject) => {
      const bin = findBinary()
      if (!bin) {
        return reject(new Error(
          'Binario "tor" non trovato. Installalo:\n' +
          '  Debian/Ubuntu: sudo apt install tor\n' +
          '  macOS:         brew install tor\n' +
          '  Windows:       Tor Expert Bundle, poi ANON_TOR_BINARY=C:\\path\\tor.exe'
        ))
      }
      const torrc = this.writeTorrc()
      this.proc = spawn(bin, ['-f', torrc], { stdio: ['ignore', 'pipe', 'pipe'] })

      const timer = setTimeout(() => {
        if (!this.ready) reject(new Error('bootstrap lento (>120s), continuo a provare'))
      }, 120000)

      this.proc.stdout.setEncoding('utf8')
      this.proc.stdout.on('data', chunk => {
        const m = /Bootstrapped (\d+)%/.exec(chunk)
        if (m) {
          this.progress = parseInt(m[1], 10)
          this.emit('progress', this.progress)
          if (this.progress >= 100 && !this.ready) {
            this.ready = true
            clearTimeout(timer)
            this.emit('ready')
            resolve()
          }
        }
      })
      this.proc.stderr.setEncoding('utf8')
      this.proc.stderr.on('data', d => this.emit('log', String(d).trim()))

      this.proc.on('exit', code => {
        const wasReady = this.ready
        this.ready = false
        this.emit('down', code)
        if (!wasReady) { clearTimeout(timer); reject(new Error('Tor terminato (exit ' + code + ')')) }
      })
      this.proc.on('error', err => { clearTimeout(timer); reject(err) })
    })
  }

  // Nuovo circuito: SIGNAL NEWNYM via control port con cookie auth.
  newIdentity () {
    return new Promise((resolve, reject) => {
      let cookie
      try {
        cookie = fs.readFileSync(path.join(this.dataDir, 'control_auth_cookie')).toString('hex')
      } catch (err) { return reject(new Error('Cookie di controllo Tor non leggibile')) }

      const sock = net.connect(this.controlPort, '127.0.0.1')
      let buf = ''
      let step = 0
      sock.setTimeout(10000)
      sock.on('connect', () => sock.write(`AUTHENTICATE ${cookie}\r\n`))
      sock.on('data', d => {
        buf += d.toString()
        if (!buf.includes('\r\n')) return
        const line = buf.trim().split('\r\n').pop()
        buf = ''
        if (!line.startsWith('250')) { sock.end(); return reject(new Error('Control port: ' + line)) }
        if (step === 0) { step = 1; sock.write('SIGNAL NEWNYM\r\n') }
        else { sock.end(); resolve() }
      })
      sock.on('timeout', () => { sock.destroy(); reject(new Error('Timeout control port')) })
      sock.on('error', reject)
    })
  }

  stop () {
    if (this.proc && !this.proc.killed) { try { this.proc.kill('SIGTERM') } catch (_) {} }
    this.ready = false
    try { fs.rmSync(this.dataDir, { recursive: true, force: true }) } catch (_) {}
  }
}

module.exports = { Tor, SOCKS_PORT, CONTROL_PORT }
