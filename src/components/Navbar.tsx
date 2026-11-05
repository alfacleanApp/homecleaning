/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  Sparkles,
  User as UserIcon,
  Globe,
  Radio,
  LogOut,
  Calendar,
  Layers,
  CheckCircle,
  Menu,
  X,
  CreditCard,
  Phone,
} from 'lucide-react';

interface NavbarProps {
  onOpenAuth: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenAuth }) => {
  const {
    language,
    setLanguage,
    t,
    currentUser,
    logout,
    brandSettings,
    inProgressBooking,
    activeView,
    setActiveView,
    setActiveTrackingRef,
    customers,
  } = useApp();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // If logged in customer, get current wallet
  const customerAccount = currentUser?.customerId
    ? customers.find(c => c.id === currentUser.customerId)
    : null;

  // Only show in-progress booking alert if user is logged in
  const shouldShowInProgress = Boolean(
    currentUser &&
    inProgressBooking &&
    (currentUser.role === 'admin' ||
     currentUser.role === 'supervisor' ||
     currentUser.role === 'cleaner' ||
     (currentUser.role === 'customer' &&
      (inProgressBooking.customerId === currentUser.customerId ||
       inProgressBooking.customerEmail.toLowerCase() === (currentUser.email || '').toLowerCase()))
    )
  );

  const handleOpenInProgress = () => {
    if (inProgressBooking && shouldShowInProgress) {
      setActiveTrackingRef(inProgressBooking.reference);
      setActiveView('tracking');
    }
  };

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
      {/* Top micro bar for quick support */}
      <div className="bg-sky-900 text-sky-100 text-xs py-1.5 px-4 hidden md:block">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5 font-medium">
              <Phone className="w-3.5 h-3.5 text-amber-400" />
              <span>{brandSettings.phone}</span>
            </span>
            <span className="text-sky-300">|</span>
            <span>{brandSettings.addressAr}</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-amber-300 font-semibold">
              {language === 'ar' ? 'خصم 15% على الاشتراكات الدورية في أبوظبي' : '15% Off Periodic Subscriptions in Abu Dhabi'}
            </span>
            <span className="text-sky-400">•</span>
            <span className="text-slate-200">
              {language === 'ar' ? 'سعر الساعة: 35 درهم' : 'Hourly Rate: 35 AED'}
            </span>
          </div>
        </div>
      </div>

      {/* Main Navbar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo & Brand */}
          <div
            onClick={() => setActiveView('home')}
            className="flex items-center gap-3 cursor-pointer group"
          >
            <div className="relative w-12 h-12 rounded-2xl overflow-hidden bg-sky-50 border border-sky-100 flex items-center justify-center p-1 shadow-sm transition-transform group-hover:scale-105">
              <img
                src={brandSettings.logoUrl}
                alt="Alfa Clean"
                className="w-full h-full object-contain"
                onError={(e) => {
                  // Fallback icon if custom image path missing
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
              <Sparkles className="w-6 h-6 text-sky-600 hidden group-hover:inline-block" />
            </div>
            <div>
              <div className="text-xl sm:text-2xl font-black tracking-tight text-sky-700 flex items-center gap-1.5">
                <span>{language === 'ar' ? brandSettings.companyNameAr.split(' ')[0] + ' ' + brandSettings.companyNameAr.split(' ')[1] : 'ALFA CLEAN'}</span>
                <span className="inline-block w-2 h-2 rounded-full bg-amber-500"></span>
              </div>
              <p className="text-[11px] text-slate-500 hidden sm:block font-medium">
                {language === 'ar' ? 'تنظيف المنازل بالساعة في أبوظبي' : 'Abu Dhabi Hourly Home Cleaning'}
              </p>
            </div>
          </div>

          {/* Center Navigation Links */}
          <nav className="hidden lg:flex items-center gap-1 bg-slate-100/70 p-1.5 rounded-2xl border border-slate-200">
            <button
              onClick={() => setActiveView('home')}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                activeView === 'home'
                  ? 'bg-white text-sky-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
              }`}
            >
              {language === 'ar' ? 'الرئيسية' : 'Home'}
            </button>

            <button
              onClick={() => setActiveView('booking')}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all flex items-center gap-1.5 ${
                activeView === 'booking'
                  ? 'bg-sky-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
              }`}
            >
              <Calendar className="w-4 h-4" />
              <span>{t('book_now')}</span>
            </button>

            <button
              onClick={() => setActiveView('tracking')}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all flex items-center gap-1.5 ${
                activeView === 'tracking'
                  ? 'bg-white text-sky-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
              }`}
            >
              <Radio className="w-4 h-4" />
              <span>{t('track_order')}</span>
            </button>

            {/* If supervisor or admin: show console link */}
            {(currentUser?.role === 'supervisor' || currentUser?.role === 'admin') && (
              <button
                onClick={() => setActiveView('supervisor')}
                className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all flex items-center gap-1.5 ${
                  activeView === 'supervisor'
                    ? 'bg-amber-500 text-white shadow-xs'
                    : 'text-amber-800 bg-amber-50/70 hover:bg-amber-100'
                }`}
              >
                <Layers className="w-4 h-4" />
                <span>
                  {currentUser.role === 'admin'
                    ? language === 'ar' ? 'لوحة تحكم المدير' : 'Admin Console'
                    : language === 'ar' ? 'مشرف العمليات' : 'Supervisor'}
                </span>
              </button>
            )}

            {/* If cleaner: show portal link */}
            {currentUser?.role === 'cleaner' && (
              <button
                onClick={() => setActiveView('cleaner')}
                className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all flex items-center gap-1.5 ${
                  activeView === 'cleaner'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-emerald-800 bg-emerald-50 hover:bg-emerald-100'
                }`}
              >
                <CheckCircle className="w-4 h-4" />
                <span>{t('cleaner_portal')}</span>
              </button>
            )}
          </nav>

          {/* Right Hand Actions */}
          <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
            {/* Glowing Red Pulse Alert Button for In-Progress Booking (authenticated only) */}
            {shouldShowInProgress && inProgressBooking && (
              <button
                onClick={handleOpenInProgress}
                title={t('click_to_track')}
                className="relative flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-xl bg-gradient-to-r from-red-600 via-rose-600 to-red-700 text-white font-bold text-[11px] sm:text-sm shadow-md shadow-red-500/30 animate-pulse hover:opacity-95 transition-all cursor-pointer"
              >
                <span className="relative flex h-2 w-2 sm:h-2.5 sm:w-2.5 shrink-0">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-90"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 sm:h-2.5 sm:w-2.5 bg-yellow-300"></span>
                </span>
                <span className="whitespace-nowrap hidden sm:inline">
                  {language === 'ar' ? 'طلب جاري التنفيذ' : 'In-Progress'} #{inProgressBooking.reference}
                </span>
                <span className="whitespace-nowrap sm:hidden">
                  #{inProgressBooking.reference}
                </span>
              </button>
            )}

            {/* Wallet Balance Badge for Customer */}
            {customerAccount && (
              <button
                onClick={() => setActiveView('profile')}
                className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 font-bold text-xs"
              >
                <CreditCard className="w-3.5 h-3.5 text-amber-600" />
                <span>{customerAccount.walletBalance} {t('aed')}</span>
                <span className="text-amber-500">•</span>
                <span className="text-amber-700 font-normal">{customerAccount.points} {t('points')}</span>
              </button>
            )}

            {/* Language Switcher */}
            <button
              onClick={() => setLanguage(language === 'ar' ? 'en' : 'ar')}
              aria-label="Toggle language"
              className="p-1.5 sm:px-3 sm:py-2 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-bold flex items-center gap-1 transition-colors"
            >
              <Globe className="w-3.5 h-3.5 text-sky-600" />
              <span className="hidden sm:inline">{language === 'ar' ? 'English' : 'العربية'}</span>
              <span className="sm:hidden">{language === 'ar' ? 'EN' : 'ع'}</span>
            </button>

            {/* Auth / User Menu */}
            {currentUser ? (
              <div className="flex items-center gap-1 sm:gap-2">
                <button
                  onClick={() => {
                    if (currentUser.role === 'customer') setActiveView('profile');
                    else if (currentUser.role === 'cleaner') setActiveView('cleaner');
                    else setActiveView('supervisor');
                  }}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-xl bg-sky-50 border border-sky-200 text-sky-800 text-xs sm:text-sm font-bold hover:bg-sky-100 transition-colors"
                >
                  {currentUser.avatarUrl ? (
                    <img src={currentUser.avatarUrl} alt="" className="w-4 h-4 sm:w-5 sm:h-5 rounded-full object-cover shrink-0" />
                  ) : (
                    <UserIcon className="w-3.5 h-3.5 text-sky-600 shrink-0" />
                  )}
                  <span className="max-w-[70px] sm:max-w-[110px] truncate">{currentUser.name}</span>
                </button>
                <button
                  onClick={logout}
                  title={t('logout')}
                  className="p-1.5 sm:p-2 rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                onClick={onOpenAuth}
                className="flex items-center gap-1 px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs sm:text-sm shadow-xs transition-colors shrink-0"
              >
                <UserIcon className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{t('login')}</span>
                <span className="sm:hidden">{language === 'ar' ? 'دخول' : 'Login'}</span>
              </button>
            )}

            {/* Mobile Hamburger */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-1.5 sm:p-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-100"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-white border-b border-slate-200 px-4 pt-2 pb-6 space-y-2">
          {shouldShowInProgress && inProgressBooking && (
            <button
              onClick={() => {
                handleOpenInProgress();
                setMobileMenuOpen(false);
              }}
              className="w-full flex items-center justify-between p-3 rounded-xl bg-red-600 text-white font-bold text-sm animate-pulse mb-3"
            >
              <div className="flex items-center gap-2">
                <span className="inline-block w-2 h-2 rounded-full bg-yellow-300"></span>
                <span>{t('in_progress_alert')}</span>
              </div>
              <span>#{inProgressBooking.reference}</span>
            </button>
          )}

          <button
            onClick={() => {
              setActiveView('home');
              setMobileMenuOpen(false);
            }}
            className={`w-full text-right py-2.5 px-3 rounded-xl font-semibold text-sm ${
              activeView === 'home' ? 'bg-sky-50 text-sky-700' : 'text-slate-700'
            }`}
          >
            {language === 'ar' ? 'الرئيسية' : 'Home'}
          </button>

          <button
            onClick={() => {
              setActiveView('booking');
              setMobileMenuOpen(false);
            }}
            className={`w-full text-right py-2.5 px-3 rounded-xl font-semibold text-sm ${
              activeView === 'booking' ? 'bg-sky-600 text-white' : 'text-slate-700'
            }`}
          >
            {t('book_now')}
          </button>

          <button
            onClick={() => {
              setActiveView('tracking');
              setMobileMenuOpen(false);
            }}
            className={`w-full text-right py-2.5 px-3 rounded-xl font-semibold text-sm ${
              activeView === 'tracking' ? 'bg-sky-50 text-sky-700' : 'text-slate-700'
            }`}
          >
            {t('track_order')}
          </button>

          {(currentUser?.role === 'supervisor' || currentUser?.role === 'admin') && (
            <button
              onClick={() => {
                setActiveView('supervisor');
                setMobileMenuOpen(false);
              }}
              className="w-full text-right py-2.5 px-3 rounded-xl font-semibold text-sm bg-amber-50 text-amber-800"
            >
              {currentUser.role === 'admin'
                ? language === 'ar' ? 'لوحة تحكم المدير' : 'Admin Console'
                : language === 'ar' ? 'مشرف العمليات' : 'Supervisor'}
            </button>
          )}

          {currentUser?.role === 'cleaner' && (
            <button
              onClick={() => {
                setActiveView('cleaner');
                setMobileMenuOpen(false);
              }}
              className="w-full text-right py-2.5 px-3 rounded-xl font-semibold text-sm bg-emerald-50 text-emerald-800"
            >
              {t('cleaner_portal')}
            </button>
          )}

          {customerAccount && (
            <button
              onClick={() => {
                setActiveView('profile');
                setMobileMenuOpen(false);
              }}
              className="w-full text-right py-2.5 px-3 rounded-xl font-semibold text-sm bg-slate-50 text-slate-800 flex items-center justify-between"
            >
              <span>{language === 'ar' ? 'الملف الشخصي والمحفظة' : 'Profile & Wallet'}</span>
              <span className="font-bold text-amber-600">{customerAccount.walletBalance} {t('aed')}</span>
            </button>
          )}
        </div>
      )}
    </header>
  );
};
