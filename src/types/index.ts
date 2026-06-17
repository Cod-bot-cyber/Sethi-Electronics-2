export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  originalPrice?: number; // For discount displays
  image: string;
  images?: string[]; // Multiple product images support
  category: string;
  stock: number;
  rating: number;
  salesCount: number;
  isFeatured?: boolean;
  createdAt: string;
  reviews?: Review[];
}

export interface Review {
  id: string;
  author: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  icon: string; // Lucide icon name
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  isAdmin: boolean;
  createdAt?: string;
  phoneNumber?: string;
  savedAddress?: ShippingAddress;
}

export interface ShippingAddress {
  fullName: string;
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  landmark?: string;
  contactPhone?: string;
}

export enum OrderStatus {
  PENDING_PAYMENT = 'Pending Payment',
  PAYMENT_SUBMITTED = 'Payment Submitted',
  UNDER_VERIFICATION = 'Under Verification',
  CONFIRMED = 'Confirmed',
  REJECTED = 'Rejected',
  SHIPPED = 'Shipped',
  DELIVERED = 'Delivered',
  CANCELLED = 'Cancelled',
}

export interface OrderItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
}

export interface Order {
  id: string;
  userId?: string | null;
  customerName: string;
  customerEmail: string;
  shippingAddress: ShippingAddress;
  items: OrderItem[];
  subtotal: number;
  shippingFee: number;
  tax: number;
  totalAmount: number;
  status: OrderStatus;
  paymentMethod: string;
  paymentId: string;
  createdAt: string;
  // New payment proof verification fields
  mobileNumber?: string;
  utr_number?: string;
  payment_screenshot_url?: string;
  payment_status?: string;
  verification_date?: string;
  verified_by?: string;
}

export interface SalesStat {
  date: string;
  revenue: number;
  orders: number;
}

export interface CategoryStat {
  category: string;
  value: number;
  revenue: number;
}

export interface Coupon {
  id: string;
  code: string;
  type: 'flat' | 'percent';
  value: number;
  minSpend: number;
  description: string;
  isActive: boolean;
  createdAt: string;
}

export interface CarouselSlide {
  id: string;
  badge: string;
  title: string;
  subtitle: string;
  description: string;
  price: string;
  originalPrice: string;
  code: string;
  image: string;
  iconName?: string; // e.g. 'Cpu' | 'Headphones' | 'Watch' | 'Tag'
  gradient?: string; // from-left to-right tailwind gradients
  accentColor?: string; // custom outline colors or badges
}

export interface PromoMessage {
  id: string;
  iconName?: string; // e.g. 'Gift' | 'Sparkles' | 'Truck' | 'Tag'
  highlightText: string;
  regularText: string;
  actionText?: string;
  codeToCopy?: string;
}
