/* â”€â”€ KARAKTER: SOL SÃœTUN KALKTI (Osman, 23 Kas) â”€â”€
   - Kahraman Nitelikleri â†’ aÃ§Ä±lÄ±r pencere; KuÅŸanÄ±lan baÅŸlÄ±ÄŸÄ±nda "âšœ Nitelikler" dÃ¼ÄŸmesi (serbest puan varsa kÄ±rmÄ±zÄ± rozet).
   - Meslekler â†’ Yetenek ekranÄ±nda (#ga) ikinci sekme: "ğŸŒ³ Yetenek AÄŸacÄ± | ğŸ›  Meslekler".
   - KuÅŸanÄ±lan Ã¼stte, Envanter altÄ±nda (bilgisayarda tek sÃ¼tun, en fazla 640px, ortada); sekme Ã§ubuÄŸu kalktÄ±.
   Oyunun kendi bÃ¶lÃ¼mleri (#cs-nitelikler, #cs-yetenekler) TAÅINIR, kopyalanmaz â†’ + dÃ¼ÄŸmeleri ve gÃ¼ncelleme aynen Ã§alÄ±ÅŸÄ±r.
   index.html'e dokunmaz; aimade_karakter_paperdoll.js'ten sonra yÃ¼klenir. */
(function () {
  if (typeof window.renderKarakter !== 'function') return;

  var css = document.createElement('style');
  css.textContent = [
    '#char-tabs-bar{display:none!important}',
    '@media(min-width:901px){',
    '  .char-sheet{grid-template-columns:1fr!important}',
    '  .char-left-col{display:none!important}',
    // Osman: envanter karakterin ALTINDA (yan yana deÄŸil); tek sÃ¼tun, ortada
    '  .char-right-col{width:100%;max-width:640px;margin:0 auto}',
    '}',
    // Nitelikler penceresi
    '#pd-nit{position:fixed;inset:0;z-index:9400;background:#000b;display:flex;align-items:center;justify-content:center;padding:16px}',
    '#pd-nit[hidden]{display:none!important}',
    '.pd-nit-kutu{position:relative;width:min(460px,100%);max-height:90vh;overflow:auto;border-radius:12px;box-shadow:0 10px 40px #000}',
    '#pd-nit #cs-nitelikler{display:block!important;margin:0}',
    '#pd-nit #cs-nitelikler .parch-header{padding-right:42px}',
    '.pd-nit-x{position:absolute;top:8px;right:10px;z-index:2;background:#2a2016;border:1px solid #6a4a28;color:#e8dcc0;border-radius:8px;width:30px;height:30px;cursor:pointer;font-size:15px}',
    '.pd-nit-ac{position:relative;margin-left:auto;margin-right:12px;background:linear-gradient(180deg,#3a2a18,#261c12);border:1px solid var(--gold,#c9a24a);color:var(--gold2,#e8c56a);',
    'border-radius:8px;padding:4px 10px;font:600 12px var(--font-head,serif);cursor:pointer;white-space:nowrap}',
    '.pd-nit-ac i{position:absolute;top:-7px;right:-7px;min-width:16px;height:16px;padding:0 4px;border-radius:8px;background:#d9573f;color:#fff;font:700 10px/16px system-ui;font-style:normal;text-align:center}',
    // Yetenek ekranÄ±nda sekmeler
    '.ga-sekme{display:flex;gap:6px;padding:8px 12px 0;background:#140f0a;border-bottom:1px solid #4a3220}',
    '.ga-sekme button{flex:1;background:#2a2016;border:1px solid #6a4a28;border-bottom:0;border-radius:8px 8px 0 0;color:#b09870;padding:8px;font:600 13px var(--font-head,serif);cursor:pointer}',
    '.ga-sekme button.on{background:#3a2a18;color:var(--gold2,#e8c56a);border-color:var(--gold,#c9a24a)}',
    '#ga-meslek{flex:1;overflow:auto;padding:14px;display:none}',
    '#ga.ga-meslekte #ga-meslek{display:block}',
    '#ga.ga-meslekte #ga-yollar,#ga.ga-meslekte #ga-sahne,#ga.ga-meslekte #ga-alt,#ga.ga-meslekte #ga-sifirla{display:none!important}',
    '#ga-meslek #cs-yetenekler{display:block!important;max-width:640px;margin:0 auto}'
  ].join('');
  document.head.appendChild(css);

  /* Nitelikler penceresi */
  var nit = document.createElement('div');
  nit.id = 'pd-nit'; nit.hidden = true;
  nit.innerHTML = '<div class="pd-nit-kutu" id="pd-nit-kutu"><button class="pd-nit-x" id="pd-nit-x" aria-label="Kapat">âœ•</button></div>';
  document.body.appendChild(nit);
  nit.addEventListener('click', function (e) { if (e.target === nit) nitKapat(); });
  document.getElementById('pd-nit-x').onclick = nitKapat;
  function nitKapat() { nit.hidden = true; }
  window.pdNitelikAc = function () { tasi(); nit.hidden = false; };
  window.pdNitelikAcikMi = function () { return !nit.hidden; };   // geri tuÅŸu iÃ§in

  /* Yetenek ekranÄ±na Meslekler sekmesi */
  var ga = document.getElementById('ga'), meslekKutu = null;
  if (ga) {
    var ust = ga.querySelector('.ga-ust');
    var sekme = document.createElement('div');
    sekme.className = 'ga-sekme';
    sekme.innerHTML = '<button type="button" data-s="agac" class="on">ğŸŒ³ Yetenek AÄŸacÄ±</button><button type="button" data-s="meslek">ğŸ›  Meslekler</button>';
    if (ust) ust.parentNode.insertBefore(sekme, ust.nextSibling);
    meslekKutu = document.createElement('div'); meslekKutu.id = 'ga-meslek';
    var sahne = document.getElementById('ga-sahne');
    ga.insertBefore(meslekKutu, sahne || null);
    sekme.addEventListener('click', function (e) {
      var b = e.target.closest('button[data-s]'); if (!b) return;
      sekmeSec(b.getAttribute('data-s'));
    });
  }
  function sekmeSec(s) {
    if (!ga) return;
    ga.classList.toggle('ga-meslekte', s === 'meslek');
    Array.prototype.forEach.call(ga.querySelectorAll('.ga-sekme button'), function (b) { b.classList.toggle('on', b.getAttribute('data-s') === s); });
    if (s === 'meslek') { try { asil.call(window); } catch (e) { } tasi(); }   // meslek deÄŸerlerini tazele
  }
  if (typeof window.agacAc === 'function') {
    var asilAc = window.agacAc;
    window.agacAc = function () { var r = asilAc.apply(this, arguments); sekmeSec('agac'); return r; };
  }

  function tasi() {
    var n = document.getElementById('cs-nitelikler'), k = document.getElementById('pd-nit-kutu');
    if (n && k && n.parentNode !== k) k.appendChild(n);
    var m = document.getElementById('cs-yetenekler');
    if (m && meslekKutu && m.parentNode !== meslekKutu) meslekKutu.appendChild(m);
  }

  function dugme() {
    var h = document.querySelector('#cs-kusanilmis .parch-header'); if (!h) return;
    var b = h.querySelector('.pd-nit-ac');
    if (!b) {
      b = document.createElement('button'); b.type = 'button'; b.className = 'pd-nit-ac';
      b.onclick = window.pdNitelikAc;
      var guc = h.querySelector('.pd-ust-guc');
      h.insertBefore(b, guc || null);
    }
    var p = Number(G.skillPoints) || 0;
    b.innerHTML = 'âšœ Nitelikler' + (p > 0 ? '<i>' + (p > 99 ? '99+' : p) + '</i>' : '');
  }

  var asil = window.renderKarakter;
  window.renderKarakter = function () {
    var r = asil.apply(this, arguments);
    try { tasi(); dugme(); } catch (e) { console.warn('[karakter-sol]', e); }
    return r;
  };
  tasi();
})();
