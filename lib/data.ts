import { GAMEMODES, cleanTier, pointsForTier, tierRank } from "./tiers";
import type { Player } from "./supabase";

export type ModeEntry = { gamemode: string; tier: string | null; points: number };

export function tierFor(player: Player, gamemodeId: string): string | null {
  const g = GAMEMODES.find((m) => m.id === gamemodeId);
  return g ? cleanTier(player[g.tierColumn]) : null;
}

export function peakFor(player: Player, gamemodeId: string): string | null {
  const g = GAMEMODES.find((m) => m.id === gamemodeId);
  return g ? cleanTier(player[g.peakColumn]) : null;
}


export function pointsFor(player: Player, gamemodeId: string): number {
  const tier = tierFor(player, gamemodeId);
  if (tier) return pointsForTier(tier);
  const g = GAMEMODES.find((m) => m.id === gamemodeId);
  const raw = g ? Number(player[g.pointsColumn]) : 0;
  return Number.isFinite(raw) && raw > 0 ? raw : 0;
}

export function modesOf(player: Player): ModeEntry[] {
  return GAMEMODES.map((g) => ({ gamemode: g.id, tier: tierFor(player, g.id), points: pointsFor(player, g.id) }));
}

export function rankedModes(player: Player) {
  return modesOf(player).filter((m) => m.tier);
}


export function totalPoints(player: Player): number {
  return GAMEMODES.reduce((sum, g) => sum + pointsFor(player, g.id), 0);
}


export function bestTier(player: Player): string | null {
  const stored = cleanTier(player.overall_tier);
  const ranked = rankedModes(player)
    .map((m) => m.tier!)
    .sort((a, b) => tierRank(b) - tierRank(a));
  const best = ranked[0] ?? null;
  if (stored && tierRank(stored) >= tierRank(best)) return stored;
  return best;
}

export function sortByPoints<T extends Player>(players: T[]): T[] {
  return [...players].sort((a, b) => totalPoints(b) - totalPoints(a) || a.ign.localeCompare(b.ign));
}


export function rankMap(players: Player[], gamemodeId?: string): Map<string, number> {
  const valueOf = (p: Player) => (gamemodeId ? pointsFor(p, gamemodeId) : totalPoints(p));
  const sorted = [...players]
    .filter((p) => (gamemodeId ? tierFor(p, gamemodeId) : Boolean(bestTier(p))))
    .sort((a, b) => valueOf(b) - valueOf(a) || a.ign.localeCompare(b.ign));

  const map = new Map<string, number>();
  sorted.forEach((p, i) => {
    const prev = sorted[i - 1];
    const rank = prev && valueOf(prev) === valueOf(p) ? map.get(prev.ign.toLowerCase())! : i + 1;
    map.set(p.ign.toLowerCase(), rank);
  });
  return map;
}


export const STEVE_HEAD = "https://mc-heads.net/avatar/MHF_Steve/128";

export function formatNumber(n: number) {
  return new Intl.NumberFormat("en-US").format(n);
}

export function formatDate(iso: string | null | undefined) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}
