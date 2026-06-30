"use strict";

/**
 * Testi del bot. Tono Business UP: anti-hype, diretto, zero promesse.
 * "Nessun guru. Nessun filtro."
 */
const { InlineKeyboard } = require("grammy");

const SONDAGGIO_URL =
  process.env.SONDAGGIO_URL || "https://businessup-sondaggio.netlify.app";
const TUTORIAL_URL =
  process.env.TUTORIAL_URL || "https://businessup-tutorial.netlify.app";

function linkSondaggio(username) {
  if (!username) return SONDAGGIO_URL;
  return `${SONDAGGIO_URL}/?u=${encodeURIComponent(username)}`;
}

function benvenuto(nome, username) {
  const n = nome ? ` ${nome}` : "";
  return (
    `Ciao${n}. Sono il bot di Business UP.\n\n` +
    `Ti ho visto nel gruppo — prima di mandarti roba a caso, voglio capire dove sei.\n\n` +
    `Compila il sondaggio: ${linkSondaggio(username)}\n\n` +
    `Ci vogliono 2 minuti. Dopo ti dico cosa fa al caso tuo.`
  );
}

const QUALIFICATO_TESTO =
  "Profilo confermato. Hai il capitale, l'esperienza e la testa giusta.\n\n" +
  "Ecco cosa puoi accedere ora:";

/** Tastiera inline con i tre prodotti. */
function tastieraProdotti() {
  return new InlineKeyboard()
    .url("BvB — Broker vs Broker", `${TUTORIAL_URL}/bvb.html`)
    .row()
    .url("Prop vs Broker", `${TUTORIAL_URL}/prop.html`)
    .row()
    .url("Bonus ADM", `${TUTORIAL_URL}/bonus.html`);
}

module.exports = {
  SONDAGGIO_URL,
  TUTORIAL_URL,
  linkSondaggio,
  benvenuto,
  QUALIFICATO_TESTO,
  tastieraProdotti,
};
