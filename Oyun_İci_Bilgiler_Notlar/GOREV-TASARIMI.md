# Görev Sistemi v3 + Unvanlar — Tasarım Taslağı

> Durum: **Adım 1, kategoriler + görev listesi + mekanik iskeleti** (2026-10-14).
> Sonraki adım: onaylanan listeye hikaye + "nasıl yapılır" metinleri, ardından görsel adları, en son sayılar + SQL + kod.
> Sayılar (adet, ödül) burada yalnızca fikir vermek için var; hepsi 4. adımda ölçülerek belirlenecek.

---

## 1. Temel kararlar

| Konu | Karar |
|---|---|
| Görev tipleri | **Süreli** (başlat → bekle) · **Hedefli** (bir şeyi N kez yap) · **Teslimat** (malzemeyi getir) |
| Liste | **Sabit.** Her görev her oyuncu için aynı → ileride wiki yazılabilir. Yalnız *Günlük* sabit havuzdan her gün 3 tane seçer |
| Zorluk | Görevler **kademeli**: oyuncunun seviye bandına göre (zindanla aynı bantlar: 1-9 / 10-19 / 20-29 / 30-39 / 40+) adet ve ödül büyür. Görev adı ve metni aynı kalır, sadece sayılar değişir → 5 ayrı görev yazmak gerekmez |
| Bölgeye özgü | Tek bir kategori bölgeye bağlı: **Bölge**. Seyahat edince yalnız o kategori değişir, gerisi her yerde aynı |
| Kayıt | **localStorage tamamen bırakılır.** Görev durumu Supabase'de, süreyi sunucu ölçer, ödül `_gold_apply` / `_xp_apply` üzerinden verilir |
| Arayüz | Sade. Listede yalnız **ad + ilerleme + ödül**. Hikaye ve "nasıl yapılır" yalnız görev detayına tıklanınca görünür |

### Görev nasıl kabul edilir?
- **Hedefli ve teslimat görevleri önce kabul edilir**, sayaç kabulden itibaren işler. Kabul etmeden kesilen canavar sayılmaz (yoksa görev ilk açıldığı an tamamlanırdı, görev olmaktan çıkardı).
- **Slotlar ayrı tutulur**: süreli görev 3 slot (bugünkü gibi), hedefli + teslimat 5 slot. Çiftlikte üretimi bırakmış biri süreli görev yaparken aynı anda zindan avı da üstlenebilsin.
- **Tekrarlanabilir** görevlerde bitince yorgunluk süresi (bugünkü `cd`). **Zincir** görevleri bir kez yapılır.

---

## 2. Kategoriler (ana ekran, 8 satır)

```
📖 Hikaye          (dokunulmaz, ileride ayrı iş olarak yeniden yazılır)
🌅 Günlük          her gün 3 görev: 1 meslek + 1 savaş + 1 şehir
⚒ Meslekler        alt menü: Tarım · Hayvancılık · Madencilik · Balıkçılık · Avcılık
🗺 Bölge            ← BÖLGEYE BAĞLI, seyahat edince değişir
🛡 Grup             parti sistemiyle, zindanda
🏘 Şehir İşleri      süreli, çevrimdışı ilerleyen işler
🌊 Dünya Olayları   Kraken (ileride başka olaylar)
🏰 Lonca           şimdilik olduğu gibi
```

