import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Settings, User, KeyRound, Loader2, Check } from "lucide-react";
import { useSession, formatSessionUser, mapFrontendRoleToBackend } from "@/lib/session";
import { ROLE_LABEL } from "@/lib/permissions";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Settings · NeuroForge Nexus" },
      { name: "description", content: "Workspace, billing, integrations and preferences." },
    ],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  const { user, setUser } = useSession();
  const [firstName, setFirstName] = useState(user.firstName || "");
  const [lastName, setLastName] = useState(user.lastName || "");
  const [email, setEmail] = useState(user.email || "");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    if (!firstName || !lastName || !email) {
      toast.error("Please fill in all required fields.");
      return;
    }
    setLoading(true);
    try {
      const payload = {
        firstName,
        lastName,
        email,
        role: mapFrontendRoleToBackend(user.role),
        status: "ACTIVE", // Current user is active
      };

      if (password) {
        if (password.length < 8) {
          throw new Error("Password must be at least 8 characters long.");
        }
        payload.password = password;
      }

      // PUT /api/users updates the current user if no ID parameter is specified
      const updatedBackendUser = await api.put("/api/users", payload);
      setUser(formatSessionUser(updatedBackendUser));
      setPassword("");
      toast.success("Profile updated successfully!");
    } catch (err) {
      toast.error(err.message || "Failed to update profile details.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 md:p-8 max-w-[1000px] mx-auto space-y-8">
      <header className="flex items-end justify-between gap-4 pb-6 border-b hairline">
        <div>
          <div className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
            Account
          </div>
          <h1 className="font-display text-3xl mt-1 flex items-center gap-2">
            <Settings className="size-6 text-primary" /> Settings
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage your personal profile details, credentials and security.
          </p>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-[220px_1fr] gap-8">
        {/* Settings Navigation Tabs */}
        <div className="flex flex-col gap-1 text-sm">
          <button className="flex items-center gap-2 px-3 py-2 rounded-md font-medium bg-accent text-accent-foreground text-left">
            <User className="size-4" /> Personal Profile
          </button>
          <button
            className="flex items-center gap-2 px-3 py-2 rounded-md font-medium text-muted-foreground hover:bg-accent/40 hover:text-foreground text-left disabled:opacity-50"
            disabled
          >
            <KeyRound className="size-4" /> Security & Keys (coming soon)
          </button>
        </div>

        {/* Profile Card */}
        <div className="rounded-xl border hairline bg-card p-6 space-y-6">
          <div>
            <h2 className="text-sm font-semibold">Profile Details</h2>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Update your account details and password.
            </p>
          </div>

          <form onSubmit={handleUpdateProfile} className="space-y-4 max-w-xl">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="email">Email address</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password">
                New Password{" "}
                <span className="text-muted-foreground text-[10px]">
                  (leave blank to keep current)
                </span>
              </Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                disabled={loading}
              />
            </div>

            <div className="grid grid-cols-2 gap-4 pt-2">
              <div className="space-y-1">
                <span className="text-xs font-semibold text-muted-foreground">
                  Assigned Workspace Role
                </span>
                <div className="text-sm font-medium">{ROLE_LABEL[user.role] || user.role}</div>
              </div>
              <div className="space-y-1">
                <span className="text-xs font-semibold text-muted-foreground">Account Status</span>
                <div className="flex items-center gap-1.5 text-sm font-medium text-success">
                  <Check className="size-4" /> Active
                </div>
              </div>
            </div>

            <div className="pt-4 border-t hairline flex justify-end">
              <Button type="submit" disabled={loading}>
                {loading ? (
                  <>
                    Updating profile <Loader2 className="size-3.5 animate-spin ml-2" />
                  </>
                ) : (
                  "Save Profile Changes"
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
