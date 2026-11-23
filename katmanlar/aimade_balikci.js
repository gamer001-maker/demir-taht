/* ── BALIKÇILIK YERİ (Osman, 23 Kas) ──
   Haritada "Balıkçılık" işareti → zindan gibi ayrı bir yer: 7 su katmanı (zindan bantlarıyla aynı: her 10 seviye).
   Oyun: "Olta At" → bekle → mantar batınca "ÇEK!" (zamanında basılmalı). Yakalanan balık depoya,
   üstüne XP ve şansa bağlı eşya (zırh, yem). Günlük atış hakkı var.
   Haritadaki su karelerinde balık tutma KALDIRILDI (Osman kararı) → oradaki düğme buraya yönlendirir.
   Yakalama mantığı oyunun kendi doFishing'i (yem, mevsim, olta kırılması, balıkçılık mesleği aynen).
   Kayıt: G.ach._balik = { gun, atis }  (profiles.ach_counters jsonb). index.html'e dokunmaz. */
(function () {
  if (typeof window.doFishing !== 'function' || typeof window.renderWorldMap !== 'function') return;

  var AYAR = {
    gunlukHak: 30,
    xpOran: 0.006,               // başarılı avda: xpForLevel(katmanın orta seviyesi) × %0,6
    zirhSans: 0.03,              // başarılı avda katman bandından zırh
    yemSans: 0.10,               // başarılı avda solucan/hamur
    bekleme: [1500, 5000],       // mantarın batmasına kadar ms
    pencere: 900,                // ÇEK penceresi ms (+ balıkçılık mesleği × 5ms, en fazla 1500)
    konum: { x: 31, y: 71 },     // dünya haritasında
    img: 'aimade_harita_balikci.webp',
  };
  var KATMANLAR = [
    { ad: 'Sığ Dere', su: 'Göl', min: 1, ik: '🏞' },
    { ad: 'Söğütlü Göl', su: 'Göl', min: 11, ik: '🌿' },
    { ad: 'Nehir Ağzı', su: 'Göl', min: 21, ik: '🌊' },
    { ad: 'Fırtına Koyu', su: 'Deniz', min: 31, ik: '⛈' },
    { ad: 'Açık Deniz', su: 'Deniz', min: 41, ik: '⛵' },
    { ad: 'Kara Derinlik', su: 'Deniz', min: 51, ik: '🌑' },
    { ad: 'Kraken Çukuru', su: 'Deniz', min: 61, ik: '🦑' },
  ];

  function bugun() { try { return questDateKey(); } catch (e) { return new Date().toISOString().slice(0, 10); } }
  function hak() {
    if (!G.ach) G.ach = {};
    var b = G.ach._balik;
    if (!b || b.gun !== bugun()) b = G.ach._balik = { gun: bugun(), atis: 0 };
    return b;
  }
  function kalanHak() { return Math.max(0, AYAR.gunlukHak - hak().atis); }
  function oyuncuKatman() { return Math.max(1, Math.min(7, Math.ceil((G.level || 1) / 10))); }
  function katXP(i) {
    var lv = KATMANLAR[i].min + 5;
    return Math.max(1, Math.round(((typeof xpForLevel === 'function') ? xpForLevel(lv) : 100) * AYAR.xpOran));
  }
  function kaydet() { try { if (typeof currentUser !== 'undefined' && currentUser) sbSave(); } catch (e) { } }
  function oltaVar() { try { return hasOlta(); } catch (e) { return true; } }

  var secili = 0, durum = 'bos', zamanlayici = null, isirmaAni = 0, gunluk = [];

  /* ── Görünüm ── */
  var css = document.createElement('style');
  css.textContent = [
    '#by{position:fixed;inset:0;z-index:9400;display:flex;flex-direction:column;background:#06121c;color:#e8dcc0;font-family:var(--font-body,system-ui)}',
    '#by[hidden]{display:none!important}',
    '.by-ust{display:flex;align-items:center;gap:10px;padding:10px 14px;padding-top:max(10px,env(safe-area-inset-top));background:#0b1a26;border-bottom:1px solid #24465c}',
    '.by-ust h2{flex:1;margin:0;font:600 17px var(--font-head,serif);color:var(--gold2,#e8c56a)}',
    '.by-hak{font:600 12px var(--font-head,serif);background:#13293a;border:1px solid #2f5a75;border-radius:14px;padding:4px 10px}',
    '.by-kapat{background:none;border:1px solid #2f5a75;color:#e8dcc0;border-radius:8px;padding:5px 10px;font-size:15px;cursor:pointer}',
    '.by-katlar{display:flex;gap:6px;overflow-x:auto;padding:10px 12px;scrollbar-width:none}',
    '.by-kat{flex:0 0 auto;padding:7px 10px;border-radius:10px;border:1px solid #2f5a75;background:#0f2231;font-size:12px;cursor:pointer;text-align:center;min-width:86px}',
    '.by-kat b{display:block;font:600 12px var(--font-head,serif);color:#cfe6f5}',
    '.by-kat.sec{border-color:var(--gold2,#e8c56a);background:#1d3346}',
    '.by-kat.kilit{opacity:.45;cursor:not-allowed}',
    '.by-sahne{position:relative;flex:1;min-height:220px;margin:0 12px;border-radius:14px;overflow:hidden;border:1px solid #24465c;',
    'background:linear-gradient(180deg,#8fb6c9 0%,#c9dbe0 22%,#2d6f8e 23%,#174a66 60%,#0b2c41 100%)}',
    '.by-sahne.deniz{background:linear-gradient(180deg,#5c7d96 0%,#9fb4c0 22%,#1f5674 23%,#0f3550 60%,#061d2e 100%)}',
    '.by-dalga{position:absolute;left:-50%;width:200%;height:14px;opacity:.35;background:repeating-linear-gradient(90deg,transparent 0 30px,#ffffff55 30px 60px);border-radius:50%;animation:byDalga 6s linear infinite}',
    '@keyframes byDalga{to{transform:translateX(25%)}}',
    '.by-ip{position:absolute;left:18%;top:8%;width:52%;height:2px;background:#ddd8;transform-origin:left;transform:rotate(28deg)}',
    '.by-mantar{position:absolute;left:66%;top:44%;font-size:30px;transform:translate(-50%,-50%);transition:top .25s}',
    '.by-mantar.bekle{animation:byYuz 1.6s ease-in-out infinite}',
    '@keyframes byYuz{50%{transform:translate(-50%,-38%)}}',
    '.by-mantar.isirdi{top:52%;animation:byTitre .12s linear infinite}',
    '@keyframes byTitre{50%{transform:translate(-46%,-50%)}}',
    '.by-mesaj{position:absolute;left:0;right:0;bottom:12px;text-align:center;font:600 15px var(--font-head,serif);text-shadow:0 2px 4px #000}',
    '.by-alt{padding:12px;padding-bottom:max(12px,env(safe-area-inset-bottom))}',
    '.by-dugme{width:100%;padding:16px;border-radius:12px;border:2px solid var(--gold2,#e8c56a);background:linear-gradient(180deg,#3a2a18,#261c12);color:var(--gold2,#e8c56a);font:700 18px var(--font-head,serif);cursor:pointer}',
    '.by-dugme.cek{background:linear-gradient(180deg,#b83a2a,#7a2018);color:#fff;border-color:#ffb199;animation:byNabiz .3s ease-in-out infinite alternate}',
    '@keyframes byNabiz{to{transform:scale(1.04)}}',
    '.by-dugme:disabled{opacity:.5;animation:none}',
    '.by-bilgi{display:flex;justify-content:space-between;font-size:11px;color:#9fb8c8;margin:8px 2px 0}',
    '.by-gunluk{font-size:11px;color:#9fb8c8;margin-top:6px;min-height:1.2em;text-align:center}'
  ].join('');
  document.head.appendChild(css);

  function kur() {
    if (document.getElementById('by')) return;
    document.body.insertAdjacentHTML('beforeend',
      '<div id="by" hidden><div class="by-ust"><h2>🎣 Balıkçılık Yeri</h2><span class="by-hak" id="by-hak"></span>'
      + '<button class="by-kapat" id="by-kapat" onclick="balikYeriKapat()">✕</button></div>'
      + '<div class="by-katlar" id="by-katlar"></div>'
      + '<div class="by-sahne" id="by-sahne"><div class="by-dalga" style="top:30%"></div><div class="by-dalga" style="top:48%;animation-duration:8s"></div><div class="by-dalga" style="top:70%;animation-duration:10s"></div>'
      + '<div class="by-ip" id="by-ip" style="display:none"></div><div class="by-mantar" id="by-mantar" style="display:none">🔴</div><div class="by-mesaj" id="by-mesaj"></div></div>'
      + '<div class="by-alt"><button class="by-dugme" id="by-dugme" onclick="balikDugme()">🎣 Olta At</button>'
      + '<div class="by-bilgi" id="by-bilgi"></div><div class="by-gunluk" id="by-gunluk"></div></div></div>');
  }

  function ciz() {
    var ok = oyuncuKatman();
    document.getElementById('by-hak').textContent = 'Hak ' + kalanHak() + '/' + AYAR.gunlukHak;
    document.getElementById('by-katlar').innerHTML = KATMANLAR.map(function (k, i) {
      var kilit = i + 1 > ok;
      return '<div class="by-kat' + (i === secili ? ' sec' : '') + (kilit ? ' kilit' : '') + '" onclick="balikKatSec(' + i + ')">'
        + '<b>' + k.ik + ' ' + k.ad + '</b>Sv.' + k.min + '–' + (k.min + 9) + (kilit ? ' 🔒' : '') + '</div>';
    }).join('');
    document.getElementById('by-sahne').classList.toggle('deniz', KATMANLAR[secili].su === 'Deniz');
    var bait = null; try { bait = findBait(); } catch (e) { }
    document.getElementById('by-bilgi').innerHTML = '<span>' + (KATMANLAR[secili].su === 'Deniz' ? '🌊 Tuzlu su' : '🏞 Tatlı su') + ' · +' + katXP(secili).toLocaleString('tr') + ' XP/av</span>'
      + '<span>' + (oltaVar() ? '🎣 Olta hazır' : '<b style="color:#f87171">Olta yok</b>') + ' · ' + (bait ? '🪱 ' + ITEM_LABELS[bait] : 'Yem yok') + '</span>';
    document.getElementById('by-gunluk').textContent = gunluk.slice(-3).join(' · ');
    var d = document.getElementById('by-dugme');
    if (durum === 'bos') { d.className = 'by-dugme'; d.textContent = kalanHak() > 0 ? '🎣 Olta At' : 'Bugünkü hak bitti'; d.disabled = kalanHak() <= 0; }
  }
  function mesaj(m) { document.getElementById('by-mesaj').textContent = m; }
  function mantar(goster, sinif) {
    var m = document.getElementById('by-mantar'), ip = document.getElementById('by-ip');
    m.style.display = ip.style.display = goster ? 'block' : 'none';
    m.className = 'by-mantar' + (sinif ? ' ' + sinif : '');
  }

  window.balikYeriAc = function () {
    kur();
    secili = Math.min(secili || oyuncuKatman() - 1, oyuncuKatman() - 1);
    durum = 'bos'; mantar(false); mesaj(oltaVar() ? 'Oltanı at, mantar batınca ÇEK!' : 'Balık tutmak için olta gerekli (Pazar → Ekipmanlar)');
    document.getElementById('by').hidden = false;
    ciz();
  };
  window.balikYeriKapat = function () {
    clearTimeout(zamanlayici); durum = 'bos';
    var e = document.getElementById('by'); if (e) e.hidden = true;
    kaydet();
  };
  window.balikKatSec = function (i) {
    if (durum !== 'bos') return;
    if (i + 1 > oyuncuKatman()) { toast('🔒 Bu su Sv.' + KATMANLAR[i].min + '\'de açılır.'); return; }
    secili = i; ciz();
  };

  function bitir(m) {
    clearTimeout(zamanlayici); durum = 'bos'; mantar(false); mesaj(m); gunluk.push(m); ciz();
  }
  window.balikDugme = function () {
    var d = document.getElementById('by-dugme');
    if (durum === 'bos') {
      if (kalanHak() <= 0) { toast('Bugünkü balık tutma hakkın bitti. Yarın yine gel!'); return; }
      if (!oltaVar()) { toast('🎣 Balık tutmak için olta gerekli! Pazar → Ekipmanlar'); return; }
      hak().atis++;
      durum = 'bekle'; mantar(true, 'bekle'); mesaj('Bekle…');
      d.className = 'by-dugme'; d.textContent = 'Bekle…';
      var t = AYAR.bekleme[0] + Math.random() * (AYAR.bekleme[1] - AYAR.bekleme[0]);
      zamanlayici = setTimeout(function () {
        durum = 'isirdi'; isirmaAni = Date.now(); mantar(true, 'isirdi'); mesaj('Vurdu!');
        d.className = 'by-dugme cek'; d.textContent = '❗ ÇEK!';
        var pencere = Math.min(1500, AYAR.pencere + ((typeof qSkillVal === 'function') ? qSkillVal('balikcilik') : 0) * 5);
        zamanlayici = setTimeout(function () { if (durum === 'isirdi') bitir('🐟 Geç kaldın, balık yemi alıp kaçtı.'); }, pencere);
      }, t);
      ciz(); d.disabled = false;
      return;
    }
    if (durum === 'bekle') { bitir('Erken çektin, balık ürktü.'); return; }
    if (durum === 'isirdi') { cek(); }
  };

  function cek() {
    clearTimeout(zamanlayici);
    // Oyunun kendi yakalama zarı (yem, mevsim, olta kırılması, meslek) — sonucu depo farkından anlarız
    var once = JSON.stringify(G.prodInv || {});
    var toastYedek = window.toast, sonToast = '';
    window.toast = function (m) { sonToast = m; return toastYedek.apply(this, arguments); };
    try { window.doFishing({ n: KATMANLAR[secili].su }); } finally { window.toast = toastYedek; }
    var sonra = G.prodInv || {}, eski = JSON.parse(once), tutulan = null;
    Object.keys(sonra).forEach(function (k) { if ((sonra[k] || 0) > (eski[k] || 0) && typeof FISH_TYPES !== 'undefined' && FISH_TYPES[k]) tutulan = k; });
    if (!tutulan) { bitir(sonToast || '🐟 Balık kaçtı!'); kaydet(); return; }
    var xp = katXP(secili), ekler = [];
    gainXP(xp);
    if (Math.random() < AYAR.zirhSans && typeof dropRandomArmor === 'function') {
      try { if (dropRandomArmor(secili + 1, 'Balıkçılık ganimeti', { plus: 0 })) ekler.push('🛡 zırh'); } catch (e) { }
    }
    if (Math.random() < AYAR.yemSans) {
      var y = Math.random() < 0.5 ? 'solucan' : 'hamur';
      G.prodInv[y] = (G.prodInv[y] || 0) + 1; ekler.push('🪱 ' + (ITEM_LABELS[y] || y));
    }
    if (typeof updateHUD === 'function') updateHUD();
    bitir('🐟 ' + FISH_TYPES[tutulan].name + '! +' + xp.toLocaleString('tr') + ' XP' + (ekler.length ? ' · ' + ekler.join(', ') : ''));
    kaydet();
  }

  /* ── Dünya haritasında işaret ── */
  var asilDunya = window.renderWorldMap;
  window.renderWorldMap = function () {
    asilDunya.apply(this, arguments);
    var sahne = document.getElementById('world-map-scene');
    if (!sahne) return;
    sahne.insertAdjacentHTML('beforeend',
      '<div class="hd-pin balikci" style="left:' + AYAR.konum.x + '%;top:' + AYAR.konum.y + '%;" onclick="event.stopPropagation();balikYeriAc()">'
      + '<img src="images/' + AYAR.img + '" alt="Balıkçılık" onerror="this.style.display=\'none\';this.nextElementSibling.style.display=\'block\'">'
      + '<span class="hd-yedek">🎣</span><span class="hd-ad">Balıkçılık</span></div>');
  };

  /* ── Su karelerinde balık tutma kaldırıldı → Balıkçılık Yeri'ne yönlendir ── */
  if (typeof window.startGather === 'function') {
    var asilTopla = window.startGather;
    window.startGather = function (idx, type) {
      if (type === 'fish') { toast('🎣 Balık artık haritadaki Balıkçılık Yeri\'nde tutuluyor.'); window.balikYeriAc(); return; }
      return asilTopla.apply(this, arguments);
    };
  }
  if (typeof window.cellClick === 'function') {
    var asilHucre = window.cellClick;
    window.cellClick = function () {
      var r = asilHucre.apply(this, arguments);
      document.querySelectorAll('button[onclick*="\'fish\')"]').forEach(function (b) {
        b.setAttribute('onclick', 'balikYeriAc()');
        b.textContent = '🎣 Balıkçılık Yeri\'ne git';
      });
      return r;
    };
  }
})();
