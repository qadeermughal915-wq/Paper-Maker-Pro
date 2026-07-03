import { SignUp } from "@clerk/react";
import { SignedIn, SignedOut } from "@/components/auth-state";
import { Redirect } from "wouter";
import logoIcon from "@assets/image_1783062400058.png";
import { Card } from "@/components/ui/card";

export default function SignUpPage() {
  return (
    <>
      <SignedIn>
        <Redirect to="/dashboard" />
      </SignedIn>
      <SignedOut>
        <div className="min-h-screen bg-muted/30 flex items-center justify-center p-4">
          <Card className="w-full max-w-md p-8 border-none shadow-xl bg-white flex flex-col items-center">
            <div className="w-full flex justify-center mb-8">
              <img src={logoIcon} alt="Paperz.pk" className="h-16 w-16" />
            </div>
            <SignUp 
              routing="path" 
              path="/sign-up"
              appearance={{
                elements: {
                  rootBox: "w-full",
                  card: "shadow-none border-0 p-0",
                  headerTitle: "text-2xl font-bold text-foreground",
                  headerSubtitle: "text-muted-foreground",
                  formButtonPrimary: "bg-primary text-primary-foreground hover:bg-primary/90",
                  footerActionLink: "text-primary hover:text-primary/90"
                }
              }}
            />
          </Card>
        </div>
      </SignedOut>
    </>
  );
}