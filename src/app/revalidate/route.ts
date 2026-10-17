import { timingSafeEqual } from "node:crypto";
import { revalidateTag } from "next/cache";
import { NextResponse } from "next/server";
import { TAGS } from "@/lib/content";

const ALLOWED = new Set<string>(Object.values(TAGS));

function secretMatches(given: string | null): boolean {
  const expected = process.env.REVALIDATE_SECRET;
  if (!expected || !given) return false;
  const a = Buffer.from(given);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

/**
 * Called by the backend after an admin creates, edits or deletes content.
 * Purges cached API data for the given tags, and with it every statically
 * rendered page that used that data.
 */
export async function POST(request: Request) {
  if (!process.env.REVALIDATE_SECRET) {
    return NextResponse.json({ ok: false, message: "Revalidation is not configured." }, { status: 503 });
  }
  if (!secretMatches(request.headers.get("x-revalidate-secret"))) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  const body = (await request.json().catch(() => ({}))) as { tags?: unknown };
  const tags = Array.isArray(body.tags) ? body.tags.filter((t): t is string => typeof t === "string" && ALLOWED.has(t)) : [];
  if (!tags.length) return NextResponse.json({ ok: false, message: "No valid tags." }, { status: 400 });

  for (const tag of tags) revalidateTag(tag);
  return NextResponse.json({ ok: true, revalidated: tags, at: Date.now() });
}
