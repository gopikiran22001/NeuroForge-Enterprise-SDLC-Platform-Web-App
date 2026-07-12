import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useSession } from "@/lib/session";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { NeuroForgeLogo } from "@/components/neuroforge-logo";

export const Route = createFileRoute("/register")({
  head: () => ({
    meta: [
      { title: "Sign up · NeuroForge Nexus" },
      { name: "description", content: "Create your NeuroForge Nexus account." },
    ],
  }),
  component: RegisterPage,
});

function RegisterPage() {
  const navigate = useNavigate();
  const { register } = useSession();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("developer");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!firstName || !lastName || !email || !password || !role) {
      toast.error("Please fill in all fields.");
      return;
    }
    if (password.length < 8) {
      toast.error("Password must be at least 8 characters long.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      await register(firstName, lastName, email, password, role);
      toast.success("Account created successfully!");
      navigate({ to: "/" });
    } catch (err) {
      const errMsg = err.message || "Failed to create account. Please try again.";
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

        <div className="relative z-10">
          <blockquote className="font-display text-3xl leading-tight italic max-w-md">
            "An integrated workspace managing requirement tracing, sprint planning, and deployment
            pipelines."
          </blockquote>
          <div className="mt-4 text-sm opacity-70">Integrated Software Lifecycle Management</div>
        </div>

        <div className="grid grid-cols-3 gap-6 text-sm opacity-80 z-10">
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
      <div className="flex items-center justify-center p-8 overflow-y-auto">
        <div className="w-full max-w-sm">
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <div className="grid size-8 place-items-center shrink-0">
              <NeuroForgeLogo className="size-7 text-primary" />
            </div>
            <div className="font-display text-lg">NeuroForge Nexus</div>
          </div>

          <h1 className="font-display text-3xl">Create account</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Register your workspace user and select your team role.
          </p>

          {error && (
            <div className="mt-4 p-3 rounded-lg border border-destructive/20 bg-destructive/10 text-xs text-destructive">
              {error}
            </div>
          )}

          <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="firstName">First name</Label>
                <Input
                  id="firstName"
                  required
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  disabled={loading}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="lastName">Last name</Label>
                <Input
                  id="lastName"
                  required
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  disabled={loading}
                />
              </div>
            </div>

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
              <Label htmlFor="pw">Password</Label>
              <Input
                id="pw"
                type="password"
                required
                placeholder="At least 8 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="role">Workspace Role</Label>
              <Select value={role} onValueChange={setRole} disabled={loading}>
                <SelectTrigger className="bg-background">
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Administrator</SelectItem>
                  <SelectItem value="pm">Project Manager</SelectItem>
                  <SelectItem value="developer">Developer</SelectItem>
                  <SelectItem value="tester">QA Tester</SelectItem>
                  <SelectItem value="devops">DevOps Engineer</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button type="submit" className="w-full pt-1" disabled={loading}>
              {loading ? (
                <>
                  Creating account <Loader2 className="size-3.5 animate-spin ml-2" />
                </>
              ) : (
                <>
                  Register <ArrowRight className="size-3.5 ml-2" />
                </>
              )}
            </Button>
          </form>

          <p className="mt-8 text-center text-[12px] text-muted-foreground">
            Already have an account?{" "}
            <Link to="/login" className="text-foreground hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
