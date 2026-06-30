"use strict";

const { upsertLead } = require("../lib/supabase");
const { benvenuto } = require("./messages");

/**
 * Intercetta i nuovi membri del gruppo e prova a mandare un DM automatico.
 *
 * NB: Telegram non consente di scrivere in DM a un utente che non ha mai
 * avviato il bot. Se il DM fallisce (utente che non ha mai fatto /start),
 * si salva comunque il lead e si lascia un breve invito nel gruppo.
 */
async function handleNewMember(ctx) {
  const nuovi = ctx.message?.new_chat_members || [];
  for (const u of nuovi) {
    if (u.is_bot) continue;

    const telegram_id = u.id;
    const username = u.username || null;
    const nome = u.first_name || null;

    try {
      await upsertLead({
        telegram_id,
        username,
        nome,
        pipeline_stage: "nuovo",
      });
    } catch (e) {
      console.error("[newMember] upsertLead error:", e.message);
    }

    // Tentativo di DM diretto
    try {
      await ctx.api.sendMessage(telegram_id, benvenuto(nome, username), {
        disable_web_page_preview: false,
      });
    } catch (e) {
      // 403: l'utente non ha mai avviato il bot → invito nel gruppo
      const handle = username ? `@${username}` : nome || "ciao";
      try {
        await ctx.reply(
          `${handle} — apri @${ctx.me.username} e premi Avvia: ti mando il sondaggio in privato. ` +
            `Niente spam, due minuti.`,
          { reply_to_message_id: ctx.message.message_id }
        );
      } catch (_) {
        /* ignora */
      }
    }
  }
}

module.exports = { handleNewMember };
