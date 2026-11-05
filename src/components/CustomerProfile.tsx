/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  CreditCard,
  Award,
  MapPin,
  Clock,
  CheckCircle,
  AlertCircle,
  Plus,
  ArrowRight,
  Sparkles,
  Calendar,
} from 'lucide-react';

export const CustomerProfile: React.FC = () => {
  const {
    language,
    currentUser,
    customers,
    rewardsPolicy,
    adjustCustomerWallet,
    bookings,
    setActiveView,
    setActiveTrackingRef,
  } = useApp();

  const customer = customers.find(
    (c) => c.id === currentUser?.customerId || c.email === currentUser?.email
  ) || customers[0];

  const customerBookings = bookings.filter(
    (b) => b.customerId === customer.id || b.customerPhone === customer.phone
  );

  const [pointsToRedeem, setPointsToRedeem] = useState<number>(100);
  const [redemptionSuccess, setRedemptionSuccess] = useState<string>('');

  const handleRedeemPoints = () => {
    if (customer.points >= pointsToRedeem && pointsToRedeem > 0) {
      const aedCash = Math.round(pointsToRedeem * rewardsPolicy.redemptionRate);
      adjustCustomerWallet(
        customer.id,
        aedCash,
        `استبدال ${pointsToRedeem} نقطة مكافأة إلى رصيد بالمحفظة (+${aedCash} د.إ)`
      );
      // deduct points
      customer.points -= pointsToRedeem;
      setRedemptionSuccess(
        language === 'ar'
          ? `تم استبدال ${pointsToRedeem} نقطة بنجاح وإضافة ${aedCash} درهم إلى محفظتك!`
          : `Successfully converted ${pointsToRedeem} points into ${aedCash} AED!`
      );
      setTimeout(() => setRedemptionSuccess(''), 4000);
    }
  };

  return (
    <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto space-y-6">
      {/* Customer Header */}
      <div className="bg-gradient-to-r from-sky-800 via-sky-700 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-lg border border-sky-600/40">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            {customer.avatarUrl ? (
              <img
                src={customer.avatarUrl}
                alt={customer.name}
                className="w-16 h-16 rounded-2xl object-cover border-2 border-white/30 shadow-md shrink-0"
              />
            ) : (
              <div className="w-16 h-16 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center text-2xl font-bold shrink-0">
                👤
              </div>
            )}
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-bold border border-amber-400/30 mb-1">
                <Sparkles className="w-3.5 h-3.5" />
                <span>{language === 'ar' ? 'ملف العميل المعتمد' : 'Verified Customer Profile'}</span>
              </div>
              <h1 className="text-2xl font-black">{customer.name}</h1>
              <p className="text-xs text-sky-200 mt-0.5">
                {customer.phone ? `${customer.phone} • ` : ''}{customer.email}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setActiveView('booking')}
              className="px-5 py-2.5 rounded-2xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs sm:text-sm shadow-md transition-all cursor-pointer"
            >
              {language === 'ar' ? 'حجز موعد جديد' : 'New Booking'}
            </button>
          </div>
        </div>
      </div>

      {/* Wallet & Rewards Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {/* Wallet Balance Card */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-sky-600" />
              <h3 className="text-base font-black text-slate-900">
                {language === 'ar' ? 'محفظة ألفا كلين الذكية' : 'Smart Wallet'}
              </h3>
            </div>
            <span className="text-xs font-bold text-sky-700 bg-sky-50 px-2.5 py-1 rounded-lg">
              {language === 'ar' ? 'درهم إماراتي' : 'AED'}
            </span>
          </div>

          <div>
            <span className="text-xs text-slate-500 block mb-1">
              {language === 'ar' ? 'الرصيد المتاح للاستخدام الفوري:' : 'Available Balance:'}
            </span>
            <div className="text-3xl font-black text-sky-700">
              {customer.walletBalance} <span className="text-lg font-bold text-slate-600">د.إ</span>
            </div>
          </div>

          {customer.pendingRewardBonus > 0 && (
            <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900">
              <strong>{language === 'ar' ? 'رصيد ترحيبي معلق:' : 'Pending Welcome Bonus:'}</strong>{' '}
              {customer.pendingRewardBonus} د.إ (بانتظار اعتماد المشرف)
            </div>
          )}

          <p className="text-[11px] text-slate-500">
            {language === 'ar'
              ? 'يُخصم الرصيد تلقائياً من إجمالي فواتير الحجز القادمة دون أي شروط معقدة.'
              : 'Deducted automatically from your upcoming booking invoices.'}
          </p>
        </div>

        {/* Points & Redemption Card */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <Award className="w-5 h-5 text-amber-500" />
              <h3 className="text-base font-black text-slate-900">
                {language === 'ar' ? 'نقاط المكافأة والاستبدال' : 'Rewards Points & Cash Out'}
              </h3>
            </div>
            <span className="text-xs font-bold text-amber-600 bg-amber-50 px-2.5 py-1 rounded-lg">
              {rewardsPolicy.pointsPerAed} {language === 'ar' ? 'نقطة/درهم' : 'pt/AED'}
            </span>
          </div>

          <div>
            <span className="text-xs text-slate-500 block mb-1">
              {language === 'ar' ? 'رصيدك الحالي من النقاط:' : 'Current Points:'}
            </span>
            <div className="text-3xl font-black text-amber-500">
              {customer.points} <span className="text-lg font-bold text-slate-600">{language === 'ar' ? 'نقطة' : 'pts'}</span>
            </div>
          </div>

          {/* Quick Redeem */}
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-700">
                {language === 'ar' ? 'تحويل 100 نقطة إلى 10 د.إ:' : 'Convert 100 pts to 10 AED:'}
              </span>
              <button
                type="button"
                disabled={customer.points < 100}
                onClick={handleRedeemPoints}
                className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-colors ${
                  customer.points >= 100
                    ? 'bg-amber-500 hover:bg-amber-600 text-slate-950 cursor-pointer shadow-xs'
                    : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                }`}
              >
                {language === 'ar' ? 'تحويل للمحفظة فوراً' : 'Redeem to Wallet'}
              </button>
            </div>

            {redemptionSuccess && (
              <p className="text-[11px] text-emerald-700 font-bold flex items-center gap-1">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                <span>{redemptionSuccess}</span>
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Saved Addresses */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm space-y-4">
        <h3 className="text-base font-black text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
          <MapPin className="w-4 h-4 text-sky-600" />
          <span>{language === 'ar' ? 'العناوين المحفوظة في أبوظبي:' : 'Saved Abu Dhabi Addresses:'}</span>
        </h3>

        {customer.savedAddresses.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {customer.savedAddresses.map((addr) => (
              <div key={addr.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                <span className="text-xs font-black text-sky-800 block">{addr.label}</span>
                <p className="text-xs font-bold text-slate-800">{addr.areaName}</p>
                <p className="text-[11px] text-slate-500">
                  {addr.building}، {addr.apartment}، {addr.street}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-slate-400">
            {language === 'ar' ? 'لا توجد عناوين محفوظة حالياً.' : 'No saved addresses yet.'}
          </p>
        )}
      </div>

      {/* Bookings History */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm space-y-4">
        <h3 className="text-base font-black text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
          <Calendar className="w-4 h-4 text-sky-600" />
          <span>{language === 'ar' ? 'سجل الحجوزات والطلبات السابقة:' : 'Booking History:'}</span>
        </h3>

        {customerBookings.length > 0 ? (
          <div className="space-y-3">
            {customerBookings.map((b) => (
              <div
                key={b.id}
                className="p-4 rounded-2xl border border-slate-200 hover:border-sky-300 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-xs text-sky-700 bg-sky-50 px-2 py-0.5 rounded-lg">
                      #{b.reference}
                    </span>
                    <span className="text-xs font-bold text-slate-900">{b.date} ({b.startTime} - {b.endTime})</span>
                  </div>
                  <p className="text-xs text-slate-500">
                    {b.serviceType} • {b.cleanerName} • {b.address.areaName}
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-sm font-black text-slate-800">{b.total} د.إ</span>
                  <button
                    onClick={() => {
                      setActiveTrackingRef(b.reference);
                      setActiveView('tracking');
                    }}
                    className="px-3.5 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs shadow-xs transition-colors"
                  >
                    {language === 'ar' ? 'تتبع' : 'Track'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-slate-400">
            {language === 'ar' ? 'لا توجد حجوزات سابقة.' : 'No bookings yet.'}
          </p>
        )}
      </div>

      {/* Activity Log */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm space-y-4">
        <h3 className="text-base font-black text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
          <Clock className="w-4 h-4 text-sky-600" />
          <span>{language === 'ar' ? 'سجل حركات المحفظة والمكافآت:' : 'Wallet & Activity History:'}</span>
        </h3>

        <div className="space-y-2">
          {customer.activityLog.map((act) => (
            <div key={act.id} className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between text-xs">
              <div>
                <span className="text-slate-800 font-medium block">{act.description}</span>
                <span className="text-[10px] text-slate-400 font-mono">{act.timestamp}</span>
              </div>
              {act.amount !== undefined && (
                <span className="font-bold text-sky-700">
                  {act.amount} {act.type.includes('points') ? 'نقطة' : 'د.إ'}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
