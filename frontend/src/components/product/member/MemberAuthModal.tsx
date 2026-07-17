import { motion } from "motion/react";
import type { Dispatch, SetStateAction } from "react";
import { Gift, KeyRound, Loader2, X } from "lucide-react";
import { ROSA, VERDE } from "@/utils/theme";
import { ProfileInput } from "./MemberUi";
import { SUPPORT_WHATSAPP_URL } from "@/components/order/checkout";
type Setter = (value: string) => void;

export function MemberAuthModal(props: { loginOpen: boolean; loginRequired: boolean; canCloseLogin: boolean; memberAuthMode: "register" | "login"; setMemberAuthMode: (value: "register" | "login") => void; registerStep: 1 | 2; setRegisterStep: Dispatch<SetStateAction<1 | 2>>; termsAccepted: boolean; setTermsAccepted: Dispatch<SetStateAction<boolean>>; recoveryOpen: boolean; setRecoveryOpen: Dispatch<SetStateAction<boolean>>; recoveryLogin: string; setRecoveryLogin: Setter; recoveryCode: string; setRecoveryCode: Setter; recoveryPassword: string; setRecoveryPassword: Setter; recoveryPasswordConfirm: string; setRecoveryPasswordConfirm: Setter; recoverySentMessage: string; setRecoverySentMessage: Setter; memberName: string; setMemberName: Setter; memberEmail: string; setMemberEmail: Setter; memberCpf: string; setMemberCpf: Setter; memberPhone: string; setMemberPhone: Setter; memberPassword: string; setMemberPassword: Setter; memberPasswordConfirm: string; setMemberPasswordConfirm: Setter; memberLogin: string; setMemberLogin: Setter; loginPassword: string; setLoginPassword: Setter; memberBirthday: string; setMemberBirthday: Setter; memberCep: string; setMemberCep: Setter; memberStreet: string; setMemberStreet: Setter; memberNumber: string; setMemberNumber: Setter; memberComplement: string; setMemberComplement: Setter; memberNeighborhood: string; setMemberNeighborhood: Setter; memberCity: string; setMemberCity: Setter; memberReference: string; setMemberReference: Setter; memberError: string; memberSaving: boolean; savedDelivery: Record<string,string>; saveMember: () => void; loginMember: () => void; requestPasswordRecovery: (login:string) => Promise<{ expiresInMinutes?: number; delivery?: string } | null>; resetMemberPassword: (login:string, code:string, password:string, confirmPassword:string) => Promise<boolean>; closeLogin: () => void }) {
 const { loginOpen, loginRequired, canCloseLogin, memberAuthMode, setMemberAuthMode, registerStep, setRegisterStep, termsAccepted, setTermsAccepted, recoveryOpen, setRecoveryOpen, recoveryLogin, setRecoveryLogin, recoveryCode, setRecoveryCode, recoveryPassword, setRecoveryPassword, recoveryPasswordConfirm, setRecoveryPasswordConfirm, recoverySentMessage, setRecoverySentMessage, memberName, setMemberName, memberEmail, setMemberEmail, memberCpf, setMemberCpf, memberPhone, setMemberPhone, memberPassword, setMemberPassword, memberPasswordConfirm, setMemberPasswordConfirm, memberLogin, setMemberLogin, loginPassword, setLoginPassword, memberBirthday, setMemberBirthday, memberCep, setMemberCep, memberStreet, setMemberStreet, memberNumber, setMemberNumber, memberComplement, setMemberComplement, memberNeighborhood, setMemberNeighborhood, memberCity, setMemberCity, memberReference, setMemberReference, memberError, memberSaving, savedDelivery, saveMember, loginMember, requestPasswordRecovery, resetMemberPassword, closeLogin } = props;
 return <>              {loginOpen && (
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
                          Perfil Menfi's
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
                        {loginRequired && (
                          <p className="mt-2 text-xs font-bold leading-relaxed text-black/55">
                            Para pedir, cadastre nome, WhatsApp e senha de 6 dígitos.
                          </p>
                        )}
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

                    <div className="mt-4 grid grid-cols-2 gap-2 rounded-2xl p-1" style={{ background: "#fff" }}>
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
                          Crie seu perfil Menfi's
                        </p>
                        <p className="mt-1 text-xs font-bold leading-snug text-black/60">
                          Salve seus dados para pedir mais rápido e acompanhar seus pedidos.
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
                          style={{ background: "#fff", color: VERDE }}
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
                          {" "}
                          <span className="normal-case tracking-normal">(opcional)</span>
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
                        <div className="rounded-2xl p-4 text-xs font-bold leading-relaxed" style={{ background: "#fff", border: `1px solid ${VERDE}12` }}>
                          <p className="font-black uppercase tracking-wider opacity-60">Confirmacao</p>
                          <p className="mt-2">Telefone: {memberPhone || "pendente"}</p>
                          <p>E-mail: {memberEmail || "não informado"}</p>
                        </div>
                        <label className="flex items-start gap-3 rounded-2xl p-4 text-xs font-bold leading-relaxed" style={{ background: "#fff", border: `1px solid ${VERDE}12` }}>
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

                    {canCloseLogin && (
                      <button
                        type="button"
                        onClick={closeLogin}
                        className="mt-4 w-full rounded-2xl px-4 py-3 text-xs font-black uppercase tracking-wider"
                        style={{ background: "#fff", color: VERDE, border: `1.5px solid ${VERDE}12` }}
                      >
                        Continuar sem cadastro
                      </button>
                    )}
      
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
      
</>; }
