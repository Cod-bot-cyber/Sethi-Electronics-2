import React from 'react';
import { useApp } from '../context/AppContext';
import { motion, AnimatePresence } from 'motion/react';
import PromoBanner from './PromoBanner';
import { 
  ShoppingBag, 
  Search, 
  User, 
  LogOut, 
  LayoutDashboard, 
  Headphones, 
  Watch, 
  Keyboard, 
  Grid,
  Settings
} from 'lucide-react';

interface NavbarProps {
  onAdminToggle: () => void;
  isAdminView: boolean;
  onAuthOpen: () => void;
  onProfileOpen: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ onAdminToggle, isAdminView, onAuthOpen, onProfileOpen }) => {
  const { 
    cartCount, 
    setIsCartOpen, 
    currentUser, 
    logout,
    activeCategory,
    setActiveCategory,
    searchQuery,
    setSearchQuery,
    categories
  } = useApp();

  const [logoUrl, setLogoUrl] = React.useState<string>(() => {
    try {
      return localStorage.getItem('custom_store_logo') || '/uploads/logo.png';
    } catch {
      return '/uploads/logo.png';
    }
  });

  const [isSettingsOpen, setIsSettingsOpen] = React.useState(false);
  const settingsRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (settingsRef.current && !settingsRef.current.contains(event.target as Node)) {
        setIsSettingsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  React.useEffect(() => {
    const handleStorage = () => {
      try {
        const stored = localStorage.getItem('custom_store_logo');
        if (stored) {
          setLogoUrl(stored);
        }
      } catch {}
    };
    window.addEventListener('storage', handleStorage);
    const interval = setInterval(handleStorage, 1000);
    return () => {
      window.removeEventListener('storage', handleStorage);
      clearInterval(interval);
    };
  }, []);

  // Map slugs to icons
  const getCategoryIcon = (slug: string) => {
    switch (slug) {
      case 'audio': return <Headphones className="w-4 h-4" />;
      case 'wearables': return <Watch className="w-4 h-4" />;
      case 'workplace': return <Keyboard className="w-4 h-4" />;
      default: return <Grid className="w-4 h-4" />;
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-45 w-full border-b border-violet-955/60 bg-[#030014]/95 backdrop-blur-md select-none">
      
      {/* Top running promotion carousel */}
      {!isAdminView && (
        <PromoBanner />
      )}

      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        
        {/* Left: Brand Logo & Admin Toggle */}
        <div className="flex items-center gap-6">
          <a 
            href="#" 
            onClick={() => { setActiveCategory('all'); setSearchQuery(''); }}
            className="flex items-center gap-4.5 group"
          >
            <div className="relative flex h-11 w-11 items-center justify-center rounded-xl overflow-hidden bg-gradient-to-br from-violet-600 via-indigo-600 to-blue-500 text-white font-extrabold text-2xl italic transition-transform group-hover:scale-105 shadow-md shadow-violet-500/25">
              <img 
                src={logoUrl} 
                alt="Sethi Electronics Logo" 
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  if (target.src !== '/logo.png') {
                    target.src = '/logo.png';
                  } else {
                    target.style.display = 'none';
                  }
                }}
                className="absolute inset-0 w-full h-full object-cover z-10"
              />
              <span className="relative z-0 select-none font-display">S</span>
            </div>
            <span className="font-extrabold text-base sm:text-lg tracking-widest text-[#f8fafc] uppercase font-display">
              SETHI ELECTRONICS<span className="text-violet-400 uppercase text-[10px] ml-1.5 font-extrabold px-1.5 py-0.5 rounded bg-violet-500/10 border border-violet-500/20">store</span>
            </span>
          </a>

          {/* Role Status Tag Indicator */}
          {currentUser?.isAdmin && (
            <button
              onClick={onAdminToggle}
              className={`hidden sm:flex items-center gap-1.5 px-3 py-1 rounded text-[10px] font-extrabold uppercase tracking-widest transition-all duration-300 ${
                isAdminView 
                  ? 'bg-indigo-950/60 text-indigo-300 border border-indigo-500/35' 
                  : 'bg-emerald-950/60 text-emerald-400 border border-emerald-500/35 hover:bg-emerald-900/50'
              }`}
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
              {isAdminView ? 'Admin Desk Active' : 'Go To Admin Desk'}
            </button>
          )}
        </div>

        {/* Center Search - Ignored if in admin view */}
        {!isAdminView && (
          <div className="hidden md:flex relative max-w-md w-full mx-8">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <Search className="h-3.5 w-3.5 text-slate-450" />
            </div>
            <input
              type="text"
              placeholder="Search premium mechanics, sound boards..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#0a0525]/60 hover:bg-[#0e092f]/80 border border-violet-500/15 rounded-md px-3 py-1.5 pl-9 text-xs focus:ring-1 focus:ring-violet-500 focus:border-violet-500 outline-none text-slate-100 placeholder-slate-400 transition-all font-sans"
            />
          </div>
        )}

        {/* Right Actions */}
        <div className="flex items-center gap-3">
          
          {/* Cart Trigger Badge (Only in buyer mode) */}
          {!isAdminView && (
            <button
              onClick={() => setIsCartOpen(true)}
              className="relative flex h-8 w-8 items-center justify-center rounded border border-violet-500/15 hover:border-violet-500/40 transition-all bg-[#0a0525]/60 hover:bg-violet-950/20 group"
              id="cart-trigger-button"
            >
              <ShoppingBag className="h-4 w-4 text-slate-450 group-hover:text-violet-400 transition-colors" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4.5 w-4.5 items-center justify-center rounded-full bg-violet-600 text-[9px] font-bold text-white shadow-md font-mono border border-[#030014]">
                  {cartCount}
                </span>
              )}
            </button>
          )}

          {/* Settings Dropdown Trigger */}
          <div className="relative" ref={settingsRef}>
            <button
              onClick={() => setIsSettingsOpen(!isSettingsOpen)}
              className={`relative flex h-8 w-8 items-center justify-center rounded border transition-all duration-300 bg-[#0a0525]/60 hover:bg-violet-950/20 group cursor-pointer ${
                isSettingsOpen 
                  ? 'border-violet-500 text-violet-400' 
                  : 'border-violet-500/15 text-slate-450 hover:border-violet-500/40 hover:text-violet-400'
              }`}
              title="Settings & Profile"
            >
              <motion.div
                animate={{ rotate: isSettingsOpen ? 45 : 0 }}
                transition={{ type: "spring", stiffness: 200, damping: 15 }}
              >
                <Settings className="h-4 w-4" />
              </motion.div>
            </button>

            <AnimatePresence>
              {isSettingsOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  transition={{ duration: 0.15, ease: "easeOut" }}
                  className="absolute right-0 mt-2 w-60 origin-top-right rounded-lg border border-violet-500/20 bg-[#07031e]/95 p-2 shadow-xl shadow-black/80 backdrop-blur-md z-50 flex flex-col gap-1"
                >
                  {currentUser ? (
                    <>
                      {/* User identity & billing status banner */}
                      <div className="px-3 py-2 rounded-md bg-violet-500/10 border border-violet-500/10 mb-1 flex items-center gap-2.5">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-violet-600 to-indigo-600 text-white font-bold text-xs select-none">
                          {currentUser.displayName ? currentUser.displayName.charAt(0).toUpperCase() : 'U'}
                        </div>
                        <div className="flex flex-col min-w-0 leading-tight">
                          <span className="text-xs font-bold text-slate-100 truncate block">
                            {currentUser.displayName || "Google Customer"}
                          </span>
                          <span className="text-[10px] text-violet-400 font-mono truncate block mt-0.5">
                            {currentUser.email}
                          </span>
                        </div>
                      </div>

                      {/* Account core options */}
                      <button
                        onClick={() => {
                          setIsSettingsOpen(false);
                          onProfileOpen();
                        }}
                        className="group flex w-full items-center gap-2.5 rounded-md px-2.5 py-1.5 text-left text-xs font-semibold text-slate-300 hover:bg-violet-950/30 hover:text-white transition-all cursor-pointer"
                      >
                        <User className="h-3.5 w-3.5 text-violet-400 group-hover:scale-105 transition-transform" />
                        <span>Account Portal</span>
                      </button>

                      {/* Admin panel navigation (if applicable) */}
                      {currentUser.isAdmin && (
                        <button
                          onClick={() => {
                            setIsSettingsOpen(false);
                            onAdminToggle();
                          }}
                          className={`group flex w-full items-center gap-2.5 rounded-md px-2.5 py-1.5 text-left text-xs font-semibold hover:bg-violet-950/30 cursor-pointer ${
                            isAdminView ? 'text-violet-400' : 'text-emerald-450 hover:text-emerald-300'
                          }`}
                        >
                          <LayoutDashboard className="h-3.5 w-3.5" />
                          <span>{isAdminView ? "Leave Admin Desk" : "Go to Admin Desk"}</span>
                        </button>
                      )}

                      <div className="my-1 border-t border-violet-950/50" />

                      <button
                        onClick={() => {
                          setIsSettingsOpen(false);
                          logout();
                        }}
                        className="group flex w-full items-center gap-2.5 rounded-md px-2.5 py-1.5 text-left text-xs font-semibold text-slate-400 hover:bg-red-950/20 hover:text-red-400 transition-all cursor-pointer"
                      >
                        <LogOut className="h-3.5 w-3.5 text-slate-500 group-hover:text-red-400" />
                        <span>Logout</span>
                      </button>
                    </>
                  ) : (
                    <>
                      <div className="px-2.5 py-1.5 text-[10px] text-slate-400 select-none">
                        Sign in to purchase premium features, view logs, and more.
                      </div>
                      <div className="my-1 border-t border-violet-950/50" />
                      <button
                        onClick={() => {
                          setIsSettingsOpen(false);
                          onAuthOpen();
                        }}
                        className="flex w-full h-8 items-center justify-center gap-1.5 rounded bg-gradient-to-r from-violet-600 to-indigo-600 px-3 text-xs font-bold text-white hover:from-violet-500 hover:to-indigo-500 transition-all cursor-pointer"
                      >
                        <User className="h-3.5 w-3.5" />
                        <span>Login</span>
                      </button>
                    </>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Mobile Search and Category rail */}
      {!isAdminView && (
        <div className="border-t border-violet-950/40 py-2 md:hidden bg-[#030014]">
          <div className="px-4">
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <Search className="h-3.5 w-3.5 text-slate-400" />
              </div>
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#0a0525]/60 hover:bg-[#0e092f]/80 border border-violet-500/15 rounded-md px-3 py-1.5 pl-9 text-xs focus:ring-1 focus:ring-violet-500 focus:border-violet-500 outline-none text-slate-100 placeholder-slate-450"
              />
            </div>
          </div>
        </div>
      )}

      {/* Sub-Header Dynamic Category Navigation - Visible in Storefront Only */}
      {!isAdminView && (
        <div id="navbar-category-selectors" className="border-t border-violet-950/40 bg-[#05021f]/95 overflow-hidden">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex h-9 items-center gap-2.5 overflow-x-auto scrollbar-none py-1">
              <button
                onClick={() => setActiveCategory('all')}
                className={`flex h-6.5 items-center gap-1 rounded-md px-3 text-[10.5px] font-extrabold uppercase tracking-wider transition-all duration-200 whitespace-nowrap cursor-pointer ${
                  activeCategory === 'all'
                    ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-md shadow-violet-500/15'
                    : 'bg-violet-950/15 border border-violet-500/10 text-slate-400 hover:text-white hover:border-violet-500/25'
                }`}
              >
                All Products
              </button>
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.slug)}
                  className={`flex h-6.5 items-center gap-1.5 rounded-md px-3 text-[10.5px] font-extrabold uppercase tracking-wider transition-all duration-200 whitespace-nowrap cursor-pointer ${
                    activeCategory === cat.slug
                      ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-md shadow-violet-500/15'
                      : 'bg-violet-950/15 border border-violet-500/10 text-slate-400 hover:text-white hover:border-violet-500/25'
                  }`}
                >
                  {getCategoryIcon(cat.slug)}
                  {cat.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

    </header>
  );
};

export default Navbar;
