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
import { MenuItem, ProductCategory } from "@/features/catalog/types";
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
  SWEET_BOX_REQUIRED_COUNT,
  buildBurger,
  fmt,
  getSweetOptionsForItem,
  getExtraOptionsForItem,
  imageSrc,
  isChickenProduct,
  isNuggetsProduct,
  isSpecialOfferOnlyProduct,
  isSweetBoxProduct,
  readMemberProfile,
  readSavedDelivery,
  requiredCustomizerCount,
  sortCatalogItems,
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
import {
  DEFAULT_SPECIAL_OFFER_SETTINGS,
  PromoCard,
  SpecialOfferSettings,
  normalizePresentationSettings,
  normalizePromoCards,
  normalizeSpecialOfferSettings,
} from "@/components/order/checkout";
import { MobileMenuExperience } from "./MobileMenuExperience";
import { MemberNotification } from "./notifications";
import { SoldOutAlertModal, SoldOutBanner, SOLD_OUT_MESSAGE } from "./SoldOutNotice";

const API_URL = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") || "/backend";
const SPECIAL_OFFER_SESSION_KEY = "menfis_special_offer_seen";
const DEFAULT_FEATURED_PRODUCT_ID = DEFAULT_SPECIAL_OFFER_SETTINGS.productId;
const TRIPLE_COMBO_IMAGE = "/menu/supercombomnfis.png";
const PUBLIC_SETTINGS_CACHE_KEY = "menfis_public_settings_cache_v2";
const PRICING_ROWS_CACHE_KEY = "menfis_pricing_rows_cache_v2";
const CUSTOMIZER_ADDON_IDS = new Set([
  "extra-carne",
  "extra-frango",
  "extra-queijo",
  "extra-ovo",
  "extra-bacon",
  "extra-cheddar",
  "extra-maionese-barbecue",
  "extra-maionese-alho-frito",
]);

function hasRequiredCustomerProfile(profile: MemberProfile | null) {
  return Boolean(
    profile?.name?.trim() &&
      profile.phone?.replace(/\D/g, "").length >= 10 &&
      profile.hasPassword !== false,
  );
}

function readJsonCache<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeJsonCache(key: string, value: unknown) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Cache is best-effort; never block the menu because storage is full or unavailable.
  }
}

function applyPricingToMenu(rows: Array<Record<string, unknown>>) {
  const defaults = new Map(MENU_ITEMS.map((item) => [item.id, item]));
  return rows
    .filter((row) => row.active !== false)
    .map((row) => {
      const id = String(row.id ?? "");
      const item = defaults.get(id);
      if (!item) return pricingRowToMenuItem(row);
      const salePrice = Number(row.salePrice ?? row.sale_price ?? item.price);
      const originalPrice = Number(row.originalPrice ?? row.original_price ?? item.originalPrice ?? 0);
      const imageUrl = canonicalProductImage(item.id, String(row.imageUrl ?? row.image_url ?? ""));
      const name = String(row.name ?? "").trim();
      const notes = String(row.notes ?? "").trim();
      const categoryLabel = String(row.category ?? "").trim();
      const category = pricingKindToMenuCategory(String(row.kind ?? ""), categoryLabel);
      const nextCategory =
        categoryLabel || row.kind ? category : item.category;
      const nextEyebrow = categoryLabel || labelCategory(nextCategory);
      const nextItem: MenuItem = {
        ...item,
        name: name || item.name,
        eyebrow: nextEyebrow,
        desc: notes || `${name || item.name} cadastrado em Custos e Precificacao.`,
        price: Number.isFinite(salePrice) && salePrice > 0 ? salePrice : item.price,
        originalPrice:
          Number.isFinite(originalPrice) && originalPrice > salePrice
            ? originalPrice
            : undefined,
        image: imageUrl || "/logo_M.jpeg",
        tags: [nextEyebrow].filter(Boolean),
        category: nextCategory,
      };
      return nextItem;
    })
    .filter((item): item is MenuItem => Boolean(item));
}

