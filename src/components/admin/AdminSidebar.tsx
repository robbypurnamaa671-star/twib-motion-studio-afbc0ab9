import { LayoutDashboard, Users, FileImage, LogOut, Layers, Crown, Search } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

const items = [
  { title: "Overview", url: "/admin/dashboard", icon: LayoutDashboard },
  { title: "Users", url: "/admin/users", icon: Users },
  { title: "Templates", url: "/admin/templates", icon: FileImage },
  { title: "Subscriptions", url: "/admin/subscriptions", icon: Crown },
  { title: "SEO Pages", url: "/admin/seo-pages", icon: Search },
];

export function AdminSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut } = useAuth();

  const isActive = (path: string) => location.pathname === path;

  return (
    <Sidebar collapsible="icon" className="border-r border-border">
      <SidebarContent>
        {/* Logo */}
        <div className="p-4 flex items-center gap-2 border-b border-border">
          <div className="w-8 h-8 rounded-md bg-primary flex items-center justify-center shrink-0">
            <Layers className="w-4 h-4 text-primary-foreground" />
          </div>
          {!collapsed && (
            <span className="font-mono font-bold text-sm text-foreground tracking-tight">
              Admin Panel
            </span>
          )}
        </div>

        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={isActive(item.url)}>
                    <NavLink
                      to={item.url}
                      end
                      className="hover:bg-muted/50"
                      activeClassName="bg-primary/10 text-primary font-medium"
                    >
                      <item.icon className="mr-2 h-4 w-4" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Bottom actions */}
        <div className="mt-auto p-4 border-t border-border space-y-2">
          <button
            onClick={() => navigate("/")}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <Layers className="w-4 h-4" />
            {!collapsed && <span>Back to App</span>}
          </button>
          <button
            onClick={signOut}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-destructive hover:bg-destructive/10 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            {!collapsed && <span>Logout</span>}
          </button>
        </div>
      </SidebarContent>
    </Sidebar>
  );
}
