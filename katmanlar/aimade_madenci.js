/* ── KALE MADENCİSİ (Osman, 23 Kas) ──
   Kale haritasında Madenci NPC'si: zamanla demir + kil + az altın biriktirir, oyuncu "Topla" ile alır.
   Oyuncu kendi altınıyla geliştirir (Sv.1 bedava, en fazla Sv.10).
   Kayıt: G.ach._madenci = { lv, ts }  → profiles.ach_counters (jsonb) ile sunucuya gider, yeni sütun gerekmez.
   index.html'e dokunmaz; renderCastleMap sarılır. Değerler aşağıdaki AYAR tablosunda. */
(function () {
  if (typeof window.renderCastleMap !== 'function') return;

  var AYAR = {
    maxSv: 10,
    depoSaat: 8,                                   // bu kadar saatlik üretim birikir, sonra durur
    saatlik: function (sv) {                       // seviye başına saatlik üretim
      return { demir: sv * 1, kil: sv * 1, altin: sv * 4 };
    },
    gelistirmeBedeli: function (sv) { return 300 * sv * sv; },   // Sv → Sv+1 altın
    konum: { x: 47, y: 24, w: 16 },                // kale haritasında yer
    img: 'aimade_kale_madenci.webp',
  };
  var SAAT = 3600 * 1000;

  function simdi() { return (typeof _now === 'function') ? _now() : Date.now(); }
  function durum() {
    if (!G.ach) G.ach = {};
    var d = G.ach._madenci;
    if (!d || typeof d !== 'object' || !(d.lv >= 1)) { d = G.ach._madenci = { lv: 1, ts: simdi() }; }
    if (!(d.ts > 0) || d.ts > simdi()) d.ts = simdi();
    return d;
  }
  function birikmis() {
    var d = durum();
    var saat = Math.min(AYAR.depoSaat, (simdi() - d.ts) / SAAT);
    var s = AYAR.saatlik(d.lv);
    var maden = (typeof mineAmountMult === 'function') ? mineAmountMult() : 1;
    return {
      saat: saat,
      demir: Math.floor(s.demir * saat * maden),
      kil: Math.floor(s.kil * saat * maden),
      altin: Math.floor(s.altin * saat),
    };
  }
  function kaydet() { try { if (typeof currentUser !== 'undefined' && currentUser) sbSave(); } catch (e) { } }

  window.madenciTopla = function () {
    var b = birikmis();
    if (b.demir + b.kil + b.altin <= 0) { toast('⛏ Henüz toplanacak bir şey yok.'); return; }
    var d = durum();
    if (!G.prodInv) G.prodInv = {};
    G.prodInv.demir = (G.prodInv.demir || 0) + b.demir;
    G.prodInv.kil = (G.prodInv.kil || 0) + b.kil;
    G.gold += b.altin;
    // Kesirli kalan zaman kaybolmasın: yalnız tam toplanan kısım kadar ileri al (depo doluysa sıfırla)
    d.ts = b.saat >= AYAR.depoSaat ? simdi() : d.ts + Math.floor(b.saat * SAAT);
    if (typeof qAddSkill === 'function') qAddSkill('madencilik', 0.05);
    toast('⛏ Madenci: +' + b.demir + ' Demir, +' + b.kil + ' Kil, +' + b.altin + '🪙');
    if (typeof updateHUD === 'function') updateHUD();
    kaydet(); madenciAc();
  };

  window.madenciGelistir = function () {
    var d = durum();
    if (d.lv >= AYAR.maxSv) { toast('Madenci en üst seviyede.'); return; }
    var bedel = AYAR.gelistirmeBedeli(d.lv);
    if (G.gold < bedel) { toast('Yeterli altın yok! (' + bedel + '🪙 gerekli)'); return; }
    // Önce biriken toplanır (yeni seviye geçmiş zamana uygulanmasın)
    var b = birikmis();
    if (b.demir + b.kil + b.altin > 0) window.madenciTopla();
    G.gold -= bedel; d.lv++;
    if (typeof trackAch === 'function') trackAch('build');
    toast('⛏ Madenci Sv.' + d.lv + ' oldu!');
    if (typeof updateHUD === 'function') updateHUD();
    kaydet(); madenciAc();
  };

  function satir(ikon, ad, deger, renk) {
    return '<div style="display:flex;justify-content:space-between;padding:6px 10px;border-bottom:1px solid var(--border,#3a2a18);font-size:13px">'
      + '<span>' + ikon + ' ' + ad + '</span><b style="color:' + (renk || 'var(--gold2)') + '">' + deger + '</b></div>';
  }

  window.madenciAc = function () {
    var d = durum(), b = birikmis(), s = AYAR.saatlik(d.lv);
    var doluluk = Math.round(b.saat / AYAR.depoSaat * 100);
    var kalanDk = Math.max(0, Math.ceil((AYAR.depoSaat - b.saat) * 60));
    var son = d.lv >= AYAR.maxSv;
    var sn = son ? null : AYAR.saatlik(d.lv + 1);
    var bedel = son ? 0 : AYAR.gelistirmeBedeli(d.lv);
    var h = ''
      + '<div style="text-align:center;margin-bottom:10px">'
      + '<div style="font-size:40px;line-height:1">⛏</div>'
      + '<div style="font-family:var(--font-head);font-size:18px;color:var(--gold2);margin-top:4px">Madenci · Sv.' + d.lv + '</div>'
      + '<div style="font-size:11px;color:var(--ink3,#a89070)">Kalenin altındaki ocaklardan demir, kil ve biraz altın çıkarır.</div></div>'
      + '<div style="font-size:11px;color:var(--ink3,#a89070);margin:4px 2px">DEPO (' + doluluk + '%)' + (doluluk >= 100 ? ' — DOLU, üretim durdu' : ' — dolmasına ' + Math.floor(kalanDk / 60) + 's ' + (kalanDk % 60) + 'dk') + '</div>'
      + '<div style="height:8px;border-radius:4px;background:#0006;overflow:hidden;margin-bottom:8px"><div style="height:100%;width:' + doluluk + '%;background:linear-gradient(90deg,#8a6a2a,var(--gold2))"></div></div>'
      + '<div style="border:1px solid var(--border,#3a2a18);border-radius:8px;overflow:hidden;margin-bottom:10px">'
      + satir('⛏', 'Demir', b.demir) + satir('🪣', 'Kil', b.kil) + satir('🪙', 'Altın', b.altin) + '</div>'
      + '<button class="btn" style="width:100%;margin-bottom:12px" onclick="madenciTopla()"' + (b.demir + b.kil + b.altin <= 0 ? ' disabled' : '') + '>Topla</button>'
      + '<div style="font-size:11px;color:var(--ink3,#a89070);margin:4px 2px">SAATLİK ÜRETİM</div>'
      + '<div style="border:1px solid var(--border,#3a2a18);border-radius:8px;overflow:hidden;margin-bottom:10px">'
      + satir('⛏', 'Demir', s.demir + (sn ? ' → ' + sn.demir : ''))
      + satir('🪣', 'Kil', s.kil + (sn ? ' → ' + sn.kil : ''))
      + satir('🪙', 'Altın', s.altin + (sn ? ' → ' + sn.altin : '')) + '</div>'
      + (son
        ? '<div style="text-align:center;color:var(--gold2);font-size:13px">En üst seviye</div>'
        : '<button class="btn" style="width:100%" onclick="madenciGelistir()"' + (G.gold < bedel ? ' disabled' : '') + '>Geliştir → Sv.' + (d.lv + 1) + ' (' + bedel.toLocaleString('tr-TR') + '🪙)</button>');
    showGModal(h);
  };

  // Kale haritasına Madenci
  var asilKale = window.renderCastleMap;
  window.renderCastleMap = function () {
    asilKale.apply(this, arguments);
    var sahne = document.getElementById('castle-map-scene');
    if (!sahne) return;
    var k = AYAR.konum, dolu = birikmis().saat >= AYAR.depoSaat;
    sahne.insertAdjacentHTML('beforeend',
      '<div class="cmap-spot" style="left:' + k.x + '%;top:' + k.y + '%;width:' + k.w + '%;"'
      + ' onclick="event.stopPropagation();if(typeof _cmapEditMode!==\'undefined\'&&_cmapEditMode)return;madenciAc()" title="Madenci — demir, kil, altın">'
      + '<img src="images/' + AYAR.img + '" onerror="this.style.display=\'none\';this.nextElementSibling.style.display=\'block\'">'
      + '<div style="display:none;font-size:34px;line-height:1;text-align:center">⛏</div>'
      + '<div class="cmap-lbl">Madenci Sv.' + durum().lv + (dolu ? ' ❗' : '') + '</div></div>');
  };
})();
