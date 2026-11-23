/* ── ALTIN KITLIĞI (Osman, 23 Kas: "altın kazanımı çok zor olacak") ──
   İlk ayar: oyunun KAZANDIRDIĞI altın yarıya iner (ALTIN_CARPAN). Oynadıkça ayarlanır.
   Mümkün olan her yerde ödül TABLOSU değiştirilir (ekranda yazan = verilen):
     giriş ödülleri, arena rakipleri, seviye sandıkları, görevler (QUESTS + QUEST_DATA), zindan canavar altını.
   Tablosu olmayan rastgele kazançlar (harabe hazinesi, vergi/harabe toplama, PvP)
   işlev sonunda kesilir; o sırada çıkan bildirimlerdeki 🪙 rakamı da düzeltilir.
   KAPSAM DIŞI: NPC'ye satış, oyuncu pazarı, lonca hazinesi, kervan ve madenci (kendi değerleri var).
   index.html'e dokunmaz. */
(function () {
  var ALTIN_CARPAN = 0.5;
  var F = ALTIN_CARPAN;
  function yarim(n) { return Math.max(1, Math.round(n * F)); }
  function sayiYaz(n) { return n.toLocaleString('tr-TR'); }
  function etiketDuzelt(s) {   // "1.500 Altın" → "750 Altın"
    return String(s).replace(/(\d[\d.]*)(\s*Altın)/, function (m, sayi, ek) { return sayiYaz(yarim(parseInt(sayi.replace(/\./g, ''), 10))) + ek; });
  }

  /* 1) Tablolar */
  try {
    LOGIN_REWARDS.forEach(function (r) { if (r.type === 'gold') { r.val = yarim(r.val); r.lbl = etiketDuzelt(r.lbl); } });
  } catch (e) { console.warn('[altın] giriş ödülleri', e); }
  try {
    Object.keys(ARENA_OPPONENTS).forEach(function (lig) { ARENA_OPPONENTS[lig].forEach(function (o) { if (o.reward) o.reward = yarim(o.reward); }); });
  } catch (e) { console.warn('[altın] arena', e); }
  try {
    Object.keys(LEVEL_CHEST_CONFIG).forEach(function (k) {
      var c = LEVEL_CHEST_CONFIG[k];
      if (c.gold) c.gold = yarim(c.gold);
      (c.previewItems || []).forEach(function (p) { if (/Altın/.test(p.name || '')) p.name = etiketDuzelt(p.name); });
    });
  } catch (e) { console.warn('[altın] seviye sandıkları', e); }
  try {
    Object.keys(QUESTS).forEach(function (k) { (QUESTS[k] || []).forEach(function (q) { if (q.rew && q.rew.gold) q.rew.gold = yarim(q.rew.gold); }); });
  } catch (e) { console.warn('[altın] görevler', e); }
  try {
    Object.keys(QUEST_DATA).forEach(function (k) {
      (QUEST_DATA[k] || []).forEach(function (q) { (q.rewards || []).forEach(function (r) { if (r.t === 'gold') r.v = yarim(r.v); }); });
    });
  } catch (e) { console.warn('[altın] hikâye görevleri', e); }

  /* 2) Zindan: canavarın altını öldürme anında ölçeklenir (uçan yazı da doğru rakamı gösterir) */
  if (typeof window.zgAwardKill === 'function') {
    var asilKill = window.zgAwardKill;
    window.zgAwardKill = function (m) {
      if (!m || !m.gold) return asilKill.apply(this, arguments);
      var g0 = m.gold;
      m.gold = g0 * F;
      try { return asilKill.apply(this, arguments); } finally { m.gold = g0; }
    };
  }

  /* 3) Tablosuz rastgele kazançlar: işlev sonunda artı farkı kes, bildirimdeki rakamı düzelt */
  ['finishExplore', 'finishGather', 'pvpEnd'].forEach(function (ad) {
    var asil = window[ad];
    if (typeof asil !== 'function') return;
    window[ad] = function () {
      var once = G.gold, asilToast = window.toast;
      window.toast = function (msg) {
        msg = String(msg).replace(/(\+?)(\d[\d.]*)(\s?🪙)/g, function (m, arti, sayi, ek) {
          return arti + sayiYaz(yarim(parseInt(sayi.replace(/\./g, ''), 10))) + ek;
        });
        return asilToast.call(this, msg);
      };
      var sonuc;
      try { sonuc = asil.apply(this, arguments); }
      finally {
        window.toast = asilToast;
        var fark = G.gold - once;
        if (fark > 0) G.gold -= fark - yarim(fark);
      }
      return sonuc;
    };
  });
})();
