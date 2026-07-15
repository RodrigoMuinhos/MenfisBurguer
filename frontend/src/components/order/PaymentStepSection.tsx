import { RefObject, useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  CreditCard,
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

function PaymentHint({
  title,
  copy,
  total,
}: {
  title: string;
  copy: string;
  total: number;
}) {
  return (
    <div
      className="rounded-2xl p-4"
      style={{ background: "#fff", border: `1.5px solid ${ROSA}` }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-black uppercase tracking-wide">
            {title}
          </p>
          <p className="mt-1 text-xs font-bold leading-relaxed opacity-65">
            {copy}
          </p>
        </div>
        <p
          className="shrink-0 text-right"
          style={{
            color: VERDE,
            fontFamily: "'Bebas Neue','Arial Black',sans-serif",
            fontSize: "1.55rem",
            lineHeight: 1,
          }}
        >
          {fmt(total)}
        </p>
      </div>
    </div>
  );
}

export function PaymentStepSection({
  checkoutStep,
  kioskMode,
  counterServiceMode,
  payment,
  setPayment,
  setCheckoutStep,
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
  counterServiceMode: boolean;
  payment: PaymentMethod;
  setPayment: (payment: PaymentMethod) => void;
  setCheckoutStep: (step: CheckoutStep) => void;
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
  const [pixSeconds, setPixSeconds] = useState(40);

  useEffect(() => {
    if (!kioskMode || checkoutStep !== "payment" || !["pix", "pix_qrcode"].includes(payment)) return;
    if (pixSeconds <= 0) {
      setCheckoutStep("customer");
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    const timer = window.setTimeout(() => setPixSeconds((seconds) => seconds - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [checkoutStep, kioskMode, payment, pixSeconds, setCheckoutStep]);

  const choosePayment = (id: Exclude<PaymentMethod, "">) => {
    setPayment(id);
    if (id === "pix" || id === "pix_qrcode") setPixSeconds(40);
    window.setTimeout(() => {
      document
        .querySelector("[data-checkout-submit]")
        ?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 120);
  };

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
                        {counterServiceMode
                          ? "Pagamento no balcão"
                          : kioskMode
                            ? "Pagamento no atendimento"
                            : "Como vai pagar?"}
                      </SectionLabel>
                      <div
                        className={`mb-3 rounded-2xl p-3 ${kioskMode ? "" : "text-center"}`}
                        style={{
                          background: `${VERDE}08`,
                          border: `1px solid ${VERDE}14`,
                        }}
                      >
                        <div
                          className={`flex items-start gap-2 ${
                            kioskMode || counterServiceMode ? "" : "justify-center"
                          }`}
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
                              {counterServiceMode
                                ? "Pagamento presencial no balcão"
                                : kioskMode
                                ? "Escolha a forma de pagamento"
                                  : payment === "mercadopago"
                                  ? "Mercado Pago"
                                  : payment === "pix"
                                  ? "QR Code Pix Menfi's"
                                  : payment === "cartao"
                                    ? "Cartão online"
                                    : payment === "pagar_na_entrega"
                                      ? "Cartão na entrega"
                                        : payment === "presencial"
                                          ? "Pagar no balcão"
                                          : payment === "whatsapp"
                                            ? "Pagamento pelo WhatsApp"
                                            : "Pagamento seguro"}
                            </p>
                            <p
                              className="text-[11px] leading-relaxed mt-1"
                              style={{ color: VERDE, opacity: 0.62 }}
                            >
                              {counterServiceMode
                                ? "A via do pedido será impressa e o pedido já entra para a cozinha. O cliente paga pessoalmente no balcão."
                                : kioskMode
                                ? "Se for PIX, confira os dados abaixo. Se for atendente, aguarde a equipe no balcão."
                                : payment === "pagar_na_entrega"
                                  ? "O pedido será preparado e o pagamento será feito na maquininha da entrega."
                                   : payment === "presencial"
                                     ? "O pedido será enviado para a loja e o pagamento será feito no balcão."
                                      : payment === "whatsapp"
                                        ? "A equipe chama no WhatsApp para combinar o pagamento antes de liberar a cozinha."
                                    : payment === "mercadopago"
                                      ? "Você será direcionado para a página segura do Mercado Pago."
                                        : payment === "pix"
                                        ? "Vamos mostrar o QR Code Pix direto da Menfi's para pagamento pelo app do banco."
                                        : "Você finaliza pelo Mercado Pago. Assim que aprovar, o pedido entra na cozinha."}
                            </p>
                          </div>
                        </div>
                      </div>
                      {counterServiceMode && (
                        <div
                          className="grid gap-3 rounded-2xl p-5 text-center"
                          style={{
                            background: "#fff",
                            border: `2px solid ${VERDE}`,
                            color: VERDE,
                          }}
                        >
                          <div
                            className="mx-auto flex h-14 w-14 items-center justify-center rounded-full"
                            style={{ background: ROSA }}
                          >
                            <Store size={26} strokeWidth={2.5} />
                          </div>
                          <div>
                            <p className="text-lg font-black uppercase tracking-wide">
                              Pagar no balcão
                            </p>
                            <p className="mt-1 text-xs font-bold opacity-65">
                              Único método disponível para KIOSK-MOB.
                            </p>
                          </div>
                        </div>
                      )}
                      {!kioskMode && !counterServiceMode && (
                        <div className="grid gap-3">
                          <SectionLabel>Escolha como quer pagar</SectionLabel>
                          <div className="grid gap-3 sm:grid-cols-2">
                            {(
                              [
                                {
                                  id: "whatsapp" as PaymentMethod,
                                  label: "Pagar WhatsApp",
                                  copy: "Atendente envia a forma de pagamento",
                                  Icon: MessageCircle,
                                  show: true,
                                },
                                {
                                  id: "mercadopago" as PaymentMethod,
                                  label: "Mercado Pago",
                                  copy: "Cartão ou Pix na página segura",
                                  Icon: CreditCard,
                                  show: true,
                                },
                              ] as {
                                id: PaymentMethod;
                                label: string;
                                copy: string;
                                Icon: React.ElementType;
                                show: boolean;
                              }[]
                            )
                              .filter((option) => option.show)
                              .map(({ id, label, copy, Icon }) => {
                              const active = payment === id;
                              return (
                                <button
                                  key={id}
                                  onClick={() => choosePayment(id as Exclude<PaymentMethod, "">)}
                                  className="flex min-h-[104px] w-full flex-col items-center justify-center gap-2 rounded-2xl px-4 py-5 text-sm font-black uppercase tracking-wider"
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
                          {payment === "mercadopago" && (
                            <PaymentHint
                              title="Mercado Pago"
                              copy="Ao finalizar, você será direcionado para a página segura do Mercado Pago."
                              total={total}
                            />
                          )}
                          {payment === "whatsapp" && (
                            <PaymentHint
                              title="Pagar pelo WhatsApp"
                              copy="Ao finalizar, abrimos o WhatsApp com o resumo do pedido. A equipe confirma a forma de pagamento por lá e libera a cozinha depois da confirmação."
                              total={total}
                            />
                          )}
                          {payment === "pix" && (
                            <PaymentHint
                              title="QR Code Pix Menfi's"
                              copy="Ao finalizar, mostramos o QR Code Pix direto da Menfi's. Depois do pagamento, envie o comprovante para validação."
                              total={total}
                            />
                          )}
                          {payment === "pagar_na_entrega" && (
                            <PaymentHint
                              title="Cartão na entrega"
                              copy="Pagamento na entrega selecionado. Tenha o cartão disponível para o entregador."
                              total={total}
                            />
                          )}
                          {payment === "presencial" && (
                            <PaymentHint
                              title="Pagar no balcão"
                              copy="Use esta opção para retirada/local. O pedido segue para a loja e o pagamento fica marcado para o balcão."
                              total={total}
                            />
                          )}
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
                                  id: "presencial" as PaymentMethod,
                                  label: "Atendente",
                                  copy: "Pagar no balcão",
                                  Icon: Store,
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
                                  onClick={() => choosePayment(id as Exclude<PaymentMethod, "">)}
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
                                {kioskMode && (
                                  <div className="mb-3 rounded-xl px-4 py-3 text-center" style={{ background: ROSA }}>
                                    <p className="text-[10px] font-black uppercase tracking-widest">Tempo para escanear</p>
                                    <p className="mt-1 text-2xl font-black">00:{String(pixSeconds).padStart(2, "0")}</p>
                                    <p className="mt-1 text-[10px] font-bold opacity-65">Depois, você informará o nome do cliente.</p>
                                  </div>
                                )}
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
                            <Store
                                size={38}
                                strokeWidth={2.5}
                                className="mx-auto"
                              />
                              <p className="mt-3 text-xl font-black uppercase tracking-wide">
                                Aguarde o atendente
                              </p>
                              <p className="mt-2 text-sm font-bold opacity-70">
                                A equipe vai concluir o pagamento no balcão. Ao finalizar,
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
