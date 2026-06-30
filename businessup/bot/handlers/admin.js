"use strict";

const {
  getStats,
  getLeadByUsername,
  updateLeadByTelegramId,
  STAGES,
} = require("../lib/supabase");
const { broadcast } = require("../lib/broadcast");

const ADMIN_TELEGRAM_ID = Number(process.env.ADMIN_TELEGRAM_ID || 0);

function isAdmin(ctx) {
  return ctx.from && Number(ctx.from.id) === ADMIN_TELEGRAM_ID;
}

/** Estrae il testo dopo il comando, es. "/send_q ciao" -> "ciao". */
function arg(ctx) {
  const t = ctx.message?.text || "";
  const i = t.indexOf(" ");
  return i === -1 ? "" : t.slice(i + 1).trim();
}

const MENU =
  "*Pannello admin — Business UP*\n\n" +
  "/lista — KPI pipeline\n" +
  "/send\\_q [testo] — broadcast ai qualificati\n" +
  "/send\\_s [testo] — broadcast agli squalificati\n" +
  "/send\\_all [testo] — broadcast a tutti\n" +
  "/dm @username [testo] — messaggio singolo\n" +
  "/set\\_stage @username [stage] — cambia pipeline stage\n\n" +
  "_Stage validi:_ " +
  STAGES.join(", ");

function register(bot) {
  // Guard: i comandi admin rispondono solo all'ADMIN_TELEGRAM_ID.
  bot.command("menu", async (ctx) => {
    if (!isAdmin(ctx)) return;
    await ctx.reply(MENU, { parse_mode: "Markdown" });
  });

  bot.command("lista", async (ctx) => {
    if (!isAdmin(ctx)) return;
    const s = await getStats();
    await ctx.reply(
      `*KPI Business UP*\n\n` +
        `Totale lead: *${s.totale}*\n` +
        `Nuovi: ${s.nuovi}\n` +
        `Qualificati: *${s.qualificati}*\n` +
        `Squalificati: ${s.squalificati}\n` +
        `Contattati: ${s.contattati}\n` +
        `Clienti: *${s.clienti}*\n\n` +
        `Sondaggi completati: ${s.sondaggi_completati}\n` +
        `Tasso qualifica: *${s.tasso_qualifica}%*`,
      { parse_mode: "Markdown" }
    );
  });

  const sendCmd = (tipo) => async (ctx) => {
    if (!isAdmin(ctx)) return;
    const testo = arg(ctx);
    if (!testo) return ctx.reply("Uso: /send_" + tipo[0] + " [testo]");
    await ctx.reply(`Invio in corso a "${tipo}"…`);
    const r = await broadcast(bot, tipo, testo);
    await ctx.reply(
      `Broadcast "${tipo}" completato.\n` +
        `Destinatari: ${r.destinatari_count}\n` +
        `Inviati: ${r.inviati}\n` +
        `Falliti: ${r.falliti}`
    );
  };

  bot.command("send_q", sendCmd("qualificati"));
  bot.command("send_s", sendCmd("squalificati"));
  bot.command("send_all", sendCmd("tutti"));

  bot.command("dm", async (ctx) => {
    if (!isAdmin(ctx)) return;
    const raw = arg(ctx);
    const m = raw.match(/^@?(\S+)\s+([\s\S]+)$/);
    if (!m) return ctx.reply("Uso: /dm @username [testo]");
    const [, username, testo] = m;
    const lead = await getLeadByUsername(username);
    if (!lead || !lead.telegram_id)
      return ctx.reply(`Lead @${username} non trovato o senza telegram_id.`);
    try {
      await bot.api.sendMessage(lead.telegram_id, testo);
      await ctx.reply(`Inviato a @${username}.`);
    } catch (e) {
      await ctx.reply(`Errore invio a @${username}: ${e.message}`);
    }
  });

  bot.command("set_stage", async (ctx) => {
    if (!isAdmin(ctx)) return;
    const raw = arg(ctx);
    const m = raw.match(/^@?(\S+)\s+(\S+)/);
    if (!m) return ctx.reply("Uso: /set_stage @username [stage]");
    const [, username, stage] = m;
    if (!STAGES.includes(stage))
      return ctx.reply(`Stage non valido. Validi: ${STAGES.join(", ")}`);
    const lead = await getLeadByUsername(username);
    if (!lead) return ctx.reply(`Lead @${username} non trovato.`);
    await updateLeadByTelegramId(lead.telegram_id, { pipeline_stage: stage });
    await ctx.reply(`@${username} → stage "${stage}".`);
  });
}

module.exports = { register, isAdmin, ADMIN_TELEGRAM_ID };
