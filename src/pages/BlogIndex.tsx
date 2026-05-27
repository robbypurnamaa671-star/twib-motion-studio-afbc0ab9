import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import SEOHead from "@/components/SEOHead";
import SeoShell from "@/components/seo/SeoShell";

const BASE_URL = "https://twibmotion.com";

interface Post { slug: string; title: string; excerpt: string; category: string | null; published_at: string | null; cover_image_url: string | null }

const BlogIndex = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await (supabase.from("blog_posts") as any)
        .select("slug, title, excerpt, category, published_at, cover_image_url")
        .eq("is_published", true)
        .order("published_at", { ascending: false });
      setPosts((data as Post[]) || []);
      setLoading(false);
    })();
  }, []);

  const canonical = `${BASE_URL}/blog`;
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Blog",
    name: "TwibMotion Blog",
    url: canonical,
    blogPost: posts.map((p) => ({ "@type": "BlogPosting", headline: p.title, url: `${BASE_URL}/blog/${p.slug}` })),
  };

  return (
    <SeoShell>
      <SEOHead
        title="Twibbon Blog – Tutorials, Ideas & Guides | TwibMotion"
        description="Twibbon tutorials, ideas, and guides for graduation, events, Reels, TikTok, and animated campaign frames."
        canonical={canonical}
        jsonLd={jsonLd}
      />
      <h1 className="text-3xl md:text-4xl font-mono font-bold text-foreground mb-2">TwibMotion Blog</h1>
      <p className="text-muted-foreground mb-10">Tutorials, ideas, and guides for modern twibbon creators.</p>
      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
      ) : posts.length === 0 ? (
        <p className="text-muted-foreground">No posts yet.</p>
      ) : (
        <ul className="space-y-6">
          {posts.map((p) => (
            <li key={p.slug} className="border-b border-border pb-6">
              <Link to={`/blog/${p.slug}`} className="block hover:opacity-90">
                {p.cover_image_url && (
                  <img src={p.cover_image_url} alt={p.title} loading="lazy" className="w-full h-48 object-cover rounded-lg mb-3 bg-muted" />
                )}
                <div className="text-xs font-mono text-muted-foreground uppercase tracking-wide mb-1">{p.category || "Article"}</div>
                <h2 className="text-xl font-mono font-bold text-foreground mb-2">{p.title}</h2>
                <p className="text-muted-foreground text-sm leading-relaxed">{p.excerpt}</p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </SeoShell>
  );
};

export default BlogIndex;