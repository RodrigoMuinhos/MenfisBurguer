import { useEffect, useState } from "react";
import { ADMIN_SESSION_KEY, AppMode, Screen } from "../appState";

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

  const openLocalSession = (user: string) => {
    setAdminUser(user);
    setAdminError("");
    setAdminToken("admin-open");
    localStorage.setItem(
      ADMIN_SESSION_KEY,
      JSON.stringify({ token: "admin-open", user }),
    );
  };

  useEffect(() => {
    if (!adminOnlyMode) return;
    if (appMode === "admin" || appMode === "notes") {
      setScreen("admin");
      openLocalSession("admin");
      return;
    }
    if (appMode === "kds") {
      setScreen("admin");
      openLocalSession("cozinha");
      return;
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
    openLocalSession("admin");
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