function pricingRowToMenuItem(row: Record<string, unknown>): MenuItem | null {
  const id = String(row.id ?? "");
  const name = String(row.name ?? "").trim();
  const salePrice = Number(row.salePrice ?? row.sale_price ?? 0);
  if (!id || !name || !Number.isFinite(salePrice) || salePrice <= 0) return null;
  const originalPrice = Number(row.originalPrice ?? row.original_price ?? 0);
  const kind = String(row.kind ?? "");
  const categoryLabel = String(row.category ?? "").trim();
  const category = pricingKindToMenuCategory(kind, categoryLabel);
  return {
    id,
    name,
    eyebrow: categoryLabel || labelCategory(category),
    desc: String(row.notes ?? "").trim() || `${name} cadastrado em Custos e Precificacao.`,
    price: salePrice,
    originalPrice: Number.isFinite(originalPrice) && originalPrice > salePrice ? originalPrice : undefined,
    image: canonicalProductImage(id, String(row.imageUrl ?? row.image_url ?? "")),
    tags: [categoryLabel || labelCategory(category)].filter(Boolean),
    category,
  };
}

function canonicalProductImage(id: string, imageUrl: string) {
  return id === DEFAULT_FEATURED_PRODUCT_ID ? TRIPLE_COMBO_IMAGE : imageUrl;
}

function pricingKindToMenuCategory(kind: string, categoryLabel = ""): ProductCategory {
  if (kind === "combo") return "combo";
  if (kind === "drink") return "bebida";
  if (categoryLabel.toLowerCase().includes("sweet")) return "sweet";
  if (
    categoryLabel.toLowerCase().includes("galeria de fritas") ||
    categoryLabel.toLowerCase().includes("fries") ||
    categoryLabel.toLowerCase().includes("batata")
  ) return "fries";
  if (kind === "side") return "extra";
  return "burger";
}

function labelCategory(category: ProductCategory) {
  if (category === "combo") return "Pedido completo";
  if (category === "bebida") return "Bebida";
  if (category === "extra") return "Extra";
  if (category === "fries") return "Galeria de Fritas";
  if (category === "sweet") return "Sweet";
  return "Burger";
}

function comboPotatoComponent(item: MenuItem) {
  return requiredCustomizerCount(item) > 1
    ? "Batata Frita 200g"
    : "Batata Frita 100g";
}

function freshApiUrl(path: string) {
  const separator = path.includes("?") ? "&" : "?";
  return `${API_URL}${path}${separator}_=${Date.now()}`;
}

