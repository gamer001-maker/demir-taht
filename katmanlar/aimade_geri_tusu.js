// TELEFONUN GERİ TUŞU (Osman, 21 Kas 2026) — yalnız mobil uygulamada çalışır (@capacitor/app).
// Sıra: açık pencereyi kapat → alt ekrandan bir üst ekrana dön → ana ekranda iki kez basınca çık.
// Zindandayken geri tuşu zindandan çıkarmaz (yanlışlıkla basılıp koşu kaybolmasın).
// index.html'e DOKUNMAZ; kaldırmak için katman-mobil/ klasörünü silmek yeter.
(function () {
  'use strict';
  var C = window.Capacitor;
  var App = C && C.Plugins && C.Plugins.App;
  if (!App || !C.isNativePlatform || !C.isNativePlatform()) return;

  function gorunur(id) {
    var e = document.getElementById(id);
    if (!e) return false;
    var s = getComputedStyle(e);
    return s.display !== 'none' && s.visibility !== 'hidden' && !e.hidden;
  }
  function bildir(m) { try { if (typeof toast === 'function') toast(m); } catch (e) { /* yok */ } }
  function aktifSayfa() { var p = document.querySelector('.page.active'); return p ? p.id.replace(/^p-/, '') : ''; }
  function aktifEkran() {
    var ekranlar = ['karakter', 'kale', 'gelistirme', 'harita', 'arena', 'zindan'];
    for (var i = 0; i < ekranlar.length; i++) if (gorunur('gs-' + ekranlar[i])) return ekranlar[i];
    return '';
  }

  var sonBasis = 0;
  function geri() {
    // 1) Açık pencereler
    if (gorunur('ga')) { var k = document.getElementById('ga-kapat'); if (k) k.click(); return; }
    if (gorunur('g-modal')) { try { closeGModal(); } catch (e) { document.getElementById('g-modal').style.display = 'none'; } return; }
    if (gorunur('lb-overlay')) { try { closeLb(); } catch (e) { document.getElementById('lb-overlay').style.display = 'none'; } return; }
    var sohbet = document.getElementById('gchat-win');
    if (sohbet && sohbet.classList.contains('open')) { try { toggleGlobalChat(); } catch (e) { /* yok */ } return; }
    if (gorunur('cave-battle-overlay')) { bildir('Savaş sürüyor'); return; }

    // 2) Zindan: geri tuşu koşuyu bitirmez
    try { if (typeof ZD !== 'undefined' && ZD.active) { bildir('Zindandan çıkmak için "← Haritaya dön" düğmesine bas'); return; } } catch (e) { /* yok */ }

    // 3) Sayfalar ve ekranlar arasında bir üste dön
    var sayfa = aktifSayfa();
    if (sayfa === 'market') { showPage('game'); ggo('harita'); return; }
    if (sayfa === 'prod') { showPage('game'); ggo('kale'); return; }
    if (sayfa && sayfa !== 'game') { showPage('game'); return; }
    var ekran = aktifEkran();
    if (ekran === 'gelistirme') { ggo('kale'); return; }
    if (ekran === 'kale' || ekran === 'zindan' || ekran === 'arena' || ekran === 'karakter') { ggo('harita'); return; }
    // (Ana ekran artık Harita — katman-sade)

    // 4) Ana ekran: iki kez basınca çık
    var simdi = Date.now();
    if (simdi - sonBasis < 2000) { App.exitApp(); return; }
    sonBasis = simdi;
    bildir('Çıkmak için tekrar bas');
  }

  App.addListener('backButton', geri);
})();
