import Image from "next/image";
import {
  Bell,
  Bike,
  Clock3,
  ChevronRight,
  Flame,
  Gift,
  Plus,
  ShieldCheck,
  ShoppingBag,
  UserRound,
} from "lucide-react";
import { MenuItem } from "@/features/catalog/types";
import { ROSA, VERDE } from "@/utils/theme";
import { CATEGORIES, MemberProfile } from "./shared";
import burgerPhoto from "@/imports/image-9.png";

export function ProductHeader({
  kioskMode,
  cartCount,
  onAdminTap,
  goToCart,
  memberProfile,
  notificationCount = 0,
  onOpenMember,
  onOpenNotifications,
  onLogoutMember,
}: {
  kioskMode: boolean;
  cartCount: number;
  onAdminTap: () => void;
  goToCart: () => void;
  memberProfile?: MemberProfile | null;
  notificationCount?: number;
  onOpenMember?: () => void;
  onOpenNotifications?: () => void;
  onLogoutMember?: () => void;
}) {
  return (
    <header
      style={{
        position: "sticky",
        top: 0,
        zIndex: 40,
        background: "rgba(255,255,255,0.96)",
        backdropFilter: "blur(18px)",
        borderBottom: `1px solid ${VERDE}14`,
      }}
    >
      <div className="flex w-full items-center gap-4 px-4 py-3">
        <button
          onClick={onAdminTap}
          aria-label="Menfi's Burger"
          className="shrink-0 overflow-hidden rounded-full"
          style={{
            width: 46,
            height: 46,
            background: "#fff",
            border: `2px solid ${ROSA}`,
            boxShadow: "0 10px 24px rgba(31,61,46,0.18)",
          }}
        >
          <img
            src="/logo_M.jpeg"
            alt=""
            width={46}
            height={46}
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        </button>

        <div className="min-w-0 flex-1">
          <img
            src="/logonome.jpeg"
            alt="Menfis"
            className="h-12 w-auto max-w-[210px] object-contain object-left"
          />
          <p className="mt-0.5 truncate text-[10px] font-black uppercase tracking-wide" style={{ color: VERDE }}>
            {kioskMode ? "Escolha seu pedido para retirada" : "Burger quente e entrega rápida. Feito com amor"}
          </p>
        </div>

        {!kioskMode && (
          <div className="flex items-center gap-2">
            <button
              onClick={onOpenNotifications}
              className="relative flex h-12 w-12 items-center justify-center rounded-full"
              style={{ background: "#fff", color: VERDE, border: `1px solid ${VERDE}18` }}
              aria-label="Abrir notificações"
            >
              <Bell size={20} strokeWidth={2.6} />
              {notificationCount > 0 ? (
                <span
                  className="absolute -right-1 -top-1 flex h-6 min-w-6 items-center justify-center rounded-full px-1 text-[10px] font-black"
                  style={{ background: ROSA, color: VERDE, border: "2px solid #fff" }}
                >
                  {notificationCount > 99 ? "99+" : notificationCount}
                </span>
              ) : (
                <span
                  className="absolute right-2 top-2 h-2.5 w-2.5 rounded-full"
                  style={{ background: ROSA, border: "2px solid #fff" }}
                />
              )}
            </button>
            <button
              onClick={onOpenMember}
              className="flex h-12 w-12 items-center justify-center rounded-full"
              style={{ background: memberProfile ? ROSA : "#fff", color: VERDE, border: `1px solid ${VERDE}18` }}
              aria-label={memberProfile ? "Abrir menu do perfil" : "Entrar no delivery"}
            >
              <span
                className="grid h-10 w-10 place-items-center overflow-hidden rounded-full"
                style={{ background: "#fff", border: `1.5px solid ${VERDE}` }}
              >
                <UserRound size={20} strokeWidth={2.6} />
              </span>
            </button>
          </div>
        )}

        <button
          onClick={goToCart}
          disabled={cartCount === 0}
          className="flex items-center gap-2 rounded-full px-4 py-3 text-xs font-black uppercase tracking-wider disabled:opacity-35"
          style={{
            background: VERDE,
            color: ROSA,
            border: "none",
            cursor: cartCount > 0 ? "pointer" : "default",
          }}
        >
          <ShoppingBag size={16} strokeWidth={2.3} />
          {cartCount}
        </button>
      </div>
    </header>
  );
}

