export type MenuItemCategory = "breakfast" | "regular";

export interface MenuItem {
  sku: string;
  name: string;
  category: MenuItemCategory;
  price: number;
  stock: number;
  description: string;
  image: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface Coupon {
  id: string;
  code: string;
  name: string;
  description: string;
  discountType: "fixed" | "percentage";
  value: number;
  minSpend: number;
  applicablePrefix?: string;
  categoryLimit?: string;
}

export type OrderStatus = "draft" | "locked" | "paid";

export interface CartItem {
  item: MenuItem;
  quantity: number;
}

export interface OrderState {
  items: CartItem[];
  isDelivery: boolean;
  appliedCoupon: Coupon | null;
  status: OrderStatus;
  id?: string;
  pickupCode?: string;
  subtotal: number;
  discount: number;
  bundleCredit: number;
  deliveryFee: number;
  tax: number;
  total: number;
}

export interface Environment {
  weather: "sunny" | "rainy";
  distanceKm: number;
  timeOfDay: string;
  userPoints: number;
  isDelivery: boolean;
}
