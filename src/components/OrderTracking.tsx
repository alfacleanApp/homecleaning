/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { BookingStatus } from '../types';
import {
  Search,
  CheckCircle2,
  Clock,
  MapPin,
  Star,
  User,
  Phone,
  Calendar,
  AlertCircle,
  Radio,
  Send,
} from 'lucide-react';

export const OrderTracking: React.FC = () => {
  const {
    language,
    bookings,
    cleaners,
    activeTrackingRef,
    setActiveTrackingRef,
    submitBookingReview,
    setActiveView,
  } = useApp();

  const [inputRef, setInputRef] = useState<string>(activeTrackingRef || '');
  const [currentRef, setCurrentRef] = useState<string>(activeTrackingRef || 'ALFA-9842');

  // Review submission state
  const [rating, setRating] = useState<number>(5);
  const [reviewText, setReviewText] = useState<string>('');
  const [reviewSubmitted, setReviewSubmitted] = useState<boolean>(false);

  useEffect(() => {
    if (activeTrackingRef) {
      setInputRef(activeTrackingRef);
      setCurrentRef(activeTrackingRef);
    }
  }, [activeTrackingRef]);

  const booking = bookings.find(
    (b) => b.reference.toUpperCase() === currentRef.trim().toUpperCase()
  );

  const cleaner = booking ? cleaners.find((c) => c.id === booking.cleanerId) : null;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputRef.trim()) {
      setCurrentRef(inputRef.trim().toUpperCase());
      setActiveTrackingRef(inputRef.trim().toUpperCase());
      setReviewSubmitted(false);
    }
  };

  const handleReviewSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (booking && reviewText.trim()) {
      submitBookingReview(booking.id, rating, reviewText.trim());
      setReviewSubmitted(true);
    }
  };

  // Timeline steps
  const steps: { key: BookingStatus; labelAr: string; labelEn: string; descAr: string; descEn: string }[] = [
    {
      key: 'pending',
      labelAr: 'استلام الطلب',
      labelEn: 'Received',
      descAr: 'تم تسجيل الطلب في المنظومة',
      descEn: 'Registered in system',
    },
    {
      key: 'confirmed',
      labelAr: 'تأكيد الحجز وتعيين العاملة',
      labelEn: 'Confirmed',
      descAr: 'تم التنسيق وتثبيت الموعد',
      descEn: 'Cleaner scheduled',
    },
    {
      key: 'dispatched',
      labelAr: 'العاملة في الطريق إليك',
      labelEn: 'On The Way',
      descAr: 'المعدات معقمة وفي مسار الوصول',
      descEn: 'En route with equipment',
    },
    {
      key: 'in_progress',
      labelAr: 'الخدمة قيد التنفيذ الآن',
      labelEn: 'In Progress',
      descAr: 'جاري تنظيف وتعقيم المنزل بالساعة',
      descEn: 'Cleaning in progress',
    },
    {
      key: 'completed',
      labelAr: 'اكتمال الخدمة والاعتماد',
      labelEn: 'Completed',
      descAr: 'تم الانتهاء والتحقق من الجودة',
      descEn: 'Service finished & approved',
    },
  ];

  const getStepStatus = (stepKey: BookingStatus) => {
    if (!booking) return 'pending';
    const order: BookingStatus[] = ['pending', 'confirmed', 'dispatched', 'in_progress', 'completed'];
    const currentIdx = order.indexOf(booking.status);
    const stepIdx = order.indexOf(stepKey);

    if (booking.status === 'cancelled') return 'cancelled';
    if (stepIdx < currentIdx) return 'done';
    if (stepIdx === currentIdx) return 'current';
    return 'upcoming';
  };

  return (
    <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto space-y-6">
      {/* Search Header */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 flex items-center gap-2">
              <Radio className="w-5 h-5 text-sky-600 animate-pulse" />
              <span>{language === 'ar' ? 'التتبع الحي والمباشر للحجز' : 'Live Booking & Cleaner Tracker'}</span>
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              {language === 'ar'
                ? 'أدخل كود الحجز لمتابعة خط سير العاملة ومراحل التنظيف لحظة بلحظة'
                : 'Enter booking code to monitor cleaning milestones and cleaner status live'}
            </p>
          </div>

          {/* Search Bar */}
          <form onSubmit={handleSearch} className="flex items-center gap-2">
            <input
              type="text"
              value={inputRef}
              onChange={(e) => setInputRef(e.target.value)}
              placeholder="e.g. ALFA-9842"
              className="px-4 py-2.5 rounded-2xl border border-slate-300 font-mono font-bold text-sm uppercase outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
            />
            <button
              type="submit"
              className="px-5 py-2.5 rounded-2xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-sm shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Search className="w-4 h-4" />
              <span>{language === 'ar' ? 'بحث' : 'Search'}</span>
            </button>
          </form>
        </div>
      </div>

      {booking ? (
        <div className="space-y-6">
          {/* Status Banner */}
          <div
            className={`p-6 rounded-3xl border shadow-sm transition-all ${
              booking.status === 'in_progress'
                ? 'bg-gradient-to-r from-red-500 via-rose-600 to-red-600 text-white border-red-400 animate-pulse'
                : booking.status === 'completed'
                ? 'bg-emerald-50 text-emerald-950 border-emerald-200'
                : 'bg-sky-50 text-sky-950 border-sky-200'
            }`}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <span className="text-xs font-bold uppercase tracking-wider opacity-90">
                  {language === 'ar' ? 'الحالة الحالية للطلب:' : 'Current Status:'}
                </span>
                <div className="text-2xl font-black flex items-center gap-2">
                  {booking.status === 'in_progress' && (
                    <span className="inline-block w-3 h-3 rounded-full bg-yellow-300 animate-ping"></span>
                  )}
                  <span>
                    {booking.status === 'in_progress'
                      ? (language === 'ar' ? 'قيد التنفيذ الآن داخل منزلك' : 'Cleaning In-Progress Right Now')
                      : booking.status === 'completed'
                      ? (language === 'ar' ? 'اكتملت الخدمة بنجاح' : 'Service Completed')
                      : booking.status === 'dispatched'
                      ? (language === 'ar' ? 'العاملة في الطريق إليك' : 'Cleaner Dispatched & En Route')
                      : (language === 'ar' ? 'حجز مؤكد وبانتظار الموعد' : 'Confirmed & Scheduled')}
                  </span>
                </div>
              </div>

              <div className="text-right">
                <span className="text-xs opacity-80 block">
                  {language === 'ar' ? 'رقم مرجع الحجز' : 'Booking Ref'}
                </span>
                <span className="text-2xl font-black font-mono tracking-wider">
                  #{booking.reference}
                </span>
              </div>
            </div>
          </div>

          {/* Interactive Visual Timeline */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm space-y-6">
            <h3 className="text-base font-black text-slate-900 border-b border-slate-100 pb-3">
              {language === 'ar' ? 'المراحل والخط الزمني المباشر:' : 'Live Stages & Milestones:'}
            </h3>

            <div className="relative">
              <div className="space-y-6">
                {steps.map((st, idx) => {
                  const state = getStepStatus(st.key);
                  const isDone = state === 'done';
                  const isCurrent = state === 'current';

                  return (
                    <div key={st.key} className="flex items-start gap-4">
                      {/* Node Icon */}
                      <div className="relative flex flex-col items-center">
                        <div
                          className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold text-sm transition-all ${
                            isDone
                              ? 'bg-emerald-600 text-white shadow-sm'
                              : isCurrent
                              ? 'bg-sky-600 text-white ring-4 ring-sky-100 shadow-md scale-105'
                              : 'bg-slate-100 text-slate-400 border border-slate-200'
                          }`}
                        >
                          {isDone ? <CheckCircle2 className="w-5 h-5" /> : idx + 1}
                        </div>
                        {idx < steps.length - 1 && (
                          <div
                            className={`w-0.5 h-10 mt-2 ${
                              isDone ? 'bg-emerald-500' : 'bg-slate-200'
                            }`}
                          />
                        )}
                      </div>

                      {/* Content */}
                      <div className="pt-1.5 flex-1">
                        <div className="flex items-center justify-between">
                          <h4
                            className={`text-sm font-black ${
                              isCurrent ? 'text-sky-700' : isDone ? 'text-slate-800' : 'text-slate-400'
                            }`}
                          >
                            {language === 'ar' ? st.labelAr : st.labelEn}
                          </h4>
                          {isCurrent && (
                            <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-sky-100 text-sky-800 animate-pulse">
                              {language === 'ar' ? 'المرحلة النشطة' : 'Active'}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {language === 'ar' ? st.descAr : st.descEn}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Cleaner Card & Booking Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Cleaner Info */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-4">
              <h3 className="text-sm font-black text-slate-900 border-b border-slate-100 pb-2 flex items-center gap-2">
                <User className="w-4 h-4 text-sky-600" />
                <span>{language === 'ar' ? 'العاملة المعتمدة للزيارة:' : 'Assigned Cleaner:'}</span>
              </h3>

              {cleaner ? (
                <div className="flex items-center gap-4">
                  <img
                    src={cleaner.avatarUrl}
                    alt={cleaner.name}
                    className="w-16 h-16 rounded-2xl object-cover border border-slate-200 shadow-xs"
                  />
                  <div className="space-y-1">
                    <h4 className="text-base font-black text-slate-900">{cleaner.name}</h4>
                    <p className="text-xs text-slate-500">
                      {cleaner.nationality} • {cleaner.completedJobs} {language === 'ar' ? 'طلب منجز' : 'completed jobs'}
                    </p>
                    <div className="flex items-center gap-2 pt-1">
                      <span className="flex items-center gap-1 text-xs font-bold text-amber-500 bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-200">
                        <Star className="w-3.5 h-3.5 fill-amber-500" />
                        <span>{cleaner.rating} / 5</span>
                      </span>
                      <a
                        href={`tel:${cleaner.phone}`}
                        className="flex items-center gap-1 text-xs font-bold text-sky-700 bg-sky-50 px-2 py-0.5 rounded-lg border border-sky-200 hover:bg-sky-100 transition-colors"
                      >
                        <Phone className="w-3 h-3" />
                        <span>{cleaner.phone}</span>
                      </a>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-slate-500">{booking.cleanerName}</p>
              )}

              {booking.cleanerNotes && (
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-700">
                  <strong className="block mb-1 text-slate-900">{language === 'ar' ? 'ملاحظة العاملة:' : 'Cleaner Note:'}</strong>
                  {booking.cleanerNotes}
                </div>
              )}
            </div>

            {/* Visit Details & Location */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-4">
              <h3 className="text-sm font-black text-slate-900 border-b border-slate-100 pb-2 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-sky-600" />
                <span>{language === 'ar' ? 'تفاصيل الموعد والموقع:' : 'Appointment & Location:'}</span>
              </h3>

              <div className="space-y-2.5 text-xs text-slate-700">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">{language === 'ar' ? 'التاريخ والوقت:' : 'Date & Time:'}</span>
                  <span className="font-bold text-slate-900">
                    {booking.date} | {booking.startTime} - {booking.endTime} ({booking.hours} {language === 'ar' ? 'ساعات' : 'hrs'})
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-500">{language === 'ar' ? 'المنطقة:' : 'Area:'}</span>
                  <span className="font-bold text-sky-700">
                    {booking.address.areaName} ({booking.travelFee > 0 ? `+${booking.travelFee} د.إ انتقال` : 'انتقال مجاني'})
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-500">{language === 'ar' ? 'العنوان:' : 'Address:'}</span>
                  <span className="font-medium text-slate-800 text-right">
                    {booking.address.building}، {booking.address.apartment}، {booking.address.street}
                  </span>
                </div>

                <div className="flex items-center justify-between border-t border-slate-100 pt-2 text-sm font-bold">
                  <span>{language === 'ar' ? 'إجمالي الفاتورة:' : 'Total Invoice:'}</span>
                  <span className="text-sky-600 font-black">
                    {booking.total} {language === 'ar' ? 'د.إ' : 'AED'} ({booking.paymentMethod === 'cash' ? 'نقداً للعاملة' : booking.paymentMethod})
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Rating & Review Section (if completed or reviewing) */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm space-y-4">
            <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
              <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
              <span>{language === 'ar' ? 'تقييم الخدمة ورأي العميل' : 'Rate Your Experience & Review'}</span>
            </h3>

            {booking.rating ? (
              <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`w-4 h-4 ${
                          star <= (booking.rating || 5)
                            ? 'text-amber-500 fill-amber-500'
                            : 'text-slate-300'
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-xs text-slate-500">{booking.reviewDate}</span>
                </div>
                <p className="text-sm font-medium text-slate-800 italic">
                  "{booking.reviewText}"
                </p>
              </div>
            ) : reviewSubmitted ? (
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 font-bold text-sm flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <span>{language === 'ar' ? 'شكراً لك! تم استلام تقييمك وحفظه بنجاح.' : 'Thank you! Your review has been saved.'}</span>
              </div>
            ) : (
              <form onSubmit={handleReviewSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-2">
                    {language === 'ar' ? 'ما هو تقييمك لجودة النظافة والتعامل؟' : 'How was the cleaning quality?'}
                  </label>
                  <div className="flex items-center gap-2">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setRating(s)}
                        className="p-1 cursor-pointer transition-transform hover:scale-110"
                      >
                        <Star
                          className={`w-7 h-7 ${
                            s <= rating ? 'text-amber-500 fill-amber-500' : 'text-slate-300'
                          }`}
                        />
                      </button>
                    ))}
                    <span className="text-xs font-bold text-slate-600 mr-2">
                      ({rating} / 5 {language === 'ar' ? 'نجوم' : 'stars'})
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {language === 'ar' ? 'ملاحظاتك ومقترحاتك لتعزيز الجودة:' : 'Your comments and feedback:'}
                  </label>
                  <textarea
                    rows={3}
                    required
                    placeholder={language === 'ar' ? 'شاركنا تجربتك مع العاملة...' : 'Share your feedback...'}
                    value={reviewText}
                    onChange={(e) => setReviewText(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-2xl border border-slate-300 text-sm focus:border-sky-500 outline-none"
                  />
                </div>

                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs sm:text-sm shadow-xs flex items-center gap-2 transition-colors cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                  <span>{language === 'ar' ? 'إرسال التقييم' : 'Submit Review'}</span>
                </button>
              </form>
            )}
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-200/80 shadow-sm space-y-4">
          <AlertCircle className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="text-lg font-black text-slate-800">
            {language === 'ar' ? 'لم يتم العثور على حجز بهذا الكود' : 'No Booking Found with this code'}
          </h3>
          <p className="text-xs sm:text-sm text-slate-500 max-w-sm mx-auto">
            {language === 'ar'
              ? 'تأكد من كتابة الكود بشكل صحيح (مثل ALFA-9842 أو ALFA-9021)، أو قم بحجز موعد جديد الآن.'
              : 'Please check your booking reference code or create a new booking.'}
          </p>
          <button
            onClick={() => setActiveView('booking')}
            className="px-6 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs sm:text-sm"
          >
            {language === 'ar' ? 'احجز موعدك الآن' : 'Book Now'}
          </button>
        </div>
      )}
    </div>
  );
};
