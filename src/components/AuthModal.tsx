import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { motion } from 'motion/react';
import { X, ShieldCheck, Sparkles, ArrowLeft, KeyRound, Check, Smartphone, Mail, Lock, User } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  isLocked?: boolean;
}

const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, isLocked = false }) => {
  const { loginWithEmail, signUpWithEmail, adminLogin } = useApp();

  const [view, setView] = useState<'login' | 'register' | 'admin'>('login');
  
  // Registration Inputs
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regMobile, setRegMobile] = useState('');
  const [regPassword, setRegPassword] = useState('');

  // Login Inputs
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Admin Inputs
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPasscode, setAdminPasscode] = useState('');
  const [isSubmittingAdmin, setIsSubmittingAdmin] = useState(false);

  // States
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successLogin, setSuccessLogin] = useState(false);

  // Reset modal state on open
  useEffect(() => {
    if (isOpen) {
      setView('login');
      setRegName('');
      setRegEmail('');
      setRegMobile('');
      setRegPassword('');
      setLoginEmail('');
      setLoginPassword('');
      setAdminEmail('');
      setAdminPasscode('');
      setErrorMsg('');
      setSuccessMsg('');
      setIsSubmitting(false);
      setSuccessLogin(false);
    }
  }, [isOpen]);

  const validateIndianPhone = (phone: string): { isValid: boolean; formatted?: string; error?: string } => {
    const clean = phone.trim().replace(/[\s()-]/g, '');
    
    if (!clean) {
      return { isValid: false, error: 'Mobile number is required for support and verification.' };
    }
    
    // Case 1: Standard 10-digit number starting with 6-9
    if (clean.length === 10 && /^[6-9]/.test(clean)) {
      return { isValid: true, formatted: '+91' + clean };
    }
    
    // Case 2: Country code starting with +91 and 10 digits
    if (clean.startsWith('+91')) {
      const mainNum = clean.substring(3);
      if (mainNum.length === 10 && /^[6-9]/.test(mainNum)) {
        return { isValid: true, formatted: clean };
      }
      return { isValid: false, error: 'Standard Indian Mobile verification expects 10 digits following +91.' };
    }
    
    // Case 3: Country code starting with 91 (no + sign) and 10 digits
    if (clean.startsWith('91') && clean.length === 12) {
      const mainNum = clean.substring(2);
      if (mainNum.length === 10 && /^[6-9]/.test(mainNum)) {
        return { isValid: true, formatted: '+' + clean };
      }
    }

    if (clean.startsWith('+')) {
      if (clean.length >= 10 && clean.length <= 15) {
        return { isValid: true, formatted: clean };
      }
    }

    return { isValid: false, error: 'Please specify a valid 10-digit Indian Mobile Number (e.g. 9876543210).' };
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!regName.trim()) {
      setErrorMsg('Full Name is required.');
      return;
    }
    if (!regEmail.trim()) {
      setErrorMsg('Email Address is required.');
      return;
    }
    
    const phoneValidation = validateIndianPhone(regMobile);
    if (!phoneValidation.isValid) {
      setErrorMsg(phoneValidation.error || 'Invalid phone number format.');
      return;
    }

    if (!regPassword || regPassword.length < 6) {
      setErrorMsg('Password must consist of at least 6 characters.');
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await signUpWithEmail(
        regEmail.trim(),
        regPassword,
        regName.trim(),
        phoneValidation.formatted!
      );

      if (result.success) {
        setSuccessMsg('Account created immediately! Navigating to Sign In...');
        setTimeout(() => {
          setView('login');
          setLoginEmail(regEmail);
          setSuccessMsg('');
          setErrorMsg('');
        }, 1500);
      } else {
        setErrorMsg(result.error || 'Failed to complete registration.');
      }
    } catch (err: any) {
      setErrorMsg('Unexpected server interface handshake breakdown.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!loginEmail.trim()) {
      setErrorMsg('Email Address is required.');
      return;
    }
    if (!loginPassword) {
      setErrorMsg('Password is required.');
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await loginWithEmail(loginEmail.trim(), loginPassword);
      if (result.success) {
        setSuccessLogin(true);
        setTimeout(() => {
          onClose();
        }, 850);
      } else {
        setErrorMsg(result.error || 'Incorrect email or password.');
      }
    } catch (err: any) {
      setErrorMsg('Handshake termination: Server auth failure.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAdminVerifySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminEmail.trim() || !adminPasscode.trim()) {
      setErrorMsg('Please input both authorization email and passcode coordinates.');
      return;
    }
    setErrorMsg('');
    setIsSubmittingAdmin(true);
    try {
      const res = await adminLogin(adminEmail, adminPasscode);
      if (res.success) {
        onClose();
      } else {
        setErrorMsg(res.error || 'Identity unrecognized: Invalid admin credentials.');
      }
    } catch (err) {
      setErrorMsg('Access Protocol Error: Secure handshake connection failed.');
    } finally {
      setIsSubmittingAdmin(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-all duration-300 ${isLocked ? 'pointer-events-none' : ''}`}>
      {/* Backdrop overlay */}
      <div
        onClick={isLocked ? undefined : onClose}
        className="absolute inset-0 bg-[#000000]/80 backdrop-blur-md transition-opacity duration-300"
        id="auth_modal_backdrop"
      />

      {/* Modal Container */}
      <motion.div
        id="auth_modal_panel"
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        transition={{ type: 'spring', damping: 25, stiffness: 350 }}
        className="relative w-full max-w-md overflow-hidden rounded-3xl border border-violet-500/10 bg-[#060415]/95 p-6 shadow-2xl backdrop-blur-xl pointer-events-auto sm:p-8"
      >
        {/* Header Action Button (Close) */}
        {!isLocked && (
          <button
            onClick={onClose}
            className="absolute right-4 top-4 rounded-full p-2 text-slate-400 hover:bg-violet-950/40 hover:text-white transition-all cursor-pointer"
            id="auth_modal_close_btn"
          >
            <X className="h-5 w-5" />
          </button>
        )}

        {/* Success login transition state */}
        {successLogin ? (
          <div className="flex flex-col items-center justify-center py-10 text-center font-sans">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: [0.8, 1.1, 1], opacity: 1 }}
              className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-450 border border-emerald-500/30 mb-4"
            >
              <Check className="h-8 w-8 text-emerald-400" />
            </motion.div>
            <h3 className="text-xl font-bold text-white mb-2">Authentication Authorized</h3>
            <p className="text-xs text-slate-400 font-light">Secure token synchronized. Welcome back!</p>
          </div>
        ) : (
          <>
            {/* Modal Header content based on views */}
            {view === 'admin' ? (
              <div className="mb-5 font-sans">
                <button
                  onClick={() => { setView('login'); setErrorMsg(''); setSuccessMsg(''); }}
                  className="inline-flex items-center gap-1 text-[11px] font-extrabold uppercase tracking-widest text-[#8b5cf6] hover:text-white mb-4 transition-colors cursor-pointer select-none"
                  id="auth_back_to_login_btn"
                >
                  <ArrowLeft className="h-3 w-3" /> Back to Customer Gateway
                </button>
                <div className="flex items-center gap-2 mb-1.5">
                  <ShieldCheck className="h-5 w-5 text-emerald-400" />
                  <h4 className="text-base font-extrabold tracking-tight text-white uppercase font-sans">
                    Server Control Deck
                  </h4>
                </div>
                <p className="text-[11px] text-slate-400 font-light select-none font-sans">
                  Input credentials for complete administrative controls.
                </p>
              </div>
            ) : (
              <div className="flex flex-col items-center text-center mt-2 mb-6 font-sans">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-r from-violet-600 to-indigo-650 text-white mb-3 shadow-lg shadow-violet-600/15">
                  <Lock className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-lg font-extrabold tracking-tight text-white font-sans">
                  Sethi Secure Systems
                </h3>
                <p className="text-xs text-slate-400 font-light mt-1 font-sans">
                  Authenticate your high-performance hardware profile
                </p>

                {/* Secure Auth Tab select rail */}
                <div className="flex w-full mt-5 bg-[#05021a] p-1 rounded-xl border border-violet-500/10 font-sans">
                  <button
                    onClick={() => { setView('login'); setErrorMsg(''); setSuccessMsg(''); }}
                    className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                      view === 'login' ? 'bg-[#8b5cf6] text-white' : 'text-slate-400 hover:text-white'
                    }`}
                    id="auth_tab_login"
                  >
                    Sign In
                  </button>
                  <button
                    onClick={() => { setView('register'); setErrorMsg(''); setSuccessMsg(''); }}
                    className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                      view === 'register' ? 'bg-[#8b5cf6] text-white' : 'text-slate-400 hover:text-white'
                    }`}
                    id="auth_tab_register"
                  >
                    Create Account
                  </button>
                </div>
              </div>
            )}

            {/* ERROR DISPLAY */}
            {errorMsg && (
              <p className="text-xs text-red-400 font-semibold bg-red-950/20 p-3 rounded-xl border border-red-500/15 mb-4 leading-relaxed" id="auth_error_box">
                {errorMsg}
              </p>
            )}

            {/* SUCCESS MESSAGE */}
            {successMsg && (
              <p className="text-xs text-emerald-400 font-semibold bg-emerald-950/20 p-3 rounded-xl border border-emerald-500/15 mb-4 leading-relaxed" id="auth_success_box">
                {successMsg}
              </p>
            )}

            {/* VIEW RENDER: LOGIN */}
            {view === 'login' && (
              <form onSubmit={handleLoginSubmit} className="space-y-4 font-sans animate-fade-in" id="login_form">
                <div>
                  <label className="block text-[9px] font-extrabold uppercase tracking-widest text-[#8b5cf6] mb-1.5 font-mono">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                    <input
                      type="email"
                      required
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      placeholder="name@company.com"
                      className="w-full bg-[#05021a] border border-violet-500/15 rounded-xl pl-9 pr-3 py-2.5 text-xs focus:border-violet-500 outline-none text-white placeholder-slate-650"
                      id="login_email_input"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[9px] font-extrabold uppercase tracking-widest text-[#8b5cf6] mb-1.5 font-mono">
                    Access Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                    <input
                      type="password"
                      required
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full bg-[#05021a] border border-violet-500/15 rounded-xl pl-9 pr-3 py-2.5 text-xs focus:border-violet-500 outline-none text-white placeholder-slate-650"
                      id="login_password_input"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full flex items-center justify-center gap-1.5 bg-[#8b5cf6] hover:bg-[#7c3aed] text-white rounded-xl py-3 text-xs font-bold transition-all disabled:opacity-50 cursor-pointer uppercase tracking-widest active:scale-98 mt-6 shadow-md shadow-violet-500/10"
                  id="login_submit_btn"
                >
                  {isSubmitting ? 'Verifying profile...' : 'Sign In To Hardware'}
                </button>

                <div className="pt-2 text-center select-none font-sans">
                  <button
                    type="button"
                    onClick={() => { setView('admin'); setErrorMsg(''); setSuccessMsg(''); }}
                    className="text-[10px] text-slate-550 hover:text-slate-350 transform active:scale-95 transition-all outline-none font-light uppercase tracking-widest"
                    id="admin_deck_trigger"
                  >
                    Authorization Terminal Login
                  </button>
                </div>
              </form>
            )}

            {/* VIEW RENDER: REGISTER */}
            {view === 'register' && (
              <form onSubmit={handleRegisterSubmit} className="space-y-4 font-sans animate-fade-in" id="register_form">
                <div>
                  <label className="block text-[9px] font-extrabold uppercase tracking-widest text-[#8b5cf6] mb-1.5 font-mono">
                    Full Name
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                    <input
                      type="text"
                      required
                      value={regName}
                      onChange={(e) => setRegName(e.target.value)}
                      placeholder="Hardik Sethi"
                      className="w-full bg-[#05021a] border border-violet-500/15 rounded-xl pl-9 pr-3 py-2.5 text-xs focus:border-violet-500 outline-none text-white placeholder-slate-650"
                      id="reg_name_input"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[9px] font-extrabold uppercase tracking-widest text-[#8b5cf6] mb-1.5 font-mono">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                    <input
                      type="email"
                      required
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      placeholder="name@provider.com"
                      className="w-full bg-[#05021a] border border-violet-500/15 rounded-xl pl-9 pr-3 py-2.5 text-xs focus:border-violet-500 outline-none text-white placeholder-slate-650"
                      id="reg_email_input"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[9px] font-extrabold uppercase tracking-widest text-[#8b5cf6] mb-1.5 font-mono">
                    Mobile Number (India Prefix auto-mapped)
                  </label>
                  <div className="relative">
                    <Smartphone className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                    <input
                      type="tel"
                      required
                      value={regMobile}
                      onChange={(e) => setRegMobile(e.target.value)}
                      placeholder="98765 43210 (10 digits)"
                      className="w-full bg-[#05021a] border border-violet-500/15 rounded-xl pl-9 pr-3 py-2.5 text-xs focus:border-violet-500 outline-none text-white placeholder-slate-650"
                      id="reg_mobile_input"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[9px] font-extrabold uppercase tracking-widest text-[#8b5cf6] mb-1.5 font-mono">
                    Password (Min. 6 chars)
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                    <input
                      type="password"
                      required
                      min={6}
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-[#05021a] border border-violet-500/15 rounded-xl pl-9 pr-3 py-2.5 text-xs focus:border-violet-500 outline-none text-white placeholder-slate-650"
                      id="reg_password_input"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full flex items-center justify-center gap-1.5 bg-[#8b5cf6] hover:bg-[#7c3aed] text-white rounded-xl py-3 text-xs font-bold transition-all disabled:opacity-50 cursor-pointer uppercase tracking-widest active:scale-98 mt-6 shadow-md shadow-violet-500/10"
                  id="reg_submit_btn"
                >
                  {isSubmitting ? 'Registering...' : 'Create My Account'}
                </button>
              </form>
            )}

            {/* VIEW RENDER: SYSTEM ADMIN ACCESS */}
            {view === 'admin' && (
              <div className="space-y-4 font-sans animate-fade-in" id="admin_form">
                <form onSubmit={handleAdminVerifySubmit} className="space-y-3.5">
                  <div>
                    <label className="block text-[9px] font-extrabold uppercase tracking-widest text-[#8b5cf6] mb-1.5 font-mono">
                      Admin Email Identifier
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                      <input
                        type="email"
                        required
                        value={adminEmail}
                        onChange={(e) => setAdminEmail(e.target.value)}
                        placeholder="admin@presidiostore.com"
                        className="w-full bg-[#05021a] border border-violet-500/15 rounded-xl pl-9 pr-3 py-2.5 text-xs focus:border-violet-500 outline-none text-white placeholder-slate-650"
                        id="admin_email_input"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[9px] font-extrabold uppercase tracking-widest text-[#8b5cf6] mb-1.5 font-mono">
                      Access Keys
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                      <input
                        type="password"
                        required
                        value={adminPasscode}
                        onChange={(e) => setAdminPasscode(e.target.value)}
                        placeholder="••••••••••••"
                        className="w-full bg-[#05021a] border border-violet-500/15 rounded-xl pl-9 pr-3 py-2.5 text-xs focus:border-violet-500 outline-none text-white placeholder-slate-650"
                        id="admin_password_input"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmittingAdmin}
                    className="w-full flex items-center justify-center gap-1.5 bg-gradient-to-r from-violet-600 to-indigo-650 hover:from-violet-500 hover:to-indigo-500 text-white rounded-xl py-3 text-xs font-bold transition-all disabled:opacity-50 cursor-pointer uppercase tracking-widest active:scale-98 mt-6"
                    id="admin_submit_btn"
                  >
                    {isSubmittingAdmin ? 'Verifying authority...' : 'Verify Admin Authority'}
                  </button>
                </form>
              </div>
            )}
          </>
        )}
      </motion.div>
    </div>
  );
};

export default AuthModal;
