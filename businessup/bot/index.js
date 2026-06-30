"use strict";

/**
 * Business UP — entrypoint.
 *
 * Avvia il bot Telegram (grammy, long polling) e un server HTTP (express) che espone:
 *   POST /webhook/sondaggio   ← sondaggio web
 *   GET  /api/stats           → KPI
 *   GET  /api/leads           → lista lead (filtrabile per stage)
 *   POST /api/broadcast       → invio segmento
 *   POST /api/set-stage       → cambia pipeline stage
 *   GET  /health              → healthcheck
 *
 * Anti-guru. Anti-hype. Dati e logica.
 */
require("dotenv").config();

const express = require("express");
const { Bot } = require("grammy");

const { handleStart } = require("./handlers/start");
const { handleNewMember } = require("./handlers/newMember");
const adminHandlers = require("./handlers/admin");
const { processSondaggio } = require("./handlers/webhook");
const { broadcast } = require("./lib/broadcast");
const {
  getStats,
  getLeads,
  getLeadByUsername,
  updateLeadByTelegramId,
  STAGES,
} = require("./lib/supabase");

const BOT_TOKEN = process.env.BOT_TOKEN;
const PORT = Number(process.env.PORT || 3000);
const ADMIN_API_KEY = process.env.ADMIN_API_KEY || "";

if (!BOT_TOKEN) {
  console.error("BOT_TOKEN mancante. Imposta la variabile e riavvia.");
  process.exit(1);
}

// ─────────────────────────── BOT ───────────────────────────
const bot = new Bot(BOT_TOKEN);

bot.command("start", handleStart);
adminHandlers.register(bot);
bot.on("message:new_chat_members", handleNewMember);

bot.catch((err) => {
  console.error("[bot] errore:", err.error?.message || err.message || err);
});

// ─────────────────────────── API ───────────────────────────
const app = express();
app.use(express.json({ limit: "256kb" }));

// CORS aperto (sondaggio e dashboard sono su Netlify, dominio diverso)
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Content-Type, x-admin-key");
  res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  if (req.method === "OPTIONS") return res.sendStatus(204);
  next();
});

function requireAdminKey(req, res, next) {
  if (!ADMIN_API_KEY) return next(); // se non configurata, API aperta (sconsigliato in prod)
  const key = req.get("x-admin-key") || req.query.key;
  if (key !== ADMIN_API_KEY)
    return res.status(401).json({ ok: false, error: "non autorizzato" });
  next();
}

app.get("/health", (_req, res) => res.json({ ok: true, service: "businessup-bot" }));

// Sondaggio web → qualificazione
app.post("/webhook/sondaggio", async (req, res) => {
  try {
    const result = await processSondaggio(bot, req.body || {});
    const code = result.ok ? 200 : result.needs_bot_start ? 409 : 400;
    res.status(code).json(result);
  } catch (e) {
    console.error("[webhook/sondaggio] error:", e.message);
    res.status(500).json({ ok: false, error: "errore interno" });
  }
});

// KPI
app.get("/api/stats", requireAdminKey, async (_req, res) => {
  try {
    res.json({ ok: true, stats: await getStats() });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

// Lista lead (opzionale ?stage=)
app.get("/api/leads", requireAdminKey, async (req, res) => {
  try {
    const stage = req.query.stage || null;
    const leads = await getLeads(stage);
    res.json({ ok: true, leads });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

// Broadcast { tipo, testo }
app.post("/api/broadcast", requireAdminKey, async (req, res) => {
  try {
    const { tipo, testo } = req.body || {};
    if (!tipo || !testo)
      return res.status(400).json({ ok: false, error: "tipo e testo richiesti" });
    const r = await broadcast(bot, tipo, testo);
    res.json({ ok: true, ...r });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

// Cambia stage { username, stage }
app.post("/api/set-stage", requireAdminKey, async (req, res) => {
  try {
    const { username, stage } = req.body || {};
    if (!username || !STAGES.includes(stage))
      return res.status(400).json({ ok: false, error: "username e stage validi richiesti" });
    const lead = await getLeadByUsername(username);
    if (!lead) return res.status(404).json({ ok: false, error: "lead non trovato" });
    await updateLeadByTelegramId(lead.telegram_id, { pipeline_stage: stage });
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

// ─────────────────────────── AVVIO ───────────────────────────
app.listen(PORT, () => console.log(`[api] in ascolto su :${PORT}`));

bot.start({
  drop_pending_updates: true,
  onStart: (info) => console.log(`[bot] @${info.username} avviato.`),
});

// Spegnimento pulito
process.once("SIGINT", () => bot.stop());
process.once("SIGTERM", () => bot.stop());
