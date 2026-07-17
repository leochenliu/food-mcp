/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { Environment, MenuItem, OrderState, McpToolCall, ChatMessage, AgentSkill } from "./types";
import { INITIAL_SKILLS, MENU_ITEMS } from "./data";
import { EnvironmentControl } from "./components/EnvironmentControl";
import { MenuGrid } from "./components/MenuGrid";
import { CartSummary } from "./components/CartSummary";
import { McpConsole } from "./components/McpConsole";
import { SkillsManager } from "./components/SkillsManager";
import { AgentChat } from "./components/AgentChat";
import { BusinessGuide } from "./components/BusinessGuide";
import { Flame, Brain, Server, Landmark, Sparkles, Star, Github } from "lucide-react";

export default function App() {
  // 1. Core Simulator States
  const [env, setEnv] = useState<Environment>({
    weather: "sunny",
    distanceKm: 0.8,
    timeOfDay: "13:00",
    userPoints: 850,
    isDelivery: false
  });

  const [skills, setSkills] = useState<AgentSkill[]>(INITIAL_SKILLS);
  const [activeSkillIds, setActiveSkillIds] = useState<string[]>(
    INITIAL_SKILLS.map(s => s.id)
  );

  const [orderState, setOrderState] = useState<OrderState>({
    id: null,
    status: "draft",
    items: [],
    appliedCoupon: null,
    deliveryFee: 0,
    discount: 0,
    bundleCredit: 0,
    tax: 0,
    subtotal: 0,
    total: 0,
    pickupCode: null
  });

  const [logs, setLogs] = useState<McpToolCall[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      sender: "agent",
      text: "Welcome to the McDonald's Decoupled Brain & Limbs Simulator! 🍔\n\nI am **Mickey**, your AI Ordering Agent. I coordinate between **Agent Skills** (which govern our flexible business rules and promotions) and the **TypeScript MCP Server** (which executes atomic, transactional checkout logic on Cloudflare Workers).\n\nFeel free to say what you want (e.g. \"*Suggest a high-protein breakfast and apply my coupon*\"), or tap buttons on the menu directly to see the MCP Server logs run live!",
      timestamp: new Date().toLocaleTimeString()
    }
  ]);

  const [isThinking, setIsThinking] = useState(false);

  const isBreakfast = env.timeOfDay < "10:30";

  // 2. Auto-Recalculate order state whenever items, isDelivery, distance or coupon changes
  useEffect(() => {
    // If store menu hour changes from breakfast to lunch, empty breakfast items
    if (!isBreakfast) {
      const hasBreakfastItems = orderState.items.some(ci => ci.item.category === "breakfast");
      if (hasBreakfastItems) {
        setOrderState(prev => ({
          ...prev,
          items: prev.items.filter(ci => ci.item.category !== "breakfast"),
          appliedCoupon: prev.appliedCoupon?.categoryLimit === "breakfast" ? null : prev.appliedCoupon
        }));
        
        // Add a system notice
        setLogs(prev => [
          ...prev,
          {
            id: "sys_hour_" + Date.now(),
            timestamp: new Date().toLocaleTimeString(),
            toolName: "catalog_hour_check",
            args: { timeOfDay: env.timeOfDay },
            result: { menuSwitched: "lunch", breakfastItemsCleared: true },
            status: "warning",
            type: "read",
            message: "MCD Catalog hour threshold reached (10:30 AM). All breakfast items removed from active grill."
          }
        ]);
      }
    }

    recalcTotal();
  }, [env.timeOfDay, env.isDelivery, env.distanceKm, orderState.items, orderState.appliedCoupon, activeSkillIds]);

  const recalcTotal = () => {
    setOrderState(prev => {
      let subtotal = 0;
      prev.items.forEach(ci => {
        subtotal += ci.item.price * ci.quantity;
      });

      let discount = 0;
      let bundleCredit = 0;

      const isPromoActive = activeSkillIds.includes("skill_promotion");
      const isCombosActive = activeSkillIds.includes("skill_pairing");

      // Apply coupon (Promo skill)
      if (prev.appliedCoupon && isPromoActive) {
        const coupon = prev.appliedCoupon;
        if (subtotal >= coupon.minSpend) {
          if (coupon.code === "MCD50") {
            discount = 10.00;
          } else if (coupon.code === "MCD_BREAKFAST_15") {
            let bfTotal = 0;
            prev.items.forEach(ci => {
              if (ci.item.sku.startsWith("BRK_")) {
                bfTotal += ci.item.price * ci.quantity;
              }
            });
            discount = parseFloat((bfTotal * 0.15).toFixed(2));
          } else if (coupon.code === "MCD_BURGER_20") {
            const burgerSkus = ["BRK_MCMUFFIN", "BRK_SAUSAGE_EGG", "REG_BIGMAC", "REG_SPICY_CHICKEN"];
            let burgerTotal = 0;
            prev.items.forEach(ci => {
              if (burgerSkus.includes(ci.item.sku)) {
                burgerTotal += ci.item.price * ci.quantity;
              }
            });
            discount = parseFloat((burgerTotal * 0.20).toFixed(2));
          }
        }
      }

      // Apply combo bundle credits (Combo pairings skill)
      if (isCombosActive) {
        // Breakfast Combo
        const hasBreakfastBurger = prev.items.some(ci => (ci.item.sku === "BRK_MCMUFFIN" || ci.item.sku === "BRK_SAUSAGE_EGG") && ci.quantity > 0);
        const hasHashbrown = prev.items.some(ci => ci.item.sku === "BRK_HASHBROWN" && ci.quantity > 0);
        const hasCoffee = prev.items.some(ci => ci.item.sku === "BRK_COFFEE" && ci.quantity > 0);

        if (hasBreakfastBurger && hasHashbrown && hasCoffee) {
          const burgerQty = prev.items.find(ci => ci.item.sku === "BRK_MCMUFFIN" || ci.item.sku === "BRK_SAUSAGE_EGG")?.quantity || 0;
          const hashQty = prev.items.find(ci => ci.item.sku === "BRK_HASHBROWN")?.quantity || 0;
          const coffeeQty = prev.items.find(ci => ci.item.sku === "BRK_COFFEE")?.quantity || 0;
          const comboCount = Math.min(burgerQty, hashQty, coffeeQty);
          bundleCredit += comboCount * 2.50;
        }

        // Lunch Combo
        const hasLunchBurger = prev.items.some(ci => (ci.item.sku === "REG_BIGMAC" || ci.item.sku === "REG_SPICY_CHICKEN") && ci.quantity > 0);
        const hasFries = prev.items.some(ci => ci.item.sku === "REG_FRIES" && ci.quantity > 0);
        const hasCoke = prev.items.some(ci => ci.item.sku === "REG_COLA" && ci.quantity > 0);

        if (hasLunchBurger && hasFries && hasCoke) {
          const burgerQty = prev.items.find(ci => ci.item.sku === "REG_BIGMAC" || ci.item.sku === "REG_SPICY_CHICKEN")?.quantity || 0;
          const friesQty = prev.items.find(ci => ci.item.sku === "REG_FRIES")?.quantity || 0;
          const cokeQty = prev.items.find(ci => ci.item.sku === "REG_COLA")?.quantity || 0;
          const comboCount = Math.min(burgerQty, friesQty, cokeQty);
          bundleCredit += comboCount * 1.50;
        }
      }

      let deliveryFee = 0;
      if (env.isDelivery) {
        deliveryFee = env.distanceKm > 2.0 ? 4.50 : 2.50;
      }

      const subtotalWithDiscount = Math.max(0, subtotal - discount - bundleCredit);
      const tax = parseFloat((subtotalWithDiscount * 0.085).toFixed(2));
      const total = parseFloat((subtotalWithDiscount + deliveryFee + tax).toFixed(2));

      return {
        ...prev,
        deliveryFee,
        discount,
        bundleCredit,
        tax,
        subtotal: parseFloat(subtotal.toFixed(2)),
        total: parseFloat(total.toFixed(2))
      };
    });
  };

  // 3. Simulated Transactional MCP Server Tools triggered from UI interactions
  const triggerMcpLog = (toolName: string, args: Record<string, any>, result: any, status: "success" | "warning" | "error", message: string, type: "read" | "transaction") => {
    const newCall: McpToolCall = {
      id: "call_" + Math.random().toString(36).substr(2, 9),
      timestamp: new Date().toLocaleTimeString(),
      toolName,
      args,
      result,
      status,
      type,
      message
    };
    setLogs(prev => [...prev, newCall]);
    return newCall;
  };

  const handleAddToCart = (item: MenuItem, quantity: number) => {
    if (orderState.status === "locked" || orderState.status === "paid") return;

    setOrderState(prev => {
      const existing = prev.items.find(ci => ci.item.sku === item.sku);
      let updatedItems = [];
      if (existing) {
        updatedItems = prev.items.map(ci =>
          ci.item.sku === item.sku ? { ...ci, quantity: ci.quantity + quantity } : ci
        );
      } else {
        updatedItems = [...prev.items, { item, quantity }];
      }

      triggerMcpLog(
        "add_item_to_cart",
        { sku: item.sku, quantity },
        { success: true, updatedQuantity: (existing?.quantity || 0) + quantity },
        "success",
        `Atomic stock reserve: added ${quantity}x ${item.name} to transaction draft.`,
        "transaction"
      );

      return {
        ...prev,
        items: updatedItems
      };
    });
  };

  const handleRemoveFromCart = (sku: string) => {
    if (orderState.status === "locked" || orderState.status === "paid") return;

    setOrderState(prev => {
      const existing = prev.items.find(ci => ci.item.sku === sku);
      if (!existing) return prev;

      let updatedItems = [];
      if (existing.quantity > 1) {
        updatedItems = prev.items.map(ci =>
          ci.item.sku === sku ? { ...ci, quantity: ci.quantity - 1 } : ci
        );
      } else {
        updatedItems = prev.items.filter(ci => ci.item.sku !== sku);
      }

      triggerMcpLog(
        "remove_item_from_cart",
        { sku },
        { success: true, remainingQuantity: existing.quantity - 1 },
        "success",
        `Released ingredients stock for ${existing.item.name}.`,
        "transaction"
      );

      return {
        ...prev,
        items: updatedItems
      };
    });
  };

  const handleApplyCoupon = (couponCode: string) => {
    const couponObj = [
      { id: "coupon_mcd50", code: "MCD50", name: "Mega Family discount", value: 10, minSpend: 50, discountType: "fixed" },
      { id: "coupon_breakfast15", code: "MCD_BREAKFAST_15", name: "Breakfast 15% Off", value: 0.15, minSpend: 5, discountType: "percentage" },
      { id: "coupon_burger20", code: "MCD_BURGER_20", name: "Burger 20% Off", value: 0.20, minSpend: 8, discountType: "percentage" }
    ].find(c => c.code === couponCode);

    if (couponObj) {
      setOrderState(prev => {
        triggerMcpLog(
          "bind_coupon",
          { code: couponCode },
          { success: true, appliedCoupon: couponObj },
          "success",
          `Checked promotional catalog. Securely bound coupon ${couponCode} to current transaction.`,
          "transaction"
        );
        return {
          ...prev,
          appliedCoupon: couponObj as any
        };
      });
    }
  };

  const handleRemoveCoupon = () => {
    setOrderState(prev => {
      if (prev.appliedCoupon) {
        triggerMcpLog(
          "bind_coupon",
          { code: "" },
          { success: true, appliedCoupon: null },
          "success",
          `Unlinked coupon ${prev.appliedCoupon.code} from order draft.`,
          "transaction"
        );
      }
      return {
        ...prev,
        appliedCoupon: null
      };
    });
  };

  const handleRedeemHashbrown = () => {
    if (env.userPoints < 500) return;

    setEnv(prev => ({ ...prev, userPoints: prev.userPoints - 500 }));
    const hashbrown = MENU_ITEMS.find(item => item.sku === "BRK_HASHBROWN") || MENU_ITEMS[3];

    setOrderState(prev => {
      const existing = prev.items.find(ci => ci.item.sku === "BRK_HASHBROWN");
      let updatedItems = [];
      if (existing) {
        updatedItems = prev.items.map(ci =>
          ci.item.sku === "BRK_HASHBROWN" ? { ...ci, quantity: ci.quantity + 1 } : ci
        );
      } else {
        updatedItems = [...prev.items, { item: hashbrown, quantity: 1 }];
      }

      triggerMcpLog(
        "redeem_points_hashbrown",
        { pointsRequired: 500 },
        { success: true, addedSku: "BRK_HASHBROWN", remainingPoints: env.userPoints - 500 },
        "success",
        "Point balance checked and authorized. Added free reward Hash Brown to active order.",
        "transaction"
      );

      return {
        ...prev,
        items: updatedItems
      };
    });
  };

  const handleLockOrder = () => {
    if (orderState.items.length === 0) return;

    setOrderState(prev => {
      triggerMcpLog(
        "lock_order",
        {},
        { success: true, status: "locked" },
        "success",
        "Checked restaurant inventories. Freezing order pricing structure. Order locked for payment.",
        "transaction"
      );
      return {
        ...prev,
        status: "locked"
      };
    });
  };

  const handleCreateOrder = () => {
    const orderId = "MCD-" + Math.floor(100000 + Math.random() * 900000);
    const code = "MC-" + Math.floor(1000 + Math.random() * 9000);

    setOrderState(prev => {
      triggerMcpLog(
        "create_order",
        {},
        { success: true, orderId, pickupCode: code },
        "success",
        `Created transaction on CF Workers backend. Secure order ID: ${orderId}. Verification code generated: ${code}.`,
        "transaction"
      );
      return {
        ...prev,
        id: orderId,
        status: "paid",
        pickupCode: code
      };
    });
  };

  const handleClearCart = () => {
    setOrderState({
      id: null,
      status: "draft",
      items: [],
      appliedCoupon: null,
      deliveryFee: 0,
      discount: 0,
      bundleCredit: 0,
      tax: 0,
      subtotal: 0,
      total: 0,
      pickupCode: null
    });
    triggerMcpLog("clear_cart", {}, { success: true }, "success", "Discarded current order draft. Ingredients stock released.", "transaction");
  };

  const handleClearLogs = () => {
    setLogs([]);
  };

  const handleApplyPreset = (preset: {
    env?: Partial<Environment>;
    itemsToCart?: { sku: string; quantity: number }[];
    couponCode?: string;
    chatText?: string;
    logMessage?: string;
  }) => {
    // 1. Set environment if provided
    if (preset.env) {
      setEnv(prev => ({ ...prev, ...preset.env }));
    }

    // 2. Clear then add items to cart if provided
    if (preset.itemsToCart) {
      const newCartItems = preset.itemsToCart.map(p => {
        const item = MENU_ITEMS.find(m => m.sku === p.sku);
        return item ? { item, quantity: p.quantity } : null;
      }).filter(Boolean) as { item: MenuItem; quantity: number }[];

      setOrderState(prev => ({
        ...prev,
        status: "draft",
        items: newCartItems,
        appliedCoupon: null
      }));
    }

    // 3. Apply coupon if provided
    if (preset.couponCode) {
      setTimeout(() => {
        handleApplyCoupon(preset.couponCode!);
      }, 80);
    }

    // 4. Log system warning
    if (preset.logMessage) {
      triggerMcpLog(
        "preset_autopilot",
        preset.env || {},
        { success: true },
        "warning",
        preset.logMessage,
        "read"
      );
    }

    // 5. Send message if provided
    if (preset.chatText) {
      setTimeout(() => {
        handleSendMessage(preset.chatText!);
      }, 200);
    }
  };

  // 4. Send Message to Full-Stack AI Agent (Gemini)
  const handleSendMessage = async (text: string) => {
    const userMsg: ChatMessage = {
      id: "user_" + Date.now(),
      sender: "user",
      text,
      timestamp: new Date().toLocaleTimeString()
    };

    setMessages(prev => [...prev, userMsg]);
    setIsThinking(true);

    try {
      const response = await fetch("/api/agent/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...messages, userMsg],
          environment: env,
          orderState,
          activeSkills: activeSkillIds
        })
      });

      if (!response.ok) {
        throw new Error("Failed to contact server-side AI Agent.");
      }

      const data = await response.json();

      // Append assistant messages
      const agentMsg: ChatMessage = {
        id: "agent_" + Date.now(),
        sender: "agent",
        text: data.text,
        timestamp: new Date().toLocaleTimeString(),
        mcpCalls: data.mcpCalls || []
      };

      setMessages(prev => [...prev, agentMsg]);

      // Merge logs returned from the backend agent execution
      if (data.mcpCalls && data.mcpCalls.length > 0) {
        setLogs(prev => [...prev, ...data.mcpCalls]);
      }

      // Update environment if adjusted by the agent
      if (data.environment) {
        setEnv(data.environment);
      }

      // Merge orderState returned from the backend agent transaction
      if (data.orderState) {
        setOrderState(data.orderState);
      }

    } catch (err: any) {
      console.error(err);
      setMessages(prev => [
        ...prev,
        {
          id: "err_" + Date.now(),
          sender: "system",
          text: `智能服务连接受阻: ${err?.message || "请确认您的网络连接或 API 配置是否正常。"}`,
          timestamp: new Date().toLocaleTimeString()
        }
      ]);
    } finally {
      setIsThinking(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 pb-12" id="app-wrapper">
      {/* Header: Corporate Navigation from Polish Theme */}
      <header className="bg-white border-b border-slate-200 shadow-xs shrink-0" id="main-header">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-10 h-10 bg-red-600 rounded-lg flex items-center justify-center shadow-xs">
              <span className="text-white font-black text-xl italic font-display">M</span>
            </div>
            <div>
              <h1 className="text-base md:text-lg font-bold tracking-tight text-slate-900 leading-none">McAgent 麦当劳智能订餐调度系统 v2.4.0</h1>
              <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-widest mt-1">系统架构：AI 业务规则驱动 / MCP 事务执行</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="hidden sm:flex items-center space-x-2 bg-green-50 px-3 py-1.5 rounded-full border border-green-200">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-[10px] font-bold text-green-700 tracking-wide uppercase">MCP 节点：CF-Worker-South-1 (正常在线)</span>
            </div>
            <div className="w-9 h-9 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center font-mono text-[11px] font-bold text-slate-700 shadow-xs">
              MCD
            </div>
          </div>
        </div>
      </header>

      {/* Main Dashboard Layout */}
      <div className="max-w-7xl mx-auto px-4 md:px-6 mt-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left 7 Columns: Skills manager, Chat & Menu */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Section 0: Interactive Business Operations Playbook */}
          <section id="business-guide-section">
            <BusinessGuide
              onApplyPreset={handleApplyPreset}
              isBreakfast={isBreakfast}
              env={env}
            />
          </section>
          
          {/* Section 1: Brain Skills Manager */}
          <section id="skills-section">
            <SkillsManager
              skills={skills}
              setSkills={setSkills}
              activeSkillIds={activeSkillIds}
              setActiveSkillIds={setActiveSkillIds}
            />
          </section>

          {/* Section 2: Split Chat & Menu Workspace */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6" id="chat-and-menu-split">
            {/* AI Agent Brain Chat */}
            <section id="chat-section">
              <AgentChat
                messages={messages}
                onSendMessage={handleSendMessage}
                isThinking={isThinking}
                isBreakfast={isBreakfast}
              />
            </section>

            {/* Menu Grid Catalog */}
            <section id="catalog-section" className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
              <MenuGrid
                isBreakfast={isBreakfast}
                cart={orderState.items}
                onAddToCart={handleAddToCart}
                onRemoveFromCart={handleRemoveFromCart}
              />
            </section>
          </div>
        </div>

        {/* Right 4 Columns: Context, Cart & MCP logs */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Section 3: Context Simulator */}
          <section id="context-section">
            <EnvironmentControl
              env={env}
              setEnv={setEnv}
              isBreakfast={isBreakfast}
            />
          </section>

          {/* Section 4: Cart transaction ledger */}
          <section id="cart-section">
            <CartSummary
              orderState={orderState}
              env={env}
              isBreakfast={isBreakfast}
              onApplyCoupon={handleApplyCoupon}
              onRemoveCoupon={handleRemoveCoupon}
              onRedeemHashbrown={handleRedeemHashbrown}
              onLockOrder={handleLockOrder}
              onCreateOrder={handleCreateOrder}
              onClearCart={handleClearCart}
              skillsActive={{
                combos: activeSkillIds.includes("skill_pairing"),
                promos: activeSkillIds.includes("skill_promotion"),
                payment: activeSkillIds.includes("skill_payment")
              }}
            />
          </section>

          {/* Section 5: Decoupled MCP server live terminal */}
          <section id="mcp-server-section">
            <McpConsole
              logs={logs}
              onClearLogs={handleClearLogs}
            />
          </section>
        </div>
      </div>
      
      {/* Footer Branding */}
      <footer className="max-w-7xl mx-auto px-6 mt-12 text-center text-xs text-slate-400 space-y-2 border-t border-slate-200/60 pt-6">
        <p className="flex items-center justify-center gap-1">
          <Sparkles className="w-3.5 h-3.5 text-blue-600 fill-blue-600/10" /> 麦当劳 AI 智脑微服务点餐系统。基于 React, Vite & Google Gemini API 构建。
        </p>
        <p className="text-[10px]">
          正在模拟 Cloudflare Worker 服务器端点的云端事务流。高安全分布式沙箱隔离环境。
        </p>
      </footer>
    </div>
  );
}
