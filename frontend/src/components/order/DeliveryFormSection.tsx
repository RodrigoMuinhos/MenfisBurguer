import { RefObject } from "react";
import { AnimatePresence, motion } from "motion/react";
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
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
  cepRef,
  streetRef,
  numberRef,
  phoneRef,
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
  inputStyle,
}: {
  checkoutStep: CheckoutStep;
  kioskMode: boolean;
  savedBadge: boolean;
  delivery: "retirada" | "delivery";
  cepRef: RefObject<HTMLInputElement>;
  streetRef: RefObject<HTMLInputElement>;
  numberRef: RefObject<HTMLInputElement>;
  phoneRef: RefObject<HTMLInputElement>;
  cep: string;
  setCep: (value: string) => void;
  cepError: boolean;
  cepLoading: boolean;
  submitAttempted: boolean;
  invalidDeliveryFields: { cep: boolean; street: boolean; number: boolean; phone: boolean };
  street: string;
  setStreet: (value: string) => void;
  number: string;
  setNumber: (value: string) => void;
  complement: string;
  setComplement: (value: string) => void;
  phone: string;
  setPhone: (value: string) => void;
  inputStyle: (err?: boolean) => React.CSSProperties;
}) {
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
                      <SectionLabel>Dados de entrega</SectionLabel>
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
                              style={inputStyle()}
                            />
                          </div>
                        </div>
                      </>
                    )}
      
                    {/* WhatsApp */}
                    <div>
                      <SectionLabel>WhatsApp</SectionLabel>
                      <input
                        ref={phoneRef}
                        value={phone}
                        onChange={(e) => setPhone(maskPhone(e.target.value))}
                        placeholder="(00) 00000-0000"
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
