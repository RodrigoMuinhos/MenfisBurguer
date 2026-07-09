import { Beef, CalendarClock, Clock, Flame, FlaskConical, Gift, GripVertical, Heart, ImagePlus, KeyRound, PackageX, Percent, Plus, Save, Star, Table2, Tag, Ticket, Trash2, Utensils, RotateCcw } from "lucide-react";
import { useEffect, useState, type ElementType } from "react";
import { MENU_ITEMS } from "@/features/catalog/menu";
import { ROSA, VERDE } from "@/utils/theme";
import {
  PresentationSettings,
  PromoCard,
  PromoCardIcon,
  PROMO_CARD_ICON_OPTIONS,
  SpecialOfferSettings,
  OperatingHoursConfig,
  normalizeOperatingHours,
  normalizePresentationSettings,
  normalizePromoCards,
  normalizeSpecialOfferSettings,
} from "@/components/order/checkout";
import { PayOnDeliverySettings } from "../AdminChrome";

export function ConfigView({
  payOnDeliveryEnabled,
  testModeEnabled,
  demoTableEnabled,
  soldOutEnabled,
  featuredProductId,
  adminLogin,
  operatingHours,
  presentation,
  promoCards,
  specialOffer,
  hasUnsavedOperatingHours,
  hasUnsavedPresentation,
  hasUnsavedPromoCards,
  hasUnsavedSpecialOffer,
  saving,
  disabled,
  onTogglePayOnDelivery,
  onToggleTestMode,
  onToggleDemoTable,
  onToggleSoldOut,
  onFeaturedProductChange,
  onSaveAdminCredentials,
  onOperatingHoursChange,
  onPresentationChange,
  onPromoCardsChange,
  onSpecialOfferChange,
  onSaveOperatingHours,
  onSavePresentation,
  onSavePromoCards,
  onSaveSpecialOffer,
  onResetRealOperation,
}: {
  payOnDeliveryEnabled: boolean;
  testModeEnabled: boolean;
  demoTableEnabled: boolean;
  soldOutEnabled: boolean;
  featuredProductId: string;
  adminLogin: string;
  operatingHours: OperatingHoursConfig;
  presentation: PresentationSettings;
  promoCards: PromoCard[];
  specialOffer: SpecialOfferSettings;
  hasUnsavedOperatingHours: boolean;
  hasUnsavedPresentation: boolean;
  hasUnsavedPromoCards: boolean;
  hasUnsavedSpecialOffer: boolean;
  saving: boolean;
  disabled: boolean;
  onTogglePayOnDelivery: () => void;
  onToggleTestMode: () => void;
  onToggleDemoTable: () => void;
  onToggleSoldOut: () => void;
  onFeaturedProductChange: (productId: string) => void;
  onSaveAdminCredentials: (login: string, password: string) => Promise<boolean>;
  onOperatingHoursChange: (config: OperatingHoursConfig) => void;
  onPresentationChange: (config: PresentationSettings) => void;
  onPromoCardsChange: (cards: PromoCard[]) => void;
  onSpecialOfferChange: (config: SpecialOfferSettings) => void;
  onSaveOperatingHours: () => void;
  onSavePresentation: () => void;
  onSavePromoCards: () => void;
  onSaveSpecialOffer: () => void;
  onResetRealOperation: () => void;
}) {
  const normalizedOperatingHours = normalizeOperatingHours(operatingHours);
  const normalizedPresentation = normalizePresentationSettings(presentation);
  const normalizedPromoCards = normalizePromoCards(promoCards);
  const normalizedSpecialOffer = normalizeSpecialOfferSettings(specialOffer);
  const activePromoCardsCount = normalizedPromoCards.filter((card) => card.enabled).length;
  const [adminLoginDraft, setAdminLoginDraft] = useState(adminLogin || "menfisburguer@adm.com");
  const [adminPasswordDraft, setAdminPasswordDraft] = useState("");
  const [adminCredentialsSaved, setAdminCredentialsSaved] = useState(false);
  const [adminCredentialsError, setAdminCredentialsError] = useState("");
  const [adminCredentialsOpen, setAdminCredentialsOpen] = useState(false);

  useEffect(() => {
    if (adminLogin) setAdminLoginDraft(adminLogin);
  }, [adminLogin]);

  const saveAdminCredentials = async () => {
    setAdminCredentialsSaved(false);
    setAdminCredentialsError("");
    if (!adminLoginDraft.trim() || adminPasswordDraft.trim().length < 6) {
      setAdminCredentialsError("Informe login e senha com pelo menos 6 caracteres.");
      return;
    }
    const saved = await onSaveAdminCredentials(adminLoginDraft, adminPasswordDraft);
    if (!saved) {
      setAdminCredentialsError("Não foi possível salvar o login do admin.");
      return;
    }
    setAdminPasswordDraft("");
    setAdminCredentialsSaved(true);
    setAdminCredentialsOpen(false);
  };
  const changeOperatingDay = (
    dayNumber: number,
    patch: Partial<OperatingHoursConfig["days"][number]>,
  ) => {
    onOperatingHoursChange({
      days: normalizedOperatingHours.days.map((day) =>
        day.day === dayNumber ? { ...day, ...patch } : day,
      ),
    });
  };
  const updatePresentation = (patch: Partial<PresentationSettings>) => {
    onPresentationChange(normalizePresentationSettings({ ...normalizedPresentation, ...patch }));
  };
  const addPresentationImages = async (files: FileList | null) => {
    if (!files?.length) return;
    const encoded = await Promise.all([...files].map((file) => encodePresentationImage(file)));
    updatePresentation({
      images: [...normalizedPresentation.images, ...encoded].slice(0, 20),
      imageCount: Math.min(20, Math.max(normalizedPresentation.imageCount, normalizedPresentation.images.length + encoded.length)),
    });
  };
  const removePresentationImage = (index: number) => {
    const images = normalizedPresentation.images.filter((_, imageIndex) => imageIndex !== index);
    updatePresentation({
      images,
      imageCount: Math.min(Math.max(1, images.length), normalizedPresentation.imageCount),
    });
  };
  const movePresentationImage = (fromIndex: number, toIndex: number) => {
    if (fromIndex === toIndex || toIndex < 0 || toIndex >= normalizedPresentation.images.length) return;
    const images = [...normalizedPresentation.images];
    const [moved] = images.splice(fromIndex, 1);
    images.splice(toIndex, 0, moved);
    updatePresentation({ images });
  };
  const setFeaturedImageFromFiles = async (files: FileList | null) => {
    const file = files?.[0];
    if (!file) return;
    const featuredImage = await encodePresentationImage(file);
    updatePresentation({ featuredImage });
  };
  const updatePromoCard = (id: string, patch: Partial<PromoCard>) => {
    onPromoCardsChange(
      normalizedPromoCards.map((card) =>
        card.id === id ? { ...card, ...patch } : card,
      ),
    );
  };
  const updateSpecialOffer = (patch: Partial<SpecialOfferSettings>) => {
    onSpecialOfferChange(normalizeSpecialOfferSettings({ ...normalizedSpecialOffer, ...patch }));
  };
  const setSpecialOfferImageFromFiles = async (files: FileList | null) => {
    const file = files?.[0];
    if (!file) return;
    const image = await encodePresentationImage(file);
    updateSpecialOffer({ image });
  };
  const addPromoCard = () => {
    onPromoCardsChange([
      ...normalizedPromoCards,
      {
        id: `promo-${Date.now()}`,
        enabled: true,
        eyebrow: "Nova promoção",
        title: "CUPOM",
        copy: "Descreva aqui a oferta para o cliente.",
        value: "10%",
        suffix: "OFF",
        icon: "gift",
      },
    ]);
  };
  const removePromoCard = (id: string) => {
    onPromoCardsChange(normalizedPromoCards.filter((card) => card.id !== id));
  };
  const selectedProduct = MENU_ITEMS.find((item) => item.id === featuredProductId) ?? MENU_ITEMS[0];
  const selectedProductImage =
    typeof selectedProduct.image === "string"
      ? selectedProduct.image
      : selectedProduct.image?.src;
  const maskedAdminLogin = adminLoginDraft.replace(
    /^(.{2}).*(@.*)$/,
    "$1***$2",
  );

  return (
    <div className="flex flex-col gap-4">
      <PayOnDeliverySettings
        enabled={payOnDeliveryEnabled}
        saving={saving}
        disabled={disabled}
        onToggle={onTogglePayOnDelivery}
      />

      <section className="rounded-2xl p-4" style={{ background: "#fff", border: `1.5px solid ${VERDE}18` }}>
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl" style={{ background: ROSA, color: VERDE }}>
              <KeyRound size={19} strokeWidth={2.4} />
            </div>
            <div>
              <p className="text-sm font-black uppercase" style={{ color: VERDE }}>Acesso do admin</p>
              <p className="mt-1 text-xs font-bold opacity-55" style={{ color: VERDE }}>
                {adminCredentialsOpen
                  ? "Altere o e-mail e a senha usados para entrar em /adm."
                  : `Login atual: ${maskedAdminLogin}`}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setAdminCredentialsOpen((open) => !open)}
            className="inline-flex min-h-10 items-center justify-center rounded-xl px-4 text-xs font-black uppercase"
            style={{ background: adminCredentialsOpen ? VERDE : "#F8F1F4", color: adminCredentialsOpen ? ROSA : VERDE }}
          >
            {adminCredentialsOpen ? "Fechar" : "Alterar acesso"}
          </button>
        </div>
        {adminCredentialsOpen && (
          <div className="mt-4 grid gap-3 md:grid-cols-[1fr_1fr_auto] md:items-end">
            <label className="grid gap-1 text-[10px] font-black uppercase tracking-wide" style={{ color: `${VERDE}99` }}>
              Login
              <input
                value={adminLoginDraft}
                onChange={(event) => setAdminLoginDraft(event.target.value)}
                disabled={saving || disabled}
                className="min-h-12 rounded-2xl px-4 text-sm font-black normal-case outline-none"
                style={{ border: `1.5px solid ${VERDE}18`, color: VERDE, background: "#FFF8F2" }}
                autoComplete="username"
              />
            </label>
            <label className="grid gap-1 text-[10px] font-black uppercase tracking-wide" style={{ color: `${VERDE}99` }}>
              Nova senha
              <input
                type="password"
                value={adminPasswordDraft}
                onChange={(event) => setAdminPasswordDraft(event.target.value)}
                disabled={saving || disabled}
                className="min-h-12 rounded-2xl px-4 text-sm font-black normal-case outline-none"
                style={{ border: `1.5px solid ${VERDE}18`, color: VERDE, background: "#FFF8F2" }}
                autoComplete="new-password"
              />
            </label>
            <button
              type="button"
              onClick={saveAdminCredentials}
              disabled={saving || disabled}
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl px-5 text-xs font-black uppercase"
              style={{ background: VERDE, color: ROSA, opacity: saving || disabled ? 0.6 : 1 }}
            >
              <Save size={15} />
              Salvar acesso
            </button>
          </div>
        )}
        {(adminCredentialsError || adminCredentialsSaved) && (
          <p className="mt-3 text-xs font-bold" style={{ color: adminCredentialsError ? "#991B1B" : VERDE }}>
            {adminCredentialsError || "Login do admin atualizado. Entre novamente no próximo acesso."}
          </p>
        )}
      </section>

      <section
        className="rounded-2xl p-4"
        style={{
          background: soldOutEnabled ? "#FEF2F2" : "#fff",
          border: `1.5px solid ${soldOutEnabled ? "#EF4444" : `${VERDE}18`}`,
        }}
      >
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-start gap-3">
            <div
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
              style={{ background: soldOutEnabled ? "#EF4444" : ROSA, color: soldOutEnabled ? "#fff" : VERDE }}
            >
              <PackageX size={19} strokeWidth={2.4} />
            </div>
            <div>
              <p className="text-sm font-black uppercase" style={{ color: soldOutEnabled ? "#991B1B" : VERDE }}>
                SOLD OUT
              </p>
              <p className="mt-1 text-xs font-bold leading-relaxed opacity-70" style={{ color: soldOutEnabled ? "#991B1B" : VERDE }}>
                Quando ligado, o cardápio continua visível, novos pedidos são bloqueados e o cliente vê o aviso de estoque esgotado com cadastro para ser avisado.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onToggleSoldOut}
            disabled={saving || disabled}
            className="min-h-12 min-w-36 rounded-full px-5 text-xs font-black uppercase tracking-wide"
            style={{
              background: soldOutEnabled ? "#EF4444" : "#E5E7EB",
              color: soldOutEnabled ? "#fff" : "#4B5563",
              opacity: saving || disabled ? 0.6 : 1,
            }}
          >
            {soldOutEnabled ? "SOLD OUT ligado" : "SOLD OUT desligado"}
          </button>
        </div>
      </section>

      <section className="rounded-2xl p-4" style={{ background: "#fff", border: `1.5px solid ${VERDE}18` }}>
        <div className="grid gap-4 lg:grid-cols-[1fr_320px] lg:items-start">
          <div>
            <p className="text-sm font-black uppercase" style={{ color: VERDE }}>Destaque do cardápio</p>
            <p className="mt-1 text-xs font-bold opacity-60">
              Escolha o produto principal e, se quiser, envie uma imagem exclusiva para o banner inicial do cliente.
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <label className="inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-xl px-4 text-xs font-black uppercase" style={{ background: `${ROSA}35`, color: VERDE, border: `1.5px solid ${ROSA}` }}>
                <ImagePlus size={15} />
                Upload destaque
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  disabled={saving || disabled}
                  onChange={(event) => {
                    void setFeaturedImageFromFiles(event.target.files);
                    event.currentTarget.value = "";
                  }}
                />
              </label>
              {normalizedPresentation.featuredImage && (
                <button
                  type="button"
                  onClick={() => updatePresentation({ featuredImage: "" })}
                  disabled={saving || disabled}
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-4 text-xs font-black uppercase"
                  style={{ background: "#FEF2F2", color: "#991B1B", border: "1px solid #FCA5A5" }}
                >
                  <Trash2 size={14} />
                  Usar foto do produto
                </button>
              )}
            </div>
          </div>
          <div className="grid gap-3">
            <select
              value={featuredProductId}
              onChange={(event) => onFeaturedProductChange(event.target.value)}
              disabled={saving || disabled}
              className="min-h-12 rounded-2xl px-4 text-sm font-black outline-none"
              style={{ border: `1.5px solid ${VERDE}18`, color: VERDE, background: "#FFF8F2" }}
            >
              {MENU_ITEMS.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
            <label className="grid gap-1 text-[10px] font-black uppercase tracking-wide" style={{ color: `${VERDE}99` }}>
              Nome no destaque
              <input
                value={normalizedPresentation.featuredTitle ?? ""}
                onChange={(event) => updatePresentation({ featuredTitle: event.target.value })}
                disabled={saving || disabled}
                placeholder={selectedProduct.name}
                maxLength={80}
                className="min-h-12 rounded-2xl px-4 text-sm font-black outline-none"
                style={{ border: `1.5px solid ${VERDE}18`, color: VERDE, background: "#FFF8F2" }}
              />
            </label>
            <div className="overflow-hidden rounded-2xl" style={{ border: `1px solid ${VERDE}14`, background: "#FFF8F2" }}>
              <div className="relative aspect-video bg-black">
                <img
                  src={normalizedPresentation.featuredImage || selectedProductImage}
                  alt="Prévia do destaque"
                  className="h-full w-full object-cover"
                />
                <span className="absolute left-2 top-2 rounded-full px-2 py-1 text-[10px] font-black" style={{ background: "#fff", color: VERDE }}>
                  {normalizedPresentation.featuredImage ? "Upload" : "Produto"}
                </span>
                <span className="absolute inset-x-2 bottom-2 truncate rounded-xl px-3 py-2 text-xs font-black uppercase" style={{ background: "rgba(255,255,255,0.92)", color: VERDE }}>
                  {normalizedPresentation.featuredTitle || selectedProduct.name}
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-2xl p-4" style={{ background: "#fff", border: `1.5px solid ${VERDE}18` }}>
        <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl" style={{ background: ROSA, color: VERDE }}>
              <Star size={19} strokeWidth={2.4} />
            </div>
            <div>
              <p className="text-sm font-black uppercase" style={{ color: VERDE }}>Pop-up promocional</p>
              <p className="mt-1 text-xs font-bold opacity-55" style={{ color: VERDE }}>
                Aparece no cardápio 5 segundos depois que o cliente abre o menu.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => updateSpecialOffer({ enabled: !normalizedSpecialOffer.enabled })}
            disabled={saving || disabled}
            className="min-h-12 min-w-36 rounded-full px-5 text-xs font-black uppercase tracking-wide"
            style={{
              background: normalizedSpecialOffer.enabled ? VERDE : "#E5E7EB",
              color: normalizedSpecialOffer.enabled ? ROSA : "#4B5563",
              opacity: saving || disabled ? 0.6 : 1,
            }}
          >
            {normalizedSpecialOffer.enabled ? "Ligado" : "Desligado"}
          </button>
        </div>

        <div className="grid gap-4 lg:grid-cols-[1fr_300px]">
          <div className="grid gap-3">
            <div className="grid gap-3 md:grid-cols-[1fr_150px]">
              <label className="grid gap-1 text-[10px] font-black uppercase tracking-wide" style={{ color: `${VERDE}99` }}>
                Produto/combo destacado
                <select
                  value={normalizedSpecialOffer.productId}
                  onChange={(event) => updateSpecialOffer({ productId: event.target.value })}
                  disabled={saving || disabled}
                  className="min-h-12 rounded-2xl px-4 text-sm font-black outline-none"
                  style={{ border: `1.5px solid ${VERDE}18`, color: VERDE, background: "#FFF8F2" }}
                >
                  {MENU_ITEMS.filter((item) => item.category === "combo" || item.category === "burger").map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="grid gap-1 text-[10px] font-black uppercase tracking-wide" style={{ color: `${VERDE}99` }}>
                Preço
                <input
                  value={String(normalizedSpecialOffer.price).replace(".", ",")}
                  onChange={(event) => updateSpecialOffer({ price: Number(event.target.value.replace(",", ".")) })}
                  disabled={saving || disabled}
                  className="min-h-12 rounded-2xl px-4 text-sm font-black outline-none"
                  style={{ border: `1.5px solid ${VERDE}18`, color: VERDE, background: "#FFF8F2" }}
                />
              </label>
            </div>
            <label className="grid gap-1 text-[10px] font-black uppercase tracking-wide" style={{ color: `${VERDE}99` }}>
              Título
              <input
                value={normalizedSpecialOffer.title}
                onChange={(event) => updateSpecialOffer({ title: event.target.value })}
                disabled={saving || disabled}
                className="min-h-12 rounded-2xl px-4 text-sm font-black outline-none"
                style={{ border: `1.5px solid ${VERDE}18`, color: VERDE, background: "#FFF8F2" }}
              />
            </label>
            <label className="grid gap-1 text-[10px] font-black uppercase tracking-wide" style={{ color: `${VERDE}99` }}>
              Descrição
              <textarea
                value={normalizedSpecialOffer.description}
                onChange={(event) => updateSpecialOffer({ description: event.target.value })}
                disabled={saving || disabled}
                className="min-h-24 resize-none rounded-2xl px-4 py-3 text-sm font-bold outline-none"
                style={{ border: `1.5px solid ${VERDE}18`, color: VERDE, background: "#FFF8F2" }}
              />
            </label>
            <div className="grid gap-3 md:grid-cols-2">
              <label className="grid gap-1 text-[10px] font-black uppercase tracking-wide" style={{ color: `${VERDE}99` }}>
                Botão principal
                <input
                  value={normalizedSpecialOffer.primaryButton}
                  onChange={(event) => updateSpecialOffer({ primaryButton: event.target.value })}
                  disabled={saving || disabled}
                  className="min-h-12 rounded-2xl px-4 text-sm font-black outline-none"
                  style={{ border: `1.5px solid ${VERDE}18`, color: VERDE, background: "#FFF8F2" }}
                />
              </label>
              <label className="grid gap-1 text-[10px] font-black uppercase tracking-wide" style={{ color: `${VERDE}99` }}>
                Botão secundário
                <input
                  value={normalizedSpecialOffer.secondaryButton}
                  onChange={(event) => updateSpecialOffer({ secondaryButton: event.target.value })}
                  disabled={saving || disabled}
                  className="min-h-12 rounded-2xl px-4 text-sm font-black outline-none"
                  style={{ border: `1.5px solid ${VERDE}18`, color: VERDE, background: "#FFF8F2" }}
                />
              </label>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => updateSpecialOffer({ oncePerSession: true })}
                disabled={saving || disabled}
                className="rounded-full px-4 py-2 text-[10px] font-black uppercase"
                style={{
                  background: normalizedSpecialOffer.oncePerSession ? VERDE : "#F8F1F4",
                  color: normalizedSpecialOffer.oncePerSession ? ROSA : VERDE,
                }}
              >
                Uma vez por sessão
              </button>
              <button
                type="button"
                onClick={() => updateSpecialOffer({ oncePerSession: false })}
                disabled={saving || disabled}
                className="rounded-full px-4 py-2 text-[10px] font-black uppercase"
                style={{
                  background: !normalizedSpecialOffer.oncePerSession ? VERDE : "#F8F1F4",
                  color: !normalizedSpecialOffer.oncePerSession ? ROSA : VERDE,
                }}
              >
                Toda vez que abrir
              </button>
              <label className="inline-flex min-h-10 cursor-pointer items-center justify-center gap-2 rounded-xl px-4 text-xs font-black uppercase" style={{ background: `${ROSA}35`, color: VERDE, border: `1.5px solid ${ROSA}` }}>
                <ImagePlus size={15} />
                Upload imagem
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  disabled={saving || disabled}
                  onChange={(event) => {
                    void setSpecialOfferImageFromFiles(event.target.files);
                    event.currentTarget.value = "";
                  }}
                />
              </label>
            </div>
          </div>
          <div className="overflow-hidden rounded-2xl" style={{ border: `1px solid ${VERDE}14`, background: "#FFF8F2" }}>
            <div className="relative aspect-[4/3] bg-white">
              <img src={normalizedSpecialOffer.image} alt="Prévia do pop-up" className="h-full w-full object-cover" />
            </div>
            <div className="p-4">
              <p className="text-[10px] font-black uppercase tracking-[0.18em] opacity-55" style={{ color: VERDE }}>Destaque especial do mês</p>
              <p className="mt-1 text-lg font-black uppercase leading-tight" style={{ color: VERDE }}>{normalizedSpecialOffer.title}</p>
              <p className="mt-2 text-sm font-black" style={{ color: VERDE }}>R$ {normalizedSpecialOffer.price.toFixed(2).replace(".", ",")}</p>
            </div>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t pt-4" style={{ borderColor: `${VERDE}12` }}>
          <p className="text-xs font-bold" style={{ color: hasUnsavedSpecialOffer ? "#B45309" : `${VERDE}99` }}>
            {hasUnsavedSpecialOffer ? "Há alterações no pop-up que ainda não foram salvas." : "Pop-up promocional salvo."}
          </p>
          <button
            type="button"
            onClick={onSaveSpecialOffer}
            disabled={saving || disabled || !hasUnsavedSpecialOffer}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-5 text-xs font-black uppercase"
            style={{
              background: hasUnsavedSpecialOffer ? VERDE : "#E5E7EB",
              color: hasUnsavedSpecialOffer ? ROSA : "#6B7280",
              opacity: saving || disabled ? 0.6 : 1,
            }}
          >
            <Save size={15} />
            {saving ? "Salvando..." : "Salvar pop-up"}
          </button>
        </div>
      </section>

      <section className="rounded-2xl p-4" style={{ background: "#fff", border: `1.5px solid ${VERDE}18` }}>
        <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl" style={{ background: ROSA, color: VERDE }}>
              <Flame size={19} strokeWidth={2.4} />
            </div>
            <div>
              <p className="text-sm font-black uppercase" style={{ color: VERDE }}>Cards promocionais</p>
              <p className="mt-1 text-xs font-bold opacity-55" style={{ color: VERDE }}>
                Edite os cards que aparecem no carrossel de promoções do cardápio mobile.
              </p>
              <p className="mt-1 text-xs font-black" style={{ color: activePromoCardsCount === 0 ? "#991B1B" : `${VERDE}99` }}>
                {activePromoCardsCount === 0
                  ? "Todos os cards estão ocultos. O carrossel não aparecerá para o cliente."
                  : `${activePromoCardsCount} card${activePromoCardsCount !== 1 ? "s" : ""} ativo${activePromoCardsCount !== 1 ? "s" : ""} no carrossel.`}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={addPromoCard}
            disabled={saving || disabled || normalizedPromoCards.length >= 8}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-4 text-xs font-black uppercase"
            style={{ background: VERDE, color: ROSA, opacity: saving || disabled || normalizedPromoCards.length >= 8 ? 0.6 : 1 }}
          >
            <Plus size={15} />
            Novo card
          </button>
        </div>

        <div className="grid gap-4">
          {normalizedPromoCards.map((card) => {
            const PreviewIcon = promoCardIcon(card.icon);
            return (
              <div key={card.id} className="grid gap-4 rounded-2xl p-3 lg:grid-cols-[1fr_260px]" style={{ background: "#FFF8F2", border: `1px solid ${VERDE}12` }}>
                <div className="grid gap-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => updatePromoCard(card.id, { enabled: !card.enabled })}
                      disabled={saving || disabled}
                      className="rounded-full px-4 py-2 text-[10px] font-black uppercase"
                      style={{
                        background: card.enabled ? VERDE : "#E5E7EB",
                        color: card.enabled ? ROSA : "#4B5563",
                        opacity: saving || disabled ? 0.6 : 1,
                      }}
                    >
                      {card.enabled ? "Ativo" : "Oculto"}
                    </button>
                    <button
                      type="button"
                      onClick={() => removePromoCard(card.id)}
                      disabled={saving || disabled || normalizedPromoCards.length <= 1}
                      className="inline-flex min-h-9 items-center justify-center gap-2 rounded-xl px-3 text-[10px] font-black uppercase"
                      style={{ background: "#FEF2F2", color: "#991B1B", border: "1px solid #FCA5A5", opacity: normalizedPromoCards.length <= 1 ? 0.45 : 1 }}
                    >
                      <Trash2 size={13} />
                      Remover
                    </button>
                  </div>

                  <div className="grid gap-3 md:grid-cols-2">
                    <label className="grid gap-1 text-[10px] font-black uppercase tracking-wide" style={{ color: `${VERDE}99` }}>
                      Chamada pequena
                      <input
                        value={card.eyebrow}
                        onChange={(event) => updatePromoCard(card.id, { eyebrow: event.target.value })}
                        disabled={saving || disabled}
                        className="min-h-11 rounded-xl px-3 text-sm font-black outline-none"
                        style={{ border: `1.5px solid ${VERDE}18`, color: VERDE, background: "#fff" }}
                      />
                    </label>
                    <label className="grid gap-1 text-[10px] font-black uppercase tracking-wide" style={{ color: `${VERDE}99` }}>
                      Título/cupom
                      <input
                        value={card.title}
                        onChange={(event) => updatePromoCard(card.id, { title: event.target.value })}
                        disabled={saving || disabled}
                        className="min-h-11 rounded-xl px-3 text-sm font-black uppercase outline-none"
                        style={{ border: `1.5px solid ${VERDE}18`, color: VERDE, background: "#fff" }}
                      />
                    </label>
                    <label className="grid gap-1 text-[10px] font-black uppercase tracking-wide md:col-span-2" style={{ color: `${VERDE}99` }}>
                      Texto
                      <input
                        value={card.copy}
                        onChange={(event) => updatePromoCard(card.id, { copy: event.target.value })}
                        disabled={saving || disabled}
                        className="min-h-11 rounded-xl px-3 text-sm font-black outline-none"
                        style={{ border: `1.5px solid ${VERDE}18`, color: VERDE, background: "#fff" }}
                      />
                    </label>
                    <label className="grid gap-1 text-[10px] font-black uppercase tracking-wide" style={{ color: `${VERDE}99` }}>
                      Destaque
                      <input
                        value={card.value}
                        onChange={(event) => updatePromoCard(card.id, { value: event.target.value })}
                        disabled={saving || disabled}
                        className="min-h-11 rounded-xl px-3 text-sm font-black outline-none"
                        style={{ border: `1.5px solid ${VERDE}18`, color: VERDE, background: "#fff" }}
                      />
                    </label>
                    <label className="grid gap-1 text-[10px] font-black uppercase tracking-wide" style={{ color: `${VERDE}99` }}>
                      Complemento
                      <input
                        value={card.suffix}
                        onChange={(event) => updatePromoCard(card.id, { suffix: event.target.value })}
                        disabled={saving || disabled}
                        className="min-h-11 rounded-xl px-3 text-sm font-black outline-none"
                        style={{ border: `1.5px solid ${VERDE}18`, color: VERDE, background: "#fff" }}
                      />
                    </label>
                    <label className="grid gap-1 text-[10px] font-black uppercase tracking-wide" style={{ color: `${VERDE}99` }}>
                      Ícone
                      <select
                        value={card.icon}
                        onChange={(event) => updatePromoCard(card.id, { icon: event.target.value as PromoCardIcon })}
                        disabled={saving || disabled}
                        className="min-h-11 rounded-xl px-3 text-sm font-black outline-none"
                        style={{ border: `1.5px solid ${VERDE}18`, color: VERDE, background: "#fff" }}
                      >
                        {PROMO_CARD_ICON_OPTIONS.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>
                </div>

                <div className="relative min-h-[132px] overflow-hidden rounded-[18px] px-4 py-4 text-left text-white" style={{ background: "#65001F", opacity: card.enabled ? 1 : 0.55 }}>
                  <span className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full opacity-20" style={{ background: ROSA }} />
                  <span className="absolute right-3 top-3 flex min-h-14 min-w-16 flex-col items-center justify-center rounded-2xl px-2 text-center" style={{ background: ROSA, color: "#65001F" }}>
                    <span className="text-2xl font-black leading-none">{card.value || "10%"}</span>
                    <span className="mt-0.5 max-w-[58px] text-[10px] font-black uppercase leading-[0.95]">{card.suffix || "OFF"}</span>
                  </span>
                  <span className="grid max-w-[calc(100%-82px)] grid-cols-[48px_minmax(0,1fr)] gap-3">
                    <span className="flex h-12 w-12 items-center justify-center rounded-2xl" style={{ background: ROSA, color: "#65001F" }}>
                      <PreviewIcon size={24} strokeWidth={2.6} />
                    </span>
                    <span className="min-w-0 pt-0.5">
                      <span className="block text-[13px] font-black uppercase leading-tight text-white">{card.eyebrow || "Promoção"}</span>
                      <span className="mt-1 block truncate text-[clamp(1.75rem,8vw,2.35rem)] font-black uppercase leading-[0.9]" style={{ color: ROSA }}>
                        {card.title || "CUPOM"}
                      </span>
                      <span className="mt-2 block max-w-[210px] text-[11px] font-black uppercase leading-tight opacity-90">{card.copy || "Texto da oferta"}</span>
                    </span>
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t pt-4" style={{ borderColor: `${VERDE}12` }}>
          <p className="text-xs font-bold" style={{ color: hasUnsavedPromoCards ? "#B45309" : `${VERDE}99` }}>
            {hasUnsavedPromoCards ? "Há alterações nos cards que ainda não foram salvas." : "Cards promocionais salvos e ativos no cardápio."}
          </p>
          <button
            type="button"
            onClick={onSavePromoCards}
            disabled={saving || disabled || !hasUnsavedPromoCards}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-5 text-xs font-black uppercase"
            style={{
              background: hasUnsavedPromoCards ? VERDE : "#E5E7EB",
              color: hasUnsavedPromoCards ? ROSA : "#6B7280",
              opacity: saving || disabled ? 0.6 : 1,
            }}
          >
            <Save size={15} />
            {saving ? "Salvando..." : "Salvar cards"}
          </button>
        </div>
      </section>

      <section className="rounded-2xl p-4" style={{ background: "#fff", border: `1.5px solid ${VERDE}18` }}>
        <div className="mb-4 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl" style={{ background: ROSA, color: VERDE }}>
              <ImagePlus size={19} strokeWidth={2.4} />
            </div>
            <div>
              <p className="text-sm font-black uppercase" style={{ color: VERDE }}>Apresentação da tela de descanso</p>
              <p className="mt-1 text-xs font-bold opacity-55" style={{ color: VERDE }}>
                No desktop, três cliques em Cheddar duplo abrem essa apresentação. No kiosk, ela também é usada na tela de descanso.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => updatePresentation({ enabled: !normalizedPresentation.enabled })}
            disabled={saving || disabled}
            className="min-h-12 min-w-36 rounded-full px-5 text-xs font-black uppercase tracking-wide"
            style={{
              background: normalizedPresentation.enabled ? VERDE : "#E5E7EB",
              color: normalizedPresentation.enabled ? ROSA : "#4B5563",
              opacity: saving || disabled ? 0.6 : 1,
            }}
          >
            {normalizedPresentation.enabled ? "Ligada" : "Desligada"}
          </button>
        </div>

        <div className="grid gap-3 md:grid-cols-[1fr_180px_180px]">
          <label className="flex min-h-12 cursor-pointer items-center justify-center gap-2 rounded-2xl px-4 text-xs font-black uppercase" style={{ background: `${ROSA}35`, color: VERDE, border: `1.5px solid ${ROSA}` }}>
            <ImagePlus size={16} />
            Upload imagens
            <input
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              disabled={saving || disabled}
              onChange={(event) => {
                void addPresentationImages(event.target.files);
                event.currentTarget.value = "";
              }}
            />
          </label>
          <label className="grid gap-1 text-[10px] font-black uppercase tracking-wide" style={{ color: `${VERDE}99` }}>
            Quantas passam
            <input
              type="number"
              min={1}
              max={20}
              value={normalizedPresentation.imageCount}
              onChange={(event) => updatePresentation({ imageCount: Number(event.target.value) })}
              disabled={saving || disabled}
              className="min-h-12 rounded-2xl px-4 text-sm font-black outline-none"
              style={{ border: `1.5px solid ${VERDE}18`, color: VERDE, background: "#FFF8F2" }}
            />
          </label>
          <label className="grid gap-1 text-[10px] font-black uppercase tracking-wide" style={{ color: `${VERDE}99` }}>
            Tempo por imagem
            <input
              type="number"
              min={2}
              max={60}
              value={normalizedPresentation.intervalSeconds}
              onChange={(event) => updatePresentation({ intervalSeconds: Number(event.target.value) })}
              disabled={saving || disabled}
              className="min-h-12 rounded-2xl px-4 text-sm font-black outline-none"
              style={{ border: `1.5px solid ${VERDE}18`, color: VERDE, background: "#FFF8F2" }}
            />
          </label>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-3">
          {normalizedPresentation.images.map((image, index) => (
            <div
              key={`${image}-${index}`}
              draggable={!saving && !disabled}
              onDragStart={(event) => {
                event.dataTransfer.setData("text/plain", String(index));
                event.dataTransfer.effectAllowed = "move";
              }}
              onDragOver={(event) => {
                event.preventDefault();
                event.dataTransfer.dropEffect = "move";
              }}
              onDrop={(event) => {
                event.preventDefault();
                movePresentationImage(Number(event.dataTransfer.getData("text/plain")), index);
              }}
              className="overflow-hidden rounded-2xl"
              style={{ border: `1px solid ${VERDE}14`, background: "#FFF8F2", cursor: saving || disabled ? "default" : "grab" }}
            >
              <div className="relative aspect-video bg-black">
                <img src={image} alt={`Apresentação ${index + 1}`} className="h-full w-full object-cover" />
                <span className="absolute left-2 top-2 rounded-full px-2 py-1 text-[10px] font-black" style={{ background: "#fff", color: VERDE }}>
                  {index + 1}
                </span>
                <span className="absolute right-2 top-2 grid h-8 w-8 place-items-center rounded-full" style={{ background: "#fff", color: VERDE }}>
                  <GripVertical size={15} />
                </span>
              </div>
              <div className="grid grid-cols-[1fr_1fr_1.3fr] border-t" style={{ borderColor: `${VERDE}12` }}>
                <button
                  type="button"
                  onClick={() => movePresentationImage(index, index - 1)}
                  disabled={saving || disabled || index === 0}
                  className="px-2 py-3 text-[10px] font-black uppercase disabled:opacity-35"
                  style={{ color: VERDE }}
                >
                  Subir
                </button>
                <button
                  type="button"
                  onClick={() => movePresentationImage(index, index + 1)}
                  disabled={saving || disabled || index === normalizedPresentation.images.length - 1}
                  className="px-2 py-3 text-[10px] font-black uppercase disabled:opacity-35"
                  style={{ color: VERDE }}
                >
                  Descer
                </button>
                <button
                  type="button"
                  onClick={() => removePresentationImage(index)}
                  disabled={saving || disabled || normalizedPresentation.images.length <= 1}
                  className="flex items-center justify-center gap-2 px-3 py-3 text-[10px] font-black uppercase"
                  style={{ color: "#991B1B", opacity: normalizedPresentation.images.length <= 1 ? 0.45 : 1 }}
                >
                  <Trash2 size={13} />
                  Remover
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t pt-4" style={{ borderColor: `${VERDE}12` }}>
          <p className="text-xs font-bold" style={{ color: hasUnsavedPresentation ? "#B45309" : `${VERDE}99` }}>
            {hasUnsavedPresentation ? "Há alterações de apresentação que ainda não foram salvas." : "Apresentação salva e ativa no sistema."}
          </p>
          <button
            type="button"
            onClick={onSavePresentation}
            disabled={saving || disabled || !hasUnsavedPresentation}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-5 text-xs font-black uppercase"
            style={{
              background: hasUnsavedPresentation ? VERDE : "#E5E7EB",
              color: hasUnsavedPresentation ? ROSA : "#6B7280",
              opacity: saving || disabled ? 0.6 : 1,
            }}
          >
            <Save size={15} />
            {saving ? "Salvando..." : "Salvar apresentação"}
          </button>
        </div>
      </section>

      <section className="rounded-2xl p-4" style={{ background: "#fff", border: `1.5px solid ${VERDE}18` }}>
        <div className="mb-4 flex items-start gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ background: ROSA, color: VERDE }}>
            <CalendarClock size={19} strokeWidth={2.4} />
          </div>
          <div>
            <p className="text-sm font-black uppercase" style={{ color: VERDE }}>Horários de atendimento</p>
            <p className="mt-1 text-xs font-bold opacity-55" style={{ color: VERDE }}>
              Fora dos dias e horários ativos, o cliente vê o aviso configurado e não consegue enviar pedidos. A regra também é validada no backend.
            </p>
          </div>
        </div>
        <div className="grid gap-2">
          {normalizedOperatingHours.days.map((day) => (
            <div
              key={day.day}
              className="grid gap-3 rounded-xl p-3 md:grid-cols-[120px_130px_130px_1fr] md:items-center"
              style={{ background: "#FFF8F2", border: `1px solid ${VERDE}12` }}
            >
              <p className="text-sm font-black" style={{ color: VERDE }}>{day.label}</p>
              <button
                type="button"
                onClick={() => changeOperatingDay(day.day, { open: !day.open })}
                disabled={saving || disabled}
                className="rounded-full px-4 py-2 text-xs font-black uppercase"
                style={{
                  background: day.open ? VERDE : "#E5E7EB",
                  color: day.open ? ROSA : "#4B5563",
                  opacity: saving || disabled ? 0.6 : 1,
                }}
              >
                {day.open ? "Aberto" : "Fechado"}
              </button>
              <button
                type="button"
                onClick={() => changeOperatingDay(day.day, { soldOut: !day.soldOut })}
                disabled={saving || disabled}
                className="rounded-full px-4 py-2 text-xs font-black uppercase"
                style={{
                  background: day.soldOut ? "#EF4444" : "#E5E7EB",
                  color: day.soldOut ? "#fff" : "#4B5563",
                  opacity: saving || disabled ? 0.6 : 1,
                }}
              >
                {day.soldOut ? "Sold out" : "Normal"}
              </button>
              <div className="grid grid-cols-2 gap-2">
                <label className="grid gap-1 text-[10px] font-black uppercase tracking-wide" style={{ color: `${VERDE}99` }}>
                  Abre
                  <input
                    type="time"
                    value={day.start}
                    onChange={(event) => changeOperatingDay(day.day, { start: event.target.value })}
                    disabled={saving || disabled || !day.open}
                    className="min-h-11 rounded-xl px-3 text-sm font-black outline-none"
                    style={{ border: `1.5px solid ${VERDE}18`, color: VERDE, background: "#fff" }}
                  />
                </label>
                <label className="grid gap-1 text-[10px] font-black uppercase tracking-wide" style={{ color: `${VERDE}99` }}>
                  Fecha
                  <input
                    type="time"
                    value={day.end}
                    onChange={(event) => changeOperatingDay(day.day, { end: event.target.value })}
                    disabled={saving || disabled || !day.open}
                    className="min-h-11 rounded-xl px-3 text-sm font-black outline-none"
                    style={{ border: `1.5px solid ${VERDE}18`, color: VERDE, background: "#fff" }}
                  />
                </label>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t pt-4" style={{ borderColor: `${VERDE}12` }}>
          <p className="text-xs font-bold" style={{ color: hasUnsavedOperatingHours ? "#B45309" : `${VERDE}99` }}>
            {hasUnsavedOperatingHours
              ? "Há alterações de horário que ainda não foram salvas."
              : "Horários salvos e ativos no sistema."}
          </p>
          <button
            type="button"
            onClick={onSaveOperatingHours}
            disabled={saving || disabled || !hasUnsavedOperatingHours}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-5 text-xs font-black uppercase"
            style={{
              background: hasUnsavedOperatingHours ? VERDE : "#E5E7EB",
              color: hasUnsavedOperatingHours ? ROSA : "#6B7280",
              opacity: saving || disabled ? 0.6 : 1,
            }}
          >
            <Save size={15} />
            {saving ? "Salvando..." : "Salvar horários"}
          </button>
        </div>
      </section>

      <section className="rounded-2xl p-4" style={{ background: "#fff", border: `1.5px solid ${VERDE}18` }}>
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ background: ROSA, color: VERDE }}>
              <FlaskConical size={19} strokeWidth={2.4} />
            </div>
            <div>
              <p className="text-sm font-black uppercase" style={{ color: VERDE }}>Modo teste</p>
              <p className="mt-1 text-xs font-bold opacity-55" style={{ color: VERDE }}>
                Quando ligado, pedidos, estoque e cupons de simulação ficam separados da operação real.
              </p>
            </div>
          </div>
          <button
            onClick={onToggleTestMode}
            disabled={saving || disabled}
            className="min-w-24 rounded-full px-4 py-3 text-xs font-black uppercase"
            style={{
              background: testModeEnabled ? "#F59E0B" : "#E5E7EB",
              color: testModeEnabled ? "#fff" : "#4B5563",
              opacity: saving ? 0.6 : 1,
            }}
          >
            {testModeEnabled ? "Teste ligado" : "Teste desligado"}
          </button>
        </div>
      </section>

      <section className="rounded-2xl p-4" style={{ background: "#fff", border: `1.5px solid ${VERDE}18` }}>
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ background: ROSA, color: VERDE }}>
              <Table2 size={19} strokeWidth={2.4} />
            </div>
            <div>
              <p className="text-sm font-black uppercase" style={{ color: VERDE }}>Tabela teste</p>
              <p className="mt-1 text-xs font-bold opacity-55" style={{ color: VERDE }}>
                Liga um mock demonstrativo com 70 pedidos, clientes e montagem na cozinha sem gravar na operação real.
              </p>
            </div>
          </div>
          <button
            onClick={onToggleDemoTable}
            disabled={saving || disabled}
            className="min-w-24 rounded-full px-4 py-3 text-xs font-black uppercase"
            style={{
              background: demoTableEnabled ? VERDE : "#E5E7EB",
              color: demoTableEnabled ? ROSA : "#4B5563",
              opacity: saving ? 0.6 : 1,
            }}
          >
            {demoTableEnabled ? "Tabela ligada" : "Tabela desligada"}
          </button>
        </div>
      </section>

      <section className="rounded-2xl p-4" style={{ background: "#fff", border: "1.5px solid #FCA5A5" }}>
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-black uppercase" style={{ color: "#991B1B" }}>Zerar operação real</p>
            <p className="mt-1 text-xs font-bold opacity-70" style={{ color: "#991B1B" }}>
              Remove histórico real de vendas, cupons reais e quantidades de estoque real. Use só no início da operação.
            </p>
          </div>
          <button
            onClick={onResetRealOperation}
            disabled={saving || disabled}
            className="inline-flex items-center gap-2 rounded-xl px-4 py-3 text-xs font-black uppercase"
            style={{ background: "#FEF2F2", color: "#991B1B", border: "1px solid #FCA5A5" }}
          >
            <RotateCcw size={15} />
            Zerar real
          </button>
        </div>
      </section>
    </div>
  );
}

function encodePresentationImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("image_read_failed"));
    reader.onload = () => {
      const image = new Image();
      image.onerror = () => reject(new Error("image_load_failed"));
      image.onload = () => {
        const maxWidth = 1600;
        const scale = Math.min(1, maxWidth / image.width);
        const width = Math.max(1, Math.round(image.width * scale));
        const height = Math.max(1, Math.round(image.height * scale));
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const context = canvas.getContext("2d");
        if (!context) {
          reject(new Error("canvas_unavailable"));
          return;
        }
        context.drawImage(image, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", 0.84));
      };
      image.src = String(reader.result ?? "");
    };
    reader.readAsDataURL(file);
  });
}

function promoCardIcon(icon: PromoCardIcon): ElementType {
  switch (icon) {
    case "flame":
      return Flame;
    case "ticket":
      return Ticket;
    case "tag":
      return Tag;
    case "percent":
      return Percent;
    case "clock":
      return Clock;
    case "star":
      return Star;
    case "heart":
      return Heart;
    case "burger":
      return Beef;
    case "fries":
      return Utensils;
    case "gift":
    default:
      return Gift;
  }
}
