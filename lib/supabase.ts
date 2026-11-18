import { createClient, type SupabaseClient } from "@supabase/supabase-js";


export type Player = {
  id: number | string;
  ign: string;
  discord_id: string | null;
  overall_tier: string | null;
  overall_points: number | null;
  sword_tier: string | null;
  sword_peak_tier: string | null;
  sword_points: number | null;
  axe_tier: string | null;
  axe_peak_tier: string | null;
  axe_points: number | null;
  mace_tier: string | null;
  mace_peak_tier: string | null;
  mace_points: number | null;
  diapot_tier: string | null;
  diapot_peak_tier: string | null;
  pot_points: number | null;
  nethpot_tier: string | null;
  nethpot_peak_tier: string | null;
  nethpot_points: number | null;
  smp_tier: string | null;
  smp_peak_tier: string | null;
  smp_points: number | null;
  crystal_tier: string | null;
  crystal_peak_tier: string | null;
  vanilla_points: number | null;
  uhc_tier: string | null;
  uhc_peak_tier: string | null;
  uhc_points: number | null;
  spearmace_tier: string | null;
  spearmace_peak_tier: string | null;
  spearmace_points: number | null;
  diasmp_tier: string | null;
  diasmp_peak_tier: string | null;
  diasmp_points: number | null;
  manhunt_tier: string | null;
  manhunt_peak_tier: string | null;
  manhunt_points: number | null;
  shieldlessuhc_tier: string | null;
  shieldlessuhc_peak_tier: string | null;
  shieldlessuhc_points: number | null;
  cart_tier: string | null;
  cart_peak_tier: string | null;
  cart_points: number | null;
  created_at: string | null;
  [key: string]: unknown;
};

export type HallOfFameEntry = {
  id: number | string;
  ign: string;
  title: string | null;
  description: string | null;
  image: string | null;
  created_at: string | null;
};

export const PLAYER_COLUMNS = [
  "id",
  "ign",
  "discord_id",
  "overall_tier",
  "overall_points",
  "sword_tier",
  "sword_peak_tier",
  "sword_points",
  "axe_tier",
  "axe_peak_tier",
  "axe_points",
  "mace_tier",
  "mace_peak_tier",
  "mace_points",
  "diapot_tier",
  "diapot_peak_tier",
  "pot_points",
  "nethpot_tier",
  "nethpot_peak_tier",
  "nethpot_points",
  "smp_tier",
  "smp_peak_tier",
  "smp_points",
  "crystal_tier",
  "crystal_peak_tier",
  "vanilla_points",
  "uhc_tier",
  "uhc_peak_tier",
  "uhc_points",
  "spearmace_tier",
  "spearmace_peak_tier",
  "spearmace_points",
  "diasmp_tier",
  "diasmp_peak_tier",
  "diasmp_points",
  "manhunt_tier",
  "manhunt_peak_tier",
  "manhunt_points",
  "shieldlessuhc_tier",
  "shieldlessuhc_peak_tier",
  "shieldlessuhc_points",
  "cart_tier",
  "cart_peak_tier",
  "cart_points",
  "created_at",
] as const;


export function publicClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = publicKey();
  if (!url || !key) throw new Error("Supabase public credentials are not configured");
  return createClient(url, key, { auth: { persistSession: false } });
}


export function adminClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Supabase service role credentials are not configured");
  if (!serviceKeyUsable()) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY belongs to a different Supabase project than NEXT_PUBLIC_SUPABASE_URL");
  }
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}


function projectRef(key: string | undefined): string | null {
  try {
    const payload = JSON.parse(Buffer.from(key!.split(".")[1], "base64").toString("utf8"));
    return typeof payload.ref === "string" ? payload.ref : null;
  } catch {
    return null;
  }
}


export function publicKey(): string | undefined {
  return process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
}


export function serviceKeyUsable(): boolean {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!key || !url) return false;
  const ref = projectRef(key);
  return ref ? url.includes(ref) : true;
}


export function readClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = serviceKeyUsable() ? process.env.SUPABASE_SERVICE_ROLE_KEY : publicKey();
  if (!url || !key) throw new Error("Supabase credentials are not configured");
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}


export async function fetchAllPlayers(client: SupabaseClient): Promise<Player[]> {
  const PAGE = 1000;
  const rows: Player[] = [];
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await client
      .from("players")
      .select(PLAYER_COLUMNS.join(","))
      .order("overall_points", { ascending: false, nullsFirst: false })
      .order("ign", { ascending: true })
      .range(from, from + PAGE - 1);
    if (error) throw new Error(error.message);
    const page = (data ?? []) as unknown as Player[];
    rows.push(...page);
    if (page.length < PAGE) break;
  }
  return rows;
}

export async function fetchHallOfFame(client: SupabaseClient): Promise<HallOfFameEntry[]> {
  const { data, error } = await client
    .from("hall_of_fame")
    .select("id, ign, title, description, image, created_at")
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as HallOfFameEntry[];
}
