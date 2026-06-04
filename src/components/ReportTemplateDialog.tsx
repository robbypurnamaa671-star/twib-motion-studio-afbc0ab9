import { useState } from "react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Flag } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

const REASONS = ["Inappropriate content", "Copyright violation", "Spam", "Hate speech", "Other"];

export function ReportTemplateDialog({ templateId }: { templateId: string }) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState(REASONS[0]);
  const [details, setDetails] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!user) { toast.error("Sign in to report"); return; }
    setBusy(true);
    const { error } = await supabase.from("template_reports").insert({
      template_id: templateId, reporter_id: user.id, reason, details: details || null,
    });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Report submitted. Thank you.");
    setOpen(false); setDetails("");
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-destructive transition-colors" title="Report this template">
          <Flag className="w-3 h-3" /> Report
        </button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Report this template</DialogTitle></DialogHeader>
        <div className="space-y-3 text-sm">
          <Select value={reason} onValueChange={setReason}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {REASONS.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
            </SelectContent>
          </Select>
          <Textarea placeholder="Optional: more details" value={details} onChange={e => setDetails(e.target.value)} />
        </div>
        <DialogFooter>
          <Button onClick={submit} disabled={busy} variant="destructive">{busy ? "Submitting…" : "Submit report"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}