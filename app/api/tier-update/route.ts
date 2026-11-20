import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { timingSafeEqual } from "node:crypto";
import { normalizeTier, resolveGamemode, GAMEMODES, TIERS, pointsForTier, activeFromTier } from "@/lib/tiers";
import { serviceKeyUsable } from "@/lib/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const GAMEMODE_COLUMNS = [
  "sword_tier", "sword_peak_tier", "sword_points",
  "mace_tier", "mace_peak_tier", "mace_points",
  "axe_tier", "axe_peak_tier", "axe_points",
  "diapot_tier", "diapot_peak_tier", "pot_points",
  "nethpot_tier", "nethpot_peak_tier", "nethpot_points",
  "smp_tier", "smp_peak_tier", "smp_points",
  "crystal_tier", "crystal_peak_tier", "vanilla_points",
  "uhc_tier", "uhc_peak_tier", "uhc_points",
  "spearmace_tier", "spearmace_peak_tier", "spearmace_points",
  "diasmp_tier", "diasmp_peak_tier", "diasmp_points",
  "manhunt_tier", "manhunt_peak_tier", "manhunt_points",
  "shieldlessuhc_tier", "shieldlessuhc_peak_tier", "shieldlessuhc_points",
  "cart_tier", "cart_peak_tier", "cart_points",
] as const;

type Row = Record<string, string | null>;

function json(status: number, body: Record<string, unknown>) {
  return NextResponse.json(body, { status, headers: { "Cache-Control": "no-store" } });
}

function safeEqual(a: string, b: string) {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  return ab.length === bb.length && timingSafeEqual(ab, bb);
}


function computeStats(row: Row) {
  let points = 0;
  for (const g of GAMEMODES) {
    const n = pointsForTier(row[g.tierColumn] as string | null);
    if (n) points += n;
  }
  return points;
}

