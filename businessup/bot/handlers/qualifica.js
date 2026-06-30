"use strict";

/**
 * Logica di qualificazione Business UP.
 *
 * Qualificato = capitale >= €2.000  +  esperienza broker reale  +  disposto a pagare.
 * Se manca uno dei tre → squalificato, con motivo specifico (priorità: capitale, esperienza, pagamento).
 *
 * I valori in ingresso sono le stringhe esatte inviate dal sondaggio web.
 */

// Valori capitale che superano la soglia €2.000
const CAPITALE_OK = new Set(["2000-10000", "10000+"]);
// Valori esperienza broker che contano come "ha operato con broker reali"
const ESPERIENZA_OK = new Set(["si_under6", "si_over6"]);
// Unico valore di willingness che NON qualifica
const PAGAMENTO_KO = new Set(["solo_gratis"]);

const MOTIVI = {
  capitale:
    "Grazie per aver risposto. Con meno di €2.000 questi metodi non girano in positivo — te lo dico prima, non dopo. Quando sei pronto, sono qui.",
  esperienza:
    "Grazie per aver risposto. Senza esperienza diretta con broker reali si parte dalle basi, non da questi metodi — sarebbe solo bruciare capitale. Fai un po' di pratica e torna: ti aspetto.",
  pagamento:
    "Grazie per aver risposto. Questi metodi richiedono strumenti e tempo: se cerchi solo roba gratis non è il posto giusto, e preferisco dirtelo subito. Quando cambi prospettiva, sono qui.",
};

/**
 * @param {object} r risposte del sondaggio (capitale, esperienza_broker, willingness_to_pay)
 * @returns {{ qualificato: boolean, motivo_squalifica: string|null, messaggio: string|null }}
 */
function valuta(r) {
  const capitaleOk = CAPITALE_OK.has(String(r.capitale || ""));
  const esperienzaOk = ESPERIENZA_OK.has(String(r.esperienza_broker || ""));
  const pagamentoOk = !PAGAMENTO_KO.has(String(r.willingness_to_pay || ""));

  if (capitaleOk && esperienzaOk && pagamentoOk) {
    return { qualificato: true, motivo_squalifica: null, messaggio: null };
  }

  let motivo;
  if (!capitaleOk) motivo = "capitale";
  else if (!esperienzaOk) motivo = "esperienza";
  else motivo = "pagamento";

  return {
    qualificato: false,
    motivo_squalifica: motivo,
    messaggio: MOTIVI[motivo],
  };
}

module.exports = { valuta, MOTIVI, CAPITALE_OK, ESPERIENZA_OK, PAGAMENTO_KO };
