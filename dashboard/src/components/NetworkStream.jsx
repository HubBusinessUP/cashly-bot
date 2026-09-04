import { useEffect, useMemo, useRef, useState } from 'react'
import { Panel } from './ui'

const TONE = {
  ok:   { text: 'text-stable', bar: 'bg-stable', tag: 'HEDGE-OK' },
  info: { text: 'text-flow',   bar: 'bg-flow',   tag: 'INFO' },
  warn: { text: 'text-warn',   bar: 'bg-warn',   tag: 'WARNING' },
  crit: { text: 'text-critical', bar: 'bg-critical', tag: 'CRITICAL' },
}

const FILTERS = [
  ['all', 'TUTTI'],
  ['ok', 'HEDGE'],
  ['warn', 'WARN'],
  ['crit', 'CRIT'],
]

const stamp = (d) =>
  `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}:${String(
    d.getSeconds(),
  ).padStart(2, '0')}.${String(d.getMilliseconds()).padStart(3, '0')}`

/**
 * Terminale syslog della rete. Autoscroll in testa, sospeso quando l'operatore
 * passa sopra il feed o applica un filtro: leggere un evento non deve essere
 * una corsa contro lo scroll.
 */
export function NetworkStream({ state }) {
  const [filter, setFilter] = useState('all')
  const [held, setHeld] = useState(false)
  const listRef = useRef(null)

  const events = useMemo(
    () => (filter === 'all' ? state.events : state.events.filter((e) => e.severity === filter)),
    [state.events, filter],
  )

  useEffect(() => {
    if (!held && listRef.current) listRef.current.scrollTop = 0
  }, [events, held])

  const counts = state.events.reduce((acc, e) => ({ ...acc, [e.severity]: (acc[e.severity] || 0) + 1 }), {})

  return (
    <Panel
      title="Network Stream"
      accent="flow"
      meta={`${state.events.length} EVENTI · ${held ? 'SCROLL IN PAUSA' : 'LIVE'}`}
      className="row-span-3"
      bodyClass="flex flex-col min-h-0"
    >
      <div className="flex shrink-0 items-center gap-1 border-b border-line px-3 py-2">
        {FILTERS.map(([k, l]) => (
          <button
            key={k}
            onClick={() => setFilter(k)}
            className={`px-2 py-1 font-label text-[9px] uppercase tracking-[0.14em] transition-colors focus-visible:outline focus-visible:outline-1 focus-visible:outline-flow ${
              filter === k ? 'bg-flow/15 text-flow' : 'text-inkMute hover:text-ink'
            }`}
          >
            {l}
            {k !== 'all' && counts[k] ? <span className="ml-1 font-mono">{counts[k]}</span> : null}
          </button>
        ))}
        <span className="ml-auto font-mono text-[9px] text-inkMute">tail -f hedge.net</span>
      </div>

      <ol
        ref={listRef}
        onMouseEnter={() => setHeld(true)}
        onMouseLeave={() => setHeld(false)}
        className="min-h-0 flex-1 overflow-y-auto font-mono text-[11px] leading-relaxed"
      >
        {events.map((e) => {
          const t = TONE[e.severity]
          return (
            <li key={e.id} className="flex gap-2 border-b border-line/60 px-3 py-1.5 hover:bg-panelHi">
              <span className={`mt-1 h-3 w-0.5 shrink-0 ${t.bar}`} aria-hidden="true" />
              <time className="shrink-0 tabular-nums text-inkMute">{stamp(e.t)}</time>
              <span className={`shrink-0 ${t.text}`}>[{e.tag}]</span>
              <span className="text-ink/85">{e.message}</span>
            </li>
          )
        })}
        {!events.length && (
          <li className="px-3 py-6 text-center font-label text-[10px] uppercase tracking-[0.14em] text-inkMute">
            nessun evento con questo filtro
          </li>
        )}
      </ol>
    </Panel>
  )
}
