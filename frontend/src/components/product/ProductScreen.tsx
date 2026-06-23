import { useEffect, useMemo, useRef, useState, type ElementType } from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  Bell,
  ChefHat,
  Loader2,
  Mail,
  Minus,
  Plus,
  ShoppingBag,
  Sparkles,
  UserRound,
  X,
  Clock3,
  Home,
  PackageSearch,
} from "lucide-react";
import { CartItem, Order } from "@/types/order";
import { ROSA, VERDE } from "@/utils/theme";
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
  readMemberProfile,
  readSavedDelivery,
  requiredCustomizerCount,
} from "./shared";
import {
  loginCustomerSession,
  loadCustomerSession,
  logoutCustomerSession,
  requestCustomerPasswordRecovery,
  resetCustomerPassword,
  saveCustomerSession,
  updateCustomerProfile,
} from "@/services/customerSession";
import {
  BurgerBuilder,
  MenuCard,
  ProductDetailModal,
  ProductCustomizer,
} from "./ProductParts";
import { MemberModals } from "./MemberModals";
import {
  CategoryTabs,
  MemberAccessBanner,
  ProductHeader,
  ProductHero,
} from "./ProductHomeSections";
import { MobileMenuExperience } from "./MobileMenuExperience";
import { MemberNotification } from "./notifications";

const API_URL = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ?? "";

function hasRequiredCustomerProfile(profile: MemberProfile | null) {
  return Boolean(
    profile?.name?.trim() &&
      profile.phone?.replace(/\D/g, "").length >= 10 &&
      profile.hasPassword !== false,
  );
}