**Eski kategorilerin akıbeti:**
- *Saldırı* → kaldırılır, yerini **Bölge** kategorisindeki gerçek zindan avları alır (kararın: "saldırı görevleri saldırarak olmalı").
- *Şehir-içi* + *Zamana Bağlı* → **Şehir İşleri** olarak birleşir.
- *Avlanma* (fare, tavşan… boz ayı) → **Meslekler › Avcılık** altına taşınır, süreli olarak kalır. Avcılık yeteneği eşikleriyle açılıyor ve iyi çalışıyor.
- *Grup Görevleri* (eski `gq_*`, SQL'i kayıp) → kaldırılır, yeni **Grup** kategorisi parti sistemine bağlanır.
- *Kraken* → **Dünya Olayları** altına.

---

## 3. Meslekler

Her meslekte iki tür görev var:
- **İşler** (tekrarlanabilir): kademeye göre büyüyen adet ve ödül.
- **Ustalık zinciri** (bir kez, 5 adım): her adım bir öncekinden zor. **Son adım = o mesleğin unvanı + seviyene uygun efsanevi ekipman.** Zindana hiç girmeyen oyuncu da efsanevi eşyaya ulaşabilsin diye.

### 🌾 Tarım
| id | Ad | Tip | Ne ister |
|---|---|---|---|
| `tr_degirmenci` | Değirmencinin Siparişi | Teslimat | Buğday + arpa |
| `tr_asci` | Aşçıbaşının Kileri | Teslimat | Patates + domates |
| `tr_hasat` | Hasat Zamanı | Hedefli | Tarladan N ürün topla |
| **Zincir** | **Toprağın Efendisi** | | 1) ilk hasat 2) 4 farklı ürün yetiştir 3) çiçek + yonca teslim et 4) çilek hasadı 5) büyük hasat → unvan **Toprak Ağası** |

### 🐄 Hayvancılık
| id | Ad | Tip | Ne ister |
|---|---|---|---|
| `hy_peynirci` | Peynircinin Siparişi | Teslimat | Süt |
| `hy_yorganci` | Yorgancı Ustası | Teslimat | Yün + tüy |
| `hy_arici` | Kovan Başında | Teslimat | Bal |
| **Zincir** | **Sürü Sahibi** | | 1) ilk hayvan 2) bir yavru büyüt 3) 3 farklı tür 4) at sahibi ol 5) bir birliği süvariye terfi ettir → unvan **Sürü Sahibi** |

### ⛏ Madencilik
| id | Ad | Tip | Ne ister |
|---|---|---|---|
| `md_demirci` | Demirci Ocağı | Teslimat | Demir |
| `md_comlekci` | Çömlekçinin Kili | Teslimat | Kil |
| `md_damar` | Derin Damar | Hedefli | N kez kazı yap |
| **Zincir** | **Dağın Kalbi** | | 1) ilk kazı 2) demir + kil 3) tuğla + çivi teslim et (İnşaa'ya bağlar) 4) iki farklı bölgede kazı 5) büyük cevher teslimatı → unvan **Cevher Ustası** |

### 🎣 Balıkçılık
| id | Ad | Tip | Ne ister |
|---|---|---|---|
| `bl_tezgah` | Balıkçı Tezgâhı | Teslimat | Herhangi N balık |
| `bl_nadir` | Nadir Av | Teslimat | Somon / yayın / köpekbalığı (kademeye göre) |
| `bl_ag` | Ağ Dolusu | Hedefli | N balık tut |
| **Zincir** | **Denizlerin Hâkimi** | | 1) ilk balık 2) tatlı + tuzlu su balığı 3) yemle 10 av 4) somon 5) köpekbalığı → unvan **Denizlerin Hâkimi** |

### 🏹 Avcılık
Mevcut 8 süreli av (Fare → Boz Ayı) **aynen kalır**, yalnız kategorisi değişir. Zincir eklenir:
| **Zincir** | **İz Sürücü** | | 1) Fare 2) Tavşan 3) Geyik 4) Bozkurt Sürüsü 5) Boz Ayı → unvan **İz Sürücü** |
|---|---|---|---|

---

## 4. Bölge (bölgeye bağlı kategori)

Her bölgede **aynı 3 kalıp**, içerik bölgeye göre değişir. 8 ayrı liste yazmıyoruz, 3 kalıbı 8 bölgeye uyguluyoruz.

