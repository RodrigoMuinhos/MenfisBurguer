import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState, type HTMLInputTypeAttribute } from "react";
import {
  Gift,
  Headphones,
  Loader2,
  LogOut,
  PackageSearch,
  Trophy,
  UserCog,
  UserRound,
  X,
} from "lucide-react";
import { ROSA, VERDE } from "@/utils/theme";
import { CartItem, Order } from "@/types/order";
import { MEMBER_TOKEN_KEY, MemberProfile } from "./shared";
import { API_URL, SUPPORT_WHATSAPP_URL } from "@/components/order/checkout";
import { STATUS_COPY, fmt } from "@/components/order/tracking";
import { normalizeBackendOrder } from "@/services/orders/normalize";

export function MemberModals({
  loginOpen,
  profileOpen,
  memberProfile,
  memberName,
  setMemberName,
  memberEmail,
  setMemberEmail,
  memberCpf,
  setMemberCpf,
  memberPhone,
  setMemberPhone,
  memberPassword,
  setMemberPassword,
  memberPasswordConfirm,
  setMemberPasswordConfirm,
  memberLogin,
  setMemberLogin,
  loginPassword,
  setLoginPassword,
  memberAuthMode,
  setMemberAuthMode,
  memberBirthday,
  setMemberBirthday,
  memberCep,
  setMemberCep,
  memberStreet,
  setMemberStreet,
  memberNumber,
  setMemberNumber,
  memberComplement,
  setMemberComplement,
  memberNeighborhood,
  setMemberNeighborhood,
  memberCity,
  setMemberCity,
  memberReference,
  setMemberReference,
  memberError,
  memberSaving,
  memberProgress,
  savedDelivery,
  saveMember,
  loginMember,
  editMember,
  logoutMember,
  closeLogin,
  closeProfile,
  activeOrder,
  onOpenActiveOrder,
  onRepeatOrder,
}: {
  loginOpen: boolean;
  profileOpen: boolean;
  memberProfile: MemberProfile | null;
  memberName: string;
  setMemberName: (value: string) => void;
  memberEmail: string;
  setMemberEmail: (value: string) => void;
  memberCpf: string;
  setMemberCpf: (value: string) => void;
  memberPhone: string;
  setMemberPhone: (value: string) => void;
  memberPassword: string;
  setMemberPassword: (value: string) => void;
  memberPasswordConfirm: string;
  setMemberPasswordConfirm: (value: string) => void;
  memberLogin: string;
  setMemberLogin: (value: string) => void;
  loginPassword: string;
  setLoginPassword: (value: string) => void;
  memberAuthMode: "register" | "login";
  setMemberAuthMode: (value: "register" | "login") => void;
  memberBirthday: string;
  setMemberBirthday: (value: string) => void;
  memberCep: string;
  setMemberCep: (value: string) => void;
  memberStreet: string;
  setMemberStreet: (value: string) => void;
  memberNumber: string;
  setMemberNumber: (value: string) => void;
  memberComplement: string;
  setMemberComplement: (value: string) => void;
  memberNeighborhood: string;
  setMemberNeighborhood: (value: string) => void;
  memberCity: string;
  setMemberCity: (value: string) => void;
  memberReference: string;
  setMemberReference: (value: string) => void;
  memberError: string;
  memberSaving: boolean;
  memberProgress: number;
  savedDelivery: Record<string, string>;
  saveMember: () => void;
  loginMember: () => void;
  editMember: () => void;
  logoutMember: () => void;
  closeLogin: () => void;
  closeProfile: () => void;
  activeOrder?: Order | null;
  onOpenActiveOrder?: () => void;
  onRepeatOrder?: (items: CartItem[]) => void;
}) {
  const canCloseLogin = Boolean(memberProfile);
  const [customerOrders, setCustomerOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [registerStep, setRegisterStep] = useState<1 | 2>(1);
  const [termsAccepted, setTermsAccepted] = useState(false);

  useEffect(() => {
    if (!profileOpen || !memberProfile || !API_URL || typeof window === "undefined") return;
    const token = localStorage.getItem(MEMBER_TOKEN_KEY);
    if (!token) return;
    const controller = new AbortController();
    setOrdersLoading(true);
    void fetch(`${API_URL}/customers/orders`, {
      cache: "no-store",
      signal: controller.signal,
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((response) => (response.ok ? response.json() : []))
      .then((rows) => {
        setCustomerOrders(
          Array.isArray(rows) ? rows.map(normalizeBackendOrder) : [],
        );
      })
      .catch(() => setCustomerOrders([]))
      .finally(() => setOrdersLoading(false));
    return () => controller.abort();
  }, [memberProfile, profileOpen]);

  useEffect(() => {
    if (memberAuthMode === "login") return;
    setRegisterStep(1);
    setTermsAccepted(false);
  }, [memberAuthMode, loginOpen]);

  return (
    <>
            <AnimatePresence>
              {loginOpen && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 z-[75] flex items-end justify-center overflow-x-hidden bg-black/45 px-3 py-3 sm:items-center sm:p-4"
                >
                  <motion.div
                    initial={{ y: 24, scale: 0.98 }}
                    animate={{ y: 0, scale: 1 }}
                    exit={{ y: 24, scale: 0.98 }}
                    className="max-h-[calc(100dvh-24px)] w-full max-w-md overflow-y-auto overflow-x-hidden rounded-[22px] p-4 sm:rounded-[28px] sm:p-5"
                    style={{
                      background: "#fff",
                      color: VERDE,
                      maxWidth: "min(28rem, calc(100vw - 24px))",
                      overscrollBehavior: "contain",
                    }}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-[0.22em] text-black/40">
                          Clube Menfi's
                        </p>
                        <h2
                          className="mt-2 uppercase"
                          style={{
                            fontFamily: "'Bebas Neue','Arial Black',sans-serif",
                            fontSize: "clamp(2rem, 8vw, 2.4rem)",
                            lineHeight: 0.95,
                          }}
                        >
                          {memberAuthMode === "login" ? "Entre no perfil Menfi's" : "Crie seu perfil Menfi's"}
                        </h2>
                      </div>
                      {canCloseLogin && (
                        <button
                          onClick={() => closeLogin()}
                          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full"
                          style={{ background: `${VERDE}08`, color: VERDE }}
                        >
                          <X size={18} strokeWidth={2.4} />
                        </button>
                      )}
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-2 rounded-2xl p-1" style={{ background: "#FFF8F2" }}>
                      <button
                        onClick={() => setMemberAuthMode("register")}
                        className="rounded-xl px-3 py-3 text-xs font-black uppercase tracking-wider"
                        style={{
                          background: memberAuthMode === "register" ? VERDE : "transparent",
                          color: memberAuthMode === "register" ? ROSA : VERDE,
                        }}
                      >
                        Cadastrar
                      </button>
                      <button
                        onClick={() => setMemberAuthMode("login")}
                        className="rounded-xl px-3 py-3 text-xs font-black uppercase tracking-wider"
                        style={{
                          background: memberAuthMode === "login" ? VERDE : "transparent",
                          color: memberAuthMode === "login" ? ROSA : VERDE,
                        }}
                      >
                        Já tenho conta
                      </button>
                    </div>

                    {memberAuthMode === "login" ? (
                      <div className="mt-4 grid gap-3">
                        <ProfileInput
                          label="Email ou CPF"
                          value={memberLogin}
                          onChange={setMemberLogin}
                        />
                        <ProfileInput
                          label="Senha"
                          value={loginPassword}
                          onChange={(value) => setLoginPassword(value.replace(/\D/g, "").slice(0, 6))}
                          type="password"
                          inputMode="numeric"
                          maxLength={6}
                        />
                      </div>
                    ) : (
                    <>
                    <div className={registerStep === 1 ? "mt-4 grid gap-3" : "hidden"}>
                      <label className="grid gap-1">
                        <span className="text-[10px] font-black uppercase tracking-wider text-black/40">
                          Nome
                        </span>
                        <input
                          value={memberName}
                          onChange={(e) => setMemberName(e.target.value)}
                          className="min-w-0 rounded-2xl px-4 py-3 text-base outline-none"
                          style={{ border: `1.5px solid ${VERDE}16`, color: VERDE }}
                        />
                      </label>
                      <label className="grid gap-1">
                        <span className="text-[10px] font-black uppercase tracking-wider text-black/40">
                          Email
                        </span>
                        <input
                          value={memberEmail}
                          onChange={(e) => setMemberEmail(e.target.value)}
                          inputMode="email"
                          className="min-w-0 rounded-2xl px-4 py-3 text-base outline-none"
                          style={{ border: `1.5px solid ${VERDE}16`, color: VERDE }}
                        />
                      </label>
                      <div className="hidden">
                        <ProfileInput
                          label="CPF"
                          value={memberCpf}
                          onChange={(value) => setMemberCpf(value.replace(/\D/g, "").slice(0, 11))}
                          inputMode="numeric"
                          maxLength={11}
                        />
                      </div>
                      <label className="hidden gap-1">
                        <span className="text-[10px] font-black uppercase tracking-wider text-black/40">
                          WhatsApp
                        </span>
                        <input
                          value={memberPhone}
                          onChange={(e) => setMemberPhone(e.target.value)}
                          inputMode="tel"
                          className="min-w-0 rounded-2xl px-4 py-3 text-base outline-none"
                          style={{ border: `1.5px solid ${VERDE}16`, color: VERDE }}
                        />
                      </label>
                      <ProfileInput
                        label="Senha"
                        value={memberPassword}
                        onChange={(value) => setMemberPassword(value.replace(/\D/g, "").slice(0, 6))}
                        type="password"
                        inputMode="numeric"
                        maxLength={6}
                      />
                      <ProfileInput
                        label="Confirmar senha"
                        value={memberPasswordConfirm}
                        onChange={(value) => setMemberPasswordConfirm(value.replace(/\D/g, "").slice(0, 6))}
                        type="password"
                        inputMode="numeric"
                        maxLength={6}
                      />
                      <label className="grid gap-1">
                        <span className="text-[10px] font-black uppercase tracking-wider text-black/40">
                          Aniversário
                        </span>
                        <input
                          value={memberBirthday}
                          onChange={(e) => setMemberBirthday(e.target.value)}
                          type="date"
                          className="min-w-0 rounded-2xl px-4 py-3 text-base outline-none"
                          style={{ border: `1.5px solid ${VERDE}16`, color: VERDE }}
                        />
                      </label>
                      <div className="hidden grid-cols-1 gap-2 min-[390px]:grid-cols-2">
                        <ProfileInput label="CEP" value={memberCep} onChange={setMemberCep} />
                        <ProfileInput label="Bairro" value={memberNeighborhood} onChange={setMemberNeighborhood} />
                      </div>
                      <div className="hidden">
                        <ProfileInput label="Rua" value={memberStreet} onChange={setMemberStreet} />
                      </div>
                      <div className="hidden grid-cols-1 gap-2 min-[390px]:grid-cols-2">
                        <ProfileInput label="Número" value={memberNumber} onChange={setMemberNumber} />
                        <ProfileInput label="Complemento" value={memberComplement} onChange={setMemberComplement} />
                      </div>
                      <div className="hidden grid-cols-1 gap-2 min-[390px]:grid-cols-2">
                        <ProfileInput label="Cidade" value={memberCity} onChange={setMemberCity} />
                        <ProfileInput label="Referência" value={memberReference} onChange={setMemberReference} />
                      </div>
                    </div>
                    {registerStep === 2 && (
                      <div className="mt-4 grid gap-3">
                        <div className="rounded-2xl p-4 text-xs font-bold leading-relaxed" style={{ background: "#FFF8F2", border: `1px solid ${VERDE}12` }}>
                          <p className="font-black uppercase tracking-wider opacity-60">Confirmacao</p>
                          <p className="mt-2">Telefone: {memberPhone || "pendente"}</p>
                          <p>E-mail: {memberEmail || "pendente"}</p>
                        </div>
                        <label className="flex items-start gap-3 rounded-2xl p-4 text-xs font-bold leading-relaxed" style={{ background: "#FFF8F2", border: `1px solid ${VERDE}12` }}>
                          <input
                            type="checkbox"
                            checked={termsAccepted}
                            onChange={(event) => setTermsAccepted(event.target.checked)}
                            className="mt-0.5 h-4 w-4"
                          />
                          <span>Aceito os termos de uso e autorizo contato sobre meus pedidos por telefone, e-mail e WhatsApp.</span>
                        </label>
                        <button
                          type="button"
                          onClick={() => setRegisterStep(1)}
                          className="rounded-2xl px-4 py-3 text-xs font-black uppercase tracking-wider"
                          style={{ background: `${VERDE}08`, color: VERDE }}
                        >
                          Voltar aos dados
                        </button>
                      </div>
                    )}
                    </>
                    )}
      
                    {memberError && (
                      <p
                        className="mt-3 rounded-2xl px-3 py-2 text-xs font-bold leading-relaxed"
                        style={{ background: `${ROSA}70`, color: VERDE }}
                      >
                        {memberError}
                      </p>
                    )}
      
                    <button
                      onClick={
                        memberAuthMode === "login"
                          ? loginMember
                          : registerStep === 1
                            ? () => setRegisterStep(2)
                            : saveMember
                      }
                      disabled={memberSaving || (memberAuthMode === "register" && registerStep === 2 && !termsAccepted)}
                      className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl px-4 py-4 text-xs font-black uppercase tracking-wider"
                      style={{
                        background: VERDE,
                        color: ROSA,
                        opacity:
                          memberSaving ||
                          (memberAuthMode === "register" && registerStep === 2 && !termsAccepted)
                            ? 0.56
                            : 1,
                      }}
                    >
                      {memberSaving
                        ? memberAuthMode === "login"
                          ? "Entrando"
                          : "Cadastrando"
                        : memberAuthMode === "login"
                          ? "Entrar"
                          : registerStep === 1
                            ? "Continuar"
                            : "Cadastrar"}
                      {memberSaving ? (
                        <Loader2
                          size={16}
                          strokeWidth={2.4}
                          style={{ animation: "spin 1s linear infinite" }}
                        />
                      ) : (
                        <Gift size={16} strokeWidth={2.4} />
                      )}
                    </button>
                  </motion.div>
                </motion.div>
              )}
      
              {profileOpen && memberProfile && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 z-[75] flex justify-end bg-black/45"
                  onClick={closeProfile}
                >
                  <motion.div
                    initial={{ x: 420 }}
                    animate={{ x: 0 }}
                    exit={{ x: 420 }}
                    transition={{ type: "spring", stiffness: 320, damping: 32 }}
                    className="h-full w-full max-w-[360px] overflow-y-auto overflow-x-hidden p-4"
                    style={{
                      background: "#fff",
                      color: VERDE,
                      boxShadow: "-24px 0 70px rgba(0,0,0,0.22)",
                    }}
                    onClick={(event) => event.stopPropagation()}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-3">
                        <div
                          className="grid h-12 w-12 shrink-0 place-items-center rounded-full"
                          style={{
                            background: ROSA,
                            border: `2px solid ${VERDE}`,
                          }}
                        >
                          <UserRound size={22} strokeWidth={2.6} />
                        </div>
                        <div className="min-w-0">
                          <p className="text-[10px] font-black uppercase tracking-[0.22em] opacity-55">
                            Perfil Menfi's
                          </p>
                          <h2 className="truncate text-lg font-black leading-tight">
                            {memberProfile.name}
                          </h2>
                          <p className="truncate text-xs font-bold opacity-65">
                            {memberProfile.phone}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => closeProfile()}
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full"
                        style={{ background: `${VERDE}08`, color: VERDE }}
                      >
                        <X size={18} strokeWidth={2.4} />
                      </button>
                    </div>

                    <div className="mt-5 grid gap-3">
                      {memberProfile.hasPassword === false && (
                        <button
                          onClick={editMember}
                          className="rounded-2xl p-4 text-left"
                          style={{
                            background: "#FFFBEB",
                            color: "#92400E",
                            border: "1.5px solid #F59E0B",
                          }}
                        >
                          <p className="text-xs font-black uppercase tracking-wider">
                            Crie sua senha
                          </p>
                          <p className="mt-1 text-xs font-bold leading-relaxed opacity-80">
                            Sua conta antiga ainda não tem senha. Atualize os dados e crie 6 dígitos para entrar sem cadastrar de novo.
                          </p>
                        </button>
                      )}

                      <div
                        className="rounded-2xl p-4"
                        style={{ background: VERDE, color: ROSA }}
                      >
                        <div className="flex items-center gap-2">
                          <Trophy size={18} strokeWidth={2.3} />
                          <p className="text-xs font-black uppercase tracking-wider">
                            Bônus Menfi's
                          </p>
                        </div>
                        <p className="mt-2 text-xs leading-relaxed opacity-75">
                          A cada 10 pedidos no perfil, você ganha 1 burger.
                        </p>
                        <div className="mt-3 h-3 overflow-hidden rounded-full bg-white/18">
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: `${Math.max(8, memberProgress * 10)}%`,
                              background: ROSA,
                            }}
                          />
                        </div>
                        <p className="mt-2 text-xs font-black">
                          {memberProgress}/10 pedidos · {memberProfile.rewards} bônus
                        </p>
                      </div>

                      <ProfileMenuButton icon={UserCog} label="Dados cadastrais" onClick={editMember} />
                      {activeOrder && !["DELIVERED", "CANCELLED"].includes(activeOrder.status) ? (
                        <ActiveProfileOrderCard
                          order={activeOrder}
                          onOpen={() => {
                            closeProfile();
                            onOpenActiveOrder?.();
                          }}
                        />
                      ) : (
                        <ProfileMenuButton icon={PackageSearch} label="Acompanhe seu pedido" onClick={closeProfile} />
                      )}
                      <div className="rounded-2xl p-4" style={{ background: "#FFF8F2", border: `1px solid ${VERDE}12` }}>
                        <div className="flex items-center justify-between gap-3">
                          <p className="text-xs font-black uppercase tracking-wider">
                            Meus pedidos
                          </p>
                          {ordersLoading && <Loader2 size={15} strokeWidth={2.5} style={{ animation: "spin 1s linear infinite" }} />}
                        </div>
                        <div className="mt-3 grid gap-2">
                          {!ordersLoading && customerOrders.length === 0 && (
                            <p className="text-xs font-bold opacity-55">
                              Nenhum pedido encontrado neste perfil.
                            </p>
                          )}
                          {customerOrders.slice(0, 8).map((order) => (
                            <OrderHistoryRow
                              key={order.id}
                              order={order}
                              onRepeat={() => {
                                closeProfile();
                                onRepeatOrder?.(order.items);
                              }}
                            />
                          ))}
                        </div>
                      </div>
                      <ProfileMenuLink icon={Headphones} label="SAC" href={SUPPORT_WHATSAPP_URL} />
                      <button
                        onClick={logoutMember}
                        className="flex items-center justify-center gap-2 rounded-2xl px-4 py-3 text-xs font-black uppercase tracking-wider"
                        style={{
                          background: "transparent",
                          color: "#991B1B",
                          border: "1.5px solid #FCA5A5",
                        }}
                      >
                        <LogOut size={16} strokeWidth={2.4} />
                        Sair
                      </button>
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
    </>
  );
}

