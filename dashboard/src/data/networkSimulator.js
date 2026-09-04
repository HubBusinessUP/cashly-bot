/**
 * networkSimulator — sorgente unica di verità della rete di hedging.
 *
 * In produzione questa classe va sostituita da un client WebSocket verso il
 * risk engine: l'interfaccia pubblica (subscribe / dispatch) resta identica,
 * quindi i componenti UI non cambiano.
 *
 *   const feed = new NetworkFeed()
 *   feed.subscribe(state => ...)   // snapshot ad ogni tick (250ms)
 *   feed.dispatch({ type: 'FORCE_SYNC' })
 */

const SYMBOLS = ['EURUSD', 'GBPUSD', 'XAUUSD', 'USDJPY', 'NAS100']
const rnd = (a, b) => a + Math.random() * (b - a)
const pick = (xs) => xs[(Math.random() * xs.length) | 0]

export const SEVERITY = {
  OK: 'ok',
  INFO: 'info',
  WARN: 'warn',
  CRIT: 'crit',
}

const initialState = () => ({
  clock: 0,
  routingMode: 'AUTO',          // AUTO | MANUAL
  circuitBreaker: false,
  syncing: false,
  nodes: {
    core: { id: 'CORE', label: 'HEDGE ENGINE', cpu: 34, queue: 3, uptime: 0 },
    a: {
      id: 'BRK-A', label: 'BROKER A', venue: 'ECN / RETAIL',
      ping: 41, api: 'ONLINE', freeMargin: 68.4, exposure: 0, fill: 0,
    },
    b: {
      id: 'BRK-B', label: 'BROKER B', venue: 'INSTITUTIONAL / LP',
      ping: 12, api: 'ONLINE', freeMargin: 81.2, exposure: 0, fill: 0,
    },
  },
  metrics: {
    netDelta: 0.04,             // lotti netti di rete
    netDeltaHistory: Array.from({ length: 48 }, () => rnd(-0.3, 0.3)),
    slippage: 0.7,              // pip, A - B
    slippageHistory: Array.from({ length: 48 }, () => rnd(-1.4, 1.9)),
    latency: {
      // [send→ack, ack→fill, roundtrip p95]
      a: [41, 96, 188],
      b: [12, 28, 61],
    },
  },
  events: [],
})

let seq = 4192

export class NetworkFeed {
  constructor({ intervalMs = 250 } = {}) {
    this.state = initialState()
    this.intervalMs = intervalMs
    this.listeners = new Set()
    this.timer = null
  }

  subscribe(fn) {
    this.listeners.add(fn)
    fn(this.state)
    return () => this.listeners.delete(fn)
  }

  start() {
    if (this.timer) return
    this.timer = setInterval(() => this.tick(), this.intervalMs)
  }

  stop() {
    clearInterval(this.timer)
    this.timer = null
  }

  emit() {
    this.state = { ...this.state }
    this.listeners.forEach((fn) => fn(this.state))
  }

  log(severity, tag, message) {
    const s = this.state
    s.events = [
      { id: ++seq, t: new Date(), severity, tag, message },
      ...s.events,
    ].slice(0, 300)
  }

  dispatch(action) {
    const s = this.state
    switch (action.type) {
      case 'CIRCUIT_BREAKER':
        s.circuitBreaker = true
        s.routingMode = 'MANUAL'
        s.nodes.a.exposure = 0
        s.nodes.b.exposure = 0
        s.metrics.netDelta = 0
        this.log(SEVERITY.CRIT, 'BREAKER', 'Circuit breaker armato — flat su tutta la rete, routing sospeso')
        break
      case 'RESET_BREAKER':
        s.circuitBreaker = false
        this.log(SEVERITY.INFO, 'BREAKER', 'Circuit breaker rilasciato — rete in stato IDLE, routing manuale')
        break
      case 'FORCE_SYNC': {
        const gap = +(s.nodes.a.exposure + s.nodes.b.exposure).toFixed(2)
        s.syncing = true
        this.log(
          SEVERITY.INFO,
          'REBALANCE',
          `${action.auto ? 'Auto-sync' : 'Force sync'} — delta di rete ${gap > 0 ? '+' : ''}${gap} lot oltre tolleranza, riallineamento in corso`,
        )
        setTimeout(() => {
          s.nodes.b.exposure = -s.nodes.a.exposure
          s.metrics.netDelta = 0
          s.syncing = false
          this.log(SEVERITY.OK, 'REBALANCE', 'Volumi riallineati — net delta 0.00 lot, hedge ratio 1:1')
          this.emit()
        }, 1400)
        break
      }
      case 'TOGGLE_ROUTING':
        s.routingMode = s.routingMode === 'AUTO' ? 'MANUAL' : 'AUTO'
        this.log(SEVERITY.INFO, 'ROUTING', `Routing mode → ${s.routingMode}`)
        break
      default:
        break
    }
    this.emit()
  }

