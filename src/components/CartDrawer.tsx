import React from 'react';
import { useApp } from '../context/AppContext';
import { motion, AnimatePresence } from 'motion/react';
import { X, Trash2, Plus, Minus, ShoppingBag, ArrowRight } from 'lucide-react';

interface CartDrawerProps {
  onCheckoutInit: () => void;
}

const CartDrawer: React.FC<CartDrawerProps> = ({ onCheckoutInit }) => {
  const { 
    isCartOpen, 
    setIsCartOpen, 
    cart, 
    updateCartQuantity, 
    removeFromCart, 
    cartTotal 
  } = useApp();

  return (
    <AnimatePresence>
      {isCartOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          {/* Backdrop overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsCartOpen(false)}
            className="absolute inset-0 bg-black/80 backdrop-blur-md"
          />

          <div className="absolute inset-y-0 right-0 flex max-w-full pl-10">
            {/* Drawer body slide-in */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="w-screen max-w-md bg-[#090525] shadow-2xl flex flex-col h-full border-l border-violet-500/20 text-slate-100"
            >
              {/* Drawer Header */}
              <div className="px-5 py-4 border-b border-violet-950/50 flex items-center justify-between bg-[#05021a]/90">
                <div className="flex items-center gap-2">
                  <ShoppingBag className="w-4 h-4 text-[#8b5cf6]" />
                  <h3 className="text-xs font-bold text-white uppercase tracking-widest font-sans">Your Shopping Cart</h3>
                </div>
                <button
                  onClick={() => setIsCartOpen(false)}
                  className="rounded-full p-1.5 text-slate-400 hover:bg-violet-950/50 hover:text-white transition-all border border-violet-500/10"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Drawer Content */}
              <div className="flex-1 overflow-y-auto px-5 py-4 scrollbar-thin">
                {cart.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center py-12 select-none">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-violet-955/20 border border-violet-500/15 text-violet-400 mb-4 animate-pulse">
                      <ShoppingBag className="w-5 h-5" />
                    </div>
                    <h4 className="text-xs font-bold text-white uppercase tracking-widest">Your cart is currently empty</h4>
                    <p className="text-xs text-slate-400 max-w-xs mt-2 leading-relaxed font-light">
                      Explore the product catalog to discover premium acoustics, workspace layouts, and accessories.
                    </p>
                    <button
                      onClick={() => setIsCartOpen(false)}
                      className="mt-6 rounded-lg border border-violet-500/20 bg-transparent px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-violet-950/40 hover:text-white transition-all active:scale-98 cursor-pointer uppercase tracking-widest"
                    >
                      Continue Shopping
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3.5">
                    {cart.map((item) => (
                      <motion.div
                        key={item.product.id}
                        layout
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="flex items-start gap-3 rounded-xl border border-violet-500/10 p-3 bg-[#05021a]/60 select-none"
                      >
                        {/* Thumbnail */}
                        <img
                          src={item.product.image}
                          alt={item.product.name}
                          className="h-14 w-14 rounded-lg object-cover bg-[#040118] border border-violet-500/10 shrink-0"
                          referrerPolicy="no-referrer"
                        />

                        {/* Product Info */}
                        <div className="flex-1 min-w-0 leading-tight">
                          <h4 className="text-[11px] font-extrabold text-slate-200 truncate pr-2">
                            {item.product.name}
                          </h4>
                          <p className="text-[9px] text-[#8b5cf6] font-mono mt-0.5 uppercase tracking-wider">
                            {item.product.category}
                          </p>
                          <span className="text-xs font-bold text-white font-mono mt-1.5 block">
                            ₹{item.product.price.toLocaleString('en-IN')}
                          </span>

                          {/* Inventory stock checker warning banner */}
                          {item.product.stock <= 5 && (
                            <p className="text-[9px] font-extrabold text-amber-500 mt-2 uppercase font-mono tracking-widest leading-none">
                              Only {item.product.stock} items left
                            </p>
                          )}
                        </div>

                        {/* Incrementor and Delete section */}
                        <div className="flex flex-col items-end gap-2.5 shrink-0">
                          <div className="flex items-center rounded-lg border border-violet-500/15 bg-[#0d0a29] p-0.5">
                            <button
                              onClick={() => updateCartQuantity(item.product.id, item.quantity - 1)}
                              className="p-0.5 rounded text-slate-400 hover:text-white hover:bg-violet-950/30 transition-colors cursor-pointer"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="px-2 text-[11px] font-black text-white font-mono shrink-0 min-w-[16px] text-center">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() => updateCartQuantity(item.product.id, item.quantity + 1)}
                              disabled={item.quantity >= item.product.stock}
                              className="p-0.5 rounded text-slate-400 hover:text-white hover:bg-violet-955/30 disabled:opacity-35 transition-colors cursor-pointer"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>

                          <button
                            onClick={() => removeFromCart(item.product.id)}
                            className="p-1.2 text-slate-500 hover:text-red-400 hover:bg-red-950/20 border border-transparent hover:border-red-500/10 rounded-lg transition-all cursor-pointer"
                            title="Delete Item"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>

              {/* Drawer Footer calculations */}
              {cart.length > 0 && (
                <div className="border-t border-violet-950/50 px-5 py-4 bg-[#05021a]/95 select-none">
                  <div className="space-y-1.5 mb-3.5 text-[11px] leading-relaxed">
                    <div className="flex justify-between text-slate-400">
                      <span>Subtotal</span>
                      <span className="font-mono text-slate-200 font-bold">₹{cartTotal.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>Shipping estimate</span>
                      <span className="font-mono text-emerald-400 font-bold">
                        {cartTotal >= 500 ? 'FREE' : '₹39.00'}
                      </span>
                    </div>
                    <span className="block text-[9px] text-slate-500 border-t border-violet-950/30 pt-2 font-mono leading-tight">
                      Free shipping available for items totaling over ₹500
                    </span>
                  </div>

                  <div className="flex justify-between items-end border-t border-violet-950/30 pt-3 mb-4.5">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Total basket value</span>
                    <span className="text-lg font-bold tracking-tight text-[#8b5cf6] font-mono leading-none">
                      ₹{(cartTotal + (cartTotal >= 500 ? 0 : 39)).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 gap-2">
                    <button
                      onClick={() => {
                        setIsCartOpen(false);
                        onCheckoutInit();
                      }}
                      className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 shadow-md shadow-violet-600/10 hover:from-violet-500 hover:to-indigo-500 py-3 px-4 text-xs font-bold text-white transition-all group cursor-pointer uppercase tracking-widest active:scale-98"
                    >
                      <span>Secure Checkout</span>
                      <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
                    </button>
                    
                    <button
                      onClick={() => setIsCartOpen(false)}
                      className="w-full text-center py-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors cursor-pointer uppercase tracking-widest"
                    >
                      Continue Shopping
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default CartDrawer;