function ProfileInput({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  inputMode,
  maxLength,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: HTMLInputTypeAttribute;
  inputMode?: "none" | "text" | "tel" | "url" | "email" | "numeric" | "decimal" | "search";
  maxLength?: number;
}) {
  return (
    <label className="grid min-w-0 gap-1">
      <span className="text-[10px] font-black uppercase tracking-wider text-black/40">
        {label}
      </span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        type={type}
        inputMode={inputMode}
        maxLength={maxLength}
        className="min-w-0 rounded-2xl px-4 py-3 text-base outline-none"
        style={{ border: `1.5px solid ${VERDE}16`, color: VERDE }}
      />
    </label>
  );
}

function ActiveProfileOrderCard({
  order,
  onOpen,
}: {
  order: Order;
  onOpen: () => void;
}) {
  const status = STATUS_COPY[order.status] ?? STATUS_COPY.PAYMENT_PENDING;
  return (
    <button
      onClick={onOpen}
      className="w-full rounded-2xl p-4 text-left"
      style={{ background: VERDE, color: ROSA }}
    >
      <div className="flex items-start gap-3">
        <PackageSearch size={20} strokeWidth={2.5} className="mt-0.5 shrink-0" />
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-black uppercase tracking-wider opacity-70">
            Acompanhe seu pedido
          </p>
          <p className="mt-1 text-lg font-black leading-none">
            {order.id} · {status.label}
          </p>
          <p className="mt-2 line-clamp-2 text-xs font-bold leading-relaxed opacity-75">
            {order.items.map((item) => `${item.qty}x ${item.name}`).join(" · ")}
          </p>
          <p className="mt-2 text-sm font-black">{fmt(order.total)}</p>
        </div>
      </div>
    </button>
  );
}

