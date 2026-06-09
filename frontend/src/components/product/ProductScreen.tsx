import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  ChefHat,
  Loader2,
  Mail,
  Minus,
  Plus,
  ShoppingBag,
  Sparkles,
  Trophy,
  UserRound,
  X,
} from "lucide-react";
import { CartItem, Order } from "@/types/order";
import { CREME, ROSA, VERDE } from "@/utils/theme";
import { MENU_ITEMS } from "@/features/catalog/menu";
import { MenuItem } from "@/features/catalog/types";
import friesPhoto from "@/imports/image-20.png";
import {
  BuilderState,
  CATEGORIES,
  COMBO_DRINK_SURCHARGE_PRODUCT_ID,
  CustomizerState,
  DRINK_OPTIONS,
  BURGER_ID,
  CHEESE_PRICE,
  MEMBER_KEY,
  MEMBER_TOKEN_KEY,
  MEAT_POINT_OPTIONS,
  MemberProfile,
  SAUCE_OPTIONS,
  SAUCE_PRICE,
  buildBurger,
  fmt,
  getExtraOptionsForItem,
  imageSrc,
  isChickenProduct,
  isEmail,
  readMemberProfile,
  readSavedDelivery,
  requiredCustomizerCount,
} from "./shared";
import {
  loginCustomerSession,
  loadCustomerSession,
  logoutCustomerSession,
  saveCustomerSession,
} from "@/services/customerSession";
import {
  BurgerBuilder,
  MenuCard,
  ProductCustomizer,
} from "./ProductParts";
import { MemberModals } from "./MemberModals";
import {
  CategoryTabs,
  MemberAccessBanner,
  ProductHeader,
  ProductHero,
} from "./ProductHomeSections";

interface Props {
  cart: CartItem[];
  addToCart: (item: Omit<CartItem, "qty">) => void;
  updateQty: (id: string, delta: number) => void;
  goToCart: () => void;
  goBack?: () => void;
  onAdminOpen?: () => boolean | void | Promise<boolean | void>;
  onOpenIdleScreen?: () => void;
  kioskMode?: boolean;
  activeOrder?: Order | null;
  onOpenActiveOrder?: () => void;
  onRepeatOrder?: (items: CartItem[]) => void;
}

