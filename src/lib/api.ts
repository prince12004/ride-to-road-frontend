export const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export class ApiClientError extends Error {
  status: number;
  details?: unknown;

  constructor(status: number, message: string, details?: unknown) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

interface ApiEnvelope<T> {
  success: boolean;
  message?: string;
  data: T;
  pagination?: { page: number; limit: number; total: number; pages: number };
}

/**
 * For Server Components / static content-layer functions. Talks directly to
 * the Express API — no browser cookies involved, public data only.
 */
export async function serverFetch<T>(
  path: string,
  options: RequestInit & { revalidate?: number; tags?: string[] } = {}
): Promise<ApiEnvelope<T>> {
  const { revalidate, tags, ...init } = options;
  const res = await fetch(`${API_BASE}/api${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...init.headers },
    // `tags` let the backend purge this data the moment an admin changes it
    // (see app/revalidate/route.ts); `revalidate` is only a safety net.
    next: { revalidate: revalidate ?? 30, ...(tags ? { tags } : {}) },
  });

  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiClientError(res.status, body.message ?? "Something went wrong.", body.details);
  return body;
}

const tokens: { user: string | null; admin: string | null } = { user: null, admin: null };

export function setAccessToken(token: string | null, scope: "user" | "admin") {
  tokens[scope] = token;
}

function scopeFor(path: string): "user" | "admin" {
  return path.startsWith("/admin") ? "admin" : "user";
}

function isAuthEndpoint(path: string) {
  return /\/(auth\/(refresh|login|request-otp|verify-otp|logout))$/.test(path);
}

async function rawFetch(path: string, options: RequestInit, scope: "user" | "admin") {
  const headers = new Headers(options.headers);
  if (!headers.has("Content-Type") && !(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }
  if (tokens[scope]) headers.set("Authorization", `Bearer ${tokens[scope]}`);
  return fetch(`/api${path}`, { ...options, headers, credentials: "include" });
}

/** Silently exchanges the refresh-token cookie for a new access token. Returns false if the session is truly gone. */
async function tryRefresh(scope: "user" | "admin"): Promise<boolean> {
  try {
    const res = await fetch(`/api/${scope === "admin" ? "admin/auth/refresh" : "auth/refresh"}`, {
      method: "POST",
      credentials: "include",
    });
    if (!res.ok) return false;
    const body = await res.json().catch(() => ({}));
    const accessToken = body?.data?.accessToken;
    if (!accessToken) return false;
    setAccessToken(accessToken, scope);
    const storeModule = scope === "admin" ? await import("@/store/admin-auth-store") : await import("@/store/auth-store");
    const useStore = scope === "admin" ? (storeModule as typeof import("@/store/admin-auth-store")).useAdminAuthStore : (storeModule as typeof import("@/store/auth-store")).useAuthStore;
    useStore.setState({ accessToken });
    return true;
  } catch {
    return false;
  }
}

/** Session is unrecoverable — clear it and bounce to the right login page immediately. */
async function forceLogout(scope: "user" | "admin") {
  setAccessToken(null, scope);
  if (scope === "admin") {
    const { useAdminAuthStore } = await import("@/store/admin-auth-store");
    useAdminAuthStore.setState({ admin: null, accessToken: null });
    if (typeof window !== "undefined" && !window.location.pathname.startsWith("/admin/login")) {
      window.location.href = "/admin/login";
    }
  } else {
    const { useAuthStore } = await import("@/store/auth-store");
    useAuthStore.setState({ user: null, accessToken: null });
    if (typeof window !== "undefined" && !window.location.pathname.startsWith("/login")) {
      const redirect = encodeURIComponent(window.location.pathname + window.location.search);
      window.location.href = `/login?redirect=${redirect}`;
    }
  }
}

/**
 * For Client Components. Goes through the same-origin `/api/*` rewrite so
 * httpOnly cookies set by the Express API round-trip correctly. The user and
 * admin sessions are independent — the token attached is picked by path.
 *
 * On a 401 it transparently tries the refresh-token cookie once before
 * giving up — and if that fails too (session truly expired), it clears the
 * store and redirects straight to login instead of leaving the click
 * silently failing.
 */
export async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<ApiEnvelope<T>> {
  const scope = scopeFor(path);
  let res = await rawFetch(path, options, scope);

  if (res.status === 401 && !isAuthEndpoint(path)) {
    const refreshed = await tryRefresh(scope);
    if (refreshed) {
      res = await rawFetch(path, options, scope);
    } else {
      await forceLogout(scope);
    }
  }

  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiClientError(res.status, body.message ?? "Something went wrong.", body.details);
  return body;
}
