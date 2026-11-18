import { NextResponse } from "next/server";
import { fetchAllPlayers, readClient } from "@/lib/supabase";
import { serializePlayers, filterByIgns, parseIgnsParam } from "@/lib/modPlayerSerializer";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const CACHE_HEADERS = {
  "Cache-Control": "public, max-age=30, s-maxage=60, stale-while-revalidate=300",
  "CDN-Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "X-Content-Type-Options": "nosniff",
};

function json(body: unknown, status = 200) {
  return NextResponse.json(body, { status, headers: CACHE_HEADERS });
}

export async function GET(request: Request) {
  try {
    const db = readClient();
    const rows = await fetchAllPlayers(db);
    let players = serializePlayers(rows as unknown as Record<string, unknown>[]);

    const url = new URL(request.url);
    const igns = parseIgnsParam(url.searchParams);
    if (igns !== null) {
      players = filterByIgns(players, igns);
    }

    return json({ schema: 1, count: players.length, players });
  } catch (error) {
    console.error("AsianTIERS MOD API ERROR:", error);
    return json({ error: "Player data is temporarily unavailable" }, 502);
  }
}

export function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CACHE_HEADERS });
}
