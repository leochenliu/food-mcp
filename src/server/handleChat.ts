/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Agent chat orchestration: builds the "Mickey" system prompt, calls MiniMax,
 * and runs the MCP tool chain. Shared by the local Express server and the
 * Cloudflare Pages Function so the cloud and local behavior stay identical.
 *
 * The runtime configuration (API key, MCP URL, remote toggle) is passed in via
 * `config` and never read directly from `process.env` here, because on Cloudflare
 * Pages (Workers runtime) secrets arrive through `context.env`, not `process.env`.
 */

import { Environment, OrderState, McpToolCall } from "../types";
import { INITIAL_SKILLS, MENU_ITEMS } from "../data";
import { MCP_TOOLS, recalculateOrder, executeTool, AgentConfigLike } from "./mcp";

// MiniMax API configuration (OpenAI-compatible Chat Completions endpoint)
// NOTE: the access domain is api.minimaxi.com (NOT minimax.io)
const MINIMAX_BASE_URL = "https://api.minimaxi.com/v1";
const MINIMAX_MODEL = "MiniMax-M3";

// Resolve the API key from the injected config first, then fall back to process.env.
function getApiKey(config?: AgentConfigLike): string | undefined {
  if (config && config.MINIMAX_API_KEY) return config.MINIMAX_API_KEY;
  try {
    if (typeof process !== "undefined" && process.env && process.env.MINIMAX_API_KEY) {
      return process.env.MINIMAX_API_KEY;
    }
  } catch { /* process unavailable */ }
  return undefined;
}

// Call the MiniMax Chat Completions API (OpenAI-compatible protocol)
async function callMiniMax(payload: Record<string, any>, apiKey: string): Promise<any> {
  const res = await fetch(`${MINIMAX_BASE_URL}/chat/completions`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ model: MINIMAX_MODEL, ...payload })
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`MiniMax API error ${res.status}: ${errText}`);
  }

  return res.json();
}

export interface ChatRequestBody {
  messages: { sender?: string; text?: string }[];
  environment?: Environment;
  orderState: OrderState;
  activeSkills?: string[];
}

export interface ChatResult {
  text: string;
  orderState: OrderState;
  mcpCalls: McpToolCall[];
  environment: Environment;
  degraded?: boolean;
  degradedReason?: string;
}

/**
 * Local rule-engine / mock assistant used when no API key is configured OR when
 * the real MiniMax call fails. It mirrors the AI reasoning + tool calls so the
 * app stays fully functional (coupon binding, add-to-cart, checkout, etc.).
 */
