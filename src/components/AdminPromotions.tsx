import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Coupon, CarouselSlide, PromoMessage } from '../types';
import { 
  Tag, 
  Percent, 
  Plus, 
  Trash2, 
  Edit, 
  Save, 
  RefreshCcw, 
  Check, 
  X, 
  Sparkles, 
  Smartphone, 
  Image as ImageIcon, 
  Heart, 
  VolumeX, 
  Compass, 
  Tv, 
  MessageSquare,
  Gift,
  Truck,
  Cpu,
  Headphones,
  Watch,
  BookOpen,
  PlusCircle
} from 'lucide-react';

// Preset lists for icons, background gradients, and mock products to make slide creation a breeze
const PRESET_ICONS = ['Tag', 'Percent', 'Sparkles', 'Gift', 'Truck', 'Cpu', 'Headphones', 'Watch', 'Compass', 'Tv', 'Heart', 'BookOpen'];

const PRESET_GRADIENTS = [
  { name: 'Cosmic Indigo', value: 'from-[#110c37]/90 via-[#0d072c]/90 to-[#030014]/95' },
  { name: 'Midnight Azure', value: 'from-[#08123b]/90 via-[#060a28]/90 to-[#030014]/95' },
  { name: 'Abyssal Amethyst', value: 'from-[#1a0c3a]/90 via-[#0b0625]/90 to-[#030014]/95' },
  { name: 'Obsidian Crimson', value: 'from-[#2e081c]/90 via-[#10030a]/90 to-[#030014]/95' },
  { name: 'Deep Space Teal', value: 'from-[#021c1e]/90 via-[#000b0d]/90 to-[#030014]/95' },
];

const PRESET_ACCENTS = [
  { name: 'Vibrant Amethyst', value: 'border-violet-500/30 text-violet-400' },
  { name: 'Electric Neptune', value: 'border-blue-500/30 text-blue-400' },
  { name: 'Solar Aurora', value: 'border-emerald-500/30 text-emerald-400' },
  { name: 'Atmospheric Sunset', value: 'border-rose-500/30 text-rose-400' },
];

