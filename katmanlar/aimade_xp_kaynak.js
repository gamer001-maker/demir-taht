/* ── XP KAYNAKLARI (Osman, 23 Kas) ──
   XP yalnız zindan, görev, kale çiftliği ve balıkçılık yerinden gelsin.
   KAPATILANLAR: arena galibiyeti (+30), keşif (+10), saha toplama (+15).
   Bina yükseltme XP'si şimdilik AÇIK ("sonra konuşalım").
   index.html'e dokunmaz: ilgili işlevler sarılır, çalıştıkları sürece gainXP susturulur. */
(function () {
  if (typeof gainXP !== 'function') return;
  let sustur = 0;
  const asilGainXP = gainXP;
  window.gainXP = function (n) {
    if (sustur > 0) return;
    return asilGainXP.apply(this, arguments);
  };
  const KAPALI = ['finishExplore', 'finishGather', '_gbEnd', '_abEnd'];
  for (const ad of KAPALI) {
    const asil = window[ad];
    if (typeof asil !== 'function') { console.warn('[xp-kaynak] bulunamadı:', ad); continue; }
    window[ad] = function () {
      sustur++;
      try { return asil.apply(this, arguments); }   // async ise XP anı ilk await'ten önce → yine susturulur
      finally {
        sustur--;
        // Arena sonuç ekranındaki "+30XP" yazısını kaldır (artık XP verilmiyor)
        if (ad[0] === '_') document.querySelectorAll('#arena-battle-result div, #goliath-result div').forEach(d => {
          if (d.children.length === 0 && d.textContent.includes('+30XP')) d.textContent = d.textContent.replace(' +30XP', '');
        });
      }
    };
  }
})();
