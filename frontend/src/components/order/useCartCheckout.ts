import { useEffect, useRef, useState } from "react";
import { CartItem, Order } from "@/types/order";
import {
  API_URL,
  Coupon,
  CheckoutStep,
  DeliveryType,
  KioskKeyboardTarget,
  MEMBER_KEY,
  PICKUP_ADDRESS,
  PaymentMethod,
  SERVICE_FEE,
  STORAGE_KEY,
  couponDiscount,
  findCoupon,
  findCouponFromBackend,
  loadSaved,
  lookupCEP,
  maskPhone,
  playAttendantBeep,
  resolveRuntimeDeliveryType,
} from "./checkout";
import { submitCheckoutOrder } from "./cartFinalize";
import { inputStyle } from "./cartInputStyle";
import { readMemberProfile } from "@/components/product/shared";

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
    !kioskMode && String(memberProfile?.name ?? "").trim().toUpperCase() === "KIOSK-MOB";
  const [delivery, setDelivery] = useState<DeliveryType>(
    kioskMode || counterServiceMode ? "retirada" : "delivery",
  );
  const [obsOpen, setObsOpen] = useState<string | null>(null);
  const [removed, setRemoved] = useState<Record<string, Set<string>>>({});
  const [savedBadge, setSavedBadge] = useState(false);
  const [checkoutStep, setCheckoutStep] = useState<CheckoutStep>("bag");
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [payment, setPayment] = useState<PaymentMethod>("pix");
  const [paying, setPaying] = useState(false);
  const [paymentError, setPaymentError] = useState("");
  const [paymentSlow, setPaymentSlow] = useState(false);
  const [payOnDeliveryEnabled, setPayOnDeliveryEnabled] = useState(false);
  const [kioskSuccessOpen, setKioskSuccessOpen] = useState(false);
  const [kioskKeyboardTarget, setKioskKeyboardTarget] =
    useState<KioskKeyboardTarget>(null);
  const [freeShipping, setFreeShipping] = useState(false);
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
    memberProfile?.name ?? "",
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
  const kioskKeyboardOpen = kioskMode && kioskKeyboardTarget !== null;

  const closeKioskKeyboard = () => {
    setKioskKeyboardTarget(null);
    if (typeof document !== "undefined") {
      const active = document.activeElement;
      if (active instanceof HTMLElement) active.blur();
    }
  };

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
  }, [counterServiceMode, kioskMode]);

  useEffect(() => {
    if (!counterServiceMode) return;
    setDelivery("retirada");
    setPayment("presencial");
  }, [counterServiceMode]);

  useEffect(() => {
    setFreeShipping(Boolean(localStorage.getItem(MEMBER_KEY)));
  }, []);

  useEffect(() => {
    if (kioskMode || !API_URL) return;
    fetch(`${API_URL}/settings/public`, { cache: "no-store" })
      .then((response) => response.json())
      .then((settings) => {
        const enabled = settings.payOnDeliveryEnabled === true;
        setPayOnDeliveryEnabled(enabled);
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

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
  const effectiveDelivery = resolveRuntimeDeliveryType(
    kioskMode || counterServiceMode ? "retirada" : "delivery",
  );
  const fee = effectiveDelivery === "delivery" && !freeShipping ? 5.1 : 0;
  const serviceFee = effectiveDelivery === "delivery" && subtotal > 0 ? SERVICE_FEE : 0;
  const grossTotal = subtotal + fee + serviceFee;
  const discount = couponDiscount(appliedCoupon, grossTotal, cart);
  const total = Math.max(1, grossTotal - discount);

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
      : checkoutStep === "review");

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
      : `${street}, ${number}${complement ? ` ${complement}` : ""}`;

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
      setCheckoutStep("payment");
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
      } else {
        closeKioskKeyboard();
        setCheckoutStep("review");
        window.scrollTo({ top: 0, behavior: "smooth" });
        return;
      }
    }

    if (checkoutStep === "review" && kioskMode) {
      closeKioskKeyboard();
      setCheckoutStep("payment");
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    if (!canCreatePayment) return;
    closeKioskKeyboard();

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
      setPaymentError,
    });
  };
  const handleBack = () => {
    closeKioskKeyboard();
    if (checkoutStep === "payment" && kioskMode) {
      setCheckoutStep("review");
      return;
    }
    if (checkoutStep === "review") {
      setCheckoutStep(kioskMode ? "customer" : "payment");
      return;
    }
    if (checkoutStep === "customer") {
      setCheckoutStep("bag");
      return;
    }
    if (checkoutStep === "payment") {
      setCheckoutStep(kioskMode || counterServiceMode ? "bag" : "delivery");
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
          ? kioskMode || counterServiceMode
            ? "Pagamento"
            : "Pagamento"
          : kioskMode
            ? "Revisão"
            : "Pagamento";

  const nextActionLabel =
    checkoutStep === "payment" && (kioskMode || counterServiceMode)
      ? counterServiceMode
        ? "Pagar no balcão"
        : "Enviar pedido para a cozinha"
      : checkoutStep === "review"
      ? counterServiceMode
        ? "Enviar para balcão"
        : kioskMode
        ? "Ir para pagamento"
        : payment === "whatsapp"
          ? "Enviar para atendimento"
          : "Fazer pagamento"
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
    customerName,
    customerNameRef,
    delivery,
    deliveryValid,
    discount,
    fee,
    freeShipping,
    handleBack,
    handleFinalize,
    inputStyle,
    invalidDeliveryFields,
    kioskKeyboardOpen,
    kioskKeyboardTarget,
    kioskSuccessOpen,
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
