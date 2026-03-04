import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import Index from "./pages/Index";
import Editor from "./pages/Editor";
import UseTemplate from "./pages/UseTemplate";
import NotFound from "./pages/NotFound";
import AdminDashboard from "./pages/admin/Dashboard";
import UsersPage from "./pages/admin/UsersPage";
import TemplatesPage from "./pages/admin/TemplatesPage";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/editor" element={<Editor />} />
            <Route path="/use-template/:templateId" element={<UseTemplate />} />
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
            <Route path="/admin/users" element={<UsersPage />} />
            <Route path="/admin/templates" element={<TemplatesPage />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
