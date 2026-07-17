/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface MenuItem {
  sku: string;
  name: string;
  category: "breakfast" | "regular";
  price: number;
  stock: number;
  description: string;
  image: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface CartItem {
  item: MenuItem;
  quantity: number;
}

export interface Coupon {
  id: string;
  code: string;
  name: string;
  description: string;
  discountType: "fixed" | "percentage";
  value: number; // e.g. 10 for $10 off, 0.15 for 15% off
  minSpend: number;
  applicablePrefix?: string; // e.g. "BRK_" or "REG_"
  categoryLimit?: "breakfast" | "regular";
}

export interface McpToolCall {
  id: string;
  timestamp: string;
  toolName: string;
  args: Record<string, any>;
  result: any;
  status: "success" | "warning" | "error";
  type: "read" | "transaction";
  message: string;
}

export interface AgentSkill {
  id: string;
  title: string;
  description: string;
  content: string;
  category: "scenario" | "promotion" | "pairing" | "payment";
}

export interface Environment {
  weather: "sunny" | "rainy";
  distanceKm: number;
  timeOfDay: string; // "HH:MM" e.g. "08:30" or "13:15"
  userPoints: number;
  isDelivery: boolean;
}

export interface OrderState {
  id: string | null;
  status: "idle" | "draft" | "locked" | "paid";
  items: CartItem[];
  appliedCoupon: Coupon | null;
  isDelivery?: boolean;
  deliveryFee: number;
  discount: number;
  bundleCredit: number;
  tax: number;
  subtotal: number;
  total: number;
  pickupCode: string | null;
}

export interface ChatMessage {
  id: string;
  sender: "user" | "agent" | "system";
  text: string;
  timestamp: string;
  mcpCalls?: McpToolCall[];
}
