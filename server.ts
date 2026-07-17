/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type, FunctionDeclaration } from "@google/genai";
import dotenv from "dotenv";
import { MENU_ITEMS, INITIAL_SKILLS } from "./src/data";
import { MenuItem, OrderState, Environment, McpToolCall } from "./src/types";

dotenv.config();

const app = express();
app.use(express.json());

const PORT = 3000;

// Initialize GoogleGenAI client safely (lazy-loaded when needed, with fallback)
let aiClient: GoogleGenAI | null = null;
function getGenAI(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn("WARNING: GEMINI_API_KEY environment variable is not set. Chat assistant will run in mock mode.");
    }
    aiClient = new GoogleGenAI({
      apiKey: apiKey || "dummy_key",
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return aiClient;
}

// Recalculates order amounts based on items, isDelivery, distance, and applied coupons/combo bundles
function recalculateOrder(state: OrderState, env: Environment, combosSkillActive: boolean, promoSkillActive: boolean): OrderState {
  const items = [...state.items];
  let subtotal = 0;
  
  // 1. Calculate base subtotal
  items.forEach(cartItem => {
    subtotal += cartItem.item.price * cartItem.quantity;
  });

  let discount = 0;
  let bundleCredit = 0;

  // 2. Coupon Discount Calculations
  if (state.appliedCoupon && promoSkillActive) {
    const coupon = state.appliedCoupon;
    if (subtotal >= coupon.minSpend) {
      if (coupon.code === "MCD50") {
        discount = 10.00;
      } else if (coupon.code === "MCD_BREAKFAST_15") {
        // 15% off only breakfast items
        let breakfastTotal = 0;
        items.forEach(cartItem => {
          if (cartItem.item.sku.startsWith("BRK_")) {
            breakfastTotal += cartItem.item.price * cartItem.quantity;
          }
        });
        discount = parseFloat((breakfastTotal * 0.15).toFixed(2));
      } else if (coupon.code === "MCD_BURGER_20") {
        // 20% off burgers
        const burgerSkus = ["BRK_MCMUFFIN", "BRK_SAUSAGE_EGG", "REG_BIGMAC", "REG_SPICY_CHICKEN"];
        let burgerTotal = 0;
        items.forEach(cartItem => {
          if (burgerSkus.includes(cartItem.item.sku)) {
            burgerTotal += cartItem.item.price * cartItem.quantity;
          }
        });
        discount = parseFloat((burgerTotal * 0.20).toFixed(2));
      }
    }
  }

  // 3. Combo Bundle Credits (Classic combos skill)
  if (combosSkillActive) {
    // Breakfast Combo: Burger + Hashbrown + Coffee => $2.50 discount
    const hasBreakfastBurger = items.some(ci => (ci.item.sku === "BRK_MCMUFFIN" || ci.item.sku === "BRK_SAUSAGE_EGG") && ci.quantity > 0);
    const hasHashbrown = items.some(ci => ci.item.sku === "BRK_HASHBROWN" && ci.quantity > 0);
    const hasCoffee = items.some(ci => ci.item.sku === "BRK_COFFEE" && ci.quantity > 0);

    if (hasBreakfastBurger && hasHashbrown && hasCoffee) {
      // Find min multiplier
      const burgerQty = items.find(ci => ci.item.sku === "BRK_MCMUFFIN" || ci.item.sku === "BRK_SAUSAGE_EGG")?.quantity || 0;
      const hashbrownQty = items.find(ci => ci.item.sku === "BRK_HASHBROWN")?.quantity || 0;
      const coffeeQty = items.find(ci => ci.item.sku === "BRK_COFFEE")?.quantity || 0;
      const comboCount = Math.min(burgerQty, hashbrownQty, coffeeQty);
      bundleCredit += comboCount * 2.50;
    }

    // Lunch Combo: Big Mac / McSpicy + Fries + Coke => $1.50 discount
    const hasLunchBurger = items.some(ci => (ci.item.sku === "REG_BIGMAC" || ci.item.sku === "REG_SPICY_CHICKEN") && ci.quantity > 0);
    const hasFries = items.some(ci => ci.item.sku === "REG_FRIES" && ci.quantity > 0);
    const hasCoke = items.some(ci => ci.item.sku === "REG_COLA" && ci.quantity > 0);

    if (hasLunchBurger && hasFries && hasCoke) {
      const burgerQty = items.find(ci => ci.item.sku === "REG_BIGMAC" || ci.item.sku === "REG_SPICY_CHICKEN")?.quantity || 0;
      const friesQty = items.find(ci => ci.item.sku === "REG_FRIES")?.quantity || 0;
      const cokeQty = items.find(ci => ci.item.sku === "REG_COLA")?.quantity || 0;
      const comboCount = Math.min(burgerQty, friesQty, cokeQty);
      bundleCredit += comboCount * 1.50;
    }
  }

  // 4. Calculate Delivery Fee
  let deliveryFee = 0;
  if (env.isDelivery) {
    deliveryFee = env.distanceKm > 2.0 ? 4.50 : 2.50;
  }

  // Combine discounts
  const totalDiscount = parseFloat((discount + bundleCredit).toFixed(2));
  const subtotalWithDiscount = Math.max(0, subtotal - totalDiscount);
  const total = parseFloat((subtotalWithDiscount + deliveryFee).toFixed(2));

  return {
    ...state,
    items,
    deliveryFee,
    discount: totalDiscount,
    subtotal: parseFloat(subtotal.toFixed(2)),
    total: parseFloat(total.toFixed(2))
  };
}

// Function declarations for MCP tools
const setDeliveryScenarioDeclaration: FunctionDeclaration = {
  name: "set_delivery_scenario",
  description: "Set order fulfillment type to home delivery (true) or in-store pickup (false) based on client request/scenario rules.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      isDelivery: {
        type: Type.BOOLEAN,
        description: "Whether the order is for Delivery (true) or In-store Pickup (false)."
      }
    },
    required: ["isDelivery"]
  }
};

