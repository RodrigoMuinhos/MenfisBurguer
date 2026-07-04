import { RefObject } from "react";
import { AnimatePresence, motion } from "motion/react";
import { AlertCircle, CalendarClock, CheckCircle2, Loader2 } from "lucide-react";
import { ROSA, VERDE } from "@/utils/theme";
import { CheckoutStep, maskCEP, maskPhone } from "./checkout";

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-2 text-[10px] font-black uppercase tracking-widest" style={{ color: VERDE, opacity: 0.55 }}>
      {children}
    </p>
  );
}

export function DeliveryFormSection({
  checkoutStep,
  kioskMode,
  savedBadge,
  delivery,
  showScheduleSelector,
  cepRef,
  customerNameRef,
  streetRef,
  numberRef,
  phoneRef,
  customerName,
  setCustomerName,
  cep,
  setCep,
  cepError,
  cepLoading,
  submitAttempted,
  invalidDeliveryFields,
  street,
  setStreet,
  number,
  setNumber,
  complement,
  setComplement,
  phone,
  setPhone,
  deliverySchedule,
  setDeliverySchedule,
  scheduledTime,
  setScheduledTime,
  scheduleTimes,
  inputStyle,
}: {
  checkoutStep: CheckoutStep;
  kioskMode: boolean;
  savedBadge: boolean;
  delivery: "retirada" | "delivery";
  showScheduleSelector: boolean;
  cepRef: RefObject<HTMLInputElement>;
  customerNameRef: RefObject<HTMLInputElement>;
  streetRef: RefObject<HTMLInputElement>;
  numberRef: RefObject<HTMLInputElement>;
  phoneRef: RefObject<HTMLInputElement>;
  customerName: string;
  setCustomerName: (value: string) => void;
  cep: string;
  setCep: (value: string) => void;
  cepError: boolean;
  cepLoading: boolean;
  submitAttempted: boolean;
  invalidDeliveryFields: { name: boolean; cep: boolean; street: boolean; number: boolean; phone: boolean };
  street: string;
  setStreet: (value: string) => void;
  number: string;
  setNumber: (value: string) => void;
  complement: string;
  setComplement: (value: string) => void;
  phone: string;
  setPhone: (value: string) => void;
  deliverySchedule: "opening" | "scheduled";
  setDeliverySchedule: (value: "opening" | "scheduled") => void;
  scheduledTime: string;
  setScheduledTime: (value: string) => void;
  scheduleTimes: string[];
  inputStyle: (err?: boolean) => React.CSSProperties;
}) {
  const scheduleCopy =
    delivery === "retirada"
      ? {
          label: "Horario de retirada",
          opening: "Retirar assim que abrir (18:30)",
          scheduled: "Agendar retirada",
          help: "Pedido agendado: sua solicitacao fica reservada e a retirada sera preparada no horario escolhido.",
        }
      : {
          label: "Horario de entrega",
          opening: "Entregar assim que abrir (18:30)",
          scheduled: "Agendar horario",
          help: "Pedido agendado: sua solicitacao fica reservada e entra na fila de preparo no horario escolhido.",
        };

  return (
    <>
              {/* ── Formulário delivery ── */}
              <AnimatePresence>
                {checkoutStep === "delivery" && !kioskMode && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden flex flex-col gap-4"
                  >
                    {/* Header do form */}
                    <div className="flex items-center justify-between">
                      <SectionLabel>{delivery === "retirada" ? "Dados da retirada" : "Dados de entrega"}</SectionLabel>
                      <AnimatePresence>
                        {savedBadge && (
                          <motion.span
                            initial={{ opacity: 0, y: -4 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="flex items-center gap-1 text-[9px] font-black uppercase tracking-wider px-2 py-1 rounded-full"
                            style={{ background: ROSA, color: VERDE }}
                          >
                            <CheckCircle2 size={9} strokeWidth={3} /> Dados salvos
                          </motion.span>
                        )}
                      </AnimatePresence>
                    </div>

                    <div>
                      <SectionLabel>Nome</SectionLabel>
                      <input
                        ref={customerNameRef}
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        placeholder="Seu nome"
                        autoComplete="name"
                        style={inputStyle(
                          submitAttempted && invalidDeliveryFields.name,
                        )}
                        aria-invalid={submitAttempted && invalidDeliveryFields.name}
                      />
                      {submitAttempted && invalidDeliveryFields.name && (
                        <p
                          className="mt-1 text-[10px] font-bold"
                          style={{ color: "#DC2626" }}
                        >
                          Informe seu nome para identificar o pedido.
                        </p>
                      )}
                    </div>
      
                    {delivery === "delivery" && (
                      <>
                        {/* CEP */}
                        <div>
                          <SectionLabel>CEP</SectionLabel>
                          <div className="relative">
                            <input
                              ref={cepRef}
                              value={cep}
                              onChange={(e) => setCep(maskCEP(e.target.value))}
                              placeholder="00000-000"
                              autoComplete="postal-code"
                              style={inputStyle(
                                cepError ||
                                  (submitAttempted && invalidDeliveryFields.cep),
                              )}
                              aria-invalid={
                                cepError ||
                                (submitAttempted && invalidDeliveryFields.cep)
                              }
                            />
                            {cepLoading && (
                              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                <Loader2
                                  size={16}
                                  strokeWidth={2}
                                  style={{
                                    color: VERDE,
                                    opacity: 0.4,
                                    animation: "spin 1s linear infinite",
                                  }}
                                />
                              </div>
                            )}
                            {!cepLoading && cep.replace(/\D/g, "").length === 8 && (
                              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                {cepError ? (
                                  <AlertCircle
                                    size={16}
                                    strokeWidth={2}
                                    style={{ color: "#DC2626" }}
                                  />
                                ) : (
                                  <CheckCircle2
                                    size={16}
                                    strokeWidth={2}
                                    style={{ color: "#16a34a" }}
                                  />
                                )}
                              </div>
                            )}
                          </div>
                          {cepError && (
                            <p
                              className="text-[10px] mt-1"
                              style={{ color: "#DC2626" }}
                            >
                              CEP não encontrado
                            </p>
                          )}
                          {!cepError &&
                            submitAttempted &&
                            invalidDeliveryFields.cep && (
                              <p
                                className="mt-1 text-[10px] font-bold"
                                style={{ color: "#DC2626" }}
                              >
                                Preencha um CEP válido com 8 números.
                              </p>
                            )}
                        </div>
      
                        {/* Endereço (preenchido pelo CEP) */}
                        <div>
                          <SectionLabel>Endereço</SectionLabel>
                          <input
                            ref={streetRef}
                            value={street}
                            onChange={(e) => setStreet(e.target.value)}
                            placeholder="Rua, bairro e cidade"
                            autoComplete="street-address"
                            style={inputStyle(
                              submitAttempted && invalidDeliveryFields.street,
                            )}
                            aria-invalid={
                              submitAttempted && invalidDeliveryFields.street
                            }
                          />
                          {submitAttempted && invalidDeliveryFields.street && (
                            <p
                              className="mt-1 text-[10px] font-bold"
                              style={{ color: "#DC2626" }}
                            >
                              Informe o endereço de entrega.
                            </p>
                          )}
                        </div>
      
                        {/* Número + Complemento */}
                        <div className="flex gap-3">
                          <div className="flex-1">
                            <SectionLabel>Número</SectionLabel>
                            <input
                              ref={numberRef}
                              value={number}
                              onChange={(e) => setNumber(e.target.value)}
                              placeholder="Ex: 42"
                              autoComplete="address-line2"
                              style={inputStyle(
                                submitAttempted && invalidDeliveryFields.number,
                              )}
                              aria-invalid={
                                submitAttempted && invalidDeliveryFields.number
                              }
                            />
                            {submitAttempted && invalidDeliveryFields.number && (
                              <p
                                className="mt-1 text-[10px] font-bold"
                                style={{ color: "#DC2626" }}
                              >
                                Informe o número.
                              </p>
                            )}
                          </div>
                          <div className="flex-1">
                            <SectionLabel>Complemento</SectionLabel>
                            <input
                              value={complement}
                              onChange={(e) => setComplement(e.target.value)}
                              placeholder="Apto, bloco..."
                              autoComplete="address-line3"
                              style={inputStyle()}
                            />
                          </div>
                        </div>
                      </>
                    )}

                    {delivery === "retirada" && (
                      <div
                        className="rounded-2xl p-4"
                        style={{
                          background: "#fff",
                          border: `1px solid ${VERDE}14`,
                          color: VERDE,
                        }}
                      >
                        <p className="text-xs font-black uppercase tracking-wide">
                          Endereco para retirada
                        </p>
                        <p className="mt-1 text-sm font-bold">
                          Rua Tiburcio Cavalcanti, 1952 - Meireles
                        </p>
                        <p className="mt-1 text-[11px] opacity-60">
                          Nao ha taxa de entrega para retirada.
                        </p>
                      </div>
                    )}

                    {showScheduleSelector && (
                      <ScheduleSelector
                        deliverySchedule={deliverySchedule}
                        setDeliverySchedule={setDeliverySchedule}
                        scheduledTime={scheduledTime}
                        setScheduledTime={setScheduledTime}
                        scheduleTimes={scheduleTimes}
                        copy={scheduleCopy}
                      />
                    )}
      
                    {/* WhatsApp */}
                    <div>
                      <SectionLabel>WhatsApp</SectionLabel>
                      <input
                        ref={phoneRef}
                        value={phone}
                        onChange={(e) => setPhone(maskPhone(e.target.value))}
                        placeholder="(00) 00000-0000"
                        autoComplete="tel"
                        style={inputStyle(
                          submitAttempted && invalidDeliveryFields.phone,
                        )}
                        aria-invalid={submitAttempted && invalidDeliveryFields.phone}
                      />
                      {submitAttempted && invalidDeliveryFields.phone && (
                        <p
                          className="mt-1 text-[10px] font-bold"
                          style={{ color: "#DC2626" }}
                        >
                          Informe um WhatsApp válido com DDD.
                        </p>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
      
    </>
  );
}

function ScheduleSelector({
  deliverySchedule,
  setDeliverySchedule,
  scheduledTime,
  setScheduledTime,
  scheduleTimes,
  copy,
}: {
  deliverySchedule: "opening" | "scheduled";
  setDeliverySchedule: (value: "opening" | "scheduled") => void;
  scheduledTime: string;
  setScheduledTime: (value: string) => void;
  scheduleTimes: string[];
  copy: { label: string; opening: string; scheduled: string; help: string };
}) {
  return (
    <div
      className="rounded-2xl p-4"
      style={{
        background: "#fff",
        border: `1.5px solid ${ROSA}`,
      }}
    >
      <div className="flex items-center gap-2">
        <CalendarClock size={17} strokeWidth={2.4} style={{ color: VERDE }} />
        <SectionLabel>{copy.label}</SectionLabel>
      </div>
      <div className="grid gap-2">
        <button
          type="button"
          onClick={() => setDeliverySchedule("opening")}
          className="rounded-2xl px-4 py-3 text-left text-sm font-black"
          style={{
            background: deliverySchedule === "opening" ? VERDE : "#fff",
            color: deliverySchedule === "opening" ? ROSA : VERDE,
            border: `2px solid ${deliverySchedule === "opening" ? VERDE : ROSA}`,
          }}
        >
          {copy.opening}
        </button>
        <button
          type="button"
          onClick={() => setDeliverySchedule("scheduled")}
          className="rounded-2xl px-4 py-3 text-left text-sm font-black"
          style={{
            background: deliverySchedule === "scheduled" ? VERDE : "#fff",
            color: deliverySchedule === "scheduled" ? ROSA : VERDE,
            border: `2px solid ${deliverySchedule === "scheduled" ? VERDE : ROSA}`,
          }}
        >
          {copy.scheduled}
        </button>
      </div>
      {deliverySchedule === "scheduled" && (
        <div className="mt-3 grid grid-cols-3 gap-2">
          {scheduleTimes.map((time) => {
            const active = scheduledTime === time;
            return (
              <button
                key={time}
                type="button"
                onClick={() => setScheduledTime(time)}
                className="h-11 rounded-xl text-sm font-black"
                style={{
                  background: active ? VERDE : `${ROSA}45`,
                  color: active ? ROSA : VERDE,
                  border: `1.5px solid ${active ? VERDE : `${VERDE}12`}`,
                }}
              >
                {time}
              </button>
            );
          })}
        </div>
      )}
      <p className="mt-3 text-[11px] font-bold leading-relaxed opacity-65">
        {copy.help}
      </p>
    </div>
  );
}
