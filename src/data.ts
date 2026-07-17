/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { MenuItem, Coupon, AgentSkill } from "./types";

export const MENU_ITEMS: MenuItem[] = [
  // Breakfast category
  {
    sku: "BRK_MCMUFFIN",
    name: "吉士蛋麦满分",
    category: "breakfast",
    price: 4.50,
    stock: 25,
    description: "新鲜煎制的A级鸡蛋、香烤英式松饼，搭配美味的加拿大风味培根和融化的美式芝士。",
    image: "https://images.unsplash.com/photo-1525351484163-7529414344d8?w=300&auto=format&fit=crop&q=60",
    calories: 310,
    protein: 17,
    carbs: 30,
    fat: 13
  },
  {
    sku: "BRK_SAUSAGE_EGG",
    name: "猪肉满分堡加蛋",
    category: "breakfast",
    price: 5.20,
    stock: 18,
    description: "扒炉上滋滋作响的美味猪肉饼、新鲜煎制的A级鸡蛋，以及香浓融化的美式芝士，搭配温热香脆的英式松饼。",
    image: "https://images.unsplash.com/photo-1600891964599-f61ba0e24092?w=300&auto=format&fit=crop&q=60",
    calories: 480,
    protein: 21,
    carbs: 31,
    fat: 30
  },
  {
    sku: "BRK_HOTCAKES",
    name: "美式热香饼 (3片装)",
    category: "breakfast",
    price: 4.80,
    stock: 12,
    description: "三片金黄诱人的热香饼，搭配纯正黄油和香甜的枫糖风味糖浆。",
    image: "https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=300&auto=format&fit=crop&q=60",
    calories: 580,
    protein: 9,
    carbs: 101,
    fat: 15
  },
  {
    sku: "BRK_HASHBROWN",
    name: "脆薯饼",
    category: "breakfast",
    price: 1.90,
    stock: 45,
    description: "外脆里嫩的金黄碎土豆薯饼，炸至恰到好处的香脆口感。",
    image: "https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=300&auto=format&fit=crop&q=60",
    calories: 140,
    protein: 1,
    carbs: 18,
    fat: 8
  },
  {
    sku: "BRK_COFFEE",
    name: "McCafé 鲜煮咖啡 (热)",
    category: "breakfast",
    price: 1.80,
    stock: 80,
    description: "精选100%阿拉比卡咖啡豆精制而成，口感浓郁，每30分钟新鲜煮制。",
    image: "https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=300&auto=format&fit=crop&q=60",
    calories: 5,
    protein: 0,
    carbs: 1,
    fat: 0
  },

  // Regular category
  {
    sku: "REG_BIGMAC",
    name: "经典巨无霸汉堡",
    category: "regular",
    price: 6.20,
    stock: 35,
    description: "两块100%纯牛肉饼、秘制巨无霸酱汁、清脆切丝生菜、美式芝士、酸黄瓜和洋葱，搭配香烤芝麻面包。",
    image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=300&auto=format&fit=crop&q=60",
    calories: 590,
    protein: 25,
    carbs: 46,
    fat: 34
  },
  {
    sku: "REG_MCNUGGETS",
    name: "麦乐鸡 (10块装)",
    category: "regular",
    price: 5.80,
    stock: 30,
    description: "鲜嫩多汁的麦乐鸡，精选100%白羽鸡肉制成，无人工色素或防腐剂。",
    image: "https://images.unsplash.com/photo-1562967914-608f82629710?w=300&auto=format&fit=crop&q=60",
    calories: 410,
    protein: 23,
    carbs: 26,
    fat: 24
  },
  {
    sku: "REG_SPICY_CHICKEN",
    name: "麦辣鸡腿汉堡",
    category: "regular",
    price: 6.50,
    stock: 20,
    description: "选用大块多汁的脆炸鸡腿排，经独特辣味配方腌制，搭配新鲜生菜和香浓沙拉酱，美味过瘾。",
    image: "https://images.unsplash.com/photo-1625813506062-0aeb1d7a094b?w=300&auto=format&fit=crop&q=60",
    calories: 520,
    protein: 22,
    carbs: 48,
    fat: 27
  },
  {
    sku: "REG_FRIES",
    name: "经典薯条 (大份)",
    category: "regular",
    price: 3.50,
    stock: 65,
    description: "优质马铃薯切条，外表金黄香脆，内里绵软，撒上适量食盐，经典美味。",
    image: "https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=300&auto=format&fit=crop&q=60",
    calories: 480,
    protein: 6,
    carbs: 65,
    fat: 23
  },
  {
    sku: "REG_COLA",
    name: "可口可乐 (中杯)",
    category: "regular",
    price: 2.20,
    stock: 90,
    description: "冰凉爽口、气泡丰富的原味可口可乐，搭配碎冰，畅爽解渴。",
    image: "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=300&auto=format&fit=crop&q=60",
    calories: 210,
    protein: 0,
    carbs: 55,
    fat: 0
  },
  {
    sku: "REG_APPLE_PIE",
    name: "经典苹果派",
    category: "regular",
    price: 1.90,
    stock: 15,
    description: "香温的酥皮包裹着香甜、带有肉桂香气的苹果片，烘烤至金黄酥脆。",
    image: "https://images.unsplash.com/photo-1519869325930-281384150729?w=300&auto=format&fit=crop&q=60",
    calories: 230,
    protein: 2,
    carbs: 35,
    fat: 10
  }
];

