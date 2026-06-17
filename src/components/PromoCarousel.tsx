import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, ChevronLeft, ChevronRight, ArrowRight, ShieldCheck, Cpu, Headphones, Watch, Tag, Check, Copy } from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import { useApp } from '../context/AppContext';
import ProductDetailModal from './ProductDetailModal';

interface SlideItem {
  id: string | number;
  badge: string;
  title: string;
  subtitle: string;
  description: string;
  price: string;
  originalPrice: string;
  code: string;
  image: string;
  icon: React.ReactNode;
  gradient: string;
  accentColor: string;
}

const renderCarouselIcon = (name?: string) => {
  if (!name) return <Tag className="w-4 h-4 text-violet-400" />;
  const IconComponent = (LucideIcons as any)[name];
  if (!IconComponent) return <Tag className="w-4 h-4 text-violet-400" />;
  return <IconComponent className="w-4 h-4 text-violet-400" />;
};

const PromoCarousel: React.FC = () => {
  const { products, carouselSlides } = useApp();
  const [current, setCurrent] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [selectedPromoProduct, setSelectedPromoProduct] = useState<any | null>(null);

  const slides: SlideItem[] = carouselSlides && carouselSlides.length > 0 ? carouselSlides.map(slide => ({
    id: slide.id,
    badge: slide.badge,
    title: slide.title,
    subtitle: slide.subtitle,
    description: slide.description,
    price: slide.price,
    originalPrice: slide.originalPrice,
    code: slide.code,
    image: slide.image,
    icon: renderCarouselIcon(slide.iconName),
    gradient: slide.gradient || "from-[#110c37]/90 via-[#0d072c]/90 to-[#030014]/95",
    accentColor: slide.accentColor || "border-violet-500/30 text-violet-400"
  })) : [
    {
      id: 1,
      badge: "LIMITED RELEASE // 20% OFF SAVED",
      title: "Tactile Mechanical Gold Linear Nodes",
      subtitle: "Workspace Mechanical Gears",
      description: "Experience aerospace-grade latency stabilizers, noise-isolating mechanical gold switches, and reactive RGB atmospheric backlighting.",
      price: "₹15,999",
      originalPrice: "₹18,399",
      code: "SETHIFLOW",
      image: "https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&q=80&w=1200",
      icon: <Cpu className="w-4 h-4 text-violet-400" />,
      gradient: "from-[#110c37]/90 via-[#0d072c]/90 to-[#030014]/95",
      accentColor: "border-violet-500/30 text-violet-400"
    },
    {
      id: 2,
      badge: "VIP HARDWARE SELECTION // 30% INTRO OFF",
      title: "Atmospheric Dual-Driver Acoustic Monitors",
      subtitle: "High-Purity Audio Hardware",
      description: "Unravel rich spatial soundstages, active hybrid acoustic noise reduction buffers, and soft thermo-sensitive membrane earcups.",
      price: "₹23,999",
      originalPrice: "₹27,999",
      code: "SUPERSTRIKE",
      image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&q=80&w=1200",
      icon: <Headphones className="w-4 h-4 text-blue-400" />,
      gradient: "from-[#08123b]/90 via-[#060a28]/90 to-[#030014]/95",
      accentColor: "border-blue-500/30 text-blue-400"
    },
    {
      id: 3,
      badge: "TACTICAL HEALTH UPGRADE // 10% DISCOUNT CODE",
      title: "Aerospace Titanium Smart Workout Tracker",
      subtitle: "Pre-Certified Metric Sensors",
      description: "Equipped with hyper-precision cardiovascular monitors, multi-sport kinetic logs, and a crystal-hardened ambient retinal display.",
      price: "₹27,999",
      originalPrice: "₹31,999",
      code: "WELCOME10",
      image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&q=80&w=1200",
      icon: <Watch className="w-4 h-4 text-indigo-400" />,
      gradient: "from-[#1a0c3a]/90 via-[#0b0625]/90 to-[#030014]/95",
      accentColor: "border-violet-600/30 text-indigo-400"
    }
  ];

  const handleNext = useCallback(() => {
    setCurrent((prev) => (prev + 1) % slides.length);
  }, [slides.length]);

  const handlePrev = useCallback(() => {
    setCurrent((prev) => (prev - 1 + slides.length) % slides.length);
  }, [slides.length]);

  useEffect(() => {
    if (isHovered || slides.length <= 1) return;
    const timer = setInterval(() => {
      handleNext();
    }, 8000);
    return () => clearInterval(timer);
  }, [handleNext, isHovered, slides.length]);

  const activeSlide = slides[current >= slides.length ? 0 : current];

  // Map each slide to its corresponding real product in the catalog
  const getLinkedProduct = (slideId: string | number) => {
    if (slideId === 1 || slideId === '1') {
      return products.find(p => p.id === 'prod-5') || null;
    } else if (slideId === 2 || slideId === '2') {
      return products.find(p => p.id === 'prod-1') || null;
    } else if (slideId === 3 || slideId === '3') {
      return products.find(p => p.id === 'prod-3') || null;
    }
    return products.find(p => p.id === slideId || p.id === `prod-${slideId}` || p.name.toLowerCase().includes(activeSlide?.title?.toLowerCase().substring(0, 8))) || null;
  };

  const handleOpenProduct = (slideId: string | number) => {
    const linked = getLinkedProduct(slideId);
    if (linked) {
      setSelectedPromoProduct(linked);
    } else {
      // Robust client fallback spec setup if the DB is still empty or loading
      const fallbackProd = {
         id: String(slideId),
         name: activeSlide.title,
         description: activeSlide.description,
         price: parseFloat(activeSlide.price.replace('₹', '').replace(/,/g, '')),
         originalPrice: parseFloat(activeSlide.originalPrice.replace('₹', '').replace(/,/g, '')),
         category: slideId === 1 ? 'workplace' : slideId === 2 ? 'audio' : 'wearables',
         image: activeSlide.image,
         rating: 4.8,
         stock: 5,
         salesCount: 120,
         reviews: []
      };
      setSelectedPromoProduct(fallbackProd);
    }
  };

  const handleSlideClick = (e: React.MouseEvent) => {
    // If the click is inside buttons, arrows, or bullets, skip trigger
    const target = e.target as HTMLElement;
    if (target.closest('button') || target.closest('.interactive-skip') || target.closest('a')) {
      return;
    }
    handleOpenProduct(activeSlide.id);
  };

  const handleCopyCode = (code: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2500);
  };

  return (
    <section 
      id="store-promo-carousel"
      className="relative overflow-hidden w-full max-w-7xl mx-auto rounded-3xl border border-violet-500/15 bg-[#030014] group select-none shadow-2xl"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Absolute Decorative Background Elements */}
      <div className="absolute top-1/2 left-1/4 -translate-y-1/2 w-[350px] h-[350px] rounded-full bg-indigo-600/10 blur-[100px] pointer-events-none" />
      <div className="absolute top-1/3 right-1/4 w-[400px] h-[400px] rounded-full bg-violet-600/12 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-[200px] h-[200px] rounded-full bg-blue-600/10 blur-[80px] pointer-events-none" />

      <AnimatePresence mode="wait">
        <motion.div
          key={current}
          initial={{ opacity: 0, scale: 0.985 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 1.01 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          onClick={handleSlideClick}
          className={`grid grid-cols-1 md:grid-cols-12 gap-8 items-center p-6 sm:p-10 lg:p-12 bg-gradient-to-r ${activeSlide.gradient} min-h-[465px] relative z-10 cursor-pointer hover:brightness-105 transition-all duration-300`}
          whileTap={{ scale: 0.995 }}
        >
          {/* Left Block: Narrative specs / discount hooks */}
          <div className="md:col-span-7 space-y-6 flex flex-col justify-center text-left">
            <div className={`inline-flex items-center gap-2 rounded-full bg-white/5 border px-4 py-1.5 text-[10.5px] font-extrabold tracking-wider ${activeSlide.accentColor} backdrop-blur-md`}>
              <Sparkles className="w-3.5 h-3.5 animate-spin-slow" />
              <span>{activeSlide.badge}</span>
            </div>

            <div className="space-y-2">
              <span className="text-xs uppercase font-mono tracking-widest text-[#a5b4fc] block">
                {activeSlide.subtitle}
              </span>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white leading-tight font-display group-hover:text-violet-200 transition-colors">
                {activeSlide.title}
              </h1>
            </div>

            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-light max-w-xl">
              {activeSlide.description}
            </p>

            {/* Quick Interactive Coupon code clicker */}
            <div 
              onClick={(e) => handleCopyCode(activeSlide.code, e)}
              className="interactive-skip bg-[#0c0827]/85 hover:bg-[#120c3a]/90 rounded-xl border border-violet-500/15 hover:border-violet-500/40 p-3.5 flex flex-wrap items-center justify-between gap-3 max-w-lg backdrop-blur-md transition-all cursor-pointer shadow-lg hover:shadow-violet-500/5 group/coupon"
            >
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded bg-[#16123f] border border-violet-500/30 flex items-center justify-center">
                  {activeSlide.icon}
                </div>
                <div>
                  <span className="text-[9px] uppercase tracking-wider text-[#a5b4fc] block font-bold">ACTIVE PROMO CODE</span>
                  <span className="text-xs font-mono font-bold text-white flex items-center gap-1.5">
                    {activeSlide.code}
                    {copiedCode === activeSlide.code ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    ) : (
                      <Copy className="w-3 h-3 text-slate-400 group-hover/coupon:text-violet-300 transition-colors shrink-0" />
                    )}
                  </span>
                </div>
              </div>
              
              <div className="flex items-center gap-2.5">
                <span className="bg-gradient-to-r from-violet-950/40 to-indigo-950/40 border border-violet-500/20 text-violet-350 rounded-md px-2.5 py-1 text-[9px] font-extrabold tracking-wider font-sans group-hover/coupon:text-emerald-400 group-hover/coupon:border-emerald-500/20 transition-colors">
                  {copiedCode === activeSlide.code ? 'COPIED!' : 'CLICK TO COPY'}
                </span>
                <span className="text-xs text-slate-500 line-through font-mono">
                  {activeSlide.originalPrice}
                </span>
                <span className="text-md font-mono font-extrabold text-white">
                  {activeSlide.price}
                </span>
              </div>
            </div>

            {/* Interactive Buy Button */}
            <div className="flex flex-wrap items-center gap-4 pt-2">
              <button
                onClick={() => handleOpenProduct(activeSlide.id)}
                className="interactive-skip rounded-xl px-5 py-3 text-xs font-extrabold tracking-wider bg-gradient-to-r from-violet-600 to-indigo-600 text-white hover:from-violet-500 hover:to-indigo-500 transition-all shadow-lg hover:shadow-violet-600/25 flex items-center gap-2 group cursor-pointer active:scale-97"
              >
                <span>OPEN SPEC SHEET</span>
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </button>
              
              <span className="flex items-center gap-1.5 text-[10px] text-slate-400 font-bold select-none uppercase tracking-widest leading-none">
                <ShieldCheck className="w-4 h-4 text-emerald-400" /> Secure SSL Clearing Nodes
              </span>
            </div>
          </div>

          {/* Right Block: Image with beautiful glowing bezel */}
          <div className="md:col-span-5 relative w-full h-full flex items-center justify-center">
            {/* Ambient neon behind-glow */}
            <div className="absolute inset-0 bg-gradient-to-tr from-violet-600/25 to-blue-600/25 rounded-2xl blur-3xl pointer-events-none group-hover:from-violet-500/35 group-hover:to-blue-500/35 transition-all duration-300" />
            
            <div className="relative aspect-[4/3] w-full rounded-2xl overflow-hidden border border-violet-500/15 hover:border-violet-500/35 bg-[#0d0725] shadow-2xl group transition-all duration-500">
              <img
                src={activeSlide.image}
                alt={activeSlide.title}
                className="w-full h-full object-cover opacity-85 hover:scale-103 duration-750 transition-transform"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#030014]/60 via-transparent to-transparent pointer-events-none" />
              
              {/* Tap Indicator Badge */}
              <div className="absolute bottom-2.5 right-2.5 bg-black/75 backdrop-blur-xs border border-violet-500/25 rounded px-2.5 py-1 text-[8.5px] font-extrabold text-[#c084fc] uppercase tracking-widest pointer-events-none">
                Click to Inspect Gear
              </div>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Manual Controls Left & Right arrows */}
      <button
        onClick={handlePrev}
        className="absolute left-3 top-1/2 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full bg-[#0a0524]/75 hover:bg-[#11093c]/90 border border-[#8b5cf6]/20 hover:border-[#8b5cf6]/45 text-slate-300 hover:text-white backdrop-blur-md transition-all cursor-pointer z-20 shadow-md active:scale-95"
        title="Previous Slide"
      >
        <ChevronLeft className="w-5 h-5" />
      </button>

      <button
        onClick={handleNext}
        className="absolute right-3 top-1/2 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full bg-[#0a0524]/75 hover:bg-[#11093c]/90 border border-[#8b5cf6]/20 hover:border-[#8b5cf6]/45 text-slate-300 hover:text-white backdrop-blur-md transition-all cursor-pointer z-20 shadow-md active:scale-95"
        title="Next Slide"
      >
        <ChevronRight className="w-5 h-5" />
      </button>

      {/* Bullets tracker bottom indicator */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-20 select-none">
        {slides.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
              current === i ? 'w-6 bg-indigo-500' : 'w-1.5 bg-slate-600 hover:bg-slate-500'
            }`}
            title={`Go to slide ${i + 1}`}
          />
        ))}
      </div>

      {/* Local Product Spec Modal Sheet */}
      <ProductDetailModal 
        product={selectedPromoProduct}
        isOpen={!!selectedPromoProduct}
        onClose={() => setSelectedPromoProduct(null)}
      />
    </section>
  );
};

export default PromoCarousel;
