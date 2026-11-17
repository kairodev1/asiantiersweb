-- =====================================================================
-- AsianTiers - Peak Tier + Retired Tier support
-- Safe to re-run. Never drops data.
-- =====================================================================

-- 1. Add Peak Tier columns (one per gamemode) if missing
alter table public.players add column if not exists sword_peak_tier       text;
alter table public.players add column if not exists axe_peak_tier         text;
alter table public.players add column if not exists mace_peak_tier        text;
alter table public.players add column if not exists diapot_peak_tier      text;
alter table public.players add column if not exists nethpot_peak_tier     text;
alter table public.players add column if not exists smp_peak_tier         text;
alter table public.players add column if not exists crystal_peak_tier     text;
alter table public.players add column if not exists uhc_peak_tier         text;
alter table public.players add column if not exists spearmace_peak_tier   text;
alter table public.players add column if not exists diasmp_peak_tier      text;
alter table public.players add column if not exists manhunt_peak_tier     text;
alter table public.players add column if not exists shieldlessuhc_peak_tier text;
alter table public.players add column if not exists cart_peak_tier        text;

-- 2. Tier CHECK constraints: current/peak columns allow the supported tiers
do $$
declare
  cur text[] := array['overall_tier','sword_tier','axe_tier','mace_tier','diapot_tier','nethpot_tier','smp_tier','crystal_tier','uhc_tier','spearmace_tier','diasmp_tier','manhunt_tier','shieldlessuhc_tier','cart_tier'];
  pk text[] := array['sword_peak_tier','axe_peak_tier','mace_peak_tier','diapot_peak_tier','nethpot_peak_tier','smp_peak_tier','crystal_peak_tier','uhc_peak_tier','spearmace_peak_tier','diasmp_peak_tier','manhunt_peak_tier','shieldlessuhc_peak_tier','cart_peak_tier'];
  c text;
begin
  foreach c in array cur loop
    execute format('alter table public.players drop constraint if exists %I', c || '_check');
    execute format(
      'alter table public.players add constraint %I check (%I is null or %I in (%L,%L,%L,%L,%L,%L,%L,%L,%L,%L,%L,%L,%L,%L,%L,%L,%L,%L,%L,%L) or %I = %L)',
      c || '_check', c, c,
      'HT1','RHT1','LT1','RLT1','HT2','RHT2','LT2','RLT2','HT3','RHT3','LT3','RLT3','HT4','RHT4','LT4','RLT4','HT5','RHT5','LT5','RLT5',
      c, 'Unranked');
  end loop;
  foreach c in array pk loop
    execute format('alter table public.players drop constraint if exists %I', c || '_check');
    execute format(
      'alter table public.players add constraint %I check (%I is null or %I in (%L,%L,%L,%L,%L,%L,%L,%L,%L,%L) or %I = %L)',
      c || '_check', c, c,
      'HT1','LT1','HT2','LT2','HT3','LT3','HT4','LT4','HT5','LT5',
      c, 'Unranked');
  end loop;
end $$;

-- 3. Refresh trigger: peak tracking + points + overall
create or replace function public.refresh_player_overall()
returns trigger language plpgsql as $$
declare
  total integer;
  best  text;
