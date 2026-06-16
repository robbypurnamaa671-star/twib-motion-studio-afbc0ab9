import { supabase } from "@/integrations/supabase/client";

export type CommunityTemplate = {
  id: string;
  slug: string | null;
  title: string;
  preview_url: string | null;
  bottom_layer_url: string;
  canvas_ratio: string | null;
  canvas_w: number | null;
  canvas_h: number | null;
  category: string | null;
  tags: string[] | null;
  created_at: string;
  view_count: number | null;
  usage_count: number | null;
  like_count: number | null;
  download_count: number | null;
  owner_id: string | null;
  is_featured: boolean | null;
  profiles?: { username: string | null; display_name: string | null; avatar_url: string | null } | null;
};

const BASE_SELECT =
  "id,slug,title,preview_url,bottom_layer_url,canvas_ratio,canvas_w,canvas_h,category,tags,created_at,view_count,usage_count,like_count,download_count,owner_id,is_featured,profiles:owner_id(username,display_name,avatar_url)";

function publicQuery() {
  return supabase
    .from("shared_templates")
    .select(BASE_SELECT)
    .eq("is_public", true)
    .is("deleted_at", null);
}

export async function fetchNewest(limit = 12): Promise<CommunityTemplate[]> {
  const { data } = await publicQuery().order("created_at", { ascending: false }).limit(limit);
  return ((data as unknown) as CommunityTemplate[]) || [];
}

export async function fetchMostUsed(limit = 12): Promise<CommunityTemplate[]> {
  const { data } = await publicQuery().order("usage_count", { ascending: false }).limit(limit);
  return ((data as unknown) as CommunityTemplate[]) || [];
}

export async function fetchMostViewed(limit = 12): Promise<CommunityTemplate[]> {
  const { data } = await publicQuery().order("view_count", { ascending: false }).limit(limit);
  return ((data as unknown) as CommunityTemplate[]) || [];
}

export async function fetchMostLiked(limit = 12): Promise<CommunityTemplate[]> {
  const { data } = await publicQuery().order("like_count", { ascending: false }).limit(limit);
  return ((data as unknown) as CommunityTemplate[]) || [];
}

export async function fetchFeatured(limit = 12): Promise<CommunityTemplate[]> {
  const { data } = await publicQuery()
    .eq("is_featured", true)
    .order("created_at", { ascending: false })
    .limit(limit);
  return ((data as unknown) as CommunityTemplate[]) || [];
}

export type TrendingWindow = "day" | "week" | "month";

