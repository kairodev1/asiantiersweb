import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, BadgeCheck, CalendarDays, Crown, Trophy, Hash, Swords } from "lucide-react";
import { fetchAllPlayers, readClient, type Player } from "@/lib/supabase";
import { GAMEMODES, tierRank } from "@/lib/tiers";
import { bestTier, formatDate, formatNumber, peakFor, pointsFor, rankMap, tierFor, totalPoints } from "@/lib/data";
import { Head, TierBadge, DiscordMark } from "@/lib/ui";

export const dynamic = "force-dynamic";

async function findPlayer(ign: string) {
  const db = readClient();
  const { data } = await db
    .from("players")
    .select("*")
    .ilike("ign", ign.replace(/[%_\\]/g, "\\$&"))
    .limit(1)
    .maybeSingle();
  const player = (data as Player | null) ?? null;
  if (!player) return { player: null, players: [] as Player[] };
  try {
    return { player, players: await fetchAllPlayers(db) };
  } catch {
    return { player, players: [player] as Player[] };
  }
}

export async function generateMetadata({ params }: { params: Promise<{ ign: string }> }): Promise<Metadata> {
  const { ign } = await params;
  const name = decodeURIComponent(ign);
  return {
    title: `${name} — Player Profile`,
    description: `AsianTiers PvP tiers, points and ranking for ${name}.`,
  };
}

export default async function PlayerPage({ params }: { params: Promise<{ ign: string }> }) {
  const { ign } = await params;
  const decoded = decodeURIComponent(ign);
  const { player, players } = await findPlayer(decoded);
  if (!player) notFound();

  const overallRank = rankMap(players).get(player.ign.toLowerCase()) ?? null;
  const tier = bestTier(player);
  const points = totalPoints(player);
  const ranked = GAMEMODES.map((g) => ({ g, tier: tierFor(player, g.id), peak: peakFor(player, g.id), points: pointsFor(player, g.id) }));
  const rankedCount = ranked.filter((m) => m.tier).length;
  const bestMode = ranked.filter((m) => m.tier).sort((a, b) => tierRank(b.tier) - tierRank(a.tier))[0] ?? null;
  const bestPeak = ranked.map((m) => m.peak).filter(Boolean).sort((a, b) => tierRank(b) - tierRank(a))[0] ?? null;

  // Masked Discord ID — identifies ownership without exposing the full account ID.
  const discordMasked = player.discord_id ? `••••••${String(player.discord_id).slice(-4)}` : null;

  return (
    <div className="container-x nav-offset">
      <Link href="/ranking" className="inline-flex items-center gap-1.5 text-xs font-medium text-ink-400 transition hover:text-ink-100">
        <ArrowLeft className="h-3.5 w-3.5" /> Back to rankings
      </Link>

      {/* Header card */}
      <div className="card relative mt-4 overflow-hidden p-5 sm:p-7">
        <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-brand-500/10 blur-3xl" />
        <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center">
          <div className="relative shrink-0">
            <Head ign={player.ign} size={88} className="animate-fade-in ring-2 ring-slate-200" />
            <span className="absolute -bottom-2 -right-2 grid h-8 w-8 place-items-center rounded-xl bg-navy-800 ring-1 ring-slate-200">
              <BadgeCheck className="h-4 w-4 text-brand-400" />
            </span>
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="font-display text-3xl font-extrabold tracking-tight text-ink-100 sm:text-4xl">{player.ign}</h1>
              <TierBadge tier={tier} peak={bestPeak} size="lg" />
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-ink-300">
              <span className="inline-flex items-center gap-1.5">
                <Hash className="h-3.5 w-3.5 text-ink-400" />
                {overallRank ? <><b className="text-ink-100">#{overallRank}</b> overall</> : "Unranked"}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Trophy className="h-3.5 w-3.5 text-ink-400" />
                <b className="text-ink-100">{formatNumber(points)}</b> points
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Swords className="h-3.5 w-3.5 text-ink-400" />
                {rankedCount} of {GAMEMODES.length} gamemodes
              </span>
              <span className="inline-flex items-center gap-1.5">
                <CalendarDays className="h-3.5 w-3.5 text-ink-400" />
                Joined {formatDate(player.created_at)}
              </span>
              {discordMasked && (
                <span className="inline-flex items-center gap-1.5" title="Discord account linked (partially hidden)">
                  <DiscordMark className="h-3.5 w-3.5 text-ink-400" />
                  <span className="font-mono">{discordMasked}</span>
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Quick stats */}
      <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <MiniStat label="Overall tier" value={tier ? <span className="font-mono text-ink-100">{tier}</span> : "—"} />
        <MiniStat label="Overall rank" value={overallRank ? `#${overallRank}` : "—"} />
        <MiniStat label="Best gamemode" value={bestMode ? bestMode.g.name : "—"} />
        <MiniStat label="Gamemodes ranked" value={`${rankedCount}/${GAMEMODES.length}`} />
      </div>

      {/* Gamemode cards */}
      <h2 className="section-title mt-10 text-xl sm:text-2xl">Gamemode tiers</h2>
      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {ranked.map(({ g, tier: t, points: pts }) => {
          const modeRank = t ? (rankMap(players, g.id).get(player.ign.toLowerCase()) ?? null) : null;
          return (
            <div key={g.id} className={`card relative overflow-hidden p-4 ${t ? "card-hover" : "opacity-60"}`}>
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-ink-100">{g.name}</span>
                <TierBadge tier={t} peak={peakFor(player, g.id)} size="sm" />
              </div>
              <div className="mt-4 flex items-end justify-between">
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-ink-400">Points</p>
                  <p className="font-mono text-lg font-bold text-ink-100">{t ? formatNumber(pts) : "—"}</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] uppercase tracking-wider text-ink-400">Rank</p>
                  <p className="font-mono text-lg font-bold text-ink-100">{modeRank ? `#${modeRank}` : "—"}</p>
                </div>
              </div>
              <Link
                href={`/ranking?mode=${g.id}`}
                className="mt-3 block border-t border-slate-100 pt-2.5 text-center text-[11px] font-semibold text-ink-400 transition hover:text-brand-300"
              >
                {g.name} leaderboard →
              </Link>
            </div>
          );
        })}
      </div>

      {tier === "LT5" && (
        <div className="mt-6 flex items-center gap-3 rounded-2xl border border-mint-400/20 bg-mint-400/[0.05] px-4 py-3 text-sm text-mint-300/90">
          <Crown className="h-4 w-4 shrink-0 text-mint-300" /> Elite competitor - one of the strongest players on AsianTiers.
        </div>
      )}
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="card px-4 py-3">
      <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-ink-400">{label}</p>
      <p className="mt-1 font-display text-base font-bold text-ink-100">{value}</p>
    </div>
  );
}
