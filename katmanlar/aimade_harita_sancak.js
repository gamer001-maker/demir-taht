/* ── BÖLGE SANCAKLARI (Osman, 23 Kas) ──
   Dünya haritasında bölge adlarının başındaki seçilebilir yuvarlak işaretler kaldırıldı;
   yerlerine her bölgeye özel, PASİF (tıklanmayan) bir sancak konur. Bölge seçimi haritanın altındaki listeden yapılır.
   Sancaklar SVG çizimi (görsel dosyası gerekmez), rüzgârda hafifçe dalgalanır. index.html'e dokunmaz. */
(function () {
  if (typeof window.renderWorldMap !== 'function') return;

  // Her bölge: bayrak rengi, kenar rengi, simge rengi, simge çizimi (bayrak alanı ~ x 8–56, y 12–48; merkez 28,30)
  var SANCAK = {
    vaelys: { r: '#3f7d3a', k: '#24491f', s: '#e9e3b4',   // Yeşil tepeler, meşe ormanı → ağaç
      c: '<path d="M28 17 L37 31 H32 L39 41 H17 L24 31 H19 Z"/><rect x="26.5" y="41" width="3" height="5"/>' },
    blacktide: { r: '#1c1c22', k: '#000', s: '#e8e2d0',  // Korsan koyu → kafatası
      c: '<circle cx="28" cy="27" r="8"/><rect x="23" y="33" width="10" height="5" rx="1"/>'
        + '<circle cx="25" cy="27" r="2.2" fill="#1c1c22"/><circle cx="31" cy="27" r="2.2" fill="#1c1c22"/>'
        + '<path d="M17 41 L39 45 M39 41 L17 45" stroke="#e8e2d0" stroke-width="2.4" stroke-linecap="round"/>' },
    stormreach: { r: '#22476e', k: '#122a44', s: '#dfeaf2', // Fırtınalı adalar → yelkenli + dalga
      c: '<path d="M29 15 V36 H40 Z"/><path d="M27 20 V36 H18 Z"/><path d="M15 37 H42 L38 42 H19 Z"/>'
        + '<path d="M13 46 q4 -3 8 0 t8 0 t8 0 t8 0" fill="none" stroke="#dfeaf2" stroke-width="1.8"/>' },
    aethelgard: { r: '#4a3a5f', k: '#2a2038', s: '#c9b7e6', // Kadim mağara → mağara ağzı ve göz
      c: '<path d="M14 45 V32 Q28 12 42 32 V45 Z"/><path d="M19 45 V34 Q28 21 37 34 V45 Z" fill="#2a2038"/>'
        + '<ellipse cx="28" cy="37" rx="4" ry="2.2" fill="#e8c56a"/><circle cx="28" cy="37" r="1" fill="#2a2038"/>' },
    frosthill: { r: '#d6e8f2', k: '#7fa6c0', s: '#2f6187', // Buzul dağları → kar tanesi
      c: '<g stroke="#2f6187" stroke-width="2.4" stroke-linecap="round" fill="none">'
        + '<path d="M28 16 V44 M16 23 L40 37 M40 23 L16 37"/>'
        + '<path d="M24 18 L28 21 L32 18 M24 42 L28 39 L32 42 M15 27 L19 26 L18 22 M41 33 L37 34 L38 38 M41 27 L37 26 L38 22 M15 33 L19 34 L18 38"/></g>' },
    brimstone: { r: '#8e2416', k: '#4e130b', s: '#f5a524', // Lav dağları → yanardağ ve alev
      c: '<path d="M13 45 L23 27 H33 L43 45 Z"/><path d="M24 27 q-3 -6 2 -10 q0 4 3 5 q1 -5 5 -7 q-2 6 0 12 Z" fill="#ffd166"/>'
        + '<path d="M26 27 L24 36 L28 33 L30 40" fill="none" stroke="#4e130b" stroke-width="1.6"/>' },
    maelstrom: { r: '#1d6b70', k: '#0f3e41', s: '#bfece9', // Girdap boğazı → sarmal
      c: '<path d="M27 30 a1 1 0 0 1 2 0 a3 3 0 0 1 -6 0 a5 5 0 0 1 10 0 a7 7 0 0 1 -14 0 a9 9 0 0 1 18 0" fill="none" stroke="#bfece9" stroke-width="2.4" stroke-linecap="round"/>' },
    dustguard: { r: '#c79a52', k: '#7a5826', s: '#6b3f12', // Kum çölü → güneş
      c: '<circle cx="28" cy="30" r="6.5"/><g stroke="#6b3f12" stroke-width="2.2" stroke-linecap="round">'
        + '<path d="M28 17 V20 M28 40 V43 M15 30 H18 M38 30 H41 M19 21 L21 23 M35 37 L37 39 M37 21 L35 23 M21 37 L19 39"/></g>' },
  };
  var VARSAYILAN = { r: '#6b4b2a', k: '#3a2814', s: '#e8c56a', c: '<circle cx="28" cy="30" r="7"/>' };

  /* Asılı uzun sancak (Osman'ın örneği Masaüstü/sancak.jpeg tarzında — kendi armalarımızla):
     üstte çubuk, dikey kumaş, sivri alt uç, iki kenarda süslü bordür, üstte daire içinde arma, altta küçük süs. */
  function sancakSVG(key) {
    var d = SANCAK[key] || VARSAYILAN;
    var nokta = '';
    for (var y = 22; y <= 100; y += 6) {
      nokta += '<circle cx="12.5" cy="' + y + '" r="1.3"/><circle cx="47.5" cy="' + y + '" r="1.3"/>';
    }
    return '<svg viewBox="0 0 60 140" aria-hidden="true">'
      + '<g class="snc-bayrak">'
      + '<path d="M8 9 H52 V110 L30 134 L8 110 Z" fill="' + d.r + '" stroke="' + d.k + '" stroke-width="1.6" stroke-linejoin="round"/>'
      + '<path d="M11.5 13 H48.5 V108.5 L30 128 L11.5 108.5 Z" fill="none" stroke="' + d.s + '" stroke-width=".9" opacity=".8"/>'
      + '<path d="M15 16 H45 V106 L30 122 L15 106 Z" fill="none" stroke="' + d.s + '" stroke-width=".5" opacity=".55"/>'
      + '<g fill="' + d.s + '" opacity=".75">' + nokta + '</g>'
      + '<circle cx="30" cy="38" r="13.5" fill="none" stroke="' + d.s + '" stroke-width="1.2"/>'
      + '<circle cx="30" cy="38" r="11.5" fill="' + d.k + '" opacity=".35"/>'
      + '<g fill="' + d.s + '" transform="translate(30 38) scale(.72) translate(-28 -30)">' + d.c + '</g>'
      + '<path d="M19 64 H41 M22 68 H38" stroke="' + d.s + '" stroke-width="1" opacity=".7"/>'
      + '<g fill="' + d.s + '" opacity=".9" transform="translate(30 88) scale(.42) translate(-28 -30)">' + d.c + '</g>'
      + '</g>'
      + '<rect x="3" y="5" width="54" height="4" rx="2" fill="#5a3b1c" stroke="#2e1d0c" stroke-width=".6"/>'
      + '<circle cx="3" cy="7" r="2.8" fill="#e3bf6a" stroke="#7a5420" stroke-width=".6"/><circle cx="57" cy="7" r="2.8" fill="#e3bf6a" stroke="#7a5420" stroke-width=".6"/>'
      + '<path d="M18 5 L30 -2 L42 5" fill="none" stroke="#3a2814" stroke-width="1"/>'
      + '</svg>';
  }

  var css = document.createElement('style');
  css.textContent = [
    '#world-map-scene .wm-pin{display:none!important}',
    '.snc{position:absolute;z-index:2;pointer-events:none;width:clamp(18px,2.2vw,30px);transform:translate(-50%,-100%);filter:drop-shadow(1px 3px 2px #000b)}',
    '.snc svg{display:block;width:100%;height:auto;overflow:visible}',
    '.snc-bayrak{transform-origin:30px 7px;animation:sncDalga 4s ease-in-out infinite;animation-delay:var(--d,0s)}',
    '@keyframes sncDalga{0%,100%{transform:rotate(-1.6deg) skewX(0deg)}50%{transform:rotate(1.6deg) skewX(-2deg)}}',
    '@media (prefers-reduced-motion: reduce){.snc-bayrak{animation:none}}'
  ].join('');
  document.head.appendChild(css);

  var asil = window.renderWorldMap;
  window.renderWorldMap = function () {
    asil.apply(this, arguments);
    var sahne = document.getElementById('world-map-scene');
    if (!sahne || typeof REGIONS === 'undefined') return;
    var h = '', i = 0;
    Object.keys(REGIONS).forEach(function (k) {
      var R = REGIONS[k]; if (!R || R.x == null) return;
      h += '<div class="snc" style="left:' + R.x + '%;top:' + R.y + '%;--d:' + (i++ * -0.4) + 's" title="' + (R.name || '') + '">' + sancakSVG(k) + '</div>';
    });
    sahne.insertAdjacentHTML('afterbegin', h);
  };
})();
