import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import { CREME, ROSA, VERDE } from "@/utils/theme";

export function AdminLoginScreen({
  username,
  password,
  error,
  onChangeUsername,
  onChangePassword,
  onSubmit,
  onBack,
}: {
  username: string;
  password: string;
  error: string;
  onChangeUsername: (value: string) => void;
  onChangePassword: (value: string) => void;
  onSubmit: () => void;
  onBack: () => void;
}) {
  return (
    <div
      className="min-h-full flex items-center justify-center px-4 py-8"
      style={{ background: CREME }}
    >
      <div
        className="w-full max-w-sm rounded-[28px] p-6"
        style={{
          background: "#fff",
          boxShadow: "0 16px 40px rgba(0,0,0,0.08)",
        }}
      >
        <div
          className="mx-auto mb-4 flex items-center justify-center rounded-full"
          style={{
            position: "relative",
            width: 128,
            height: 128,
            background: `${VERDE}10`,
            border: `2px solid ${VERDE}24`,
            boxShadow: "0 14px 30px rgba(0,0,0,0.08)",
            overflow: "hidden",
            borderRadius: 999,
          }}
        >
          <div
            aria-label="Menfi's Burger"
            style={{
              width: 88,
              height: 88,
              borderRadius: "50%",
              background: VERDE,
              color: ROSA,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontFamily: "var(--menfis-font-display)",
              fontSize: "3.25rem",
              lineHeight: 1,
              boxShadow: "0 12px 22px rgba(31,61,46,0.28)",
            }}
          >
            M
          </div>
        </div>
        <p
          className="font-black uppercase tracking-[0.2em] text-center"
          style={{
            color: VERDE,
            fontFamily: "var(--menfis-font-display)",
            fontSize: "1.8rem",
            lineHeight: 1,
          }}
        >
          Acesso Admin
        </p>
        <p className="text-center mt-2 text-xs" style={{ color: VERDE, opacity: 0.55 }}>
          Digite seu login e senha para abrir o painel.
        </p>

        <div className="mt-6 flex flex-col gap-3">
          <AdminInput
            label="Login"
            value={username}
            onChange={onChangeUsername}
            autoComplete="username"
            inputMode="numeric"
          />
          <AdminInput
            label="Senha"
            value={password}
            onChange={onChangePassword}
            autoComplete="current-password"
            type="password"
            revealable
            onEnter={onSubmit}
          />

          {error && (
            <div
              className="rounded-2xl px-4 py-3 text-sm font-semibold"
              style={{ background: `${ROSA}70`, color: VERDE }}
            >
              {error}
            </div>
          )}

          <button
            onClick={onSubmit}
            className="rounded-2xl px-4 py-3 font-black uppercase tracking-[0.16em]"
            style={{ background: VERDE, color: ROSA }}
          >
            Entrar
          </button>

          <button
            onClick={onBack}
            className="rounded-2xl px-4 py-3 font-black uppercase tracking-[0.12em]"
            style={{
              background: "transparent",
              color: VERDE,
              border: `1.5px solid ${VERDE}18`,
            }}
          >
            Voltar
          </button>
        </div>
      </div>
    </div>
  );
}

function AdminInput({
  label,
  value,
  onChange,
  autoComplete,
  inputMode,
  type = "text",
  revealable = false,
  onEnter,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  autoComplete: string;
  inputMode?: "numeric";
  type?: string;
  revealable?: boolean;
  onEnter?: () => void;
}) {
  const [visible, setVisible] = useState(false);
  const inputType = revealable && visible ? "text" : type;

  return (
    <label className="flex flex-col gap-1">
      <span
        className="text-[10px] font-black uppercase tracking-widest"
        style={{ color: VERDE, opacity: 0.45 }}
      >
        {label}
      </span>
      <span className="relative block">
        <input
          type={inputType}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          autoComplete={autoComplete}
          className="w-full rounded-2xl px-4 py-3 outline-none"
          style={{
            border: `1.5px solid ${VERDE}18`,
            color: VERDE,
            paddingRight: revealable ? "3.25rem" : undefined,
          }}
          inputMode={inputMode}
          onKeyDown={(event) => {
            if (event.key === "Enter") onEnter?.();
          }}
        />
        {revealable && (
          <button
            type="button"
            onClick={() => setVisible((current) => !current)}
            className="absolute right-2 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full"
            style={{ background: `${VERDE}08`, color: VERDE }}
            aria-label={visible ? "Ocultar senha" : "Mostrar senha"}
          >
            {visible ? <EyeOff size={18} strokeWidth={2.4} /> : <Eye size={18} strokeWidth={2.4} />}
          </button>
        )}
      </span>
    </label>
  );
}
