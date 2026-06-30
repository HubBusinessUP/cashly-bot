"use strict";

/**
 * Supabase client + helper sul progetto Business UP.
 * Schema dedicato: businessup (tabelle: leads, sondaggio_risposte, broadcast_log).
 */
const { createClient } = require("@supabase/supabase-js");

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.warn(
    "[supabase] SUPABASE_URL o SUPABASE_SERVICE_KEY mancanti — le chiamate DB falliranno."
  );
}

const supabase = createClient(SUPABASE_URL || "", SUPABASE_SERVICE_KEY || "", {
  db: { schema: "businessup" },
  auth: { persistSession: false, autoRefreshToken: false },
});

/** Stage validi della pipeline. */
const STAGES = [
  "nuovo",
  "qualificato",
  "squalificato",
  "contattato",
  "cliente",
];

/** Normalizza uno username Telegram (rimuove @, lowercase). */
function normUsername(u) {
  if (!u) return null;
  return String(u).trim().replace(/^@/, "").toLowerCase();
}

/**
 * Inserisce o aggiorna un lead per telegram_id.
 * Non sovrascrive con null i campi non passati.
 */
async function upsertLead(lead) {
  const payload = {
    telegram_id: lead.telegram_id,
    ultimo_messaggio: new Date().toISOString(),
  };
  if (lead.username !== undefined) payload.username = normUsername(lead.username);
  if (lead.nome !== undefined) payload.nome = lead.nome;
  if (lead.pipeline_stage !== undefined)
    payload.pipeline_stage = lead.pipeline_stage;
  if (lead.bot_started !== undefined) payload.bot_started = lead.bot_started;
  if (lead.sondaggio_completato !== undefined)
    payload.sondaggio_completato = lead.sondaggio_completato;
  if (lead.motivo_squalifica !== undefined)
    payload.motivo_squalifica = lead.motivo_squalifica;

  const { data, error } = await supabase
    .from("leads")
    .upsert(payload, { onConflict: "telegram_id" })
    .select()
    .maybeSingle();

  if (error) throw error;
  return data;
}

/** Aggiorna campi di un lead esistente per telegram_id. */
async function updateLeadByTelegramId(telegram_id, patch) {
  patch.ultimo_messaggio = new Date().toISOString();
  const { data, error } = await supabase
    .from("leads")
    .update(patch)
    .eq("telegram_id", telegram_id)
    .select()
    .maybeSingle();
  if (error) throw error;
  return data;
}

async function getLeadByTelegramId(telegram_id) {
  const { data, error } = await supabase
    .from("leads")
    .select("*")
    .eq("telegram_id", telegram_id)
    .maybeSingle();
  if (error) throw error;
  return data;
}

async function getLeadByUsername(username) {
  const u = normUsername(username);
  if (!u) return null;
  const { data, error } = await supabase
    .from("leads")
    .select("*")
    .eq("username", u)
    .maybeSingle();
  if (error) throw error;
  return data;
}

/** Lista lead, opzionalmente filtrata per stage. */
async function getLeads(stage) {
  let q = supabase
    .from("leads")
    .select("*")
    .order("ultimo_messaggio", { ascending: false });
  if (stage) q = q.eq("pipeline_stage", stage);
  const { data, error } = await q;
  if (error) throw error;
  return data || [];
}

/** KPI aggregati per la dashboard / comando /lista. */
async function getStats() {
  const leads = await getLeads();
  const by = (s) => leads.filter((l) => l.pipeline_stage === s).length;
  const totale = leads.length;
  const qualificati = by("qualificato");
  const squalificati = by("squalificato");
  const clienti = by("cliente");
  const sondaggi = leads.filter((l) => l.sondaggio_completato).length;
  const tasso_qualifica =
    totale > 0 ? Math.round((qualificati / totale) * 100) : 0;
  return {
    totale,
    nuovi: by("nuovo"),
    qualificati,
    squalificati,
    contattati: by("contattato"),
    clienti,
    sondaggi_completati: sondaggi,
    tasso_qualifica,
  };
}

/** Salva la riga del sondaggio (upsert per telegram_id). */
async function saveSondaggio(row) {
  const { data, error } = await supabase
    .from("sondaggio_risposte")
    .upsert(row, { onConflict: "telegram_id" })
    .select()
    .maybeSingle();
  if (error) throw error;
  return data;
}

/** Registra un broadcast nel log. */
async function logBroadcast({ tipo, testo, destinatari_count, inviati, falliti }) {
  const { error } = await supabase.from("broadcast_log").insert({
    tipo,
    testo,
    destinatari_count,
    inviati,
    falliti,
  });
  if (error) console.error("[supabase] logBroadcast error:", error.message);
}

module.exports = {
  supabase,
  STAGES,
  normUsername,
  upsertLead,
  updateLeadByTelegramId,
  getLeadByTelegramId,
  getLeadByUsername,
  getLeads,
  getStats,
  saveSondaggio,
  logBroadcast,
};
