import { useState } from "react";
import { Copy, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";

export function CloneButton({ templateId, slug }: { templateId: string; slug: string }) {
  const { user, signInWithGoogle } = useAuth();
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const onClick = async () => {
    if (!user) {
      toast({ title: "Sign in to clone templates" });
      void signInWithGoogle();
      return;
    }
    setLoading(true);
    const { data, error } = await supabase.rpc("clone_template", { _template_id: templateId });
    setLoading(false);
    if (error || !data) {
      toast({ title: "Clone failed", description: error?.message, variant: "destructive" });
      return;
    }
    toast({ title: "Template cloned!", description: "Saved as a private draft in My Templates." });
    navigate(`/dashboard/templates?cloned=${data}`);
  };

  return (
    <button
      onClick={onClick}
      disabled={loading}
      className="inline-flex items-center gap-2 px-4 py-3 rounded-lg border border-border text-sm font-mono text-foreground hover:border-primary/60 hover:text-primary transition-colors disabled:opacity-60"
      title={`Clone "${slug}"`}
    >
      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Copy className="w-4 h-4" />}
      Clone This Template
    </button>
  );
}

export default CloneButton;