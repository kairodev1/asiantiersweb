// Pure serializer for GET /api/mod/players (Minecraft TierTagger integration).
// Mirrors the KairoTiers mod API contract: { schema, count, players: [{ ign, gamemodes }] }.

export const TIER_COLUMNS: Record<string, string> = {
  sword: "sword_tier",
  axe: "axe_tier",
  mace: "mace_tier",
  diapot: "diapot_tier",
  nethpot: "nethpot_tier",
  smp: "smp_tier",
  crystal: "crystal_tier",
  uhc: "uhc_tier",
  spearmace: "spearmace_tier",
  diasmp: "diasmp_tier",
  manhunt: "manhunt_tier",
  shieldlessuhc: "shieldlessuhc_tier",
  cart: "cart_tier",
};

export const VALID_TIERS = new Set([
  "LT5", "HT5", "LT4", "HT4", "LT3", "HT3", "LT2", "HT2", "LT1", "HT1",
  "RLT5", "RHT5", "RLT4", "RHT4", "RLT3", "RHT3", "RLT2", "RHT2", "RLT1", "RHT1",
]);

function normalizeIgn(value: unknown): string {
  if (typeof value !== "string") return "";
  const ign = value.trim().replace(/\s+/g, " ");
  if (!ign || ign.length > 64) return "";
  if (/[\u0000-\u001F\u007F]/.test(ign)) return "";
  return ign;
}

function ignKey(value: string) {
  return value.toLowerCase();
}

export function normalizeTier(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const tier = value.trim().toUpperCase();
  return VALID_TIERS.has(tier) ? tier : null;
}

export function serializePlayers(rows: Record<string, unknown>[]): { ign: string; gamemodes: Record<string, string> }[] {
  if (!Array.isArray(rows)) return [];

  const players = new Map<string, { ign: string; gamemodes: Record<string, string> }>();

  for (const row of rows) {
    if (!row || typeof row !== "object") continue;
    const ign = normalizeIgn(row.ign);
    const key = ignKey(ign);
    if (!ign || !key) continue;

    let player = players.get(key);
    if (!player) {
      player = { ign, gamemodes: {} };
      players.set(key, player);
    }

    for (const [gamemode, column] of Object.entries(TIER_COLUMNS)) {
      if (player.gamemodes[gamemode]) continue;
      const tier = normalizeTier(row[column]);
      if (tier) player.gamemodes[gamemode] = tier;
    }
  }

  return [...players.values()].sort((a, b) =>
    a.ign.localeCompare(b.ign, "en", { sensitivity: "base" })
  );
}

export function filterByIgns(players: { ign: string; gamemodes: Record<string, string> }[], igns: string[]): { ign: string; gamemodes: Record<string, string> }[] {
  if (!Array.isArray(igns) || igns.length === 0) return players;
  const wanted = new Set(igns.map((v) => v.trim().toLowerCase()).filter(Boolean));
  if (wanted.size === 0) return [];
  return players.filter((p) => wanted.has(p.ign.trim().toLowerCase()));
}

export function parseIgnsParam(searchParams: URLSearchParams | null, max = 100) {
  if (!searchParams || !searchParams.has("igns")) return null;
  const raw = searchParams.get("igns") || "";
  return raw
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean)
    .slice(0, max);
}
