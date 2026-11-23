/* ── KALE DÜZENİ (Osman, 23 Kas: "sahne öne, gerisi sade") ──
   - Başlık kartı (#castle-hdr-card) ve KALE İSTATİSTİKLERİ kartı gizlenir; kale adı, Sur Sv ve 4 değer
     (Kale Canı, Savunma, Saldırı, Moral) sahnenin üst kenarında sade yazı olur (oyunun ürettiği metinden okunur).
   - BİRLİKLERİN kartı sayfadan kalkar → kendi penceresine (#kd-birlik) TAŞINIR (kopya değil, Piyade İşe Al vb. aynen çalışır).
     Kışla'ya dokununca açılan pencerenin altına "⚔ Birliklerin (n/m)" düğmesi eklenir.
   - Alt çipler (Surlar, Kale Çiftliği, Tarla, Değirmen, Yerleşimi Düzenle) yerinde kalır.
   index.html'e dokunmaz. */
(function () {
  if (typeof window.renderKale !== 'function') return;

  var css = document.createElement('style');
  css.textContent = [
    '#castle-hdr-card,#castle-bars-wrap{display:none!important}',
    '#gs-kale .kd-gizli{display:none!important}',
    '#castle-map-view{position:relative}',
    '.kd-ust{position:absolute;left:0;right:0;top:0;z-index:5;pointer-events:none;padding:8px 12px 22px;',
    'background:linear-gradient(180deg,#000c 0%,#0009 55%,transparent 100%);border-radius:inherit;',
    'display:flex;flex-wrap:wrap;align-items:baseline;gap:4px 16px;text-shadow:0 1px 3px #000}',
    '.kd-ad{font:600 clamp(13px,1.6vw,18px) var(--font-head,serif);color:var(--gold2,#e8c56a);margin-right:auto}',
    '.kd-ad em{font-style:normal;font-size:.75em;color:var(--gold,#c9a24a);border:1px solid #6b4c2a;border-radius:6px;padding:0 6px;margin-left:8px}',
    '.kd-deg{display:flex;flex-wrap:wrap;gap:2px 14px;font-size:clamp(10px,1.2vw,13px);color:#d8c8a8}',
    '.kd-deg b{color:#fff;margin-left:4px;font-variant-numeric:tabular-nums}',
    // Birlikler penceresi
    '#kd-birlik{position:fixed;inset:0;z-index:9400;background:#000b;display:flex;align-items:center;justify-content:center;padding:16px}',
    '#kd-birlik[hidden]{display:none!important}',
    '.kd-kutu{position:relative;width:min(560px,100%);max-height:90vh;overflow:auto;border-radius:12px;box-shadow:0 10px 40px #000}',
    '.kd-kutu > .card{margin:0!important;display:block!important}',
    '.kd-kutu > .card > .row-between{padding-right:44px}',
    '.kd-x{position:absolute;top:8px;right:10px;z-index:2;background:#2a2016;border:1px solid #6a4a28;color:#e8dcc0;border-radius:8px;width:30px;height:30px;cursor:pointer;font-size:15px}',
    '.kd-birlik-ac{display:block;width:100%;margin:0 0 8px}'
  ].join('');
  document.head.appendChild(css);

  function kac(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function yazi(e) { return e ? e.textContent.trim() : ''; }

  /* İstatistik kartı: #castle-bars-wrap'ın kapsayıcısı (başlıklı .card) */
  function statKart() { var w = document.getElementById('castle-bars-wrap'); return w ? w.closest('.card') : null; }

  /* Birlikler penceresi */
  var bp = document.createElement('div');
  bp.id = 'kd-birlik'; bp.hidden = true;
  bp.innerHTML = '<div class="kd-kutu" id="kd-kutu"><button class="kd-x" id="kd-x" aria-label="Kapat">✕</button></div>';
  document.body.appendChild(bp);
  bp.addEventListener('click', function (e) { if (e.target === bp) bp.hidden = true; });
  document.getElementById('kd-x').onclick = function () { bp.hidden = true; };
  window.kdBirlikAc = function () {
    try { if (typeof window.closeGModal === 'function') document.getElementById('g-modal').style.display = 'none'; } catch (e) { }
    tasi(); bp.hidden = false;
  };

  function tasi() {
    var tw = document.getElementById('troops-wrap'), kart = tw ? tw.closest('.card') : null, kutu = document.getElementById('kd-kutu');
    if (kart && kutu && kart.parentNode !== kutu) kutu.appendChild(kart);
    var sk = statKart(); if (sk) sk.classList.add('kd-gizli');
  }

  function ustYaz() {
    var mv = document.getElementById('castle-map-view'); if (!mv) return;
    var hdr = document.getElementById('castle-hdr-card');
    var ad = hdr ? yazi(hdr.querySelector('span')) : '';
    var sur = hdr ? yazi(hdr.querySelector('.tag')) : '';
    var deg = '';
    Array.prototype.forEach.call(document.querySelectorAll('#castle-bars-wrap .castle-stat'), function (s) {
      deg += '<span>' + kac(yazi(s.querySelector('.cs-icon'))) + ' ' + kac(yazi(s.querySelector('.cs-lbl'))) + '<b>' + kac(yazi(s.querySelector('.cs-val'))) + '</b></span>';
    });
    var u = mv.querySelector('.kd-ust');
    if (!u) { u = document.createElement('div'); u.className = 'kd-ust'; mv.insertBefore(u, mv.firstChild); }
    u.innerHTML = '<span class="kd-ad">' + kac(ad) + (sur ? '<em>' + kac(sur) + '</em>' : '') + '</span><span class="kd-deg">' + deg + '</span>';
  }

  /* Osman 23 Kas: Aşevi, İnşaa Yeri, Pazar ve Kışla kalede gösterilmez (Pazar dünya haritasında var). Bina verisi/seviyesi silinmez.
     Boşalan yerlere Madenci (üst orta) ve Kervan (sol) taşındı — konumları kendi dosyalarında. */
  var KALDIR = { asevi: 1, insaa: 1, pazar: 1, kisla: 1 };
  try {
    if (typeof CASTLE_MAP_SPOTS !== 'undefined' && CASTLE_MAP_SPOTS.splice) {
      for (var i = CASTLE_MAP_SPOTS.length - 1; i >= 0; i--) if (KALDIR[CASTLE_MAP_SPOTS[i].key]) CASTLE_MAP_SPOTS.splice(i, 1);
    }
  } catch (e) { }

  var asil = window.renderKale;
  window.renderKale = function () {
    var r = asil.apply(this, arguments);
    try { tasi(); ustYaz(); } catch (e) { console.warn('[kale-duzen]', e); }
    return r;
  };

  /* Kışla penceresine "Birliklerin" düğmesi */
  if (typeof window.openCastleSpotModal === 'function') {
    var asilSpot = window.openCastleSpotModal;
    window.openCastleSpotModal = function (key) {
      var r = asilSpot.apply(this, arguments);
      try {
        if (key === 'kisla') {
          var k = document.getElementById('g-modal-content');
          if (k && !k.querySelector('.kd-birlik-ac')) {
            var adet = yazi(document.getElementById('troop-cap-lbl'));
            var b = document.createElement('button');
            b.type = 'button'; b.className = 'btn kd-birlik-ac';
            b.textContent = '⚔ Birliklerin' + (adet ? ' (' + adet + ')' : '');
            b.onclick = window.kdBirlikAc;
            var kapat = Array.prototype.filter.call(k.querySelectorAll('button'), function (x) { return x.textContent.trim() === 'Kapat'; })[0];
            if (kapat) kapat.parentNode.insertBefore(b, kapat); else k.appendChild(b);
          }
        }
      } catch (e) { }
      return r;
    };
  }

  window.kdBirlikAcikMi = function () { return !bp.hidden; };
  tasi();
})();
