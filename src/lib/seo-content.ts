// Helpers for programmatic SEO: slugify keywords, generate default copy, build JSON-LD blocks.

export function slugify(s: string) {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

export function defaultCopyForKeyword(keyword: string) {
  const k = keyword.trim();
  return {
    title: `Twibbon ${k} – Free Online Twibbon Maker | TwibMotion`,
    meta_description: `Create a twibbon ${k} online with photo, GIF, or video. Free, no signup, HD export in seconds.`,
    intro_text: `Make a twibbon ${k} in minutes with TwibMotion. Upload your photo, GIF, or short video, drop the ${k} frame on top, and export in HD ready for Instagram, TikTok, and WhatsApp.`,
    h1: `Create ${k} Twibbon Online`,
    faq_json: [
      { question: `Is the ${k} twibbon free?`, answer: "Yes. TwibMotion is free to use. Premium removes the small watermark." },
      { question: `Can I use a video or GIF for my ${k} twibbon?`, answer: "Yes. TwibMotion supports JPG, PNG, GIF, and MP4 up to 30 seconds." },
    ],
  };
}

export function howToJsonLd(name: string, steps: { title: string; description: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name,
    step: steps.map((s, i) => ({
      "@type": "HowToStep",
      position: i + 1,
      name: s.title,
      text: s.description,
    })),
  };
}

export function breadcrumbJsonLd(base: string, items: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((it, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: it.name,
      item: base + it.path,
    })),
  };
}

export const DEFAULT_HOWTO = [
  { title: "Open the editor", description: "Pick a canvas ratio that fits the platform you'll share on (9:16 for Reels, 1:1 for feed, 16:9 for YouTube)." },
  { title: "Upload your media", description: "Drop a photo, GIF, or short video as your bottom layer." },
  { title: "Add the twibbon frame", description: "Place the campaign frame on top, then scale and position your media to fit." },
  { title: "Export and share", description: "Export as HD image, GIF, or MP4 and share to Instagram, TikTok, or WhatsApp." },
];

export const DEFAULT_BENEFITS = [
  { title: "Animated frames", description: "Use GIFs or short videos as twibbon frames—not just static PNGs." },
  { title: "Browser-based", description: "Everything runs in your browser. No installs, no signup, no upload to servers." },
  { title: "Mobile-first", description: "Works smoothly on phones, perfect for last-minute event posts." },
  { title: "HD exports", description: "Export crisp PNG, GIF, or MP4 ready for Instagram, TikTok, and WhatsApp." },
];