import { describe, it, expect, beforeEach } from "vitest";
import { render } from "@testing-library/react";
import { screen, fireEvent, within } from "@testing-library/dom";
import HomepageSEOSections from "./HomepageSEOSections";
import { MemoryRouter } from "react-router-dom";

const BREAKPOINTS = [
  { name: "mobile-small", width: 320, height: 568 },
  { name: "mobile", width: 375, height: 812 },
  { name: "tablet", width: 768, height: 1024 },
  { name: "desktop", width: 1366, height: 768 },
  { name: "desktop-large", width: 1920, height: 1080 },
];

const setViewport = (width: number, height: number) => {
  Object.defineProperty(window, "innerWidth", { writable: true, configurable: true, value: width });
  Object.defineProperty(window, "innerHeight", { writable: true, configurable: true, value: height });
  window.dispatchEvent(new Event("resize"));
};

const EXPECTED_SECTIONS = [
  { label: "Built for Modern Social Content", h2: /built for modern social content/i },
  { label: "Why Choose Twibmotion", h2: /beyond static frame generators/i },
  { label: "Live Editor Preview", h2: /two-layer overlay studio/i },
  { label: "Template Gallery", h2: /ready-to-use overlay categories/i },
  { label: "Export Formats", h2: /export for every platform/i },
  { label: "Popular Overlay Categories", h2: /popular overlay categories/i },
  { label: "Frequently Asked Questions", h2: /frequently asked questions/i },
  { label: "Start Creating", h2: /start creating your overlay now/i },
];

describe("HomepageSEOSections", () => {
  describe.each(BREAKPOINTS)("at $name ($width x $height)", ({ width, height }) => {
    beforeEach(() => {
      setViewport(width, height);
      render(
        <MemoryRouter>
          <HomepageSEOSections />
        </MemoryRouter>,
      );
    });

    it("renders all SEO sections with semantic landmarks and H2 headings", () => {
      for (const section of EXPECTED_SECTIONS) {
        const region = screen.getByRole("region", { name: section.label });
        expect(region).toBeInTheDocument();
        const heading = within(region).getByRole("heading", { level: 2 });
        expect(heading.textContent || "").toMatch(section.h2);
      }
    });

    it("renders 6 platform cards, 6 differentiators, and 8 template categories", () => {
      const platforms = within(screen.getByRole("region", { name: "Built for Modern Social Content" })).getAllByRole("article");
      expect(platforms).toHaveLength(6);

      const diff = within(screen.getByRole("region", { name: "Why Choose Twibmotion" })).getAllByRole("article");
      expect(diff).toHaveLength(6);

      const templates = within(screen.getByRole("region", { name: "Template Gallery" })).getAllByRole("link");
      // 8 category links + 1 "Browse all" link
      expect(templates.length).toBeGreaterThanOrEqual(8);
    });

    it("renders 6 collapsed FAQ items that expand on click", () => {
      const faqRegion = screen.getByRole("region", { name: "Frequently Asked Questions" });
      const triggers = within(faqRegion).getAllByRole("button");
      expect(triggers).toHaveLength(6);
      triggers.forEach((t) => expect(t).toHaveAttribute("aria-expanded", "false"));

      fireEvent.click(triggers[0]);
      expect(triggers[0]).toHaveAttribute("aria-expanded", "true");
      expect(within(faqRegion).getByText(/browser-based animated overlay maker/i)).toBeInTheDocument();
    });
  });
});