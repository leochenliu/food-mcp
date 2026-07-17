/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Shared MCP transaction logic, reused by both:
 *   - the local Express server (server.ts)
 *   - the Cloudflare Pages Function (functions/api/agent/chat.ts)
 *
 * This module is runtime-safe for the Cloudflare Workers runtime
 * (no Node-only built-ins; only `fetch`, `AbortSignal`, `process.env`).
 */

import { MenuItem, OrderState, Environment } from "../types";
import { MENU_ITEMS } from "../data";

// ─────────────────────────────────────────────────────────────────────────────
// Remote MCP backend (Cloudflare Worker, Streamable HTTP) + local fallback
// ─────────────────────────────────────────────────────────────────────────────
// Hard timeout for remote MCP calls so an unreachable backend fails fast to local fallback.
const MCP_TIMEOUT_MS = 8000;

// Runtime env accessor that is safe even when `process` is undefined
// (e.g. some Cloudflare Pages runtimes before nodejs_compat is applied).
function getEnv(key: string, fallback?: string): string | undefined {
  try {
    if (typeof process !== "undefined" && process.env && process.env[key] != null) return process.env[key];
  } catch { /* process unavailable */ }
  return fallback;
}

// Runtime configuration — injected by the host (Express server or Pages Function)
// so the code never depends on `process.env` being populated in the cloud.
export interface AgentConfigLike {
  MINIMAX_API_KEY?: string;
  MCP_REMOTE_URL?: string;
  USE_REMOTE_MCP?: string;
}

// Recalculates order amounts based on items, isDelivery, distance, and applied coupons/combo bundles
export function recalculateOrder(state: OrderState, env: Environment, combosSkillActive: boolean, promoSkillActive: boolean): OrderState {
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
  const subtotalWithDiscount = Math.max(0, subtotal - discount - bundleCredit);
  const tax = parseFloat((subtotalWithDiscount * 0.085).toFixed(2));
  const total = parseFloat((subtotalWithDiscount + deliveryFee + tax).toFixed(2));

  return {
    ...state,
    items,
    deliveryFee,
    discount,
    bundleCredit,
    tax,
    subtotal: parseFloat(subtotal.toFixed(2)),
    total: parseFloat(total.toFixed(2))
  };
}

// Parse a JSON-RPC response that may arrive as application/json or text/event-stream.
async function parseRpcResponse(res: Response): Promise<any> {
  const ct = res.headers.get("content-type") || "";
  if (ct.includes("application/json")) return res.json();
  if (ct.includes("text/event-stream")) {
    const text = await res.text();
    let last: any = null;
    for (const rawLine of text.split("\n")) {
      const line = rawLine.trim();
      if (line.startsWith("data:")) {
        const json = line.slice(5).trim();
        if (json) {
          try { last = JSON.parse(json); } catch { /* ignore malformed */ }
        }
      }
    }
    return last;
  }
  return res.json().catch(() => ({}));
}

// Open a Streamable HTTP MCP session and complete the initialize handshake.
async function mcpCreateSession(baseUrl: string): Promise<string | null> {
  const initRes = await fetch(baseUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json", "Accept": "application/json, text/event-stream" },
    signal: AbortSignal.timeout(MCP_TIMEOUT_MS),
    body: JSON.stringify({
      jsonrpc: "2.0", id: 1, method: "initialize",
      params: { protocolVersion: "2025-06-18", capabilities: {}, clientInfo: { name: "food-mcp-proxy", version: "1.0.0" } }
    })
  });
  const sessionId = initRes.headers.get("mcp-session-id");
  await parseRpcResponse(initRes);
  if (sessionId) {
    await fetch(baseUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Accept": "application/json, text/event-stream", "Mcp-Session-Id": sessionId },
      signal: AbortSignal.timeout(MCP_TIMEOUT_MS),
      body: JSON.stringify({ jsonrpc: "2.0", method: "notifications/initialized", params: {} })
    }).catch(() => undefined);
  }
  return sessionId;
}

// Call a tool on the remote MCP session.
async function mcpCallTool(sessionId: string | null, name: string, args: Record<string, any>, baseUrl: string): Promise<any> {
  const res = await fetch(baseUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Accept": "application/json, text/event-stream",
      ...(sessionId ? { "Mcp-Session-Id": sessionId } : {})
    },
    signal: AbortSignal.timeout(MCP_TIMEOUT_MS),
    body: JSON.stringify({ jsonrpc: "2.0", id: Date.now(), method: "tools/call", params: { name, arguments: args } })
  });
  const body = await parseRpcResponse(res);
  const content = body?.result?.content || [];
  const text = content[0]?.text || "{}";
  try { return JSON.parse(text); } catch { return { success: false, message: text }; }
}

