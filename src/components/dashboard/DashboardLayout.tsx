import { ReactNode } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { LayoutDashboard, FolderKanban, User, BarChart3, Heart, Settings as Cog, ArrowLeft, Users, Bell, Gift } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect } from "react";
import SEOHead from "@/components/SEOHead";

const NAV = [
  { to: "/dashboard", label: "Overview", icon: LayoutDashboard, end: true },
  { to: "/dashboard/templates", label: "My Templates", icon: FolderKanban },
  { to: "/dashboard/profile", label: "Profile", icon: User },
  { to: "/dashboard/analytics", label: "Analytics", icon: BarChart3 },
  { to: "/dashboard/favorites", label: "Favorites", icon: Heart },
  { to: "/dashboard/following", label: "Following", icon: Users },
  { to: "/dashboard/notifications", label: "Notifications", icon: Bell },
  { to: "/dashboard/referrals", label: "Referrals", icon: Gift },
  { to: "/dashboard/settings", label: "Settings", icon: Cog },
];

export default function DashboardLayout({
  children,
  title,
  description,
}: {
  children: ReactNode;
  title: string;
  description?: string;
}) {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) navigate("/", { replace: true });
  }, [loading, user, navigate]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SEOHead title={`${title} · TwibMotion Dashboard`} description={description} noindex />
      <header className="border-b border-border bg-background/85 backdrop-blur-xl sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <a href="/" className="flex items-center gap-2">
            <img src="/logo.png" alt="TwibMotion" width={28} height={28} className="rounded-md" />
            <span className="font-mono font-bold tracking-tight">TwibMotion</span>
          </a>
          <button
            onClick={() => navigate("/")}
            className="text-xs font-mono text-muted-foreground hover:text-foreground flex items-center gap-1"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to site
          </button>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 grid grid-cols-1 md:grid-cols-[220px_1fr] gap-6">
        <aside className="md:sticky md:top-20 h-fit">
          <nav className="flex md:flex-col gap-1 overflow-x-auto md:overflow-visible">
            {NAV.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `flex items-center gap-2 px-3 py-2 rounded-md text-sm font-mono whitespace-nowrap transition-colors ${
                    isActive
                      ? "bg-primary/15 text-primary border border-primary/30"
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary border border-transparent"
                  }`
                }
              >
                <item.icon className="w-4 h-4" />
                {item.label}
              </NavLink>
            ))}
          </nav>
        </aside>

        <main className="min-w-0">
          <div className="mb-6">
            <h1 className="text-2xl md:text-3xl font-mono font-bold tracking-tight">{title}</h1>
            {description && <p className="text-muted-foreground text-sm mt-1">{description}</p>}
          </div>
          {children}
        </main>
      </div>
    </div>
  );
}