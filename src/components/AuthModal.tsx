/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  Lock,
  User,
  Shield,
  CheckCircle,
  AlertCircle,
  Sparkles,
  Phone,
  Mail,
  Gift,
  ArrowRight,
  UserPlus,
  LogIn,
} from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const {
    language,
    login,
    loginWithGoogleAction,
    signUpCustomerAction,
    setActiveView,
    rewardsPolicy,
  } = useApp();

  // Mode: 'login' or 'signup'
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');

  // Login form state
  const [identity, setIdentity] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [rememberMe, setRememberMe] = useState<boolean>(true);

  // Sign up form state
  const [signupName, setSignupName] = useState<string>('');
  const [signupEmail, setSignupEmail] = useState<string>('');
  const [signupPhone, setSignupPhone] = useState<string>('');
  const [signupPassword, setSignupPassword] = useState<string>('');

  // UI state
  const [isGoogleLoading, setIsGoogleLoading] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [successMessage, setSuccessMessage] = useState<string>('');

  if (!isOpen) return null;

  // Real Google Sign-In Handler
  const handleGoogleSignIn = async () => {
    setErrorMessage('');
    setSuccessMessage('');
    setIsGoogleLoading(true);

    try {
      const res = await loginWithGoogleAction();
      if (res.success) {
        setSuccessMessage(
          language === 'ar'
            ? 'تم تسجيل الدخول بحساب Google بنجاح! مرحباً بك في ألفا كلين.'
            : 'Successfully signed in with Google!'
        );
        setTimeout(() => {
          setIsGoogleLoading(false);
          onClose();
          setActiveView('profile');
        }, 800);
      } else {
        setIsGoogleLoading(false);
        setErrorMessage(res.message || 'تعذر تسجيل الدخول عبر Google');
      }
    } catch (err: any) {
      setIsGoogleLoading(false);
      setErrorMessage(err?.message || 'حدث خطأ غير متوقع');
    }
  };

  // Manual Login Handler with Role-Based Routing
  const handleManualLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');
    const res = login(identity, password, rememberMe);
    if (res.success) {
      if (res.role === 'admin' || res.role === 'supervisor') {
        setActiveView('supervisor');
      } else if (res.role === 'cleaner') {
        setActiveView('cleaner');
      } else {
        setActiveView('profile');
      }
      onClose();
    } else {
      setErrorMessage(res.message || 'بيانات الدخول غير صحيحة');
    }
  };

  // Sign Up Handler
  const handleSignUpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (signupPassword.length < 6) {
      setErrorMessage(
        language === 'ar'
          ? 'يجب أن تتكون كلمة المرور من 6 أحرف أو أرقام على الأقل'
          : 'Password must be at least 6 characters'
      );
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await signUpCustomerAction(
        signupName,
        signupEmail,
        signupPassword,
        signupPhone
      );
      if (res.success) {
        setSuccessMessage(
          language === 'ar'
            ? `تم إنشاء حسابك بنجاح! تم إضافة ${rewardsPolicy.welcomeBonusWalletAed || 25} درهم رصيد ترحيبي إلى محفظتك.`
            : 'Account created successfully! Welcome bonus credited to your wallet.'
        );
        setTimeout(() => {
          setIsSubmitting(false);
          onClose();
          setActiveView('profile');
        }, 1200);
      } else {
        setIsSubmitting(false);
        setErrorMessage(res.message || 'فشل إنشاء الحساب');
      }
    } catch (err: any) {
      setIsSubmitting(false);
      setErrorMessage(err?.message || 'حدث خطأ أثناء إنشاء الحساب');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-5 my-8">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-sky-100 text-sky-700 flex items-center justify-center font-bold">
              {authMode === 'login' ? <LogIn className="w-5 h-5" /> : <UserPlus className="w-5 h-5 text-amber-600" />}
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-900">
                {authMode === 'login'
                  ? language === 'ar' ? 'تسجيل الدخول لمنظومة ألفا كلين' : 'Sign In to Alfa Clean'
                  : language === 'ar' ? 'إنشاء حساب عميل جديد' : 'Create New Account'}
              </h3>
              <p className="text-[11px] text-slate-500">
                {authMode === 'login'
                  ? language === 'ar' ? 'أهلاً بعودتك، تابع خدماتك ومحفظتك' : 'Welcome back, access your wallet and bookings'
                  : language === 'ar' ? 'انضم إلينا واحصل على رصيد ترحيبي فوري' : 'Join us and receive an instant welcome bonus'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-xl text-slate-400 hover:text-slate-600 cursor-pointer text-sm"
          >
            ✕
          </button>
        </div>

        {/* Tab Switcher: Login vs Sign Up */}
        <div className="grid grid-cols-2 p-1 bg-slate-100 rounded-2xl gap-1 text-xs font-bold">
          <button
            type="button"
            onClick={() => {
              setAuthMode('login');
              setErrorMessage('');
              setSuccessMessage('');
            }}
            className={`py-2 rounded-xl transition-all ${
              authMode === 'login'
                ? 'bg-white text-sky-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {language === 'ar' ? 'تسجيل الدخول' : 'Sign In'}
          </button>
          <button
            type="button"
            onClick={() => {
              setAuthMode('signup');
              setErrorMessage('');
              setSuccessMessage('');
            }}
            className={`py-2 rounded-xl transition-all ${
              authMode === 'signup'
                ? 'bg-white text-amber-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {language === 'ar' ? 'إنشاء حساب جديد ✨' : 'Create Account ✨'}
          </button>
        </div>

        {/* REAL GOOGLE SIGN-IN BUTTON */}
        <div className="space-y-2">
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={isGoogleLoading}
            className="w-full py-3 px-4 rounded-2xl border-2 border-slate-200 hover:border-sky-400 bg-white hover:bg-sky-50/40 text-slate-800 font-black text-xs sm:text-sm flex items-center justify-center gap-3 shadow-xs transition-all cursor-pointer disabled:opacity-50"
          >
            {/* Official Google 'G' Logo SVG */}
            <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>
              {isGoogleLoading
                ? (language === 'ar' ? 'جارٍ الاتصال...' : 'Connecting...')
                : authMode === 'login'
                ? (language === 'ar' ? 'المتابعة بحساب Google' : 'Continue with Google Account')
                : (language === 'ar' ? 'التسجيل عبر حساب Google' : 'Sign Up with Google')}
            </span>
          </button>
        </div>

        {/* Divider */}
        <div className="relative flex items-center justify-center">
          <div className="border-t border-slate-200 w-full"></div>
          <span className="bg-white px-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider shrink-0">
            {language === 'ar' ? 'أو عبر البريد والهاتف' : 'Or with Email & Phone'}
          </span>
          <div className="border-t border-slate-200 w-full"></div>
        </div>

        {/* Welcome Bonus Callout on Sign Up */}
        {authMode === 'signup' && (
          <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-amber-500 text-slate-950 font-black flex items-center justify-center shrink-0">
              <Gift className="w-4 h-4" />
            </div>
            <div>
              <div className="font-black text-amber-950">
                {language === 'ar' ? 'هدية ترحيبية فورية!' : 'Instant Welcome Gift!'}
              </div>
              <div className="text-[11px] text-amber-800">
                {language === 'ar'
                  ? `احصل على ${rewardsPolicy.welcomeBonusWalletAed || 25} د.إ رصيد محفظة + ${rewardsPolicy.welcomeBonusPoints || 50} نقطة مكافأة فور تسجيلك`
                  : `Get ${rewardsPolicy.welcomeBonusWalletAed || 25} AED wallet credit + ${rewardsPolicy.welcomeBonusPoints || 50} reward points`}
              </div>
            </div>
          </div>
        )}

        {/* Feedback Messages */}
        {errorMessage && (
          <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2">
            <CheckCircle className="w-4 h-4 shrink-0 text-emerald-600" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* 1. LOGIN FORM */}
        {authMode === 'login' ? (
          <form onSubmit={handleManualLogin} className="space-y-3.5 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                {language === 'ar' ? 'البريد، اسم المستخدم، أو رقم الهاتف:' : 'Email, Username or Phone:'}
              </label>
              <input
                type="text"
                required
                placeholder="e.g. alfacleanmaster@gmail.com"
                value={identity}
                onChange={(e) => setIdentity(e.target.value)}
                className="w-full p-3 rounded-2xl border border-slate-300 text-slate-800 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100 font-medium"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                {language === 'ar' ? 'كلمة المرور:' : 'Password:'}
              </label>
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full p-3 rounded-2xl border border-slate-300 text-slate-800 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100 font-mono"
              />
            </div>

            <div className="flex items-center justify-between text-slate-600 text-xs">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded text-sky-600"
                />
                <span>{language === 'ar' ? 'تذكرني' : 'Remember Me'}</span>
              </label>
            </div>

            <button
              type="submit"
              className="w-full py-3.5 rounded-2xl bg-sky-600 hover:bg-sky-700 text-white font-black text-sm shadow-md transition-all cursor-pointer"
            >
              {language === 'ar' ? 'تسجيل الدخول' : 'Sign In'}
            </button>
          </form>
        ) : (
          /* 2. SIGN UP FORM */
          <form onSubmit={handleSignUpSubmit} className="space-y-3 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                {language === 'ar' ? 'الاسم الكامل:' : 'Full Name:'}
              </label>
              <input
                type="text"
                required
                placeholder="مثال: خالد الكعبي"
                value={signupName}
                onChange={(e) => setSignupName(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-300 text-slate-800 outline-none focus:border-amber-500 font-bold"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  {language === 'ar' ? 'البريد الإلكتروني:' : 'Email Address:'}
                </label>
                <input
                  type="email"
                  required
                  placeholder="name@example.com"
                  value={signupEmail}
                  onChange={(e) => setSignupEmail(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 text-slate-800 outline-none focus:border-amber-500 font-mono"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  {language === 'ar' ? 'رقم الهاتف:' : 'Phone Number:'}
                </label>
                <input
                  type="tel"
                  required
                  placeholder="050 123 4567"
                  value={signupPhone}
                  onChange={(e) => setSignupPhone(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 text-slate-800 outline-none focus:border-amber-500 font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                {language === 'ar' ? 'كلمة المرور (6 أحرف فأكثر):' : 'Password (6+ chars):'}
              </label>
              <input
                type="password"
                required
                placeholder="••••••••"
                value={signupPassword}
                onChange={(e) => setSignupPassword(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-300 text-slate-800 outline-none focus:border-amber-500 font-mono"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 rounded-2xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-sm shadow-md transition-all cursor-pointer disabled:opacity-50 mt-1"
            >
              {isSubmitting
                ? (language === 'ar' ? 'جارٍ إنشاء الحساب...' : 'Creating Account...')
                : (language === 'ar' ? 'إنشاء حساب العميل الجديد ✨' : 'Create Customer Account ✨')}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
