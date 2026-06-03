import { Link } from "react-router-dom";
import { Layers } from "lucide-react";
import UserMenu from "@/components/UserMenu";
import LanguageSwitcher from "@/components/LanguageSwitcher";

export default function SeoShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header>
        <nav className="border-b border-border px-6 py-4 flex items-center justify-between" aria-label="Main navigation">
          <Link to="/" className="flex items-center gap-2" aria-label="TwibMotion home">
            <img src="/logo.png" alt="TwibMotion logo" width={32} height={32} className="w-8 h-8 rounded-md" />
            <span className="font-mono font-bold text-lg text-foreground tracking-tight">TwibMotion</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link to="/blog" className="text-sm font-mono text-muted-foreground hover:text-primary">Blog</Link>
            <UserMenu />
          </div>
        </nav>
      </header>
      <main className="flex-1 w-full max-w-4xl mx-auto px-6 py-12">{children}</main>
      <footer className="border-t border-border px-6 py-6 text-center flex flex-col items-center gap-3">
        <p className="text-xs text-muted-foreground">TwibMotion — Free Twibbon Maker</p>
        <LanguageSwitcher />
      </footer>
    </div>
  );
}