const bindCouponDeclaration: FunctionDeclaration = {
  name: "bind_coupon",
  description: "Binds a promo coupon code (e.g., MCD50, MCD_BREAKFAST_15, MCD_BURGER_20) to the order to apply discount rules.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      code: {
        type: Type.STRING,
        description: "The coupon code to apply to the order draft."
      }
    },
    required: ["code"]
  }
};

const redeemPointsHashbrownDeclaration: FunctionDeclaration = {
  name: "redeem_points_hashbrown",
  description: "Exchange 500 loyalty points to add a FREE Hash Brown (BRK_HASHBROWN) to the current order.",
  parameters: {
    type: Type.OBJECT,
    properties: {}
  }
};

const lockOrderDeclaration: FunctionDeclaration = {
  name: "lock_order",
  description: "Freeze and lock the current draft order's pricing, fees, and items to prepare for payment. Reserve ingredients stock.",
  parameters: {
    type: Type.OBJECT,
    properties: {}
  }
};

const createOrderDeclaration: FunctionDeclaration = {
  name: "create_order",
  description: "Creates the finalized transaction, returns a transactional Order UUID and random pickup verification code.",
  parameters: {
    type: Type.OBJECT,
    properties: {}
  }
};

const addItemToCartDeclaration: FunctionDeclaration = {
  name: "add_item_to_cart",
  description: "Add a food item to the shopping cart by specifying its SKU code and quantity.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      sku: {
        type: Type.STRING,
        description: "The SKU code of the item to add, e.g., REG_BIGMAC, BRK_MCMUFFIN."
      },
      quantity: {
        type: Type.INTEGER,
        description: "Number of units to add (defaults to 1)."
      }
    },
    required: ["sku"]
  }
};

