import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { profileSchema, USERNAME_REGEX } from "@/lib/profile-validation";
import { Loader2, Upload, ExternalLink, Check } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface ProfileRow {
  display_name: string | null;
  username: string | null;
  avatar_url: string | null;
  bio: string | null;
  website_url: string | null;
  instagram_url: string | null;
  facebook_url: string | null;
  twitter_url: string | null;
}

const EMPTY: ProfileRow = {
  display_name: "",
  username: "",
  avatar_url: "",
  bio: "",
  website_url: "",
  instagram_url: "",
  facebook_url: "",
  twitter_url: "",
};

export default function ProfileSettings() {
  const { user } = useAuth();
  const [form, setForm] = useState<ProfileRow>(EMPTY);
  const [original, setOriginal] = useState<ProfileRow>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [usernameStatus, setUsernameStatus] = useState<"idle" | "checking" | "available" | "taken">("idle");

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from("profiles")
        .select("display_name, username, avatar_url, bio, website_url, instagram_url, facebook_url, twitter_url")
        .eq("user_id", user.id)
        .maybeSingle();
      const row: ProfileRow = data
        ? {
            display_name: data.display_name ?? "",
            username: data.username ?? "",
            avatar_url: data.avatar_url ?? "",
            bio: data.bio ?? "",
            website_url: data.website_url ?? "",
            instagram_url: data.instagram_url ?? "",
            facebook_url: data.facebook_url ?? "",
            twitter_url: data.twitter_url ?? "",
          }
        : EMPTY;
      setForm(row);
      setOriginal(row);
      setLoading(false);
    })();
  }, [user]);

  // Debounced username availability check
  useEffect(() => {
    const u = (form.username || "").trim().toLowerCase();
    if (!u || u === original.username || !USERNAME_REGEX.test(u)) {
      setUsernameStatus("idle");
      return;
    }
    setUsernameStatus("checking");
    const t = setTimeout(async () => {
      const { data } = await supabase
        .from("profiles")
        .select("user_id")
        .ilike("username", u)
        .neq("user_id", user?.id ?? "")
        .maybeSingle();
      setUsernameStatus(data ? "taken" : "available");
    }, 400);
    return () => clearTimeout(t);
  }, [form.username, original.username, user?.id]);

  const handleAvatar = async (file: File) => {
    if (!user) return;
    if (file.size > 2 * 1024 * 1024) {
      toast({ title: "Avatar too large", description: "Max 2MB", variant: "destructive" });
      return;
    }
    if (!/^image\/(jpeg|png|webp)$/.test(file.type)) {
      toast({ title: "Unsupported format", description: "JPG, PNG, or WebP", variant: "destructive" });
      return;
    }
    setUploading(true);
    const ext = file.name.split(".").pop() || "png";
    const path = `avatars/${user.id}/avatar-${Date.now()}.${ext}`;
    const { error } = await supabase.storage
      .from("template-assets")
      .upload(path, file, { upsert: true, contentType: file.type });
    if (error) {
      toast({ title: "Upload failed", description: error.message, variant: "destructive" });
      setUploading(false);
      return;
    }
    const { data } = supabase.storage.from("template-assets").getPublicUrl(path);
    setForm((f) => ({ ...f, avatar_url: data.publicUrl }));
    setUploading(false);
  };

  const save = async () => {
    if (!user) return;
    const parsed = profileSchema.safeParse({
      display_name: form.display_name ?? "",
      username: (form.username ?? "").toLowerCase(),
      bio: form.bio ?? "",
      website_url: form.website_url ?? "",
      instagram_url: form.instagram_url ?? "",
      facebook_url: form.facebook_url ?? "",
      twitter_url: form.twitter_url ?? "",
    });
    if (!parsed.success) {
      const e: Record<string, string> = {};
      parsed.error.issues.forEach((i) => (e[i.path[0] as string] = i.message));
      setErrors(e);
      return;
    }
    if (usernameStatus === "taken") {
      setErrors({ username: "Username already taken" });
      return;
    }
    setErrors({});
    setSaving(true);
    const payload = {
      display_name: parsed.data.display_name,
      username: parsed.data.username,
      avatar_url: form.avatar_url || null,
      bio: parsed.data.bio || null,
      website_url: parsed.data.website_url || null,
      instagram_url: parsed.data.instagram_url || null,
      facebook_url: parsed.data.facebook_url || null,
      twitter_url: parsed.data.twitter_url || null,
    };
    const { error } = await supabase.from("profiles").update(payload).eq("user_id", user.id);
    setSaving(false);
    if (error) {
      toast({ title: "Could not save", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Profile saved" });
    setOriginal({ ...form, ...payload, avatar_url: payload.avatar_url ?? "" } as ProfileRow);
    setUsernameStatus("idle");
  };

  if (loading) {
    return (
      <DashboardLayout title="Profile">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="w-4 h-4 animate-spin" /> Loading…
        </div>
      </DashboardLayout>
    );
  }

  const publicUrl = form.username ? `/creator/${form.username}` : null;

  return (
    <DashboardLayout title="Profile" description="Edit your public creator profile.">
      <div className="max-w-2xl space-y-6">
        {publicUrl && (
          <a
            href={publicUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 text-xs font-mono text-primary hover:underline"
          >
            View public profile <ExternalLink className="w-3 h-3" />
          </a>
        )}

        {/* Avatar */}
        <div className="flex items-center gap-4">
          <div className="w-20 h-20 rounded-full bg-secondary overflow-hidden border border-border flex items-center justify-center">
            {form.avatar_url ? (
              <img src={form.avatar_url} alt="" className="w-full h-full object-cover" />
            ) : (
              <span className="text-2xl font-mono text-muted-foreground">
                {(form.display_name || "?").slice(0, 1).toUpperCase()}
              </span>
            )}
          </div>
          <label className="inline-flex items-center gap-2 px-3 py-2 rounded-md border border-border bg-card text-sm font-mono cursor-pointer hover:bg-secondary">
            {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
            Upload avatar
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && handleAvatar(e.target.files[0])}
            />
          </label>
        </div>

        <Field
          label="Display name"
          value={form.display_name ?? ""}
          onChange={(v) => setForm((f) => ({ ...f, display_name: v }))}
          error={errors.display_name}
          maxLength={60}
        />

        <div>
          <Field
            label="Username"
            prefix="/creator/"
            value={form.username ?? ""}
            onChange={(v) =>
              setForm((f) => ({ ...f, username: v.toLowerCase().replace(/[^a-z0-9-]/g, "") }))
            }
            error={errors.username}
            maxLength={30}
          />
          <p className="text-xs font-mono mt-1 h-4">
            {usernameStatus === "checking" && (
              <span className="text-muted-foreground">Checking…</span>
            )}
            {usernameStatus === "available" && (
              <span className="text-emerald-400 inline-flex items-center gap-1">
                <Check className="w-3 h-3" /> Available
              </span>
            )}
            {usernameStatus === "taken" && (
              <span className="text-destructive">Already taken</span>
            )}
          </p>
        </div>

        <Field
          label="Bio"
          textarea
          value={form.bio ?? ""}
          onChange={(v) => setForm((f) => ({ ...f, bio: v }))}
          error={errors.bio}
          maxLength={280}
          placeholder="Tell people what you create."
        />

        <div className="grid sm:grid-cols-2 gap-4">
          <Field
            label="Website"
            value={form.website_url ?? ""}
            onChange={(v) => setForm((f) => ({ ...f, website_url: v }))}
            error={errors.website_url}
            placeholder="https://"
          />
          <Field
            label="Instagram"
            value={form.instagram_url ?? ""}
            onChange={(v) => setForm((f) => ({ ...f, instagram_url: v }))}
            error={errors.instagram_url}
            placeholder="https://instagram.com/…"
          />
          <Field
            label="Facebook"
            value={form.facebook_url ?? ""}
            onChange={(v) => setForm((f) => ({ ...f, facebook_url: v }))}
            error={errors.facebook_url}
            placeholder="https://facebook.com/…"
          />
          <Field
            label="Twitter / X"
            value={form.twitter_url ?? ""}
            onChange={(v) => setForm((f) => ({ ...f, twitter_url: v }))}
            error={errors.twitter_url}
            placeholder="https://x.com/…"
          />
        </div>

        <button
          onClick={save}
          disabled={saving || usernameStatus === "checking"}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-primary text-primary-foreground font-mono text-sm hover:opacity-90 disabled:opacity-50"
        >
          {saving && <Loader2 className="w-4 h-4 animate-spin" />}
          Save profile
        </button>
      </div>
    </DashboardLayout>
  );
}

function Field({
  label,
  value,
  onChange,
  error,
  maxLength,
  placeholder,
  textarea,
  prefix,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  error?: string;
  maxLength?: number;
  placeholder?: string;
  textarea?: boolean;
  prefix?: string;
}) {
  return (
    <label className="block">
      <span className="text-xs font-mono uppercase tracking-widest text-muted-foreground">{label}</span>
      <div className="mt-1 flex rounded-md border border-border bg-background overflow-hidden focus-within:ring-2 focus-within:ring-ring">
        {prefix && (
          <span className="px-3 py-2 text-sm font-mono text-muted-foreground bg-secondary border-r border-border">
            {prefix}
          </span>
        )}
        {textarea ? (
          <textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            maxLength={maxLength}
            placeholder={placeholder}
            rows={3}
            className="w-full px-3 py-2 bg-transparent text-sm outline-none resize-none"
          />
        ) : (
          <input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            maxLength={maxLength}
            placeholder={placeholder}
            className="w-full px-3 py-2 bg-transparent text-sm outline-none"
          />
        )}
      </div>
      {error && <p className="text-xs text-destructive mt-1">{error}</p>}
    </label>
  );
}