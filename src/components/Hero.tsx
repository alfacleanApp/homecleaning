/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  Sparkles,
  Calendar,
  Search,
  CheckCircle2,
  Clock,
  ShieldAlert,
  MapPin,
  Percent,
} from 'lucide-react';

export const Hero: React.FC = () => {
  const { language, brandSettings, setActiveView, setActiveTrackingRef } = useApp();
  const [quickTrackCode, setQuickTrackCode] = useState('');

  const handleQuickTrack = (e: React.FormEvent) => {
    e.preventDefault();
    if (quickTrackCode.trim()) {
      setActiveTrackingRef(quickTrackCode.trim().toUpperCase());
      setActiveView('tracking');
    }
  };

  return (
    <section className="relative overflow-hidden pt-8 pb-16 bg-gradient-to-b from-sky-50/60 via-slate-50 to-white">
      {/* Background soft decorative shapes */}
      <div className="absolute top-12 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 bg-gradient-to-tr from-sky-200/30 via-amber-100/20 to-transparent blur-3xl -z-10 pointer-events-none"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto space-y-6">
          {/* Tagline Pill */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-sky-200 shadow-xs text-sky-800 text-xs sm:text-sm font-bold">
            <span className="flex h-2 w-2 rounded-full bg-sky-500 animate-ping"></span>
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span>
              {language === 'ar'
                ? 'الخدمة الأولى المعتمدة لتنظيف المنازل بالساعة في أبوظبي'
                : 'The #1 Rated Hourly Home Cleaning in Abu Dhabi'}
            </span>
          </div>

          {/* Main Title */}
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-slate-900 tracking-tight leading-[1.15]">
            <span>{language === 'ar' ? 'منزل نظيف، منتعش، ومريح' : 'A Clean, Fresh & Sparkling Home'}</span>{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-600 via-sky-500 to-amber-500">
              {language === 'ar' ? 'بأيدي محترفات بالساعة' : 'With Hourly Cleaning Pros'}
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-base sm:text-lg text-slate-600 leading-relaxed font-normal">
            {language === 'ar'
              ? 'احجز عاملة نظافة منزلية مدربة ومعتمدة في غضون دقيقة واحدة. تغطية شاملة لجزيرة الريم، ياس، السعديات، وكافة مناطق إمارة أبوظبي بأسعار تبدأ من 35 درهم/ساعة.'
              : 'Book trained and certified home cleaners in less than a minute. Full coverage across Al Reem, Yas, Saadiyat, and all Abu Dhabi areas from 35 AED/hr.'}
          </p>

          {/* Action Row */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <button
              onClick={() => setActiveView('booking')}
              className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-sky-600 hover:bg-sky-700 text-white font-extrabold text-base shadow-lg shadow-sky-600/25 transition-all hover:scale-[1.02] flex items-center justify-center gap-2.5 cursor-pointer"
            >
              <Calendar className="w-5 h-5" />
              <span>{language === 'ar' ? 'احجز موعدك فوراً' : 'Book An Appointment'}</span>
            </button>

            {/* Quick Track Input form */}
            <form
              onSubmit={handleQuickTrack}
              className="w-full sm:w-auto flex items-center bg-white rounded-2xl border border-slate-300 p-1.5 shadow-sm focus-within:border-sky-500 focus-within:ring-2 focus-within:ring-sky-100 transition-all"
            >
              <input
                type="text"
                placeholder={language === 'ar' ? 'كود الطلب (مثل ALFA-9842)' : 'Order Code (e.g. ALFA-9842)'}
                value={quickTrackCode}
                onChange={(e) => setQuickTrackCode(e.target.value)}
                className="px-3 py-2 text-xs sm:text-sm bg-transparent outline-none text-slate-800 placeholder-slate-400 w-44 sm:w-48"
              />
              <button
                type="submit"
                aria-label="Track booking"
                className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Search className="w-3.5 h-3.5" />
                <span>{language === 'ar' ? 'تتبع' : 'Track'}</span>
              </button>
            </form>
          </div>

          {/* Quick value propositions */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-6 text-slate-700 text-xs sm:text-sm font-semibold">
            <div className="flex items-center justify-center gap-2 p-3 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
              <Clock className="w-4 h-4 text-sky-600 shrink-0" />
              <span>{language === 'ar' ? 'حجز فوري بالساعة' : 'Hourly Flexibility'}</span>
            </div>
            <div className="flex items-center justify-center gap-2 p-3 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
              <MapPin className="w-4 h-4 text-amber-500 shrink-0" />
              <span>{language === 'ar' ? 'تغطية أبوظبي الشاملة' : 'Abu Dhabi Wide'}</span>
            </div>
            <div className="flex items-center justify-center gap-2 p-3 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
              <Percent className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{language === 'ar' ? 'خصم 15% اشتراك' : '15% Subscription'}</span>
            </div>
            <div className="flex items-center justify-center gap-2 p-3 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
              <CheckCircle2 className="w-4 h-4 text-sky-600 shrink-0" />
              <span>{language === 'ar' ? 'دفع عند الاستلام' : 'Cash on Delivery'}</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
