"use strict";

const {
  getLeadByUsername,
  getLeadByTelegramId,
  updateLeadByTelegramId,
  saveSondaggio,
  normUsername,
} = require("../lib/supabase");
const { valuta } = require("./qualifica");
const { QUALIFICATO_TESTO, tastieraProdotti } = require("./messages");

/**
 * Elabora una sottomissione del sondaggio web.
 *
 * Trova il lead (per telegram_id se presente, altrimenti per username),
 * salva le risposte, esegue la qualificazione e manda il messaggio
 * qualificato/squalificato all'utente.
 *
 * @param {import('grammy').Bot} bot
 * @param {object} body  JSON inviato dal sondaggio
 * @returns {{ ok: boolean, stage?: string, error?: string }}
 */
async function processSondaggio(bot, body) {
  const username = normUsername(body.telegram_username || body.username);
  const telegram_id = body.telegram_id ? Number(body.telegram_id) : null;

  if (!username && !telegram_id) {
    return { ok: false, error: "telegram_username mancante" };
  }

  // Risolvi il lead
  let lead = null;
  if (telegram_id) lead = await getLeadByTelegramId(telegram_id);
  if (!lead && username) lead = await getLeadByUsername(username);

  if (!lead) {
    // L'utente ha compilato il sondaggio senza aver avviato il bot.
    return { ok: false, error: "lead_non_trovato", needs_bot_start: true };
  }

  const tgId = lead.telegram_id;

  // Normalizza le risposte verso lo schema sondaggio_risposte
  const risposte = {
    telegram_id: tgId,
    nome: body.nome || lead.nome || null,
    livello_trading: body.livello_trading || null,
    esperienza_broker: body.esperienza_broker || null,
    capitale: body.capitale || null,
    prodotto_preferito: body.prodotto_preferito || null,
    willingness_to_pay: body.willingness_to_pay || null,
    note_libere: body.note_libere || null,
  };

  try {
    await saveSondaggio(risposte);
  } catch (e) {
    console.error("[webhook] saveSondaggio error:", e.message);
  }

  // Qualificazione
  const esito = valuta({
    capitale: body.capitale,
    esperienza_broker: body.esperienza_broker,
    willingness_to_pay: body.willingness_to_pay,
  });

  const nuovoStage = esito.qualificato ? "qualificato" : "squalificato";

  await updateLeadByTelegramId(tgId, {
    nome: risposte.nome,
    sondaggio_completato: true,
    pipeline_stage: nuovoStage,
    motivo_squalifica: esito.motivo_squalifica,
  });

  // Messaggio all'utente
  try {
    if (esito.qualificato) {
      await bot.api.sendMessage(tgId, QUALIFICATO_TESTO, {
        reply_markup: tastieraProdotti(),
      });
    } else {
      await bot.api.sendMessage(tgId, esito.messaggio);
    }
  } catch (e) {
    console.error("[webhook] sendMessage error:", e.message);
  }

  return { ok: true, stage: nuovoStage };
}

module.exports = { processSondaggio };
