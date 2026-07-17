/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { MenuItem, Coupon, AgentSkill } from "./types";

export const MENU_ITEMS: MenuItem[] = [
  // Breakfast category
  {
    sku: "BRK_MCMUFFIN",
    name: "Egg McMuffin",
    category: "breakfast",
    price: 4.50,
    stock: 25,
    description: "A freshly cracked Grade A egg on a toasted English muffin with savory Canadian bacon and melted American cheese.",
    image: "https://images.unsplash.com/photo-1525351484163-7529414344d8?w=300&auto=format&fit=crop&q=60",
    calories: 310,
    protein: 17,
    carbs: 30,
    fat: 13
  },
  {
    sku: "BRK_SAUSAGE_EGG",
    name: "Sausage McMuffin with Egg",
    category: "breakfast",
    price: 5.20,
    stock: 18,
    description: "Sizzling sausage hot off the grill, a freshly cracked Grade A egg, and melty American cheese on a warm, toasted English muffin.",
    image: "https://images.unsplash.com/photo-1600891964599-f61ba0e24092?w=300&auto=format&fit=crop&q=60",
    calories: 480,
    protein: 21,
    carbs: 31,
    fat: 30
  },
  {
    sku: "BRK_HOTCAKES",
    name: "Hotcakes (3 pcs)",
    category: "breakfast",
    price: 4.80,
    stock: 12,
    description: "Three golden brown Hotcakes served with real butter and sweet maple-flavored hotcake syrup.",
    image: "https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=300&auto=format&fit=crop&q=60",
    calories: 580,
    protein: 9,
    carbs: 101,
    fat: 15
  },
  {
    sku: "BRK_HASHBROWN",
    name: "Hash Brown",
    category: "breakfast",
    price: 1.90,
    stock: 45,
    description: "Crispy, golden brown shredded potato hash brown patty, fried to delicious perfection.",
    image: "https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=300&auto=format&fit=crop&q=60",
    calories: 140,
    protein: 1,
    carbs: 18,
    fat: 8
  },
  {
    sku: "BRK_COFFEE",
    name: "Premium Roast Coffee",
    category: "breakfast",
    price: 1.80,
    stock: 80,
    description: "Brewed from 100% Arabica beans, hot, aromatic, and freshly roasted every 30 minutes.",
    image: "https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=300&auto=format&fit=crop&q=60",
    calories: 5,
    protein: 0,
    carbs: 1,
    fat: 0
  },

  // Regular category
  {
    sku: "REG_BIGMAC",
    name: "Big Mac",
    category: "regular",
    price: 6.20,
    stock: 35,
    description: "Two 100% pure beef patties, special sauce, crisp shredded lettuce, American cheese, pickles, and onions on a toasted sesame seed bun.",
    image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=300&auto=format&fit=crop&q=60",
    calories: 590,
    protein: 25,
    carbs: 46,
    fat: 34
  },
  {
    sku: "REG_MCNUGGETS",
    name: "Chicken McNuggets (10 pc)",
    category: "regular",
    price: 5.80,
    stock: 30,
    description: "Tender, juicy Chicken McNuggets made with 100% white meat chicken, with no artificial colors or preservatives.",
    image: "https://images.unsplash.com/photo-1562967914-608f82629710?w=300&auto=format&fit=crop&q=60",
    calories: 410,
    protein: 23,
    carbs: 26,
    fat: 24
  },
  {
    sku: "REG_SPICY_CHICKEN",
    name: "McSpicy Chicken Burger",
    category: "regular",
    price: 6.50,
    stock: 20,
    description: "Thick, crispy chicken thigh meat seasoned with hot chili peppers, fresh lettuce, and creamy mayo on a sesame seed bun.",
    image: "https://images.unsplash.com/photo-1625813506062-0aeb1d7a094b?w=300&auto=format&fit=crop&q=60",
    calories: 520,
    protein: 22,
    carbs: 48,
    fat: 27
  },
  {
    sku: "REG_FRIES",
    name: "World Famous Fries (L)",
    category: "regular",
    price: 3.50,
    stock: 65,
    description: "Our premium potatoes cut into delicious strips, crispy on the outside and fluffy on the inside, salted to perfection.",
    image: "https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=300&auto=format&fit=crop&q=60",
    calories: 480,
    protein: 6,
    carbs: 65,
    fat: 23
  },
  {
    sku: "REG_COLA",
    name: "Coca-Cola (M)",
    category: "regular",
    price: 2.20,
    stock: 90,
    description: "Cold, bubbly, and refreshing original Coca-Cola fountain soda poured over crushed ice.",
    image: "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=300&auto=format&fit=crop&q=60",
    calories: 210,
    protein: 0,
    carbs: 55,
    fat: 0
  },
  {
    sku: "REG_APPLE_PIE",
    name: "Baked Apple Pie",
    category: "regular",
    price: 1.90,
    stock: 15,
    description: "Warm pastry crust filled with sweet, cinnamon-spiced apple slices, baked to a flaky golden brown.",
    image: "https://images.unsplash.com/photo-1519869325930-281384150729?w=300&auto=format&fit=crop&q=60",
    calories: 230,
    protein: 2,
    carbs: 35,
    fat: 10
  }
];

