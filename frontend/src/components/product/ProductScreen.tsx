import { useEffect, useMemo, useRef, useState, type ElementType } from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  Bell,
  CircleCheckBig,
  ChevronLeft,
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
  isSuperProduct,
  isSweetBoxProduct,
  readMemberProfile,
  readSavedDelivery,
  requiredCustomizerCount,
  requiresSpiceLevel,
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
  SuperLaunchCard,
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
import { BottomNavButton, SpecialOfferModal, specialOfferSessionKey } from "./screen/ProductScreenOverlays";
import { useProductMember } from "./screen/useProductMember";
import { useProductCatalog } from "./screen/useProductCatalog";

import { API_URL, CUSTOMIZER_ADDON_IDS, DEFAULT_FEATURED_PRODUCT_ID, PRICING_ROWS_CACHE_KEY, PUBLIC_SETTINGS_CACHE_KEY, applyPricingToMenu, comboPotatoComponent, freshApiUrl, hasRequiredCustomerProfile, preloadClientImages, readJsonCache, writeJsonCache } from "./screen/productCatalog";
import { ProductScreenView } from "./screen/ProductScreenView";

const SPECIAL_OFFER_SESSION_KEY = "menfis_special_offer_seen";

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
  const catalog = useProductCatalog(kioskMode);
  const { category,setCategory,featuredImage,featuredTitle,heroSettingsLoaded,promoCards,specialOffer,specialOfferOpen,setSpecialOfferOpen,operatingNow,operatingHoursSummary,operatingHoursMessage,soldOutEnabled,soldOutMessage,catalogItems,catalogLoaded,soldOutAlertOpen,setSoldOutAlertOpen,filteredItems,featuredItem } = catalog;
  const [builder, setBuilder] = useState<BuilderState>({
    cheese: false,
    sauce: false,
  });
  const [customizer, setCustomizer] = useState<CustomizerState | null>(null);
  const [addedConfirmation, setAddedConfirmation] = useState<{ name: string; superTheme: boolean; chilli: boolean } | null>(null);
  const [detailItem, setDetailItem] = useState<MenuItem | null>(null);
  const member = useProductMember(kioskMode, onReadNotifications);
  const { loginOpen,setLoginOpen,profileOpen,setProfileOpen,historyOpen,setHistoryOpen,notificationsOpen,setNotificationsOpen,favoritesOpen,setFavoritesOpen,memberName,setMemberName,memberEmail,setMemberEmail,memberCpf,setMemberCpf,memberPhone,setMemberPhone,memberPassword,setMemberPassword,memberPasswordConfirm,setMemberPasswordConfirm,memberLogin,setMemberLogin,loginPassword,setLoginPassword,memberAuthMode,setMemberAuthMode,memberBirthday,setMemberBirthday,memberCep,setMemberCep,memberStreet,setMemberStreet,memberNumber,setMemberNumber,memberComplement,setMemberComplement,memberNeighborhood,setMemberNeighborhood,memberCity,setMemberCity,memberReference,setMemberReference,memberProfile,memberError,memberSaving,openMemberAccess,editMember,openHistory,openNotifications,saveMember,loginMember,requestPasswordRecovery,resetMemberPassword,logoutMember,applyMemberProfileUpdate } = member;
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
  const savedDelivery = readSavedDelivery();
  const kioskMobLoggedIn = String(memberProfile?.name ?? "").trim().toUpperCase().replace(/[^A-Z0-9]/g, "-").replace(/-+/g, "-") === "KIOSK-MOB";
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
      spiceLevel: undefined,
    });
  };

  const addMenuItem = (item: MenuItem) => {
    openCustomizer(item);
  };

  const showAddedConfirmation = (item: MenuItem) => {
    setAddedConfirmation({
      name: item.name,
      superTheme: isSuperProduct(item),
      chilli: item.id === "tropikal-barbecue",
    });
  };

  useEffect(() => {
    if (!addedConfirmation) return;
    const timeout = window.setTimeout(() => setAddedConfirmation(null), 2400);
    return () => window.clearTimeout(timeout);
  }, [addedConfirmation]);

  const quickAddMenuItem = (item: MenuItem) => {
    if (isSuperProduct(item)) {
      openCustomizer(item);
      return;
    }
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
    showAddedConfirmation(item);
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
      (customizer.item.category === "burger" || customizer.item.category === "combo") &&
      !isSuperProduct(customizer.item);
    const requiresFreeMayo = isNuggetsProduct(customizer.item);
    const requiresSweetBox = isSweetBoxProduct(customizer.item);
    const sweetCount = Object.values(customizer.extras).reduce((sum, quantity) => sum + quantity, 0);
    const sauceRequiredCount = requiresFreeMayo ? 1 : requiredCount;
    const requiresDrink = customizer.item.category === "combo";
    const requiresSpice = requiresSpiceLevel(customizer.item);
    if (
      (requiresSweetBox && sweetCount !== SWEET_BOX_REQUIRED_COUNT) ||
      (meatRequired && customizer.meatPoints.length < requiredCount) ||
      (!requiresSweetBox && (requiresSauce || requiresFreeMayo) &&
        customizer.sauces.length < sauceRequiredCount) ||
      (requiresDrink && customizer.drinks.length < requiredCount)
      || (requiresSpice && customizer.spiceLevel === undefined)
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
        note: [
          requiresSpice
            ? `Pimenta: ${"🌶️".repeat(customizer.spiceLevel ?? 0)}${"☆".repeat(5 - (customizer.spiceLevel ?? 0))}`
            : "",
          customizer.note.trim(),
        ].filter(Boolean).join(" | ") || undefined,
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
    showAddedConfirmation(customizer.item);
    setCustomizer(null);
  };
  return <ProductScreenView catalog={catalog} member={member} screen={{ cart,updateQty,kioskMode,activeOrder,notifications,unreadNotificationCount,onOpenActiveOrder,onRepeatOrder,builder,customizer,addedConfirmation,detailItem,configurationUnavailable,quickQrOpen,quickQrSeconds,setCustomizer,setAddedConfirmation,setDetailItem,setConfigurationUnavailable,setQuickQrOpen,cartCount,cartTotal,savedDelivery,kioskMobLoggedIn,qty,handleAdminTap,handleIdleShortcutTap,addMenuItem,quickAddMenuItem,handleGoToCart,confirmCustomizer,closeSpecialOffer,addSpecialOffer,viewSpecialOfferMenu }} />;
}

