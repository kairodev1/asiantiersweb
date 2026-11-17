import { NextResponse } from "next/server";
import { fetchAllPlayers, fetchHallOfFame, readClient } from "@/lib/supabase";

export const dynamic = "force-dynamic";

/** Public read endpoint for the client-side leaderboard and homepage. */
export async function GET() {
  try {
    // Service-role when usable, public read key otherwise.
    const db = readClient();
    const [players, hof] = await Promise.all([fetchAllPlayers(db), fetchHallOfFame(db).catch(() => [])]);
    return NextResponse.json(
      { players, hallOfFame: hof },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to load data" },
      { status: 500 },
    );
  }
}
