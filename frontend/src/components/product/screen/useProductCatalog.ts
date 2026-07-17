import { useEffect, useMemo, useState } from "react";
import { MENU_ITEMS } from "@/features/catalog/menu";
import type { MenuItem } from "@/features/catalog/types";
import { DEFAULT_SPECIAL_OFFER_SETTINGS, type PromoCard, type SpecialOfferSettings, normalizePresentationSettings, normalizePromoCards, normalizeSpecialOfferSettings } from "@/components/order/checkout";
import { CATEGORIES, imageSrc, isChickenProduct, isSpecialOfferOnlyProduct, isSuperProduct, sortCatalogItems } from "../shared";
import { SOLD_OUT_MESSAGE } from "../SoldOutNotice";
import { specialOfferSessionKey } from "./ProductScreenOverlays";
import { API_URL, DEFAULT_FEATURED_PRODUCT_ID, PRICING_ROWS_CACHE_KEY, PUBLIC_SETTINGS_CACHE_KEY, applyPricingToMenu, freshApiUrl, preloadClientImages, readJsonCache, writeJsonCache } from "./productCatalog";

export function useProductCatalog(kioskMode: boolean) {
  const [category, setCategory] = useState<(typeof CATEGORIES)[number]["id"]>("combo");
  const [featuredProductId, setFeaturedProductId] = useState("");
  const [featuredImage, setFeaturedImage] = useState("");
  const [featuredTitle, setFeaturedTitle] = useState("");
  const [heroSettingsLoaded, setHeroSettingsLoaded] = useState(!API_URL);
  const [promoCards, setPromoCards] = useState<PromoCard[]>([]);
  const [specialOffer, setSpecialOffer] = useState<SpecialOfferSettings>(() => normalizeSpecialOfferSettings(null));
  const [specialOfferOpen, setSpecialOfferOpen] = useState(false);
  const [operatingNow, setOperatingNow] = useState(true);
  const [operatingHoursSummary, setOperatingHoursSummary] = useState("");
  const [operatingHoursMessage, setOperatingHoursMessage] = useState("");
  const [soldOutEnabled, setSoldOutEnabled] = useState(false);
  const [soldOutMessage, setSoldOutMessage] = useState(SOLD_OUT_MESSAGE);
  const [catalogItems, setCatalogItems] = useState<MenuItem[]>(() => API_URL ? [] : MENU_ITEMS);
  const [catalogLoaded, setCatalogLoaded] = useState(!API_URL);
  const [soldOutAlertOpen, setSoldOutAlertOpen] = useState(false);

  const filteredItems = useMemo(() => {
    const visible = catalogItems.filter((item) => !isSpecialOfferOnlyProduct(item));
    let items: MenuItem[];
    if (category === "chicken") items = visible.filter((item) => item.category === "burger" && isChickenProduct(item));
    else if (category === "bacon") items = visible.filter((item) => item.category === "burger" && `${item.id} ${item.name} ${item.tags.join(" ")}`.toLowerCase().includes("bacon"));
    else if (category === "super") items = visible.filter(isSuperProduct);
    else if (category === "burger") items = visible.filter((item) => item.category === "burger" && !isChickenProduct(item) && !isSuperProduct(item) && !`${item.id} ${item.name} ${item.tags.join(" ")}`.toLowerCase().includes("bacon"));
    else if (category === "extras") items = visible.filter((item) => item.category === "extra" || item.category === "bebida");
    else if (category === "fries") items = visible.filter((item) => item.category === "fries");
    else if (category === "sweet") items = visible.filter((item) => item.category === "sweet");
    else items = visible.filter((item) => item.category === category);
    if (category === "super") return [...items].sort((a, b) => a.id === "tropikal-menfis" ? -1 : b.id === "tropikal-menfis" ? 1 : 0);
    return sortCatalogItems(items);
  }, [catalogItems, category]);

  const featuredItem = (featuredProductId ? catalogItems.find((item) => item.id === featuredProductId) : undefined)
    ?? (heroSettingsLoaded ? catalogItems.find((item) => item.id === DEFAULT_FEATURED_PRODUCT_ID) : undefined)
    ?? catalogItems[0] ?? MENU_ITEMS.find((item) => item.id === DEFAULT_FEATURED_PRODUCT_ID) ?? MENU_ITEMS[0];

  const applyPublicSettings = (settings: Record<string, unknown> | null | undefined) => {
    setFeaturedProductId(settings?.featuredProductId ? String(settings.featuredProductId) : DEFAULT_FEATURED_PRODUCT_ID);
    const presentation = normalizePresentationSettings(settings?.presentation);
    const offer = normalizeSpecialOfferSettings(settings?.specialOffer);
    setFeaturedImage(presentation.featuredImage ?? ""); setFeaturedTitle(presentation.featuredTitle ?? "");
    setPromoCards(normalizePromoCards(settings?.promoCards)); setSpecialOffer(offer);
    preloadClientImages([presentation.featuredImage, featuredItem?.image ? imageSrc(featuredItem.image) : undefined, offer.image]);
    setOperatingNow(settings?.operatingNow !== false); setOperatingHoursSummary(String(settings?.operatingHoursSummary ?? ""));
    setOperatingHoursMessage(String(settings?.operatingHoursMessage ?? "")); setSoldOutEnabled(settings?.soldOutActive === true);
    setSoldOutMessage(String(settings?.soldOutMessage ?? SOLD_OUT_MESSAGE));
  };

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!API_URL) { setHeroSettingsLoaded(true); return; }
    let cancelled = false;
    const cached = readJsonCache<Record<string, unknown> | null>(PUBLIC_SETTINGS_CACHE_KEY, null);
    if (cached) applyPublicSettings(cached);
    fetch(freshApiUrl("/settings/public"), { cache: "no-store", headers: { "Cache-Control": "no-cache", Pragma: "no-cache" } })
      .then((response) => response.ok ? response.json() : null).then((settings) => { if (cancelled) return; if (settings) writeJsonCache(PUBLIC_SETTINGS_CACHE_KEY, settings); applyPublicSettings(settings); })
      .catch(() => undefined).finally(() => { if (!cancelled) setHeroSettingsLoaded(true); });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => { preloadClientImages([featuredImage, featuredItem?.image ? imageSrc(featuredItem.image) : undefined]); }, [featuredImage, featuredItem?.id, featuredItem?.image]);
  useEffect(() => {
    if (typeof window === "undefined" || !heroSettingsLoaded || !specialOffer.enabled) return;
    preloadClientImages([specialOffer.image]); const key = specialOfferSessionKey(specialOffer, kioskMode);
    if (specialOffer.oncePerSession && sessionStorage.getItem(key) === "1") return;
    const timer = window.setTimeout(() => { if (specialOffer.oncePerSession) sessionStorage.setItem(key, "1"); setSpecialOfferOpen(true); }, 120);
    return () => window.clearTimeout(timer);
  }, [heroSettingsLoaded, kioskMode, specialOffer.enabled, specialOffer.oncePerSession, specialOffer.productId, specialOffer.image, specialOffer.title]);

  useEffect(() => {
    if (typeof window === "undefined" || !API_URL) return;
    setCatalogLoaded(false); const cached = readJsonCache<Array<Record<string, unknown>>>(PRICING_ROWS_CACHE_KEY, []);
    if (cached.length) { const items = applyPricingToMenu(cached); setCatalogItems(items); preloadClientImages(items.map((item) => imageSrc(item.image))); }
    fetch(freshApiUrl("/pricing"), { cache: "no-store", headers: { "Cache-Control": "no-cache", Pragma: "no-cache" } })
      .then((response) => response.ok ? response.json() : []).then((rows) => { if (!Array.isArray(rows)) return; writeJsonCache(PRICING_ROWS_CACHE_KEY, rows); const items = applyPricingToMenu(rows); setCatalogItems(items); preloadClientImages(items.map((item) => imageSrc(item.image))); })
      .catch(() => { if (!cached.length) setCatalogItems([]); }).finally(() => setCatalogLoaded(true));
  }, []);

  return { category,setCategory,featuredImage,featuredTitle,heroSettingsLoaded,promoCards,specialOffer,specialOfferOpen,setSpecialOfferOpen,operatingNow,operatingHoursSummary,operatingHoursMessage,soldOutEnabled,soldOutMessage,catalogItems,catalogLoaded,soldOutAlertOpen,setSoldOutAlertOpen,filteredItems,featuredItem };
}
