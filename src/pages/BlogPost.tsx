import { useEffect, useMemo, useState } from "react";
import { Link, useParams, Navigate } from "react-router-dom";
import { ArrowRight, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import SEOHead from "@/components/SEOHead";
import SeoShell from "@/components/seo/SeoShell";
import { breadcrumbJsonLd } from "@/lib/seo-content";
import { fetchRelatedSeoPages, fetchRelatedBlogPosts, type RelatedLink } from "@/lib/seo-links";

const BASE_URL = "https://twibmotion.com";

function renderMarkdown(md: string): string {
  const escape = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const lines = md.split(/\r?\n/);
  const out: string[] = [];
  let inList = false;
  const inline = (s: string) =>
    escape(s)
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-primary hover:underline">$1</a>')
      .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
      .replace(/`([^`]+)`/g, '<code class="px-1 py-0.5 rounded bg-muted text-xs">$1</code>');
  for (const raw of lines) {
    const line = raw.trimEnd();
    if (/^##\s+/.test(line)) {
      if (inList) { out.push("</ul>"); inList = false; }
      out.push(`<h2 class="text-xl font-mono font-bold text-foreground mt-8 mb-3">${inline(line.replace(/^##\s+/, ""))}</h2>`);
    } else if (/^#\s+/.test(line)) {
      if (inList) { out.push("</ul>"); inList = false; }
      out.push(`<h1 class="text-2xl font-mono font-bold text-foreground mt-8 mb-3">${inline(line.replace(/^#\s+/, ""))}</h1>`);
    } else if (/^[-*]\s+/.test(line)) {
      if (!inList) { out.push('<ul class="list-disc list-inside space-y-1 text-foreground">'); inList = true; }
      out.push(`<li>${inline(line.replace(/^[-*]\s+/, ""))}</li>`);
    } else if (line === "") {
      if (inList) { out.push("</ul>"); inList = false; }
      out.push("");
    } else {
      if (inList) { out.push("</ul>"); inList = false; }
      out.push(`<p class="text-muted-foreground leading-relaxed mb-4">${inline(line)}</p>`);
    }
  }
  if (inList) out.push("</ul>");
  return out.join("\n");
}

const BlogPostPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const [post, setPost] = useState<any>(null);
  const [related, setRelated] = useState<RelatedLink[]>([]);
  const [otherPosts, setOtherPosts] = useState<{ slug: string; title: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!slug) return;
    let mounted = true;
    (async () => {
      const { data } = await (supabase.from("blog_posts") as any).select("*").eq("slug", slug).eq("is_published", true).maybeSingle();
      if (!mounted) return;
      if (!data) { setNotFound(true); setLoading(false); return; }
      setPost(data);
      const [seo, other] = await Promise.all([
        fetchRelatedSeoPages(data.related_seo_slugs || []),
        fetchRelatedBlogPosts(data.related_slugs || []),
      ]);
      if (mounted) { setRelated(seo); setOtherPosts(other); setLoading(false); }
    })();
    return () => { mounted = false; };
  }, [slug]);

  const canonical = `${BASE_URL}/blog/${slug}`;
  const html = useMemo(() => (post ? renderMarkdown(post.content_md || "") : ""), [post]);
  const jsonLd = useMemo(() => {
    if (!post) return undefined;
    return [
      {
        "@context": "https://schema.org", "@type": "Article",
        headline: post.title, description: post.meta_description,
        datePublished: post.published_at, dateModified: post.updated_at,
        image: post.cover_image_url || undefined,
        author: { "@type": "Organization", name: "TwibMotion" },
        publisher: { "@type": "Organization", name: "TwibMotion" },
        mainEntityOfPage: canonical,
      },
      breadcrumbJsonLd(BASE_URL, [
        { name: "Home", path: "/" },
        { name: "Blog", path: "/blog" },
        { name: post.title, path: `/blog/${slug}` },
      ]),
    ];
  }, [post, canonical, slug]);

  if (notFound) return <Navigate to="/blog" replace />;

  return (
    <SeoShell>
      <SEOHead title={post?.title} description={post?.meta_description} canonical={canonical} ogUrl={canonical} ogType="article" jsonLd={jsonLd} />
      {loading || !post ? (
        <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
      ) : (
        <article>
          <nav className="text-xs font-mono text-muted-foreground mb-6" aria-label="Breadcrumb">
            <Link to="/" className="hover:text-primary">Home</Link>
            <span className="mx-2">/</span>
            <Link to="/blog" className="hover:text-primary">Blog</Link>
            <span className="mx-2">/</span>
            <span className="text-foreground">{post.title}</span>
          </nav>
          {post.cover_image_url && (
            <img src={post.cover_image_url} alt={post.title} className="w-full h-64 object-cover rounded-lg mb-6 bg-muted" />
          )}
          <h1 className="text-3xl md:text-4xl font-mono font-bold text-foreground mb-4 leading-tight">{post.title}</h1>
          <p className="text-muted-foreground text-lg mb-8">{post.excerpt}</p>
          <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: html }} />

          <section className="mt-12 border-t border-border pt-10 text-center">
            <h2 className="text-2xl font-mono font-bold text-foreground mb-4">Ready to make your own twibbon?</h2>
            <Link to="/editor" className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-primary text-primary-foreground font-mono font-semibold hover:opacity-90 transition-opacity">
              Open the Editor <ArrowRight className="w-4 h-4" />
            </Link>
          </section>

          {related.length > 0 && (
            <section className="mt-12 border-t border-border pt-10">
              <h2 className="text-xl font-mono font-bold text-foreground mb-6">Related Twibbon Pages</h2>
              <div className="flex flex-wrap gap-2">
                {related.map((r) => (
                  <Link key={r.slug} to={r.route} className="px-3 py-2 rounded-lg border border-border text-sm font-mono text-foreground hover:border-primary/60 hover:text-primary transition-colors">
                    {r.keyword}
                  </Link>
                ))}
              </div>
            </section>
          )}

          {otherPosts.length > 0 && (
            <section className="mt-12 border-t border-border pt-10">
              <h2 className="text-xl font-mono font-bold text-foreground mb-6">Read Next</h2>
              <ul className="space-y-2">
                {otherPosts.map((p) => (
                  <li key={p.slug}><Link to={`/blog/${p.slug}`} className="text-primary hover:underline font-mono text-sm">{p.title}</Link></li>
                ))}
              </ul>
            </section>
          )}
        </article>
      )}
    </SeoShell>
  );
};

export default BlogPostPage;