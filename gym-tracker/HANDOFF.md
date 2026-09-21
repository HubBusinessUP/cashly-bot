# Handoff — stato del progetto

Riassunto per riprendere il lavoro in una nuova sessione di Claude Code senza
dover rileggere tutta la conversazione precedente.

## Cos'è

App di tracking allenamenti/nutrizione/progressi fisici per Antonio (e la sua
compagna). Dettagli prodotto e istruzioni d'uso in `README.md`. Dati reali del
profilo/piano di Antonio in `ANTONIO-PLAN.md`.

## Stato attuale

- **App reale** (`src/`, React + TypeScript + Firebase + Tailwind): completa
  dal punto di vista del codice — auth, log esercizi, calendario, statistiche,
  libreria 872 esercizi (video reali + fallback ricerca YouTube), export CSV,
  email settimanale, dark mode, PWA installabile, questionario onboarding,
  progressi fisici con foto. **Non ancora utilizzabile per davvero**: manca un
  progetto Firebase collegato (nessuna chiave reale impostata) e il deploy su
  Vercel.
- **Pull request**: [#5 su HubBusinessUP/cashly-bot](https://github.com/HubBusinessUP/cashly-bot/pull/5),
  draft, sotto osservazione (nessuna CI configurata nel repo, nessun commento
  di review finora).
- **Prototipo interattivo** (`prototype/`, pubblicato come Claude Artifact):
  usato da Antonio da telefono per vedere/testare la UI e compilare il
  questionario senza aspettare Firebase. Ha alcune feature che la vera app
  non ha ancora — vedi `prototype/README.md`.
- **Dati reali raccolti**: risposte del questionario di Antonio nel database
  dell'artifact (`ArtifactData`, collection `onboarding`, doc `antonio`) e il
  suo piano di allenamento reale (da un PDF che aveva già, FitExpress
  Avigliana) seedato nel prototipo — riassunto completo in `ANTONIO-PLAN.md`.

## Vincoli noti dell'ambiente di sviluppo

- **Rete fortemente ristretta**: solo un elenco di domini pre-autorizzati è
  raggiungibile (github raw, npm, pypi...). Siti generici (musclewiki.com,
  wger.de, fitexpress.it, ecc.) sono bloccati — verificato più volte. Per dati
  esterni, usare `WebSearch` (funziona, passa da infrastruttura diversa) e non
  `WebFetch`/`curl` diretti su domini non verificati.
- **Niente Android SDK**: non è possibile compilare un `.apk` nativo da qui
  (`dl.google.com` bloccato). La via percorribile per "installare l'app sul
  telefono" è la PWA (`vite-plugin-pwa`, già configurata).
- **Vercel**: il token collegato non ha permessi di creazione progetto su
  questo team — il deploy va fatto dall'utente via dashboard, o va chiesto un
  token con permessi diversi.

## Prossimi passi, in ordine

1. Creare il progetto Firebase reale (Authentication email/password +
   Firestore + Storage) e collegarlo (`.env` da `.env.example`).
2. Deploy `firestore.rules` + `storage.rules` (`firebase deploy --only
   firestore:rules,storage`).
3. Deploy su Vercel (dashboard, root directory `gym-tracker`), variabili
   d'ambiente da `.env.example`.
4. Verificare che PR #5 sia ancora pulita e valutare il merge.
5. Se si vogliono nella vera app le feature del prototipo (mappa muscolare,
   quiz che scrive nel db di Claude): vedi `prototype/README.md` per cosa
   portare e come.
6. Quando Antonio arriva alla settimana 13 del suo piano, seedare/implementare
   la Fase 2 "Massa" (dettagli in `ANTONIO-PLAN.md`).
