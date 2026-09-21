# Piano Antonio — riferimento

Dati reali raccolti in sessione (questionario onboarding + piano caricato da
Antonio, `Piano-FitExpress-Avigliana.pdf`). Serve da riferimento per continuare
il lavoro senza dover rileggere tutta la conversazione.

## Profilo (dal questionario)

- Nome: Antonio · 40 anni · Uomo · 173cm · 80kg
- Obiettivo primario: perdere peso · secondario: addominali e pettorali definiti
- Livello: principiante · 4 giorni/settimana disponibili · 65min/sessione
- Dove si allena: **FitExpress Avigliana** (Corso Torino 6, 24h/7, low-cost)
- Attrezzatura: completa · Infortuni/patologie: nessuno
- Lavoro sedentario · Sonno 7h · Stress percepito: **9/10** (alto — attenzione
  a non sovraccaricare con troppa alta intensità, vedi note sotto)
- Pasti: 3/giorno · Budget cibo: medio · Alcol: no
- Ha una compagna e una figlia piccola ("la bimba"): il piano è costruito
  intorno alla logistica familiare (lui si allena al mattino, lei ai corsi
  serali 18-20, gestione cena/nanna).

Risposte complete salvate nel database dell'artifact Claude (non in questo
repo): `ArtifactData` → url `https://claude.ai/artifact/BpJMvXLuxd4wx9G9MTyYCA`,
collection `onboarding`, doc `antonio`.

## Piano di allenamento — Fase 1 "Pancia giù" (settimane 1-12)

Sala pesi 3x/settimana + 2 corsi ad alta intensità. Weekend libero (sabato
camminata 40'). Ogni sessione sta in 55-75 minuti, mai oltre il tetto di
80-90'/giorno richiesto. Settimana 6 di scarico (stessi carichi, metà serie).

| Giorno | Slot | Attività |
|---|---|---|
| Lun | 9:15–10:30 sala pesi | Gambe + addome |
| Mar | 9:15–10:30 sala pesi | Parte alta |
| Mer | 9:00–10:00 corso + 15' | Strong Nation + addome |
| Gio | 10:00–11:00 corso | Tabata |
| Ven | 9:15–10:30 sala pesi | Tutto il corpo |
| Sab | — | Riposo attivo, camminata 40' |
| Dom | — | Riposo |

Esercizi, carichi di partenza e video sono seedati in
`prototype/gym-tracker-prototype.html` (`defaultState()` → `weekPlan()`) e
descritti nel dettaglio nel PDF originale caricato da Antonio (non incluso nel
repo — chiedere all'utente se serve ricaricarlo).

### Dal week 13: Fase 2 "Massa"

4 sedute (gambe/parte alta, una pesante 5x5 + una di volume), surplus calorico
200-300 kcal. Dettagli nel PDF originale, non ancora seedati nell'app/prototipo
(oggi è ancora in Fase 1).

## Alimentazione

- Fase 1: deficit 300-500 kcal sotto il fabbisogno, proteine 1.8-2g/kg,
  8-10k passi/giorno, sonno 7h+
- Target calcolato: ~1900 kcal/giorno · P160 · F60 · C180
- Fase 2 (dal week 13): surplus 200-300 kcal, proteine 1.6-2g/kg

## Corsi FitExpress Avigliana (per lui e la compagna)

Palinsesto completo raccolto via ricerca web (⚠️ fonte datata settembre 2025,
da riverificare — numero palestra 348-5879688): vedi trascrizione nella
conversazione. Corsi usati nel piano: Strong Nation, Tabata (lui) e Functional
Training/GAG/T-Step o Fit&Dance/Pilates (compagna, corsi serali 18-20 o 19-20).

## Cosa manca / prossimi passi

1. Progetto Firebase reale (nessuno collegato oggi — l'app vera non è
   utilizzabile per davvero finché non c'è).
2. Deploy su Vercel.
3. Portare le feature prototipate solo nell'artifact (mappa muscolare, quiz
   che scrive nel db di Claude) nella vera app React — vedi
   `prototype/README.md`.
4. Quando esce il nuovo palinsesto FitExpress, verificare che orari/corsi non
   siano cambiati rispetto al piano.
5. Fase 2 "Massa" non ancora seedata: da aggiungere quando Antonio arriva alla
   settimana 13 (o prima, se si vuole prepararla in anticipo).
