# Prototipo standalone

`gym-tracker-prototype.html` è un mock-up interattivo a file singolo (HTML+CSS+JS
vanilla, nessuna build) usato per validare UX/grafica prima di implementarle nella
vera app React in `../src`. **Non è collegato a Firebase**: i dati (allenamenti,
peso, foto progressi) vivono solo in `localStorage` del browser che lo apre.

È pubblicato come Claude Artifact per uso rapido da telefono:
https://claude.ai/artifact/BpJMvXLuxd4wx9G9MTyYCA

## Cosa c'è qui che NON è ancora nella vera app

Queste funzionalità sono state prototipate qui prima e vanno ancora portate in
`../src` se si vogliono nell'app reale:

1. **Tab "Quiz"**: questionario onboarding che scrive le risposte nel database
   dell'artifact Claude (capability `db`), leggibile da Claude con `ArtifactData`
   (`collection: "onboarding"`). Permette di compilare il quiz da telefono e far
   generare il piano senza copia-incolla manuale. La vera app ha un questionario
   simile (`src/pages/OnboardingPage.tsx`) ma salva su Firestore, non è letto da
   Claude direttamente.
2. **Mappa muscolare del giorno**: SVG fronte/schiena con i gruppi muscolari
   evidenziati in base agli esercizi (+ badge "Cardio") — vedi `MUSCLE_MAP` e
   `renderMuscleMap()` nel file. Non esiste nella vera app.
3. **Card "Piano"**: titolo/calorie/macro/nota mostrati in Dashboard, presi da
   `state.plan`. Nella vera app le calorie/macro non sono ancora un concetto
   modellato (solo il questionario onboarding raccoglie preferenze alimentari).

## Dati precaricati

`defaultState()` contiene il piano settimanale reale di Antonio (Fase 1 "pancia
giù", da `ANTONIO-PLAN.md` nella cartella superiore), non dati generici di
esempio. Bump `STORAGE_KEY` (`gymTrackerDemoV3` → V4 ecc.) quando cambi
`defaultState()`, altrimenti chi ha già aperto il link tiene i dati vecchi in
cache.

## Come continuare

- Per portare una feature nella vera app: reimplementala in `../src` come
  componente React + hook Firestore (pattern già usato da `ProgressPage`/
  `useBodyMetrics` per la mappa muscolare, da `useOnboarding` per il quiz).
  Il quiz→Claude-db è specifico del contesto artifact e non ha equivalente
  diretto lato Firestore: se serve automazione simile nella vera app, servirà
  un endpoint `/api` che Claude possa leggere, oppure va abbandonato in favore
  del flusso "compili il questionario reale → lo leggo io da Firestore" una
  volta che il progetto Firebase è collegato.
