"""Auto Form Filler — compila automaticamente i form web.

Apre un form in un browser (Playwright), legge i campi, chiede a Claude cosa
scrivere in ognuno in base ai dati preconfigurati, compila tutto (testo, menu a
tendina, checkbox e upload di file) e avanza da solo nei form multi-pagina.

Uso:
    python form_filler.py --url "https://sito.it/iscrizione" --config config.json

Vedi il README per i dettagli.
"""
import argparse
import json
import os
import sys
import time
from pathlib import Path

import anthropic
from playwright.sync_api import sync_playwright, Error as PlaywrightError


# ---------------------------------------------------------------------------
# Estrazione dei campi dalla pagina
# ---------------------------------------------------------------------------

# Snippet JS eseguito nella pagina: marca ogni campo/pulsante con data-ff-id e
# restituisce una descrizione strutturata di tutto cio' che e' compilabile.
EXTRACT_JS = r"""
() => {
  const labelFor = (el) => {
    if (el.id) {
      const l = document.querySelector('label[for="' + CSS.escape(el.id) + '"]');
      if (l && l.innerText.trim()) return l.innerText.trim();
    }
    const anc = el.closest('label');
    if (anc && anc.innerText.trim()) return anc.innerText.trim();
    const aria = el.getAttribute('aria-label');
    if (aria) return aria.trim();
    if (el.getAttribute('aria-labelledby')) {
      const ref = document.getElementById(el.getAttribute('aria-labelledby'));
      if (ref && ref.innerText.trim()) return ref.innerText.trim();
    }
    return '';
  };
  const visible = (el) => {
    const s = window.getComputedStyle(el);
    if (s.display === 'none' || s.visibility === 'hidden') return false;
    const r = el.getBoundingClientRect();
    return r.width > 0 || r.height > 0;
  };

  const fields = [];
  const buttons = [];
  let i = 0;

  // Campi compilabili
  for (const el of document.querySelectorAll('input, select, textarea')) {
    const type = (el.getAttribute('type') || el.tagName).toLowerCase();
    if (['hidden', 'submit', 'button', 'reset', 'image'].includes(type)) continue;
    if (!visible(el)) continue;

    el.setAttribute('data-ff-id', String(i));
    const f = {
      ff_id: i,
      tag: el.tagName.toLowerCase(),
      type: type,
      name: el.getAttribute('name') || '',
      id: el.id || '',
      placeholder: el.getAttribute('placeholder') || '',
      label: labelFor(el),
      required: el.required || false,
    };
    if (el.tagName.toLowerCase() === 'select') {
      f.options = Array.from(el.options).map(o => ({ value: o.value, text: o.text.trim() }));
    }
    if (type === 'radio' || type === 'checkbox') {
      f.option_value = el.value;
      f.checked = el.checked;
      if (type === 'radio') f.group = el.getAttribute('name') || '';
    }
    fields.push(f);
    i++;
  }

  // Pulsanti (per avanzare / inviare)
  const btnSel = 'button, input[type="submit"], input[type="button"], [role="button"]';
  for (const el of document.querySelectorAll(btnSel)) {
    if (!visible(el)) continue;
    el.setAttribute('data-ff-id', String(i));
    const txt = (el.innerText || el.value || el.getAttribute('aria-label') || '').trim();
    buttons.push({
      ff_id: i,
      text: txt.slice(0, 80),
      type: (el.getAttribute('type') || '').toLowerCase(),
    });
    i++;
  }

  return { fields, buttons, title: document.title, url: location.href };
}
"""


def extract_form(page):
    """Marca e descrive i campi/pulsanti della pagina corrente."""
    return page.evaluate(EXTRACT_JS)


# ---------------------------------------------------------------------------
# Decisione tramite Claude
# ---------------------------------------------------------------------------

FILL_TOOL = {
    "name": "compila_form",
    "description": "Restituisce come compilare i campi del form e quale pulsante premere per proseguire.",
    "input_schema": {
        "type": "object",
        "properties": {
            "actions": {
                "type": "array",
                "description": "Una voce per ogni campo da gestire (campi non pertinenti: action='skip').",
                "items": {
                    "type": "object",
                    "properties": {
                        "ff_id": {"type": "integer", "description": "id del campo (data-ff-id)"},
                        "action": {
                            "type": "string",
                            "enum": ["fill", "select", "check", "uncheck", "upload", "skip"],
                        },
                        "value": {
                            "type": "string",
                            "description": "Per 'fill': testo. Per 'select': value o testo dell'opzione. "
                                           "Per 'upload': la CHIAVE del file in 'files'. Altrimenti vuoto.",
                        },
                        "reason": {"type": "string", "description": "Breve motivo della scelta."},
                    },
                    "required": ["ff_id", "action"],
                },
            },
            "proceed_button_ff_id": {
                "type": ["integer", "null"],
                "description": "id del pulsante da premere per avanzare/inviare, oppure null se non c'e'.",
            },
            "form_complete": {
                "type": "boolean",
                "description": "true se il form risulta completato/inviato e non serve altro.",
            },
            "notes": {"type": "string", "description": "Note utili per l'utente (campi non risolti, ecc.)."},
        },
        "required": ["actions", "form_complete"],
    },
}

