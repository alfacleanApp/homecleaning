/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import {
  BookingFrequency,
  PaymentMethod,
} from '../types';
import {
  calculateEndTime,
  isPastDate,
  getTodayDateString,
  getAvailableCleaners,
  suggestAlternativeSlots,
  calculatePricing,
  ADD_ON_PRICES,
} from '../utils/dispatchEngine';
import {
  Clock,
  Calendar as CalendarIcon,
  MapPin,
  CreditCard,
  CheckCircle,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Building,
  User,
  Phone,
  Mail,
  Copy,
  Check,
  Sparkles,
} from 'lucide-react';

export const BookingWizard: React.FC = () => {
  const {
    language,
    brandSettings,
    serviceAreas,
    cleaners,
    bookings,
    currentUser,
    customers,
    createBooking,
    setActiveView,
    setActiveTrackingRef,
  } = useApp();

  const todayStr = useMemo(() => getTodayDateString(), []);

  // Wizard state
  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5>(1);
  const [hours, setHours] = useState<number>(3);
  const [frequency, setFrequency] = useState<BookingFrequency>('once');
  const [selectedAddOns, setSelectedAddOns] = useState<string[]>(['cleaning_materials']);

  // Step 2 state
  const [date, setDate] = useState<string>(todayStr);
  const [startTime, setStartTime] = useState<string>('10:00');
  const [selectedCleanerId, setSelectedCleanerId] = useState<string>('auto'); // 'auto' or specific cleaner id
  const [dateError, setDateError] = useState<string>('');

  // Step 3 state
  const [selectedAreaId, setSelectedAreaId] = useState<string>(serviceAreas[0]?.id || 'reem');
  const [street, setStreet] = useState<string>('');
  const [building, setBuilding] = useState<string>('');
  const [apartment, setApartment] = useState<string>('');
  const [notes, setNotes] = useState<string>('');

  // Contact info
  const customerAccount = currentUser?.customerId
    ? customers.find(c => c.id === currentUser.customerId)
    : null;

  const [customerName, setCustomerName] = useState<string>(currentUser?.name || '');
  const [customerPhone, setCustomerPhone] = useState<string>(currentUser?.phone || '');
  const [customerEmail, setCustomerEmail] = useState<string>(currentUser?.email || '');
  const [isGuest, setIsGuest] = useState<boolean>(!currentUser);

  React.useEffect(() => {
    if (currentUser) {
      if (currentUser.name) setCustomerName(currentUser.name);
      if (currentUser.email) setCustomerEmail(currentUser.email);
      if (currentUser.phone) setCustomerPhone(currentUser.phone);
      setIsGuest(false);
    }
  }, [currentUser]);

  // Step 4 state
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [useWallet, setUseWallet] = useState<boolean>(false);
  const [copiedIban, setCopiedIban] = useState<boolean>(false);
  const [submissionError, setSubmissionError] = useState<string>('');
  const [completedBookingRef, setCompletedBookingRef] = useState<string>('');

  // Derived current area
  const currentArea = useMemo(
    () => serviceAreas.find(a => a.id === selectedAreaId) || serviceAreas[0],
    [serviceAreas, selectedAreaId]
  );

  // Calculate pricing breakdown
  const pricing = useMemo(() => {
    const walletBalance = customerAccount?.walletBalance || 0;
    const walletToUse = useWallet ? walletBalance : 0;
    return calculatePricing({
      hours,
      baseRate: brandSettings.hourlyBaseRate || 35,
      addOns: selectedAddOns,
      frequency,
      area: currentArea,
      walletBalanceToUse: walletToUse,
    });
  }, [hours, brandSettings.hourlyBaseRate, selectedAddOns, frequency, currentArea, useWallet, customerAccount]);

  // Derived end time
  const calculatedEndTime = useMemo(() => {
    return calculateEndTime(startTime, hours);
  }, [startTime, hours]);

  // Check available cleaners for this time slot
  const availableCleaners = useMemo(() => {
    if (!date || isPastDate(date)) return [];
    return getAvailableCleaners(cleaners, date, startTime, calculatedEndTime, bookings);
  }, [cleaners, date, startTime, calculatedEndTime, bookings]);

  // Suggest alternative slots if none available
  const alternativeSlots = useMemo(() => {
    if (availableCleaners.length > 0 || !date || isPastDate(date)) return [];
    return suggestAlternativeSlots(cleaners, date, hours, bookings);
  }, [availableCleaners, cleaners, date, hours, bookings]);

  // Step validation
  const validateStep1 = () => hours >= 2;

  const validateStep2 = () => {
    if (isPastDate(date)) {
      setDateError(language === 'ar' ? 'لا يمكن اختيار تاريخ في الماضي. يرجى اختيار تاريخ اليوم أو موعد قادم.' : 'Cannot select a past date.');
      return false;
    }
    setDateError('');
    if (availableCleaners.length === 0) {
      return false;
    }
    return true;
  };

  const validateStep3 = () => {
    if (!currentArea) return false;
    if (!street.trim() || !building.trim() || !apartment.trim()) {
      return false;
    }
    if (!customerName.trim() || !customerPhone.trim()) {
      return false;
    }
    return true;
  };

  const handleNext = () => {
    if (step === 1) {
      if (validateStep1()) setStep(2);
    } else if (step === 2) {
      if (validateStep2()) setStep(3);
    } else if (step === 3) {
      if (validateStep3()) setStep(4);
    }
  };

  const handleCopyIban = () => {
    navigator.clipboard.writeText(brandSettings.bankIban);
    setCopiedIban(true);
    setTimeout(() => setCopiedIban(false), 2000);
  };

  const handleConfirmBooking = () => {
    setSubmissionError('');

    // Determine cleaner
    let chosenCleaner = availableCleaners[0];
    if (selectedCleanerId !== 'auto') {
      const match = availableCleaners.find(c => c.id === selectedCleanerId);
      if (match) chosenCleaner = match;
    }

    if (!chosenCleaner && availableCleaners.length > 0) {
      chosenCleaner = availableCleaners[0];
    }

    if (!chosenCleaner) {
      setSubmissionError(language === 'ar' ? 'عفواً، لا توجد عاملة متاحة في هذا الموعد.' : 'No cleaner available.');
      return;
    }

    const result = createBooking({
      customerId: currentUser?.customerId || `guest-${Date.now()}`,
      customerName: customerName.trim(),
      customerPhone: customerPhone.trim(),
      customerEmail: customerEmail.trim() || 'info@alfaclean-guest.ae',
      isGuest: !currentUser || isGuest,
      date,
      startTime,
      endTime: calculatedEndTime,
      hours,
      cleanerId: chosenCleaner.id,
      cleanerName: chosenCleaner.name,
      serviceType: language === 'ar' ? 'تنظيف شامل للمنزل بالساعة' : 'Comprehensive Hourly Home Cleaning',
      frequency,
      addOns: selectedAddOns,
      address: {
        areaId: currentArea.id,
        areaName: currentArea.nameAr,
        areaNameEn: currentArea.nameEn,
        street: street.trim(),
        building: building.trim(),
        apartment: apartment.trim(),
        notes: notes.trim(),
      },
      subtotal: pricing.subtotal,
      travelFee: pricing.travelFee,
      discount: pricing.frequencyDiscount + pricing.walletUsed,
      discountSource: pricing.frequencyDiscount > 0 ? `خصم اشتراك (${pricing.frequencyPercent}%)` : undefined,
      total: pricing.total,
      paymentMethod,
      paymentStatus: paymentMethod === 'card' ? 'paid' : 'pending',
      status: 'confirmed',
    });

    if (!result.success) {
      setSubmissionError(result.error || 'Failed to create booking');
      return;
    }

    if (result.booking) {
      setCompletedBookingRef(result.booking.reference);
      setStep(5); // Success step
    }
  };

  return (
    <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto" id="booking-section">
      {/* Wizard Header Progress */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm mb-6">
        <div className="flex items-center justify-between mb-6 pb-6 border-b border-slate-100">
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900">
              {language === 'ar' ? 'معالج الحجز الفوري بالساعة' : 'Hourly Booking Wizard'}
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              {language === 'ar'
                ? 'حدد احتياجك وموعدك وموقعك في أبوظبي خلال 4 خطوات بسيطة'
                : 'Select hours, date, and Abu Dhabi location in 4 simple steps'}
            </p>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-sky-50 text-sky-700 font-bold text-xs">
            <span>{brandSettings.hourlyBaseRate} {language === 'ar' ? 'درهم / ساعة' : 'AED / hr'}</span>
          </div>
        </div>

        {/* Step Indicator */}
        <div className="grid grid-cols-4 gap-2">
          {[
            { num: 1, labelAr: 'المدة والخدمات', labelEn: 'Duration' },
            { num: 2, labelAr: 'التاريخ والموعد', labelEn: 'Date & Time' },
            { num: 3, labelAr: 'الموقع والمنطقة', labelEn: 'Address' },
            { num: 4, labelAr: 'الفاتورة والدفع', labelEn: 'Payment' },
          ].map((s) => {
            const isActive = step === s.num;
            const isDone = step > s.num;
            return (
              <div
                key={s.num}
                className={`p-3 rounded-2xl border text-center transition-all ${
                  isActive
                    ? 'border-sky-500 bg-sky-50/70 text-sky-900 ring-2 ring-sky-200'
                    : isDone
                    ? 'border-emerald-300 bg-emerald-50/50 text-emerald-800'
                    : 'border-slate-200 bg-slate-50/50 text-slate-400'
                }`}
              >
                <div className="flex items-center justify-center gap-1.5 text-xs font-black mb-1">
                  {isDone ? (
                    <CheckCircle className="w-4 h-4 text-emerald-600 inline" />
                  ) : (
                    <span className="w-4 h-4 rounded-full bg-current/20 flex items-center justify-center text-[10px]">
                      {s.num}
                    </span>
                  )}
                  <span className="hidden sm:inline">
                    {language === 'ar' ? `الخطوة ${s.num}` : `Step ${s.num}`}
                  </span>
                </div>
                <div className="text-[11px] sm:text-xs font-bold truncate">
                  {language === 'ar' ? s.labelAr : s.labelEn}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Step Content */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm space-y-6">
        {/* STEP 1: Duration & Frequency & Add-ons */}
        {step === 1 && (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-black text-slate-800 mb-2">
                {language === 'ar' ? '1. عدد ساعات التنظيف المطلوبة:' : '1. Required Cleaning Hours:'}
              </label>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2.5">
                {[2, 3, 4, 5, 6, 8].map((h) => (
                  <button
                    key={h}
                    type="button"
                    onClick={() => setHours(h)}
                    className={`py-3.5 px-3 rounded-2xl border font-black text-center transition-all ${
                      hours === h
                        ? 'border-sky-600 bg-sky-600 text-white shadow-md shadow-sky-600/20 scale-[1.02]'
                        : 'border-slate-200 bg-white hover:border-sky-300 text-slate-700'
                    }`}
                  >
                    <div className="text-lg">{h}</div>
                    <div className="text-[10px] opacity-80">{language === 'ar' ? 'ساعات' : 'Hours'}</div>
                    {h === 3 && (
                      <span className="inline-block mt-1 text-[9px] px-1.5 py-0.5 rounded-full bg-amber-400 text-slate-900 font-bold">
                        {language === 'ar' ? 'الأكثر طلباً' : 'Popular'}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Frequency selection */}
            <div>
              <label className="block text-sm font-black text-slate-800 mb-2">
                {language === 'ar' ? '2. تكرار الخدمة والاشتراك الدوري (وفر حتى 15%):' : '2. Frequency & Subscriptions (Save up to 15%):'}
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                {[
                  { id: 'once', nameAr: 'مرة واحدة', nameEn: 'One-time', discount: '' },
                  { id: 'weekly', nameAr: 'أسبوعياً', nameEn: 'Weekly', discount: 'خصم 15%' },
                  { id: 'biweekly', nameAr: 'كل أسبوعين', nameEn: 'Bi-weekly', discount: 'خصم 10%' },
                  { id: 'monthly', nameAr: 'شهرياً', nameEn: 'Monthly', discount: 'خصم 5%' },
                ].map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setFrequency(f.id as BookingFrequency)}
                    className={`p-3.5 rounded-2xl border text-right transition-all flex flex-col justify-between ${
                      frequency === f.id
                        ? 'border-sky-500 bg-sky-50 text-sky-950 font-bold ring-2 ring-sky-200'
                        : 'border-slate-200 bg-white hover:border-slate-300 text-slate-700'
                    }`}
                  >
                    <div className="text-sm font-bold">{language === 'ar' ? f.nameAr : f.nameEn}</div>
                    {f.discount && (
                      <span className="mt-2 inline-block self-start text-[10px] px-2 py-0.5 rounded-full bg-amber-500 text-white font-extrabold">
                        {f.discount}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Add-ons */}
            <div>
              <label className="block text-sm font-black text-slate-800 mb-2">
                {language === 'ar' ? '3. الخدمات الإضافية الاختيارية:' : '3. Optional Add-ons:'}
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {Object.entries(ADD_ON_PRICES).map(([key, item]) => {
                  const isChecked = selectedAddOns.includes(key);
                  return (
                    <label
                      key={key}
                      className={`p-3.5 rounded-2xl border flex items-center justify-between cursor-pointer transition-all ${
                        isChecked
                          ? 'border-sky-400 bg-sky-50/60 text-sky-950 font-semibold'
                          : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedAddOns([...selectedAddOns, key]);
                            } else {
                              setSelectedAddOns(selectedAddOns.filter(x => x !== key));
                            }
                          }}
                          className="w-4 h-4 rounded-md text-sky-600 focus:ring-sky-500"
                        />
                        <span className="text-xs sm:text-sm">
                          {language === 'ar' ? item.nameAr : item.nameEn}
                        </span>
                      </div>
                      <span className="text-xs font-bold text-amber-600 whitespace-nowrap">
                        +{item.price} {language === 'ar' ? 'د.إ' : 'AED'}
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: Date, Time & Smart Dispatch */}
        {step === 2 && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-black text-slate-800 mb-1.5 flex items-center gap-1.5">
                  <CalendarIcon className="w-4 h-4 text-sky-600" />
                  <span>{language === 'ar' ? 'تاريخ الحجز (يُمنع اختيار موعد ماضٍ):' : 'Booking Date (No past dates):'}</span>
                </label>
                <input
                  type="date"
                  min={todayStr}
                  value={date}
                  onChange={(e) => {
                    setDate(e.target.value);
                    if (isPastDate(e.target.value)) {
                      setDateError(language === 'ar' ? 'لا يمكن اختيار تاريخ في الماضي.' : 'Cannot select a past date.');
                    } else {
                      setDateError('');
                    }
                  }}
                  className="w-full px-4 py-3 rounded-2xl border border-slate-300 focus:border-sky-500 focus:ring-2 focus:ring-sky-100 outline-none text-slate-800 font-bold"
                />
                {dateError && (
                  <p className="mt-1 text-xs text-rose-600 font-bold flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>{dateError}</span>
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-black text-slate-800 mb-1.5 flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-sky-600" />
                  <span>{language === 'ar' ? 'وقت البدء (ساعات العمل 08:00 - 20:00):' : 'Start Time (08:00 - 20:00):'}</span>
                </label>
                <select
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl border border-slate-300 focus:border-sky-500 focus:ring-2 focus:ring-sky-100 outline-none text-slate-800 font-bold bg-white"
                >
                  {['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00'].map(
                    (t) => (
                      <option key={t} value={t}>
                        {t} ({language === 'ar' ? 'ينتهي في' : 'ends at'} {calculateEndTime(t, hours)})
                      </option>
                    )
                  )}
                </select>
              </div>
            </div>

            {/* Smart Dispatch Summary Banner */}
            <div className="p-4 rounded-2xl bg-sky-50 border border-sky-200">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-sky-900">
                  {language === 'ar' ? 'فترة الحجز المقدرة:' : 'Estimated Service Window:'}
                </span>
                <span className="text-xs font-black text-sky-700 bg-white px-3 py-1 rounded-xl border border-sky-100">
                  {startTime} ➔ {calculatedEndTime} ({hours} {language === 'ar' ? 'ساعات' : 'hours'})
                </span>
              </div>
              <p className="text-[11px] text-sky-800 mt-1">
                {language === 'ar'
                  ? 'يحتسب نظام التوزيع الذكي فاصل انتقال لا يقل عن 30 دقيقة بين الحجوزات لضمان وصول العاملة في الموعد بدقة.'
                  : 'Dispatch engine maintains a mandatory 30-minute transit buffer between bookings.'}
              </p>
            </div>

            {/* Cleaners availability check */}
            <div>
              <label className="block text-sm font-black text-slate-800 mb-2">
                {language === 'ar' ? 'العاملات المتاحات في هذا الموعد:' : 'Available Cleaners for this slot:'}
              </label>

              {availableCleaners.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div
                    onClick={() => setSelectedCleanerId('auto')}
                    className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${
                      selectedCleanerId === 'auto'
                        ? 'border-sky-600 bg-sky-50/80 ring-2 ring-sky-200'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-sky-600 text-white flex items-center justify-center font-bold text-xs">
                        <Sparkles className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="text-sm font-bold text-slate-900">
                          {language === 'ar' ? 'توزيع ذكي تلقائي (الأسرع)' : 'Smart Auto-Dispatch (Fastest)'}
                        </div>
                        <div className="text-[11px] text-slate-500">
                          {language === 'ar' ? 'اختيار أفضل عاملة قريبة من موقعك' : 'Assigns closest top-rated cleaner'}
                        </div>
                      </div>
                    </div>
                  </div>

                  {availableCleaners.map((cleaner) => (
                    <div
                      key={cleaner.id}
                      onClick={() => setSelectedCleanerId(cleaner.id)}
                      className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${
                        selectedCleanerId === cleaner.id
                          ? 'border-sky-600 bg-sky-50/80 ring-2 ring-sky-200'
                          : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <img
                          src={cleaner.avatarUrl}
                          alt={cleaner.name}
                          className="w-10 h-10 rounded-full object-cover border border-slate-200"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-bold text-slate-900 truncate">
                              {cleaner.name}
                            </span>
                            <span className="text-xs font-bold text-amber-500">
                              ★ {cleaner.rating}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-500">
                            {cleaner.nationality} • {cleaner.completedJobs} {language === 'ar' ? 'طلب منجز' : 'jobs'}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 space-y-3">
                  <div className="flex items-center gap-2 text-amber-800 font-bold text-sm">
                    <AlertCircle className="w-4 h-4 text-amber-600" />
                    <span>
                      {language === 'ar'
                        ? 'كافة العاملات مشغولات في هذا التوقيت بالتحديد (أو فاصل الانتقال أقل من 30 دقيقة).'
                        : 'All cleaners are busy in this exact time window.'}
                    </span>
                  </div>

                  {alternativeSlots.length > 0 && (
                    <div>
                      <p className="text-xs text-amber-900 font-semibold mb-2">
                        {language === 'ar' ? 'أقرب فترات بديلة متاحة في نفس اليوم:' : 'Alternative slots available on same day:'}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {alternativeSlots.slice(0, 4).map((alt) => (
                          <button
                            key={alt.time}
                            type="button"
                            onClick={() => {
                              setStartTime(alt.time);
                              setSelectedCleanerId(alt.cleaner.id);
                            }}
                            className="px-3 py-1.5 rounded-xl bg-white border border-amber-300 text-amber-950 font-bold text-xs hover:bg-amber-100 transition-colors"
                          >
                            {alt.time} ({alt.cleaner.name})
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* STEP 3: Location, Abu Dhabi Area & Contact */}
        {step === 3 && (
          <div className="space-y-6">
            {/* Service Area Selection */}
            <div>
              <label className="block text-sm font-black text-slate-800 mb-1.5 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-sky-600" />
                  <span>{language === 'ar' ? 'المنطقة السكنية في أبوظبي (إجباري):' : 'Abu Dhabi Service Area (Required):'}</span>
                </span>
                <span className="text-xs font-bold text-amber-600">
                  {currentArea.travelFee > 0
                    ? `+${currentArea.travelFee} ${language === 'ar' ? 'د.إ تكلفة انتقال' : 'AED travel fee'}`
                    : language === 'ar' ? 'انتقال مجاني (0 د.إ)' : 'Free Travel (0 AED)'}
                </span>
              </label>

              <select
                value={selectedAreaId}
                onChange={(e) => setSelectedAreaId(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl border border-slate-300 focus:border-sky-500 focus:ring-2 focus:ring-sky-100 outline-none text-slate-800 font-bold bg-white"
              >
                {serviceAreas.map((area) => (
                  <option key={area.id} value={area.id}>
                    {area.nameAr} - {area.nameEn} ({area.travelFee > 0 ? `+${area.travelFee} د.إ` : 'مجاني 0 د.إ'})
                  </option>
                ))}
              </select>
            </div>

            {/* Address fields */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {language === 'ar' ? 'اسم الشارع / الحي:' : 'Street Name:'}
                </label>
                <input
                  type="text"
                  required
                  placeholder={language === 'ar' ? 'مثال: شارع السلام' : 'e.g. Al Salam St'}
                  value={street}
                  onChange={(e) => setStreet(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:border-sky-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {language === 'ar' ? 'اسم البرج / الفيلا:' : 'Building / Villa:'}
                </label>
                <input
                  type="text"
                  required
                  placeholder={language === 'ar' ? 'مثال: برج الشمس أو فيلا 12' : 'e.g. Sun Tower'}
                  value={building}
                  onChange={(e) => setBuilding(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:border-sky-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {language === 'ar' ? 'رقم الشقة / الطابق:' : 'Apartment / Floor:'}
                </label>
                <input
                  type="text"
                  required
                  placeholder={language === 'ar' ? 'مثال: شقة 1402' : 'e.g. Apt 1402'}
                  value={apartment}
                  onChange={(e) => setApartment(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:border-sky-500 outline-none"
                />
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {language === 'ar' ? 'ملاحظات وتوجيهات خاصة للعاملة:' : 'Special Instructions for Cleaner:'}
              </label>
              <textarea
                rows={2}
                placeholder={language === 'ar' ? 'مثال: التركيز على المطبخ وغرفة المعيشة أو كود الدخول للأمن' : 'e.g. Focus on kitchen, security gate code'}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:border-sky-500 outline-none"
              />
            </div>

            {/* Customer Details */}
            <div className="pt-4 border-t border-slate-100 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-black text-slate-900">
                  {language === 'ar' ? 'بيانات التواصل وتأكيد الطلب:' : 'Contact Information:'}
                </span>
                {!currentUser && (
                  <span className="text-xs text-sky-700 bg-sky-50 px-2.5 py-1 rounded-lg font-bold">
                    {language === 'ar' ? 'متاح الحجز كزائر بدون تسجيل' : 'Guest Checkout Supported'}
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                    <User className="w-3.5 h-3.5 text-sky-600" />
                    <span>{language === 'ar' ? 'الاسم الكامل:' : 'Full Name:'}</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder={language === 'ar' ? 'مثال: أحمد المنصوري' : 'Ahmed Al Mansoori'}
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:border-sky-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5 text-sky-600" />
                    <span>{language === 'ar' ? 'رقم الهاتف الإماراتي:' : 'UAE Phone Number:'}</span>
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="050 123 4567"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:border-sky-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                  <Mail className="w-3.5 h-3.5 text-sky-600" />
                  <span>{language === 'ar' ? 'البريد الإلكتروني (اختياري لاستلام الفاتورة):' : 'Email (Optional for invoice):'}</span>
                </label>
                <input
                  type="email"
                  placeholder="name@example.com"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:border-sky-500 outline-none"
                />
              </div>
            </div>
          </div>
        )}

        {/* STEP 4: Invoice Breakdown & Payment */}
        {step === 4 && (
          <div className="space-y-6">
            <h3 className="text-base font-black text-slate-900 border-b border-slate-100 pb-3">
              {language === 'ar' ? 'تفاصيل الفاتورة الشفافة وطريقة الدفع' : 'Transparent Invoice & Payment'}
            </h3>

            {/* Transparent Invoice Table */}
            <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-600">
                  {language === 'ar' ? `خدمة التنظيف الأساسية (${hours} ساعات × ${brandSettings.hourlyBaseRate} د.إ)` : `Base Cleaning (${hours} hrs × ${brandSettings.hourlyBaseRate} AED)`}:
                </span>
                <span className="font-bold text-slate-800">
                  {hours * brandSettings.hourlyBaseRate} {language === 'ar' ? 'د.إ' : 'AED'}
                </span>
              </div>

              {pricing.addOnsTotal > 0 && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-600">
                    {language === 'ar' ? 'الخدمات الإضافية والمواد:' : 'Add-ons & Supplies:'}
                  </span>
                  <span className="font-bold text-slate-800">
                    +{pricing.addOnsTotal} {language === 'ar' ? 'د.إ' : 'AED'}
                  </span>
                </div>
              )}

              {/* Explicit Travel Fee Line */}
              <div className="flex items-center justify-between text-sm font-semibold text-sky-900 bg-sky-50/80 p-2.5 rounded-xl border border-sky-100">
                <span>
                  {language === 'ar'
                    ? `تكلفة الانتقال إلى (${currentArea.nameAr}):`
                    : `Travel Fee to (${currentArea.nameEn}):`}
                </span>
                <span className="font-black text-sky-700">
                  {pricing.travelFee > 0
                    ? `+${pricing.travelFee} ${language === 'ar' ? 'د.إ' : 'AED'}`
                    : language === 'ar' ? 'مجاناً 0 د.إ' : 'FREE (0 AED)'}
                </span>
              </div>

              {pricing.frequencyDiscount > 0 && (
                <div className="flex items-center justify-between text-sm text-emerald-700 font-bold">
                  <span>
                    {language === 'ar' ? `خصم الاشتراك الدوري (${pricing.frequencyPercent}%):` : `Subscription Discount (${pricing.frequencyPercent}%):`}
                  </span>
                  <span>
                    -{pricing.frequencyDiscount} {language === 'ar' ? 'د.إ' : 'AED'}
                  </span>
                </div>
              )}

              {/* Wallet Usage Option */}
              {customerAccount && customerAccount.walletBalance > 0 && (
                <div className="pt-2 border-t border-slate-200">
                  <label className="flex items-center justify-between p-2.5 rounded-xl bg-amber-50 border border-amber-200 cursor-pointer">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={useWallet}
                        onChange={(e) => setUseWallet(e.target.checked)}
                        className="w-4 h-4 rounded text-amber-600"
                      />
                      <span className="text-xs font-bold text-amber-900">
                        {language === 'ar'
                          ? `استخدام رصيد المحفظة (الرصيد المتاح: ${customerAccount.walletBalance} د.إ)`
                          : `Use Wallet Balance (Available: ${customerAccount.walletBalance} AED)`}
                      </span>
                    </div>
                    {useWallet && (
                      <span className="text-xs font-black text-amber-700">
                        -{pricing.walletUsed} {language === 'ar' ? 'د.إ' : 'AED'}
                      </span>
                    )}
                  </label>
                </div>
              )}

              {/* Net Total */}
              <div className="pt-3 border-t-2 border-slate-200 flex items-center justify-between text-lg font-black text-slate-900">
                <span>{language === 'ar' ? 'المبلغ الإجمالي المطلوب:' : 'Net Total Amount:'}</span>
                <span className="text-2xl text-sky-600">
                  {pricing.total} {language === 'ar' ? 'د.إ' : 'AED'}
                </span>
              </div>
            </div>

            {/* Payment Method Selector */}
            <div>
              <label className="block text-sm font-black text-slate-800 mb-2">
                {language === 'ar' ? 'طريقة السداد:' : 'Payment Method:'}
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('cash')}
                  className={`p-3.5 rounded-2xl border text-right transition-all flex flex-col justify-between ${
                    paymentMethod === 'cash'
                      ? 'border-sky-600 bg-sky-50/80 ring-2 ring-sky-200 text-sky-900 font-bold'
                      : 'border-slate-200 bg-white hover:border-slate-300 text-slate-700'
                  }`}
                >
                  <div className="text-sm font-bold">
                    {language === 'ar' ? 'نقداً للعاملة (عند الاستلام)' : 'Cash to Cleaner (COD)'}
                  </div>
                  <span className="text-[11px] text-slate-500 mt-1">
                    {language === 'ar' ? 'يتم الدفع نقداً عند اكتمال الخدمة' : 'Pay in cash after completion'}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('bank_transfer')}
                  className={`p-3.5 rounded-2xl border text-right transition-all flex flex-col justify-between ${
                    paymentMethod === 'bank_transfer'
                      ? 'border-sky-600 bg-sky-50/80 ring-2 ring-sky-200 text-sky-900 font-bold'
                      : 'border-slate-200 bg-white hover:border-slate-300 text-slate-700'
                  }`}
                >
                  <div className="text-sm font-bold">
                    {language === 'ar' ? 'تحويل بنكي (مصرف أبوظبي الإسلامي)' : 'Bank Transfer (ADIB)'}
                  </div>
                  <span className="text-[11px] text-slate-500 mt-1">
                    {brandSettings.bankName}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('card')}
                  className={`p-3.5 rounded-2xl border text-right transition-all flex flex-col justify-between ${
                    paymentMethod === 'card'
                      ? 'border-sky-600 bg-sky-50/80 ring-2 ring-sky-200 text-sky-900 font-bold'
                      : 'border-slate-200 bg-white hover:border-slate-300 text-slate-700'
                  }`}
                >
                  <div className="text-sm font-bold">
                    {language === 'ar' ? 'بطاقة بنكية (فيزا / ماستركارد)' : 'Debit / Credit Card'}
                  </div>
                  <span className="text-[11px] text-slate-500 mt-1">
                    {language === 'ar' ? 'دفع إلكتروني آمن ومشفر' : 'Instant secure payment'}
                  </span>
                </button>
              </div>

              {/* ADIB Bank Transfer details box */}
              {paymentMethod === 'bank_transfer' && (
                <div className="mt-4 p-4 rounded-2xl bg-amber-50/80 border border-amber-200 space-y-2 text-xs">
                  <div className="font-black text-amber-950 flex items-center gap-1.5">
                    <Building className="w-4 h-4 text-amber-600" />
                    <span>{language === 'ar' ? 'بيانات التحويل لحساب الشركة في مصرف أبوظبي الإسلامي:' : 'ADIB Bank Transfer Details:'}</span>
                  </div>
                  <div className="text-slate-700 space-y-1">
                    <p><strong>{language === 'ar' ? 'اسم الحساب:' : 'Account Name:'}</strong> {brandSettings.bankAccountName}</p>
                    <p><strong>{language === 'ar' ? 'البنك:' : 'Bank:'}</strong> {brandSettings.bankName}</p>
                    <p className="flex items-center gap-2">
                      <strong>IBAN:</strong> <span className="font-mono">{brandSettings.bankIban}</span>
                      <button
                        type="button"
                        onClick={handleCopyIban}
                        className="px-2 py-0.5 rounded-lg bg-amber-200 hover:bg-amber-300 text-amber-900 font-bold text-[11px] flex items-center gap-1"
                      >
                        {copiedIban ? <Check className="w-3 h-3 text-emerald-700" /> : <Copy className="w-3 h-3" />}
                        <span>{copiedIban ? (language === 'ar' ? 'تم النسخ' : 'Copied') : (language === 'ar' ? 'نسخ الآيبان' : 'Copy')}</span>
                      </button>
                    </p>
                  </div>
                </div>
              )}
            </div>

            {submissionError && (
              <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 font-bold text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{submissionError}</span>
              </div>
            )}
          </div>
        )}

        {/* STEP 5: Success Screen */}
        {step === 5 && (
          <div className="text-center py-8 space-y-6">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center">
              <CheckCircle className="w-10 h-10" />
            </div>

            <div className="space-y-2">
              <h3 className="text-2xl font-black text-slate-900">
                {language === 'ar' ? 'تم تأكيد حجزك بنجاح في ألفا كلين!' : 'Your Booking is Confirmed!'}
              </h3>
              <p className="text-sm text-slate-600 max-w-md mx-auto">
                {language === 'ar'
                  ? 'تم تسجيل طلبك وتعيين العاملة بنجاح، وستصلك رسالة تأكيد بالمواعيد المعتمدة.'
                  : 'Your request has been booked and cleaner dispatched. You will receive a confirmation message.'}
              </p>
            </div>

            {/* Reference Badge */}
            <div className="inline-block p-4 rounded-2xl bg-sky-50 border border-sky-200 text-center">
              <span className="text-xs text-sky-800 font-medium block mb-1">
                {language === 'ar' ? 'رقم مرجع الحجز المعتمد' : 'Booking Reference Code'}
              </span>
              <span className="text-2xl font-black text-sky-700 tracking-wider font-mono">
                {completedBookingRef}
              </span>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
              <button
                onClick={() => {
                  setActiveTrackingRef(completedBookingRef);
                  setActiveView('tracking');
                }}
                className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-sky-600 hover:bg-sky-700 text-white font-extrabold text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>{language === 'ar' ? 'تتبع حالة الطلب والعاملة الآن' : 'Track Booking & Cleaner'}</span>
                <ChevronLeft className={`w-4 h-4 ${language === 'ar' ? '' : 'rotate-180'}`} />
              </button>

              <button
                onClick={() => {
                  setStep(1);
                  setCompletedBookingRef('');
                }}
                className="w-full sm:w-auto px-6 py-3.5 rounded-2xl border border-slate-300 text-slate-700 font-bold text-sm hover:bg-slate-50 transition-colors"
              >
                {language === 'ar' ? 'حجز موعد جديد' : 'Book Another Service'}
              </button>
            </div>
          </div>
        )}

        {/* Wizard Footer Controls */}
        {step < 5 && (
          <div className="flex items-center justify-between pt-6 border-t border-slate-100">
            {step > 1 ? (
              <button
                type="button"
                onClick={() => setStep((step - 1) as any)}
                className="px-5 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-bold text-xs sm:text-sm hover:bg-slate-50 transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                {language === 'ar' ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
                <span>{language === 'ar' ? 'السابق' : 'Back'}</span>
              </button>
            ) : (
              <div></div>
            )}

            {step < 4 ? (
              <button
                type="button"
                onClick={handleNext}
                className="px-6 py-3 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-black text-xs sm:text-sm shadow-md shadow-sky-600/20 transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <span>{language === 'ar' ? 'التالي' : 'Next'}</span>
                {language === 'ar' ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              </button>
            ) : (
              <button
                type="button"
                onClick={handleConfirmBooking}
                className="px-8 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-black text-sm sm:text-base shadow-lg shadow-emerald-600/20 transition-all hover:scale-[1.01] flex items-center gap-2 cursor-pointer"
              >
                <ShieldCheck className="w-5 h-5" />
                <span>{language === 'ar' ? 'تأكيد الحجز النهائي' : 'Confirm Final Booking'}</span>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
