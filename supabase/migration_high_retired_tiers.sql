-- =====================================================================
-- KairoTiers - support High (LT2/HT2/LT1/HT1) and Retired (RLT2/RHT2/RLT1/RHT1) tiers
-- Safe to re-run. Never drops data.
-- =====================================================================

-- 1. Allow all 14 tiers (plus legacy 'Unranked') on every tier column.
do $$
declare
  cols text[] := array[
    'overall_tier','sword_tier','axe_tier','mace_tier','diapot_tier',
    'nethpot_tier','smp_tier','crystal_tier','uhc_tier',
    'spearmace_tier','diasmp_tier','manhunt_tier','shieldlessuhc_tier','cart_tier'
  ];
  c text;
begin
  foreach c in array cols loop
    execute format('alter table public.players drop constraint if exists %I', c || '_check');
    execute format(
      'alter table public.players add constraint %I check (%I is null or %I in (%L,%L,%L,%L,%L,%L,%L,%L,%L,%L,%L,%L,%L,%L) or %I = %L)',
      c || '_check', c, c,
      'HT1','RHT1','LT1','RLT1','HT2','RHT2','LT2','RLT2','HT3','LT3','HT4','LT4','HT5','LT5',
      c, 'Unranked');
  end loop;
end $$;

-- 2. Refresh overall tier + points to recognise all 14 tiers (best = highest strength).
create or replace function public.refresh_player_overall()
returns trigger language plpgsql as $$
declare
  total integer;
  best  text;
begin
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
  where t in ('HT1','RHT1','LT1','RLT1','HT2','RHT2','LT2','RLT2','HT3','LT3','HT4','LT4','HT5','LT5')
  order by array_position(array['HT1','RHT1','LT1','RLT1','HT2','RHT2','LT2','RLT2','HT3','LT3','HT4','LT4','HT5','LT5'], t)
  limit 1;

  new.overall_points := total;
  if best is not null and (new.overall_tier is null or new.overall_tier not in ('HT1','RHT1','LT1','RLT1','HT2','RHT2','LT2','RLT2','HT3','LT3','HT4','LT4','HT5','LT5')) then
    new.overall_tier := best;
  end if;
  new.updated_at := now();
  return new;
end $$;

-- 3. Re-run refresh over existing rows (no data loss)
update public.players set overall_tier = overall_tier;