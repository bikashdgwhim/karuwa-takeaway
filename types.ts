export interface MenuItem {
  id: string;
  categoryId: string;
  name: string;
  description: string;
  price: number;
  image?: string;
  isVegetarian?: boolean;
  isVegan?: boolean;
  isSpicy?: boolean;
  spiceLevel?: number; // 0=None, 1=Mild, 2=Medium, 3=Hot, 4=Very Hot
  allergens?: string[];
  isPopular?: boolean;
}

export interface Category {
  id: string;
  name: string;
  order: number;
}

export interface CartItem extends MenuItem {
  quantity: number;
  notes?: string;
}

export type OrderStatus = 'pending' | 'preparing' | 'ready' | 'delivered' | 'cancelled';

export interface Order {
  id: string;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  items: CartItem[];
  total: number;
  status: OrderStatus;
  createdAt: string; // ISO String
}

export interface SiteSettings {
  id?: string; // singleton, usually 'default'
  headerTitle: string;
  headerLogo?: string;
  heroImage?: string;
  heroHeadline: string;
  heroSubheadline: string;
  chefPhoto?: string;
  chefName?: string;
  chefPosition?: string;
  openingHours?: string;
  footerAddress: string;
  footerPhone: string;
  footerEmail: string;
  copyrightText?: string;
}

export interface PromoCode {
  id?: number;
  code: string;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  min_order: number;
  max_uses: number | null;
  uses: number;
  active: boolean;
  created_at?: string;
}

export interface StoreData {
  categories: Category[];
  menuItems: MenuItem[];
  orders: Order[];
  settings?: SiteSettings;
}