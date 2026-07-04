import { useEffect, useRef, useState } from "react";
import { CartItem, Order } from "@/types/order";
import {
  API_URL,
  Coupon,
  CheckoutStep,
  DeliveryType,
  KioskKeyboardTarget,
  PICKUP_ADDRESS,
  PaymentMethod,
  STORAGE_KEY,
  buildCheckoutPricing,
  findCoupon,
  findCouponFromBackend,
  loadSaved,
  lookupCEP,
  maskPhone,
  normalizeOperatingHours,
  playAttendantBeep,
  resolveRuntimeDeliveryType,
} from "./checkout";
import { submitCheckoutOrder } from "./cartFinalize";
import { inputStyle } from "./cartInputStyle";
import { MEMBER_TOKEN_KEY, readMemberProfile } from "@/components/product/shared";
import { SOLD_OUT_MESSAGE } from "@/components/product/SoldOutNotice";
import { formatDeliveryAddress } from "@/utils/address";

const COUPON_USAGE_STORAGE_KEY = "menfis_coupon_usage";
const SCHEDULE_TIMES = ["18:30", "19:00", "19:30", "20:00", "20:30", "21:00"] as const;

function normalizeKioskMobName(value?: string) {
  return String(value ?? "").trim().toUpperCase().replace(/[^A-Z0-9]/g, "-").replace(/-+/g, "-");
}

function couponUsageKey(coupon: Coupon, userId: string, phoneDigits: string) {
  const parts = [
    coupon.oncePerCustomer && userId ? `user:${userId}` : "",
    coupon.blockSamePhone && phoneDigits ? `phone:${phoneDigits}` : "",
  ].filter(Boolean);
  if (!parts.length) return "";
  return `${coupon.code.toUpperCase()}::${parts.join("|")}`;
}

function readCouponUsage() {
  try {
    return JSON.parse(localStorage.getItem(COUPON_USAGE_STORAGE_KEY) ?? "{}") as Record<string, number>;
  } catch {
    return {};
  }
}

function hasCustomerSession() {
  if (typeof window === "undefined") return false;
  return Boolean(localStorage.getItem(MEMBER_TOKEN_KEY));
}

function minutesFromTime(value: string) {
  const [hours, minutes] = value.split(":").map((part) => Number(part));
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return -1;
  return hours * 60 + minutes;
}

function saoPauloNowParts() {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Sao_Paulo",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date());
  const value = (type: string) => parts.find((part) => part.type === type)?.value ?? "";
  const dayMap: Record<string, number> = {
    Sun: 0,
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6,
  };
  return {
    day: dayMap[value("weekday")] ?? new Date().getDay(),
    minutes: Number(value("hour")) * 60 + Number(value("minute")),
  };
}

function isWithinConfiguredOperatingHours(value: unknown) {
  const config = normalizeOperatingHours(value);
  const now = saoPauloNowParts();
  const today = config.days.find((day) => day.day === now.day);
  if (!today?.open) return false;
  const start = minutesFromTime(today.start);
  const end = minutesFromTime(today.end);
  return start >= 0 && end > start && now.minutes >= start && now.minutes < end;
}

function couponDailyKey(coupon: Coupon) {
  return `${coupon.code.toUpperCase()}::day:${new Date().toISOString().slice(0, 10)}`;
}

function couponTotalKey(coupon: Coupon) {
  return `${coupon.code.toUpperCase()}::total`;
}

