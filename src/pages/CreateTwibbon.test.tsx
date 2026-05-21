import { describe, it, expect, vi } from "vitest";
import { render } from "@testing-library/react";
import { screen, within } from "@testing-library/dom";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import CreateTwibbon from "./CreateTwibbon";

vi.mock("@/components/SEOHead", () => ({ default: () => null }));
vi.mock("@/components/UserMenu", () => ({ default: () => null }));

const renderAt = (path: string) =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/create/:ratio" element={<CreateTwibbon />} />
        <Route path="/" element={<div>Home</div>} />
      </Routes>
    </MemoryRouter>,
  );

const cases = [
  {
    slug: "vertical-9-16",
    h1: "9:16 Vertical Twibbon Maker for Stories, Reels & TikTok",
    bestFor: ["Instagram Stories & Reels", "TikTok videos", "YouTube Shorts", "Snapchat campaigns"],
    cta: /open the 9:16 editor/i,
    href: "/editor?ratio=9:16&w=1080&h=1920",
  },
  {
    slug: "square-1-1",
    h1: "1:1 Square Twibbon Maker for Feed Posts",
    bestFor: ["Instagram feed posts", "Facebook & LinkedIn updates", "Twitter / X campaigns", "Profile picture frames"],
    cta: /open the 1:1 editor/i,
    href: "/editor?ratio=1:1&w=1080&h=1080",
  },
  {
    slug: "landscape-16-9",
    h1: "16:9 Landscape Twibbon Maker for YouTube & Events",
    bestFor: ["YouTube videos & thumbnails", "Webinar overlays", "Event & conference banners", "Presentation slides"],
    cta: /open the 16:9 editor/i,
    href: "/editor?ratio=16:9&w=1920&h=1080",
  },
];

describe("CreateTwibbon page", () => {
  cases.forEach((c) => {
    describe(c.slug, () => {
      it("renders the correct H1", () => {
        renderAt(`/create/${c.slug}`);
        const h1 = screen.getByRole("heading", { level: 1 });
        expect(h1).toHaveTextContent(c.h1);
      });

      it("renders the complete best-for list", () => {
        renderAt(`/create/${c.slug}`);
        const list = screen.getByRole("region", { name: /best for/i }).querySelector("ul")!;
        const items = within(list).getAllByRole("listitem");
        expect(items).toHaveLength(c.bestFor.length);
        c.bestFor.forEach((b, i) => {
          expect(items[i]).toHaveTextContent(b);
        });
      });

      it("links the primary CTA to the editor with the correct ratio params", () => {
        renderAt(`/create/${c.slug}`);
        const cta = screen.getByRole("link", { name: c.cta });
        expect(cta).toHaveAttribute("href", c.href);
      });
    });
  });

  it("redirects unknown slugs to home", () => {
    renderAt("/create/unknown-slug");
    expect(screen.getByText("Home")).toBeInTheDocument();
    expect(screen.queryByRole("heading", { level: 1 })).not.toBeInTheDocument();
  });
});