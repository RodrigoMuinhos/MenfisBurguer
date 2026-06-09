import { AnimatePresence, motion } from "motion/react";
import { Gift, Loader2, Mail, MapPin, ShieldCheck, Trophy, UserRound, X } from "lucide-react";
import { ROSA, VERDE } from "@/utils/theme";
import { MemberProfile } from "./shared";

export function MemberModals({
  loginOpen,
  profileOpen,
  memberProfile,
  memberName,
  setMemberName,
  memberEmail,
  setMemberEmail,
  memberPhone,
  setMemberPhone,
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
  memberProgress,
  savedDelivery,
  saveMember,
  editMember,
  logoutMember,
  closeLogin,
  closeProfile,
}: {
  loginOpen: boolean;
  profileOpen: boolean;
  memberProfile: MemberProfile | null;
  memberName: string;
  setMemberName: (value: string) => void;
  memberEmail: string;
  setMemberEmail: (value: string) => void;
  memberPhone: string;
  setMemberPhone: (value: string) => void;
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
  memberProgress: number;
  savedDelivery: Record<string, string>;
  saveMember: () => void;
  editMember: () => void;
  logoutMember: () => void;
  closeLogin: () => void;
  closeProfile: () => void;
}) {
  const canCloseLogin = Boolean(memberProfile);

  return (
    <>
            <AnimatePresence>
              {loginOpen && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 z-[75] flex items-end justify-center bg-black/45 p-4 sm:items-center"
                >
                  <motion.div
                    initial={{ y: 24, scale: 0.98 }}
                    animate={{ y: 0, scale: 1 }}
                    exit={{ y: 24, scale: 0.98 }}
                    className="w-full max-w-md rounded-[28px] p-5"
                    style={{ background: "#fff", color: VERDE }}
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
                            fontSize: "2.4rem",
                            lineHeight: 0.95,
                          }}
                        >
                          Crie seu perfil Menfi's
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
      
                    <div
                      className="mt-4 rounded-2xl p-4"
                      style={{ background: ROSA, color: VERDE }}
                    >
                      <div className="flex items-center gap-2">
                        <UserRound size={17} strokeWidth={2.3} />
                        <p className="text-xs font-black uppercase tracking-wider">
                          Identifique-se como no app de delivery
                        </p>
                      </div>
                      <p className="mt-2 text-xs leading-relaxed" style={{ opacity: 0.68 }}>
                        Guardamos seu email, telefone, endereço principal e aniversário para agilizar
                        próximos pedidos e avisar benefícios em datas especiais.
                      </p>
                    </div>
      
                    <div className="mt-4 grid gap-3">
                      <label className="grid gap-1">
                        <span className="text-[10px] font-black uppercase tracking-wider text-black/40">
                          Nome
                        </span>
                        <input
                          value={memberName}
                          onChange={(e) => setMemberName(e.target.value)}
                          placeholder="Seu nome"
                          className="rounded-2xl px-4 py-3 text-sm outline-none"
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
                          placeholder="voce@email.com"
                          inputMode="email"
                          className="rounded-2xl px-4 py-3 text-sm outline-none"
                          style={{ border: `1.5px solid ${VERDE}16`, color: VERDE }}
                        />
                      </label>
                      <label className="grid gap-1">
                        <span className="text-[10px] font-black uppercase tracking-wider text-black/40">
                          WhatsApp
                        </span>
                        <input
                          value={memberPhone}
                          onChange={(e) => setMemberPhone(e.target.value)}
                          placeholder="(00) 00000-0000"
                          inputMode="tel"
                          className="rounded-2xl px-4 py-3 text-sm outline-none"
                          style={{ border: `1.5px solid ${VERDE}16`, color: VERDE }}
                        />
                      </label>
                      <label className="grid gap-1">
                        <span className="text-[10px] font-black uppercase tracking-wider text-black/40">
                          Aniversário
                        </span>
                        <input
                          value={memberBirthday}
                          onChange={(e) => setMemberBirthday(e.target.value)}
                          type="date"
                          className="rounded-2xl px-4 py-3 text-sm outline-none"
                          style={{ border: `1.5px solid ${VERDE}16`, color: VERDE }}
                        />
                      </label>
                      <div className="grid grid-cols-[0.8fr_1.2fr] gap-2">
                        <ProfileInput label="CEP" value={memberCep} onChange={setMemberCep} placeholder="00000-000" />
                        <ProfileInput label="Bairro" value={memberNeighborhood} onChange={setMemberNeighborhood} placeholder="Bairro" />
                      </div>
                      <ProfileInput label="Rua" value={memberStreet} onChange={setMemberStreet} placeholder="Rua principal" />
                      <div className="grid grid-cols-[0.7fr_1.3fr] gap-2">
                        <ProfileInput label="Número" value={memberNumber} onChange={setMemberNumber} placeholder="728" />
                        <ProfileInput label="Complemento" value={memberComplement} onChange={setMemberComplement} placeholder="Casa, ap..." />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <ProfileInput label="Cidade" value={memberCity} onChange={setMemberCity} placeholder="Fortaleza" />
                        <ProfileInput label="Referência" value={memberReference} onChange={setMemberReference} placeholder="Próximo a..." />
                      </div>
                    </div>
      
                    {memberError && (
                      <p
                        className="mt-3 rounded-2xl px-3 py-2 text-xs font-bold leading-relaxed"
                        style={{ background: `${ROSA}70`, color: VERDE }}
                      >
                        {memberError}
                      </p>
                    )}
      
                    <button
                      onClick={saveMember}
                      disabled={memberSaving}
                      className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl px-4 py-4 text-xs font-black uppercase tracking-wider"
                      style={{
                        background: VERDE,
                        color: ROSA,
                        opacity: memberSaving ? 0.76 : 1,
                      }}
                    >
                      {memberSaving ? "Cadastrando" : "Cadastrar"}
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
                  className="fixed inset-0 z-[75] flex items-end justify-center bg-black/45 p-4 sm:items-center"
                >
                  <motion.div
                    initial={{ y: 24, scale: 0.98 }}
                    animate={{ y: 0, scale: 1 }}
                    exit={{ y: 24, scale: 0.98 }}
                    className="w-full max-w-md overflow-hidden rounded-[28px]"
                    style={{ background: "#fff", color: VERDE }}
                  >
                    <div className="p-5" style={{ background: ROSA }}>
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <div
                            className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-full"
                            style={{
                              background: "#fff",
                              border: `2px solid ${VERDE}`,
                            }}
                          >
                            <img
                              src="/logo_M_square.png"
                              alt=""
                              width={56}
                              height={56}
                              style={{ width: "100%", height: "100%", objectFit: "cover" }}
                            />
                          </div>
                          <div>
                            <p className="text-[10px] font-black uppercase tracking-[0.22em] opacity-55">
                              Perfil Menfi's
                            </p>
                            <h2 className="text-xl font-black leading-tight">
                              {memberProfile.name}
                            </h2>
                            <p className="mt-1 text-xs font-bold opacity-70">
                              Seu pedido chega quentinho no conforto da sua casa.
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => closeProfile()}
                          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full"
                          style={{ background: "#fff", color: VERDE }}
                        >
                          <X size={18} strokeWidth={2.4} />
                        </button>
                      </div>
                    </div>
      
                    <div className="grid gap-3 p-5">
                      {[
                        {
                          icon: Mail,
                          title: memberProfile.email || "Email não informado",
                          copy: "Usado apenas para recibos e recuperação futura",
                        },
                        {
                          icon: UserRound,
                          title: memberProfile.phone,
                          copy: "WhatsApp para atualizações do pedido",
                        },
                        {
                          icon: MapPin,
                          title:
                            memberProfile.defaultAddress?.street && memberProfile.defaultAddress?.number
                              ? `${memberProfile.defaultAddress.street}, ${memberProfile.defaultAddress.number}`
                              : savedDelivery.street && savedDelivery.number
                                ? `${savedDelivery.street}, ${savedDelivery.number}`
                              : "Endereço salvo no checkout",
                          copy:
                            savedDelivery.cep || savedDelivery.complement
                              ? [savedDelivery.cep, savedDelivery.complement]
                                  .filter(Boolean)
                                  .join(" · ")
                              : "Preencha uma vez e o próximo pedido já lembra",
                        },
                      ].map(({ icon: Icon, title, copy }) => (
                        <div
                          key={`${title}-${copy}`}
                          className="flex items-start gap-3 rounded-2xl p-3"
                          style={{ background: "#FFF8F2", border: `1px solid ${VERDE}10` }}
                        >
                          <Icon size={18} strokeWidth={2.2} className="mt-0.5 shrink-0" />
                          <div className="min-w-0">
                            <p className="truncate text-xs font-black">{title}</p>
                            <p className="mt-1 text-[11px] leading-relaxed opacity-58">
                              {copy}
                            </p>
                          </div>
                        </div>
                      ))}
      
                      <div
                        className="rounded-2xl p-4"
                        style={{ background: VERDE, color: ROSA }}
                      >
                        <div className="flex items-center gap-2">
                          <Trophy size={18} strokeWidth={2.3} />
                          <p className="text-xs font-black uppercase tracking-wider">
                            Bônus Menfi's
                          </p>
                        </div>
                        <p className="mt-2 text-xs leading-relaxed opacity-75">
                          A cada 10 pedidos no perfil, você ganha 1 burger. Progresso atual:
                        </p>
                        <div className="mt-3 h-3 overflow-hidden rounded-full bg-white/18">
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: `${Math.max(8, memberProgress * 10)}%`,
                              background: ROSA,
                            }}
                          />
                        </div>
                        <p className="mt-2 text-xs font-black">
                          {memberProgress}/10 pedidos · {memberProfile.rewards} bônus liberado
                          {memberProfile.rewards === 1 ? "" : "s"}
                        </p>
                      </div>
      
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={editMember}
                          className="rounded-2xl px-4 py-3 text-xs font-black uppercase tracking-wider"
                          style={{ background: ROSA, color: VERDE }}
                        >
                          Editar perfil
                        </button>
                        <button
                          onClick={() => closeProfile()}
                          className="rounded-2xl px-4 py-3 text-xs font-black uppercase tracking-wider"
                          style={{
                            background: "transparent",
                            color: VERDE,
                            border: `1.5px solid ${VERDE}12`,
                          }}
                        >
                          Fechar
                        </button>
                      </div>
                      <button
                        onClick={logoutMember}
                        className="rounded-2xl px-4 py-3 text-xs font-black uppercase tracking-wider"
                        style={{
                          background: "transparent",
                          color: "#991B1B",
                          border: "1.5px solid #FCA5A5",
                        }}
                      >
                        Sair da conta
                      </button>
                    </div>
                  </motion.div>
                </motion.div>
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
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  return (
    <label className="grid gap-1">
      <span className="text-[10px] font-black uppercase tracking-wider text-black/40">
        {label}
      </span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="rounded-2xl px-4 py-3 text-sm outline-none"
        style={{ border: `1.5px solid ${VERDE}16`, color: VERDE }}
      />
    </label>
  );
}
