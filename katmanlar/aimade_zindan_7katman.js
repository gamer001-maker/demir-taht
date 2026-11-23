// TEK ZİNDAN, 7 KATMAN (Osman, 21 Kas 2026) — yalnız mobil kopyada; index.html'e DOKUNMAZ.
// - Bölge bağı kalkar: her canavar, hangi bölgeden girilirse girilsin, katmanında çıkar
// - 5 kademe → 7 katman: Katman 6 = Sv.51–60, Katman 7 = Sv.61–70 (Sv.50 sonrası içerik eksiği)
// - Ekranda "N. SEVİYE ZİNDAN" yerine "N. KATMAN"
// ⚠ SUNUCU: zd_start_run ödül tavanı yalnız 5 kademe tanımlı (arkadaşın sql/xp_migration.sql, c_xp/c_gold).
//   6–7. katman şimdilik sunucuya 5 olarak bildirilir (ödül kaybolmasın). Kalıcı çözüm: SQL'e 2 kademe eklenmeli.
// ⚠ GÖRSEL: 6–7. katman canavarları şimdilik mevcut görselleri kullanır (yeni çizim bekliyor).
// Kaldırmak için katman-zindan/ klasörünü silmek yeter.
(function () {
  'use strict';
  if (typeof ZD_TIERS === 'undefined' || typeof window.renderZindan !== 'function') return;
  var MAX = 7;

  // 1) Yeni katmanlar (değerler 5. kademeden ~×1,8 türetildi; denge sonra ayarlanır)
  ZD_TIERS[6] = {
    lv: [51, 60], img: '5seviyezindan', /* GEÇİCİ görsel */
    mobs: [
      { id: 'k6_golgekurt', name: 'Gölge Kurt', icon: '🐺', img: 'bozkurt', hp: 1900, atk: 330, def: 95, xp: 700, gold: 600 },
      { id: 'k6_orklordu', name: 'Ork Savaş Lordu', icon: '👹', img: 'orksavasci', hp: 2200, atk: 320, def: 120, xp: 740, gold: 640 },
      { id: 'k6_karagolem', name: 'Kara Golem', icon: '🗿', img: 'tasgolem', hp: 2500, atk: 290, def: 150, xp: 760, gold: 660 },
      { id: 'k6_golgevampir', name: 'Gölge Vampir', icon: '🧛', img: 'vampir', hp: 1700, atk: 370, def: 85, xp: 730, gold: 630 },
      { id: 'k6_kadimyeti', name: 'Kadim Yeti', icon: '🦧', img: 'zindanyeti', fr: true, hp: 2100, atk: 350, def: 105, xp: 750, gold: 650 },
      { id: 'k6_kemikejder', name: 'Kemik Ejderi', icon: '🐲', img: 'miniejderhaz', fr: true, hp: 2000, atk: 380, def: 100, xp: 780, gold: 680 },
      { id: 'k6_kadimmamut', name: 'Kadim Mamut', icon: '🐘', img: 'zindanmamut', fr: true, hp: 2600, atk: 300, def: 140, xp: 770, gold: 670 },
    ],
    boss: { id: 'k6_ejderhalordu', name: 'Ejderha Lordu', icon: '🐉', img: 'kadimejderhaz', fr: true, hp: 16500, atk: 470, def: 150, xp: 4800, gold: 4000, isBoss: true },
    strongBoss: { id: 'k6_kadimnekro', name: 'Kadim Nekromancer', icon: '💀', img: 'necromancer', hp: 22000, atk: 560, def: 130, xp: 7600, gold: 6500, isBoss: true, strong: true },
  };
  ZD_TIERS[7] = {
    lv: [61, 70], img: '5seviyezindan', /* GEÇİCİ görsel */
    mobs: [
      { id: 'k7_cehennemmuhafiz', name: 'Cehennem Muhafızı', icon: '😈', img: 'seytan', hp: 3500, atk: 600, def: 180, xp: 1300, gold: 1120 },
      { id: 'k7_orkkrali', name: 'Kadim Ork Kralı', icon: '👹', img: 'orksavasci', hp: 3900, atk: 580, def: 210, xp: 1340, gold: 1150 },
      { id: 'k7_karaakbaba', name: 'Kara Akbaba', icon: '🦅', img: 'zindanakbaba', fr: true, hp: 3000, atk: 660, def: 150, xp: 1300, gold: 1110 },
      { id: 'k7_buzdevi', name: 'Buz Devi', icon: '🧌', img: 'zindanbuztrolu', fr: true, hp: 4000, atk: 610, def: 200, xp: 1360, gold: 1170 },
      { id: 'k7_olumsovalyesi', name: 'Ölüm Şövalyesi', icon: '⚔', img: 'altinsovalye', hp: 3700, atk: 640, def: 230, xp: 1400, gold: 1200 },
      { id: 'k7_kadimbuzgolemi', name: 'Kadim Buz Golemi', icon: '🗿', img: 'zindanbuzgolemi', fr: true, hp: 4400, atk: 560, def: 260, xp: 1380, gold: 1190 },
      { id: 'k7_kurtsurusu', name: 'Asena Kurdu', icon: '🐺', img: 'bozkurt', hp: 3300, atk: 650, def: 170, xp: 1320, gold: 1130 },
    ],
    boss: { id: 'k7_erlikhan', name: 'Erlik Han', icon: '👑', img: 'necromancer', hp: 30000, atk: 820, def: 250, xp: 8800, gold: 7400, isBoss: true },
    strongBoss: { id: 'k7_ejderhakrali', name: 'Kadim Ejderha Kralı', icon: '🐉', img: 'kadimejderhaz', fr: true, hp: 40000, atk: 980, def: 240, xp: 14000, gold: 12000, isBoss: true, strong: true },
  };

  // 2) Bölge bağı kalkar
  window.zdRegionMobs = function (mobs) { return mobs; };

  // 3) Katman sınırı 5 → 7
  window.zdPlayerTier = function () { return Math.max(1, Math.min(MAX, Math.ceil(((typeof G !== 'undefined' && G.level) || 1) / 10))); };
  window.zdPickedTier = function () { var t = Number(ZD.pickTier); return (t >= 1 && t <= MAX) ? t : window.zdPlayerTier(); };
  window.zdPickTier = function (n) { n = Number(n); if (!(n >= 1 && n <= MAX)) return; ZD.pickTier = n; window.renderZindan(); };

  // 4) Sunucu: 6–7 → 5 olarak bildir (ödül tavanı yalnız 5 kademe tanımlı)
  if (typeof window.zdStartRun === 'function') {
    var asilBaslat = window.zdStartRun;
    window.zdStartRun = function (tier) { return asilBaslat.call(this, Math.min(5, Number(tier) || 1)); };
  }

  // 5) Giriş ekranı: seçiciye 6 ve 7, "SEVİYE ZİNDAN" → "KATMAN"
  var asilRender = window.renderZindan;
  window.renderZindan = function () {
    var r = asilRender.apply(this, arguments);
    var ekran = document.getElementById('gs-zindan');
    if (!ekran) return r;
    var secici = ekran.querySelector('.zd-tierpick');
    if (secici && !secici.querySelector('[data-k="6"]')) {
      var benim = window.zdPlayerTier(), secili = window.zdPickedTier();
      [6, 7].forEach(function (n) {
        var d = ZD_TIERS[n];
        var b = document.createElement('button');
        b.className = 'zd-tbtn' + (n === secili ? ' on' : '') + (n > benim ? ' over' : '');
        b.setAttribute('data-k', n);
        b.title = 'Sv.' + d.lv[0] + '–' + d.lv[1];
        b.innerHTML = '<b>' + n + '</b><span>Sv.' + d.lv[0] + '–' + d.lv[1] + '</span>';
        b.onclick = function () { window.zdPickTier(n); };
        secici.appendChild(b);
      });
      secici.style.flexWrap = 'wrap';
    }
    // Yazılar: "N. SEVİYE ZİNDAN" → "N. KATMAN", "Seviye Zindana Gir" → "Katmana Gir"
    var yuru = document.createTreeWalker(ekran, NodeFilter.SHOW_TEXT);
    var n;
    while ((n = yuru.nextNode())) {
      if (/SEVİYE ZİNDAN|Seviye Zindan/.test(n.nodeValue)) {
        n.nodeValue = n.nodeValue.replace(/(\d+)\. SEVİYE ZİNDAN/g, '$1. KATMAN').replace(/(\d+)\. Seviye Zindana Gir/g, '$1. Katmana Gir').replace(/(\d+)\. Seviye Zindan/g, '$1. Katman');
      }
    }
    return r;
  };
})();
