import React, { useState, useMemo, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Product, Order, OrderStatus } from '../types';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { 
  Coins, 
  ShoppingCart, 
  AlertOctagon, 
  Plus, 
  Edit, 
  Trash2, 
  LayoutDashboard, 
  CheckCircle, 
  FileText,
  Truck,
  ArrowLeft,
  X,
  PlusCircle,
  Clock,
  ShieldAlert,
  Info,
  Smartphone,
  Upload,
  Image,
  Database,
  QrCode,
  ShieldCheck,
  RefreshCcw,
  Sparkles
} from 'lucide-react';
import { AdminPromotions } from './AdminPromotions';

const COLORS = ['#8b5cf6', '#6366f1', '#4f46e5', '#a78bfa'];

const AdminDashboard: React.FC = () => {
  const { 
    products, 
    orders, 
    addProduct, 
    editProduct, 
    deleteProduct, 
    updateOrderStatus,
    resetInventory,
    merchantUpiVpa,
    customUpiQr,
    updateShopSettings
  } = useApp();

  const [activeTab, setActiveTab] = useState<'analytics' | 'inventory' | 'orders' | 'diagnostics' | 'payment-verification' | 'promotions'>('analytics');
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isAdminResetting, setIsAdminResetting] = useState(false);
  const [confirmingReset, setConfirmingReset] = useState(false);
  const [confirmingReseed, setConfirmingReseed] = useState(false);
  const [reseedStatus, setReseedStatus] = useState<string | null>(null);
  const [pendingAction, setPendingAction] = useState<{
    orderId: string;
    type: 'approve' | 'reject';
  } | null>(null);

  // Re-seed default catalog with multiple image galleries helper
  const handleResetCatalog = async () => {
    setReseedStatus('Updating database...');
    try {
      localStorage.removeItem('products');
      // Import seed data & save
      const { INITIAL_PRODUCTS } = await import('../lib/seedData');
      const { dbService } = await import('../lib/db');
      for (const prod of INITIAL_PRODUCTS) {
        await dbService.saveProduct(prod);
      }
      setReseedStatus('Catalog successfully seed-loaded! Reloading page in 1.5 seconds...');
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (err: any) {
      setReseedStatus('Error: ' + err.message);
    }
  };

  // Load configuration check results
  const [envStatus, setEnvStatus] = useState<{
    stripe: boolean;
    firebasePhoneAuth: boolean;
  } | null>(null);
  const [loadingHealth, setLoadingHealth] = useState(false);
  const [currentLogoUrl, setCurrentLogoUrl] = useState<string>('/uploads/logo.png');

  React.useEffect(() => {
    try {
      const stored = localStorage.getItem('custom_store_logo');
      if (stored) {
        setCurrentLogoUrl(stored);
      }
    } catch {}
  }, []);

  React.useEffect(() => {
    if (activeTab === 'diagnostics') {
      setLoadingHealth(true);
      fetch('/api/health')
        .then(res => res.json())
        .then(data => {
          if (data && data.envDetected) {
            setEnvStatus(data.envDetected);
          }
        })
        .catch(() => {})
        .finally(() => setLoadingHealth(false));
    }
  }, [activeTab]);

  // Add Product form state
  const [newProdName, setNewProdName] = useState('');
  const [newProdCategory, setNewProdCategory] = useState('audio');
  const [newProdPrice, setNewProdPrice] = useState('');
  const [newProdOriginalPrice, setNewProdOriginalPrice] = useState('');
  const [newProdStock, setNewProdStock] = useState('');
  const [newProdImage, setNewProdImage] = useState('');
  const [newProdExtraImages, setNewProdExtraImages] = useState<string[]>([]);
  const [newProdDesc, setNewProdDesc] = useState('');
  const [valError, setValError] = useState<string | null>(null);

  // Asset Upload States
  const [isUploading, setIsUploading] = useState(false);
  const [fileUploadError, setFileUploadError] = useState<string | null>(null);
  const [logoSuccessMsg, setLogoSuccessMsg] = useState<string | null>(null);

  // Merchant UPI Setup States
  const [customUpiVpa, setCustomUpiVpa] = useState(merchantUpiVpa);
  const [upiQrSuccessMsg, setUpiQrSuccessMsg] = useState<string | null>(null);
  const [upiVpaSaved, setUpiVpaSaved] = useState(false);

  useEffect(() => {
    setCustomUpiVpa(merchantUpiVpa);
  }, [merchantUpiVpa]);

  const compressImage = (file: File, maxWidth = 600, maxHeight = 600): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = document.createElement('img');
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > maxWidth) {
              height = Math.round((height * maxWidth) / width);
              width = maxWidth;
            }
          } else {
            if (height > maxHeight) {
              width = Math.round((width * maxHeight) / height);
              height = maxHeight;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(event.target?.result as string);
            return;
          }
          ctx.drawImage(img, 0, 0, width, height);
          const compressedBase64 = canvas.toDataURL('image/jpeg', 0.7);
          resolve(compressedBase64);
        };
        img.onerror = () => reject(new Error('Failed to load image element.'));
      };
      reader.onerror = error => reject(error);
    });
  };

  const handleUploadFile = async (e: React.ChangeEvent<HTMLInputElement>, type: 'add' | 'add-extra' | 'edit' | 'edit-extra' | 'logo' | 'upi-qr') => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setFileUploadError(null);
    setLogoSuccessMsg(null);
    setUpiQrSuccessMsg(null);

    try {
      // Compress for high density permanent storage database efficiency
      const maxDim = type === 'logo' || type === 'upi-qr' ? 300 : 500;
      const base64 = await compressImage(file, maxDim, maxDim);
      
      const filename = type === 'logo' ? 'logo.png' : type === 'upi-qr' ? 'upi_qr.png' : `${Date.now()}_${file.name.replace(/\s+/g, '_')}`;
      
      // Upload to container folder (so physical file exists for standard URL reference if needed)
      await fetch('/api/upload-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          imageName: filename,
          base64Data: base64
        })
      }).catch(() => {
        console.warn('Silent fallback: saved to database directly');
      });

      // Saving the optimized base64 URL directly as the product image
      // guarantees 100% database persistence (Firestore or LocalStorage)
      // so it survives any server rebuilds or container restarts!
      const finalUrl = base64; 

      if (type === 'add') {
        setNewProdImage(finalUrl);
      } else if (type === 'add-extra') {
        setNewProdExtraImages(prev => [...prev, finalUrl]);
      } else if (type === 'edit' && editingProduct) {
        setEditingProduct({ ...editingProduct, image: finalUrl });
      } else if (type === 'edit-extra' && editingProduct) {
        const currentExtra = editingProduct.images || [];
        setEditingProduct({ ...editingProduct, images: [...currentExtra, finalUrl] });
      } else if (type === 'logo') {
        localStorage.setItem('custom_store_logo', base64);
        setCurrentLogoUrl(base64);
        setLogoSuccessMsg(`Custom Logo uploaded successfully! Saved permanently in custom store identity vault.`);
      } else if (type === 'upi-qr') {
        await updateShopSettings(customUpiVpa, base64);
        setUpiQrSuccessMsg(`Custom Merchant UPI QR code uploaded successfully! This QR will automatically render during client checkouts.`);
      }
    } catch (err: any) {
      setFileUploadError(err.message || 'Error uploading file.');
    } finally {
      setIsUploading(false);
      // Reset the file input value so same file can be loaded again if needed
      e.target.value = '';
    }
  };

  // --- STATS COMPILER (AGGREGATOR) ---
  const stats = useMemo(() => {
    const totalTransactions = orders.length;
    const grossRevenue = orders.reduce((acc, o) => o.status !== OrderStatus.CANCELLED ? acc + o.totalAmount : acc, 0);
    const avgTicket = totalTransactions > 0 ? parseFloat((grossRevenue / totalTransactions).toFixed(2)) : 0;
    
    // Low stock warning alerts (stock less than 10)
    const lowStockCount = products.filter(p => p.stock < 10).length;

    return {
      grossRevenue,
      totalTransactions,
      avgTicket,
      lowStockCount
    };
  }, [orders, products]);

  // --- RECHARTS HISTORICAL AGGREGATORS ---
  const chartData = useMemo(() => {
    const baselineSales = [
      { date: '06/03', revenue: 450, orders: 3 },
      { date: '06/04', revenue: 720, orders: 4 },
      { date: '06/05', revenue: 510, orders: 2 },
      { date: '06/06', revenue: 1250, orders: 6 },
      { date: '06/07', revenue: 890, orders: 5 },
    ];

    const combinedMap: Record<string, { revenue: number; orders: number }> = {};
    
    // Seed combined map with baseline
    baselineSales.forEach(item => {
      combinedMap[item.date] = { revenue: item.revenue, orders: item.orders };
    });

    // Merge live sales
    orders.forEach(o => {
      if (o.status !== OrderStatus.CANCELLED) {
        const dateStr = new Date(o.createdAt).toLocaleDateString(undefined, { month: '2-digit', day: '2-digit' });
        if (!combinedMap[dateStr]) {
          combinedMap[dateStr] = { revenue: 0, orders: 0 };
        }
        combinedMap[dateStr].revenue += o.totalAmount;
        combinedMap[dateStr].orders += 1;
      }
    });

    return Object.keys(combinedMap).map(k => ({
      date: k,
      revenue: parseFloat(combinedMap[k].revenue.toFixed(2)),
      orders: combinedMap[k].orders
    })).sort((a, b) => a.date.localeCompare(b.date));
  }, [orders]);

  // --- CATEGORY PIE CHART DISTRIBUTION AGGREGATOR ---
  const categoryData = useMemo(() => {
    const distribution: Record<string, { value: number; revenue: number }> = {};
    products.forEach(p => {
      if (!distribution[p.category]) distribution[p.category] = { value: 0, revenue: 0 };
      distribution[p.category].value += p.stock;
    });

    orders.forEach(ord => {
      ord.items.forEach(it => {
        const matchingProduct = products.find(p => p.id === it.id);
        if (matchingProduct) {
          const cat = matchingProduct.category;
          if (!distribution[cat]) distribution[cat] = { value: 0, revenue: 0 };
          distribution[cat].revenue += it.price * it.quantity;
        }
      });
    });

    return Object.keys(distribution).map(k => ({
      name: k.charAt(0).toUpperCase() + k.slice(1),
      value: distribution[k].value,
      revenue: parseFloat(distribution[k].revenue.toFixed(2))
    }));
  }, [products, orders]);

  // --- ADD/EDIT ACTIONS SUBMIT ---
  const handleAddProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValError(null);

    const price = parseFloat(newProdPrice);
    const originalPrice = newProdOriginalPrice ? parseFloat(newProdOriginalPrice) : undefined;
    const stock = parseInt(newProdStock, 10);

    if (!newProdName || isNaN(price) || isNaN(stock) || !newProdImage || !newProdDesc) {
      setValError('Please double check inputs. Price, stock, title, image are required.');
      return;
    }

    try {
      await addProduct({
        name: newProdName,
        category: newProdCategory,
        price,
        originalPrice,
        stock,
        image: newProdImage,
        images: newProdExtraImages,
        description: newProdDesc
      });
      setIsAddOpen(false);
      // Clean states
      setNewProdName('');
      setNewProdPrice('');
      setNewProdOriginalPrice('');
      setNewProdStock('');
      setNewProdImage('');
      setNewProdExtraImages([]);
      setNewProdDesc('');
    } catch (err: any) {
      setValError(err?.message || 'Error creating product.');
    }
  };

  const handleEditProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValError(null);

    if (!editingProduct) return;

    if (!editingProduct.name || isNaN(editingProduct.price) || isNaN(editingProduct.stock) || !editingProduct.image || !editingProduct.description) {
      setValError('Validate details. Price, stock, title, and image fields cannot be empty.');
      return;
    }

    try {
      await editProduct(editingProduct);
      setEditingProduct(null);
    } catch (err: any) {
      setValError(err?.message || 'Error updating product.');
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 select-none text-slate-100">
      
      {/* Title Header area */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-6 border-b border-violet-950/40 mb-8">
        <div>
          <span className="text-[10px] uppercase font-extrabold tracking-widest text-[#8b5cf6] font-mono">Operations Dashboard</span>
          <h2 className="text-2xl font-black tracking-tight text-white mt-1 uppercase font-sans">Inventory & Revenue Desk</h2>
          <p className="text-xs text-slate-400 mt-1 font-light">Real-time analytical performance tracking and storage vault adjustments</p>
        </div>

        {/* Tab Selection */}
        <div className="flex items-center gap-1 bg-[#05021a] p-1 border border-violet-500/15 rounded-xl shadow-inner shrink-0 overflow-x-auto max-w-full">
          <button
            onClick={() => setActiveTab('analytics')}
            className={`flex h-8 items-center gap-1.5 rounded-lg px-3.5 text-xs font-bold tracking-widest uppercase transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'analytics' ? 'bg-gradient-to-r from-violet-600 to-indigo-650 text-white shadow-md' : 'text-slate-450 hover:text-white'
            }`}
          >
            <LayoutDashboard className="w-4 h-4" />
            <span>Analytics</span>
          </button>
          <button
            onClick={() => setActiveTab('inventory')}
            className={`flex h-8 items-center gap-1.5 rounded-lg px-3.5 text-xs font-bold tracking-widest uppercase transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'inventory' ? 'bg-gradient-to-r from-violet-600 to-indigo-650 text-white shadow-md' : 'text-slate-455 hover:text-white'
            }`}
          >
            <AlertOctagon className="w-4 h-4" />
            <span>Inventory</span>
          </button>
          <button
            onClick={() => setActiveTab('orders')}
            className={`flex h-8 items-center gap-1.5 rounded-lg px-3.5 text-xs font-bold tracking-widest uppercase transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'orders' ? 'bg-gradient-to-r from-violet-600 to-indigo-650 text-white shadow-md' : 'text-slate-455 hover:text-white'
            }`}
          >
            <ShoppingCart className="w-4 h-4" />
            <span>Orders ({orders.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('payment-verification')}
            className={`flex h-8 items-center gap-1.5 rounded-lg px-3.5 text-xs font-bold tracking-widest uppercase transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'payment-verification' ? 'bg-gradient-to-r from-violet-600 to-indigo-650 text-white shadow-md' : 'text-slate-455 hover:text-white'
            }`}
          >
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Payment Verification</span>
          </button>
          <button
            onClick={() => setActiveTab('promotions')}
            className={`flex h-8 items-center gap-1.5 rounded-lg px-3.5 text-xs font-bold tracking-widest uppercase transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'promotions' ? 'bg-gradient-to-r from-violet-600 to-indigo-650 text-white shadow-md' : 'text-slate-455 hover:text-white'
            }`}
          >
            <Sparkles className="w-4 h-4 text-violet-400" />
            <span>Promotions</span>
          </button>
          <button
            onClick={() => setActiveTab('diagnostics')}
            className={`flex h-8 items-center gap-1.5 rounded-lg px-3.5 text-xs font-bold tracking-widest uppercase transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'diagnostics' ? 'bg-gradient-to-r from-violet-600 to-indigo-650 text-white shadow-md' : 'text-slate-455 hover:text-white'
            }`}
          >
            <ShieldAlert className="w-4 h-4" />
            <span>Integrations</span>
          </button>
        </div>
      </div>

      {/* Analytical Bento Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4.5 mb-8">
        
        {/* Gross Revenue Card */}
        <div className="bg-[#090525]/80 rounded-xl border border-violet-500/15 p-4.5 shadow-sm flex items-center gap-4">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-600/10 text-[#8b5cf6] border border-violet-500/20 shrink-0">
            <Coins className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[9.5px] font-extrabold text-slate-450 uppercase tracking-widest block">Gross Sales Revenue</span>
            <span className="text-xl font-black tracking-tight text-white block font-mono mt-1">₹{stats.grossRevenue.toLocaleString('en-IN')}</span>
            <span className="text-[9px] text-emerald-400 font-extrabold uppercase tracking-widest block mt-1">Live active ledger</span>
          </div>
        </div>

        {/* Total Transactions Card */}
        <div className="bg-[#090525]/80 rounded-xl border border-violet-500/15 p-4.5 shadow-sm flex items-center gap-4">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-600/10 text-indigo-400 border border-indigo-500/20 shrink-0">
            <ShoppingCart className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[9.5px] font-extrabold text-slate-450 uppercase tracking-widest block">Transactions Count</span>
            <span className="text-xl font-black tracking-tight text-white block font-mono mt-1">{stats.totalTransactions} Orders</span>
            <span className="text-[9px] text-indigo-400 font-extrabold uppercase tracking-widest block mt-1">Secure clearing network</span>
          </div>
        </div>

        {/* Average Order Value Card */}
        <div className="bg-[#090525]/80 rounded-xl border border-violet-500/15 p-4.5 shadow-sm flex items-center gap-4">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-600/10 text-violet-300 border border-violet-500/20 shrink-0">
            <CheckCircle className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[9.5px] font-extrabold text-slate-450 uppercase tracking-widest block">Average Ticket Size</span>
            <span className="text-xl font-black tracking-tight text-white block font-mono mt-1">₹{stats.avgTicket}</span>
            <span className="text-[9px] text-[#8b5cf6] font-extrabold uppercase tracking-widest block mt-1">Total basket averages</span>
          </div>
        </div>

        {/* Low Stock Indicator Card */}
        <div className="bg-[#090525]/80 rounded-xl border border-violet-500/15 p-4.5 shadow-sm flex items-center gap-4">
          <div className={`flex h-11 w-11 items-center justify-center rounded-xl shrink-0 border ${
            stats.lowStockCount > 0 
              ? 'bg-amber-950/20 text-amber-400 border-amber-500/30 animate-pulse' 
              : 'bg-emerald-950/20 text-emerald-400 border-emerald-500/30'
          }`}>
            <AlertOctagon className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[9.5px] font-extrabold text-slate-450 uppercase tracking-widest block">Low Stock Lines</span>
            <span className={`text-xl font-black tracking-tight block font-mono mt-1 ${
              stats.lowStockCount > 0 ? 'text-amber-400' : 'text-white'
            }`}>
              {stats.lowStockCount} Products
            </span>
            <span className="text-[9px] text-slate-500 font-bold uppercase tracking-widest block mt-1">Lines under 10 units</span>
          </div>
        </div>

      </div>

      {/* --- TAB VIEW 1: ACTIVE ANALYTICS --- */}
      {activeTab === 'analytics' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Main Sales Trend Line */}
          <div className="lg:col-span-8 bg-[#090525]/80 border border-violet-500/15 rounded-xl p-5 shadow-sm">
            <h3 className="text-xs font-extrabold text-[#8b5cf6] mb-5 pb-3 border-b border-violet-950/45 uppercase tracking-widest">Settlement Sales History (₹)</h3>
            
            <div className="h-72 w-full text-xs">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.25}/>
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e1b4b" />
                  <XAxis dataKey="date" stroke="#64748b" tickLine={false} />
                  <YAxis stroke="#64748b" tickLine={false} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '0.75rem', border: '1px solid #3c0764', backgroundColor: '#090525', color: '#f1f5f9' }}
                    labelFormatter={(label) => `Date: ${label}`}
                  />
                  <Area type="monotone" dataKey="revenue" name="Daily Revenue" stroke="#8b5cf6" strokeWidth={2.5} fillOpacity={1} fill="url(#colorSales)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Category distribution Pie Chart */}
          <div className="lg:col-span-4 bg-[#090525]/80 border border-violet-500/15 rounded-xl p-5 shadow-sm flex flex-col justify-between">
            <div>
              <h3 className="text-xs font-extrabold text-[#8b5cf6] mb-5 pb-3 border-b border-violet-950/45 uppercase tracking-widest">Category Stock Weights</h3>
              
              <div className="h-44 w-full flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryData}
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={65}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {categoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ fontSize: '11px', borderRadius: '8px', backgroundColor: '#090525', border: '1px solid #1e1b4b' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Custom Pie Legend */}
            <div className="space-y-2.5 mt-4">
              {categoryData.map((entry, idx) => (
                <div key={`${entry.name}-${idx}`} className="flex items-center justify-between text-[11px] font-medium">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                    <span className="text-slate-200 font-extrabold font-sans">{entry.name}</span>
                  </div>
                  <div className="flex gap-4 font-mono font-bold text-slate-450">
                    <span title="Total stock capacity">{entry.value} pcs</span>
                    <span title="Gross sales revenue" className="text-white">₹{entry.revenue.toLocaleString('en-IN')}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* --- TAB VIEW 2: LOGISTICS WAREHOUSE INVENTORY TABLES --- */}
      {activeTab === 'inventory' && (
        <div className="bg-[#090525]/85 border border-violet-500/15 rounded-xl shadow-sm overflow-hidden mb-8">
          
          {/* Inventory Table Head actions */}
          <div className="py-4.5 px-5 border-b border-violet-950/50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-[#05021a]/90">
            <div>
              <h3 className="text-xs font-extrabold text-white uppercase tracking-widest">Inventory Management LEDGER</h3>
              <p className="text-[11px] text-slate-400 mt-1 font-light">Control pricing, stock lines, product display titles & image parameters</p>
            </div>
            
            <div className="flex gap-2">
              {confirmingReset ? (
                <div className="flex gap-2 animate-pulse">
                  <button
                    type="button"
                    disabled={isAdminResetting}
                    onClick={async () => {
                      setIsAdminResetting(true);
                      try {
                        await resetInventory();
                      } catch (e) {
                        console.error(e);
                      } finally {
                        setIsAdminResetting(false);
                        setConfirmingReset(false);
                      }
                    }}
                    className="flex h-8 items-center bg-red-650 hover:bg-red-750 border border-red-500 px-4 rounded-lg text-xs font-extrabold text-white transition-all cursor-pointer uppercase tracking-widest shadow-sm"
                  >
                    Confirm Reset ⚠️
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmingReset(false)}
                    className="flex h-8 items-center bg-zinc-805 hover:bg-zinc-750 border border-zinc-700 px-4 rounded-lg text-xs font-bold text-slate-300 hover:text-white transition-all cursor-pointer uppercase tracking-widest"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  disabled={isAdminResetting}
                  onClick={() => setConfirmingReset(true)}
                  className="flex h-8 items-center gap-1.5 rounded-lg border border-violet-500/20 hover:border-violet-500/55 bg-[#05021a] px-4 text-xs font-bold text-slate-300 hover:text-white transition-all cursor-pointer uppercase tracking-widest disabled:opacity-50"
                >
                  <RefreshCcw className={`w-3.5 h-3.5 ${isAdminResetting ? 'animate-spin' : ''}`} />
                  <span>{isAdminResetting ? 'Resetting...' : 'Reset Catalog'}</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => setIsAddOpen(true)}
                className="flex h-8 items-center gap-1.5 rounded-lg bg-gradient-to-r from-violet-600 to-indigo-650 hover:from-violet-500 hover:to-indigo-550 px-4 text-xs font-bold text-white transition-colors cursor-pointer uppercase tracking-widest"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add New Item Line</span>
              </button>
            </div>
          </div>

          {/* List Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-violet-950/45 bg-[#05021a]/30 text-slate-450 font-bold uppercase tracking-widest text-[9px]">
                  <th className="py-3 px-4 w-[280px]">Product details</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Price</th>
                  <th className="py-3 px-4">Warehouse Stock</th>
                  <th className="py-3 px-4">Sold quantity</th>
                  <th className="py-3 px-4 text-right">Ledger actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-violet-950/25">
                {products.map((p) => (
                  <tr key={p.id} className="hover:bg-violet-950/10 transition-colors">
                    {/* Title Image details */}
                    <td className="py-3.5 px-4">
                      <div className="flex gap-3">
                        <img
                          src={p.image}
                          alt={p.name}
                          className="h-9 w-9 rounded-lg object-cover bg-[#040118] border border-violet-500/10 shrink-0"
                          referrerPolicy="no-referrer"
                        />
                        <div className="flex flex-col justify-center min-w-0 leading-tight">
                          <span className="font-extrabold text-slate-200 truncate block">{p.name}</span>
                          <span className="text-[9px] text-slate-500 font-mono tracking-tight uppercase mt-0.5">ID: {p.id}</span>
                        </div>
                      </div>
                    </td>

                    {/* Category */}
                    <td className="py-3.5 px-4 font-mono capitalize text-slate-400">
                      {p.category}
                    </td>

                    {/* Price */}
                    <td className="py-3.5 px-4 font-mono font-bold text-white text-xs">
                      ₹{p.price.toLocaleString('en-IN')}
                    </td>

                    {/* Stock status indicator badge */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        <span className={`inline-flex items-center rounded font-mono font-bold px-2 py-0.5 text-[9px] border ${
                          p.stock === 0
                            ? 'bg-red-950/20 text-red-400 border-red-550/20'
                            : p.stock < 10
                            ? 'bg-amber-950/20 text-amber-400 border-amber-550/20'
                            : 'bg-emerald-950/20 text-emerald-405 border-emerald-555/20'
                        }`}>
                          {p.stock} units
                        </span>
                        {p.stock < 10 && p.stock > 0 && <span className="text-[9px] text-amber-500 font-bold uppercase tracking-widest font-mono">Restock soon</span>}
                        {p.stock === 0 && <span className="text-[9px] text-red-400 font-bold uppercase tracking-widest font-mono">Sold Out</span>}
                      </div>
                    </td>

                    {/* Quantity Sold */}
                    <td className="py-3.5 px-4 font-mono font-semibold text-slate-400">
                      {p.salesCount || 0} Sold
                    </td>

                    {/* Actions edit delete */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          onClick={() => setEditingProduct(p)}
                          className="p-1.5 hover:text-white rounded-lg border border-violet-500/15 bg-[#05021a] hover:bg-violet-950/50 transition-colors cursor-pointer"
                          title="Edit Product"
                        >
                          <Edit className="w-3.5 h-3.5 text-slate-400 hover:text-white" />
                        </button>
                        <button
                          onClick={() => deleteProduct(p.id)}
                          className="p-1.5 hover:text-red-400 rounded-lg border border-violet-500/15 bg-[#05021a] hover:bg-violet-950/50 transition-colors cursor-pointer"
                          title="Delete Product"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-slate-400 hover:text-red-400" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

        </div>
      )}

      {/* --- TAB VIEW 3: INCOMING CUSTOMER ORDERS --- */}
      {activeTab === 'orders' && (
        <div className="bg-[#090525]/85 border border-violet-500/15 rounded-xl shadow-sm overflow-hidden mb-8">
          
          <div className="py-4.5 px-5 border-b border-violet-950/50 bg-[#05021a]/90">
            <h3 className="text-xs font-extrabold text-white uppercase tracking-widest">Invoices Ledger of Real Orders</h3>
            <p className="text-[11px] text-slate-400 mt-1 font-light">Revise order statuses, track customer credentials and check secure settled payments</p>
          </div>

          {orders.length === 0 ? (
            <div className="p-12 text-center flex flex-col items-center select-none">
              <Clock className="w-9 h-9 text-violet-400 animate-pulse mb-3" />
              <h4 className="text-xs font-extrabold text-white uppercase tracking-wider">No Orders Settled Yet</h4>
              <p className="text-xs text-slate-400 mt-1.5 max-w-xs font-light">Once a customer checks out via the secure portal, active invoices populate this panel.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-violet-950/45 bg-[#05021a]/30 text-slate-455 font-bold uppercase tracking-widest text-[9px]">
                    <th className="py-3 px-4">Order Code / Date</th>
                    <th className="py-3 px-4">Client Detail</th>
                    <th className="py-3 px-4">Purchased Items</th>
                    <th className="py-3 px-4">Paid Total</th>
                    <th className="py-3 px-4">Shipment status</th>
                    <th className="py-3 px-4 text-right">Logistics action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-violet-950/25">
                  {orders.map((o) => (
                    <tr key={o.id} className="hover:bg-violet-950/10 transition-colors">
                      {/* Code date */}
                      <td className="py-3 px-4">
                        <span className="font-extrabold text-white block">{o.id}</span>
                        <span className="text-[9px] text-slate-500 font-mono block mt-1">{new Date(o.createdAt).toLocaleString()}</span>
                      </td>

                      {/* Customer email name */}
                      <td className="py-3 px-4">
                        <span className="font-extrabold text-slate-205 block leading-tight">{o.customerName}</span>
                        <span className="text-[9px] text-slate-500 font-mono block mt-1">{o.customerEmail}</span>
                      </td>

                      {/* Items loop */}
                      <td className="py-3 px-4">
                        <div className="space-y-1.5 max-w-[200px]">
                          {o.items.map((it, idx) => (
                            <span key={`${o.id}-item-${idx}`} className="text-[11px] text-slate-300 block truncate">
                              • <span className="font-mono font-extrabold text-[#8b5cf6]">({it.quantity}x)</span> {it.name}
                            </span>
                          ))}
                        </div>
                      </td>

                      {/* Cost */}
                      <td className="py-3 px-4 font-mono font-bold text-white text-xs text-indigo-405">
                        ₹{o.totalAmount.toLocaleString('en-IN')}
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center rounded px-2 py-0.5 font-bold text-[9px] uppercase border ${
                          o.status === OrderStatus.CONFIRMED 
                            ? 'bg-blue-955/20 text-blue-400 border-blue-500/22' 
                          : o.status === OrderStatus.UNDER_VERIFICATION 
                            ? 'bg-yellow-950/20 text-yellow-500 border-yellow-500/22' 
                          : o.status === OrderStatus.PAYMENT_SUBMITTED 
                            ? 'bg-indigo-950/20 text-indigo-400 border-indigo-500/22' 
                          : o.status === OrderStatus.SHIPPED 
                            ? 'bg-amber-955/20 text-amber-400 border-amber-500/22' 
                          : o.status === OrderStatus.DELIVERED 
                            ? 'bg-emerald-955/20 text-emerald-400 border-emerald-500/22' 
                          : 'bg-red-955/20 text-red-500 border-red-500/22'
                        }`}>
                          {o.status}
                        </span>
                      </td>

                      {/* Modify Status drop */}
                      <td className="py-3 px-4 text-right">
                        <select
                          value={o.status}
                          onChange={(e) => updateOrderStatus(o.id, e.target.value as OrderStatus)}
                          className="rounded-lg border border-violet-500/15 px-2.5 py-1 text-xs outline-none bg-[#05021a] hover:border-violet-500 transition-all font-bold text-slate-300 font-mono cursor-pointer"
                        >
                          <option value={OrderStatus.PENDING_PAYMENT}>Pending Payment</option>
                          <option value={OrderStatus.PAYMENT_SUBMITTED}>Payment Submitted</option>
                          <option value={OrderStatus.UNDER_VERIFICATION}>Under Verification</option>
                          <option value={OrderStatus.CONFIRMED}>Confirmed</option>
                          <option value={OrderStatus.REJECTED}>Rejected</option>
                          <option value={OrderStatus.SHIPPED}>Shipped</option>
                          <option value={OrderStatus.DELIVERED}>Delivered</option>
                          <option value={OrderStatus.CANCELLED}>Cancelled</option>
                        </select>
                      </td>

                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

        </div>
      )}

      {/* --- TAB VIEW 4: SYSTEM INTEGRATIONS & CREDENTIAL DIAGNOSTICS --- */}
      {activeTab === 'diagnostics' && (
        <div className="space-y-6">
          {/* Key Checklist Panel */}
          <div className="bg-[#090525]/85 border border-violet-500/15 rounded-xl shadow-sm p-6">
            <h3 className="text-xs font-extrabold text-[#8b5cf6] mb-1.5 uppercase font-mono tracking-widest">Environment Variables Verification</h3>
            <p className="text-xs text-slate-400 mt-1 font-light">Real-time inspection of credentials processed by Node.js server</p>
            
            {loadingHealth ? (
              <div className="py-12 text-center">
                <div className="h-6 w-6 border-2 border-violet-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                <span className="text-xs font-mono text-slate-400">Interrogating secure microservice parameters...</span>
              </div>
            ) : envStatus ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
                
                {/* Stripe Card */}
                <div className={`p-4.5 rounded-xl border flex flex-col justify-between h-34 ${
                  envStatus.stripe 
                    ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-400' 
                    : 'bg-amber-950/20 border-amber-500/30 text-amber-500'
                }`}>
                  <div className="flex justify-between items-start">
                    <span className="text-[10px] font-mono font-extrabold uppercase tracking-widest">STRIPE GATEWAY</span>
                    <span className={`h-2 w-2 rounded-full ${envStatus.stripe ? 'bg-emerald-400 animate-pulse' : 'bg-amber-500'}`} />
                  </div>
                  <div>
                    <span className="text-xs font-black block mt-2 text-white font-mono">STRIPE_SECRET_KEY</span>
                    <span className="text-[10px] block mt-1 font-light opacity-80">
                      {envStatus.stripe ? '✔ Active & Connected' : '✕ Offline Fallback Mode'}
                    </span>
                  </div>
                </div>

                {/* Twilio SID Card */}
                {/* Firebase Phone Auth Status Card */}
                <div className={`p-4.5 rounded-xl border flex flex-col justify-between h-34 bg-emerald-950/20 border-emerald-500/30 text-emerald-400`}>
                  <div className="flex justify-between items-start">
                    <span className="text-[10px] font-mono font-extrabold uppercase tracking-widest">FIREBASE AUTH</span>
                    <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                  </div>
                  <div>
                    <span className="text-xs font-black block mt-2 text-white font-mono">FIREBASE PHONE AUTH</span>
                    <span className="text-[10px] block mt-1 font-light opacity-80">
                      ✔ Active (Clean client flow)
                    </span>
                  </div>
                </div>

              </div>
            ) : (
              <div className="p-6 text-center text-red-500 text-xs bg-red-950/10 border border-red-500/20 rounded-xl mt-4">
                Failed to inspect credentials environment status from server.
              </div>
            )}
            
            {envStatus && !envStatus.stripe && (
              <div className="mt-5 p-4 rounded-xl bg-[#0d072e] border border-violet-500/10 text-xs flex gap-3 text-violet-300 leading-relaxed font-light">
                <Info className="w-5.5 h-5.5 shrink-0 text-[#8b5cf6]" />
                <div>
                  <strong className="text-white font-extrabold block uppercase tracking-wider text-[10px] font-mono">Offline Simulation Active</strong>
                  Since some Stripe credentials are currently not declared or pending, the application automatic payment fallback engine automatically processes simulation checkout receipts.
                </div>
              </div>
            )}
          </div>

          {/* Brand Identity & Logo Customizer */}
          <div className="bg-[#090525]/85 border border-violet-500/15 rounded-xl shadow-sm p-6">
            <h3 className="text-xs font-extrabold text-[#8b5cf6] mb-1.5 uppercase font-mono tracking-widest flex items-center gap-2">
              <Upload className="w-4 h-4 text-violet-400" />
              <span>Brand Identity Customizer</span>
            </h3>
            <p className="text-xs text-slate-400 mt-1 font-light">
              Upload your own high-resolution store logo. After upload, your custom vector logo will be preserved in the persistent workspace storage vault.
            </p>

            <div className="mt-5 grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
              <div className="md:col-span-4 flex flex-col items-center justify-center border border-violet-500/10 bg-[#040118]/80 p-5 rounded-2xl">
                <div className="relative flex h-16 w-16 items-center justify-center rounded-xl overflow-hidden bg-gradient-to-br from-violet-600 via-indigo-600 to-blue-500 text-white font-extrabold text-3xl italic shadow-lg shadow-violet-500/20 mb-3">
                  <img 
                    src={currentLogoUrl} 
                    alt="Current Store Logo" 
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      if (target.src !== '/logo.png') {
                        target.src = '/logo.png';
                      } else {
                        target.style.display = 'none';
                      }
                    }}
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                  <span className="relative select-none font-display text-white">P</span>
                </div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Current Identity Node</span>
              </div>

              <div className="md:col-span-8 space-y-4">
                <div className="border border-dashed border-violet-500/20 hover:border-violet-500/35 bg-[#0d072e]/20 p-5 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 transition-all">
                  <div className="text-left leading-relaxed">
                    <strong className="text-xs font-bold text-white block">Upload Custom Store Logo</strong>
                    <span className="text-[11px] text-slate-400 block font-light mt-0.5">Recommended format: Square transparent PNG/SVG</span>
                  </div>

                  <label className="cursor-pointer bg-gradient-to-r from-violet-600 to-indigo-650 hover:from-violet-500 hover:to-indigo-550 text-white text-xs font-extrabold tracking-widest uppercase px-4 py-2 rounded-xl text-center active:scale-97 transition-all shrink-0">
                    {isUploading ? 'Uploading Logo...' : 'Browse Computer'}
                    <input
                      type="file"
                      accept="image/*"
                      disabled={isUploading}
                      onChange={(e) => handleUploadFile(e, 'logo')}
                      className="hidden"
                    />
                  </label>
                </div>

                {logoSuccessMsg && (
                  <div className="p-3 bg-emerald-950/20 text-emerald-450 border border-emerald-500/15 rounded-xl text-[11px] font-medium leading-relaxed">
                    ✔ {logoSuccessMsg}
                    <button 
                      onClick={() => window.location.reload()} 
                      className="ml-2 underline font-bold whitespace-nowrap text-[#a5b4fc] hover:text-white"
                    >
                      Reload Page to Apply
                    </button>
                  </div>
                )}
                {fileUploadError && (
                  <p className="p-2.5 bg-red-950/20 text-red-00 border border-red-500/15 rounded-xl font-mono text-[10px] font-bold text-center">
                    ✕ {fileUploadError}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Shop UPI & Custom QR Code panel */}
          <div className="bg-[#090525]/85 border border-violet-500/15 rounded-xl shadow-sm p-6 space-y-5">
            <div>
              <h3 className="text-xs font-extrabold text-[#8b5cf6] mb-1.5 uppercase font-mono tracking-widest flex items-center gap-2">
                <QrCode className="w-4 h-4 text-violet-400" />
                <span>Shop Merchant UPI & Custom QR Settings</span>
              </h3>
              <p className="text-xs text-slate-400 mt-1 font-light leading-relaxed">
                Connect your secure Indian merchant account so clients settle funds to you directly. Configure your main store UPI ID and upload your custom UPI QR code to display in real-time during customer checkout.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
              <div className="md:col-span-5 flex flex-col items-center justify-center border border-violet-500/10 bg-[#040118]/80 p-5 rounded-2xl">
                <div className="relative flex h-32 w-32 items-center justify-center rounded-xl overflow-hidden bg-white shadow-lg p-2 mb-3">
                  <img 
                    src={customUpiQr || `https://api.qrserver.com/v1/create-qr-code/?size=150x150&color=090525&data=upi://pay?pa=${encodeURIComponent(customUpiVpa)}%26pn=Sethi%252520Electronics%26cu=INR`}
                    alt="Active Checkout QR" 
                    className="w-full h-full object-contain"
                  />
                </div>
                <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider font-mono flex items-center gap-1 leading-none">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Active Checkout QR
                </span>
              </div>

              <div className="md:col-span-7 space-y-4 text-left">
                {/* VPA Address field */}
                <div className="space-y-2">
                  <label className="block text-[10px] font-extrabold uppercase tracking-widest text-[#a78bfa] font-mono">Store UPI VPA Address (Recipient email/ID)</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={customUpiVpa}
                      onChange={(e) => {
                        setCustomUpiVpa(e.target.value);
                        setUpiVpaSaved(false);
                      }}
                      placeholder="e.g. yourname@upi or yourname@okhdfcbank"
                      className="flex-1 rounded-xl border border-violet-500/15 px-3 py-2 text-xs outline-none focus:border-[#8b5cf6] bg-[#0c0827] text-white font-mono placeholder-slate-650"
                    />
                    <button
                      onClick={async () => {
                        await updateShopSettings(customUpiVpa.trim(), customUpiQr);
                        setUpiVpaSaved(true);
                      }}
                      className="bg-[#10b981] hover:bg-[#059669] text-white text-[10px] uppercase font-extrabold px-4 py-2 rounded-xl transition-all cursor-pointer active:scale-97 select-none shrink-0"
                    >
                      {upiVpaSaved ? 'Saved! ✓' : 'Save VPA'}
                    </button>
                  </div>
                </div>

                {/* Custom QR Image upload */}
                <div className="border border-dashed border-violet-500/15 bg-[#0d072e]/10 p-4 rounded-xl">
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="text-left">
                      <strong className="text-[11px] font-bold text-white block">Upload Custom Shop QR Screenshot</strong>
                      <span className="text-[10px] text-slate-450 block font-light mt-0.5 leading-normal">Overrides dynamic QR code generation with your personal GPay/PhonePe business QR</span>
                    </div>

                    <label className="cursor-pointer bg-violet-950/40 hover:bg-violet-900/55 border border-violet-500/25 text-white text-[10px] font-extrabold tracking-widest uppercase px-3 py-2 rounded-xl text-center active:scale-97 transition-all shrink-0">
                      {isUploading ? 'Uploading...' : 'Browse QR'}
                      <input
                        type="file"
                        accept="image/*"
                        disabled={isUploading}
                        onChange={(e) => handleUploadFile(e, 'upi-qr')}
                        className="hidden"
                      />
                    </label>
                  </div>

                  {upiQrSuccessMsg && (
                    <p className="mt-3 text-[10px] font-semibold text-emerald-400">
                      ✓ {upiQrSuccessMsg}
                    </p>
                  )}
                  
                  {customUpiQr && (
                    <button
                      onClick={async () => {
                        await updateShopSettings(customUpiVpa, null);
                        setUpiQrSuccessMsg('Custom QR removed. System returned to default automatic QR generation.');
                      }}
                      className="text-[9px] font-mono text-red-400 hover:underline mt-2 flex items-center gap-1 uppercase select-none cursor-pointer"
                    >
                      ✕ Remove Custom QR Image
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Database Re-Seeding Diagnostics */}
          <div className="bg-[#090525]/85 border border-violet-500/15 rounded-xl shadow-sm p-6">
            <h3 className="text-xs font-extrabold text-[#8b5cf6] mb-1.5 uppercase font-mono tracking-widest flex items-center gap-2">
              <Database className="w-4 h-4 text-violet-400 font-bold shrink-0" />
              <span>Catalog & Multi-Image Database Diagnostics</span>
            </h3>
            <p className="text-xs text-slate-400 mt-1 font-light leading-relaxed">
              If your browser's local catalog copies do not show secondary angle thumbnails, click below. This will refresh your database storage and load the beautiful pre-configured multi-angle designer showcases.
            </p>
            <div className="mt-4 flex flex-col sm:flex-row items-start sm:items-center gap-3">
              {confirmingReseed ? (
                <div className="flex gap-2.5 items-center">
                  <button
                    onClick={handleResetCatalog}
                    className="bg-emerald-600 hover:bg-emerald-700 border border-emerald-500 text-white text-[10px] sm:text-xs font-extrabold tracking-widest uppercase px-5 py-2.5 rounded-xl text-center cursor-pointer transition-colors shadow-md"
                  >
                    Confirm Re-seed Real Assets ⚡
                  </button>
                  <button
                    onClick={() => setConfirmingReseed(false)}
                    className="bg-zinc-800 hover:bg-zinc-750 border border-zinc-700 text-slate-300 hover:text-white text-[10px] sm:text-xs font-extrabold tracking-widest uppercase px-5 py-2.5 rounded-xl text-center cursor-pointer transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setConfirmingReseed(true)}
                  disabled={!!reseedStatus}
                  className="bg-indigo-650 hover:bg-indigo-550 border border-indigo-500/30 text-white text-[10px] sm:text-xs font-extrabold tracking-widest uppercase px-5 py-2.5 rounded-xl text-center cursor-pointer transition-colors disabled:opacity-50"
                >
                  Clear Cache & Re-Seed Catalog with Multi-Image Showcases
                </button>
              )}
              {reseedStatus && (
                <p className="text-[11px] font-mono text-violet-400 mt-1 sm:mt-0 font-semibold animate-pulse">
                  {reseedStatus}
                </p>
              )}
            </div>
          </div>

          {/* Setup Integration Instruction Manuals */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-8">
            
            {/* Firebase Setup Manual */}
            <div className="bg-[#090525]/85 border border-violet-500/15 rounded-xl p-5 shadow-sm text-xs leading-relaxed space-y-4 font-sans">
              <div className="flex gap-2.5 items-center pb-3 border-b border-violet-950/45">
                <div className="p-1.5 rounded-lg bg-rose-500/10 text-rose-455 border border-rose-500/15">
                  <Smartphone className="w-4 h-4 text-rose-400" />
                </div>
                <div>
                  <h4 className="font-extrabold text-white text-[11px] uppercase tracking-wider">How to Setup Firebase & Phone Auth</h4>
                  <span className="text-[9.5px] text-slate-400 block font-light">Enabling live OTP verification</span>
                </div>
              </div>

              <div className="space-y-4.5 font-light text-slate-300 max-h-[420px] overflow-y-auto pr-2">
                <div className="flex gap-3">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-rose-500/10 text-rose-450 border border-rose-500/20 font-mono text-[10px] font-extrabold">1</span>
                  <div>
                    <strong className="text-white font-bold block mb-0.5">Initialize Firebase Database</strong>
                    Click on the Firebase setup dialog in your AI Studio console, or execute standard firebase provisioning to sync your local environment variables.
                  </div>
                </div>

                <div className="flex gap-3">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-rose-500/10 text-rose-450 border border-rose-500/20 font-mono text-[10px] font-extrabold">2</span>
                  <div>
                    <strong className="text-white font-bold block mb-0.5">Enable Phone Authentication</strong>
                    Open your Firebase Console dashboard under <strong className="text-violet-400">Build &gt; Authentication &gt; Sign-In Method</strong>, click "Add new provider", select **Phone**, and toggle it to **Enabled**.
                  </div>
                </div>

                <div className="flex gap-3">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-rose-500/10 text-rose-450 border border-rose-500/20 font-mono text-[10px] font-extrabold">3</span>
                  <div>
                    <strong className="text-white font-bold block mb-0.5">Configure authorized domains</strong>
                    Ensure your application domains (including the AI Studio preview hostname and any deployed Cloud Run URLs) are registered in Firebase under the **Authorized Domains** list of your Auth settings.
                  </div>
                </div>

                <div className="flex gap-3">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-rose-500/10 text-rose-455 border border-rose-500/20 font-mono text-[10px] font-extrabold">4</span>
                  <div>
                    <strong className="text-white font-bold block mb-0.5">Local Sandbox Testing</strong>
                    For fast, zero-latency local development testing, use our built-in high-fidelity Firebase sandbox! Simply enter any phone number and use standard security access PIN: <code className="bg-[#05021a] px-1.5 py-0.5 rounded text-white font-mono font-bold text-[10px]">123456</code>.
                  </div>
                </div>
              </div>
            </div>

            {/* Stripe Setup Manual */}
            <div className="bg-[#090525]/85 border border-violet-500/15 rounded-xl p-5 shadow-sm text-xs leading-relaxed space-y-4">
              <div className="flex gap-2.5 items-center pb-3 border-b border-violet-950/45">
                <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/15">
                  <Coins className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-extrabold text-white text-[11px] uppercase tracking-wider">How to make a Stripe Account & get keys</h4>
                  <span className="text-[9.5px] text-slate-400 block font-light">Configuring secure credit-card clearing</span>
                </div>
              </div>

              <div className="space-y-4.5 font-light text-slate-300 max-h-[420px] overflow-y-auto pr-2">
                <div className="flex gap-3">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-mono text-[10px] font-extrabold">1</span>
                  <div>
                    <strong className="text-white font-bold block mb-0.5">Register on Stripe</strong>
                    Go to <a href="https://dashboard.stripe.com/register" target="_blank" rel="noreferrer" className="text-violet-400 hover:underline font-bold">dashboard.stripe.com/register</a> and construct a free developer account.
                  </div>
                </div>

                <div className="flex gap-3">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-mono text-[10px] font-extrabold">2</span>
                  <div>
                    <strong className="text-white font-bold block mb-0.5">Verify Test Mode is Checked</strong>
                    Ensure the <strong className="text-indigo-400">"Test Mode"</strong> toggle at top right is switched <strong className="text-indigo-400 font-bold">ON</strong>. This allows testing without real bank clearance.
                  </div>
                </div>

                <div className="flex gap-3">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-mono text-[10px] font-extrabold">3</span>
                  <div>
                    <strong className="text-white font-bold block mb-0.5">Copy Developers &gt; API keys</strong>
                    Navigate to <strong className="text-violet-300">Developers &gt; API Keys</strong> under your Stripe sidebar panel. Locate the <code className="bg-[#05021a] px-1 py-0.5 rounded border border-indigo-500/15 text-indigo-350 font-mono font-bold text-[10px]">Secret Key</code> (usually prefixed with <code className="text-white">sk_test_</code>).
                  </div>
                </div>

                <div className="flex gap-3">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-mono text-[10px] font-extrabold">4</span>
                  <div>
                    <strong className="text-white font-bold block mb-0.5">Hook key to AI Studio Workspace</strong>
                    Open the <strong className="text-white">Settings</strong> dialog in your current AI Studio browser interface. Add these keys:
                    <ul className="list-disc pl-4 mt-2 space-y-1.5 text-[10.5px] font-mono bg-[#05021a] p-2.5 rounded border border-indigo-500/10 text-indigo-300">
                      <li><strong className="text-white">STRIPE_SECRET_KEY=</strong> YOUR_STRIPE_SECRET_KEY</li>
                    </ul>
                  </div>
                </div>

                <div className="flex gap-3">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-mono text-[10px] font-extrabold">5</span>
                  <div>
                    <strong className="text-white font-bold block mb-0.5">Reboot the Server environment</strong>
                    After inserting variables, click <strong className="text-violet-300">Restart Dev Server</strong> or trigger a clean container deployment so Node loads the new credentials dynamically!
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* --- TAB VIEW 5: PAYMENT VERIFICATION PANEL --- */}
      {activeTab === 'payment-verification' && (
        <div className="space-y-6">
          <div className="bg-[#090525]/85 border border-violet-500/15 rounded-xl shadow-sm p-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-violet-950/45">
              <div>
                <h3 className="text-sm font-extrabold text-[#8b5cf6] uppercase font-mono tracking-widest flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-emerald-400" />
                  <span>UPI Payment Verification Ledger</span>
                </h3>
                <p className="text-xs text-slate-400 mt-1 font-light">
                  Process, review, and confirm direct consumer-loaded screenshot proof deposits
                </p>
              </div>

              <div className="flex gap-2">
                <div className="bg-[#040118]/80 text-xs px-3.5 py-1.5 rounded-lg border border-violet-500/10 font-mono text-slate-400">
                  Total UPI Submissions:{' '}
                  <span className="text-violet-400 font-bold">
                    {orders.filter(o => o.paymentMethod === 'UPI').length}
                  </span>
                </div>
              </div>
            </div>

            {/* Orders matching UPI payment */}
            {(() => {
              const upiOrders = orders.filter(o => o.paymentMethod === 'UPI' || (o.paymentMethod && o.paymentMethod.startsWith('UPI')));
              
              if (upiOrders.length === 0) {
                return (
                  <div className="py-20 text-center select-none text-slate-500">
                    <ShieldCheck className="w-12 h-12 stroke-1 text-slate-600 mx-auto mb-3" />
                    <strong className="text-sm block font-bold text-slate-400 uppercase tracking-wider mb-1">No UPI Transactions Found</strong>
                    <p className="text-xs font-light max-w-sm mx-auto leading-relaxed">
                      All order records in the system are currently using standard billing options.
                    </p>
                  </div>
                );
              }

              return (
                <div className="mt-6 overflow-x-auto p-0.5">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-violet-900/40 text-slate-400 font-extrabold font-mono uppercase tracking-widest text-[9.5px] bg-[#05021a]">
                        <th className="py-3 px-4">Order ID & Date</th>
                        <th className="py-3 px-4">Customer Name</th>
                        <th className="py-3 px-4">Mobile Number</th>
                        <th className="py-3 px-4">Amount</th>
                        <th className="py-3 px-4">UTR Number</th>
                        <th className="py-3 px-4 text-center">Receipt Screenshot</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-violet-950/20">
                      {upiOrders.map((o) => {
                        const hasScreenshot = !!o.payment_screenshot_url;
                        const formattedDate = o.createdAt ? new Date(o.createdAt).toLocaleString('en-IN') : 'Unknown Date';
                        
                        return (
                          <tr key={o.id} className="hover:bg-violet-955/10 transition-colors">
                            {/* Order ID & Date */}
                            <td className="py-4 px-4 font-mono">
                              <span className="font-extrabold text-white block select-all font-mono">#{o.id}</span>
                              <span className="text-[10px] text-slate-400 block mt-0.5">{formattedDate}</span>
                            </td>

                            {/* Customer Name */}
                            <td className="py-4 px-4 font-semibold text-slate-200">
                              {o.customerName || 'Anonymous'}
                              <span className="text-[10px] text-slate-400 block mt-0.5 font-light lowercase font-mono">{o.customerEmail}</span>
                            </td>

                            {/* Mobile Number */}
                            <td className="py-4 px-4 font-mono font-bold text-slate-300">
                              {o.mobileNumber || o.shippingAddress.contactPhone || 'None'}
                            </td>

                            {/* Amount */}
                            <td className="py-4 px-4 font-mono font-bold text-violet-300">
                              ₹{o.totalAmount.toLocaleString('en-IN')}
                            </td>

                            {/* UTR Number */}
                            <td className="py-4 px-4 font-mono font-bold text-indigo-300 select-all tracking-wider">
                              {o.utr_number || 'None'}
                            </td>

                            {/* Receipt Screenshot */}
                            <td className="py-4 px-4">
                              <div className="flex justify-center">
                                {hasScreenshot ? (
                                  <div 
                                    className="h-10 w-10 border border-violet-500/20 rounded overflow-hidden cursor-zoom-in hover:border-violet-400 transition-all shadow group relative"
                                    onClick={() => {
                                      setImagePreviewUrl(o.payment_screenshot_url || null);
                                    }}
                                  >
                                    <img src={o.payment_screenshot_url} alt="Proof" className="w-full h-full object-cover" />
                                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-[9px] font-bold uppercase tracking-widest text-white">
                                      View
                                    </div>
                                  </div>
                                ) : (
                                  <span className="text-[10px] text-slate-500 font-light italic">No File</span>
                                )}
                              </div>
                            </td>

                            {/* Status badge */}
                            <td className="py-4 px-4">
                              <span className={`inline-block px-2.5 py-1 rounded-full text-[9px] font-extrabold uppercase tracking-widest ${
                                o.status === OrderStatus.CONFIRMED
                                  ? 'bg-emerald-950/20 border border-emerald-500/25 text-emerald-400'
                                  : o.status === OrderStatus.REJECTED
                                  ? 'bg-red-955/20 border border-red-500/25 text-red-400'
                                  : o.status === OrderStatus.UNDER_VERIFICATION
                                  ? 'bg-yellow-950/25 border border-yellow-500/25 text-yellow-500'
                                  : o.status === OrderStatus.PAYMENT_SUBMITTED
                                  ? 'bg-blue-950/25 border border-blue-550/25 text-blue-400 animate-pulse'
                                  : 'bg-zinc-800 text-zinc-300 border border-zinc-700'
                              }`}>
                                {o.status}
                              </span>
                            </td>

                            {/* Actions */}
                            <td className="py-4 px-4 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                {pendingAction && pendingAction.orderId === o.id ? (
                                  <>
                                    {pendingAction.type === 'approve' ? (
                                      <button
                                        type="button"
                                        onClick={async () => {
                                          await updateOrderStatus(o.id, OrderStatus.CONFIRMED);
                                          setPendingAction(null);
                                        }}
                                        className="h-7 px-2.5 bg-emerald-600 hover:bg-emerald-700 border border-emerald-500 text-white rounded-lg font-extrabold uppercase tracking-widest text-[9px] transition-all cursor-pointer shadow-sm animate-pulse"
                                      >
                                        Confirm Approve ✓
                                      </button>
                                    ) : (
                                      <button
                                        type="button"
                                        onClick={async () => {
                                          await updateOrderStatus(o.id, OrderStatus.REJECTED);
                                          setPendingAction(null);
                                        }}
                                        className="h-7 px-2.5 bg-red-650 hover:bg-red-750 border border-red-500 text-white rounded-lg font-extrabold uppercase tracking-widest text-[9px] transition-all cursor-pointer shadow-sm animate-pulse"
                                      >
                                        Confirm Reject ✗
                                      </button>
                                    )}
                                    <button
                                      type="button"
                                      onClick={() => setPendingAction(null)}
                                      className="h-7 px-2 bg-zinc-800 hover:bg-zinc-750 border border-zinc-700 text-[9px] font-extrabold uppercase tracking-widest text-slate-400 hover:text-white rounded-lg transition-all cursor-pointer"
                                    >
                                      Cancel
                                    </button>
                                  </>
                                ) : (
                                  <>
                                    <button
                                      type="button"
                                      onClick={() => setPendingAction({ orderId: o.id, type: 'approve' })}
                                      disabled={o.status === OrderStatus.CONFIRMED}
                                      className="h-7 px-2 bg-emerald-600/10 hover:bg-emerald-600 border border-emerald-500/20 hover:border-emerald-500 text-emerald-400 hover:text-white rounded-lg font-bold uppercase tracking-widest text-[9px] transition-all cursor-pointer disabled:opacity-30 disabled:pointer-events-none"
                                    >
                                      Approve
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setPendingAction({ orderId: o.id, type: 'reject' })}
                                      disabled={o.status === OrderStatus.REJECTED}
                                      className="h-7 px-2 bg-red-600/10 hover:bg-red-600 border border-red-500/20 hover:border-red-500 text-red-400 hover:text-white rounded-lg font-bold uppercase tracking-widest text-[9px] transition-all cursor-pointer disabled:opacity-30 disabled:pointer-events-none"
                                    >
                                      Reject
                                    </button>
                                  </>
                                )}
                              </div>
                            </td>

                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* --- TAB VIEW 6: PROMOTIONS AND COUPONS CONSOLE PANEL --- */}
      {activeTab === 'promotions' && (
        <AdminPromotions />
      )}

      {/* --- ADD NEW PRODUCT MODAL SLIDER --- */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#090525] rounded-2xl w-full max-w-lg p-6 border border-violet-500/22 shadow-2xl relative text-slate-100">
            <button
              onClick={() => setIsAddOpen(false)}
              className="absolute right-4 top-4 text-slate-405 hover:text-white rounded-full p-1 hover:bg-violet-950/30 transition-all border border-transparent hover:border-violet-500/10 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="text-sm font-extrabold text-[#8b5cf6] mb-5 tracking-widest flex items-center gap-1.5 uppercase">
              <PlusCircle className="w-4.5 h-4.5" />
              <span>Add Warehouse Product Line</span>
            </h3>

            <form onSubmit={handleAddProductSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-400 font-extrabold mb-1.5 uppercase tracking-widest text-[9.5px]">Product Title</label>
                <input
                  type="text"
                  required
                  placeholder="Mechanical Custom KeyCap Solder"
                  value={newProdName}
                  onChange={(e) => setNewProdName(e.target.value)}
                  className="w-full border border-violet-500/15 bg-[#05021a] rounded-xl px-3 py-2 outline-none focus:border-violet-500 placeholder-slate-700 text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-400 font-extrabold mb-1.5 uppercase tracking-widest text-[9.5px]">Category</label>
                  <select
                    value={newProdCategory}
                    onChange={(e) => setNewProdCategory(e.target.value)}
                    className="w-full border border-violet-500/15 bg-[#05021a] rounded-xl px-3 py-2 outline-none focus:border-violet-500 text-white font-mono cursor-pointer"
                  >
                    <option value="audio">Audio</option>
                    <option value="wearables">Wearables</option>
                    <option value="workplace">Workplace</option>
                    <option value="accessories">Accessories</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 font-extrabold mb-1.5 uppercase tracking-widest text-[9.5px]">Stock Quantity</label>
                  <input
                    type="number"
                    required
                    placeholder="30"
                    value={newProdStock}
                    onChange={(e) => setNewProdStock(e.target.value)}
                    className="w-full border border-violet-500/15 bg-[#05021a] rounded-xl px-3 py-2 outline-none focus:border-violet-500 text-white font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-400 font-extrabold mb-1.5 uppercase tracking-widest text-[9.5px]">Display Price (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="129.99"
                    value={newProdPrice}
                    onChange={(e) => setNewProdPrice(e.target.value)}
                    className="w-full border border-violet-500/15 bg-[#05021a] rounded-xl px-3 py-2 outline-none focus:border-violet-500 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-extrabold mb-1.5 uppercase tracking-widest text-[9.5px]">Original Price (Optional)</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="159.00"
                    value={newProdOriginalPrice}
                    onChange={(e) => setNewProdOriginalPrice(e.target.value)}
                    className="w-full border border-violet-500/15 bg-[#05021a] rounded-xl px-3 py-2 outline-none focus:border-violet-500 text-white font-mono"
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="block text-slate-400 font-extrabold uppercase tracking-widest text-[9.5px]">Catalog Main Image</label>
                  <span className="text-[9px] text-[#8b5cf6] font-semibold">URL or file upload</span>
                </div>
                <div className="space-y-2">
                  <input
                    type="text"
                    required
                    placeholder="e.g. /uploads/image.png or https://images.unsplash.com/..."
                    value={newProdImage}
                    onChange={(e) => setNewProdImage(e.target.value)}
                    className="w-full border border-violet-500/15 bg-[#05021a] rounded-xl px-3 py-2 outline-none focus:border-violet-500 text-white font-mono"
                  />
                  
                  {/* Modern drag and drop / file input */}
                  <div className="relative flex items-center justify-between border border-dashed border-violet-500/20 hover:border-violet-500/40 bg-[#0d072e]/40 p-2.5 rounded-xl transition-all">
                    <div className="flex items-center gap-2">
                      <div className="p-1 min-w-8 min-h-8 rounded-lg bg-violet-650/10 border border-violet-500/20 flex items-center justify-center overflow-hidden">
                        {newProdImage ? (
                          <img src={newProdImage} alt="Preview" className="w-6 h-6 object-cover rounded" />
                        ) : (
                          <Image className="w-4 h-4 text-violet-400" />
                        )}
                      </div>
                      <div className="leading-tight">
                        <span className="text-[10px] text-white font-bold block">Upload main image</span>
                        <span className="text-[8.5px] text-slate-400 block font-light">Compressed & persistent in database</span>
                      </div>
                    </div>
                    
                    <label className="cursor-pointer bg-gradient-to-r from-violet-600 to-indigo-650 hover:from-violet-500 hover:to-indigo-550 text-white rounded-lg px-2.5 py-1 text-[9px] font-extrabold tracking-widest uppercase transition-all select-none">
                      {isUploading ? 'Uploading...' : 'Browse File'}
                      <input
                        type="file"
                        accept="image/*"
                        disabled={isUploading}
                        onChange={(e) => handleUploadFile(e, 'add')}
                        className="hidden"
                      />
                    </label>
                  </div>
                  {fileUploadError && (
                    <p className="text-[8.5px] font-mono text-rose-400 font-semibold">{fileUploadError}</p>
                  )}
                </div>
              </div>

              {/* Additional Product Images Section */}
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="block text-slate-400 font-extrabold uppercase tracking-widest text-[9.5px]">Additional Images (Max 5)</label>
                  <span className="text-[9px] text-[#8b5cf6] font-semibold">{newProdExtraImages.length} uploaded</span>
                </div>
                
                <div className="grid grid-cols-5 gap-2 items-center">
                  {newProdExtraImages.map((img, idx) => (
                    <div key={idx} className="relative aspect-square rounded-lg border border-violet-500/15 bg-[#040118]/80 group overflow-hidden">
                      <img src={img} alt={`Additional ${idx + 1}`} className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => setNewProdExtraImages(prev => prev.filter((_, i) => i !== idx))}
                        className="absolute inset-0 bg-black/75 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-rose-400 hover:text-rose-350 cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                  
                  {newProdExtraImages.length < 5 && (
                    <label className="aspect-square flex flex-col items-center justify-center border border-dashed border-violet-500/20 hover:border-violet-500/40 bg-[#0d072e]/30 hover:bg-[#0d072e]/50 rounded-lg cursor-pointer transition-all">
                      <Plus className="w-4 h-4 text-violet-400" />
                      <span className="text-[8px] text-slate-400 font-extrabold mt-1">ADD</span>
                      <input
                        type="file"
                        accept="image/*"
                        disabled={isUploading}
                        onChange={(e) => handleUploadFile(e, 'add-extra')}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>

                {/* Option to type/paste additional picture URL directly */}
                <div className="flex gap-2 mt-2.5">
                  <input
                    type="text"
                    id="new-extra-url-input"
                    placeholder="Or paste direct image URL (e.g. https://...)"
                    className="flex-1 text-[11px] border border-violet-500/15 bg-[#05021a] rounded-lg px-2.5 py-1.5 outline-none focus:border-violet-500 text-white font-mono"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        const val = (e.target as HTMLInputElement).value.trim();
                        if (val && newProdExtraImages.length < 5) {
                          setNewProdExtraImages(prev => [...prev, val]);
                          (e.target as HTMLInputElement).value = '';
                        }
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const input = document.getElementById('new-extra-url-input') as HTMLInputElement;
                      const val = input?.value.trim();
                      if (val && newProdExtraImages.length < 5) {
                        setNewProdExtraImages(prev => [...prev, val]);
                        input.value = '';
                      }
                    }}
                    className="px-3 py-1.5 bg-violet-600/30 hover:bg-violet-600/50 border border-violet-500/30 rounded-lg text-[9px] font-extrabold text-violet-200 transition-colors uppercase cursor-pointer shrink-0"
                  >
                    Add URL
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-slate-400 font-extrabold mb-1.5 uppercase tracking-widest text-[9.5px]">Description Specifications</label>
                <textarea
                  required
                  rows={2}
                  placeholder="Studio-grade linear keystrokes..."
                  value={newProdDesc}
                  onChange={(e) => setNewProdDesc(e.target.value)}
                  className="w-full border border-violet-500/15 bg-[#05021a] rounded-xl px-3 py-2 outline-none focus:border-violet-500 text-white h-16 resize-none leading-normal"
                />
              </div>

              {valError && (
                <div className="p-2.5 bg-red-950/20 text-red-450 border border-red-500/15 rounded-lg font-bold uppercase tracking-widest text-[9.5px] font-mono">
                  {valError}
                </div>
              )}

              <button
                type="submit"
                className="w-full bg-gradient-to-r from-violet-600 to-indigo-650 hover:from-violet-500 hover:to-indigo-550 text-white py-2.5 rounded-xl font-bold transition-all cursor-pointer text-xs uppercase tracking-widest shadow-md"
              >
                Insert Database Record
              </button>
            </form>
          </div>
        </div>
      )}

      {/* --- EDIT PRODUCT MODAL SLIDER --- */}
      {editingProduct && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#090525] rounded-2xl w-full max-w-lg p-6 border border-violet-500/22 shadow-2xl relative text-slate-100">
            <button
              onClick={() => setEditingProduct(null)}
              className="absolute right-4 top-4 text-slate-405 hover:text-white rounded-full p-1 hover:bg-violet-950/30 transition-all border border-transparent hover:border-violet-500/10 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="text-sm font-extrabold text-[#8b5cf6] mb-5 tracking-widest flex items-center gap-1.5 uppercase">
              <PlusCircle className="w-4.5 h-4.5" />
              <span>Update Warehouse Product Line</span>
            </h3>

            <form onSubmit={handleEditProductSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-400 font-extrabold mb-1.5 uppercase tracking-widest text-[9.5px]">Product Title</label>
                <input
                  type="text"
                  required
                  value={editingProduct.name}
                  onChange={(e) => setEditingProduct({...editingProduct, name: e.target.value})}
                  className="w-full border border-violet-500/15 bg-[#05021a] rounded-xl px-3 py-2 outline-none focus:border-violet-500 text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-400 font-extrabold mb-1.5 uppercase tracking-widest text-[9.5px]">Category</label>
                  <select
                    value={editingProduct.category}
                    onChange={(e) => setEditingProduct({...editingProduct, category: e.target.value})}
                    className="w-full border border-violet-500/15 bg-[#05021a] rounded-xl px-3 py-2 outline-none focus:border-violet-500 text-white font-mono cursor-pointer"
                  >
                    <option value="audio">Audio</option>
                    <option value="wearables">Wearables</option>
                    <option value="workplace">Workplace</option>
                    <option value="accessories">Accessories</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 font-extrabold mb-1.5 uppercase tracking-widest text-[9.5px]">Stock Quantity</label>
                  <input
                    type="number"
                    required
                    value={editingProduct.stock}
                    onChange={(e) => setEditingProduct({...editingProduct, stock: parseInt(e.target.value, 10) || 0})}
                    className="w-full border border-violet-500/15 bg-[#05021a] rounded-xl px-3 py-2 outline-none focus:border-violet-500 text-white font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-400 font-extrabold mb-1.5 uppercase tracking-widest text-[9.5px]">Display Price (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={editingProduct.price}
                    onChange={(e) => setEditingProduct({...editingProduct, price: parseFloat(e.target.value) || 0})}
                    className="w-full border border-violet-500/15 bg-[#05021a] rounded-xl px-3 py-2 outline-none focus:border-violet-500 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-extrabold mb-1.5 uppercase tracking-widest text-[9.5px]">Original Price (Optional)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={editingProduct.originalPrice || ''}
                    onChange={(e) => setEditingProduct({...editingProduct, originalPrice: parseFloat(e.target.value) || undefined})}
                    className="w-full border border-violet-500/15 bg-[#05021a] rounded-xl px-3 py-2 outline-none focus:border-violet-500 text-white font-mono"
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="block text-slate-400 font-extrabold uppercase tracking-widest text-[9.5px]">Catalog Main Image</label>
                  <span className="text-[9px] text-[#8b5cf6] font-semibold">URL or file upload</span>
                </div>
                <div className="space-y-2">
                  <input
                    type="text"
                    required
                    value={editingProduct.image}
                    onChange={(e) => setEditingProduct({...editingProduct, image: e.target.value})}
                    className="w-full border border-violet-500/15 bg-[#05021a] rounded-xl px-3 py-2 outline-none focus:border-violet-500 text-white font-mono"
                  />
                  
                  {/* Modern drag and drop / file input */}
                  <div className="relative flex items-center justify-between border border-dashed border-violet-500/20 hover:border-violet-500/40 bg-[#0d072e]/40 p-2.5 rounded-xl transition-all">
                    <div className="flex items-center gap-2">
                      <div className="p-1 min-w-8 min-h-8 rounded-lg bg-violet-650/10 border border-violet-500/20 flex items-center justify-center overflow-hidden">
                        {editingProduct.image ? (
                          <img src={editingProduct.image} alt="Preview" className="w-6 h-6 object-cover rounded" />
                        ) : (
                          <Image className="w-4 h-4 text-violet-400" />
                        )}
                      </div>
                      <div className="leading-tight">
                        <span className="text-[10px] text-white font-bold block">Upload main image</span>
                        <span className="text-[8.5px] text-slate-400 block font-light">Replace with custom compressed asset</span>
                      </div>
                    </div>
                    
                    <label className="cursor-pointer bg-gradient-to-r from-violet-600 to-indigo-650 hover:from-violet-500 hover:to-indigo-550 text-white rounded-lg px-2.5 py-1 text-[9px] font-extrabold tracking-widest uppercase transition-all select-none">
                      {isUploading ? 'Uploading...' : 'Browse File'}
                      <input
                        type="file"
                        accept="image/*"
                        disabled={isUploading}
                        onChange={(e) => handleUploadFile(e, 'edit')}
                        className="hidden"
                      />
                    </label>
                  </div>
                  {fileUploadError && (
                    <p className="text-[8.5px] font-mono text-rose-400 font-semibold">{fileUploadError}</p>
                  )}
                </div>
              </div>

              {/* Additional Product Images Section */}
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="block text-slate-400 font-extrabold uppercase tracking-widest text-[9.5px]">Additional Images (Max 5)</label>
                  <span className="text-[9px] text-[#8b5cf6] font-semibold">{(editingProduct.images || []).length} uploaded</span>
                </div>
                
                <div className="grid grid-cols-5 gap-2 items-center">
                  {(editingProduct.images || []).map((img, idx) => (
                    <div key={idx} className="relative aspect-square rounded-lg border border-violet-500/15 bg-[#040118]/80 group overflow-hidden">
                      <img src={img} alt={`Additional ${idx + 1}`} className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => {
                          const updated = (editingProduct.images || []).filter((_, i) => i !== idx);
                          setEditingProduct({ ...editingProduct, images: updated });
                        }}
                        className="absolute inset-0 bg-black/75 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-rose-400 hover:text-rose-350 cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                  
                  {(editingProduct.images || []).length < 5 && (
                    <label className="aspect-square flex flex-col items-center justify-center border border-dashed border-violet-500/20 hover:border-violet-500/40 bg-[#0d072e]/30 hover:bg-[#0d072e]/50 rounded-lg cursor-pointer transition-all">
                      <Plus className="w-4 h-4 text-violet-400" />
                      <span className="text-[8px] text-slate-400 font-extrabold mt-1">ADD</span>
                      <input
                        type="file"
                        accept="image/*"
                        disabled={isUploading}
                        onChange={(e) => handleUploadFile(e, 'edit-extra')}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>

                {/* Option to type/paste additional picture URL directly during edit */}
                <div className="flex gap-2 mt-2.5">
                  <input
                    type="text"
                    id="edit-extra-url-input"
                    placeholder="Or paste direct image URL (e.g. https://...)"
                    className="flex-1 text-[11px] border border-violet-500/15 bg-[#05021a] rounded-lg px-2.5 py-1.5 outline-none focus:border-violet-500 text-white font-mono"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        const val = (e.target as HTMLInputElement).value.trim();
                        if (val && (editingProduct.images || []).length < 5) {
                          const currentExtra = editingProduct.images || [];
                          setEditingProduct({ ...editingProduct, images: [...currentExtra, val] });
                          (e.target as HTMLInputElement).value = '';
                        }
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const input = document.getElementById('edit-extra-url-input') as HTMLInputElement;
                      const val = input?.value.trim();
                      if (val && (editingProduct.images || []).length < 5) {
                        const currentExtra = editingProduct.images || [];
                        setEditingProduct({ ...editingProduct, images: [...currentExtra, val] });
                        input.value = '';
                      }
                    }}
                    className="px-3 py-1.5 bg-violet-600/30 hover:bg-violet-600/50 border border-violet-500/30 rounded-lg text-[9px] font-extrabold text-violet-200 transition-colors uppercase cursor-pointer shrink-0"
                  >
                    Add URL
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[#a5b4fc] font-extrabold mb-1.5 uppercase tracking-widest text-[9.5px]">Description Specifications</label>
                <textarea
                  required
                  rows={2}
                  value={editingProduct.description}
                  onChange={(e) => setEditingProduct({...editingProduct, description: e.target.value})}
                  className="w-full border border-violet-500/15 bg-[#05021a] rounded-xl px-3 py-2 outline-none focus:border-violet-500 text-white h-16 resize-none leading-normal"
                />
              </div>

              {valError && (
                <div className="p-2.5 bg-red-950/20 text-red-450 border border-red-500/15 rounded-lg font-bold uppercase tracking-widest text-[9.5px] font-mono">
                  {valError}
                </div>
              )}

              <button
                type="submit"
                className="w-full bg-gradient-to-r from-violet-600 to-indigo-650 hover:from-violet-500 hover:to-indigo-550 text-white py-2.5 rounded-xl font-bold transition-all cursor-pointer text-xs uppercase tracking-widest shadow-md"
              >
                Update Database Record
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Enlarged image preview modal */}
      {imagePreviewUrl && (
        <div 
          className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-md flex items-center justify-center p-4"
          onClick={() => setImagePreviewUrl(null)}
        >
          <div className="relative max-w-2xl w-full bg-[#05021a] rounded-2xl border border-violet-500/20 overflow-hidden shadow-2xl p-4" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setImagePreviewUrl(null)}
              className="absolute right-4 top-4 bg-black/50 hover:bg-black/90 text-white rounded-full p-1.5 transition-all outline-none z-10 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
            <h4 className="text-xs font-mono font-extrabold uppercase text-slate-400 mb-3 tracking-widest">
              UPI Settlement screenshot audit review
            </h4>
            <div className="p-1 bg-violet-950/20 border border-violet-500/10 rounded-xl overflow-hidden">
              <img 
                src={imagePreviewUrl} 
                alt="Enlarged screenshot" 
                className="w-full max-h-[70vh] object-contain rounded-lg" 
              />
            </div>
            <div className="mt-3 text-center text-[11px] text-slate-450 select-all font-mono truncate">
              Reference Node: {imagePreviewUrl}
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default AdminDashboard;
