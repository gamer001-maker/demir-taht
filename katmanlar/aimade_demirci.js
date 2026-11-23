// DEMİRCİ (Geliştir) EKRANI DÜZENİ (Osman, 21 Kas 2026) — yalnız mobil kopyada; index.html'e DOKUNMAZ.
// - Önizleme kutusu en üstte, "Geliştirilebilir Eşyalar" listesi altında (liste aynı kalır)
// - Ekrana girince hiçbir eşya seçili değil: önizlemede boş yuva ve "+" simgesi
// - Soldaki başlık "ŞU AN" yerine "SEÇİLİ"
// - Seçili eşyaya önizlemede dokununca seçim kalkar; listeden başka eşyaya dokununca seçim değişir
// Kaldırmak için katman-demirci/ klasörünü silmek yeter.
(function () {
  'use strict';
  if (typeof window.renderGelistirme !== 'function' || typeof window.enhSelect !== 'function') return;

  var bos = true; // önizleme boş mu (oyun normalde ilk eşyayı otomatik seçer; biz boş başlatıyoruz)

  var css = document.createElement('style');
  css.textContent = [
    '.dm-yuva{display:flex;align-items:center;justify-content:center;width:68px;height:68px;margin:6px auto 8px;border:2px dashed var(--gold,#c9a24a);border-radius:12px;color:var(--gold2,#e8c56a);font-size:40px;line-height:1;opacity:.85}',
    '.dm-ipucu{text-align:center;font-size:12px;color:var(--ink3,#8a7560);margin-top:6px}',
    '.dm-secili{cursor:pointer;position:relative}',
    '.dm-secili::after{content:"✕ kaldır";position:absolute;top:6px;right:8px;font-size:10px;color:var(--ink3,#8a7560)}',
  ].join('');
  document.head.appendChild(css);

  var asilRender = window.renderGelistirme;
  window.renderGelistirme = function () {
    asilRender.apply(this, arguments);
    var ekran = document.getElementById('gs-gelistirme');
    if (!ekran) return;
    var duzen = ekran.querySelector('.enh-layout');
    var onizleme = ekran.querySelector('.enh-preview');
    if (!duzen || !onizleme) return;

    // 1) Önizleme en üste, tek sütun
    duzen.style.gridTemplateColumns = '1fr';
    duzen.style.height = 'auto';
    duzen.style.alignContent = 'start';
    duzen.style.gap = '14px';
    if (duzen.firstElementChild !== onizleme) duzen.insertBefore(onizleme, duzen.firstElementChild);

    var kutular = onizleme.querySelectorAll('.enh-compare .enh-stat-box');
    if (bos) {
      // 2) Boş önizleme: soldaki kutuda "+" yuvası, sağdaki boş; malzeme ve düğme gizli
      ekran.querySelectorAll('.enh-item-card.selected').forEach(function (k) { k.classList.remove('selected'); });
      var karsilastir = onizleme.querySelector('.enh-compare');
      if (karsilastir) {
        karsilastir.innerHTML = '<div class="enh-stat-box"><div class="enh-stat-title">SEÇİLİ</div><div class="dm-yuva">+</div>'
          + '<div class="enh-stat-name" style="color:var(--ink3)">Eşya seçilmedi</div></div>'
          + '<div class="enh-arrow">→</div>'
          + '<div class="enh-stat-box after" style="opacity:.45"><div class="enh-stat-title">SONRASI</div><div class="dm-yuva" style="border-style:dotted;color:var(--ink3)">?</div>'
          + '<div class="enh-stat-name" style="color:var(--ink3)">—</div></div>';
      }
      Array.prototype.forEach.call(onizleme.children, function (c) {
        if (!c.classList.contains('sec') && !c.classList.contains('enh-compare')) c.style.display = 'none';
      });
      if (!onizleme.querySelector('.dm-ipucu')) onizleme.insertAdjacentHTML('beforeend', '<div class="dm-ipucu">Geliştirmek için aşağıdaki listeden bir eşyaya dokun.</div>');
      return;
    }

    // 3) Seçili hâl: "ŞU AN" → "SEÇİLİ"; soldaki kutuya dokununca seçim kalkar
    if (kutular[0]) {
      var baslik = kutular[0].querySelector('.enh-stat-title');
      if (baslik && /ŞU AN/.test(baslik.textContent)) baslik.textContent = 'SEÇİLİ';
      kutular[0].classList.add('dm-secili');
      kutular[0].title = 'Seçimi kaldırmak için dokun';
      kutular[0].onclick = function () {
        try { if (typeof enhRunning !== 'undefined' && enhRunning) return; } catch (e) { /* yok */ }
        bos = true; window.renderGelistirme();
      };
    }
  };

  // Listeden eşyaya dokununca seçim değişir (ve önizleme dolar)
  var asilSec = window.enhSelect;
  window.enhSelect = function (id) { bos = false; return asilSec.apply(this, arguments); };

  // Demirciye her girişte önizleme boş başlasın
  var oncekiGgo = window.ggo;
  if (typeof oncekiGgo === 'function') {
    window.ggo = function (s) { if (s === 'gelistirme') bos = true; return oncekiGgo.apply(this, arguments); };
  }
})();