SYSTEM_PROMPT = (
    "Sei un assistente che compila moduli web per conto dell'utente, usando SOLO i dati che fornisce. "
    "Ti vengono dati i campi di una pagina (con etichette, tipo, opzioni) e i dati dell'utente. "
    "Per ogni campo decidi l'azione giusta. Regole:\n"
    "- Usa esclusivamente i dati forniti; non inventare valori. Se per un campo obbligatorio non hai un dato "
    "adatto, lascialo (skip) e segnalalo in 'notes'.\n"
    "- Per i 'select' metti in 'value' il value o il testo di un'opzione realmente presente.\n"
    "- Per radio/checkbox usa 'check' solo sull'opzione corretta; gli altri della stessa scelta -> skip.\n"
    "- Per i campi file (type=file) usa action='upload' e in 'value' la CHIAVE del file piu' adatto tra quelli "
    "in 'files'; se nessuno e' adatto -> skip.\n"
    "- Non toccare campi di tipo password se non hai un dato 'password'.\n"
    "- Indica in 'proceed_button_ff_id' il pulsante per andare avanti o inviare (es. 'Avanti', 'Invia', "
    "'Continua', 'Registrati'); null se non ce n'e' uno sensato.\n"
    "- Imposta 'form_complete'=true solo se la pagina indica che l'invio e' gia' andato a buon fine."
)


def decide_actions(client, model, extracted, config):
    """Chiede a Claude come compilare i campi della pagina corrente."""
    files_desc = {
        key: meta.get("descrizione", meta.get("description", ""))
        for key, meta in config.get("files", {}).items()
    }
    payload = {
        "page": {"title": extracted.get("title"), "url": extracted.get("url")},
        "fields": extracted["fields"],
        "buttons": extracted["buttons"],
        "user_data": config.get("data", {}),
        "available_files": files_desc,
    }
    resp = client.messages.create(
        model=model,
        max_tokens=4096,
        system=SYSTEM_PROMPT,
        tools=[FILL_TOOL],
        tool_choice={"type": "tool", "name": "compila_form"},
        messages=[{
            "role": "user",
            "content": "Ecco la pagina del form (JSON). Decidi come compilarla.\n\n"
                       + json.dumps(payload, ensure_ascii=False),
        }],
    )
    for block in resp.content:
        if block.type == "tool_use" and block.name == "compila_form":
            return block.input
    raise RuntimeError("Claude non ha restituito una decisione valida.")


# ---------------------------------------------------------------------------
# Applicazione delle azioni
# ---------------------------------------------------------------------------

def apply_actions(page, decision, config, no_submit):
    """Esegue sulla pagina le azioni decise. Ritorna (riepilogo, proceed_locator)."""
    summary = {"filled": [], "uploaded": [], "skipped": [], "errors": []}
    files = config.get("files", {})

    for act in decision.get("actions", []):
        ff_id = act.get("ff_id")
        action = act.get("action")
        value = act.get("value", "") or ""
        loc = page.locator(f'[data-ff-id="{ff_id}"]')
        try:
            if action == "skip":
                summary["skipped"].append(ff_id)
                continue
            if action == "fill":
                loc.fill(value)
                summary["filled"].append((ff_id, value))
            elif action == "select":
                try:
                    loc.select_option(value=value)
                except PlaywrightError:
                    loc.select_option(label=value)
                summary["filled"].append((ff_id, value))
            elif action == "check":
                loc.check()
                summary["filled"].append((ff_id, "[check]"))
            elif action == "uncheck":
                loc.uncheck()
                summary["filled"].append((ff_id, "[uncheck]"))
            elif action == "upload":
                meta = files.get(value)
                if not meta:
                    summary["errors"].append((ff_id, f"file '{value}' non in config"))
                    continue
                path = meta.get("path", "")
                if not path or not Path(path).expanduser().is_file():
                    summary["errors"].append((ff_id, f"file mancante: {path}"))
                    continue
                loc.set_input_files(str(Path(path).expanduser()))
                summary["uploaded"].append((ff_id, path))
            else:
                summary["errors"].append((ff_id, f"azione sconosciuta: {action}"))
        except PlaywrightError as e:
            summary["errors"].append((ff_id, str(e).splitlines()[0]))

    proceed = None
    pid = decision.get("proceed_button_ff_id")
    if pid is not None and not no_submit:
        proceed = page.locator(f'[data-ff-id="{pid}"]')
    return summary, proceed, decision.get("proceed_button_ff_id")


