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
  const [adminPassword, setAdminPassword] = useState("");
  const [adminError, setAdminError] = useState("");
  const [adminUnlocked, setAdminUnlocked] = useState(false);
  const [adminToken, setAdminToken] = useState("");

  useEffect(() => {
    if (!adminOnlyMode) return;
    if (appMode === "kds") {
      setScreen("admin");
      setAdminUser("cozinha");
      if (!API_URL) return;
      let cancelled = false;
      fetch(`${API_URL}/auth/kds`, { method: "POST", cache: "no-store" })
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (cancelled || !data?.token) return;
          setAdminToken(String(data.token));
          setAdminUnlocked(true);
          localStorage.setItem(
            ADMIN_SESSION_KEY,
            JSON.stringify({ token: String(data.token), user: "cozinha" }),
          );
        })
        .catch(() => {
          // KDS remains visible and can authenticate on the next refresh.
        });
      return () => {
        cancelled = true;
      };
    }

    try {
      const session = JSON.parse(localStorage.getItem(ADMIN_SESSION_KEY) ?? "{}");
      if (!session?.token) return;
      setAdminToken(String(session.token));
      setAdminUser(String(session.user ?? ""));
      setAdminUnlocked(true);
      setScreen("admin");
    } catch {
      localStorage.removeItem(ADMIN_SESSION_KEY);
    }
  }, [adminOnlyMode, appMode, setScreen]);

  const openAdmin = () => {
    setAdminError("");
    if (adminUnlocked) {
      setScreen("admin");
      return;
    }
    setScreen("admin-login");
  };

  const closeAdmin = () => {
    if (appMode === "kds") {
      setScreen("admin");
      return;
    }
    localStorage.removeItem(ADMIN_SESSION_KEY);
    setAdminUnlocked(false);
    setAdminPassword("");
    setAdminToken("");
    setAdminError("");
    setScreen(adminOnlyMode ? "admin-login" : "product");
  };

  const handleAdminLogin = async () => {
    const user = adminUser.trim();
    const pass = adminPassword.trim();
    try {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ login: user, password: pass }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.token) {
        setAdminError(
          data.error === "invalid_credentials"
            ? "Login ou senha inválidos."
            : "Não foi possível validar o acesso no servidor.",
        );
        return;
      }
      setAdminToken(String(data.token));
      localStorage.setItem(
        ADMIN_SESSION_KEY,
        JSON.stringify({ token: String(data.token), user }),
      );
      setAdminUnlocked(true);
      setAdminError("");
      setAdminPassword("");
      setScreen("admin");
    } catch {
      setAdminError("Não foi possível conectar ao servidor.");
    }
  };

  return {
    adminUser,
    adminPassword,
    adminError,
    adminToken,
    setAdminUser,
    setAdminPassword,
    setAdminError,
    openAdmin,
    closeAdmin,
    handleAdminLogin,
  };
}
