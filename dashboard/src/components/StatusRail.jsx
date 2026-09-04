import { StatusDot } from './ui'

const hhmmss = (ms) => {
  const s = Math.floor(ms / 1000)
  return [s / 3600, (s % 3600) / 60, s % 60].map((n) => String(Math.floor(n)).padStart(2, '0')).join(':')
}

export function StatusRail({ state }) {
  const halted = state.circuitBreaker
  const degraded = state.nodes.a.api !== 'ONLINE' || state.nodes.b.api !== 'ONLINE'
  const tone = halted ? 'critical' : degraded ? 'warn' : 'stable'
  // classi esplicite: Tailwind non risolve i nomi costruiti a runtime
  const toneText = { critical: 'text-critical', warn: 'text-warn', stable: 'text-stable' }[tone]
  const label = halted ? 'NETWORK HALTED' : degraded ? 'DEGRADED LINK' : 'ALL SYSTEMS NOMINAL'

  return (
    <header className="flex items-center gap-6 border border-line bg-panel px-4 py-2.5">
      <div className="flex items-center gap-2.5">
        <StatusDot tone={tone} />
        <span className="font-label text-[12px] uppercase tracking-[0.22em] text-ink">Hedge NOC</span>
        <span className="font-mono text-[10px] text-inkMute">cross-broker · A ⇄ B</span>
      </div>

      <span className={`font-label text-[10px] uppercase tracking-[0.18em] ${toneText}`}>{label}</span>

      <div className="ml-auto flex items-center gap-5 font-mono text-[10px] text-inkMute">
        <span>ROUTING <span className={state.routingMode === 'AUTO' ? 'text-stable' : 'text-warn'}>{state.routingMode}</span></span>
        <span>QUEUE <span className="text-ink">{state.nodes.core.queue}</span></span>
        <span>UPTIME <span className="text-ink tabular-nums">{hhmmss(state.nodes.core.uptime)}</span></span>
      </div>
    </header>
  )
}
