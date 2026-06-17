import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import Navbar from './components/Navbar';
import ProductCatalog from './components/ProductCatalog';
import CartDrawer from './components/CartDrawer';
import CheckoutForm from './components/CheckoutForm';
import AdminDashboard from './components/AdminDashboard';
import PromoCarousel from './components/PromoCarousel';
import AuthModal from './components/AuthModal';
import UserProfileModal from './components/UserProfileModal';
import { motion, AnimatePresence } from 'motion/react';
import { ShieldCheck, Truck, RotateCcw, AlertCircle, ShoppingBag, Sparkles, MoveRight, Mail, Phone } from 'lucide-react';


const StorefrontLayout: React.FC<{ onCheckoutOpen: () => void }> = ({ onCheckoutOpen }) => {
  const { searchQuery, activeCategory } = useApp();

  return (
    <div className="flex flex-col min-h-screen bg-[#030014]">
      {/* Curated Interactive Carousel Hero Section */}
      {(!searchQuery && activeCategory === 'all') && (
        <div className="py-6 px-4 sm:px-6 lg:px-8">
          <PromoCarousel />
        </div>
      )}

      {/* Interactive Grid Catalog List */}
      <ProductCatalog />

      {/* Global Shipping & PCI Trust Badges Block */}
      <section className="bg-[#0b0728]/45 border-t border-b border-violet-950/40 py-10 px-4 select-none">
        <div className="mx-auto max-w-7xl grid grid-cols-1 sm:grid-cols-3 gap-8 justify-items-center sm:justify-items-stretch">
          
          <div className="flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-4 p-4 rounded-xl hover:bg-violet-950/20 transition-all">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#140e3d] border border-violet-500/25 text-violet-400 shrink-0">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">Complimentary Logistics</h4>
              <p className="text-[11px] text-slate-400 mt-1.5 leading-normal">Free high-priority express freight tracking for all orders exceeding ₹500.</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-4 p-4 rounded-xl hover:bg-violet-950/20 transition-all">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#140e3d] border border-violet-500/25 text-violet-400 shrink-0">
              <RotateCcw className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">30-Day Restitution Guarantee</h4>
              <p className="text-[11px] text-slate-400 mt-1.5 leading-normal">Satisfying structural return terms provided with full refund support.</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-4 p-4 rounded-xl hover:bg-violet-950/20 transition-all">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#140e3d] border border-violet-500/25 text-violet-400 shrink-0">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">PCI DSS Settled Gateway</h4>
              <p className="text-[11px] text-slate-400 mt-1.5 leading-normal">Transactions are hashed and synchronized through secure cloud ledger databases.</p>
            </div>
          </div>

        </div>
      </section>

      {/* Elegant Cosmic Footer */}
      <footer className="bg-[#040118] py-12 border-t border-violet-950/50 select-none text-slate-400">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          
          {/* Main Footer Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pb-10 border-b border-violet-950/30">
            {/* Column 1: Brand Info */}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="relative flex h-9 w-9 items-center justify-center rounded-lg overflow-hidden bg-gradient-to-br from-violet-600 via-indigo-600 to-blue-500 text-white font-extrabold text-lg italic shadow-md">
                  <img 
                    src={(() => {
                      try { return localStorage.getItem('custom_store_logo') || '/uploads/logo.png'; } catch { return '/uploads/logo.png'; }
                    })()} 
                    alt="Sethi Electronics Logo" 
                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                    className="absolute inset-0 h-full w-full object-cover"
                  />
                  <span>S</span>
                </div>
                <span className="text-sm font-bold text-white uppercase tracking-wider">Sethi Electronics Co.</span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed font-light">
                High-fidelity, studio-grade hardware nodes and auditory instruments powered by decentralized secure clearing and lightning-fast logistics.
              </p>
            </div>

            {/* Column 2: Safety & Compliance */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">Guarantees & Compliance</h4>
              <ul className="space-y-2 text-xs text-slate-400 font-light">
                <li className="hover:text-violet-400 transition-colors cursor-pointer">• Compliant PCI-DSS Secure Gateways</li>
                <li className="hover:text-violet-400 transition-colors cursor-pointer">• Real-time India Post & Courier Tracker</li>
                <li className="hover:text-violet-400 transition-colors cursor-pointer">• Verified 30-Day Restitution Guarantees</li>
                <li className="hover:text-violet-400 transition-colors cursor-pointer">• Distributed Cloud Storage</li>
              </ul>
            </div>

            {/* Column 3: Contact details */}
            <div className="space-y-4">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">Customer Support Desk</h4>
              <div className="space-y-2.5">
                <p className="text-xs text-slate-400 leading-normal font-light">
                  Have questions about custom nodes, delivery timelines, or bulk orders? Connect directly with our support helpdesk instantly.
                </p>
                
                {/* Contact Actions Buttons */}
                <div className="flex flex-col gap-2">
                  <a 
                    href="mailto:hardikimpwork@gmail.com"
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-violet-950/40 hover:bg-violet-900/50 border border-violet-500/20 text-xs font-mono font-bold text-white hover:text-violet-300 transition-all shadow-md group/email justify-center md:justify-start"
                  >
                    <Mail className="w-3.5 h-3.5 text-violet-400 group-hover/email:scale-110 transition-transform" />
                    <span>hardikimpwork@gmail.com</span>
                  </a>
                  
                  <a 
                    href="tel:7060784706"
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-950/40 hover:bg-indigo-900/50 border border-indigo-500/20 text-xs font-mono font-bold text-white hover:text-indigo-300 transition-all shadow-md group/phone justify-center md:justify-start"
                  >
                    <Phone className="w-3.5 h-3.5 text-indigo-400 group-hover/phone:scale-110 transition-transform" />
                    <span>Call US: +91 7060784706</span>
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom section with copyright links and a centered logo at bottom */}
          <div className="mt-8 flex flex-col md:flex-row justify-between items-center gap-6 text-[11px] text-slate-500">
            <span>&copy; {new Date().getFullYear()} Sethi Electronics. All copyrights protected.</span>
            
            {/* Center Logo/Icon at bottom */}
            <div className="flex flex-col items-center gap-2">
              <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-[#090525] border border-violet-500/20 shadow-2xl overflow-hidden shadow-violet-500/10 group">
                <div className="absolute inset-0 bg-gradient-to-tr from-violet-600/10 to-indigo-600/10 opacity-75 group-hover:scale-110 transition-transform" />
                <img 
                  src={(() => {
                    try { return localStorage.getItem('custom_store_logo') || '/uploads/logo.png'; } catch { return '/uploads/logo.png'; }
                  })()} 
                  alt="Sethi Electronics Logo Bottom" 
                  onError={(e) => { (e.target as HTMLImageElement).style.opacity = '0'; }}
                  className="z-10 h-8 w-8 object-contain drop-shadow"
                />
              </div>
              <span className="text-[9px] uppercase font-bold tracking-widest text-[#8b5cf6] font-mono">SETHI ELECTRONICS</span>
            </div>

            <div className="flex gap-4">
              <a href="#" className="hover:text-indigo-400 transition-colors">API Security Rules</a>
              <a href="#" className="hover:text-indigo-400 transition-colors">Compliance Audit</a>
              <a href="#" className="hover:text-indigo-400 transition-colors">Terms of Service</a>
            </div>
          </div>
          
        </div>
      </footer>
    </div>
  );
};

const MainWrapper: React.FC = () => {
  const { currentUser, isAuthOpen, setIsAuthOpen } = useApp();
  const [isAdminView, setIsAdminView] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  // Fallback view role syncing
  const activeAdminView = isAdminView && (currentUser?.isAdmin || false);

  return (
    <div className="min-h-screen bg-[#030014] text-slate-100 antialiased font-sans flex flex-col justify-between relative">
      <div className="transition-all duration-700 flex-1 flex flex-col">
        {/* Navigation Head */}
        <Navbar 
          onAdminToggle={() => setIsAdminView(!isAdminView)} 
          isAdminView={activeAdminView} 
          onAuthOpen={() => setIsAuthOpen(true)}
          onProfileOpen={() => setIsProfileOpen(true)}
        />

        {/* Spacer for Fixed Navbar layout */}
        <div className={`${
          activeAdminView 
            ? 'h-[56px] sm:h-[64px]' 
            : 'h-[182px] md:h-[134px]'
        } w-full shrink-0 select-none transition-all duration-300`} />

        {/* Core application body views */}
        <main className="flex-1 w-full relative bg-[#030014]">
          {activeAdminView ? (
            <AdminDashboard />
          ) : (
            <StorefrontLayout onCheckoutOpen={() => {
              if (!currentUser) {
                setIsAuthOpen(true);
              } else {
                setIsCheckoutOpen(true);
              }
            }} />
          )}
        </main>
      </div>

      {/* Slide-out cart drawer overlay lines */}
      <CartDrawer onCheckoutInit={() => {
        if (!currentUser) {
          setIsAuthOpen(true);
        } else {
          setIsCheckoutOpen(true);
        }
      }} />

      {/* Full check-out transactional form panel sheet */}
      <AnimatePresence>
        {isCheckoutOpen && currentUser && (
          <CheckoutForm onClose={() => setIsCheckoutOpen(false)} />
        )}
      </AnimatePresence>

      {/* Auth Modal Portal at Root Level */}
      <AnimatePresence>
        {isAuthOpen && (
          <AuthModal 
            isOpen={isAuthOpen} 
            onClose={() => {
              setIsAuthOpen(false);
            }} 
            isLocked={false}
          />
        )}
      </AnimatePresence>

      {/* User Dynamic Profile Information & live tracking */}
      <AnimatePresence>
        {isProfileOpen && currentUser && (
          <UserProfileModal isOpen={isProfileOpen} onClose={() => setIsProfileOpen(false)} />
        )}
      </AnimatePresence>
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainWrapper />
    </AppProvider>
  );
}
