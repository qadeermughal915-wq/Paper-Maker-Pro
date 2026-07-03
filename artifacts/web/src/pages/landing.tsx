import { SignedIn, SignedOut } from "@/components/auth-state";
import { Redirect, Link } from "wouter";
import { Button } from "@/components/ui/button";
import logoIcon from "@assets/image_1783062400058.png";

export default function LandingPage() {
  return (
    <>
      <SignedIn>
        <Redirect to="/dashboard" />
      </SignedIn>
      <SignedOut>
        <div className="min-h-screen flex flex-col bg-background">
          <header className="px-6 lg:px-12 h-20 flex items-center justify-between border-b bg-white/50 backdrop-blur-md sticky top-0 z-50">
            <div className="flex items-center gap-3">
              <img src={logoIcon} alt="Paperz.pk Logo" className="h-8 w-8" />
              <span className="text-xl font-bold text-secondary tracking-tight">paperz.pk</span>
            </div>
            <div className="flex gap-4 items-center">
              <Link href="/sign-in">
                <Button variant="ghost" className="font-medium">Log in</Button>
              </Link>
              <Link href="/sign-up">
                <Button className="font-medium">Get started</Button>
              </Link>
            </div>
          </header>

          <main className="flex-1">
            <section className="py-24 lg:py-32 px-6 lg:px-12 max-w-6xl mx-auto text-center space-y-8">
              <h1 className="text-5xl lg:text-7xl font-bold text-secondary tracking-tight max-w-4xl mx-auto leading-tight">
                The smart way to build exam papers
              </h1>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                A dependable, no-nonsense tool for busy teachers and school admins in Pakistan. Assemble professional exam papers fast, in Urdu, English, or dual medium.
              </p>
              <div className="pt-8 flex justify-center gap-4">
                <Link href="/sign-up">
                  <Button size="lg" className="h-14 px-8 text-lg rounded-full">Start building free</Button>
                </Link>
                <Link href="/sign-in">
                  <Button size="lg" variant="outline" className="h-14 px-8 text-lg rounded-full border-border hover:bg-muted">Sign in to your school</Button>
                </Link>
              </div>
            </section>
          </main>
        </div>
      </SignedOut>
    </>
  );
}