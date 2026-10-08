import { MercadoPagoPixModal } from "./MercadoPagoPixModal";
import { useEffect, useMemo, useRef, useState } from "react";
import { CartItem, Order } from "@/types/order";
import { ROSA, VERDE } from "@/utils/theme";
import {
  CartHeader,
  CheckoutIntro,
  CheckoutProgress,
  EmptyCartState,
} from "./CartChrome";
import { CartItemsSection } from "./CartItemsSection";
import { OrderSummarySection } from "./OrderSummarySection";
import { PaymentStepSection } from "./PaymentStepSection";
import { DeliveryFormSection } from "./DeliveryFormSection";
import { CartOverlays } from "./CartOverlays";
import { ClosedHoursAlertModal } from "./ClosedHoursAlertModal";
import { CartStickyCta } from "./CartStickyCta";
import { CheckoutReviewSection } from "./CheckoutReviewSection";
import { useCartCheckout } from "./useCartCheckout";
import { CartBagStepSection } from "./CartBagStepSection";
import { DeliveryChoiceSection } from "./DeliveryChoiceSection";
import { CheckoutStep, fmt, maskPhone } from "./checkout";
import { MEMBER_TOKEN_KEY, MemberProfile, readMemberProfile } from "@/components/product/shared";
import { loginCustomerSession, saveCustomerSession } from "@/services/customerSession";
import { SoldOutAlertModal } from "@/components/product/SoldOutNotice";

interface Props {
  cart: CartItem[];
  addToCart: (item: Omit<CartItem, "qty">) => void;
  updateQty: (id: string, delta: number) => void;
  onPlaceOrder: (
    deliveryType: "retirada" | "delivery",
    phone?: string,
    address?: string,
    removedByItemId?: Record<string, string[]>,
    createdOrder?: Order,
  ) => void | Promise<void>;
  goToMenu: () => void;
  kioskMode?: boolean;
  initialCheckoutStep?: CheckoutStep;
  /** Reports whether an order is being sent or confirmed (blocks kiosk idle; the Pix modal reports itself). */
  onCheckoutLockChange?: (locked: boolean) => void;
  /** Called when the checkout ends without an order (cart emptied, payment cancelled/expired). */
  onFlowEnd?: () => void;
  /** Kiosk session (?kiosk=1 or KIOSK-MOB): abandoned checkouts end the session. */
  idleHomeMode?: boolean;
}

