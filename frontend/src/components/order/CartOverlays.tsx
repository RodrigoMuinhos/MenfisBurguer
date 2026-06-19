import { AnimatePresence, motion } from "motion/react";
import { CheckCircle2, Loader2, Printer, XCircle } from "lucide-react";
import { Order } from "@/types/order";
import { ROSA, VERDE } from "@/utils/theme";
import { KioskKeyboardTarget, PaymentMethod } from "./checkout";
import { KioskVirtualKeyboard } from "./KioskVirtualKeyboard";

export function CartOverlays({
  kioskSuccessOpen,
  paying,
  kioskMode,
  counterServiceMode = false,
  payment,
  paymentSlow,
  kioskKeyboardOpen,
  kioskKeyboardTarget,
  typeKioskKey,
  backspaceKioskKey,
  clearKioskKey,
  closeKioskKeyboard,
  counterPrintPromptOpen = false,
  kioskSuccessOrder = null,
  onConfirmCounterPrint,
  onSkipCounterPrint,
}: {
  kioskSuccessOpen: boolean;
  paying: boolean;
  kioskMode: boolean;
  counterServiceMode?: boolean;
  payment: PaymentMethod;
  paymentSlow: boolean;
  kioskKeyboardOpen: boolean;
  kioskKeyboardTarget: KioskKeyboardTarget;
  typeKioskKey: (key: string) => void;
  backspaceKioskKey: () => void;
  clearKioskKey: () => void;
  closeKioskKeyboard: () => void;
  counterPrintPromptOpen?: boolean;
  kioskSuccessOrder?: Order | null;
  onConfirmCounterPrint?: () => void;
  onSkipCounterPrint?: () => void;
}) {
  const successTotal = kioskSuccessOrder
    ? kioskSuccessOrder.items.reduce((sum, item) => sum + item.price * item.qty, 0)
    : 0;
  const formatMoney = (value: number) =>
    value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

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
                    {counterServiceMode && kioskSuccessOrder ? (
                      <>
                        <div
                          className="mx-auto mt-5 grid max-w-md grid-cols-3 gap-3 rounded-3xl p-4 text-left"
                          style={{ background: "#fff", border: `1px solid ${ROSA}` }}
                        >
                          <div>
                            <p className="text-[10px] font-black uppercase opacity-50">Pedido</p>
                            <p className="text-3xl font-black">#{kioskSuccessOrder.number}</p>
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
                          Aguarde. Quando estiver pronto, chamaremos você pelo número do pedido.
                        </p>
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
                    className="w-full max-w-sm rounded-[28px] p-6 text-center"
                    style={{
                      background: "#fff",
                      border: `1px solid ${ROSA}`,
                      boxShadow: "0 24px 70px rgba(101,0,31,0.16)",
                      color: VERDE,
                    }}
                  >
                    <div
                      className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full"
                      style={{ background: ROSA }}
                    >
                      <Loader2
                        size={30}
                        strokeWidth={2.8}
                        style={{ animation: "spin 1s linear infinite" }}
                      />
                    </div>
                    <p className="text-sm font-black uppercase tracking-wide">
                      {counterServiceMode
                        ? "Registrando pedido do balcão"
                        : payment === "whatsapp"
                          ? "Enviando ao atendimento"
                          : payment === "pagar_na_entrega"
                            ? "Enviando pedido"
                            : kioskMode
                              ? "Enviando pedido para a equipe"
                              : "Conectando ao pagamento"}
                    </p>
                    <p className="mt-2 text-xs leading-relaxed opacity-65">
                      {counterServiceMode
                        ? "Estamos criando o pedido e preparando a impressão da via."
                        : payment === "whatsapp"
                          ? "Estamos criando o pedido e abrindo o WhatsApp para o atendimento."
                          : payment === "pagar_na_entrega"
                            ? "Estamos criando o pedido para a cozinha."
                            : kioskMode
                              ? "Aguarde enquanto registramos o pedido para confirmação do atendente."
                              : "Estamos registrando seu pedido e abrindo o Mercado Pago. Se demorar, aguarde mais alguns segundos."}
                    </p>
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
              {counterPrintPromptOpen && (
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
                      <Printer size={26} />
                    </div>
                    <h2 className="text-xl font-black uppercase tracking-wide">
                      Imprimir via do pedido?
                    </h2>
                    <p className="mx-auto mt-2 max-w-sm text-sm font-semibold leading-relaxed opacity-70">
                      Se ninguém responder em 10 segundos, o pedido segue sem imprimir.
                    </p>
                    <div className="mt-6 grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={onSkipCounterPrint}
                        className="flex h-14 items-center justify-center gap-2 rounded-2xl border text-sm font-black uppercase"
                        style={{ borderColor: ROSA, color: VERDE }}
                      >
                        <XCircle size={18} />
                        Não imprimir
                      </button>
                      <button
                        type="button"
                        onClick={onConfirmCounterPrint}
                        className="flex h-14 items-center justify-center gap-2 rounded-2xl text-sm font-black uppercase text-white"
                        style={{ background: VERDE }}
                      >
                        <Printer size={18} />
                        Imprimir
                      </button>
                    </div>
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
