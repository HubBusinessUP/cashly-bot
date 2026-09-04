import { useHedgeNetwork } from './hooks/useHedgeNetwork'
import { StatusRail } from './components/StatusRail'
import { TopologyNetworkMap } from './components/TopologyNetworkMap'
import { NetworkStream } from './components/NetworkStream'
import { MasterControlPanel } from './components/MasterControlPanel'
import { GlobalNetDelta, LatencyMatrix, SlippageDifferential } from './components/NetworkMetrics'

/**
 * Griglia NOC — 12 colonne × 5 fasce.
 *
 *  ┌──────────────────────────────────────────────┬───────────────┐
 *  │ STATUS RAIL                          (1-12)  │               │
 *  ├──────────────────────────────────────────────┤ NETWORK       │
 *  │ TOPOLOGY NETWORK MAP                 (1-8)   │ STREAM        │
 *  │                                              │ (9-12)        │
 *  ├───────────┬───────────┬──────────────────────┤ syslog        │
 *  │ NET DELTA │ LATENCY   │ SLIPPAGE DIFF (1-8)  │ full height   │
 *  ├───────────┴───────────┴──────────────────────┴───────────────┤
 *  │ MASTER CONTROL PANEL                                 (1-12)  │
 *  └──────────────────────────────────────────────────────────────┘
 */
export default function App() {
  const { state, dispatch } = useHedgeNetwork()

  return (
    <div className="min-h-screen bg-void p-3 text-ink">
      <div className="mx-auto grid max-w-[1680px] gap-3 lg:h-[calc(100vh-1.5rem)] lg:grid-cols-12 lg:grid-rows-[auto_minmax(0,1.35fr)_minmax(0,1fr)_auto]">
        <div className="lg:col-span-12"><StatusRail state={state} /></div>

        <div className="lg:col-span-8 lg:row-span-1 min-h-[380px]">
          <TopologyNetworkMap state={state} />
        </div>

        <div className="lg:col-span-4 lg:row-span-2 min-h-[420px]">
          <NetworkStream state={state} />
        </div>

        <div className="grid gap-3 sm:grid-cols-3 lg:col-span-8">
          <GlobalNetDelta state={state} />
          <LatencyMatrix state={state} />
          <SlippageDifferential state={state} />
        </div>

        <div className="lg:col-span-12">
          <MasterControlPanel state={state} dispatch={dispatch} />
        </div>
      </div>
    </div>
  )
}
