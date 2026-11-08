/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Booking } from '../types';
import {
  CheckCircle,
  Clock,
  MapPin,
  DollarSign,
  FileText,
  Phone,
  Navigation,
  Sparkles,
  Calendar,
  AlertCircle,
  Star,
} from 'lucide-react';

export const CleanerPortal: React.FC = () => {
  const {
    language,
    currentUser,
    cleaners,
    bookings,
    updateBookingStatus,
  } = useApp();

  // Find the cleaner profile linked to currentUser
  const currentCleaner = cleaners.find(
    (c) => c.id === currentUser?.cleanerId || c.phone === currentUser?.phone
  ) || cleaners[0];

  // Notes state
  const [editingNotesBookingId, setEditingNotesBookingId] = useState<string | null>(null);
  const [cleanerNoteText, setCleanerNoteText] = useState<string>('');

  // Assigned bookings for this cleaner
  const cleanerBookings = bookings.filter((b) => b.cleanerId === currentCleaner.id);

  const handleUpdateStatus = (bookingId: string, newStatus: any) => {
    updateBookingStatus(bookingId, newStatus);
  };

  const handleConfirmCash = (booking: Booking) => {
    updateBookingStatus(booking.id, booking.status, {
      paymentStatus: 'confirmed_cash',
    });
  };

  const handleSaveNotes = (bookingId: string) => {
    if (cleanerNoteText.trim()) {
      updateBookingStatus(bookingId, bookings.find(b => b.id === bookingId)?.status || 'in_progress', {
        cleanerNotes: cleanerNoteText.trim(),
      });
      setEditingNotesBookingId(null);
      setCleanerNoteText('');
    }
  };

  return (
    <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto space-y-6">
      {/* Cleaner Header Profile */}
      <div className="bg-gradient-to-r from-emerald-800 via-teal-800 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-lg border border-emerald-700/40">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <img
              src={currentCleaner.avatarUrl}
              alt={currentCleaner.name}
              className="w-16 h-16 rounded-2xl object-cover border-2 border-emerald-400 shadow-md"
            />
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-400/30 mb-1">
                <Sparkles className="w-3.5 h-3.5" />
                <span>{language === 'ar' ? 'بوابة مهام العاملة الميدانية' : 'Cleaner Task Portal'}</span>
              </div>
              <h1 className="text-xl sm:text-2xl font-black">{currentCleaner.name}</h1>
              <p className="text-xs text-emerald-200">
                {currentCleaner.nationality} • {currentCleaner.phone}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="px-3.5 py-2 rounded-2xl bg-white/10 border border-white/20 text-center">
              <span className="text-[10px] text-emerald-200 block">{language === 'ar' ? 'التقييم' : 'Rating'}</span>
              <span className="text-sm font-black text-amber-300 flex items-center justify-center gap-1">
                <Star className="w-3.5 h-3.5 fill-amber-300" />
                {currentCleaner.rating}
              </span>
            </div>
            <div className="px-3.5 py-2 rounded-2xl bg-white/10 border border-white/20 text-center">
              <span className="text-[10px] text-emerald-200 block">{language === 'ar' ? 'المهام' : 'Jobs'}</span>
              <span className="text-sm font-black text-white">{currentCleaner.completedJobs}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bookings List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-emerald-600" />
            <span>{language === 'ar' ? 'مهام وزيارات التنظيف المسندة إليك:' : 'Assigned Cleaning Visits:'}</span>
          </h2>
          <span className="text-xs font-bold text-slate-500">
            {cleanerBookings.length} {language === 'ar' ? 'زيارات' : 'visits'}
          </span>
        </div>

        {cleanerBookings.length > 0 ? (
          cleanerBookings.map((b) => (
            <div
              key={b.id}
              className={`p-6 rounded-3xl border shadow-sm transition-all bg-white ${
                b.status === 'in_progress'
                  ? 'border-red-400 ring-2 ring-red-100'
                  : 'border-slate-200'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4 mb-4">
                <div className="flex items-center gap-3">
                  <span className="px-3 py-1 rounded-xl bg-sky-50 text-sky-800 font-mono font-black text-xs">
                    #{b.reference}
                  </span>
                  <div>
                    <h3 className="text-base font-black text-slate-900">{b.customerName}</h3>
                    <p className="text-xs text-slate-500 font-mono">{b.customerPhone}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-bold ${
                      b.status === 'in_progress'
                        ? 'bg-red-500 text-white animate-pulse'
                        : b.status === 'completed'
                        ? 'bg-emerald-100 text-emerald-800'
                        : b.status === 'dispatched'
                        ? 'bg-amber-100 text-amber-900'
                        : 'bg-sky-100 text-sky-800'
                    }`}
                  >
                    {b.status === 'in_progress'
                      ? (language === 'ar' ? 'جاري التنظيف الآن' : 'In Progress')
                      : b.status === 'completed'
                      ? (language === 'ar' ? 'مكتمل' : 'Completed')
                      : b.status === 'dispatched'
                      ? (language === 'ar' ? 'في الطريق' : 'Dispatched')
                      : (language === 'ar' ? 'مؤكد وبانتظار البدء' : 'Confirmed')}
                  </span>
                </div>
              </div>

              {/* Visit Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-slate-700 mb-4">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-1.5 font-bold text-slate-900">
                    <Clock className="w-4 h-4 text-sky-600" />
                    <span>{b.date} | {b.startTime} - {b.endTime} ({b.hours} {language === 'ar' ? 'ساعات' : 'hours'})</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-600">
                    <MapPin className="w-4 h-4 text-amber-500" />
                    <span>{b.address.areaName} - {b.address.building} ({b.address.apartment})</span>
                  </div>
                  {b.address.notes && (
                    <p className="text-[11px] text-amber-800 bg-amber-50 p-2 rounded-xl border border-amber-100">
                      <strong>{language === 'ar' ? 'تعليمات العميل:' : 'Client Notes:'}</strong> {b.address.notes}
                    </p>
                  )}
                </div>

                <div className="space-y-1.5 sm:border-r sm:pr-4">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">{language === 'ar' ? 'طريقة الدفع:' : 'Payment:'}</span>
                    <span className="font-bold">
                      {b.paymentMethod === 'cash' ? (language === 'ar' ? 'نقداً للعاملة' : 'Cash on Delivery') : b.paymentMethod}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">{language === 'ar' ? 'المبلغ المطلوب:' : 'Amount to Collect:'}</span>
                    <span className="text-base font-black text-sky-700">{b.total} د.إ</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">{language === 'ar' ? 'حالة تحصيل الكاش:' : 'Cash Status:'}</span>
                    <span className={`font-bold ${b.paymentStatus === 'confirmed_cash' ? 'text-emerald-600' : 'text-amber-600'}`}>
                      {b.paymentStatus === 'confirmed_cash'
                        ? (language === 'ar' ? '✓ تم استلام الكاش واعتماده' : '✓ Cash Received')
                        : (language === 'ar' ? 'بانتظار الاستلام' : 'Pending Receipt')}
                    </span>
                  </div>
                </div>
              </div>

              {/* Status Update & Actions Row */}
              <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-slate-100">
                {b.status !== 'in_progress' && b.status !== 'completed' && (
                  <button
                    onClick={() => handleUpdateStatus(b.id, 'dispatched')}
                    className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Navigation className="w-3.5 h-3.5" />
                    <span>{language === 'ar' ? 'أنا في الطريق للعميل' : 'On The Way'}</span>
                  </button>
                )}

                {b.status !== 'in_progress' && b.status !== 'completed' && (
                  <button
                    onClick={() => handleUpdateStatus(b.id, 'in_progress')}
                    className="px-3.5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Clock className="w-3.5 h-3.5" />
                    <span>{language === 'ar' ? 'بدء التنظيف الآن (قيد التنفيذ)' : 'Start Cleaning Now'}</span>
                  </button>
                )}

                {b.status === 'in_progress' && (
                  <button
                    onClick={() => handleUpdateStatus(b.id, 'completed')}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <CheckCircle className="w-4 h-4" />
                    <span>{language === 'ar' ? 'تم اكتمال التنظيف بنجاح' : 'Mark Completed'}</span>
                  </button>
                )}

                {/* Confirm Cash Received button */}
                {b.paymentMethod === 'cash' && b.paymentStatus !== 'confirmed_cash' && (
                  <button
                    onClick={() => handleConfirmCash(b)}
                    className="px-3.5 py-2 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-800 hover:bg-emerald-100 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
                    <span>{language === 'ar' ? `تأكيد استلام الكاش (${b.total} د.إ)` : 'Confirm Cash Received'}</span>
                  </button>
                )}

                {/* Add cleaner notes button */}
                <button
                  onClick={() => {
                    setEditingNotesBookingId(b.id);
                    setCleanerNoteText(b.cleanerNotes || '');
                  }}
                  className="px-3.5 py-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 font-bold text-xs flex items-center gap-1.5 transition-colors ml-auto cursor-pointer"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>{language === 'ar' ? 'تدوين ملاحظات الزيارة' : 'Add Notes'}</span>
                </button>
              </div>

              {/* Notes input box */}
              {editingNotesBookingId === b.id && (
                <div className="mt-4 p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                  <label className="block text-xs font-bold text-slate-800">
                    {language === 'ar' ? 'ملاحظاتك الميدانية على هذه الزيارة:' : 'Cleaner Notes for this visit:'}
                  </label>
                  <textarea
                    rows={2}
                    value={cleanerNoteText}
                    onChange={(e) => setCleanerNoteText(e.target.value)}
                    placeholder={language === 'ar' ? 'مثال: تم إنجاز تنظيف المطبخ وكوي الملابس، والعميل راضٍ تماماً...' : 'Write notes...'}
                    className="w-full p-2.5 rounded-xl border border-slate-300 text-xs bg-white outline-none"
                  />
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => setEditingNotesBookingId(null)}
                      className="px-3 py-1.5 rounded-lg border text-xs font-bold text-slate-600"
                    >
                      إلغاء
                    </button>
                    <button
                      onClick={() => handleSaveNotes(b.id)}
                      className="px-4 py-1.5 rounded-lg bg-slate-900 text-white font-bold text-xs"
                    >
                      حفظ الملاحظة
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))
        ) : (
          <div className="bg-white rounded-3xl p-12 text-center border border-slate-200/80 shadow-sm space-y-3">
            <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto" />
            <h3 className="text-base font-black text-slate-800">
              {language === 'ar' ? 'لا توجد مهام مسندة لك حالياً' : 'No tasks assigned right now'}
            </h3>
            <p className="text-xs text-slate-500">
              {language === 'ar' ? 'سيقوم مشرف العمليات بتوزيع الحجوزات الجديدة وفق جدول الحصص.' : 'Operations supervisor will assign new bookings.'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
