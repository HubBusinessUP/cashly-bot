import { Panel, StatusDot } from './ui'
import { linkHealth } from '../data/networkSimulator'

const EDGE_TONE = {
  ok:     { stroke: '#2EE6A8', dot: '#2EE6A8', dur: '1.6s', label: 'SYNCED' },
  sync:   { stroke: '#38BDF8', dot: '#38BDF8', dur: '0.7s', label: 'REBALANCING' },
  warn:   { stroke: '#F5A524', dot: '#F5A524', dur: '2.6s', label: 'DRIFT' },
  crit:   { stroke: '#FF4D6D', dot: '#FF4D6D', dur: '4s',   label: 'LINK DOWN' },
  halted: { stroke: '#3A4A5A', dot: '#5F7488', dur: '0s',    label: 'HALTED' },
}

/** Nodo broker: card SVG con telemetria di rete (ping, API, free margin). */
function BrokerNode({ x, y, node, health, align }) {
  const tone = EDGE_TONE[health]
  const w = 208
  const left = align === 'left' ? x - w : x
  return (
    <g transform={`translate(${left} ${y - 62})`}>
      <rect width={w} height="124" rx="2" fill="#0E1926" stroke={tone.stroke} strokeOpacity="0.45" />
      <rect width="2" height="124" fill={tone.stroke} opacity="0.8" />
      <text x="16" y="24" className="font-label" fill="#C7D7E5" fontSize="12" letterSpacing="1.6">{node.label}</text>
      <text x="16" y="40" className="font-mono" fill="#5F7488" fontSize="9" letterSpacing="1">{node.venue}</text>
      <line x1="12" y1="52" x2={w - 12} y2="52" stroke="#17242F" />
      {[
        ['PING', `${Math.round(node.ping)} ms`, node.ping > 150 ? '#F5A524' : '#C7D7E5'],
        ['API', node.api, node.api === 'ONLINE' ? '#2EE6A8' : '#FF4D6D'],
        ['FREE MARGIN', `${node.freeMargin.toFixed(1)} %`, node.freeMargin < 25 ? '#FF4D6D' : '#C7D7E5'],
        ['NET LOTS', node.exposure.toFixed(2), '#38BDF8'],
      ].map(([k, v, color], i) => (
        <g key={k} transform={`translate(0 ${68 + i * 15})`}>
          <text x="16" className="font-label" fill="#5F7488" fontSize="9" letterSpacing="1.2">{k}</text>
          <text x={w - 16} className="font-mono" fill={color} fontSize="10" textAnchor="end">{v}</text>
        </g>
      ))}
    </g>
  )
}