begin
  -- Peak tracking: never decrease
  if new.sword_peak_tier is null then new.sword_peak_tier := nullif(regexp_replace(new.sword_tier, '^R', ''), ''); end if;
  if new.sword_tier is not null and new.sword_peak_tier is not null then
    if array_position(array['HT1','LT1','HT2','LT2','HT3','LT3','HT4','LT4','HT5','LT5'], regexp_replace(new.sword_tier, '^R', '')) <
       array_position(array['HT1','LT1','HT2','LT2','HT3','LT3','HT4','LT4','HT5','LT5'], new.sword_peak_tier) then
      new.sword_peak_tier := regexp_replace(new.sword_tier, '^R', '');
    end if;
  end if;

  if new.axe_peak_tier is null then new.axe_peak_tier := nullif(regexp_replace(new.axe_tier, '^R', ''), ''); end if;
  if new.axe_tier is not null and new.axe_peak_tier is not null then
    if array_position(array['HT1','LT1','HT2','LT2','HT3','LT3','HT4','LT4','HT5','LT5'], regexp_replace(new.axe_tier, '^R', '')) <
       array_position(array['HT1','LT1','HT2','LT2','HT3','LT3','HT4','LT4','HT5','LT5'], new.axe_peak_tier) then
      new.axe_peak_tier := regexp_replace(new.axe_tier, '^R', '');
    end if;
  end if;

  if new.mace_peak_tier is null then new.mace_peak_tier := nullif(regexp_replace(new.mace_tier, '^R', ''), ''); end if;
  if new.mace_tier is not null and new.mace_peak_tier is not null then
    if array_position(array['HT1','LT1','HT2','LT2','HT3','LT3','HT4','LT4','HT5','LT5'], regexp_replace(new.mace_tier, '^R', '')) <
       array_position(array['HT1','LT1','HT2','LT2','HT3','LT3','HT4','LT4','HT5','LT5'], new.mace_peak_tier) then
      new.mace_peak_tier := regexp_replace(new.mace_tier, '^R', '');
    end if;
  end if;

  if new.diapot_peak_tier is null then new.diapot_peak_tier := nullif(regexp_replace(new.diapot_tier, '^R', ''), ''); end if;
  if new.diapot_tier is not null and new.diapot_peak_tier is not null then
    if array_position(array['HT1','LT1','HT2','LT2','HT3','LT3','HT4','LT4','HT5','LT5'], regexp_replace(new.diapot_tier, '^R', '')) <
       array_position(array['HT1','LT1','HT2','LT2','HT3','LT3','HT4','LT4','HT5','LT5'], new.diapot_peak_tier) then
      new.diapot_peak_tier := regexp_replace(new.diapot_tier, '^R', '');
    end if;
  end if;

  if new.nethpot_peak_tier is null then new.nethpot_peak_tier := nullif(regexp_replace(new.nethpot_tier, '^R', ''), ''); end if;
  if new.nethpot_tier is not null and new.nethpot_peak_tier is not null then
    if array_position(array['HT1','LT1','HT2','LT2','HT3','LT3','HT4','LT4','HT5','LT5'], regexp_replace(new.nethpot_tier, '^R', '')) <
       array_position(array['HT1','LT1','HT2','LT2','HT3','LT3','HT4','LT4','HT5','LT5'], new.nethpot_peak_tier) then
      new.nethpot_peak_tier := regexp_replace(new.nethpot_tier, '^R', '');
    end if;
  end if;

  if new.smp_peak_tier is null then new.smp_peak_tier := nullif(regexp_replace(new.smp_tier, '^R', ''), ''); end if;
  if new.smp_tier is not null and new.smp_peak_tier is not null then
    if array_position(array['HT1','LT1','HT2','LT2','HT3','LT3','HT4','LT4','HT5','LT5'], regexp_replace(new.smp_tier, '^R', '')) <
       array_position(array['HT1','LT1','HT2','LT2','HT3','LT3','HT4','LT4','HT5','LT5'], new.smp_peak_tier) then
      new.smp_peak_tier := regexp_replace(new.smp_tier, '^R', '');
    end if;
  end if;

  if new.crystal_peak_tier is null then new.crystal_peak_tier := nullif(regexp_replace(new.crystal_tier, '^R', ''), ''); end if;
  if new.crystal_tier is not null and new.crystal_peak_tier is not null then
    if array_position(array['HT1','LT1','HT2','LT2','HT3','LT3','HT4','LT4','HT5','LT5'], regexp_replace(new.crystal_tier, '^R', '')) <
       array_position(array['HT1','LT1','HT2','LT2','HT3','LT3','HT4','LT4','HT5','LT5'], new.crystal_peak_tier) then
      new.crystal_peak_tier := regexp_replace(new.crystal_tier, '^R', '');
    end if;
  end if;

  if new.uhc_peak_tier is null then new.uhc_peak_tier := nullif(regexp_replace(new.uhc_tier, '^R', ''), ''); end if;
  if new.uhc_tier is not null and new.uhc_peak_tier is not null then
    if array_position(array['HT1','LT1','HT2','LT2','HT3','LT3','HT4','LT4','HT5','LT5'], regexp_replace(new.uhc_tier, '^R', '')) <
       array_position(array['HT1','LT1','HT2','LT2','HT3','LT3','HT4','LT4','HT5','LT5'], new.uhc_peak_tier) then
      new.uhc_peak_tier := regexp_replace(new.uhc_tier, '^R', '');
    end if;
  end if;

  if new.spearmace_peak_tier is null then new.spearmace_peak_tier := nullif(regexp_replace(new.spearmace_tier, '^R', ''), ''); end if;
  if new.spearmace_tier is not null and new.spearmace_peak_tier is not null then
    if array_position(array['HT1','LT1','HT2','LT2','HT3','LT3','HT4','LT4','HT5','LT5'], regexp_replace(new.spearmace_tier, '^R', '')) <
       array_position(array['HT1','LT1','HT2','LT2','HT3','LT3','HT4','LT4','HT5','LT5'], new.spearmace_peak_tier) then
      new.spearmace_peak_tier := regexp_replace(new.spearmace_tier, '^R', '');
    end if;
  end if;

  if new.diasmp_peak_tier is null then new.diasmp_peak_tier := nullif(regexp_replace(new.diasmp_tier, '^R', ''), ''); end if;
  if new.diasmp_tier is not null and new.diasmp_peak_tier is not null then
    if array_position(array['HT1','LT1','HT2','LT2','HT3','LT3','HT4','LT4','HT5','LT5'], regexp_replace(new.diasmp_tier, '^R', '')) <
       array_position(array['HT1','LT1','HT2','LT2','HT3','LT3','HT4','LT4','HT5','LT5'], new.diasmp_peak_tier) then
      new.diasmp_peak_tier := regexp_replace(new.diasmp_tier, '^R', '');
    end if;
  end if;

  if new.manhunt_peak_tier is null then new.manhunt_peak_tier := nullif(regexp_replace(new.manhunt_tier, '^R', ''), ''); end if;
  if new.manhunt_tier is not null and new.manhunt_peak_tier is not null then
    if array_position(array['HT1','LT1','HT2','LT2','HT3','LT3','HT4','LT4','HT5','LT5'], regexp_replace(new.manhunt_tier, '^R', '')) <
       array_position(array['HT1','LT1','HT2','LT2','HT3','LT3','HT4','LT4','HT5','LT5'], new.manhunt_peak_tier) then
      new.manhunt_peak_tier := regexp_replace(new.manhunt_tier, '^R', '');
    end if;
  end if;

  if new.shieldlessuhc_peak_tier is null then new.shieldlessuhc_peak_tier := nullif(regexp_replace(new.shieldlessuhc_tier, '^R', ''), ''); end if;
  if new.shieldlessuhc_tier is not null and new.shieldlessuhc_peak_tier is not null then
    if array_position(array['HT1','LT1','HT2','LT2','HT3','LT3','HT4','LT4','HT5','LT5'], regexp_replace(new.shieldlessuhc_tier, '^R', '')) <
       array_position(array['HT1','LT1','HT2','LT2','HT3','LT3','HT4','LT4','HT5','LT5'], new.shieldlessuhc_peak_tier) then
      new.shieldlessuhc_peak_tier := regexp_replace(new.shieldlessuhc_tier, '^R', '');
    end if;
  end if;

  if new.cart_peak_tier is null then new.cart_peak_tier := nullif(regexp_replace(new.cart_tier, '^R', ''), ''); end if;
  if new.cart_tier is not null and new.cart_peak_tier is not null then
    if array_position(array['HT1','LT1','HT2','LT2','HT3','LT3','HT4','LT4','HT5','LT5'], regexp_replace(new.cart_tier, '^R', '')) <
       array_position(array['HT1','LT1','HT2','LT2','HT3','LT3','HT4','LT4','HT5','LT5'], new.cart_peak_tier) then
      new.cart_peak_tier := regexp_replace(new.cart_tier, '^R', '');
    end if;
  end if;

  -- Points columns from current tier
  new.sword_points := case new.sword_tier when 'HT1' then 60 when 'RHT1' then 60 when 'LT1' then 45 when 'RLT1' then 45 when 'HT2' then 30 when 'RHT2' then 30 when 'LT2' then 20 when 'RLT2' then 20 when 'HT3' then 10 when 'RHT3' then 10 when 'LT3' then 6 when 'RLT3' then 6 when 'HT4' then 4 when 'RHT4' then 4 when 'LT4' then 3 when 'RLT4' then 3 when 'HT5' then 2 when 'RHT5' then 2 when 'LT5' then 1 when 'RLT5' then 1 else 0 end;
  new.axe_points := case new.axe_tier when 'HT1' then 60 when 'RHT1' then 60 when 'LT1' then 45 when 'RLT1' then 45 when 'HT2' then 30 when 'RHT2' then 30 when 'LT2' then 20 when 'RLT2' then 20 when 'HT3' then 10 when 'RHT3' then 10 when 'LT3' then 6 when 'RLT3' then 6 when 'HT4' then 4 when 'RHT4' then 4 when 'LT4' then 3 when 'RLT4' then 3 when 'HT5' then 2 when 'RHT5' then 2 when 'LT5' then 1 when 'RLT5' then 1 else 0 end;
  new.mace_points := case new.mace_tier when 'HT1' then 60 when 'RHT1' then 60 when 'LT1' then 45 when 'RLT1' then 45 when 'HT2' then 30 when 'RHT2' then 30 when 'LT2' then 20 when 'RLT2' then 20 when 'HT3' then 10 when 'RHT3' then 10 when 'LT3' then 6 when 'RLT3' then 6 when 'HT4' then 4 when 'RHT4' then 4 when 'LT4' then 3 when 'RLT4' then 3 when 'HT5' then 2 when 'RHT5' then 2 when 'LT5' then 1 when 'RLT5' then 1 else 0 end;
  new.pot_points := case new.diapot_tier when 'HT1' then 60 when 'RHT1' then 60 when 'LT1' then 45 when 'RLT1' then 45 when 'HT2' then 30 when 'RHT2' then 30 when 'LT2' then 20 when 'RLT2' then 20 when 'HT3' then 10 when 'RHT3' then 10 when 'LT3' then 6 when 'RLT3' then 6 when 'HT4' then 4 when 'RHT4' then 4 when 'LT4' then 3 when 'RLT4' then 3 when 'HT5' then 2 when 'RHT5' then 2 when 'LT5' then 1 when 'RLT5' then 1 else 0 end;
  new.nethpot_points := case new.nethpot_tier when 'HT1' then 60 when 'RHT1' then 60 when 'LT1' then 45 when 'RLT1' then 45 when 'HT2' then 30 when 'RHT2' then 30 when 'LT2' then 20 when 'RLT2' then 20 when 'HT3' then 10 when 'RHT3' then 10 when 'LT3' then 6 when 'RLT3' then 6 when 'HT4' then 4 when 'RHT4' then 4 when 'LT4' then 3 when 'RLT4' then 3 when 'HT5' then 2 when 'RHT5' then 2 when 'LT5' then 1 when 'RLT5' then 1 else 0 end;
  new.smp_points := case new.smp_tier when 'HT1' then 60 when 'RHT1' then 60 when 'LT1' then 45 when 'RLT1' then 45 when 'HT2' then 30 when 'RHT2' then 30 when 'LT2' then 20 when 'RLT2' then 20 when 'HT3' then 10 when 'RHT3' then 10 when 'LT3' then 6 when 'RLT3' then 6 when 'HT4' then 4 when 'RHT4' then 4 when 'LT4' then 3 when 'RLT4' then 3 when 'HT5' then 2 when 'RHT5' then 2 when 'LT5' then 1 when 'RLT5' then 1 else 0 end;
  new.vanilla_points := case new.crystal_tier when 'HT1' then 60 when 'RHT1' then 60 when 'LT1' then 45 when 'RLT1' then 45 when 'HT2' then 30 when 'RHT2' then 30 when 'LT2' then 20 when 'RLT2' then 20 when 'HT3' then 10 when 'RHT3' then 10 when 'LT3' then 6 when 'RLT3' then 6 when 'HT4' then 4 when 'RHT4' then 4 when 'LT4' then 3 when 'RLT4' then 3 when 'HT5' then 2 when 'RHT5' then 2 when 'LT5' then 1 when 'RLT5' then 1 else 0 end;
  new.uhc_points := case new.uhc_tier when 'HT1' then 60 when 'RHT1' then 60 when 'LT1' then 45 when 'RLT1' then 45 when 'HT2' then 30 when 'RHT2' then 30 when 'LT2' then 20 when 'RLT2' then 20 when 'HT3' then 10 when 'RHT3' then 10 when 'LT3' then 6 when 'RLT3' then 6 when 'HT4' then 4 when 'RHT4' then 4 when 'LT4' then 3 when 'RLT4' then 3 when 'HT5' then 2 when 'RHT5' then 2 when 'LT5' then 1 when 'RLT5' then 1 else 0 end;
  new.spearmace_points := case new.spearmace_tier when 'HT1' then 60 when 'RHT1' then 60 when 'LT1' then 45 when 'RLT1' then 45 when 'HT2' then 30 when 'RHT2' then 30 when 'LT2' then 20 when 'RLT2' then 20 when 'HT3' then 10 when 'RHT3' then 10 when 'LT3' then 6 when 'RLT3' then 6 when 'HT4' then 4 when 'RHT4' then 4 when 'LT4' then 3 when 'RLT4' then 3 when 'HT5' then 2 when 'RHT5' then 2 when 'LT5' then 1 when 'RLT5' then 1 else 0 end;
  new.diasmp_points := case new.diasmp_tier when 'HT1' then 60 when 'RHT1' then 60 when 'LT1' then 45 when 'RLT1' then 45 when 'HT2' then 30 when 'RHT2' then 30 when 'LT2' then 20 when 'RLT2' then 20 when 'HT3' then 10 when 'RHT3' then 10 when 'LT3' then 6 when 'RLT3' then 6 when 'HT4' then 4 when 'RHT4' then 4 when 'LT4' then 3 when 'RLT4' then 3 when 'HT5' then 2 when 'RHT5' then 2 when 'LT5' then 1 when 'RLT5' then 1 else 0 end;
  new.manhunt_points := case new.manhunt_tier when 'HT1' then 60 when 'RHT1' then 60 when 'LT1' then 45 when 'RLT1' then 45 when 'HT2' then 30 when 'RHT2' then 30 when 'LT2' then 20 when 'RLT2' then 20 when 'HT3' then 10 when 'RHT3' then 10 when 'LT3' then 6 when 'RLT3' then 6 when 'HT4' then 4 when 'RHT4' then 4 when 'LT4' then 3 when 'RLT4' then 3 when 'HT5' then 2 when 'RHT5' then 2 when 'LT5' then 1 when 'RLT5' then 1 else 0 end;
  new.shieldlessuhc_points := case new.shieldlessuhc_tier when 'HT1' then 60 when 'RHT1' then 60 when 'LT1' then 45 when 'RLT1' then 45 when 'HT2' then 30 when 'RHT2' then 30 when 'LT2' then 20 when 'RLT2' then 20 when 'HT3' then 10 when 'RHT3' then 10 when 'LT3' then 6 when 'RLT3' then 6 when 'HT4' then 4 when 'RHT4' then 4 when 'LT4' then 3 when 'RLT4' then 3 when 'HT5' then 2 when 'RHT5' then 2 when 'LT5' then 1 when 'RLT5' then 1 else 0 end;
  new.cart_points := case new.cart_tier when 'HT1' then 60 when 'RHT1' then 60 when 'LT1' then 45 when 'RLT1' then 45 when 'HT2' then 30 when 'RHT2' then 30 when 'LT2' then 20 when 'RLT2' then 20 when 'HT3' then 10 when 'RHT3' then 10 when 'LT3' then 6 when 'RLT3' then 6 when 'HT4' then 4 when 'RHT4' then 4 when 'LT4' then 3 when 'RLT4' then 3 when 'HT5' then 2 when 'RHT5' then 2 when 'LT5' then 1 when 'RLT5' then 1 else 0 end;

  total := coalesce(new.sword_points,0) + coalesce(new.axe_points,0) + coalesce(new.mace_points,0)
         + coalesce(new.pot_points,0)   + coalesce(new.nethpot_points,0) + coalesce(new.smp_points,0)
         + coalesce(new.vanilla_points,0) + coalesce(new.uhc_points,0)
         + coalesce(new.spearmace_points,0) + coalesce(new.diasmp_points,0) + coalesce(new.manhunt_points,0)
         + coalesce(new.shieldlessuhc_points,0) + coalesce(new.cart_points,0);

  select t into best from (
    select new.overall_tier as t
    union all select new.sword_tier union all select new.axe_tier union all select new.mace_tier
    union all select new.diapot_tier union all select new.nethpot_tier union all select new.smp_tier
    union all select new.crystal_tier union all select new.uhc_tier
    union all select new.spearmace_tier union all select new.diasmp_tier union all select new.manhunt_tier
    union all select new.shieldlessuhc_tier union all select new.cart_tier
  ) x
  where t in ('HT1','RHT1','LT1','RLT1','HT2','RHT2','LT2','RLT2','HT3','RHT3','LT3','RLT3','HT4','RHT4','LT4','RLT4','HT5','RHT5','LT5','RLT5')
  order by array_position(array['HT1','RHT1','LT1','RLT1','HT2','RHT2','LT2','RLT2','HT3','RHT3','LT3','RLT3','HT4','RHT4','LT4','RLT4','HT5','RHT5','LT5','RLT5'], t)
  limit 1;

  new.overall_points := total;
  if best is not null and (new.overall_tier is null or new.overall_tier not in ('HT1','RHT1','LT1','RLT1','HT2','RHT2','LT2','RLT2','HT3','RHT3','LT3','RLT3','HT4','RHT4','LT4','RLT4','HT5','RHT5','LT5','RLT5')) then
    new.overall_tier := best;
  end if;
  new.updated_at := now();
  return new;
end $$;

-- 4. Backfill peak tiers from existing current tiers (only where missing)
update public.players
set sword_peak_tier = coalesce(sword_peak_tier, nullif(regexp_replace(sword_tier, '^R', ''), ''))
where sword_peak_tier is null;
-- repeat not necessary; trigger on update will handle future. For existing rows, run a no-op update to invoke trigger:
update public.players set overall_tier = overall_tier;