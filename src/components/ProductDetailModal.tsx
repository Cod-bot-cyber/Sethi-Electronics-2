import React, { useState, useEffect } from 'react';
import { Product } from '../types';
import { useApp } from '../context/AppContext';
import { motion, AnimatePresence } from 'motion/react';
import { X, Star, ShoppingBag, Plus, Minus, ShieldCheck, RefreshCw, ChevronLeft, ChevronRight, Maximize2 } from 'lucide-react';

interface ProductDetailModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
}

const ProductDetailModal: React.FC<ProductDetailModalProps> = ({ product, isOpen, onClose }) => {
  const { addToCart, addProductReview, currentUser } = useApp();
  const [quantity, setQuantity] = useState(1);
  const [activeImgIndex, setActiveImgIndex] = useState(0);
  const [revRating, setRevRating] = useState(5);
  const [revComment, setRevComment] = useState('');
  const [revAuthor, setRevAuthor] = useState(currentUser?.displayName || '');
  const [revSuccess, setRevSuccess] = useState(false);
  const [isZoomed, setIsZoomed] = useState(false);

  // Sync author name with logged in accounts
  useEffect(() => {
    if (currentUser) {
      setRevAuthor(currentUser.displayName || '');
    }
  }, [currentUser]);

  // Reset quantity counters and image gallery when opening next item spec sheet
  useEffect(() => {
    if (product) {
      setQuantity(1);
      setActiveImgIndex(0);
      setIsZoomed(false);
    }
  }, [product]);

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!product || !revComment.trim()) return;
    await addProductReview(product.id, revRating, revComment, revAuthor || 'Anonymous Partner');
    setRevComment('');
    setRevSuccess(true);
    setTimeout(() => setRevSuccess(false), 2000);
  };

  if (!isOpen || !product) return null;

  const handleAdjustQty = (amt: number) => {
    setQuantity(prev => Math.max(1, Math.min(prev + amt, product.stock)));
  };

  const handleAddSubmit = () => {
    addToCart(product, quantity);
    onClose();
  };

  const allImages = [product.image, ...(product.images || [])].filter(Boolean);

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop overlay */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/80 backdrop-blur-md"
        />

        {/* Modal slide panel sheet */}
        <motion.div
          initial={{ opacity: 0, scale: 0.98, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.98, y: 15 }}
          className="relative w-full max-w-2xl overflow-hidden rounded-2xl bg-[#090525] shadow-2xl border border-violet-500/25 max-h-[90vh] overflow-y-auto"
        >
          {/* Close trigger button */}
          <button
            onClick={onClose}
            className="absolute right-4 top-4 rounded-full p-2 text-slate-400 hover:bg-violet-955/50 hover:text-white transition-colors z-10 bg-[#090525]/80 backdrop-blur-xs border border-violet-500/20"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="grid grid-cols-1 md:grid-cols-2">
            {/* Left: Product Image zoom segment with gallery thumbnails */}
            <div className="flex flex-col justify-between bg-[#040118]/80 border-r border-violet-955/40 p-4 min-h-[400px] select-none">
              <div className="flex-1 flex items-center justify-center relative rounded-xl bg-black/30 border border-violet-500/5 p-4 overflow-hidden h-[320px] md:h-[380px] group">
                <img
                  src={allImages[activeImgIndex] || product.image}
                  alt={product.name}
                  className="max-h-full max-w-full object-contain opacity-95 transition-all duration-300 rounded cursor-zoom-in hover:scale-[1.02]"
                  referrerPolicy="no-referrer"
                  onClick={() => setIsZoomed(true)}
                  title="Click to view full-scale image"
                />

                {/* Left & Right navigation arrows (Only when there's more than 1 image) */}
                {allImages.length > 1 && (
                  <>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveImgIndex(prev => (prev === 0 ? allImages.length - 1 : prev - 1));
                      }}
                      className="absolute left-3 top-1/2 -translate-y-1/2 h-9 w-9 flex items-center justify-center rounded-full bg-[#090525]/85 hover:bg-violet-600 border border-violet-500/30 text-white shadow-xl hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer z-10"
                      aria-label="Previous image"
                    >
                      <ChevronLeft className="w-4.5 h-4.5" />
                    </button>
                    
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveImgIndex(prev => (prev === allImages.length - 1 ? 0 : prev + 1));
                      }}
                      className="absolute right-3 top-1/2 -translate-y-1/2 h-9 w-9 flex items-center justify-center rounded-full bg-[#090525]/85 hover:bg-violet-600 border border-violet-500/30 text-white shadow-xl hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer z-10"
                      aria-label="Next image"
                    >
                      <ChevronRight className="w-4.5 h-4.5" />
                    </button>
                  </>
                )}

                {/* Zoom button overlay */}
                <button
                  type="button"
                  onClick={() => setIsZoomed(true)}
                  className="absolute bottom-3 right-3 p-2 rounded-lg bg-[#090525]/90 hover:bg-violet-650 border border-violet-500/30 text-slate-300 hover:text-white transition-all opacity-0 group-hover:opacity-100 shadow-md cursor-pointer flex items-center gap-1 text-[9px] font-extrabold uppercase tracking-widest"
                  title="Zoom picture full scale"
                >
                  <Maximize2 className="w-3 h-3" />
                  <span>Zoom</span>
                </button>

                {/* Image count tracker indicator */}
                {allImages.length > 1 && (
                  <div className="absolute top-3 left-3 bg-[#090525]/90 border border-violet-500/20 text-slate-300 px-2 mt-0.5 py-0.5 rounded-full text-[8.5px] font-extrabold font-mono tracking-widest shadow-md">
                    {activeImgIndex + 1} / {allImages.length}
                  </div>
                )}
              </div>

              {/* Thumbnails row */}
              {allImages.length > 1 && (
                <div className="flex gap-2.5 overflow-x-auto mt-4 py-1.5 scrollbar-thin scrollbar-thumb-violet-500/20 max-w-full">
                  {allImages.map((img, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setActiveImgIndex(idx)}
                      className={`relative w-12 h-12 flex-shrink-0 rounded-lg overflow-hidden border transition-all duration-200 cursor-pointer ${
                        activeImgIndex === idx
                          ? 'border-violet-500 ring-2 ring-violet-500/20 scale-105 bg-violet-950/30'
                          : 'border-violet-500/10 hover:border-violet-500/30 bg-black/10'
                      }`}
                    >
                      <img src={img} alt={`Angle ${idx + 1}`} className="w-full h-full object-contain p-1" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Right: Technical specifications panel section */}
            <div className="p-6 sm:p-8 flex flex-col justify-between text-slate-100 select-none">
              
              {/* Product Info headers */}
              <div className="space-y-4">
                <div>
                  <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#8b5cf6] font-mono">
                    CURATED IN {product.category.toUpperCase()} LINE
                  </span>
                  <h3 className="text-xl font-extrabold tracking-tight text-white mt-1">
                    {product.name}
                  </h3>
                  
                  {/* rating stars */}
                  <div className="flex items-center gap-1.5 mt-2">
                    <div className="flex items-center">
                      {[...Array(5)].map((_, i) => (
                        <Star 
                          key={i} 
                          className={`w-3.5 h-3.5 ${
                            i < Math.floor(product.rating) 
                              ? 'fill-amber-400 text-amber-400 stroke-none' 
                              : 'text-slate-700 fill-slate-800 stroke-none'
                          }`} 
                        />
                      ))}
                    </div>
                    <span className="text-xs font-bold text-slate-300 font-mono leading-none pt-0.5">{product.rating.toFixed(1)} Rating</span>
                  </div>
                </div>

                <div className="border-t border-b border-violet-950/40 py-3.5 flex items-baseline gap-2.5">
                  <span className="text-xl font-extrabold tracking-tight text-white font-mono">₹{product.price.toLocaleString('en-IN')}</span>
                  {product.originalPrice && (
                    <span className="text-xs font-bold text-slate-500 line-through font-mono">₹{product.originalPrice.toLocaleString('en-IN')}</span>
                  )}
                </div>

                <div className="space-y-2">
                  <h4 className="text-[10px] uppercase font-bold text-slate-400 tracking-widest">Product Overview</h4>
                  <p className="text-xs text-slate-300 leading-relaxed font-light">
                    {product.description}
                  </p>
                </div>
              </div>

              {/* Incremener action controls */}
              <div className="mt-8 space-y-4 pt-4 border-t border-violet-950/40">
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span className="text-slate-450 font-medium">Quantity limits</span>
                  
                  <div className="flex items-center rounded-lg border border-violet-500/15 bg-[#0d0a29] p-0.5">
                    <button
                      onClick={() => handleAdjustQty(-1)}
                      disabled={quantity <= 1}
                      className="p-1 rounded text-slate-400 hover:text-white hover:bg-violet-950/30 disabled:opacity-20 transition-all cursor-pointer"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="px-3.5 font-bold font-mono text-white min-w-[20px] text-center">
                      {quantity}
                    </span>
                    <button
                      onClick={() => handleAdjustQty(1)}
                      disabled={quantity >= product.stock}
                      className="p-1 rounded text-slate-400 hover:text-white hover:bg-violet-955/30 disabled:opacity-20 transition-all cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Sub-cost total helper */}
                <div className="flex justify-between items-baseline text-xs text-slate-400">
                  <span>Selected Sub-total</span>
                  <span className="font-mono text-white font-extrabold text-sm">₹{(product.price * quantity).toLocaleString('en-IN')}</span>
                </div>

                {/* Submit button to Add to Cart */}
                <button
                  onClick={handleAddSubmit}
                  disabled={product.stock === 0}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 shadow-md shadow-violet-600/15 hover:from-violet-500 hover:to-indigo-500 py-3 px-4 text-xs font-bold text-white transition-all cursor-pointer disabled:opacity-20 active:scale-98 uppercase tracking-widest"
                >
                  <ShoppingBag className="w-4 h-4" />
                  <span>{product.stock === 0 ? 'Out of Stock' : 'Add to Shopping Basket'}</span>
                </button>

                {/* Secure trust indicators under item detailed sheet */}
                <div className="grid grid-cols-2 gap-2 text-[9px] font-extrabold text-slate-400 uppercase tracking-widest font-mono">
                  <span className="flex items-center gap-1.5 justify-center py-2 rounded-lg bg-[#0c0827]/60 border border-violet-500/10">
                    <ShieldCheck className="w-4 h-4 text-emerald-450" />
                    Secure Checkout
                  </span>
                  <span className="flex items-center gap-1.5 justify-center py-2 rounded-lg bg-[#0c0827]/60 border border-violet-500/10">
                    <RefreshCw className="w-4 h-4 text-blue-450" />
                    Stock Verified
                  </span>
                </div>
              </div>

            </div>
          </div>

          {/* Interactive Customer Review Feedback Registry */}
          <div className="border-t border-violet-950/60 bg-[#05021a] p-6 sm:p-8">
            <h4 className="text-xs font-extrabold uppercase tracking-widest text-[#8b5cf6] mb-6 flex items-center gap-2">
              <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
              Verified Buyers Feedbacks Log
            </h4>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* Left Column: Reviews listings */}
              <div className="lg:col-span-7 space-y-4">
                {(!product.reviews || product.reviews.length === 0) ? (
                  <div className="bg-[#0c082b]/30 rounded-xl border border-violet-500/10 p-6 text-center select-none">
                    <p className="text-xs font-extrabold uppercase tracking-widest text-white">No verified feedbacks yet</p>
                    <p className="text-[11px] text-slate-450 font-light mt-1.5">Be the first to leave a stellar response on this element!</p>
                  </div>
                ) : (
                  product.reviews.map((rev, idx) => (
                    <div key={rev.id || `rev-${idx}`} className="bg-[#0c082d]/40 rounded-xl border border-violet-500/10 p-4 space-y-2 shadow-sm">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-[11.5px] font-extrabold text-white">{rev.author}</span>
                          <span className="text-[8px] rounded bg-violet-500/10 text-violet-300 border border-violet-500/20 px-2 py-0.5 font-extrabold uppercase tracking-widest">verified buyer</span>
                        </div>
                        <span className="text-[9.5px] text-slate-500 font-mono">{new Date(rev.createdAt).toLocaleDateString()}</span>
                      </div>
                      <div className="flex gap-0.5">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star key={i} className={`w-3.5 h-3.5 ${i < rev.rating ? 'text-amber-500 fill-amber-500 stroke-none' : 'text-slate-800'}`} />
                        ))}
                      </div>
                      <p className="text-xs text-slate-300 leading-normal italic font-light">
                        "{rev.comment}"
                      </p>
                    </div>
                  ))
                )}
              </div>

              {/* Right Column: Submission Form card */}
              <div className="lg:col-span-5 bg-[#0d072d]/40 rounded-xl border border-violet-500/10 p-5 space-y-4">
                <h5 className="text-[11px] font-extrabold text-[#8b5cf6] uppercase tracking-widest">
                  Write Product Feedback
                </h5>

                <form onSubmit={handleSubmitReview} className="space-y-3.5">
                  <div>
                    <label className="block text-[9px] font-extrabold text-slate-450 uppercase tracking-widest mb-1.5">Your star rating</label>
                    <div className="flex gap-1.5">
                      {[1, 2, 3, 4, 5].map((stars) => (
                        <button
                          key={stars}
                          type="button"
                          onClick={() => setRevRating(stars)}
                          className="p-1 hover:scale-110 transition-transform cursor-pointer"
                        >
                          <Star className={`w-5 h-5 ${stars <= revRating ? 'text-amber-500 fill-amber-500 stroke-none' : 'text-slate-800'}`} />
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-[9.5px] font-extrabold text-slate-455 uppercase tracking-widest mb-1.5">Display Nickname</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Liam Sethi"
                      value={revAuthor}
                      onChange={(e) => setRevAuthor(e.target.value)}
                      className="w-full bg-[#05021a] border border-violet-500/15 rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-violet-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[9.5px] font-extrabold text-slate-455 uppercase tracking-widest mb-1.5">Your constructive comment</label>
                    <textarea
                      required
                      placeholder="Share your technical observations, ergonomics, styling feedback..."
                      rows={3}
                      value={revComment}
                      onChange={(e) => setRevComment(e.target.value)}
                      className="w-full bg-[#05021a] border border-violet-500/15 rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-violet-500 resize-none leading-normal placeholder-slate-655"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full h-9 flex items-center justify-center gap-1 rounded bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-xs font-bold uppercase tracking-widest transition-all cursor-pointer active:scale-98 shadow-md"
                  >
                    <span>Submit Feedback</span>
                  </button>

                  {revSuccess && (
                    <p className="text-[11px] text-center font-semibold text-emerald-400 bg-emerald-950/20 border border-emerald-500/15 rounded px-2.5 py-1.5 font-sans">
                      Review registered successfully! Rating average updated.
                    </p>
                  )}
                </form>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Immersive Full Screen Lightbox Visualizer for High-Res / Full-Scale viewing */}
      <AnimatePresence>
        {isZoomed && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/95 backdrop-blur-lg select-none">
            {/* Backdrop click to close */}
            <div 
              className="absolute inset-0 cursor-zoom-out" 
              onClick={() => setIsZoomed(false)}
            />
            
            {/* Close instruction */}
            <div className="absolute top-4 left-4 text-slate-400 text-[10px] font-extrabold tracking-widest uppercase font-mono bg-black/40 border border-white/5 py-1.5 px-3 rounded-lg">
              Click background to close
            </div>

            {/* Top Close Button */}
            <button
              onClick={() => setIsZoomed(false)}
              className="absolute right-6 top-6 rounded-full p-2.5 bg-[#090525]/80 hover:bg-neutral-800 border border-violet-550/20 text-white transition-colors z-50 cursor-pointer shadow-lg"
              aria-label="Close fullscreen gallery"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Left and Right navigation arrows inside fullscreen lightbox */}
            {allImages.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={() => setActiveImgIndex(prev => (prev === 0 ? allImages.length - 1 : prev - 1))}
                  className="absolute left-6 top-1/2 -translate-y-1/2 h-14 w-14 flex items-center justify-center rounded-full bg-[#05021a]/90 hover:bg-[#8b5cf6] border border-violet-550/20 text-white hover:scale-110 active:scale-90 transition-all cursor-pointer z-50 shadow-2xl"
                  aria-label="Previous picture"
                >
                  <ChevronLeft className="w-8 h-8" />
                </button>

                <button
                  type="button"
                  onClick={() => setActiveImgIndex(prev => (prev === allImages.length - 1 ? 0 : prev + 1))}
                  className="absolute right-6 top-1/2 -translate-y-1/2 h-14 w-14 flex items-center justify-center rounded-full bg-[#05021a]/90 hover:bg-[#8b5cf6] border border-violet-550/20 text-white hover:scale-110 active:scale-90 transition-all cursor-pointer z-50 shadow-2xl"
                  aria-label="Next picture"
                >
                  <ChevronRight className="w-8 h-8" />
                </button>
              </>
            )}

            {/* Immersive Image Display */}
            <div className="relative max-w-5xl max-h-[85vh] flex flex-col justify-center items-center z-40 p-2">
              <motion.img
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                src={allImages[activeImgIndex]}
                alt={product.name}
                className="max-h-[80vh] max-w-full object-contain rounded-xl shadow-2xl border border-violet-550/15 cursor-zoom-out bg-black/40"
                referrerPolicy="no-referrer"
                onClick={() => setIsZoomed(false)}
              />
              
              {/* Status footer inside gallery */}
              <div className="mt-4 flex flex-col items-center gap-1 text-center bg-[#090525]/80 px-5 py-2 rounded-xl border border-violet-550/25 backdrop-blur-md max-w-lg">
                <span className="text-[10px] font-extrabold font-mono text-violet-400 tracking-widest uppercase">
                  Angle {activeImgIndex + 1} of {allImages.length} &bull; Full Scale High-Definition Showcase
                </span>
                <span className="text-xs font-bold text-white tracking-wide uppercase mt-0.5">
                  {product.name}
                </span>
              </div>
            </div>
          </div>
        )}
      </AnimatePresence>
    </AnimatePresence>
  );
};

export default ProductDetailModal;