function comboPotatoComponent(item: MenuItem) {
  return requiredCustomizerCount(item) > 1
    ? "Batata Frita 200g"
    : "Batata Frita 100g";
}

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
  notifications?: MemberNotification[];
  unreadNotificationCount?: number;
  onReadNotifications?: () => void;
  onOpenActiveOrder?: (orderId?: string) => void;
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
  notifications = [],
  unreadNotificationCount = 0,
  onReadNotifications,
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
  const [detailItem, setDetailItem] = useState<MenuItem | null>(null);
  const [loginOpen, setLoginOpen] = useState(() => {
    if (kioskMode || typeof window === "undefined") return false;
    return false;
  });
  const [profileOpen, setProfileOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [favoritesOpen, setFavoritesOpen] = useState(false);
  const [featuredProductId, setFeaturedProductId] = useState("chicken-super-combo");
  const [operatingNow, setOperatingNow] = useState(true);
  const [operatingHoursSummary, setOperatingHoursSummary] = useState("");
  const [operatingHoursMessage, setOperatingHoursMessage] = useState("");
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
  const filteredItems = useMemo(() => {
    if (category === "chicken") {
      return MENU_ITEMS.filter(
        (item) => item.category === "burger" && isChickenProduct(item),
      );
    }
    if (category === "bacon") {
      return MENU_ITEMS.filter((item) => {
        const text = `${item.id} ${item.name} ${item.tags.join(" ")}`.toLowerCase();
        return item.category === "burger" && text.includes("bacon");
      });
    }
    if (category === "burger") {
      return MENU_ITEMS.filter(
        (item) =>
          item.category === "burger" &&
          !isChickenProduct(item) &&
          !`${item.id} ${item.name} ${item.tags.join(" ")}`.toLowerCase().includes("bacon"),
      );
    }
    return MENU_ITEMS.filter((item) => item.category === category);
  }, [category]);
  const featuredItem =
    MENU_ITEMS.find((item) => item.id === featuredProductId) ??
    MENU_ITEMS.find((item) => item.id === "chicken-super-combo") ??
    MENU_ITEMS[0];
  const savedDelivery = readSavedDelivery();
  const kioskMobLoggedIn =
    String(memberProfile?.name ?? "")
      .trim()
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, "-")
      .replace(/-+/g, "-") === "KIOSK-MOB";
  const customerTokenAvailable =
    kioskMode ||
    (typeof window !== "undefined" && Boolean(localStorage.getItem(MEMBER_TOKEN_KEY)));
  const customerProfileReady =
    kioskMode || (customerTokenAvailable && hasRequiredCustomerProfile(memberProfile));

  useEffect(() => {
    if (kioskMode) return;
    void loadCustomerSession().then((profile) => {
      const hasToken =
        typeof window !== "undefined" && localStorage.getItem(MEMBER_TOKEN_KEY);
      if (hasToken && hasRequiredCustomerProfile(profile)) {
        setMemberProfile(profile);
        setLoginOpen(false);
        return;
      }
      setMemberProfile(profile ?? null);
      setMemberAuthMode("register");
      setLoginOpen(true);
    });
  }, [kioskMode]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!API_URL) return;
    fetch(`${API_URL}/settings/public`, {
      cache: "no-store",
    })
      .then((response) => (response.ok ? response.json() : null))
      .then((settings) => {
        if (settings?.featuredProductId) {
          setFeaturedProductId(String(settings.featuredProductId));
        }
        setOperatingNow(settings?.operatingNow !== false);
        setOperatingHoursSummary(String(settings?.operatingHoursSummary ?? ""));
        setOperatingHoursMessage(String(settings?.operatingHoursMessage ?? ""));
      })
      .catch(() => undefined);
  }, []);

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
    if (!kioskMobLoggedIn || !onOpenIdleScreen) return;
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

  const requireCustomerProfile = () => {
    if (customerProfileReady) return true;
    if (memberProfile) {
      setMemberName(memberProfile.name ?? "");
      setMemberEmail(memberProfile.email ?? "");
      setMemberPhone(memberProfile.phone ?? "");
      setMemberBirthday(memberProfile.birthday ?? "");
    }
    setMemberAuthMode("register");
    setMemberError("Para pedir, cadastre nome, WhatsApp e senha.");
    setLoginOpen(true);
    return false;
  };

  const openCustomizer = (item: MenuItem) => {
    if (!requireCustomerProfile()) return;
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

  const quickAddMenuItem = (item: MenuItem) => {
    if (!requireCustomerProfile()) return;
    const components =
      item.category === "combo" || item.category === "burger"
        ? [
            item.name,
            ...(item.category === "combo"
              ? ["Guaraná Zero", comboPotatoComponent(item)]
              : []),
            "Maionese Alho Frito",
          ]
        : undefined;

    addToCart({
      id:
        item.category === "combo" || item.category === "burger"
          ? `quick-${item.id}`
          : item.id,
      productId: item.id,
      name: item.name.toUpperCase(),
      price: item.price,
      components,
    });
  };

  const handleGoToCart = () => {
    if (!requireCustomerProfile()) return;
    goToCart();
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
      const drinkLabels = customizer.drinks
        .map((drinkId) => DRINK_OPTIONS.find((option) => option.id === drinkId)?.label)
        .filter(Boolean) as string[];
      const components = [
        customizer.item.name,
        ...drinkLabels,
        ...(customizer.item.category === "combo"
          ? [comboPotatoComponent(customizer.item)]
          : []),
        ...customizer.sauces,
      ];
      addToCart({
        id: `${customizer.item.id}-${Date.now()}-${i}`,
        productId: customizer.item.id,
        name: customizer.item.name.toUpperCase(),
        price: customizer.item.price,
        components,
        note: customizer.note.trim() || undefined,
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
    if (memberProfile && hasRequiredCustomerProfile(memberProfile)) {
      setProfileOpen(true);
      return;
    }
    setMemberAuthMode("register");
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
    }
    setProfileOpen(false);
    setMemberAuthMode("register");
    setLoginOpen(true);
  };

  const applyMemberProfileUpdate = (profile: MemberProfile) => {
    setMemberProfile(profile);
    setMemberName(profile.name ?? "");
    setMemberEmail(profile.email ?? "");
    setMemberPhone(profile.phone ?? "");
    setMemberBirthday(profile.birthday ?? "");
  };

  const openHistory = () => {
    if (!hasRequiredCustomerProfile(memberProfile)) {
      setLoginOpen(true);
      return;
    }
    setHistoryOpen(true);
  };

  const openNotifications = () => {
    if (!hasRequiredCustomerProfile(memberProfile)) {
      setLoginOpen(true);
      return;
    }
    onReadNotifications?.();
    setNotificationsOpen(true);
  };

  const saveMember = async () => {
    const name = memberName.trim();
    const email = memberEmail.trim().toLowerCase();
    const phone = memberPhone.trim();
    const password = memberPassword.trim();
    const confirmPassword = memberPasswordConfirm.trim();
    setMemberError("");
    if (!name) {
      setMemberError("Falta preencher: nome.");
      return;
    }
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setMemberError("Informe um email válido.");
      return;
    }
    if (phone.replace(/\D/g, "").length < 10) {
      setMemberError("Falta preencher: WhatsApp com DDD.");
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
    setMemberSaving(true);
    try {
      const profile = await saveCustomerSession({
        name,
        email: email || undefined,
        password,
        confirmPassword,
        phone,
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
      setMemberError("Falta preencher: telefone, email ou CPF.");
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
      setMemberError("Telefone, email, CPF ou senha inválidos.");
    } finally {
      setMemberSaving(false);
    }
  };

  const requestPasswordRecovery = async (login: string) => {
    setMemberError("");
    if (!login.trim()) {
      setMemberError("Informe telefone ou e-mail para recuperar.");
      return null;
    }
    setMemberSaving(true);
    try {
      return await requestCustomerPasswordRecovery({ login: login.trim() });
    } catch {
      setMemberError("Não encontrei esse cadastro. Fale com o suporte.");
      return null;
    } finally {
      setMemberSaving(false);
    }
  };

  const resetMemberPassword = async (
    login: string,
    code: string,
    password: string,
    confirmPassword: string,
  ) => {
    setMemberError("");
    if (code.trim().length !== 6 || password.trim().length !== 6 || password !== confirmPassword) {
      setMemberError("Confira o código e a nova senha de 6 dígitos.");
      return false;
    }
    setMemberSaving(true);
    try {
      const profile = await resetCustomerPassword({
        login: login.trim(),
        code: code.trim(),
        password: password.trim(),
        confirmPassword: confirmPassword.trim(),
      });
      setMemberProfile(profile);
      setLoginOpen(false);
      return true;
    } catch {
      setMemberError("Código inválido ou expirado.");
      return false;
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
        background: "#fff",
        color: VERDE,
        fontFamily: "'Inter', system-ui, sans-serif",
      }}
    >
      {!kioskMode && (
        <MobileMenuExperience
          items={MENU_ITEMS}
          cartCount={cartCount}
          cartTotal={cartTotal}
          memberProfile={memberProfile}
          notificationCount={unreadNotificationCount}
          onOpenMember={openMemberAccess}
          onOpenNotifications={openNotifications}
          onQuickAdd={quickAddMenuItem}
          onOpenDetails={setDetailItem}
          goToCart={handleGoToCart}
        />
      )}

      <div className={!kioskMode ? "hidden md:block" : undefined}>
        <ProductHeader
          kioskMode={kioskMode}
          cartCount={cartCount}
          onAdminTap={handleAdminTap}
          goToCart={handleGoToCart}
          memberProfile={memberProfile}
          notificationCount={unreadNotificationCount}
          onOpenMember={openMemberAccess}
          onOpenNotifications={openNotifications}
          onLogoutMember={logoutMember}
        />

        <main className="w-full px-0 pb-36 pt-0">
          <ProductHero
            kioskMode={kioskMode}
            featuredItem={featuredItem}
            onIdleShortcutTap={handleIdleShortcutTap}
            onAddFeatured={() => addMenuItem(featuredItem)}
            operatingNow={operatingNow}
            operatingHoursSummary={operatingHoursSummary}
            operatingHoursMessage={operatingHoursMessage}
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
                    onOpenDetails={() => setDetailItem(item)}
                  />
                ))}
              </div>
            </div>
          </section>
        </main>

        <div
          className="fixed inset-x-0 bottom-0 z-50"
          style={{
            background: "rgba(255,255,255,0.96)",
            borderTop: `1px solid ${VERDE}14`,
            backdropFilter: "blur(18px)",
          }}
        >
          {cartCount > 0 && (
            <div className="flex w-full items-center gap-3 px-4 pt-3">
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-black uppercase tracking-widest text-black/40">
                  Total do pedido
                </p>
                <p
                  style={{
                    color: VERDE,
                    fontFamily: "'Bebas Neue','Arial Black',sans-serif",
                    fontSize: "1.75rem",
                    lineHeight: 1,
                  }}
                >
                  {fmt(cartTotal)}
                </p>
              </div>
              <button
                onClick={handleGoToCart}
                className="flex min-h-12 items-center gap-2 rounded-2xl px-5 text-xs font-black uppercase tracking-wider"
                style={{ background: VERDE, color: ROSA, border: "none" }}
              >
                <ShoppingBag size={17} strokeWidth={2.4} />
                Fechar pedido
              </button>
            </div>
          )}
          <div className="grid grid-cols-5 gap-1 px-2 pb-2 pt-2">
            <BottomNavButton
              icon={PackageSearch}
              label="Pedidos"
              active={Boolean(activeOrder) || kioskMobLoggedIn}
              onClick={() => (activeOrder || kioskMobLoggedIn ? onOpenActiveOrder?.() : openHistory())}
            />
            <BottomNavButton icon={Clock3} label="Histórico" onClick={openHistory} />
            <BottomNavButton icon={Home} label="Início" active onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} />
            <BottomNavButton
              icon={Bell}
              label="Avisos"
              badge={unreadNotificationCount}
              active={unreadNotificationCount > 0}
              onClick={openNotifications}
            />
            <BottomNavButton icon={UserRound} label="Perfil" onClick={openMemberAccess} />
          </div>
        </div>
      </div>

      <MemberModals
        loginOpen={loginOpen}
        profileOpen={profileOpen}
        historyOpen={historyOpen}
        notificationsOpen={notificationsOpen}
        favoritesOpen={favoritesOpen}
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
        savedDelivery={savedDelivery}
        saveMember={saveMember}
        loginMember={loginMember}
        requestPasswordRecovery={requestPasswordRecovery}
        resetMemberPassword={resetMemberPassword}
        editMember={editMember}
        updateMemberProfile={async (payload) => {
          const profile = await updateCustomerProfile(payload);
          applyMemberProfileUpdate(profile);
          return profile;
        }}
        logoutMember={logoutMember}
        loginRequired={!customerProfileReady}
        closeLogin={() => {
          if (!customerProfileReady) return;
          setLoginOpen(false);
        }}
        closeProfile={() => setProfileOpen(false)}
        closeHistory={() => setHistoryOpen(false)}
        closeNotifications={() => setNotificationsOpen(false)}
        closeFavorites={() => setFavoritesOpen(false)}
        activeOrder={activeOrder}
        notifications={notifications}
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
        {detailItem && (
          <ProductDetailModal
            item={detailItem}
            onClose={() => setDetailItem(null)}
            onAdd={() => {
              setDetailItem(null);
              addMenuItem(detailItem);
            }}
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

function BottomNavButton({
  icon: Icon,
  label,
  active,
  badge = 0,
  onClick,
}: {
  icon: ElementType;
  label: string;
  active?: boolean;
  badge?: number;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex min-h-14 flex-col items-center justify-center gap-1 rounded-2xl text-[10px] font-black"
      style={{
        color: active ? VERDE : `${VERDE}75`,
        background: active ? `${ROSA}55` : "transparent",
      }}
    >
      <span className="relative">
        <Icon size={18} strokeWidth={2.4} />
        {badge > 0 && (
          <span
            className="absolute -right-3 -top-3 flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-[9px] font-black"
            style={{ background: ROSA, color: VERDE, border: "2px solid #fff" }}
          >
            {badge > 99 ? "99+" : badge}
          </span>
        )}
      </span>
      <span>{label}</span>
    </button>
  );
}

