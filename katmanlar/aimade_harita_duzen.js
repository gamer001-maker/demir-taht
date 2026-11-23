// HARİTA DÜZENİ (Osman, 21 Kas 2026) — yalnız mobil kopyada (www/) eklenir; index.html'e DOKUNMAZ.
// - Üst menüde yalnız Karakter, Harita, Arena kalır (Kale, Geliştir, Zindan gizlenir)
// - Dünya haritasında: oyuncunun memleketinin yanında KALE, haritanın ortasında ZİNDAN girişi
// - Kale haritasında, kışlanın yanında DEMİRCİ (NPC) → Geliştir ekranı
// - Kale / Zindan / Geliştir ekranlarının üstünde geri dönüş düğmesi
// Kaldırmak için katman-harita/ klasörünü silmek yeter. Görseller "aimade" önekli (arkadaşın kuralı).
(function () {
  if (typeof window.ggo !== 'function') return;
  var IMG = 'images/';
  var ZINDAN_XY = { x: 57, y: 47 };            // haritanın ortası, bölge işaretlerinden uzak
  var PAZAR_XY = { x: 56, y: 66 };             // güneyde, Dustguard ile Blacktide arası
  var KALE_KAYMA = { x: 5, y: -7 };            // memleket işaretine göre
  var DEMIRCI = { x: 70, y: 18, w: 15 };       // kale haritasında, kışlanın sağı

  var css = document.createElement('style');
  css.textContent = [
    '#gt-kale,#gt-gelistirme,#gt-zindan,#bn-market,#bn-prod{display:none!important}',
    '.hd-pin{position:absolute;transform:translate(-50%,-100%);cursor:pointer;z-index:5;display:flex;flex-direction:column;align-items:center;filter:drop-shadow(0 4px 6px #000c);transition:transform .15s}',
    '.hd-pin:hover{transform:translate(-50%,-100%) scale(1.06)}',
    '.hd-pin img{display:block;width:clamp(54px,9vw,96px);height:auto}',
    '.hd-pin .hd-yedek{display:none;font-size:clamp(28px,5vw,44px);line-height:1}',
    '.hd-pin .hd-ad{margin-top:2px;padding:2px 8px;border-radius:10px;background:#000c;border:1px solid var(--gold2);color:var(--gold2);font:600 clamp(10px,1.2vw,12px) var(--font-head,serif);white-space:nowrap}',
    '.hd-pin.zindan img{width:clamp(64px,11vw,118px)}',
    '.hd-geri{display:flex;align-items:center;gap:8px;margin:0 0 10px;padding:8px 14px;border-radius:8px;background:var(--panel2);border:1px solid var(--border2,#4a3220);color:var(--gold2);font:600 13px var(--font-head,serif);cursor:pointer;width:max-content}',
    '.hd-geri:active{transform:scale(.97)}'
  ].join('');
  document.head.appendChild(css);

  function pinHTML(cls, img, yedek, ad, tik) {
    return '<div class="hd-pin ' + cls + '" style="left:{X}%;top:{Y}%;" onclick="event.stopPropagation();' + tik + '">'
      + '<img src="' + IMG + img + '" alt="' + ad + '" onerror="this.style.display=\'none\';this.nextElementSibling.style.display=\'block\'">'
      + '<span class="hd-yedek">' + yedek + '</span><span class="hd-ad">' + ad + '</span></div>';
  }

  // 1) Dünya haritasına kale ve zindan
  var asilDunya = window.renderWorldMap;
  if (typeof asilDunya === 'function') {
    window.renderWorldMap = function () {
      asilDunya.apply(this, arguments);
      var sahne = document.getElementById('world-map-scene');
      if (!sahne || typeof REGIONS === 'undefined') return;
      var ev = REGIONS[G.homeRegion] || REGIONS[G.region];
      var h = '';
      if (ev) h += pinHTML('kale', 'aimade_harita_kale.webp', '🏰', 'Kalem', "ggo('kale')")
        .replace('{X}', Math.min(95, ev.x + KALE_KAYMA.x)).replace('{Y}', Math.max(8, ev.y + KALE_KAYMA.y));
      h += pinHTML('zindan', 'aimade_harita_zindan.webp', '🕳', 'Zindan', "ggo('zindan')")
        .replace('{X}', ZINDAN_XY.x).replace('{Y}', ZINDAN_XY.y);
      h += pinHTML('pazar', 'aimade_harita_pazar.webp', '🏪', 'Pazar', "showPage('market')")
        .replace('{X}', PAZAR_XY.x).replace('{Y}', PAZAR_XY.y);
      sahne.insertAdjacentHTML('beforeend', h);
    };
  }

  // 2) Kale haritasına demirci
  var asilKale = window.renderCastleMap;
  if (typeof asilKale === 'function') {
    window.renderCastleMap = function () {
      asilKale.apply(this, arguments);
      var sahne = document.getElementById('castle-map-scene');
      if (!sahne) return;
      sahne.insertAdjacentHTML('beforeend',
        '<div class="cmap-spot" style="left:' + DEMIRCI.x + '%;top:' + DEMIRCI.y + '%;width:' + DEMIRCI.w + '%;"'
        + ' onclick="event.stopPropagation();if(typeof _cmapEditMode!==\'undefined\'&&_cmapEditMode)return;ggo(\'gelistirme\')" title="Demirci — eşya geliştir">'
        + '<img src="' + IMG + 'aimade_kale_demirci.webp" onerror="this.style.display=\'none\';this.nextElementSibling.style.display=\'block\'">'
        + '<div style="display:none;font-size:34px;line-height:1">⚒</div>'
        + '<div class="cmap-lbl">Demirci</div></div>');
    };
  }

  // 3) Gizlenen ekranlara geri düğmesi; üst menüde Harita seçili görünsün
  var GERI = { kale: ['harita', '← Haritaya dön'], zindan: ['harita', '← Haritaya dön'], gelistirme: ['kale', '← Kaleye dön'] };
  var asilGgo = window.ggo;
  window.ggo = function (s) {
    asilGgo.apply(this, arguments);
    var g = GERI[s];
    if (!g) return;
    var sekme = document.getElementById('gt-harita');
    if (sekme) sekme.classList.add('active');
    var ekran = document.getElementById('gs-' + s);
    if (!ekran) return;
    var btn = ekran.querySelector(':scope > .hd-geri');
    if (!btn) {
      btn = document.createElement('div');
      btn.className = 'hd-geri';
      ekran.insertBefore(btn, ekran.firstChild);
    }
    btn.textContent = g[1];
    btn.onclick = function () { window.ggo(g[0]); };
  };

  // 4) Alt menüden kaldırılan Pazar ve Üretim: sayfaya geri düğmesi, alt menüde Oyun seçili görünsün
  var SAYFA_GERI = {
    market: ['← Haritaya dön', function () { window.showPage('game'); window.ggo('harita'); }],
    prod: ['← Kaleye dön', function () { window.showPage('game'); window.ggo('kale'); }],
  };
  var asilSayfa = window.showPage;
  if (typeof asilSayfa === 'function') {
    window.showPage = function (p) {
      asilSayfa.apply(this, arguments);
      var g = SAYFA_GERI[p];
      if (!g) return;
      var oyun = document.getElementById('bn-game');
      if (oyun) oyun.classList.add('active');
      var sayfa = document.getElementById('p-' + p);
      if (!sayfa) return;
      var btn = sayfa.querySelector(':scope > .hd-geri');
      if (!btn) {
        btn = document.createElement('div');
        btn.className = 'hd-geri';
        btn.style.margin = '10px 12px';
        sayfa.insertBefore(btn, sayfa.firstChild);
      }
      btn.textContent = g[0];
      btn.onclick = g[1];
    };
  }
})();
