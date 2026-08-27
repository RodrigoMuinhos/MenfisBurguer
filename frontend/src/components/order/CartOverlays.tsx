import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { CheckCircle2, CircleX, CreditCard, Loader2, QrCode } from "lucide-react";
import { Order } from "@/types/order";
import { ROSA, VERDE } from "@/utils/theme";
import { printOrderReceipts } from "@/components/admin/shared";
import { KioskKeyboardTarget, PaymentMethod } from "./checkout";
import { KioskVirtualKeyboard } from "./KioskVirtualKeyboard";
import type { CounterTerminalMethod } from "./cartFinalize";
import type { TerminalPaymentProgress } from "./cartFinalize";

const TERMINAL_ERROR_STATUSES = new Set([
  "DECLINED",
  "CANCELLED",
  "TIMEOUT",
  "TERMINAL_DISCONNECTED",
  "COMMUNICATION_ERROR",
]);

function terminalProgressMessage(progress: TerminalPaymentProgress) {
  const raw = String(progress.message ?? "").trim();
  const normalized = raw.toLocaleLowerCase("pt-BR");
  const safeLiveMessage =
    raw.length >= 3 &&
    raw.length <= 120 &&
    /[a-zá-ú]/i.test(raw) &&
    !/\d{6,}/.test(raw) &&
    !/^[0-9a-f;]+$/i.test(raw);
  if (normalized.includes("senha")) return safeLiveMessage ? raw : "Digite sua senha no terminal de pagamento.";
  if (
    normalized.includes("aproxime") ||
    normalized.includes("insira") ||
    normalized.includes("passe o cart")
  ) {
    return safeLiveMessage ? raw : "Aproxime, insira ou passe o cartão no terminal.";
  }
  if (normalized.includes("retire") && normalized.includes("cart")) {
    return safeLiveMessage ? raw : "Retire o cartão do terminal.";
  }
  if (normalized.includes("process") || normalized.includes("aguarde")) {
    return safeLiveMessage ? raw : "Aguarde. O pagamento está sendo processado.";
  }
  if (normalized.includes("conect")) return safeLiveMessage ? raw : "Conectando ao sistema de pagamento.";
  if (progress.status === "APPROVED") return "Pagamento aprovado.";
  if (progress.status === "CANCELLED") {
    return "A operação foi encerrada na maquininha e o pedido foi cancelado.";
  }
  return "Siga as instruções exibidas no terminal de pagamento.";
}

function terminalProgressTitle(progress: TerminalPaymentProgress) {
  if (progress.status === "APPROVED") return "Pagamento aprovado";
  if (progress.status === "DECLINED") return "Pagamento negado";
  if (progress.status === "CANCELLED") return "Operação cancelada";
  if (progress.status === "TIMEOUT") return "Tempo da etapa encerrado";
  if (progress.status === "COMMUNICATION_ERROR") return "Pagamento não concluído";
  if (progress.status === "WAITING_TERMINAL") return "Preparando terminal";
  const message = terminalProgressMessage(progress);
  if (message.startsWith("Digite")) return "Digite a senha";
  if (message.startsWith("Aproxime")) return "Apresente o cartão";
  if (message.startsWith("Retire")) return "Retire o cartão";
  return "Pagamento em andamento";
}