export const INITIAL_COUPONS: Coupon[] = [
  {
    id: "coupon_mcd50",
    code: "MCD50",
    name: "Mega Family discount",
    description: "Save $10.00 off orders over $50.00! Perfect for larger groups.",
    discountType: "fixed",
    value: 10.00,
    minSpend: 50.00
  },
  {
    id: "coupon_breakfast15",
    code: "MCD_BREAKFAST_15",
    name: "Breakfast Early Bird 15%",
    description: "Get 15% off any breakfast item (SKU prefix BRK_). Only valid in Morning.",
    discountType: "percentage",
    value: 0.15,
    minSpend: 5.00,
    applicablePrefix: "BRK_",
    categoryLimit: "breakfast"
  },
  {
    id: "coupon_burger20",
    code: "MCD_BURGER_20",
    name: "Burger Craze 20% Off",
    description: "Save 20% off any burger (McMuffin, Sausage Egg, Big Mac, McSpicy). No time limit!",
    discountType: "percentage",
    value: 0.20,
    minSpend: 8.00
  }
];

export const INITIAL_SKILLS: AgentSkill[] = [
  {
    id: "skill_scenario",
    title: "Scenario Selector Policy",
    description: "Guidelines to recommend Delivery vs In-Store Pickup based on weather, distance, and pricing formulas.",
    category: "scenario",
    content: `### SCENARIO DECISION MATRIX: DELIVERY VS PICKUP

**Objective**: Recommend the optimal delivery method (Delivery / Pickup) based on context variables (weather, distance to store, delivery surcharge formulas).

**Trigger Variables**:
- \`weather\`: Current weather ('sunny' or 'rainy')
- \`distanceKm\`: User's physical distance from the nearest McDonald's branch in kilometers.

**Hard Rules**:
1. **Rainy Weather Policy**: If weather is \`rainy\`, ALWAYS recommend **Delivery**. Frame your response around staying warm and dry, mentioning that local delivery riders are fully active.
2. **Long Distance Policy**: If \`distanceKm\` is greater than **1.5 km**, recommend **Delivery** because of time-saving.
3. **Sunny & Short Distance Policy**: If weather is \`sunny\` AND \`distanceKm\` is **<= 1.5 km**, recommend **Pickup**. Pitch this as a healthy, active walk that saves the user the delivery fee.
4. **Delivery Fee Calculation**:
   - If distance is > 2.0 km, the delivery surcharge is **$4.50**.
   - If distance is <= 2.0 km, the delivery surcharge is **$2.50**.
   - Pickup is ALWAYS **$0.00** delivery surcharge.

**Cooperative MCP Server Tooling**:
- Inform the user that you will execute \`set_delivery_scenario\` tool with parameters \`{ isDelivery: true/false, surcharge: X.XX }\` to update their actual order draft.`
  },
  {
    id: "skill_promotion",
    title: "Promotion Strategy Handbook",
    description: "Rules for breakfast vs regular categories, coupon validity, and points exchange policies.",
    category: "promotion",
    content: `### PROMOTION STRATEGY & COUPON STACKING POLICY

**Objective**: Analyze the user's shopping cart, active coupons, and point balances to recommend the absolute highest savings option.

**Strict Business Logic (Must Be Checked by Agent before calling MCP)**:
1. **Morning Category Validity**:
   - Breakfast is active ONLY if time is between **05:00 and 10:30**.
   - If time is after **10:30 AM**, any breakfast-specific coupon (\`MCD_BREAKFAST_15\`) is **strictly invalid**. Warn the user that the breakfast grill is closed if they attempt to add items.
2. **Coupon Limitation**:
   - Coupons are strictly **non-stackable** (only one coupon can be bound to an order).
   - The system must evaluate which coupon saves the most cash:
     - \`MCD50\`: $10.00 off if subtotal is >= $50.00.
     - \`MCD_BREAKFAST_15\`: 15% off only the breakfast items (SKUs starting with \`BRK_\`).
     - \`MCD_BURGER_20\`: 20% off burger items (Egg McMuffin, Sausage McMuffin, Big Mac, McSpicy).
3. **Loyalty Reward Exchange**:
   - If the user has >= **500 points**, they can exchange them for a **FREE Hash Brown** (\`BRK_HASHBROWN\`). This exchange represents a separate reward and can be redeemed in addition to a standard coupon!

**Cooperative MCP Server Tooling**:
- First evaluate mathematically which coupon saves the most.
- Call the atomic MCP tool \`bind_coupon(couponCode)\` to commit the coupon to the transaction. Never attempt to manually calculate discounts or override the final price in the order state without calling MCP.`
  },
  {
    id: "skill_pairing",
    title: "Classic Combo Upsell Template",
    description: "Upsell rules for classic side and beverage matches, breakfast combos, and nutrition queries.",
    category: "pairing",
    content: `### UPSELL PAIRING GUIDE & CALORIE DIETARY ASSISTANT

**Objective**: Offer personalized bundle discounts (up to $2.50) and answer dietary queries by combining menu ingredients and nutritional records.

**Combo Bundle Templates**:
1. **The Morning Starter combo** (Bundle ID: \`BUN_BREAKFAST\`):
   - Trigger: User has a McMuffin burger in cart.
   - Upsell target: Suggest adding Hash Brown (\`BRK_HASHBROWN\`) and Roast Coffee (\`BRK_COFFEE\`).
   - Reward: Bundle deal reduces the total of those three items by a combined **$2.50** (applied as a bundle credit)!
2. **The Classic Golden Lunch combo** (Bundle ID: \`BUN_LUNCH\`):
   - Trigger: User has a Big Mac or McSpicy in cart.
   - Upsell target: Suggest adding Large Fries (\`REG_FRIES\`) and Medium Cola (\`REG_COLA\`).
   - Reward: Bundle deal reduces total by **$1.50** (applied as a bundle credit)!

**Nutritional Query Guidance**:
- If user asks about calorie restrictions, high-protein options, or fat macros:
  - Run MCP tool \`list_nutrition\` to fetch real-time nutritional metrics.
  - Summarize the totals cleanly (e.g. "Your total breakfast combo has 455 calories and 18g of protein").`
  },
  {
    id: "skill_payment",
    title: "Payment Instruction Wrapper",
    description: "Strict instructions to lock order state, create a secure deep link and format payment cards.",
    category: "payment",
    content: `### SECURE PAYMENT FLOW & UNIVERSAL APP-LINK WRAPPER

**Objective**: Seamlessly bridge the checkout gap by generating high-intent payment deep links and visual guides without capturing customer financial details.

**Transaction Pipeline Steps**:
1. **Lock State**: Once the user says "Ready to checkout" or confirms the draft, immediately invoke MCP tool \`lock_order()\` to freeze price and reserve store inventory.
2. **Create Transaction**: Invoke MCP tool \`create_order()\` to generate the final order UUID, calculating finalized taxes and fees.
3. **App-Jump Deep Link**: Wrap the order ID into a simulated Universal Deep Link card:
   - Deep Link URL: \`mcdonalds://pay?orderId={ORDER_ID}&price={TOTAL}\`
   - Prompt the user with a distinct visual button/card "Pay with Mobile App".
4. **Humanized Instructions**:
   - State that clicking the button launches the McDonald's App where they can finalize with Apple Pay, Google Pay or linked cards in 1 tap.
   - Copyable **Pickup Code** (e.g., \`MCD-9482\`) or **Delivery Progress Estimated Arrival** (e.g., 25 mins) must be clearly printed.

**Security Mandate**:
- Never generate mock transaction forms or input fields for Credit Card / CVV numbers in your chat interface. This is a severe security violation. Trust the backend MCP transaction pipeline.`
  }
];
