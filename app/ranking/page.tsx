import type { Metadata } from "next";
import { fetchAllPlayers, readClient, type Player } from "@/lib/supabase";
import { RankingClient } from "./ranking-client";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Rankings",
  description:
    "Live AsianTiers PvP leaderboard — overall points and tier-grouped rankings across Sword, Mace, Axe, Crystal, NethPot, DiaPot, SMP and UHC.",
};

export default async function RankingPage() {
  let players: Player[] = [];
  let error: string | null = null;
  try {
    players = await fetchAllPlayers(readClient());
  } catch (e) {
    error = e instanceof Error ? `Live data unavailable: ${e.message}` : "Live data unavailable.";
  }

  return (
    <div className="mx-auto w-full max-w-[1600px] px-4 nav-offset sm:px-8">
      <RankingClient initialPlayers={players} error={error} />
    </div>
  );
}