// Local in-process fallback — mirrors the remote Worker's transactional logic.
function runLocalTool(
  toolName: string,
  args: any,
  orderIn: OrderState,
  envIn: Environment
): { result: any; status: "success" | "warning" | "error"; message: string; order: OrderState; environment: Environment } {
  const order: any = { ...orderIn, items: orderIn.items.map((ci: any) => ({ ...ci, item: ci.item })) };
  const environment: Environment = { ...envIn };
  let result: any = { success: true };
  let status: "success" | "warning" | "error" = "success";
  let message = "";

  if (toolName === "set_delivery_scenario") {
    const isDelivery = Boolean(args.isDelivery);
    environment.isDelivery = isDelivery;
    order.isDelivery = isDelivery;
    result = { isDelivery, deliveryFee: isDelivery ? (environment.distanceKm > 2.0 ? 4.50 : 2.50) : 0 };
    message = `Updated order delivery scenario to ${isDelivery ? "Delivery" : "Pickup"}.`;
  }
  else if (toolName === "bind_coupon") {
    const code = String(args.code).toUpperCase();
    const validCodes = ["MCD50", "MCD_BREAKFAST_15", "MCD_BURGER_20"];
    if (!validCodes.includes(code)) {
      status = "warning";
      result = { success: false, error: "Invalid coupon code." };
      message = `Attempted to bind unknown coupon code ${code}.`;
    } else {
      if (code === "MCD_BREAKFAST_15" && environment.timeOfDay >= "10:30") {
        status = "warning";
        result = { success: false, error: "Breakfast coupon is only valid before 10:30 AM." };
        message = `Refused breakfast coupon MCD_BREAKFAST_15 (current time: ${environment.timeOfDay}).`;
      } else {
        const couponObj = [
          { id: "coupon_mcd50", code: "MCD50", name: "Mega Family discount", value: 10, minSpend: 50, discountType: "fixed" },
          { id: "coupon_breakfast15", code: "MCD_BREAKFAST_15", name: "Breakfast 15% Off", value: 0.15, minSpend: 5, discountType: "percentage" },
          { id: "coupon_burger20", code: "MCD_BURGER_20", name: "Burger 20% Off", value: 0.20, minSpend: 8, discountType: "percentage" }
        ].find(c => c.code === code);
        if (couponObj) {
          order.appliedCoupon = couponObj;
          result = { success: true, appliedCoupon: couponObj };
          message = `Successfully bound coupon ${code} to draft transaction.`;
        }
      }
    }
  }
  else if (toolName === "redeem_points_hashbrown") {
    if (environment.userPoints >= 500) {
      environment.userPoints -= 500;
      const hashbrownItem = MENU_ITEMS.find(item => item.sku === "BRK_HASHBROWN") || MENU_ITEMS[3];
      const existsIdx = order.items.findIndex((ci: any) => ci.item.sku === "BRK_HASHBROWN");
      if (existsIdx > -1) {
        order.items[existsIdx].quantity += 1;
      } else {
        order.items.push({ item: hashbrownItem, quantity: 1 });
      }
      result = { success: true, remainingPoints: environment.userPoints };
      message = `Redeemed 500 points for a free Hash Brown.`;
    } else {
      status = "warning";
      result = { success: false, error: "Insufficient loyalty points (500 pts required)." };
      message = `Attempted points redemption with insufficient balance (${environment.userPoints} pts).`;
    }
  }
  else if (toolName === "lock_order") {
    if (order.items.length === 0) {
      status = "warning";
      result = { success: false, error: "Cannot lock an empty shopping cart." };
      message = "Lock order failed: cart is empty.";
    } else {
      order.status = "locked";
      result = { success: true, status: "locked" };
      message = "Locked shopping cart and froze item prices. Inventory locked.";
    }
  }
  else if (toolName === "create_order") {
    if (order.status !== "locked") {
      order.status = "locked";
    }
    const orderId = "MCD-" + Math.floor(100000 + Math.random() * 900000);
    order.id = orderId;
    order.status = "paid";
    order.pickupCode = "MC-" + Math.floor(1000 + Math.random() * 9000);
    result = { success: true, orderId, pickupCode: order.pickupCode };
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
      if (menuItem.category === "breakfast" && environment.timeOfDay >= "10:30") {
        status = "warning";
        result = { success: false, error: "Breakfast items are only served before 10:30 AM." };
        message = `Refused breakfast item ${menuItem.name} after 10:30 AM.`;
      } else {
        const existsIdx = order.items.findIndex((ci: any) => ci.item.sku === sku);
        if (existsIdx > -1) {
          order.items[existsIdx].quantity += quantity;
        } else {
          order.items.push({ item: menuItem, quantity });
        }
        result = { success: true, added: sku, quantity };
        message = `Added ${quantity}x ${menuItem.name} to order.`;
      }
    }
  }
  else if (toolName === "remove_item_from_cart") {
    const sku = String(args.sku).toUpperCase();
    const existsIdx = order.items.findIndex((ci: any) => ci.item.sku === sku);
    if (existsIdx > -1) {
      const removedItemName = order.items[existsIdx].item.name;
      order.items.splice(existsIdx, 1);
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
    order.items.forEach((ci: any) => {
      totalCals += ci.item.calories * ci.quantity;
      totalProtein += ci.item.protein * ci.quantity;
      totalCarbs += ci.item.carbs * ci.quantity;
      totalFat += ci.item.fat * ci.quantity;
    });
    result = {
      success: true,
      nutritionTotals: { calories: totalCals, protein: totalProtein, carbs: totalCarbs, fat: totalFat },
      itemsCount: order.items.length
    };
    message = `Calculated nutrition summary: ${totalCals} kcal, ${totalProtein}g protein, ${totalCarbs}g carbs, ${totalFat}g fat.`;
  }

  return { result, status, message, order, environment };
}

