import { 
  collection, 
  getDocs, 
  doc, 
  setDoc, 
  deleteDoc, 
  updateDoc,
  getDoc,
  query, 
  orderBy 
} from 'firebase/firestore';
import { db, isMockFirebase, handleFirestoreError, OperationType } from './firebase';
import { Product, Order, OrderStatus, Coupon, CarouselSlide, PromoMessage } from '../types';
import { INITIAL_PRODUCTS } from './seedData';

const PRODUCTS_COLLECTION = 'products';
const ORDERS_COLLECTION = 'orders';
const COUPONS_COLLECTION = 'coupons';
const CAROUSEL_COLLECTION = 'carousel';
const BANNERS_COLLECTION = 'banners';

const DEFAULT_COUPONS: Coupon[] = [];

const DEFAULT_CAROUSEL_SLIDES: CarouselSlide[] = [];

const DEFAULT_PROMO_MESSAGES: PromoMessage[] = [];

// Helper to get local data if in mock mode
const getLocalData = <T>(key: string, defaultData: T): T => {
  try {
    const data = localStorage.getItem(key);
    if (!data) return defaultData;
    const parsed = JSON.parse(data);
    if (parsed === null || parsed === undefined) {
      return defaultData;
    }
    return parsed as T;
  } catch {
    return defaultData;
  }
};

const setLocalData = <T>(key: string, data: T): void => {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (err) {
    console.error('Error writing to localStorage', err);
  }
};

/**
 * DB Adapter Layer
 */
