import Image from "next/image";
import { CartItem } from "@/types/order";
import { VERDE } from "@/utils/theme";
import { SuggestedCard } from "./SuggestedCard";

export function CartBagStepSection({
  cart,
  addToCart,
  clearCart,
  goToMenu,
}: {
  cart: CartItem[];
  addToCart: (item: Omit<CartItem, "qty">) => void;
  clearCart: () => void;
  goToMenu: () => void;
}) {
  return (
    <>
      <div
        className="rounded-[26px] p-4"
        style={{
          background: "#fff",
          border: `1px solid ${VERDE}10`,
          boxShadow: "0 14px 36px rgba(31,61,46,0.06)",
        }}
      >
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Image
              src="/logo_M.jpeg"
              alt="Menfi's"
              width={48}
              height={48}
              className="rounded-full"
            />
            <div>
              <p className="text-lg font-black" style={{ color: "#18181B" }}>
                Menfi's Burger
              </p>
              <button
                onClick={goToMenu}
                className="mt-0.5 text-left text-sm font-black"
                style={{
                  color: VERDE,
                  border: 0,
                  background: "transparent",
                  padding: 0,
                }}
              >
                Adicionar mais itens
              </button>
            </div>
          </div>
          <button
            onClick={clearCart}
            className="text-sm font-bold"
            style={{ color: VERDE, background: "transparent", border: 0 }}
          >
            Limpar
          </button>
        </div>
      </div>

      <div>
        <h3 className="mb-3 text-xl font-black" style={{ color: "#1F1F1F" }}>
          Peça também
        </h3>
        <div className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-2">
          <SuggestedCard
            id="coca-zero"
            name="Coca-Cola Zero"
            price={8.9}
            description="Lata 350ml gelada"
            image="/EXTRAS/cocazero.jpg"
            qty={cart.find((item) => item.id === "coca-zero")?.qty ?? 0}
            onAdd={addToCart}
          />
          <SuggestedCard
            id="guarana-zero"
            name="Guaraná Zero"
            price={6.9}
            description="Lata 350ml gelada"
            image="/EXTRAS/Gurarana.jpg"
            qty={cart.find((item) => item.id === "guarana-zero")?.qty ?? 0}
            onAdd={addToCart}
          />
          <SuggestedCard
            id="agua-com-gas"
            name="Água com gás"
            price={5.9}
            description="Garrafa gelada"
            image="/EXTRAS/aguaComGas.png"
            qty={cart.find((item) => item.id === "agua-com-gas")?.qty ?? 0}
            onAdd={addToCart}
          />
          <SuggestedCard
            id="batata"
            name="Batata frita"
            price={15.9}
            description="Porção crocante"
            image="/EXTRAS/batata.jpg"
            qty={cart.find((item) => item.id === "batata")?.qty ?? 0}
            onAdd={addToCart}
          />
        </div>
      </div>
    </>
  );
}
