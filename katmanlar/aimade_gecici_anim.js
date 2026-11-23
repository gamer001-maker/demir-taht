// GEÇİCİ TEST (20 Kas 2026): Alp Survivors'ın hazır canavar animasyonları, Demir Taht zindanındaki
// benzer düşmanlara eşlenir. Yalnız mobil kopyada (www/) eklenir; index.html'e DOKUNMAZ.
// Kaldırmak için gecici-anim/ klasörünü silmek yeter. Görseller arkadaşın kuralı gereği "aimade" önekli.
(function () {
  var ESLES = {"bozkurt": {"img": "aimade_gecici_kurt.png", "kare": 11, "sutun": 4, "sure": 1.333, "ayna": true}, "goblinsefi": {"img": "aimade_gecici_cor.png", "kare": 7, "sutun": 4, "sure": 0.875, "ayna": false}, "orksavasci": {"img": "aimade_gecici_yek.png", "kare": 10, "sutun": 4, "sure": 1.208, "ayna": false}, "orkkomutani": {"img": "aimade_gecici_yek.png", "kare": 10, "sutun": 4, "sure": 1.208, "ayna": false}, "akbaba": {"img": "aimade_gecici_kus.png", "kare": 6, "sutun": 4, "sure": 0.625, "ayna": false}, "tasgolem": {"img": "aimade_gecici_agac.png", "kare": 10, "sutun": 4, "sure": 1.25, "ayna": false}, "kemikgolem": {"img": "aimade_gecici_agac.png", "kare": 10, "sutun": 4, "sure": 1.25, "ayna": false}, "vampir": {"img": "aimade_gecici_albasti.png", "kare": 12, "sutun": 4, "sure": 2.583, "ayna": false}, "kadimvampir": {"img": "aimade_gecici_albastiAna.png", "kare": 12, "sutun": 4, "sure": 2.458, "ayna": false}, "nekromancer": {"img": "aimade_gecici_erlik.png", "kare": 12, "sutun": 4, "sure": 1.458, "ayna": false}, "k6_golgekurt": {"img": "aimade_gecici_kurt.png", "kare": 11, "sutun": 4, "sure": 1.333, "ayna": true}, "k7_kurtsurusu": {"img": "aimade_gecici_kurt.png", "kare": 11, "sutun": 4, "sure": 1.333, "ayna": true}, "k6_orklordu": {"img": "aimade_gecici_yek.png", "kare": 10, "sutun": 4, "sure": 1.208, "ayna": false}, "k7_orkkrali": {"img": "aimade_gecici_yek.png", "kare": 10, "sutun": 4, "sure": 1.208, "ayna": false}, "k6_karagolem": {"img": "aimade_gecici_agac.png", "kare": 10, "sutun": 4, "sure": 1.25, "ayna": false}, "k6_golgevampir": {"img": "aimade_gecici_albasti.png", "kare": 12, "sutun": 4, "sure": 2.583, "ayna": false}, "k7_karaakbaba": {"img": "aimade_gecici_kus.png", "kare": 6, "sutun": 4, "sure": 0.625, "ayna": false}, "k7_erlikhan": {"img": "aimade_gecici_erlik.png", "kare": 12, "sutun": 4, "sure": 1.458, "ayna": false}, "k6_kadimnekro": {"img": "aimade_gecici_erlik.png", "kare": 12, "sutun": 4, "sure": 1.458, "ayna": false}};
  var asil = window.zgMobArtHTML;
  if (typeof asil !== 'function') return;
  window.zgMobArtHTML = function (m) {
    var d = m && ESLES[m.id];
    if (!d || m.bat) return asil(m);
    var satir = Math.ceil(d.kare / d.sutun);
    return '<div class="aimade-anim" data-id="' + m.id + '" style="position:absolute;left:50%;bottom:0;width:112%;height:112%;'
      + 'transform:translateX(-50%)' + (d.ayna ? ' scaleX(-1)' : '') + ';pointer-events:none;'
      + 'background:url(images/' + d.img + ') 0 0/' + (d.sutun * 100) + '% ' + (satir * 100) + '% no-repeat;'
      + 'filter:drop-shadow(0 3px 5px #000a)"></div>';
  };
  function dongu(t) {
    var els = document.getElementsByClassName('aimade-anim');
    for (var i = 0; i < els.length; i++) {
      var e = els[i], d = ESLES[e.dataset.id];
      if (!d) continue;
      var n = Math.floor(((t / 1000) % d.sure) / d.sure * d.kare) % d.kare;
      var sat = Math.ceil(d.kare / d.sutun);
      var x = d.sutun > 1 ? (n % d.sutun) / (d.sutun - 1) * 100 : 0;
      var y = sat > 1 ? Math.floor(n / d.sutun) / (sat - 1) * 100 : 0;
      e.style.backgroundPosition = x + '% ' + y + '%';
    }
    requestAnimationFrame(dongu);
  }
  requestAnimationFrame(dongu);
})();
