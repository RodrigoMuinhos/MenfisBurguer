"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Menfis client error", error);
    const timer = window.setTimeout(() => {
      recoverToMenu();
    }, 1200);
    return () => window.clearTimeout(timer);
  }, [error]);

  const recoverToMenu = () => {
    try {
      localStorage.removeItem("menfis_app_screen");
      localStorage.removeItem("menfis_pending_order_id");
      sessionStorage.clear();
    } catch {
      // Recuperacao local nao deve bloquear a navegacao.
    }
    window.location.replace("/");
  };

  const retryCurrentScreen = () => {
    try {
      localStorage.removeItem("menfis_app_screen");
      localStorage.removeItem("menfis_pending_order_id");
      sessionStorage.clear();
    } catch {
      // Recuperacao local nao deve bloquear o reset.
    }
    reset();
  };

  return (
    <main
      className="flex min-h-dvh items-center justify-center px-5 text-center"
      style={{
        background: "#fff",
        color: "#65001F",
        fontFamily: "'Inter', system-ui, sans-serif",
      }}
    >
      <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl">
        <p className="text-xs font-black uppercase tracking-[0.22em] opacity-50">
          Menfi's Burger
        </p>
        <h1 className="mt-3 text-2xl font-black">Estamos atualizando sua tela</h1>
        <p className="mt-2 text-sm font-bold leading-relaxed opacity-65">
          Vamos voltar automaticamente para o cardapio. Se preferir, toque abaixo
          para tentar recarregar a tela atual.
        </p>
        <button
          type="button"
          onClick={retryCurrentScreen}
          className="mt-5 w-full rounded-2xl px-5 py-4 text-xs font-black uppercase tracking-wider"
          style={{ background: "#65001F", color: "#FFC1D7" }}
        >
          Tentar novamente
        </button>
        <button
          type="button"
          onClick={recoverToMenu}
          className="mt-3 w-full rounded-2xl px-5 py-4 text-xs font-black uppercase tracking-wider"
          style={{ background: "#fff", color: "#65001F" }}
        >
          Voltar ao cardapio
        </button>
      </div>
    </main>
  );
}
