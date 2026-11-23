/* ── KAYIT YEDEĞİ: kervan / madenci / balıkçılık (24 Kas) ──
   Sorun: veritabanında profiles.ach_counters SÜTUNU YOK → oyun kaydederken o alanı sessizce atlıyor,
   G.ach içindeki her şey (G.ach._kervan, _madenci, _balik) sayfa yenilenince kayboluyordu.
   Çözüm (arkadaş SQL'i eklene kadar): bu üç kayıt her kayıtta G.castleLayout._aimade içine kopyalanır
   (castle_layout sütunu VAR ve her kayıtta bütün olarak yazılır). Oyunun yükleyicisi castle_layout'u
   yalnız {x,y} olarak süzdüğü için girişten hemen sonra ham castle_layout ayrıca okunup geri yüklenir.
   _aimade içinde x,y=0 vardır; kale haritası yalnız bilinen bina anahtarlarını okuduğu için görünmez.
   Kalıcı çözüm (arkadaş): alter table profiles add column if not exists ach_counters jsonb default '{}'::jsonb;
   index.html'e dokunmaz. */
(function () {
  var ANAHTARLAR = ['_kervan', '_madenci', '_balik'];
  var geriYuklendi = false, hamYedek = null;

  function yedekYaz() {
    if (!G) return;
    if (!G.castleLayout) G.castleLayout = {};
    var y = { x: 0, y: 0 };
    ANAHTARLAR.forEach(function (k) {
      var v = G.ach ? G.ach[k] : undefined;
      // Geri yükleme bitmeden kayıt olursa (nadir) sunucudaki eski yedeği koru, taze/boş değerle ezme
      if (!geriYuklendi && hamYedek && hamYedek[k] !== undefined) v = hamYedek[k];
      if (v !== undefined) y[k] = v;
    });
    G.castleLayout._aimade = y;
  }

  async function geriYukle() {
    try {
      if (typeof supa === 'undefined' || typeof currentUser === 'undefined' || !currentUser) return;
      var r = await supa.from('profiles').select('castle_layout').eq('id', currentUser.id).single();
      var ham = r && r.data && r.data.castle_layout && r.data.castle_layout._aimade;
      if (ham && typeof ham === 'object') {
        hamYedek = ham;
        if (!G.ach) G.ach = {};
        ANAHTARLAR.forEach(function (k) { if (ham[k] !== undefined) G.ach[k] = ham[k]; });
      }
    } catch (e) { console.warn('[ach-yedek]', e); }
    geriYuklendi = true;
    try {
      var kale = document.getElementById('gs-kale');
      if (kale && kale.style.display !== 'none' && typeof renderKale === 'function') renderKale();
      if (typeof window.renderWorldMap === 'function') window.renderWorldMap();
    } catch (e) { }
  }

  if (typeof window._sbSaveNow === 'function') {
    var asilKaydet = window._sbSaveNow;
    window._sbSaveNow = function () { try { yedekYaz(); } catch (e) { } return asilKaydet.apply(this, arguments); };
  }
  if (typeof window.sbLoadProfile === 'function') {
    var asilYukle = window.sbLoadProfile;
    window.sbLoadProfile = async function () {
      geriYuklendi = false; hamYedek = null;
      var r = await asilYukle.apply(this, arguments);
      await geriYukle();
      return r;
    };
  }
  // Katman, profil zaten yüklendikten sonra çalıştıysa (oturum açık) hemen geri yükle
  if (typeof currentUser !== 'undefined' && currentUser) geriYukle();
})();
