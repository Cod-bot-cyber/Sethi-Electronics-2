import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  User, 
  MapPin, 
  ClipboardList, 
  CheckCircle, 
  Truck, 
  PackageCheck, 
  Receipt, 
  Save, 
  Search, 
  Compass, 
  Activity, 
  Calendar, 
  ShieldCheck, 
  ChevronRight, 
  Clock 
} from 'lucide-react';
import { ShippingAddress, Order, OrderStatus } from '../types';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const UserProfileModal: React.FC<UserProfileModalProps> = ({ isOpen, onClose }) => {
  const { currentUser, updateProfileAddress, orders } = useApp();
  const [activeTab, setActiveTab] = useState<'address' | 'orders' | 'tracking'>('address');
  const [trackingIdInput, setTrackingIdInput] = useState('');
  const [trackedOrder, setTrackedOrder] = useState<Order | null>(null);
  const [trackingError, setTrackingError] = useState<string | null>(null);

  // Address inputs
  const [fullName, setFullName] = useState('');
  const [street, setStreet] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [country, setCountry] = useState('');
  const [landmark, setLandmark] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Auto-populate from currentUser dynamic address on load
  useEffect(() => {
    if (currentUser?.savedAddress) {
      const sa = currentUser.savedAddress;
      setFullName(sa.fullName || '');
      setStreet(sa.street || '');
      setCity(sa.city || '');
      setState(sa.state || '');
      setPostalCode(sa.postalCode || '');
      setCountry(sa.country || '');
      setLandmark(sa.landmark || '');
      setContactPhone(sa.contactPhone || '');
    } else {
      setFullName(currentUser?.displayName || '');
      setStreet('');
      setCity('');
      setState('');
      setPostalCode('');
      setCountry('');
      setLandmark('');
      setContactPhone(currentUser?.phoneNumber || '');
    }
  }, [currentUser, isOpen]);

  // Set default tracked order to the most recent one if any exists on opened tracking
  useEffect(() => {
    if (activeTab === 'tracking' && !trackedOrder && myOrders.length > 0) {
      setTrackedOrder(myOrders[0]);
      setTrackingIdInput(myOrders[0].id);
    }
    setTrackingError(null);
  }, [activeTab]);

  if (!currentUser) return null;

  const handleSaveAddress = (e: React.FormEvent) => {
    e.preventDefault();
    const address: ShippingAddress = {
      fullName,
      street,
      city,
      state,
      postalCode,
      country,
      landmark,
      contactPhone
    };
    updateProfileAddress(address);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2000);
  };

  // Lookup Order Tracking ID
  const handleTrackingSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setTrackingError(null);
    const sanitizedId = trackingIdInput.trim();
    if (!sanitizedId) return;

    const found = orders.find(o => o.id.toLowerCase() === sanitizedId.toLowerCase());
    if (found) {
      setTrackedOrder(found);
    } else {
      setTrackedOrder(null);
      setTrackingError(`Tracking Hub error: Order ID "${sanitizedId}" was not found in the decentralized warehouse register.`);
    }
  };

  const selectOrderToTrack = (orderId: string) => {
    const found = orders.find(o => o.id === orderId);
    if (found) {
      setTrackedOrder(found);
      setTrackingIdInput(orderId);
      setActiveTab('tracking');
    }
  };

  // Filter orders related to this logged-in customer
  const myOrders = orders.filter(o => o.userId === currentUser.uid || o.customerEmail === currentUser.email);

  // Status mapping tracker progress percentage
  const getProgressSpecs = (status: OrderStatus) => {
    switch (status) {
      case OrderStatus.PENDING_PAYMENT:
        return { percent: 10, step: 1, label: 'Pending Payment' };
      case OrderStatus.PAYMENT_SUBMITTED:
        return { percent: 25, step: 1, label: 'Payment Submitted' };
      case OrderStatus.UNDER_VERIFICATION:
        return { percent: 40, step: 1.5, label: 'Under Verification' };
      case OrderStatus.CONFIRMED:
        return { percent: 60, step: 2, label: 'Payment Confirmed' };
      case OrderStatus.SHIPPED:
        return { percent: 80, step: 3, label: 'Shipped (In Transit)' };
      case OrderStatus.DELIVERED:
        return { percent: 100, step: 4, label: 'Delivered' };
      case OrderStatus.REJECTED:
        return { percent: 0, step: 0, label: 'Rejected (Payment Unverified)' };
      case OrderStatus.CANCELLED:
        return { percent: 0, step: 0, label: 'Cancelled' };
      default:
        return { percent: 15, step: 1, label: 'Processing' };
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop overlay */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/75 backdrop-blur-md"
        />

        {/* Modal Sheet panel */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 20 }}
          className="relative w-full max-w-2xl overflow-hidden rounded-2xl bg-[#090525] border border-violet-500/20 shadow-2xl max-h-[90vh] flex flex-col z-10"
        >
          {/* Close key */}
          <button
            onClick={onClose}
            className="absolute right-4 top-4 rounded-full p-2 text-slate-400 hover:bg-violet-950/40 hover:text-white transition-colors z-20 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>

           {/* Modal Header */}
          <div className="p-6 border-b border-violet-950/60 bg-[#0c082e] flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="h-10 w-10 bg-gradient-to-tr from-violet-600 to-indigo-600 text-white rounded-xl flex items-center justify-center shadow-lg shadow-violet-650/15">
                <User className="w-5 h-5 text-slate-100" />
              </div>
              <div>
                <h3 className="text-md font-extrabold text-white tracking-widest font-display uppercase">Customer Core Portal</h3>
                <p className="text-[10px] text-slate-400 font-mono lower-case tracking-wide mt-1">{currentUser.email}</p>
              </div>
            </div>

            {/* Static secure role representation */}
            <div className="flex items-center gap-2">
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest select-none">Access Privilege:</span>
              <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[9.5px] font-extrabold uppercase tracking-wider border select-none ${
                currentUser.isAdmin
                  ? 'bg-indigo-950/45 text-violet-400 border-violet-500/30'
                  : 'bg-emerald-950/20 text-emerald-400 border-emerald-500/15'
              }`}>
                {currentUser.isAdmin ? 'System Administrator' : 'Verified Customer'}
              </span>
            </div>
          </div>

          {/* Tab Selector switches */}
          <div className="flex overflow-x-auto scrollbar-none border-b border-violet-950/50 bg-[#06031f]/95 text-xs font-bold px-4">
            <button
              onClick={() => setActiveTab('address')}
              className={`flex items-center gap-2 py-3 px-4 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'address'
                  ? 'border-violet-500 text-white'
                  : 'border-transparent text-slate-400 hover:text-white'
              }`}
            >
              <MapPin className="w-3.5 h-3.5" />
              <span>DELIVERY ADDRESS</span>
            </button>
            <button
              onClick={() => setActiveTab('orders')}
              className={`flex items-center gap-2 py-3 px-4 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'orders'
                  ? 'border-violet-500 text-white'
                  : 'border-transparent text-slate-400 hover:text-white'
              }`}
            >
              <ClipboardList className="w-3.5 h-3.5" />
              <span>MY PURCHASE RECEIPTS ({myOrders.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('tracking')}
              className={`flex items-center gap-2 py-3 px-4 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'tracking'
                  ? 'border-violet-500 text-white font-extrabold'
                  : 'border-transparent text-slate-400 hover:text-white'
              }`}
            >
              <Compass className="w-3.5 h-3.5 text-violet-400" />
              <span>LIVE SHIPMENT TRACKING</span>
            </button>
          </div>

          {/* Tab Body scrolling contents */}
          <div className="p-6 overflow-y-auto flex-1 bg-[#05021a] text-slate-200">
            {activeTab === 'address' ? (
              <form onSubmit={handleSaveAddress} className="space-y-4">
                <div className="bg-violet-950/20 rounded-xl p-4 border border-violet-500/10 text-xs text-slate-300 leading-relaxed">
                  <p className="font-extrabold flex items-center gap-1.5 text-violet-300">
                    <MapPin className="w-4 h-4 text-violet-400" /> Address Sync Auto-Filling
                  </p>
                  <p className="mt-1 font-light">
                    Registering your delivery address here auto-fills the shipping form fields at checkout, ensuring rapid, secure checkout experiences.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block mb-1.5">Receiver Name</label>
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="e.g. Alex Mercer"
                      className="w-full bg-[#0d0a29] border border-violet-500/15 rounded-lg px-3 py-2 text-xs text-slate-100 placeholder-slate-550 focus:border-violet-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block mb-1.5">Contact Phone Number</label>
                    <input
                      type="tel"
                      required
                      value={contactPhone}
                      onChange={(e) => setContactPhone(e.target.value)}
                      placeholder="e.g. +1 555-0199"
                      className="w-full bg-[#0d0a29] border border-violet-500/15 rounded-lg px-3 py-2 text-xs text-slate-100 placeholder-slate-550 focus:border-violet-500 outline-none"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block mb-1.5">Delivery Street Address</label>
                    <input
                      type="text"
                      required
                      value={street}
                      onChange={(e) => setStreet(e.target.value)}
                      placeholder="House No, Flat, Street address, locality"
                      className="w-full bg-[#0d0a29] border border-violet-500/15 rounded-lg px-3 py-2 text-xs text-slate-100 placeholder-slate-550 focus:border-violet-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block mb-1.5">City</label>
                    <input
                      type="text"
                      required
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="e.g. San Francisco"
                      className="w-full bg-[#0d0a29] border border-violet-500/15 rounded-lg px-3 py-2 text-xs text-slate-100 placeholder-slate-550 focus:border-violet-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block mb-1.5">State / Region</label>
                    <input
                      type="text"
                      required
                      value={state}
                      onChange={(e) => setState(e.target.value)}
                      placeholder="e.g. California"
                      className="w-full bg-[#0d0a29] border border-violet-500/15 rounded-lg px-3 py-2 text-xs text-slate-100 placeholder-slate-550 focus:border-violet-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block mb-1.5">Postal Code (ZIP Code)</label>
                    <input
                      type="text"
                      required
                      value={postalCode}
                      onChange={(e) => setPostalCode(e.target.value)}
                      placeholder="e.g. 94107"
                      className="w-full bg-[#0d0a29] border border-violet-500/15 rounded-lg px-3 py-2 text-xs text-slate-100 placeholder-slate-550 focus:border-violet-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block mb-1.5">Country</label>
                    <input
                      type="text"
                      required
                      value={country}
                      onChange={(e) => setCountry(e.target.value)}
                      placeholder="United States"
                      className="w-full bg-[#0d0a29] border border-violet-500/15 rounded-lg px-3 py-2 text-xs text-slate-100 placeholder-slate-550 focus:border-violet-500 outline-none"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block mb-1.5">Landmark / Directions (Optional)</label>
                    <input
                      type="text"
                      value={landmark}
                      onChange={(e) => setLandmark(e.target.value)}
                      placeholder="e.g. Near Star Metro Station"
                      className="w-full bg-[#0d0a29] border border-violet-500/15 rounded-lg px-3 py-2 text-xs text-slate-100 placeholder-slate-550 focus:border-violet-500 outline-none"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-violet-950/60">
                  <button
                    type="submit"
                    className="flex h-10 items-center gap-1.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 shadow-lg shadow-violet-600/15 hover:from-violet-500 hover:to-indigo-500 text-white px-5 text-xs font-bold transition-all cursor-pointer active:scale-97"
                  >
                    <Save className="w-4 h-4" />
                    <span>Save Address Registry</span>
                  </button>
                </div>

                {saveSuccess && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-emerald-950/40 text-emerald-400 border border-emerald-500/20 rounded-lg px-3 py-2.5 text-xs font-semibold text-center mt-3"
                  >
                    Address Information successfully updated in your buyer profile!
                  </motion.div>
                )}
              </form>
            ) : activeTab === 'orders' ? (
              /* Order logs page */
              <div className="space-y-4">
                {myOrders.length === 0 ? (
                  <div className="text-center py-14 space-y-3">
                    <ClipboardList className="w-12 h-12 text-slate-650 mx-auto" />
                    <h4 className="text-xs font-extrabold text-white uppercase tracking-widest">No purchases registered yet</h4>
                    <p className="text-[11px] text-slate-400 max-w-xs mx-auto font-light">Items checked out via this profile will log here automatically with live tracking status.</p>
                  </div>
                ) : (
                  myOrders.map((order) => (
                    <div key={order.id} className="border border-violet-950/50 rounded-xl p-4 bg-[#0d0728]/35 hover:bg-[#130d37]/35 transition-all space-y-4">
                      {/* Top bar status */}
                      <div className="flex flex-wrap items-center justify-between gap-2.5 pb-3 border-b border-violet-950/45">
                        <div className="flex items-center gap-3">
                          <span className="font-mono text-xs font-extrabold text-violet-300">{order.id}</span>
                          <span className="text-[10.5px] text-slate-400 font-mono">{new Date(order.createdAt).toLocaleDateString()}</span>
                        </div>
                        
                        {/* Status tracking link & badge */}
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => selectOrderToTrack(order.id)}
                            className="bg-violet-500/10 hover:bg-violet-500/20 border border-violet-500/20 rounded px-2.5 py-0.5 text-[9.5px] font-bold text-violet-300 transition-all font-sans cursor-pointer uppercase flex items-center gap-1"
                            title="Open live shipment routing chart"
                          >
                            <Compass className="w-3 h-3 text-violet-400" />
                            Track Shipment
                          </button>

                          <span className={`inline-flex items-center gap-1.5 rounded px-2 py-0.5 text-[9.5px] font-extrabold uppercase font-mono tracking-wider border ${
                            order.status === 'delivered'
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-550/20'
                              : order.status === 'shipped'
                              ? 'bg-blue-500/10 text-blue-400 border-blue-550/20'
                              : 'bg-violet-500/10 text-violet-400 border-violet-550/20'
                          }`}>
                            {order.status}
                          </span>
                        </div>
                      </div>

                      {/* Items loop summary */}
                      <div className="space-y-2">
                        {order.items.map((item, idx) => (
                          <div key={idx} className="flex justify-between items-center text-xs">
                            <span className="text-slate-300">{item.name} <strong className="text-violet-400/80 ml-1.5 font-mono">x{item.quantity}</strong></span>
                            <span className="font-mono font-bold text-white">₹{(item.price * item.quantity).toLocaleString('en-IN')}</span>
                          </div>
                        ))}
                      </div>

                      {/* Summary fee details */}
                      <div className="pt-3 border-t border-violet-950/40 flex items-center justify-between text-[11px] text-slate-400">
                        <div className="flex gap-4">
                          <span>Subtotal: <strong className="font-mono font-bold text-slate-300">₹{order.subtotal.toLocaleString('en-IN')}</strong></span>
                          {order.tax > 0 && (
                            <span>GST (18%): <strong className="font-mono font-bold text-slate-300">₹{order.tax.toLocaleString('en-IN')}</strong></span>
                          )}
                        </div>
                        <span className="text-xs uppercase font-extrabold text-white">Total: <span className="font-mono font-extrabold text-indigo-400 text-xs">₹{order.totalAmount.toLocaleString('en-IN')}</span></span>
                      </div>

                      {/* Delivery destination address visual */}
                      <div className="bg-[#040118]/80 p-3 rounded-lg border border-violet-500/10 text-[10.5px] text-slate-400 leading-relaxed">
                        <p className="font-extrabold text-[#8b5cf6] uppercase tracking-widest text-[8.5px] mb-1.5">Ships Delivery Address</p>
                        <p className="font-medium text-slate-200">{order.shippingAddress.fullName}</p>
                        <p>{order.shippingAddress.street}, {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.postalCode}</p>
                        <p className="text-[9.5px] text-slate-500 font-mono mt-1 pt-1 border-t border-violet-950/20">Secured Transaction ID: {order.paymentId}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            ) : (
              /* --- LIVE SHIPMENT TRACKING ENGAGING TAB --- */
              <div className="space-y-6">
                {/* Search Bar query */}
                <form onSubmit={handleTrackingSearch} className="flex gap-2 bg-[#09052a] p-2 rounded-xl border border-violet-500/25">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                    <input
                      type="text"
                      placeholder="Enter Order ID to locate shipment (e.g. EL-XXXX)"
                      value={trackingIdInput}
                      onChange={(e) => setTrackingIdInput(e.target.value)}
                      className="w-full bg-transparent border-none pl-9 py-2 text-xs font-mono text-slate-100 placeholder-slate-500 focus:outline-none"
                    />
                  </div>
                  <button
                    type="submit"
                    className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white rounded-lg px-4 text-xs font-bold transition-all cursor-pointer flex items-center gap-1 active:scale-95"
                  >
                    <span>Inspect</span>
                  </button>
                </form>

                {trackingError && (
                  <div className="p-3 bg-red-950/35 border border-red-500/25 text-red-400 text-xs rounded-lg font-mono">
                    {trackingError}
                  </div>
                )}

                {!trackedOrder ? (
                  <div className="text-center py-12 border border-dashed border-violet-500/10 rounded-2xl bg-white/[0.01]">
                    <Compass className="w-12 h-12 text-slate-655 mx-auto animate-spin-slow mb-3" />
                    <h4 className="text-xs font-extrabold text-slate-300 uppercase tracking-widest">Active Satellite Hub Ready</h4>
                    <p className="text-[11px] text-slate-450 max-w-sm mx-auto font-light leading-relaxed mt-2">
                      Input your order tracker serial ID above or click "Track Shipment" in your purchases list to launch live transport routing.
                    </p>
                    
                    {myOrders.length > 0 && (
                      <div className="mt-4 pt-3 border-t border-violet-950/30">
                        <span className="text-[9.5px] text-slate-550 block font-bold uppercase tracking-widest mb-2">QUICK ACCESS RECENT PURCHASE</span>
                        <div className="flex flex-wrap justify-center gap-2">
                          {myOrders.slice(0, 3).map((o) => (
                            <button
                              key={o.id}
                              onClick={() => selectOrderToTrack(o.id)}
                              className="bg-violet-950/40 hover:bg-violet-900/50 border border-violet-500/20 text-slate-200 text-[10.5px] font-mono font-bold px-2.5 py-1 rounded transition-all cursor-pointer"
                            >
                              {o.id}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  /* Live Stepper Tracker Graphics Dashboard */
                  <div className="space-y-6">
                    {/* Carrier specs Header block */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-[#0d0728]/35 rounded-xl border border-violet-500/10">
                      <div>
                        <span className="text-[9px] uppercase tracking-wider text-slate-450 font-bold block">ORDER LOG TARGET</span>
                        <span className="text-xs font-mono font-bold text-violet-300 block mt-0.5">{trackedOrder.id}</span>
                      </div>
                      <div>
                        <span className="text-[9px] uppercase tracking-wider text-slate-450 font-bold block">LOGISTICS PARTNER</span>
                        <span className="text-xs font-extrabold text-white block mt-0.5">DHL Space-Air Express</span>
                      </div>
                      <div>
                        <span className="text-[9px] uppercase tracking-wider text-slate-450 font-bold block">SHIPPING WEIGHT</span>
                        <span className="text-xs font-mono text-slate-200 block mt-0.5">3.47 kg (Sensored)</span>
                      </div>
                      <div>
                        <span className="text-[9px] uppercase tracking-wider text-slate-450 font-bold block">ESTIMATED COURIER ARRIVAL</span>
                        <span className="text-xs font-extrabold text-emerald-400 block mt-0.5">
                          {trackedOrder.status === OrderStatus.DELIVERED ? 'Delivered & Signed' : 'In 1-2 Business Days'}
                        </span>
                      </div>
                    </div>

                    {/* Progress Percentage Graphic Line Bar */}
                    <div className="space-y-4">
                      <div className="flex justify-between items-center select-none text-[10.5px]">
                        <span className="flex items-center gap-1.5 text-violet-300 font-extrabold">
                          <Activity className="w-3.5 h-3.5 text-violet-400 animate-pulse" />
                          STATUS: {getProgressSpecs(trackedOrder.status).label.toUpperCase()}
                        </span>
                        <span className="font-mono text-[#8b5cf6] font-bold">
                          {getProgressSpecs(trackedOrder.status).percent}% COMPLETE
                        </span>
                      </div>

                      <div className="relative h-2 w-full bg-[#0a0521] border border-violet-500/10 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-violet-600 via-indigo-500 to-blue-400 transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(139,92,246,0.6)]"
                          style={{ width: `${getProgressSpecs(trackedOrder.status).percent}%` }}
                        />
                      </div>
                    </div>

                    {/* Highly Visual Stepper Nodes Layout */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 relative select-none">
                      {/* STEP 1 */}
                      <div className="flex items-start md:flex-col gap-3.5 relative">
                        <div className={`h-8 w-8 rounded-full border flex items-center justify-center shrink-0 font-bold text-xs ${
                          getProgressSpecs(trackedOrder.status).step >= 1
                            ? 'bg-gradient-to-tr from-violet-600 to-indigo-600 border-violet-500 text-white shadow-md'
                            : 'bg-slate-950 border-violet-950 text-slate-500'
                        }`}>
                          01
                        </div>
                        <div className="pt-1 md:pt-0">
                          <h5 className={`text-xs font-extrabold block leading-tight ${getProgressSpecs(trackedOrder.status).step >= 1 ? 'text-white' : 'text-slate-500'}`}>Order Registered</h5>
                          <p className="text-[10px] text-slate-450 leading-normal block mt-0.5">Hashed database catalog entry registered.</p>
                        </div>
                      </div>

                      {/* STEP 2 */}
                      <div className="flex items-start md:flex-col gap-3.5 relative">
                        <div className={`h-8 w-8 rounded-full border flex items-center justify-center shrink-0 font-bold text-xs ${
                          getProgressSpecs(trackedOrder.status).step >= 2
                            ? 'bg-gradient-to-tr from-violet-600 to-indigo-600 border-violet-500 text-white shadow-md'
                            : 'bg-slate-950 border-violet-950 text-slate-500'
                        }`}>
                          02
                        </div>
                        <div className="pt-1 md:pt-0">
                          <h5 className={`text-xs font-extrabold block leading-tight ${getProgressSpecs(trackedOrder.status).step >= 2 ? 'text-white' : 'text-slate-500'}`}>Payment Cleared</h5>
                          <p className="text-[10px] text-slate-450 leading-normal block mt-0.5">PCI clearing cleared. Ledger hashes logged.</p>
                        </div>
                      </div>

                      {/* STEP 3 */}
                      <div className="flex items-start md:flex-col gap-3.5 relative">
                        <div className={`h-8 w-8 rounded-full border flex items-center justify-center shrink-0 font-bold text-xs ${
                          getProgressSpecs(trackedOrder.status).step >= 3
                            ? 'bg-gradient-to-tr from-violet-600 to-indigo-600 border-violet-500 text-white shadow-md shadow-violet-500/10'
                            : 'bg-slate-950 border-violet-950 text-slate-500'
                        }`}>
                          03
                        </div>
                        <div className="pt-1 md:pt-0">
                          <h5 className={`text-xs font-extrabold block leading-tight ${getProgressSpecs(trackedOrder.status).step >= 3 ? 'text-white' : 'text-slate-500'}`}>Shipment Dispatched</h5>
                          <p className="text-[10px] text-slate-450 leading-normal block mt-0.5">Carrier routing handoff. Transit tracks live.</p>
                        </div>
                      </div>

                      {/* STEP 4 */}
                      <div className="flex items-start md:flex-col gap-3.5 relative">
                        <div className={`h-8 w-8 rounded-full border flex items-center justify-center shrink-0 font-bold text-xs ${
                          getProgressSpecs(trackedOrder.status).step >= 4
                            ? 'bg-[#10b981] border-emerald-500 text-white shadow-md shadow-emerald-500/15'
                            : 'bg-slate-950 border-violet-950 text-slate-500'
                        }`}>
                          ✓
                        </div>
                        <div className="pt-1 md:pt-0">
                          <h5 className={`text-xs font-extrabold block leading-tight ${getProgressSpecs(trackedOrder.status).step >= 4 ? 'text-emerald-400' : 'text-slate-500'}`}>Node Delivered</h5>
                          <p className="text-[10px] text-slate-450 leading-normal block mt-0.5">Facial signature verified. Package secure.</p>
                        </div>
                      </div>
                    </div>

                    {/* Realistic Transport tracking steps history list */}
                    <div className="space-y-3.5 p-4 bg-[#040118]/80 rounded-xl border border-violet-500/10 text-xs leading-relaxed">
                      <span className="text-[9.5px] uppercase tracking-widest text-[#8b5cf6] font-extrabold block mb-1">
                        SATELLITE COORDINATES ROUTE LOG
                      </span>
                      
                      {/* Step lines log */}
                      <div className="space-y-3 font-sans relative pl-4 border-l border-violet-950">
                        {/* Delivered Item */}
                        {getProgressSpecs(trackedOrder.status).step >= 4 && (
                          <div className="relative">
                            <span className="absolute -left-[20.5px] top-1 h-2.5 w-2.5 rounded-full bg-emerald-400 animate-ping" />
                            <span className="absolute -left-[20.5px] top-1 h-2.5 w-2.5 rounded-full bg-emerald-500" />
                            <div className="flex justify-between text-[11px]">
                              <strong className="text-emerald-400">Delivered & Decrypted Securely</strong>
                              <span className="text-slate-550 font-mono">14:10</span>
                            </div>
                            <p className="text-[10px] text-slate-450">Destination mailbox entry signed by recipient signature key.</p>
                          </div>
                        )}

                        {/* Shipped / Transit Item */}
                        {getProgressSpecs(trackedOrder.status).step >= 3 && (
                          <div className="relative">
                            <span className="absolute -left-[20.5px] top-1 h-2.5 w-2.5 rounded-full bg-blue-400 animate-ping" />
                            <span className="absolute -left-[20.5px] top-1 h-2.5 w-2.5 rounded-full bg-blue-500" />
                            <div className="flex justify-between text-[11px]">
                              <strong className="text-blue-400">Departed San Francisco Hub sorting node</strong>
                              <span className="text-slate-550 font-mono">08:45</span>
                            </div>
                            <p className="text-[10px] text-slate-455">Routed on carrier flight DHL-980; local dispatch scheduled for destination zone <strong>{trackedOrder.shippingAddress.city}, {trackedOrder.shippingAddress.state}</strong>.</p>
                          </div>
                        )}

                        {/* Paid Item */}
                        {getProgressSpecs(trackedOrder.status).step >= 2 && (
                          <div className="relative">
                            <span className="absolute -left-[20.5px] top-1 h-1.5 w-1.5 rounded-full bg-violet-400" />
                            <div className="flex justify-between text-[11px]">
                              <strong className="text-violet-300">Package processed & sensory sealed</strong>
                              <span className="text-slate-550 font-mono">Yesterday, 17:30</span>
                            </div>
                            <p className="text-[10px] text-slate-450">Decentralized warehouse node packed under calibrated environment rules.</p>
                          </div>
                        )}

                        {/* Pending / Initiated */}
                        {getProgressSpecs(trackedOrder.status).step >= 1 && (
                          <div className="relative">
                            <span className="absolute -left-[20.5px] top-1 h-1.5 w-1.5 rounded-full bg-[#8b5cf6]" />
                            <div className="flex justify-between text-[11px]">
                              <strong className="text-slate-300">Hashed transaction order generated</strong>
                              <span className="text-slate-550 font-mono">{new Date(trackedOrder.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                            </div>
                            <p className="text-[10px] text-slate-450">Payload assigned to node storage queue and pending system dispatch logs.</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Secure footer info stamp */}
          <div className="p-4 bg-[#0a0628] text-center border-t border-violet-950/60 font-sans select-none">
            <span className="text-[9.5px] uppercase tracking-widest font-mono font-bold text-violet-400/80 flex items-center justify-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" /> Compliant Secure Encryption Pipeline Sync Active
            </span>
          </div>
        </motion.div>
      </div>
  );
};

export default UserProfileModal;
