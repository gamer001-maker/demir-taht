-- ═══════════════════════════════════════════════════════════════════════
-- LONCA KALESİ (Osman, 23 Kas 2026) — Supabase SQL Editor'da bir kez çalıştırılır.
--
-- Loncanın ortak binaları: madenci (üyelerin altın kazancı +%), hasar (+%), xp (+%).
-- Her bina Sv.0–10, her seviye +%1 (en fazla %10).
-- Geliştirme bedeli lonca hazinesinden düşer: Sv → Sv+1 = 1000 × (Sv+1)²
--   (Sv1: 1.000 · Sv5: 25.000 · Sv10: 100.000 — toplam 385.000 bina başına)
-- Yalnız Lider ve Subay geliştirebilir. İşlem atomik (aynı anda iki tık çift harcamaz).
--
-- ⚠ Not: Hazine bir trigger ile korunuyorsa (gold_migration.sql), guild_treasury_tx'in
--   kullandığı izin/bayrak yöntemi aşağıdaki UPDATE'ten önce de uygulanmalı.
-- ═══════════════════════════════════════════════════════════════════════

alter table public.guilds
  add column if not exists buildings jsonb not null default '{}'::jsonb;

create or replace function public.guild_upgrade_building(p_guild_id text, p_key text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_role text;
  v_lv int;
  v_cost bigint;
  v_treasury bigint;
  v_buildings jsonb;
begin
  if p_key not in ('madenci', 'hasar', 'xp') then
    return jsonb_build_object('ok', false, 'error', 'Geçersiz bina');
  end if;

  select role into v_role from guild_members
   where guild_id::text = p_guild_id and profile_id = auth.uid();
  if v_role is null then
    return jsonb_build_object('ok', false, 'error', 'Bu loncanın üyesi değilsin');
  end if;
  if v_role not in ('leader', 'officer') then
    return jsonb_build_object('ok', false, 'error', 'Yalnız Lider ve Subay geliştirebilir');
  end if;

  -- Satırı kilitle: eşzamanlı iki geliştirme sırayla işlensin
  select coalesce(treasury, 0), coalesce(buildings, '{}'::jsonb)
    into v_treasury, v_buildings
    from guilds where id::text = p_guild_id
    for update;
  if not found then
    return jsonb_build_object('ok', false, 'error', 'Lonca bulunamadı');
  end if;

  v_lv := coalesce((v_buildings ->> p_key)::int, 0);
  if v_lv >= 10 then
    return jsonb_build_object('ok', false, 'error', 'Bina en üst seviyede');
  end if;
  v_cost := 1000 * (v_lv + 1) * (v_lv + 1);
  if v_treasury < v_cost then
    return jsonb_build_object('ok', false, 'error', 'Hazinede yeterli altın yok', 'cost', v_cost);
  end if;

  v_buildings := jsonb_set(v_buildings, array[p_key], to_jsonb(v_lv + 1), true);
  update guilds
     set treasury = treasury - v_cost,
         buildings = v_buildings
   where id::text = p_guild_id;

  return jsonb_build_object('ok', true, 'treasury', v_treasury - v_cost, 'buildings', v_buildings, 'cost', v_cost);
end;
$$;

revoke all on function public.guild_upgrade_building(text, text) from public;
grant execute on function public.guild_upgrade_building(text, text) to authenticated;
