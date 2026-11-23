// GELİŞİM AĞACI — PROTOTİP (Osman, 21 Kas 2026). Yalnız mobil kopyada (www/) eklenir; index.html'e DOKUNMAZ.
// Ortadan dört yöne açılan ağaç: 🐺 Bozkurt (saldırı) · 🔷 Tamga (beceri/büyü) · 🎣 Balıkçı (balıkçılık, 23 Kas) · 🌳 Hayat Ağacı (dayanıklılık)
// Kurallar: halka seviyeleri (0/3, 0/5), seçim baklavası (iki halkadan yalnız biri), kilit taşları, yollar arası köprüler.
// PUAN KAYNAĞI (Osman kararı, 21 Kas 2026): karakter seviyesi — her seviye 1 puan.
// KAYIT: şimdilik yalnız bu cihazda (localStorage). Kalıcı sürümde veritabanına (profiles) sütun gerekir.
// Kaldırmak için katman-agac/ klasörünü silmek yeter.
(function () {
  'use strict';
  if (typeof window.getEffectiveStats !== 'function') return;

  // ───────── AĞAÇ VERİSİ ─────────
  // Etki anahtarları: dmg (fiziksel+büyü %), mdmg (büyü %), crit (kritik puanı), hp (maks can %),
  // dr (hasar azaltma puanı), dodge (kaçınma puanı), luck (şans), cdr (beceri bekleme süresi %)
  // Balıkçılık (katman-balik okur): bhak (günlük hak +), bpen (ÇEK süresi +ms), bkac (kaçırma −puan), bxp (balık XP %), besya (balık ganimeti şansı +puan)
  var YOLLAR = {
    kurt:  { ad: 'Bozkurt Yolu',     sembol: '🐺', renk: '#d9573f', aci: -90, ozet: 'Saldırı, kritik, hasar' },
    agac:  { ad: 'Hayat Ağacı Yolu', sembol: '🌳', renk: '#5fae4e', aci: 180, ozet: 'Can, savunma, dayanıklılık' },
    tamga: { ad: 'Tamga Yolu',       sembol: '🔷', renk: '#4f8fd9', aci: 0,   ozet: 'Büyü, beceri, şans' },
    olta:  { ad: 'Balıkçı Yolu',     sembol: '🎣', renk: '#3fb8b0', aci: 90,  ozet: 'Balıkçılık: hak, isabet, XP, ganimet' },
  };
  // Her yolun iskeleti: d = merkezden uzaklık, o = yana kayma; tur: kucuk / secim / kilit
  var ISKELET = [
    { k: 'a1', d: 95,  o: -42, tur: 'kucuk', max: 3, ata: ['merkez'] },
    { k: 'a2', d: 95,  o: 42,  tur: 'kucuk', max: 3, ata: ['merkez'] },
    { k: 's1', d: 168, o: -58, tur: 'secim', max: 1, ata: ['a1', 'a2'], grup: 1 },
    { k: 's2', d: 168, o: 58,  tur: 'secim', max: 1, ata: ['a1', 'a2'], grup: 1 },
    { k: 'k1', d: 238, o: 0,   tur: 'kilit', max: 1, ata: ['s1', 's2'] },
    { k: 'b1', d: 305, o: -58, tur: 'kucuk', max: 5, ata: ['k1'] },
    { k: 'b2', d: 305, o: 58,  tur: 'kucuk', max: 5, ata: ['k1'] },
    { k: 's3', d: 370, o: -46, tur: 'secim', max: 1, ata: ['b1', 'b2'], grup: 2 },
    { k: 's4', d: 370, o: 46,  tur: 'secim', max: 1, ata: ['b1', 'b2'], grup: 2 },
    { k: 'k2', d: 438, o: 0,   tur: 'kilit', max: 1, ata: ['s3', 's4'] },
  ];
  var ICERIK = {
    kurt: {
      a1: ['Keskin Pençe', '⚔', 'Hasar +%2 (seviye başına)', { dmg: 2 }],
      a2: ['Av Gözü', '🎯', 'Kritik şansı +%1 (seviye başına)', { crit: 1 }],
      s1: ['Yırtıcı', '🩸', 'Hasar +%5', { dmg: 5 }],
      s2: ['Sinsi Kurt', '💨', 'Kaçınma +%4', { dodge: 4 }],
      k1: ['Kurt Sürüsü', '🐺', 'KİLİT TAŞI — Hasar +%8, kritik şansı +%3', { dmg: 8, crit: 3 }],
      b1: ['Kemik Kıran', '🦴', 'Hasar +%2 (seviye başına)', { dmg: 2 }],
      b2: ['Ölümcül Isırık', '☠', 'Kritik şansı +%1 (seviye başına)', { crit: 1 }],
      s3: ['Gök Kurt', '⚡', 'Hasar +%10, ama hasar azaltma −%4', { dmg: 10, dr: -4 }],
      s4: ["Asena'nın Gölgesi", '🌑', 'Kaçınma +%6, kritik şansı +%4', { dodge: 6, crit: 4 }],
      k2: ["Bozkurt'un Öfkesi", '🔥', 'KİLİT TAŞI — Hasar +%15', { dmg: 15 }],
    },
    agac: {
      a1: ['Kök Salmak', '🌱', 'Maks can +%3 (seviye başına)', { hp: 3 }],
      a2: ['Kabuk', '🪵', 'Hasar azaltma +%1 (seviye başına)', { dr: 1 }],
      s1: ['Yaşlı Çınar', '🌲', 'Maks can +%8', { hp: 8 }],
      s2: ['Sarmaşık', '🍃', 'Kaçınma +%4', { dodge: 4 }],
      k1: ['Ulu Kayın', '🌳', 'KİLİT TAŞI — Hasar azaltma +%4, maks can +%5', { dr: 4, hp: 5 }],
      b1: ['Öz Su', '💧', 'Maks can +%3 (seviye başına)', { hp: 3 }],
      b2: ['Demir Kabuk', '🛡', 'Hasar azaltma +%1 (seviye başına)', { dr: 1 }],
      s3: ['Dağ Gibi', '⛰', 'Hasar azaltma +%6', { dr: 6 }],
      s4: ['Yeniden Doğuş', '✨', 'Maks can +%12', { hp: 12 }],
      k2: ["Hayat Ağacı'nın Kalbi", '💚', 'KİLİT TAŞI — Maks can +%15, hasar azaltma +%3', { hp: 15, dr: 3 }],
    },
    tamga: {
      a1: ['Bilge Tamga', '📜', 'Büyü hasarı +%3 (seviye başına)', { mdmg: 3 }],
      a2: ['Uğur', '🍀', 'Şans +2 (seviye başına)', { luck: 2 }],
      s1: ['Kut', '👑', 'Kritik şansı +%3', { crit: 3 }],
      s2: ['Ruh Bağı', '🔗', 'Hasar +%4', { dmg: 4 }],
      k1: ["Kam'ın Davulu", '🥁', 'KİLİT TAŞI — Zindan becerilerinin bekleme süresi −%10', { cdr: 10 }],
      b1: ['Ateş Tamgası', '🔥', 'Büyü hasarı +%3 (seviye başına)', { mdmg: 3 }],
      b2: ['Bereket', '🌾', 'Şans +3 (seviye başına)', { luck: 3 }],
      s3: ['Gök Tengri', '☀', 'Hasar +%8', { dmg: 8 }],
      s4: ["Umay'ın Koruması", '🕊', 'Hasar azaltma +%4, maks can +%6', { dr: 4, hp: 6 }],
      k2: ['Ebedi Tamga', '🔷', 'KİLİT TAŞI — Beceri bekleme süresi −%15, büyü hasarı +%10', { cdr: 15, mdmg: 10 }],
    },
  };
  ICERIK.olta = {
    a1: ['Sabırlı El', '🖐', 'ÇEK süresi +60 ms (seviye başına)', { bpen: 60 }],
    a2: ['Yem Ustası', '🪱', 'Balık kaçırma −%1 (seviye başına)', { bkac: 1 }],
    s1: ['Şafak Balıkçısı', '🌅', 'Günlük balık hakkı +5', { bhak: 5 }],
    s2: ['Derin Ağ', '🕸', 'Balık ganimeti şansı +%2', { besya: 2 }],
    k1: ['Deniz Kurdu', '⚓', 'KİLİT TAŞI — Balıktan XP +%10, günlük hak +5', { bxp: 10, bhak: 5 }],
    b1: ['Usta Olta', '🎣', 'Balıktan XP +%3 (seviye başına)', { bxp: 3 }],
    b2: ['Dalga Okuyan', '🌊', 'Balık kaçırma −%1 (seviye başına)', { bkac: 1 }],
    s3: ['Kraken Avcısı', '🦑', 'Balık ganimeti şansı +%4, hasar +%3', { besya: 4, dmg: 3 }],
    s4: ['Gölün Bereketi', '💧', 'Günlük balık hakkı +10', { bhak: 10 }],
    k2: ["Su Ana'nın Lütfu", '🧜', 'KİLİT TAŞI — Balıktan XP +%20, ÇEK süresi +200 ms, şans +5', { bxp: 20, bpen: 200, luck: 5 }],
  };
  // Yollar arası köprüler (iki komşu yolun ilk kilit taşından biri alınmış olmalı)
  var KOPRULER = [
    { id: 'kp_kurt_agac',  yollar: ['kurt', 'agac'],  ad: 'Savaşçı Ruhu', ikon: '⚔🌳', acik: 'KÖPRÜ — Hasar +%4, maks can +%4', etki: { dmg: 4, hp: 4 } },
    { id: 'kp_olta_agac',  yollar: ['olta', 'agac'],  ad: 'Kıyı Şifacısı', ikon: '🎣🌳', acik: 'KÖPRÜ — Maks can +%5, hasar azaltma +%2', etki: { hp: 5, dr: 2 } },
    { id: 'kp_tamga_olta', yollar: ['tamga', 'olta'], ad: 'Ay Işığı Avı',  ikon: '🔷🎣', acik: 'KÖPRÜ — Balık kaçırma −%3, şans +4', etki: { bkac: 3, luck: 4 } },
    { id: 'kp_tamga_kurt', yollar: ['tamga', 'kurt'], ad: 'Avcı Büyüsü',  ikon: '🔷🐺', acik: 'KÖPRÜ — Kritik şansı +%3, büyü hasarı +%4', etki: { crit: 3, mdmg: 4 } },
  ];
  // Ağacın sınır aşımı: oyunun kendi tavanlarının üstüne en fazla bu kadar çıkabilir (denge sonra ayarlanır)
  var TAVAN_EK = { dr: 0.10, crit: 0.10, dodge: 0.10 };

  // ───────── HALKALARI ÜRET ─────────
  var M = 500; // SVG merkezi (1000×1000)
  var HALKALAR = {};
  HALKALAR.merkez = { id: 'merkez', x: M, y: M, tur: 'merkez', max: 0, ad: 'Başlangıç', ikon: '◈', acik: 'Gelişim ağacının başlangıcı. Dört yoldan birini seç.', ata: [] };
  Object.keys(YOLLAR).forEach(function (y) {
    var a = YOLLAR[y].aci * Math.PI / 180, ux = Math.cos(a), uy = Math.sin(a), px = -uy, py = ux;
    ISKELET.forEach(function (s) {
      var c = ICERIK[y][s.k], id = y + '_' + s.k;
      HALKALAR[id] = {
        id: id, yol: y, x: M + ux * s.d + px * s.o, y: M + uy * s.d + py * s.o, tur: s.tur, max: s.max,
        ad: c[0], ikon: c[1], acik: c[2], etki: c[3], grup: s.grup ? y + '_g' + s.grup : null,
        ata: s.ata.map(function (k) { return k === 'merkez' ? 'merkez' : y + '_' + k; }),
      };
    });
    HALKALAR[y + '_amblem'] = { id: y + '_amblem', yol: y, x: M + ux * 528, y: M + uy * 528, tur: 'amblem', max: 0, ad: YOLLAR[y].ad, ikon: YOLLAR[y].sembol, acik: YOLLAR[y].ozet, ata: [] };
  });
  KOPRULER.forEach(function (k) {
    var p = HALKALAR[k.yollar[0] + '_k1'], q = HALKALAR[k.yollar[1] + '_k1'];
    // iki kilit taşının ortası, merkezden biraz dışarı itilmiş
    var mx = (p.x + q.x) / 2, my = (p.y + q.y) / 2, dx = mx - M, dy = my - M, L = Math.hypot(dx, dy) || 1;
    HALKALAR[k.id] = { id: k.id, yol: 'kopru', x: M + dx / L * 255, y: M + dy / L * 255, tur: 'kopru', max: 1, ad: k.ad, ikon: k.ikon, acik: k.acik, etki: k.etki,
      ata: [k.yollar[0] + '_k1', k.yollar[1] + '_k1'], yollar: k.yollar };
  });

  // ───────── DURUM (kayıt) ─────────
  function anahtar() { try { return 'dt_agac_' + ((typeof currentUser !== 'undefined' && currentUser && currentUser.id) || 'yerel'); } catch (e) { return 'dt_agac_yerel'; } }
  var DURUM = null;
  function yukle() { try { DURUM = JSON.parse(localStorage.getItem(anahtar()) || '{}') || {}; } catch (e) { DURUM = {}; } return DURUM; }
  function kaydet() { try { localStorage.setItem(anahtar(), JSON.stringify(DURUM)); } catch (e) { /* depolama yoksa yalnız bu oturum */ } }
  function sev(id) { if (!DURUM) yukle(); return DURUM[id] || 0; }
  function harcanan() { if (!DURUM) yukle(); return Object.keys(DURUM).reduce(function (t, k) { return t + (HALKALAR[k] ? DURUM[k] : 0); }, 0); }
  function toplamPuan() { try { return Math.max(0, (G && G.level) || 1); } catch (e) { return 1; } } // her seviye 1 puan (Osman kararı)
  function kalan() { return toplamPuan() - harcanan(); }
  function yolHarcanan(y) { return Object.keys(HALKALAR).filter(function (k) { return HALKALAR[k].yol === y; }).reduce(function (t, k) { return t + sev(k); }, 0); }

  function ataTamam(h) {
    if (h.tur === 'kopru') return h.ata.some(function (a) { return sev(a) > 0; });
    return h.ata.some(function (a) { return a === 'merkez' || sev(a) > 0; });
  }
  function grupDolu(h) { // seçim baklavasında diğeri alınmışsa kilitli
    if (!h.grup) return false;
    return Object.keys(HALKALAR).some(function (k) { var o = HALKALAR[k]; return o.grup === h.grup && o.id !== h.id && sev(o.id) > 0; });
  }
  function alinabilir(h) {
    if (!h.max || sev(h.id) >= h.max) return false;
    return kalan() > 0 && ataTamam(h) && !grupDolu(h);
  }

  // ───────── ETKİLER ─────────
  function toplamEtki() {
    var t = { dmg: 0, mdmg: 0, crit: 0, hp: 0, dr: 0, dodge: 0, luck: 0, cdr: 0, bhak: 0, bpen: 0, bkac: 0, bxp: 0, besya: 0 };
    Object.keys(HALKALAR).forEach(function (k) {
      var h = HALKALAR[k], n = sev(k);
      if (!n || !h.etki) return;
      var carpan = h.tur === 'kucuk' ? n : 1;
      Object.keys(h.etki).forEach(function (e) { t[e] += h.etki[e] * carpan; });
    });
    return t;
  }
  window.agacEtki = toplamEtki;   // diğer katmanlar (balıkçılık) okur
  var asilStat = window.getEffectiveStats;
  window.getEffectiveStats = function () {
    var s = asilStat.apply(this, arguments);
    var t = toplamEtki();
    if (!s) return s;
    if (t.hp) { s.maxhp = Math.floor(s.maxhp * (1 + t.hp / 100)); s.hp = Math.min(s.hp, s.maxhp); }
    if (t.dmg || t.mdmg) {
      s.physDmg = Math.floor((s.physDmg || 0) * (1 + t.dmg / 100));
      s.magicDmg = Math.floor((s.magicDmg || 0) * (1 + (t.dmg + t.mdmg) / 100));
    }
    if (t.dr) s.damageReduction = Math.max(0, Math.min(0.65 + TAVAN_EK.dr, (s.damageReduction || 0) + t.dr / 100));
    if (t.crit) s.critChance = Math.min(0.75 + TAVAN_EK.crit, (s.critChance || 0) + t.crit / 100);
    if (t.dodge) s.dodgeChance = Math.min(0.40 + TAVAN_EK.dodge, (s.dodgeChance || 0) + t.dodge / 100);
    if (t.luck) s.luck = (s.luck || 0) + t.luck;
    s._agac = t;
    return s;
  };
  if (typeof window.zgSkillLeft === 'function') {
    window.zgSkillLeft = function (skillId) {
      var g = typeof ZD !== 'undefined' && ZD.g; if (!g) return 0;
      var sk = (typeof ZD_SKILLS !== 'undefined') && ZD_SKILLS.find(function (s) { return s.id === skillId; });
      if (!sk) return 0;
      var cd = sk.cd * (1 - Math.min(50, toplamEtki().cdr) / 100);
      return Math.max(0, cd - (Date.now() - (g.lastSkills[skillId] || 0)));
    };
  }

  // ───────── ARAYÜZ ─────────
  var css = document.createElement('style');
  css.textContent = [
    '#ga-ac{display:flex;align-items:center;justify-content:center;gap:8px;width:100%;margin:0 0 10px;padding:10px 14px;border-radius:8px;cursor:pointer;',
    'background:linear-gradient(180deg,#3a2a18,#261c12);border:1px solid var(--gold,#c9a24a);color:var(--gold2,#e8c56a);font:600 14px var(--font-head,serif)}',
    '#ga-ac b{background:#d9573f;color:#fff;border-radius:10px;padding:1px 7px;font-size:11px}',
    '#ga{position:fixed;inset:0;z-index:9500;background:radial-gradient(circle at 50% 45%,#1d1812,#0b0907 75%);display:flex;flex-direction:column;color:#e8dcc0;font-family:var(--font-body,system-ui)}',
    '#ga[hidden]{display:none!important}',
    '.ga-ust{display:flex;align-items:center;gap:10px;padding:10px 14px;padding-top:max(10px,env(safe-area-inset-top));border-bottom:1px solid #4a3220;background:#140f0a}',
    '.ga-ust h2{margin:0;font:600 17px var(--font-head,serif);color:var(--gold2,#e8c56a);flex:1}',
    '.ga-puan{font:600 13px var(--font-head,serif);color:#fff;background:#3a2a18;border:1px solid #6a4a28;border-radius:14px;padding:4px 10px}',
    '.ga-btn{background:#2a2016;border:1px solid #6a4a28;color:#e8dcc0;border-radius:8px;padding:6px 10px;font:600 12px var(--font-body,system-ui);cursor:pointer}',
    '.ga-yollar{display:flex;gap:6px;justify-content:center;padding:6px;flex-wrap:wrap}',
    '.ga-yol{font-size:11px;border-radius:10px;padding:2px 8px;border:1px solid}',
    '.ga-sahne{flex:1;position:relative;overflow:hidden;touch-action:none;cursor:grab}',
    '.ga-sahne svg{position:absolute;left:0;top:0;transform-origin:0 0}',
    '.ga-zoom{position:absolute;right:12px;bottom:12px;display:flex;flex-direction:column;gap:6px}',
    '.ga-zoom button{width:38px;height:38px;border-radius:50%;background:#2a2016cc;border:1px solid #6a4a28;color:#e8dcc0;font-size:20px;cursor:pointer}',
    '.ga-alt{border-top:1px solid #4a3220;background:#140f0a;padding:12px 14px;padding-bottom:max(12px,env(safe-area-inset-bottom));min-height:112px}',
    '.ga-alt h3{margin:0 0 2px;font:600 15px var(--font-head,serif)}',
    '.ga-alt .ga-sev{font-size:12px;color:#b09870;margin-bottom:6px}',
    '.ga-alt p{margin:0 0 8px;font-size:13px;line-height:1.45}',
    '.ga-ogren{background:linear-gradient(180deg,#c9a24a,#8a6a20);color:#1a1208;border:0;border-radius:8px;padding:9px 18px;font:700 14px var(--font-head,serif);cursor:pointer}',
    '.ga-ogren:disabled{background:#3a3228;color:#7a6a58;cursor:default}',
    '.ga-not{font-size:12px;color:#d9a45a}',
  ].join('');
  document.head.appendChild(css);

  var kok = document.createElement('div');
  kok.id = 'ga'; kok.hidden = true;
  kok.innerHTML = '<div class="ga-ust"><h2>🌳 Gelişim Ağacı</h2><span class="ga-puan" id="ga-puan"></span>'
    + '<button class="ga-btn" id="ga-sifirla">Sıfırla</button><button class="ga-btn" id="ga-kapat">✕</button></div>'
    + '<div class="ga-yollar" id="ga-yollar"></div>'
    + '<div class="ga-sahne" id="ga-sahne"><svg id="ga-svg" viewBox="0 0 1000 1000" width="1000" height="1000" style="overflow:visible"></svg>'
    + '<div class="ga-zoom"><button id="ga-z1">+</button><button id="ga-z2">−</button><button id="ga-z0" style="font-size:14px">⤢</button></div></div>'
    + '<div class="ga-alt" id="ga-alt"></div>';
  document.body.appendChild(kok);

  var secili = 'merkez', gor = { s: 1, x: 0, y: 0 };
  var NS = 'http://www.w3.org/2000/svg';
  function el(ad, at, ic) { var e = document.createElementNS(NS, ad); for (var k in at) e.setAttribute(k, at[k]); if (ic != null) e.textContent = ic; return e; }
  function renkOf(h) { return h.yol === 'kopru' ? '#c9a24a' : (YOLLAR[h.yol] ? YOLLAR[h.yol].renk : '#c9a24a'); }
  function yaricap(h) { return { merkez: 34, amblem: 40, kilit: 30, kopru: 22, secim: 22, kucuk: 20 }[h.tur] || 20; }

  function ciz() {
    var svg = document.getElementById('ga-svg');
    while (svg.firstChild) svg.removeChild(svg.firstChild);
    var defs = el('defs', {});
    defs.appendChild(el('filter', { id: 'ga-isik', x: '-50%', y: '-50%', width: '200%', height: '200%' }));
    defs.firstChild.appendChild(el('feGaussianBlur', { stdDeviation: '4' }));
    svg.appendChild(defs);
    // halka çemberleri (süs)
    [150, 300, 450].forEach(function (r) { svg.appendChild(el('circle', { cx: M, cy: M, r: r, fill: 'none', stroke: '#3a2c1c', 'stroke-width': 1, 'stroke-dasharray': '2 6' })); });
    // bağlantılar
    Object.keys(HALKALAR).forEach(function (k) {
      var h = HALKALAR[k];
      h.ata.forEach(function (a) {
        var p = HALKALAR[a]; if (!p) return;
        var acik = sev(h.id) > 0 && (a === 'merkez' || sev(a) > 0);
        svg.appendChild(el('line', { x1: p.x, y1: p.y, x2: h.x, y2: h.y, stroke: acik ? renkOf(h) : '#4a3a2a', 'stroke-width': acik ? 4 : 2, 'stroke-linecap': 'round', opacity: acik ? 1 : 0.8 }));
      });
      if (h.tur === 'amblem') {
        var k2 = HALKALAR[h.yol + '_k2'], ac2 = sev(k2.id) > 0;
        svg.appendChild(el('line', { x1: k2.x, y1: k2.y, x2: h.x, y2: h.y, stroke: ac2 ? renkOf(h) : '#4a3a2a', 'stroke-width': ac2 ? 4 : 2, 'stroke-dasharray': ac2 ? '' : '4 6' }));
      }
    });
    // halkalar
    Object.keys(HALKALAR).forEach(function (k) {
      var h = HALKALAR[k], r = yaricap(h), n = sev(k), renk = renkOf(h);
      var g = el('g', { transform: 'translate(' + h.x + ',' + h.y + ')', style: 'cursor:pointer', 'data-id': k });
      var durum = h.tur === 'merkez' || h.tur === 'amblem' ? 'süs' : n > 0 ? 'alindi' : alinabilir(h) ? 'acik' : 'kilitli';
      if (durum === 'alindi' || h.tur === 'merkez') g.appendChild(el('circle', { r: r + 6, fill: renk, opacity: 0.35, filter: 'url(#ga-isik)' }));
      var dolgu = durum === 'alindi' ? '#2a1e12' : '#17120c';
      var cizgi = durum === 'kilitli' ? '#4a3a2a' : renk;
      if (h.tur === 'kilit') {
        var pts = []; for (var i = 0; i < 6; i++) { var aa = Math.PI / 3 * i + Math.PI / 6; pts.push((Math.cos(aa) * r).toFixed(1) + ',' + (Math.sin(aa) * r).toFixed(1)); }
        g.appendChild(el('polygon', { points: pts.join(' '), fill: dolgu, stroke: cizgi, 'stroke-width': 3 }));
      } else if (h.tur === 'secim') {
        g.appendChild(el('rect', { x: -r * 0.8, y: -r * 0.8, width: r * 1.6, height: r * 1.6, transform: 'rotate(45)', fill: dolgu, stroke: cizgi, 'stroke-width': 3, rx: 3 }));
      } else {
        g.appendChild(el('circle', { r: r, fill: dolgu, stroke: cizgi, 'stroke-width': h.tur === 'amblem' ? 4 : 3 }));
      }
      if (k === secili) g.appendChild(el('circle', { r: r + 9, fill: 'none', stroke: '#fff', 'stroke-width': 2, 'stroke-dasharray': '4 4' }));
      var yazi = el('text', { 'text-anchor': 'middle', 'dominant-baseline': 'central', 'font-size': h.tur === 'amblem' ? 38 : h.tur === 'kopru' ? 13 : r * 0.95, opacity: durum === 'kilitli' ? 0.45 : 1 }, h.ikon);
      g.appendChild(yazi);
      if (h.max > 1) {
        g.appendChild(el('rect', { x: -15, y: r - 4, width: 30, height: 15, rx: 7, fill: '#0b0907', stroke: cizgi, 'stroke-width': 1 }));
        g.appendChild(el('text', { y: r + 4, 'text-anchor': 'middle', 'dominant-baseline': 'central', 'font-size': 10, fill: n ? '#fff' : '#9a8a70', 'font-family': 'system-ui' }, n + '/' + h.max));
      }
      if (h.tur === 'amblem') g.appendChild(el('text', { y: r + 18, 'text-anchor': 'middle', 'font-size': 15, fill: renk, 'font-family': 'Georgia,serif', 'font-weight': 600 }, h.ad));
      svg.appendChild(g);
    });
    document.getElementById('ga-puan').textContent = 'Puan: ' + kalan() + ' / ' + toplamPuan();
    document.getElementById('ga-yollar').innerHTML = Object.keys(YOLLAR).map(function (y) {
      return '<span class="ga-yol" style="color:' + YOLLAR[y].renk + ';border-color:' + YOLLAR[y].renk + '">' + YOLLAR[y].sembol + ' ' + YOLLAR[y].ad.replace(' Yolu', '') + ' · ' + yolHarcanan(y) + '</span>';
    }).join('');
  }

  function detay() {
    var h = HALKALAR[secili], d = document.getElementById('ga-alt');
    if (!h) { d.innerHTML = ''; return; }
    var n = sev(h.id), not = '';
    if (h.max) {
      if (n >= h.max) not = 'Tamamlandı.';
      else if (grupDolu(h)) not = 'Bu bir seçim halkası: aynı baklavadaki diğer halkayı aldığın için kilitli.';
      else if (!ataTamam(h)) not = h.tur === 'kopru' ? 'Önce iki komşu yoldan birinin ilk kilit taşını al.' : 'Önce bağlı olduğu halkayı al.';
      else if (kalan() <= 0) not = 'Yeterli puanın yok.';
    }
    var tur = { kucuk: 'Halka', secim: 'Seçim halkası (ikisinden biri)', kilit: 'Kilit taşı', kopru: 'Köprü', merkez: '', amblem: '' }[h.tur];
    d.innerHTML = '<h3 style="color:' + renkOf(h) + '">' + h.ikon + ' ' + h.ad + '</h3>'
      + (h.max ? '<div class="ga-sev">' + tur + ' · ' + n + '/' + h.max + '</div>' : '')
      + '<p>' + h.acik + '</p>'
      + (h.max ? '<button class="ga-ogren" id="ga-ogren"' + (alinabilir(h) ? '' : ' disabled') + '>Öğren (1 puan)</button> ' : '')
      + (not ? '<span class="ga-not">' + not + '</span>' : '');
    var b = document.getElementById('ga-ogren');
    if (b) b.onclick = function () {
      if (!alinabilir(h)) return;
      DURUM[h.id] = sev(h.id) + 1; kaydet(); ciz(); detay(); tazele();
    };
  }

  function tazele() { try { if (typeof renderKarakter === 'function') renderKarakter(); } catch (e) { /* karakter ekranı kapalı */ } }

  // kaydırma ve yakınlaştırma
  var sahne = document.getElementById('ga-sahne'), svgEl = document.getElementById('ga-svg'), suruklendi = false;
  function uygula() { svgEl.style.transform = 'translate(' + gor.x + 'px,' + gor.y + 'px) scale(' + gor.s + ')'; }
  function sigdir() {
    var w = sahne.clientWidth, h = sahne.clientHeight;
    gor.s = Math.min(w, h) / 1260; gor.x = w / 2 - M * gor.s; gor.y = h / 2 - (M - 15) * gor.s; uygula();
  }
  function yakin(f, cx, cy) {
    var w = sahne.clientWidth, h = sahne.clientHeight; cx = cx == null ? w / 2 : cx; cy = cy == null ? h / 2 : cy;
    var ns = Math.max(0.25, Math.min(3, gor.s * f));
    gor.x = cx - (cx - gor.x) * ns / gor.s; gor.y = cy - (cy - gor.y) * ns / gor.s; gor.s = ns; uygula();
  }
  var parmak = {}, bas = null;
  sahne.addEventListener('pointerdown', function (e) { parmak[e.pointerId] = { x: e.clientX, y: e.clientY }; bas = { x: e.clientX, y: e.clientY, gx: gor.x, gy: gor.y }; suruklendi = false; sahne.setPointerCapture(e.pointerId); });
  sahne.addEventListener('pointermove', function (e) {
    if (!parmak[e.pointerId]) return;
    var ids = Object.keys(parmak);
    if (ids.length >= 2) {
      var a = parmak[ids[0]], b = parmak[ids[1]], once = Math.hypot(a.x - b.x, a.y - b.y);
      parmak[e.pointerId] = { x: e.clientX, y: e.clientY };
      a = parmak[ids[0]]; b = parmak[ids[1]];
      var simdi = Math.hypot(a.x - b.x, a.y - b.y), r = sahne.getBoundingClientRect();
      if (once > 0) yakin(simdi / once, (a.x + b.x) / 2 - r.left, (a.y + b.y) / 2 - r.top);
      suruklendi = true; return;
    }
    parmak[e.pointerId] = { x: e.clientX, y: e.clientY };
    if (!bas) return;
    var dx = e.clientX - bas.x, dy = e.clientY - bas.y;
    if (Math.abs(dx) + Math.abs(dy) > 6) suruklendi = true;
    if (suruklendi) { gor.x = bas.gx + dx; gor.y = bas.gy + dy; uygula(); }
  });
  function birak(e) {
    var tekDokunus = Object.keys(parmak).length === 1 && !suruklendi;
    delete parmak[e.pointerId];
    if (tekDokunus && e.type === 'pointerup') {
      // Dokunuş sahnede yakalandığı için halkayı parmağın altından bul
      var hedef = document.elementFromPoint(e.clientX, e.clientY);
      var g = hedef && hedef.closest && hedef.closest('g[data-id]');
      if (g) { secili = g.getAttribute('data-id'); ciz(); detay(); }
    }
    if (!Object.keys(parmak).length) { bas = null; suruklendi = false; }
  }
  sahne.addEventListener('pointerup', birak); sahne.addEventListener('pointercancel', birak);
  sahne.addEventListener('wheel', function (e) { e.preventDefault(); var r = sahne.getBoundingClientRect(); yakin(e.deltaY < 0 ? 1.12 : 0.89, e.clientX - r.left, e.clientY - r.top); }, { passive: false });
  document.getElementById('ga-z1').onclick = function () { yakin(1.25); };
  document.getElementById('ga-z2').onclick = function () { yakin(0.8); };
  document.getElementById('ga-z0').onclick = sigdir;
  document.getElementById('ga-kapat').onclick = function () { kok.hidden = true; tazele(); };
  var sifirOnay = false;
  document.getElementById('ga-sifirla').onclick = function () {
    var b = document.getElementById('ga-sifirla');
    if (!sifirOnay) { sifirOnay = true; b.textContent = 'Emin misin?'; setTimeout(function () { sifirOnay = false; b.textContent = 'Sıfırla'; }, 3000); return; }
    sifirOnay = false; b.textContent = 'Sıfırla'; DURUM = {}; kaydet(); ciz(); detay(); tazele();
  };

  window.agacAc = function () { yukle(); kok.hidden = false; secili = 'merkez'; ciz(); detay(); requestAnimationFrame(sigdir); };

  // Alt menüde "Yetenek" düğmesi (Osman: Pazar'ın kaldırıldığı yere) → gelişim ağacı
  function menuDugmesi() {
    var nav = document.getElementById('bottom-nav');
    if (!nav || document.getElementById('bn-yetenek')) return;
    var btn = document.createElement('div');
    btn.className = 'bnav-btn'; btn.id = 'bn-yetenek';
    btn.innerHTML = '<div class="bnav-notif"><span class="bnav-icon"><img src="images/aimade_nav_yetenek.png" class="nav-img" alt="Yetenek"'
      + ' onerror="this.style.display=\'none\';this.nextElementSibling.style.display=\'inline\'"><span style="display:none;font-size:24px">🌳</span></span>'
      + '<span id="ga-rozet" style="display:none;position:absolute;top:-4px;right:-10px;min-width:16px;height:16px;padding:0 4px;border-radius:8px;background:#d9573f;color:#fff;font:700 10px/16px system-ui;text-align:center"></span></div>'
      + '<span class="bnav-lbl">Yetenek</span>';
    btn.style.position = 'relative';
    btn.onclick = function () { window.agacAc(); };
    var gorev = document.getElementById('bn-quest');
    nav.insertBefore(btn, gorev ? gorev.nextSibling : nav.firstChild);
    rozet();
  }
  function rozet() {
    var r = document.getElementById('ga-rozet'); if (!r) return;
    if (!DURUM) yukle();
    var k = kalan();
    r.style.display = k > 0 ? 'block' : 'none'; r.textContent = k > 99 ? '99+' : k;
  }
  var eskiTazele = tazele;
  tazele = function () { eskiTazele(); rozet(); };
  menuDugmesi();
  // Hesaba girildikten sonra seviye/oyuncu değişince rozet güncellensin
  setInterval(function () { menuDugmesi(); rozet(); }, 5000);
  window.addEventListener('resize', function () { if (!kok.hidden) sigdir(); });
})();