function preloadClientImages(srcs: Array<string | undefined>) {
  if (typeof window === "undefined") return;
  srcs
    .map((src) => String(src ?? "").trim())
    .filter(Boolean)
    .forEach((src) => {
      const image = new window.Image();
      image.decoding = "async";
      image.src = src;
    });
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
  const [featuredProductId, setFeaturedProductId] = useState("");
  const [featuredImage, setFeaturedImage] = useState("");
  const [featuredTitle, setFeaturedTitle] = useState("");
  const [heroSettingsLoaded, setHeroSettingsLoaded] = useState(!API_URL);
  const [promoCards, setPromoCards] = useState<PromoCard[]>([]);
  const [specialOffer, setSpecialOffer] = useState<SpecialOfferSettings>(() =>
    normalizeSpecialOfferSettings(null),
  );
  const [specialOfferOpen, setSpecialOfferOpen] = useState(false);
  const [operatingNow, setOperatingNow] = useState(true);
  const [operatingHoursSummary, setOperatingHoursSummary] = useState("");
  const [operatingHoursMessage, setOperatingHoursMessage] = useState("");
  const [soldOutEnabled, setSoldOutEnabled] = useState(false);
  const [soldOutMessage, setSoldOutMessage] = useState(SOLD_OUT_MESSAGE);
  const [catalogItems, setCatalogItems] = useState<MenuItem[]>(() =>
    API_URL ? [] : MENU_ITEMS,
  );
  const [catalogLoaded, setCatalogLoaded] = useState(!API_URL);
  const [soldOutAlertOpen, setSoldOutAlertOpen] = useState(false);
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
  const [quickQrOpen, setQuickQrOpen] = useState(false);
  const [quickQrSeconds, setQuickQrSeconds] = useState(45);
  const adminTapTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const configurationTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const adminTapCountRef = useRef(0);
  const idleShortcutTapCountRef = useRef(0);
  const idleShortcutTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const cartCount = cart.reduce((s, i) => s + i.qty, 0);
  const cartTotal = cart.reduce((s, i) => s + i.price * i.qty, 0);
  const filteredItems = useMemo(() => {
    const visibleCatalogItems = catalogItems.filter(
      (item) => !isSpecialOfferOnlyProduct(item),
    );
    let nextItems: MenuItem[];
    if (category === "chicken") {
      nextItems = visibleCatalogItems.filter(
        (item) => item.category === "burger" && isChickenProduct(item),
      );
    } else if (category === "bacon") {
      nextItems = visibleCatalogItems.filter((item) => {
        const text = `${item.id} ${item.name} ${item.tags.join(" ")}`.toLowerCase();
        return item.category === "burger" && text.includes("bacon");
      });
    } else if (category === "burger") {
      nextItems = visibleCatalogItems.filter(
        (item) =>
          item.category === "burger" &&
          !isChickenProduct(item) &&
          !`${item.id} ${item.name} ${item.tags.join(" ")}`.toLowerCase().includes("bacon"),
      );
    } else if (category === "extras") {
      nextItems = visibleCatalogItems.filter((item) => item.category === "extra" || item.category === "bebida");
    } else if (category === "fries") {
      nextItems = visibleCatalogItems.filter((item) => item.category === "fries");
    } else if (category === "sweet") {
      nextItems = visibleCatalogItems.filter((item) => item.category === "sweet");
    } else {
      nextItems = visibleCatalogItems.filter((item) => item.category === category);
    }
    return sortCatalogItems(nextItems);
  }, [catalogItems, category]);
  const featuredItem =
    (featuredProductId ? catalogItems.find((item) => item.id === featuredProductId) : undefined) ??
    (heroSettingsLoaded ? catalogItems.find((item) => item.id === DEFAULT_FEATURED_PRODUCT_ID) : undefined) ??
    catalogItems[0] ??
    MENU_ITEMS.find((item) => item.id === DEFAULT_FEATURED_PRODUCT_ID) ??
    MENU_ITEMS[0];
  const savedDelivery = readSavedDelivery();
  const kioskMobLoggedIn =
    String(memberProfile?.name ?? "")
      .trim()
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, "-")
      .replace(/-+/g, "-") === "KIOSK-MOB";
  const applyPublicSettings = (settings: Record<string, unknown> | null | undefined) => {
    setFeaturedProductId(
      settings?.featuredProductId
        ? String(settings.featuredProductId)
        : DEFAULT_FEATURED_PRODUCT_ID,
    );
    const normalizedPresentation = normalizePresentationSettings(settings?.presentation);
    const normalizedSpecialOffer = normalizeSpecialOfferSettings(settings?.specialOffer);
    setFeaturedImage(normalizedPresentation.featuredImage ?? "");
    setFeaturedTitle(normalizedPresentation.featuredTitle ?? "");
    setPromoCards(normalizePromoCards(settings?.promoCards));
    setSpecialOffer(normalizedSpecialOffer);
    preloadClientImages([
      normalizedPresentation.featuredImage,
      featuredItem?.image ? imageSrc(featuredItem.image) : undefined,
      normalizedSpecialOffer.image,
    ]);
    setOperatingNow(settings?.operatingNow !== false);
    setOperatingHoursSummary(String(settings?.operatingHoursSummary ?? ""));
    setOperatingHoursMessage(String(settings?.operatingHoursMessage ?? ""));
    setSoldOutEnabled(settings?.soldOutActive === true);
    setSoldOutMessage(String(settings?.soldOutMessage ?? SOLD_OUT_MESSAGE));
  };
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
    });
  }, [kioskMode]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!API_URL) {
      setHeroSettingsLoaded(true);
      return;
    }
    let cancelled = false;
    const cachedSettings = readJsonCache<Record<string, unknown> | null>(
      PUBLIC_SETTINGS_CACHE_KEY,
      null,
    );
    if (cachedSettings) {
      applyPublicSettings(cachedSettings);
    }
    fetch(freshApiUrl("/settings/public"), {
      cache: "no-store",
      headers: {
        "Cache-Control": "no-cache",
        Pragma: "no-cache",
      },
    })
      .then((response) => (response.ok ? response.json() : null))
      .then((settings) => {
        if (cancelled) return;
        if (settings) {
          writeJsonCache(PUBLIC_SETTINGS_CACHE_KEY, settings);
        }
        applyPublicSettings(settings);
      })
      .catch(() => undefined)
      .finally(() => {
        if (!cancelled) {
          setHeroSettingsLoaded(true);
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    preloadClientImages([
      featuredImage,
      featuredItem?.image ? imageSrc(featuredItem.image) : undefined,
    ]);
  }, [featuredImage, featuredItem?.id, featuredItem?.image]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!heroSettingsLoaded || !specialOffer.enabled) return;
    preloadClientImages([specialOffer.image]);
    const sessionKey = specialOfferSessionKey(specialOffer, kioskMode);
    if (specialOffer.oncePerSession && sessionStorage.getItem(sessionKey) === "1") return;
    const timer = window.setTimeout(() => {
      if (specialOffer.oncePerSession) {
        sessionStorage.setItem(sessionKey, "1");
      }
      setSpecialOfferOpen(true);
    }, 120);
    return () => window.clearTimeout(timer);
  }, [
    heroSettingsLoaded,
    kioskMode,
    specialOffer.enabled,
    specialOffer.oncePerSession,
    specialOffer.productId,
    specialOffer.image,
    specialOffer.title,
  ]);

  useEffect(() => {
    if (typeof window === "undefined" || !API_URL) return;
    setCatalogLoaded(false);
    const cachedRows = readJsonCache<Array<Record<string, unknown>>>(
      PRICING_ROWS_CACHE_KEY,
      [],
    );
    if (cachedRows.length) {
      const cachedItems = applyPricingToMenu(cachedRows);
      setCatalogItems(cachedItems);
      preloadClientImages(cachedItems.map((item) => imageSrc(item.image)));
    }
    fetch(freshApiUrl("/pricing"), {
      cache: "no-store",
      headers: {
        "Cache-Control": "no-cache",
        Pragma: "no-cache",
      },
    })
      .then((response) => (response.ok ? response.json() : []))
      .then((rows) => {
        if (Array.isArray(rows)) {
          writeJsonCache(PRICING_ROWS_CACHE_KEY, rows);
          const nextItems = applyPricingToMenu(rows);
          setCatalogItems(nextItems);
          preloadClientImages(nextItems.map((item) => imageSrc(item.image)));
        }
      })
      .catch(() => {
        if (!cachedRows.length) setCatalogItems([]);
      })
      .finally(() => setCatalogLoaded(true));
  }, []);

  useEffect(() => {
    if (!quickQrOpen) return;
    setQuickQrSeconds(45);
    const countdown = window.setInterval(() => {
      setQuickQrSeconds((current) => {
        if (current <= 1) {
          window.clearInterval(countdown);
          setQuickQrOpen(false);
          return 0;
        }
        return current - 1;
      });
    }, 1000);

    return () => window.clearInterval(countdown);
  }, [quickQrOpen]);

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

    if (!kioskMode && adminTapCountRef.current === 3) {
      setQuickQrOpen(true);
    }

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
    if (!onOpenIdleScreen) return;
    if (kioskMode && !kioskMobLoggedIn) return;
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

  const quickAddMenuItem = (item: MenuItem) => {
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
    goToCart();
  };

  const closeSpecialOffer = () => {
    if (specialOffer.oncePerSession && typeof window !== "undefined") {
      sessionStorage.setItem(specialOfferSessionKey(specialOffer, kioskMode), "1");
    }
    setSpecialOfferOpen(false);
  };

  const addSpecialOffer = () => {
    const baseItem =
      catalogItems.find((item) => item.id === specialOffer.productId) ??
      featuredItem;
    closeSpecialOffer();
    openCustomizer({
      ...baseItem,
      name: specialOffer.title || baseItem.name,
      desc: specialOffer.description || baseItem.desc,
      price: specialOffer.price || baseItem.price,
      image: specialOffer.image || baseItem.image,
      originalPrice:
        baseItem.originalPrice && baseItem.originalPrice > specialOffer.price
          ? baseItem.originalPrice
          : undefined,
    });
  };

  const viewSpecialOfferMenu = () => {
    closeSpecialOffer();
    window.setTimeout(() => {
      document
        .getElementById("menfis-products")
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 50);
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
    const requiresFreeMayo = isNuggetsProduct(customizer.item);
    const requiresSweetBox = isSweetBoxProduct(customizer.item);
    const sweetCount = Object.values(customizer.extras).reduce((sum, quantity) => sum + quantity, 0);
    const sauceRequiredCount = requiresFreeMayo ? 1 : requiredCount;
    const requiresDrink = customizer.item.category === "combo";
    if (
      (requiresSweetBox && sweetCount !== SWEET_BOX_REQUIRED_COUNT) ||
      (meatRequired && customizer.meatPoints.length < requiredCount) ||
      (!requiresSweetBox && (requiresSauce || requiresFreeMayo) &&
        customizer.sauces.length < sauceRequiredCount) ||
      (requiresDrink && customizer.drinks.length < requiredCount)
    ) {
      return;
    }

    for (let i = 0; i < customizer.qty; i += 1) {
      const selectedSweets = Object.entries(customizer.extras)
        .map(([sweetId, quantity]) => ({
          quantity,
          sweet: getSweetOptionsForItem(customizer.item).find((option) => option.id === sweetId),
        }))
        .filter(
          (entry): entry is {
            quantity: number;
            sweet: ReturnType<typeof getSweetOptionsForItem>[number];
          } => Boolean(entry.sweet) && entry.quantity > 0,
        );
      const sweetLabels = selectedSweets.map(({ sweet, quantity }) =>
        quantity > 1 ? `${quantity}x ${sweet.label}` : sweet.label,
      );
      const sweetPremiumTotal = selectedSweets.reduce(
        (sum, { sweet, quantity }) => sum + sweet.price * quantity,
        0,
      );
      const drinkLabels = customizer.drinks
        .map((drinkId) => DRINK_OPTIONS.find((option) => option.id === drinkId)?.label)
        .filter(Boolean) as string[];
      const selectedExtras = requiresSweetBox ? [] : Object.entries(customizer.extras)
        .map(([extraId, quantity]) => ({
          quantity,
          extra: getExtraOptionsForItem(customizer.item).find(
            (option) => option.id === extraId,
          ),
        }))
        .filter(
          (entry): entry is {
            quantity: number;
            extra: NonNullable<ReturnType<typeof getExtraOptionsForItem>[number]>;
          } => Boolean(entry.extra) && entry.quantity > 0,
        );
      const addonIds = selectedExtras.flatMap(({ extra, quantity }) =>
        CUSTOMIZER_ADDON_IDS.has(extra.id)
          ? Array.from({ length: quantity }, () => extra.id)
          : [],
      );
      const addonLabels = selectedExtras
        .filter(({ extra }) => CUSTOMIZER_ADDON_IDS.has(extra.id))
        .map(({ extra, quantity }) =>
          quantity > 1 ? `${quantity}x ${extra.label}` : extra.label,
        );
      const components = [
        customizer.item.name,
        ...drinkLabels,
        ...(customizer.item.category === "combo"
          ? [comboPotatoComponent(customizer.item)]
          : []),
        ...customizer.sauces,
        ...sweetLabels,
        ...addonLabels,
      ];
      addToCart({
        id: `${customizer.item.id}-${Date.now()}-${i}`,
        productId: customizer.item.id,
        name: customizer.item.name.toUpperCase(),
        price:
          customizer.item.price +
          sweetPremiumTotal +
          selectedExtras
            .filter(({ extra }) => CUSTOMIZER_ADDON_IDS.has(extra.id))
            .reduce((sum, { extra, quantity }) => sum + extra.price * quantity, 0),
        components,
        addonIds,
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
      selectedExtras.forEach(({ extra, quantity }) => {
        if (CUSTOMIZER_ADDON_IDS.has(extra.id)) return;
        for (let extraIndex = 0; extraIndex < quantity; extraIndex += 1) {
          addToCart({
            id: extra.id,
            productId: extra.id,
            name: extra.label.toUpperCase(),
            price: extra.price,
          });
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
          items={catalogItems}
          cartCount={cartCount}
          cartTotal={cartTotal}
          featuredItem={featuredItem}
          featuredImage={featuredImage}
          featuredTitle={featuredTitle}
          heroReady={heroSettingsLoaded}
          promoCards={promoCards}
          memberProfile={memberProfile}
          notificationCount={unreadNotificationCount}
          onOpenMember={openMemberAccess}
          onOpenNotifications={openNotifications}
          onQuickAdd={quickAddMenuItem}
          onOpenDetails={setDetailItem}
          goToCart={handleGoToCart}
          soldOutEnabled={soldOutEnabled}
          soldOutMessage={soldOutMessage}
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
            featuredImage={featuredImage}
            featuredTitle={featuredTitle}
            heroReady={heroSettingsLoaded}
            onIdleShortcutTap={handleIdleShortcutTap}
            onAddFeatured={() => addMenuItem(featuredItem)}
            operatingNow={operatingNow}
            operatingHoursSummary={operatingHoursSummary}
            operatingHoursMessage={operatingHoursMessage}
          />

          {!kioskMode && soldOutEnabled && (
            <SoldOutBanner
              message={soldOutMessage}
              onNotify={() => setSoldOutAlertOpen(true)}
            />
          )}

          {!kioskMode && (
            <MemberAccessBanner
              memberProfile={memberProfile}
              onOpen={openMemberAccess}
            />
          )}

          <CategoryTabs category={category} setCategory={setCategory} />
          <section id="menfis-products" className="mt-6 px-4">
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
        loginRequired={false}
        closeLogin={() => {
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

      {soldOutAlertOpen && (
        <SoldOutAlertModal
          message={soldOutMessage}
          onClose={() => setSoldOutAlertOpen(false)}
        />
      )}

      <AnimatePresence>
        {specialOfferOpen && (
          <SpecialOfferModal
            offer={specialOffer}
            onClose={closeSpecialOffer}
            onAdd={addSpecialOffer}
            onViewMenu={viewSpecialOfferMenu}
          />
        )}
      </AnimatePresence>

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

      <AnimatePresence>
        {!kioskMode && quickQrOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[95] hidden items-center justify-center bg-black/55 px-6 backdrop-blur-sm md:flex"
            role="dialog"
            aria-modal="true"
            aria-label="QR Code Menfi's"
          >
            <motion.div
              initial={{ y: 12, scale: 0.96 }}
              animate={{ y: 0, scale: 1 }}
              exit={{ y: 8, scale: 0.98 }}
              className="w-full max-w-sm rounded-[24px] p-5 text-center shadow-2xl"
              style={{ background: "#fff", border: `2px solid ${ROSA}`, color: VERDE }}
            >
              <div className="mb-4 flex items-center justify-between gap-3 text-left">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.18em] opacity-60">
                    Atendimento rápido
                  </p>
                  <h2
                    className="text-2xl uppercase"
                    style={{ fontFamily: "var(--menfis-font-display)", letterSpacing: 0 }}
                  >
                    QR Code Menfi's
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={() => setQuickQrOpen(false)}
                  className="grid h-11 w-11 shrink-0 place-items-center rounded-full"
                  style={{ background: `${ROSA}28`, color: VERDE }}
                  aria-label="Sair"
                >
                  <X size={20} strokeWidth={3} />
                </button>
              </div>

              <div
                className="mx-auto grid aspect-square w-full max-w-[280px] place-items-center rounded-[18px] p-3"
                style={{ background: "#fff", border: `1px solid ${VERDE}18` }}
              >
                <img
                  src="/pix-menfis.png"
                  alt="QR Code Menfi's"
                  className="h-full w-full object-contain"
                />
              </div>

              <div className="mt-4 flex items-center justify-between gap-3">
                <span
                  className="rounded-full px-3 py-2 text-xs font-black uppercase"
                  style={{ background: `${VERDE}10` }}
                >
                  Fecha em {quickQrSeconds}s
                </span>
                <button
                  type="button"
                  onClick={() => setQuickQrOpen(false)}
                  className="rounded-full px-5 py-3 text-xs font-black uppercase"
                  style={{ background: VERDE, color: ROSA }}
                >
                  Sair
                </button>
              </div>
            </motion.div>
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

function specialOfferSessionKey(offer: SpecialOfferSettings, kioskMode: boolean) {
  const mode =
    kioskMode
      ? "pdv"
      : typeof window !== "undefined" && window.matchMedia("(max-width: 767px)").matches
        ? "mobile"
        : "desktop";
  const offerKey = `${offer.productId}-${offer.title}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return `${SPECIAL_OFFER_SESSION_KEY}:${mode}:${offerKey || "default"}`;
}

function SpecialOfferModal({
  offer,
  onClose,
  onAdd,
  onViewMenu,
}: {
  offer: SpecialOfferSettings;
  onClose: () => void;
  onAdd: () => void;
  onViewMenu: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[90] flex items-center justify-center bg-black/45 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label={offer.title}
      onClick={onClose}
    >
      <motion.div
        initial={{ y: 20, scale: 0.94 }}
        animate={{ y: 0, scale: 1 }}
        exit={{ y: 16, scale: 0.96 }}
        transition={{ type: "spring", stiffness: 260, damping: 24 }}
        className="relative max-h-[86dvh] w-full max-w-[390px] overflow-hidden rounded-[26px] bg-white shadow-[0_28px_80px_rgba(0,0,0,0.35)] sm:max-w-lg"
        style={{ color: VERDE }}
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-3 top-3 z-10 grid h-11 w-11 place-items-center rounded-full"
          style={{ background: "rgba(255,255,255,0.92)", color: VERDE, border: `1px solid ${VERDE}14` }}
          aria-label="Fechar promoção"
        >
          <X size={19} strokeWidth={2.7} />
        </button>

        <div className="max-h-[86dvh] overflow-y-auto">
          <div className="relative aspect-[1.18/1] bg-white sm:aspect-[1.45/1]">
            {offer.image ? (
              <img
                src={offer.image}
                alt={offer.title}
                className="h-full w-full object-cover"
                loading="eager"
              />
            ) : (
              <div className="grid h-full place-items-center" style={{ background: `${ROSA}35` }}>
                <Sparkles size={54} strokeWidth={1.7} />
              </div>
            )}
            <span
              className="absolute left-4 top-4 rounded-full px-3 py-2 text-[10px] font-black uppercase tracking-[0.16em]"
              style={{ background: VERDE, color: ROSA }}
            >
              Destaque especial do mês
            </span>
          </div>

          <div className="p-5 sm:p-6">
            <h2
              className="uppercase"
              style={{
                fontFamily: "var(--menfis-font-display)",
                fontSize: "clamp(2.1rem, 9vw, 3.25rem)",
                lineHeight: 0.9,
                letterSpacing: 0,
              }}
            >
              {offer.title}
            </h2>
            <p className="mt-3 text-sm font-semibold leading-relaxed opacity-75 sm:text-base">
              {offer.description}
            </p>
            <div className="mt-5 flex items-end justify-between gap-4">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.18em] opacity-45">
                  Preço especial
                </p>
                <p
                  className="mt-1"
                  style={{
                    fontFamily: "var(--menfis-font-display)",
                    fontSize: "2.6rem",
                    lineHeight: 0.9,
                  }}
                >
                  {fmt(offer.price)}
                </p>
              </div>
            </div>
            <div className="mt-5 grid gap-2 sm:grid-cols-[1fr_auto]">
              <button
                type="button"
                onClick={onAdd}
                className="min-h-13 rounded-2xl px-5 py-4 text-xs font-black uppercase tracking-wide"
                style={{ background: VERDE, color: ROSA }}
              >
                {offer.primaryButton}
              </button>
              <button
                type="button"
                onClick={onViewMenu}
                className="min-h-13 rounded-2xl px-5 py-4 text-xs font-black uppercase tracking-wide"
                style={{ background: "#fff", color: VERDE, border: `1.5px solid ${VERDE}18` }}
              >
                {offer.secondaryButton}
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

