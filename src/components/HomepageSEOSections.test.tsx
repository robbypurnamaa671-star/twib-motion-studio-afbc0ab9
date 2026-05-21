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
  { label: "How to Create a Twibbon in Seconds", h2: /how to create a twibbon in seconds/i },
  { label: "Create Twibbons for Instagram, TikTok, and Social Media", h2: /create twibbons for instagram/i },
  { label: "Twibbon Maker for Campaigns, Schools, and Events", h2: /twibbon maker for campaigns/i },
  { label: "Why Choose TwibMotion", h2: /why choose twibmotion/i },
  { label: "Frequently Asked Questions About Twibbons", h2: /frequently asked questions about twibbons/i },
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

    it("renders all five SEO sections with semantic landmarks and H2 headings", () => {
      for (const section of EXPECTED_SECTIONS) {
        const region = screen.getByRole("region", { name: section.label });
        expect(region).toBeInTheDocument();
        const heading = within(region).getByRole("heading", { level: 2 });
        expect(heading.textContent || "").toMatch(section.h2);
      }
    });

    it("renders the 3 step articles, 4 use-case articles, and 4 why-choose articles", () => {
      const steps = within(screen.getByRole("region", { name: "How to Create a Twibbon in Seconds" })).getAllByRole("article");
      expect(steps).toHaveLength(3);

      const useCases = within(screen.getByRole("region", { name: "Create Twibbons for Instagram, TikTok, and Social Media" })).getAllByRole("article");
      expect(useCases).toHaveLength(4);

      const why = within(screen.getByRole("region", { name: "Why Choose TwibMotion" })).getAllByRole("article");
      expect(why).toHaveLength(4);
    });

    it("renders 5 collapsed FAQ items that expand on click", () => {
      const faqRegion = screen.getByRole("region", { name: "Frequently Asked Questions About Twibbons" });
      const triggers = within(faqRegion).getAllByRole("button");
      expect(triggers).toHaveLength(5);
      triggers.forEach((t) => expect(t).toHaveAttribute("aria-expanded", "false"));

      fireEvent.click(triggers[0]);
      expect(triggers[0]).toHaveAttribute("aria-expanded", "true");
      expect(within(faqRegion).getByText(/digital overlay or frame/i)).toBeInTheDocument();
    });
  });
});