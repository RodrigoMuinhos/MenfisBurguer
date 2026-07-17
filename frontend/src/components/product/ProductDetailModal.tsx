import Image from "next/image";
import { motion } from "motion/react";
import {
  ChefHat,
  CheckCircle2,
  Minus,
  Plus,
  ShoppingBag,
  Sparkles,
  X,
} from "lucide-react";
import { CartItem } from "@/types/order";
import { ROSA, VERDE } from "@/utils/theme";
import { MenuItem } from "@/features/catalog/types";
import {
  BuilderState,
  CHEESE_PRICE,
  COMBO_DRINK_SURCHARGE_PRODUCT_ID,
  CustomizerState,
  DRINK_OPTIONS,
  MEAT_POINT_OPTIONS,
  SAUCE_OPTIONS,
  SAUCE_PRICE,
  fmt,
  imageSrc,
  isChickenProduct,
  isSuperProduct,
  isSweetBoxProduct,
  requiredCustomizerCount,
  sweetCardPriceLabel,
} from "./shared";

function comboPotatoLabel(item: MenuItem) {
  return requiredCustomizerCount(item) > 1 ? "batata 200g" : "batata 100g";
}

function productStory(item: MenuItem) {
  if (isSuperProduct(item)) return item.desc;
  const name = item.name.toLowerCase();
  const isBig = item.id.includes("double");
  const isMenfis130 =
    item.id === "burger" ||
    item.id === "combo" ||
    item.id === "combo2";
  const isBacon130 =
    item.id === "menfis-bacon" ||
    item.id === "bacon-combo" ||
    item.id === "bacon-super-combo";
  if (name.includes("chicken")) {
    return `${item.desc} Frango crocante, queijo derretido, alface fresca e molho especial no pão macio, com molho extra para acompanhar cada mordida.`;
  }
  if (name.includes("bacon")) {
    const quantity = isBig || item.id.includes("super") ? "cada carne" : "o burger";
    const grams = isBacon130 ? "130g" : "100g";
    return `${item.desc} Aqui ${quantity} vem com ${grams} de carne suculenta, 40g de bacon crocante, duas fatias de queijo cheddar, cebola caramelizada no ponto, alface crocante e molho especial da casa. Vai com molho extra para acompanhar: uma explosão de sabor do começo ao fim.`;
  }
  if (item.category === "burger" || item.category === "combo") {
    const quantity = isBig || item.id.includes("super") ? "cada carne" : "o burger";
    const grams = isMenfis130 ? "130g" : "100g";
    return `${item.desc} Aqui ${quantity} vem com ${grams} de carne suculenta, duas fatias de queijo cheddar, cebola caramelizada no ponto, alface crocante e molho especial da casa. Vai com molho extra para acompanhar: uma explosão de sabor do começo ao fim.`;
  }
  return item.desc;
}

function productIngredients(item: MenuItem) {
  if (isSuperProduct(item)) return item.desc;
  const name = item.name.toLowerCase();
  const isBig = item.id.includes("double");
  if (name.includes("chicken")) {
    return isBig
      ? "Pão brioche, 2 filés de frango de 120g, queijo cheddar, alface, tomate e molho especial."
      : "Pão brioche, chicken 120g, queijo cheddar, alface, tomate e molho especial.";
  }
  if (name.includes("bacon")) {
    if (item.id === "bacon-super-combo") {
      return "Pão brioche, 2 burgers com carne bovina de 130g, 40g de bacon cada, cheddar, cebola caramelizada, alface e molho Menfi's.";
    }
    if (item.id === "menfis-bacon" || item.id === "bacon-combo") {
      return "Pão brioche, carne 130g, 40g de bacon, cheddar, cebola caramelizada, alface e molho Menfi's.";
    }
    return isBig
      ? "Pão brioche, 2 carnes bovinas de 100g, 40g de bacon, cheddar, cebola caramelizada, alface e molho Menfi's."
      : "Pão brioche, carne 100g, 40g de bacon, cheddar, cebola caramelizada, alface e molho Menfi's.";
  }
  if (item.category === "combo") {
    const burger = item.id === "combo2"
      ? "2 Menfi's Burger com carnes bovinas de 130g"
      : item.id === "triple-combo"
        ? "Combo Triple com 3 carnes bovinas de 100g"
      : isBig
        ? "BIG Menfi's com 2 carnes bovinas de 100g"
        : item.id === "combo"
          ? "Burger Menfi's 130g"
          : "Burger Menfi's";
    return `${burger}, ${comboPotatoLabel(item)}, bebida gelada e molho extra para acompanhar.`;
  }
  if (item.category === "bebida") {
    return "Bebida gelada selecionada.";
  }
  if (item.category === "sweet") {
    if (!isSweetBoxProduct(item)) return item.desc;
    return item.id.includes("plus")
      ? "Caixinha com 4 doces premium escolhidos pelo cliente. Cada unidade premium soma acréscimo."
      : "Caixinha com 4 doces clássicos escolhidos pelo cliente, sem adicional.";
  }
  if (item.category === "extra" || item.category === "fries") {
    return item.desc;
  }
  return item.id === "burger"
    ? "Pão brioche, carne 130g, cheddar, cebola caramelizada, alface e molho Menfi's."
    : "Pão brioche, carne 100g, cheddar, cebola caramelizada, alface e molho Menfi's.";
}