export function CartScreen({
  cart,
  addToCart,
  updateQty,
  onPlaceOrder,
  goToMenu,
  kioskMode = false,
  initialCheckoutStep,
  onCheckoutLockChange,
  onFlowEnd,
  idleHomeMode = kioskMode,
}: Props) {
  const [memberProfile, setMemberProfile] = useState<MemberProfile | null>(() => {
    if (kioskMode || typeof window === "undefined") return null;
    return localStorage.getItem(MEMBER_TOKEN_KEY) ? readMemberProfile() : null;
  });
  const [memberAuthMode, setMemberAuthMode] = useState<"register" | "login">("register");
  const [memberName, setMemberName] = useState("");
  const [memberEmail, setMemberEmail] = useState("");
  const [memberPhone, setMemberPhone] = useState("");
  const [memberPassword, setMemberPassword] = useState("");
  const [memberPasswordConfirm, setMemberPasswordConfirm] = useState("");
  const [memberLogin, setMemberLogin] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [memberError, setMemberError] = useState("");
  const [memberSaving, setMemberSaving] = useState(false);
  const {
    appliedCoupon,
    addressConfirmOpen,
    currentDeliveryAddress,
    applyCoupon,
    backspaceKioskKey,
    cep,
    cepError,
    cepLoading,
    cepRef,
    checkoutStep,
    closedHoursAlertMessage,
    closedHoursAlertOpen,
    closeClosedHoursAlert,
    closeSoldOutAlert,
    confirmDeliveryAddress,
    clearCart,
    closeKioskKeyboard,
    clearKioskKey,
    complement,
    couponCode,
    couponError,
    counterServiceMode,
    pixPaymentRequest,
    closePixPayment,
    counterPaymentPromptOpen,
    counterPaymentTotal,
    counterCustomerNamePromptOpen,
    counterCustomerNameDraft,
    setCounterCustomerNameDraft,
    confirmCounterCustomerNameChoice,
    customerName,
    customerNameRef,
    delivery,
    operatingNow,
    withinOperatingHours,
    deliverySchedule,
    deliveryValid,
    editDeliveryAddress,
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
    closeKioskSuccess,
    missingDelivery,
    nextActionLabel,
    number,
    numberRef,
    obsOpen,
    paying,
    payment,
    paymentError,
    paymentSlow,
    phone,
    phoneRef,
    removed,
    savedBadge,
    scheduledTime,
    scheduleTimes,
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
    setNumber,
    setObsOpen,
    setPayment,
    setPhone,
    setScheduledTime,
    setStreet,
    confirmCounterPaymentChoice,
    cancelCounterPaymentChoice,
    stepLabel,
    street,
    streetRef,
    submitAttempted,
    soldOutAlertOpen,
    soldOutEnabled,
    soldOutMessage,
    subtotal,
    toggleRemove,
    total,
    typeKioskKey,
  } = useCartCheckout({
    cart,
    updateQty,
    onPlaceOrder,
    goToMenu,
    kioskMode,
    initialCheckoutStep,
  });
  const profileReady =
    kioskMode ||
    counterServiceMode ||
    Boolean(
      memberProfile?.name?.trim() &&
        memberProfile.phone?.replace(/\D/g, "").length >= 10 &&
        memberProfile.hasPassword !== false,
    );

  const applyProfileToCheckout = (profile: MemberProfile) => {
    setMemberProfile(profile);
    setCustomerName(profile.name ?? "");
    setPhone(maskPhone(profile.phone ?? ""));
  };

  const saveMember = async () => {
    const name = memberName.trim();
    const email = memberEmail.trim().toLowerCase();
    const phoneValue = memberPhone.trim();
    const password = memberPassword.trim();
    const confirmPassword = memberPasswordConfirm.trim();
    setMemberError("");
    if (!name) return setMemberError("Falta preencher: nome.");
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return setMemberError("Informe um email válido.");
    }
    if (phoneValue.replace(/\D/g, "").length < 10) {
      return setMemberError("Falta preencher: WhatsApp com DDD.");
    }
    if (password.length !== 6) return setMemberError("Falta preencher: senha de 6 dígitos.");
    if (password !== confirmPassword) return setMemberError("A confirmação da senha não confere.");
    setMemberSaving(true);
    try {
      const profile = await saveCustomerSession({
        name,
        email: email || undefined,
        phone: phoneValue,
        password,
        confirmPassword,
      });
      applyProfileToCheckout(profile);
    } catch {
      setMemberError("Não foi possível cadastrar. Confira os dados e tente novamente.");
    } finally {
      setMemberSaving(false);
    }
  };

  const loginMember = async () => {
    const login = memberLogin.trim();
    const password = loginPassword.trim();
    setMemberError("");
    if (!login) return setMemberError("Falta preencher: telefone, email ou CPF.");
    if (password.length !== 6) return setMemberError("Falta preencher: senha de 6 dígitos.");
    setMemberSaving(true);
    try {
      const profile = await loginCustomerSession({ login, password });
      applyProfileToCheckout(profile);
      setMemberLogin("");
      setLoginPassword("");
    } catch {
      setMemberError("Telefone, email, CPF ou senha inválidos.");
    } finally {
      setMemberSaving(false);
    }
  };

  const checkoutLocked = paying || kioskSuccessOpen;

  useEffect(() => {
    onCheckoutLockChange?.(checkoutLocked);
  }, [checkoutLocked, onCheckoutLockChange]);

  useEffect(() => () => onCheckoutLockChange?.(false), [onCheckoutLockChange]);

  const endFlow = onFlowEnd ?? goToMenu;
  const endFlowRef = useRef(endFlow);
  useEffect(() => {
    endFlowRef.current = endFlow;
  });

  // Kiosk: an emptied cart ends the session (back to the idle screen).
  useEffect(() => {
    if (!idleHomeMode || cart.length > 0) return;
    if (paying || kioskSuccessOpen || pixPaymentRequest) return;
    endFlowRef.current();
  }, [cart.length, idleHomeMode, kioskSuccessOpen, paying, pixPaymentRequest]);

  // Kiosk: a Pix closed without payment (cancelled or expired) ends the session.
  const kioskPixRequest = useMemo(() => {
    if (!pixPaymentRequest || !idleHomeMode) return pixPaymentRequest;
    return {
      ...pixPaymentRequest,
      resolve: (order: Record<string, unknown> | null) => {
        pixPaymentRequest.resolve(order);
        if (!order) endFlowRef.current();
      },
    };
  }, [idleHomeMode, pixPaymentRequest]);

  if (cart.length === 0) {
    return <EmptyCartState onBack={handleBack} />;
  }

  const stickyCheckoutAction = (
    <CartStickyCta
      checkoutStep={checkoutStep}
      kioskMode={kioskMode}
      counterServiceMode={counterServiceMode}
      missingDelivery={missingDelivery}
      payment={payment}
      subtotal={subtotal}
      fee={fee}
      serviceFee={serviceFee}
      discount={discount}
      total={total}
      paying={paying}
      nextActionLabel={nextActionLabel}
      hideTotalInButton={soldOutEnabled && !kioskMode && !counterServiceMode}
      onFinalize={handleFinalize}
    />
  );

  return (
    <div
      style={{
        background: "#fff",
        fontFamily: "'Inter', system-ui, sans-serif",
        minHeight: "100%",
      }}
    >
      <CartHeader cart={cart} onBack={handleBack} />
      <CheckoutProgress
        checkoutStep={checkoutStep}
        kioskMode={kioskMode}
        counterServiceMode={counterServiceMode}
      />
      {/* ══ BODY ══════════════════════════════════════════ */}
      <div className="px-4 pt-5 pb-32 flex flex-col gap-5">
        <CheckoutIntro
          kioskMode={kioskMode}
          counterServiceMode={counterServiceMode}
          stepLabel={stepLabel}
        />
        {checkoutStep === "bag" && (
          <CartBagStepSection
            cart={cart}
            addToCart={addToCart}
            clearCart={clearCart}
            goToMenu={goToMenu}
          />
        )}
        {checkoutStep === "delivery" &&
          !kioskMode &&
          !counterServiceMode &&
          submitAttempted &&
          missingDelivery.length > 0 && (
            <div
              className="rounded-2xl p-3 text-[11px] font-bold leading-relaxed"
              style={{
                background: `${ROSA}70`,
                color: VERDE,
                border: `1px solid ${ROSA}`,
              }}
            >
              Falta preencher: {missingDelivery.join(", ")}.
            </div>
          )}
        <CartItemsSection
          checkoutStep={checkoutStep}
          cart={cart}
          removed={removed}
          obsOpen={obsOpen}
          setObsOpen={setObsOpen}
          updateQty={updateQty}
          toggleRemove={toggleRemove}
          goToMenu={goToMenu}
        />

        <OrderSummarySection
          checkoutStep={checkoutStep}
          cart={cart}
          delivery={delivery}
          fee={fee}
          serviceFee={serviceFee}
          subtotal={subtotal}
          appliedCoupon={appliedCoupon}
          discount={discount}
          total={total}
        />

        {checkoutStep === "delivery" && !kioskMode && !counterServiceMode && (
          <DeliveryChoiceSection
            delivery={delivery}
            setDelivery={setDelivery}
            fee={fee}
          />
        )}
        <PaymentStepSection
          checkoutStep={checkoutStep}
          kioskMode={kioskMode}
          counterServiceMode={counterServiceMode}
          payment={payment}
          setPayment={setPayment}
          setCheckoutStep={setCheckoutStep}
          customerNameRef={customerNameRef}
          phoneRef={phoneRef}
          customerName={customerName}
          setCustomerName={setCustomerName}
          phone={phone}
          setPhone={setPhone}
          setKioskKeyboardTarget={setKioskKeyboardTarget}
          submitAttempted={submitAttempted}
          deliveryValid={deliveryValid}
          inputStyle={inputStyle}
          total={total}
          onChooseCounterPayment={handleFinalize}
        />
        {counterServiceMode && checkoutStep === "bag" && stickyCheckoutAction}
        <CheckoutReviewSection
          checkoutStep={checkoutStep}
          kioskMode={kioskMode}
          counterServiceMode={counterServiceMode}
          payment={payment}
          paymentError={paymentError}
          paymentSlow={paymentSlow}
          couponCode={couponCode}
          setCouponCode={setCouponCode}
          couponError={couponError}
          setCouponError={setCouponError}
          appliedCoupon={appliedCoupon}
          setAppliedCoupon={setAppliedCoupon}
          applyCoupon={applyCoupon}
          inputStyle={inputStyle}
          setCheckoutStep={setCheckoutStep}
          setKioskKeyboardTarget={setKioskKeyboardTarget}
          cart={cart}
          subtotal={subtotal}
          fee={fee}
          serviceFee={serviceFee}
          discount={discount}
          total={total}
        />

        <DeliveryFormSection
          checkoutStep={checkoutStep}
          kioskMode={kioskMode}
          savedBadge={savedBadge}
          delivery={delivery}
          showScheduleSelector={!withinOperatingHours}
          cepRef={cepRef}
          customerNameRef={customerNameRef}
          streetRef={streetRef}
          numberRef={numberRef}
          phoneRef={phoneRef}
          customerName={customerName}
          setCustomerName={setCustomerName}
          cep={cep}
          setCep={setCep}
          cepError={cepError}
          cepLoading={cepLoading}
          submitAttempted={submitAttempted}
          invalidDeliveryFields={invalidDeliveryFields}
          street={street}
          setStreet={setStreet}
          number={number}
          setNumber={setNumber}
          complement={complement}
          setComplement={setComplement}
          phone={phone}
          setPhone={setPhone}
          deliverySchedule={deliverySchedule}
          setDeliverySchedule={setDeliverySchedule}
          scheduledTime={scheduledTime}
          setScheduledTime={setScheduledTime}
          scheduleTimes={scheduleTimes}
          inputStyle={inputStyle}
        />
      </div>
      {kioskPixRequest && (
        <MercadoPagoPixModal
          request={kioskPixRequest}
          onClose={closePixPayment}
          autoCloseExpiredMs={idleHomeMode ? 8000 : undefined}
        />
      )}
      <CartOverlays
        kioskSuccessOpen={kioskSuccessOpen}
        paying={paying}
        kioskMode={kioskMode}
        counterServiceMode={counterServiceMode}
        kioskSuccessOrder={kioskSuccessOrder}
        payment={payment}
        paymentSlow={paymentSlow}
        kioskKeyboardOpen={kioskKeyboardOpen}
        kioskKeyboardTarget={kioskKeyboardTarget}
        typeKioskKey={typeKioskKey}
        backspaceKioskKey={backspaceKioskKey}
        clearKioskKey={clearKioskKey}
        closeKioskKeyboard={closeKioskKeyboard}
        setKioskKeyboardTarget={setKioskKeyboardTarget}
        counterPaymentPromptOpen={counterPaymentPromptOpen}
        counterPaymentTotal={counterPaymentTotal}
        onConfirmCounterPayment={confirmCounterPaymentChoice}
        onCancelCounterPayment={cancelCounterPaymentChoice}
        onCounterPaymentCancelled={() => {
          clearCart();
          endFlow();
        }}
        counterCustomerNamePromptOpen={counterCustomerNamePromptOpen}
        counterCustomerNameDraft={counterCustomerNameDraft}
        setCounterCustomerNameDraft={setCounterCustomerNameDraft}
        onConfirmCounterCustomerName={confirmCounterCustomerNameChoice}
        onCloseKioskSuccess={closeKioskSuccess}
      />
      {closedHoursAlertOpen && (
        <ClosedHoursAlertModal
          message={closedHoursAlertMessage}
          onReturnToMenu={() => {
            closeClosedHoursAlert();
            goToMenu();
          }}
        />
      )}
      {soldOutAlertOpen && (
        <SoldOutAlertModal
          message={soldOutMessage}
          onClose={closeSoldOutAlert}
        />
      )}
      {addressConfirmOpen && (
        <DeliveryAddressConfirmModal
          address={currentDeliveryAddress}
          fee={fee}
          onConfirm={confirmDeliveryAddress}
          onEdit={editDeliveryAddress}
        />
      )}

      {(!counterServiceMode || checkoutStep !== "bag") && stickyCheckoutAction}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

function DeliveryAddressConfirmModal({
  address,
  fee,
  onConfirm,
  onEdit,
}: {
  address: string;
  fee: number;
  onConfirm: () => void;
  onEdit: () => void;
}) {
  const addressLines = address.split("\n").map((line) => line.trim()).filter(Boolean);
  return (
    <div className="fixed inset-0 z-[95] flex items-end justify-center bg-black/60 px-3 py-3 sm:items-center sm:p-4">
      <section
        className="w-full max-w-md rounded-[24px] bg-white p-5 shadow-2xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="address-confirm-title"
        style={{ color: VERDE }}
      >
        <p className="text-[10px] font-black uppercase tracking-[0.22em] text-black/40">
          Endereço crítico
        </p>
        <h2 id="address-confirm-title" className="mt-2 text-2xl font-black">
          Confirme seu endereço de entrega
        </h2>
        <p className="mt-2 text-sm font-bold leading-relaxed text-black/60">
          Antes de seguir para o pagamento, confira se o endereço abaixo está correto.
          Seu pedido será entregue exatamente neste local.
        </p>
        <div
          className="mt-4 rounded-2xl p-4 text-sm font-black leading-relaxed"
          style={{ background: `${ROSA}30`, border: `1.5px solid ${ROSA}` }}
        >
          {addressLines.map((line) => (
            <p key={line}>{line}</p>
          ))}
          <p className="mt-3 border-t pt-3" style={{ borderColor: ROSA }}>
            Taxa de entrega: {fee > 0 ? fmt(fee) : "Sem taxa"}
          </p>
        </div>
        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          <button
            type="button"
            onClick={onEdit}
            className="min-h-12 rounded-2xl px-4 text-sm font-black uppercase tracking-wide"
            style={{ background: "#fff", color: VERDE, border: `1.5px solid ${VERDE}` }}
          >
            Editar endereço
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="min-h-12 rounded-2xl px-4 text-sm font-black uppercase tracking-wide"
            style={{ background: VERDE, color: ROSA }}
          >
            Confirmar e continuar
          </button>
        </div>
      </section>
    </div>
  );
}