export function ProductHero({
  kioskMode,
  featuredItem,
  onIdleShortcutTap,
  onAddFeatured,
  operatingNow,
  operatingHoursSummary,
  operatingHoursMessage,
}: {
  kioskMode: boolean;
  featuredItem: MenuItem;
  onIdleShortcutTap: () => void;
  onAddFeatured: () => void;
  operatingNow: boolean;
  operatingHoursSummary: string;
  operatingHoursMessage: string;
}) {
  return (
    <section
      className="mx-0 grid gap-4 overflow-hidden rounded-none p-4 md:grid-cols-[1.05fr_0.95fr] md:p-6"
      style={{
        background: "#fff",
        color: VERDE,
        boxShadow: "0 24px 70px rgba(31,61,46,0.12)",
      }}
    >
      <div className="flex min-h-[290px] flex-col justify-between gap-5">
        <div>
          {!kioskMode && (
            <div
              className="mb-3 flex items-center gap-2 rounded-2xl px-4 py-3"
              style={{
                background: operatingNow ? "#65001F" : "#FFF1F2",
                color: operatingNow ? ROSA : "#991B1B",
                border: `2px solid ${operatingNow ? VERDE : "#FCA5A5"}`,
                boxShadow: operatingNow ? "0 16px 36px rgba(101,0,31,0.22)" : "none",
              }}
            >
              <span
                className="grid h-9 w-9 shrink-0 place-items-center rounded-full"
                style={{ background: operatingNow ? ROSA : "#FECACA", color: operatingNow ? "#65001F" : "#991B1B" }}
              >
                <Clock3 size={18} strokeWidth={2.8} />
              </span>
              <div className="min-w-0">
                <p className="text-[10px] font-black uppercase tracking-widest opacity-75">
                  {operatingNow ? "Atendimento e delivery" : "Atendimento indisponível"}
                </p>
                <p className="text-sm font-black uppercase md:text-base">
                  {operatingNow ? "Estamos atendendo agora." : "Estamos fechados no momento."}
                </p>
                <p className="mt-1 text-xs font-bold leading-relaxed opacity-80">
                  {operatingNow
                    ? operatingHoursSummary
                    : operatingHoursMessage || operatingHoursSummary}
                </p>
              </div>
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            {(kioskMode
              ? ["Burger suculento", "Molho da casa", "Retirada rápida"]
              : ["Burger 100g", "Cheddar duplo", "Molho especial"]
            ).map((tag, index) => (
              <span
                key={tag}
                onClick={kioskMode && index === 0 ? onIdleShortcutTap : undefined}
                className="rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-wider"
                style={{
                  background: `${VERDE}10`,
                  color: VERDE,
                  border: `1px solid ${VERDE}18`,
                  cursor: kioskMode && index === 0 ? "pointer" : "default",
                  userSelect: "none",
                }}
              >
                {tag}
              </span>
            ))}
          </div>

          <h1
            className="mt-5 max-w-xl uppercase"
            style={{
              fontFamily: "var(--menfis-font-display)",
              fontSize: "clamp(3rem, 7vw, 6.8rem)",
              lineHeight: 0.9,
              letterSpacing: 0,
              color: VERDE,
            }}
          >
            {kioskMode
              ? "Monte seu combo. Confirme seu pedido. Mate sua fome."
              : "Burger no ponto, delivery sem enrolação"}
          </h1>
          <p
            className="mt-4 max-w-lg text-sm leading-relaxed md:text-base"
            style={{ color: `${VERDE}CC` }}
          >
            {kioskMode
              ? "Monte seu pedido no totem. Nossa equipe confirma e prepara para retirada."
              : "Nossos burgers levam 100g de carne, duas fatias de cheddar, cebola caramelizada, alface crocante e molho especial. Uma explosão de sabor com aquele extra de molho para acompanhar."}
          </p>
        </div>

        <div className="grid grid-cols-3 gap-2">
          {(kioskMode
            ? [
                {
                  label: "Modalidade",
                  value: "Somente retirada",
                  Icon: ShoppingBag,
                },
                {
                  label: "Pedido",
                  value: "Confirmado pelo atendente",
                  Icon: ShieldCheck,
                },
                {
                  label: "Pagamento",
                  value: "Nosso atendente irá até você",
                  Icon: Flame,
                },
              ]
            : [
                { label: "Entrega", value: "Delivery Menfi's", Icon: Bike },
                {
                  label: "Pedido",
                  value: "Conferido antes da cozinha",
                  Icon: ShieldCheck,
                },
                {
                  label: "Delivery",
                  value: "Chega quentinho no conforto da sua casa",
                  Icon: Flame,
                },
              ]
          ).map(({ label, value, Icon }) => (
            <div
              key={`${label}-${value}`}
              className="rounded-2xl p-3"
              style={{ background: "rgba(255,255,255,0.42)" }}
            >
              <Icon size={16} strokeWidth={2.2} style={{ color: VERDE }} />
              <p
                className="mt-2 text-[9px] font-black uppercase tracking-wider"
                style={{ color: `${VERDE}85` }}
              >
                {label}
              </p>
              <p className="mt-1 text-xs font-black" style={{ color: VERDE }}>
                {value}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div
        className="relative min-h-[280px] overflow-hidden rounded-[24px]"
        style={{ background: "#fff" }}
      >
        <Image
          src={featuredItem.image ?? burgerPhoto}
          alt={featuredItem.name}
          fill
          priority
          sizes="(max-width: 768px) 100vw, 50vw"
          style={{ objectFit: "cover", objectPosition: "center 42%" }}
        />
        <div
          className="absolute inset-x-0 bottom-0 p-4"
          style={{
            background:
              "linear-gradient(to top, rgba(31,61,46,0.92), rgba(31,61,46,0))",
          }}
        >
          <div className="flex items-end justify-between gap-3">
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-white/70">
                Destaque
              </p>
              <p
                className="uppercase"
                style={{
                  fontFamily: "var(--menfis-font-display)",
                  fontSize: "2rem",
                  lineHeight: 1,
                  color: ROSA,
                }}
              >
                {featuredItem.name}
              </p>
            </div>
            <button
              onClick={onAddFeatured}
              className="flex items-center gap-2 rounded-full px-4 py-3 text-xs font-black uppercase tracking-wider"
              style={{ background: ROSA, color: VERDE }}
            >
              Adicionar
              <Plus size={15} strokeWidth={2.5} />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

export function MemberAccessBanner({
  memberProfile,
  onOpen,
}: {
  memberProfile: MemberProfile | null;
  onOpen: () => void;
}) {
  const needsPassword = Boolean(memberProfile && memberProfile.hasPassword === false);

  return (
    <section className="px-4 pt-4">
      <button
        onClick={onOpen}
        className="flex w-full items-center justify-between gap-3 rounded-[24px] p-4 text-left md:p-5"
        style={{
          background: needsPassword ? "#FFFBEB" : memberProfile ? VERDE : "#fff",
          color: needsPassword ? "#92400E" : memberProfile ? ROSA : VERDE,
          border: `1px solid ${needsPassword ? "#F59E0B" : memberProfile ? VERDE : `${VERDE}12`}`,
          boxShadow: "0 12px 34px rgba(31,61,46,0.08)",
        }}
      >
        <div className="flex min-w-0 items-center gap-3">
          <div
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl"
            style={{ background: memberProfile ? `${ROSA}18` : `${ROSA}80` }}
          >
            {needsPassword ? (
              <ShieldCheck size={20} strokeWidth={2.4} />
            ) : memberProfile ? (
              <ShieldCheck size={20} strokeWidth={2.4} />
            ) : (
              <Gift size={20} strokeWidth={2.4} />
            )}
          </div>
          <div className="min-w-0">
            <p className="text-xs font-black uppercase tracking-wider">
              {needsPassword
                ? "Crie sua senha de acesso"
                : memberProfile
                ? `${memberProfile.name}, seu perfil Menfi's`
                : "Cadastre-se e ganhe 10%"}
            </p>
            <p
              className="mt-1 text-xs leading-relaxed"
              style={{ opacity: 0.72 }}
            >
              {needsPassword
                ? "Sua conta foi encontrada, mas ainda falta senha de 6 dígitos para manter seus dados protegidos."
                : memberProfile
                ? `${memberProfile.orders % 10}/10 pedidos para ganhar um burger. Dados de entrega ficam salvos.`
                : "Cadastro obrigatório para pedir: informe nome, WhatsApp e uma senha de 6 dígitos."}
            </p>
          </div>
        </div>
        <ChevronRight size={18} strokeWidth={2.4} />
      </button>
    </section>
  );
}

export function CategoryTabs({
  category,
  setCategory,
}: {
  category: (typeof CATEGORIES)[number]["id"];
  setCategory: (category: (typeof CATEGORIES)[number]["id"]) => void;
}) {
  return (
    <section className="mt-5 px-4">
      <div className="flex gap-2 overflow-x-auto pb-1">
        {CATEGORIES.map(({ id, label, Icon }) => {
          const active = category === id;
          return (
            <button
              key={id}
              onClick={() => setCategory(id)}
              className="flex shrink-0 items-center gap-2 rounded-full px-4 py-3 text-xs font-black uppercase tracking-wider"
              style={{
                background: active ? VERDE : "#fff",
                color: active ? ROSA : VERDE,
                border: `1px solid ${active ? VERDE : `${VERDE}14`}`,
                boxShadow: active ? "0 12px 28px rgba(31,61,46,0.18)" : "none",
              }}
            >
              <Icon size={15} strokeWidth={2.2} />
              {label}
            </button>
          );
        })}
      </div>
    </section>
  );
}
