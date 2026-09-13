# AnonBrowser

Browser personale che manda **tutto** il traffico dentro Tor, con kill-switch,
sessione effimera e anti-fingerprinting lato JavaScript.

## Cosa fa davvero (e cosa no)

| Vettore | Stato |
|---|---|
| IP reale verso i siti | coperto: proxy SOCKS5 su Tor obbligatorio |
| DNS leak | coperto: risoluzione diretta disabilitata, DNS dentro il circuito |
| WebRTC leak | coperto: API rimosse + policy `disable_non_proxied_udp` |
| Traffico se Tor cade | bloccato: ogni richiesta viene annullata finché Tor non torna |
| Cookie / storage / cache | in memoria, mai su disco, cancellati alla chiusura |
| Canvas / WebGL / AudioContext | bloccati o azzerati |
| Timezone, lingua, schermo, CPU | valori uniformi (UTC, en-US, viewport, 2 core) |
| Fingerprint del motore | **non coperto**: sei su Chromium/Electron, non su Firefox ESR |
| Attacchi di correlazione sul traffico | **non coperti** (nessun browser lo fa) |

L'ultima riga è quella che conta: un browser custom lo usi solo tu, quindi la tua
impronta del motore è rara per definizione. Questo progetto ti dà anonimato di
**rete** solido. Se ti serve anche il crowd-blending contro il fingerprinting
avanzato, Tor Browser resta la scelta migliore — questo lo affianchi, non lo sostituisci.

## Requisiti

- Node.js 18+
- `tor` installato:
  - Debian/Ubuntu: `sudo apt install tor && sudo systemctl disable --now tor`
  - macOS: `brew install tor`
  - Windows: Tor Expert Bundle, poi `set ANON_TOR_BINARY=C:\path\tor.exe`

Il browser avvia una **sua** istanza Tor su `127.0.0.1:9250` (SOCKS) e `:9251`
(control), con DataDirectory temporaneo cancellato all'uscita: non tocca il tor di sistema.

## Uso

```bash
npm install
npm start
```

Eseguibile standalone (AppImage / dmg / exe):

```bash
npm run dist
```

## Comandi

| Azione | Scorciatoia |
|---|---|
| Nuova scheda | `Ctrl/Cmd + T` |
| Chiudi scheda | `Ctrl/Cmd + W` |
| Barra indirizzi | `Ctrl/Cmd + L` |
| Nuova identità (nuovo circuito + wipe) | `Ctrl/Cmd + Shift + U` |
| Panic (wipe totale e uscita) | pulsante rosso |
| JS on/off | pulsante `JS` |

## Scelte tecniche

- **Kill-switch**: `onBeforeRequest` annulla tutto quando `torReady` è falso —
  incluso il transitorio fra l'avvio dell'app e il bootstrap al 100%.
- **HTTPS only**: ogni `http://` viene riscritto in `https://`; schemi diversi da
  https/blob/data sono bloccati (niente `file://`, `ftp://`, handler esterni).
- **Letterboxing**: la viewport è arrotondata a multipli di 200×100 e centrata,
  così la dimensione finestra non ti identifica.
- **Stream isolation**: `IsolateDestAddr IsolateDestPort` nel torrc — circuiti
  separati per destinazione.
- **Referer** inviato solo same-origin, client hints (`Sec-CH-UA*`) rimossi.
- **Sessione in memoria**: partizione senza prefisso `persist:`, `cache: false`.

## Verifica

Dopo l'avvio apri:

- `https://check.torproject.org` → deve dire che stai usando Tor
- `https://browserleaks.com/webrtc` → nessun IP locale o pubblico
- `https://browserleaks.com/dns` → solo resolver di uscita Tor

## Note operative

- Il bootstrap di Tor richiede TCP diretto verso i relay: su reti che filtrano
  tutto tranne un proxy HTTP resta bloccato intorno al 14% e il kill-switch
  tiene la navigazione ferma (nessun fallback in chiaro, mai). In quel caso
  servono i bridge: aggiungi `UseBridges 1` e le righe `Bridge ...` in `writeTorrc()`.
- Il bootstrap oltre i 120s non è un errore fatale: l'app mostra lo stato e si
  sblocca da sola appena il circuito è pronto.
- Se lo esegui come root in un container: `npx electron --no-sandbox .` con
  `ANON_NO_SANDBOX=1`. Su desktop normale non serve e non va usato.

## Limiti noti

- Tor rallenta e alcuni siti (Cloudflare) mostrano captcha: è il prezzo, non un bug.
- I siti `.onion` funzionano; i servizi che richiedono WebRTC, media o geolocalizzazione no, per scelta.
- Disabilitare JS rompe molti siti ma è la difesa più efficace contro il fingerprinting.
