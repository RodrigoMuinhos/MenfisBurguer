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
import { CartStickyCta } from "./CartStickyCta";
import { CheckoutReviewSection } from "./CheckoutReviewSection";
import { useCartCheckout } from "./useCartCheckout";
import { CartBagStepSection } from "./CartBagStepSection";
import { DeliveryChoiceSection } from "./DeliveryChoiceSection";

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
}

export function CartScreen({
  cart,
  addToCart,
  updateQty,
  onPlaceOrder,
  goToMenu,
  kioskMode = false,
}: Props) {
  const {
    appliedCoupon,
    applyCoupon,
    backspaceKioskKey,
    cep,
    cepError,
    cepLoading,
    cepRef,
    checkoutStep,
    clearCart,
    closeKioskKeyboard,
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
    freeShipping,
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
    setNumber,
    setObsOpen,
    setPayment,
    setPhone,
    setStreet,
    confirmCounterPrintChoice,
    skipCounterPrintChoice,
    stepLabel,
    street,
    streetRef,
    submitAttempted,
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
  });

  if (cart.length === 0) {
    return <EmptyCartState onBack={handleBack} />;
  }

  return (
    <div
      style={{
        background: "#FFF8F2",
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
          freeShipping={freeShipping}
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
            freeShipping={freeShipping}
            fee={fee}
          />
        )}
        <PaymentStepSection
          checkoutStep={checkoutStep}
          kioskMode={kioskMode}
          counterServiceMode={counterServiceMode}
          payment={payment}
          setPayment={setPayment}
          payOnDeliveryEnabled={payOnDeliveryEnabled}
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
        />
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
          total={total}
        />

        <DeliveryFormSection
          checkoutStep={checkoutStep}
          kioskMode={kioskMode}
          savedBadge={savedBadge}
          delivery={delivery}
          cepRef={cepRef}
          streetRef={streetRef}
          numberRef={numberRef}
          phoneRef={phoneRef}
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
          inputStyle={inputStyle}
        />
      </div>
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
        counterPrintPromptOpen={counterPrintPromptOpen}
        onConfirmCounterPrint={confirmCounterPrintChoice}
        onSkipCounterPrint={skipCounterPrintChoice}
      />

      <CartStickyCta
        checkoutStep={checkoutStep}
        kioskMode={kioskMode}
        counterServiceMode={counterServiceMode}
        missingDelivery={missingDelivery}
        payment={payment}
        total={total}
        paying={paying}
        nextActionLabel={nextActionLabel}
        onFinalize={handleFinalize}
      />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}



