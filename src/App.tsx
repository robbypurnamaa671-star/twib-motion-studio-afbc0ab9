import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { AdminGuard } from "@/components/admin/AdminGuard";
import { SubscriptionProvider } from "@/contexts/SubscriptionContext";
import Index from "./pages/Index";
import Editor from "./pages/Editor";
import UseTemplate from "./pages/UseTemplate";
import CreateTwibbon from "./pages/CreateTwibbon";
import NotFound from "./pages/NotFound";
import AdminDashboard from "./pages/admin/Dashboard";
import UsersPage from "./pages/admin/UsersPage";
import TemplatesPage from "./pages/admin/TemplatesPage";
import AdminSubscriptions from "./pages/admin/SubscriptionsPage";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <SubscriptionProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/editor" element={<Editor />} />
              <Route path="/create/:ratio" element={<CreateTwibbon />} />
              <Route path="/use-template/:templateId" element={<UseTemplate />} />
              <Route path="/admin/dashboard" element={<AdminGuard><AdminDashboard /></AdminGuard>} />
              <Route path="/admin/users" element={<AdminGuard><UsersPage /></AdminGuard>} />
              <Route path="/admin/templates" element={<AdminGuard><TemplatesPage /></AdminGuard>} />
              <Route path="/admin/subscriptions" element={<AdminGuard><AdminSubscriptions /></AdminGuard>} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </SubscriptionProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
