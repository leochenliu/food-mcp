import { Coupon, MenuItem } from "./types";

// Menu catalog (real-time inventory for the MCP transaction server).
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
    value: 10.0,
    minSpend: 50.0
  },
  {
    id: "coupon_breakfast15",
    code: "MCD_BREAKFAST_15",
    name: "早餐早鸟特惠 85折",
    description: "任意早餐单品（SKU以 BRK_ 开头）享受 85 折优惠。仅在上午时段有效。",
    discountType: "percentage",
    value: 0.15,
    minSpend: 5.0,
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
    minSpend: 8.0
  }
];
