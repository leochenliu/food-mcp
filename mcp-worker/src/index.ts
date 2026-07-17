import { McpAgent } from "agents/mcp";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { MENU_ITEMS, INITIAL_COUPONS } from "./catalog";
import { recalculateOrder, createInitialOrder, createInitialEnvironment } from "./order";
import { Environment, MenuItem, OrderState } from "./types";

// Bindings injected by wrangler.toml (Durable Object for per-session state).
type Env = {
  MCP_OBJECT: DurableObjectNamespace;
};

// Persisted per-session state (auto-managed by the agents SDK).
type AgentState = {
  order: OrderState;
  environment: Environment;
  combosSkillActive: boolean;
  promoSkillActive: boolean;
};

const BREAKFAST_BURGER_SKUS = ["BRK_MCMUFFIN", "BRK_SAUSAGE_EGG"];
const LUNCH_BURGER_SKUS = ["REG_BIGMAC", "REG_SPICY_CHICKEN"];

export class McDonaldsMCP extends McpAgent<Env, AgentState, Record<string, never>> {
  server = new McpServer({
    name: "McDonald's Ordering MCP",
    version: "1.0.0"
  });

  async init() {
    // Initialize session state on first use.
    // IMPORTANT: `this.state` is `undefined` until something is persisted
    // (the Agent has no `state` setter — only `setState()`). Accessing
    // `this.state.order` before init would throw and crash `onStart`, which
    // makes the MCP `initialize` handshake never complete (client sees
    // "streamableHttp fetch failed"). So we guard with `?.` and always
    // persist a full state object via `setState`.
    const order = this.state?.order ?? createInitialOrder();
    const environment = this.state?.environment ?? createInitialEnvironment();
    const combosSkillActive = this.state?.combosSkillActive ?? true;
    const promoSkillActive = this.state?.promoSkillActive ?? true;
    this.setState({ order, environment, combosSkillActive, promoSkillActive });

    // ---- Tool 0: sync_state (stateless bridge from the host app) ----
    // The host (food-mcp server.ts) is request-stateless: it sends the full
    // cart + environment on every call. We load it into this session so the
    // subsequent transactional tools operate on the real current state.
    this.server.tool(
      "sync_state",
      "Load the full current order + environment + active-skill flags from the host application. Used as a stateless bridge so the remote MCP operates on the real cart. Call this BEFORE any transactional tool.",
      {
        order: z.any().describe("Full OrderState JSON (items, totals, status, coupon...)."),
        environment: z.any().describe("Full Environment JSON (weather, distance, time, points...)."),
        combosSkillActive: z.boolean().optional().describe("Whether the combos/pairing skill is active."),
        promoSkillActive: z.boolean().optional().describe("Whether the promotion/coupon skill is active.")
      },
      async ({ order, environment, combosSkillActive, promoSkillActive }) => {
        if (order) this.state.order = order as OrderState;
        if (environment) this.state.environment = environment as Environment;
        if (typeof combosSkillActive === "boolean") this.state.combosSkillActive = combosSkillActive;
        if (typeof promoSkillActive === "boolean") this.state.promoSkillActive = promoSkillActive;
        this.recompute();
        return this.text({
          success: true,
          synced: true,
          message: "State synchronized from host application."
        });
      }
    );

    // ---- Tool 1: set_delivery_scenario ----
    this.server.tool(
      "set_delivery_scenario",
      "Set order fulfillment type to home delivery (true) or in-store pickup (false). Decides delivery surcharge from distance.",
      { isDelivery: z.boolean().describe("true = Delivery, false = In-store Pickup") },
      async ({ isDelivery }) => {
        this.state.environment.isDelivery = isDelivery;
        this.state.order.isDelivery = isDelivery;
        this.recompute();
        const fee = this.state.order.deliveryFee;
        return this.text({
          success: true,
          isDelivery,
          deliveryFee: fee,
          message: `Updated order to ${isDelivery ? "Delivery" : "In-store Pickup"} (surcharge $${fee.toFixed(2)}).`
        });
      }
    );

    // ---- Tool 2: bind_coupon ----
    this.server.tool(
      "bind_coupon",
      "Bind a promo coupon (MCD50, MCD_BREAKFAST_15, MCD_BURGER_20) to the order draft. Enforces validity/time rules.",
      { code: z.string().describe("Coupon code, e.g. MCD50") },
      async ({ code }) => {
        const normalized = String(code).toUpperCase();
        const validCodes = INITIAL_COUPONS.map((c) => c.code);
        if (!validCodes.includes(normalized)) {
          return this.warn(`Invalid coupon code "${normalized}".`);
        }
        if (normalized === "MCD_BREAKFAST_15" && this.state.environment.timeOfDay >= "10:30") {
          return this.warn("Breakfast coupon MCD_BREAKFAST_15 is only valid before 10:30 AM.");
        }
        const coupon = INITIAL_COUPONS.find((c) => c.code === normalized)!;
        this.state.order.appliedCoupon = coupon;
        this.recompute();
        return this.text({
          success: true,
          appliedCoupon: coupon.code,
          discount: this.state.order.discount,
          message: `Bound coupon ${coupon.code} to the draft transaction.`
        });
      }
    );

    // ---- Tool 3: redeem_points_hashbrown ----
    this.server.tool(
      "redeem_points_hashbrown",
      "Exchange 500 loyalty points for a FREE Hash Brown (BRK_HASHBROWN) added to the current order.",
      {},
      async () => {
        if (this.state.environment.userPoints < 500) {
          return this.warn(`Insufficient loyalty points (${this.state.environment.userPoints} pts, 500 required).`);
        }
        this.state.environment.userPoints -= 500;
        const hashbrown = MENU_ITEMS.find((m) => m.sku === "BRK_HASHBROWN")!;
        const idx = this.state.order.items.findIndex((ci) => ci.item.sku === "BRK_HASHBROWN");
        if (idx > -1) this.state.order.items[idx].quantity += 1;
        else this.state.order.items.push({ item: hashbrown, quantity: 1 });
        this.recompute();
        return this.text({
          success: true,
          addedSku: "BRK_HASHBROWN",
          remainingPoints: this.state.environment.userPoints,
          message: "Redeemed 500 points for a FREE Hash Brown."
        });
      }
    );

    // ---- Tool 4: lock_order ----
    this.server.tool(
      "lock_order",
      "Freeze and lock the draft order's pricing/fees/items to prepare for payment and reserve stock.",
      {},
      async () => {
        if (this.state.order.items.length === 0) {
          return this.warn("Cannot lock an empty shopping cart.");
        }
        this.state.order.status = "locked";
        this.save();
        return this.text({
          success: true,
          status: "locked",
          message: "Locked shopping cart and froze item prices. Inventory reserved."
        });
      }
    );

    // ---- Tool 5: create_order ----
    this.server.tool(
      "create_order",
      "Finalize the transaction: returns a unique Order UUID and a random pickup verification code. Forces lock first.",
      {},
      async () => {
        this.state.order.status = "locked";
        const orderId = "MCD-" + Math.floor(100000 + Math.random() * 900000);
        const pickupCode = "MC-" + Math.floor(1000 + Math.random() * 9000);
        this.state.order.id = orderId;
        this.state.order.status = "paid";
        this.state.order.pickupCode = pickupCode;
        this.save();
        return this.text({
          success: true,
          orderId,
          pickupCode,
          total: this.state.order.total,
          message: `Finalized transaction ${orderId}. Pickup code ${pickupCode}.`
        });
      }
    );

    // ---- Tool 6: add_item_to_cart ----
    this.server.tool(
      "add_item_to_cart",
      "Add a menu item to the cart by SKU and quantity. Enforces stock and breakfast-time rules.",
      {
        sku: z.string().describe("SKU code, e.g. REG_BIGMAC, BRK_MCMUFFIN"),
        quantity: z.number().int().positive().optional().describe("Units to add (default 1)")
      },
      async ({ sku, quantity }) => {
        const normalized = String(sku).toUpperCase();
        const qty = Number(quantity || 1);
        const item: MenuItem | undefined = MENU_ITEMS.find((m) => m.sku === normalized);
        if (!item) return this.warn(`SKU ${normalized} not found in catalog.`);
        if (item.stock < qty) return this.warn(`Insufficient stock for ${item.name} (have ${item.stock}).`);
        if (item.category === "breakfast" && this.state.environment.timeOfDay >= "10:30") {
          return this.warn(`Breakfast item ${item.name} is only served before 10:30 AM.`);
        }
        const idx = this.state.order.items.findIndex((ci) => ci.item.sku === normalized);
        if (idx > -1) this.state.order.items[idx].quantity += qty;
        else this.state.order.items.push({ item, quantity: qty });
        this.recompute();
        return this.text({
          success: true,
          added: normalized,
          quantity: qty,
          message: `Added ${qty}x ${item.name} to the order.`
        });
      }
    );

    // ---- Tool 7: remove_item_from_cart ----
    this.server.tool(
      "remove_item_from_cart",
      "Remove an item completely from the cart by SKU.",
      { sku: z.string().describe("SKU code of the item to remove") },
      async ({ sku }) => {
        const normalized = String(sku).toUpperCase();
        const idx = this.state.order.items.findIndex((ci) => ci.item.sku === normalized);
        if (idx === -1) return this.warn(`SKU ${normalized} not found in cart.`);
        const name = this.state.order.items[idx].item.name;
        this.state.order.items.splice(idx, 1);
        this.recompute();
        return this.text({
          success: true,
          removed: normalized,
          message: `Removed ${name} from the order.`
        });
      }
    );

    // ---- Tool 8: list_nutrition ----
    this.server.tool(
      "list_nutrition",
      "Aggregated and per-item nutritional metrics (calories, protein, carbs, fat) for the current cart.",
      {},
      async () => {
        let calories = 0,
          protein = 0,
          carbs = 0,
          fat = 0;
        const perItem = this.state.order.items.map((ci) => {
          const c = ci.item.calories * ci.quantity;
          const p = ci.item.protein * ci.quantity;
          const cb = ci.item.carbs * ci.quantity;
          const f = ci.item.fat * ci.quantity;
          calories += c;
          protein += p;
          carbs += cb;
          fat += f;
          return { sku: ci.item.sku, name: ci.item.name, quantity: ci.quantity, calories: c, protein: p, carbs: cb, fat: f };
        });
        return this.text({
          success: true,
          nutritionTotals: { calories, protein, carbs, fat },
          items: perItem,
          message: `Nutrition summary: ${calories} kcal, ${protein}g protein, ${carbs}g carbs, ${fat}g fat.`
        });
      }
    );
  }

