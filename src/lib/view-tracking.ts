import { supabase } from "@/integrations/supabase/client";
import { trackReferralEvent } from "./referrals";

const VIEW_KEY = "twibmotion.viewed_templates";
const USE_KEY = "twibmotion.used_templates";

function readSet(key: string): Set<string> {
  try {
    const raw = sessionStorage.getItem(key);
    if (!raw) return new Set();
    return new Set(JSON.parse(raw));
  } catch {
    return new Set();
  }
}
function writeSet(key: string, set: Set<string>) {
  try {
    sessionStorage.setItem(key, JSON.stringify(Array.from(set)));
  } catch {
    /* ignore */
  }
}

async function safeRpc(fn: string, payload: Record<string, unknown>) {
  try {
    await supabase.rpc(fn as never, payload as never);
  } catch {
    /* ignore */
  }
}

export async function trackView(templateId: string | undefined | null) {
  if (!templateId) return;
  const seen = readSet(VIEW_KEY);
  if (seen.has(templateId)) return;
  seen.add(templateId);
  writeSet(VIEW_KEY, seen);
  await safeRpc("increment_template_view", { _template_id: templateId });
}

export async function trackUse(templateId: string | undefined | null) {
  if (!templateId) return;
  const used = readSet(USE_KEY);
  if (used.has(templateId)) return;
  used.add(templateId);
  writeSet(USE_KEY, used);
  await safeRpc("increment_template_use", { _template_id: templateId });
  void trackReferralEvent("template_use");
}

export async function trackDownload(templateId: string | undefined | null) {
  if (!templateId) return;
  await safeRpc("increment_template_download", { _template_id: templateId });
}