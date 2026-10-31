import { Clock3 } from "lucide-react";
import type { MenuItem } from "@/features/catalog/types";
import { KIOSK_MENU_ITEMS } from "@/features/catalog/menu";
import { ProductHeader } from "./ProductHomeSections";
import { ProductCarousel } from "./carousel/ProductCarousel";
import { LemonadeShowcase, type LemonadeSettings } from "./LemonadeShowcase";
import type { MemberProfile } from "./shared";

export const isHalloweenAccount = (profile: { email?: string } | null) => profile?.email?.trim().toLowerCase() === "halloween@gmail.com";

export function HalloweenMenu({ items, onAdd, onProfile, onCart, cartCount, memberProfile,
  onNotifications, notificationCount, lemonadeSettings, operatingNow, operatingHoursSummary, operatingHoursMessage,
}: {
  items: MenuItem[]; onAdd: (item: MenuItem) => void; onProfile: () => void; onCart: () => void; cartCount: number;
  memberProfile: MemberProfile | null; onNotifications: () => void; notificationCount: number;
  lemonadeSettings: LemonadeSettings; operatingNow: boolean; operatingHoursSummary: string; operatingHoursMessage: string;
}) {
  const monster = KIOSK_MENU_ITEMS[0];
  return <div className="min-h-screen bg-[#100c12] pb-24 text-[#fffafa]">
    <ProductHeader dark kioskMode={false} idleShortcutEnabled={false} cartCount={cartCount}
      onAdminTap={onProfile} onIdleShortcutTap={onProfile} goToCart={onCart} memberProfile={memberProfile}
      notificationCount={notificationCount} onOpenMember={onProfile} onOpenNotifications={onNotifications} />
    <main>
      <ProductCarousel products={[monster]} intervalSeconds={3} onOpenProduct={onAdd} onAddProduct={onAdd}
        cards={[{ id: "halloween", enabled: true, productId: monster.id, eyebrow: "Especial de Halloween",
          title: monster.name, subtitle: "Frango crocante 130g, geleia de bacon agridoce e brioche negro.",
          image: "/menu/MenfisMonster.png", actionLabel: "Quero meu Monster" }]} />
      <div className="flex items-center gap-3 border-y border-white/10 bg-[#21171f] px-4 py-4 text-sm font-bold">
        <Clock3 size={20} className="shrink-0 text-[#ff8fba]" />
        <div><p>{operatingNow ? "Estamos atendendo agora" : "Estamos fechados no momento"}</p>
          <p className="mt-1 text-xs text-white/65">{operatingNow ? operatingHoursSummary : operatingHoursMessage || operatingHoursSummary}</p></div>
      </div>
      <LemonadeShowcase items={items} onAdd={onAdd} settings={lemonadeSettings} dark showHero={false} />
    </main>
  </div>;
}
