/* ── SIRALAMA (Osman, 23 Kas) ──
   Krallık sıralaması profilden YETENEK menüsüne taşındı: ekranın üstünde "🌳 Yetenek Ağacı | 🏆 Sıralama" sekmeleri.
   Görünüm profildeki sıralama penceresiyle aynı (lb-* sınıfları). Sekmeler: ⚔ Güç (Seviye'nin yerine) · 🏟 Arena · 🛡 Loncalar.
   Altın ve Zafer sekmeleri kaldırıldı. Satır: isim + seviye; altında @lonca adı.
   GÜÇ = oyunun arena gücü (calcPow). Sunucuda sütunu yok → her kayıtta G.ach._guc olarak ach_counters'a yazılır,
   sıralama oradan okunur (yeni sütun gerekmez). Henüz oyuna girip kaydetmemiş oyuncuların gücü "—" görünür.
   Katman sırası: katman-agac'tan SONRA yüklenmeli (#ga ekranını kullanır). index.html'e dokunmaz. */
(function () {
  if (typeof window.agacAc !== 'function') return;

  /* 1) Gücü kayıtla birlikte sunucuya yaz */
  function gucYaz() {
    try { if (typeof calcPow === 'function' && G) { if (!G.ach) G.ach = {}; G.ach._guc = Math.round(calcPow()); } } catch (e) { }
  }
  ['sbSave', 'sbSaveNow'].forEach(function (ad) {
    var asil = window[ad];
    if (typeof asil !== 'function') return;
    window[ad] = function () { gucYaz(); return asil.apply(this, arguments); };
  });

  /* 2) Yetenek ekranına sekmeler + sıralama paneli */
  var css = document.createElement('style');
  css.textContent = [
    '.sr-sekmeler{display:flex;gap:6px;padding:8px 12px 0;background:#140f0a;border-bottom:1px solid #4a3220}',
    '.sr-sekme{flex:1;padding:9px 6px;border:1px solid #4a3220;border-bottom:none;border-radius:8px 8px 0 0;background:#1d150d;color:#b09870;font:600 13px var(--font-head,serif);cursor:pointer}',
    '.sr-sekme.aktif{background:#2a1f14;color:var(--gold2,#e8c56a);border-color:var(--gold,#c9a24a)}',
    '#sr-panel{flex:1;display:flex;flex-direction:column;min-height:0;padding:10px 12px;padding-bottom:max(10px,env(safe-area-inset-bottom))}',
    '#sr-panel[hidden]{display:none!important}',
    '#sr-panel .lb-body{flex:1;overflow-y:auto;max-height:none}',
    '.sr-sv{font-size:11px;color:var(--ink3,#a89070);font-weight:400;margin-left:6px;font-family:var(--font-body,system-ui)}',
    '.sr-not{font-size:11px;color:var(--ink3,#a89070);text-align:center;margin-top:8px}'
  ].join('');
  document.head.appendChild(css);

  var kok = document.getElementById('ga');
  if (!kok) return;
  var ust = kok.querySelector('.ga-ust');
  ust.insertAdjacentHTML('afterend',
    '<div class="sr-sekmeler"><button class="sr-sekme aktif" id="sr-s-agac">🌳 Yetenek Ağacı</button><button class="sr-sekme" id="sr-s-sira">🏆 Sıralama</button></div>'
    + '<div id="sr-panel" hidden>'
    + '<div class="lb-tabs"><div class="lb-tab active" id="sr-t-guc">⚔ Güç</div><div class="lb-tab" id="sr-t-arena">🏟 Arena</div><div class="lb-tab" id="sr-t-lonca">🛡 Loncalar</div></div>'
    + '<div class="lb-body" id="sr-govde"><div class="lb-loading">Yükleniyor...</div></div>'
    + '<div class="sr-not" id="sr-not"></div></div>');

  var AGAC_PARCALARI = ['#ga-yollar', '#ga-sahne', '#ga-alt', '#ga-sifirla', '#ga-puan'];
  var baslik = ust.querySelector('h2'), asilBaslik = baslik ? baslik.textContent : '';
  var sekme = 'agac', liste = 'guc';

  function goster(s) {
    sekme = s;
    document.getElementById('sr-s-agac').classList.toggle('aktif', s === 'agac');
    document.getElementById('sr-s-sira').classList.toggle('aktif', s === 'sira');
    AGAC_PARCALARI.forEach(function (q) { var e = kok.querySelector(q); if (e) e.style.display = s === 'agac' ? '' : 'none'; });
    document.getElementById('sr-panel').hidden = s !== 'sira';
    if (baslik) baslik.textContent = s === 'agac' ? asilBaslik : '🏆 Krallık Sıralaması';
    if (s === 'sira') yukle();
  }
  document.getElementById('sr-s-agac').onclick = function () { goster('agac'); };
  document.getElementById('sr-s-sira').onclick = function () { goster('sira'); };
  ['guc', 'arena', 'lonca'].forEach(function (k) {
    document.getElementById('sr-t-' + k).onclick = function () {
      liste = k;
      ['guc', 'arena', 'lonca'].forEach(function (x) { document.getElementById('sr-t-' + x).classList.toggle('active', x === k); });
      yukle();
    };
  });

  var asilAc = window.agacAc;
  window.agacAc = function () { var r = asilAc.apply(this, arguments); goster('agac'); return r; };
  window.siralamaAc = function () { asilAc(); goster('sira'); };

  /* 3) Listeler */
  function ikon(cid) { try { var c = CLASSES.find(function (x) { return x.id === cid; }); return (c && c.icon) || '⚔'; } catch (e) { return '⚔'; } }
  function sayi(n) { return (Number(n) || 0).toLocaleString('tr-TR'); }
  function benMi(r) { return r.username && r.username === G.username; }

  function ciz(satirlar, lonca) {
    var g = document.getElementById('sr-govde');
    if (!satirlar.length) { g.innerHTML = '<div class="lb-loading">Henüz kayıt yok.</div>'; return; }
    var sinif = function (r) { return r.ben ? 'lb-me' : r.sira === 1 ? 'lb-top1' : r.sira === 2 ? 'lb-top2' : r.sira === 3 ? 'lb-top3' : ''; };
    var rozet = function (n) { return n === 1 ? '🥇' : n === 2 ? '🥈' : n === 3 ? '🥉' : '#' + n; };
    g.innerHTML = satirlar.map(function (r) {
      return '<div class="lb-row ' + sinif(r) + '">'
        + '<div class="lb-rank ' + (r.sira <= 3 ? 'r' + r.sira : '') + '">' + rozet(r.sira) + '</div>'
        + '<div style="font-size:18px;flex-shrink:0">' + esc(r.ikon) + '</div>'
        + '<div class="lb-name"><div class="lb-name-hero">' + esc(r.ad)
        + (r.sv != null ? '<span class="sr-sv">Sv.' + r.sv + '</span>' : '')
        + (r.ben ? ' <span style="color:var(--gold);font-size:8px">◀ Sen</span>' : '') + '</div>'
        + '<div class="lb-name-user">' + esc(r.alt) + '</div></div>'
        + '<div class="lb-val">' + esc(r.deger) + '</div></div>';
    }).join('');
  }

  var yukleNo = 0;
  async function yukle() {
    var no = ++yukleNo, g = document.getElementById('sr-govde'), not = document.getElementById('sr-not');
    g.innerHTML = '<div class="lb-loading">Yükleniyor...</div>'; not.textContent = '';
    if (typeof supa === 'undefined') { g.innerHTML = '<div class="lb-loading">Sıralamayı görmek için giriş yap.</div>'; return; }
    try {
      if (liste === 'guc') {
        gucYaz();
        var r1 = await supa.from('profiles').select('hero_name,username,level,class_id,guild_name,guc:ach_counters->_guc').order('level', { ascending: false }).limit(1000);
        if (r1.error) {   // json yolu seçimi desteklenmezse: güçsüz, seviyeye göre
          r1 = await supa.from('profiles').select('hero_name,username,level,class_id,guild_name').order('level', { ascending: false }).limit(1000);
        }
        if (no !== yukleNo) return;
        if (r1.error || !r1.data) { g.innerHTML = '<div class="lb-loading">Veri alınamadı.</div>'; return; }
        var d = r1.data.map(function (r) {
          var guc = benMi(r) && G.ach && G.ach._guc ? G.ach._guc : (Number(r.guc) || 0);
          return { r: r, guc: guc };
        });
        d.sort(function (a, b) { return (b.guc - a.guc) || ((b.r.level || 0) - (a.r.level || 0)); });
        ciz(d.slice(0, 50).map(function (x, i) {
          return { sira: i + 1, ikon: ikon(x.r.class_id), ad: x.r.hero_name || '?', sv: x.r.level || 1, alt: x.r.guild_name ? '@' + x.r.guild_name : 'Loncasız', deger: x.guc ? sayi(x.guc) + ' güç' : '—', ben: benMi(x.r) };
        }));
        not.textContent = 'Güç: hasar, can, savunma ve seviyeden hesaplanır. Oyuncunun gücü oyuna girip kaydettiğinde güncellenir.';
      } else if (liste === 'arena') {
        var r2 = await supa.from('profiles').select('hero_name,username,level,class_id,guild_name,arena_score').order('arena_score', { ascending: false }).limit(50);
        if (no !== yukleNo) return;
        if (r2.error || !r2.data) { g.innerHTML = '<div class="lb-loading">Veri alınamadı.</div>'; return; }
        ciz(r2.data.map(function (r, i) {
          return { sira: i + 1, ikon: ikon(r.class_id), ad: r.hero_name || '?', sv: r.level || 1, alt: r.guild_name ? '@' + r.guild_name : 'Loncasız', deger: sayi(r.arena_score) + ' puan', ben: benMi(r) };
        }));
      } else {
        var r3 = await supa.from('guilds').select('name,emblem,level,guild_members(count)').order('level', { ascending: false }).limit(30);
        if (no !== yukleNo) return;
        if (r3.error || !r3.data) { g.innerHTML = '<div class="lb-loading">Veri alınamadı.</div>'; return; }
        var s = r3.data.slice().sort(function (a, b) {
          var ca = (a.guild_members && a.guild_members[0] && a.guild_members[0].count) || 0, cb = (b.guild_members && b.guild_members[0] && b.guild_members[0].count) || 0;
          return b.level !== a.level ? b.level - a.level : cb - ca;
        });
        ciz(s.map(function (r, i) {
          var c = (r.guild_members && r.guild_members[0] && r.guild_members[0].count) || '?';
          return { sira: i + 1, ikon: r.emblem || '🛡', ad: r.name || '?', sv: null, alt: c + ' üye', deger: 'Sv. ' + r.level, ben: r.name && r.name === G.guildName };
        }), true);
      }
    } catch (e) { if (no === yukleNo) g.innerHTML = '<div class="lb-loading">Veri alınamadı.</div>'; }
  }

  /* 4) Profilden krallık sıralaması bölümünü kaldır */
  if (typeof window.renderProfile === 'function') {
    var asilProfil = window.renderProfile;
    window.renderProfile = function () {
      var r = asilProfil.apply(this, arguments);
      document.querySelectorAll('.sec').forEach(function (sec) {
        if (sec.textContent.indexOf('KRALLIK SIRALAMALARIN') < 0) return;
        var n = sec.nextElementSibling;
        while (n && (n.classList.contains('rank-row') || /Sıralamaları görmek için/.test(n.textContent))) { var s = n.nextElementSibling; n.remove(); n = s; }
        sec.remove();
      });
      return r;
    };
  }
})();