export function useCartCheckout({
  cart,
  updateQty,
  onPlaceOrder,
  goToMenu,
  kioskMode,
  initialCheckoutStep,
}: {
  cart: CartItem[];
  updateQty: (id: string, delta: number) => void;
  onPlaceOrder: (
    deliveryType: "retirada" | "delivery",
    phone?: string,
    address?: string,
    removedByItemId?: Record<string, string[]>,
    createdOrder?: Order,
  ) => void | Promise<void>;
  goToMenu: () => void;
  kioskMode: boolean;
  initialCheckoutStep?: CheckoutStep;
}) {
  const memberProfile = kioskMode ? null : readMemberProfile();
  const counterServiceMode =
    !kioskMode && normalizeKioskMobName(memberProfile?.name) === "KIOSK-MOB";
  const [delivery, setDelivery] = useState<DeliveryType>(
    kioskMode || counterServiceMode ? "retirada" : "delivery",
  );
  const [obsOpen, setObsOpen] = useState<string | null>(null);
  const [removed, setRemoved] = useState<Record<string, Set<string>>>({});
  const [savedBadge, setSavedBadge] = useState(false);
  const [checkoutStep, setCheckoutStep] = useState<CheckoutStep>(
    initialCheckoutStep ?? "bag",
  );
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [payment, setPayment] = useState<PaymentMethod>(
    kioskMode || counterServiceMode ? "pix" : "whatsapp",
  );
  const [paying, setPaying] = useState(false);
  const [paymentError, setPaymentError] = useState("");
  const [paymentSlow, setPaymentSlow] = useState(false);
  const [payOnDeliveryEnabled, setPayOnDeliveryEnabled] = useState(false);
  const [operatingNow, setOperatingNow] = useState(true);
  const [withinOperatingHours, setWithinOperatingHours] = useState(true);
  const [operatingHoursMessage, setOperatingHoursMessage] = useState("");
  const [closedHoursAlertOpen, setClosedHoursAlertOpen] = useState(false);
  const [soldOutEnabled, setSoldOutEnabled] = useState(false);
  const [soldOutMessage, setSoldOutMessage] = useState(SOLD_OUT_MESSAGE);
  const [soldOutAlertOpen, setSoldOutAlertOpen] = useState(false);
  const [deliverySchedule, setDeliverySchedule] = useState<"opening" | "scheduled">("opening");
  const [scheduledTime, setScheduledTime] = useState("18:30");
  const [kioskSuccessOpen, setKioskSuccessOpen] = useState(false);
  const [kioskSuccessOrder, setKioskSuccessOrder] = useState<Order | null>(null);
  const [kioskKeyboardTarget, setKioskKeyboardTarget] =
    useState<KioskKeyboardTarget>(null);
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  const [couponError, setCouponError] = useState("");

  const saved = kioskMode ? {} : loadSaved();
  const [cep, setCep] = useState<string>("");
  const [street, setStreet] = useState<string>("");
  const [number, setNumber] = useState<string>("");
  const [complement, setComplement] = useState<string>("");
  const [addressConfirmOpen, setAddressConfirmOpen] = useState(false);
  const [addressConfirmed, setAddressConfirmed] = useState(false);
  const [confirmedDeliveryAddress, setConfirmedDeliveryAddress] = useState("");
  const [customerName, setCustomerName] = useState<string>(
    counterServiceMode ? "KIOSK-MOB" : memberProfile?.name ?? "",
  );
  const [phone, setPhone] = useState<string>(
    maskPhone(memberProfile?.phone ?? saved.phone ?? ""),
  );
  const [cepLoading, setCepLoading] = useState(false);
  const [cepError, setCepError] = useState(false);

  const cepRef = useRef<HTMLInputElement>(null);
  const streetRef = useRef<HTMLInputElement>(null);
  const numberRef = useRef<HTMLInputElement>(null);
  const customerNameRef = useRef<HTMLInputElement>(null);
  const phoneRef = useRef<HTMLInputElement>(null);
  const counterPaymentResolveRef = useRef<((value: "pix" | "cartao") => void) | null>(null);
  const kioskKeyboardOpen = kioskMode && kioskKeyboardTarget !== null;

  const closeKioskKeyboard = () => {
    setKioskKeyboardTarget(null);
    if (typeof document !== "undefined") {
      const active = document.activeElement;
      if (active instanceof HTMLElement) active.blur();
    }
  };

  const [counterPaymentPromptOpen, setCounterPaymentPromptOpen] = useState(false);
  const [counterPaymentTotal, setCounterPaymentTotal] = useState(0);

  const resolveCounterPaymentPrompt = (value: "pix" | "cartao") => {
    const resolve = counterPaymentResolveRef.current;
    counterPaymentResolveRef.current = null;
    setCounterPaymentPromptOpen(false);
    resolve?.(value);
  };

  const confirmCounterPayment = (amount: number) =>
    new Promise<"pix" | "cartao">((resolve) => {
      counterPaymentResolveRef.current?.("cartao");
      counterPaymentResolveRef.current = resolve;
      setCounterPaymentTotal(amount);
      setCounterPaymentPromptOpen(true);
    });

  useEffect(
    () => () => {
      counterPaymentResolveRef.current?.("cartao");
      counterPaymentResolveRef.current = null;
    },
    [],
  );

  useEffect(() => {
    if (!kioskMode) return;
    localStorage.removeItem(STORAGE_KEY);
    setDelivery("retirada");
    setPayment((current) =>
      current === "cartao" || current === "pix" ? current : "pix",
    );
    if (checkoutStep === "delivery") setCheckoutStep("payment");
  }, [checkoutStep, kioskMode]);

  useEffect(() => {
    if (kioskMode || counterServiceMode) return;
    setPayment((current) =>
      current === "pix" ||
      current === "cartao" ||
      current === "pagar_na_entrega" ||
      current === "presencial" ||
      current === "whatsapp"
        ? current
        : "whatsapp",
    );
  }, [counterServiceMode, kioskMode]);

  useEffect(() => {
    if (!counterServiceMode) return;
    setDelivery("retirada");
    setPayment("presencial");
  }, [counterServiceMode]);

  useEffect(() => {
    if (kioskMode || counterServiceMode) return;
    if (delivery === "retirada" && payment === "pagar_na_entrega") {
      setPayment("presencial");
    }
    if (delivery === "delivery" && payment === "presencial") {
      setPayment("mercadopago");
    }
  }, [counterServiceMode, delivery, kioskMode, payment]);

  useEffect(() => {
    if (kioskMode || !API_URL) return;
    fetch(`${API_URL}/settings/public`, { cache: "no-store" })
      .then((response) => response.json())
      .then((settings) => {
        const enabled = settings.payOnDeliveryEnabled === true;
        setPayOnDeliveryEnabled(enabled);
        setWithinOperatingHours(isWithinConfiguredOperatingHours(settings.operatingHours));
        setOperatingNow(settings.operatingNow !== false);
        setOperatingHoursMessage(String(settings.operatingHoursMessage ?? ""));
        setSoldOutEnabled(settings.soldOutActive === true);
        setSoldOutMessage(String(settings.soldOutMessage ?? SOLD_OUT_MESSAGE));
        if (!enabled) {
          setPayment((current) =>
            current === "pagar_na_entrega" ? "pix" : current,
          );
        }
      })
      .catch(() => setPayOnDeliveryEnabled(false));
  }, [kioskMode]);

  useEffect(() => {
    if (kioskMode) {
      localStorage.removeItem(STORAGE_KEY);
      setSavedBadge(false);
      return;
    }
    if (!phone && !customerName) return;
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ phone, customerName }),
    );
    setSavedBadge(true);
    const timer = setTimeout(() => setSavedBadge(false), 2000);
    return () => clearTimeout(timer);
  }, [phone, customerName, kioskMode]);

  useEffect(() => {
    setAddressConfirmed(false);
    setConfirmedDeliveryAddress("");
  }, [cep, street, number, complement, delivery, deliverySchedule, scheduledTime]);

  useEffect(() => {
    const nums = cep.replace(/\D/g, "");
    if (nums.length !== 8) {
      setCepError(false);
      return;
    }
    setCepLoading(true);
    setCepError(false);
    lookupCEP(nums).then((data) => {
      setCepLoading(false);
      if (data) {
        setStreet(
          `${data.logradouro}, ${data.bairro} — ${data.localidade}/${data.uf}`,
        );
        setCepError(false);
      } else {
        setCepError(true);
        setStreet("");
      }
    });
  }, [cep]);

  const toggleRemove = (itemId: string, opt: string) =>
    setRemoved((prev) => {
      const next = new Set(prev[itemId] ?? []);
      next.has(opt) ? next.delete(opt) : next.add(opt);
      return { ...prev, [itemId]: next };
    });

  const effectiveDelivery = resolveRuntimeDeliveryType(
    kioskMode || counterServiceMode ? "retirada" : delivery,
  );
  const pricing = buildCheckoutPricing({
    items: cart,
    delivery: effectiveDelivery,
    coupon: appliedCoupon,
  });
  const subtotal = pricing.subtotal;
  const fee = pricing.deliveryFee;
  const serviceFee = pricing.serviceFee;
  const discount = pricing.discount;
  const total = pricing.total;

  const deliveryValid =
    (kioskMode || counterServiceMode || customerName.trim().length >= 2) &&
    phone.replace(/\D/g, "").length >= 10 &&
    (!kioskMode || customerName.trim().length >= 2) &&
    (kioskMode ||
      (effectiveDelivery === "retirada" ||
        (cep.replace(/\D/g, "").length === 8 &&
          !cepError &&
          street.length > 0 &&
          number.trim().length > 0)));

  const missingDelivery = [
    !kioskMode && !counterServiceMode && customerName.trim().length < 2
      ? "nome"
      : "",
    effectiveDelivery === "delivery" &&
    (cep.replace(/\D/g, "").length !== 8 || cepError)
      ? "CEP válido"
      : "",
    effectiveDelivery === "delivery" && !street.length ? "endereço" : "",
    effectiveDelivery === "delivery" && !number.trim().length ? "número" : "",
    phone.replace(/\D/g, "").length < 10 ? "WhatsApp" : "",
  ].filter(Boolean);

  const invalidDeliveryFields = {
    name: !kioskMode && !counterServiceMode && customerName.trim().length < 2,
    cep:
      effectiveDelivery === "delivery" &&
      (cep.replace(/\D/g, "").length !== 8 || cepError),
    street: effectiveDelivery === "delivery" && !street.trim().length,
    number: effectiveDelivery === "delivery" && !number.trim().length,
    phone: phone.replace(/\D/g, "").length < 10,
  };

  const focusFirstMissingDeliveryField = () => {
    const firstInvalid = (
      [
        ["name", customerNameRef],
        ["cep", cepRef],
        ["street", streetRef],
        ["number", numberRef],
        ["phone", phoneRef],
      ] as const
    ).find(([field]) => invalidDeliveryFields[field]);
    const input = firstInvalid?.[1].current;
    if (!input) return;
    input.scrollIntoView({ behavior: "smooth", block: "center" });
    window.setTimeout(() => input.focus(), 350);
  };

  const canCreatePayment =
    deliveryValid &&
    Boolean(payment) &&
    (kioskMode || counterServiceMode
      ? checkoutStep === "payment"
      : checkoutStep === "payment");

  const applyCoupon = async () => {
    closeKioskKeyboard();
    const coupon =
      findCoupon(couponCode) ?? (await findCouponFromBackend(couponCode));
    if (!coupon) {
      setAppliedCoupon(null);
      setCouponError("Cupom inválido ou inativo.");
      return;
    }
    const now = new Date();
    if (coupon.startsAt && now < new Date(`${coupon.startsAt}T00:00:00`)) {
      setAppliedCoupon(null);
      setCouponError("Cupom ainda não começou.");
      return;
    }
    if (coupon.endsAt && now > new Date(`${coupon.endsAt}T23:59:59`)) {
      setAppliedCoupon(null);
      setCouponError("Cupom encerrado.");
      return;
    }
    if (coupon.productIds?.length) {
      const allowed = new Set(coupon.productIds.map((id) => id.toLowerCase()));
      const hasParticipant = cart.some((item) =>
        allowed.has(String(item.productId ?? item.id).toLowerCase()),
      );
      if (!hasParticipant) {
        setAppliedCoupon(null);
        setCouponError("Cupom não vale para os produtos do carrinho.");
        return;
      }
    }
    const userId = memberProfile?.id ? String(memberProfile.id) : "";
    const phoneDigits = (memberProfile?.phone || phone).replace(/\D/g, "");
    const usageKey = couponUsageKey(coupon, userId, phoneDigits);
    const usage = readCouponUsage();
    if (usageKey && usage[usageKey]) {
      setAppliedCoupon(null);
      setCouponError("Cupom já utilizado por este cliente ou telefone.");
      return;
    }
    if (coupon.maxUsesPerDay && (usage[couponDailyKey(coupon)] ?? 0) >= coupon.maxUsesPerDay) {
      setAppliedCoupon(null);
      setCouponError("Limite diário deste cupom atingido.");
      return;
    }
    if (coupon.maxUsesTotal && (usage[couponTotalKey(coupon)] ?? 0) >= coupon.maxUsesTotal) {
      setAppliedCoupon(null);
      setCouponError("Limite total deste cupom atingido.");
      return;
    }
    setAppliedCoupon(coupon);
    setCouponCode(coupon.code);
    setCouponError("");
  };

  const getRemovedByItemId = () =>
    Object.fromEntries(
      Object.entries(removed)
        .map(([itemId, opts]) => [itemId, [...opts]])
        .filter(([, opts]) => opts.length > 0),
    ) as Record<string, string[]>;

  const getCustomerAddress = () =>
    effectiveDelivery === "retirada"
      ? [
          !withinOperatingHours
            ? deliverySchedule === "scheduled"
              ? `RETIRADA AGENDADA: cliente passa as ${scheduledTime}.`
              : "RETIRADA AGENDADA: cliente passa assim que abrir as 18:30."
            : "",
          `Retirada na loja - ${PICKUP_ADDRESS}`,
        ].filter(Boolean).join("\n")
      : confirmedDeliveryAddress || [
          !withinOperatingHours
            ? deliverySchedule === "scheduled"
              ? `PEDIDO AGENDADO: preparar para entrega as ${scheduledTime}.`
              : "PEDIDO ANTECIPADO: entregar assim que abrir as 18:30."
            : "",
          formatDeliveryAddress({ street, number, complement }),
        ].filter(Boolean).join("\n");

  const deliveryAddressRequiresConfirmation = effectiveDelivery === "delivery";

  const currentDeliveryAddress = [
    !withinOperatingHours
      ? deliverySchedule === "scheduled"
        ? `PEDIDO AGENDADO: preparar para entrega as ${scheduledTime}.`
        : "PEDIDO ANTECIPADO: entregar assim que abrir as 18:30."
      : "",
    formatDeliveryAddress({ street, number, complement }),
  ].filter(Boolean).join("\n");

  const confirmDeliveryAddress = () => {
    if (!deliveryValid || !deliveryAddressRequiresConfirmation) return;
    setConfirmedDeliveryAddress(currentDeliveryAddress);
    setAddressConfirmed(true);
    setAddressConfirmOpen(false);
    closeKioskKeyboard();
    setCheckoutStep("review");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const editDeliveryAddress = () => {
    setAddressConfirmOpen(false);
    setCheckoutStep("delivery");
    window.setTimeout(() => streetRef.current?.focus(), 150);
  };

  const submitSelectedPayment = async (selectedPayment: PaymentMethod) => {
    if (paying || !deliveryValid) return;
    if (!kioskMode && !counterServiceMode && !hasCustomerSession()) {
      setPaymentError("Entre ou crie seu perfil Menfi's para finalizar o pedido.");
      setCheckoutStep("delivery");
      return;
    }
    if (deliveryAddressRequiresConfirmation && !addressConfirmed) {
      setAddressConfirmOpen(true);
      setCheckoutStep("delivery");
      return;
    }
    if (soldOutEnabled && !kioskMode && !counterServiceMode) {
      setPaymentError("");
      setSoldOutAlertOpen(true);
      return;
    }
    if (!operatingNow && !kioskMode && !counterServiceMode) {
      setPaymentError("");
      setClosedHoursAlertOpen(true);
      return;
    }
    setPayment(selectedPayment);
    setPaymentError("");
    closeKioskKeyboard();
    if (checkoutStep === "bag") {
      return;
    }
    const removedByItemId = getRemovedByItemId();
    const address = getCustomerAddress();

    await submitCheckoutOrder({
      cart,
      kioskMode,
      counterServiceMode,
      delivery: effectiveDelivery,
      payment: selectedPayment,
      customerName,
      phone,
      address,
      appliedCoupon,
      discount,
      total,
      removedByItemId,
      onPlaceOrder,
      setPaying,
      setPaymentSlow,
      setKioskSuccessOpen,
      setKioskSuccessOrder,
      setPaymentError,
      onRestaurantClosed: () => {
        setPaymentError("");
        setClosedHoursAlertOpen(true);
      },
      confirmCounterPayment,
      clearCartItems: clearCart,
    });
    if (appliedCoupon) {
      const userId = memberProfile?.id ? String(memberProfile.id) : "";
      const phoneDigits = (memberProfile?.phone || phone).replace(/\D/g, "");
      const usageKey = couponUsageKey(appliedCoupon, userId, phoneDigits);
      if (usageKey || appliedCoupon.maxUsesPerDay || appliedCoupon.maxUsesTotal) {
        const usage = readCouponUsage();
        localStorage.setItem(
          COUPON_USAGE_STORAGE_KEY,
          JSON.stringify({
            ...usage,
            ...(usageKey ? { [usageKey]: Date.now() } : {}),
            [couponDailyKey(appliedCoupon)]: (usage[couponDailyKey(appliedCoupon)] ?? 0) + 1,
            [couponTotalKey(appliedCoupon)]: (usage[couponTotalKey(appliedCoupon)] ?? 0) + 1,
          }),
        );
      }
    }
  };

  const handleFinalize = async () => {
    if (paying) return;

    setSubmitAttempted(true);
    setPaymentError("");

    if (soldOutEnabled && !kioskMode && !counterServiceMode) {
      setSoldOutAlertOpen(true);
      return;
    }

    if (checkoutStep === "bag") {
      if (kioskMode) playAttendantBeep();
      closeKioskKeyboard();
      setCheckoutStep(kioskMode ? "customer" : counterServiceMode ? "payment" : "delivery");
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    if (checkoutStep === "delivery") {
      if (!deliveryValid) {
        focusFirstMissingDeliveryField();
        return;
      }
      if (deliveryAddressRequiresConfirmation && !addressConfirmed) {
        setAddressConfirmOpen(true);
        return;
      }
      closeKioskKeyboard();
      setCheckoutStep("review");
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    if (checkoutStep === "customer") {
      if (!deliveryValid) {
        const input =
          customerName.trim().length < 2
            ? customerNameRef.current
            : phoneRef.current;
        input?.scrollIntoView({ behavior: "smooth", block: "center" });
        window.setTimeout(() => input?.focus(), 350);
        return;
      }
      closeKioskKeyboard();
      setCheckoutStep("review");
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    if (checkoutStep === "payment") {
      if (!kioskMode && !payment) return;
      if (kioskMode && !deliveryValid) {
        const input =
          customerName.trim().length < 2
            ? customerNameRef.current
            : phoneRef.current;
        input?.scrollIntoView({ behavior: "smooth", block: "center" });
        window.setTimeout(() => input?.focus(), 350);
        return;
      }
      if (kioskMode || counterServiceMode) {
        if (!canCreatePayment) return;
      }
    }

    if (checkoutStep === "review" && kioskMode) {
      closeKioskKeyboard();
      setCheckoutStep("payment");
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    if (checkoutStep === "review" && !kioskMode && !counterServiceMode) {
      if (!hasCustomerSession()) {
        setPaymentError("Entre ou crie seu perfil Menfi's para finalizar o pedido.");
        setCheckoutStep("delivery");
        return;
      }
      if (deliveryAddressRequiresConfirmation && !addressConfirmed) {
        setAddressConfirmOpen(true);
        setCheckoutStep("delivery");
        return;
      }
      closeKioskKeyboard();
      setCheckoutStep("payment");
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    if (!canCreatePayment) return;
    closeKioskKeyboard();

    await submitSelectedPayment(payment);
  };
  const handleBack = () => {
    closeKioskKeyboard();
    if (checkoutStep === "payment" && kioskMode) {
      setCheckoutStep("review");
      return;
    }
    if (checkoutStep === "review") {
      setCheckoutStep(kioskMode ? "customer" : "delivery");
      return;
    }
    if (checkoutStep === "customer") {
      setCheckoutStep("bag");
      return;
    }
    if (checkoutStep === "payment") {
      setCheckoutStep(kioskMode || counterServiceMode ? "bag" : "review");
      return;
    }
    if (checkoutStep === "delivery") {
      setCheckoutStep("bag");
      return;
    }
    goToMenu();
  };

  const typeKioskKey = (key: string) => {
    if (kioskKeyboardTarget === "name") {
      setCustomerName((current) => `${current}${key}`.slice(0, 36));
      return;
    }
    if (kioskKeyboardTarget === "coupon") {
      setCouponCode((current) => `${current}${key}`.slice(0, 24));
      setCouponError("");
      return;
    }
    if (kioskKeyboardTarget === "phone") {
      setPhone((current) => maskPhone(`${current}${key}`));
    }
  };

  const backspaceKioskKey = () => {
    if (kioskKeyboardTarget === "name") {
      setCustomerName((current) => current.slice(0, -1));
      return;
    }
    if (kioskKeyboardTarget === "coupon") {
      setCouponCode((current) => current.slice(0, -1));
      setCouponError("");
      return;
    }
    if (kioskKeyboardTarget === "phone") {
      setPhone((current) => maskPhone(current.replace(/\D/g, "").slice(0, -1)));
    }
  };

  const clearKioskKey = () => {
    if (kioskKeyboardTarget === "name") setCustomerName("");
    if (kioskKeyboardTarget === "coupon") {
      setCouponCode("");
      setCouponError("");
    }
    if (kioskKeyboardTarget === "phone") setPhone("");
  };

  const stepLabel =
    checkoutStep === "bag"
      ? "Sacola"
      : checkoutStep === "delivery"
        ? "Dados"
        : checkoutStep === "customer"
          ? "Dados do cliente"
          : checkoutStep === "payment"
          ? "Pagamento"
          : "Revisão";

  const nextActionLabel =
    soldOutEnabled && !kioskMode && !counterServiceMode
      ? "Avise-me quando voltar"
      :
    checkoutStep === "payment" && (kioskMode || counterServiceMode)
      ? counterServiceMode
        ? "Pagar no balcão"
        : "Enviar pedido para a cozinha"
      : checkoutStep === "payment"
      ? payment === "whatsapp"
        ? "Enviar para WhatsApp"
        : payment === "mercadopago"
        ? "Finalizar com Mercado Pago"
        : payment === "pix_qrcode"
        ? "Finalizar com Mercado Pago"
        : payment === "pix"
        ? "Gerar QR Code Pix"
        : "Finalizar pagamento"
      : checkoutStep === "review"
      ? counterServiceMode
        ? "Enviar para balcão"
        : kioskMode
        ? "Ir para pagamento"
        : "Escolher pagamento"
      : "Continuar";

  const clearCart = () => {
    cart.forEach((item) => updateQty(item.id, -item.qty));
  };

  return {
    appliedCoupon,
    addressConfirmOpen,
    addressConfirmed,
    currentDeliveryAddress,
    applyCoupon,
    backspaceKioskKey,
    cep,
    cepError,
    cepLoading,
    cepRef,
    checkoutStep,
    closedHoursAlertOpen,
    closedHoursAlertMessage:
    operatingHoursMessage ||
      "Assim que abrirmos, você será informado e poderá finalizar seu pedido.",
    operatingNow,
    withinOperatingHours,
    closeClosedHoursAlert: () => setClosedHoursAlertOpen(false),
    closeSoldOutAlert: () => setSoldOutAlertOpen(false),
    confirmDeliveryAddress,
    clearCart,
    clearKioskKey,
    complement,
    couponCode,
    couponError,
    counterServiceMode,
    counterPaymentPromptOpen,
    counterPaymentTotal,
    customerName,
    customerNameRef,
    delivery,
    deliverySchedule,
    deliveryValid,
    editDeliveryAddress,
    discount,
    fee,
    handleBack,
    handleFinalize,
    finalizeWithPayment: submitSelectedPayment,
    inputStyle,
    invalidDeliveryFields,
    kioskKeyboardOpen,
    kioskKeyboardTarget,
    kioskSuccessOpen,
    kioskSuccessOrder,
    missingDelivery,
    nextActionLabel,
    number,
    numberRef,
    obsOpen,
    payOnDeliveryEnabled,
    paying,
    payment,
    paymentError,
    paymentSlow,
    phone,
    phoneRef,
    removed,
    savedBadge,
    scheduledTime,
    scheduleTimes: [...SCHEDULE_TIMES],
    serviceFee,
    setAppliedCoupon,
    setCep,
    setCheckoutStep,
    setComplement,
    setCouponCode,
    setCouponError,
    setCustomerName,
    setDelivery,
    setDeliverySchedule,
    setKioskKeyboardTarget,
    closeKioskKeyboard,
    setNumber,
    setObsOpen,
    setPayment,
    setPhone,
    setScheduledTime,
    setStreet,
    soldOutAlertOpen,
    soldOutEnabled,
    soldOutMessage,
    confirmCounterPaymentChoice: resolveCounterPaymentPrompt,
    stepLabel,
    street,
    streetRef,
    submitAttempted,
    subtotal,
    toggleRemove,
    total,
    typeKioskKey,
  };
}
