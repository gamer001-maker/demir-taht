# Zindan 6. ve 7. katman: sunucu tavanı

Hazırlayan: Osman + Ciro, 23 Kasım 2026

## Durum

Oyunda zindan artık 7 katman: 6. katman Sv.51–60, 7. katman Sv.61–70. Bu `katmanlar/aimade_zindan_7katman.js` dosyasında. Canavar değerleri 5. kademenin yaklaşık 1,8 katı.

Sunucu ise sadece 5 kademe tanıyor (`sql/xp_migration.sql`: `zd_start_run` / `zd_claim_run`, `c_xp` ve `c_gold` dizileri). Bu yüzden istemci şimdilik 6. ve 7. katmanı sunucuya **5 olarak bildiriyor**, ve iki katmanın ödülü 5. kademenin tavanıyla kırpılabiliyor.

Senin ölçümüne göre tahminim (t5 zirve 1383 XP/dk, tavan 4200):

| Katman | Tahmini zirve XP/dk | Bugünkü tavan (t5) | Kırpılır mı? |
|---|---|---|---|
| 6 | ~2.500 | 4.200 | Hayır |
| 7 | ~4.500 | 4.200 | **Evet** |

## Yapılması gereken (senin SQL dosyanda)

1. **`zd_start_run`**: `p_tier` için izin verilen aralığı 1–5'ten **1–7**'ye çıkar.
2. **`c_xp` dizisi**: 6. ve 7. elemanları ekle. Önerim (her biri öncekinin ~1,7 katı, senin "zirvenin ~3 katı" kuralınla):
   `1000, 1600, 2500, 3100, 4200, **7100**, **12000**` XP/dk
3. **`c_gold` dizisi**: aynı oranla 6. ve 7. elemanları ekle: t5 değeri × 1,7 ve × 2,9.
   - Not: istemcide artık altın yarıya indirildi (`aimade_altin_kitlik.js`, çarpan 0,5), yani gerçek altın tavanın çok altında kalır.

Bunları çalıştırınca bize haber ver. İstemcide 6–7'yi gerçek katman numarasıyla göndermeye başlarız (tek satırlık değişiklik). O zamana kadar 5 olarak gönderilmeye devam eder, yani hiçbir şey kırılmaz.
