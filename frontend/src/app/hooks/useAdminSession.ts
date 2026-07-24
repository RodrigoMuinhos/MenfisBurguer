import { useEffect, useState } from "react";
import { ADMIN_API_URL, ADMIN_SESSION_KEY, AppMode, Screen } from "../appState";

export function useAdminSession({
  adminOnlyMode,
  appMode,
  setScreen,
}: {
  adminOnlyMode: boolean;
  appMode: AppMode;
  setScreen: (screen: Screen) => void;
}) {
  const [adminUser, setAdminUser] = useState("");
  const [adminError, setAdminError] = useState("");
  const [adminToken, setAdminToken] = useState("");

  const storeSession = (user: string) => {
    setAdminUser(user);
    setAdminError("");
    setAdminToken("cookie");
    localStorage.setItem(
      ADMIN_SESSION_KEY,
      JSON.stringify({ user }),
    );
  };

  useEffect(() => {
    if (!adminOnlyMode) return;
    const restoreSession = async () => {
      try {
        const stored = JSON.parse(localStorage.getItem(ADMIN_SESSION_KEY) ?? "{}");
        const response = await fetch(`${ADMIN_API_URL}/auth/admin/session`, {
          cache: "no-store",
          credentials: "include",
        });
        if (!response.ok) throw new Error("invalid_admin_session");
        const session = await response.json();
        if (session?.role !== "ADMIN") throw new Error("invalid_admin_session");
        setAdminToken("cookie");
        setAdminUser(String(stored.user ?? session.user ?? ""));
        setScreen("admin");
      } catch {
        localStorage.removeItem(ADMIN_SESSION_KEY);
        setAdminToken("");
      }
    };
    void restoreSession();
  }, [adminOnlyMode, appMode, setScreen]);

  const openAdmin = () => {
    setScreen("admin");
  };

  const loginAdmin = async (login: string, password: string) => {
    setAdminError("");
    try {
      const response = await fetch(`${ADMIN_API_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ login, password }),
      });
      if (!response.ok) {
        setAdminError("Login ou senha inválidos.");
        return false;
      }
      const session = await response.json();
      if (session.role !== "ADMIN") {
        setAdminError("Este login não tem acesso ao admin.");
        return false;
      }
      storeSession(login.trim().toLowerCase());
      setScreen("admin");
      return true;
    } catch {
      setAdminError("Não foi possível entrar no admin.");
      return false;
    }
  };

  const closeAdmin = () => {
    if (appMode === "kds") {
      setScreen("admin");
      return;
    }
    void fetch(`${ADMIN_API_URL}/auth/admin/logout`, {
      method: "POST",
      credentials: "include",
    });
    localStorage.removeItem(ADMIN_SESSION_KEY);
    setAdminToken("");
    setAdminError("");
    setScreen(adminOnlyMode ? "admin" : "product");
  };

  return {
    adminUser,
    adminError,
    adminToken,
    setAdminUser,
    setAdminError,
    loginAdmin,
    openAdmin,
    closeAdmin,
  };
}
