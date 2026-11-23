/* ── KALE KERVANI (Osman, 23 Kas) ──
   Kale haritasında Kervan NPC'si → 1/2/4/8/12/24 saatlik kervan seç → "Yola çık".
   Yoldayken dünya haritasında: kaleden çıkan kervan figürü, isimli bölgelerden geçen kesik çizgili rota,
   haritanın solunda geri sayan saat çubuğu. Dönünce kalede "Teslim al": XP + altın + malzeme + şansa bağlı zırh.
   Kurallar (Osman onaylı): rota süreyle uzar, aynı anda tek kervan, uzun kervan saat başına daha verimli,
   ödül elle teslim alınır, süre sunucu saatiyle (_now) işler.
   Kayıt: G.ach._kervan = { h, bas, bit, rota:[bölge], sv }  (profiles.ach_counters jsonb).
   index.html'e dokunmaz; renderCastleMap ve renderWorldMap sarılır. Değerler AYAR tablosunda. */
(function () {
  if (typeof window.renderCastleMap !== 'function' || typeof window.renderWorldMap !== 'function') return;

  var AYAR = {
    secenekler: [
      { h: 1, durak: 1, verim: 1.00 },
      { h: 2, durak: 2, verim: 1.05 },
      { h: 4, durak: 3, verim: 1.10 },
      { h: 8, durak: 4, verim: 1.20 },
      { h: 12, durak: 5, verim: 1.25 },
      { h: 24, durak: 7, verim: 1.35 },
    ],
    xpSaatOran: 0.015,                                   // saat başına mevcut seviye ihtiyacının %1,5'i
    altinSaat: function (lv) { return 5 + lv * 0.5; },
    malzemeSaat: { kereste: 2, civi: 1, tugla: 1 },
    zirhSansSaat: 0.04,                                  // saat başına zırh şansı (× verim); 24 saatte ≥1 garanti
    konum: { x: 13, y: 76, w: 14 },                      // kale haritasında yer
    img: 'aimade_kale_kervan.webp',
    kaleKayma: { x: 5, y: -7 },                          // harita katmanındaki "Kalem" işaretiyle aynı
  };
  var SAAT = 3600 * 1000;

  function simdi() { return (typeof _now === 'function') ? _now() : Date.now(); }
  function aktif() { var k = G.ach && G.ach._kervan; return (k && k.bit > 0) ? k : null; }
  function kaydetHemen() {
    try { if (typeof currentUser !== 'undefined' && currentUser) (typeof sbSaveNow === 'function' ? sbSaveNow : sbSave)(); } catch (e) { }
  }
  function sureYaz(ms) {
    var s = Math.max(0, Math.ceil(ms / 1000)), sa = Math.floor(s / 3600), dk = Math.floor(s % 3600 / 60), sn = s % 60;
    var p = function (n) { return (n < 10 ? '0' : '') + n; };
    return sa + ':' + p(dk) + ':' + p(sn);
  }

  /* ── Rota: kaleden en yakın bölgeye, oradan bir sonrakine (açgözlü), sonra kaleye dönüş ── */
  function kaleNoktasi() {
    var ev = REGIONS[G.homeRegion] || REGIONS[G.region];
    if (!ev) return { x: 50, y: 50 };
    return { x: Math.min(95, ev.x + AYAR.kaleKayma.x), y: Math.max(8, ev.y + AYAR.kaleKayma.y) };
  }
  function rotaKur(durak) {
    var kalan = Object.keys(REGIONS).filter(function (k) { return k !== G.homeRegion; });
    var rota = [], p = kaleNoktasi();
    while (rota.length < durak && kalan.length) {
      kalan.sort(function (a, b) {
        return Math.hypot(REGIONS[a].x - p.x, REGIONS[a].y - p.y) - Math.hypot(REGIONS[b].x - p.x, REGIONS[b].y - p.y);
      });
      var k = kalan.shift(); rota.push(k); p = REGIONS[k];
    }
    return rota;
  }
  function rotaNoktalari(rota) {
    var kale = kaleNoktasi(), n = [kale];
    rota.forEach(function (k) { if (REGIONS[k]) n.push({ x: REGIONS[k].x, y: REGIONS[k].y }); });
    n.push(kale);
    return n;
  }
  function yoldaKonum(noktalar, oran) {                  // rota boyunca orana göre nokta + yön
    var uz = [], top = 0;
    for (var i = 1; i < noktalar.length; i++) { var d = Math.hypot(noktalar[i].x - noktalar[i - 1].x, noktalar[i].y - noktalar[i - 1].y); uz.push(d); top += d; }
    var hedef = Math.max(0, Math.min(1, oran)) * top;
    for (var j = 0; j < uz.length; j++) {
      if (hedef <= uz[j] || j === uz.length - 1) {
        var a = noktalar[j], b = noktalar[j + 1], t = uz[j] ? Math.min(1, hedef / uz[j]) : 1;
        return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t, sola: b.x < a.x };
      }
      hedef -= uz[j];
    }
    return { x: noktalar[0].x, y: noktalar[0].y, sola: false };
  }

  /* ── Ödül ── */
  function odulHesap(sec, lv) {
    var saatV = sec.h * sec.verim;
    var ihtiyac = (typeof xpForLevel === 'function') ? xpForLevel(lv) : 100;
    var m = {};
    Object.keys(AYAR.malzemeSaat).forEach(function (k) { m[k] = Math.round(AYAR.malzemeSaat[k] * saatV); });
    return {
      xp: Math.max(1, Math.round(ihtiyac * AYAR.xpSaatOran * saatV)),
      altin: Math.round(AYAR.altinSaat(lv) * saatV),
      malzeme: m,
      zirh: AYAR.zirhSansSaat * saatV,                 // beklenen adet (tam kısmı garanti, kesir şans)
    };
  }
  function secenek(h) { return AYAR.secenekler.filter(function (s) { return s.h === h; })[0]; }

  /* ── Eylemler ── */
  var seciliH = 1;
  window.kervanSec = function (h) { seciliH = h; window.kervanAc(); };

  window.kervanYolaCik = function () {
    if (aktif()) { toast('🐫 Kervan zaten yolda.'); return; }
    var sec = secenek(seciliH); if (!sec) return;
    if (!G.ach) G.ach = {};
    var bas = simdi();
    G.ach._kervan = { h: sec.h, bas: bas, bit: bas + sec.h * SAAT, rota: rotaKur(sec.durak), sv: G.level || 1 };
    kaydetHemen();
    if (typeof closeGModal === 'function') closeGModal();
    toast('🐫 Kervan yola çıktı! ' + sec.h + ' saat sonra dönecek.');
    // Kervanın kaleden çıkışını göster: dünya haritasına geç
    try { window.ggo('harita'); if (typeof openWorldMap === 'function') openWorldMap(); } catch (e) { }
  };

  window.kervanTeslim = function () {
    var k = aktif();
    if (!k) return;
    if (simdi() < k.bit) { toast('🐫 Kervan henüz dönmedi.'); return; }
    var sec = secenek(k.h) || { h: k.h, verim: 1 };
    var o = odulHesap(sec, k.sv || G.level || 1);
    // Önce kervanı kapat ve HEMEN kaydet (yenileyip tekrar teslim almak olmasın)
    G.ach._kervan = null;
    G.gold += o.altin;
    if (!G.prodInv) G.prodInv = {};
    Object.keys(o.malzeme).forEach(function (m) { G.prodInv[m] = (G.prodInv[m] || 0) + o.malzeme[m]; });
    var zirhAdet = Math.floor(o.zirh) + (Math.random() < (o.zirh % 1) ? 1 : 0), dusen = 0;
    var katman = (typeof zdPlayerTier === 'function') ? zdPlayerTier() : 1;
    for (var i = 0; i < zirhAdet; i++) {
      try { if (typeof dropRandomArmor === 'function' && dropRandomArmor(katman, 'Kervan ganimeti', { plus: 0 })) dusen++; } catch (e) { }
    }
    if (typeof qAddSkill === 'function') qAddSkill('izcilik', 0.05 * k.h);
    gainXP(o.xp);
    var lbl = (typeof ITEM_LABELS !== 'undefined') ? ITEM_LABELS : {};
    var mYazi = Object.keys(o.malzeme).filter(function (m) { return o.malzeme[m] > 0; })
      .map(function (m) { return '+' + o.malzeme[m] + ' ' + (lbl[m] || m); }).join(', ');
    if (typeof updateHUD === 'function') updateHUD();
    kaydetHemen();
    showGModal('<div style="text-align:center">'
      + '<div style="font-size:46px;line-height:1">🐫</div>'
      + '<div style="font-family:var(--font-head);font-size:19px;color:var(--gold2);margin:6px 0 4px">Kervan döndü!</div>'
      + '<div style="font-size:12px;color:var(--ink3,#a89070);margin-bottom:12px">' + k.h + ' saatlik yolculuk: ' + (k.rota || []).map(function (r) { return REGIONS[r] ? REGIONS[r].name : r; }).join(' → ') + '</div>'
      + '<div style="font-size:15px;color:var(--gold);line-height:1.8">+' + o.xp.toLocaleString('tr-TR') + ' XP<br>+' + o.altin.toLocaleString('tr-TR') + '🪙<br>' + mYazi
      + (dusen ? '<br>🛡 ' + dusen + ' zırh (envanterde)' : '') + '</div>'
      + '<button class="btn" style="width:100%;margin-top:14px" onclick="closeGModal();renderCastleMap&&renderCastleMap()">Tamam</button></div>');
  };

  /* ── Kervan penceresi ── */
  function satir(sol, sag) {
    return '<div style="display:flex;justify-content:space-between;gap:8px;padding:5px 10px;font-size:12px"><span>' + sol + '</span><b style="color:var(--gold2);text-align:right">' + sag + '</b></div>';
  }
  window.kervanAc = function () {
    var k = aktif(), h = '';
    h += '<div style="text-align:center;margin-bottom:10px"><div style="font-size:40px;line-height:1">🐫</div>'
      + '<div style="font-family:var(--font-head);font-size:18px;color:var(--gold2);margin-top:4px">Kervan</div>'
      + '<div style="font-size:11px;color:var(--ink3,#a89070)">Kervanı diyar diyar gönder; dönüşte tecrübe, altın ve ganimet getirir.</div></div>';
    if (k) {
      var kalan = k.bit - simdi(), rotaAd = (k.rota || []).map(function (r) { return REGIONS[r] ? REGIONS[r].icon + ' ' + REGIONS[r].name : r; }).join(' → ');
      h += '<div style="border:1px solid var(--border,#3a2a18);border-radius:8px;padding:8px 0;margin-bottom:10px">'
        + satir('Süre', k.h + ' saat') + satir('Rota', '🏰 → ' + rotaAd + ' → 🏰')
        + satir(kalan > 0 ? 'Dönüşe kalan' : 'Durum', kalan > 0 ? '<span class="kv-kalan">' + sureYaz(kalan) + '</span>' : 'Kaleye döndü!') + '</div>';
      h += kalan > 0
        ? '<button class="btn" style="width:100%" onclick="closeGModal();ggo(\'harita\');openWorldMap&&openWorldMap()">🗺 Haritada izle</button>'
        : '<button class="btn" style="width:100%" onclick="kervanTeslim()">📦 Teslim al</button>';
      showGModal(h);
      return;
    }
    var lv = G.level || 1;
    h += '<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:6px;margin-bottom:10px">';
    AYAR.secenekler.forEach(function (s) {
      var sec = s.h === seciliH;
      h += '<div onclick="kervanSec(' + s.h + ')" style="cursor:pointer;text-align:center;padding:10px 4px;border-radius:8px;border:2px solid ' + (sec ? 'var(--gold2)' : 'var(--border,#3a2a18)') + ';background:' + (sec ? '#d4a84722' : 'var(--panel2)') + '">'
        + '<div style="font-family:var(--font-head);font-size:17px;color:' + (sec ? 'var(--gold2)' : 'var(--perg2,#e8d8b8)') + '">' + s.h + ' sa</div>'
        + '<div style="font-size:10px;color:var(--ink3,#a89070)">' + s.durak + ' durak</div></div>';
    });
    h += '</div>';
    var sec = secenek(seciliH), o = odulHesap(sec, lv), rota = rotaKur(sec.durak);
    var lbl = (typeof ITEM_LABELS !== 'undefined') ? ITEM_LABELS : {};
    h += '<div style="border:1px solid var(--border,#3a2a18);border-radius:8px;padding:8px 0;margin-bottom:10px">'
      + satir('Rota', '🏰 → ' + rota.map(function (r) { return REGIONS[r].icon + ' ' + REGIONS[r].name; }).join(' → ') + ' → 🏰')
      + satir('Tecrübe', '~' + o.xp.toLocaleString('tr-TR') + ' XP')
      + satir('Altın', '~' + o.altin.toLocaleString('tr-TR') + '🪙')
      + satir('Malzeme', Object.keys(o.malzeme).map(function (m) { return o.malzeme[m] + ' ' + (lbl[m] || m); }).join(', '))
      + satir('Zırh', o.zirh >= 1 ? Math.floor(o.zirh) + ' garanti' + (o.zirh % 1 > 0.01 ? ' + %' + Math.round(o.zirh % 1 * 100) + ' şans' : '') : '%' + Math.round(o.zirh * 100) + ' şans')
      + '</div>';
    h += '<button class="btn" style="width:100%" onclick="kervanYolaCik()">🐫 Yola çık</button>';
    showGModal(h);
  };

  /* ── Kale haritasına Kervan NPC'si ── */
  var asilKale = window.renderCastleMap;
  window.renderCastleMap = function () {
    asilKale.apply(this, arguments);
    var sahne = document.getElementById('castle-map-scene');
    if (!sahne) return;
    var k = aktif(), c = AYAR.konum;
    var etiket = !k ? 'Kervan' : (simdi() >= k.bit ? 'Kervan ❗' : 'Kervan (yolda)');
    sahne.insertAdjacentHTML('beforeend',
      '<div class="cmap-spot" style="left:' + c.x + '%;top:' + c.y + '%;width:' + c.w + '%;"'
      + ' onclick="event.stopPropagation();if(typeof _cmapEditMode!==\'undefined\'&&_cmapEditMode)return;kervanAc()" title="Kervan — sefere gönder">'
      + '<img src="images/' + AYAR.img + '" onerror="this.style.display=\'none\';this.nextElementSibling.style.display=\'block\'">'
      + '<div style="display:none;font-size:34px;line-height:1;text-align:center">🐫</div>'
      + '<div class="cmap-lbl">' + etiket + '</div></div>');
  };

  /* ── Dünya haritasında rota, kervan figürü ve soldaki saat çubuğu ── */
  var css = document.createElement('style');
  css.textContent = [
    '#world-map-view{position:relative}',
    '.kv-svg{position:absolute;inset:0;width:100%;height:100%;pointer-events:none;z-index:3}',
    '.kv-yol{fill:none;stroke:#f3d48a;stroke-width:2.5;stroke-dasharray:7 6;stroke-linecap:round;filter:drop-shadow(0 0 2px #000);animation:kvYuru 1.2s linear infinite}',
    '@keyframes kvYuru{to{stroke-dashoffset:-13}}',
    '.kv-durak{fill:#f3d48a;stroke:#3a2410;stroke-width:1.5}',
    '.kv-fig{position:absolute;z-index:6;transform:translate(-50%,-80%);font-size:clamp(26px,3.2vw,40px);line-height:1;pointer-events:none;filter:drop-shadow(0 3px 3px #000c);transition:left 1s linear,top 1s linear}',
    '.kv-fig span{display:inline-block;animation:kvSalla .9s ease-in-out infinite}',
    '.kv-fig.sag span{transform:scaleX(-1)}',
    '@keyframes kvSalla{50%{translate:0 -3px}}',
    '.kv-cubuk{position:absolute;left:8px;top:8px;z-index:8;width:58px;padding:8px 4px;border-radius:10px;background:#000b;border:1px solid var(--gold2);display:flex;flex-direction:column;align-items:center;gap:6px;cursor:pointer;font-family:var(--font-head,serif)}',
    '.kv-cubuk .ik{font-size:22px;line-height:1}',
    '.kv-cubuk .bar{position:relative;width:12px;height:110px;border-radius:6px;background:#ffffff1a;overflow:hidden}',
    '.kv-cubuk .dol{position:absolute;left:0;right:0;bottom:0;background:linear-gradient(0deg,#8a6a2a,var(--gold2));transition:height 1s linear}',
    '.kv-cubuk .zm{font-size:10px;color:var(--gold2);text-align:center;line-height:1.2;font-variant-numeric:tabular-nums}',
    '.kv-cubuk.geldi{animation:kvParla 1s ease-in-out infinite}',
    '@keyframes kvParla{50%{box-shadow:0 0 12px var(--gold2)}}'
  ].join('');
  document.head.appendChild(css);

  function haritaCiz() {
    var sahne = document.getElementById('world-map-scene'), gorunum = document.getElementById('world-map-view');
    if (!sahne || !gorunum) return;
    var eski = sahne.querySelectorAll('.kv-svg,.kv-fig'); for (var i = 0; i < eski.length; i++) eski[i].remove();
    var eskiC = gorunum.querySelector('.kv-cubuk'); if (eskiC) eskiC.remove();
    var k = aktif();
    if (!k) return;
    var n = rotaNoktalari(k.rota || []);
    var pts = n.map(function (p) { return p.x + ',' + p.y; }).join(' ');
    var duraklar = n.slice(1, -1).map(function (p) { return '<circle class="kv-durak" cx="' + p.x + '" cy="' + p.y + '" r="0.7" vector-effect="non-scaling-stroke"/>'; }).join('');
    sahne.insertAdjacentHTML('beforeend',
      '<svg class="kv-svg" viewBox="0 0 100 100" preserveAspectRatio="none"><polyline class="kv-yol" points="' + pts + '" vector-effect="non-scaling-stroke"/>' + duraklar + '</svg>'
      + '<div class="kv-fig"><span>🐫</span></div>');
    gorunum.insertAdjacentHTML('beforeend',
      '<div class="kv-cubuk" onclick="ggo(\'kale\');setTimeout(function(){kervanAc()},50)" title="Kervan"><div class="ik">🐫</div><div class="bar"><div class="dol"></div></div><div class="zm"></div></div>');
    guncelle();
  }

  function guncelle() {
    var k = aktif();
    var fig = document.querySelector('#world-map-scene .kv-fig'), cub = document.querySelector('#world-map-view .kv-cubuk');
    if (!k || !fig || !cub) return;
    var t = simdi(), oran = Math.max(0, Math.min(1, (t - k.bas) / (k.bit - k.bas)));
    var p = yoldaKonum(rotaNoktalari(k.rota || []), oran);
    fig.style.left = p.x + '%'; fig.style.top = p.y + '%';
    fig.classList.toggle('sag', !p.sola);                   // 🐫 emojisi sola bakar; sağa giderken aynala
    var kalan = k.bit - t;
    cub.querySelector('.dol').style.height = Math.round((1 - oran) * 100) + '%';   // seçilen saatten geriye doğru azalır
    cub.querySelector('.zm').innerHTML = kalan > 0 ? sureYaz(kalan) : 'Döndü!<br>Teslim al';
    cub.classList.toggle('geldi', kalan <= 0);
    if (kalan <= 0) fig.style.display = 'none';
  }

  var asilDunya = window.renderWorldMap;
  window.renderWorldMap = function () { asilDunya.apply(this, arguments); haritaCiz(); };

  setInterval(function () {
    guncelle();
    var kl = document.querySelector('#g-modal .kv-kalan'), k = aktif();
    if (kl && k) { var r = k.bit - simdi(); if (r > 0) kl.textContent = sureYaz(r); else window.kervanAc(); }
  }, 1000);
})();
