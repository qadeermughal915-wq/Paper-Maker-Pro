import { useGetMe } from "@workspace/api-client-react";
import { useImpersonation } from "@/hooks/use-impersonation";
import { Button } from "@/components/ui/button";
import { UserCog, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export function ImpersonationBanner() {
  const { isImpersonating, stopImpersonation, isStopping } = useImpersonation();
  const { data: me } = useGetMe();
  const { toast } = useToast();

  if (!isImpersonating) return null;

  const handleExit = async () => {
    try {
      await stopImpersonation();
    } catch {
      toast({
        title: "Failed to exit impersonation",
        description: "Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="sticky top-0 left-0 right-0 z-50 bg-amber-500 text-amber-950 px-4 py-2 flex items-center justify-center gap-3 text-sm font-medium shadow-md">
      <UserCog className="h-4 w-4" />
      <span>
        Viewing as <strong>{me?.name || me?.email}</strong>
        {me?.role ? ` (${me.role.replace(/_/g, " ")})` : ""}
      </span>
      <Button
        size="sm"
        variant="secondary"
        className="h-7 px-3 bg-amber-950 text-amber-50 hover:bg-amber-900"
        onClick={handleExit}
        disabled={isStopping}
      >
        {isStopping ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Exit"}
      </Button>
    </div>
  );
}
