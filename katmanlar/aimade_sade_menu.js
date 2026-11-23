// SADE MENÜ (Osman, 21 Kas 2026) — yalnız mobil kopyada; index.html'e DOKUNMAZ.
// - Üst sekme sırası tamamen kalkar; HARİTA ana ekran olur (oyuna girince harita açılır)
// - Arena haritada bir yapı olur (zindan/pazar gibi)
// - Alt menü: Harita · Karakter · Görev · Yetenek · Lonca  (Yetenek'i katman-agac ekler)
// - Profil: sağ üstte oyuncu portresi (bildirim noktasıyla)
// - Karakter ekranındaki "Yetenekler" (meslekler) sekmesi "Meslekler" olur (Yetenek = gelişim ağacı ile karışmasın)
// Kaldırmak için katman-sade/ klasörünü silmek yeter.
(function () {
  'use strict';
  if (typeof window.ggo !== 'function' || typeof window.showPage !== 'function') return;
  var IMG = 'images/';
  var ARENA_XY = { x: 74, y: 24 };   // kuzeydoğu, Vaelys Tepesi'nin üstü

  var css = document.createElement('style');
  css.textContent = [
    '#game-tabs{display:none!important}',
    // Osman 23 Kas: haritanın altındaki bölge kartı (Civarı Keşfet) ve bölge listesi kaldırıldı
    '#world-region-card,#world-region-list{display:none!important}',
    '#gt-arena{display:none!important}',
    '#bn-profile{display:none!important}',
    '.res-bar{align-items:center}',
    '#sd-portre{position:relative;width:34px;height:34px;flex:0 0 34px;border-radius:50%;overflow:hidden;cursor:pointer;',
    'border:2px solid var(--gold,#c9a24a);background:#1e1610;display:flex;align-items:center;justify-content:center;box-shadow:0 0 6px #000a}',
    '#sd-portre-dis{position:relative;display:flex;align-items:center}',
    '#sd-nokta{display:none;position:absolute;top:-2px;right:-2px;width:10px;height:10px;border-radius:50%;background:#e04a3a;border:2px solid #261c12}',
  ].join('');
  document.head.appendChild(css);

  // 1) Haritaya arena
  var oncekiDunya = window.renderWorldMap;
  if (typeof oncekiDunya === 'function') {
    window.renderWorldMap = function () {
      oncekiDunya.apply(this, arguments);
      var sahne = document.getElementById('world-map-scene');
      if (!sahne || sahne.querySelector('.hd-pin.arena')) return;
      sahne.insertAdjacentHTML('beforeend',
        '<div class="hd-pin arena" style="left:' + ARENA_XY.x + '%;top:' + ARENA_XY.y + '%;" onclick="event.stopPropagation();ggo(\'arena\')">'
        + '<img src="' + IMG + 'aimade_harita_arena.webp" alt="Arena" onerror="this.style.display=\'none\';this.nextElementSibling.style.display=\'block\'">'
        + '<span class="hd-yedek">🏟</span><span class="hd-ad">Arena</span></div>');
    };
  }

  // 2) Alt menü: "Oyun" → "Harita", yanına "Karakter"
  function altMenu() {
    var oyun = document.getElementById('bn-game');
    if (!oyun || document.getElementById('bn-karakter')) return;
    oyun.innerHTML = '<span class="bnav-icon"><img src="' + IMG + 'harita.webp" class="nav-img" alt="Harita"></span><span class="bnav-lbl">Harita</span>';
    // Önce eski niteliği sil, SONRA yeni işlevi ata (removeAttribute('onclick') atanmış işlevi de siler)
    oyun.removeAttribute('onclick');
    oyun.onclick = function () { window.showPage('game'); window.ggo('harita'); };
    var kr = document.createElement('div');
    kr.className = 'bnav-btn'; kr.id = 'bn-karakter';
    kr.innerHTML = '<span class="bnav-icon"><img src="' + IMG + 'karakter.webp" class="nav-img" alt="Karakter"></span><span class="bnav-lbl">Karakter</span>';
    kr.onclick = function () { window.showPage('game'); window.ggo('karakter'); };
    oyun.parentNode.insertBefore(kr, oyun.nextSibling);
  }

  // 3) Sağ üstte portre → Profil
  function portre() {
    var bar = document.querySelector('.res-bar');
    if (!bar) return;
    var dis = document.getElementById('sd-portre-dis');
    if (!dis) {
      dis = document.createElement('div'); dis.id = 'sd-portre-dis';
      dis.innerHTML = '<div id="sd-portre" title="Profil"></div><span id="sd-nokta"></span>';
      dis.onclick = function () { window.showPage('profile'); };
      bar.appendChild(dis);
    }
    try {
      var p = document.getElementById('sd-portre');
      var anahtar = [G.classId, G.avatarIdx, G.armorColor, G.cloakColor].join('|');
      if (p && p.dataset.k !== anahtar && typeof getAvatarHTML === 'function' && G.classId) {
        p.innerHTML = getAvatarHTML(G.classId, G.avatarIdx, G.armorColor, G.cloakColor, 'sm');
        p.dataset.k = anahtar;
      }
    } catch (e) { /* oyuncu yüklenmedi */ }
    var asil = document.getElementById('notif-dot'), nokta = document.getElementById('sd-nokta');
    if (asil && nokta) nokta.style.display = getComputedStyle(asil).display === 'none' ? 'none' : 'block';
  }

  // 4) "Yetenekler" (meslekler) → "Meslekler"
  function meslekler() {
    document.querySelectorAll('[onclick*="csShow(\'yetenekler\')"]').forEach(function (b) {
      if (/Yetenekler/.test(b.innerHTML)) b.innerHTML = b.innerHTML.replace('Yetenekler', 'Meslekler');
    });
    document.querySelectorAll('.parch-title').forEach(function (t) {
      if (/YETENEKLER/.test(t.textContent)) t.textContent = t.textContent.replace('YETENEKLER', 'MESLEKLER');
    });
  }

  // 5) Alt menüde doğru düğme seçili görünsün
  function seciliYap(s) {
    var sayfa = document.querySelector('.page.active');
    if (!sayfa || sayfa.id !== 'p-game') return;
    document.querySelectorAll('.bnav-btn').forEach(function (b) { b.classList.remove('active'); });
    var hedef = document.getElementById(s === 'karakter' ? 'bn-karakter' : 'bn-game');
    if (hedef) hedef.classList.add('active');
  }
  // Telefonda harita kaydırılan bir kutuda (1000 px): girişte ortası görünsün (Osman: "sol taraf açılıyor")
  function haritayiOrtala() {
    var kutu = document.getElementById('world-map-scroll');
    if (!kutu) return;
    var dene = function (n) {
      var fark = kutu.scrollWidth - kutu.clientWidth;
      if (fark > 0) { kutu.scrollLeft = fark / 2; return; }
      if (n > 0) setTimeout(function () { dene(n - 1); }, 60); // harita görseli/ölçü henüz hazır değilse biraz bekle
    };
    requestAnimationFrame(function () { dene(10); });
  }

  var oncekiGgo = window.ggo;
  window.ggo = function (s) {
    var r = oncekiGgo.apply(this, arguments);
    seciliYap(s);
    if (s === 'harita') haritayiOrtala();
    var geri = document.getElementById('gs-arena');
    if (s === 'arena' && geri) {
      var btn = geri.querySelector(':scope > .hd-geri');
      if (!btn) { btn = document.createElement('div'); btn.className = 'hd-geri'; geri.insertBefore(btn, geri.firstChild); }
      btn.textContent = '← Haritaya dön';
      btn.onclick = function () { window.ggo('harita'); };
    }
    return r;
  };
  var oncekiSayfa = window.showPage;
  window.showPage = function (p) {
    var r = oncekiSayfa.apply(this, arguments);
    if (p === 'game') {
      var acik = ['karakter', 'kale', 'gelistirme', 'harita', 'arena', 'zindan'].filter(function (k) {
        var e = document.getElementById('gs-' + k); return e && e.style.display !== 'none';
      })[0];
      seciliYap(acik || 'harita');
    }
    return r;
  };

  // 6) Oyuna ilk girişte harita açılsın
  var ilkAcildi = false;
  function ilkHarita() {
    if (ilkAcildi) return;
    var sayfa = document.getElementById('p-game');
    var girdi = false;
    try { girdi = typeof currentUser !== 'undefined' && !!currentUser && !!G.classId; } catch (e) { girdi = false; }
    if (sayfa && sayfa.classList.contains('active') && girdi) {
      ilkAcildi = true;
      try { if (typeof ZD === 'undefined' || !ZD.active) window.ggo('harita'); } catch (e) { /* yok */ }
    }
  }

  function hepsi() { altMenu(); portre(); meslekler(); ilkHarita(); }
  hepsi();
  setInterval(hepsi, 1000);
})();
