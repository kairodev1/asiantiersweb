import { NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/auth";
import { adminClient, serviceKeyUsable } from "@/lib/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const IGN_RE = /^[A-Za-z0-9_]{3,16}$/;

/** Postgres ids are numeric (int/bigint or identity). Detect the column type so inserts never need a client-supplied id. */
let idKind: "number" | "uuid" | "text" | null = null;

async function detectIdKind(db: ReturnType<typeof adminClient>): Promise<"number" | "uuid" | "text"> {
  if (idKind) return idKind;
  const { data } = await db.from("hall_of_fame").select("id").limit(1);
  const sample = data?.[0]?.id;
  if (sample === undefined) return (idKind = "number");
  if (typeof sample === "number") return (idKind = "number");
  if (typeof sample === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(sample)) return (idKind = "uuid");
  if (typeof sample === "string" && /^\d+$/.test(sample)) return (idKind = "number");
  return (idKind = "text");
}

type EntryInput = { ign: string; title: string; description: string; image: string | null };

function parseBody(body: Record<string, unknown>): { ok: true; value: EntryInput } | { ok: false; error: string } {
  const ign = typeof body.ign === "string" ? body.ign.trim() : "";
  if (!IGN_RE.test(ign)) return { ok: false, error: "IGN must be 3–16 letters, numbers or underscores." };

  const title = typeof body.title === "string" ? body.title.trim() : "";
  if (title.length < 1 || title.length > 80) return { ok: false, error: "Title is required (max 80 characters)." };

  const description = typeof body.description === "string" ? body.description.trim() : "";
  if (description.length > 2000) return { ok: false, error: "Description must be 2000 characters or fewer." };

  const rawImage = typeof body.image === "string" ? body.image.trim() : "";
  if (rawImage && !/^https?:\/\/\S+$/i.test(rawImage)) return { ok: false, error: "Image must be a valid http(s) URL." };

  return { ok: true, value: { ign, title, description, image: rawImage || null } };
}

async function guard() {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  // Writes require a service-role key that belongs to the configured project.
  if (!serviceKeyUsable()) {
    return NextResponse.json(
      { error: "Server is missing a valid SUPABASE_SERVICE_ROLE_KEY for this Supabase project." },
      { status: 500 },
    );
  }
  return null;
}

export async function GET() {
  const denied = await guard();
  if (denied) return denied;
  const { data, error } = await adminClient()
    .from("hall_of_fame")
    .select("id, ign, title, description, image, created_at")
    .order("created_at", { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ entries: data ?? [] }, { headers: { "Cache-Control": "no-store" } });
}

export async function POST(req: Request) {
  const denied = await guard();
  if (denied) return denied;

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  const parsed = parseBody(body);
  if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 422 });

  const db = adminClient();
  const kind = await detectIdKind(db);

  const insertPayload: Record<string, unknown> = { ...parsed.value };
  // Only send an id when the column has no default (legacy serial-less setups).
  if (kind === "uuid") {
    const { data: latest } = await db.from("hall_of_fame").select("id").order("created_at", { ascending: false }).limit(1);
    if (!latest || latest.length === 0) insertPayload.id = crypto.randomUUID();
  }

  let { data, error } = await db.from("hall_of_fame").insert(insertPayload).select().single();

  // Fallback: if the id column requires an explicit numeric value, derive one safely.
  if (error && /null value in column "id"/i.test(error.message)) {
    const { data: rows } = await db.from("hall_of_fame").select("id");
    const maxNumeric = Math.max(0, ...(rows ?? []).map((r) => Number(r.id)).filter((n) => Number.isFinite(n)));
    ({ data, error } = await db
      .from("hall_of_fame")
      .insert({ ...insertPayload, id: maxNumeric + 1 })
      .select()
      .single());
  }

  if (error) {
    const status = error.code === "23505" ? 409 : 500;
    return NextResponse.json({ error: error.message }, { status });
  }
  return NextResponse.json({ entry: data }, { status: 201 });
}

export async function PATCH(req: Request) {
  const denied = await guard();
  if (denied) return denied;

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  const id = body.id;
  if (id === undefined || id === null || id === "") return NextResponse.json({ error: "Entry id is required" }, { status: 400 });

  const parsed = parseBody(body);
  if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 422 });

  const { data, error } = await adminClient()
    .from("hall_of_fame")
    .update(parsed.value)
    .eq("id", id as string | number)
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: error.code === "PGRST116" ? 404 : 500 });
  return NextResponse.json({ entry: data });
}

export async function DELETE(req: Request) {
  const denied = await guard();
  if (denied) return denied;

  const id = new URL(req.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Entry id is required" }, { status: 400 });

  const { error, count } = await adminClient().from("hall_of_fame").delete({ count: "exact" }).eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (count === 0) return NextResponse.json({ error: "Entry not found" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
