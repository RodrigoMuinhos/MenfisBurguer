import Image from "next/image";
import { ShoppingBag, UserRound } from "lucide-react";
import type { MenuItem } from "@/features/catalog/types";
import { KIOSK_MENU_ITEMS, MONSTER_ADDON, MONSTER_ADDON_ID } from "@/features/catalog/menu";
import { LemonadeShowcase, type LemonadeSettings } from "./LemonadeShowcase";
import { fmt } from "./shared";
import { RASPBERRY_LEMONADE_ID } from "@/utils/halloween";
import styles from "./HalloweenMenu.module.css";

export { isHalloweenAccount } from "@/utils/halloween";

export function HalloweenMenu({ items, onAdd, onProfile, onCart, cartCount, cartTotal, lemonadeSettings }: {
  items: MenuItem[]; onAdd: (item: MenuItem, initialExtras?: Record<string, number>) => void; onProfile: () => void; onCart: () => void;
  cartCount: number; cartTotal: number; lemonadeSettings: LemonadeSettings;
}) {
  const monster = KIOSK_MENU_ITEMS[0];
  const eventLemonades = { ...lemonadeSettings,
    enabledFlavors: [...new Set([...lemonadeSettings.enabledFlavors, RASPBERRY_LEMONADE_ID])],
    flavorOrder: [...new Set([...lemonadeSettings.flavorOrder, RASPBERRY_LEMONADE_ID])],
  };
  return <main className={styles.page}>
    <section className={styles.hero} aria-label="Especial de Halloween">
      <div className={styles.copy}>
        <p className={styles.eyebrow}>Especial de Halloween · Menfis</p>
        <h1 className={styles.title}>Menfis<br />Monster</h1>
        <p className={styles.description}>{monster.desc}</p>
        <p className={styles.price}>{fmt(monster.price)}</p>
        <button type="button" onClick={() => onAdd(monster)} className={styles.order}>Quero meu Monster <span aria-hidden="true">+</span></button>
        <button type="button" onClick={() => onAdd(monster, { [MONSTER_ADDON_ID]: 1 })} className={styles.comboOffer}><strong>Que tal fazer um combo?</strong><span>Batata 150g + Coca-Cola Zero por só + {fmt(MONSTER_ADDON.price)}</span></button>
        <p className={styles.service}>Atendimento presencial · Retirada no balcão</p>
      </div>
      <div className={styles.visual}>
        <Image src="/menu/MenfisMonster.png" alt="Menfis Monster: frango crocante no pão brioche negro" fill priority sizes="(min-width: 900px) 64vw, 100vw" className={styles.burger} />
      </div>
    </section>
    <LemonadeShowcase items={items} onAdd={onAdd} settings={eventLemonades} dark halloween showHero={false} />
    <div className={styles.actions}>
      <button type="button" onClick={onProfile} className={styles.profile} aria-label="Minha conta"><UserRound size={22} /></button>
      <button type="button" onClick={onCart} disabled={cartCount === 0} className={styles.bag}><ShoppingBag size={21} /><span>Ver sacola ({cartCount})</span><strong>{fmt(cartTotal)}</strong></button>
    </div>
  </main>;
}