function productWeight(item: MenuItem) {
  const name = item.name.toLowerCase();
  const isBig = item.id.includes("double");
  const isSuper = name.includes("super");
  if (isSuperProduct(item)) return "1 carne bovina de 130g.";
  if (name.includes("chicken")) {
    const chicken = isBig || isSuper ? "2 filés de 120g (240g no total)" : "1 filé de 120g";
    return item.category === "combo"
      ? `${chicken}, ${comboPotatoLabel(item)}.`
      : chicken;
  }
  if (name.includes("bacon")) {
    const burger = isBig || isSuper ? "2 carnes de 100g (200g no total)" : "1 carne de 100g";
    return `${burger}, 40g de bacon${item.category === "combo" ? ` e ${comboPotatoLabel(item)}` : ""}.`;
  }
  if (item.category === "combo") {
    if (item.id === "combo") return `1 carne de 130g e ${comboPotatoLabel(item)}.`;
    if (item.id === "combo2") return `2 carnes de 130g (260g no total) e ${comboPotatoLabel(item)}.`;
    if (item.id === "triple-combo") return `3 carnes de 100g (300g no total) e ${comboPotatoLabel(item)}.`;
    return `${isBig || isSuper ? "2 carnes de 100g (200g no total)" : "1 carne de 100g"} e ${comboPotatoLabel(item)}.`;
  }
  if (item.category === "burger") {
    if (item.id === "burger") return "1 carne de 130g.";
    return isBig ? "2 carnes de 100g (200g no total)." : "1 carne de 100g.";
  }
  if (item.category === "sweet") return isSweetBoxProduct(item) ? "4 doces por caixinha." : "1 unidade.";
  return "Porção conforme seleção.";
}

function productAllergens(item: MenuItem) {
  if (item.category === "bebida") return "Consulte o rótulo da bebida.";
  if (item.category === "sweet") return "Contém leite e derivados. Pode conter amendoim, castanhas, ovo e glúten.";
  return "Contém glúten, leite e derivados. Pode conter ovo e soja.";
}

export function visibleProductTags(item: MenuItem) {
  if (item.category !== "sweet") return item.tags;
  return item.tags.filter((tag) => {
    const normalized = tag.toLowerCase();
    return !normalized.includes("sem adicional") && !normalized.includes("2,90");
  });
}

function DetailInfo({ title, copy, dark = false, surface = "#0A2520", accent = "#E8FFF4" }: { title: string; copy: string; dark?: boolean; surface?: string; accent?: string }) {
  return (
    <div className="rounded-2xl p-3" style={{ border: `1px solid ${dark ? `${accent}3D` : `${VERDE}12`}`, background: dark ? surface : "#fff" }}>
      <p className="text-[11px] font-black uppercase tracking-widest" style={{ color: dark ? accent : `${VERDE}59` }}>
        {title}
      </p>
      <p className="mt-1 text-xs font-bold leading-relaxed" style={{ color: dark ? `${accent}DD` : `${VERDE}AD` }}>{copy}</p>
    </div>
  );
}

