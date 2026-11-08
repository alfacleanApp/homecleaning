/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useApp } from '../context/AppContext';
import {
  Sparkles,
  Phone,
  Mail,
  Building,
  ShieldCheck,
  Clock,
} from 'lucide-react';

export const Footer: React.FC = () => {
  const { language, brandSettings, setActiveView } = useApp();

  return (
    <footer className="bg-slate-900 text-slate-300 pt-16 pb-12 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Brand info */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-white p-1 flex items-center justify-center shrink-0">
                <img
                  src={brandSettings.logoUrl}
                  alt="Alfa Clean"
                  className="w-full h-full object-contain"
                />
              </div>
              <div>
                <span className="text-lg font-black text-white block">
                  {language === 'ar' ? brandSettings.companyNameAr : brandSettings.companyNameEn}
                </span>
                <span className="text-xs text-amber-400 font-bold">
                  {language === 'ar' ? 'أبوظبي - الإمارات العربية المتحدة' : 'Abu Dhabi, UAE'}
                </span>
              </div>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              {language === 'ar'
                ? 'المنظومة الأولى المعتمدة لخدمات تنظيف المنازل بالساعة في إمارة أبوظبي. حجز فوري، طاقم عمل معتمد، وتتبع حي مباشر.'
                : 'The #1 verified hourly home cleaning management system in Abu Dhabi. Instant booking and live tracking.'}
            </p>
          </div>

          {/* Quick Links */}
          <div className="space-y-3">
            <h4 className="text-sm font-black text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-sky-400" />
              <span>{language === 'ar' ? 'روابط سريعة' : 'Quick Navigation'}</span>
            </h4>
            <ul className="text-xs space-y-2">
              <li>
                <button
                  onClick={() => setActiveView('booking')}
                  className="hover:text-white transition-colors"
                >
                  {language === 'ar' ? 'احجز خدمة تنظيف بالساعة' : 'Book Hourly Cleaning'}
                </button>
              </li>
              <li>
                <button
                  onClick={() => setActiveView('tracking')}
                  className="hover:text-white transition-colors"
                >
                  {language === 'ar' ? 'تتبع حالة طلبك المباشر' : 'Live Order Tracking'}
                </button>
              </li>
              <li>
                <button
                  onClick={() => setActiveView('profile')}
                  className="hover:text-white transition-colors"
                >
                  {language === 'ar' ? 'المحفظة واستبدال النقاط' : 'Wallet & Points Rewards'}
                </button>
              </li>
              <li>
                <a
                  href="/prd.html"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-amber-400 transition-colors flex items-center gap-1.5 pt-1 text-slate-400 hover:text-amber-300 font-semibold"
                >
                  <span>📄</span>
                  <span>{language === 'ar' ? 'وثيقة متطلبات المنتج (PRD)' : 'Product Requirements (PRD)'}</span>
                </a>
              </li>
            </ul>
          </div>

          {/* Contact & ADIB details */}
          <div className="space-y-3 text-xs">
            <h4 className="text-sm font-black text-white flex items-center gap-2">
              <Building className="w-4 h-4 text-amber-400" />
              <span>{language === 'ar' ? 'التواصل والحساب البنكي' : 'Contact & Corporate Bank'}</span>
            </h4>
            <div className="space-y-1.5 text-slate-400">
              <p className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-sky-400" />
                <span>{brandSettings.phone}</span>
              </p>
              <p className="flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 text-sky-400" />
                <span>{brandSettings.email}</span>
              </p>
              <p className="text-[11px] leading-relaxed pt-1">
                {brandSettings.addressAr}
              </p>
              <div className="p-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-[11px] space-y-0.5 mt-2">
                <span className="text-amber-400 font-bold block">{brandSettings.bankName}</span>
                <span className="font-mono text-[10px] text-slate-300 block">{brandSettings.bankIban}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom copyright */}
        <div className="pt-8 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
          <p>
            © {new Date().getFullYear()} {brandSettings.companyNameAr}. {language === 'ar' ? 'كافة الحقوق محفوظة.' : 'All rights reserved.'}
            <span className="text-slate-600 mx-2">|</span>
            <span className="text-slate-400 font-medium">
              {language === 'ar' ? 'تطوير وتنفيذ: شركة سفير (Safeer)' : 'Developed by Safeer Marketing & Business'}
            </span>
          </p>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1 text-slate-400">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>{language === 'ar' ? 'مرخص ومعتمد في إمارة أبوظبي' : 'Licensed in Abu Dhabi, UAE'}</span>
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
};
