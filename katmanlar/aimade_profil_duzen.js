/* ── PROFİL DÜZENİ (Osman, 23 Kas) ──
   Sayfanın başlığı zaten "PROFİL" → alttaki "Profil" sekmesi kaldırıldı.
   O sekmenin içeriği (kahraman kartı, bildirimler, hesap) İstatistik sayfasının en üstüne taşındı.
   Kalan sekmeler: İstatistik · Başarımlar · Ayarlar. index.html'e dokunmaz.
   Katman sırası: katman-siralama'dan SONRA (oradaki krallık sıralaması temizliği içeride çalışsın). */
(function () {
  if (typeof window.renderProfile !== 'function') return;

  var css = document.createElement('style');
  css.textContent = '#pft-profile{display:none!important}';
  document.head.appendChild(css);

  var asil = window.renderProfile;
  window.renderProfile = function (t) {
    if (t && t !== 'profile' && t !== 'stats') return asil.apply(this, arguments);   // boş sekme de İstatistik'e
    var el = document.getElementById('profile-content');
    asil.call(this, 'profile');
    var ust = el ? el.innerHTML : '';
    var r = asil.call(this, 'stats');
    if (el) {
      // Profil kısmı üstte; İstatistik'in ilk başlığındaki "margin-top:0" artık ortada kalacağı için boşluk verilir
      el.innerHTML = ust + el.innerHTML.replace('class="sec" style="margin-top:0;"', 'class="sec"');
    }
    G.profileTab = 'stats';
    ['profile', 'stats', 'ach', 'settings'].forEach(function (x) {
      var s = document.getElementById('pft-' + x); if (s) s.classList.toggle('active', x === 'stats');
    });
    return r;
  };
})();
