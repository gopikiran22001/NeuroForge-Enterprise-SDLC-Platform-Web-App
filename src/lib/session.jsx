import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { api, setOnUnauthorized } from "./api";

const SessionCtx = createContext(null);

export function mapBackendRoleToFrontend(role) {
  if (!role) return "developer";
  switch (role.toUpperCase()) {
    case "ADMIN":
      return "admin";
    case "PROJECT_MANAGER":
      return "pm";
    case "DEVELOPER":
      return "developer";
    case "TESTER":
      return "tester";
    case "DEVOPS_ENGINEER":
      return "devops";
    default:
      return "developer";
  }
}

export function mapFrontendRoleToBackend(role) {
  if (!role) return "DEVELOPER";
  switch (role.toLowerCase()) {
    case "admin":
      return "ADMIN";
    case "pm":
      return "PROJECT_MANAGER";
    case "developer":
      return "DEVELOPER";
    case "tester":
      return "TESTER";
    case "devops":
      return "DEVOPS_ENGINEER";
    default:
      return "DEVELOPER";
  }
}

function getAvatarColor(firstName) {
  const hash = (firstName || "").split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const hues = [30, 120, 200, 280, 340];
  const hue = hues[hash % hues.length];
  return `oklch(0.55 0.18 ${hue})`;
}

function getTitleForRole(role) {
  switch (role) {
    case "admin":
      return "Administrator";
    case "pm":
      return "Project Manager";
    case "developer":
      return "Senior Developer";
    case "tester":
      return "Tester";
    case "devops":
      return "DevOps Engineer";
    default:
      return "Member";
  }
}

export function formatSessionUser(backendUser) {
  if (!backendUser) return null;
  const role = mapBackendRoleToFrontend(backendUser.role);
  return {
    id: backendUser.id,
    name: `${backendUser.firstName} ${backendUser.lastName}`,
    firstName: backendUser.firstName,
    lastName: backendUser.lastName,
    email: backendUser.email,
    role,
    title: getTitleForRole(role),
    avatarColor: getAvatarColor(backendUser.firstName),
  };
}

export function SessionProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [theme, setTheme] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("theme");
      const systemPrefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      const activeTheme = saved || (systemPrefersDark ? "dark" : "light");
      const root = document.documentElement;
      if (activeTheme === "dark") {
        root.classList.add("dark");
      } else {
        root.classList.remove("dark");
      }
      return activeTheme;
    }
    return "light";
  });

  const checkSession = async () => {
    try {
      const backendUser = await api.get("/api/users/profile");
      setUser(formatSessionUser(backendUser));
    } catch (err) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkSession();
    setOnUnauthorized(() => {
      setUser(null);
    });
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
    localStorage.setItem("theme", theme);
  }, [theme]);

  const login = async (email, password) => {
    const response = await api.post("/api/auth/login", { email, password });
    // Response returned by api client is response.data, which is AuthResponse
    // AuthResponse has user field
    const formattedUser = formatSessionUser(response.user);
    setUser(formattedUser);
    return formattedUser;
  };

  const register = async (firstName, lastName, email, password, role) => {
    const response = await api.post("/api/auth/register", {
      firstName,
      lastName,
      email,
      password,
      role: mapFrontendRoleToBackend(role),
    });
    const formattedUser = formatSessionUser(response.user);
    setUser(formattedUser);
    return formattedUser;
  };

  const logout = async () => {
    try {
      await api.post("/api/auth/logout");
    } catch (err) {
      console.error("Logout request failed:", err);
    } finally {
      setUser(null);
    }
  };

  const value = useMemo(
    () => ({
      user,
      setUser,
      loading,
      login,
      register,
      logout,
      setRole: (role) => setUser((u) => (u ? { ...u, role } : null)),
      theme,
      toggleTheme: () => setTheme((t) => (t === "light" ? "dark" : "light")),
    }),
    [user, loading, theme],
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="size-12 rounded-full border-4 border-primary/10 border-t-primary animate-spin" />
          <div className="text-xs text-muted-foreground tracking-wider font-semibold uppercase animate-pulse">
            Connecting workspace
          </div>
        </div>
      </div>
    );
  }

  return <SessionCtx.Provider value={value}>{children}</SessionCtx.Provider>;
}

export function useSession() {
  const ctx = useContext(SessionCtx);
  if (!ctx) throw new Error("useSession must be used inside SessionProvider");
  return ctx;
}
