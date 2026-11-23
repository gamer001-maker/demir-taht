/* ── KARAKTER EKRANI: KUŞANILAN (Osman, 23 Kas; örnek: Masaüstü/1.png) ──
   Ortada karakterin tam boy figürü, ekipman yuvaları iki yanda dikey:
     sol: Silah, Kask, Göğüslük, Eldiven, Bot · sağ: Küpe, Küpe II, Yüzük, Yüzük II, Güç
   Envanter hemen altında ve her zaman açık (sekme çubuğundan "Envanter" kalktı).
   Nitelikler / Yetenekler / Özellikler şimdilik sekmeli olarak envanterin altında (yerlerine Osman karar verecek).
   Figür: zindandaki tam boy çizim (<sınıf>_<görünüm>_1.webp); boş kenarları tuvalde kırpılır.
   Yuvalar oyunun kendi ürettiği .eq-slot düğümleridir (tıklama/sürükle-bırak aynen çalışır), yalnız yerleri değişir.
   index.html'e dokunmaz. */
(function () {
  if (typeof window.renderKarakter !== 'function') return;

  var SOL = [0, 1, 2, 3, 4];      // eqSlots sırası: weapon, helmet, chest, gloves, boots, ring, ring2, earring, earring2
  var SAG = [7, 8, 5, 6];

  var css = document.createElement('style');
  css.textContent = [
    '#eq-slots.pd-gizli{display:none!important}',
    '.pd{position:relative;display:grid;grid-template-columns:minmax(52px,1fr) minmax(0,2.3fr) minmax(52px,1fr);gap:8px;padding:10px;margin-bottom:8px;border-radius:12px;',
    'background:radial-gradient(ellipse at 50% 45%,#3a2612 0%,#1a120a 55%,#0d0906 100%);border:1px solid var(--border2,#5a4028);box-shadow:inset 0 0 24px #000c}',
    '.pd-sutun{display:flex;flex-direction:column;gap:8px;justify-content:space-between}',
    '.pd-sutun .eq-slot{width:100%;border-width:2px;border-color:#6b4c2a;background:linear-gradient(160deg,#1c140c,#0a0705);box-shadow:inset 0 0 10px #000,0 0 0 1px #000}',
    '.pd-sutun .eq-slot.eq-filled{border-color:var(--gold,#c9a24a)}',
    '.pd-sutun .eq-slot .eq-slot-lbl{font-size:8px}',
    '.pd-orta{position:relative;display:flex;align-items:flex-end;justify-content:center;min-height:100%;overflow:hidden}',
    '.pd-hale{position:absolute;left:50%;top:44%;width:92%;aspect-ratio:1;transform:translate(-50%,-50%);border-radius:50%;',
    'background:radial-gradient(circle,#e8a84a33 0%,#e8a84a14 40%,transparent 70%);border:1px solid #e3bf6a22;box-shadow:0 0 30px #e8a84a18}',
    '.pd-zemin{position:absolute;left:50%;bottom:4px;width:70%;height:14px;transform:translateX(-50%);border-radius:50%;background:radial-gradient(ellipse,#000c 0%,transparent 70%)}',
    '.pd-figur{position:absolute;bottom:8px;left:50%;transform:translateX(-50%);height:calc(100% - 14px);width:auto;max-width:100%;object-fit:contain;filter:drop-shadow(0 6px 10px #000c)}',
    // Osman 23 Kas: soldaki kimlik kartı (portre, isim, can/deneyim) kalktı; isim · sınıf · Sv başlıkta, güç başlığın sağında
    '.char-top{display:none!important}',
    '#cs-kusanilmis .parch-header{display:flex;align-items:center;justify-content:space-between;gap:8px;flex-wrap:wrap}',
    '.pd-kim{display:flex;align-items:baseline;gap:8px;flex-wrap:wrap;min-width:0}',
    '.pd-kim b{font:700 18px var(--font-head,serif);color:var(--gold2,#e8c56a)}',
    '.pd-kim i{color:var(--ink3,#a89070);font-size:13px}',
    '.pd-kim em{font-style:normal;font-size:12px;color:var(--gold,#c9a24a);border:1px solid #6b4c2a;border-radius:6px;padding:1px 7px}',
    '.pd-ust-guc{font-size:11px;letter-spacing:.08em;color:var(--ink3,#a89070);white-space:nowrap}',
    '.pd-ust-guc b{margin-left:6px;font:700 18px var(--font-head,serif);letter-spacing:0;color:var(--gold2,#e8c56a);font-variant-numeric:tabular-nums}',
    // Osman 23 Kas: Karakter Özellikleri kutusu kalktı → figürün başının üstünde sade yazı
    '#cs-ozellikler{display:none!important}',
    '.char-tab-btn[data-cs="ozellikler"]{display:none!important}',
    '@media(max-width:900px){#char-tabs-bar{grid-template-columns:repeat(2,1fr)!important}}',
    '.pd-ozl{position:absolute;top:6px;left:4px;right:4px;z-index:2;display:grid;grid-template-columns:1fr 1fr;gap:3px 12px;pointer-events:none;',
    'font-size:clamp(9px,2.6vw,12px);line-height:1.25;color:var(--ink3,#a89070);text-shadow:0 1px 3px #000,0 0 6px #000}',
    '.pd-ozl span{display:flex;justify-content:space-between;gap:6px;white-space:nowrap;overflow:hidden}',
    '.pd-ozl b{color:var(--gold2,#e8c56a);font-variant-numeric:tabular-nums}',
    '.pd-ozl ~ .pd-figur{height:calc(100% - 78px)}',
    '#pd-xp{width:min(70%,460px);margin:10px auto 2px}',
    '#pd-xp .mbar-wrap{margin:0}',
    '.pd-guc{aspect-ratio:1;width:100%;border-radius:8px;border:2px solid #6b4c2a;background:linear-gradient(160deg,#2a1c0e,#120c06);display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center}',
    '.pd-guc b{font:700 clamp(12px,3.4vw,16px) var(--font-head,serif);color:var(--gold2,#e8c56a);font-variant-numeric:tabular-nums}',
    '.pd-guc span{font-size:8px;letter-spacing:.08em;color:var(--ink3,#a89070)}',
    '@media(max-width:900px){',
    '  #cs-envanter{order:3!important;display:block!important}',
    '  #char-tabs-bar{order:4!important;grid-template-columns:repeat(3,1fr)!important}',
    '  #cs-yetenekler,#cs-nitelikler,#cs-ozellikler{order:5!important}',
    '  .char-tab-btn[data-cs="envanter"]{display:none!important}',
    '}'
  ].join('');
  document.head.appendChild(css);

  /* Figür: boş (saydam) kenarları kırp, sonucu önbellekte tut */
  var onbellek = {};
  function figurYukle(src, hedef) {
    if (onbellek[src]) { hedef.src = onbellek[src]; return; }
    var img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = function () {
      try {
        var W = 360, H = Math.round(img.height * W / img.width);
        var c = document.createElement('canvas'); c.width = W; c.height = H;
        var x = c.getContext('2d'); x.drawImage(img, 0, 0, W, H);
        var d = x.getImageData(0, 0, W, H).data, x0 = W, y0 = H, x1 = 0, y1 = 0;
        for (var y = 0; y < H; y++) for (var i = 0; i < W; i++) {
          if (d[(y * W + i) * 4 + 3] > 20) { if (i < x0) x0 = i; if (i > x1) x1 = i; if (y < y0) y0 = y; if (y > y1) y1 = y; }
        }
        if (x1 <= x0 || y1 <= y0) { hedef.src = src; return; }
        var p = 4, w = x1 - x0 + 1 + p * 2, h = y1 - y0 + 1 + p * 2;
        var k = document.createElement('canvas'); k.width = w; k.height = h;
        k.getContext('2d').drawImage(c, x0 - p, y0 - p, w, h, 0, 0, w, h);
        onbellek[src] = k.toDataURL('image/png');
        hedef.src = onbellek[src];
      } catch (e) { hedef.src = src; }   // tuval kullanılamazsa kırpmadan göster
    };
    img.onerror = function () { hedef.style.display = 'none'; };
    img.src = src;
  }

  function yazi(id) { var e = document.getElementById(id); return e ? e.textContent.trim() : ''; }
  function kac(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function baslikKur(bolum) {
    var h = bolum.querySelector('.parch-header'); if (!h) return;
    var ad = yazi('g-name') || G.username || '', sinif = yazi('g-class'), sv = yazi('g-lvl') || ('Sv.' + (G.level || 1));
    h.innerHTML = '<span class="pd-kim"><b>' + kac(ad) + '</b><i>' + kac(sinif) + '</i><em>' + kac(sv) + '</em></span>'
      + '<span class="pd-ust-guc" title="Güç: hasar, can, savunma ve seviyeden">GÜÇ<b>' + guc() + '</b></span>';
  }

  /* Osman 23 Kas: deneyim barı set yazısının altında, ortada (oyunun kendi .mbar-wrap düğümü taşınır, güncellemesi sürer) */
  function xpTasi(bolum) {
    var bar = document.getElementById('g-xpbar'); if (!bar) return;
    var sar = bar.closest('.mbar-wrap') || bar.parentElement;
    var kutu = document.getElementById('pd-xp');
    if (!kutu) {
      kutu = document.createElement('div'); kutu.id = 'pd-xp';
      var set = document.getElementById('set-bonus-display');
      if (set && set.parentNode) set.parentNode.insertBefore(kutu, set.nextSibling); else bolum.appendChild(kutu);
    }
    if (sar.parentNode !== kutu) { kutu.innerHTML = ''; kutu.appendChild(sar); }
  }

  /* Osman 23 Kas: Nekro zırhlar oyunda material:'demir' (bonus Demir'inki) → yazı "Demir Seti" çıkıyordu.
     Dört zırh parçasının adı "Nekro" ile başlıyorsa yalnız YAZI "Nekro Seti Aktif" olur; bonus değişmez. */
  function setAdiDuzelt() {
    var b = document.querySelector('#set-bonus-display b'); if (!b || !G.equipped) return;
    var hepsi = ['chest', 'helmet', 'gloves', 'boots'].every(function (s) { return /^Nekro/.test((G.equipped[s] || {}).name || ''); });
    if (hepsi) b.textContent = b.textContent.replace(/^\S+ Seti/, 'Nekro Seti');
  }

  /* Eşya penceresi: Nekro zırhta "4×Demir seti" → "4×Nekro seti" (yalnız yazı) */
  if (typeof window.openInvModal === 'function') {
    var asilModal = window.openInvModal;
    window.openInvModal = function (itemId, eqSlotKey) {
      var r = asilModal.apply(this, arguments);
      try {
        var it = itemId ? (G.inventory || []).find(function (x) { return x.id === itemId; }) : (G.equipped || {})[eqSlotKey];
        if (it && /^Nekro/.test(it.name || '')) {
          var kap = document.getElementById('g-modal-content');
          Array.prototype.forEach.call(kap ? kap.querySelectorAll('div') : [], function (d) {
            if (d.children.length === 0 && /^4×\S+ seti:/.test(d.textContent)) d.textContent = d.textContent.replace(/^4×\S+ seti:/, '4×Nekro seti:');
          });
        }
      } catch (e) { }
      return r;
    };
  }

  /* Karakter özellikleri (oyunun #g-eff-stats içeriğinden okunur) → figürün üstünde iki sütun yazı */
  function ozellikYaz() {
    var orta = document.querySelector('#pd .pd-orta'), kaynak = document.getElementById('g-eff-stats');
    if (!orta || !kaynak) return;
    var lbl = kaynak.querySelectorAll('.eff-stat-lbl'), val = kaynak.querySelectorAll('.eff-stat-val');
    var html = '';
    for (var i = 0; i < lbl.length; i++) html += '<span>' + kac(lbl[i].textContent.trim()) + '<b>' + kac(val[i] ? val[i].textContent.trim() : '') + '</b></span>';
    var kutu = orta.querySelector('.pd-ozl');
    if (!kutu) { kutu = document.createElement('div'); kutu.className = 'pd-ozl'; orta.insertBefore(kutu, orta.firstChild); }
    kutu.innerHTML = html;
  }

  function guc() { try { return Math.round(calcPow()).toLocaleString('tr-TR'); } catch (e) { return '—'; } }

  var asil = window.renderKarakter;
  window.renderKarakter = function () {
    var r = asil.apply(this, arguments);
    try { kur(); } catch (e) { console.warn('[paperdoll]', e); }
    return r;
  };

  function kur() {
    var satir = document.getElementById('eq-slots'), bolum = document.getElementById('cs-kusanilmis');
    if (!satir || !bolum) return;
    var yuvalar = Array.prototype.slice.call(satir.children);
    if (yuvalar.length < 9) return;
    var pd = document.getElementById('pd');
    if (!pd) {
      pd = document.createElement('div'); pd.id = 'pd'; pd.className = 'pd';
      pd.innerHTML = '<div class="pd-sutun" id="pd-sol"></div>'
        + '<div class="pd-orta"><div class="pd-hale"></div><div class="pd-zemin"></div><img class="pd-figur" id="pd-figur" alt=""></div>'
        + '<div class="pd-sutun" id="pd-sag"></div>';
      satir.parentNode.insertBefore(pd, satir);
    }
    satir.classList.add('pd-gizli');
    var sol = document.getElementById('pd-sol'), sag = document.getElementById('pd-sag');
    sol.innerHTML = ''; sag.innerHTML = '';
    SOL.forEach(function (i) { if (yuvalar[i]) sol.appendChild(yuvalar[i]); });
    SAG.forEach(function (i) { if (yuvalar[i]) sag.appendChild(yuvalar[i]); });
    baslikKur(bolum);
    xpTasi(bolum);
    setAdiDuzelt();
    ozellikYaz();
    // Figür (sınıf + görünüm değişince yenilenir)
    var cl = G.classId || 'warrior', av = (G.avatarIdx != null ? G.avatarIdx : 0);
    var base = (typeof IMG_BASE !== 'undefined') ? IMG_BASE : 'images/';
    var src = base + cl + '_' + av + '_1.webp', fig = document.getElementById('pd-figur');
    if (fig && fig.dataset.src !== src) { fig.dataset.src = src; figurYukle(src, fig); }
  }
})();
