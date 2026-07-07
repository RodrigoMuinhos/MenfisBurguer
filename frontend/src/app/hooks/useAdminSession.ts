import { useEffect, useState } from "react";
import { ADMIN_SESSION_KEY, API_URL, AppMode, Screen } from "../appState";

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

  const storeSession = (token: string, user: string) => {
    setAdminUser(user);
    setAdminError("");
    setAdminToken(token);
    localStorage.setItem(
      ADMIN_SESSION_KEY,
      JSON.stringify({ token, user }),
    );
  };

  useEffect(() => {
    if (!adminOnlyMode) return;
    try {
      const session = JSON.parse(localStorage.getItem(ADMIN_SESSION_KEY) ?? "{}");
      if (!session?.token) return;
      setAdminToken(String(session.token));
      setAdminUser(String(session.user ?? ""));
      setScreen("admin");
    } catch {
      localStorage.removeItem(ADMIN_SESSION_KEY);
    }
  }, [adminOnlyMode, appMode, setScreen]);

  const openAdmin = () => {
    setScreen("admin");
  };

  const loginAdmin = async (login: string, password: string) => {
    if (!API_URL) {
      setAdminError("Backend não configurado.");
      return false;
    }
    setAdminError("");
    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ login, password }),
      });
      if (!response.ok) {
        setAdminError("Login ou senha inválidos.");
        return false;
      }
      const session = await response.json();
      if (!session?.token) {
        setAdminError("Login ou senha inválidos.");
        return false;
      }
      if (session.role !== "ADMIN") {
        setAdminError("Este login não tem acesso ao admin.");
        return false;
      }
      storeSession(String(session.token), login.trim().toLowerCase());
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