export function ProductScreen({
  cart,
  addToCart,
  updateQty,
  goToCart,
  onAdminOpen,
  onOpenIdleScreen,
  kioskMode = false,
  activeOrder,
  onOpenActiveOrder,
  onRepeatOrder,
}: Props) {
  const [category, setCategory] = useState<(typeof CATEGORIES)[number]["id"]>(
    "combo",
  );
  const [builder, setBuilder] = useState<BuilderState>({
    cheese: false,
    sauce: false,
  });
  const [customizer, setCustomizer] = useState<CustomizerState | null>(null);
  const [loginOpen, setLoginOpen] = useState(() => {
    if (kioskMode || typeof window === "undefined") return false;
    return !localStorage.getItem(MEMBER_TOKEN_KEY) || !readMemberProfile();
  });
  const [profileOpen, setProfileOpen] = useState(false);
  const [memberName, setMemberName] = useState("");
  const [memberEmail, setMemberEmail] = useState("");
  const [memberCpf, setMemberCpf] = useState("");
  const [memberPhone, setMemberPhone] = useState("");
  const [memberPassword, setMemberPassword] = useState("");
  const [memberPasswordConfirm, setMemberPasswordConfirm] = useState("");
  const [memberLogin, setMemberLogin] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [memberAuthMode, setMemberAuthMode] = useState<"register" | "login">("register");
  const [memberBirthday, setMemberBirthday] = useState("");
  const [memberCep, setMemberCep] = useState("");
  const [memberStreet, setMemberStreet] = useState("");
  const [memberNumber, setMemberNumber] = useState("");
  const [memberComplement, setMemberComplement] = useState("");
  const [memberNeighborhood, setMemberNeighborhood] = useState("");
  const [memberCity, setMemberCity] = useState("");
  const [memberReference, setMemberReference] = useState("");
  const [memberProfile, setMemberProfile] = useState<MemberProfile | null>(
    () => {
      if (kioskMode || typeof window === "undefined") return null;
      return localStorage.getItem(MEMBER_TOKEN_KEY) ? readMemberProfile() : null;
    },
  );
  const [memberError, setMemberError] = useState("");
  const [memberSaving, setMemberSaving] = useState(false);
  const [configurationUnavailable, setConfigurationUnavailable] = useState(false);
  const adminTapTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const configurationTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const adminTapCountRef = useRef(0);
  const idleShortcutTapCountRef = useRef(0);
  const idleShortcutTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const cartCount = cart.reduce((s, i) => s + i.qty, 0);
  const cartTotal = cart.reduce((s, i) => s + i.price * i.qty, 0);
  const filteredItems = useMemo(
    () => MENU_ITEMS.filter((item) => item.category === category),
    [category],
  );
  const featuredItem =
    MENU_ITEMS.find((item) => item.id === "combo2") ?? MENU_ITEMS[0];
  const savedDelivery = readSavedDelivery();
  const memberProgress = memberProfile ? memberProfile.orders % 10 : 0;

  useEffect(() => {
    if (kioskMode) return;
    void loadCustomerSession().then((profile) => {
      if (profile) {
        setMemberProfile(profile);
        setLoginOpen(false);
        return;
      }
      setMemberProfile(null);
      setLoginOpen(true);
    });
  }, [kioskMode]);

  useEffect(() => {
    if (kioskMode) return;
    const cepDigits = memberCep.replace(/\D/g, "");
    if (cepDigits.length !== 8) return;

    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      void fetch(`https://viacep.com.br/ws/${cepDigits}/json/`, {
        signal: controller.signal,
      })
        .then((response) => (response.ok ? response.json() : null))
        .then((data) => {
          if (!data || data.erro) return;
          setMemberStreet(String(data.logradouro ?? ""));
          setMemberNeighborhood(String(data.bairro ?? ""));
          setMemberCity(String(data.localidade ?? ""));
        })
        .catch(() => {});
    }, 350);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [kioskMode, memberCep]);

  const qty = (id: string) => cart.find((item) => item.id === id)?.qty ?? 0;

  const handleAdminTap = async () => {
    adminTapCountRef.current += 1;
    if (adminTapTimerRef.current) clearTimeout(adminTapTimerRef.current);

    if (adminTapCountRef.current >= 5) {
      adminTapCountRef.current = 0;
      adminTapTimerRef.current = null;
      const opened = await onAdminOpen?.();
      if (opened === false || !onAdminOpen) {
        setConfigurationUnavailable(true);
        if (configurationTimerRef.current) clearTimeout(configurationTimerRef.current);
        configurationTimerRef.current = setTimeout(() => {
          setConfigurationUnavailable(false);
          configurationTimerRef.current = null;
        }, 1800);
      }
      return;
    }

    adminTapTimerRef.current = setTimeout(() => {
      adminTapCountRef.current = 0;
      adminTapTimerRef.current = null;
    }, 700);
  };

  const handleIdleShortcutTap = () => {
    if (!kioskMode || !onOpenIdleScreen) return;
    idleShortcutTapCountRef.current += 1;
    if (idleShortcutTimerRef.current) clearTimeout(idleShortcutTimerRef.current);

    if (idleShortcutTapCountRef.current >= 3) {
      idleShortcutTapCountRef.current = 0;
      idleShortcutTimerRef.current = null;
      onOpenIdleScreen();
      return;
    }

    idleShortcutTimerRef.current = setTimeout(() => {
      idleShortcutTapCountRef.current = 0;
      idleShortcutTimerRef.current = null;
    }, 850);
  };

  const openCustomizer = (item: MenuItem) => {
    setCustomizer({
      item,
      meatPoints: [],
      sauces: [],
      drinks: [],
      extras: {},
      qty: 1,
      note: "",
    });
  };

  const addMenuItem = (item: MenuItem) => {
    openCustomizer(item);
  };

  const confirmCustomizer = () => {
    if (!customizer) return;
    const meatRequired =
      !isChickenProduct(customizer.item) &&
      (customizer.item.category === "burger" ||
        customizer.item.category === "combo");
    const requiredCount = requiredCustomizerCount(customizer.item);
    const requiresSauce =
      customizer.item.category === "burger" || customizer.item.category === "combo";
    const requiresDrink = customizer.item.category === "combo";
    if (
      (meatRequired && customizer.meatPoints.length < requiredCount) ||
      (requiresSauce && customizer.sauces.length < requiredCount) ||
      (requiresDrink && customizer.drinks.length < requiredCount)
    ) {
      return;
    }

    for (let i = 0; i < customizer.qty; i += 1) {
      addToCart({
        id: customizer.item.id,
        name: customizer.item.name.toUpperCase(),
        price: customizer.item.price,
      });
      customizer.drinks.forEach((drinkId) => {
        const drink = DRINK_OPTIONS.find((option) => option.id === drinkId);
        const surchargeId = COMBO_DRINK_SURCHARGE_PRODUCT_ID[drinkId];
        if (drink && surchargeId && drink.comboPrice > 0) {
          addToCart({
            id: surchargeId,
            name: `${drink.label.toUpperCase()} NO COMBO`,
            price: drink.comboPrice,
          });
        }
      });
      Object.entries(customizer.extras).forEach(([extraId, quantity]) => {
        const extra = getExtraOptionsForItem(customizer.item).find(
          (option) => option.id === extraId,
        );
        if (extra) {
          for (let extraIndex = 0; extraIndex < quantity; extraIndex += 1) {
            addToCart({
              id: extra.id,
              name: extra.label.toUpperCase(),
              price: extra.price,
            });
          }
        }
      });
    }
    setCustomizer(null);
  };

  const openMemberAccess = () => {
    if (memberProfile) {
      setProfileOpen(true);
      return;
    }
    setLoginOpen(true);
  };

  const editMember = () => {
    if (memberProfile) {
      setMemberName(memberProfile.name);
      setMemberEmail(memberProfile.email ?? "");
      setMemberCpf("");
      setMemberPhone(memberProfile.phone);
      setMemberPassword("");
      setMemberPasswordConfirm("");
      setMemberBirthday(memberProfile.birthday ?? "");
      const address = memberProfile.defaultAddress ?? {};
      setMemberCep(String(address.cep ?? ""));
      setMemberStreet(String(address.street ?? ""));
      setMemberNumber(String(address.number ?? ""));
      setMemberComplement(String(address.complement ?? ""));
      setMemberNeighborhood(String(address.neighborhood ?? ""));
      setMemberCity(String(address.city ?? ""));
      setMemberReference(String(address.reference ?? ""));
    }
    setProfileOpen(false);
    setMemberAuthMode("register");
    setLoginOpen(true);
  };

  const saveMember = async () => {
    const name = memberName.trim();
    const email = memberEmail.trim().toLowerCase();
    const phone = memberPhone.trim();
    const cpfDigits = memberCpf.replace(/\D/g, "");
    const password = memberPassword.trim();
    const confirmPassword = memberPasswordConfirm.trim();
    setMemberError("");
    if (!name) {
      setMemberError("Falta preencher: nome.");
      return;
    }
    if (!email) {
      setMemberError("Falta preencher: email.");
      return;
    }
    if (!isEmail(email)) {
      setMemberError("Informe um email válido.");
      return;
    }
    if (cpfDigits.length !== 11) {
      setMemberError("Falta preencher: CPF com 11 números.");
      return;
    }
    if (phone.replace(/\D/g, "").length < 10) {
      setMemberError("Falta preencher: WhatsApp com DDD.");
      return;
    }
    if (!memberBirthday) {
      setMemberError("Falta preencher: aniversário.");
      return;
    }
    if (password.length !== 6) {
      setMemberError("Falta preencher: senha de 6 dígitos.");
      return;
    }
    if (confirmPassword.length !== 6) {
      setMemberError("Falta preencher: confirmar senha com 6 dígitos.");
      return;
    }
    if (password !== confirmPassword) {
      setMemberError("A confirmação da senha não confere.");
      return;
    }
    if (!memberCep.replace(/\D/g, "")) {
      setMemberError("Falta preencher: CEP.");
      return;
    }
    if (!memberStreet.trim()) {
      setMemberError("Falta preencher: rua.");
      return;
    }
    if (!memberNumber.trim()) {
      setMemberError("Falta preencher: número.");
      return;
    }
    if (!memberNeighborhood.trim()) {
      setMemberError("Falta preencher: bairro.");
      return;
    }
    if (!memberCity.trim()) {
      setMemberError("Falta preencher: cidade.");
      return;
    }

    setMemberSaving(true);
    try {
      const profile = await saveCustomerSession({
        name,
        email,
        cpf: cpfDigits,
        password,
        confirmPassword,
        phone,
        birthday: memberBirthday || undefined,
        cep: memberCep,
        street: memberStreet,
        number: memberNumber,
        complement: memberComplement,
        neighborhood: memberNeighborhood,
        city: memberCity,
        reference: memberReference,
      });
      setMemberProfile(profile);
      setLoginOpen(false);
    } catch {
      localStorage.removeItem(MEMBER_TOKEN_KEY);
      localStorage.removeItem(MEMBER_KEY);
      setMemberProfile(null);
      setLoginOpen(true);
      setMemberError("Não foi possível cadastrar. Confira os dados e tente novamente.");
    } finally {
      setMemberSaving(false);
    }
  };

  const loginMember = async () => {
    const login = memberLogin.trim();
    const password = loginPassword.trim();
    setMemberError("");
    if (!login) {
      setMemberError("Falta preencher: email ou CPF.");
      return;
    }
    if (password.length !== 6) {
      setMemberError("Falta preencher: senha de 6 dígitos.");
      return;
    }
    setMemberSaving(true);
    try {
      const profile = await loginCustomerSession({ login, password });
      setMemberProfile(profile);
      setLoginOpen(false);
      setMemberLogin("");
      setLoginPassword("");
    } catch {
      setMemberError("Email/CPF ou senha inválidos.");
    } finally {
      setMemberSaving(false);
    }
  };

  const logoutMember = () => {
    logoutCustomerSession();
    setMemberProfile(null);
    setMemberName("");
    setMemberEmail("");
    setMemberCpf("");
    setMemberPhone("");
    setMemberPassword("");
    setMemberPasswordConfirm("");
    setMemberAuthMode("login");
    setLoginOpen(true);
  };

  return (
    <div
      style={{
        minHeight: "100dvh",
        background: "#FFF8F2",
        color: VERDE,
        fontFamily: "'Inter', system-ui, sans-serif",
      }}
    >
      <ProductHeader
        kioskMode={kioskMode}
        cartCount={cartCount}
        onAdminTap={handleAdminTap}
        goToCart={goToCart}
        memberProfile={memberProfile}
        onOpenMember={openMemberAccess}
        onLogoutMember={logoutMember}
      />

      <main className="w-full px-0 pb-36 pt-0">
        <ProductHero
          kioskMode={kioskMode}
          featuredItem={featuredItem}
          onIdleShortcutTap={handleIdleShortcutTap}
          onAddFeatured={() => addMenuItem(featuredItem)}
        />

        {!kioskMode && (
          <MemberAccessBanner
            memberProfile={memberProfile}
            onOpen={openMemberAccess}
          />
        )}

        <CategoryTabs category={category} setCategory={setCategory} />
        <section className="mt-6 px-4">
          <div>
            <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {filteredItems.map((item) => (
                <MenuCard
                  key={item.id}
                  item={item}
                  qty={qty(item.id)}
                  builder={item.id === BURGER_ID ? builder : undefined}
                  onAdd={() => addMenuItem(item)}
                  onMinus={() => updateQty(item.id, -1)}
                />
              ))}
            </div>
          </div>
        </section>
      </main>

      <div
        className="fixed inset-x-0 bottom-0 z-50"
        style={{
          background: "rgba(255,248,242,0.94)",
          borderTop: `1px solid ${VERDE}14`,
          backdropFilter: "blur(18px)",
        }}
      >
        <div className="flex w-full items-center gap-3 px-4 py-3">
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-black uppercase tracking-widest text-black/40">
              Total do pedido
            </p>
            <p
              style={{
                color: VERDE,
                fontFamily: "'Bebas Neue','Arial Black',sans-serif",
                fontSize: "2rem",
                lineHeight: 1,
              }}
            >
              {cartCount > 0 ? fmt(cartTotal) : "R$ 0,00"}
            </p>
          </div>
          <button
            onClick={goToCart}
            disabled={cartCount === 0}
            className="flex min-h-14 items-center gap-2 rounded-2xl px-5 text-xs font-black uppercase tracking-wider disabled:opacity-35"
            style={{
              background: cartCount > 0 ? VERDE : `${VERDE}20`,
              color: cartCount > 0 ? ROSA : `${VERDE}70`,
              cursor: cartCount > 0 ? "pointer" : "default",
              border: "none",
            }}
          >
            <ShoppingBag size={17} strokeWidth={2.4} />
            Fechar pedido
          </button>
        </div>
      </div>

      <MemberModals
        loginOpen={loginOpen}
        profileOpen={profileOpen}
        memberProfile={memberProfile}
        memberName={memberName}
        setMemberName={setMemberName}
        memberEmail={memberEmail}
        setMemberEmail={setMemberEmail}
        memberCpf={memberCpf}
        setMemberCpf={setMemberCpf}
        memberPhone={memberPhone}
        setMemberPhone={setMemberPhone}
        memberPassword={memberPassword}
        setMemberPassword={setMemberPassword}
        memberPasswordConfirm={memberPasswordConfirm}
        setMemberPasswordConfirm={setMemberPasswordConfirm}
        memberLogin={memberLogin}
        setMemberLogin={setMemberLogin}
        loginPassword={loginPassword}
        setLoginPassword={setLoginPassword}
        memberAuthMode={memberAuthMode}
        setMemberAuthMode={setMemberAuthMode}
        memberBirthday={memberBirthday}
        setMemberBirthday={setMemberBirthday}
        memberCep={memberCep}
        setMemberCep={setMemberCep}
        memberStreet={memberStreet}
        setMemberStreet={setMemberStreet}
        memberNumber={memberNumber}
        setMemberNumber={setMemberNumber}
        memberComplement={memberComplement}
        setMemberComplement={setMemberComplement}
        memberNeighborhood={memberNeighborhood}
        setMemberNeighborhood={setMemberNeighborhood}
        memberCity={memberCity}
        setMemberCity={setMemberCity}
        memberReference={memberReference}
        setMemberReference={setMemberReference}
        memberError={memberError}
        memberSaving={memberSaving}
        memberProgress={memberProgress}
        savedDelivery={savedDelivery}
        saveMember={saveMember}
        loginMember={loginMember}
        editMember={editMember}
        logoutMember={logoutMember}
        closeLogin={() => {
          if (memberProfile) setLoginOpen(false);
        }}
        closeProfile={() => setProfileOpen(false)}
        activeOrder={activeOrder}
        onOpenActiveOrder={onOpenActiveOrder}
        onRepeatOrder={onRepeatOrder}
      />

      <AnimatePresence>
        {customizer && (
          <ProductCustomizer
            state={customizer}
            setState={setCustomizer}
            onConfirm={confirmCustomizer}
          />
        )}

      </AnimatePresence>

      <AnimatePresence>
        {configurationUnavailable && (
          <motion.div
            initial={{ opacity: 0, y: 12, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            className="pointer-events-none fixed inset-x-4 top-6 z-[100] flex justify-center"
          >
            <div
              className="rounded-2xl px-6 py-4 text-center text-sm font-black uppercase tracking-wide shadow-2xl"
              style={{ background: VERDE, color: ROSA }}
            >
              Configuração não habilitada
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