  tick() {
    const s = this.state
    const m = s.metrics
    s.clock += this.intervalMs
    s.nodes.core.uptime += this.intervalMs

    // --- telemetria di rete -------------------------------------------------
    s.nodes.a.ping = clamp(s.nodes.a.ping + rnd(-4, 4), 18, 240)
    s.nodes.b.ping = clamp(s.nodes.b.ping + rnd(-2, 2), 6, 90)
    s.nodes.core.cpu = clamp(s.nodes.core.cpu + rnd(-3, 3), 12, 92)
    s.nodes.core.queue = Math.max(0, Math.round(s.nodes.core.queue + rnd(-1.2, 1.2)))

    m.latency.a = [
      Math.round(s.nodes.a.ping),
      Math.round(clamp(m.latency.a[1] + rnd(-6, 6), 55, 420)),
      Math.round(clamp(m.latency.a[2] + rnd(-9, 9), 110, 620)),
    ]
    m.latency.b = [
      Math.round(s.nodes.b.ping),
      Math.round(clamp(m.latency.b[1] + rnd(-3, 3), 18, 140)),
      Math.round(clamp(m.latency.b[2] + rnd(-4, 4), 40, 190)),
    ]

    s.nodes.a.freeMargin = clamp(s.nodes.a.freeMargin + rnd(-0.35, 0.3), 8, 96)
    s.nodes.b.freeMargin = clamp(s.nodes.b.freeMargin + rnd(-0.2, 0.2), 8, 96)

    m.slippage = clamp(m.slippage + rnd(-0.35, 0.35), -3.2, 3.6)
    m.slippageHistory = [...m.slippageHistory.slice(1), m.slippage]

    // il net delta è la somma algebrica delle due gambe, non una serie a sé
    m.netDelta = +(s.nodes.a.exposure + s.nodes.b.exposure).toFixed(2)
    m.netDeltaHistory = [...m.netDeltaHistory.slice(1), m.netDelta]

    // --- eventi di rete -----------------------------------------------------
    if (!s.circuitBreaker && s.routingMode === 'AUTO' && Math.random() < 0.16) {
      this.openHedge()
    }
    // in AUTO il motore riallinea da solo appena il delta supera la tolleranza
    if (!s.circuitBreaker && s.routingMode === 'AUTO' && !s.syncing && Math.abs(m.netDelta) > 0.5) {
      this.dispatch({ type: 'FORCE_SYNC', auto: true })
    }
    if (s.nodes.a.ping > 150 && Math.random() < 0.35) {
      this.log(SEVERITY.WARN, 'LATENCY', `Spike su BRK-A — ping ${Math.round(s.nodes.a.ping)}ms oltre soglia 150ms, routing degradato`)
    }
    if (Math.abs(m.slippage) > 2.6 && Math.random() < 0.25) {
      this.log(SEVERITY.WARN, 'SLIPPAGE', `Differenziale A/B ${m.slippage.toFixed(2)} pip — sopra budget di esecuzione (2.50)`)
    }
    if (Math.random() < 0.012) {
      s.nodes.a.api = 'DEGRADED'
      this.log(SEVERITY.CRIT, 'API', 'BRK-A heartbeat perso — 3 keepalive falliti, riconnessione in corso')
      setTimeout(() => {
        s.nodes.a.api = 'ONLINE'
        this.log(SEVERITY.OK, 'API', 'BRK-A sessione ristabilita — ordini pendenti riconciliati')
        this.emit()
      }, 2600)
    }

    this.emit()
  }

  openHedge() {
    const s = this.state
    const sym = pick(SYMBOLS)
    const side = Math.random() > 0.5 ? 'BUY' : 'SELL'
    const lot = +(rnd(0.2, 2.5)).toFixed(2)
    const mismatch = Math.random() < 0.22
    const fillB = mismatch ? +(lot * rnd(0.86, 0.97)).toFixed(2) : lot

    s.nodes.a.exposure = +(s.nodes.a.exposure + (side === 'BUY' ? lot : -lot)).toFixed(2)
    s.nodes.b.exposure = +(s.nodes.b.exposure - (side === 'BUY' ? fillB : -fillB)).toFixed(2)
    s.nodes.a.fill = lot
    s.nodes.b.fill = fillB

    if (mismatch) {
      this.log(
        SEVERITY.WARN,
        'MISMATCH',
        `${sym} fill A ${lot.toFixed(2)} lot / fill B ${fillB.toFixed(2)} lot — gap ${(lot - fillB).toFixed(2)} lot, rebalance in coda`,
      )
    } else {
      this.log(
        SEVERITY.OK,
        'HEDGE',
        `${sym} ${side} ${lot.toFixed(2)} @ BRK-A / ${side === 'BUY' ? 'SELL' : 'BUY'} ${fillB.toFixed(2)} @ BRK-B — coppia sincronizzata`,
      )
    }
  }
}

function clamp(v, lo, hi) {
  return Math.min(hi, Math.max(lo, v))
}

/** Stato del link derivato dalla telemetria: guida colore ed animazione degli edge. */
export function linkHealth({ ping, api }, { netDelta, syncing, circuitBreaker }) {
  if (circuitBreaker) return 'halted'
  if (api !== 'ONLINE') return 'crit'
  if (syncing) return 'sync'
  if (ping > 150 || Math.abs(netDelta) > 0.45) return 'warn'
  return 'ok'
}
