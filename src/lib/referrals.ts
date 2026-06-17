import { supabase } from "@/integrations/supabase/client";

const KEY = "tm_ref";
const SESSION_KEY = "tm_session";
const TTL_MS = 30 * 24 * 60 * 60 * 1000;

type Stored = { ref: string; ts: number };

function sessionId(): string {
  try {
    let s = localStorage.getItem(SESSION_KEY);
    if (!s) {
      s = (crypto.randomUUID?.() ?? Math.random().toString(36).slice(2)) as string;
      localStorage.setItem(SESSION_KEY, s);
    }
    return s;
  } catch {
    return "anon";
  }
}

export function captureReferralFromUrl() {
  try {
    const params = new URLSearchParams(window.location.search);
    const ref = params.get("ref");
    if (!ref) return;
    const clean = ref.toLowerCase().replace(/[^a-z0-9-]/g, "").slice(0, 30);
    if (!clean) return;
    localStorage.setItem(KEY, JSON.stringify({ ref: clean, ts: Date.now() } satisfies Stored));
    void supabase.rpc("track_referral", { _ref: clean, _event: "visit", _session: sessionId() });
  } catch {
    /* ignore */
  }
}

export function getStoredReferral(): string | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Stored;
    if (!parsed?.ref || Date.now() - parsed.ts > TTL_MS) {
      localStorage.removeItem(KEY);
      return null;
    }
    return parsed.ref;
  } catch {
    return null;
  }
}

export async function trackReferralEvent(event: "signup" | "template_use", targetUserId?: string) {
  const ref = getStoredReferral();
  if (!ref) return;
  try {
    await supabase.rpc("track_referral", {
      _ref: ref,
      _event: event,
      _target: targetUserId ?? null,
      _session: sessionId(),
    });
  } catch {
    /* ignore */
  }
}

export function buildReferralLink(username: string, path = "/"): string {
  const base = typeof window !== "undefined" ? window.location.origin : "https://twibmotion.com";
  return `${base}${path}${path.includes("?") ? "&" : "?"}ref=${encodeURIComponent(username)}`;
}