import { Product, Category } from '../types';

export const INITIAL_CATEGORIES: Category[] = [
  { id: 'cat-1', name: 'Audio', slug: 'audio', icon: 'Headphones' },
  { id: 'cat-2', name: 'Wearables', slug: 'wearables', icon: 'Watch' },
  { id: 'cat-3', name: 'Workplace', slug: 'workplace', icon: 'Keyboard' },
  { id: 'cat-4', name: 'Accessories', slug: 'accessories', icon: 'Grid' },
];

export const INITIAL_PRODUCTS: Product[] = [
  {
    id: 'prod-1',
    name: 'Acoustic Pro Headphones',
    description: 'Precision-engineered active noise cancelling headphones featuring studio-grade 40mm transducers, custom-spun memory foam cups, and an ultra-lightweight carbon fiber headband. Battery life provides up to 36 hours of continuous, high-fidelity wireless spatial sound.',
    price: 23999,
    originalPrice: 27999,
    image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&q=80&w=800',
    images: [
      'https://images.unsplash.com/photo-1484704849700-f032a568e944?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1546435770-a3e426bf472b?auto=format&fit=crop&q=80&w=800'
    ],
    category: 'audio',
    stock: 15,
    rating: 4.8,
    salesCount: 124,
    isFeatured: true,
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'prod-2',
    name: 'Aura Wireless Speaker',
    description: '360° omnidirectional high-definition speaker integrated with an ambient circadian lighting ring. Encased in beautiful spun acoustic steel and native ash wood. Includes smart voice control and multi-room WiFi audio orchestration capabilities.',
    price: 11999,
    image: 'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?auto=format&fit=crop&q=80&w=800',
    category: 'audio',
    stock: 24,
    rating: 4.5,
    salesCount: 88,
    isFeatured: true,
    createdAt: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'prod-3',
    name: 'Chronos Smart Watch',
    description: 'A masterpiece of wearable engineering. Designed with high-purity sapphire cover glass, a grade-5 aerospace titanium bezel, and responsive physical crowns. Monitors blood oxygenation, sleep architecture, and multi-sport logs gracefully.',
    price: 27999,
    originalPrice: 31999,
    image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&q=80&w=800',
    images: [
      'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1542496658-e33a6d0d50f6?auto=format&fit=crop&q=80&w=800'
    ],
    category: 'wearables',
    stock: 8,
    rating: 4.9,
    salesCount: 62,
    isFeatured: true,
    createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'prod-4',
    name: 'Apex Fit Tracker',
    description: 'Ultra-thin, skin-safe elastomer smart band housing a curved low-power OLED display. Tracks dynamic biometrics seamlessly, offering active haptic guidance, and matches elegant slate gray styling to any fashion style.',
    price: 9599,
    image: 'https://images.unsplash.com/photo-1575311373937-040b8e1fd5b6?auto=format&fit=crop&q=80&w=800',
    category: 'wearables',
    stock: 40,
    rating: 4.3,
    salesCount: 210,
    createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'prod-5',
    name: 'Pro Linear Mechanical Keyboard',
    description: 'The ultimate typing instrument. Constructed with CNC-milled heavy aluminum casing, gold-plated hot-swappable tactile linear switches, and thick doubleshot PBT keycaps. Features subtle, warm-amber responsive underglow.',
    price: 15999,
    originalPrice: 18399,
    image: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&q=80&w=800',
    images: [
      'https://images.unsplash.com/photo-1618384887929-16ec33fab9ef?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1595225476474-87563907a212?auto=format&fit=crop&q=80&w=800'
    ],
    category: 'workplace',
    stock: 12,
    rating: 4.7,
    salesCount: 95,
    isFeatured: true,
    createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'prod-6',
    name: 'Ergo Precision Mouse',
    description: 'Sculpted biological geometry mouse built to eliminate wrist strain. Employs a state-of-the-art 26,000 DPI optical sensor, ultra-quiet electromagnetic scroll wheel, and dual Bluetooth or 2.4Ghz lossless wireless channels.',
    price: 7199,
    image: 'https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?auto=format&fit=crop&q=80&w=800',
    category: 'workplace',
    stock: 18,
    rating: 4.6,
    salesCount: 147,
    createdAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'prod-7',
    name: 'Lumen Desk Beam',
    description: 'Advanced desktop visual architecture. Emits separate downward flicker-free task lighting and upward customizable, biological-cycle matching ambient wash. Hand-built touch-capacitive control slab.',
    price: 10399,
    image: 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&q=80&w=800',
    category: 'accessories',
    stock: 30,
    rating: 4.4,
    salesCount: 74,
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'prod-8',
    name: 'MagSafe Organizer Pad',
    description: 'A handsome desk valet hand-stitched from premium full-grain Italian leather over a solid weight walnut tray. Embedded with dense magnetic alignment fields to organize and speed-charge your devices fast & securely.',
    price: 6399,
    image: 'https://images.unsplash.com/photo-1603302576837-37561b2e2302?auto=format&fit=crop&q=80&w=800',
    category: 'accessories',
    stock: 25,
    rating: 4.7,
    salesCount: 110,
    isFeatured: true,
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
  }
];
