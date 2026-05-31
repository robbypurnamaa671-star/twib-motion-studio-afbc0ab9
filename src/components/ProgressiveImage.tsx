import { useEffect, useRef, useState } from "react";

const LOADED_CACHE_KEY = "twib_img_loaded_v1";

function readCache(): Set<string> {
  try {
    const raw = sessionStorage.getItem(LOADED_CACHE_KEY);
    if (!raw) return new Set();
    return new Set(JSON.parse(raw) as string[]);
  } catch {
    return new Set();
  }
}

function markLoaded(src: string) {
  try {
    const cache = readCache();
    cache.add(src);
    sessionStorage.setItem(LOADED_CACHE_KEY, JSON.stringify(Array.from(cache).slice(-300)));
  } catch {
    /* ignore quota errors */
  }
}

interface ProgressiveImageProps {
  src: string;
  alt: string;
  className?: string;
  rootMargin?: string;
}

/**
 * Lazy-loads images via IntersectionObserver and fades them in.
 * Caches "already loaded" URLs in sessionStorage so revisiting the
 * homepage skips the fade-in and shows them immediately.
 */
export const ProgressiveImage = ({
  src,
  alt,
  className = "",
  rootMargin = "200px",
}: ProgressiveImageProps) => {
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const cachedRef = useRef<boolean>(readCache().has(src));
  const [inView, setInView] = useState(cachedRef.current);
  const [loaded, setLoaded] = useState(cachedRef.current);

  useEffect(() => {
    if (cachedRef.current) return;
    const el = wrapperRef.current;
    if (!el || typeof IntersectionObserver === "undefined") {
      setInView(true);
      return;
    }
    const obs = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            setInView(true);
            obs.disconnect();
            break;
          }
        }
      },
      { rootMargin },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [rootMargin]);

  return (
    <div ref={wrapperRef} className={`relative w-full h-full overflow-hidden bg-muted/40 ${className}`}>
      {!loaded && (
        <div className="absolute inset-0 animate-pulse bg-gradient-to-br from-muted/40 via-muted/20 to-muted/40" />
      )}
      {inView && (
        <img
          src={src}
          alt={alt}
          loading="lazy"
          decoding="async"
          onLoad={() => {
            setLoaded(true);
            markLoaded(src);
          }}
          className={`w-full h-full object-cover transition-opacity duration-500 ${loaded ? "opacity-100" : "opacity-0"}`}
        />
      )}
    </div>
  );
};

export default ProgressiveImage;