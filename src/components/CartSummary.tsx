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
  onApplyCoupon: (code: string) => void;
  onRemoveCoupon: () => void;
  onRedeemHashbrown: () => void;
  onLockOrder: () => void;
  onCreateOrder: () => void;
  onClearCart: () => void;
  skillsActive: {
    scenarios: boolean;
    promos: boolean;
    combos: boolean;
    payment: boolean;
  };
}

export const CartSummary: React.FC<CartSummaryProps> = ({
  orderState,
  env,
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
  const hasMcMuffin = orderState.items.some(i => i.item.sku === "BRK_MCMUFFIN" || i.item.sku === "BRK_SAUSAGE_EGG");
  const hasHashbrown = orderState.items.some(i => i.item.sku === "BRK_HASHBROWN");
  const hasCoffee = orderState.items.some(i => i.item.sku === "BRK_COFFEE");
  const breakfastComboActive = skillsActive.combos && hasMcMuffin && hasHashbrown && hasCoffee;

  const hasLunchBurger = orderState.items.some(i => i.item.sku === "REG_BIGMAC" || i.item.sku === "REG_SPICY_CHICKEN");
  const hasFries = orderState.items.some(i => i.item.sku === "REG_FRIES");
  const hasCoke = orderState.items.some(i => i.item.sku === "REG_COLA");
  const lunchComboActive = skillsActive.combos && hasLunchBurger && hasFries && hasCoke;

  const isBreakfast = parseInt(env.timeOfDay.split(":")[0]) < 10 || (parseInt(env.timeOfDay.split(":")[0]) === 10 && parseInt(env.timeOfDay.split(":")[1]) < 30);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4 relative" id="cart-summary-container">
      {/* Inline HUD notification for deep link to avoid window.alert */}
      {showDeepLink && (
        <div className="absolute inset-0 bg-slate-900/90 rounded-2xl z-20 p-5 text-white flex flex-col justify-center items-center space-y-4 animate-fade-in">
          <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400">
            <ChevronRight className="w-6 h-6 animate-ping" />
          </div>
          <div className="text-center space-y-1 max-w-[85%]">
            <h4 className="font-bold text-sm text-blue-400">移动端快捷支付深层链接已发送</h4>
            <p className="text-[10px] text-slate-300 font-mono break-all bg-slate-950 p-2 rounded border border-slate-800">
              mcdonalds://pay?orderId={orderState.id}&price={orderState.total}
            </p>
            <p className="text-[10px] text-slate-400">
              安全握手连接已建立！正在模拟调起您的 Apple Pay/谷歌钱包/微信支付 支付网关。
            </p>
          </div>
          <button
            onClick={() => setShowDeepLink(false)}
            className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-lg flex items-center gap-1 transition cursor-pointer"
          >
            <X className="w-3.5 h-3.5" /> 关闭支付窗口
          </button>
        </div>
      )}

      <div className="flex items-center justify-between border-b border-slate-200 pb-3">
        <h3 className="font-display font-bold text-slate-900 text-sm flex items-center gap-2">
          <ShoppingBag className="w-4 h-4 text-blue-600" /> 购物车交易订单草稿
        </h3>
        {hasItems && orderState.status === "draft" && (
          <button
            onClick={onClearCart}
            className="text-slate-500 hover:text-red-600 transition cursor-pointer flex items-center gap-1 text-xs font-bold"
            id="clear-cart-btn"
          >
            <Trash2 className="w-3.5 h-3.5" /> 清空
          </button>
        )}
      </div>

      {/* Cart Items List */}
      {!hasItems ? (
        <div className="text-center py-8 text-slate-400 flex flex-col items-center justify-center space-y-2">
          <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center text-slate-300 border border-slate-100">
            <ShoppingBag className="w-6 h-6" />
          </div>
          <p className="text-sm font-semibold text-slate-700">购物车草稿空空如也</p>
          <p className="text-xs text-slate-500 max-w-[200px] mx-auto leading-relaxed">可以直接加购下方的菜单，或者通过智能聊天直接对 Mickey AI 下达指令！</p>
        </div>
      ) : (
        <div className="space-y-3">
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
                  <span>🎉 <strong>晨光麦满分超值组合</strong> 已激活！</span>
                  <span className="font-mono font-bold">-$2.50 立减优惠</span>
                </div>
              )}
              {lunchComboActive && (
                <div className="text-[10px] bg-emerald-50 text-emerald-800 border border-emerald-200 p-2 rounded-lg flex items-center justify-between">
                  <span>🎉 <strong>经典黄金正餐超值组合</strong> 已激活！</span>
                  <span className="font-mono font-bold">-$1.50 立减优惠</span>
                </div>
              )}

              {/* Suggestions to unlock */}
              {isBreakfast && hasMcMuffin && (!hasHashbrown || !hasCoffee) && (
                <div className="text-[10px] bg-amber-50 text-amber-800 border border-amber-200 p-2 rounded-lg">
                  💡 加购一个 <strong>脆薯饼</strong> 与一杯 <strong>鲜煮咖啡</strong> 即可解锁 <strong>晨光超值套餐组合 (立减 -$2.50)</strong>！
                </div>
              )}
              {!isBreakfast && hasLunchBurger && (!hasFries || !hasCoke) && (
                <div className="text-[10px] bg-amber-50 text-amber-800 border border-amber-200 p-2 rounded-lg">
                  💡 加购一份 <strong>经典薯条</strong> 与一杯 <strong>可口可乐</strong> 即可解锁 <strong>经典黄金正餐套餐组合 (立减 -$1.50)</strong>！
                </div>
              )}
            </div>
          )}

          {/* Coupon and Loyalty Panel (Active Promos skill) */}
          {skillsActive.promos && orderState.status === "draft" && (
            <div className="pt-3 border-t border-slate-200 space-y-2">
              <h4 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                <Ticket className="w-3.5 h-3.5 text-blue-600" /> 绑定优惠券或核销积分 (MCP 后端核销)
              </h4>

              {/* Wallet coupons */}
              <div className="flex flex-wrap gap-1.5">
                {INITIAL_COUPONS.map((cp) => {
                  const isApplied = orderState.appliedCoupon?.code === cp.code;
                  const isDisabled = orderState.subtotal < cp.minSpend || (cp.categoryLimit === "breakfast" && !isBreakfast);

                  return (
                    <button
                      key={cp.id}
                      onClick={() => onApplyCoupon(cp.code)}
                      disabled={isDisabled}
                      className={`text-[10px] px-2.5 py-1.5 rounded-lg font-semibold transition cursor-pointer flex items-center gap-1 border ${
                        isApplied
                          ? "bg-blue-600 border-blue-600 text-white"
                          : isDisabled
                          ? "bg-slate-50 border-slate-100 text-slate-300 cursor-not-allowed"
                          : "bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-600"
                      }`}
                      title={isDisabled ? `最低消费 $${cp.minSpend} 或不在时段内` : `应用券 ${cp.code}`}
                    >
                      {cp.code} {isApplied && "✓"}
                    </button>
                  );
                })}

                {env.userPoints >= 500 && (
                  <button
                    onClick={onRedeemHashbrown}
                    className="text-[10px] px-2.5 py-1.5 bg-yellow-50 hover:bg-yellow-100 border border-yellow-300 text-yellow-850 rounded-lg font-bold cursor-pointer transition"
                    id="redeem-reward-btn"
                  >
                    🎁 积分兑：免费脆薯饼 (扣500分)
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
                    移除
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Pricing Ledger */}
          <div className="pt-3 border-t border-slate-200 space-y-1.5 font-mono text-xs">
            <div className="flex justify-between text-slate-500">
              <span>购物车小计:</span>
              <span>${orderState.subtotal.toFixed(2)}</span>
            </div>

            {orderState.discount > 0 && (
              <div className="flex justify-between text-emerald-600 font-bold">
                <span>卡券折扣减免:</span>
                <span>-${orderState.discount.toFixed(2)}</span>
              </div>
            )}

            {orderState.bundleCredit > 0 && (
              <div className="flex justify-between text-indigo-600 font-bold">
                <span>套餐满减返利:</span>
                <span>-${orderState.bundleCredit.toFixed(2)}</span>
              </div>
            )}

            {env.isDelivery && (
              <div className="flex justify-between text-slate-500">
                <span>外送服务费 ({env.distanceKm.toFixed(1)}km {env.weather === "rainy" ? "雨天加成" : ""}):</span>
                <span>${orderState.deliveryFee.toFixed(2)}</span>
              </div>
            )}

            <div className="flex justify-between text-slate-500">
              <span>增值税与打包费 (8.5%):</span>
              <span>${orderState.tax.toFixed(2)}</span>
            </div>

            <div className="flex justify-between text-slate-800 font-bold text-sm border-t border-dashed border-slate-200 pt-1.5">
              <span>实付款总额:</span>
              <span className="text-slate-900">${orderState.total.toFixed(2)}</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-2" id="cart-actions-panel">
            {orderState.status === "draft" ? (
              <button
                onClick={onLockOrder}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs py-2.5 rounded-xl shadow-xs hover:shadow-md cursor-pointer transition flex items-center justify-center gap-1.5"
                id="lock-order-draft-btn"
              >
                <Lock className="w-3.5 h-3.5" /> 锁定草稿订单并验证库存
              </button>
            ) : orderState.status === "locked" ? (
              <div className="space-y-2 bg-slate-50 border border-slate-200 p-3 rounded-xl">
                <div className="text-[10px] text-slate-500 font-sans leading-relaxed text-center">
                  ⚠️ <strong>订单已被锁定：</strong> 价格已被锁定。现在您可以向 TypeScript 虚拟机分布式底层提交真实的支付交易。
                </div>
                <button
                  onClick={onCreateOrder}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-2.5 rounded-xl shadow-xs cursor-pointer transition flex items-center justify-center gap-1.5"
                  id="create-order-worker-btn"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-white" /> 提交支付交易 (TS MCP)
                </button>
              </div>
            ) : orderState.status === "paid" ? (
              <div className="space-y-3 bg-emerald-50 border border-emerald-200 p-4 rounded-xl text-center">
                <div className="flex items-center justify-center gap-2 text-emerald-800 font-bold text-sm">
                  <ShieldCheck className="w-5 h-5 text-emerald-600" /> 订单交易已圆满创建！
                </div>
                <div className="font-mono space-y-1 bg-white p-2.5 rounded border border-emerald-100 text-left text-xs">
                  <div><span className="text-slate-400">订单标号:</span> <span className="text-slate-800 font-bold font-mono">{orderState.id}</span></div>
                  <div><span className="text-slate-400">取餐编号:</span> <span className="text-emerald-700 font-black font-mono text-sm">{orderState.pickupCode}</span></div>
                  <div>
                    <span className="text-slate-400">取餐时段:</span>{" "}
                    <span className="text-slate-800 font-semibold">
                      {env.isDelivery ? `外卖派送中 (预计 ${env.weather === "rainy" ? "30" : "20"} 分钟内送达)` : "凭此编号到店自提柜取餐"}
                    </span>
                  </div>
                </div>

                {/* Deep link card */}
                {skillsActive.payment && (
                  <div className="bg-slate-900 rounded-lg p-2.5 text-left border border-slate-800">
                    <span className="text-[9px] font-bold text-blue-400 uppercase tracking-widest block mb-1">
                      📲 移动端唤醒跳转卡片 (业务层包装)
                    </span>
                    <button
                      onClick={() => setShowDeepLink(true)}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-bold py-1.5 px-2.5 rounded flex items-center justify-between transition cursor-pointer"
                      id="universal-pay-link-btn"
                    >
                      <span>使用手机 App 支付</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                    <span className="text-[8px] text-slate-400 block mt-1.5 leading-tight">
                      点击按钮将自动预填金额与商品，并支持调起您的 Apple Pay 快捷钱包支付。
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
