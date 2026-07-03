import { useState, useEffect } from "react";
import { useGetSchool, useUpdateSchool, getGetSchoolQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";

export default function SettingsPage() {
  const { data: school, isLoading } = useGetSchool();
  const updateSchool = useUpdateSchool();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [logoUrl, setLogoUrl] = useState("");

  useEffect(() => {
    if (school) {
      setName(school.name || "");
      setAddress(school.address || "");
      setPhone(school.phone || "");
      setLogoUrl(school.logoUrl || "");
    }
  }, [school]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateSchool.mutate(
      { data: { name, address, phone, logoUrl } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetSchoolQueryKey() });
          toast({ title: "School profile updated" });
        },
        onError: (err) => {
          toast({ title: "Error", description: err.message, variant: "destructive" });
        }
      }
    );
  };

  if (isLoading) {
    return <div className="h-64 flex items-center justify-center"><Loader2 className="animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-secondary">Settings</h1>
        <p className="text-muted-foreground mt-1">Manage your school profile.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>School Information</CardTitle>
          <CardDescription>Update your school's official details.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>School Name</Label>
              <Input required value={name} onChange={e => setName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Address</Label>
              <Input value={address} onChange={e => setAddress(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Phone Number</Label>
              <Input value={phone} onChange={e => setPhone(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Logo URL</Label>
              <Input value={logoUrl} onChange={e => setLogoUrl(e.target.value)} placeholder="https://..." />
            </div>
            <Button type="submit" disabled={updateSchool.isPending}>
              {updateSchool.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}