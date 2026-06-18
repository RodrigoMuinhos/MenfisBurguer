import { useEffect, useRef, useState } from "react";
import { CartItem, Order } from "@/types/order";
import {
  API_URL,
  Coupon,
  DEFAULT_OPERATING_HOURS,
  CheckoutStep,
  DeliveryType,
  KioskKeyboardTarget,
  OperatingHoursConfig,
  PICKUP_ADDRESS,
  PaymentMethod,
  STORAGE_KEY,
  SUPPORT_WHATSAPP_URL,
  buildCheckoutPricing,
  findCoupon,
  findCouponFromBackend,
  getOperatingHoursBlockMessage,
  loadSaved,
  lookupCEP,
  maskPhone,
  normalizeOperatingHours,
  playAttendantBeep,
  resolveRuntimeDeliveryType,
} from "./checkout";
import { submitCheckoutOrder } from "./cartFinalize";
import { inputStyle } from "./cartInputStyle";
import { readMemberProfile } from "@/components/product/shared";
import { formatDeliveryAddress } from "@/utils/address";

function normalizeKioskMobName(value?: string) {
  return String(value ?? "").trim().toUpperCase().replace(/[^A-Z0-9]/g, "-").replace(/-+/g, "-");
}

export function useCartCheckout({
  cart,
  updateQty,
  onPlaceOrder,
  goToMenu,
  kioskMode,
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
  const [checkoutStep, setCheckoutStep] = useState<CheckoutStep>("bag");
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [payment, setPayment] = useState<PaymentMethod>(
    kioskMode || counterServiceMode ? "pix" : "whatsapp",
  );
  const [paying, setPaying] = useState(false);
  const [paymentError, setPaymentError] = useState("");
  const [paymentSlow, setPaymentSlow] = useState(false);
  const [payOnDeliveryEnabled, setPayOnDeliveryEnabled] = useState(false);
  const [operatingHours, setOperatingHours] = useState<OperatingHoursConfig>(DEFAULT_OPERATING_HOURS);
  const [kioskSuccessOpen, setKioskSuccessOpen] = useState(false);
  const [kioskSuccessOrder, setKioskSuccessOrder] = useState<Order | null>(null);
  const [kioskKeyboardTarget, setKioskKeyboardTarget] =
    useState<KioskKeyboardTarget>(null);
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  const [couponError, setCouponError] = useState("");

  const saved = kioskMode ? {} : loadSaved();
  const [cep, setCep] = useState<string>(saved.cep ?? "");
  const [street, setStreet] = useState<string>(
    saved.street || "",
  );
  const [number, setNumber] = useState<string>(
    saved.number ?? "",
  );
  const [complement, setComplement] = useState<string>(
    saved.complement ?? "",
  );
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
  const counterPrintResolveRef = useRef<((value: boolean) => void) | null>(null);
  const counterPrintTimerRef = useRef<number | null>(null);
  const kioskKeyboardOpen = kioskMode && kioskKeyboardTarget !== null;

  const closeKioskKeyboard = () => {
    setKioskKeyboardTarget(null);
    if (typeof document !== "undefined") {
      const active = document.activeElement;
      if (active instanceof HTMLElement) active.blur();
    }
  };

  const [counterPrintPromptOpen, setCounterPrintPromptOpen] = useState(false);

  const resolveCounterPrintPrompt = (value: boolean) => {
    if (counterPrintTimerRef.current !== null) {
      window.clearTimeout(counterPrintTimerRef.current);
      counterPrintTimerRef.current = null;
    }
    const resolve = counterPrintResolveRef.current;
    counterPrintResolveRef.current = null;
    setCounterPrintPromptOpen(false);
    resolve?.(value);
  };

  const confirmCounterPrint = (_order: Order) =>
    new Promise<boolean>((resolve) => {
      if (counterPrintTimerRef.current !== null) {
        window.clearTimeout(counterPrintTimerRef.current);
      }
      counterPrintResolveRef.current?.(false);
      counterPrintResolveRef.current = resolve;
      setCounterPrintPromptOpen(true);
      counterPrintTimerRef.current = window.setTimeout(() => {
        resolveCounterPrintPrompt(false);
      }, 10000);
    });

  useEffect(
    () => () => {
      if (counterPrintTimerRef.current !== null) {
        window.clearTimeout(counterPrintTimerRef.current);
      }
      counterPrintResolveRef.current?.(false);
      counterPrintResolveRef.current = null;
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
    setDelivery("delivery");
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
      setPayment("pix");
    }
  }, [counterServiceMode, delivery, kioskMode, payment]);

  useEffect(() => {
    if (kioskMode || !API_URL) return;
    fetch(`${API_URL}/settings/public`, { cache: "no-store" })
      .then((response) => response.json())
      .then((settings) => {
        const enabled = settings.payOnDeliveryEnabled === true;
        setPayOnDeliveryEnabled(enabled);
        setOperatingHours(normalizeOperatingHours(settings.operatingHours));
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
    if (!cep && !phone) return;
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ cep, street, number, complement, phone, customerName }),
    );
    setSavedBadge(true);
    const timer = setTimeout(() => setSavedBadge(false), 2000);
    return () => clearTimeout(timer);
  }, [cep, street, number, complement, phone, customerName, kioskMode]);

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
    kioskMode || counterServiceMode ? "retirada" : "delivery",
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
    phone.replace(/\D/g, "").length >= 10 &&
    (!kioskMode || customerName.trim().length >= 2) &&
    (kioskMode ||
      (effectiveDelivery === "retirada" ||
        (cep.replace(/\D/g, "").length === 8 &&
          !cepError &&
          street.length > 0 &&
          number.trim().length > 0)));

  const missingDelivery = [
    effectiveDelivery === "delivery" &&
    (cep.replace(/\D/g, "").length !== 8 || cepError)
      ? "CEP válido"
      : "",
    effectiveDelivery === "delivery" && !street.length ? "endereço" : "",
    effectiveDelivery === "delivery" && !number.trim().length ? "número" : "",
    phone.replace(/\D/g, "").length < 10 ? "WhatsApp" : "",
  ].filter(Boolean);

  const invalidDeliveryFields = {
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
      ? `Retirada na loja - ${PICKUP_ADDRESS}`
      : formatDeliveryAddress({ street, number, complement });

  const handleFinalize = async () => {
    if (paying) return;

    setSubmitAttempted(true);
    setPaymentError("");

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
      closeKioskKeyboard();
      setCheckoutStep("payment");
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    if (!canCreatePayment) return;
    closeKioskKeyboard();

    if (!kioskMode && !counterServiceMode) {
      const blockMessage = getOperatingHoursBlockMessage(new Date(), operatingHours);
      if (blockMessage) {
        const text = [
          blockMessage,
          "",
          "Quero fazer meu pedido pelo WhatsApp.",
        ].join("\n");
        window.open(
          `${SUPPORT_WHATSAPP_URL}?text=${encodeURIComponent(text)}`,
          "_blank",
          "noopener,noreferrer",
        );
        setPaymentError("Estamos fora do horário de pagamento automático. Continue pelo WhatsApp.");
        return;
      }
    }

    const removedByItemId = getRemovedByItemId();
    const address = getCustomerAddress();

    await submitCheckoutOrder({
      cart,
      kioskMode,
      counterServiceMode,
      delivery: effectiveDelivery,
      payment,
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
      confirmCounterPrint,
      clearCartItems: clearCart,
    });
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
    checkoutStep === "payment" && (kioskMode || counterServiceMode)
      ? counterServiceMode
        ? "Pagar no balcão"
        : "Enviar pedido para a cozinha"
      : checkoutStep === "payment"
      ? payment === "whatsapp"
        ? "Enviar para WhatsApp"
        : payment === "mercadopago"
        ? "Abrir Mercado Pago"
        : payment === "pix_qrcode" || payment === "pix"
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
    applyCoupon,
    backspaceKioskKey,
    cep,
    cepError,
    cepLoading,
    cepRef,
    checkoutStep,
    clearCart,
    clearKioskKey,
    complement,
    couponCode,
    couponError,
    counterServiceMode,
    counterPrintPromptOpen,
    customerName,
    customerNameRef,
    delivery,
    deliveryValid,
    discount,
    fee,
    handleBack,
    handleFinalize,
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
    serviceFee,
    setAppliedCoupon,
    setCep,
    setCheckoutStep,
    setComplement,
    setCouponCode,
    setCouponError,
    setCustomerName,
    setDelivery,
    setKioskKeyboardTarget,
    closeKioskKeyboard,
    setNumber,
    setObsOpen,
    setPayment,
    setPhone,
    setStreet,
    confirmCounterPrintChoice: () => resolveCounterPrintPrompt(true),
    skipCounterPrintChoice: () => resolveCounterPrintPrompt(false),
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
