import Link from "next/link";
import { ArrowRight, Trophy, Users, ShieldCheck, Sparkles, ExternalLink, Crown, Flame, Swords, Activity } from "lucide-react";
import { fetchAllPlayers, fetchHallOfFame, readClient, type Player } from "@/lib/supabase";
import { GAMEMODES, DISCORD_INVITE, tierRank } from "@/lib/tiers";
import { bestTier, formatNumber, peakFor, tierFor, totalPoints, rankMap } from "@/lib/data";
import { TierBadge, Head, SectionHeader, Stat, Empty, DiscordMark, ModeIcon } from "@/lib/ui";

export const dynamic = "force-dynamic";

async function getSiteStats() {
  try {
    const { data } = await readClient().from("site_stats").select("id, player_count, test_count, member_count").order("id", { ascending: true }).limit(1);
    return data?.[0] ?? null;
  } catch {
    return null;
  }
}

export default async function HomePage() {
  let players: Player[] = [];
  let hof: Awaited<ReturnType<typeof fetchHallOfFame>> = [];
  let stats: { player_count?: number; test_count?: number; member_count?: number } | null = null;
  let error: string | null = null;

  try {
    const db = readClient();
    [players, hof, stats] = await Promise.all([fetchAllPlayers(db), fetchHallOfFame(db), getSiteStats()]);
  } catch (e) {
    error = e instanceof Error ? e.message : "Unable to load live data";
  }

  const ranked = players.filter((p) => bestTier(p));
  const topPlayers = [...ranked].sort((a, b) => totalPoints(b) - totalPoints(a) || tierRank(bestTier(b)) - tierRank(bestTier(a))).slice(0, 3);
  const ranks = rankMap(players);
  const previewRows = [...ranked]
    .sort((a, b) => totalPoints(b) - totalPoints(a) || a.ign.localeCompare(b.ign))
    .slice(0, 10)
    .map((player) => ({ player, rank: ranks.get(player.ign.toLowerCase()) ?? 0, points: totalPoints(player) }));

  const totalTierEntries = players.reduce((n, p) => n + GAMEMODES.filter((g) => tierFor(p, g.id)).length, 0);

  const modeLeaders = GAMEMODES.map((g) => {
    const best = players
      .filter((p) => tierFor(p, g.id))
      .sort((a, b) => tierRank(tierFor(b, g.id)) - tierRank(tierFor(a, g.id)))[0];
    return { g, leader: best ?? null };
  });

  return (
    <div className="container-x nav-offset animate-page-in">
      <section className="relative grid items-center gap-8 overflow-hidden rounded-3xl border border-slate-200 bg-navy-900/70 p-6 lg:grid-cols-[1.15fr_1fr] lg:p-10">
        <div className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-brand-500/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -right-24 h-72 w-72 rounded-full bg-mint-500/10 blur-3xl" />
        <div className="relative animate-fade-up">
          <span className="eyebrow">
            <Sparkles className="h-3 w-3" />
            Official AsianTiers PvP Tierlist
          </span>
          <h1 className="mt-4 font-display text-4xl font-extrabold leading-[1.02] tracking-tight text-ink-100 sm:text-5xl">
            The home of
            <br />
            <span className="text-mint-400">AsianTiers Minecraft</span>
            <br />
            PvP rankings.
          </h1>
          <p className="mt-5 max-w-xl text-base leading-relaxed text-ink-300 sm:text-lg">
            Verified tiers across thirteen competitive gamemodes. Track your rank, climb the ladder and prove you belong at the top.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link href="/ranking" className="btn-primary h-11 px-5">
              View rankings
              <ArrowRight className="h-4 w-4" />
            </Link>
            <a href={DISCORD_INVITE} target="_blank" rel="noreferrer" className="btn-mint h-11 px-5">
              <DiscordMark className="h-4 w-4" />
              Join the Discord
              <ExternalLink className="h-3.5 w-3.5 opacity-70" />
            </a>
          </div>
          <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-ink-400">
            <span className="inline-flex items-center gap-1.5">
              <ShieldCheck className="h-3.5 w-3.5 text-mint-400" /> Verified tester results
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Activity className="h-3.5 w-3.5 text-brand-300" /> Synced live from Discord
            </span>
          </div>
        </div>

        <div className="relative">
          {topPlayers.length > 0 ? (
            <div className="grid gap-3">
              {topPlayers.map((p, i) => (
                <Link
                  key={String(p.id)}
                  href={`/player/${encodeURIComponent(p.ign)}`}
                  className={`card card-hover flex animate-fade-up items-center gap-4 p-4 ${i === 0 ? "border-mint-400/40" : ""}`}
                  style={{ animationDelay: `${i * 70}ms` }}
                >
                  <span
                    className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl font-display text-sm font-extrabold ${
                      i === 0 ? "bg-mint-500 text-white" : "bg-navy-800 text-brand-600"
                    }`}
                  >
                    {i === 0 ? <Crown className="h-4 w-4" /> : `#${i + 1}`}
                  </span>
                  <Head ign={p.ign} size={40} className="ring-1 ring-slate-200" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-display font-bold text-ink-100">{p.ign}</p>
                    <p className="text-xs text-ink-400">{formatNumber(totalPoints(p))} points</p>
                  </div>
                  <TierBadge tier={bestTier(p)} peak={GAMEMODES.map((g) => peakFor(p, g.id)).filter(Boolean).sort((a, b) => tierRank(b) - tierRank(a))[0] ?? null} />
                </Link>
              ))}
            </div>
          ) : (
            <div className="card p-6">
              <Empty title="No rankings yet">Rankings appear here automatically as soon as testers submit results through Discord.</Empty>
            </div>
          )}
        </div>
      </section>

      <section className="mt-10 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Ranked players" value={formatNumber(ranked.length)} />
        <Stat label="Tier placements" value={formatNumber(totalTierEntries)} hint="Across 13 gamemodes" />
        <Stat
          label="Tests completed"
          value={stats?.test_count ? formatNumber(stats.test_count) : "—"}
          hint="Verified by AsianTiers testers"
        />
        <Stat label="Gamemodes" value={GAMEMODES.length} hint="Competitive ladders" />
      </section>

      {error && (
        <p className="mt-4 rounded-xl border border-brand-400/30 bg-navy-800 px-4 py-3 text-xs text-brand-300">
          Live data could not be loaded: {error}. Check the Supabase environment variables.
        </p>
      )}

      <section className="mt-12">
        <SectionHeader
          title="Leaderboard preview"
          subtitle="Top players on AsianTiers right now."
          action={
            <Link href="/ranking" className="btn-ghost h-9 px-3 text-[13px]">
              Full rankings <ArrowRight className="h-4 w-4" />
            </Link>
          }
        />
        {previewRows.length === 0 ? (
          <Empty title="No ranked players yet">Rankings appear once testers submit results.</Empty>
        ) : (
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[480px] border-collapse text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-left text-xs font-medium text-ink-400">
                    <th className="w-14 px-4 py-3 font-medium">Rank</th>
                    <th className="px-2 py-3 font-medium">Player</th>
                    <th className="w-28 px-4 py-3 text-right font-medium">Points</th>
                    <th className="w-28 px-2 py-3 text-center font-medium">Top tier</th>
                  </tr>
                </thead>
                <tbody>
                  {previewRows.map(({ player, rank, points }) => (
                    <tr key={String(player.id)} className="group border-t border-slate-200 transition hover:bg-navy-850">
                      <td className="px-4 py-3 align-middle">
                        <span className={`font-mono text-sm font-bold ${rank && rank <= 3 ? "text-mint-400" : "text-ink-400"}`}>
                          {rank ? `#${rank}` : "—"}
                        </span>
                      </td>
                      <td className="px-2 py-3 align-middle">
                        <Link href={`/player/${encodeURIComponent(player.ign)}`} className="flex items-center gap-2.5">
                          <Head ign={player.ign} size={28} className="ring-1 ring-slate-200" />
                          <span className="truncate text-[14px] font-semibold text-ink-100 transition group-hover:text-brand-300">{player.ign}</span>
                        </Link>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-right align-middle">
                        <span className="font-display text-base font-bold text-ink-100">{formatNumber(points)}</span>
                      </td>
                      <td className="px-2 py-3 text-center align-middle">
                        <TierBadge tier={bestTier(player)} size="xs" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>

      <section className="mt-12">
        <SectionHeader
          title="Gamemodes"
          subtitle="Thirteen competitive ladders, one ranking system."
          action={
            <Link href="/ranking" className="btn-ghost h-9 px-3 text-[13px]">
              All rankings <ArrowRight className="h-4 w-4" />
            </Link>
          }
        />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {modeLeaders.map(({ g, leader }) => (
            <Link key={g.id} href={`/ranking?mode=${g.id}`} className="card card-hover group p-4">
              <div className="flex items-center justify-between">
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-navy-800 ring-1 ring-inset ring-slate-200">
                  <ModeIcon id={g.id} size={26} />
                </span>
              </div>
              <p className="mt-3 font-display font-bold text-ink-100 transition group-hover:text-mint-300">{g.name}</p>
              {leader ? (
                <div className="mt-2.5 flex items-center justify-between">
                  <span className="flex min-w-0 items-center gap-2">
                    <Head ign={leader.ign} size={20} />
                    <span className="truncate text-xs text-ink-300">{leader.ign}</span>
                  </span>
                  <TierBadge tier={tierFor(leader, g.id)} peak={peakFor(leader, g.id)} size="sm" />
                </div>
              ) : (
                <p className="mt-2.5 text-xs text-ink-500">Awaiting the first tier</p>
              )}
            </Link>
          ))}
        </div>
      </section>

      <section className="mt-12 grid gap-4 lg:grid-cols-[1.1fr_1fr]">
        <div className="card p-5">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg font-bold text-ink-100">Gamemode leaders</h2>
            <Flame className="h-4 w-4 text-mint-400" />
          </div>
          <p className="mt-1 text-xs text-ink-500">The top-ranked player in each ladder, pulled live from the AsianTiers database.</p>
          <ul className="mt-3 space-y-1">
            {modeLeaders.map(({ g, leader }) => (
              <li key={g.id}>
                <Link href={`/ranking?mode=${g.id}`} className="flex items-center gap-3 rounded-lg px-1.5 py-2 transition duration-200 hover:bg-navy-850">
                  <ModeIcon id={g.id} size={20} />
                  <span className="w-24 shrink-0 text-xs font-semibold text-ink-300">{g.name}</span>
                  {leader ? (
                    <>
                      <Head ign={leader.ign} size={24} />
                      <span className="min-w-0 flex-1 truncate text-sm font-medium text-ink-100">{leader.ign}</span>
                      <TierBadge tier={tierFor(leader, g.id)} peak={peakFor(leader, g.id)} size="sm" />
                    </>
                  ) : (
                    <span className="text-xs text-ink-500">Awaiting the first tier</span>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div className="card p-5">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg font-bold text-ink-100">Hall of Fame</h2>
            <Trophy className="h-4 w-4 text-brand-300" />
          </div>
          <p className="mt-1 text-xs text-ink-500">Legends who shaped the AsianTiers PvP scene.</p>
          {hof.length ? (
            <ul className="mt-4 space-y-2">
              {hof.slice(0, 3).map((e) => (
                <li key={String(e.id)} className="flex items-center gap-3 rounded-xl bg-navy-800 p-2.5">
                  <Head ign={e.ign} size={32} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-ink-100">{e.ign}</p>
                    <p className="truncate text-[11px] text-mint-300">{e.title}</p>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-6 text-xs text-ink-500">The Hall of Fame is currently empty.</p>
          )}
          <Link href="/hall-of-fame" className="btn-ghost mt-4 h-9 w-full px-3 text-[13px]">
            View Hall of Fame <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      <section className="mt-12">
        <div className="rounded-3xl border border-slate-200 bg-navy-900 px-6 py-10 sm:px-10">
          <div className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-brand-300">
                <Users className="h-4 w-4" /> AsianTiers Community
              </div>
              <h2 className="mt-2 font-display text-2xl font-bold text-ink-100 sm:text-3xl">Get tested. Get ranked.</h2>
              <p className="muted mt-2 max-w-xl">Join the Discord to queue for tests, register your IGN and follow every tier update in real time.</p>
            </div>
            <a href={DISCORD_INVITE} target="_blank" rel="noreferrer" className="btn-mint h-11 shrink-0 px-5">
              <DiscordMark className="h-4 w-4" />
              Join Discord
            </a>
          </div>
        </div>
      </section>

      <p className="mt-10 flex items-center justify-center gap-2 text-[11px] text-ink-500">
        <Swords className="h-3.5 w-3.5" /> Tiers are earned through verified tests in the AsianTiers Discord.
      </p>
    </div>
  );
}