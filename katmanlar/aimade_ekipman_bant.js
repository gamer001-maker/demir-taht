// EKİPMAN BANTLARI (Osman kararı, 21 Kas 2026) — yalnız mobil kopyada; index.html'e DOKUNMAZ.
// Her 10 seviye bir nadirlik, zindan katmanlarıyla birebir:
//   1 Sv.1–10 Ortak · 2 Sv.11–20 Nadir · 3 Sv.21–30 Değerli · 4 Sv.31–40 Epik
//   5 Sv.41–50 Efsanevi · 6 Sv.51–60 Kadim (yeni) · 7 Sv.61–70 Mitik (yeni)
// - Var olan silah türleri ve zırh hatları güç sırasıyla 1–7 bantlarına yayılır
// - Değerler (saldırı, savunma, can…) yeni bandın gücüne ölçeklenir
// - Ekranda görünen nadirlik = eşyanın bandı (getRollGrade); değer kalitesi yine rastgele
// - Takılar (yüzük, küpe) şimdilik banda bağlanmadı
// Kaldırmak için katman-ekipman/ klasörünü silmek yeter.
(function () {
  'use strict';
  if (typeof WEAPON_TEMPLATES === 'undefined' || typeof ARMOR_TEMPLATES === 'undefined') return;

  var BANT_ANAHTAR = [null, 'siradan', 'nadir', 'degerli', 'epik', 'efsanevi', 'kadim', 'mitik'];
  var BANT_GRADE = [null, 'gray', 'green', 'blue', 'purple', 'orange', 'red', 'gold'];

  // 1) Yeni nadirlikler
  if (typeof ROLL_GRADES !== 'undefined') {
    ROLL_GRADES.kadim = { label: 'Kadim', color: '#e0503f', gradeId: 'red' };
    ROLL_GRADES.mitik = { label: 'Mitik', color: '#f2cf4a', gradeId: 'gold' };
  }
  if (typeof GRADES !== 'undefined') { GRADES.red = { name: 'Kadim' }; GRADES.gold = { name: 'Mitik' }; }
  var css = document.createElement('style');
  css.textContent = [
    '.rq-kadim{border-color:#e0503f!important;box-shadow:0 0 12px #e0503f66!important}',
    '.rq-mitik{border-color:#f2cf4a!important;box-shadow:0 0 14px #f2cf4a80!important}',
    '.inv-tooltip.tt-red{--tt-c:#6e1d16;--tt-e:#e0503f}',
    '.inv-tooltip.tt-gold{--tt-c:#6b5512;--tt-e:#f2cf4a}',
    '.inv-slot.rarity-red,.tr-eq-slot.rarity-red{border-color:#e0503f}',
    '.inv-slot.rarity-gold,.tr-eq-slot.rarity-gold{border-color:#f2cf4a}',
  ].join('');
  document.head.appendChild(css);

  // 2) YENİ EŞYALAR (Bant planı, Osman onayı 23 Kas: https://claude.ai/artifact/W8uw7n3q37URcvB1BhYy8B)
  //    Değerleri aynı türdeki bir kaynak şablondan kopyalanır, sonra bandına ölçeklenir.
  //    Görseller gelene kadar kaynak silahın resmini kullanır (resim gelince img: 'aimade_...' yapılır).
  var YENI_SILAH = [ // [anahtar, ad, kaynak şablon]
    ['ejderhakilic', 'Ejderha Kılıcı', 'sefinkilici'],
    ['kurbanbicak', 'Kurban Bıçağı', 'ejderhabilicak'],
    ['nekrobicak', 'Nekro Bıçak', 'gunesbicak'],
    ['kemikhancer', 'Kemik Hançer', 'islenmishancer'],
    ['guneshancer', 'Güneş Hançeri', 'ejderhahancer'],
    ['nekrohancer', 'Nekro Hançer', 'yadigarhancer'],
    ['kamasa', 'Kam Asası', 'ejderaasa'],
    ['nekroasa', 'Nekro Asa', 'gunesasa'],
    ['gunestopuz', 'Güneş Topuzu', 'elementsopasi'],
    ['nekrotopuz', 'Nekro Topuz', 'ruhlusopa'],
    ['nekroyay', 'Nekro Yay', 'gunesyay'],
  ];
  var YENI_TAKIM = [ // [yeni önek, ad öneki, kaynak önek]
    ['nekroderi', 'Nekro Deri', 'golgederi'],
    ['nekrodokuma', 'Nekro Dokuma', 'karanlikdokuma'],
  ];
  function kopya(t) { return JSON.parse(JSON.stringify(t)); }
  YENI_SILAH.forEach(function (y) {
    var k = WEAPON_TEMPLATES[y[2]];
    if (!k || WEAPON_TEMPLATES[y[0]]) return;
    var t = kopya(k); t.name = y[1]; t._yeni = true;
    WEAPON_TEMPLATES[y[0]] = t;
  });
  Object.keys(ARMOR_TEMPLATES).forEach(function (key) {
    YENI_TAKIM.forEach(function (y) {
      if (key.indexOf(y[2]) !== 0) return;
      var parca = key.slice(y[2].length), yeniKey = y[0] + parca;
      if (ARMOR_TEMPLATES[yeniKey]) return;
      var t = kopya(ARMOR_TEMPLATES[key]);
      t.name = t.name.replace(/^(Gölge Deri|Karanlık Dokuma)/, y[1]);
      if (parca === 'cubbe') t.name = 'Nekro Cübbe';
      t._yeni = true;
      ARMOR_TEMPLATES[yeniKey] = t;
    });
  });

  // 3) Yerleşim: [şablon, bant, seviye] — her tür her bantta bir silah; 1. bantta bazı türlerde Sv.6'da ikinci silah
  var SILAH = [
    ['demirkilic', 1, 1], ['bakirkilic', 2, 11], ['elementkilic', 3, 21], ['ejderhakilic', 4, 31], ['guneskilic', 5, 41], ['sefinkilici', 6, 51], ['necrokilic', 7, 61],
    ['paslibicak', 1, 1], ['ilkelbicak', 1, 6], ['kemikbicak', 2, 11], ['runlubicak', 3, 21], ['ejderhabilicak', 4, 31], ['gunesbicak', 5, 41], ['kurbanbicak', 6, 51], ['nekrobicak', 7, 61],
    ['paslihancer', 1, 1], ['islenmishancer', 1, 6], ['kemikhancer', 2, 11], ['elementhancer', 3, 21], ['ejderhahancer', 4, 31], ['guneshancer', 5, 41], ['yadigarhancer', 6, 51], ['nekrohancer', 7, 61],
    ['duzsopa', 1, 1], ['basitasa', 1, 6], ['alevasa', 2, 11], ['elementasa', 3, 21], ['ejderaasa', 4, 31], ['gunesasa', 5, 41], ['kamasa', 6, 51], ['nekroasa', 7, 61],
    ['ilkelsopa', 1, 1], ['kemiksopa', 2, 11], ['elementsopasi', 3, 21], ['agirsopa', 4, 31], ['gunestopuz', 5, 41], ['ruhlusopa', 6, 51], ['nekrotopuz', 7, 61],
    ['basityay', 1, 1], ['kemikyay', 2, 11], ['elementyay', 3, 21], ['karanlikyay', 4, 31], ['gunesyay', 5, 41], ['throsyay', 6, 51], ['nekroyay', 7, 61],
  ];
  var TAKIM = [ // önek, bant, seviye
    ['tahta', 1, 1], ['demir', 1, 5], ['celik', 2, 11], ['dovmecelik', 3, 21], ['plaka', 4, 31], ['titanyum', 5, 41], ['karacelik', 6, 51], ['necro', 7, 61],
    ['deri', 1, 5], ['islenmisderi', 2, 11], ['kalinderi', 3, 21], ['pulluderi', 4, 31], ['agirderi', 5, 41], ['golgederi', 6, 51], ['nekroderi', 7, 61],
    ['kumas', 1, 5], ['ipek', 2, 11], ['kadifebuyucu', 3, 21], ['islemelikumas', 4, 31], ['mistikkumas', 5, 41], ['karanlikdokuma', 6, 51], ['nekrodokuma', 7, 61],
  ];
  var PARCA = /^(gogusluk|kask|eldiven|bot|cubbe|yelegi|sapkasi|eldiveni|botu|zirh)$/;

  // 4) Güç eğrileri (bir seviyedeki tipik ana değer). Sv.50 sonrası canavarlarla birlikte büyür (~×1,7 / bant)
  var SILAH_EGRI = [[1, 8], [10, 16], [20, 42], [25, 80], [30, 95], [40, 120], [50, 150], [60, 255], [70, 430]];
  var ZIRH_EGRI = [[1, 4], [5, 8], [10, 15], [15, 25], [22, 35], [30, 48], [40, 65], [50, 85], [60, 145], [70, 245]];
  function egri(t, L) {
    if (L <= t[0][0]) return t[0][1];
    for (var i = 1; i < t.length; i++) if (L <= t[i][0]) {
      var a = t[i - 1], b = t[i]; return a[1] + (b[1] - a[1]) * (L - a[0]) / (b[0] - a[0]);
    }
    return t[t.length - 1][1];
  }
  var KOK_OLCEK = { crit: 1, acc: 1 }; // yüzde gibi işleyen değerler daha yavaş büyür
  function olcekle(tpl, carpan) {
    if (!tpl.statRanges || Math.abs(carpan - 1) < 0.01) return;
    Object.keys(tpl.statRanges).forEach(function (k) {
      var c = KOK_OLCEK[k] ? Math.sqrt(carpan) : carpan, r = tpl.statRanges[k];
      var mn = Math.round(r[0] * c), mx = Math.round(r[1] * c);
      if (r[1] > 0) { mn = Math.max(r[0] > 0 ? 1 : 0, mn); mx = Math.max(mn + (r[1] > r[0] ? 1 : 0), mx); }
      tpl.statRanges[k] = [mn, mx];
    });
  }
  function yerlestir(tpl, bant, seviye, eg) {
    if (!tpl || tpl._bant) return;
    var eskiSv = tpl.reqLv || 1;
    olcekle(tpl, egri(eg, seviye) / egri(eg, eskiSv));
    tpl._eskiSv = eskiSv; tpl._bant = bant; tpl.reqLv = seviye; tpl.grade = BANT_GRADE[bant];
  }
  // Silahlar türün ortak eğrisine oturtulur: aynı türde üst bant her zaman daha güçlü olsun
  // (eski oransal ölçekleme, eskiden güçlü olan Ejderha Bıçağı'nı Güneş Bıçağı'nın üstünde bırakıyordu)
  function anaMerkez(t) { var r = t.statRanges && (t.statRanges.atk || t.statRanges.mgc); return r ? (r[0] + r[1]) / 2 : 0; }
  var BICIM = {};   // tür → tipik "ana değer / eğri" oranı (ortanca)
  Object.keys(WEAPON_TEMPLATES).forEach(function (k) {
    var t = WEAPON_TEMPLATES[k], m = anaMerkez(t);
    if (t._yeni || t._bant || !m) return;
    (BICIM[t.type] = BICIM[t.type] || []).push(m / egri(SILAH_EGRI, t.reqLv || 1));
  });
  Object.keys(BICIM).forEach(function (tur) {
    var a = BICIM[tur].sort(function (x, y) { return x - y; }); BICIM[tur] = a[Math.floor(a.length / 2)];
  });
  SILAH.forEach(function (s) {
    var t = WEAPON_TEMPLATES[s[0]];
    if (!t || t._bant) return;
    var m = anaMerkez(t), b = BICIM[t.type];
    if (!m || !b) { yerlestir(t, s[1], s[2], SILAH_EGRI); return; }
    olcekle(t, b * egri(SILAH_EGRI, s[2]) / m);
    t._eskiSv = t.reqLv || 1; t._bant = s[1]; t.reqLv = s[2]; t.grade = BANT_GRADE[s[1]];
  });
  Object.keys(ARMOR_TEMPLATES).forEach(function (k) {
    for (var i = 0; i < TAKIM.length; i++) {
      var on = TAKIM[i][0];
      if (k.indexOf(on) === 0 && PARCA.test(k.slice(on.length))) {
        // "deri" öneki "derigogusluk"u yakalar ama "islenmisderi…" ile karışmaz (indexOf === 0)
        yerlestir(ARMOR_TEMPLATES[k], TAKIM[i][1], TAKIM[i][2], ZIRH_EGRI); break;
      }
    }
  });

  // 4) Görünen nadirlik = bant (şablonu bantlı eşyalarda)
  if (typeof window.getRollGrade === 'function') {
    var asilNadirlik = window.getRollGrade;
    window.getRollGrade = function (item) {
      try {
        var tpl = typeof getItemTemplate === 'function' ? getItemTemplate(item) : null;
        if (tpl && tpl._bant) return BANT_ANAHTAR[tpl._bant];
      } catch (e) { /* şablon bulunamadı */ }
      return asilNadirlik.apply(this, arguments);
    };
  }

  // 5) Pazar satıcı listesi: şablonu olan kalemler yeni seviye/nadirliği göstersin
  if (typeof MARKET_ITEMS !== 'undefined') {
    MARKET_ITEMS.forEach(function (it) {
      var tpl = it.tplId && (WEAPON_TEMPLATES[it.tplId] || ARMOR_TEMPLATES[it.tplId]);
      if (!tpl && it.name) { // şablon kimliği olmayan satıcı kalemleri: isimden eşleştir
        var ad = it.name;
        tpl = Object.values(WEAPON_TEMPLATES).concat(Object.values(ARMOR_TEMPLATES)).filter(function (t) { return t.name === ad; })[0] || null;
      }
      if (tpl && tpl._bant) { it.reqLv = tpl.reqLv; it.grade = tpl.grade; }
    });
  }

  // 6) ZİNDAN GANİMETİ: her katman kendi bandından düşürür; üst bantlar çok çok nadir
  //    (Osman: "ilk bantta üst banttaki eşyaların düşmesi çok çok nadir olsun, 7'den aşağıya ayarla")
  //    Katman k'da: k+1 bandı %2 · k+2 bandı %0,3 · k+3 ve üstü bant başına %0,03 · geri kalanı kendi bandı
  var UST_SANS = [0, 0.02, 0.003, 0.0003, 0.0003, 0.0003, 0.0003];
  function bantSec(katman) {
    var k = Math.max(1, Math.min(7, Number(katman) || 1)), r = Math.random(), top = 0;
    for (var d = 6; d >= 1; d--) { // önce en uzak (en nadir) bant denenir
      if (k + d > 7) continue;
      top += UST_SANS[d];
      if (r < top) return k + d;
    }
    return k;
  }
  function bantHavuzu(kaynak, bant) {
    for (var b = bant; b >= 1; b--) { // bantta eşya yoksa bir alt banda düş (ör. 7. bantta silah yok)
      var h = Object.keys(kaynak).filter(function (k) { return kaynak[k]._bant === b; });
      if (h.length) return h;
    }
    return Object.keys(kaynak);
  }
  window.zdTierWeaponPool = function (tier) { return bantHavuzu(WEAPON_TEMPLATES, bantSec(tier)); };

  if (typeof window.dropRandomArmor === 'function') {
    window.dropRandomArmor = function (tier, note, opts) {
      if (invCount() >= invCap()) { toast('⚠ Envanter dolu, zırh düşmedi!'); return null; }
      var pool = bantHavuzu(ARMOR_TEMPLATES, bantSec(tier));
      var tplId = pool[Math.floor(Math.random() * pool.length)];
      var tpl = ARMOR_TEMPLATES[tplId];
      if (!tpl) return null;
      var rolled = (opts && opts.grade) ? rollStatsAtGrade(tpl, opts.grade) : rollStatsFromTpl(tpl);
      var plus = (opts && opts.plus != null) ? opts.plus : Math.max(0, (Number(tier) || 1) - 2);
      var son = plus > 0 ? getEnhancedStats({ baseStats: rolled, stats: rolled }, plus) : rolled;
      var armor = {
        id: newItemId(), cat: 'armor', tplId: tplId,
        name: tpl.name, icon: tpl.icon, type: tpl.type, grade: tpl.grade,
        reqLv: tpl.reqLv, classes: tpl.classes || ['warrior', 'rogue', 'mage'], img: tpl.img,
        stats: son, baseStats: rolled, material: tpl.material || null,
        _migrated: true, enhPlus: plus, desc: tplDesc(tplId, tpl),
        price: 0, seller: 'player', sellerName: G.heroName || G.username,
      };
      var g = getRollGrade(armor);
      if (g && ROLL_GRADES[g]) armor.grade = ROLL_GRADES[g].gradeId;
      G.inventory.push(armor);
      setTimeout(function () { toast('🛡 ' + (note || 'Zırh') + ': ' + armor.name + (armor.enhPlus > 0 ? ' +' + armor.enhPlus : '') + ' (' + rollGradeLabel(armor) + ') düştü!'); }, 800);
      renderKarakter();
      if (currentUser) sbSave();
      return armor;
    };
  }

  // 5. katmanın son bossu eskiden garanti Nekro düşürürdü; Nekro artık 6–7. bantta.
  // Yerine garanti olarak kendi bandından (Efsanevi) bir silah ya da zırh.
  if (typeof window.zdNecroItemDrop === 'function') {
    window.zdNecroItemDrop = function () {
      var plus = typeof zdDropPlusFor === 'function' ? zdDropPlusFor(5, true) : 4;
      if (Math.random() < 0.5) zdBossWeaponDrop({}, 1, { plus: plus }); // kat=1 → "son kat" sayılmaz, tekrar buraya düşmez
      else window.dropRandomArmor(5, 'Boss ganimeti', { plus: plus });
    };
  }

  window.EKIPMAN_BANT = { BANT_ANAHTAR: BANT_ANAHTAR, BANT_GRADE: BANT_GRADE, bantSec: bantSec, UST_SANS: UST_SANS };
})();
