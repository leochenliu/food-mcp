/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { MenuItem, CartItem } from "../types";
import { MENU_ITEMS } from "../data";
import { Plus, Minus, Info, Flame, Star } from "lucide-react";

interface MenuGridProps {
  isBreakfast: boolean;
  cart: CartItem[];
  onAddToCart: (item: MenuItem, quantity: number) => void;
  onRemoveFromCart: (sku: string) => void;
}

export const MenuGrid: React.FC<MenuGridProps> = ({ isBreakfast, cart, onAddToCart, onRemoveFromCart }) => {
  // Filter menu items based on active store hour
  const activeItems = MENU_ITEMS.filter(item => {
    if (isBreakfast) {
      return item.category === "breakfast";
    } else {
      return item.category === "regular";
    }
  });

  const getQuantityInCart = (sku: string): number => {
    const found = cart.find(ci => ci.item.sku === sku);
    return found ? found.quantity : 0;
  };

  return (
    <div className="space-y-4" id="menu-grid-container">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div>
          <h3 className="font-display font-semibold text-slate-800 text-lg">
            {isBreakfast ? "🌅 麦当劳晨光早餐 (上午 5:00 - 10:30)" : "🍔 麦当劳经典正餐 (上午 10:30 - 闭店)"}
          </h3>
          <p className="text-xs text-slate-400">
            {isBreakfast 
              ? "早餐铁板正在滚烫运作。新鲜麦满分、脆薯饼及 McCafé 鲜煮咖啡火热供应中。"
              : "经典午晚餐系列。巨无霸、麦辣鸡腿堡和麦乐鸡拼盘火热销售中。"}
          </p>
        </div>
        <span className="text-xs font-mono bg-blue-50 text-blue-700 px-2 py-0.5 rounded font-bold">
          MCP 商品目录
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {activeItems.map((item) => {
          const qty = getQuantityInCart(item.sku);
          const isOutOfStock = item.stock <= 0;

          return (
            <div
              key={item.sku}
              className={`bg-white rounded-2xl border border-slate-100 p-4 flex flex-col md:flex-row gap-4 shadow-sm hover:shadow-md transition-shadow duration-200 relative ${
                qty > 0 ? "ring-2 ring-blue-600/60 border-blue-600/30" : ""
              }`}
              id={`menu-card-${item.sku}`}
            >
              {/* Image & calories */}
              <div className="w-full md:w-28 h-28 shrink-0 rounded-xl overflow-hidden relative bg-slate-50 border border-slate-100">
                <img
                  src={item.image}
                  alt={item.name}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
                <span className="absolute bottom-1 right-1 bg-black/75 backdrop-blur-xs text-[9px] text-white font-semibold py-0.5 px-1.5 rounded flex items-center gap-0.5">
                  <Flame className="w-2.5 h-2.5 text-orange-400 fill-orange-400" /> {item.calories} 千卡
                </span>
              </div>

              {/* Text & interactive */}
              <div className="flex flex-col justify-between flex-1 space-y-2">
                <div>
                  <div className="flex justify-between items-start gap-1">
                    <h4 className="font-semibold text-slate-800 text-sm flex items-center gap-1">
                      {item.name}
                      {item.sku.includes("BIGMAC") && (
                        <Star className="w-3 h-3 fill-yellow-400 text-yellow-400 shrink-0" />
                      )}
                    </h4>
                    <span className="font-mono font-bold text-slate-900 text-sm shrink-0">
                      ${item.price.toFixed(2)}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 line-clamp-2 mt-0.5">{item.description}</p>
                </div>

                {/* Macro breakdown */}
                <div className="flex gap-2 text-[9px] font-semibold text-slate-500 bg-slate-50 p-1.5 rounded-lg border border-slate-100 font-mono">
                  <span>蛋白质: {item.protein}g</span>
                  <span className="text-slate-300">•</span>
                  <span>碳水: {item.carbs}g</span>
                  <span className="text-slate-300">•</span>
                  <span>脂肪: {item.fat}g</span>
                </div>

                {/* Inventory / Cart Actions */}
                <div className="flex justify-between items-center pt-1 border-t border-slate-50 mt-1">
                  <span className={`text-[10px] font-mono ${item.stock < 10 ? "text-amber-600 font-bold" : "text-slate-400"}`}>
                    后厨备货: 仅剩 {item.stock} 份
                  </span>

                  {qty > 0 ? (
                    <div className="flex items-center gap-2 bg-slate-100 rounded-lg p-1 border border-slate-200">
                      <button
                        onClick={() => onRemoveFromCart(item.sku)}
                        className="w-6 h-6 rounded-md hover:bg-white flex items-center justify-center text-slate-600 cursor-pointer transition shadow-xs"
                        id={`btn-minus-${item.sku}`}
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="font-mono font-bold text-slate-800 text-xs px-1.5">{qty}</span>
                      <button
                        onClick={() => onAddToCart(item, 1)}
                        disabled={item.stock <= qty}
                        className="w-6 h-6 rounded-md hover:bg-white flex items-center justify-center text-slate-600 cursor-pointer disabled:opacity-40 transition shadow-xs"
                        id={`btn-plus-more-${item.sku}`}
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => onAddToCart(item, 1)}
                      disabled={isOutOfStock}
                      className="bg-blue-600 hover:bg-blue-700 disabled:bg-slate-100 disabled:text-slate-400 text-white font-semibold text-xs py-1.5 px-3 rounded-lg flex items-center gap-1 cursor-pointer select-none transition shadow-xs hover:shadow-sm"
                      id={`btn-add-${item.sku}`}
                    >
                      <Plus className="w-3.5 h-3.5" /> 加入订单
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