export async function fetchTrending(window: TrendingWindow = "week", limit = 12): Promise<CommunityTemplate[]> {
  const days = window === "day" ? 1 : window === "week" ? 7 : 30;
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
  // Pull a wider candidate pool ordered by recent activity, then re-rank by weighted score.
  const { data } = await publicQuery()
    .gte("created_at", since)
    .order("usage_count", { ascending: false })
    .limit(limit * 4);
  const rows = ((data as unknown) as CommunityTemplate[]) || [];
  const scored = rows
    .map((r) => ({
      r,
      score: (r.usage_count ?? 0) * 3 + (r.like_count ?? 0) * 2 + (r.view_count ?? 0),
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((x) => x.r);
  if (scored.length >= Math.min(limit, 4)) return scored;
  // Fallback for sparse projects: fall back to all-time most used
  return fetchMostUsed(limit);
}

export async function fetchByCategory(category: string, limit = 24): Promise<CommunityTemplate[]> {
  const { data } = await publicQuery()
    .eq("category", category)
    .order("usage_count", { ascending: false })
    .limit(limit);
  return ((data as unknown) as CommunityTemplate[]) || [];
}

export async function fetchCategoryCounts(): Promise<{ category: string; count: number }[]> {
  const { data } = await supabase
    .from("shared_templates")
    .select("category")
    .eq("is_public", true)
    .is("deleted_at", null)
    .not("category", "is", null);
  const map = new Map<string, number>();
  (data as { category: string | null }[] | null)?.forEach((r) => {
    if (!r.category) return;
    map.set(r.category, (map.get(r.category) || 0) + 1);
  });
  return Array.from(map.entries())
    .map(([category, count]) => ({ category, count }))
    .sort((a, b) => b.count - a.count);
}

export type FeaturedCreator = {
  user_id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  is_featured_creator: boolean;
  template_count: number;
  total_uses: number;
  total_views: number;
  total_likes: number;
};

export async function fetchCreatorsAggregate(): Promise<FeaturedCreator[]> {
  // Pull all public templates with their owner profile fields, then aggregate client-side.
  const { data } = await supabase
    .from("shared_templates")
    .select(
      "owner_id,usage_count,view_count,like_count,profiles:owner_id(user_id,username,display_name,avatar_url,bio,is_featured_creator)",
    )
    .eq("is_public", true)
    .is("deleted_at", null);
  const rows =
    (data as unknown as {
      owner_id: string | null;
      usage_count: number | null;
      view_count: number | null;
      like_count: number | null;
      profiles: {
        user_id: string;
        username: string | null;
        display_name: string | null;
        avatar_url: string | null;
        bio: string | null;
        is_featured_creator: boolean | null;
      } | null;
    }[]) || [];
  const map = new Map<string, FeaturedCreator>();
  rows.forEach((r) => {
    const p = r.profiles;
    if (!p?.username) return;
    const cur =
      map.get(p.user_id) ||
      ({
        user_id: p.user_id,
        username: p.username,
        display_name: p.display_name,
        avatar_url: p.avatar_url,
        bio: p.bio,
        is_featured_creator: !!p.is_featured_creator,
        template_count: 0,
        total_uses: 0,
        total_views: 0,
        total_likes: 0,
      } as FeaturedCreator);
    cur.template_count += 1;
    cur.total_uses += r.usage_count ?? 0;
    cur.total_views += r.view_count ?? 0;
    cur.total_likes += r.like_count ?? 0;
    map.set(p.user_id, cur);
  });
  return Array.from(map.values());
}

export async function fetchFeaturedCreators(limit = 6): Promise<FeaturedCreator[]> {
  const all = await fetchCreatorsAggregate();
  return all
    .sort((a, b) => {
      if (a.is_featured_creator !== b.is_featured_creator) return a.is_featured_creator ? -1 : 1;
      return b.total_uses - a.total_uses;
    })
    .slice(0, limit);
}

export type LeaderboardSort = "popular" | "used" | "most-templates" | "fastest-growing";

export async function fetchCreatorLeaderboard(sort: LeaderboardSort, limit = 30): Promise<FeaturedCreator[]> {
  const all = await fetchCreatorsAggregate();
  const sorters: Record<LeaderboardSort, (a: FeaturedCreator, b: FeaturedCreator) => number> = {
    popular: (a, b) => b.total_likes + b.total_uses - (a.total_likes + a.total_uses),
    used: (a, b) => b.total_uses - a.total_uses,
    "most-templates": (a, b) => b.template_count - a.template_count,
    "fastest-growing": (a, b) => b.total_views - a.total_views,
  };
  return all.sort(sorters[sort]).slice(0, limit);
}

export type Collection = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  cover_url: string | null;
  match_category: string | null;
  match_tags: string[];
  is_published: boolean;
  is_indexable: boolean;
  sort_order: number;
  updated_at: string;
};

export async function fetchCollections(): Promise<Collection[]> {
  const { data } = await supabase
    .from("template_collections")
    .select("*")
    .eq("is_published", true)
    .order("sort_order", { ascending: true });
  return ((data as unknown) as Collection[]) || [];
}

export async function fetchCollectionBySlug(slug: string): Promise<Collection | null> {
  const { data } = await supabase
    .from("template_collections")
    .select("*")
    .eq("slug", slug)
    .eq("is_published", true)
    .maybeSingle();
  return ((data as unknown) as Collection) || null;
}

export async function fetchTemplatesForCollection(c: Collection, limit = 60): Promise<CommunityTemplate[]> {
  let q = publicQuery();
  if (c.match_category && c.match_tags.length > 0) {
    q = q.or(`category.eq.${c.match_category},tags.ov.{${c.match_tags.join(",")}}`);
  } else if (c.match_category) {
    q = q.eq("category", c.match_category);
  } else if (c.match_tags.length > 0) {
    q = q.overlaps("tags", c.match_tags);
  }
  const { data } = await q.order("usage_count", { ascending: false }).limit(limit);
  return ((data as unknown) as CommunityTemplate[]) || [];
}

export async function fetchRelatedTemplates(
  templateId: string,
  category: string | null,
  tags: string[] | null,
  limit = 6,
): Promise<CommunityTemplate[]> {
  let q = publicQuery().neq("id", templateId);
  if (tags && tags.length > 0) q = q.overlaps("tags", tags);
  else if (category) q = q.eq("category", category);
  const { data } = await q.order("usage_count", { ascending: false }).limit(limit);
  return ((data as unknown) as CommunityTemplate[]) || [];
}

export async function fetchMoreFromCreator(
  ownerId: string,
  excludeId: string,
  limit = 6,
): Promise<CommunityTemplate[]> {
  const { data } = await publicQuery()
    .eq("owner_id", ownerId)
    .neq("id", excludeId)
    .order("created_at", { ascending: false })
    .limit(limit);
  return ((data as unknown) as CommunityTemplate[]) || [];
}

export async function fetchTopFavorited(limit = 24): Promise<CommunityTemplate[]> {
  return fetchMostLiked(limit);
}

export async function fetchRelatedBlogPosts(tags: string[] | null, limit = 3) {
  let q = supabase
    .from("blog_posts")
    .select("slug,title,excerpt,featured_image_url,published_at")
    .eq("is_published", true)
    .order("published_at", { ascending: false })
    .limit(limit);
  if (tags && tags.length > 0) q = q.overlaps("tags", tags);
  const { data } = await q;
  return (data as { slug: string; title: string; excerpt: string | null; featured_image_url: string | null; published_at: string | null }[]) || [];
}