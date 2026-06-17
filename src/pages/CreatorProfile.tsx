import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import SEOHead from "@/components/SEOHead";
import { ProgressiveImage } from "@/components/ProgressiveImage";
import { Globe, Instagram, Facebook, Twitter, Loader2 } from "lucide-react";
import NotFound from "./NotFound";
import { FollowButton } from "@/components/community/FollowButton";
import { ShareBar } from "@/components/share/ShareBar";

interface CreatorProfile {
  user_id: string;
  display_name: string | null;
  username: string;
  avatar_url: string | null;
  bio: string | null;
  website_url: string | null;
  instagram_url: string | null;
  facebook_url: string | null;
  twitter_url: string | null;
  created_at: string;
  follower_count?: number;
  following_count?: number;
}

interface TemplateCard {
  id: string;
  slug: string | null;
  title: string;
  preview_url: string | null;
  bottom_layer_url: string;
  view_count: number;
  usage_count: number;
}

const BASE = "https://twib-motion-studio.lovable.app";

export default function CreatorProfile() {
  const { username } = useParams<{ username: string }>();
  const [profile, setProfile] = useState<CreatorProfile | null>(null);
  const [templates, setTemplates] = useState<TemplateCard[]>([]);
  const [stats, setStats] = useState({ total: 0, views: 0, uses: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!username) return;
    (async () => {
      setLoading(true);
      const { data: p } = await supabase
        .from("profiles")
        .select("user_id, display_name, username, avatar_url, bio, website_url, instagram_url, facebook_url, twitter_url, created_at, follower_count, following_count")
        .ilike("username", username)
        .maybeSingle();
      if (!p) {
        setProfile(null);
        setLoading(false);
        return;
      }
      setProfile(p as CreatorProfile);
      const { data: tpls } = await supabase
        .from("shared_templates")
        .select("id, slug, title, preview_url, bottom_layer_url, view_count, usage_count")
        .eq("owner_id", p.user_id)
        .eq("is_public", true)
        .is("deleted_at", null)
        .order("created_at", { ascending: false })
        .limit(60);
      const rows = (tpls ?? []) as TemplateCard[];
      setTemplates(rows);
      setStats({
        total: rows.length,
        views: rows.reduce((s, r) => s + (r.view_count ?? 0), 0),
        uses: rows.reduce((s, r) => s + (r.usage_count ?? 0), 0),
      });
      setLoading(false);
    })();
  }, [username]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-muted-foreground">
        <Loader2 className="w-6 h-6 animate-spin" />
      </div>
    );
  }
  if (!profile) return <NotFound />;

  const displayName = profile.display_name || profile.username;
  const title = `${displayName} (@${profile.username}) · TwibMotion Creator`;
  const description =
    profile.bio?.slice(0, 155) ||
    `Twibbon templates and frames by @${profile.username} on TwibMotion. ${stats.total} public template${stats.total === 1 ? "" : "s"}.`;
  const url = `${BASE}/creator/${profile.username}`;

  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "ProfilePage",
      mainEntity: {
        "@type": "Person",
        name: displayName,
        alternateName: `@${profile.username}`,
        url,
        image: profile.avatar_url || undefined,
        description: profile.bio || undefined,
        sameAs: [profile.website_url, profile.instagram_url, profile.facebook_url, profile.twitter_url].filter(Boolean),
      },
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: BASE },
        { "@type": "ListItem", position: 2, name: "Creators", item: `${BASE}/creator` },
        { "@type": "ListItem", position: 3, name: displayName, item: url },
      ],
    },
  ];

  const socials = [
    { url: profile.website_url, Icon: Globe, label: "Website" },
    { url: profile.instagram_url, Icon: Instagram, label: "Instagram" },
    { url: profile.facebook_url, Icon: Facebook, label: "Facebook" },
    { url: profile.twitter_url, Icon: Twitter, label: "Twitter" },
  ].filter((s) => s.url);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SEOHead title={title} description={description} canonical={url} ogType="profile" jsonLd={jsonLd} />

      <header className="border-b border-border">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <img src="/logo.png" alt="TwibMotion" width={28} height={28} className="rounded-md" />
            <span className="font-mono font-bold tracking-tight">TwibMotion</span>
          </Link>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-10">
        <section className="flex flex-col sm:flex-row items-start gap-6 mb-10">
          <div className="w-24 h-24 rounded-full overflow-hidden border border-border bg-secondary flex items-center justify-center shrink-0">
            {profile.avatar_url ? (
              <img src={profile.avatar_url} alt={`${displayName} avatar`} className="w-full h-full object-cover" />
            ) : (
              <span className="text-3xl font-mono text-muted-foreground">{displayName.slice(0, 1).toUpperCase()}</span>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-3xl font-mono font-bold tracking-tight">{displayName}</h1>
            <p className="text-sm font-mono text-muted-foreground">@{profile.username}</p>
            {profile.bio && <p className="mt-3 text-foreground leading-relaxed max-w-2xl">{profile.bio}</p>}
            <p className="mt-2 text-xs font-mono text-muted-foreground">
              Joined {new Date(profile.created_at).toLocaleDateString(undefined, { month: "long", year: "numeric" })}
            </p>
            {socials.length > 0 && (
              <div className="flex gap-2 mt-4">
                {socials.map(({ url, Icon, label }) => (
                  <a
                    key={label}
                    href={url!}
                    target="_blank"
                    rel="noreferrer me"
                    aria-label={label}
                    className="p-2 rounded-md border border-border text-muted-foreground hover:text-foreground hover:bg-secondary"
                  >
                    <Icon className="w-4 h-4" />
                  </a>
                ))}
              </div>
            )}

            <div className="flex gap-6 mt-6 text-sm font-mono">
              <Stat label="Templates" value={stats.total} />
              <Stat label="Followers" value={profile.follower_count ?? 0} />
              <Stat label="Following" value={profile.following_count ?? 0} />
              <Stat label="Views" value={stats.views} />
              <Stat label="Uses" value={stats.uses} />
            </div>

            <div className="flex flex-wrap gap-2 mt-5">
              <FollowButton creatorId={profile.user_id} />
              <ShareBar
                url={`https://twibmotion.com/creator/${profile.username}`}
                title={`Check out @${profile.username} on TwibMotion`}
                refUsername={profile.username}
                compact
              />
            </div>
          </div>
        </section>

        <section aria-labelledby="public-templates">
          <h2 id="public-templates" className="text-xl font-mono font-bold mb-4">
            Public templates
          </h2>
          {templates.length === 0 ? (
            <p className="text-muted-foreground text-sm">No public templates yet.</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {templates.map((t) => (
                <Link
                  key={t.id}
                  to={`/template/${t.slug || t.id}`}
                  className="group block aspect-square overflow-hidden rounded-lg border border-border bg-card relative focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  aria-label={`Open template ${t.title}`}
                >
                  {(t.preview_url || t.bottom_layer_url) && (
                    <ProgressiveImage
                      src={(t.preview_url || t.bottom_layer_url) as string}
                      alt={`${t.title} – twibbon by @${profile.username}`}
                      className="transition-transform duration-500 group-hover:scale-105"
                    />
                  )}
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-background/90 to-transparent p-2">
                    <p className="text-xs font-mono text-foreground truncate">{t.title}</p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="text-xl font-bold">{value.toLocaleString()}</div>
      <div className="text-xs uppercase tracking-widest text-muted-foreground">{label}</div>
    </div>
  );
}