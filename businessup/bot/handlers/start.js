"use strict";

const { upsertLead, getLeadByTelegramId } = require("../lib/supabase");
const { benvenuto } = require("./messages");

/**
 * /start — salva il lead su Supabase e manda benvenuto + link al sondaggio.
 * Lo stage "nuovo" viene impostato solo alla prima creazione: se il lead esiste
 * già (es. qualificato/cliente) il suo stage non viene sovrascritto.
 */
async function handleStart(ctx) {
  const from = ctx.from || {};
  const telegram_id = from.id;
  const username = from.username || null;
  const nome = from.first_name || null;

  try {
    const esistente = await getLeadByTelegramId(telegram_id);
    await upsertLead({
      telegram_id,
      username,
      nome,
      bot_started: true,
      ...(esistente ? {} : { pipeline_stage: "nuovo" }),
    });
  } catch (e) {
    console.error("[start] upsertLead error:", e.message);
  }

  await ctx.reply(benvenuto(nome, username), {
    disable_web_page_preview: false,
  });
}

module.exports = { handleStart };
