import Image from "next/image";
import { motion } from "motion/react";
import type { Dispatch, SetStateAction } from "react";
import { Headphones, KeyRound, Loader2, LogOut, MapPin, UserCog, X } from "lucide-react";
import { ROSA, VERDE } from "@/utils/theme";
import type { Order } from "@/types/order";
import type { MemberProfile } from "../shared";
import { SUPPORT_WHATSAPP_URL } from "@/components/order/checkout";
import { ActiveProfileOrderCard, InfoLine, ProfileInput, ProfileMenuButton, ProfileMenuLink, ProfileSection } from "./MemberUi";
const BRAND_M_LOGO = "/logo_M.jpeg";
type Setter = Dispatch<SetStateAction<string>>;

export function MemberProfilePanel({ profileOpen, memberProfile, profileIncomplete, profileEditOpen, profileEditName, profileEditPhone, profileEditEmail, profileCurrentPassword, profileNewPassword, profileConfirmPassword, profileEditError, profileEditSaving, ordersLoading, visibleActiveOrder, hasActiveOrder, closeProfile, editMember, setProfileEditOpen, setProfileEditName, setProfileEditPhone, setProfileEditEmail, setProfileCurrentPassword, setProfileNewPassword, setProfileConfirmPassword, submitProfileEdit, openProfileEdit, onOpenActiveOrder, logoutMember }: { profileOpen: boolean; memberProfile: MemberProfile | null; profileIncomplete: boolean; profileEditOpen: boolean; profileEditName: string; profileEditPhone: string; profileEditEmail: string; profileCurrentPassword: string; profileNewPassword: string; profileConfirmPassword: string; profileEditError: string; profileEditSaving: boolean; ordersLoading: boolean; visibleActiveOrder?: Order | null; hasActiveOrder: boolean; closeProfile: () => void; editMember: () => void; setProfileEditOpen: Dispatch<SetStateAction<boolean>>; setProfileEditName: Setter; setProfileEditPhone: Setter; setProfileEditEmail: Setter; setProfileCurrentPassword: Setter; setProfileNewPassword: Setter; setProfileConfirmPassword: Setter; submitProfileEdit: () => Promise<void>; openProfileEdit: () => void; onOpenActiveOrder?: (orderId?: string) => void; logoutMember: () => void }) { return <>              {profileOpen && memberProfile && (
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
                          className="relative grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-full"
                          style={{
                            background: "#fff",
                            border: `2px solid ${VERDE}`,
                          }}
                        >
                          <Image src={BRAND_M_LOGO} alt="Menfi's" fill sizes="48px" style={{ objectFit: "cover" }} />
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
                            Adicione telefone e senha para acompanhar pedidos e recuperar seu acesso.
                          </span>
                        </button>
                      )}
                      <ProfileSection title="Minha conta">
                        <InfoLine label="Nome" value={memberProfile.name} />
                        <InfoLine label="Telefone" value={memberProfile.phone || "Pendente"} />
                        {memberProfile.email && <InfoLine label="E-mail" value={memberProfile.email} />}
                      </ProfileSection>

                      {profileEditOpen ? (
                        <div
                          className="grid gap-3 rounded-2xl p-4"
                          style={{ background: "#fff", border: `1px solid ${VERDE}12` }}
                        >
                          <div>
                            <p className="text-xs font-black uppercase tracking-wider">
                              Editar dados da conta
                            </p>
                            <p className="mt-1 text-[11px] font-bold leading-relaxed opacity-60">
                              Confirme sua senha atual antes de alterar o perfil.
                            </p>
                          </div>
                          <ProfileInput label="Nome" value={profileEditName} onChange={setProfileEditName} />
                          <ProfileInput
                            label="Telefone / WhatsApp"
                            value={profileEditPhone}
                            onChange={(value) => setProfileEditPhone(value.replace(/[^\d\s()+-]/g, ""))}
                            inputMode="tel"
                          />
                          <ProfileInput
                            label="E-mail"
                            value={profileEditEmail}
                            onChange={setProfileEditEmail}
                            inputMode="email"
                          />
                          <ProfileInput
                            label="Senha atual"
                            value={profileCurrentPassword}
                            onChange={(value) => setProfileCurrentPassword(value.replace(/\D/g, "").slice(0, 6))}
                            type="password"
                            revealable
                            inputMode="numeric"
                            maxLength={6}
                          />
                          <ProfileInput
                            label="Nova senha (opcional)"
                            value={profileNewPassword}
                            onChange={(value) => setProfileNewPassword(value.replace(/\D/g, "").slice(0, 6))}
                            type="password"
                            revealable
                            inputMode="numeric"
                            maxLength={6}
                          />
                          <ProfileInput
                            label="Confirmar nova senha"
                            value={profileConfirmPassword}
                            onChange={(value) => setProfileConfirmPassword(value.replace(/\D/g, "").slice(0, 6))}
                            type="password"
                            revealable
                            inputMode="numeric"
                            maxLength={6}
                          />
                          {profileEditError && (
                            <p
                              className="rounded-2xl px-4 py-3 text-xs font-black leading-relaxed"
                              style={{ background: `${ROSA}80`, color: VERDE }}
                            >
                              {profileEditError}
                            </p>
                          )}
                          <div className="grid grid-cols-2 gap-2">
                            <button
                              type="button"
                              onClick={() => setProfileEditOpen(false)}
                              className="rounded-2xl px-4 py-3 text-xs font-black uppercase tracking-wider"
                              style={{ background: "#fff", color: VERDE, border: `1px solid ${VERDE}14` }}
                            >
                              Cancelar
                            </button>
                            <button
                              type="button"
                              onClick={() => void submitProfileEdit()}
                              disabled={profileEditSaving}
                              className="rounded-2xl px-4 py-3 text-xs font-black uppercase tracking-wider disabled:opacity-55"
                              style={{ background: VERDE, color: ROSA }}
                            >
                              {profileEditSaving ? "Salvando" : "Salvar"}
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <ProfileMenuButton icon={UserCog} label="Editar dados da conta" onClick={openProfileEdit} />
                          <ProfileMenuButton icon={MapPin} label="Gerenciar endereços" onClick={openProfileEdit} />
                          <ProfileMenuButton icon={KeyRound} label="Alterar senha / recuperar acesso" onClick={openProfileEdit} />
                        </>
                      )}
                      {ordersLoading && !visibleActiveOrder && (
                        <div
                          className="flex items-center gap-3 rounded-2xl p-4 text-xs font-black uppercase tracking-wider"
                          style={{ background: VERDE, color: ROSA }}
                        >
                          <Loader2 size={18} strokeWidth={2.5} style={{ animation: "spin 1s linear infinite" }} />
                          Buscando pedido ativo
                        </div>
                      )}
                      {hasActiveOrder && visibleActiveOrder && (
                        <ActiveProfileOrderCard
                          order={visibleActiveOrder}
                          onOpen={() => {
                            closeProfile();
                            onOpenActiveOrder?.(visibleActiveOrder.id);
                          }}
                        />
                      )}
                      <div className="rounded-2xl p-4 text-xs font-black uppercase tracking-wider" style={{ background: "#fff", border: `1px solid ${VERDE}12` }}>
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
</>; }