export async function POST(req: Request) {
  const secret = process.env.BOT_SECRET;
  const provided = req.headers.get("x-bot-secret") ?? "";
  if (!secret) return json(500, { error: "Server is missing BOT_SECRET" });
  if (!provided || !safeEqual(provided, secret)) return json(401, { error: "Invalid bot secret" });

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return json(400, { error: "Body must be valid JSON" });
  }

  const discordId = typeof body.discordId === "string" ? body.discordId.trim() : typeof body.discordId === "number" ? String(body.discordId).trim() : "";
  const ign = typeof body.ign === "string" ? body.ign.trim() : "";
  const rawTier = body.tier;
  const noTier = rawTier === undefined || rawTier === null || String(rawTier).trim() === "" || ["NO TIER", "NONE", "UNRANKED", "UNR", "N/A", "NA", "-", "UNTESTED"].includes(String(rawTier).trim().toUpperCase());
  let tier: (typeof TIERS)[number] | null = null;
  if (!noTier) {
    tier = normalizeTier(rawTier);
    if (!tier) return json(422, { error: `tier must be one of ${TIERS.join(", ")} or empty for no tier` });
  }
  const hasGamemode = body.gamemode !== undefined && body.gamemode !== null && String(body.gamemode).trim() !== "";
  const gamemode = hasGamemode ? resolveGamemode(body.gamemode) : null;
  if (hasGamemode && !gamemode) return json(422, { error: "gamemode must be one of Sword, Mace, Axe, Crystal, NethPot, DiaPot, SMP, UHC, SpearMace, Diamond SMP, Manhunt, ShieldLess UHC, Cart" });
  if (tier && !gamemode) return json(422, { error: "gamemode is required when a tier is provided" });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceKey) return json(500, { error: "Server is missing Supabase credentials" });
  if (!serviceKeyUsable()) {
    return json(500, { error: "SUPABASE_SERVICE_ROLE_KEY belongs to a different Supabase project than NEXT_PUBLIC_SUPABASE_URL" });
  }
  const db = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });

  try {
    if (!ign) return json(400, { error: "ign is required" });

    let byDiscord: Record<string, unknown> | null = null;
    let e1: { message: string } | null = null;
    if (discordId) {
      const res = await db.from("players").select("*").eq("discord_id", discordId).limit(1).maybeSingle();
      byDiscord = (res.data as Record<string, unknown> | null) ?? null;
      e1 = res.error as { message: string } | null;
    }
    if (e1) return json(500, { error: `Database lookup failed: ${e1.message}` });

    let target = byDiscord as Record<string, unknown> | null;
    let action: "updated" | "linked" | "created" = "updated";

    if (!target) {
      const { data: candidates, error: e2 } = await db
        .from("players")
        .select("*")
        .ilike("ign", ign)
        .limit(5);
      if (e2) return json(500, { error: `Database lookup failed: ${e2.message}` });

      const exact = (candidates ?? []).find((r) => String(r.ign).toLowerCase() === ign.toLowerCase());
      if (exact) {
        if (exact.discord_id && String(exact.discord_id) !== discordId) {
          return json(409, {
            error: "IGN is already linked to a different Discord account",
            ign: exact.ign,
          });
        }
        target = exact;
        action = "linked";
      }
    }

    let tierColumn: string | null = null;
    let peakColumn: string | null = null;
    let pointsColumn: string | null = null;
    const update: Record<string, unknown> = {};
    if (gamemode) {
      tierColumn = gamemode.tierColumn;
      peakColumn = gamemode.peakColumn;
      pointsColumn = gamemode.pointsColumn;
      if (!(GAMEMODE_COLUMNS as readonly string[]).includes(tierColumn)) {
        return json(500, { error: "Invalid gamemode mapping" });
      }
      const activePeak = activeFromTier(tier);
      const incomingPeakStrength = pointsForTier(activePeak);
      let newPeak: string | null = activePeak;
      const existingPeakRaw = target ? (target as Record<string, unknown>)[peakColumn] : null;
      const existingPeak = typeof existingPeakRaw === "string" ? existingPeakRaw : null;
      if (existingPeak && pointsForTier(existingPeak) >= incomingPeakStrength) {
        newPeak = existingPeak;
      }
      if (!activePeak && existingPeak) newPeak = existingPeak;

      update[tierColumn] = tier;
      update[peakColumn] = newPeak;
      update[pointsColumn] = pointsForTier(tier);
    }

    let row: Record<string, unknown> | null = null;

    if (target) {
      const id = target.id;
      // Keep a stable profile: when an existing user changes their IGN, update the
      // stored IGN on the same record instead of creating a new profile.
      if (target.discord_id || discordId) {
        if (String(target.ign).toLowerCase() !== ign.toLowerCase()) {
          update.ign = ign;
        }
      }
      const payload = action === "linked" ? { ...update, discord_id: discordId || null } : { ...update };
      let data: Record<string, unknown> | null = null;
      let error: { code?: string; message: string } | null = null;
      if (Object.keys(payload).length > 0) {
        const res = await db.from("players").update(payload).eq("id", id).select("*").single();
        data = res.data as Record<string, unknown> | null;
        error = res.error as { code?: string; message: string } | null;
      } else {
        const res = await db.from("players").select("*").eq("id", id).single();
        data = res.data as Record<string, unknown> | null;
        error = res.error as { code?: string; message: string } | null;
      }

      if (error && error.code === "23505") {
        return json(409, { error: "Discord ID or IGN conflicts with another player profile" });
      }
      if (error) return json(500, { error: `Failed to update player: ${error.message}` });
      row = data;
    } else {
      const insertPayload: Record<string, unknown> = {
        discord_id: discordId || null,
        ign,
      };
      if (gamemode && tierColumn && peakColumn && pointsColumn) {
        insertPayload[tierColumn] = tier;
        insertPayload[peakColumn] = update[peakColumn];
        insertPayload[pointsColumn] = pointsForTier(tier);
      }

      const { data, error } = await db.from("players").insert(insertPayload).select("*").single();
      let inserted: Record<string, unknown> | null = data;

      if (error && error.code === "23505") {
        const { data: again } = await db.from("players").select("*").ilike("ign", ign).limit(1).maybeSingle();
        if (again) {
          const payload = again.discord_id ? { ...update } : { ...update, discord_id: discordId || null };
          let updateRes: { data: unknown; error: { message: string } | null };
          if (Object.keys(payload).length > 0) {
            updateRes = await db.from("players").update(payload).eq("id", again.id).select("*").single();
          } else {
            updateRes = await db.from("players").select("*").eq("id", again.id).single();
          }
          if (updateRes.error || !updateRes.data) return json(409, { error: "IGN or Discord ID conflicts with another profile" });
          inserted = updateRes.data as Record<string, unknown>;
          action = "linked";
        } else {
          return json(409, { error: "Discord ID or IGN already exists" });
        }
      } else if (error) {
        return json(500, { error: `Failed to create player: ${error.message}` });
      } else {
        action = "created";
      }
      row = inserted;
    }

    const r = row!;
    const modeTier = gamemode ? ((r[gamemode.tierColumn] as string | null) ?? null) : null;
    const body2: Record<string, unknown> = {
      success: true,
      action, // updated | linked | created
      player: {
        id: r.id,
        ign: r.ign,
        discordId: r.discord_id ?? null,
        gamemode: gamemode ? gamemode.id : null,
        overallTier: r.overall_tier ?? null,
        overallPoints: computeStats(r as Row),
      },
    };
    if (gamemode) {
      (body2.player as Record<string, unknown>)[gamemode.id] = {
        tier: modeTier,
        points: pointsForTier(modeTier),
      };
    }
    return json(200, body2);
  } catch (err) {
    return json(500, { error: err instanceof Error ? err.message : "Unexpected server error" });
  }
}

export async function GET() {
  return json(405, { error: "Method not allowed. Use POST with X-Bot-Secret." });
}
