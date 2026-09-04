import { useEffect, useRef, useState } from 'react'
import { Panel } from './ui'

/** Comando distruttivo: richiede pressione continua di 1.2s, non un click. */
function HoldToFire({ armed, onFire }) {
  const [p, setP] = useState(0)
  const raf = useRef(0)

  const start = () => {
    const t0 = performance.now()
    const step = (t) => {
      const v = Math.min(1, (t - t0) / 1200)
      setP(v)
      if (v < 1) raf.current = requestAnimationFrame(step)
      else onFire()
    }
    raf.current = requestAnimationFrame(step)
  }
  const cancel = () => {
    cancelAnimationFrame(raf.current)
    setP(0)
  }
  useEffect(() => cancel, [])

  return (
    <button
      onPointerDown={start}
      onPointerUp={cancel}
      onPointerLeave={cancel}
      onKeyDown={(e) => e.key === 'Enter' && onFire()}
      className="group relative flex h-full w-full flex-col justify-between overflow-hidden border border-critical/50 bg-critical/10 px-4 py-3 text-left transition-colors hover:bg-critical/20 focus-visible:outline focus-visible:outline-1 focus-visible:outline-critical"
    >
      <span className="absolute inset-y-0 left-0 bg-critical/30" style={{ width: `${p * 100}%` }} aria-hidden="true" />
      <span className="relative font-label text-[13px] uppercase tracking-[0.18em] text-critical">
        Emergency Circuit Breaker
      </span>
      <span className="relative font-mono text-[10px] text-critical/70">
        {armed ? 'ARMATO — rete flat, routing sospeso' : p > 0 ? `arming… ${Math.round(p * 100)}%` : 'tieni premuto 1.2s per chiudere tutta la rete'}
      </span>
    </button>
  )
}

function Command({ title, hint, tone = 'flow', busy, onClick, children }) {
  const ring = { flow: 'border-flow/40 hover:bg-flow/10', core: 'border-core/40 hover:bg-core/10' }[tone]
  return (
    <button
      onClick={onClick}
      disabled={busy}
      className={`flex h-full flex-col justify-between border bg-panelHi px-4 py-3 text-left transition-colors disabled:opacity-50 focus-visible:outline focus-visible:outline-1 focus-visible:outline-flow ${ring}`}
    >
      <span className="font-label text-[13px] uppercase tracking-[0.18em] text-ink">{title}</span>
      <span className="font-mono text-[10px] text-inkMute">{children ?? hint}</span>
    </button>
  )
}

export function MasterControlPanel({ state, dispatch }) {
  const auto = state.routingMode === 'AUTO'
  return (
    <Panel
      title="Master Control"
      accent={state.circuitBreaker ? 'critical' : 'stable'}
      meta="COMANDI GLOBALI DI RETE"
      bodyClass="grid grid-cols-1 gap-3 p-3 sm:grid-cols-3"
    >
      <HoldToFire
        armed={state.circuitBreaker}
        onFire={() => dispatch({ type: state.circuitBreaker ? 'RESET_BREAKER' : 'CIRCUIT_BREAKER' })}
      />

      <Command
        title="Force Sync / Rebalance"
        busy={state.syncing}
        onClick={() => dispatch({ type: 'FORCE_SYNC' })}
      >
        {state.syncing
          ? 'riallineamento volumi in corso…'
          : `gap corrente ${(state.nodes.a.exposure + state.nodes.b.exposure).toFixed(2)} lot`}
      </Command>

      <Command
        title="Toggle Routing Mode"
        tone="core"
        onClick={() => dispatch({ type: 'TOGGLE_ROUTING' })}
      >
        <span className="flex items-center gap-2">
          <span className={auto ? 'text-stable' : 'text-inkMute'}>AUTO</span>
          <span className="relative inline-flex h-3.5 w-8 items-center border border-line bg-void px-0.5">
            <span
              className={`h-2.5 w-3.5 transition-transform ${auto ? 'bg-stable' : 'translate-x-3 bg-warn'}`}
            />
          </span>
          <span className={auto ? 'text-inkMute' : 'text-warn'}>MANUAL</span>
        </span>
      </Command>
    </Panel>
  )
}
