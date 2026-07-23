import type React from "react";
import type { CustomizerState } from "../shared";
import {
  COMBO_DRINK_SURCHARGE_PRODUCT_ID, DRINK_OPTIONS, SWEET_BOX_REQUIRED_COUNT,
  getExtraOptionsForItem, getSweetOptionsForItem, isChickenProduct, isNuggetsProduct,
  isSuperProduct, isSweetBoxProduct, isSweetPlusProduct, requiredCustomizerCount,
  requiresSpiceLevel, isLemonadeProduct,
} from "../shared";

export function useProductCustomizerModel(
  state: CustomizerState,
  setState: React.Dispatch<React.SetStateAction<CustomizerState | null>>,
) {
  const needsMeatPoint = !isChickenProduct(state.item) && (state.item.category === "burger" || state.item.category === "combo");
  const requiredCount = requiredCustomizerCount(state.item);
  const needsSauce = (state.item.category === "burger" || state.item.category === "combo") && !isSuperProduct(state.item);
  const needsFreeMayo = isNuggetsProduct(state.item);
  const needsDrink = state.item.category === "combo";
  const isSweetBox = isSweetBoxProduct(state.item);
  const isLemonade = isLemonadeProduct(state.item);
  const isSweetPlus = isSweetPlusProduct(state.item);
  const needsSpiceLevel = requiresSpiceLevel(state.item);
  const superTheme = isSuperProduct(state.item);
  const chilliTheme = state.item.id === "tropikal-barbecue";
  const superBackground = chilliTheme ? "#21090F" : "#061C18";
  const superSurface = chilliTheme ? "#351018" : "#08251F";
  const superAccent = chilliTheme ? "#FF315C" : "#9CDD22";
  const sweetOptions = getSweetOptionsForItem(state.item);
  const sauceRequiredCount = needsFreeMayo ? 1 : requiredCount;
  const extraOptions = getExtraOptionsForItem(state.item);
  const sweetCount = Object.values(state.extras).reduce((sum, quantity) => sum + quantity, 0);
  const sweetTotal = sweetOptions.reduce((sum, option) => sum + (state.extras[option.id] ?? 0) * option.price, 0);
  const extrasTotal = Object.entries(state.extras).reduce((sum, [extraId, quantity]) => {
    const extra = extraOptions.find((option) => option.id === extraId);
    return sum + (extra?.price ?? 0) * quantity;
  }, 0);
  const drinkSurchargeTotal = state.drinks.reduce((sum, drinkId) => {
    const drink = DRINK_OPTIONS.find((option) => option.id === drinkId);
    return sum + (COMBO_DRINK_SURCHARGE_PRODUCT_ID[drinkId] ? drink?.comboPrice ?? 0 : 0);
  }, 0);
  const total = (state.item.price + drinkSurchargeTotal + (isSweetBox ? sweetTotal : extrasTotal)) * state.qty;
  const valid = (!isSweetBox || sweetCount === SWEET_BOX_REQUIRED_COUNT)
    && (!needsMeatPoint || state.meatPoints.length === requiredCount)
    && (!(needsSauce || needsFreeMayo) || isSweetBox || state.sauces.length === sauceRequiredCount)
    && (!needsDrink || state.drinks.length === requiredCount);
  const spiceValid = !needsSpiceLevel || state.spiceLevel !== undefined;

  const toggleLimited = (field: "meatPoints" | "sauces" | "drinks", value: string, max: number) => {
    setState((prev) => {
      if (!prev) return prev;
      const current = prev[field];
      if (max === 1) return { ...prev, [field]: current[0] === value ? [] : [value] };
      const selectedCount = current.filter((item) => item === value).length;
      if (selectedCount >= max) return { ...prev, [field]: current.filter((item) => item !== value) };
      if (current.length < max) return { ...prev, [field]: [...current, value] };
      if (selectedCount === 0) return { ...prev, [field]: [...current.slice(0, max - 1), value] };
      return { ...prev, [field]: Array.from({ length: max }, () => value) };
    });
  };
  const countSelected = (field: "meatPoints" | "sauces" | "drinks", value: string) => state[field].filter((item) => item === value).length;
  const updateOptionQty = (optionId: string, delta: number, max: number) => {
    setState((prev) => {
      if (!prev) return prev;
      const currentTotal = Object.values(prev.extras).reduce((sum, quantity) => sum + quantity, 0);
      const current = prev.extras[optionId] ?? 0;
      const nextQty = Math.min(max, Math.max(0, current + delta));
      if (max > 3 && delta > 0 && currentTotal >= SWEET_BOX_REQUIRED_COUNT) return prev;
      const extras = { ...prev.extras };
      if (nextQty === 0) delete extras[optionId]; else extras[optionId] = nextQty;
      return { ...prev, extras };
    });
  };
  const updateExtraQty = (id: string, delta: number) => {
    if (!isLemonade) {
      updateOptionQty(id, delta, 3);
      return;
    }
    setState((prev) => {
      if (!prev) return prev;
      if (delta < 0) return { ...prev, extras: {} };
      return { ...prev, extras: { [id]: 1 } };
    });
  };
  const updateSweetQty = (id: string, delta: number) => updateOptionQty(id, delta, SWEET_BOX_REQUIRED_COUNT);

  return { needsMeatPoint, requiredCount, needsSauce, needsFreeMayo, needsDrink, isSweetBox, isLemonade, chilliTheme,
    isSweetPlus, needsSpiceLevel, superTheme, superBackground, superSurface, superAccent,
    sweetOptions, sauceRequiredCount, extraOptions, sweetCount, total, valid, spiceValid,
    toggleLimited, countSelected, updateExtraQty, updateSweetQty };
}
