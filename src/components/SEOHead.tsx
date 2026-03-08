import { useEffect } from "react";

interface SEOHeadProps {
  title?: string;
  description?: string;
  canonical?: string;
  noindex?: boolean;
}

const DEFAULT_TITLE = "TwibMotion – Free Twibbon Maker for Photos, GIFs, and Videos";
const DEFAULT_DESC = "TwibMotion is a free online twibbon maker that lets you create twibbons by layering frames over photos, GIFs, or videos. Export high-quality twibbons for campaigns, social media, Reels, and events in seconds.";

const SEOHead = ({ title, description, canonical, noindex }: SEOHeadProps) => {
  useEffect(() => {
    const t = title || DEFAULT_TITLE;
    const d = description || DEFAULT_DESC;

    document.title = t;

    const setMeta = (attr: string, key: string, content: string) => {
      let el = document.querySelector(`meta[${attr}="${key}"]`) as HTMLMetaElement | null;
      if (!el) {
        el = document.createElement("meta");
        el.setAttribute(attr, key);
        document.head.appendChild(el);
      }
      el.setAttribute("content", content);
    };

    setMeta("name", "description", d);
    setMeta("property", "og:title", t);
    setMeta("property", "og:description", d);
    setMeta("name", "twitter:title", t);
    setMeta("name", "twitter:description", d);

    if (canonical) {
      let link = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
      if (!link) {
        link = document.createElement("link");
        link.setAttribute("rel", "canonical");
        document.head.appendChild(link);
      }
      link.setAttribute("href", canonical);
    }

    if (noindex) {
      setMeta("name", "robots", "noindex, nofollow");
    } else {
      const robotsMeta = document.querySelector('meta[name="robots"]');
      if (robotsMeta) robotsMeta.remove();
    }
  }, [title, description, canonical, noindex]);

  return null;
};

export default SEOHead;