const removeItemFromCartDeclaration: FunctionDeclaration = {
  name: "remove_item_from_cart",
  description: "Remove an item completely from the shopping cart by specifying its SKU code.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      sku: {
        type: Type.STRING,
        description: "The SKU code of the item to remove."
      }
    },
    required: ["sku"]
  }
};

const listNutritionDeclaration: FunctionDeclaration = {
  name: "list_nutrition",
  description: "Provides aggregated and individual nutritional metrics (calories, protein, carbs, fat) for all items in the current cart.",
  parameters: {
    type: Type.OBJECT,
    properties: {}
  }
};

// API Endpoint for Agent Reasoning & Simulated MCP Coordination
app.post("/api/agent/chat", async (req, res) => {
  const { messages, environment, orderState, activeSkills } = req.body;

  // Retrieve details of the current environment
  const env: Environment = environment || {
    weather: "sunny",
    distanceKm: 0.8,
    timeOfDay: "13:00",
    userPoints: 850,
    isDelivery: false
  };

  const activeSkillIds: string[] = activeSkills || [];
  const selectedSkills = INITIAL_SKILLS.filter(s => activeSkillIds.includes(s.id));

  const isComboActive = activeSkillIds.includes("skill_pairing");
  const isPromoActive = activeSkillIds.includes("skill_promotion");

  // Construct context of active skills (the "Brain")
  let systemContext = `You are "Mickey", the official McDonald's AI Ordering Agent.
Your core goal is to help the customer order.
You have a set of "Agent Skills" (active business rulebooks) that you MUST follow strictly.

Active Agent Skills Rulebooks:
${selectedSkills.map(skill => `--- SKILL: ${skill.title} (${skill.category}) --- \n${skill.content}`).join("\n\n")}

Current Real-time Environmental Context:
- Weather: ${env.weather}
- Distance to Store: ${env.distanceKm} km
- Current Time: ${env.timeOfDay} (Note: Breakfast items prefixed with "BRK_" are ONLY valid/served before 10:30 AM. After 10:30 AM, they are strictly invalid, and lunch items starting with "REG_" are active.)
- User Loyalty Points: ${env.userPoints} pts
- Delivery Fulfillment Choice: ${env.isDelivery ? "Delivery" : "In-store Pickup"}

McDonald's Menu Stock & Catalog (Real-time MCP inventory):
${MENU_ITEMS.map(item => `- SKU: ${item.sku} | Name: ${item.name} | Price: $${item.price} | Stock: ${item.stock} | Category: ${item.category} | Calories: ${item.calories} kcal | Protein: ${item.protein}g`).join("\n")}

Active Cart State:
${orderState.items.length === 0 ? "Empty Cart" : orderState.items.map((ci: any) => `- ${ci.item.name} (SKU: ${ci.item.sku}) x${ci.quantity} @ $${ci.item.price}`).join("\n")}
Current Subtotal: $${orderState.subtotal}
Current Discount: $${orderState.discount}
Current Delivery Fee: $${orderState.deliveryFee}
Current Total: $${orderState.total}
Order Status: ${orderState.status}

GUIDELINES FOR USING TOOLS:
- Whenever the user wants to add an item, bind a coupon, toggle delivery, lock the order, or pay, you MUST execute the corresponding MCP function tool.
- Never manually calculate order totals or draft states; let the MCP tools update the transaction state.
- Keep your conversational responses friendly, humble, and completely aligned with the loaded Skills.
- When checkout is completed, present the simulated App Payment Deep Link and instructions from the payment skill.`;

  // Check if GEMINI_API_KEY is available. If not, fallback to a local rule engine / mock assistant.
  if (!process.env.GEMINI_API_KEY) {
    // Local mock agent rule engine (extremely smart and helpful, simulating AI reasoning and tool calling)
    console.log("Running in local Mock Agent Mode (No API Key).");
    let mockText = "Hello! I am Mickey, your AI Ordering Agent. [Mock Mode - Running locally without API key]. Let me help you out! ";
    const toolCalls: McpToolCall[] = [];
    let updatedOrder = { ...orderState };
    const latestUserMsg = messages[messages.length - 1]?.text?.toLowerCase() || "";

    // 1. Weather/Delivery reasoning
    if (latestUserMsg.includes("delivery") || latestUserMsg.includes("deliver") || latestUserMsg.includes("rain") || (env.weather === "rainy" && !updatedOrder.deliveryFee && !env.isDelivery)) {
      const isDelivery = env.weather === "rainy" || latestUserMsg.includes("delivery") || latestUserMsg.includes("deliver");
      env.isDelivery = isDelivery;
      updatedOrder.isDelivery = isDelivery;
      toolCalls.push({
        id: "call_" + Math.random().toString(36).substr(2, 9),
        timestamp: new Date().toLocaleTimeString(),
        toolName: "set_delivery_scenario",
        args: { isDelivery },
        result: { success: true, isDelivery, deliveryFee: isDelivery ? (env.distanceKm > 2.0 ? 4.50 : 2.50) : 0 },
        status: "success",
        type: "read",
        message: `Scenario Decision: Rainy/requested. Recommending Delivery. Surcharge updated.`
      });
      mockText += `I noticed the weather is ${env.weather} and you're ${env.distanceKm}km away. I've invoked the MCP \`set_delivery_scenario\` tool to switch your order to **Delivery** to keep you warm and dry! `;
    }

    // 2. Coupon/Discount logic
    if (latestUserMsg.includes("coupon") || latestUserMsg.includes("discount") || latestUserMsg.includes("cheap") || latestUserMsg.includes("promo")) {
      let code = "MCD_BURGER_20";
      if (env.timeOfDay < "10:30") {
        code = "MCD_BREAKFAST_15";
      }
      if (updatedOrder.subtotal >= 50) {
        code = "MCD50";
      }
      updatedOrder.appliedCoupon = {
        id: "c_1",
        code,
        name: code === "MCD50" ? "Mega Family Discount" : code === "MCD_BURGER_20" ? "Burger 20% Off" : "Breakfast 15%",
        description: "Automatically selected best discount",
        discountType: code === "MCD50" ? "fixed" : "percentage",
        value: code === "MCD50" ? 10 : code === "MCD_BURGER_20" ? 0.20 : 0.15,
        minSpend: code === "MCD50" ? 50 : 5
      };

      toolCalls.push({
        id: "call_" + Math.random().toString(36).substr(2, 9),
        timestamp: new Date().toLocaleTimeString(),
        toolName: "bind_coupon",
        args: { code },
        result: { success: true, code, discount: 5.00 },
        status: "success",
        type: "transaction",
        message: `Bound coupon ${code} to draft transaction.`
      });
      mockText += `I evaluated your wallet and automatically bound coupon **${code}** to maximize your savings! `;
    }

    // 3. Upselling/Add items mock
    if (latestUserMsg.includes("add") || latestUserMsg.includes("eat") || latestUserMsg.includes("order") || latestUserMsg.includes("breakfast") || latestUserMsg.includes("big mac")) {
      let itemToAdd = MENU_ITEMS[5]; // Big Mac
      if (env.timeOfDay < "10:30") {
        itemToAdd = MENU_ITEMS[0]; // Egg McMuffin
      }
      if (latestUserMsg.includes("nuggets")) itemToAdd = MENU_ITEMS[6];
      if (latestUserMsg.includes("spicy")) itemToAdd = MENU_ITEMS[7];
      if (latestUserMsg.includes("fries")) itemToAdd = MENU_ITEMS[8];
      if (latestUserMsg.includes("coffee")) itemToAdd = MENU_ITEMS[4];

      const existsIdx = updatedOrder.items.findIndex(ci => ci.item.sku === itemToAdd.sku);
      if (existsIdx > -1) {
        updatedOrder.items[existsIdx].quantity += 1;
      } else {
        updatedOrder.items.push({ item: itemToAdd, quantity: 1 });
      }

      toolCalls.push({
        id: "call_" + Math.random().toString(36).substr(2, 9),
        timestamp: new Date().toLocaleTimeString(),
        toolName: "add_item_to_cart",
        args: { sku: itemToAdd.sku, quantity: 1 },
        result: { success: true, sku: itemToAdd.sku, currentQuantity: existsIdx > -1 ? updatedOrder.items[existsIdx].quantity : 1 },
        status: "success",
        type: "transaction",
        message: `Added ${itemToAdd.name} (${itemToAdd.sku}) to cart.`
      });
      mockText += `I've called MCP tool \`add_item_to_cart\` to add a hot **${itemToAdd.name}** ($${itemToAdd.price}) to your card! `;

      // Combo suggestion
      if (itemToAdd.sku === "BRK_MCMUFFIN" || itemToAdd.sku === "BRK_SAUSAGE_EGG") {
        mockText += `\n\n**💡 Combos Skill Recommendation**: I see you have a breakfast muffin! Add a crunchy **Hash Brown** and freshly brewed **Premium Roast Coffee** to unlock the **Morning Starter Combo** and get a **$2.50 discount**!`;
      } else if (itemToAdd.sku === "REG_BIGMAC" || itemToAdd.sku === "REG_SPICY_CHICKEN") {
        mockText += `\n\n**💡 Combos Skill Recommendation**: Standard pairings match beautifully! Add a Large **Fries** and a Medium **Cola** to complete the **Classic Golden Combo** for a **$1.50 discount**!`;
      }
    }

    // 4. Points exchange
    if (latestUserMsg.includes("points") || latestUserMsg.includes("redeem") || latestUserMsg.includes("free")) {
      if (env.userPoints >= 500) {
        env.userPoints -= 500;
        const hashbrown = MENU_ITEMS[3];
        updatedOrder.items.push({ item: hashbrown, quantity: 1 });
        toolCalls.push({
          id: "call_" + Math.random().toString(36).substr(2, 9),
          timestamp: new Date().toLocaleTimeString(),
          toolName: "redeem_points_hashbrown",
          args: {},
          result: { success: true, addedSku: "BRK_HASHBROWN", costPoints: 500 },
          status: "success",
          type: "transaction",
          message: "Exchanged 500 points for free Hash Brown."
        });
        mockText += `Exchanged 500 points for a FREE gold crispy **Hash Brown**! I've subtracted 500 pts from your balance (remaining: ${env.userPoints} pts). `;
      } else {
        mockText += `I checked your loyalty points, but you have ${env.userPoints} pts (minimum 500 pts required for a reward). `;
      }
    }

    // 5. Checkout
    if (latestUserMsg.includes("checkout") || latestUserMsg.includes("pay") || latestUserMsg.includes("buy")) {
      if (updatedOrder.items.length === 0) {
        mockText += "Your cart is currently empty! Let me add a Big Mac combo to get started.";
      } else {
        updatedOrder.status = "locked";
        toolCalls.push({
          id: "call_lock_" + Math.random().toString(36).substr(2, 9),
          timestamp: new Date().toLocaleTimeString(),
          toolName: "lock_order",
          args: {},
          result: { success: true, status: "locked" },
          status: "success",
          type: "transaction",
          message: "Locked shopping cart and froze item prices."
        });

        const orderId = "MCD-" + Math.floor(100000 + Math.random() * 900000);
        updatedOrder.id = orderId;
        updatedOrder.status = "paid";
        updatedOrder.pickupCode = "MC-" + Math.floor(1000 + Math.random() * 9000);

        toolCalls.push({
          id: "call_create_" + Math.random().toString(36).substr(2, 9),
          timestamp: new Date().toLocaleTimeString(),
          toolName: "create_order",
          args: {},
          result: { success: true, orderId, pickupCode: updatedOrder.pickupCode },
          status: "success",
          type: "transaction",
          message: `Created McDonald's order ${orderId} on CF Worker backend.`
        });

        mockText = `### 🍔 Order Locked & Draft Finalized!

I have coordinated with the back-end transaction system to generate your order:

- **Order ID**: \`${orderId}\`
- **Pickup verification Code**: \`${updatedOrder.pickupCode}\`
- **Estimated Arrival**: ${env.isDelivery ? "15-20 mins" : "Ready in 5 mins"}
- **Fulfillment Method**: ${env.isDelivery ? "🚀 Delivery" : "🎒 In-Store Pickup"}

---

### 💳 Complete Secure Mobile Payment

To complete checkout, click the secure app deep link below to open the official McDonald's App on your device.

[📲 Tap to Pay with Google Pay/Wallet (mcdonalds://pay?orderId=${orderId}&price=${updatedOrder.total})](mcdonalds://pay?orderId=${orderId})

*Our payment pipeline secures stock for the next 10 minutes. Thank you!*`;
      }
    }

    updatedOrder = recalculateOrder(updatedOrder, env, isComboActive, isPromoActive);

    return res.json({
      text: mockText,
      orderState: updatedOrder,
      mcpCalls: toolCalls,
      environment: env
    });
  }

  // --- Real Gemini API Logic using @google/genai ---
  try {
    const ai = getGenAI();

    // Map system chat history structure
    const contents = messages.map((m: any) => ({
      role: m.sender === "user" ? "user" : "model",
      parts: [{ text: m.text }]
    }));

    // Declare tools
    const toolsList = [
      {
        functionDeclarations: [
          setDeliveryScenarioDeclaration,
          bindCouponDeclaration,
          redeemPointsHashbrownDeclaration,
          lockOrderDeclaration,
          createOrderDeclaration,
          addItemToCartDeclaration,
          removeItemFromCartDeclaration,
          listNutritionDeclaration
        ]
      }
    ];

    // Make the content call
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents,
      config: {
        systemInstruction: systemContext,
        tools: toolsList,
        toolConfig: { includeServerSideToolInvocations: true }
      }
    });

    const toolCalls: McpToolCall[] = [];
    let updatedOrder = { ...orderState };
    let finalEnvironment = { ...env };

    const functionCalls = response.functionCalls;
    if (functionCalls && functionCalls.length > 0) {
      console.log("Gemini triggered function call:", JSON.stringify(functionCalls));
      for (const fc of functionCalls) {
        const toolName = fc.name;
        const args: any = fc.args || {};
        let result: any = { success: true };
        let status: "success" | "warning" | "error" = "success";
        let message = "";

        // Core transactional logic mimicking Cloudflare Worker MCP server
        if (toolName === "set_delivery_scenario") {
          const isDelivery = Boolean(args.isDelivery);
          finalEnvironment.isDelivery = isDelivery;
          updatedOrder.isDelivery = isDelivery;
          result = { isDelivery, deliveryFee: isDelivery ? (env.distanceKm > 2.0 ? 4.50 : 2.50) : 0 };
          message = `Updated order delivery scenario to ${isDelivery ? "Delivery" : "Pickup"}.`;
        } 
        else if (toolName === "bind_coupon") {
          const code = String(args.code).toUpperCase();
          // Verify
          const validCodes = ["MCD50", "MCD_BREAKFAST_15", "MCD_BURGER_20"];
          if (!validCodes.includes(code)) {
            status = "warning";
            result = { success: false, error: "Invalid coupon code." };
            message = `Attempted to bind unknown coupon code ${code}.`;
          } else {
            // Check breakfast time restriction
            if (code === "MCD_BREAKFAST_15" && env.timeOfDay >= "10:30") {
              status = "warning";
              result = { success: false, error: "Breakfast coupon is only valid before 10:30 AM." };
              message = `Refused breakfast coupon MCD_BREAKFAST_15 (current time: ${env.timeOfDay}).`;
            } else {
              // Valid coupon
              const couponObj = [
                { id: "coupon_mcd50", code: "MCD50", name: "Mega Family discount", value: 10, minSpend: 50, discountType: "fixed" },
                { id: "coupon_breakfast15", code: "MCD_BREAKFAST_15", name: "Breakfast 15% Off", value: 0.15, minSpend: 5, discountType: "percentage" },
                { id: "coupon_burger20", code: "MCD_BURGER_20", name: "Burger 20% Off", value: 0.20, minSpend: 8, discountType: "percentage" }
              ].find(c => c.code === code);

              if (couponObj) {
                updatedOrder.appliedCoupon = couponObj as any;
                result = { success: true, appliedCoupon: couponObj };
                message = `Successfully bound coupon ${code} to draft transaction.`;
              }
            }
          }
        } 
        else if (toolName === "redeem_points_hashbrown") {
          if (finalEnvironment.userPoints >= 500) {
            finalEnvironment.userPoints -= 500;
            // Add hashbrown to cart
            const hashbrownItem = MENU_ITEMS.find(item => item.sku === "BRK_HASHBROWN") || MENU_ITEMS[3];
            const existsIdx = updatedOrder.items.findIndex((ci: any) => ci.item.sku === "BRK_HASHBROWN");
            if (existsIdx > -1) {
              updatedOrder.items[existsIdx].quantity += 1;
            } else {
              updatedOrder.items.push({ item: hashbrownItem, quantity: 1 });
            }
            result = { success: true, remainingPoints: finalEnvironment.userPoints };
            message = `Redeemed 500 points for a free Hash Brown.`;
          } else {
            status = "warning";
            result = { success: false, error: "Insufficient loyalty points (500 pts required)." };
            message = `Attempted points redemption with insufficient balance (${finalEnvironment.userPoints} pts).`;
          }
        } 
        else if (toolName === "lock_order") {
          if (updatedOrder.items.length === 0) {
            status = "warning";
            result = { success: false, error: "Cannot lock an empty shopping cart." };
            message = "Lock order failed: cart is empty.";
          } else {
            updatedOrder.status = "locked";
            result = { success: true, status: "locked" };
            message = "Locked shopping cart and froze item prices. Inventory locked.";
          }
        } 
        else if (toolName === "create_order") {
          if (updatedOrder.status !== "locked") {
            updatedOrder.status = "locked"; // force lock first
          }
          const orderId = "MCD-" + Math.floor(100000 + Math.random() * 900000);
          updatedOrder.id = orderId;
          updatedOrder.status = "paid";
          updatedOrder.pickupCode = "MC-" + Math.floor(1000 + Math.random() * 9000);
          result = { success: true, orderId, pickupCode: updatedOrder.pickupCode };
          message = `Finalized McDonald's transaction ${orderId}. Generated pickup verification.`;
        } 
        else if (toolName === "add_item_to_cart") {
          const sku = String(args.sku).toUpperCase();
          const quantity = Number(args.quantity || 1);
          const menuItem = MENU_ITEMS.find(item => item.sku === sku);

          if (!menuItem) {
            status = "warning";
            result = { success: false, error: `SKU ${sku} not found in catalog.` };
            message = `Failed to add SKU ${sku} (not found).`;
          } else if (menuItem.stock < quantity) {
            status = "warning";
            result = { success: false, error: `Insufficient stock for ${menuItem.name}.` };
            message = `Failed to add ${menuItem.name}: Stock requested ${quantity} but only ${menuItem.stock} available.`;
          } else {
            // Check breakfast hour constraint if breakfast item
            if (menuItem.category === "breakfast" && env.timeOfDay >= "10:30") {
              status = "warning";
              result = { success: false, error: "Breakfast items are only served before 10:30 AM." };
              message = `Refused breakfast item ${menuItem.name} after 10:30 AM.`;
            } else {
              const existsIdx = updatedOrder.items.findIndex((ci: any) => ci.item.sku === sku);
              if (existsIdx > -1) {
                updatedOrder.items[existsIdx].quantity += quantity;
              } else {
                updatedOrder.items.push({ item: menuItem, quantity });
              }
              result = { success: true, added: sku, quantity };
              message = `Added ${quantity}x ${menuItem.name} to order.`;
            }
          }
        } 
        else if (toolName === "remove_item_from_cart") {
          const sku = String(args.sku).toUpperCase();
          const existsIdx = updatedOrder.items.findIndex((ci: any) => ci.item.sku === sku);
          if (existsIdx > -1) {
            const removedItemName = updatedOrder.items[existsIdx].item.name;
            updatedOrder.items.splice(existsIdx, 1);
            result = { success: true, removed: sku };
            message = `Removed ${removedItemName} completely from order.`;
          } else {
            status = "warning";
            result = { success: false, error: "Item not in cart." };
            message = `Failed to remove SKU ${sku}: item not found in cart.`;
          }
        } 
        else if (toolName === "list_nutrition") {
          let totalCals = 0, totalProtein = 0, totalCarbs = 0, totalFat = 0;
          updatedOrder.items.forEach((ci: any) => {
            totalCals += ci.item.calories * ci.quantity;
            totalProtein += ci.item.protein * ci.quantity;
            totalCarbs += ci.item.carbs * ci.quantity;
            totalFat += ci.item.fat * ci.quantity;
          });
          result = {
            success: true,
            nutritionTotals: { calories: totalCals, protein: totalProtein, carbs: totalCarbs, fat: totalFat },
            itemsCount: updatedOrder.items.length
          };
          message = `Calculated nutrition summary: ${totalCals} kcal, ${totalProtein}g protein, ${totalCarbs}g carbs, ${totalFat}g fat.`;
        }

        toolCalls.push({
          id: "call_" + Math.random().toString(36).substr(2, 9),
          timestamp: new Date().toLocaleTimeString(),
          toolName,
          args,
          result,
          status,
          type: ["set_delivery_scenario", "list_nutrition"].includes(toolName) ? "read" : "transaction",
          message
        });
      }
    }

    // Recalculate prices based on final tool operations
    updatedOrder = recalculateOrder(updatedOrder, finalEnvironment, isComboActive, isPromoActive);

    // Call Gemini a second time to provide a conversational response with the result of function executions
    // This is the standard pattern to let the model generate text incorporating tool execution outcomes.
    let finalAssistantText = response.text || "";

    if (toolCalls.length > 0) {
      const secondPrompt = `The simulated Cloudflare Workers MCP Server executed the functions successfully:
${toolCalls.map(tc => `- Tool: ${tc.toolName} | Args: ${JSON.stringify(tc.args)} | Status: ${tc.status} | Response: ${JSON.stringify(tc.result)} | Message: ${tc.message}`).join("\n")}

Please summarize the results to the user in a friendly voice, showing how the Agent Skills mapped to these transaction rules.
If an order was finalized (create_order executed), make sure to display the payment app card with the Universal Link and the instructions specified in your Payment Instruction Wrapper skill.`;

      const secondResponse = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: [
          ...contents,
          { role: "model", parts: [{ text: response.text || "I will call the MCP tools to update your state." }] },
          { role: "user", parts: [{ text: secondPrompt }] }
        ],
        config: {
          systemInstruction: systemContext
        }
      });
      finalAssistantText = secondResponse.text || "State updated successfully.";
    }

    return res.json({
      text: finalAssistantText,
      orderState: updatedOrder,
      mcpCalls: toolCalls,
      environment: finalEnvironment
    });

  } catch (error: any) {
    console.error("Gemini API Error:", error);
    return res.status(500).json({ error: error?.message || "Internal server error during chat reasoning." });
  }
});

// Serve static assets in production, and run Vite in development
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`McDonald's Server running on http://localhost:${PORT}`);
  });
}

startServer();
