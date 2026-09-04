import { useEffect, useMemo, useRef, useState } from 'react'
import { NetworkFeed } from '../data/networkSimulator'

/**
 * Unico punto di ingresso dei dati per l'intera dashboard.
 * Sostituendo NetworkFeed con il client WebSocket reale, nessun componente cambia.
 */
export function useHedgeNetwork() {
  const feed = useMemo(() => new NetworkFeed(), [])
  const [state, setState] = useState(() => feed.state)
  const dispatch = useRef((a) => feed.dispatch(a)).current

  useEffect(() => {
    const off = feed.subscribe(setState)
    feed.start()
    return () => {
      off()
      feed.stop()
    }
  }, [feed])

  return { state, dispatch }
}