export function ProductDetailModal({
  item,
  onClose,
  onAdd,
}: {
  item: MenuItem;
  onClose: () => void;
  onAdd: () => void;
}) {
  const dark = isSuperProduct(item);
  const chilli = item.id === "tropikal-barbecue";
  const accent = chilli ? "#FF315C" : "#A2E61B";
  const modalBg = chilli ? "#21090F" : "#061C18";
  const surface = chilli ? "#351018" : "#0A2520";
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[90] flex items-end justify-center bg-black/80 p-0 sm:items-center sm:p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: 28, scale: 0.98 }}
        animate={{ y: 0, scale: 1 }}
        exit={{ y: 18, scale: 0.98 }}
        className="max-h-[92dvh] w-full overflow-auto rounded-t-[28px] sm:max-w-2xl sm:rounded-[28px]"
        style={{ background: dark ? modalBg : "#fff", color: dark ? "#F4FFF8" : VERDE, border: dark ? `1px solid ${accent}66` : undefined }}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="relative h-72 overflow-hidden" style={{ background: dark ? modalBg : "#fff" }}>
          {item.image ? (
            <Image
              src={item.image}
              alt={item.name}
              fill
              sizes="(max-width: 768px) 100vw, 672px"
              style={{ objectFit: "cover", objectPosition: "center" }}
            />
          ) : (
            <div className="flex h-full items-center justify-center">
              <ChefHat size={72} strokeWidth={1.5} style={{ color: VERDE, opacity: 0.28 }} />
            </div>
          )}
          <button
            type="button"
            onClick={onClose}
            className="absolute right-4 top-4 flex h-11 w-11 items-center justify-center rounded-full"
            style={{ background: dark ? surface : "#fff", color: dark ? accent : VERDE, border: `1px solid ${dark ? `${accent}66` : `${VERDE}18`}` }}
            aria-label="Fechar detalhes"
          >
            <X size={20} strokeWidth={2.5} />
          </button>
        </div>
        <div className="p-5">
          <p className="text-[11px] font-black uppercase tracking-widest" style={{ color: dark ? accent : `${VERDE}59` }}>
            {item.eyebrow}
          </p>
          <div className="mt-1 flex items-start justify-between gap-4">
            <h2
              className="uppercase"
              style={{
                color: dark ? accent : VERDE,
                fontFamily: "'Bebas Neue','Arial Black',sans-serif",
                fontSize: "2.5rem",
                lineHeight: 0.95,
                letterSpacing: 0,
              }}
            >
              {item.name}
            </h2>
            <p
              className="shrink-0"
              style={{
                color: dark ? accent : VERDE,
                fontFamily: "'Bebas Neue','Arial Black',sans-serif",
                fontSize: "2rem",
                lineHeight: 1,
              }}
            >
              {isSweetBoxProduct(item) ? sweetCardPriceLabel(item) : fmt(item.price)}
            </p>
          </div>
          <p className="mt-3 text-sm leading-6" style={{ color: dark ? "#E8FFF4B8" : `${VERDE}AD` }}>{productStory(item)}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            {visibleProductTags(item).map((tag) => (
              <span
                key={tag}
                className="rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-wider"
                style={{ background: dark ? `${accent}18` : `${VERDE}08`, color: dark ? accent : `${VERDE}B8` }}
              >
                {tag}
              </span>
            ))}
          </div>
          <div className="mt-5 grid gap-3">
            <DetailInfo title="Ingredientes" copy={productIngredients(item)} dark={dark} surface={surface} accent={accent} />
            <div className="grid grid-cols-2 gap-3">
              <DetailInfo title="Peso" copy={productWeight(item)} dark={dark} surface={surface} accent={accent} />
              <DetailInfo title="Alérgenos" copy={productAllergens(item)} dark={dark} surface={surface} accent={accent} />
            </div>
            <DetailInfo
              title="Observações"
              copy={item.id === "smash-nutella-marshmallow"
                ? "Produto individual. Informe observações antes de adicionar ao carrinho."
                : "Ponto da carne, molhos, bebidas, adicionais e quantidade são escolhidos antes de adicionar ao carrinho."}
              dark={dark}
              surface={surface}
              accent={accent}
            />
          </div>
          {item.id !== "smash-nutella-marshmallow" && <div className="mt-5 rounded-2xl p-4" style={{ background: dark ? surface : "#fff", color: dark ? accent : VERDE, border: `1px solid ${dark ? `${accent}3D` : `${VERDE}10`}` }}>
            <p className="text-[10px] font-black uppercase tracking-widest opacity-45">
              Opções disponíveis
            </p>
            <p className="mt-1 text-xs font-bold leading-relaxed opacity-70">
              {item.category === "combo"
                ? "Escolha ponto, molho, bebida e adicionais antes de adicionar ao pedido."
                : item.category === "burger"
                  ? isSuperProduct(item)
                    ? item.id === "tropikal-barbecue"
                      ? "Escolha o ponto da carne, o nível de pimenta e os adicionais antes de adicionar ao pedido."
                      : "Escolha o ponto da carne e os adicionais antes de adicionar ao pedido."
                    : "Escolha ponto, molho e adicionais antes de adicionar ao pedido."
                  : item.category === "sweet"
                    ? "Escolha 4 doces para montar a caixinha antes de adicionar ao pedido."
                  : "Adicione diretamente ao pedido ou personalize na próxima etapa quando disponível."}
            </p>
          </div>}
          <button
            type="button"
            onClick={onAdd}
            className="mt-5 flex h-14 w-full items-center justify-center gap-2 rounded-2xl text-xs font-black uppercase tracking-wider"
            style={{ background: dark ? accent : VERDE, color: dark ? "#07110D" : ROSA }}
          >
            Adicionar ao pedido
            <Plus size={16} strokeWidth={2.6} />
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

