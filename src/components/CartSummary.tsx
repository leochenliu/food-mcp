/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { OrderState, Coupon, Environment, MenuItem } from "../types";
import { INITIAL_COUPONS } from "../data";
import { ShoppingBag, Ticket, Trash2, ShieldCheck, Lock, CheckCircle2, ChevronRight, HelpCircle, X } from "lucide-react";

interface CartSummaryProps {
  orderState: OrderState;
  env: Environment;
  isBreakfast: boolean;
  onApplyCoupon: (couponCode: string) => void;
  onRemoveCoupon: () => void;
  onRedeemHashbrown: () => void;
  onLockOrder: () => void;
  onCreateOrder: () => void;
  onClearCart: () => void;
  skillsActive: { combos: boolean; promos: boolean; payment: boolean };
}

export const CartSummary: React.FC<CartSummaryProps> = ({
  orderState,
  env,
  isBreakfast,
  onApplyCoupon,
  onRemoveCoupon,
  onRedeemHashbrown,
  onLockOrder,
  onCreateOrder,
  onClearCart,
  skillsActive
}) => {
  const [showDeepLink, setShowDeepLink] = useState(false);
  const hasItems = orderState.items.length > 0;

  // Check if they qualify for breakfast/lunch combos to show help tips
  const hasBreakfastBurger = orderState.items.some(ci => (ci.item.sku === "BRK_MCMUFFIN" || ci.item.sku === "BRK_SAUSAGE_EGG"));
  const hasHashbrown = orderState.items.some(ci => ci.item.sku === "BRK_HASHBROWN");
  const hasCoffee = orderState.items.some(ci => ci.item.sku === "BRK_COFFEE");

  const hasLunchBurger = orderState.items.some(ci => (ci.item.sku === "REG_BIGMAC" || ci.item.sku === "REG_SPICY_CHICKEN"));
  const hasFries = orderState.items.some(ci => ci.item.sku === "REG_FRIES");
  const hasCoke = orderState.items.some(ci => ci.item.sku === "REG_COLA");

  // Determine active combos
  const breakfastComboActive = skillsActive.combos && hasBreakfastBurger && hasHashbrown && hasCoffee;
  const lunchComboActive = skillsActive.combos && hasLunchBurger && hasFries && hasCoke;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4 relative" id="cart-summary-container">
      {/* Inline HUD notification for deep link to avoid window.alert */}
      {showDeepLink && (
        <div className="absolute inset-0 bg-slate-900/90 rounded-2xl z-20 p-5 text-white flex flex-col justify-center items-center space-y-4 animate-fade-in">
          <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400">
            <ChevronRight className="w-6 h-6 animate-ping" />
          </div>
          <div className="text-center space-y-1 max-w-[85%]">
            <h4 className="font-bold text-sm text-blue-400">Mobile Deep Link Dispatched</h4>
            <p className="text-[10px] text-slate-300 font-mono break-all bg-slate-950 p-2 rounded border border-slate-800">
              mcdonalds://pay?orderId={orderState.id}&price={orderState.total}
            </p>
            <p className="text-[10px] text-slate-400">
              Handshake established! Launching simulated external Google Pay gateway.
            </p>
          </div>
          <button
            onClick={() => setShowDeepLink(false)}
            className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-lg flex items-center gap-1 transition"
          >
            <X className="w-3.5 h-3.5" /> Close Gateway
          </button>
        </div>
      )}

      <div className="flex items-center justify-between border-b border-slate-200 pb-3">
        <h3 className="font-display font-bold text-slate-900 text-sm flex items-center gap-2">
          <ShoppingBag className="w-4 h-4 text-blue-600" /> TRANSACTION ORDER DRAFT
        </h3>
        {hasItems && orderState.status === "draft" && (
          <button
            onClick={onClearCart}
            className="text-slate-500 hover:text-red-600 transition cursor-pointer flex items-center gap-1 text-xs font-bold"
            id="clear-cart-btn"
          >
            <Trash2 className="w-3.5 h-3.5" /> Clear
          </button>
        )}
      </div>

      {/* Cart Items List */}
      {!hasItems ? (
        <div className="text-center py-8 text-slate-400 flex flex-col items-center justify-center space-y-2">
          <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center text-slate-300 border border-slate-100">
            <ShoppingBag className="w-6 h-6" />
          </div>
          <p className="text-sm font-semibold text-slate-700">Order draft is empty</p>
          <p className="text-xs text-slate-500 max-w-[200px] mx-auto leading-relaxed">Add menu items, or instruct Mickey via chat!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {/* Items rows */}
          <div className="max-h-52 overflow-y-auto space-y-2.5 pr-1 divide-y divide-slate-100">
            {orderState.items.map((cartItem) => (
              <div key={cartItem.item.sku} className="flex justify-between items-center text-xs text-slate-700 pt-2 first:pt-0">
                <div className="flex items-center gap-2">
                  <span className="font-mono bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded font-bold text-[10px]">
                    {cartItem.quantity}x
                  </span>
                  <div>
                    <span className="font-bold text-slate-800">{cartItem.item.name}</span>
                    <span className="block text-[10px] text-slate-500 font-mono">{cartItem.item.sku}</span>
                  </div>
                </div>
                <span className="font-mono font-bold text-slate-900">
                  ${(cartItem.item.price * cartItem.quantity).toFixed(2)}
                </span>
              </div>
            ))}
          </div>

          {/* Dynamic Combo Highlights based on Skills */}
          {skillsActive.combos && (
            <div className="space-y-1.5 pt-2 border-t border-slate-200">
              {breakfastComboActive && (
                <div className="text-[10px] bg-emerald-50 text-emerald-800 border border-emerald-200 p-2 rounded-lg flex items-center justify-between">
                  <span>🎉 <strong>Morning Starter combo</strong> Activated!</span>
                  <span className="font-mono font-bold">-$2.50 Credit</span>
                </div>
              )}
              {lunchComboActive && (
                <div className="text-[10px] bg-emerald-50 text-emerald-800 border border-emerald-200 p-2 rounded-lg flex items-center justify-between">
                  <span>🎉 <strong>Classic Golden Lunch combo</strong> Activated!</span>
                  <span className="font-mono font-bold">-$1.50 Credit</span>
                </div>
              )}

              {/* Suggestions to unlock */}
              {isBreakfast && hasBreakfastBurger && (!hasHashbrown || !hasCoffee) && (
                <div className="text-[10px] bg-amber-50 text-amber-800 border border-amber-200 p-2 rounded-lg">
                  💡 Add <strong>Hash Brown</strong> & <strong>Premium Coffee</strong> to unlock <strong>Morning Combo (-$2.50)</strong>!
                </div>
              )}
              {!isBreakfast && hasLunchBurger && (!hasFries || !hasCoke) && (
                <div className="text-[10px] bg-amber-50 text-amber-800 border border-amber-200 p-2 rounded-lg">
                  💡 Add <strong>Fries</strong> & <strong>Cola</strong> to unlock <strong>Classic Lunch Combo (-$1.50)</strong>!
                </div>
              )}
            </div>
          )}

          {/* Coupon and Loyalty Panel (Active Promos skill) */}
          {skillsActive.promos && orderState.status === "draft" && (
            <div className="pt-3 border-t border-slate-200 space-y-2">
              <h4 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                <Ticket className="w-3.5 h-3.5 text-blue-600" /> BIND COUPON (MCP AUTH CHECK)
              </h4>

              {/* Wallet coupons */}
              <div className="flex flex-wrap gap-1.5">
                {INITIAL_COUPONS.map((coupon) => {
                  const isBreakfastOnly = coupon.categoryLimit === "breakfast";
                  const isDisabled = (isBreakfastOnly && !isBreakfast) || (orderState.subtotal < coupon.minSpend);
                  const isApplied = orderState.appliedCoupon?.code === coupon.code;

                  return (
                    <button
                      key={coupon.code}
                      onClick={() => isApplied ? onRemoveCoupon() : onApplyCoupon(coupon.code)}
                      disabled={isDisabled}
                      className={`text-[10px] px-2.5 py-1.5 rounded-lg font-semibold transition cursor-pointer flex items-center gap-1 border ${
                        isApplied
                          ? "bg-blue-600 border-blue-600 text-white"
                          : isDisabled
                          ? "bg-slate-50 border-slate-100 text-slate-300 cursor-not-allowed"
                          : "bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-600"
                      }`}
                      title={`${coupon.description} (Min spend: $${coupon.minSpend})`}
                      id={`coupon-btn-${coupon.code}`}
                    >
                      {coupon.code}
                      {isApplied && <span className="text-[9px]">✓</span>}
                    </button>
                  );
                })}

                {/* Loyalty Exchange Reward Button */}
                {env.userPoints >= 500 && (
                  <button
                    onClick={onRedeemHashbrown}
                    className="text-[10px] px-2.5 py-1.5 bg-yellow-50 hover:bg-yellow-100 border border-yellow-300 text-yellow-850 rounded-lg font-bold cursor-pointer transition"
                    id="redeem-reward-btn"
                  >
                    🎁 Free Hash Brown (500 pts)
                  </button>
                )}
              </div>

              {orderState.appliedCoupon && (
                <div className="flex justify-between items-center text-[10px] bg-blue-50/50 text-blue-800 p-2.5 rounded-lg border border-blue-100 font-medium">
                  <div>
                    <span className="font-bold">{orderState.appliedCoupon.name}</span>
                    <span className="block text-[9px] opacity-80">{orderState.appliedCoupon.description}</span>
                  </div>
                  <button onClick={onRemoveCoupon} className="text-blue-600 hover:underline cursor-pointer font-bold">
                    Remove
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Pricing Ledger */}
          <div className="pt-3 border-t border-slate-200 space-y-1.5 font-mono text-xs">
            <div className="flex justify-between text-slate-500">
              <span>Cart Subtotal:</span>
              <span>${orderState.subtotal.toFixed(2)}</span>
            </div>
            
            {orderState.discount > 0 && (
              <div className="flex justify-between text-emerald-600 font-medium">
                <span>Total Savings:</span>
                <span>-${orderState.discount.toFixed(2)}</span>
              </div>
            )}

            <div className="flex justify-between text-slate-500">
              <span>Fulfillment ({env.isDelivery ? "Delivery" : "In-Store Pickup"}):</span>
              <span>
                {env.isDelivery ? `$${orderState.deliveryFee.toFixed(2)}` : "FREE"}
              </span>
            </div>

            <div className="flex justify-between text-slate-800 font-bold text-sm border-t border-dashed border-slate-200 pt-1.5">
              <span>TOTAL ORDER:</span>
              <span className="text-slate-900">${orderState.total.toFixed(2)}</span>
            </div>
          </div>

          {/* Checkout transaction controls */}
          <div className="pt-3 space-y-2">
            {orderState.status === "draft" ? (
              <button
                onClick={onLockOrder}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs py-2.5 rounded-xl shadow-xs hover:shadow-md cursor-pointer transition flex items-center justify-center gap-1.5"
                id="lock-order-draft-btn"
              >
                <Lock className="w-3.5 h-3.5" /> LOCK TRANSACTION & CHECK STOCK
              </button>
            ) : orderState.status === "locked" ? (
              <div className="space-y-2 bg-slate-50 border border-slate-200 p-3 rounded-xl">
                <div className="flex items-center gap-1.5 text-[11px] text-amber-800 font-semibold justify-center">
                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping"></span>
                  <span>Draft Locked (Inventory frozen)</span>
                </div>
                <button
                  onClick={onCreateOrder}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-2.5 rounded-xl shadow-xs cursor-pointer transition flex items-center justify-center gap-1.5"
                  id="create-order-worker-btn"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-white" /> COMMIT TRANSACTION (TS MCP)
                </button>
              </div>
            ) : orderState.status === "paid" ? (
              <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-xl text-center space-y-3">
                <div className="flex flex-col items-center justify-center space-y-1">
                  <CheckCircle2 className="w-8 h-8 text-emerald-500 fill-emerald-100 animate-bounce" />
                  <span className="text-xs font-bold text-emerald-800 block">Transaction Completed!</span>
                  <span className="text-[10px] font-mono font-medium text-emerald-600">ID: {orderState.id}</span>
                </div>

                <div className="text-[10px] text-slate-500 bg-white p-2.5 rounded-lg border border-slate-100 text-left space-y-1 font-mono">
                  <div className="flex justify-between">
                    <span>Fulfillment:</span>
                    <span className="font-bold text-slate-700">{env.isDelivery ? "Delivery" : "Pickup"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Pickup Code:</span>
                    <span className="font-bold text-emerald-600 text-xs">{orderState.pickupCode || "MCD-8392"}</span>
                  </div>
                  <div className="flex justify-between border-t border-slate-100 pt-1 mt-1 text-xs">
                    <span>Final Paid:</span>
                    <span className="font-bold text-slate-800">${orderState.total.toFixed(2)}</span>
                  </div>
                </div>

                {/* Deep link card */}
                {skillsActive.payment && (
                  <div className="bg-slate-900 rounded-lg p-2.5 text-left border border-slate-800">
                    <span className="text-[9px] font-bold text-blue-400 uppercase tracking-widest block mb-1">
                      📲 Universal Link Jump (Skill Wrapped)
                    </span>
                    <button
                      onClick={() => setShowDeepLink(true)}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-bold py-1.5 px-2.5 rounded flex items-center justify-between transition cursor-pointer"
                      id="universal-pay-link-btn"
                    >
                      <span>Pay with Mobile App</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                    <span className="text-[8px] text-slate-400 block mt-1.5 leading-tight">
                      This launches pre-filled checkout. Use pickup code at restaurant counter!
                    </span>
                  </div>
                )}
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
};
