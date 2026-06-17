import React, { createContext, useContext, useState, useEffect } from 'react';
import { Product, Category, CartItem, UserProfile, Order, OrderStatus, ShippingAddress, Review, Coupon, CarouselSlide, PromoMessage } from '../types';
import { dbService } from '../lib/db';
import { INITIAL_CATEGORIES, INITIAL_PRODUCTS } from '../lib/seedData';
import { auth, isMockFirebase, googleProvider } from '../lib/firebase';
import { onAuthStateChanged, signInWithPopup, signOut, signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';

interface AppContextType {
  products: Product[];
  categories: Category[];
  cart: CartItem[];
  currentUser: UserProfile | null;
  orders: Order[];
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
  isAuthOpen: boolean;
  setIsAuthOpen: (open: boolean) => void;
  activeCategory: string;
  setActiveCategory: (cat: string) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  sortBy: string;
  setSortBy: (sort: string) => void;
  
  // Cart Actions
  addToCart: (product: Product, quantity?: number) => void;
  removeFromCart: (productId: string) => void;
  updateCartQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  cartTotal: number;
  cartCount: number;

  // Checkout Actions
  processCheckout: (
    address: ShippingAddress, 
    paymentDetails: { 
      paymentMethodType?: string; 
      upiId?: string; 
      mobileNumber?: string;
      utrNumber?: string;
      screenshotUrl?: string;
    }
  ) => Promise<Order>;

  // Auth Actions
  loginWithGoogle: () => Promise<void>;
  loginWithEmail: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signUpWithEmail: (email: string, password: string, displayName: string, mobileNumber?: string) => Promise<{ success: boolean; error?: string }>;
  updateProfileAddress: (address: ShippingAddress) => void;
  logout: () => Promise<void>;
  adminLogin: (email: string, passcode: string) => Promise<{ success: boolean; error?: string }>;

  // Review Actions
  addProductReview: (productId: string, rating: number, comment: string, authorName: string) => Promise<void>;

  // Coupon / Discount Code Actions
  activeCoupon: { code: string; discountPercent: number; flatAmount?: number } | null;
  applyCoupon: (code: string) => { success: boolean; discountAmount: number; message: string };
  clearCoupon: () => void;

  // New Dynamic Configurations
  coupons: Coupon[];
  carouselSlides: CarouselSlide[];
  promoMessages: PromoMessage[];
  
  saveCoupon: (coupon: Coupon) => Promise<void>;
  deleteCoupon: (id: string) => Promise<void>;
  resetCoupons: () => Promise<void>;

  saveCarouselSlide: (slide: CarouselSlide) => Promise<void>;
  deleteCarouselSlide: (id: string) => Promise<void>;
  resetCarouselSlides: () => Promise<void>;

  savePromoMessage: (message: PromoMessage) => Promise<void>;
  deletePromoMessage: (id: string) => Promise<void>;
  resetPromoMessages: () => Promise<void>;

  // Admin Actions
  addProduct: (product: Omit<Product, 'id' | 'createdAt' | 'salesCount' | 'rating'>) => Promise<void>;
  editProduct: (product: Product) => Promise<void>;
  deleteProduct: (productId: string) => Promise<void>;
  updateOrderStatus: (orderId: string, status: OrderStatus) => Promise<void>;
  resetInventory: () => Promise<void>;

  // Global Merchant Payment Configs
  merchantUpiVpa: string;
  customUpiQr: string | null;
  updateShopSettings: (vpa: string, qr: string | null) => Promise<void>;
  isLoading: boolean;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [products, rawSetProducts] = useState<Product[]>(() => {
    try {
      const local = localStorage.getItem('products');
      if (local) {
        const parsed = JSON.parse(local);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const seen = new Set<string>();
          return parsed.filter((p: any) => {
            if (!p || !p.id || seen.has(p.id)) return false;
            seen.add(p.id);
            return true;
          });
        }
      }
    } catch (e) {
      console.warn('Failed parsing local products on state init:', e);
    }
    return INITIAL_PRODUCTS;
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const setProducts = React.useCallback((prods: Product[] | ((prev: Product[]) => Product[])) => {
    rawSetProducts(prev => {
      const next = typeof prods === 'function' ? prods(prev) : prods;
      console.log('[DEBUG_LOG] setProducts called with:', next);
      if (!next || !Array.isArray(next) || next.length === 0) {
        console.warn('[DEBUG_LOG] setProducts received empty arrays, falling back to INITIAL_PRODUCTS.');
        return INITIAL_PRODUCTS;
      }
      const seen = new Set<string>();
      const deduplicated = next.filter(p => {
        if (!p || !p.id) return false;
        if (seen.has(p.id)) return false;
        seen.add(p.id);
        return true;
      });
      if (deduplicated.length === 0) {
        console.warn('[DEBUG_LOG] setProducts deduplicated to empty, returning INITIAL_PRODUCTS.');
        return INITIAL_PRODUCTS;
      }
      return deduplicated;
    });
  }, []);

  const [categories] = useState<Category[]>(INITIAL_CATEGORIES);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);

  const [orders, rawSetOrders] = useState<Order[]>([]);
  const setOrders = React.useCallback((ords: Order[] | ((prev: Order[]) => Order[])) => {
    rawSetOrders(prev => {
      const next = typeof ords === 'function' ? ords(prev) : ords;
      const seen = new Set<string>();
      return next.filter(o => {
        if (!o || !o.id || seen.has(o.id)) return false;
        seen.add(o.id);
        return true;
      });
    });
  }, []);
  const [activeCoupon, setActiveCoupon] = useState<{ code: string; discountPercent: number; flatAmount?: number } | null>(null);
  
  // New States
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [carouselSlides, setCarouselSlides] = useState<CarouselSlide[]>([]);
  const [promoMessages, setPromoMessages] = useState<PromoMessage[]>([]);
  
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [pendingCartItem, setPendingCartItem] = useState<{ product: Product, quantity: number } | null>(null);
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('featured');

  const [merchantUpiVpa, setMerchantUpiVpa] = useState<string>(() => localStorage.getItem('custom_upi_vpa') || 'hardikimpwork@gmail.com');
  const [customUpiQr, setCustomUpiQr] = useState<string | null>(() => localStorage.getItem('custom_upi_qr'));

  const updateShopSettings = async (vpa: string, qr: string | null) => {
    setMerchantUpiVpa(vpa);
    setCustomUpiQr(qr);
    localStorage.setItem('custom_upi_vpa', vpa);
    if (qr) {
      localStorage.setItem('custom_upi_qr', qr);
    } else {
      localStorage.removeItem('custom_upi_qr');
    }
    await dbService.saveShopSettings({ customUpiVpa: vpa, customUpiQr: qr });
  };

  // Load initial catalog & order data
  useEffect(() => {
    let active = true;
    const loadData = async () => {
      try {
        setIsLoading(true);
        const fetchedProducts = await dbService.getProducts();
        const fetchedOrders = await dbService.getOrders();
        const settings = await dbService.getShopSettings();
        const fetchedCoupons = await dbService.getCoupons();
        const fetchedSlides = await dbService.getCarouselSlides();
        const fetchedPromoMessages = await dbService.getPromoMessages();
        if (active) {
          setProducts(fetchedProducts);
          setOrders(fetchedOrders);
          setCoupons(fetchedCoupons);
          setCarouselSlides(fetchedSlides);
          setPromoMessages(fetchedPromoMessages);
          if (settings) {
            setMerchantUpiVpa(settings.customUpiVpa);
            setCustomUpiQr(settings.customUpiQr);
            localStorage.setItem('custom_upi_vpa', settings.customUpiVpa);
            if (settings.customUpiQr) {
              localStorage.setItem('custom_upi_qr', settings.customUpiQr);
            } else {
              localStorage.removeItem('custom_upi_qr');
            }
          }
        }
      } catch (err) {
        console.error('Failed to load products/orders/settings from database.', err);
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    };
    loadData();
    return () => { active = false; };
  }, []);

  // Listen to Auth State Changes and Restore Sessions
  useEffect(() => {
    const savedUser = localStorage.getItem('mock_user');
    if (savedUser) {
      try {
        setCurrentUser(JSON.parse(savedUser));
      } catch (err) {
        setCurrentUser(null);
      }
    } else {
      setCurrentUser(null);
    }
  }, []);

  // Sync cart with localStorage with duplicate prevention
  useEffect(() => {
    const savedCart = localStorage.getItem('ecom_cart');
    if (savedCart) {
      try {
        const parsed = JSON.parse(savedCart) as CartItem[];
        const seen = new Set<string>();
        const deduplicated = parsed.filter(item => {
          if (!item || !item.product || !item.product.id || seen.has(item.product.id)) {
            return false;
          }
          seen.add(item.product.id);
          return true;
        });
        setCart(deduplicated);
      } catch (e) {
        setCart([]);
      }
    }
  }, []);

  const saveCartToStorage = (updatedCart: CartItem[]) => {
    const seen = new Set<string>();
    const deduplicated = updatedCart.filter(item => {
      if (!item || !item.product || !item.product.id || seen.has(item.product.id)) {
        return false;
      }
      seen.add(item.product.id);
      return true;
    });
    setCart(deduplicated);
    localStorage.setItem('ecom_cart', JSON.stringify(deduplicated));
  };

  // Automatically add pending item to cart once logged in successfully
  useEffect(() => {
    if (currentUser && pendingCartItem) {
      const { product, quantity } = pendingCartItem;
      // Clear pending state first, then call addToCart
      setPendingCartItem(null);
      addToCart(product, quantity);
    }
  }, [currentUser, pendingCartItem]);

  // --- CART OPERATIONS ---
  const addToCart = (product: Product, quantity = 1) => {
    if (!currentUser) {
      setPendingCartItem({ product, quantity });
      setIsAuthOpen(true);
      return;
    }
    const existing = cart.find(item => item.product.id === product.id);
    let updated: CartItem[];
    if (existing) {
      updated = cart.map(item =>
        item.product.id === product.id
          ? { ...item, quantity: Math.min(item.quantity + quantity, product.stock) }
          : item
      );
    } else {
      updated = [...cart, { product, quantity: Math.min(quantity, product.stock) }];
    }
    saveCartToStorage(updated);
    setIsCartOpen(true);
  };

  const removeFromCart = (productId: string) => {
    const updated = cart.filter(item => item.product.id !== productId);
    saveCartToStorage(updated);
  };

  const updateCartQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    const updated = cart.map(item =>
      item.product.id === productId
        ? { ...item, quantity: Math.min(quantity, item.product.stock) }
        : item
    );
    saveCartToStorage(updated);
  };

  const clearCart = () => {
    saveCartToStorage([]);
  };

  const cartTotal = cart.reduce((acc, item) => acc + (item.product.price * item.quantity), 0);
  const cartCount = cart.reduce((acc, item) => acc + item.quantity, 0);

  // --- CHECKOUT & TRANSACTION SECURE PROCESSING ---
  const processCheckout = async (
    shippingAddress: ShippingAddress, 
    paymentDetails: { 
      paymentMethodType?: string; 
      upiId?: string; 
      mobileNumber?: string;
      utrNumber?: string;
      screenshotUrl?: string;
    }
  ): Promise<Order> => {
    // 1. Double check stock levels
    const currentInventory = await dbService.getProducts();
    for (const item of cart) {
      const invProd = currentInventory.find(p => p.id === item.product.id);
      if (!invProd || invProd.stock < item.quantity) {
        throw new Error(`Transaction failed. '${item.product.name}' is currently out of stock or has limited inventory.`);
      }
    }

    const methodString = 'UPI';
    const orderId = `ord-${Math.floor(100000 + Math.random() * 900000)}`;

    const discountAmount = activeCoupon 
      ? (activeCoupon.flatAmount !== undefined 
          ? Math.min(cartTotal, activeCoupon.flatAmount) 
          : parseFloat((cartTotal * (activeCoupon.discountPercent / 100)).toFixed(2))) 
      : 0;
    const subtotal = cartTotal;
    const discountedSubtotal = Math.max(0, cartTotal - discountAmount);
    const shippingFee = discountedSubtotal >= 500 ? 0 : 39.00;
    const tax = 0;
    const totalAmount = parseFloat((discountedSubtotal + shippingFee + tax).toFixed(2));

    // Initially order is registered as PAYMENT_SUBMITTED status
    const orderStatus = OrderStatus.PAYMENT_SUBMITTED;

    const newOrder: Order = {
      id: orderId,
      userId: currentUser?.uid || 'guest-user',
      customerName: shippingAddress.fullName,
      customerEmail: currentUser?.email || 'guest@anonymous.com',
      shippingAddress,
      items: cart.map(item => ({
        id: item.product.id,
        name: item.product.name,
        price: item.product.price,
        quantity: item.quantity,
        image: item.product.image
      })),
      subtotal,
      shippingFee,
      tax,
      totalAmount,
      status: orderStatus,
      paymentMethod: methodString,
      paymentId: paymentDetails.utrNumber || `txn_${Math.random().toString(36).substring(2, 11).toUpperCase()}`,
      createdAt: new Date().toISOString(),
      mobileNumber: paymentDetails.mobileNumber,
      utr_number: paymentDetails.utrNumber,
      payment_screenshot_url: paymentDetails.screenshotUrl,
      payment_status: 'Submitted'
    };

    // Commit order & update stock to DB
    await dbService.createOrder(newOrder);
    
    // Refresh states
    const updatedProducts = await dbService.getProducts();
    const updatedOrders = await dbService.getOrders();
    setProducts(updatedProducts);
    setOrders(updatedOrders);
    
    clearCart();

    // Automatically transition to "Under Verification" after order registration
    setTimeout(async () => {
      try {
        await dbService.updateOrderStatus(orderId, OrderStatus.UNDER_VERIFICATION);
        const refetchedOrders = await dbService.getOrders();
        setOrders(refetchedOrders);
      } catch (err) {
        console.error('Error auto-updating order status to Under Verification:', err);
      }
    }, 2000);

    return newOrder;
  };

  // --- AUTH ACTIONS ---
  const loginWithGoogle = async () => {
    if (isMockFirebase || !auth) {
      const mockProfile: UserProfile = {
        uid: 'google-user-uid',
        email: 'customer@google.com',
        displayName: 'Google Customer',
        isAdmin: false,
      };
      setCurrentUser(mockProfile);
      localStorage.setItem('mock_user', JSON.stringify(mockProfile));
      return;
    }

    try {
      const result = await signInWithPopup(auth, googleProvider);
      const firebaseUser = result.user;
      const userProfile: UserProfile = {
        uid: firebaseUser.uid,
        email: firebaseUser.email || '',
        displayName: firebaseUser.displayName || 'Customer',
        isAdmin: false, // Standard Google Logins are customer only
      };
      setCurrentUser(userProfile);
    } catch (err) {
      console.error('Error logging in with Google', err);
    }
  };

  const loginWithEmail = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      });

      let data: any;
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        const text = await response.text();
        console.error('Non-JSON response from server during login:', text);
        return { success: false, error: `Handshake breakdown: Server responded with status ${response.status}.` };
      }

      if (!response.ok) {
        return { success: false, error: data.error || 'Authentication rejected.' };
      }

      if (data.token && data.user) {
        localStorage.setItem('presidio_jwt_token', data.token);
        localStorage.setItem('mock_user', JSON.stringify(data.user));
        setCurrentUser(data.user);
        return { success: true };
      }

      return { success: false, error: 'Database handshake compromise: No token sequence established.' };
    } catch (err: any) {
      console.error('Email signin request error details:', err);
      return { success: false, error: `Secure authorization network is unreachable: ${err.message || 'Connection failure'}` };
    }
  };

  const signUpWithEmail = async (email: string, password: string, displayName: string, mobileNumber?: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          name: displayName, 
          email, 
          mobileNumber: mobileNumber || '', 
          password 
        })
      });

      let data: any;
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        const text = await response.text();
        console.error('Non-JSON response from server during registration:', text);
        return { success: false, error: `Handshake breakdown: Server responded with status ${response.status}.` };
      }

      if (!response.ok) {
        return { success: false, error: data.error || 'Account registration failed.' };
      }

      return { success: true };
    } catch (err: any) {
      console.error('Email signup request error details:', err);
      return { success: false, error: `Registration network is offline: ${err.message || 'Connection failure'}` };
    }
  };

  const logout = async () => {
    setCurrentUser(null);
    localStorage.removeItem('mock_user');
    localStorage.removeItem('presidio_jwt_token');
  };

  const updateProfileAddress = (address: ShippingAddress) => {
    if (!currentUser) return;
    const updatedUser: UserProfile = {
      ...currentUser,
      savedAddress: address
    };
    setCurrentUser(updatedUser);
    localStorage.setItem('mock_user', JSON.stringify(updatedUser));
  };

  // Secure Administrative login checker with absolute hardcoded credentials
  const adminLogin = async (email: string, passcode: string) => {
    const cleanEmail = email.trim().toLowerCase();
    const cleanPass = passcode.trim();

    if (cleanEmail === 'admin@presidiostore.com' && cleanPass === 'AdminSecretPass2026!') {
      const adminProfile: UserProfile = {
        uid: 'system-admin-uid-secure',
        email: 'admin@presidiostore.com',
        displayName: 'Hardik (Admin)',
        isAdmin: true,
      };
      setCurrentUser(adminProfile);
      localStorage.setItem('mock_user', JSON.stringify(adminProfile));
      return { success: true };
    }
    return { success: false, error: 'Authorization Refused: Invalid admin coordinates or credentials.' };
  };

  // --- REVIEW ENGINE CONTROLLERS ---
  const addProductReview = async (productId: string, rating: number, comment: string, authorName: string) => {
    const updatedProducts = products.map(p => {
      if (p.id === productId) {
        const newReview: Review = {
          id: 'rev-' + Math.random().toString(36).substring(2, 9).toUpperCase(),
          author: authorName,
          rating,
          comment,
          createdAt: new Date().toISOString()
        };
        const rList = p.reviews || [];
        const combined = [...rList, newReview];
        const avg = combined.reduce((sum, r) => sum + r.rating, 0) / combined.length;
        
        const finalProd = {
          ...p,
          reviews: combined,
          rating: parseFloat(avg.toFixed(1))
        };
        dbService.saveProduct(finalProd);
        return finalProd;
      }
      return p;
    });
    setProducts(updatedProducts);
  };

  // --- COUPON/PROMOTION ENGINE CONTROLLERS ---
  const applyCoupon = (code: string) => {
    const uppercaseCode = code.trim().toUpperCase();
    const coupon = coupons.find(c => c.code.toUpperCase() === uppercaseCode && c.isActive);
    if (coupon) {
      if (cartTotal < coupon.minSpend) {
        return { success: false, discountAmount: 0, message: `Minimum cart value of ₹${coupon.minSpend} required.` };
      }
      if (coupon.type === 'flat') {
        const discount = Math.min(cartTotal, coupon.value);
        setActiveCoupon({ code: uppercaseCode, discountPercent: 0, flatAmount: coupon.value });
        return { success: true, discountAmount: discount, message: `Promo Code ${uppercaseCode} applied! ₹${coupon.value} Off saved.` };
      } else {
        const discount = parseFloat((cartTotal * (coupon.value / 100)).toFixed(2));
        setActiveCoupon({ code: uppercaseCode, discountPercent: coupon.value });
        return { success: true, discountAmount: discount, message: `Promo Code ${uppercaseCode} applied! ${coupon.value}% Off saved.` };
      }
    }
    return { success: false, discountAmount: 0, message: 'Coupon code is invalid or expired.' };
  };

  const clearCoupon = () => {
    setActiveCoupon(null);
  };

  // --- NEW CRUD UTILITIES FOR PROMOTIONS ---
  const saveCoupon = async (coupon: Coupon) => {
    await dbService.saveCoupon(coupon);
    const updated = await dbService.getCoupons();
    setCoupons(updated);
  };

  const deleteCoupon = async (id: string) => {
    await dbService.deleteCoupon(id);
    const updated = await dbService.getCoupons();
    setCoupons(updated);
  };

  const resetCoupons = async () => {
    const updated = await dbService.resetCoupons();
    setCoupons(updated);
  };

  const saveCarouselSlide = async (slide: CarouselSlide) => {
    await dbService.saveCarouselSlide(slide);
    const updated = await dbService.getCarouselSlides();
    setCarouselSlides(updated);
  };

  const deleteCarouselSlide = async (id: string) => {
    await dbService.deleteCarouselSlide(id);
    const updated = await dbService.getCarouselSlides();
    setCarouselSlides(updated);
  };

  const resetCarouselSlides = async () => {
    const updated = await dbService.resetCarouselSlides();
    setCarouselSlides(updated);
  };

  const savePromoMessage = async (msg: PromoMessage) => {
    await dbService.savePromoMessage(msg);
    const updated = await dbService.getPromoMessages();
    setPromoMessages(updated);
  };

  const deletePromoMessage = async (id: string) => {
    await dbService.deletePromoMessage(id);
    const updated = await dbService.getPromoMessages();
    setPromoMessages(updated);
  };

  const resetPromoMessages = async () => {
    const updated = await dbService.resetPromoMessages();
    setPromoMessages(updated);
  };

  // --- ADMIN INVENTORY ACTIONS ---
  const addProduct = async (prodData: Omit<Product, 'id' | 'createdAt' | 'salesCount' | 'rating'>) => {
    const newProduct: Product = {
      ...prodData,
      id: `prod-${Math.floor(100 + Math.random() * 900)}`,
      salesCount: 0,
      rating: 4.5,
      createdAt: new Date().toISOString()
    };
    
    await dbService.saveProduct(newProduct);
    const updated = await dbService.getProducts();
    setProducts(updated);
  };

  const editProduct = async (product: Product) => {
    await dbService.saveProduct(product);
    const updated = await dbService.getProducts();
    setProducts(updated);
  };

  const deleteProduct = async (productId: string) => {
    await dbService.deleteProduct(productId);
    const updated = await dbService.getProducts();
    setProducts(updated);
  };

  const updateOrderStatus = async (orderId: string, status: OrderStatus) => {
    await dbService.updateOrderStatus(orderId, status);
    const updated = await dbService.getOrders();
    setOrders(updated);
  };

  const resetInventory = async () => {
    const defaultProducts = await dbService.resetProducts();
    setProducts(defaultProducts);
  };

  return (
    <AppContext.Provider value={{
      products,
      categories,
      cart,
      currentUser,
      orders,
      isCartOpen,
      setIsCartOpen,
      isAuthOpen,
      setIsAuthOpen,
      activeCategory,
      setActiveCategory,
      searchQuery,
      setSearchQuery,
      sortBy,
      setSortBy,
      addToCart,
      removeFromCart,
      updateCartQuantity,
      clearCart,
      cartTotal,
      cartCount,
      processCheckout,
      loginWithGoogle,
      loginWithEmail,
      signUpWithEmail,
      updateProfileAddress,
      logout,
      adminLogin,
      addProductReview,
      activeCoupon,
      applyCoupon,
      clearCoupon,
      
      // Dynamic lists
      coupons,
      carouselSlides,
      promoMessages,
      
      // Modifiers
      saveCoupon,
      deleteCoupon,
      resetCoupons,
      saveCarouselSlide,
      deleteCarouselSlide,
      resetCarouselSlides,
      savePromoMessage,
      deletePromoMessage,
      resetPromoMessages,

      addProduct,
      editProduct,
      deleteProduct,
      updateOrderStatus,
      resetInventory,
      merchantUpiVpa,
      customUpiQr,
      updateShopSettings,
      isLoading,
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