| Kalıp | Tip | Ne ister |
|---|---|---|
| **Av** | Hedefli | Bu bölgenin zindanında N canavar kes. **Seçtiğin kademe ödülü belirler** (kademe artık seçilebildiği için Sv.40 kademe 1'de kasarsa az kazanır, kendiliğinden dengelenir) |
| **Muhafız** | Hedefli | Bu bölgenin labirentinde bir **sarı boss** kes (çıkmaz sokakların ucunda) |
| **Bölge Siparişi** | Teslimat | Bu bölgenin canavarlarına özgü parçalardan getir → **ucu açık**: yeni canavar parçaları eklendikçe sipariş listesi kendiliğinden genişler |

Ek olarak, kadrosu güçlü bölgelere bir **"adı konmuş av"** (belirli bir canavar):

| Bölge | Av adı | Hedef canavarlar | Adı konmuş av |
|---|---|---|---|
| Vaelys Tepesi | Tepelerin Temizliği | Jaguar, Kirpi, Kuduz Kirpi | — |
| Blacktide Koyu | Koyun Sürüngenleri | Engerek, İguana, Kobra | — |
| Stormreach Adaları | Ada Avı | Jaguar, İguana | — |
| Aethelgard Mağarası | Mağaranın Derinlikleri | Kirpi, Engerek, Kuduz Kirpi | — |
| **Frost Hill** | Buzul Seferi | Ak Kurt, Buz Domuzu, Kutup Ayısı, Yeti… | **Yeti Avı**, **Mamut Sürüsü** |
| **Brimstone Dağları** | Kızgın Taşlar | Akrep, İguana, çöl kadrosu | — |
| Maelstrom Geçiti | Girdabın Kıyısı | Buz Baykuşu, Donmuş İskelet, Buz Ejderi | (su canavarları gelince) |
| **Dustguard Çölü** | Kum Fırtınası | Bok Böceği, Çekirge, Akrepler, Sırtlan, Akbaba… | **Akbaba Sürüsü**, **Zırhlı Kertenkele** |

> Not: Maelstrom'un kadrosu zayıf (TODO 12). Su canavarları eklenene kadar oradaki "Av" genel havuzdan sayar.

---

## 5. Grup (parti sistemi)

Koşul: **gruptaki en az 2 kişi aynı odada** olmalı. İlerleme **grubun ortak sayacı**: kim keserse kessin hepsine sayılır, ödül her üyeye ayrı verilir (XP/altın bölüşümünden bağımsız).

| id | Ad | Ne ister |
|---|---|---|
| `gr_suru` | Sürü Dağıtma | Grupça N canavar kes (her bölge, her kademe) |
| `gr_sefer` | Labirent Seferi | Grupla bir labirentin bitiş odasına ulaş, kırmızı boss'u kes |
| `gr_cikmaz` | Çıkmaz Sokaklar | Aynı koşuda labirentin bütün sarı boss'larını kes (kademe 3+) |
| `gr_yolcu` | Uzak Diyarlar | Memleketi olmayan bir bölgede grupla av |
| `gr_dortkose` | Dört Köşe | **4 kişilik** grupla kademe 5 labirenti → **efsanevi silah** + unvan **Kader Ortağı** |

---

## 6. Şehir İşleri (süreli)

Eski Şehir-içi + Zamana Bağlı listesinden, ödülü anlamsız kalanlar ayıklanarak (Diplomatik Elçi, Kervan Muhafızı yalnız 25 XP veriyordu) **10 iş** kalır:

Toplayıcı · Seyis · Kılıç Hocası · Şehir Kütüphanesi · Demircilik Çıraklığı · Taverna İşleri · Pazar Hamalı · Şifalı Eller (sabah/akşam) · Gece Nöbeti (gece) · Ay Işığı Otçusu (gece)

Zaman dilimi şartı kalır. Gece oynayana ayrı işler sunmak iyi bir dokunuş.

---

## 7. Canavar parçaları (teslimatların yakıtı)

Eski 13 canavarın parçası zaten var (`MOB_DROPS`). **Yeni 17 canavarın hiç parçası yok.** Önerilen parçalar (anahtar = görsel adı):

| Canavar | Parça | Anahtar |
|---|---|---|
| Bok Böceği | Böcek Kabuğu | `bocekkabugu` |
| Dişli Çekirge | Çekirge Bacağı | `cekirgebacagi` |
| Çift Kuyruklu Akrep | Akrep Kuyruğu | `akrepkuyrugu` |
| Örümcek | Örümcek İpeği | `orumcekipegi` |
| Sırtlan | Sırtlan Dişi | `sirtlandisi` |
| Akbaba | Akbaba Tüyü | `akbabatuyu` |
| Zırhlı Kertenkele | Kertenkele Pulu | `kertenkelepulu` |
| Ak Kurt | Ak Kurt Postu | `akkurtpostu` |
| Buz Domuzu | Domuz Azı Dişi | `domuzazidisi` |
| Kutup Ayısı | Kutup Ayısı Postu | `kutupayisipostu` |
| Buz Baykuşu | Baykuş Tüyü | `baykustuyu` |
| Donmuş İskelet | Donmuş Kemik | `donmuskemik` |
| Mamut | Fildişi | `fildisi` |
| Yeti | Yeti Postu | `yetipostu` |
| Buz Trolü | Trol Yüreği | `trolyuregi` |
| Buz Golemi | Buz Kristali | `buzkristali` |
| Buz Ejderi | Buz Ejderi Pulu | `buzejderipulu` |

Kademe 3-5'teki eski canavarların ve boss'ların da parçası yoktu, onlar da eklendi (✅ kodda, 2026-10-14):

| Canavar | Parça | Anahtar |
|---|---|---|
| Ork Savaşçı | Ork Dişi | `orkdisi` |
| Ork Komutanı | Ork Komutan Nişanı | `orknisani` |
| Goblin Şefi | Goblin Tılsımı | `goblintilsimi` |
| Taş Golem | Golem Çekirdeği | `golemcekirdegi` |
| Kemik Golem | Kemik Tozu | `kemiktozu` |
| Vampir | Vampir Dişi | `vampirdisi` |
| Kadim Vampir | Vampir Pelerini | `vampirpelerini` |
| Mezar Zombisi | Mezar Kefeni | `mezarkefeni` |
| İblis Muhafız | İblis Boynuzu | `iblisboynuzu` |
| Şeytan (boss) | Şeytan Kuyruğu | `seytankuyrugu` |
| Kadim Şeytan (boss) | Cehennem Közü | `cehennemkozu` |
| Mini Ejderha (boss) | Ejder Pençesi | `ejderpencesi` |
| Kadim Ejderha (boss) | Ejder Yüreği | `ejderyuregi` |
| Altın Şövalye (boss) | Altın Mühür | `altinmuhur` |
| Nekromancer (boss) | Ruh Feneri | `ruhfeneri` |

- Normal canavarlar **parça** düşürür (kademe ne olursa olsun).
- **Geliştirme malzemeleri** (Ham Demir, Güç Rünesi, … Semavi Öz) **boss'lara ve üst kademelere** bağlanır (TODO 32 ile birleşir). Böylece "+9 için Semavi Öz" kovalamak zindanın derinine inmek demek olur.
- `Buz Kristali` aynı zamanda TODO 15'teki "Frost Hill bölgesel malzemesi". Tek taşla iki kuş.
- Teslimat şeması `{ ver: { anahtar: adet } }` olduğu için yeni bir parça eklemek **kod değişikliği istemez**, sadece görev tablosuna bir satır eklenir.
- 32 görsel gerekir (yukarıdaki iki tablo).

---

## 8. Unvan sistemi

**Rütbe ve unvan farklı şeyler.** Rütbe (Köylü → Komutan) seviyeden otomatik türüyor ve görev şartlarında kullanılıyor; unvan ise **kazanılır ve seçilir**. Rütbe arka planda şart olarak kalsın ama **ekranda gösterilmesin**, isimlerin yanında yalnız seçilen unvan görünsün. İkisi yan yana çıkarsa kalabalık olur, oysa sadelik istiyorsun.

⚠ İki çakışma var. **"Avcı" hem bir sınıf adı hem bir rütbe adı**, unvan olarak kullanılırsa üçüncü anlamı olur. Zindan unvanı **"Canavar Avcısı"** olsun. Rütbe listesindeki **"Şövalye"** de birlik türüyle ve kaldırılan sınıfla karışıyor; rütbe ekranda gösterilmeyeceği için sorun olmaz.

| Unvan | Nasıl kazanılır |
|---|---|
| **Sadık** | 100 görev tamamla |
| **Canavar Avcısı** | Zindanda 1.000 canavar kes |
| **Suikastçı** | 50 boss kes |
| **Ejderhakıran** | Kadim Ejderha'yı kes |
| **Labirent Ustası** | 5 kademenin hepsinde labirenti bitir |
| **Diyar Diyar** | 8 bölgenin hepsinde Bölge görevi tamamla |
| **Kader Ortağı** | Dört Köşe (grup) |
| **Yoldaş** | 50 grup görevi |
| **Kraken Avcısı** | 10 Kraken avı |
| **Buzulların Efendisi** | Frost Hill'in bütün bölge görevleri |
| **Çöl Kurdu** | Dustguard'ın bütün bölge görevleri |
| Toprak Ağası · Sürü Sahibi · Cevher Ustası · Denizlerin Hâkimi · İz Sürücü | Meslek zincirleri |

- **Seçim:** Ayarlar'da tek liste, kazanılanlar seçilebilir, kilitliler soluk. Unvanlar **yalnız görünüş**, stat vermez. Stat verselerdi herkes en güçlüsünü takardı ve "dilediğini kullanır" fikri ölürdü.
- **Görüneceği yerler:** global sohbet, taverna, zindanda isim etiketi, arena, profil.
- **Kayıt:** `profiles.titles` (kazanılanlar) + `profiles.active_title` (seçilen). Kazanma kararını **sunucu** verir. Unvan istemciden yazılabilirse herkes istediğini takar, bu da unvanın anlamını öldürür.

---

## 9. Sunucu mimarisi (localStorage'dan çıkış)

- **`quest_progress` tablosu**: `user_id, quest_id, state (aktif/bitti), progress, started_at, done_at, cd_until, tier`.
- **RPC'ler**:
  - `quest_accept(id)`: slot ve şart kontrolü, `started_at` sunucu saati.
  - `quest_claim(id)`: süreli görevde süreyi **sunucu** ölçer, ödülü `_gold_apply`/`_xp_apply` ile verir. Tekrarlanabilirde `cd_until` yazar.
  - `quest_deliver(id)`: teslimat.
  - `title_set(t)`: yalnız kazanılmış bir unvanı seçebilir.
- **Hedefli görevlerin sayacı:**
  - **Zindan kesimleri en sağlam kaynak.** `zd_claim_run` zaten koşu sonunda sunucuya gidiyor, yanına `kills: {canavarId: adet}` ve `bosses: [...]` eklenir. Sunucu görev sayaçlarını oradan ilerletir ve koşu tavanıyla birlikte sınırlar.
  - Grup görevleri aynı yoldan: her üyenin `zd_claim_run`'ı **parti sayacına** ekler.
- ⚠ **Dürüst sınır:** tarla/çiftlik/maden envanteri (`prodInv`) hâlâ istemcide kaydediliyor. Teslimat ve meslek görevleri bu yüzden ilk aşamada %100 hile korumalı olamaz. Ödül tavanıyla sınırlarız. Tam çözüm `prodInv`'in de sunucuya geçmesi, ayrı ve büyük bir iş.
- **Göç (kritik):** yetenek puanları (`G.skills`) bugün `quest_v1` + `quest_state` içinde. Yeni sisteme geçerken **ilk açılışta** ikisinin büyüğü alınıp yeni yere yazılır. Bir puan bile kaybolursa oyuncu bunu fark eder.

---

## 10. Görsel ihtiyacı (adlar 3. adımda kesinleşecek)

| Ne | Adet |
|---|---|
| Kategori arkaplanları (8 + meslek alt menüsü 5) | 13 |
| Görev görselleri (meslek işleri 15 + zincir 5 + grup 5 + şehir 10 + bölge kalıbı 3×8) | ~59 |
| Canavar parçaları | 32 |

Önerim: görev görselini **zorunlu tutmamak**. Görsel yoksa kategori arkaplanı kullanılır, sistem eksik görselle de bitmiş görünür. Görseller zamanla tek tek gelir.
