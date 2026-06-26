import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, ChevronRight, Check, Copy } from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import { useApp } from '../context/AppContext';

const renderIcon = (name?: string) => {
  if (!name) return null;
  const IconComponent = (LucideIcons as any)[name];
  if (!IconComponent) return null;
  
  let animationClass = "";
  if (name === 'Gift') animationClass = "animate-pulse text-violet-400";
  if (name === 'Sparkles') animationClass = "text-teal-400";
  if (name === 'Truck') animationClass = "animate-bounce text-indigo-400";
  
  return <IconComponent className={`w-3.5 h-3.5 ${animationClass}`} />;
};

const PromoBannerSkeleton: React.FC = () => {
  return (
    <div className="w-full bg-[#07011d] border-b border-violet-950/40 py-1.5 px-4 relative overflow-hidden min-h-[34px] flex items-center justify-center">
      <div className="relative h-3.5 w-72 bg-violet-955/20 rounded-md overflow-hidden">
        <div className="shimmer-sweep" />
      </div>
    </div>
  );
};

const PromoBanner: React.FC = () => {
  const { promoMessages, isLoading } = useApp();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [copied, setCopied] = useState(false);

  const messages = promoMessages || [];

  useEffect(() => {
    if (messages.length <= 1) return;
    const timer = setInterval(() => {
      handleNext();
    }, 5500);
    return () => clearInterval(timer);
  }, [currentIndex, messages.length]);

  const handleNext = () => {
    if (messages.length === 0) return;
    setCurrentIndex((prev) => (prev + 1) % messages.length);
    setCopied(false);
  };

  const handlePrev = () => {
    if (messages.length === 0) return;
    setCurrentIndex((prev) => (prev - 1 + messages.length) % messages.length);
    setCopied(false);
  };

  const handleCopy = (code: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (isLoading) {
    return <PromoBannerSkeleton />;
  }

  if (messages.length === 0) {
    return null;
  }

  // Safe index guard
  const safeIndex = currentIndex >= messages.length ? 0 : currentIndex;
  const activeMsg = messages[safeIndex];

  if (!activeMsg) return null;

  return (
    <div className="w-full bg-[#07011d] border-b border-violet-950/40 py-1.5 px-4 relative select-none z-50 overflow-hidden min-h-[34px] flex items-center justify-center">
      {/* Visual neon ambient ray */}
      <div className="absolute inset-0 bg-gradient-to-r from-violet-600/5 via-indigo-600/5 to-blue-500/5 pointer-events-none" />
      
      {/* Left button */}
      <button 
        onClick={handlePrev}
        className="absolute left-1.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors cursor-pointer p-1 rounded-full hover:bg-violet-950/30 z-10 hidden xs:flex"
        title="Previous Info"
      >
        <ChevronLeft className="w-3.5 h-3.5" />
      </button>

      {/* Main text message marquee stage */}
      <div className="w-full flex justify-center items-center overflow-hidden px-1 sm:px-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeMsg.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="flex items-center justify-center gap-1.5 sm:gap-2 text-center text-[9.5px] sm:text-[11px] tracking-wide max-w-full"
          >
            <span className="flex items-center gap-1 shrink-0">
              {renderIcon(activeMsg.iconName)}
              <span className="font-extrabold uppercase bg-clip-text text-transparent bg-gradient-to-r from-violet-400 via-indigo-300 to-teal-400">
                {activeMsg.highlightText}
              </span>
            </span>
            <span className="text-slate-350 font-medium truncate max-w-[130px] xxs:max-w-[170px] xs:max-w-[240px] md:max-w-none">
              {activeMsg.regularText}
            </span>

            {/* Optional copy action tag */}
            {activeMsg.codeToCopy && (
              <button
                type="button"
                onClick={(e) => handleCopy(activeMsg.codeToCopy!, e)}
                className={`inline-flex items-center gap-1.5 rounded px-1.5 py-0.5 border text-[8px] sm:text-[9px] font-extrabold tracking-wider transition-all cursor-pointer shrink-0 ${
                  copied 
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' 
                    : 'bg-violet-500/10 text-violet-300 border-violet-500/20 hover:bg-violet-500/20 hover:text-white'
                }`}
              >
                {copied ? <Check className="w-2.5 h-2.5 text-emerald-400" /> : <Copy className="w-2.5 h-2.5" />}
                <span>{copied ? 'COPIED!' : activeMsg.codeToCopy}</span>
              </button>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Right button */}
      <button 
        onClick={handleNext}
        className="absolute right-1.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors cursor-pointer p-1 rounded-full hover:bg-violet-950/30 z-10 hidden xs:flex"
        title="Next Info"
      >
        <ChevronRight className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};

export default PromoBanner;
