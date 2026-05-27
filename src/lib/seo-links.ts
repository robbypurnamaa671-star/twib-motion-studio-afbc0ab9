import { supabase } from "@/integrations/supabase/client";

export interface RelatedLink { slug: string; keyword: string; route: string }

function routeFor(row: { slug: string; page_type?: string | null; route_path?: string | null }) {
  if (row.page_type === "global" && row.route_path) return row.route_path;
  return `/twibbon/${row.slug}`;
}

export async function fetchRelatedSeoPages(slugs: string[]): Promise<RelatedLink[]> {
  if (!slugs.length) return [];
  const { data } = await (supabase.from("seo_pages") as any)
    .select("slug, keyword, page_type, route_path")
    .in("slug", slugs)
    .eq("is_indexable", true);
  return ((data as any[]) || []).map((r) => ({ slug: r.slug, keyword: r.keyword, route: routeFor(r) }));
}

export async function fetchCategoryPages(category: string, excludeSlug?: string, limit = 8): Promise<RelatedLink[]> {
  if (!category) return [];
  let q = (supabase.from("seo_pages") as any)
    .select("slug, keyword, page_type, route_path")
    .eq("category", category)
    .eq("is_indexable", true)
    .limit(limit);
  if (excludeSlug) q = q.neq("slug", excludeSlug);
  const { data } = await q;
  return ((data as any[]) || []).map((r) => ({ slug: r.slug, keyword: r.keyword, route: routeFor(r) }));
}

export async function fetchRelatedBlogPosts(slugs: string[]): Promise<{ slug: string; title: string }[]> {
  if (!slugs.length) return [];
  const { data } = await (supabase.from("blog_posts") as any)
    .select("slug, title")
    .in("slug", slugs)
    .eq("is_published", true);
  return (data as any[]) || [];
}