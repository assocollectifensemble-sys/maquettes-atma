/* ============================================================
   QR.JS — Générateur de QR codes 100 % local (aucun CDN, aucun réseau).
   Mode « octets » (UTF-8), correction d'erreur niveau M (≈ 15 %),
   versions 1 à 10 choisies automatiquement (jusqu'à ~200 caractères).
   Algorithme d'après la norme ISO/IEC 18004, structure inspirée de la
   bibliothèque « QR Code generator » de Project Nayuki (licence MIT).
   Usage : QR.svg("https://exemple.re/?station=1", { taille: 220 })
   ============================================================ */
(function () {
  "use strict";
  // Tables du niveau M, index = version
  const ECC_PAR_BLOC = [-1, 10, 16, 26, 18, 24, 16, 18, 22, 22, 26];
  const NB_BLOCS = [-1, 1, 1, 1, 2, 2, 4, 4, 4, 5, 5];

  // Multiplication dans GF(2^8) (polynôme 0x11D)
  function mul(x, y) {
    let z = 0;
    for (let i = 7; i >= 0; i--) { z = (z << 1) ^ ((z >>> 7) * 0x11D); z ^= ((y >>> i) & 1) * x; }
    return z & 0xFF;
  }
  function diviseurRS(deg) {
    const r = new Array(deg).fill(0); r[deg - 1] = 1; let root = 1;
    for (let i = 0; i < deg; i++) {
      for (let j = 0; j < r.length; j++) { r[j] = mul(r[j], root); if (j + 1 < r.length) r[j] ^= r[j + 1]; }
      root = mul(root, 0x02);
    }
    return r;
  }
  function resteRS(data, div) {
    const r = new Array(div.length).fill(0);
    for (const b of data) { const f = b ^ r.shift(); r.push(0); div.forEach((c, i) => { r[i] ^= mul(c, f); }); }
    return r;
  }
  function modulesBruts(v) {
    let r = (16 * v + 128) * v + 64;
    if (v >= 2) { const n = Math.floor(v / 7) + 2; r -= (25 * n - 10) * n - 55; if (v >= 7) r -= 36; }
    return r;
  }
  const motsDonnees = v => Math.floor(modulesBruts(v) / 8) - ECC_PAR_BLOC[v] * NB_BLOCS[v];
  function positionsAlignement(v) {
    if (v === 1) return [];
    const n = Math.floor(v / 7) + 2, taille = v * 4 + 17;
    const pas = Math.ceil((v * 4 + 4) / (n * 2 - 2)) * 2;
    const r = [6];
    for (let p = taille - 7; r.length < n; p -= pas) r.splice(1, 0, p);
    return r;
  }
  function utf8(s) { return Array.from(new TextEncoder().encode(s)); }

  function encode(texte) {
    const octets = utf8(texte);
    let v = 1;
    for (; v <= 10; v++) { const bits = 4 + (v < 10 ? 8 : 16) + octets.length * 8; if (bits <= motsDonnees(v) * 8) break; }
    if (v > 10) throw new Error("Texte trop long pour le QR code");
    // --- flux de bits
    const bb = []; const ajoute = (val, n) => { for (let i = n - 1; i >= 0; i--) bb.push((val >>> i) & 1); };
    ajoute(4, 4); ajoute(octets.length, v < 10 ? 8 : 16); octets.forEach(b => ajoute(b, 8));
    const cap = motsDonnees(v) * 8;
    ajoute(0, Math.min(4, cap - bb.length)); ajoute(0, (8 - bb.length % 8) % 8);
    for (let p = 0xEC; bb.length < cap; p ^= 0xEC ^ 0x11) ajoute(p, 8);
    const donnees = []; for (let i = 0; i < bb.length; i += 8) { let x = 0; for (let j = 0; j < 8; j++) x = (x << 1) | bb[i + j]; donnees.push(x); }
    // --- blocs + correction d'erreur + entrelacement
    const nb = NB_BLOCS[v], ecl = ECC_PAR_BLOC[v], brut = Math.floor(modulesBruts(v) / 8);
    const courts = nb - brut % nb, lgCourt = Math.floor(brut / nb), div = diviseurRS(ecl), blocs = [];
    for (let i = 0, k = 0; i < nb; i++) {
      const d = donnees.slice(k, k + lgCourt - ecl + (i < courts ? 0 : 1)); k += d.length;
      const e = resteRS(d, div); if (i < courts) d.push(0); blocs.push(d.concat(e));
    }
    const mots = [];
    for (let i = 0; i < blocs[0].length; i++) blocs.forEach((b, j) => { if (i !== lgCourt - ecl || j >= courts) mots.push(b[i]); });

    // --- matrice
    const n = v * 4 + 17;
    const m = Array.from({ length: n }, () => new Array(n).fill(false));
    const f = Array.from({ length: n }, () => new Array(n).fill(false));
    const fixe = (x, y, d) => { m[y][x] = d; f[y][x] = true; };
    for (let i = 0; i < n; i++) { fixe(6, i, i % 2 === 0); fixe(i, 6, i % 2 === 0); }
    const chercheur = (cx, cy) => { for (let dy = -4; dy <= 4; dy++) for (let dx = -4; dx <= 4; dx++) { const x = cx + dx, y = cy + dy, d = Math.max(Math.abs(dx), Math.abs(dy)); if (x >= 0 && x < n && y >= 0 && y < n) fixe(x, y, d !== 2 && d !== 4); } };
    chercheur(3, 3); chercheur(n - 4, 3); chercheur(3, n - 4);
    const al = positionsAlignement(v), na = al.length;
    for (let i = 0; i < na; i++) for (let j = 0; j < na; j++) {
      if ((i === 0 && j === 0) || (i === 0 && j === na - 1) || (i === na - 1 && j === 0)) continue;
      for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) fixe(al[i] + dx, al[j] + dy, Math.max(Math.abs(dx), Math.abs(dy)) !== 1);
    }
    const format = masque => {
      const d = (0 << 3) | masque; let r = d; // niveau M = 00
      for (let i = 0; i < 10; i++) r = (r << 1) ^ ((r >>> 9) * 0x537);
      const b = ((d << 10) | r) ^ 0x5412, bit = i => ((b >>> i) & 1) !== 0;
      for (let i = 0; i <= 5; i++) fixe(8, i, bit(i));
      fixe(8, 7, bit(6)); fixe(8, 8, bit(7)); fixe(7, 8, bit(8));
      for (let i = 9; i < 15; i++) fixe(14 - i, 8, bit(i));
      for (let i = 0; i < 8; i++) fixe(n - 1 - i, 8, bit(i));
      for (let i = 8; i < 15; i++) fixe(8, n - 15 + i, bit(i));
      fixe(8, n - 8, true);
    };
    format(0);
    if (v >= 7) {
      let r = v; for (let i = 0; i < 12; i++) r = (r << 1) ^ ((r >>> 11) * 0x1F25);
      const b = (v << 12) | r;
      for (let i = 0; i < 18; i++) { const d = ((b >>> i) & 1) !== 0, a = n - 11 + i % 3, c = Math.floor(i / 3); fixe(a, c, d); fixe(c, a, d); }
    }
    // placement en zigzag
    let i = 0;
    for (let droite = n - 1; droite >= 1; droite -= 2) {
      if (droite === 6) droite = 5;
      for (let vert = 0; vert < n; vert++) for (let j = 0; j < 2; j++) {
        const x = droite - j, monte = ((droite + 1) & 2) === 0, y = monte ? n - 1 - vert : vert;
        if (!f[y][x] && i < mots.length * 8) { m[y][x] = ((mots[i >>> 3] >>> (7 - (i & 7))) & 1) !== 0; i++; }
      }
    }
    const MASQUES = [(x, y) => (x + y) % 2 === 0, (x, y) => y % 2 === 0, x => x % 3 === 0, (x, y) => (x + y) % 3 === 0,
      (x, y) => (Math.floor(x / 3) + Math.floor(y / 2)) % 2 === 0, (x, y) => x * y % 2 + x * y % 3 === 0,
      (x, y) => (x * y % 2 + x * y % 3) % 2 === 0, (x, y) => ((x + y) % 2 + x * y % 3) % 2 === 0];
    const applique = k => { for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) if (!f[y][x] && MASQUES[k](x, y)) m[y][x] = !m[y][x]; };
    // pénalité simplifiée (suites de même couleur, carrés 2x2, équilibre) : suffit pour un bon choix
    const penalite = () => {
      let p = 0, noirs = 0;
      for (let a = 0; a < n; a++) {
        let cl = null, ll = 0, cc = null, lc = 0;
        for (let b = 0; b < n; b++) {
          if (m[a][b] === cl) { ll++; if (ll === 5) p += 3; else if (ll > 5) p++; } else { cl = m[a][b]; ll = 1; }
          if (m[b][a] === cc) { lc++; if (lc === 5) p += 3; else if (lc > 5) p++; } else { cc = m[b][a]; lc = 1; }
          if (m[a][b]) noirs++;
          if (a < n - 1 && b < n - 1) { const c = m[a][b]; if (c === m[a][b + 1] && c === m[a + 1][b] && c === m[a + 1][b + 1]) p += 3; }
        }
      }
      return p + Math.floor(Math.abs(noirs * 20 - n * n * 10) / (n * n)) * 10;
    };
    let meilleur = 0, min = Infinity;
    for (let k = 0; k < 8; k++) { applique(k); format(k); const p = penalite(); if (p < min) { min = p; meilleur = k; } applique(k); }
    applique(meilleur); format(meilleur);
    return { taille: n, version: v, masque: meilleur, modules: m };
  }

  // Rendu SVG net (un seul chemin), marge de 4 modules exigée par la norme
  function svg(texte, opts) {
    opts = opts || {};
    const q = encode(texte), n = q.taille, M = 4, tot = n + 2 * M;
    let d = "";
    for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) if (q.modules[y][x]) d += "M" + (x + M) + " " + (y + M) + "h1v1h-1z";
    // taille arrondie à un nombre ENTIER de pixels par module : modules réguliers, meilleure lecture par les appareils photo
    const t = Math.max(1, Math.floor((opts.taille || 200) / tot)) * tot;
    return '<svg class="qrsvg" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + tot + ' ' + tot + '" width="' + t + '" height="' + t + '" shape-rendering="crispEdges" role="img" aria-label="QR code : ' +
      String(texte).replace(/[&<>"]/g, "") + '"><rect width="' + tot + '" height="' + tot + '" fill="#fff"/><path d="' + d + '" fill="' + (opts.couleur || "#000") + '"/></svg>';
  }
  window.QR = { encode, svg };
})();
