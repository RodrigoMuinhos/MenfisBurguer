import type { CartItem } from "@/types/order";
import type { CustomizerState } from "@/components/product/shared";
import { MONSTER_EXTRA_OPTIONS } from "./menu";

export type MonsterCartLine = { item: Omit<CartItem, "qty">; quantity: number };

// These are standalone SKUs: changing sandwich quantity never multiplies sides.
export function buildMonsterCartLines(state: CustomizerState): MonsterCartLine[] {
  const note = state.note.trim();
  const lines: MonsterCartLine[] = [{
    item: { id: `${state.item.id}:${encodeURIComponent(note)}`, productId: state.item.id,
      name: state.item.name.toUpperCase(), price: state.item.price, components: [state.item.name],
      addonIds: [], note: note || undefined },
    quantity: state.qty,
  }];
  for (const extra of MONSTER_EXTRA_OPTIONS) {
    const quantity = state.extras[extra.id] ?? 0;
    if (!Number.isInteger(quantity) || quantity <= 0) continue;
    lines.push({ item: { id: extra.id, productId: extra.id, name: extra.label.toUpperCase(),
      price: extra.price, components: [extra.label], addonIds: [] }, quantity });
  }
  return lines;
}
