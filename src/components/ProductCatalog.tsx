import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { Product } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Star, Tag, Info, ShoppingCart, SlidersHorizontal, ArrowUpDown, RefreshCcw } from 'lucide-react';
import ProductDetailModal from './ProductDetailModal';

const ProductCatalog: React.FC = () => {
  const { 
    products, 
    addToCart, 
    activeCategory, 
    setActiveCategory,
    searchQuery,
    setSearchQuery,
    sortBy,
    setSortBy,
    resetInventory,
    isLoading
  } = useApp();

  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isResetting, setIsResetting] = useState(false);

  // --- CATALOG FILTER LAYERS ---
  const filteredProducts = useMemo(() => {
    let result = [...products];

    // Category check
    if (activeCategory !== 'all') {
      result = result.filter(p => p.category === activeCategory);
    }

    // Search query check
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      result = result.filter(p => 
        p.name.toLowerCase().includes(query) || 
        p.description.toLowerCase().includes(query) ||
        p.category.toLowerCase().includes(query)
      );
    }

    // Sort order check
    if (sortBy === 'price-asc') {
      result.sort((a, b) => a.price - b.price);
    } else if (sortBy === 'price-desc') {
      result.sort((a, b) => b.price - a.price);
    } else if (sortBy === 'rating') {
      result.sort((a, b) => b.rating - a.rating);
    } else {
      // Default: featured/created
      result.sort((a, b) => b.salesCount - a.salesCount);
    }

    return result;
  }, [products, activeCategory, searchQuery, sortBy]);

  // Discount percentage helper
  const getDiscountPercent = (price: number, original?: number) => {
    if (!original || original <= price) return null;
    const discount = ((original - price) / original) * 100;
    return Math.round(discount);
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 select-none bg-[#030014]">
      
      {/* Intro info banner */}
      <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-violet-950/60 pb-5">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold tracking-widest text-white font-display uppercase">
            {activeCategory === 'all' ? 'All Curated Gear' : `${activeCategory.toUpperCase()} Lineup`}
          </h2>
          <p className="text-xs text-slate-400 mt-1.5 font-light">High-end hardware nodes with persistent inventory & encrypted billing</p>
        </div>

        {/* Catalog Sort Sorter toggles */}
        <div className="flex items-center gap-2 bg-[#0b0728]/80 border border-violet-500/20 p-1.5 rounded-lg shadow-md">
          <span className="text-[10px] uppercase font-extrabold text-[#8b5cf6] tracking-widest px-2 flex items-center gap-1.5">
            <ArrowUpDown className="w-3.5 h-3.5 text-violet-400" />
            Sort
          </span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="text-xs font-bold text-slate-200 bg-[#06031b] border border-violet-500/10 rounded px-2.5 py-1 outline-none focus:border-violet-500 cursor-pointer font-sans"
          >
            <option value="featured">Best Seller</option>
            <option value="price-asc">Price: Low to High</option>
            <option value="price-desc">Price: High to Low</option>
            <option value="rating">Top Rated</option>
          </select>
        </div>
      </div>

      {/* Empty States */}
      {filteredProducts.length === 0 ? (
        <div className="text-center py-16 px-6 border border-dashed border-violet-500/20 rounded-2xl bg-[#090525]/30 max-w-lg mx-auto shadow-lg backdrop-blur-md">
          {isLoading && products.length === 0 ? (
            <>
              <RefreshCcw className="w-12 h-12 text-violet-400 mx-auto mb-4 animate-spin" />
              <h3 className="text-base font-extrabold text-white uppercase tracking-wider font-mono">Synchronizing Secure Inventory...</h3>
              <p className="text-xs text-slate-400 mt-2 max-w-xs mx-auto font-light leading-relaxed">
                Connecting to the secure catalog ledger network. Please wait standard handshake clearance...
              </p>
            </>
          ) : products.length === 0 ? (
            <>
              <RefreshCcw className={`w-12 h-12 text-violet-400 mx-auto mb-4 ${isResetting ? 'animate-spin' : 'animate-pulse'}`} />
              <h3 className="text-base font-extrabold text-white uppercase tracking-wider font-mono">Store Inventory is Empty</h3>
              <p className="text-xs text-slate-400 mt-2 max-w-xs mx-auto font-light leading-relaxed">
                The local database or Firestore products collection does not contain any entries right now.
              </p>
              <button
                type="button"
                disabled={isResetting}
                onClick={async () => {
                  setIsResetting(true);
                  try {
                    await resetInventory();
                  } catch (e) {
                    console.error(e);
                  } finally {
                    setIsResetting(false);
                  }
                }}
                className="mt-6 inline-flex h-9 items-center gap-2 rounded-lg bg-gradient-to-r from-violet-600 to-indigo-650 px-5 text-xs font-bold uppercase tracking-widest text-white shadow-md hover:from-violet-500 hover:to-indigo-500 transition-all cursor-pointer disabled:opacity-50"
              >
                <RefreshCcw className={`w-3.5 h-3.5 ${isResetting ? 'animate-spin' : ''}`} />
                <span>{isResetting ? 'Restoring...' : 'Restore Default Curated Gear'}</span>
              </button>
            </>
          ) : (
            <>
              <Info className="w-12 h-12 text-slate-600 mx-auto animate-pulse mb-4" />
              <h3 className="text-base font-extrabold text-white">No products match your filters</h3>
              <p className="text-xs text-slate-400 mt-2 max-w-xs mx-auto font-light leading-relaxed">
                Try checking formatting constraints, removing search keywords, or resetting your choices.
              </p>
              
              {/* Display active specifications of empty search results */}
              <div className="mt-4 p-2.5 rounded-lg bg-[#05021a]/85 border border-violet-500/10 text-[10px] text-left font-mono space-y-1 text-slate-400 max-w-xs mx-auto">
                <div className="flex justify-between">
                  <span>Category filter:</span>
                  <span className="text-violet-300 font-bold uppercase">{activeCategory}</span>
                </div>
                {searchQuery && (
                  <div className="flex justify-between">
                    <span>Search query:</span>
                    <span className="text-indigo-300 font-bold truncate max-w-[120px]">"{searchQuery}"</span>
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setActiveCategory('all');
                }}
                className="mt-6 inline-flex h-9 items-center gap-2 rounded-lg bg-[#05021a] hover:bg-[#110c33] border border-violet-500/25 px-5 text-xs font-bold uppercase tracking-widest text-slate-200 hover:text-white transition-all cursor-pointer"
              >
                <span>Clear Filters & Reset</span>
              </button>
            </>
          )}
        </div>
      ) : (
        /* Dynamic curated catalog grid */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {filteredProducts.map((p) => {
            const discount = getDiscountPercent(p.price, p.originalPrice);
            return (
              <motion.div
                key={p.id}
                layout
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                className="group relative flex flex-col justify-between bg-[#0a0621]/50 backdrop-blur-md rounded-2xl border border-violet-500/10 overflow-hidden hover:-translate-y-1.5 hover:bg-[#110c33]/70 hover:border-violet-500/25 transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] h-full shadow-md hover:shadow-xl hover:shadow-violet-950/25"
              >
                
                {/* Image section */}
                <div className="relative aspect-square overflow-hidden bg-[#0a061d]/50 w-full cursor-pointer border-b border-violet-950/40" onClick={() => setSelectedProduct(p)}>
                  <img
                    src={p.image}
                    alt={p.name}
                    className="h-full w-full object-cover transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.02] opacity-80 group-hover:opacity-100"
                    referrerPolicy="no-referrer"
                  />
                  
                  {/* Category Pill Tag */}
                  <span className="absolute top-2.5 left-2.5 rounded bg-[#030014]/80 px-2.5 py-0.5 text-[9px] font-extrabold text-violet-300 border border-violet-500/25 capitalize tracking-wider select-none font-sans">
                    {p.category}
                  </span>

                  {/* Discount percentage tag */}
                  {discount && (
                    <span className="absolute top-2.5 right-2.5 rounded bg-gradient-to-r from-violet-600 to-indigo-600 px-2 py-0.5 text-[9px] font-extrabold text-white tracking-widest flex items-center gap-0.5 select-none shadow-md uppercase font-sans">
                      <Tag className="w-2.5 h-2.5 fill-white text-indigo-500" />
                      {discount}% OFF
                    </span>
                  )}

                  {/* Out of stock dark veil overlay */}
                  {p.stock === 0 && (
                    <div className="absolute inset-0 bg-slate-950/65 backdrop-blur-xs flex items-center justify-center">
                      <span className="rounded bg-red-500/20 border border-red-500/40 px-3 py-1 text-xs font-bold text-red-400 uppercase tracking-widest">
                        Sold Out
                      </span>
                    </div>
                  )}
                </div>

                {/* Info and Actions description bottom panel */}
                <div className="p-4 flex-1 flex flex-col justify-between select-none">
                  <div>
                    {/* Header title */}
                    <div className="flex justify-between items-start gap-2 max-w-full">
                      <h3 className="text-xs sm:text-sm font-extrabold text-white truncate group-hover:text-violet-300 transition-colors duration-300 cursor-pointer" onClick={() => setSelectedProduct(p)}>
                        {p.name}
                      </h3>
                    </div>

                    {/* rating Stars */}
                    <div className="flex items-center gap-1 mt-1.5">
                      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400 stroke-none" />
                      <span className="text-[10px] font-bold text-slate-300 font-mono leading-none pt-0.5">{p.rating.toFixed(1)}</span>
                      <span className="text-[10px] text-slate-400 font-light font-sans">({p.salesCount} sold)</span>
                    </div>

                    <p className="text-[11px] text-slate-400 mt-2.5 line-clamp-2 leading-relaxed font-sans font-light">
                      {p.description}
                    </p>
                  </div>

                  {/* Pricing and Cart button row */}
                  <div className="mt-4 pt-3.5 border-t border-violet-950/40 flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-extrabold text-white tracking-tight font-mono">
                          ₹{p.price.toLocaleString('en-IN')}
                        </span>
                        {p.originalPrice && (
                          <span className="text-[10px] text-slate-500 line-through font-mono">
                            ₹{p.originalPrice.toLocaleString('en-IN')}
                          </span>
                        )}
                      </div>
                      
                      {/* Live Dynamic Stock Levels warning */}
                      {p.stock === 0 ? (
                        <span className="inline-block mt-1.5 font-bold text-[9px] uppercase tracking-wider font-sans text-red-400 bg-red-500/10 border border-red-500/20 px-1 py-0.5 rounded">
                          Out of stock
                        </span>
                      ) : p.stock <= 5 ? (
                        <span className="inline-block mt-1.5 font-bold text-[9px] uppercase tracking-wider font-sans text-amber-400 bg-amber-500/10 border border-amber-500/20 px-1 py-0.5 rounded">
                          Only {p.stock} left
                        </span>
                      ) : (
                        <span className="inline-block mt-1.5 font-semibold text-[9px] uppercase tracking-wider font-sans text-slate-500">
                          In Stock ({p.stock})
                        </span>
                      )}
                    </div>

                    <button
                      onClick={() => addToCart(p)}
                      disabled={p.stock === 0}
                      className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 disabled:opacity-20 disabled:hover:from-violet-600 text-white transition-all duration-150 active:scale-95 cursor-pointer leading-none relative shadow-md shadow-violet-600/10 border border-violet-500/20"
                      title="Add to Basket"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>

                </div>

              </motion.div>
            );
          })}
        </div>
      )}

      {/* zoom Product Spec Sheet Modal Popup */}
      <ProductDetailModal 
        product={selectedProduct} 
        isOpen={!!selectedProduct} 
        onClose={() => setSelectedProduct(null)} 
      />

    </div>
  );
};

export default ProductCatalog;
