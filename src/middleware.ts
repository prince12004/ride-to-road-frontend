import { NextResponse, type NextRequest } from "next/server";

/**
 * Applies the 301/302 redirects managed in Admin → SEO → Redirects.
 *
 * The active list is fetched from the API and kept in memory for a short
 * time, so a page view costs no extra request in the common case. If the API
 * is unreachable the site keeps working — it just doesn't redirect.
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
const TTL_MS = 30_000;
const FETCH_TIMEOUT_MS = 2_000;

interface RedirectRule {
  from: string;
  to: string;
  statusCode: 301 | 302;
}

let cache: { at: number; rules: Map<string, RedirectRule> } = { at: 0, rules: new Map() };
let inflight: Promise<void> | null = null;

async function refresh() {
  try {
    const res = await fetch(`${API_BASE}/api/seo/redirects`, { cache: "no-store", signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) });
    if (!res.ok) throw new Error(String(res.status));
    const body = (await res.json()) as { data?: RedirectRule[] };
    cache = { at: Date.now(), rules: new Map((body.data ?? []).map((r) => [r.from, r])) };
  } catch {
    // Keep serving the last known rules; try again after the TTL.
    cache = { ...cache, at: Date.now() };
  }
}

async function getRules() {
  if (Date.now() - cache.at > TTL_MS) {
    inflight ??= refresh().finally(() => {
      inflight = null;
    });
    // First request after boot waits for the list; later ones use the stale copy.
    if (cache.at === 0) await inflight;
  }
  return cache.rules;
}

function normalize(pathname: string) {
  let path = pathname;
  try {
    path = decodeURI(pathname);
  } catch {
    // keep the raw path
  }
  return path.length > 1 ? path.replace(/\/+$/, "") : path;
}

export async function middleware(request: NextRequest) {
  const rules = await getRules();
  if (rules.size === 0) return NextResponse.next();

  const rule = rules.get(normalize(request.nextUrl.pathname));
  if (!rule) return NextResponse.next();

  if (/^https?:\/\//i.test(rule.to)) return NextResponse.redirect(rule.to, rule.statusCode);

  const target = request.nextUrl.clone();
  const [path, query] = rule.to.split("?");
  target.pathname = path;
  if (query) target.search = `?${query}`;
  return NextResponse.redirect(target, rule.statusCode);
}

export const config = {
  // Public pages only: skip the API proxy, Next internals, admin and static files.
  matcher: ["/((?!api/|_next/|admin|revalidate|brand/|images/|favicon\\.ico|robots\\.txt|sitemap\\.xml).*)"],
};