export const INITIAL_COUPONS: Coupon[] = [
  {
    id: "coupon_mcd50",
    code: "MCD50",
    name: "超值家庭套卡满减",
    description: "订单实付满 $50.00 立减 $10.00！适合家庭与多人聚餐。",
    discountType: "fixed",
    value: 10.00,
    minSpend: 50.00
  },
  {
    id: "coupon_breakfast15",
    code: "MCD_BREAKFAST_15",
    name: "早餐早鸟特惠 85折",
    description: "任意早餐单品（SKU以 BRK_ 开头）享受 85 折优惠。仅在上午时段有效。",
    discountType: "percentage",
    value: 0.15,
    minSpend: 5.00,
    applicablePrefix: "BRK_",
    categoryLimit: "breakfast"
  },
  {
    id: "coupon_burger20",
    code: "MCD_BURGER_20",
    name: "汉堡狂欢 8折特惠",
    description: "所有汉堡单品（麦满分、猪肉堡、巨无霸、麦辣鸡腿堡）均可享受 8 折。无时间限制！",
    discountType: "percentage",
    value: 0.20,
    minSpend: 8.00
  }
];

export const INITIAL_SKILLS: AgentSkill[] = [
  {
    id: "skill_scenario",
    title: "配送与自提推荐规则",
    description: "根据天气、配送距离及价格计算公式，智能推荐外卖配送或到店自提。",
    category: "scenario",
    content: `### 配送决策矩阵：外卖配送 vs 到店自提

**业务目标**：根据环境变量（天气、门店距离、外送费公式）为客户推荐最佳的配送方式（配送 / 自提）。

**触发变量**：
- \`weather\`：当前天气（'sunny' 晴天 / 'rainy' 雨天）
- \`distanceKm\`：用户距离最近麦当劳门店的物理距离（公里）。

**业务硬性规则**：
1. **雨天推荐政策**：若天气为 \`rainy\`，务必推荐 **外卖配送**。文案应聚焦于“无需出门、温暖干燥”，并说明外卖骑手正全力服务中。
2. **长距离推荐政策**：若 \`distanceKm\` 大于 **1.5公里**，推荐使用 **外卖配送** 以节省通勤时间。
3. **晴天短距离推荐政策**：若天气为 \`sunny\` 且 \`distanceKm\` 小于等于 **1.5公里**，推荐 **到店自提**。可以宣传为是一次健康的阳光散步，还能省下外送费。
4. **外送费计算逻辑**：
   - 当距离 > 2.0 km 时，外送费为 **$4.50**。
   - 当距离 <= 2.0 km 时，外送费为 **$2.50**。
   - 到店自提的外送费永远为 **$0.00**。

**协同 MCP 服务端工具**：
- 评估完成后，告诉用户你将调用 \`set_delivery_scenario\` 工具（参数 \`{ isDelivery: true/false, surcharge: X.XX }\`）来自动更新他们当前的订单草稿。`
  },
  {
    id: "skill_promotion",
    title: "促销与优惠券应用指南",
    description: "规范早餐与正餐时段的适用范围、优惠券互斥逻辑及会员积分兑换细则。",
    category: "promotion",
    content: `### 促销策略与优惠券叠加使用政策

**业务目标**：分析用户购物车商品、已绑定的优惠券及会员积分余额，计算出最省钱的组合。

**严格的业务逻辑（Agent 在调用 MCP 前必须核对）**：
1. **早餐时段有效性**：
   - 早餐菜单仅在 **05:00 至 10:30** 之间处于激活状态。
   - 若当前时间晚于 **10:30 AM**，则早餐专享券（\`MCD_BREAKFAST_15\`）**严格失效**。如果用户在此时间后尝试添加早餐单品，需发出“早餐煎炉已关闭”的警示。
2. **优惠券互斥规则**：
   - 优惠券**不可叠加**使用（每个订单最多只能绑定一张优惠券）。
   - 系统需自动计算出最省钱的优惠券方案：
     - \`MCD50\`：小计金额满 $50.00 立减 $10.00。
     - \`MCD_BREAKFAST_15\`：仅限早餐类单品（SKU以 \`BRK_\` 开头）享受 85 折。
     - \`MCD_BURGER_20\`：所有汉堡类商品（吉士蛋麦满分、猪肉满分堡、巨无霸、麦辣鸡腿堡）享受 8 折。
3. **会员积分兑换奖励**：
   - 若用户积分达 **500分** 及以上，可申请兑换 **免费脆薯饼** 1个（\`BRK_HASHBROWN\`）。积分兑换属于独立奖励福利，**可与标准优惠券进行叠加**！

**协同 MCP 服务端工具**：
- 优先在后台进行最优价格的数学计算。
- 调用原子级 MCP 工具 \`bind_coupon(couponCode)\` 将优惠券绑定至当前交易订单。请勿尝试手动修改总价，一切交由 MCP 事务流计算。`
  },
  {
    id: "skill_pairing",
    title: "经典套餐推荐与膳食助手",
    description: "提供经典配餐组合加购优惠规则、早餐套餐推荐和营养成分查询服务。",
    category: "pairing",
    content: `### 套餐搭配指南与卡路里膳食助手

**业务目标**：根据购物车商品推荐专属套餐组合优惠（最高立减 $2.50），并结合卡路里与营养指标回答膳食健康咨询。

**套餐组合模板**：
1. **晨光麦满分组合**（组合ID：\`BUN_BREAKFAST\`）：
   - 触发条件：购物车中已包含麦满分汉堡。
   - 加购建议：推荐加购 脆薯饼（\`BRK_HASHBROWN\`）和 鲜煮咖啡（\`BRK_COFFEE\`）。
   - 优惠福利：此套餐组合将使上述三件商品的总价减少 **$2.50**（作为组合优惠直接扣减）！
2. **经典黄金正餐组合**（组合ID：\`BUN_LUNCH\`）：
   - 触发条件：购物车中已包含巨无霸汉堡或麦辣鸡腿堡。
   - 加购建议：推荐加购 经典薯条（\`REG_FRIES\`）和 中杯可乐（\`REG_COLA\`）。
   - 优惠福利：此套餐组合将使总价减少 **$1.50**（作为组合优惠直接扣减）！

**营养查询服务**：
- 当用户询问卡路里限制、高蛋白食物推荐或脂肪等宏量营养素指标时：
  - 调用 MCP 工具 \`list_nutrition\` 获取实时营养学档案。
  - 简洁明了地汇总各项指标（如：“您的晨光套餐共包含 455 卡路里热量和 18 克蛋白质”）。`
  },
  {
    id: "skill_payment",
    title: "安全交易与支付引导规范",
    description: "严格规范订单锁定、库存校验、生成安全跳转深层链接及格式化支付卡的流程。",
    category: "payment",
    content: `### 安全交易流程与万能 APP 支付链接引导

**业务目标**：在不直接获取用户敏感支付卡信息的情况下，生成高转化率的支付跳转深层链接与可视化向导，实现安全闭环。

**交易流程步骤**：
1. **锁定状态**：一旦用户提出“结账”、“去支付”或确认当前草稿，立即调用 MCP 工具 \`lock_order()\` 冻结订单价格并锁定门店库存。
2. **创建交易**：调用 MCP 工具 \`create_order()\` 生成唯一的最终订单 UUID，计算并确认税费。
3. **App 支付跳转**：将订单 ID 和总价封装成万能 App 深层链接支付卡：
   - 支付深层链接：\`mcdonalds://pay?orderId={ORDER_ID}&price={TOTAL}\`
   - 在聊天界面中呈现一个极其醒目的交互式按钮“使用手机 App 支付”。
4. **人性化指引**：
   - 告知用户点击此按钮即可调起麦当劳手机客户端，支持通过 Apple Pay、Google Pay 或绑定的信用卡一键支付。
   - 附带提供可复制的 **取餐码**（例如：\`MCD-9482\`）或外卖配送的**预计送达时间**（例如：25分钟）。

**安全硬性规范**：
- 严禁在聊天界面中生成收集信用卡卡号、过期时间、CVV 等敏感信息的模拟表单，这属于严重安全违规行为。必须充分信任并调用后台 MCP 交易链路。`
  }
];
