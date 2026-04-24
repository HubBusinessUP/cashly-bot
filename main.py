"""Cashly Bot — verifica account Telegram."""
import os
import time
import requests

TELEGRAM_BOT_TOKEN = os.environ["TELEGRAM_BOT_TOKEN"]
SUPABASE_URL = os.environ["SUPABASE_URL"]
SUPABASE_SERVICE_KEY = os.environ["SUPABASE_SERVICE_KEY"]
DASHBOARD_URL = "https://cashly-two-plum.vercel.app/dashboard"

API = f"https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}"
HEADERS = {
          "apikey": SUPABASE_SERVICE_KEY,
          "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}",
          "Content-Type": "application/json",
}


def send(chat_id, text, parse_mode="Markdown"):
          requests.post(f"{API}/sendMessage", json={
                        "chat_id": chat_id,
                        "text": text,
                        "parse_mode": parse_mode,
                        "disable_web_page_preview": False,
          }, timeout=10)


def verifica(chat_id, telegram_id, code):
          r = requests.get(
                        f"{SUPABASE_URL}/rest/v1/users",
                        params={"verification_code": f"eq.{code}", "select": "id,username,telegram_verified"},
                        headers=HEADERS, timeout=10,
          )
          rows = r.json()

    if not rows:
                  send(chat_id, "Codice non valido. Controlla la dashboard Cashly e riprova.")
                  return

    user = rows[0]
    if user.get("telegram_verified"):
                  send(chat_id, "Account gia verificato.")
                  return

    requests.patch(
                  f"{SUPABASE_URL}/rest/v1/users",
                  params={"id": f"eq.{user['id']}"},
                  json={"telegram_verified": True, "telegram_id": telegram_id},
                  headers={**HEADERS, "Prefer": "return=minimal"},
                  timeout=10,
    )

    username = user.get("username") or ""
    msg = "Account verificato!\n\n"
    if username:
                  msg += f"Ciao @{username}. Torna sulla dashboard.\n\n"
else:
              msg += "Fatto. Torna sulla dashboard.\n\n"
          msg += f"Vai alla Dashboard: {DASHBOARD_URL}"
    send(chat_id, msg, parse_mode=None)


def get_updates(offset):
          r = requests.get(
                        f"{API}/getUpdates",
                        params={"offset": offset, "timeout": 30},
                        timeout=40,
          )
          return r.json().get("result", [])


def main():
          print("Cashly Bot avviato.")
          offset = 0
          while True:
                        try:
                                          updates = get_updates(offset)
                                          for upd in updates:
                                                                offset = upd["update_id"] + 1
                                                                msg = upd.get("message", {})
                                                                text = msg.get("text", "")
                                                                chat_id = msg.get("chat", {}).get("id")
                                                                from_data = msg.get("from", {})
                                                                telegram_id = from_data.get("id")

                                              if not chat_id or not text.startswith("/start"):
                                                                        continue

                                              parts = text.strip().split(maxsplit=1)
                                              param = parts[1] if len(parts) > 1 else ""

                                if param.startswith("CASHLY-"):
                                                          verifica(chat_id, telegram_id, param)
else:
                    send(chat_id,
                                                 "Ciao! Sono il bot di Cashly.\n\nPer verificare il tuo account "
                                                 f"vai su {DASHBOARD_URL} e clicca Verifica con Telegram.",
                                                 parse_mode=None,
                        )
except Exception as e:
                  print(f"Errore: {e}")
                  time.sleep(5)


if __name__ == "__main__":
          main()
