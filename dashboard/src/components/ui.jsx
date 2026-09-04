/** Primitive condivise: pannello, etichette, indicatori di stato. */

export function Panel({ title, meta, accent = 'flow', className = '', bodyClass = '', children }) {
  const bar = {
    flow: 'bg-flow', stable: 'bg-stable', warn: 'bg-warn', critical: 'bg-critical', core: 'bg-core',
  }[accent]
  return (
    <section className={`relative flex min-h-0 flex-col border border-line bg-panel shadow-panel ${className}`}>
      <header className="flex shrink-0 items-center gap-3 border-b border-line px-4 py-2.5">
        <span className={`h-3 w-px ${bar}`} aria-hidden="true" />
        <h2 className="font-label text-[11px] uppercase tracking-[0.18em] text-ink/80">{title}</h2>
        {meta ? <div className="ml-auto font-mono text-[10px] text-inkMute">{meta}</div> : null}
      </header>
      <div className={`min-h-0 flex-1 ${bodyClass}`}>{children}</div>
    </section>
  )
}

export function StatusDot({ tone = 'stable', pulse = true }) {
  const c = { stable: 'bg-stable', flow: 'bg-flow', warn: 'bg-warn', critical: 'bg-critical' }[tone]
  return (
    <span className="relative inline-flex h-1.5 w-1.5">
      {pulse && <span className={`absolute inline-flex h-full w-full animate-ping rounded-full opacity-60 ${c}`} />}
      <span className={`relative inline-flex h-1.5 w-1.5 rounded-full ${c}`} />
    </span>
  )
}

export function Label({ children }) {
  return <div className="font-label text-[10px] uppercase tracking-[0.16em] text-inkMute">{children}</div>
}

/** Valore numerico monospaziato, allineato in colonna. */
export function Readout({ value, unit, tone = 'text-ink', size = 'text-2xl' }) {
  return (
    <div className={`font-mono tabular-nums ${size} ${tone}`}>
      {value}
      {unit && <span className="ml-1 text-[11px] text-inkMute">{unit}</span>}
    </div>
  )
}

/** Sparkline area+linea con endpoint evidenziato e zero-line. */
export function Sparkline({ data, stroke = '#38BDF8', zero = true, height = 40 }) {
  const w = 220
  const max = Math.max(...data.map(Math.abs), 0.1)
  const pt = (v, i) => [(i / (data.length - 1)) * w, height / 2 - (v / max) * (height / 2 - 3)]
  const path = data.map((v, i) => `${i ? 'L' : 'M'}${pt(v, i).map((n) => n.toFixed(1)).join(' ')}`).join('')
  const last = pt(data[data.length - 1], data.length - 1)
  return (
    <svg viewBox={`0 0 ${w} ${height}`} className="w-full" role="img" aria-label="andamento recente">
      {zero && <line x1="0" y1={height / 2} x2={w} y2={height / 2} stroke="#17242F" strokeWidth="1" />}
      <path d={`${path}L${w} ${height} L0 ${height}Z`} fill={stroke} opacity="0.08" />
      <path d={path} fill="none" stroke={stroke} strokeWidth="1.5" strokeLinejoin="round" />
      <circle cx={last[0]} cy={last[1]} r="2.5" fill={stroke} stroke="#0A121A" strokeWidth="2" />
    </svg>
  )
}