// Execute a tool: prefer the remote MCP, fall back to local execution on any error.
export async function executeTool(
  toolName: string,
  args: any,
  order: OrderState,
  env: Environment,
  combosSkillActive: boolean,
  promoSkillActive: boolean,
  config?: AgentConfigLike
): Promise<{ result: any; status: "success" | "warning" | "error"; message: string; order: OrderState; environment: Environment; usedRemote: boolean }> {
  const baseUrl = (config && config.MCP_REMOTE_URL) || getEnv("MCP_REMOTE_URL") || "https://mcd-mcp-server.leochenliu.workers.dev/mcp";
  const useRemote = (config && config.USE_REMOTE_MCP != null)
    ? config.USE_REMOTE_MCP !== "false"
    : getEnv("USE_REMOTE_MCP", "true") !== "false";
  if (useRemote) {
    try {
      const sessionId = await mcpCreateSession(baseUrl);
      await mcpCallTool(sessionId, "sync_state", { order, environment: env, combosSkillActive, promoSkillActive }, baseUrl);
      const payload = await mcpCallTool(sessionId, toolName, args, baseUrl);
      const status: "success" | "warning" | "error" = payload.success === false ? "warning" : "success";
      const message = payload.message || (payload.success ? `${toolName} executed.` : `${toolName} failed.`);
      const result = { ...payload };
      delete result.order;
      delete result.environment;
      const outOrder: any = { ...(payload.order || order) };
      outOrder.isDelivery = payload.environment ? (payload.environment as any).isDelivery : (order as any).isDelivery;
      return {
        result,
        status,
        message,
        order: outOrder as OrderState,
        environment: (payload.environment as Environment) || env,
        usedRemote: true
      };
    } catch (err: any) {
      console.warn("[mcp] remote call failed, falling back to local:", err?.message);
    }
  }
  return { ...runLocalTool(toolName, args, order, env), usedRemote: false };
}

// Function/tool declarations for MCP tools (OpenAI-compatible tools schema)
export const MCP_TOOLS = [
  {
    type: "function",
    function: {
      name: "set_delivery_scenario",
      description: "Set order fulfillment type to home delivery (true) or in-store pickup (false) based on client request/scenario rules.",
      parameters: {
        type: "object",
        properties: {
          isDelivery: {
            type: "boolean",
            description: "Whether the order is for Delivery (true) or In-store Pickup (false)."
          }
        },
        required: ["isDelivery"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "bind_coupon",
      description: "Binds a promo coupon code (e.g., MCD50, MCD_BREAKFAST_15, MCD_BURGER_20) to the order to apply discount rules.",
      parameters: {
        type: "object",
        properties: {
          code: {
            type: "string",
            description: "The coupon code to apply to the order draft."
          }
        },
        required: ["code"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "redeem_points_hashbrown",
      description: "Exchange 500 loyalty points to add a FREE Hash Brown (BRK_HASHBROWN) to the current order.",
      parameters: {
        type: "object",
        properties: {}
      }
    }
  },
  {
    type: "function",
    function: {
      name: "lock_order",
      description: "Freeze and lock the current draft order's pricing, fees, and items to prepare for payment. Reserve ingredients stock.",
      parameters: {
        type: "object",
        properties: {}
      }
    }
  },
  {
    type: "function",
    function: {
      name: "create_order",
      description: "Creates the finalized transaction, returns a transactional Order UUID and random pickup verification code.",
      parameters: {
        type: "object",
        properties: {}
      }
    }
  },
  {
    type: "function",
    function: {
      name: "add_item_to_cart",
      description: "Add a food item to the shopping cart by specifying its SKU code and quantity.",
      parameters: {
        type: "object",
        properties: {
          sku: {
            type: "string",
            description: "The SKU code of the item to add, e.g., REG_BIGMAC, BRK_MCMUFFIN."
          },
          quantity: {
            type: "integer",
            description: "Number of units to add (defaults to 1)."
          }
        },
        required: ["sku"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "remove_item_from_cart",
      description: "Remove an item completely from the shopping cart by specifying its SKU code.",
      parameters: {
        type: "object",
        properties: {
          sku: {
            type: "string",
            description: "The SKU code of the item to remove."
          }
        },
        required: ["sku"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "list_nutrition",
      description: "Provides aggregated and individual nutritional metrics (calories, protein, carbs, fat) for all items in the current cart.",
      parameters: {
        type: "object",
        properties: {}
      }
    }
  }
];
