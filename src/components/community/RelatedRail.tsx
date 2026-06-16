import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { TemplateGrid } from "@/components/community/TemplateGrid";
import {
  fetchRelatedTemplates,
  fetchMoreFromCreator,
  fetchRelatedBlogPosts,
  type CommunityTemplate,
} from "@/lib/community-queries";

type BlogPost = {
  slug: string;
  title: string;
  excerpt: string | null;
  featured_image_url: string | null;
  published_at: string | null;
};

export function RelatedRail({
  templateId,
  ownerId,
  category,
  tags,
  creatorUsername,
}: {
  templateId: string;
  ownerId: string | null;
  category: string | null;
  tags: string[] | null;
  creatorUsername: string | null;
}) {
  const [related, setRelated] = useState<CommunityTemplate[]>([]);
  const [more, setMore] = useState<CommunityTemplate[]>([]);
  const [blog, setBlog] = useState<BlogPost[]>([]);

  useEffect(() => {
    let alive = true;
    (async () => {
      const [a, b, c] = await Promise.all([
        fetchRelatedTemplates(templateId, category, tags, 6),
        ownerId ? fetchMoreFromCreator(ownerId, templateId, 6) : Promise.resolve([] as CommunityTemplate[]),
        fetchRelatedBlogPosts(tags, 3),
      ]);
      if (!alive) return;
      setRelated(a);
      setMore(b);
      setBlog(c as BlogPost[]);
    })();
    return () => {
      alive = false;
    };
  }, [templateId, ownerId, category, JSON.stringify(tags)]);

  return (
    <div className="mt-12 space-y-12 border-t border-border pt-10">
      {related.length > 0 && (
        <section aria-labelledby="related-templates">
          <h2 id="related-templates" className="text-xl font-mono font-bold text-foreground mb-4">
            Related Templates
          </h2>
          <TemplateGrid items={related} />
        </section>
      )}

      {more.length > 0 && creatorUsername && (
        <section aria-labelledby="more-from-creator">
          <h2 id="more-from-creator" className="text-xl font-mono font-bold text-foreground mb-4">
            More from <Link to={`/creator/${creatorUsername}`} className="text-primary hover:underline">@{creatorUsername}</Link>
          </h2>
          <TemplateGrid items={more} />
        </section>
      )}

      {category && (
        <section aria-labelledby="related-categories">
          <h2 id="related-categories" className="text-xl font-mono font-bold text-foreground mb-4">
            Related Categories
          </h2>
          <div className="flex flex-wrap gap-2">
            <Link
              to={`/community/category/${category}`}
              className="px-3 py-1.5 rounded-full text-xs font-mono border border-border hover:border-primary/60 hover:text-primary"
            >
              {category}
            </Link>
            {(tags || []).slice(0, 6).map((t) => (
              <Link
                key={t}
                to={`/twibbon/${t.toLowerCase().replace(/\s+/g, "-")}`}
                className="px-3 py-1.5 rounded-full text-xs font-mono border border-border hover:border-primary/60 hover:text-primary"
              >
                #{t}
              </Link>
            ))}
          </div>
        </section>
      )}

      {blog.length > 0 && (
        <section aria-labelledby="related-blog">
          <h2 id="related-blog" className="text-xl font-mono font-bold text-foreground mb-4">
            Related Blog Posts
          </h2>
          <ul className="grid sm:grid-cols-3 gap-4">
            {blog.map((p) => (
              <li key={p.slug}>
                <Link
                  to={`/blog/${p.slug}`}
                  className="block p-4 rounded-lg border border-border bg-card hover:border-primary/60"
                >
                  <p className="text-sm font-mono font-bold text-foreground line-clamp-2">{p.title}</p>
                  {p.excerpt && <p className="text-xs text-muted-foreground mt-2 line-clamp-3">{p.excerpt}</p>}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}