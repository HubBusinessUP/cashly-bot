"use strict";

const { getLeads, logBroadcast } = require("./supabase");

/** Pausa per rispettare i limiti di rate di Telegram (~30 msg/s). */
function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

/**
 * Invia un broadcast a un segmento.
 *
 * @param {import('grammy').Bot} bot
 * @param {string} tipo   "qualificati" | "squalificati" | "tutti" | stage
 * @param {string} testo
 * @returns {{ destinatari_count:number, inviati:number, falliti:number }}
 */
async function broadcast(bot, tipo, testo) {
  let stageFilter = null;
  if (tipo === "qualificati") stageFilter = "qualificato";
  else if (tipo === "squalificati") stageFilter = "squalificato";
  else if (tipo === "tutti" || tipo === "all") stageFilter = null;
  else stageFilter = tipo; // stage esplicito

  const leads = await getLeads(stageFilter);
  const destinatari = leads.filter((l) => l.telegram_id);

  let inviati = 0;
  let falliti = 0;

  for (let i = 0; i < destinatari.length; i++) {
    const l = destinatari[i];
    try {
      await bot.api.sendMessage(l.telegram_id, testo, {
        disable_web_page_preview: true,
      });
      inviati++;
    } catch (e) {
      falliti++;
      console.error(
        `[broadcast] fail @${l.username || l.telegram_id}:`,
        e.message
      );
    }
    // throttle leggero ogni 25 invii
    if (i > 0 && i % 25 === 0) await sleep(1000);
    else await sleep(40);
  }

  await logBroadcast({
    tipo,
    testo,
    destinatari_count: destinatari.length,
    inviati,
    falliti,
  });

  return { destinatari_count: destinatari.length, inviati, falliti };
}

module.exports = { broadcast };
