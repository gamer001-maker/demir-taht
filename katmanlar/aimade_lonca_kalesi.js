/* ── LONCA KALESİ (Osman, 23 Kas) ──
   Loncanın ortak binaları, lonca hazinesinden (üyelerin bağışı) geliştirilir; bonus loncadaki HERKESE:
     ⛏ Madenci  → altın kazancı +%1/Sv   (zindan, görev, arena, kervan, madenci; hazineden çekme HARİÇ)
     ⚔ Savaş Ocağı → hasar +%1/Sv
     📜 Bilge    → XP kazancı +%1/Sv
   Her bina Sv.0–10 (en fazla %10). Bedel Sv → Sv+1 = 1000 × (Sv+1)²; yalnız Lider/Subay geliştirir.
   Sunucu: guilds.buildings (jsonb) + guild_upgrade_building RPC → sql/lonca_kalesi.sql (arkadaş çalıştırır).
   SQL çalışmadan bölüm görünür ama "sunucu hazırlığı bekleniyor" der, bonus 0 kalır.
   index.html'e dokunmaz. */
(function () {
  var BINALAR = [
    { k: 'madenci', ad: 'Lonca Madencisi', ik: '⛏', etki: 'altın kazancı' },
    { k: 'hasar', ad: 'Savaş Ocağı', ik: '⚔', etki: 'hasar' },
    { k: 'xp', ad: 'Bilge', ik: '📜', etki: 'XP kazancı' },
  ];
  var MAX = 10;
  function bedel(sv) { return 1000 * (sv + 1) * (sv + 1); }

  var LK = { bina: {}, hazir: null, guild: null, ts: 0 };
  window.LONCA_KALESI = LK;
  function sv(k) { return LK.guild && LK.guild === G.guildId ? Math.max(0, Math.min(MAX, (LK.bina[k] | 0))) : 0; }
  function yuzde(k) { return sv(k); }   // her seviye %1

  async function yukle(zorla) {
    if (typeof supa === 'undefined' || !G.guildId) { LK.bina = {}; LK.guild = null; return; }
    if (!zorla && LK.guild === G.guildId && Date.now() - LK.ts < 5 * 60 * 1000) return;
    try {
      var r = await supa.from('guilds').select('buildings').eq('id', G.guildId).single();
      if (r.error) {
        // Her hatada bölüm "hazır değil" der ve sunucunun hata metnini küçük yazıyla gösterir (tanı için)
        LK.hazir = false; LK.hata = (r.error.code ? r.error.code + ': ' : '') + (r.error.message || '');
        return;
      }
      LK.hata = '';
      LK.hazir = true;
      LK.bina = (r.data && r.data.buildings && typeof r.data.buildings === 'object') ? r.data.buildings : {};
      LK.guild = G.guildId; LK.ts = Date.now();
    } catch (e) { }
  }
  // Girişten sonra lonca belli olunca yükle, sonra 5 dakikada bir tazele
  setInterval(function () { if (typeof currentUser !== 'undefined' && currentUser && G.guildId) yukle(false); }, 15000);

  /* ── Bonuslar ── */
  // Hasar
  if (typeof window.getEffectiveStats === 'function') {
    var asilStat = window.getEffectiveStats;
    window.getEffectiveStats = function () {
      var s = asilStat.apply(this, arguments);
      var p = yuzde('hasar');
      if (s && p) {
        s.physDmg = Math.floor((s.physDmg || 0) * (1 + p / 100));
        s.magicDmg = Math.floor((s.magicDmg || 0) * (1 + p / 100));
      }
      return s;
    };
  }
  // XP
  if (typeof window.gainXP === 'function') {
    var asilXP = window.gainXP;
    window.gainXP = function (n) {
      var p = yuzde('xp');
      if (p && n > 0) n = Math.round(n * (1 + p / 100));
      return asilXP.call(this, n);
    };
  }
  // Altın: kazanç işlevlerinde altın farkı ölçülür, artı farkın %'si eklenir (iç içe çağrıda yalnız en dıştaki ölçer)
  var derinlik = 0;
  function altinBonus(fark) {
    var p = yuzde('madenci');
    if (!p || !(fark > 0)) return;
    var b = Math.floor(fark * p / 100);
    if (b > 0) { G.gold += b; if (typeof updateHUD === 'function') updateHUD(); }
  }
  ['zgBankBag', 'zgSettleRun', 'qGrant', 'giveQuestReward', '_abEnd', '_gbEnd', 'madenciTopla', 'kervanTeslim'].forEach(function (ad) {
    var asil = window[ad];
    if (typeof asil !== 'function') return;
    window[ad] = function () {
      if (derinlik > 0) return asil.apply(this, arguments);
      derinlik++;
      var once = G.gold, sonuc;
      try { sonuc = asil.apply(this, arguments); }
      catch (e) { derinlik--; throw e; }
      if (sonuc && typeof sonuc.then === 'function') {
        return sonuc.then(function (v) { derinlik--; altinBonus(G.gold - once); return v; },
          function (e) { derinlik--; throw e; });
      }
      derinlik--; altinBonus(G.gold - once);
      return sonuc;
    };
  });

  /* ── Geliştirme ── */
  window.loncaBinaGelistir = async function (k) {
    if (!G.guildId || typeof supa === 'undefined') return;
    if (G.guildRole !== 'leader' && G.guildRole !== 'officer') { toast('Yalnız Lider ve Subay geliştirebilir.'); return; }
    var mevcut = sv(k);
    if (mevcut >= MAX) { toast('Bina en üst seviyede.'); return; }
    if ((G.guildTreasury || 0) < bedel(mevcut)) { toast('Hazinede yeterli altın yok! (' + bedel(mevcut).toLocaleString('tr') + '🪙)'); return; }
    var r = await supa.rpc('guild_upgrade_building', { p_guild_id: String(G.guildId), p_key: k });
    if (r.error) {
      if (r.error.code === 'PGRST202' || /guild_upgrade_building/i.test(r.error.message || '')) { LK.hazir = false; toast('Lonca kalesi sunucuda henüz hazır değil.'); }
      else toast('İşlem başarısız: ' + r.error.message);
      cizBolum(); return;
    }
    if (!r.data || !r.data.ok) { toast('İşlem başarısız: ' + ((r.data && r.data.error) || 'bilinmeyen hata')); await yukle(true); cizBolum(); return; }
    G.guildTreasury = Number(r.data.treasury) || 0;
    LK.bina = r.data.buildings || LK.bina; LK.guild = G.guildId; LK.ts = Date.now(); LK.hazir = true;
    var b = BINALAR.filter(function (x) { return x.k === k; })[0];
    toast(b.ik + ' ' + b.ad + ' Sv.' + sv(k) + ' oldu! Loncaya +%' + yuzde(k) + ' ' + b.etki);
    if (typeof renderGuild === 'function') renderGuild('home');
  };

  /* ── LONCA KALESİ SAHNESİ (Osman: "haritada bizim kalemiz gibi bir lonca kalesi olacak") ──
     Dünya haritasında "Lonca Kalesi" işareti → kale haritası gibi tam ekran sahne; binaya dokun → seviye/bonus/geliştir.
     Bina görselleri gelene kadar kalenin bina resimleri kullanılır. */
  var SAHNE_YER = { madenci: { x: 24, y: 62, w: 22, img: 'bina_insaa1' }, hasar: { x: 50, y: 30, w: 28, img: 'bina_kisla1' }, xp: { x: 76, y: 62, w: 20, img: 'bina_asevi1' } };
  var HARITA_XY = { x: 52, y: 22 };   // dünya haritasında (kuzey, Frost Hill ile Vaelys arası)
  function imgYol(ad) { return ((typeof IMG_BASE !== 'undefined') ? IMG_BASE : 'images/') + ad + '.webp'; }
  function yetkiliMi() { return G.guildRole === 'leader' || G.guildRole === 'officer'; }
  function rolAdi() { return ({ member: 'Üye', officer: 'Subay', leader: 'Lider' }[G.guildRole] || G.guildRole || '?'); }

  var css = document.createElement('style');
  css.textContent = [
    '#lks{position:fixed;inset:0;z-index:9420;display:flex;flex-direction:column;background:#0d0a07;color:#e8dcc0;font-family:var(--font-body,system-ui)}',
    '#lks[hidden]{display:none!important}',
    '.lks-ust{display:flex;align-items:center;gap:10px;padding:10px 14px;padding-top:max(10px,env(safe-area-inset-top));background:#140f0a;border-bottom:1px solid #4a3220}',
    '.lks-ust h2{flex:1;margin:0;font:600 16px var(--font-head,serif);color:var(--gold2,#e8c56a);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
    '.lks-hazine{font:600 12px var(--font-head,serif);background:#2a1f14;border:1px solid #6a4a28;border-radius:14px;padding:4px 10px;white-space:nowrap}',
    '.lks-kapat{background:none;border:1px solid #6a4a28;color:#e8dcc0;border-radius:8px;padding:5px 10px;font-size:15px;cursor:pointer}',
    '.lks-govde{flex:1;overflow-y:auto;padding:12px;padding-bottom:max(12px,env(safe-area-inset-bottom));display:flex;flex-direction:column;gap:10px;max-width:900px;width:100%;margin:0 auto;box-sizing:border-box}',
    '.lks-sahne{position:relative;width:100%;aspect-ratio:2400/1792;border-radius:12px;overflow:hidden;border:1px solid var(--border2,#5a4028);box-shadow:inset 0 0 60px #000a}',
    '.lks-zemin{position:absolute;inset:0;background-size:cover;background-position:center;filter:sepia(.35) hue-rotate(-12deg) saturate(1.1) brightness(.82)}',
    '.lks-spot{position:absolute;transform:translate(-50%,-50%);cursor:pointer;text-align:center;z-index:2;transition:filter .15s}',
    '.lks-spot:hover{filter:brightness(1.25) drop-shadow(0 0 14px #d4af37cc)}',
    '.lks-spot img{display:block;width:100%;height:auto;filter:drop-shadow(0 6px 8px #000b)}',
    '.lks-spot .yedek{display:none;font-size:clamp(30px,7vw,52px);line-height:1}',
    '.lks-etk{display:inline-block;margin-top:2px;padding:2px 8px;border-radius:10px;background:#000c;border:1px solid var(--gold2,#e8c56a);color:var(--gold2,#e8c56a);font:600 clamp(9px,1.6vw,12px) var(--font-head,serif);white-space:nowrap}',
    '.lks-etk b{color:#9fe07a}',
    '.lks-sancak{position:absolute;left:50%;top:70%;transform:translate(-50%,-50%);width:clamp(40px,8vw,64px);z-index:1;pointer-events:none;filter:drop-shadow(1px 4px 3px #000b)}',
    '.lks-cipler{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}',
    '.lks-cip{text-align:center;padding:8px 4px;border-radius:10px;background:linear-gradient(180deg,#2c2014,#1a130c);border:1px solid var(--border2,#4a3220);font-size:11px;color:var(--ink3,#a89070)}',
    '.lks-cip b{display:block;font:700 15px var(--font-head,serif);color:#9fe07a}',
    '.lk-not{font-size:11px;color:var(--ink3,#a89070);text-align:center;margin:2px 0 4px}',
    '.lk-git{width:100%;margin:4px 0 6px}'
  ].join('');
  document.head.appendChild(css);

  function sancakSVG() {
    var amblem = esc(G.guildEmblem || '🛡');
    return '<svg viewBox="0 0 60 100"><rect x="4.6" y="6" width="2.8" height="92" rx="1.2" fill="#5a3b1c"/><circle cx="6" cy="5" r="3.2" fill="#e3bf6a"/>'
      + '<path d="M7.5 12 H56 L46 30 L56 48 H7.5 Z" fill="#7a1f1a" stroke="#3e0f0c" stroke-width="1.6"/>'
      + '<text x="29" y="36" font-size="20" text-anchor="middle">' + amblem + '</text></svg>';
  }
  function notHTML() {
    if (LK.hazir === false) return '<div class="lk-not">🔧 Lonca kalesi sunucu hazırlığı bekliyor (yakında açılacak).'
      + (LK.hata ? '<br><span style="opacity:.75;font-size:10px">Sunucu: ' + esc(LK.hata) + '</span>' : '') + '</div>';
    return '<div class="lk-not">Bonuslar loncadaki herkese geçer · Hazineye bağış yaparak binaları büyütün'
      + (LK.hazir && !yetkiliMi() ? ' · Geliştirmeyi Lider ve Subay yapar (senin rolün: ' + rolAdi() + ')' : '') + '</div>';
  }
  function ciplerHTML() {
    return '<div class="lks-cipler">' + BINALAR.map(function (b) {
      return '<div class="lks-cip">' + b.ik + ' ' + b.etki + '<b>+%' + yuzde(b.k) + '</b>Sv.' + sv(b.k) + '/' + MAX + '</div>';
    }).join('') + '</div>';
  }

  function kur() {
    if (document.getElementById('lks')) return;
    var d = document.createElement('div'); d.id = 'lks'; d.hidden = true;
    d.innerHTML = '<div class="lks-ust"><h2 id="lks-baslik">🏰 Lonca Kalesi</h2><span class="lks-hazine" id="lks-hazine"></span><button class="lks-kapat" id="lks-kapat">✕</button></div>'
      + '<div class="lks-govde"><div class="lks-sahne" id="lks-sahne"></div><div id="lks-alt"></div></div>';
    document.body.appendChild(d);
    document.getElementById('lks-kapat').onclick = function () { d.hidden = true; };
  }
  function sahneCiz() {
    var sahne = document.getElementById('lks-sahne'); if (!sahne) return;
    document.getElementById('lks-baslik').textContent = '🏰 ' + (G.guildName || 'Lonca') + ' Kalesi';
    document.getElementById('lks-hazine').textContent = '🏦 ' + (G.guildTreasury || 0).toLocaleString('tr') + '🪙';
    var h = '<div class="lks-zemin" style="background-image:url(' + "'" + imgYol('kalearkaplan') + "'" + ')"></div><div class="lks-sancak">' + sancakSVG() + '</div>';
    BINALAR.forEach(function (b) {
      var y = SAHNE_YER[b.k];
      h += '<div class="lks-spot" style="left:' + y.x + '%;top:' + y.y + '%;width:' + y.w + '%" onclick="loncaBinaAc(' + "'" + b.k + "'" + ')">'
        + '<img src="' + imgYol(y.img) + '" alt="" onerror="this.style.display=' + "'none'" + ';this.nextElementSibling.style.display=' + "'block'" + '"><div class="yedek">' + b.ik + '</div>'
        + '<div class="lks-etk">' + b.ik + ' ' + b.ad + ' Sv.' + sv(b.k) + ' <b>+%' + yuzde(b.k) + '</b></div></div>';
    });
    sahne.innerHTML = h;
    document.getElementById('lks-alt').innerHTML = ciplerHTML() + notHTML()
      + '<button class="btn" style="width:100%" onclick="loncaHazineyeGit()">🏦 Hazineye bağış yap</button>';
  }
  window.loncaHazineyeGit = function () {
    var d = document.getElementById('lks'); if (d) d.hidden = true;
    if (typeof showPage === 'function') showPage('guild');
    if (typeof glgo === 'function') glgo('home');
  };
  window.loncaKalesiAc = function () {
    if (!G.guildId) { toast('🏰 Lonca kalesine girmek için önce bir loncaya katıl.'); return; }
    kur(); document.getElementById('lks').hidden = false; sahneCiz();
    yukle(true).then(sahneCiz);
  };
  window.loncaBinaAc = function (k) {
    var b = BINALAR.filter(function (x) { return x.k === k; })[0]; if (!b) return;
    var s = sv(k), son = s >= MAX, bd = bedel(s), hz = G.guildTreasury || 0;
    var dugme;
    if (!LK.hazir) dugme = '<div class="lk-not">Sunucu hazır olunca geliştirilebilir.</div>';
    else if (son) dugme = '<button class="btn" style="width:100%" disabled>En üst seviye</button>';
    else if (yetkiliMi()) dugme = '<button class="btn" style="width:100%" onclick="loncaBinaGelistir(' + "'" + k + "'" + ')"' + (hz < bd ? ' disabled' : '') + '>Geliştir → Sv.' + (s + 1) + ' (' + bd.toLocaleString('tr') + '🪙 hazineden)</button>';
    else dugme = '<div class="lk-not">Geliştirmeyi Lider ve Subay yapar (senin rolün: ' + rolAdi() + '). Sonraki seviye: ' + bd.toLocaleString('tr') + '🪙</div>';
    showGModal('<div style="text-align:center">'
      + '<div style="font-size:42px;line-height:1">' + b.ik + '</div>'
      + '<div style="font:600 18px var(--font-head);color:var(--gold2);margin-top:4px">' + b.ad + ' · Sv.' + s + '/' + MAX + '</div>'
      + '<div style="font-size:12px;color:var(--ink3);margin:4px 0 10px">Loncadaki herkese ' + b.etki + ' bonusu</div>'
      + '<div style="font:700 26px var(--font-head);color:#9fe07a">+%' + s + (son ? '' : ' <span style="font-size:15px;color:var(--ink3)">→ +%' + (s + 1) + '</span>') + '</div>'
      + '<div style="height:6px;border-radius:3px;background:#0007;overflow:hidden;margin:10px 0"><div style="height:100%;width:' + (s / MAX * 100) + '%;background:linear-gradient(90deg,#8a6a2a,var(--gold2))"></div></div>'
      + '<div style="font-size:12px;color:var(--ink3);margin-bottom:10px">Lonca hazinesi: <b style="color:var(--gold2)">' + hz.toLocaleString('tr') + '🪙</b></div>'
      + dugme + '</div>');
  };

  /* Geliştirme sonrası sahne ve pencere tazelensin */
  var asilGel = window.loncaBinaGelistir;
  window.loncaBinaGelistir = async function (k) {
    await asilGel(k);
    sahneCiz();
    var m = document.getElementById('g-modal');
    if (m && m.style.display !== 'none') window.loncaBinaAc(k);
  };

  /* Dünya haritasında "Lonca Kalesi" işareti */
  if (typeof window.renderWorldMap === 'function') {
    var asilDunya = window.renderWorldMap;
    window.renderWorldMap = function () {
      asilDunya.apply(this, arguments);
      var sahne = document.getElementById('world-map-scene'); if (!sahne) return;
      sahne.insertAdjacentHTML('beforeend',
        '<div class="hd-pin lonca" style="left:' + HARITA_XY.x + '%;top:' + HARITA_XY.y + '%;" onclick="event.stopPropagation();loncaKalesiAc()">'
        + '<img src="images/aimade_harita_kale.webp" alt="Lonca Kalesi" style="filter:hue-rotate(150deg) saturate(1.3)" onerror="this.style.display=' + "'none'" + ';this.nextElementSibling.style.display=' + "'block'" + '">'
        + '<span class="hd-yedek">🏰</span><span class="hd-ad">Lonca Kalesi</span></div>');
    };
  }

  /* Lonca sekmesinde kısa özet + kaleye git düğmesi */
  function cizBolum() {
    var kap = document.getElementById('guild-content');
    if (!kap || !G.guildId) return;
    var eskiS = document.getElementById('lk-sec'), eskiB = document.getElementById('lk-bolum');
    if (eskiS) eskiS.remove(); if (eskiB) eskiB.remove();
    var banner = kap.querySelector('.gd-banner'); if (!banner) return;
    banner.insertAdjacentHTML('afterend', '<div class="sec" id="lk-sec">🏰 LONCA KALESİ</div><div id="lk-bolum">'
      + '<button class="btn lk-git" onclick="loncaKalesiAc()">🏰 Lonca Kalesine Git</button>' + ciplerHTML() + notHTML() + '</div>');
    sahneCiz();
  }
  if (typeof window.renderGuildHome === 'function') {
    var asilHome = window.renderGuildHome;
    window.renderGuildHome = function () {
      var r = asilHome.apply(this, arguments);
      cizBolum();
      yukle(true).then(cizBolum);
      return r;
    };
  }
})();