function OrderHistoryRow({
  order,
  onRepeat,
}: {
  order: Order;
  onRepeat: () => void;
}) {
  const status = STATUS_COPY[order.status] ?? STATUS_COPY.PAYMENT_PENDING;
  const date = new Date(order.timestamp).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
  });
  return (
    <div
      className="rounded-xl p-3"
      style={{ background: "#fff", border: `1px solid ${VERDE}12` }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-black leading-tight">
            Pedido {order.id}
          </p>
          <p className="mt-1 text-[11px] font-bold uppercase tracking-wide opacity-55">
            {status.label} · {date}
          </p>
          <p className="mt-2 line-clamp-2 text-xs font-bold leading-relaxed opacity-70">
            {order.items.map((item) => `${item.qty}x ${item.name}`).join(" · ")}
          </p>
        </div>
        <p className="shrink-0 text-sm font-black">{fmt(order.total)}</p>
      </div>
      <button
        onClick={onRepeat}
        disabled={order.items.length === 0}
        className="mt-3 w-full rounded-xl px-3 py-2 text-[11px] font-black uppercase tracking-wider disabled:opacity-40"
        style={{ background: `${VERDE}10`, color: VERDE }}
      >
        Pedir novamente
      </button>
    </div>
  );
}

function ProfileMenuButton({
  icon: Icon,
  label,
  onClick,
}: {
  icon: typeof UserCog;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex w-full items-center gap-3 rounded-2xl px-4 py-4 text-left text-xs font-black uppercase tracking-wider"
      style={{ background: "#FFF8F2", color: VERDE, border: `1px solid ${VERDE}12` }}
    >
      <Icon size={18} strokeWidth={2.4} />
      {label}
    </button>
  );
}

function ProfileMenuLink({
  icon: Icon,
  label,
  href,
}: {
  icon: typeof UserCog;
  label: string;
  href: string;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="flex w-full items-center gap-3 rounded-2xl px-4 py-4 text-left text-xs font-black uppercase tracking-wider"
      style={{ background: "#FFF8F2", color: VERDE, border: `1px solid ${VERDE}12` }}
    >
      <Icon size={18} strokeWidth={2.4} />
      {label}
    </a>
  );
}
