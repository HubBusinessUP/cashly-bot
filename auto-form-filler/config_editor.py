"""Editor visuale della configurazione.

Apre nel browser un piccolo form dove inserire i tuoi dati e i file da
caricare, poi salva tutto in config.json (cosi' non devi modificare il JSON a
mano). Non richiede dipendenze esterne: usa il server HTTP integrato di Python.

Uso:
    python config_editor.py            # apre il browser su http://127.0.0.1:8765
    python config_editor.py --config config.json --port 8765
"""
import argparse
import json
import threading
import webbrowser
from http.server import BaseHTTPRequestHandler, HTTPServer
from pathlib import Path

CONFIG_PATH = Path("config.json")
EXAMPLE_PATH = Path("config.example.json")

PAGE = r"""<!DOCTYPE html>
<html lang="it">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Auto Form Filler — I tuoi dati</title>
<style>
  body { font-family: system-ui, sans-serif; max-width: 760px; margin: 24px auto; padding: 0 16px; color: #1a1a1a; }
  h1 { font-size: 1.4rem; } h2 { font-size: 1.1rem; margin-top: 28px; }
  p.hint { color: #666; font-size: .9rem; }
  .row { display: flex; gap: 8px; margin: 6px 0; align-items: center; }
  .row input { padding: 8px; border: 1px solid #ccc; border-radius: 6px; font-size: .95rem; }
  .row .k { flex: 0 0 200px; } .row .v { flex: 1; }
  .frow input.k { flex: 0 0 150px; } .frow input.d { flex: 1; } .frow input.p { flex: 1; }
  button { padding: 8px 14px; border: 0; border-radius: 6px; cursor: pointer; font-size: .95rem; }
  .add { background: #eef; } .del { background: #fee; flex: 0 0 auto; }
  .save { background: #2563eb; color: #fff; font-size: 1rem; padding: 12px 22px; margin-top: 24px; }
  #msg { margin-left: 12px; font-weight: 600; }
  .frow { display: flex; gap: 8px; margin: 6px 0; flex-wrap: wrap; }
</style>
</head>
<body>
  <h1>📝 I tuoi dati per l'auto-compilazione</h1>
  <p class="hint">Compila i campi e premi <b>Salva</b>. Verra' scritto <code>config.json</code>.
     Le chiavi (a sinistra) sono i nomi standard usati dal tool; i valori (a destra) sono i tuoi dati.</p>

  <h2>Dati anagrafici</h2>
  <div id="data"></div>
  <button class="add" onclick="addData()">+ Aggiungi campo</button>

  <h2>File da caricare</h2>
  <p class="hint">Per ogni file: una chiave, una descrizione (aiuta a capire dove va) e il percorso assoluto sul tuo PC.</p>
  <div id="files"></div>
  <button class="add" onclick="addFile()">+ Aggiungi file</button>

  <div>
    <button class="save" onclick="save()">💾 Salva config.json</button>
    <span id="msg"></span>
  </div>

<script>
function dataRow(k, v) {
  const d = document.createElement('div'); d.className = 'row';
  d.innerHTML = `<input class="k" placeholder="chiave (es. nome)" value="${esc(k)}">
                 <input class="v" placeholder="valore (es. Mario)" value="${esc(v)}">
                 <button class="del" onclick="this.parentNode.remove()">✕</button>`;
  return d;
}
function fileRow(k, desc, path) {
  const d = document.createElement('div'); d.className = 'frow';
  d.innerHTML = `<input class="k" placeholder="chiave (es. curriculum)" value="${esc(k)}">
                 <input class="d" placeholder="descrizione" value="${esc(desc)}">
                 <input class="p" placeholder="/percorso/assoluto/file.pdf" value="${esc(path)}">
                 <button class="del" onclick="this.parentNode.remove()">✕</button>`;
  return d;
}
function esc(s){ return (s==null?'':String(s)).replace(/"/g,'&quot;').replace(/</g,'&lt;'); }
function addData(k,v){ document.getElementById('data').appendChild(dataRow(k||'',v||'')); }
function addFile(k,d,p){ document.getElementById('files').appendChild(fileRow(k||'',d||'',p||'')); }

async function load() {
  const r = await fetch('/config'); const cfg = await r.json();
  const data = cfg.data || {}; const files = cfg.files || {};
  if (Object.keys(data).length === 0) addData();
  for (const k in data) addData(k, data[k]);
  if (Object.keys(files).length === 0) addFile();
  for (const k in files) addFile(k, files[k].descrizione || files[k].description || '', files[k].path || '');
}
async function save() {
  const data = {}; const files = {};
  document.querySelectorAll('#data .row').forEach(r => {
    const k = r.querySelector('.k').value.trim(); const v = r.querySelector('.v').value;
    if (k) data[k] = v;
  });
  document.querySelectorAll('#files .frow').forEach(r => {
    const k = r.querySelector('.k').value.trim();
    const desc = r.querySelector('.d').value; const path = r.querySelector('.p').value.trim();
    if (k) files[k] = { path: path, descrizione: desc };
  });
  const res = await fetch('/save', { method:'POST', headers:{'Content-Type':'application/json'},
                                     body: JSON.stringify({ data, files }) });
  const msg = document.getElementById('msg');
  if (res.ok) { msg.style.color='#16a34a'; msg.textContent='✓ Salvato! Puoi chiudere questa pagina.'; }
  else { msg.style.color='#dc2626'; msg.textContent='✗ Errore nel salvataggio.'; }
}
load();
</script>
</body>
</html>
"""


def make_handler(config_path):
    class Handler(BaseHTTPRequestHandler):
        def log_message(self, *a):
            pass  # silenzioso

        def _send(self, code, body, ctype="text/html; charset=utf-8"):
            data = body.encode("utf-8") if isinstance(body, str) else body
            self.send_response(code)
            self.send_header("Content-Type", ctype)
            self.send_header("Content-Length", str(len(data)))
            self.end_headers()
            self.wfile.write(data)

        def do_GET(self):
            if self.path == "/" or self.path.startswith("/index"):
                self._send(200, PAGE)
            elif self.path == "/config":
                src = config_path if config_path.is_file() else EXAMPLE_PATH
                cfg = json.loads(src.read_text(encoding="utf-8")) if src.is_file() else {"data": {}, "files": {}}
                self._send(200, json.dumps(cfg, ensure_ascii=False), "application/json; charset=utf-8")
            else:
                self._send(404, "not found")

        def do_POST(self):
            if self.path != "/save":
                self._send(404, "not found")
                return
            length = int(self.headers.get("Content-Length", 0))
            try:
                payload = json.loads(self.rfile.read(length).decode("utf-8"))
                config_path.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
                print(f"✓ Salvato {config_path}")
                self._send(200, json.dumps({"ok": True}), "application/json")
            except Exception as e:
                self._send(500, json.dumps({"ok": False, "error": str(e)}), "application/json")

    return Handler


def main():
    parser = argparse.ArgumentParser(description="Editor visuale per config.json.")
    parser.add_argument("--config", default="config.json", help="File da scrivere (default: config.json).")
    parser.add_argument("--port", type=int, default=8765, help="Porta del server locale.")
    args = parser.parse_args()

    config_path = Path(args.config)
    url = f"http://127.0.0.1:{args.port}/"
    server = HTTPServer(("127.0.0.1", args.port), make_handler(config_path))
    print(f"🌐 Editor aperto su {url}")
    print("   Compila il form, premi Salva, poi chiudi con Ctrl-C.")
    threading.Timer(0.7, lambda: webbrowser.open(url)).start()
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nChiuso.")
        server.server_close()


if __name__ == "__main__":
    main()