export function CartOverlays({
  kioskSuccessOpen,
  paying,
  kioskMode,
  counterServiceMode = false,
  payment,
  paymentSlow,
  terminalPaymentProgress = null,
  kioskKeyboardOpen,
  kioskKeyboardTarget,
  typeKioskKey,
  backspaceKioskKey,
  clearKioskKey,
  closeKioskKeyboard,
  setKioskKeyboardTarget,
  counterPaymentPromptOpen = false,
  counterPaymentTotal = 0,
  counterCustomerNamePromptOpen = false,
  counterCustomerNameDraft = "",
  kioskSuccessOrder = null,
  onConfirmCounterPayment,
  setCounterCustomerNameDraft,
  onConfirmCounterCustomerName,
  onCloseKioskSuccess,
}: {
  kioskSuccessOpen: boolean;
  paying: boolean;
  kioskMode: boolean;
  counterServiceMode?: boolean;
  payment: PaymentMethod;
  paymentSlow: boolean;
  terminalPaymentProgress?: TerminalPaymentProgress | null;
  kioskKeyboardOpen: boolean;
  kioskKeyboardTarget: KioskKeyboardTarget;
  typeKioskKey: (key: string) => void;
  backspaceKioskKey: () => void;
  clearKioskKey: () => void;
  closeKioskKeyboard: () => void;
  setKioskKeyboardTarget: (target: KioskKeyboardTarget) => void;
  counterPaymentPromptOpen?: boolean;
  counterPaymentTotal?: number;
  counterCustomerNamePromptOpen?: boolean;
  counterCustomerNameDraft?: string;
  kioskSuccessOrder?: Order | null;
  onConfirmCounterPayment?: (method: CounterTerminalMethod) => void;
  setCounterCustomerNameDraft?: (value: string) => void;
  onConfirmCounterCustomerName?: () => void;
  onCloseKioskSuccess?: () => void;
}) {
  const [counterPaymentMethod, setCounterPaymentMethod] = useState<CounterTerminalMethod | null>(null);
  const [now, setNow] = useState(Date.now());
  const [sitefOpen, setSitefOpen] = useState(false);
  const [sitefPassword, setSitefPassword] = useState("");
  const [sitefAuthorized, setSitefAuthorized] = useState(false);
  const [sitefLoading, setSitefLoading] = useState(false);
  const [sitefMessage, setSitefMessage] = useState("");
  const [sitefOnline, setSitefOnline] = useState(false);
  const [terminalCancelling, setTerminalCancelling] = useState(false);
  const [terminalQrImage, setTerminalQrImage] = useState("");
  const [terminalCancelConfirm, setTerminalCancelConfirm] = useState(false);
  const successTotal = kioskSuccessOrder
    ? Number(kioskSuccessOrder.total || kioskSuccessOrder.items.reduce((sum, item) => sum + item.price * item.qty, 0))
    : 0;
  const rawCallName = String(kioskSuccessOrder?.customerName ?? "").trim();
  const callName = rawCallName.toUpperCase().replace(/_/g, "-") === "KIOSK-MOB" ? "" : rawCallName;
  const canConfirmCounterName = counterCustomerNameDraft.trim().length >= 2;
  const formatMoney = (value: number) =>
    value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  useEffect(() => {
    if (!counterPaymentPromptOpen) {
      setCounterPaymentMethod(null);
      return;
    }
  }, [counterPaymentPromptOpen]);

  useEffect(() => {
    if (!terminalPaymentProgress) {
      setTerminalCancelConfirm(false);
      setTerminalCancelling(false);
      return;
    }
    if (TERMINAL_ERROR_STATUSES.has(terminalPaymentProgress.status)) {
      setTerminalCancelConfirm(false);
    }
    setNow(Date.now());
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [terminalPaymentProgress]);

  useEffect(() => {
    const payload = terminalPaymentProgress?.qrCode?.trim();
    if (!payload) {
      setTerminalQrImage("");
      return;
    }
    let active = true;
    QRCode.toDataURL(payload, { width: 280, margin: 2, errorCorrectionLevel: "M" })
      .then((image) => active && setTerminalQrImage(image))
      .catch(() => active && setTerminalQrImage(""));
    return () => {
      active = false;
    };
  }, [terminalPaymentProgress?.qrCode]);

  useEffect(() => {
    const open = () => {
      setSitefOpen(true);
      setSitefPassword("");
      setSitefAuthorized(false);
      setSitefMessage("");
    };
    const keydown = (event: KeyboardEvent) => {
      if (event.key === "F3") {
        event.preventDefault();
        open();
      }
    };
    window.addEventListener("keydown", keydown);
    const desktop = (window as Window & {
      kioskMenfis?: { onOpenSitef?: (callback: () => void) => () => void };
    }).kioskMenfis;
    const unsubscribe = desktop?.onOpenSitef?.(open);
    return () => {
      window.removeEventListener("keydown", keydown);
      unsubscribe?.();
    };
  }, []);

  const remainingSeconds = terminalPaymentProgress
    ? Math.max(0, 60 - Math.floor((now - terminalPaymentProgress.stageStartedAt) / 1000))
    : 0;
  const remainingLabel = String(remainingSeconds);

  const unlockSitef = async () => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8180";
    const valid = await fetch(`${apiUrl}/settings/sitef-supervisor/verify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: sitefPassword }),
    })
      .then((response) => response.ok ? response.json() : null)
      .then((body) => body?.valid === true)
      .catch(() => false);
    if (!valid) {
      setSitefMessage("Senha inválida.");
      return;
    }
    setSitefAuthorized(true);
    setSitefMessage("Consultando o serviço...");
    const desktop = (window as Window & {
      kioskMenfis?: { sitefStatus?: () => Promise<{ online: boolean; message: string }> };
    }).kioskMenfis;
    const status = desktop?.sitefStatus
      ? await desktop.sitefStatus()
      : await fetch("http://127.0.0.1:8081/api/terminal/availability")
          .then((response) => response.ok ? response.json() : null)
          .then((body) => ({
            online: body?.available === true && body?.mode === "REAL",
            message: body?.message || "SiTef Bridge indisponível",
          }))
          .catch(() => ({ online: false, message: "SiTef Bridge indisponível" }));
    setSitefOnline(status?.online === true);
    setSitefMessage(status?.message ?? "SiTef Bridge indisponível.");
  };

  const startSitef = async () => {
    setSitefLoading(true);
    setSitefMessage("Ligando o SiTef Bridge...");
    const desktop = (window as Window & {
      kioskMenfis?: {
        startSitef?: (password: string) => Promise<{ ok: boolean; online?: boolean; message?: string; error?: string }>;
      };
    }).kioskMenfis;
    const result = await desktop?.startSitef?.(sitefPassword);
    setSitefLoading(false);
    setSitefOnline(result?.ok === true && result?.online !== false);
    setSitefMessage(result?.message ?? result?.error ?? "Não foi possível ligar o SiTef Bridge.");
  };

  return (
    <>
            <AnimatePresence>
              {kioskSuccessOpen && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 z-[70] flex items-center justify-center px-6"
                  style={{
                    background: "rgba(255,255,255,0.96)",
                    backdropFilter: "blur(8px)",
                  }}
                >
                  <motion.div
                    initial={{ y: 18, scale: 0.96 }}
                    animate={{ y: 0, scale: 1 }}
                    exit={{ y: 18, scale: 0.96 }}
                    className="w-full max-w-xl rounded-[32px] p-8 text-center"
                    style={{
                      background: "#fff",
                      border: `2px solid ${ROSA}`,
                      boxShadow: "0 28px 80px rgba(101,0,31,0.18)",
                      color: VERDE,
                    }}
                  >
                    <motion.div
                      initial={{ scale: 0.55, rotate: -12 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ type: "spring", stiffness: 260, damping: 14 }}
                      className="mx-auto flex h-24 w-24 items-center justify-center rounded-full"
                      style={{ background: ROSA, color: VERDE }}
                    >
                      <CheckCircle2 size={56} strokeWidth={2.8} />
                    </motion.div>
                    <p
                      className="mt-6 font-black uppercase"
                      style={{
                        fontFamily: "'Bebas Neue','Arial Black',sans-serif",
                        fontSize: "clamp(2.5rem, 7vw, 4.7rem)",
                        lineHeight: 0.95,
                      }}
                    >
                      {counterServiceMode ? "Pedido concluído" : "Pedido realizado"}
                    </p>
                    {kioskSuccessOrder ? (
                      <>
                        <div
                          className="mx-auto mt-5 grid max-w-md grid-cols-2 gap-3 rounded-3xl p-4 text-left sm:grid-cols-4"
                          style={{ background: "#fff", border: `1px solid ${ROSA}` }}
                        >
                          <div>
                            <p className="text-[10px] font-black uppercase opacity-50">Pedido</p>
                            <p className="text-3xl font-black">#{kioskSuccessOrder.number}</p>
                          </div>
                          <div>
                            <p className="text-[10px] font-black uppercase opacity-50">Nome</p>
                            <p className="truncate text-2xl font-black">
                              {callName || "Cliente"}
                            </p>
                          </div>
                          <div>
                            <p className="text-[10px] font-black uppercase opacity-50">Código</p>
                            <p className="text-3xl font-black">{kioskSuccessOrder.deliveryCode}</p>
                          </div>
                          <div>
                            <p className="text-[10px] font-black uppercase opacity-50">Total</p>
                            <p className="text-2xl font-black">{formatMoney(successTotal)}</p>
                          </div>
                        </div>
                        <div className="mx-auto mt-4 max-w-md rounded-2xl bg-white text-left">
                          {kioskSuccessOrder.items.slice(0, 3).map((item) => (
                            <div
                              key={item.id}
                              className="flex items-center justify-between border-b py-2 text-sm font-black last:border-b-0"
                              style={{ borderColor: `${ROSA}80` }}
                            >
                              <span>
                                {item.qty}x {item.name}
                              </span>
                              <span>{formatMoney(item.price * item.qty)}</span>
                            </div>
                          ))}
                        </div>
                        <p className="mx-auto mt-5 max-w-md text-lg font-black leading-snug">
                          Aguarde na fila. Quando estiver pronto, chamaremos pelo nome e número do pedido.
                        </p>
                        <div className="mx-auto mt-5 grid max-w-md gap-3 sm:grid-cols-2">
                          <button
                            type="button"
                            onClick={() => {
                              printOrderReceipts(kioskSuccessOrder, { confirm: false });
                              onCloseKioskSuccess?.();
                            }}
                            className="min-h-14 rounded-2xl px-4 text-sm font-black uppercase tracking-wide"
                            style={{ background: VERDE, color: ROSA }}
                          >
                            Imprimir nota
                          </button>
                          <button
                            type="button"
                            onClick={onCloseKioskSuccess}
                            className="min-h-14 rounded-2xl px-4 text-sm font-black uppercase tracking-wide"
                            style={{ background: "#fff", color: VERDE, border: `1.5px solid ${VERDE}` }}
                          >
                            Finalizar sem imprimir
                          </button>
                        </div>
                      </>
                    ) : (
                      <>
                        <p className="mx-auto mt-4 max-w-md text-lg font-black leading-snug">
                          Aguarde entre 10 e 20 minutos. Quando estiver pronto,
                          avisaremos no seu WhatsApp.
                        </p>
                        <p className="mx-auto mt-4 max-w-md text-sm font-bold leading-relaxed opacity-70">
                          Já já sua fome vai passar. Estamos enviando seu pedido para a
                          cozinha.
                        </p>
                      </>
                    )}
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>

            <AnimatePresence>
              {counterCustomerNamePromptOpen && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 z-[85] flex items-center justify-center px-6"
                  style={{
                    background: "rgba(255,255,255,0.94)",
                    color: VERDE,
                  }}
                >
                  <motion.div
                    initial={{ scale: 0.95, y: 12 }}
                    animate={{ scale: 1, y: 0 }}
                    exit={{ scale: 0.95, y: 12 }}
                    className="w-full max-w-md rounded-3xl border bg-white p-6 shadow-2xl"
                    style={{ borderColor: ROSA }}
                  >
                    <p className="text-[10px] font-black uppercase tracking-[0.22em] opacity-50">
                      Fila de espera
                    </p>
                    <h2 className="mt-2 text-2xl font-black uppercase tracking-wide">
                      Nome para chamada
                    </h2>
                    <p className="mt-2 text-sm font-bold leading-relaxed opacity-65">
                      Digite o nome que vai aparecer na nota e será chamado quando o pedido ficar pronto.
                    </p>
                    <input
                      value={counterCustomerNameDraft}
                      onChange={(event) => setCounterCustomerNameDraft?.(event.target.value)}
                      onFocus={() => {
                        if (counterServiceMode) setKioskKeyboardTarget("counterName");
                      }}
                      onClick={() => {
                        if (counterServiceMode) setKioskKeyboardTarget("counterName");
                      }}
                      autoFocus
                      placeholder="Ex.: Mariana"
                      inputMode={counterServiceMode ? "none" : "text"}
                      className="mt-5 min-h-14 w-full rounded-2xl px-4 text-xl font-black uppercase outline-none"
                      style={{
                        border: `2px solid ${canConfirmCounterName ? VERDE : ROSA}`,
                        color: VERDE,
                      }}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" && canConfirmCounterName) {
                          onConfirmCounterCustomerName?.();
                        }
                      }}
                    />
                    {!canConfirmCounterName && (
                      <p className="mt-2 text-xs font-bold text-red-700">
                        Informe pelo menos 2 letras para organizar a fila.
                      </p>
                    )}
                    <button
                      type="button"
                      disabled={!canConfirmCounterName}
                      onClick={onConfirmCounterCustomerName}
                      className="mt-5 min-h-14 w-full rounded-2xl px-4 text-sm font-black uppercase tracking-wide disabled:opacity-50"
                      style={{ background: VERDE, color: ROSA }}
                    >
                      Confirmar nome e enviar pedido
                    </button>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
      
            <AnimatePresence>
              {paying && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 z-50 flex items-center justify-center px-6"
                  style={{
                    background: "rgba(255,255,255,0.92)",
                    backdropFilter: "blur(6px)",
                  }}
                >
                  <motion.div
                    initial={{ y: 12, scale: 0.98 }}
                    animate={{ y: 0, scale: 1 }}
                    exit={{ y: 12, scale: 0.98 }}
                    className="w-full max-w-sm rounded-[32px] px-7 py-8 text-center"
                    style={{
                      background: "#fff",
                      border: `1px solid ${ROSA}`,
                      boxShadow: "0 28px 80px rgba(101,0,31,0.18)",
                      color: VERDE,
                    }}
                  >
                    <div
                      className="mx-auto mb-5 flex h-[72px] w-[72px] items-center justify-center rounded-full"
                      style={{ background: `${ROSA}90`, boxShadow: `0 10px 28px ${ROSA}80` }}
                    >
                      {terminalPaymentProgress?.status === "APPROVED" ? (
                        <CheckCircle2 size={34} strokeWidth={2.8} />
                      ) : terminalPaymentProgress &&
                        TERMINAL_ERROR_STATUSES.has(terminalPaymentProgress.status) ? (
                        <CircleX size={34} strokeWidth={2.8} />
                      ) : (
                        <Loader2
                          size={30}
                          strokeWidth={2.8}
                          style={{ animation: "spin 1s linear infinite" }}
                        />
                      )}
                    </div>
                    {counterServiceMode && terminalPaymentProgress && (
                      <div className="mb-3 flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-[0.18em] opacity-55">
                        <CreditCard size={14} strokeWidth={2.5} />
                        Terminal de pagamento
                      </div>
                    )}
                    <p className="text-sm font-black uppercase tracking-wide">
                      {counterServiceMode && terminalPaymentProgress
                        ? terminalProgressTitle(terminalPaymentProgress)
                        : counterServiceMode
                        ? "Registrando pedido do balcão"
                        : payment === "whatsapp"
                          ? "Enviando ao atendimento"
                          : payment === "pagar_na_entrega"
                            ? "Enviando pedido"
                            : kioskMode
                              ? "Enviando pedido para a equipe"
                              : "Conectando ao pagamento"}
                    </p>
                    <p
                      className={
                        counterServiceMode && terminalPaymentProgress
                          ? "mx-auto mt-3 max-w-[290px] text-xl font-black uppercase leading-snug"
                          : "mt-2 text-xs leading-relaxed opacity-65"
                      }
                    >
                      {counterServiceMode
                        ? terminalPaymentProgress
                          ? terminalProgressMessage(terminalPaymentProgress)
                          : "Estamos criando o pedido antes de iniciar o pagamento."
                        : payment === "whatsapp"
                          ? "Estamos criando o pedido e abrindo o WhatsApp para o atendimento."
                          : payment === "pagar_na_entrega"
                            ? "Estamos criando o pedido para a cozinha."
                            : kioskMode
                              ? "Aguarde enquanto registramos o pedido para confirmação do atendente."
                              : "Estamos registrando seu pedido e abrindo o Mercado Pago. Se demorar, aguarde mais alguns segundos."}
                    </p>
                    {counterServiceMode && terminalPaymentProgress && (
                      <div className="mt-5">
                        {terminalQrImage && (
                          <div className="mx-auto mb-5 w-fit rounded-3xl border bg-white p-3" style={{ borderColor: ROSA }}>
                            <img
                              src={terminalQrImage}
                              alt="QR Code PIX gerado pelo SiTef"
                              className="h-52 w-52"
                            />
                            <p className="mt-2 text-[10px] font-black uppercase tracking-wide opacity-60">
                              Escaneie com o aplicativo do seu banco
                            </p>
                          </div>
                        )}
                        <div
                          className="mx-auto flex h-11 w-[92px] items-center justify-center rounded-full"
                          style={{ background: `${ROSA}45` }}
                          aria-label={`Tempo restante: ${remainingLabel} segundos`}
                        >
                          <p className="text-base font-black tabular-nums tracking-wide">
                            {remainingLabel} <span className="text-[10px] uppercase opacity-55">seg</span>
                          </p>
                        </div>
                        <div className="mx-auto mt-4 h-1.5 w-full overflow-hidden rounded-full" style={{ background: `${ROSA}45` }}>
                          <motion.div
                            className="h-full rounded-full"
                            style={{ background: VERDE }}
                            animate={{ width: `${(remainingSeconds / 60) * 100}%` }}
                            transition={{ duration: 0.35, ease: "linear" }}
                          />
                        </div>
                        <p className="mt-3 text-[11px] font-bold opacity-55">
                          Conclua a operação diretamente na maquininha.
                        </p>
                      </div>
                    )}
                    {counterServiceMode &&
                      terminalPaymentProgress?.cancel &&
                      !TERMINAL_ERROR_STATUSES.has(terminalPaymentProgress.status) &&
                      terminalPaymentProgress.status !== "APPROVED" && (
                        terminalCancelConfirm ? (
                          <div
                            className="mt-4 rounded-2xl p-4"
                            style={{ background: `${ROSA}45`, border: `1px solid ${ROSA}` }}
                          >
                            <p className="text-base font-black uppercase">
                              Deseja continuar ou cancelar?
                            </p>
                            <p className="mt-1 text-xs font-bold opacity-65">
                              Ao cancelar, aguarde a maquininha encerrar completamente.
                            </p>
                            <div className="mt-3 grid grid-cols-2 gap-2">
                              <button
                                type="button"
                                disabled={terminalCancelling}
                                onClick={() => setTerminalCancelConfirm(false)}
                                className="h-12 rounded-xl text-xs font-black uppercase text-white"
                                style={{ background: VERDE }}
                              >
                                Continuar
                              </button>
                              <button
                                type="button"
                                disabled={terminalCancelling}
                                onClick={async () => {
                                  setTerminalCancelling(true);
                                  try {
                                    await terminalPaymentProgress.cancel?.();
                                    setTerminalCancelConfirm(false);
                                  } finally {
                                    setTerminalCancelling(false);
                                  }
                                }}
                                className="h-12 rounded-xl border text-xs font-black uppercase disabled:opacity-50"
                                style={{ borderColor: VERDE, color: VERDE }}
                              >
                                {terminalCancelling ? "Encerrando..." : "Sim, cancelar"}
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setTerminalCancelConfirm(true)}
                            className="mt-6 h-12 w-full rounded-2xl border text-xs font-black uppercase tracking-wide transition-opacity hover:opacity-70"
                            style={{ borderColor: VERDE, color: VERDE }}
                          >
                            Cancelar pagamento
                          </button>
                        )
                      )}
                    {paymentSlow &&
                      !counterServiceMode &&
                      payment !== "whatsapp" &&
                      payment !== "pagar_na_entrega" && (
                      <p
                        className="mt-3 rounded-xl px-3 py-2 text-[11px] font-bold"
                        style={{ background: `${ROSA}70` }}
                      >
                        A conexão está mais lenta que o normal, mas ainda estamos
                        tentando.
                      </p>
                    )}
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>

            <AnimatePresence>
              {sitefOpen && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 z-[100] flex items-center justify-center px-6"
                  style={{ background: "rgba(255,255,255,0.96)", color: VERDE }}
                >
                  <motion.div
                    initial={{ scale: 0.95, y: 12 }}
                    animate={{ scale: 1, y: 0 }}
                    className="w-full max-w-md rounded-3xl border bg-white p-6 shadow-2xl"
                    style={{ borderColor: ROSA }}
                  >
                    <p className="text-[10px] font-black uppercase tracking-[0.22em] opacity-50">
                      Manutenção — F3
                    </p>
                    <h2 className="mt-2 text-2xl font-black uppercase">SiTef Bridge</h2>
                    {!sitefAuthorized ? (
                      <>
                        <p className="mt-2 text-sm font-bold opacity-65">
                          Digite a senha técnica para acessar o controle.
                        </p>
                        <input
                          type="password"
                          value={sitefPassword}
                          onChange={(event) => setSitefPassword(event.target.value)}
                          onKeyDown={(event) => {
                            if (event.key === "Enter") void unlockSitef();
                          }}
                          autoFocus
                          className="mt-5 h-14 w-full rounded-2xl px-4 text-xl font-black outline-none"
                          style={{ border: `2px solid ${ROSA}`, color: VERDE }}
                          placeholder="Senha"
                        />
                        <button
                          type="button"
                          onClick={() => void unlockSitef()}
                          className="mt-4 h-14 w-full rounded-2xl text-sm font-black uppercase text-white"
                          style={{ background: VERDE }}
                        >
                          Entrar
                        </button>
                      </>
                    ) : (
                      <>
                        <div
                          className="mt-5 rounded-2xl p-4 text-sm font-black"
                          style={{ background: sitefOnline ? "#DCFCE7" : `${ROSA}45` }}
                        >
                          {sitefOnline ? "● SiTef Bridge ligado" : "○ SiTef Bridge desligado"}
                          <p className="mt-1 text-xs font-semibold opacity-70">{sitefMessage}</p>
                        </div>
                        {!sitefOnline && (
                          <button
                            type="button"
                            disabled={sitefLoading}
                            onClick={() => void startSitef()}
                            className="mt-4 h-14 w-full rounded-2xl text-sm font-black uppercase text-white disabled:opacity-50"
                            style={{ background: VERDE }}
                          >
                            {sitefLoading ? "Ligando..." : "Ligar SiTef Bridge"}
                          </button>
                        )}
                        {sitefOnline && (
                          <button
                            type="button"
                            onClick={() => window.open("http://127.0.0.1:7071/tef/admin", "_blank", "noopener,noreferrer")}
                            className="mt-4 h-14 w-full rounded-2xl text-sm font-black uppercase text-white"
                            style={{ background: VERDE }}
                          >
                            Abrir testes gerenciais
                          </button>
                        )}
                      </>
                    )}
                    {sitefMessage && !sitefAuthorized && (
                      <p className="mt-3 text-xs font-bold text-red-700">{sitefMessage}</p>
                    )}
                    <button
                      type="button"
                      onClick={() => setSitefOpen(false)}
                      className="mt-4 h-12 w-full rounded-2xl border text-sm font-black uppercase"
                      style={{ borderColor: ROSA }}
                    >
                      Fechar
                    </button>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>

            <AnimatePresence>
              {counterPaymentPromptOpen && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 z-[80] flex items-center justify-center px-6"
                  style={{
                    background: "rgba(255,255,255,0.92)",
                    color: VERDE,
                  }}
                >
                  <motion.div
                    initial={{ scale: 0.95, y: 12 }}
                    animate={{ scale: 1, y: 0 }}
                    exit={{ scale: 0.95, y: 12 }}
                    className="w-full max-w-md rounded-3xl border bg-white p-6 text-center shadow-2xl"
                    style={{ borderColor: ROSA }}
                  >
                    <div
                      className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full"
                      style={{ background: ROSA }}
                    >
                      {counterPaymentMethod === "PIX" ? <QrCode size={26} /> : <CreditCard size={26} />}
                    </div>
                    <h2 className="text-xl font-black uppercase tracking-wide">
                      {counterPaymentMethod === "PIX"
                        ? "Pagamento Pix"
                        : counterPaymentMethod === "DEBIT"
                          ? "Cartão de débito"
                          : counterPaymentMethod === "CREDIT"
                            ? "Cartão de crédito"
                          : "Como será o pagamento?"}
                    </h2>
                    {!counterPaymentMethod && (
                      <>
                        <p className="mx-auto mt-2 max-w-sm text-sm font-semibold leading-relaxed opacity-70">
                          Escolha a forma de pagamento para concluir o pedido do balcão.
                        </p>
                        <div className="mt-6 grid gap-3">
                          <button
                            type="button"
                            onClick={() => setCounterPaymentMethod("DEBIT")}
                            className="flex h-16 items-center justify-center gap-2 rounded-2xl border text-sm font-black uppercase"
                            style={{ borderColor: ROSA, color: VERDE }}
                          >
                            <CreditCard size={20} />
                            Débito
                          </button>
                          <button
                            type="button"
                            onClick={() => setCounterPaymentMethod("CREDIT")}
                            className="flex h-16 items-center justify-center gap-2 rounded-2xl text-sm font-black uppercase text-white"
                            style={{ background: VERDE }}
                          >
                            <CreditCard size={20} />
                            Crédito
                          </button>
                          <button
                            type="button"
                            onClick={() => setCounterPaymentMethod("PIX")}
                            className="flex h-16 items-center justify-center gap-2 rounded-2xl border text-sm font-black uppercase"
                            style={{ borderColor: VERDE, color: VERDE }}
                          >
                            <QrCode size={20} />
                            Pix
                          </button>
                        </div>
                      </>
                    )}
                    {counterPaymentMethod && (
                      <div className="mt-5 grid gap-4">
                        <div className="rounded-3xl p-5" style={{ background: `${ROSA}35`, border: `1px solid ${ROSA}` }}>
                          <p className="text-xl font-black uppercase" style={{ color: VERDE }}>
                            Confirmar pagamento
                          </p>
                          <p className="mt-4 text-[10px] font-black uppercase tracking-widest opacity-55">
                            Valor a pagar
                          </p>
                          <p className="text-4xl font-black" style={{ color: "#8A0030" }}>
                            {formatMoney(counterPaymentTotal)}
                          </p>
                          <p className="mt-3 text-sm font-bold leading-relaxed opacity-70">
                            Ao continuar, siga as instruções do terminal de pagamento.
                            O pedido será liberado somente após a aprovação.
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            const method = counterPaymentMethod;
                            setCounterPaymentMethod(null);
                            onConfirmCounterPayment?.(method);
                          }}
                          className="h-14 rounded-2xl text-sm font-black uppercase text-white"
                          style={{ background: VERDE }}
                        >
                          Iniciar pagamento
                        </button>
                        <button
                          type="button"
                          onClick={() => setCounterPaymentMethod(null)}
                          className="h-12 rounded-2xl border text-sm font-black uppercase"
                          style={{ borderColor: ROSA, color: VERDE }}
                        >
                          Voltar
                        </button>
                      </div>
                    )}
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>

            <AnimatePresence>
              {kioskKeyboardOpen && (
                <KioskVirtualKeyboard
                  target={kioskKeyboardTarget}
                  onType={typeKioskKey}
                  onBackspace={backspaceKioskKey}
                  onClear={clearKioskKey}
                  onClose={closeKioskKeyboard}
                />
              )}
            </AnimatePresence>
    </>
  );
}