async function runMockAgent(
  body: ChatRequestBody,
  env: Environment,
  orderState: OrderState,
  activeSkillIds: string[],
  isComboActive: boolean,
  isPromoActive: boolean
): Promise<{ text: string; orderState: OrderState; mcpCalls: McpToolCall[]; environment: Environment }> {
  const messages = body.messages || [];
  let mockText = "Hello! I am Mickey, your AI Ordering Agent. [Mock Mode] Let me help you out! ";
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
  if (latestUserMsg.includes("add") || latestUserMsg.includes("eat") || latestUserMsg.includes("order") || latestUserMsg.includes("breakfast") || latestUserMsg.includes("big mac") || latestUserMsg.includes("burger")) {
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

  return {
    text: mockText,
    orderState: updatedOrder,
    mcpCalls: toolCalls,
    environment: env
  };
}

// Core handler — returns the same payload shape the frontend expects:
// { text, orderState, mcpCalls, environment }
export async function handleChat(body: ChatRequestBody, config?: AgentConfigLike): Promise<ChatResult> {
  const { messages, environment, orderState, activeSkills } = body;

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

  const apiKey = getApiKey(config);

  // No API key (or explicitly disabled) → run the local rule engine directly.
  if (!apiKey) {
    console.log("Running in local Mock Agent Mode (No API Key).");
    return runMockAgent(body, env, orderState, activeSkillIds, isComboActive, isPromoActive);
  }

  // Construct context of active skills (the "Brain")
  const systemContext = `You are "Mickey", the official McDonald's AI Ordering Agent.
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

  try {
    // Map chat history to OpenAI-compatible messages, prepending the system instruction
    const chatHistory = messages.map((m: any) => ({
      role: m.sender === "user" ? "user" : "assistant",
      content: m.text
    }));
    const openAiMessages: any[] = [
      { role: "system", content: systemContext },
      ...chatHistory
    ];

    // Make the first content call (may return tool_calls)
    const response = await callMiniMax({
      messages: openAiMessages,
      tools: MCP_TOOLS,
      tool_choice: "auto"
    }, apiKey);

    const assistantMessage = response?.choices?.[0]?.message || {};
    const rawText: string = assistantMessage.content || "";

    const toolCalls: McpToolCall[] = [];
    let updatedOrder = { ...orderState };
    let finalEnvironment = { ...env };
    let anyLocal = false; // tracks whether any tool fell back to local execution

    const functionCalls = assistantMessage.tool_calls || [];
    if (functionCalls && functionCalls.length > 0) {
      console.log("MiniMax triggered function call:", JSON.stringify(functionCalls));
      for (const fc of functionCalls) {
        const toolName = fc.function?.name;
        let args: any = {};
        try {
          args = fc.function?.arguments ? JSON.parse(fc.function.arguments) : {};
        } catch {
          args = {};
        }
        let result: any = { success: true };
        let status: "success" | "warning" | "error" = "success";
        let message = "";

        // Delegate execution to the remote MCP (Cloudflare Worker). If the remote
        // call fails, executeTool falls back to the in-process runLocalTool().
        const exec = await executeTool(toolName, args, updatedOrder, finalEnvironment, isComboActive, isPromoActive, config);
        updatedOrder = exec.order;
        finalEnvironment = exec.environment;
        if (!exec.usedRemote) anyLocal = true;
        result = exec.result;
        status = exec.status;
        message = exec.message;

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

    // If any tool fell back to local execution, run the canonical local recalculation.
    // When the remote MCP handled everything, its returned state (already recalculated
    // with the same rules, including the active-skill flags) is authoritative.
    if (anyLocal) {
      updatedOrder = recalculateOrder(updatedOrder, finalEnvironment, isComboActive, isPromoActive);
    }

    // Call MiniMax a second time to provide a conversational response with the result of function executions
    // This is the standard pattern to let the model generate text incorporating tool execution outcomes.
    let finalAssistantText = rawText || "";

    if (toolCalls.length > 0) {
      const secondPrompt = `The remote Cloudflare Workers MCP Server executed the functions successfully:
${toolCalls.map(tc => `- Tool: ${tc.toolName} | Args: ${JSON.stringify(tc.args)} | Status: ${tc.status} | Response: ${JSON.stringify(tc.result)} | Message: ${tc.message}`).join("\n")}

Please summarize the results to the user in a friendly voice, showing how the Agent Skills mapped to these transaction rules.
If an order was finalized (create_order executed), make sure to display the payment app card with the Universal Link and the instructions specified in your Payment Instruction Wrapper skill.`;

      const secondResponse = await callMiniMax({
        messages: [
          { role: "system", content: systemContext },
          ...chatHistory,
          { role: "assistant", content: rawText || "I will call the MCP tools to update your state." },
          { role: "user", content: secondPrompt }
        ]
      }, apiKey);
      finalAssistantText = secondResponse?.choices?.[0]?.message?.content || "State updated successfully.";
    }

    return {
      text: finalAssistantText,
      orderState: updatedOrder,
      mcpCalls: toolCalls,
      environment: finalEnvironment
    };
  } catch (err: any) {
    // The real MiniMax call failed (network blocked, key rejected, timeout, etc.).
    // Fall back to the local rule engine so the chat stays functional, and surface
    // the real reason via `degradedReason` for diagnostics.
    console.warn("MiniMax API call failed, falling back to local mock agent:", err?.message);
    const mock = await runMockAgent(body, env, orderState, activeSkillIds, isComboActive, isPromoActive);
    return {
      ...mock,
      degraded: true,
      degradedReason: err?.message || "MiniMax API unavailable"
    };
  }
}