  /** Persist the current (mutated) state. The Agent has no `state` setter,
   * so in-place mutations like `this.state.order = ...` are NOT auto-saved —
   * they must be flushed via `setState`, otherwise the next request reads the
   * stale init snapshot and per-call state changes are lost. */
  private save() {
    this.setState(this.state);
  }

  /** Recalculate prices using the single source of truth. */
  private recompute() {
    this.state.order = recalculateOrder(
      this.state.order,
      this.state.environment,
      this.state.combosSkillActive,
      this.state.promoSkillActive
    );
    this.save();
  }

  /** Build a successful MCP text result, including the full order + environment snapshot. */
  private text(payload: Record<string, unknown>) {
    return {
      content: [
        {
          type: "text" as const,
          text: JSON.stringify({ ...payload, order: this.state.order, environment: this.state.environment }, null, 2)
        }
      ]
    };
  }

  /** Build a warning/error MCP text result (still returns 200 with content). */
  private warn(message: string) {
    return {
      content: [
        {
          type: "text" as const,
          text: JSON.stringify({ success: false, status: "warning", message, order: this.state.order, environment: this.state.environment }, null, 2)
        }
      ]
    };
  }
}

export default {
  fetch(request: Request, env: Env, ctx: ExecutionContext) {
    const url = new URL(request.url);
    if (url.pathname === "/sse") {
      return McDonaldsMCP.serve("/sse").fetch(request, env, ctx);
    }
    if (url.pathname === "/mcp") {
      return McDonaldsMCP.serve("/mcp").fetch(request, env, ctx);
    }
    return new Response("McDonald's Ordering MCP server.\nConnect an MCP client to the /mcp endpoint (Streamable HTTP).", {
      status: 200,
      headers: { "content-type": "text/plain; charset=utf-8" }
    });
  }
};
