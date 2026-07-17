import { Environment, OrderState } from "./types";

const TAX_RATE = 0.085; // 8.5% sales tax
const BREAKFAST_BURGER_SKUS = ["BRK_MCMUFFIN", "BRK_SAUSAGE_EGG"];
const LUNCH_BURGER_SKUS = ["REG_BIGMAC", "REG_SPICY_CHICKEN"];

/**
 * Recalculates order amounts based on items, delivery scenario, distance, and
 * applied coupons / combo bundles. This is the single source of truth for
 * pricing — MCP tools never compute totals directly, they call this.
 */
export function recalculateOrder(
  state: OrderState,
  env: Environment,
  combosSkillActive: boolean,
  promoSkillActive: boolean
): OrderState {
  const items = [...state.items];
  let subtotal = 0;

  items.forEach((cartItem) => {
    subtotal += cartItem.item.price * cartItem.quantity;
  });

  let discount = 0;
  let bundleCredit = 0;

  // 1. Coupon discount
  if (state.appliedCoupon && promoSkillActive) {
    const coupon = state.appliedCoupon;
    if (subtotal >= coupon.minSpend) {
      if (coupon.code === "MCD50") {
        discount = 10.0;
      } else if (coupon.code === "MCD_BREAKFAST_15") {
        let breakfastTotal = 0;
        items.forEach((cartItem) => {
          if (cartItem.item.sku.startsWith("BRK_")) {
            breakfastTotal += cartItem.item.price * cartItem.quantity;
          }
        });
        discount = parseFloat((breakfastTotal * 0.15).toFixed(2));
      } else if (coupon.code === "MCD_BURGER_20") {
        let burgerTotal = 0;
        items.forEach((cartItem) => {
          if (BREAKFAST_BURGER_SKUS.includes(cartItem.item.sku) || LUNCH_BURGER_SKUS.includes(cartItem.item.sku)) {
            burgerTotal += cartItem.item.price * cartItem.quantity;
          }
        });
        discount = parseFloat((burgerTotal * 0.20).toFixed(2));
      }
    }
  }

  // 2. Combo bundle credits
  if (combosSkillActive) {
    // Breakfast Combo: Burger + Hashbrown + Coffee => $2.50 off per set
    const hasBreakfastBurger = items.some(
      (ci) => (BREAKFAST_BURGER_SKUS.includes(ci.item.sku)) && ci.quantity > 0
    );
    const hasHashbrown = items.some((ci) => ci.item.sku === "BRK_HASHBROWN" && ci.quantity > 0);
    const hasCoffee = items.some((ci) => ci.item.sku === "BRK_COFFEE" && ci.quantity > 0);

    if (hasBreakfastBurger && hasHashbrown && hasCoffee) {
      const burgerQty = items.find((ci) => BREAKFAST_BURGER_SKUS.includes(ci.item.sku))?.quantity || 0;
      const hashbrownQty = items.find((ci) => ci.item.sku === "BRK_HASHBROWN")?.quantity || 0;
      const coffeeQty = items.find((ci) => ci.item.sku === "BRK_COFFEE")?.quantity || 0;
      const comboCount = Math.min(burgerQty, hashbrownQty, coffeeQty);
      bundleCredit += comboCount * 2.5;
    }

    // Lunch Combo: Big Mac / McSpicy + Fries + Coke => $1.50 off per set
    const hasLunchBurger = items.some(
      (ci) => (LUNCH_BURGER_SKUS.includes(ci.item.sku)) && ci.quantity > 0
    );
    const hasFries = items.some((ci) => ci.item.sku === "REG_FRIES" && ci.quantity > 0);
    const hasCoke = items.some((ci) => ci.item.sku === "REG_COLA" && ci.quantity > 0);

    if (hasLunchBurger && hasFries && hasCoke) {
      const burgerQty = items.find((ci) => LUNCH_BURGER_SKUS.includes(ci.item.sku))?.quantity || 0;
      const friesQty = items.find((ci) => ci.item.sku === "REG_FRIES")?.quantity || 0;
      const cokeQty = items.find((ci) => ci.item.sku === "REG_COLA")?.quantity || 0;
      const comboCount = Math.min(burgerQty, friesQty, cokeQty);
      bundleCredit += comboCount * 1.5;
    }
  }

  // 3. Delivery fee
  let deliveryFee = 0;
  if (env.isDelivery) {
    deliveryFee = env.distanceKm > 2.0 ? 4.5 : 2.5;
  }

  const subtotalWithDiscount = Math.max(0, subtotal - discount - bundleCredit);
  const tax = parseFloat((subtotalWithDiscount * TAX_RATE).toFixed(2));
  const total = parseFloat((subtotalWithDiscount + deliveryFee + tax).toFixed(2));

  return {
    ...state,
    items,
    deliveryFee,
    discount: parseFloat(discount.toFixed(2)),
    bundleCredit: parseFloat(bundleCredit.toFixed(2)),
    tax,
    subtotal: parseFloat(subtotal.toFixed(2)),
    total
  };
}

export function createInitialOrder(): OrderState {
  return {
    items: [],
    isDelivery: false,
    appliedCoupon: null,
    status: "draft",
    subtotal: 0,
    discount: 0,
    bundleCredit: 0,
    deliveryFee: 0,
    tax: 0,
    total: 0
  };
}

export function createInitialEnvironment(): Environment {
  return {
    weather: "sunny",
    distanceKm: 0.8,
    timeOfDay: "13:00",
    userPoints: 850,
    isDelivery: false
  };
}
