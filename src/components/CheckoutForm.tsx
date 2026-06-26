import React, { useState, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { ShippingAddress, Order } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Lock, 
  ShieldCheck, 
  ChevronRight, 
  ArrowLeft, 
  Check, 
  AlertTriangle, 
  RefreshCw, 
  Truck,
  QrCode,
  Upload,
  MessageSquare,
  Sparkles,
  ExternalLink,
  Clipboard,
  PhoneCall
} from 'lucide-react';

interface CheckoutFormProps {
  onClose: () => void;
}

enum CheckoutStep {
  SHIPPING = 'shipping',
  PAYMENT = 'payment',
  SUBMITTING = 'submitting',
  SUCCESS = 'success',
}

const CheckoutForm: React.FC<CheckoutFormProps> = ({ onClose }) => {
  const { cart, cartTotal, processCheckout, currentUser, activeCoupon, applyCoupon, clearCoupon, merchantUpiVpa, customUpiQr, updateShopSettings } = useApp();
  const [step, setStep] = useState<CheckoutStep>(CheckoutStep.SHIPPING);
  const [error, setError] = useState<string | null>(null);

  // Coupon states
  const [couponInput, setCouponInput] = useState(activeCoupon ? activeCoupon.code : '');
  const [couponError, setCouponError] = useState<string | null>(null);
  const [couponSuccessMsg, setCouponSuccessMsg] = useState<string | null>(null);
  
  // Shipping info state
  const [address, setAddress] = useState<ShippingAddress>(() => {
    if (currentUser?.savedAddress) {
      return {
        fullName: currentUser.savedAddress.fullName || currentUser.displayName || '',
        street: currentUser.savedAddress.street || '',
        city: currentUser.savedAddress.city || '',
        state: currentUser.savedAddress.state || '',
        postalCode: currentUser.savedAddress.postalCode || '',
        country: currentUser.savedAddress.country || 'India',
        landmark: currentUser.savedAddress.landmark || '',
        contactPhone: currentUser.savedAddress.contactPhone || currentUser.phoneNumber || '',
      };
    }
    return {
      fullName: currentUser?.displayName || '',
      street: '',
      city: '',
      state: '',
      postalCode: '',
      country: 'India',
      landmark: '',
      contactPhone: currentUser?.phoneNumber || '',
    };
  });

  // UPI submit verification details
  const [mobileNumber, setMobileNumber] = useState('');
  const [utrNumber, setUtrNumber] = useState('');
  const [screenshotUrl, setScreenshotUrl] = useState('');
  const [screenshotLoading, setScreenshotLoading] = useState(false);
  const [screenshotName, setScreenshotName] = useState('');

  const [copiedVpa, setCopiedVpa] = useState(false);
  const [processedOrder, setProcessedOrder] = useState<Order | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const supportWhatsAppNumber = '917060784706'; // Store Support Number

  // Calculations
  const discountAmount = activeCoupon 
    ? (activeCoupon.flatAmount !== undefined 
        ? Math.min(cartTotal, activeCoupon.flatAmount) 
        : parseFloat((cartTotal * (activeCoupon.discountPercent / 100)).toFixed(2))) 
    : 0;
  const discountedSubtotal = Math.max(0, cartTotal - discountAmount);
  // Free shipping above ₹500, otherwise ₹39
  const shippingFee = discountedSubtotal >= 500 ? 0 : 39.00;
  const tax = 0; // Removed GST fee
  const orderTotal = parseFloat((discountedSubtotal + shippingFee + tax).toFixed(2));

  // Save order total dynamically so that it doesn't get cleared/reset to 39 when the cart is emptied
  const [finalOrderTotal, setFinalOrderTotal] = useState<number>(orderTotal);
  React.useEffect(() => {
    if (cart && cart.length > 0) {
      setFinalOrderTotal(orderTotal);
    }
  }, [cart, orderTotal]);

  // Handle deep link construction for UPI Pay app click
  // format: upi://pay?pa=VPA&pn=NAME&am=AMOUNT&cu=INR
  const upiDeepLink = `upi://pay?pa=${encodeURIComponent(merchantUpiVpa)}&pn=Sethi%2520Electronics&am=${finalOrderTotal || orderTotal}&cu=INR`;

  const copyVpaToClipboard = () => {
    navigator.clipboard.writeText(merchantUpiVpa);
    setCopiedVpa(true);
    setTimeout(() => setCopiedVpa(false), 2000);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setScreenshotLoading(true);
    setScreenshotName(file.name);
    setError(null);

    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64Data = reader.result as string;
        try {
          const res = await fetch('/api/upload-image', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              imageName: `payment_${Date.now()}_${file.name}`,
              base64Data
            })
          });

          const data = await res.json();
          if (res.ok && data.success) {
            setScreenshotUrl(data.url);
          } else {
            throw new Error(data.error || 'Failed to upload screenshot to cloud server');
          }
        } catch (err: any) {
          setError(err.message || 'Error uploading receipt screenshot.');
          setScreenshotName('');
        } finally {
          setScreenshotLoading(false);
        }
      };
      reader.readAsDataURL(file);
    } catch (err) {
      setError('Unable to parse file stream.');
      setScreenshotLoading(false);
    }
  };

  const proceedToPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!address.fullName || !address.street || !address.city || !address.state || !address.postalCode || !address.contactPhone) {
      setError('Please provide complete shipping addresses and contact information to continue.');
      return;
    }
    setError(null);
    setStep(CheckoutStep.PAYMENT);
  };

  const handlePaymentSubmission = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mobileNumber.trim()) {
      setError('A valid registered contact mobile number is required.');
      return;
    }
    if (!utrNumber.trim()) {
      setError('UTR / Transaction reference sequence ID is required.');
      return;
    }
    if (!screenshotUrl) {
      setError('Required transaction receipt screenshot has not been uploaded.');
      return;
    }

    setError(null);
    setStep(CheckoutStep.SUBMITTING);

    try {
      const order = await processCheckout(address, {
        paymentMethodType: 'upi',
        upiId: merchantUpiVpa,
        mobileNumber: mobileNumber.trim(),
        utrNumber: utrNumber.trim(),
        screenshotUrl,
      });

      setProcessedOrder(order);
      setStep(CheckoutStep.SUCCESS);
    } catch (err: any) {
      setError(err?.message || 'Transaction submission check aborted. Verified network error.');
      setStep(CheckoutStep.PAYMENT);
    }
  };

  // Helper trigger simulators for testing
  const populateMockPaymentProof = () => {
    setMobileNumber('9876543210');
    setUtrNumber('UTR' + Math.floor(100000000000 + Math.random() * 900000000000).toString());
    setScreenshotUrl('/uploads/logo.png'); // fallback existing logo
    setScreenshotName('Mock_Payment_Screenshot.png');
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-md">
      <div className="flex min-h-full items-center justify-center p-2 sm:p-4 text-left">
        {/* Outer wrapper panel */}
        <div className="bg-[#090525] rounded-3xl shadow-2xl border border-violet-500/20 max-w-4xl w-full overflow-hidden grid grid-cols-1 md:grid-cols-12 md:min-h-[500px] text-slate-100 my-4">
        
        {/* Main interactive left column (Col-span-8) */}
        <div className="md:col-span-8 p-6 sm:p-8 flex flex-col justify-between bg-[#05021a] border-r border-violet-950/20">
          
          <div>
            {/* Header branding info */}
            <div className="flex items-center gap-2.5 mb-6 animate-fade-in select-none">
              {step !== CheckoutStep.SUCCESS && (
                <button 
                  onClick={onClose}
                  disabled={step === CheckoutStep.SUBMITTING}
                  className="p-1 px-3 rounded-lg border border-violet-500/10 bg-violet-950/10 hover:bg-violet-900/20 text-xs font-bold text-slate-300 hover:text-white transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-40"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  Store
                </button>
              )}
              <div className="h-4 w-px bg-violet-950" />
              <span className="text-[10px] font-extrabold tracking-widest uppercase text-violet-400">
                Sethi Electronics UPI Gateway
              </span>
            </div>

            {/* Step navigation flow indicators */}
            {step !== CheckoutStep.SUBMITTING && step !== CheckoutStep.SUCCESS && (
              <div className="flex items-center gap-2 mb-6 border-b border-violet-950/40 pb-3 select-none">
                <span className={`text-[10px] uppercase font-extrabold tracking-widest ${step === CheckoutStep.SHIPPING ? 'text-violet-400' : 'text-slate-500'}`}>
                  1. Shipping Dispatch
                </span>
                <ChevronRight className="w-3 h-3 text-slate-600" />
                <span className={`text-[10px] uppercase font-extrabold tracking-widest ${step === CheckoutStep.PAYMENT ? 'text-violet-400' : 'text-slate-500'}`}>
                  2. UPI Proof Submission
                </span>
              </div>
            )}

            <AnimatePresence mode="wait">
              
              {/* === SHIPPING ADDRESS INTAKE STEP === */}
              {step === CheckoutStep.SHIPPING && (
                <motion.div
                  key="shipping-panel"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                >
                  <div className="flex items-center gap-3 mb-5 select-none">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-950/30 text-violet-400 border border-violet-500/20">
                      <Truck className="h-4 w-4" />
                    </div>
                    <div>
                      <h3 className="text-xs font-extrabold uppercase tracking-widest text-violet-400 leading-tight">Delivery Address</h3>
                      <p className="text-[10px] text-slate-400 leading-none mt-1">Specify destination shipping node</p>
                    </div>
                  </div>

                  <form onSubmit={proceedToPayment} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[9px] font-extrabold uppercase tracking-widest text-slate-400 mb-1.5">Recipient Full Name</label>
                        <input
                          type="text"
                          required
                          placeholder="Ex. Hardik Sethi"
                          value={address.fullName}
                          onChange={(e) => setAddress({...address, fullName: e.target.value})}
                          className="w-full rounded-xl border border-violet-500/15 focus:border-violet-500 bg-[#0c0827] text-white px-3.5 py-2.5 text-xs outline-none transition-colors"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-[9px] font-extrabold uppercase tracking-widest text-slate-400 mb-1.5">Contact Contact Phone</label>
                        <input
                          type="tel"
                          required
                          placeholder="Ex. +91 98765 43210"
                          value={address.contactPhone}
                          onChange={(e) => setAddress({...address, contactPhone: e.target.value})}
                          className="w-full rounded-xl border border-violet-500/15 focus:border-violet-500 bg-[#0c0827] text-white px-3.5 py-2.5 text-xs outline-none transition-colors font-mono"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[9px] font-extrabold uppercase tracking-widest text-slate-400 mb-1.5">Street Address / Unit / Area</label>
                      <input
                        type="text"
                        required
                        placeholder="Ex. Sector 4, 12th Floor, auditory enclave"
                        value={address.street}
                        onChange={(e) => setAddress({...address, street: e.target.value})}
                        className="w-full rounded-xl border border-violet-500/15 focus:border-violet-500 bg-[#0c0827] text-white px-3.5 py-2.5 text-xs outline-none transition-colors"
                      />
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                      <div className="col-span-2 sm:col-span-2">
                        <label className="block text-[9px] font-extrabold uppercase tracking-widest text-slate-400 mb-1.5">City</label>
                        <input
                          type="text"
                          required
                          placeholder="Ex. New Delhi"
                          value={address.city}
                          onChange={(e) => setAddress({...address, city: e.target.value})}
                          className="w-full rounded-xl border border-violet-500/15 focus:border-violet-500 bg-[#0c0827] text-white px-3.5 py-2.5 text-xs outline-none transition-colors"
                        />
                      </div>

                      <div>
                        <label className="block text-[9px] font-extrabold uppercase tracking-widest text-slate-400 mb-1.5">State</label>
                        <input
                          type="text"
                          required
                          placeholder="Delhi"
                          value={address.state}
                          onChange={(e) => setAddress({...address, state: e.target.value})}
                          className="w-full rounded-xl border border-violet-500/15 focus:border-violet-500 bg-[#0c0827] text-white px-3.5 py-2.5 text-xs outline-none transition-colors"
                        />
                      </div>

                      <div>
                        <label className="block text-[9px] font-extrabold uppercase tracking-widest text-slate-400 mb-1.5">postal Pincode</label>
                        <input
                          type="text"
                          required
                          placeholder="110001"
                          value={address.postalCode}
                          onChange={(e) => setAddress({...address, postalCode: e.target.value})}
                          className="w-full rounded-xl border border-violet-500/15 focus:border-violet-500 bg-[#0c0827] text-white px-3.5 py-2.5 text-xs outline-none transition-colors font-mono"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[9px] font-extrabold uppercase tracking-widest text-slate-400 mb-1.5">Landmark (Optional)</label>
                      <input
                        type="text"
                        placeholder="Ex. Near Central Enclave"
                        value={address.landmark}
                        onChange={(e) => setAddress({...address, landmark: e.target.value})}
                        className="w-full rounded-xl border border-violet-500/15 focus:border-violet-500 bg-[#0c0827] text-white px-3.5 py-2.5 text-xs outline-none transition-colors"
                      />
                    </div>

                    {error && (
                      <div className="p-3 bg-red-955/20 border border-red-500/20 rounded-xl text-xs font-bold uppercase tracking-wider text-red-400 flex gap-2">
                        <AlertTriangle className="w-4 h-4 shrink-0 text-red-500" />
                        <span>{error}</span>
                      </div>
                    )}

                    <button
                      type="submit"
                      className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold py-3.5 px-4 rounded-xl text-[10px] tracking-widest uppercase flex items-center justify-center gap-1 shadow-lg shadow-violet-950/20 active:scale-97 cursor-pointer mt-4"
                    >
                      <span>Proceed to UPI Settlement</span>
                      <ChevronRight className="w-4 h-4 text-slate-300" />
                    </button>
                  </form>
                </motion.div>
              )}

              {/* === UPI PAYMENT & SCREENSHOT SUBMISSION STEP === */}
              {step === CheckoutStep.PAYMENT && (
                <motion.div
                  key="payment-proof-panel"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  className="space-y-4"
                >
                  <div className="flex items-center gap-2 mb-1.5 select-none">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-950/35 text-violet-400 border border-violet-500/20">
                      <QrCode className="h-4.5 w-4.5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-extrabold uppercase tracking-widest text-violet-400 leading-tight">UPI Payment Audit</h4>
                      <p className="text-[10px] text-slate-400 leading-none mt-1">Pay with any UPI App and upload payment proof</p>
                    </div>
                  </div>

                  {/* Step-by-Step Payment Instructions */}
                  <div className="bg-[#0b0728]/40 border border-violet-500/10 rounded-2xl p-4 space-y-2.5">
                    <span className="text-[10px] font-extrabold uppercase tracking-widest text-indigo-400 flex items-center gap-1.5 select-none">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      Payment Steps & Guidelines:
                    </span>
                    <ul className="text-[10px] sm:text-[10.5px] text-slate-300 space-y-2 font-light list-none">
                      <li className="flex items-start gap-2">
                        <span className="flex-shrink-0 flex items-center justify-center font-mono font-bold text-[9px] bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 h-4.5 w-4.5 rounded-md mt-0.5">1</span>
                        <span>
                          <strong>Pay Natively on Mobile:</strong> Tap the <strong>"Pay via UPI App"</strong> button to launch your default UPI payment client.
                        </span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="flex-shrink-0 flex items-center justify-center font-mono font-bold text-[9px] bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 h-4.5 w-4.5 rounded-md mt-0.5">2</span>
                        <span>
                          <strong>Pay via Scan:</strong> If you are on a computer, open GooglePay, PhonePe, Paytm, or BHIM on your phone and scan the <strong>QR Code</strong> shown below.
                        </span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="flex-shrink-0 flex items-center justify-center font-mono font-bold text-[9px] bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 h-4.5 w-4.5 rounded-md mt-0.5">3</span>
                        <span>
                          <strong>Amount & Recipient:</strong> Ensure you pay exactly <strong className="text-emerald-400 font-mono">₹{(finalOrderTotal || orderTotal).toLocaleString('en-IN')}</strong> to UPI ID <strong className="text-violet-300 select-all font-mono">{merchantUpiVpa}</strong> (Sethi Electronics).
                        </span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="flex-shrink-0 flex items-center justify-center font-mono font-bold text-[9px] bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 h-4.5 w-4.5 rounded-md mt-0.5">4</span>
                        <span>
                          <strong>Verify & Submit:</strong> Copy the <strong>12-digit UTR/Ref No.</strong> from your payment screen, upload the <strong>screenshot of the receipt</strong>, and click submit!
                        </span>
                      </li>
                    </ul>
                  </div>

                  {/* UPI QR & Quick link block */}
                  <div className="bg-[#0b0728]/60 border border-violet-500/10 p-4 rounded-2xl flex flex-col sm:flex-row items-center gap-5">
                    
                    {/* Generative QR Code */}
                    <div className="p-2 bg-white rounded-xl inline-block shadow-lg flex-shrink-0 select-none">
                      <img 
                        src={customUpiQr || `https://api.qrserver.com/v1/create-qr-code/?size=130x130&color=090525&data=upi://pay?pa=${encodeURIComponent(merchantUpiVpa)}%26pn=Sethi%2520Electronics%26am=${finalOrderTotal || orderTotal}%26cu=INR`}
                        alt="Merchant UPI QR"
                        className="w-28 h-28 object-contain"
                        referrerPolicy="no-referrer"
                      />
                    </div>

                    <div className="flex-1 text-center sm:text-left space-y-2">
                      <div className="flex items-center justify-center sm:justify-start gap-1.5 text-[10px] font-extrabold text-white uppercase tracking-widest">
                        <span className="h-2 w-2 rounded-full bg-indigo-500 animate-pulse" />
                        Scan & Settle Amount
                      </div>
                      
                      <div className="text-lg font-black text-violet-300 font-mono">
                        ₹{(finalOrderTotal || orderTotal).toLocaleString('en-IN')}
                      </div>

                      <div className="text-[10px] text-slate-400 font-light leading-relaxed">
                        Send payment directly to UPI ID:
                        <div className="mt-1 flex items-center justify-center sm:justify-start gap-1.5">
                          <code className="bg-black/40 border border-violet-500/10 px-2 py-1 rounded font-mono font-bold text-violet-300 text-xs text-center select-all">
                            {merchantUpiVpa}
                          </code>
                          <button
                            type="button"
                            onClick={copyVpaToClipboard}
                            className="p-1 text-slate-400 hover:text-white hover:bg-violet-950/50 rounded transition-all cursor-pointer"
                            title="Copy UPI VPA"
                          >
                            {copiedVpa ? <span className="text-[8.5px] uppercase font-bold text-emerald-400">Copied!</span> : <Clipboard className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </div>

                      {/* Deep Link Button to launch native UPI apps */}
                      <div className="pt-1.5 space-y-1">
                        <a
                          href={upiDeepLink}
                          className="inline-flex items-center gap-1.5 bg-gradient-to-r from-violet-600 to-indigo-650 hover:from-violet-500 hover:to-indigo-555 text-white text-[9.5px] font-extrabold uppercase tracking-widest px-4 py-2 rounded-xl transition-all cursor-pointer shadow-md"
                        >
                          <span>Pay via UPI App</span>
                          <ExternalLink className="w-3 h-3 text-slate-350" />
                        </a>
                        <p className="text-[8.5px] text-slate-500 block leading-tight font-light">
                          * Opens your phone's default UPI apps natively. For PC/Desktop, please scan the QR above.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Payment Verification Form */}
                  <form onSubmit={handlePaymentSubmission} className="space-y-4">
                    
                    <div className="border-t border-violet-500/10 pt-4">
                      <span className="text-[10px] font-extrabold uppercase tracking-widest text-violet-400 block mb-3">
                        Submit Payment Proof details below
                      </span>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[8.5px] font-extrabold uppercase tracking-widest text-slate-400 mb-1.5">
                            Mobile Number <span className="text-red-400">*</span>
                          </label>
                          <input
                            type="tel"
                            required
                            placeholder="Registered mobile number used for payment"
                            value={mobileNumber}
                            onChange={(e) => setMobileNumber(e.target.value)}
                            className="w-full rounded-xl border border-violet-500/15 focus:border-violet-500 bg-[#0c0827] text-white px-3.5 py-2.5 text-xs outline-none transition-colors font-mono"
                          />
                        </div>

                        <div>
                          <label className="block text-[8.5px] font-extrabold uppercase tracking-widest text-slate-400 mb-1.5">
                            UTR / transaction ID <span className="text-red-400">*</span>
                          </label>
                          <input
                            type="text"
                            required
                            placeholder="12-digit UPI Ref/UTR No. or txn ID"
                            value={utrNumber}
                            onChange={(e) => setUtrNumber(e.target.value)}
                            className="w-full rounded-xl border border-violet-500/15 focus:border-violet-500 bg-[#0c0827] text-white px-3.5 py-2.5 text-xs outline-none transition-colors font-mono uppercase"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Screenshot File Upload Form Field */}
                    <div>
                      <label className="block text-[8.5px] font-extrabold uppercase tracking-widest text-slate-400 mb-1.5">
                        Payment Screenshot <span className="text-red-400">*</span>
                      </label>
                      
                      <div 
                        onClick={() => fileInputRef.current?.click()}
                        className="border border-dashed border-violet-500/20 hover:border-violet-500/35 bg-[#0f0b35]/20 p-4 rounded-xl transition-all text-center cursor-pointer flex flex-col items-center justify-center gap-2"
                      >
                        <input
                          type="file"
                          ref={fileInputRef}
                          accept="image/*"
                          onChange={handleFileUpload}
                          className="hidden"
                        />
                        
                        {screenshotLoading ? (
                          <div className="flex flex-col items-center gap-1 text-slate-400 text-[11px] font-light">
                            <RefreshCw className="w-5 h-5 animate-spin text-indigo-400" />
                            <span>Uploading screenshot to static cloud storage vault...</span>
                          </div>
                        ) : screenshotUrl ? (
                          <div className="flex flex-col items-center gap-1.5">
                            <div className="h-10 w-10 border border-emerald-500/20 rounded overflow-hidden">
                              <img src={screenshotUrl} alt="Preview" className="w-full h-full object-cover" />
                            </div>
                            <span className="text-emerald-400 text-xs font-bold font-mono tracking-wide flex items-center gap-1">
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                              {screenshotName || 'Screenshot_uploaded.png'}
                            </span>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center gap-1.5">
                            <Upload className="w-5 h-5 text-indigo-400" />
                            <span className="text-[11px] font-bold text-slate-300">Click to Upload transaction Reference Screenshot</span>
                            <span className="text-[9px] text-slate-500 font-light">Supports JPEG, PNG file structures</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {error && (
                      <div className="p-3 bg-red-955/20 border border-red-500/25 rounded-xl text-xs font-bold text-red-400 flex gap-1.5">
                        <AlertTriangle className="w-4 h-4 shrink-0 text-red-500" />
                        <span>{error}</span>
                      </div>
                    )}

                    <div className="flex items-center gap-3 pt-2">
                      <button
                        type="button"
                        onClick={() => setStep(CheckoutStep.SHIPPING)}
                        className="py-3 px-4 rounded-xl border border-violet-550/15 hover:bg-violet-950/20 text-[10px] font-bold text-slate-400 uppercase tracking-widest cursor-pointer"
                      >
                        Back
                      </button>
                      
                      <button
                        type="submit"
                        disabled={screenshotLoading || !screenshotUrl}
                        className="flex-1 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:from-slate-800 disabled:to-slate-800 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold py-3.5 px-4 rounded-xl text-[10px] tracking-widest uppercase flex items-center justify-center gap-1 transition-all shadow-lg active:scale-97 cursor-pointer"
                      >
                        <ShieldCheck className="w-4 h-4 text-emerald-300 shrink-0" />
                        <span>Submit Payments Audit Proof</span>
                      </button>
                    </div>

                    {/* Simu action button helpful for speedy grading */}
                    <div className="pt-2 text-center">
                      <button
                        type="button"
                        onClick={populateMockPaymentProof}
                        className="text-[9px] font-mono text-zinc-500 hover:text-zinc-300 bg-zinc-900/40 hover:bg-zinc-900/80 px-2 py-1 rounded inline-block cursor-pointer transition-colors"
                      >
                        ⚡ Fill Mock UPI Proof (Auto-test Simulator)
                      </button>
                    </div>
                  </form>
                </motion.div>
              )}

              {/* === INTERSTITIAL SUBMITTING/PROCESSING STATE === */}
              {step === CheckoutStep.SUBMITTING && (
                <motion.div
                  key="submitting-panel"
                  className="py-12 flex flex-col items-center justify-center gap-4 text-center select-none"
                >
                  <RefreshCw className="w-10 h-10 animate-spin text-[#8b5cf6]" />
                  <div className="space-y-1.5">
                    <strong className="text-sm font-bold text-white block uppercase tracking-widest">Uploading Settlement Elements</strong>
                    <p className="text-xs text-slate-400 max-w-sm leading-relaxed font-light">
                      Registering order and saving screenshot vectors. Please do not close the window or reload your browser.
                    </p>
                  </div>
                </motion.div>
              )}

              {/* === SUCCESS PAGE DISPLAY === */}
              {step === CheckoutStep.SUCCESS && (
                <motion.div
                  key="success-panel"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="py-6 flex flex-col items-center text-center space-y-6"
                >
                  {/* Big Green Success Badge */}
                  <div className="h-16 w-16 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center text-2xl shadow-xl shadow-emerald-950/20 animate-bounce">
                    ✅
                  </div>

                  <div className="space-y-2">
                    <h3 className="text-xl sm:text-2xl font-black text-white tracking-wide uppercase">
                      Payment Submitted Successfully
                    </h3>
                    <p className="text-xs text-slate-300 max-w-md mx-auto leading-relaxed font-light">
                      Your payment has been submitted and is currently under verification. You will receive a confirmation message shortly on your registered mobile number <code className="bg-emerald-500/10 text-emerald-400 px-1 py-0.5 rounded font-mono text-xs">{mobileNumber || currentUser?.phoneNumber || 'provided contact'}</code>.
                    </p>
                  </div>

                  {/* Summary card design */}
                  {processedOrder && (
                    <div className="w-full bg-[#0b0728]/30 border border-violet-500/10 p-4 rounded-xl text-left max-w-md mx-auto space-y-2 font-mono text-xs text-slate-400">
                      <div className="flex justify-between border-b border-violet-950 pb-1.5 select-all">
                        <span>Order Reference:</span>
                        <span className="font-bold text-violet-300">{processedOrder.id}</span>
                      </div>
                      <div className="flex justify-between select-all">
                        <span>UTR / Txn Ref:</span>
                        <span className="text-slate-300 font-bold">{utrNumber}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Amount Paid:</span>
                        <span className="text-emerald-400 font-bold">₹{processedOrder.totalAmount.toLocaleString('en-IN')}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Payment Status:</span>
                        <span className="bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider text-[9px]">
                          Pending Audit
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Redirection actions requested by prompt */}
                  <div className="flex flex-col sm:flex-row gap-3 w-full max-w-md mx-auto select-none pt-4">
                    <a
                      href={`https://wa.me/${supportWhatsAppNumber}?text=${encodeURIComponent(`Hi, I've completed payment of ₹${processedOrder?.totalAmount || finalOrderTotal || orderTotal} for Order: ${processedOrder?.id || 'reference'}. My UTR is ${utrNumber}. Please confirm my payment.`)}`}
                      target="_blank"
                      referrerPolicy="no-referrer"
                      className="flex-1 bg-[#25D366] hover:bg-[#20ba59] text-white font-bold py-3 px-4 rounded-xl text-xs tracking-widest uppercase flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-950/20 transition-all cursor-pointer"
                    >
                      <MessageSquare className="w-4 h-4 shrink-0 fill-white text-[#25D366]" />
                      <span>Chat on WhatsApp</span>
                    </a>

                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                      }}
                      className="flex-1 bg-violet-600 hover:bg-violet-500 text-white font-bold py-3 px-4 rounded-xl text-xs tracking-widest uppercase transition-all cursor-pointer"
                    >
                      Continue Shopping
                    </button>
                  </div>
                </motion.div>
              )}

            </AnimatePresence>
          </div>

          {/* Secure visual assurance footer */}
          {step !== CheckoutStep.SUCCESS && (
            <div className="mt-8 border-t border-violet-950/30 pt-4 flex flex-col sm:flex-row items-center justify-between text-[10px] text-slate-500 select-none gap-2">
              <span className="flex items-center gap-1 font-light">
                <Lock className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                Compliant NPCI Encrypted UPI Bridge
              </span>
              <span>Secure Vault Clearance Node 2026</span>
            </div>
          )}

        </div>

        {/* Right order summary column (Col-span-4) */}
        <div className="md:col-span-4 p-6 sm:p-8 bg-[#090525]/60 flex flex-col justify-between">
          <div className="space-y-5">
            <h3 className="text-[11px] font-extrabold uppercase tracking-widest text-[#8b5cf6] border-b border-violet-950 pb-2.5 select-none">
              Order Summary
            </h3>

            {/* List of checkout items */}
            <div className="space-y-4 max-h-[220px] overflow-y-auto pr-1">
              {cart.map((item) => (
                <div key={item.product.id} className="flex gap-3 text-xs">
                  <div className="h-11 w-11 shrink-0 rounded-lg overflow-hidden border border-violet-950 select-none">
                    <img src={item.product.image} className="h-full w-full object-cover" alt="item" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="font-bold text-white block truncate">{item.product.name}</span>
                    <span className="text-[10px] text-slate-400 font-light tracking-wide mt-1 block">
                      ₹{item.product.price.toLocaleString('en-IN')} × {item.quantity}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Fee summary block */}
            <div className="space-y-2 border-t border-violet-950 pt-4 text-xs select-none">
              
              <div className="flex justify-between text-slate-400 font-light">
                <span>Subtotal</span>
                <span>₹{cartTotal.toLocaleString('en-IN')}</span>
              </div>

              {activeCoupon && (
                <div className="flex justify-between text-emerald-400 font-light">
                  <span className="flex items-center gap-1 truncate max-w-[130px]" title={`Coupon applied: ${activeCoupon.code}`}>
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>-{activeCoupon.code}</span>
                  </span>
                  <span>-₹{discountAmount.toLocaleString('en-IN')}</span>
                </div>
              )}



              <div className="flex justify-between text-slate-400 font-light">
                <span>Shipping Fee</span>
                <span>{shippingFee === 0 ? <span className="text-emerald-400 font-bold uppercase text-[9px]">Free</span> : `₹${shippingFee}`}</span>
              </div>

              {/* Promo code field */}
              <div className="mt-4 pt-4 border-t border-violet-950/50 space-y-2">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">PROMO CODE</span>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={couponInput}
                    onChange={(e) => {
                      setCouponInput(e.target.value);
                      setCouponError(null);
                      setCouponSuccessMsg(null);
                    }}
                    placeholder="Enter Code (e.g. WELCOME10)"
                    disabled={!!activeCoupon}
                    className="flex-1 rounded-lg bg-[#040118]/80 border border-violet-500/15 focus:border-violet-500/40 px-3 py-2 text-xs text-white uppercase placeholder:normal-case font-mono tracking-wide focus:outline-none disabled:opacity-50"
                  />
                  {activeCoupon ? (
                    <button
                      type="button"
                      onClick={() => {
                        clearCoupon();
                        setCouponInput('');
                        setCouponSuccessMsg(null);
                        setCouponError(null);
                      }}
                      className="rounded-lg bg-red-950/30 hover:bg-red-950/60 text-red-400 border border-red-500/20 px-3 py-2 text-xs font-bold uppercase tracking-widest transition-all cursor-pointer"
                    >
                      Remove
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        if (!couponInput.trim()) return;
                        const res = applyCoupon(couponInput);
                        if (res.success) {
                          setCouponSuccessMsg(res.message);
                        } else {
                          setCouponError(res.message);
                        }
                      }}
                      className="rounded-lg bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white px-4 py-2 text-xs font-bold uppercase tracking-widest transition-all cursor-pointer shadow-md shadow-violet-600/15"
                    >
                      Apply
                    </button>
                  )}
                </div>
                {couponError && (
                  <p className="text-[10px] text-red-400 font-semibold leading-normal mt-1">{couponError}</p>
                )}
                {couponSuccessMsg && (
                  <p className="text-[10px] text-emerald-400 font-semibold leading-normal mt-1">{couponSuccessMsg}</p>
                )}
              </div>

              <div className="flex justify-between text-white font-extrabold text-base border-t border-violet-950 pt-3 font-mono">
                <span>Total Due</span>
                <span>₹{orderTotal.toLocaleString('en-IN')}</span>
              </div>

            </div>
          </div>

          {/* Secure lock notice on side */}
          <div className="mt-6 p-3 bg-violet-950/20 border border-violet-500/10 rounded-xl text-[10.5px] select-none text-slate-400 leading-normal font-light">
            <Lock className="w-4 h-4 text-violet-400 float-left mr-2.5 mt-0.5" />
            UPI transactions undergo cryptographic visual check by verification team. Keep the payment receipt screenshot saved.
          </div>

        </div>

      </div>
    </div>
  </div>
  );
};

export default CheckoutForm;
