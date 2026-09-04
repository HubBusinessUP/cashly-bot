# Cross-Broker Hedge NOC

Dashboard di trading e risk management per una strategia di hedging cross-broker
(Broker A ⇄ Broker B), disegnata come un **network operations center**: i due
broker sono nodi periferici, il motore di hedging è il nodo centrale, e ordini,
margini e latenza viaggiano sugli edge come flussi di un sistema distribuito.

Apri `preview/index.html` in un browser per vedere la dashboard viva senza
installare nulla. Il codice modulare React/Tailwind è in `src/`.

---

## 1. Componenti dell'interfaccia

```
src/
├── App.jsx                          # griglia NOC + composizione delle sezioni
├── hooks/useHedgeNetwork.js         # unico punto d'ingresso dei dati
├── data/networkSimulator.js         # feed di rete (da sostituire con il client WS)
└── components/
    ├── StatusRail.jsx               # barra di stato globale: routing, queue, uptime
    ├── TopologyNetworkMap.jsx       # mappa a nodi + edge animati
    ├── NetworkMetrics.jsx           # GlobalNetDelta · LatencyMatrix · SlippageDifferential
    ├── NetworkStream.jsx            # terminale syslog degli eventi di rete
    ├── MasterControlPanel.jsx       # comandi globali di rete
    └── ui.jsx                       # Panel, StatusDot, Label, Readout, Sparkline
```

**Regola di flusso dati:** nessun componente possiede stato di dominio. `NetworkFeed`
emette uno snapshot completo ogni 250 ms, `useHedgeNetwork` lo espone, i componenti
sono funzioni pure dello snapshot. Per passare in produzione si sostituisce
`NetworkFeed` con il client WebSocket del risk engine mantenendo `subscribe()` /
`dispatch()`: l'interfaccia non cambia di una riga.

**Modello dello stato**

| Ramo | Contenuto |
|---|---|
| `nodes.core` | cpu, coda ordini, uptime, hedge ratio |
| `nodes.a` / `nodes.b` | ping, stato API, free margin %, esposizione netta, ultimo fill |
| `metrics` | net delta + storico, slippage + storico, matrice latenze |
| `events` | ring buffer 300 eventi (`ok` · `info` · `warn` · `crit`) |
| `routingMode`, `circuitBreaker`, `syncing` | stato operativo della rete |

Il **net delta è derivato**, non simulato a parte: `netDelta = expoA + expoB`.
Ogni riga della dashboard racconta quindi lo stesso numero — se la mappa mostra
6.45 su A e −6.16 su B, il KPI legge +0.29 e il pulsante di rebalance annuncia
lo stesso gap.

---

## 2. Layout a griglia

12 colonne × 4 fasce, altezza piena schermo, gutter 12 px.

```
┌──────────────────────────────────────────────────────┬──────────────────┐
│ STATUS RAIL                                   1 → 12 │                  │
├──────────────────────────────────────────────────────┤ NETWORK STREAM   │
│ TOPOLOGY NETWORK MAP                          1 → 8  │ 9 → 12           │
│ (Broker A ── Core Engine ── Broker B)                │ syslog live      │
├──────────────┬──────────────┬────────────────────────┤ filtri severità  │
│ GLOBAL NET   │ LATENCY      │ SLIPPAGE               │ autoscroll con   │
│ DELTA        │ MATRIX       │ DIFFERENTIAL    1 → 8  │ pausa su hover   │
├──────────────┴──────────────┴────────────────────────┴──────────────────┤
│ MASTER CONTROL PANEL                                             1 → 12 │
└─────────────────────────────────────────────────────────────────────────┘
```

Il feed eventi occupa una colonna verticale a piena altezza (righe 2-3): in una
sala operativa il log è la cosa che si guarda con la coda dell'occhio mentre si
legge tutto il resto. Sotto i 1180 px la griglia collassa a colonna singola
nell'ordine: rail → mappa → metriche → stream → comandi.

---

## 3. Comportamenti che contano

**Topology map.** Gli edge cambiano colore *e* velocità delle particelle in base
allo stato del link: `SYNCED` verde 1.6 s, `REBALANCING` ciano 0.7 s, `DRIFT`
ambra 2.6 s, `LINK DOWN` rosso 4 s, `HALTED` grigio tratteggiato senza flusso.
Lo stato del link è calcolato da `linkHealth()` su ping, stato API e delta di rete
— colore e movimento sono due encoding dello stesso dato, non decorazione.

**Latency matrix.** Heat monocroma sull'azzurro per la magnitudine; l'ambra entra
solo oltre SLA (80 / 120 / 250 ms) e sempre accompagnata dal marcatore `SLA`,
mai colore da solo.

**Network stream.** Il feed si congela quando il mouse entra nel terminale e
l'header segnala `SCROLL IN PAUSA`: leggere un evento non deve essere una corsa
contro l'autoscroll. Filtri per severità con contatore.

**Master control.**
- `Emergency Circuit Breaker` — comando distruttivo, richiede pressione continua
  di 1.2 s con barra di avanzamento. Chiude tutte le gambe, azzera il delta,
  forza il routing in MANUAL.
- `Force Sync / Rebalance` — riallinea B su A, mostra il gap corrente nell'hint
  e resta disabilitato durante il riallineamento.
- `Toggle Routing Mode` — AUTO / MANUAL con switch visibile. In AUTO il motore
  riallinea da solo appena il delta supera 0.5 lot.

---

## 4. Design tokens

| Token | Hex | Uso |
|---|---|---|
| `void` | `#04070B` | fondo, con reticolo 44 px |
| `panel` / `panelHi` | `#0A121A` / `#0E1926` | superfici card e celle |
| `line` | `#17242F` | hairline, separatori, reticolo SVG |
| `ink` / `inkMute` | `#C7D7E5` / `#5F7488` | testo primario / etichette |
| `stable` | `#2EE6A8` | link sincronizzato, entro SLA |
| `flow` | `#38BDF8` | flusso dati, telemetria neutra |
| `warn` | `#F5A524` | drift, mismatch lotti, SLA sforata |
| `critical` | `#FF4D6D` | link down, breaker armato |
| `core` | `#8B7CF6` | identità del motore di hedging |

Type: **IBM Plex Sans Condensed** per etichette e titoli in maiuscoletto spaziato,
**IBM Plex Mono** per ogni numero e per il log — le cifre restano incolonnate
(`tabular-nums`) così le variazioni si leggono senza far ballare le colonne.

I colori di stato sono riservati: non vengono mai riusati come colore di serie.

---

## 5. Integrazione

```bash
npm i react react-dom
npx tailwindcss init   # poi copia i token da tailwind.config.js
```

Sostituzione del feed simulato con quello reale:

```js
// hooks/useHedgeNetwork.js
const feed = useMemo(() => new HedgeSocket(import.meta.env.VITE_RISK_WS), [])
```

`HedgeSocket` deve esporre `subscribe(fn)`, `start()`, `stop()` e `dispatch(action)`
con le action `CIRCUIT_BREAKER`, `RESET_BREAKER`, `FORCE_SYNC`, `TOGGLE_ROUTING`.
Nient'altro va toccato.

I dati mostrati nella preview sono generati localmente a scopo dimostrativo.
