import { ReactNode } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AdminSidebar } from "./AdminSidebar";
import { AdminGuard } from "./AdminGuard";

export function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <AdminGuard>
      <div className="dark">
        <SidebarProvider>
          <div className="min-h-screen flex w-full bg-background text-foreground">
            <AdminSidebar />
            <div className="flex-1 flex flex-col">
              <header className="h-12 flex items-center border-b border-border px-4">
                <SidebarTrigger className="text-muted-foreground hover:text-foreground" />
              </header>
              <main className="flex-1 p-6 overflow-auto">{children}</main>
            </div>
          </div>
        </SidebarProvider>
      </div>
    </AdminGuard>
  );
}
