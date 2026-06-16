import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import SEOHead from "@/components/SEOHead";
import SeoShell from "@/components/seo/SeoShell";
import { breadcrumbJsonLd } from "@/lib/seo-content";
import { fetchCollections, type Collection } from "@/lib/community-queries";

const BASE = "https://twib-motion-studio.lovable.app";

export default function CollectionsIndex() {
  const [cols, setCols] = useState<Collection[]>([]);
  useEffect(() => { fetchCollections().then(setCols); }, []);

  const url = `${BASE}/collections`;
  const title = "Koleksi Template Twibbon | TwibMotion";
  const description = "Koleksi template twibbon kuratif: MPLS, HUT RI, Ramadhan, Wisuda, Hari Guru, dan lainnya. Pilih event, mulai bikin twibbon dalam hitungan detik.";
  const jsonLd = [
    { "@context": "https://schema.org", "@type": "CollectionPage", name: title, url, description },
    breadcrumbJsonLd(BASE, [{ name: "Home", path: "/" }, { name: "Collections", path: "/collections" }]),
  ];

  return (
    <SeoShell>
      <SEOHead title={title} description={description} canonical={url} ogUrl={url} jsonLd={jsonLd} />
      <h1 className="text-3xl md:text-4xl font-mono font-bold text-foreground mb-3">Template Collections</h1>
      <p className="text-muted-foreground mb-8 max-w-2xl">{description}</p>
      {cols.length === 0 ? (
        <p className="text-sm text-muted-foreground">No collections yet.</p>
      ) : (
        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
          {cols.map((c) => (
            <Link
              key={c.id}
              to={`/collections/${c.slug}`}
              className="block p-5 rounded-lg border border-border bg-card hover:border-primary/60 transition-colors"
            >
              <h2 className="text-lg font-mono font-bold text-foreground">{c.title}</h2>
              {c.description && <p className="text-sm text-muted-foreground mt-2 line-clamp-3">{c.description}</p>}
            </Link>
          ))}
        </div>
      )}
    </SeoShell>
  );
}