export function TopologyNetworkMap({ state }) {
  const { nodes, metrics, syncing, circuitBreaker } = state
  const ha = linkHealth(nodes.a, { netDelta: metrics.netDelta, syncing, circuitBreaker })
  const hb = linkHealth(nodes.b, { netDelta: metrics.netDelta, syncing, circuitBreaker })
  const ta = EDGE_TONE[ha]
  const tb = EDGE_TONE[hb]

  const edgeA = 'M248 190 C 330 190, 340 190, 392 190'
  const edgeB = 'M598 190 C 650 190, 660 190, 742 190'

  return (
    <Panel
      title="Topology · Hedge Network"
      meta={`3 NODES · 2 LINKS · ${circuitBreaker ? 'HALTED' : 'ROUTING ' + state.routingMode}`}
      accent={circuitBreaker ? 'critical' : 'core'}
      className="row-span-2"
      bodyClass="relative"
    >
      <svg viewBox="0 0 990 380" className="h-full w-full" role="img"
           aria-label="Mappa della rete di hedging: Broker A, motore di calcolo, Broker B">
        <defs>
          <pattern id="noc-grid" width="30" height="30" patternUnits="userSpaceOnUse">
            <path d="M30 0H0V30" fill="none" stroke="#0F1A24" strokeWidth="1" />
          </pattern>
          <radialGradient id="core-glow">
            <stop offset="0%" stopColor="#8B7CF6" stopOpacity="0.28" />
            <stop offset="100%" stopColor="#8B7CF6" stopOpacity="0" />
          </radialGradient>
        </defs>
        <rect width="990" height="380" fill="url(#noc-grid)" />

        {/* edge links */}
        <path id="edge-a" d={edgeA} fill="none" stroke={ta.stroke} strokeOpacity="0.35" strokeWidth="1.5"
              strokeDasharray={ha === 'halted' ? '2 6' : '0'} />
        <path id="edge-b" d={edgeB} fill="none" stroke={tb.stroke} strokeOpacity="0.35" strokeWidth="1.5"
              strokeDasharray={hb === 'halted' ? '2 6' : '0'} />

        {!circuitBreaker && [['edge-a', ta], ['edge-b', tb]].map(([id, tone]) =>
          [0, 0.5].map((delay) => (
            <circle key={`${id}-${delay}`} r="2.5" fill={tone.dot}>
              <animateMotion dur={tone.dur} begin={`${delay}s`} repeatCount="indefinite" rotate="auto">
                <mpath href={`#${id}`} />
              </animateMotion>
            </circle>
          )),
        )}

        <text x="320" y="176" textAnchor="middle" fill={ta.stroke} fontSize="9"
              className="font-label" letterSpacing="1.4">{ta.label}</text>
        <text x="670" y="176" textAnchor="middle" fill={tb.stroke} fontSize="9"
              className="font-label" letterSpacing="1.4">{tb.label}</text>
        <text x="320" y="212" textAnchor="middle" fill="#5F7488" fontSize="9" className="font-mono">
          {metrics.latency.a[0]}ms · fill {nodes.a.fill.toFixed(2)}
        </text>
        <text x="670" y="212" textAnchor="middle" fill="#5F7488" fontSize="9" className="font-mono">
          {metrics.latency.b[0]}ms · fill {nodes.b.fill.toFixed(2)}
        </text>

        {/* nodo centrale */}
        <circle cx="495" cy="190" r="96" fill="url(#core-glow)" />
        <g transform="translate(392 138)">
          <rect width="206" height="104" rx="2" fill="#0E1926" stroke="#8B7CF6" strokeOpacity="0.6" />
          <rect width="206" height="2" fill="#8B7CF6" />
          <text x="103" y="30" textAnchor="middle" className="font-label" fill="#C7D7E5" fontSize="12" letterSpacing="1.8">
            HEDGE ENGINE
          </text>
          <text x="103" y="46" textAnchor="middle" className="font-mono" fill="#8B7CF6" fontSize="9" letterSpacing="1">
            CORE · v2.4.1
          </text>
          <line x1="14" y1="58" x2="192" y2="58" stroke="#17242F" />
          <text x="14" y="76" className="font-label" fill="#5F7488" fontSize="9" letterSpacing="1.2">CPU</text>
          <text x="96" y="76" className="font-mono" fill="#C7D7E5" fontSize="10" textAnchor="end">
            {Math.round(nodes.core.cpu)}%
          </text>
          <text x="112" y="76" className="font-label" fill="#5F7488" fontSize="9" letterSpacing="1.2">QUEUE</text>
          <text x="192" y="76" className="font-mono" fill="#C7D7E5" fontSize="10" textAnchor="end">
            {nodes.core.queue}
          </text>
          <text x="14" y="92" className="font-label" fill="#5F7488" fontSize="9" letterSpacing="1.2">HEDGE RATIO</text>
          <text x="192" y="92" className="font-mono" fill="#2EE6A8" fontSize="10" textAnchor="end">1 : 1.00</text>
        </g>

        <BrokerNode x="248" y="190" node={nodes.a} health={ha} align="left" />
        <BrokerNode x="742" y="190" node={nodes.b} health={hb} align="right" />
      </svg>

      <div className="pointer-events-none absolute bottom-3 left-4 flex gap-4 font-label text-[9px] uppercase tracking-[0.14em] text-inkMute">
        <span className="flex items-center gap-1.5"><StatusDot tone="stable" pulse={false} /> synced</span>
        <span className="flex items-center gap-1.5"><StatusDot tone="flow" pulse={false} /> rebalancing</span>
        <span className="flex items-center gap-1.5"><StatusDot tone="warn" pulse={false} /> drift</span>
        <span className="flex items-center gap-1.5"><StatusDot tone="critical" pulse={false} /> link down</span>
      </div>
    </Panel>
  )
}
