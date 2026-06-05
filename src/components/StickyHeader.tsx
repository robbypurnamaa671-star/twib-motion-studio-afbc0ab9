import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

interface StickyHeaderProps {
  children: React.ReactNode;
  className?: string;
}

export function StickyHeader({ children, className }: StickyHeaderProps) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "sticky top-0 z-50 transition-all duration-300",
        scrolled
          ? "bg-background/85 backdrop-blur-xl shadow-[0_1px_3px_-1px_rgba(0,0,0,0.08)] border-b border-border/50"
          : "bg-transparent border-b border-transparent",
        className
      )}
    >
      {children}
    </header>
  );
}
