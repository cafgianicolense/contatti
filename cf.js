// Codice fiscale: calcolo e verifica. Stessa regola del pannello e del modulo attuali (admin.html, index.html), in un
// file unico che usano sia il motore (Node) sia la pagina del portale (browser).
// I comuni con codice catastale arrivano da comuni.js (COMUNI_CATASTALI, chiavi tipo "Roma (RM)").
(function (radice, crea) {
  if (typeof module === 'object' && module.exports) module.exports = crea;
  // nel browser comuni.js dichiara COMUNI_CATASTALI con const: si legge per nome, non come proprietà della finestra
  else radice.CodiceFiscale = crea(typeof COMUNI_CATASTALI !== 'undefined' ? COMUNI_CATASTALI : {});
})(typeof self !== 'undefined' ? self : this, function (COMUNI) {
  'use strict';
  const MESI = 'ABCDEHLMPRST';
  const DISPARI = {
    0: 1, 1: 0, 2: 5, 3: 7, 4: 9, 5: 13, 6: 15, 7: 17, 8: 19, 9: 21,
    A: 1, B: 0, C: 5, D: 7, E: 9, F: 13, G: 15, H: 17, I: 19, J: 21, K: 2, L: 4, M: 18,
    N: 20, O: 11, P: 3, Q: 6, R: 8, S: 12, T: 14, U: 16, V: 10, W: 22, X: 25, Y: 24, Z: 23
  };
  const PARI = {
    0: 0, 1: 1, 2: 2, 3: 3, 4: 4, 5: 5, 6: 6, 7: 7, 8: 8, 9: 9,
    A: 0, B: 1, C: 2, D: 3, E: 4, F: 5, G: 6, H: 7, I: 8, J: 9, K: 10, L: 11, M: 12,
    N: 13, O: 14, P: 15, Q: 16, R: 17, S: 18, T: 19, U: 20, V: 21, W: 22, X: 23, Y: 24, Z: 25
  };
  const LETTERE = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const FORMATO = /^[A-Z]{6}[0-9LMNPQRSTUV]{2}[ABCDEHLMPRST][0-9LMNPQRSTUV]{2}[A-Z][0-9LMNPQRSTUV]{3}[A-Z]$/;

  const normalizza = s => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toUpperCase().replace(/[^A-Z]/g, '');
  function separa(s) {
    let consonanti = '', vocali = '';
    for (const c of normalizza(s)) { if ('AEIOU'.includes(c)) vocali += c; else consonanti += c; }
    return { consonanti, vocali };
  }
  function codiceCognome(cognome) { const { consonanti, vocali } = separa(cognome); return (consonanti + vocali + 'XXX').slice(0, 3); }
  function codiceNome(nome) {
    const { consonanti, vocali } = separa(nome);
    if (consonanti.length >= 4) return consonanti[0] + consonanti[2] + consonanti[3];
    return (consonanti + vocali + 'XXX').slice(0, 3);
  }
  function carattereControllo(quindici) {
    let somma = 0;
    for (let i = 0; i < 15; i++) somma += (i % 2 === 0 ? DISPARI : PARI)[quindici[i]];
    return LETTERE[somma % 26];
  }
  // dataNascita: "aaaa-mm-gg". Il luogo è un comune ("Roma (RM)") o uno stato estero ("Romania (EE)", codice Z...).
  // Alcuni stati hanno due codici validi ("Z137|Z252"): calcola usa il primo, calcolaTutti li dà tutti.
  // Restituisce null se manca qualcosa o il luogo non è nell'elenco.
  function calcolaTutti({ cognome, nome, sesso, dataNascita, comuneNascita }) {
    if (!cognome || !nome || !sesso || !dataNascita || !comuneNascita) return [];
    const catastale = COMUNI[String(comuneNascita).trim()];
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(dataNascita));
    if (!catastale || !m) return [];
    let giorno = +m[3];
    if (String(sesso).toUpperCase() === 'F') giorno += 40;
    return String(catastale).split('|').map(codiceLuogo => {
      const quindici = codiceCognome(cognome) + codiceNome(nome) + m[1].slice(2) + MESI[+m[2] - 1] + String(giorno).padStart(2, '0') + codiceLuogo;
      return quindici + carattereControllo(quindici);
    });
  }
  const calcola = dati => calcolaTutti(dati)[0] || null;
  // il codice scritto corrisponde a uno di quelli calcolati dai dati (per gli stati con due codici, a uno dei due)
  const corrisponde = (cf, dati) => calcolaTutti(dati).includes(String(cf || '').toUpperCase().replace(/\s+/g, ''));
  const pulisci = cf => String(cf || '').toUpperCase().replace(/\s+/g, '');
  // Forma e carattere di controllo: un codice che non li rispetta è sicuramente sbagliato
  function valido(cf) {
    const c = pulisci(cf);
    return FORMATO.test(c) && carattereControllo(c.slice(0, 15)) === c[15];
  }
  return { calcola, calcolaTutti, corrisponde, valido, pulisci, codiceCognome, codiceNome, carattereControllo };
});
