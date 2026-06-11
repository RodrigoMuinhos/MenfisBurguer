import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState, type ElementType, type HTMLInputTypeAttribute, type ReactNode } from "react";
import {
  Eye,
  EyeOff,
  Gift,
  Headphones,
  KeyRound,
  Loader2,
  LogOut,
  MapPin,
  PackageSearch,
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
import { MemberNotification } from "./notifications";

export function MemberModals({
  loginOpen,
  profileOpen,
  historyOpen,
  notificationsOpen,
  favoritesOpen,
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
  savedDelivery,
  saveMember,
  loginMember,
  requestPasswordRecovery,
  resetMemberPassword,
  editMember,
  logoutMember,
  closeLogin,
  closeProfile,
  closeHistory,
  closeNotifications,
  closeFavorites,
  activeOrder,
  notifications = [],
  onOpenActiveOrder,
  onRepeatOrder,
}: {
  loginOpen: boolean;
  profileOpen: boolean;
  historyOpen: boolean;
  notificationsOpen: boolean;
  favoritesOpen: boolean;
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
  savedDelivery: Record<string, string>;
  saveMember: () => void;
  loginMember: () => void;
  requestPasswordRecovery: (login: string) => Promise<{ expiresInMinutes?: number; delivery?: string } | null>;
  resetMemberPassword: (
    login: string,
    code: string,
    password: string,
    confirmPassword: string,
  ) => Promise<boolean>;
  editMember: () => void;
  logoutMember: () => void;
  closeLogin: () => void;
  closeProfile: () => void;
  closeHistory: () => void;
  closeNotifications: () => void;
  closeFavorites: () => void;
  activeOrder?: Order | null;
  notifications?: MemberNotification[];
  onOpenActiveOrder?: (orderId?: string) => void;
  onRepeatOrder?: (items: CartItem[]) => void;
}) {
  const canCloseLogin = true;
  const profileIncomplete = Boolean(
    memberProfile &&
      (!memberProfile.phone?.trim() ||
        !memberProfile.email?.trim() ||
        memberProfile.hasPassword === false),
  );
  const [customerOrders, setCustomerOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [registerStep, setRegisterStep] = useState<1 | 2>(1);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [recoveryOpen, setRecoveryOpen] = useState(false);
  const [recoveryLogin, setRecoveryLogin] = useState("");
  const [recoveryCode, setRecoveryCode] = useState("");
  const [recoveryPassword, setRecoveryPassword] = useState("");
  const [recoveryPasswordConfirm, setRecoveryPasswordConfirm] = useState("");
  const [recoverySentMessage, setRecoverySentMessage] = useState("");
  const visibleActiveOrder =
    activeOrder && !["DELIVERED", "CANCELLED"].includes(activeOrder.status)
      ? activeOrder
      : customerOrders.find((order) => !["DELIVERED", "CANCELLED"].includes(order.status));
  const hasActiveOrder = Boolean(visibleActiveOrder);

  useEffect(() => {
    if (
      (!profileOpen && !historyOpen && !notificationsOpen) ||
      !memberProfile ||
      !API_URL ||
      typeof window === "undefined"
    ) return;
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
  }, [historyOpen, memberProfile, notificationsOpen, profileOpen]);

  useEffect(() => {
    if (memberAuthMode === "login") return;
    setRegisterStep(1);
    setTermsAccepted(false);
  }, [memberAuthMode, loginOpen]);

  useEffect(() => {
    if (!loginOpen) {
      setRecoveryOpen(false);
      setRecoveryCode("");
      setRecoveryPassword("");
      setRecoveryPasswordConfirm("");
      setRecoverySentMessage("");
    }
  }, [loginOpen]);

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

                    {memberAuthMode === "register" && (
                      <div
                        className="mt-4 rounded-3xl p-4"
                        style={{
                          background: "#FFF8E7",
                          border: "1.5px solid #FACC15",
                          color: VERDE,
                        }}
                      >
                        <p className="text-sm font-black uppercase tracking-wider">
                          Cadastre-se e ganhe 10%
                        </p>
                        <p className="mt-1 text-xs font-bold leading-snug text-black/60">
                          Use seu perfil Menfi's no primeiro pedido e receba 10% de desconto.
                        </p>
                      </div>
                    )}

                    {memberAuthMode === "login" && recoveryOpen ? (
                      <div className="mt-4 grid gap-3">
                        <ProfileInput
                          label="Telefone ou e-mail"
                          value={recoveryLogin}
                          onChange={setRecoveryLogin}
                        />
                        <button
                          type="button"
                          onClick={async () => {
                            const data = await requestPasswordRecovery(recoveryLogin);
                            if (data) {
                              setRecoverySentMessage(
                                `Código solicitado. Ele expira em ${data.expiresInMinutes ?? 10} minutos.`,
                              );
                            }
                          }}
                          disabled={memberSaving}
                          className="rounded-2xl px-4 py-3 text-xs font-black uppercase tracking-wider disabled:opacity-50"
                          style={{ background: `${VERDE}10`, color: VERDE }}
                        >
                          Receber código
                        </button>
                        <ProfileInput
                          label="Código de 6 dígitos"
                          value={recoveryCode}
                          onChange={(value) => setRecoveryCode(value.replace(/\D/g, "").slice(0, 6))}
                          inputMode="numeric"
                          maxLength={6}
                        />
                        <ProfileInput
                          label="Nova senha"
                          value={recoveryPassword}
                          onChange={(value) => setRecoveryPassword(value.replace(/\D/g, "").slice(0, 6))}
                          type="password"
                          revealable
                          inputMode="numeric"
                          maxLength={6}
                        />
                        <ProfileInput
                          label="Confirmar nova senha"
                          value={recoveryPasswordConfirm}
                          onChange={(value) => setRecoveryPasswordConfirm(value.replace(/\D/g, "").slice(0, 6))}
                          type="password"
                          revealable
                          inputMode="numeric"
                          maxLength={6}
                        />
                        {recoverySentMessage && (
                          <p
                            className="rounded-2xl px-4 py-3 text-xs font-black leading-relaxed"
                            style={{ background: `${ROSA}70`, color: VERDE }}
                          >
                            {recoverySentMessage}
                          </p>
                        )}
                        <a
                          href={SUPPORT_WHATSAPP_URL}
                          target="_blank"
                          rel="noreferrer"
                          className="rounded-2xl px-4 py-3 text-center text-xs font-black uppercase tracking-wider"
                          style={{ background: "#FFF8F2", color: VERDE }}
                        >
                          Falar com o suporte
                        </a>
                      </div>
                    ) : memberAuthMode === "login" ? (
                      <div className="mt-4 grid gap-3">
                        <ProfileInput
                          label="Telefone, e-mail ou CPF"
                          value={memberLogin}
                          onChange={setMemberLogin}
                        />
                        <ProfileInput
                          label="Senha"
                          value={loginPassword}
                          onChange={(value) => setLoginPassword(value.replace(/\D/g, "").slice(0, 6))}
                          type="password"
                          revealable
                          inputMode="numeric"
                          maxLength={6}
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setRecoveryLogin(memberLogin);
                            setRecoveryOpen(true);
                          }}
                          className="text-left text-xs font-black uppercase tracking-wider"
                          style={{ color: VERDE }}
                        >
                          Esqueci minha senha
                        </button>
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
                      <label className="grid gap-1">
                        <span className="text-[10px] font-black uppercase tracking-wider text-black/40">
                          Telefone / WhatsApp
                        </span>
                        <input
                          value={memberPhone}
                          onChange={(e) => setMemberPhone(e.target.value.replace(/[^\d\s()+-]/g, ""))}
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
                        revealable
                        inputMode="numeric"
                        maxLength={6}
                      />
                      <ProfileInput
                        label="Confirmar senha"
                        value={memberPasswordConfirm}
                        onChange={(value) => setMemberPasswordConfirm(value.replace(/\D/g, "").slice(0, 6))}
                        type="password"
                        revealable
                        inputMode="numeric"
                        maxLength={6}
                      />
                      <label className="hidden gap-1">
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
                      type="button"
                      onClick={closeLogin}
                      className="mt-4 w-full rounded-2xl px-4 py-3 text-xs font-black uppercase tracking-wider"
                      style={{ background: "#FFF8F2", color: VERDE, border: `1.5px solid ${VERDE}12` }}
                    >
                      Continuar sem cadastro
                    </button>
      
                    <button
                      onClick={
                        memberAuthMode === "login" && recoveryOpen
                          ? async () => {
                              const ok = await resetMemberPassword(
                                recoveryLogin,
                                recoveryCode,
                                recoveryPassword,
                                recoveryPasswordConfirm,
                              );
                              if (ok) {
                                setRecoveryOpen(false);
                                closeLogin();
                              }
                            }
                          : memberAuthMode === "login"
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
                        : memberAuthMode === "login" && recoveryOpen
                          ? "Criar nova senha"
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
                      {profileIncomplete && (
                        <button
                          type="button"
                          onClick={editMember}
                          className="grid gap-2 rounded-3xl p-4 text-left"
                          style={{
                            background: "#FFF8E7",
                            border: "1.5px solid #FACC15",
                            color: VERDE,
                          }}
                        >
                          <span className="text-xs font-black uppercase tracking-wider">
                            Complete seu cadastro
                          </span>
                          <span className="text-sm font-bold leading-snug text-black/60">
                            Adicione telefone, e-mail e senha para acompanhar pedidos e recuperar seu acesso.
                          </span>
                        </button>
                      )}
                      <ProfileSection title="Minha conta">
                        <InfoLine label="Nome" value={memberProfile.name} />
                        <InfoLine label="Telefone" value={memberProfile.phone || "Pendente"} />
                        <InfoLine label="E-mail" value={memberProfile.email || "Pendente"} />
                      </ProfileSection>

                      <ProfileMenuButton icon={UserCog} label="Editar dados da conta" onClick={editMember} />
                      <ProfileMenuButton icon={MapPin} label="Gerenciar endereços" onClick={editMember} />
                      <ProfileMenuButton icon={KeyRound} label="Alterar senha / recuperar acesso" onClick={editMember} />
                      {hasActiveOrder && visibleActiveOrder && (
                        <ActiveProfileOrderCard
                          order={visibleActiveOrder}
                          onOpen={() => {
                            closeProfile();
                            onOpenActiveOrder?.(visibleActiveOrder.id);
                          }}
                        />
                      )}
                      <div className="rounded-2xl p-4 text-xs font-black uppercase tracking-wider" style={{ background: "#FFF8F2", border: `1px solid ${VERDE}12` }}>
                        Falar com o suporte
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

              {historyOpen && memberProfile && (
                <SidePanel title="Histórico de pedidos" onClose={closeHistory}>
                  <div className="grid gap-2">
                    {ordersLoading && (
                      <div className="flex justify-center py-8">
                        <Loader2 size={22} strokeWidth={2.5} style={{ animation: "spin 1s linear infinite" }} />
                      </div>
                    )}
                    {!ordersLoading && customerOrders.length === 0 && (
                      <p className="rounded-2xl p-4 text-xs font-bold opacity-60" style={{ background: "#FFF8F2" }}>
                        Nenhum pedido encontrado neste perfil.
                      </p>
                    )}
                    {customerOrders.map((order) => (
                      <OrderHistoryRow
                        key={order.id}
                        order={order}
                        onRepeat={() => {
                          closeHistory();
                          onRepeatOrder?.(order.items);
                        }}
                      />
                    ))}
                  </div>
                </SidePanel>
              )}

              {notificationsOpen && memberProfile && (
                <SidePanel title="Notificações" onClose={closeNotifications}>
                  <div className="grid gap-3">
                    {notifications.length > 0 ? (
                      notifications.map((notification) => (
                        <button
                          key={notification.id}
                          type="button"
                          onClick={() => {
                            closeNotifications();
                            onOpenActiveOrder?.(visibleActiveOrder?.id);
                          }}
                          className="rounded-2xl p-4 text-left"
                          style={{
                            background: notification.read ? "#FFF8F2" : VERDE,
                            color: notification.read ? VERDE : ROSA,
                            border: `1px solid ${notification.read ? `${VERDE}12` : VERDE}`,
                          }}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p className="text-[10px] font-black uppercase tracking-wider opacity-70">
                                Pedido {notification.orderId}
                              </p>
                              <p className="mt-1 text-base font-black leading-tight">
                                {notification.title}
                              </p>
                            </div>
                            {!notification.read && (
                              <span
                                className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full"
                                style={{ background: ROSA, border: "1px solid #fff" }}
                              />
                            )}
                          </div>
                          <p className="mt-2 text-xs font-bold leading-relaxed opacity-75">
                            {notification.message}
                          </p>
                          <p className="mt-3 text-[10px] font-black uppercase tracking-wider opacity-50">
                            {new Date(notification.createdAt).toLocaleTimeString("pt-BR", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>
                        </button>
                      ))
                    ) : (
                      <div className="rounded-2xl p-4 text-xs font-bold" style={{ background: "#FFF8F2", border: `1px solid ${VERDE}12` }}>
                        Nenhuma notificação nova.
                      </div>
                    )}
                    {hasActiveOrder && visibleActiveOrder && (
                      <button
                        type="button"
                        onClick={() => {
                          closeNotifications();
                            onOpenActiveOrder?.(visibleActiveOrder.id);
                        }}
                        className="rounded-2xl p-4 text-left"
                        style={{ background: "#fff", color: VERDE, border: `1px solid ${VERDE}12` }}
                      >
                        <p className="text-xs font-black uppercase tracking-wider">Acompanhar pedido</p>
                        <p className="mt-1 text-lg font-black">{visibleActiveOrder.id} · {(STATUS_COPY[visibleActiveOrder.status] ?? STATUS_COPY.PAYMENT_PENDING).label}</p>
                        <p className="mt-1 text-xs font-bold opacity-75">Toque para abrir a linha do tempo.</p>
                      </button>
                    )}
                    <a
                      href={SUPPORT_WHATSAPP_URL}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-3 rounded-2xl p-4 text-xs font-black uppercase tracking-wider"
                      style={{ background: "#FFF8F2", color: VERDE, border: `1px solid ${VERDE}12` }}
                    >
                      <Headphones size={18} strokeWidth={2.4} />
                      Chat com atendimento
                    </a>
                    <div className="rounded-2xl p-4 text-xs font-bold leading-relaxed" style={{ background: "#fff", border: `1px solid ${VERDE}12` }}>
                      Aqui ficam os avisos que o sistema envia: pagamento, preparo, pedido pronto, entrega e conversas com atendimento.
                    </div>
                  </div>
                </SidePanel>
              )}

              {favoritesOpen && (
                <SidePanel title="Favoritos" onClose={closeFavorites}>
                  <div className="rounded-2xl p-4 text-xs font-bold leading-relaxed" style={{ background: "#FFF8F2", border: `1px solid ${VERDE}12` }}>
                    Seus favoritos aparecerão aqui para pedir de novo mais rápido.
                  </div>
                </SidePanel>
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
  revealable = false,
  inputMode,
  maxLength,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: HTMLInputTypeAttribute;
  revealable?: boolean;
  inputMode?: "none" | "text" | "tel" | "url" | "email" | "numeric" | "decimal" | "search";
  maxLength?: number;
}) {
  const [visible, setVisible] = useState(false);
  const inputType = revealable && visible ? "text" : type;

  return (
    <label className="grid min-w-0 gap-1">
      <span className="text-[10px] font-black uppercase tracking-wider text-black/40">
        {label}
      </span>
      <span className="relative block">
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          type={inputType}
          inputMode={inputMode}
          maxLength={maxLength}
          className="min-w-0 w-full rounded-2xl px-4 py-3 text-base outline-none"
          style={{
            border: `1.5px solid ${VERDE}16`,
            color: VERDE,
            paddingRight: revealable ? "3.25rem" : undefined,
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
  const canRepeat = order.status === "DELIVERED" && order.items.length > 0;
  const date = new Date(order.timestamp).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
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
      {canRepeat && (
        <button
          onClick={onRepeat}
          className="mt-3 w-full rounded-xl px-3 py-2 text-[11px] font-black uppercase tracking-wider"
          style={{ background: `${VERDE}10`, color: VERDE }}
        >
          Pedir novamente
        </button>
      )}
    </div>
  );
}

function SidePanel({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[75] flex justify-end bg-black/45"
      onClick={onClose}
    >
      <motion.div
        initial={{ x: 420 }}
        animate={{ x: 0 }}
        exit={{ x: 420 }}
        transition={{ type: "spring", stiffness: 320, damping: 32 }}
        className="h-full w-full max-w-[380px] overflow-y-auto overflow-x-hidden p-4"
        style={{ background: "#fff", color: VERDE, boxShadow: "-24px 0 70px rgba(0,0,0,0.22)" }}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-sm font-black uppercase tracking-wider">{title}</h2>
          <button onClick={onClose} className="flex h-10 w-10 items-center justify-center rounded-full" style={{ background: `${VERDE}08`, color: VERDE }}>
            <X size={18} strokeWidth={2.4} />
          </button>
        </div>
        <div className="mt-4">{children}</div>
      </motion.div>
    </motion.div>
  );
}

function ProfileSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="rounded-2xl p-4" style={{ background: "#FFF8F2", border: `1px solid ${VERDE}12` }}>
      <p className="text-xs font-black uppercase tracking-wider">{title}</p>
      <div className="mt-3 grid gap-2">{children}</div>
    </div>
  );
}

function InfoLine({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] font-black uppercase tracking-wider opacity-45">{label}</p>
      <p className="mt-0.5 text-sm font-bold">{value}</p>
    </div>
  );
}

function ProfileMenuButton({
  icon: Icon,
  label,
  onClick,
}: {
  icon: ElementType;
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
  icon: ElementType;
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
