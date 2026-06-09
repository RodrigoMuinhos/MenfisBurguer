import { RefObject } from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  CreditCard,
  HandCoins,
  LockKeyhole,
  MessageCircle,
  QrCode,
  Store,
} from "lucide-react";
import { ROSA, VERDE } from "@/utils/theme";
import {
  CheckoutStep,
  KIOSK_PIX_CODE,
  KioskKeyboardTarget,
  PaymentMethod,
  SUPPORT_WHATSAPP_URL,
  fmt,
  maskPhone,
} from "./checkout";

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p
      className="mb-2 text-[10px] font-black uppercase tracking-widest"
      style={{ color: VERDE, opacity: 0.55 }}
    >
      {children}
    </p>
  );
}

export function PaymentStepSection({
  checkoutStep,
  kioskMode,
  payment,
  setPayment,
  payOnDeliveryEnabled,
  customerNameRef,
  phoneRef,
  customerName,
  setCustomerName,
  phone,
  setPhone,
  setKioskKeyboardTarget,
  submitAttempted,
  deliveryValid,
  inputStyle,
  total,
}: {
  checkoutStep: CheckoutStep;
  kioskMode: boolean;
  payment: PaymentMethod;
  setPayment: (payment: PaymentMethod) => void;
  payOnDeliveryEnabled: boolean;
  customerNameRef: RefObject<HTMLInputElement>;
  phoneRef: RefObject<HTMLInputElement>;
  customerName: string;
  setCustomerName: (value: string) => void;
  phone: string;
  setPhone: (value: string) => void;
  setKioskKeyboardTarget: (target: KioskKeyboardTarget) => void;
  submitAttempted: boolean;
  deliveryValid: boolean;
  inputStyle: (err?: boolean) => React.CSSProperties;
  total: number;
}) {
  const supportText = encodeURIComponent(
    `Olá, preciso de ajuda para finalizar meu pedido Menfi's de ${fmt(total)}.`,
  );

  return (
    <>
              <AnimatePresence>
                {checkoutStep === "customer" && kioskMode && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="grid gap-3">
                      <SectionLabel>Dados para atendimento</SectionLabel>
                      <div
                        className="rounded-2xl p-4"
                        style={{
                          background: "#fff",
                          border: `1.5px solid ${ROSA}`,
                        }}
                      >
                        <SectionLabel>Nome do cliente</SectionLabel>
                        <input
                          ref={customerNameRef}
                          value={customerName}
                          onFocus={() => setKioskKeyboardTarget("name")}
                          onClick={() => setKioskKeyboardTarget("name")}
                          onChange={(event) => setCustomerName(event.target.value)}
                          placeholder="Digite o nome"
                          autoComplete="name"
                          inputMode="none"
                          style={inputStyle(
                            submitAttempted && customerName.trim().length < 2,
                          )}
                        />
                        <div className="mt-3">
                          <SectionLabel>Telefone / WhatsApp</SectionLabel>
                          <input
                            ref={phoneRef}
                            value={phone}
                            onFocus={() => setKioskKeyboardTarget("phone")}
                            onClick={() => setKioskKeyboardTarget("phone")}
                            onChange={(event) =>
                              setPhone(maskPhone(event.target.value))
                            }
                            placeholder="(00) 00000-0000"
                            inputMode="none"
                            autoComplete="tel"
                            style={inputStyle(
                              submitAttempted &&
                                phone.replace(/\D/g, "").length < 10,
                            )}
                          />
                        </div>
                        {submitAttempted && !deliveryValid && (
                          <p
                            className="mt-2 text-[11px] font-bold"
                            style={{ color: "#B91C1C" }}
                          >
                            Informe o nome e um telefone válido para continuar.
                          </p>
                        )}
                      </div>
                      <div
                        className="rounded-2xl px-5 py-8 text-center"
                        style={{
                          background: ROSA,
                          color: VERDE,
                          border: `2px solid ${VERDE}`,
                        }}
                      >
                        <Store size={34} strokeWidth={2.5} className="mx-auto" />
                        <p className="mt-3 text-xl font-black uppercase tracking-wide">
                          Retirada no balcão
                        </p>
                        <p className="mt-2 text-sm font-bold opacity-70">
                          Informe seu nome e telefone para a equipe localizar o
                          pedido. Depois você revisa tudo e segue para o
                          pagamento.
                        </p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* ── Pagamento ── */}
              <AnimatePresence>
                {checkoutStep === "payment" && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className={kioskMode ? "" : "mx-auto max-w-3xl"}>
                      <SectionLabel>
                        {kioskMode ? "Pagamento no atendimento" : "Como vai pagar?"}
                      </SectionLabel>
                      <div
                        className={`mb-3 rounded-2xl p-3 ${kioskMode ? "" : "text-center"}`}
                        style={{
                          background: `${VERDE}08`,
                          border: `1px solid ${VERDE}14`,
                        }}
                      >
                        <div
                          className={`flex items-start gap-2 ${kioskMode ? "" : "justify-center"}`}
                        >
                          <LockKeyhole
                            size={16}
                            strokeWidth={2.2}
                            style={{ color: VERDE }}
                          />
                          <div>
                            <p
                              className="text-xs font-black uppercase tracking-wide"
                              style={{ color: VERDE }}
                            >
                              {kioskMode
                                ? "Escolha a forma de pagamento"
                                : payment === "pagar_na_entrega"
                                  ? "Pagamento no recebimento"
                                  : payment === "whatsapp"
                                    ? "Pagamento pelo atendimento"
                                  : "Pagamento seguro"}
                            </p>
                            <p
                              className="text-[11px] leading-relaxed mt-1"
                              style={{ color: VERDE, opacity: 0.62 }}
                            >
                              {kioskMode
                                ? "Se for PIX, confira os dados abaixo. Se for cartão, aguarde o atendente levar a maquininha."
                                : payment === "pagar_na_entrega"
                                  ? "Seu pedido será preparado e você pagará quando receber."
                                  : payment === "whatsapp"
                                    ? "A equipe chamará no WhatsApp para receber e liberar seu pedido para a cozinha."
                                  : "Você finaliza pelo Mercado Pago e acompanha a confirmação do pedido."}
                            </p>
                          </div>
                        </div>
                      </div>
                      {!kioskMode && (
                        <div className="grid gap-3">
                          <div
                            className={`grid gap-3 ${
                              payOnDeliveryEnabled
                                ? "md:grid-cols-4"
                                : "md:grid-cols-3"
                            }`}
                          >
                            {(
                              [
                                {
                                  id: "pix",
                                  label: "Mercado Pago Pix",
                                  copy: "Pagar online agora",
                                  Icon: QrCode,
                                },
                                {
                                  id: "cartao",
                                  label: "Mercado Pago Cartão",
                                  copy: "Crédito ou débito online",
                                  Icon: CreditCard,
                                },
                                {
                                  id: "whatsapp" as PaymentMethod,
                                  label: "Pagar por WhatsApp",
                                  copy: "Atendente combina e libera",
                                  Icon: MessageCircle,
                                },
                                ...(payOnDeliveryEnabled
                                  ? [
                                      {
                                        id: "pagar_na_entrega" as PaymentMethod,
                                        label: "Pagar na entrega",
                                        copy: "Pague ao receber",
                                        Icon: HandCoins,
                                      },
                                    ]
                                  : []),
                              ] as {
                                id: PaymentMethod;
                                label: string;
                                copy: string;
                                Icon: React.ElementType;
                              }[]
                            ).map(({ id, label, copy, Icon }) => {
                              const active = payment === id;
                              return (
                                <button
                                  key={id}
                                  onClick={() => setPayment(id)}
                                  className="flex min-h-[104px] flex-col items-center justify-center gap-2 rounded-2xl px-4 py-5 text-sm font-black uppercase tracking-wider"
                                  style={{
                                    background: active ? VERDE : "#fff",
                                    color: active ? ROSA : VERDE,
                                    border: `2px solid ${active ? VERDE : ROSA}`,
                                    cursor: "pointer",
                                    transition:
                                      "background 0.2s, color 0.2s, border-color 0.2s",
                                  }}
                                >
                                  <Icon size={24} strokeWidth={2.4} />
                                  {label}
                                  <span
                                    className="text-[11px] normal-case tracking-normal font-bold"
                                    style={{ opacity: 0.62 }}
                                  >
                                    {copy}
                                  </span>
                                </button>
                              );
                            })}
                          </div>
                          <a
                            href={`${SUPPORT_WHATSAPP_URL}?text=${supportText}`}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex min-h-[56px] items-center justify-center gap-2 rounded-2xl px-4 py-3 text-xs font-black uppercase tracking-wider"
                            style={{
                              background: VERDE,
                              color: ROSA,
                              border: `1.5px solid ${VERDE}`,
                            }}
                          >
                            <MessageCircle size={18} strokeWidth={2.4} />
                            Entrar em contato por WhatsApp
                          </a>
                        </div>
                      )}
                      {kioskMode && (
                        <div className="grid gap-3">
                          <div className="grid grid-cols-2 gap-2">
                            {(
                              [
                                {
                                  id: "pix" as PaymentMethod,
                                  label: "Pix",
                                  copy: "QR Code ou copia e cola",
                                  Icon: QrCode,
                                },
                                {
                                  id: "cartao" as PaymentMethod,
                                  label: "Cartão",
                                  copy: "Maquininha com atendente",
                                  Icon: CreditCard,
                                },
                              ] as {
                                id: PaymentMethod;
                                label: string;
                                copy: string;
                                Icon: React.ElementType;
                              }[]
                            ).map(({ id, label, copy, Icon }) => {
                              const active = payment === id;
                              return (
                                <button
                                  key={id}
                                  onClick={() => setPayment(id)}
                                  className="flex min-h-[104px] flex-col items-center justify-center gap-2 rounded-2xl px-3 py-4 text-xs font-black uppercase tracking-wider"
                                  style={{
                                    background: active ? VERDE : "#fff",
                                    color: active ? ROSA : VERDE,
                                    border: `2px solid ${active ? VERDE : ROSA}`,
                                    cursor: "pointer",
                                  }}
                                >
                                  <Icon size={24} strokeWidth={2.6} />
                                  {label}
                                  <span
                                    className="text-[10px] normal-case tracking-normal font-bold"
                                    style={{ opacity: 0.62 }}
                                  >
                                    {copy}
                                  </span>
                                </button>
                              );
                            })}
                          </div>
      
                          {payment === "pix" ? (
                            <div
                              className="grid gap-4 rounded-2xl p-4 md:grid-cols-[240px_1fr]"
                              style={{
                                background: "#fff",
                                border: `2px solid ${VERDE}`,
                                color: VERDE,
                              }}
                            >
                              <div
                                className="rounded-2xl bg-white p-3"
                                style={{ border: `1.5px solid ${ROSA}` }}
                              >
                                <img
                                  src="/pix-menfis.png"
                                  alt="QR Code Pix Menfi's Burger"
                                  className="h-auto w-full"
                                />
                              </div>
                              <div className="min-w-0">
                                <p className="text-sm font-black uppercase tracking-wide">
                                  Pix Menfi's Burger
                                </p>
                                <p className="mt-1 text-xs font-bold opacity-65">
                                  Escaneie o QR Code ou use o copia e cola. Ao
                                  finalizar, seu pedido será enviado para a cozinha.
                                </p>
                                <div
                                  className="mt-3 rounded-xl p-3"
                                  style={{
                                    background: "#fff",
                                    border: `1px solid ${ROSA}`,
                                  }}
                                >
                                  <p className="text-[11px] font-black uppercase tracking-wide">
                                    Como pagar no Pix
                                  </p>
                                  <ol className="mt-2 list-decimal space-y-1 pl-4 text-[11px] font-bold leading-relaxed opacity-75">
                                    <li>Abra o app do seu banco.</li>
                                    <li>Escolha Pix e escaneie o QR Code.</li>
                                    <li>Confira ou insira o valor {fmt(total)}.</li>
                                    <li>Finalize o pagamento no app.</li>
                                    <li>Depois toque em enviar pedido para a cozinha.</li>
                                  </ol>
                                </div>
                                <div
                                  className="mt-3 rounded-xl p-3 text-[11px] font-bold leading-relaxed"
                                  style={{
                                    background: `${ROSA}55`,
                                    overflowWrap: "anywhere",
                                  }}
                                >
                                  {KIOSK_PIX_CODE}
                                </div>
                                <p className="mt-3 text-[11px] font-black uppercase tracking-wide opacity-70">
                                  Beneficiário: Rodrigo Araujo Muinhos
                                </p>
                                <p className="mt-1 text-[11px] font-bold opacity-60">
                                  Depois de pagar, toque em finalizar pedido.
                                </p>
                              </div>
                            </div>
                          ) : (
                            <div
                              className="rounded-2xl px-5 py-8 text-center"
                              style={{
                                background: ROSA,
                                color: VERDE,
                                border: `2px solid ${VERDE}`,
                              }}
                            >
                              <CreditCard
                                size={38}
                                strokeWidth={2.5}
                                className="mx-auto"
                              />
                              <p className="mt-3 text-xl font-black uppercase tracking-wide">
                                Aguarde o atendente
                              </p>
                              <p className="mt-2 text-sm font-bold opacity-70">
                                O pagamento será feito na maquininha. Ao finalizar,
                                seu pedido será enviado direto para a cozinha.
                              </p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
      
    </>
  );
}
