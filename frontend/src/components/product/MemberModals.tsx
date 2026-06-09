import { AnimatePresence, motion } from "motion/react";
import {
  Gift,
  Headphones,
  Loader2,
  LogOut,
  PackageSearch,
  Trophy,
  UserCog,
  UserRound,
  X,
} from "lucide-react";
import { ROSA, VERDE } from "@/utils/theme";
import { MemberProfile } from "./shared";
import { SUPPORT_WHATSAPP_URL } from "@/components/order/checkout";

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
                          Clube Menfi's
                        </p>
                        <h2
                          className="mt-2 uppercase"
                          style={{
                            fontFamily: "'Bebas Neue','Arial Black',sans-serif",
                            fontSize: "clamp(2rem, 8vw, 2.4rem)",
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

                    <div className="mt-4 grid gap-3">
                      <label className="grid gap-1">
                        <span className="text-[10px] font-black uppercase tracking-wider text-black/40">
                          Nome
                        </span>
                        <input
                          value={memberName}
                          onChange={(e) => setMemberName(e.target.value)}
                          placeholder="Seu nome"
                          className="min-w-0 rounded-2xl px-4 py-3 text-base outline-none"
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
                          className="min-w-0 rounded-2xl px-4 py-3 text-base outline-none"
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
                          className="min-w-0 rounded-2xl px-4 py-3 text-base outline-none"
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
                          className="min-w-0 rounded-2xl px-4 py-3 text-base outline-none"
                          style={{ border: `1.5px solid ${VERDE}16`, color: VERDE }}
                        />
                      </label>
                      <div className="grid grid-cols-1 gap-2 min-[390px]:grid-cols-2">
                        <ProfileInput label="CEP" value={memberCep} onChange={setMemberCep} placeholder="00000-000" />
                        <ProfileInput label="Bairro" value={memberNeighborhood} onChange={setMemberNeighborhood} placeholder="Bairro" />
                      </div>
                      <ProfileInput label="Rua" value={memberStreet} onChange={setMemberStreet} placeholder="Rua principal" />
                      <div className="grid grid-cols-1 gap-2 min-[390px]:grid-cols-2">
                        <ProfileInput label="Número" value={memberNumber} onChange={setMemberNumber} placeholder="728" />
                        <ProfileInput label="Complemento" value={memberComplement} onChange={setMemberComplement} placeholder="Casa, ap..." />
                      </div>
                      <div className="grid grid-cols-1 gap-2 min-[390px]:grid-cols-2">
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
                          className="grid h-12 w-12 shrink-0 place-items-center rounded-full"
                          style={{
                            background: ROSA,
                            border: `2px solid ${VERDE}`,
                          }}
                        >
                          <UserRound size={22} strokeWidth={2.6} />
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
                          A cada 10 pedidos no perfil, você ganha 1 burger.
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
                          {memberProgress}/10 pedidos · {memberProfile.rewards} bônus
                        </p>
                      </div>

                      <ProfileMenuButton icon={UserCog} label="Dados cadastrais" onClick={editMember} />
                      <ProfileMenuButton icon={PackageSearch} label="Acompanhe seu pedido" onClick={closeProfile} />
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
    <label className="grid min-w-0 gap-1">
      <span className="text-[10px] font-black uppercase tracking-wider text-black/40">
        {label}
      </span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="min-w-0 rounded-2xl px-4 py-3 text-base outline-none"
        style={{ border: `1.5px solid ${VERDE}16`, color: VERDE }}
      />
    </label>
  );
}

function ProfileMenuButton({
  icon: Icon,
  label,
  onClick,
}: {
  icon: typeof UserCog;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex w-full items-center gap-3 rounded-2xl px-4 py-4 text-left text-xs font-black uppercase tracking-wider"
      style={{ background: "#FFF8F2", color: VERDE, border: `1px solid ${VERDE}12` }}
    >
      <Icon size={18} strokeWidth={2.4} />
      {label}
    </button>
  );
}

function ProfileMenuLink({
  icon: Icon,
  label,
  href,
}: {
  icon: typeof UserCog;
  label: string;
  href: string;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="flex w-full items-center gap-3 rounded-2xl px-4 py-4 text-left text-xs font-black uppercase tracking-wider"
      style={{ background: "#FFF8F2", color: VERDE, border: `1px solid ${VERDE}12` }}
    >
      <Icon size={18} strokeWidth={2.4} />
      {label}
    </a>
  );
}
