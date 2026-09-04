import { Fragment } from 'react'
import { Panel, Label, Readout, Sparkline } from './ui'

/* ---------------------------------------------------------------- NET DELTA */
export function GlobalNetDelta({ state }) {
  const { netDelta, netDeltaHistory } = state.metrics
  const flat = Math.abs(netDelta) < 0.05
  const tone = flat ? 'text-stable' : Math.abs(netDelta) > 0.45 ? 'text-critical' : 'text-warn'
  const a = state.nodes.a.exposure
  const b = state.nodes.b.exposure
  const span = Math.max(Math.abs(a), Math.abs(b), 1)

  return (
    <Panel title="Global Net Delta" accent={flat ? 'stable' : 'warn'} meta="LOT · AGGREGATO DI RETE" bodyClass="p-4">
      <div className="flex items-end justify-between">
        <Readout value={`${netDelta >= 0 ? '+' : ''}${netDelta.toFixed(2)}`} unit="lot" tone={tone} size="text-[34px] leading-none" />
        <span className={`font-label text-[10px] uppercase tracking-[0.16em] ${tone}`}>
          {flat ? 'flat / hedged' : 'esposizione aperta'}
        </span>
      </div>
      <div className="mt-3"><Sparkline data={netDeltaHistory} stroke={flat ? '#2EE6A8' : '#F5A524'} /></div>
      <div className="mt-3 space-y-2">
        {[['BRK-A', a, '#38BDF8'], ['BRK-B', b, '#8B7CF6']].map(([k, v, c]) => (
          <div key={k} className="flex items-center gap-3">
            <span className="w-14 font-label text-[10px] tracking-[0.14em] text-inkMute">{k}</span>
            <div className="relative h-1.5 flex-1 bg-panelHi">
              <span className="absolute inset-y-0 left-1/2 w-px bg-line" />
              <span
                className="absolute inset-y-0"
                style={{
                  background: c,
                  left: v >= 0 ? '50%' : `${50 - (Math.abs(v) / span) * 50}%`,
                  width: `${(Math.abs(v) / span) * 50}%`,
                }}
              />
            </div>
            <span className="w-16 text-right font-mono text-[11px] tabular-nums text-ink">{v.toFixed(2)}</span>
          </div>
        ))}
      </div>
    </Panel>
  )
}

/* ------------------------------------------------------------ LATENCY MATRIX */
const SLA = { 0: 80, 1: 120, 2: 250 }
const STAGES = ['SEND → ACK', 'ACK → FILL', 'ROUNDTRIP p95']

/** Heat di magnitudine su singola tinta; il colore di stato entra solo oltre SLA. */
function cell(ms, stage) {
  const over = ms > SLA[stage]
  const k = Math.min(1, ms / (SLA[stage] * 1.6))
  return {
    background: over ? 'rgba(245,165,36,0.14)' : `rgba(56,189,248,${(0.05 + k * 0.16).toFixed(3)})`,
    color: over ? '#F5A524' : '#C7D7E5',
  }
}

export function LatencyMatrix({ state }) {
  const rows = [
    ['LEG A · ECN', state.metrics.latency.a],
    ['LEG B · LP', state.metrics.latency.b],
  ]
  const breaches = rows.flatMap(([, v]) => v.filter((ms, i) => ms > SLA[i])).length

  return (
    <Panel title="Latency Matrix" accent={breaches ? 'warn' : 'flow'} meta="MS · ROLLING 60s" bodyClass="p-4">
      <div className="grid grid-cols-[64px_repeat(3,1fr)] gap-px bg-line text-center">
        <div className="bg-panel py-2" />
        {STAGES.map((s) => (
          <div key={s} className="bg-panel py-2 font-label text-[9px] uppercase tracking-[0.12em] text-inkMute">{s}</div>
        ))}
        {rows.map(([leg, vals]) => (
          <Fragment key={leg}>
            <div className="flex items-center bg-panel px-2 font-label text-[10px] tracking-[0.1em] text-ink">{leg}</div>
            {vals.map((ms, i) => (
              <div key={leg + i} className="py-3 font-mono text-[15px] tabular-nums" style={cell(ms, i)}>
                {ms}
                {ms > SLA[i] && <span className="ml-1 align-super text-[8px]">SLA</span>}
              </div>
            ))}
          </Fragment>
        ))}
      </div>
      <div className="mt-3 flex items-center justify-between font-label text-[9px] uppercase tracking-[0.14em] text-inkMute">
        <span>SLA 80 / 120 / 250 ms</span>
        <span className={breaches ? 'text-warn' : 'text-stable'}>
          {breaches ? `${breaches} sforamenti attivi` : 'tutte le tratte entro SLA'}
        </span>
      </div>
    </Panel>
  )
}

/* ------------------------------------------------------- SLIPPAGE DIFFERENTIAL */
export function SlippageDifferential({ state }) {
  const { slippage, slippageHistory } = state.metrics
  const over = Math.abs(slippage) > 2.5
  const favA = slippage < 0
  return (
    <Panel title="Slippage Differential" accent={over ? 'warn' : 'flow'} meta="PIP · A − B" bodyClass="p-4">
      <div className="flex items-end justify-between">
        <Readout
          value={`${slippage >= 0 ? '+' : ''}${slippage.toFixed(2)}`}
          unit="pip"
          tone={over ? 'text-warn' : 'text-ink'}
          size="text-[34px] leading-none"
        />
        <span className="font-label text-[10px] uppercase tracking-[0.16em] text-inkMute">
          esecuzione migliore su <span className={favA ? 'text-flow' : 'text-core'}>{favA ? 'BRK-A' : 'BRK-B'}</span>
        </span>
      </div>
      <div className="mt-3"><Sparkline data={slippageHistory} stroke={over ? '#F5A524' : '#38BDF8'} /></div>
      <div className="mt-3 grid grid-cols-3 gap-px bg-line">
        {[['MEDIA 1h', '+0.42'], ['PEGGIORE', '+3.10'], ['COSTO STIMATO', '−184 €']].map(([k, v]) => (
          <div key={k} className="bg-panel px-2 py-2">
            <Label>{k}</Label>
            <div className="mt-1 font-mono text-[13px] tabular-nums text-ink">{v}</div>
          </div>
        ))}
      </div>
    </Panel>
  )
}
