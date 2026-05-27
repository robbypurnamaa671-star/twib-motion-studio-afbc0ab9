import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { DEFAULT_BENEFITS, DEFAULT_HOWTO } from "@/lib/seo-content";
import type { RelatedLink } from "@/lib/seo-links";

interface Template {
  id: string;
  title: string;
  bottom_layer_url: string;
  canvas_ratio: string;
  canvas_w: number;
  canvas_h: number;
}

interface Props {
  keyword: string;
  h1?: string | null;
  intro: string;
  faq?: { question: string; answer: string }[];
  benefits?: { title: string; description: string }[];
  howto?: { title: string; description: string }[];
  templates?: Template[];
  related?: RelatedLink[];
  categoryRelated?: RelatedLink[];
  blogLinks?: { slug: string; title: string }[];
  ctaPath?: string;
}

export default function SeoLanding({
  keyword, h1, intro, faq = [], benefits, howto, templates = [], related = [], categoryRelated = [], blogLinks = [], ctaPath = "/editor",
}: Props) {
  const benefitsList = benefits && benefits.length ? benefits : DEFAULT_BENEFITS;
  const howtoList = howto && howto.length ? howto : DEFAULT_HOWTO.map(({ title, description }) => ({ title, description }));

  return (
    <>
      <section className="mb-12">
        <h1 className="text-3xl md:text-4xl font-mono font-bold text-foreground mb-4 leading-tight">
          {h1 || `Create ${keyword} Twibbon Online`}
        </h1>
        <p className="text-muted-foreground text-lg leading-relaxed mb-6">{intro}</p>
        <Link
          to={ctaPath}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-primary text-primary-foreground font-mono font-semibold hover:opacity-90 transition-opacity glow-border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          aria-label={`Create your ${keyword} twibbon now`}
        >
          Create Your Twibbon Now <ArrowRight className="w-4 h-4" />
        </Link>
      </section>

      {templates.length > 0 && (
        <section aria-label="Featured templates" className="mb-12 border-t border-border pt-10">
          <h2 className="text-xl font-mono font-bold text-foreground mb-6">Featured {keyword} Templates</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {templates.map((t) => (
              <Link key={t.id} to={`/use-template/${t.id}`} className="block rounded-lg overflow-hidden border border-border hover:border-primary/60 transition-colors">
                <img
                  src={t.bottom_layer_url}
                  alt={`${keyword} twibbon template – ${t.title}`}
                  loading="lazy" decoding="async"
                  width={t.canvas_w} height={t.canvas_h}
                  className="w-full h-auto object-cover bg-muted"
                />
                <div className="p-3">
                  <div className="text-sm font-mono text-foreground truncate">{t.title}</div>
                  <div className="text-xs text-muted-foreground">{t.canvas_ratio}</div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      <section aria-label="How to create a twibbon" className="mb-12 border-t border-border pt-10">
        <h2 className="text-xl font-mono font-bold text-foreground mb-6">How to Create a {keyword} Twibbon</h2>
        <ol className="space-y-4 list-decimal list-inside text-foreground">
          {howtoList.map((s, i) => (
            <li key={i}>
              <span className="font-semibold">{s.title}</span> — <span className="text-muted-foreground">{s.description}</span>
            </li>
          ))}
        </ol>
      </section>

      <section aria-label="Benefits" className="mb-12 border-t border-border pt-10">
        <h2 className="text-xl font-mono font-bold text-foreground mb-6">Why TwibMotion for {keyword} twibbons</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {benefitsList.map((b, i) => (
            <div key={i} className="rounded-lg border border-border p-4">
              <div className="font-mono font-semibold text-foreground mb-1">{b.title}</div>
              <div className="text-sm text-muted-foreground leading-relaxed">{b.description}</div>
            </div>
          ))}
        </div>
      </section>

      {faq.length > 0 && (
        <section aria-label="Frequently asked questions" className="mb-12 border-t border-border pt-10">
          <h2 className="text-xl font-mono font-bold text-foreground mb-6">Frequently Asked Questions</h2>
          <div className="space-y-6">
            {faq.map((f, i) => (
              <div key={i}>
                <h3 className="font-mono font-semibold text-foreground mb-2">{f.question}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{f.answer}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      <section aria-label="Create your twibbon" className="mb-12 border-t border-border pt-10 text-center">
        <h2 className="text-2xl font-mono font-bold text-foreground mb-4">Ready to design your {keyword} twibbon?</h2>
        <Link to={ctaPath} className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-primary text-primary-foreground font-mono font-semibold hover:opacity-90 transition-opacity">
          Open the Editor <ArrowRight className="w-4 h-4" />
        </Link>
      </section>

      {categoryRelated.length > 0 && (
        <section aria-label="Related twibbon categories" className="mb-12 border-t border-border pt-10">
          <h2 className="text-xl font-mono font-bold text-foreground mb-6">More in this category</h2>
          <div className="flex flex-wrap gap-2">
            {categoryRelated.map((r) => (
              <Link key={r.slug} to={r.route} className="px-3 py-2 rounded-lg border border-border text-sm font-mono text-foreground hover:border-primary/60 hover:text-primary transition-colors">
                {r.keyword}
              </Link>
            ))}
          </div>
        </section>
      )}

      {related.length > 0 && (
        <section aria-label="Related twibbon keywords" className="mb-12 border-t border-border pt-10">
          <h2 className="text-xl font-mono font-bold text-foreground mb-6">Related Twibbon Keywords</h2>
          <div className="flex flex-wrap gap-2">
            {related.map((r) => (
              <Link key={r.slug} to={r.route} className="px-3 py-2 rounded-lg border border-border text-sm font-mono text-foreground hover:border-primary/60 hover:text-primary transition-colors">
                {r.keyword}
              </Link>
            ))}
            <Link to="/blog" className="px-3 py-2 rounded-lg border border-border text-sm font-mono text-muted-foreground hover:border-primary/60 hover:text-primary transition-colors">
              Blog
            </Link>
          </div>
        </section>
      )}

      {blogLinks.length > 0 && (
        <section aria-label="Related articles" className="border-t border-border pt-10">
          <h2 className="text-xl font-mono font-bold text-foreground mb-6">Related Articles</h2>
          <ul className="space-y-2">
            {blogLinks.map((b) => (
              <li key={b.slug}>
                <Link to={`/blog/${b.slug}`} className="text-primary hover:underline font-mono text-sm">
                  {b.title}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </>
  );
}