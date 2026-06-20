import { RefObject, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  CreditCard,
  Landmark,
  LockKeyhole,
  MessageCircle,
  QrCode,
  Store,
  X,
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
  paying,
  onFinalizeWithPayment,
}: {
  checkoutStep: CheckoutStep;
  kioskMode: boolean;
  counterServiceMode: boolean;
  payment: PaymentMethod;
  setPayment: (payment: PaymentMethod) => void;
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
  paying: boolean;
  onFinalizeWithPayment: (payment: PaymentMethod) => void | Promise<void>;
}) {
  const [mercadoPagoChoiceOpen, setMercadoPagoChoiceOpen] = useState(false);
  const chooseMercadoPagoPayment = (nextPayment: PaymentMethod) => {
    setPayment(nextPayment);
    setMercadoPagoChoiceOpen(false);
    void onFinalizeWithPayment(nextPayment);
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
                                  ? "Cartao no Mercado Pago"
                                  : payment === "pix_qrcode" || payment === "pix"
                                  ? "Pix Mercado Pago"
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
                                ? "Se for PIX, confira os dados abaixo. Se for cartão, aguarde o atendente levar a maquininha."
                                : payment === "pagar_na_entrega"
                                  ? "O pedido será preparado e o pagamento será feito na maquininha da entrega."
                                   : payment === "presencial"
                                     ? "O pedido será enviado para a loja e o pagamento será feito no balcão."
                                      : payment === "whatsapp"
                                        ? "A equipe chama no WhatsApp para combinar o pagamento antes de liberar a cozinha."
                                    : payment === "mercadopago"
                                      ? "Você será direcionado para pagar no cartão de crédito ou débito pela página segura do Mercado Pago."
                                      : payment === "pix_qrcode" || payment === "pix"
                                        ? "Vamos gerar um Pix do Mercado Pago para copiar ou escanear. Depois do pagamento, retorne para acompanhar a confirmação."
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
                                  copy: "Pagamento processado automaticamente",
                                  Icon: CreditCard,
                                  show: true,
                                },
                                {
                                  id: "pix" as PaymentMethod,
                                  label: "PIX Direto Menfi's",
                                  copy: "Pague direto para nossa chave Pix",
                                  Icon: Landmark,
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
                              const active =
                                id === "mercadopago"
                                  ? payment === "mercadopago" || payment === "pix_qrcode"
                                  : payment === id;
                              return (
                                <button
                                  key={id}
                                  onClick={() =>
                                    id === "mercadopago"
                                      ? setMercadoPagoChoiceOpen(true)
                                      : setPayment(id)
                                  }
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
                          {payment === "pix_qrcode" && (
                            <PaymentHint
                              title="Pix Mercado Pago"
                              copy="Ao finalizar, geramos um Pix do Mercado Pago. A tela de acompanhamento mostra o QR Code e o copia e cola. Depois de pagar, é necessário retornar para a tela do pedido para acompanhar a confirmação."
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
                              title="PIX Direto Menfi's"
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
              <AnimatePresence>
                {mercadoPagoChoiceOpen && (
                  <motion.div
                    className="fixed inset-0 z-[120] flex items-end justify-center bg-[rgba(101,0,31,0.45)] p-3 sm:items-center"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={() => setMercadoPagoChoiceOpen(false)}
                  >
                    <motion.section
                      className="w-full max-w-md rounded-[26px] bg-white p-5 shadow-[0_24px_70px_rgba(101,0,31,0.28)]"
                      initial={{ y: 24, scale: 0.98 }}
                      animate={{ y: 0, scale: 1 }}
                      exit={{ y: 18, scale: 0.98 }}
                      transition={{ duration: 0.18, ease: "easeOut" }}
                      style={{ color: VERDE }}
                      onClick={(event) => event.stopPropagation()}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-widest opacity-55">
                            Mercado Pago
                          </p>
                          <h3 className="mt-1 text-xl font-black uppercase leading-tight">
                            Pagar com Mercado Pago
                          </h3>
                        </div>
                        <button
                          type="button"
                          onClick={() => setMercadoPagoChoiceOpen(false)}
                          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full"
                          style={{ background: `${ROSA}66`, color: VERDE }}
                          aria-label="Voltar"
                        >
                          <X size={19} strokeWidth={2.7} />
                        </button>
                      </div>

                      <div
                        className="mt-4 flex items-center justify-between rounded-2xl p-4"
                        style={{ background: `${ROSA}45` }}
                      >
                        <span className="text-xs font-black uppercase opacity-65">
                          Total do pedido
                        </span>
                        <span
                          style={{
                            fontFamily: "'Bebas Neue','Arial Black',sans-serif",
                            fontSize: "2rem",
                            lineHeight: 1,
                          }}
                        >
                          {fmt(total)}
                        </span>
                      </div>

                      <div className="mt-4 grid gap-3">
                        <button
                          type="button"
                          onClick={() => chooseMercadoPagoPayment("mercadopago")}
                          disabled={paying}
                          className="flex min-h-[86px] items-center gap-4 rounded-2xl p-4 text-left"
                          style={{ border: `2px solid ${ROSA}`, color: VERDE }}
                        >
                          <span
                            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl"
                            style={{ background: ROSA }}
                          >
                            <CreditCard size={23} strokeWidth={2.5} />
                          </span>
                          <span>
                            <span className="block text-sm font-black uppercase">
                              Credito ou debito
                            </span>
                            <span className="mt-1 block text-xs font-bold opacity-65">
                              Pague com cartao na pagina segura do Mercado Pago.
                            </span>
                          </span>
                        </button>

                        <button
                          type="button"
                          onClick={() => chooseMercadoPagoPayment("pix_qrcode")}
                          disabled={paying}
                          className="flex min-h-[86px] items-center gap-4 rounded-2xl p-4 text-left"
                          style={{ border: `2px solid ${ROSA}`, color: VERDE }}
                        >
                          <span
                            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl"
                            style={{ background: ROSA }}
                          >
                            <QrCode size={23} strokeWidth={2.5} />
                          </span>
                          <span>
                            <span className="block text-sm font-black uppercase">
                              Pix Mercado Pago
                            </span>
                            <span className="mt-1 block text-xs font-bold opacity-65">
                              Gere o Pix para copiar ou escanear.
                            </span>
                          </span>
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => setMercadoPagoChoiceOpen(false)}
                        className="mt-4 flex h-12 w-full items-center justify-center rounded-2xl text-xs font-black uppercase tracking-wider"
                        style={{ border: `1.5px solid ${VERDE}18`, color: VERDE }}
                      >
                        Voltar
                      </button>
                    </motion.section>
                  </motion.div>
                )}
              </AnimatePresence>
      
    </>
  );
}