def print_summary(step, summary, decision):
    print(f"  ✓ Compilati: {len(summary['filled'])}  "
          f"📎 File: {len(summary['uploaded'])}  "
          f"⤳ Saltati: {len(summary['skipped'])}  "
          f"⚠ Errori: {len(summary['errors'])}")
    for ff_id, msg in summary["errors"]:
        print(f"    ⚠ campo {ff_id}: {msg}")
    if decision.get("notes"):
        print(f"  📝 Note: {decision['notes']}")


# ---------------------------------------------------------------------------
# Loop principale
# ---------------------------------------------------------------------------

def run(args):
    config_path = Path(args.config)
    if not config_path.is_file():
        sys.exit(f"❌ Config non trovata: {config_path}. Copia config.example.json in config.json.")
    config = json.loads(config_path.read_text(encoding="utf-8"))

    api_key = os.environ.get("ANTHROPIC_API_KEY")
    if not api_key:
        sys.exit("❌ Manca ANTHROPIC_API_KEY. Esegui: export ANTHROPIC_API_KEY=...")

    # Avviso preventivo su file mancanti
    for key, meta in config.get("files", {}).items():
        p = meta.get("path", "")
        if p and not Path(p).expanduser().is_file():
            print(f"⚠ Attenzione: il file '{key}' non esiste: {p}")

    client = anthropic.Anthropic(api_key=api_key)

    screenshots_dir = Path("screenshots")
    screenshots_dir.mkdir(exist_ok=True)

    with sync_playwright() as pw:
        browser = pw.chromium.launch(headless=args.headless)
        page = browser.new_page()
        print(f"🌐 Apro: {args.url}")
        page.goto(args.url, wait_until="domcontentloaded")

        for step in range(1, args.max_steps + 1):
            page.wait_for_timeout(800)  # lascia stabilizzare la pagina
            extracted = extract_form(page)
            print(f"\n── Passo {step} — «{extracted.get('title')}» "
                  f"({len(extracted['fields'])} campi)")

            if not extracted["fields"] and not extracted["buttons"]:
                print("  Nessun campo o pulsante: form probabilmente concluso.")
                break

            decision = decide_actions(client, args.model, extracted, config)
            summary, proceed, pid = apply_actions(page, decision, config, args.no_submit)
            print_summary(step, summary, decision)

            if decision.get("form_complete"):
                print("  ✅ Claude ritiene il form completato.")
                break

            if args.no_submit and pid is not None:
                print("  ⏸  --no-submit attivo: NON premo il pulsante. Form compilato ma non inviato.")
                break

            if proceed is None:
                print("  Nessun pulsante per proseguire: mi fermo.")
                break

            if args.step_pause:
                input("  ⏯  Premi Invio per cliccare il pulsante e continuare...")

            print("  ➡  Avanzo al passo successivo...")
            try:
                proceed.click()
                page.wait_for_load_state("networkidle", timeout=15000)
            except PlaywrightError as e:
                print(f"  ⚠ Click/caricamento non riuscito: {str(e).splitlines()[0]}")
                break
        else:
            print(f"\n⚠ Raggiunto il limite di {args.max_steps} passi.")

        shot = screenshots_dir / f"finale_{int(time.time())}.png"
        try:
            page.screenshot(path=str(shot), full_page=True)
            print(f"\n📸 Screenshot salvato: {shot}")
        except PlaywrightError:
            pass

        if not args.headless:
            input("\nFine. Premi Invio per chiudere il browser...")
        browser.close()


def main():
    parser = argparse.ArgumentParser(description="Compila automaticamente i form web con Playwright + Claude.")
    parser.add_argument("--url", required=True, help="Link del form da compilare.")
    parser.add_argument("--config", default="config.json", help="File JSON con i dati (default: config.json).")
    parser.add_argument("--model", default="claude-sonnet-4-6", help="Modello Claude da usare.")
    parser.add_argument("--no-submit", action="store_true", help="Compila ma non preme il pulsante di invio.")
    parser.add_argument("--headless", action="store_true", help="Browser invisibile (default: visibile).")
    parser.add_argument("--max-steps", type=int, default=10, help="Numero massimo di pagine/step.")
    parser.add_argument("--step-pause", action="store_true", help="Pausa (Invio) prima di ogni avanzamento.")
    run(parser.parse_args())


if __name__ == "__main__":
    main()
