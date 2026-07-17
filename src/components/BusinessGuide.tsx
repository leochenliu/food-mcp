/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { BookOpen, Clock, CloudRain, Ticket, ShieldCheck, Sparkles, Send, Play, RefreshCw, Smartphone } from "lucide-react";
import { MenuItem, Environment } from "../types";
import { MENU_ITEMS } from "../data";

interface BusinessGuideProps {
  onApplyPreset: (preset: {
    env?: Partial<Environment>;
    itemsToCart?: { sku: string; quantity: number }[];
    couponCode?: string;
    chatText?: string;
    logMessage?: string;
  }) => void;
  isBreakfast: boolean;
  env: Environment;
}

export const BusinessGuide: React.FC<BusinessGuideProps> = ({ onApplyPreset, isBreakfast, env }) => {
  const [activeScenario, setActiveScenario] = useState<"breakfast" | "combo" | "loyalty" | "checkout">("breakfast");

  const scenarios = [
    {
      id: "breakfast",
      title: "早餐限定时段模拟 (Morning Breakfast)",
      icon: <Clock className="w-4 h-4 text-amber-500" />,
      tag: "菜单过滤与时间闸门",
      badgeColor: "bg-amber-50 text-amber-700 border-amber-200",
      description: "模拟麦当劳早餐菜单时段。当前时间必须早于上午 10:30，后厨铁板才会制作麦满分等早餐限定美食。如果时钟切到午餐时间，早餐商品会立即从菜单上移除并锁死加购权限。",
      steps: [
        "确认开启的规则：确保勾选了 “配送与自提推荐规则” 或 “促销与优惠券应用指南” 规则书。",
        "在右下角的 “运行环境模拟器” 中，将时间调为早晨时段（例如 08:30），或者直接点击下方的 “一键执行模拟”。",
        "观察左侧菜单，早餐商品（吉士蛋麦满分、脆薯饼、鲜煮咖啡）会自动解锁上架。",
        "在聊天区向 Mickey Agent 提问：'推荐一份早餐'，它将根据配置智能组装健康美味的早餐组合。"
      ],
      samplePrompt: "推荐一份早餐组合并帮我加购",
      presetAction: {
        env: { timeOfDay: "08:30" },
        itemsToCart: [
          { sku: "BRK_MCMUFFIN", quantity: 1 },
          { sku: "BRK_COFFEE", quantity: 1 }
        ],
        chatText: "请推荐一份温热的早餐组合并加入购物车！",
        logMessage: "正在执行早餐时段场景。时间调整为早晨 08:30，自动解锁后厨铁板早餐菜单。"
      }
    },
    {
      id: "combo",
      title: "雨天配送与组合折扣 (Rainy Delivery & Combo)",
      icon: <CloudRain className="w-4 h-4 text-blue-500" />,
      tag: "动态定价与多重返利",
      badgeColor: "bg-blue-50 text-blue-700 border-blue-200",
      description: "测试实时价格浮动算法。将汉堡、薯条和可乐同时加入购物车，会触发自动扣减的套餐组合优惠。同时，若将天气设为“雨天”并开启外送服务，智能大脑将智能调整配送费并推荐您安享外送。",
      steps: [
        "在规则管理器中确保开启了 “配送与自提推荐规则” 和 “经典套餐推荐与膳食助手” 规则。",
        "将环境设置为：开启外送、雨天、配送距离 2.5 公里。",
        "添加 经典巨无霸汉堡、经典薯条(大份) 和 可口可乐(中杯) 到购物车中。",
        "在结账小计栏中，系统将自动产生 $1.50 的 “经典黄金正餐组合优惠” 折扣。"
      ],
      samplePrompt: "我想点一个巨无霸套餐，雨天帮我配送吧",
      presetAction: {
        env: { weather: "rainy", isDelivery: true, distanceKm: 2.5, timeOfDay: "12:30" },
        itemsToCart: [
          { sku: "REG_BIGMAC", quantity: 1 },
          { sku: "REG_FRIES", quantity: 1 },
          { sku: "REG_COLA", quantity: 1 }
        ],
        chatText: "帮我点一个巨无霸套餐。外面下雨了，看看外送费用是多少？",
        logMessage: "正在执行雨天套餐配送场景。模拟外卖溢价公式及多商品套餐组合满减机制。"
      }
    },
    {
      id: "loyalty",
      title: "积分兑换与优惠券核销 (Loyalty & Coupons)",
      icon: <Ticket className="w-4 h-4 text-emerald-500" />,
      tag: "状态互斥与事务安全锁",
      badgeColor: "bg-emerald-50 text-emerald-700 border-emerald-200",
      description: "测试高安全级别的分布式状态核销。当会员积分大于等于 500 时，可兑换 0 元免费薯饼。与此同时，优惠券绑定将严格核验购物车单品类别及满减消费门槛，防范作弊篡改。",
      steps: [
        "在环境模拟器中，将用户积分增加到 600 分。",
        "观察结账小计区，会显示带有金色的 “免费薯饼 (500 积分兑换)” 按钮。",
        "您可以直接点击该按钮，或在聊天框中说：'帮我用积分换个脆薯饼'。",
        "查看下方 MCP 日志，观察 status 是否返回带有 ATOMIC 保护的积分扣减及商品上账流程。"
      ],
      samplePrompt: "使用汉堡8折优惠券，并用积分兑换一个脆薯饼",
      presetAction: {
        env: { userPoints: 650, timeOfDay: "09:00" },
        itemsToCart: [
          { sku: "BRK_SAUSAGE_EGG", quantity: 1 }
        ],
        couponCode: "MCD_BURGER_20",
        chatText: "我想把积分兑换成免费的脆薯饼，同时使用汉堡 8 折优惠券！",
        logMessage: "正在执行积分与卡券结合场景。积分设置为 650，并绑定 MCD_BURGER_20 优惠券代码。"
      }
    },
    {
      id: "checkout",
      title: "原子级锁定与支付跳转 (Checkout & Deep Link)",
      icon: <Smartphone className="w-4 h-4 text-purple-500" />,
      tag: "事务提交与移动端拉起",
      badgeColor: "bg-purple-50 text-purple-700 border-purple-200",
      description: "当客户点餐完成进入结算。第一阶段会『锁定交易』以防止 AI 在客户准备付款时更改总价；第二阶段向 MCP 提交真实订单并生成具有防伪校验的 order_id 订单号。最后，通过统一深层链接拉起移动支付钱包。",
      steps: [
        "购物车中有任意商品时，点击小计栏中的 “锁定订单并验证库存” 按钮。",
        "草稿状态变更为『锁定』。点击 “提交交易 (TS MCP)” 来向虚拟机提交状态修改。",
        "观察下方运行日志，可发现由后端生成的安全不可伪造的 order_id 唯一订单标识符。",
        "点击 “使用手机 App 支付” 唤醒深层链接支付弹窗，体验真实的移动一键付跳转。"
      ],
      samplePrompt: "我的订单完成了，帮我结账生成支付链接",
      presetAction: {
        env: { timeOfDay: "12:00" },
        itemsToCart: [
          { sku: "REG_BIGMAC", quantity: 2 }
        ],
        chatText: "订单完成了，请帮我锁定草稿并提交创建订单吧。",
        logMessage: "正在执行订单结算场景。正在将购物车封锁，准备进行安全的后台状态核销。"
      }
    }
  ];

  const current = scenarios.find(s => s.id === activeScenario) || scenarios[0];

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4" id="business-guide-container">
      {/* Header */}
      <div className="bg-slate-50 p-5 border-b border-slate-200 -mx-5 -mt-5 rounded-t-2xl flex items-center justify-between shrink-0">
        <div>
          <h3 className="font-display font-bold text-slate-800 text-sm tracking-tight flex items-center gap-2">
            <span>📋</span> 业务实操沙盘中心 (场景操作手册)
          </h3>
          <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-widest mt-0.5">交互式多场景融合模拟向导</p>
        </div>
        <span className="px-2 py-0.5 text-[10px] font-mono bg-blue-50 text-blue-700 border border-blue-200 rounded-md font-bold uppercase tracking-wider">
          Operations
        </span>
      </div>

      {/* Tabs */}
      <div className="grid grid-cols-4 gap-1.5 p-1 bg-slate-100 rounded-xl" id="guide-tabs">
        {scenarios.map((s) => (
          <button
            key={s.id}
            onClick={() => setActiveScenario(s.id as any)}
            className={`py-2 text-[10px] md:text-xs font-bold rounded-lg transition-all duration-150 flex flex-col items-center justify-center gap-1 cursor-pointer ${
              activeScenario === s.id
                ? "bg-white text-blue-600 shadow-sm border border-slate-200/50"
                : "text-slate-500 hover:text-slate-800 hover:bg-slate-50/50"
            }`}
            id={`tab-guide-${s.id}`}
          >
            {s.icon}
            <span className="hidden sm:inline">{s.title.split(" ")[0]}</span>
          </button>
        ))}
      </div>

      {/* Scenario Detail Frame */}
      <div className="bg-slate-50/55 rounded-xl border border-slate-100 p-4 space-y-3" id="guide-content-frame">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h4 className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
            {current.icon} {current.title}
          </h4>
          <span className={`px-2 py-0.5 text-[9px] font-mono border rounded-full font-bold ${current.badgeColor}`}>
            {current.tag}
          </span>
        </div>

        <p className="text-xs text-slate-600 leading-relaxed font-sans">
          {current.description}
        </p>

        {/* Step-by-Step checklist */}
        <div className="space-y-2 pt-1">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">操作指引：</span>
          <ol className="space-y-1.5 pl-4 list-decimal text-xs text-slate-600 leading-relaxed">
            {current.steps.map((step, idx) => (
              <li key={idx} className="marker:font-mono marker:font-bold marker:text-blue-500">
                {step}
              </li>
            ))}
          </ol>
        </div>

        {/* Action Button Strip */}
        <div className="pt-3 border-t border-slate-200/60 flex flex-col sm:flex-row gap-2 justify-between items-stretch sm:items-center">
          <div className="text-left">
            <span className="text-[9px] text-slate-400 font-bold block uppercase tracking-wider">推荐指令：</span>
            <code className="text-[10px] font-mono text-slate-700 bg-white border border-slate-200 px-1.5 py-0.5 rounded block max-w-xs truncate select-all mt-0.5" title="双击选择全部">
              "{current.samplePrompt}"
            </code>
          </div>

          <button
            onClick={() => onApplyPreset(current.presetAction)}
            className="bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-bold py-2 px-4 rounded-xl flex items-center justify-center gap-1.5 shadow-xs transition hover:shadow-md cursor-pointer shrink-0"
            id={`btn-apply-preset-${current.id}`}
          >
            <Play className="w-3.5 h-3.5 fill-white" /> 一键执行模拟
          </button>
        </div>
      </div>

      <div className="text-[10px] text-slate-500 bg-slate-50 p-3 rounded-xl border border-slate-200 leading-normal flex items-start gap-1.5">
        <Sparkles className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
        <p>
          <strong>自动流模拟：</strong> 点击 <strong>一键执行模拟</strong> 将自动改变当前状态模拟器的环境变量、一键加载商品到购物车并向 Mickey AI 发送场景对话。您可以亲眼见证 AI 大脑如何秒级执行决策并自动操作！
        </p>
      </div>
    </div>
  );
};
