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
import SeoPagesPage from "./pages/admin/SeoPagesPage";
import CreditsPage from "./pages/admin/CreditsPage";
import ReportsPage from "./pages/admin/ReportsPage";
import AnalyticsPage from "./pages/admin/AnalyticsPage";
import AuditLogsPage from "./pages/admin/AuditLogsPage";
import SettingsPage from "./pages/admin/SettingsPage";
import DiagnosticsPage from "./pages/admin/DiagnosticsPage";
import TwibbonSEO from "./pages/TwibbonSEO";
import GlobalSEO from "./pages/GlobalSEO";
import BlogIndex from "./pages/BlogIndex";
import BlogPost from "./pages/BlogPost";
import TemplateSEO from "./pages/TemplateSEO";
import BlogPostsPage from "./pages/admin/BlogPostsPage";

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
              <Route path="/twibbon/:keyword" element={<TwibbonSEO />} />
              <Route path="/blog" element={<BlogIndex />} />
              <Route path="/blog/:slug" element={<BlogPost />} />
              <Route path="/template/:slug" element={<TemplateSEO />} />
              <Route path="/animated-twibbon-maker" element={<GlobalSEO />} />
              <Route path="/video-twibbon-maker" element={<GlobalSEO />} />
              <Route path="/gif-twibbon-maker" element={<GlobalSEO />} />
              <Route path="/twibbon-for-reels" element={<GlobalSEO />} />
              <Route path="/online-twibbon-creator" element={<GlobalSEO />} />
              <Route path="/twibbon-video-frame" element={<GlobalSEO />} />
              <Route path="/modern-twibbon-maker" element={<GlobalSEO />} />
              <Route path="/twibbon-template-online" element={<GlobalSEO />} />
              <Route path="/twibbon-frame-maker" element={<GlobalSEO />} />
              <Route path="/digital-campaign-frame-maker" element={<GlobalSEO />} />
              <Route path="/gif-twibbon-creator" element={<GlobalSEO />} />
              <Route path="/social-media-overlay-frame" element={<GlobalSEO />} />
              <Route path="/facebook-frame-maker" element={<GlobalSEO />} />
              <Route path="/instagram-frame-maker" element={<GlobalSEO />} />
              <Route path="/social-media-frame-maker" element={<GlobalSEO />} />
              <Route path="/campaign-frame-maker" element={<GlobalSEO />} />
              <Route path="/profile-frame-maker" element={<GlobalSEO />} />
              <Route path="/event-frame-maker" element={<GlobalSEO />} />
              <Route path="/online-twibbon-maker" element={<GlobalSEO />} />
              <Route path="/country/:slug" element={<GlobalSEO />} />
              <Route path="/indonesia/:slug" element={<GlobalSEO />} />
              <Route path="/use-template/:templateId" element={<UseTemplate />} />
              <Route path="/admin/dashboard" element={<AdminGuard><AdminDashboard /></AdminGuard>} />
              <Route path="/admin/users" element={<AdminGuard><UsersPage /></AdminGuard>} />
              <Route path="/admin/templates" element={<AdminGuard><TemplatesPage /></AdminGuard>} />
              <Route path="/admin/subscriptions" element={<AdminGuard><AdminSubscriptions /></AdminGuard>} />
              <Route path="/admin/credits" element={<AdminGuard><CreditsPage /></AdminGuard>} />
              <Route path="/admin/reports" element={<AdminGuard><ReportsPage /></AdminGuard>} />
              <Route path="/admin/analytics" element={<AdminGuard><AnalyticsPage /></AdminGuard>} />
              <Route path="/admin/audit" element={<AdminGuard><AuditLogsPage /></AdminGuard>} />
              <Route path="/admin/settings" element={<AdminGuard><SettingsPage /></AdminGuard>} />
              <Route path="/admin/diagnostics" element={<AdminGuard><DiagnosticsPage /></AdminGuard>} />
              <Route path="/admin/seo-pages" element={<AdminGuard><SeoPagesPage /></AdminGuard>} />
              <Route path="/admin/blog" element={<AdminGuard><BlogPostsPage /></AdminGuard>} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </SubscriptionProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
