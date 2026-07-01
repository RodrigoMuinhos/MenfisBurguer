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

  const requestAdminSession = async () => {
    setAdminUser("admin");
    setAdminError("");
    if (!API_URL) {
      setAdminError("Backend não configurado.");
      return false;
    }
    try {
      const res = await fetch(`${API_URL}/auth/admin`, { method: "POST", cache: "no-store" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.token) {
        setAdminError("Não foi possível abrir o painel.");
        return false;
      }
      setAdminToken(String(data.token));
      localStorage.setItem(
        ADMIN_SESSION_KEY,
        JSON.stringify({ token: String(data.token), user: "admin" }),
      );
      return true;
    } catch {
      setAdminError("Não foi possível conectar ao servidor.");
      return false;
    }
  };

  useEffect(() => {
    if (!adminOnlyMode) return;
    if (appMode === "admin" || appMode === "notes") {
      setScreen("admin");
      void requestAdminSession();
      return;
    }
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
      setScreen("admin");
    } catch {
      localStorage.removeItem(ADMIN_SESSION_KEY);
    }
  }, [adminOnlyMode, appMode, setScreen]);

  const openAdmin = () => {
    setScreen("admin");
    void requestAdminSession();
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
    openAdmin,
    closeAdmin,
  };
}