export const AdminPromotions: React.FC = () => {
  const {
    coupons,
    carouselSlides,
    promoMessages,
    saveCoupon,
    deleteCoupon,
    resetCoupons,
    saveCarouselSlide,
    deleteCarouselSlide,
    resetCarouselSlides,
    savePromoMessage,
    deletePromoMessage,
    resetPromoMessages
  } = useApp();

  const [activeSubTab, setActiveSubTab] = useState<'coupons' | 'carousel' | 'banners'>('coupons');
  const [msgNotice, setMsgNotice] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Form states
  const [newCoupon, setNewCoupon] = useState<Partial<Coupon>>({
    code: '',
    value: 10,
    type: 'percent',
    minSpend: 0,
    isActive: true
  });
  const [editingCouponId, setEditingCouponId] = useState<string | null>(null);

  const [newSlide, setNewSlide] = useState<Partial<CarouselSlide>>({
    badge: 'NEW ARRIVAL // LIMITED DEAL',
    title: '',
    subtitle: '',
    description: '',
    price: '₹9,999',
    originalPrice: '₹12,999',
    code: 'WELCOME10',
    image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&q=80&w=1200',
    iconName: 'Sparkles',
    gradient: 'from-[#110c37]/90 via-[#0d072c]/90 to-[#030014]/95',
    accentColor: 'border-violet-500/30 text-violet-400'
  });
  const [editingSlideId, setEditingSlideId] = useState<string | null>(null);

  const [newBanner, setNewBanner] = useState<Partial<PromoMessage>>({
    iconName: 'Sparkles',
    highlightText: 'FLASH SPECIAL',
    regularText: 'Get direct priority delivery and premium secure support with checkout.',
    codeToCopy: ''
  });
  const [editingBannerId, setEditingBannerId] = useState<string | null>(null);

  const showNotice = (text: string, type: 'success' | 'error' = 'success') => {
    setMsgNotice({ text, type });
    setTimeout(() => setMsgNotice(null), 3500);
  };

  const [isUploading, setIsUploading] = useState(false);
  const [fileUploadError, setFileUploadError] = useState<string | null>(null);

  const compressImage = (file: File, maxWidth = 800, maxHeight = 800): Promise<string> => {
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

  const handleUploadCarouselImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setFileUploadError(null);

    try {
      const base64 = await compressImage(file, 800, 800);
      const filename = `carousel_${Date.now()}_${file.name.replace(/\s+/g, '_')}`;

      await fetch('/api/upload-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          imageName: filename,
          base64Data: base64
        })
      }).catch((err) => {
        console.warn('Silent fallback: saved to database directly', err);
      });

      setNewSlide(prev => ({ ...prev, image: base64 }));
      showNotice('Carousel poster uploaded successfully!');
    } catch (err: any) {
      console.error(err);
      setFileUploadError(err.message || 'Image upload/compression failed.');
      showNotice('Image upload failed', 'error');
    } finally {
      setIsUploading(false);
    }
  };

  // --- COUPONS CRUD HANDLERS ---
  const handleCreateCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCoupon.code) {
      showNotice('Please provide a valid alphanumeric code', 'error');
      return;
    }
    try {
      const codeUpper = newCoupon.code.trim().toUpperCase();
      const updatedCoupon: Coupon = {
        id: `coupon-${Date.now()}`,
        code: codeUpper,
        value: Number(newCoupon.value || 0),
        type: newCoupon.type as 'percent' | 'flat',
        minSpend: Number(newCoupon.minSpend || 0),
        description: `${newCoupon.type === 'percent' ? `${newCoupon.value}%` : `₹${newCoupon.value}`} Off dynamic discount code`,
        isActive: newCoupon.isActive !== false,
        createdAt: new Date().toISOString()
      };
      await saveCoupon(updatedCoupon);
      setNewCoupon({ code: '', value: 10, type: 'percent', minSpend: 0, isActive: true });
      showNotice(`Coupon ${codeUpper} created successfully!`);
    } catch (err) {
      showNotice('Failed to write coupon to database', 'error');
    }
  };

  const handleToggleCouponActive = async (c: Coupon) => {
    try {
      await saveCoupon({ ...c, isActive: !c.isActive });
      showNotice(`Coupon ${c.code} status corrected!`);
    } catch {
      showNotice('Failed updating coupon status', 'error');
    }
  };

  const handleDeleteCouponClick = async (id: string) => {
    if (confirm('Are you sure you want to remove this Coupon code?')) {
      try {
        await deleteCoupon(id);
        showNotice('Coupon deleted successfully');
      } catch {
        showNotice('Could not complete deletion', 'error');
      }
    }
  };

  const handleResetCouponsClick = async () => {
    if (confirm('Reset coupons to system default codes? This will replace current custom overrides.')) {
      try {
        await resetCoupons();
        showNotice('Coupons state successfully restored to system default values!');
      } catch {
        showNotice('Failed to reseed default coupons', 'error');
      }
    }
  };

  // --- CAROUSEL SLIDES HANDLERS ---
  const handleCreateSlide = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSlide.title || !newSlide.subtitle) {
      showNotice('Please complete Title, Subtitle and Description fields', 'error');
      return;
    }
    try {
      const slideId = editingSlideId || `slide-${Date.now()}`;
      const slideObj: CarouselSlide = {
        id: slideId,
        badge: newSlide.badge || 'PROMO SPECIAL // DEAL',
        title: newSlide.title,
        subtitle: newSlide.subtitle,
        description: newSlide.description || '',
        price: newSlide.price || '₹0',
        originalPrice: newSlide.originalPrice || '₹0',
        code: (newSlide.code || '').trim().toUpperCase(),
        image: newSlide.image || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&q=80&w=1200',
        iconName: newSlide.iconName || 'Sparkles',
        gradient: newSlide.gradient || PRESET_GRADIENTS[0].value,
        accentColor: newSlide.accentColor || PRESET_ACCENTS[0].value
      };
      await saveCarouselSlide(slideObj);
      setNewSlide({
        badge: 'NEW ARRIVAL // LIMITED DEAL',
        title: '',
        subtitle: '',
        description: '',
        price: '₹9,999',
        originalPrice: '₹12,999',
        code: 'WELCOME10',
        image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&q=80&w=1200',
        iconName: 'Sparkles',
        gradient: 'from-[#110c37]/90 via-[#0d072c]/90 to-[#030014]/95',
        accentColor: 'border-violet-500/30 text-violet-400'
      });
      setEditingSlideId(null);
      showNotice(editingSlideId ? 'Carousel slide updated!' : 'Carousel slide added successfully!');
    } catch {
      showNotice('Could not save carousel slide', 'error');
    }
  };

  const handleEditSlideClick = (slide: CarouselSlide) => {
    setEditingSlideId(slide.id);
    setNewSlide(slide);
    // Smooth scroll up to form
    const element = document.getElementById('slide-form-head');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleDeleteSlideClick = async (id: string) => {
    if (confirm('Are you sure you want to delete this dynamic slide?')) {
      try {
        await deleteCarouselSlide(id);
        showNotice('Slide removed from display ticker!');
      } catch {
        showNotice('Could not delete slide', 'error');
      }
    }
  };

  const handleResetSlidesClick = async () => {
    if (confirm('Reseed and reset the Home Carousel slides to our system showcase defaults?')) {
      try {
        await resetCarouselSlides();
        showNotice('Carousel restored to default premium sliders.');
      } catch {
        showNotice('Reseed failed', 'error');
      }
    }
  };

  // --- PROMO MESSAGES (BANNERS) HANDLERS ---
  const handleCreateBanner = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBanner.highlightText || !newBanner.regularText) {
      showNotice('Please complete Highlight Badge text and Description text', 'error');
      return;
    }
    try {
      const bannerId = editingBannerId || `banner-${Date.now()}`;
      const msgObj: PromoMessage = {
        id: bannerId,
        iconName: newBanner.iconName || 'Sparkles',
        highlightText: newBanner.highlightText.trim().toUpperCase(),
        regularText: newBanner.regularText,
        codeToCopy: (newBanner.codeToCopy || '').trim().toUpperCase() || undefined
      };
      await savePromoMessage(msgObj);
      setNewBanner({
        iconName: 'Sparkles',
        highlightText: 'FLASH SPECIAL',
        regularText: 'Get direct priority delivery and premium secure support with checkout.',
        codeToCopy: ''
      });
      setEditingBannerId(null);
      showNotice(editingBannerId ? 'Notification ticker updated!' : 'New ticker announcement added!');
    } catch {
      showNotice('Failed saving announcement', 'error');
    }
  };

  const handleEditBannerClick = (banner: PromoMessage) => {
    setEditingBannerId(banner.id);
    setNewBanner(banner);
  };

  const handleDeleteBannerClick = async (id: string) => {
    if (confirm('Confirm deleting this announcement ticker slide?')) {
      try {
        await deletePromoMessage(id);
        showNotice('Ticker message removed successfully.');
      } catch {
        showNotice('Failed deleting message', 'error');
      }
    }
  };

  const handleResetBannersClick = async () => {
    if (confirm('Restore top announcement banners to system default logs?')) {
      try {
        await resetPromoMessages();
        showNotice('Banners set successfully back to factory seeds!');
      } catch {
        showNotice('Reseed failed', 'error');
      }
    }
  };

  return (
    <div className="space-y-8 bg-[#030014]/40 border border-violet-500/10 rounded-2xl p-6 sm:p-8 backdrop-blur-md">
      {/* Tab Header with premium dynamic feedback */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-violet-500/15 pb-4 gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-violet-400 animate-pulse" />
            Dynamic Ticker & Promotions Console
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Manage coupons, interactive slideshow slides, and the top-bar notification ticker overall the website.
          </p>
        </div>

        {/* Reseed Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={
              activeSubTab === 'coupons' ? handleResetCouponsClick : 
              activeSubTab === 'carousel' ? handleResetSlidesClick : 
              handleResetBannersClick
            }
            className="inline-flex items-center gap-1.5 rounded-lg border border-violet-500/20 bg-[#0e0a30]/80 hover:bg-[#150f45] px-3.5 py-2 text-xs font-semibold text-violet-300 transition"
            title="Reset dynamic parameters to system showcase defaults"
          >
            <RefreshCcw className="w-3.5 h-3.5" />
            <span>Reset {activeSubTab}</span>
          </button>
        </div>
      </div>

      {/* Internal Subtabs Selector */}
      <div className="flex items-center gap-2 bg-[#0c082b] border border-violet-500/10 rounded-xl p-1 max-w-sm">
        <button
          onClick={() => { setActiveSubTab('coupons'); setEditingCouponId(null); }}
          className={`flex-1 text-center py-2 text-xs font-bold rounded-lg transition-all ${
            activeSubTab === 'coupons'
              ? 'bg-gradient-to-r from-violet-600 to-indigo-650 text-white shadow'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          Coupons
        </button>
        <button
          onClick={() => { setActiveSubTab('carousel'); setEditingSlideId(null); }}
          className={`flex-1 text-center py-2 text-xs font-bold rounded-lg transition-all ${
            activeSubTab === 'carousel'
              ? 'bg-gradient-to-r from-violet-600 to-indigo-650 text-white shadow'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          Carousels
        </button>
        <button
          onClick={() => { setActiveSubTab('banners'); setEditingBannerId(null); }}
          className={`flex-1 text-center py-2 text-xs font-bold rounded-lg transition-all ${
            activeSubTab === 'banners'
              ? 'bg-gradient-to-r from-violet-600 to-indigo-650 text-white shadow'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          Banners
        </button>
      </div>

      {/* Global Notice alert strip */}
      {msgNotice && (
        <div className={`p-3.5 rounded-xl border text-xs font-medium flex items-center gap-2.5 transition animate-fade-in ${
          msgNotice.type === 'success' 
            ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20' 
            : 'bg-rose-500/15 text-rose-400 border-rose-500/20'
        }`}>
          <div className={`w-1.5 h-1.5 rounded-full ${msgNotice.type === 'success' ? 'bg-emerald-400 animate-ping' : 'bg-rose-400'}`} />
          <span>{msgNotice.text}</span>
        </div>
      )}

      {/* ----------------- SUB-VIEW: COUPONS MANAGMENT ----------------- */}
      {activeSubTab === 'coupons' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left panel: Add Code Form */}
          <div className="lg:col-span-5 space-y-5 bg-[#0b0725]/55 border border-violet-500/10 rounded-xl p-5">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                <Plus className="w-4 h-4 text-violet-400" />
                Add Discount Coupon
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">Define alphanumeric checkouts that map to dynamic discount rates.</p>
            </div>

            <form onSubmit={handleCreateCoupon} className="space-y-4">
              <div>
                <label className="block text-[10.5px] uppercase tracking-wider font-extrabold text-slate-400 mb-1.5">Coupon Code *</label>
                <input
                  type="text"
                  required
                  value={newCoupon.code || ''}
                  onChange={(e) => setNewCoupon({ ...newCoupon, code: e.target.value })}
                  placeholder="e.g. MONSTER50"
                  className="w-full bg-[#050215] border border-violet-500/15 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-violet-500/40 font-mono tracking-widest uppercase"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10.5px] uppercase tracking-wider font-extrabold text-slate-400 mb-1.5">Discount Type</label>
                  <select
                    value={newCoupon.type || 'percent'}
                    onChange={(e) => setNewCoupon({ ...newCoupon, type: e.target.value as 'percent' | 'flat' })}
                    className="w-full bg-[#050215] border border-violet-500/15 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-violet-500/40"
                  >
                    <option value="percent">Percent (%)</option>
                    <option value="flat">Flat Cash (₹)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10.5px] uppercase tracking-wider font-extrabold text-slate-400 mb-1.5">Discount Award *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={newCoupon.value || ''}
                    onChange={(e) => setNewCoupon({ ...newCoupon, value: parseFloat(e.target.value) || 0 })}
                    placeholder={newCoupon.type === 'percent' ? 'e.g. 15' : 'e.g. 500'}
                    className="w-full bg-[#050215] border border-violet-500/15 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-violet-500/40"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10.5px] uppercase tracking-wider font-extrabold text-slate-400 mb-1.5">Min Cart Spend (₹)</label>
                <input
                  type="number"
                  min="0"
                  value={newCoupon.minSpend || 0}
                  onChange={(e) => setNewCoupon({ ...newCoupon, minSpend: parseFloat(e.target.value) || 0 })}
                  placeholder="e.g. 1000"
                  className="w-full bg-[#050215] border border-violet-500/15 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-violet-500/40"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2 px-4 rounded-lg text-xs font-bold text-white bg-gradient-to-r from-violet-600 to-indigo-650 hover:from-violet-500 hover:to-indigo-550 transition shadow-lg shadow-violet-650/10 flex items-center justify-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>Save Coupon Code</span>
              </button>
            </form>
          </div>

          {/* Right panel: Coupons List */}
          <div className="lg:col-span-7 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
              <Tag className="w-4 h-4 text-violet-400" />
              Active System Coupons ({coupons.length})
            </h3>

            {coupons.length === 0 ? (
              <div className="text-center py-10 border border-violet-500/5 bg-[#09051d]/40 rounded-xl space-y-2">
                <Tag className="w-8 h-8 text-slate-600 mx-auto" />
                <p className="text-xs text-slate-400">No active custom schemas found. Use the panel on the left or reset defaults!</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {coupons.map((coupon) => (
                  <div 
                    key={coupon.id} 
                    className={`border rounded-xl p-4.5 bg-[#0b0724]/90 hover:bg-[#0f0a30]/90 transition relative group ${
                      coupon.isActive 
                        ? 'border-violet-500/20' 
                        : 'border-slate-800 opacity-60'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded bg-violet-500/10 border border-violet-500/20 text-xs font-mono font-bold text-white uppercase tracking-wider">
                          {coupon.code}
                        </span>
                        
                        <div className="text-xs text-slate-300 pt-2 font-medium">
                          {coupon.type === 'percent' ? (
                            <span className="text-indigo-400 font-extrabold text-sm">{coupon.value}% Off</span>
                          ) : (
                            <span className="text-emerald-400 font-extrabold text-sm">₹{coupon.value} Cash Off</span>
                          )}
                        </div>
                        <p className="text-[10px] text-slate-400">
                          Min spend: <span className="font-mono text-slate-300">₹{coupon.minSpend}</span>
                        </p>
                      </div>

                      {/* Power Button */}
                      <button
                        onClick={() => handleToggleCouponActive(coupon)}
                        className={`text-[9px] font-bold uppercase py-1 px-2 rounded-md border ${
                          coupon.isActive 
                            ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
                            : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
                        }`}
                        title="Toggle active state status"
                      >
                        {coupon.isActive ? 'Active' : 'Disabled'}
                      </button>
                    </div>

                    <div className="absolute bottom-3 right-3 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition duration-150">
                      <button
                        onClick={() => handleDeleteCouponClick(coupon.id)}
                        className="p-1 rounded bg-[#1c0c1b] border border-rose-500/20 text-rose-400 hover:bg-rose-950 hover:text-white transition cursor-pointer"
                        title="Delete coupon"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ----------------- SUB-VIEW: CAROUSEL SLIDES ----------------- */}
      {activeSubTab === 'carousel' && (
        <div id="slide-form-head" className="space-y-8">
          {/* Main Slide Editor Form Panel */}
          <div className="bg-[#0b0725]/55 border border-violet-500/10 rounded-xl p-5 sm:p-6 space-y-6">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <PlusCircle className="w-4 h-4 text-violet-400" />
                {editingSlideId ? 'Modify Dynamic Carousel Slide' : 'Launch New Carousel Slide'}
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">Define high-conversion displays complete with live spec tags and linking discount codes.</p>
            </div>

            <form onSubmit={handleCreateSlide} className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left Form Block */}
              <div className="space-y-4">
                <div>
                  <label className="block text-[10.5px] uppercase tracking-wider font-extrabold text-slate-400 mb-1.5">Slide Badge Spec (Upper corner) *</label>
                  <input
                    type="text"
                    required
                    value={newSlide.badge || ''}
                    onChange={(e) => setNewSlide({ ...newSlide, badge: e.target.value })}
                    placeholder="e.g. VIP SELECTION // 30% OFF SAVED"
                    className="w-full bg-[#050215] border border-violet-500/15 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-violet-500/40"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10.5px] uppercase tracking-wider font-extrabold text-slate-400 mb-1.5">Action Code Tag *</label>
                    <input
                      type="text"
                      required
                      value={newSlide.code || ''}
                      onChange={(e) => setNewSlide({ ...newSlide, code: e.target.value })}
                      placeholder="e.g. SUPERSTRIKE"
                      className="w-full bg-[#050215] border border-violet-500/15 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-violet-500/40 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[10.5px] uppercase tracking-wider font-extrabold text-slate-400 mb-1.5">Retinal Display Icon</label>
                    <select
                      value={newSlide.iconName || 'Sparkles'}
                      onChange={(e) => setNewSlide({ ...newSlide, iconName: e.target.value })}
                      className="w-full bg-[#050215] border border-violet-500/15 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-violet-500/40"
                    >
                      {PRESET_ICONS.map(ic => <option key={ic} value={ic}>{ic}</option>)}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10.5px] uppercase tracking-wider font-extrabold text-slate-400 mb-1.5">Current Offer Price *</label>
                    <input
                      type="text"
                      required
                      value={newSlide.price || ''}
                      onChange={(e) => setNewSlide({ ...newSlide, price: e.target.value })}
                      placeholder="e.g. ₹23,999"
                      className="w-full bg-[#050215] border border-violet-500/15 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-violet-500/40"
                    />
                  </div>
                  <div>
                    <label className="block text-[10.5px] uppercase tracking-wider font-extrabold text-slate-400 mb-1.5">Original Cost *</label>
                    <input
                      type="text"
                      required
                      value={newSlide.originalPrice || ''}
                      onChange={(e) => setNewSlide({ ...newSlide, originalPrice: e.target.value })}
                      placeholder="e.g. ₹27,999"
                      className="w-full bg-[#050215] border border-violet-500/15 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-violet-500/40"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10.5px] uppercase tracking-wider font-extrabold text-slate-400 mb-1.5">Promo Accent border style</label>
                  <select
                    value={newSlide.accentColor || PRESET_ACCENTS[0].value}
                    onChange={(e) => setNewSlide({ ...newSlide, accentColor: e.target.value })}
                    className="w-full bg-[#050215] border border-violet-500/15 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-violet-500/40"
                  >
                    {PRESET_ACCENTS.map(acc => <option key={acc.name} value={acc.value}>{acc.name}</option>)}
                  </select>
                </div>
              </div>

              {/* Right Form Block */}
              <div className="space-y-4">
                <div>
                  <label className="block text-[10.5px] uppercase tracking-wider font-extrabold text-slate-400 mb-1.5">Display Title *</label>
                  <input
                    type="text"
                    required
                    value={newSlide.title || ''}
                    onChange={(e) => setNewSlide({ ...newSlide, title: e.target.value })}
                    placeholder="e.g. Hybrid Active Dual Monitors"
                    className="w-full bg-[#050215] border border-violet-500/15 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-violet-500/40"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10.5px] uppercase tracking-wider font-extrabold text-slate-400 mb-1.5">Subtitle (small heading) *</label>
                    <input
                      type="text"
                      required
                      value={newSlide.subtitle || ''}
                      onChange={(e) => setNewSlide({ ...newSlide, subtitle: e.target.value })}
                      placeholder="e.g. Premium Acoustic Monitor"
                      className="w-full bg-[#050215] border border-violet-500/15 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-violet-500/40"
                    />
                  </div>
                  <div>
                    <label className="block text-[10.5px] uppercase tracking-wider font-extrabold text-slate-400 mb-1.5">Background Gradient</label>
                    <select
                      value={newSlide.gradient || PRESET_GRADIENTS[0].value}
                      onChange={(e) => setNewSlide({ ...newSlide, gradient: e.target.value })}
                      className="w-full bg-[#050215] border border-violet-500/15 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-violet-500/40"
                    >
                      {PRESET_GRADIENTS.map(gr => <option key={gr.name} value={gr.value}>{gr.name}</option>)}
                    </select>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="block text-[10.5px] uppercase tracking-wider font-extrabold text-slate-400">Poster Image Link or Upload *</label>
                    <label className="cursor-pointer bg-gradient-to-r from-violet-600 to-indigo-650 hover:from-violet-500 hover:to-indigo-550 text-white rounded-lg px-2.5 py-1 text-[9px] font-extrabold tracking-widest uppercase transition-all select-none">
                      {isUploading ? 'Uploading...' : 'Upload Image'}
                      <input
                        type="file"
                        accept="image/*"
                        disabled={isUploading}
                        onChange={handleUploadCarouselImage}
                        className="hidden"
                      />
                    </label>
                  </div>
                  <input
                    type="text"
                    required
                    value={newSlide.image || ''}
                    onChange={(e) => setNewSlide({ ...newSlide, image: e.target.value })}
                    placeholder="https://images.unsplash.com/... or upload any file"
                    className="w-full bg-[#050215] border border-violet-500/15 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-violet-500/40 font-mono text-[11px]"
                  />
                  {fileUploadError && (
                    <p className="text-[8.5px] font-mono text-rose-400 font-semibold mt-1">{fileUploadError}</p>
                  )}
                </div>

                <div>
                  <label className="block text-[10.5px] uppercase tracking-wider font-extrabold text-slate-400 mb-1.5">Detailed Marketing Catch Pitch (Description) *</label>
                  <textarea
                    required
                    rows={2}
                    value={newSlide.description || ''}
                    onChange={(e) => setNewSlide({ ...newSlide, description: e.target.value })}
                    placeholder="Experience aerospace grade stabilizers and smart noise cancelling nodes..."
                    className="w-full bg-[#050215] border border-violet-500/15 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-violet-500/40 resize-none"
                  />
                </div>

                <div className="flex gap-2 justify-end pt-2">
                  {editingSlideId && (
                    <button
                      type="button"
                      onClick={() => {
                        setEditingSlideId(null);
                        setNewSlide({});
                      }}
                      className="py-2.5 px-4 rounded-lg text-xs font-semibold text-slate-300 bg-slate-800 hover:bg-slate-700 transition"
                    >
                      Cancel Edit
                    </button>
                  )}
                  <button
                    type="submit"
                    className="py-2.5 px-5 rounded-lg text-xs font-bold text-white bg-gradient-to-r from-violet-600 to-indigo-650 hover:from-violet-500 hover:to-indigo-550 transition shadow-lg shadow-violet-650/10 flex items-center justify-center gap-1.5"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>{editingSlideId ? 'Save Changes' : 'Publish Carousel Slide'}</span>
                  </button>
                </div>
              </div>
            </form>
          </div>

          {/* Active Carousel Slides list */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <ImageIcon className="w-4 h-4 text-violet-400" />
              Active Carousel Displays ({carouselSlides.length})
            </h3>

            {carouselSlides.length === 0 ? (
              <div className="text-center py-10 border border-violet-500/5 bg-[#09051d]/40 rounded-xl space-y-2">
                <ImageIcon className="w-8 h-8 text-slate-600 mx-auto" />
                <p className="text-xs text-slate-400">No custom slide triggers launched. Clear or reseed defaults!</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {carouselSlides.map((slide) => (
                  <div key={slide.id} className="border border-violet-500/15 hover:border-violet-500/30 rounded-xl overflow-hidden bg-[#0c0828] select-none flex flex-col justify-between group h-[300px]">
                    {/* Header banner metadata */}
                    <div className="p-4 flex gap-4">
                      {/* Image Preview thumb */}
                      <div className="w-20 h-20 rounded-lg overflow-hidden shrink-0 border border-white/5 relative">
                        <img src={slide.image} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      </div>
                      
                      <div className="space-y-1 overflow-hidden">
                        <span className="text-[9px] uppercase font-mono bg-violet-500/10 border border-violet-500/20 text-[#c084fc] rounded px-1.5 py-0.5 inline-block">
                          {slide.badge}
                        </span>
                        <h4 className="text-xs font-extrabold text-white truncate block">{slide.title}</h4>
                        <span className="text-[10px] font-mono text-slate-400 block truncate">{slide.subtitle}</span>
                        <span className="text-[10px] font-mono text-indigo-400 block font-bold">Code: {slide.code}</span>
                      </div>
                    </div>

                    <div className="p-4 pt-0 text-[11px] text-slate-400 flex-1 line-clamp-3">
                      {slide.description}
                    </div>

                    {/* Bottom Price controller bar */}
                    <div className="bg-[#050215] p-3 border-t border-violet-500/10 flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <span className="text-xs text-indigo-400 font-mono font-bold">{slide.price}</span>
                        <span className="text-[10px] text-slate-500 line-through font-mono font-light">{slide.originalPrice}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleEditSlideClick(slide)}
                          className="p-1 px-2.5 rounded bg-[#13072b] border border-violet-500/20 text-violet-300 hover:bg-violet-950 hover:text-white transition cursor-pointer text-[10px] flex items-center gap-1 font-bold"
                        >
                          <Edit className="w-3 h-3" />
                          <span>Edit</span>
                        </button>
                        <button
                          onClick={() => handleDeleteSlideClick(slide.id)}
                          className="p-1 px-2.5 rounded bg-[#200c14] border border-rose-500/20 text-rose-450 hover:bg-rose-950 hover:text-white transition cursor-pointer text-[10px] flex items-center gap-1 font-bold"
                        >
                          <Trash2 className="w-3 h-3" />
                          <span>Delete</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ----------------- SUB-VIEW: PROMO MESSAGES (BANNERS) ----------------- */}
      {activeSubTab === 'banners' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left panel: Add Code Form */}
          <div className="lg:col-span-5 space-y-5 bg-[#0b0725]/55 border border-violet-500/10 rounded-xl p-5">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                <Plus className="w-4 h-4 text-violet-400" />
                {editingBannerId ? 'Modify Announcement Ticker' : 'Push New Announcement Ticker'}
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">Edit notifications or discount highlight alerts rotating on top of our client pages.</p>
            </div>

            <form onSubmit={handleCreateBanner} className="space-y-4">
              <div>
                <label className="block text-[10.5px] uppercase tracking-wider font-extrabold text-slate-400 mb-1.5">Highlight Badge Label *</label>
                <input
                  type="text"
                  required
                  value={newBanner.highlightText || ''}
                  onChange={(e) => setNewBanner({ ...newBanner, highlightText: e.target.value })}
                  placeholder="e.g. SYSTEM FLASH SAVING ✨"
                  className="w-full bg-[#050215] border border-violet-500/15 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-violet-500/40 uppercase tracking-wide font-extrabold"
                />
              </div>

              <div>
                <label className="block text-[10.5px] uppercase tracking-wider font-extrabold text-slate-400 mb-1.5">Description text explanation *</label>
                <textarea
                  required
                  rows={3}
                  value={newBanner.regularText || ''}
                  onChange={(e) => setNewBanner({ ...newBanner, regularText: e.target.value })}
                  placeholder="Get complimentary tracked dispatch and priority logistics on your first checkout."
                  className="w-full bg-[#050215] border border-violet-500/15 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-violet-500/40 resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10.5px] uppercase tracking-wider font-extrabold text-slate-400 mb-1.5">Optional Copy Code</label>
                  <input
                    type="text"
                    value={newBanner.codeToCopy || ''}
                    onChange={(e) => setNewBanner({ ...newBanner, codeToCopy: e.target.value })}
                    placeholder="e.g. WELCOME199"
                    className="w-full bg-[#050215] border border-violet-500/15 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-violet-500/40 uppercase font-mono font-bold focus:border-[#c084fc]/50"
                  />
                </div>
                <div>
                  <label className="block text-[10.5px] uppercase tracking-wider font-extrabold text-slate-400 mb-1.5">Lucide Icon</label>
                  <select
                    value={newBanner.iconName || 'Sparkles'}
                    onChange={(e) => setNewBanner({ ...newBanner, iconName: e.target.value })}
                    className="w-full bg-[#050215] border border-violet-500/15 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-violet-500/40"
                  >
                    {PRESET_ICONS.map(ic => <option key={ic} value={ic}>{ic}</option>)}
                  </select>
                </div>
              </div>

              <div className="flex gap-2 justify-end pt-1">
                {editingBannerId && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingBannerId(null);
                      setNewBanner({ iconName: 'Sparkles', highlightText: 'FLASH SPECIAL', regularText: '', codeToCopy: '' });
                    }}
                    className="py-2 px-3.5 rounded-lg text-xs font-semibold text-slate-300 bg-slate-800 hover:bg-slate-700 transition"
                  >
                    Cancel Edit
                  </button>
                )}
                <button
                  type="submit"
                  className="flex-1 py-2 px-4 rounded-lg text-xs font-bold text-white bg-gradient-to-r from-violet-600 to-indigo-650 hover:from-violet-500 hover:to-indigo-550 transition shadow-lg shadow-violet-650/10 flex items-center justify-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>{editingBannerId ? 'Save Announcement' : 'Launch Announcement'}</span>
                </button>
              </div>
            </form>
          </div>

          {/* Right panel: Promo Messages list */}
          <div className="lg:col-span-7 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
              <PlusCircle className="w-4 h-4 text-violet-400 animate-spin-slow" />
              Active Top Ticker Banners ({promoMessages.length})
            </h3>

            {promoMessages.length === 0 ? (
              <div className="text-center py-10 border border-violet-500/5 bg-[#09051d]/40 rounded-xl space-y-2">
                <PlusCircle className="w-8 h-8 text-slate-600 mx-auto" />
                <p className="text-xs text-slate-400">No active announcement lines. Use the builder to write and push banner notifications!</p>
              </div>
            ) : (
              <div className="space-y-3.5">
                {promoMessages.map((banner) => (
                  <div key={banner.id} className="border border-violet-500/10 rounded-xl p-4 bg-[#0a0521]/95 hover:bg-[#0f072f]/95 transition flex items-start justify-between gap-4 group">
                    <div className="space-y-1 overflow-hidden flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono tracking-wider font-extrabold text-[#c084fc] bg-violet-500/10 border border-violet-500/20 px-2.5 py-0.5 rounded uppercase">
                          {banner.highlightText}
                        </span>
                        {banner.codeToCopy && (
                          <span className="text-[9px] font-mono bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 px-1.5 py-0.5 rounded font-bold uppercase">
                            Code: {banner.codeToCopy}
                          </span>
                        )}
                        <span className="text-[9px] font-mono text-slate-500 uppercase">Icon: {banner.iconName}</span>
                      </div>
                      <p className="text-xs text-slate-350 leading-relaxed font-light mt-0.5">{banner.regularText}</p>
                    </div>

                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition shrink-0 duration-150">
                      <button
                        onClick={() => handleEditBannerClick(banner)}
                        className="p-1 rounded bg-[#0b1c0b] border border-[#22c55e]/20 text-emerald-400 hover:bg-[#0e2a0e] hover:text-white transition cursor-pointer"
                        title="Edit announcement banner"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteBannerClick(banner.id)}
                        className="p-1 rounded bg-[#1c0c1b] border border-rose-500/20 text-rose-450 hover:bg-rose-950 hover:text-white transition cursor-pointer"
                        title="Delete announcement banner"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
