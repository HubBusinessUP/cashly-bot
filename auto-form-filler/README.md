# Auto Form Filler 📝🤖

Stanco di compilare a mano gli stessi form di iscrizione? Questo strumento apre il form in un
browser, **legge da solo i campi**, capisce cosa va scritto in ognuno (grazie a Claude) e lo
**compila con i tuoi dati preconfigurati** — inclusi i **file da caricare**. Nei form a più
pagine **avanza da solo** fino alla fine.

> Progetto autonomo, separato dal bot Telegram di questo repo.

## Come funziona

1. Apre il link che gli dai con un vero browser (Playwright).
2. Un piccolo script legge tutti i campi della pagina (etichette, tipo, opzioni, pulsanti).
3. **Claude** decide cosa scrivere in ogni campo usando **solo** i dati del tuo `config.json`.
4. Lo script compila testo, menu a tendina, checkbox e carica i file, poi clicca "Avanti/Invia".
5. Ripete per ogni pagina del form e salva uno screenshot finale.

## Installazione

Servono Python 3.10+ e una chiave API Anthropic.

```bash
cd auto-form-filler
pip install -r requirements.txt
playwright install chromium          # scarica il browser
export ANTHROPIC_API_KEY="la-tua-chiave"
```

## Configurazione

Copia il modello e mettici i tuoi dati:

```bash
cp config.example.json config.json
```

- `data`: campi liberi (nome, email, telefono, ...). Aggiungi le chiavi che ti servono: Claude le
  abbina da solo alle etichette del form.
- `files`: per ogni file, il **percorso assoluto** sul tuo PC e una breve `descrizione` (serve a
  Claude per capire dove va caricato, es. "Carta d'identità").

> ⚠️ `config.json` contiene dati personali: è già escluso da Git (`.gitignore`). Non condividerlo.

## Uso

```bash
# Compila e invia (browser visibile, lo guardi mentre lavora)
python form_filler.py --url "https://sito.it/iscrizione"

# Compila ma NON invia: utile per controllare prima
python form_filler.py --url "https://sito.it/iscrizione" --no-submit

# Pausa prima di ogni avanzamento (premi Invio per continuare)
python form_filler.py --url "..." --step-pause

# Form difficile? usa il modello più potente
python form_filler.py --url "..." --model claude-opus-4-8
```

### Opzioni

| Opzione        | Descrizione                                              | Default        |
|----------------|----------------------------------------------------------|----------------|
| `--url`        | Link del form (obbligatorio)                             | —              |
| `--config`     | File JSON con i dati                                      | `config.json`  |
| `--model`      | Modello Claude                                           | `claude-sonnet-4-6` |
| `--no-submit`  | Compila ma non clicca il pulsante di invio               | off            |
| `--headless`   | Browser invisibile                                       | off (visibile) |
| `--max-steps`  | Numero massimo di pagine/step                            | `10`           |
| `--step-pause` | Pausa prima di ogni avanzamento                          | off            |

## Limiti

- **CAPTCHA / verifica "non sono un robot" / 2FA**: non automatizzabili, vanno fatti a mano.
- Alcuni siti bloccano i browser automatici.
- Usa lo strumento solo per **i tuoi form** e con i **tuoi dati**.

Consiglio: la prima volta su un sito nuovo usa `--no-submit` per controllare il risultato (anche
dallo screenshot in `screenshots/`) prima di lasciarlo inviare davvero.
