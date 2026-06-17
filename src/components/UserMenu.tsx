import { LogOut, User, LayoutDashboard, FolderKanban, Heart, Settings as Cog, ChevronDown, Users, Gift } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { NotificationBell } from "@/components/community/NotificationBell";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const UserMenu = () => {
  const { user, loading, signInWithGoogle, signOut } = useAuth();
  const { t } = useTranslation();

  if (loading) return null;

  if (!user) {
    return (
      <button
        onClick={signInWithGoogle}
        className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border bg-card text-foreground text-sm font-medium hover:bg-secondary transition-colors"
      >
        <svg className="w-4 h-4" viewBox="0 0 24 24">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
        </svg>
        {t("common.signInGoogle")}
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <NotificationBell />
      <Link
        to="/dashboard"
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-primary/40 bg-primary/10 text-primary text-sm font-mono hover:bg-primary/20 transition-colors"
        title="My Dashboard"
      >
        <LayoutDashboard className="w-4 h-4" />
        <span className="hidden sm:inline">Dashboard</span>
      </Link>
      <DropdownMenu>
        <DropdownMenuTrigger className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-secondary text-sm hover:bg-secondary/70 outline-none">
          {user.user_metadata?.avatar_url ? (
            <img src={user.user_metadata.avatar_url} alt="" className="w-6 h-6 rounded-full" />
          ) : (
            <User className="w-4 h-4 text-muted-foreground" />
          )}
          <span className="text-foreground font-medium max-w-[120px] truncate hidden sm:inline">
            {user.user_metadata?.full_name || user.email?.split("@")[0]}
          </span>
          <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel className="font-mono text-xs text-muted-foreground truncate">
            {user.email}
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <Link to="/dashboard" className="cursor-pointer">
              <LayoutDashboard className="w-4 h-4 mr-2" /> Dashboard
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link to="/dashboard/templates" className="cursor-pointer">
              <FolderKanban className="w-4 h-4 mr-2" /> My Templates
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link to="/dashboard/favorites" className="cursor-pointer">
              <Heart className="w-4 h-4 mr-2" /> Favorites
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link to="/dashboard/following" className="cursor-pointer">
              <Users className="w-4 h-4 mr-2" /> Following
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link to="/dashboard/referrals" className="cursor-pointer">
              <Gift className="w-4 h-4 mr-2" /> Referrals
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link to="/dashboard/profile" className="cursor-pointer">
              <Cog className="w-4 h-4 mr-2" /> Profile settings
            </Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={signOut} className="cursor-pointer text-destructive focus:text-destructive">
            <LogOut className="w-4 h-4 mr-2" /> {t("common.signOut")}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

export default UserMenu;