export const dbService = {
  // --- PRODUCTS CONTROLLER ---
  async getProducts(): Promise<Product[]> {
    if (isMockFirebase || !db) {
      const local = getLocalData<Product[]>(PRODUCTS_COLLECTION, []);
      return local || [];
    }

    try {
      const q = query(collection(db, PRODUCTS_COLLECTION));
      const snapshot = await getDocs(q);
      const products: Product[] = [];
      snapshot.forEach((docSnap) => {
        const d = docSnap.data();
        if (d) {
          products.push({ id: docSnap.id, ...d } as Product);
        }
      });
      
      // Seed local storage with the fetched products
      setLocalData(PRODUCTS_COLLECTION, products);
      return products;
    } catch (error) {
      console.warn('Firestore products load failed, falling back to secure in-browser storage:', error);
      const local = getLocalData<Product[]>(PRODUCTS_COLLECTION, []);
      return local || [];
    }
  },

  async resetProducts(): Promise<Product[]> {
    // Always clear/reset local storage first
    setLocalData(PRODUCTS_COLLECTION, INITIAL_PRODUCTS);

    if (isMockFirebase || !db) {
      return INITIAL_PRODUCTS;
    }

    try {
      const q = query(collection(db, PRODUCTS_COLLECTION));
      const snapshot = await getDocs(q);
      for (const docSnap of snapshot.docs) {
        try {
          await deleteDoc(doc(db, PRODUCTS_COLLECTION, docSnap.id));
        } catch (e) {
          console.warn(`Could not deleteDoc on live db for product ${docSnap.id}:`, e);
        }
      }
      for (const prod of INITIAL_PRODUCTS) {
        try {
          await setDoc(doc(db, PRODUCTS_COLLECTION, prod.id), prod);
        } catch (e) {
          console.warn(`Could not setDoc on live db for product ${prod.id}:`, e);
        }
      }
      return INITIAL_PRODUCTS;
    } catch (error) {
      console.warn('Firestore products reset failed, using secure local reset fallback:', error);
      return INITIAL_PRODUCTS;
    }
  },

  async saveProduct(product: Product): Promise<void> {
    // Keep local storage updated
    const products = await this.getProducts();
    const existingIdx = products.findIndex(p => p.id === product.id);
    if (existingIdx > -1) {
      products[existingIdx] = product;
    } else {
      products.push(product);
    }
    setLocalData(PRODUCTS_COLLECTION, products);

    if (isMockFirebase || !db) {
      return;
    }

    try {
      const docRef = doc(db, PRODUCTS_COLLECTION, product.id);
      await setDoc(docRef, product);
    } catch (error) {
      console.warn('Firestore product write failed:', error);
    }
  },

  async deleteProduct(productId: string): Promise<void> {
    // Keep local storage updated
    const products = await this.getProducts();
    const filtered = products.filter(p => p.id !== productId);
    setLocalData(PRODUCTS_COLLECTION, filtered);

    if (isMockFirebase || !db) {
      return;
    }

    try {
      const docRef = doc(db, PRODUCTS_COLLECTION, productId);
      await deleteDoc(docRef);
    } catch (error) {
      console.warn('Firestore product delete failed:', error);
    }
  },

  // --- ORDERS CONTROLLER ---
  async getOrders(): Promise<Order[]> {
    const localOrders = getLocalData<Order[]>(ORDERS_COLLECTION, []);

    if (isMockFirebase || !db) {
      return localOrders;
    }

    try {
      const q = query(collection(db, ORDERS_COLLECTION));
      const snapshot = await getDocs(q);
      const firestoreOrders: Order[] = [];
      snapshot.forEach((doc) => {
        firestoreOrders.push({ id: doc.id, ...doc.data() } as Order);
      });

      // Merge: For every order returned from Firestore, map it.
      // If it exists in localOrders, merge its status and properties from the local cache.
      const mergedOrders = firestoreOrders.map(fo => {
        const localCopy = localOrders.find(lo => lo.id === fo.id);
        if (localCopy) {
          return { ...fo, ...localCopy };
        }
        return fo;
      });

      // Append any orders in localOrders that are not present in Firestore (e.g., client-only/offline creations)
      const firestoreIds = new Set(firestoreOrders.map(fo => fo.id));
      const onlyLocal = localOrders.filter(lo => !firestoreIds.has(lo.id));

      const allOrders = [...mergedOrders, ...onlyLocal];
      return allOrders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } catch (error) {
      console.warn('Firestore orders fetch failed, falling back to local history:', error);
      return localOrders;
    }
  },

  async createOrder(order: Order): Promise<void> {
    // 1. Deduct inventory first (stock audit)
    const products = await this.getProducts();
    for (const item of order.items) {
      const prod = products.find(p => p.id === item.id);
      if (prod) {
        if (prod.stock < item.quantity) {
          throw new Error(`Insufficient stock for ${prod.name}. Available: ${prod.stock}`);
        }
        prod.stock -= item.quantity;
        prod.salesCount += item.quantity;
        await this.saveProduct(prod);
      }
    }

    // 2. Save order
    if (isMockFirebase || !db) {
      const orders = await this.getOrders();
      orders.unshift(order);
      setLocalData(ORDERS_COLLECTION, orders);
      return;
    }

    try {
      const docRef = doc(db, ORDERS_COLLECTION, order.id);
      await setDoc(docRef, order);
    } catch (error) {
      console.warn('Firestore order create failed, saving to local history:', error);
      const orders = await this.getOrders();
      orders.unshift(order);
      setLocalData(ORDERS_COLLECTION, orders);
    }
  },

  async updateOrderStatus(orderId: string, status: OrderStatus): Promise<void> {
    // 1. Always update local storage cache immediately so user changes are persistently saved
    const orders = await this.getOrders();
    const existingIdx = orders.findIndex(o => o.id === orderId);
    if (existingIdx > -1) {
      orders[existingIdx].status = status;
      setLocalData(ORDERS_COLLECTION, orders);
    }

    // 2. If using mock Firebase, we are already done.
    if (isMockFirebase || !db) {
      return;
    }

    // 3. Otherwise try writing to Firestore
    try {
      const docRef = doc(db, ORDERS_COLLECTION, orderId);
      await updateDoc(docRef, { status });
    } catch (error) {
      console.warn('Firestore order status update failed, local cache preserved:', error);
    }
  },

  // --- CONFIG / SHOP SETTINGS CONTROLLER ---
  async getShopSettings(): Promise<{ customUpiVpa: string; customUpiQr: string | null }> {
    const defaultSettings = {
      customUpiVpa: 'hardikimpwork@gmail.com',
      customUpiQr: null as string | null
    };

    if (isMockFirebase || !db) {
      return getLocalData('shop_settings', defaultSettings);
    }

    try {
      const docRef = doc(db, 'settings', 'shop');
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        return {
          customUpiVpa: data.customUpiVpa || defaultSettings.customUpiVpa,
          customUpiQr: data.customUpiQr || null
        };
      }
      return defaultSettings;
    } catch (error) {
      console.warn('Firestore getShopSettings failed, using local fallback:', error);
      return getLocalData('shop_settings', defaultSettings);
    }
  },

  async saveShopSettings(settings: { customUpiVpa: string; customUpiQr: string | null }): Promise<void> {
    setLocalData('shop_settings', settings);

    if (isMockFirebase || !db) {
      return;
    }

    try {
      const docRef = doc(db, 'settings', 'shop');
      await setDoc(docRef, settings);
    } catch (error) {
      console.warn('Firestore saveShopSettings failed:', error);
    }
  },

  // --- COUPON ACTIONS ---
  async getCoupons(): Promise<Coupon[]> {
    if (isMockFirebase || !db) {
      const local = getLocalData<Coupon[]>(COUPONS_COLLECTION, []);
      if (!local || local.length === 0) {
        setLocalData(COUPONS_COLLECTION, DEFAULT_COUPONS);
        return DEFAULT_COUPONS;
      }
      return local;
    }
    try {
      const snapshot = await getDocs(collection(db, COUPONS_COLLECTION));
      const coupons: Coupon[] = [];
      snapshot.forEach((d) => {
        if (d.exists()) {
          coupons.push({ id: d.id, ...d.data() } as Coupon);
        }
      });
      if (coupons.length === 0) {
        for (const item of DEFAULT_COUPONS) {
          await setDoc(doc(db, COUPONS_COLLECTION, item.id), item);
          coupons.push(item);
        }
      }
      setLocalData(COUPONS_COLLECTION, coupons);
      return coupons;
    } catch {
      return getLocalData(COUPONS_COLLECTION, DEFAULT_COUPONS);
    }
  },

  async saveCoupon(coupon: Coupon): Promise<void> {
    const coupons = await this.getCoupons();
    const idx = coupons.findIndex(c => c.id === coupon.id);
    if (idx > -1) {
      coupons[idx] = coupon;
    } else {
      coupons.push(coupon);
    }
    setLocalData(COUPONS_COLLECTION, coupons);

    if (isMockFirebase || !db) return;
    try {
      await setDoc(doc(db, COUPONS_COLLECTION, coupon.id), coupon);
    } catch (e) {
      console.warn(e);
    }
  },

  async deleteCoupon(couponId: string): Promise<void> {
    const coupons = await this.getCoupons();
    const updated = coupons.filter(c => c.id !== couponId);
    setLocalData(COUPONS_COLLECTION, updated);

    if (isMockFirebase || !db) return;
    try {
      await deleteDoc(doc(db, COUPONS_COLLECTION, couponId));
    } catch (e) {
      console.warn(e);
    }
  },

  async resetCoupons(): Promise<Coupon[]> {
    setLocalData(COUPONS_COLLECTION, DEFAULT_COUPONS);
    if (isMockFirebase || !db) return DEFAULT_COUPONS;
    try {
      const snapshot = await getDocs(collection(db, COUPONS_COLLECTION));
      for (const docSnap of snapshot.docs) {
        await deleteDoc(doc(db, COUPONS_COLLECTION, docSnap.id));
      }
      for (const item of DEFAULT_COUPONS) {
        await setDoc(doc(db, COUPONS_COLLECTION, item.id), item);
      }
    } catch (e) {
      console.warn(e);
    }
    return DEFAULT_COUPONS;
  },

  // --- CAROUSEL ACTIONS ---
  async getCarouselSlides(): Promise<CarouselSlide[]> {
    if (isMockFirebase || !db) {
      const local = getLocalData<CarouselSlide[]>(CAROUSEL_COLLECTION, []);
      if (!local || local.length === 0) {
        setLocalData(CAROUSEL_COLLECTION, DEFAULT_CAROUSEL_SLIDES);
        return DEFAULT_CAROUSEL_SLIDES;
      }
      return local;
    }
    try {
      const snapshot = await getDocs(collection(db, CAROUSEL_COLLECTION));
      const slides: CarouselSlide[] = [];
      snapshot.forEach((d) => {
        if (d.exists()) {
          slides.push({ id: d.id, ...d.data() } as CarouselSlide);
        }
      });
      if (slides.length === 0) {
        for (const item of DEFAULT_CAROUSEL_SLIDES) {
          await setDoc(doc(db, CAROUSEL_COLLECTION, item.id), item);
          slides.push(item);
        }
      }
      setLocalData(CAROUSEL_COLLECTION, slides);
      return slides;
    } catch {
      return getLocalData(CAROUSEL_COLLECTION, DEFAULT_CAROUSEL_SLIDES);
    }
  },

  async saveCarouselSlide(slide: CarouselSlide): Promise<void> {
    const slides = await this.getCarouselSlides();
    const idx = slides.findIndex(s => s.id === slide.id);
    if (idx > -1) {
      slides[idx] = slide;
    } else {
      slides.push(slide);
    }
    setLocalData(CAROUSEL_COLLECTION, slides);

    if (isMockFirebase || !db) return;
    try {
      await setDoc(doc(db, CAROUSEL_COLLECTION, slide.id), slide);
    } catch (e) {
      console.warn(e);
    }
  },

  async deleteCarouselSlide(slideId: string): Promise<void> {
    const slides = await this.getCarouselSlides();
    const updated = slides.filter(s => s.id !== slideId);
    setLocalData(CAROUSEL_COLLECTION, updated);

    if (isMockFirebase || !db) return;
    try {
      await deleteDoc(doc(db, CAROUSEL_COLLECTION, slideId));
    } catch (e) {
      console.warn(e);
    }
  },

  async resetCarouselSlides(): Promise<CarouselSlide[]> {
    setLocalData(CAROUSEL_COLLECTION, DEFAULT_CAROUSEL_SLIDES);
    if (isMockFirebase || !db) return DEFAULT_CAROUSEL_SLIDES;
    try {
      const snapshot = await getDocs(collection(db, CAROUSEL_COLLECTION));
      for (const docSnap of snapshot.docs) {
        await deleteDoc(doc(db, CAROUSEL_COLLECTION, docSnap.id));
      }
      for (const item of DEFAULT_CAROUSEL_SLIDES) {
        await setDoc(doc(db, CAROUSEL_COLLECTION, item.id), item);
      }
    } catch (e) {
      console.warn(e);
    }
    return DEFAULT_CAROUSEL_SLIDES;
  },

  // --- PROMO BANNER / MESSAGES ACTIONS ---
  async getPromoMessages(): Promise<PromoMessage[]> {
    if (isMockFirebase || !db) {
      const local = getLocalData<PromoMessage[]>(BANNERS_COLLECTION, []);
      if (!local || local.length === 0) {
        setLocalData(BANNERS_COLLECTION, DEFAULT_PROMO_MESSAGES);
        return DEFAULT_PROMO_MESSAGES;
      }
      return local;
    }
    try {
      const snapshot = await getDocs(collection(db, BANNERS_COLLECTION));
      const banners: PromoMessage[] = [];
      snapshot.forEach((d) => {
        if (d.exists()) {
          banners.push({ id: d.id, ...d.data() } as PromoMessage);
        }
      });
      if (banners.length === 0) {
        for (const item of DEFAULT_PROMO_MESSAGES) {
          await setDoc(doc(db, BANNERS_COLLECTION, item.id), item);
          banners.push(item);
        }
      }
      setLocalData(BANNERS_COLLECTION, banners);
      return banners;
    } catch {
      return getLocalData(BANNERS_COLLECTION, DEFAULT_PROMO_MESSAGES);
    }
  },

  async savePromoMessage(msg: PromoMessage): Promise<void> {
    const banners = await this.getPromoMessages();
    const idx = banners.findIndex(b => b.id === msg.id);
    if (idx > -1) {
      banners[idx] = msg;
    } else {
      banners.push(msg);
    }
    setLocalData(BANNERS_COLLECTION, banners);

    if (isMockFirebase || !db) return;
    try {
      await setDoc(doc(db, BANNERS_COLLECTION, msg.id), msg);
    } catch (e) {
      console.warn(e);
    }
  },

  async deletePromoMessage(msgId: string): Promise<void> {
    const banners = await this.getPromoMessages();
    const updated = banners.filter(b => b.id !== msgId);
    setLocalData(BANNERS_COLLECTION, updated);

    if (isMockFirebase || !db) return;
    try {
      await deleteDoc(doc(db, BANNERS_COLLECTION, msgId));
    } catch (e) {
      console.warn(e);
    }
  },

  async resetPromoMessages(): Promise<PromoMessage[]> {
    setLocalData(BANNERS_COLLECTION, DEFAULT_PROMO_MESSAGES);
    if (isMockFirebase || !db) return DEFAULT_PROMO_MESSAGES;
    try {
      const snapshot = await getDocs(collection(db, BANNERS_COLLECTION));
      for (const docSnap of snapshot.docs) {
        await deleteDoc(doc(db, BANNERS_COLLECTION, docSnap.id));
      }
      for (const item of DEFAULT_PROMO_MESSAGES) {
        await setDoc(doc(db, BANNERS_COLLECTION, item.id), item);
      }
    } catch (e) {
      console.warn(e);
    }
    return DEFAULT_PROMO_MESSAGES;
  }
};
