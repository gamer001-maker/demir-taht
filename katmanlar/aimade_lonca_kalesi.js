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

  /* ── Lonca ana sekmesinde "Lonca Kalesi" bölümü ── */
  var css = document.createElement('style');
  css.textContent = [
    '.lk-izgara{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:6px}',
    '.lk-bina{position:relative;text-align:center;padding:10px 6px;border-radius:10px;background:linear-gradient(180deg,#2c2014,#1a130c);border:1px solid var(--border2,#4a3220)}',
    '.lk-bina .ik{font-size:30px;line-height:1.1}',
    '.lk-bina .ad{font:600 12px var(--font-head,serif);color:var(--gold2);margin-top:4px;min-height:2.4em;display:flex;align-items:center;justify-content:center}',
    '.lk-bina .sv{font-size:11px;color:var(--ink3,#a89070)}',
    '.lk-bina .bn{font:700 15px var(--font-head,serif);color:#9fe07a;margin:4px 0}',
    '.lk-bina .bar{height:5px;border-radius:3px;background:#0007;overflow:hidden;margin:4px 0 6px}',
    '.lk-bina .bar i{display:block;height:100%;background:linear-gradient(90deg,#8a6a2a,var(--gold2))}',
    '.lk-bina .btn{width:100%;padding:6px 2px;font-size:11px}',
    '.lk-not{font-size:11px;color:var(--ink3,#a89070);text-align:center;margin:2px 0 4px}'
  ].join('');
  document.head.appendChild(css);

  function bolumHTML() {
    var yetkili = G.guildRole === 'leader' || G.guildRole === 'officer';
    var h = '<div class="sec" id="lk-sec">🏰 LONCA KALESİ</div><div id="lk-bolum">';
    if (LK.hazir === false) {
      h += '<div class="lk-not">🔧 Lonca kalesi sunucu hazırlığı bekliyor (yakında açılacak).'
        + (LK.hata ? '<br><span style="opacity:.75;font-size:10px">Sunucu: ' + esc(LK.hata) + '</span>' : '') + '</div>';
    }
    h += '<div class="lk-izgara">';
    BINALAR.forEach(function (b) {
      var s = sv(b.k), son = s >= MAX, bd = bedel(s);
      var dugme = '';
      if (LK.hazir && yetkili) {
        dugme = son ? '<button class="btn" disabled>En üst seviye</button>'
          : '<button class="btn" onclick="loncaBinaGelistir(\'' + b.k + '\')"' + ((G.guildTreasury || 0) < bd ? ' disabled' : '') + '>Geliştir<br>' + bd.toLocaleString('tr') + '🪙</button>';
      } else if (LK.hazir && !son) {
        dugme = '<div class="lk-not" style="margin:0">Sonraki: ' + bd.toLocaleString('tr') + '🪙</div>';
      }
      h += '<div class="lk-bina"><div class="ik">' + b.ik + '</div><div class="ad">' + b.ad + '</div>'
        + '<div class="sv">Sv.' + s + ' / ' + MAX + '</div>'
        + '<div class="bn">+%' + s + '</div><div class="sv">' + b.etki + '</div>'
        + '<div class="bar"><i style="width:' + (s / MAX * 100) + '%"></i></div>' + dugme + '</div>';
    });
    h += '</div><div class="lk-not">Bonuslar loncadaki herkese geçer · Hazineye bağış yaparak binaları büyütün'
      + (LK.hazir && !yetkili ? ' · Geliştirmeyi Lider ve Subay yapar (senin rolün: ' + ({ member: 'Üye', officer: 'Subay', leader: 'Lider' }[G.guildRole] || G.guildRole || '?') + ')' : '') + '</div></div>';
    return h;
  }
  function cizBolum() {
    var kap = document.getElementById('guild-content');
    if (!kap || !G.guildId) return;
    var eskiS = document.getElementById('lk-sec'), eskiB = document.getElementById('lk-bolum');
    if (eskiS) eskiS.remove(); if (eskiB) eskiB.remove();
    var banner = kap.querySelector('.gd-banner');
    if (!banner) return;
    banner.insertAdjacentHTML('afterend', bolumHTML());
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
