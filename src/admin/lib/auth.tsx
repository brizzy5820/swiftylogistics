import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { useListUsers, type AppUser, type UserRole } from "@/lib/workspace-api";

interface AuthContextValue {
  user: AppUser | null;
  isLoading: boolean;
  loginAs: (email: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);
const SESSION_KEY = "xenith-logistics-session";

export function AuthProvider({ children }: { children: ReactNode }) {
  const { data: users = [], isLoading } = useListUsers();
  const [sessionEmail, setSessionEmail] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const saved = window.localStorage.getItem(SESSION_KEY);
    if (saved) {
      setSessionEmail(saved);
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (sessionEmail) {
      window.localStorage.setItem(SESSION_KEY, sessionEmail);
      return;
    }
    window.localStorage.removeItem(SESSION_KEY);
  }, [sessionEmail]);

  const user = users.find((entry) => entry.email === sessionEmail) ?? null;

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        loginAs: (email) => setSessionEmail(email),
        logout: () => setSessionEmail(null),
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}

export function isAllowedRole(userRole: UserRole | undefined, requiredRole: UserRole) {
  return userRole === requiredRole;
}
