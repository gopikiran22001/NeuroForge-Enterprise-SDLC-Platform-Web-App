import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useSession } from "@/lib/session";
import { toast } from "sonner";
import { NeuroForgeLogo } from "@/components/neuroforge-logo";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Sign in · NeuroForge Nexus" },
      {
        name: "description",
        content: "Sign in to NeuroForge Nexus, the enterprise SDLC platform.",
      },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const { login } = useSession();
  const [email, setEmail] = useState();
  const [pw, setPw] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !pw) {
      toast.error("Please fill in all fields.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      await login(email, pw);
      toast.success("Signed in successfully!");
      navigate({ to: "/" });
    } catch (err) {
      const errMsg = err.message || "Failed to sign in. Please check your credentials.";
      setError(errMsg);
      toast.error(errMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-background">
      {/* Brand panel */}
      <div className="hidden lg:flex relative flex-col justify-between bg-foreground text-background p-10 overflow-hidden">
        <div className="flex items-center gap-2">
          <div className="grid size-8 place-items-center shrink-0">
            <NeuroForgeLogo className="size-7" />
          </div>
          <div className="font-display text-lg">NeuroForge Nexus</div>
        </div>

        <div className="relative">
          <blockquote className="font-display text-3xl leading-tight italic max-w-md">
            "We collapsed six tools into one delivery cockpit. Cycle time dropped 38% in a quarter."
          </blockquote>
        </div>

        <div className="grid grid-cols-3 gap-6 text-sm opacity-80">
          <div>
            <div className="font-display text-2xl tnum">247</div>
            <div className="text-[11px] uppercase tracking-wider opacity-70">Active projects</div>
          </div>
          <div>
            <div className="font-display text-2xl tnum">2,847</div>
            <div className="text-[11px] uppercase tracking-wider opacity-70">Users</div>
          </div>
          <div>
            <div className="font-display text-2xl tnum">99.99%</div>
            <div className="text-[11px] uppercase tracking-wider opacity-70">Uptime</div>
          </div>
        </div>

        <div className="pointer-events-none absolute -right-40 top-1/2 -translate-y-1/2 size-[520px] rounded-full bg-primary/25 blur-3xl" />
      </div>

      {/* Form */}
      <div className="flex items-center justify-center p-8">
        <div className="w-full max-w-sm">
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <div className="grid size-8 place-items-center shrink-0">
              <NeuroForgeLogo className="size-7 text-primary" />
            </div>
            <div className="font-display text-lg">NeuroForge Nexus</div>
          </div>

          <h1 className="font-display text-3xl">Welcome back</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Sign in to your workspace to continue.
          </p>

          {error && (
            <div className="mt-4 p-3 rounded-lg border border-destructive/20 bg-destructive/10 text-xs text-destructive">
              {error}
            </div>
          )}

          <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-1.5">
              <Label htmlFor="email">Work email</Label>
              <Input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
              />
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="pw">Password</Label>
                <button
                  type="button"
                  className="text-[11px] text-muted-foreground hover:text-foreground"
                >
                  Forgot?
                </button>
              </div>
              <Input
                id="pw"
                type="password"
                required
                value={pw}
                onChange={(e) => setPw(e.target.value)}
                disabled={loading}
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <>
                  Signing in <Loader2 className="size-3.5 animate-spin ml-2" />
                </>
              ) : (
                <>
                  Sign in <ArrowRight className="size-3.5 ml-2" />
                </>
              )}
            </Button>
          </form>

          <p className="mt-8 text-center text-[12px] text-muted-foreground">
            New to NeuroForge?{" "}
            <Link to="/register" className="text-foreground hover:underline">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
