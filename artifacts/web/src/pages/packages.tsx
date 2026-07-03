import { useListPackages, useGetSubscription, useSubscribe, getGetSubscriptionQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Check } from "lucide-react";

export default function PackagesPage() {
  const { data: packages, isLoading: loadingPkgs } = useListPackages();
  const { data: subscription, isLoading: loadingSub } = useGetSubscription();
  const subscribe = useSubscribe();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const handleSubscribe = (packageId: number) => {
    subscribe.mutate(
      { data: { packageId } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetSubscriptionQueryKey() });
          toast({ title: "Subscription updated successfully" });
        },
        onError: (err) => toast({ title: "Error", description: err.message, variant: "destructive" })
      }
    );
  };

  if (loadingPkgs || loadingSub) {
    return <div className="h-64 flex items-center justify-center"><Loader2 className="animate-spin text-primary" /></div>;
  }

  const activePkgs = packages?.filter(p => p.isActive) || [];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-secondary">Subscription</h1>
        <p className="text-muted-foreground mt-1">Manage your plan and usage limits.</p>
      </div>

      {subscription && subscription.status !== 'none' && (
        <Card className="bg-primary/5 border-primary/20">
          <CardHeader>
            <CardTitle>Current Plan: {subscription.packageName}</CardTitle>
            <CardDescription>
              Status: <span className="font-semibold text-foreground capitalize">{subscription.status}</span>
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      <div className="grid md:grid-cols-3 gap-6">
        {activePkgs.map(pkg => {
          const isCurrent = subscription?.packageId === pkg.id;
          return (
            <Card key={pkg.id} className={isCurrent ? "border-primary shadow-md" : ""}>
              <CardHeader>
                <CardTitle>{pkg.name}</CardTitle>
                <div className="text-3xl font-bold">Rs. {pkg.price} <span className="text-sm font-normal text-muted-foreground">/{pkg.billingPeriod}</span></div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between border-b pb-1">
                    <span className="text-muted-foreground">Teachers</span>
                    <span className="font-medium">{pkg.maxTeachers || "Unlimited"}</span>
                  </div>
                  <div className="flex justify-between border-b pb-1">
                    <span className="text-muted-foreground">Questions</span>
                    <span className="font-medium">{pkg.maxQuestions || "Unlimited"}</span>
                  </div>
                  <div className="flex justify-between border-b pb-1">
                    <span className="text-muted-foreground">Papers/mo</span>
                    <span className="font-medium">{pkg.maxPapers || "Unlimited"}</span>
                  </div>
                </div>
                {pkg.features && pkg.features.length > 0 && (
                  <ul className="space-y-2 mt-4 text-sm">
                    {pkg.features.map((f, i) => (
                      <li key={i} className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-primary" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
              <CardFooter>
                <Button 
                  className="w-full" 
                  variant={isCurrent ? "outline" : "default"}
                  disabled={isCurrent || subscribe.isPending}
                  onClick={() => handleSubscribe(pkg.id)}
                >
                  {isCurrent ? "Current Plan" : "Switch to " + pkg.name}
                </Button>
              </CardFooter>
            </Card>
          );
        })}
      </div>
    </div>
  );
}