/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import {
  Cleaner,
  CleanerLog,
  CustomerAccount,
  ServiceArea,
  User,
} from '../types';
import {
  exportToCsv,
  exportToExcelHtml,
  timeToMinutes,
} from '../utils/dispatchEngine';
import {
  Calendar,
  Users,
  UserCheck,
  Film,
  Award,
  MapPin,
  Shield,
  FileSpreadsheet,
  Download,
  Plus,
  Search,
  Filter,
  CheckCircle,
  XCircle,
  AlertCircle,
  Edit2,
  Lock,
  Save,
  Clock,
  Sparkles,
  Phone,
  Building,
  CreditCard,
  Ban,
  DollarSign,
  Gift,
  Eye,
  EyeOff,
  Check,
  Trash2,
  Copy,
  UserPlus,
  Key,
  RefreshCw,
  Share2,
  Image as ImageIcon,
  Globe,
} from 'lucide-react';
import { ErrorBoundary } from './ErrorBoundary';

export const SupervisorConsole: React.FC = () => {
  const {
    language,
    currentUser,
    cleaners,
    addCleaner,
    updateCleaner,
    addCleanerLog,
    bookings,
    customers,
    adjustCustomerWallet,
    approveCustomerBonus,
    toggleCustomerSuspension,
    resetCustomerPassword,
    promoMedia,
    updatePromoMedia,
    rewardsPolicy,
    updateRewardsPolicy,
    serviceAreas,
    updateServiceAreaFee,
    addServiceArea,
    brandSettings,
    updateBrandSettings,
    users = [],
    updateUserByAdmin,
    addNewUser,
    deleteUserByAdmin,
    toggleUserSuspensionByAdmin,
    resetUserPasswordByAdmin,
    login,
  } = useApp();

  const isAdmin = currentUser?.role === 'admin';

  // Tabs
  type TabKey =
    | 'matrix'
    | 'staff'
    | 'customers'
    | 'promo'
    | 'rewards'
    | 'areas'
    | 'users_manager'
    | 'branding';

  const [activeTab, setActiveTab] = useState<TabKey>('matrix');

  // Matrix week navigation (0 = current week)
  const [weekOffset, setWeekOffset] = useState<number>(0);
  const [selectedSlotBooking, setSelectedSlotBooking] = useState<any | null>(null);

  // Staff search & filters
  const [staffSearch, setStaffSearch] = useState<string>('');
  const [staffStatusFilter, setStaffStatusFilter] = useState<string>('all');
  const [selectedCleanerForLog, setSelectedCleanerForLog] = useState<Cleaner | null>(null);
  const [newLogCategory, setNewLogCategory] = useState<'performance' | 'attendance' | 'complaint' | 'praise'>('praise');
  const [newLogRating, setNewLogRating] = useState<number>(5);
  const [newLogNotes, setNewLogNotes] = useState<string>('');
  const [showAddCleanerModal, setShowAddCleanerModal] = useState<boolean>(false);
  const [newCleanerForm, setNewCleanerForm] = useState({
    name: '',
    nameEn: '',
    phone: '',
    hourlyRate: 35,
    rating: 5.0,
    completedJobs: 0,
    status: 'active' as const,
    nationality: 'الفلبين',
    nationalityEn: 'Philippines',
    avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
    workingHours: { start: '08:00', end: '20:00' },
    workingDays: [0, 1, 2, 3, 4, 5, 6],
  });

  // Customer filters & wallet adjustments
  const [customerSearch, setCustomerSearch] = useState<string>('');
  const [customerTypeFilter, setCustomerTypeFilter] = useState<'all' | 'registered' | 'guests'>('all');
  const [selectedCustomerForWallet, setSelectedCustomerForWallet] = useState<CustomerAccount | null>(null);
  const [walletDelta, setWalletDelta] = useState<number>(20);
  const [walletReason, setWalletReason] = useState<string>('رصيد ترويجي من مشرف العمليات');
  const [selectedCustomerForPass, setSelectedCustomerForPass] = useState<CustomerAccount | null>(null);
  const [newPassInput, setNewPassInput] = useState<string>('');

  // Promo media form
  const [promoForm, setPromoForm] = useState({ ...promoMedia });

  // Rewards policy form
  const [rewardsForm, setRewardsForm] = useState({ ...rewardsPolicy });

  // Service area add form
  const [showAddAreaModal, setShowAddAreaModal] = useState<boolean>(false);
  const [newAreaForm, setNewAreaForm] = useState({
    nameAr: '',
    nameEn: '',
    travelFee: 20,
    isActive: true,
    zone: 'Zone A',
  });

  // Admin: Brand settings form
  const [brandForm, setBrandForm] = useState({ ...brandSettings });

  // Admin: User manager state
  const [selectedUserForEdit, setSelectedUserForEdit] = useState<User | null>(null);
  const [userEditForm, setUserEditForm] = useState({
    username: '',
    email: '',
    password: '',
    role: 'supervisor' as any,
    name: '',
    phone: '',
    status: 'active' as any,
  });

  // Users Manager enhanced state
  const [userSearch, setUserSearch] = useState<string>('');
  const [userRoleFilter, setUserRoleFilter] = useState<string>('all');
  const [userStatusFilter, setUserStatusFilter] = useState<string>('all');
  const [showAddUserModal, setShowAddUserModal] = useState<boolean>(false);
  const [newUserForm, setNewUserForm] = useState({
    username: '',
    email: '',
    password: '',
    role: 'supervisor' as 'admin' | 'supervisor' | 'cleaner' | 'customer',
    name: '',
    phone: '',
    status: 'active' as 'active' | 'suspended',
  });
  const [visiblePasswords, setVisiblePasswords] = useState<Record<string, boolean>>({});
  const [userForPasswordReset, setUserForPasswordReset] = useState<User | null>(null);
  const [userResetPasswordInput, setUserResetPasswordInput] = useState<string>('');
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [userToast, setUserToast] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [copiedPassId, setCopiedPassId] = useState<string | null>(null);

  // Compute 7 days of the timetable (Saturday - Friday)
  const weekDays = useMemo(() => {
    // Generate dates based on today + weekOffset * 7
    const days: { dateStr: string; nameAr: string; nameEn: string; dayIndex: number }[] = [];
    const base = new Date();
    base.setDate(base.getDate() + weekOffset * 7);

    // Find the previous or current Saturday
    const currentDay = base.getDay(); // 0 is Sunday, 6 is Saturday
    const diffToSat = currentDay === 6 ? 0 : -(currentDay + 1);
    const saturday = new Date(base);
    saturday.setDate(base.getDate() + diffToSat);

    const arDays = ['السبت', 'الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة'];
    const enDays = ['Saturday', 'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

    for (let i = 0; i < 7; i++) {
      const d = new Date(saturday);
      d.setDate(saturday.getDate() + i);
      const y = d.getFullYear();
      const m = (d.getMonth() + 1).toString().padStart(2, '0');
      const day = d.getDate().toString().padStart(2, '0');
      days.push({
        dateStr: `${y}-${m}-${day}`,
        nameAr: arDays[i],
        nameEn: enDays[i],
        dayIndex: d.getDay(),
      });
    }
    return days;
  }, [weekOffset]);

  // 12 two-hour time slots per 24 hours
  const matrixSlots = [
    { start: '00:00', end: '02:00', label: '00:00 - 02:00' },
    { start: '02:00', end: '04:00', label: '02:00 - 04:00' },
    { start: '04:00', end: '06:00', label: '04:00 - 06:00' },
    { start: '06:00', end: '08:00', label: '06:00 - 08:00' },
    { start: '08:00', end: '10:00', label: '08:00 - 10:00' },
    { start: '10:00', end: '12:00', label: '10:00 - 12:00' },
    { start: '12:00', end: '14:00', label: '12:00 - 14:00' },
    { start: '14:00', end: '16:00', label: '14:00 - 16:00' },
    { start: '16:00', end: '18:00', label: '16:00 - 18:00' },
    { start: '18:00', end: '20:00', label: '18:00 - 20:00' },
    { start: '20:00', end: '22:00', label: '20:00 - 22:00' },
    { start: '22:00', end: '24:00', label: '22:00 - 24:00' },
  ];

  // Helper to test if a booking occupies a slot
  const getSlotBooking = (cleanerId: string, dateStr: string, slotStart: string, slotEnd: string) => {
    const sStartM = timeToMinutes(slotStart);
    const sEndM = slotEnd === '24:00' ? 1440 : timeToMinutes(slotEnd);

    return bookings.find((b) => {
      if (b.cleanerId !== cleanerId || b.date !== dateStr || b.status === 'cancelled') {
        return false;
      }
      const bStartM = timeToMinutes(b.startTime);
      const bEndM = timeToMinutes(b.endTime);

      // Overlaps if max(start) < min(end)
      return Math.max(sStartM, bStartM) < Math.min(sEndM, bEndM);
    });
  };

  // Staff Export functions
  const handleExportStaffCsv = () => {
    const headers = [
      { key: 'name', label: 'الاسم بالعربية' },
      { key: 'nameEn', label: 'الاسم بالإنجليزية' },
      { key: 'phone', label: 'رقم الهاتف' },
      { key: 'nationality', label: 'الجنسية' },
      { key: 'rating', label: 'التقييم' },
      { key: 'completedJobs', label: 'الطلبات المنجزة' },
      { key: 'status', label: 'الحالة' },
      { key: 'hourlyRate', label: 'أجر الساعة (د.إ)' },
    ];
    exportToCsv(headers, cleaners, `alfa_clean_staff_${new Date().toISOString().split('T')[0]}`);
  };

  const handleExportStaffExcel = () => {
    const headers = ['الاسم', 'Name En', 'الهاتف', 'الجنسية', 'التقييم', 'المهام المنجزة', 'الحالة', 'أجر الساعة'];
    const rows = cleaners.map((c) => [
      c.name,
      c.nameEn,
      c.phone,
      c.nationality,
      `${c.rating} / 5`,
      c.completedJobs,
      c.status === 'active' ? 'نشطة' : 'إجازة',
      `${c.hourlyRate} د.إ`,
    ]);
    exportToExcelHtml('سجل كادر العاملات', headers, rows, `alfa_clean_staff_${new Date().toISOString().split('T')[0]}`);
  };

  // Customer Export functions (Strict: CSV and XLS with UTF-8 BOM only, no JSON)
  const handleExportCustomersCsv = () => {
    const headers = [
      { key: 'id', label: 'المعرف' },
      { key: 'name', label: 'اسم العميل / الطلب' },
      { key: 'phone', label: 'رقم الهاتف' },
      { key: 'email', label: 'البريد الإلكتروني' },
      { key: 'walletBalance', label: 'رصيد المحفظة (د.إ)' },
      { key: 'points', label: 'نقاط المكافأة' },
      { key: 'isGuest', label: 'نوع الحساب (زائر/مسجل)' },
      { key: 'isSuspended', label: 'حالة الحساب' },
      { key: 'pendingRewardBonus', label: 'الهدية المعلقة (د.إ)' },
      { key: 'createdAt', label: 'تاريخ التسجيل' },
    ];
    const data = customers.map((c) => ({
      ...c,
      isGuest: c.isGuest ? 'زائر' : 'مسجل',
      isSuspended: c.isSuspended ? 'معلق' : 'نشط',
    }));
    exportToCsv(headers, data, `alfa_clean_customers_${new Date().toISOString().split('T')[0]}`);
  };

  const handleExportCustomersExcel = () => {
    const headers = ['المعرف', 'الاسم', 'الهاتف', 'البريد', 'المحفظة (د.إ)', 'النقاط', 'النوع', 'الحالة', 'الهدية المعلقة'];
    const rows = customers.map((c) => [
      c.id,
      c.name,
      c.phone,
      c.email,
      c.walletBalance,
      c.points,
      c.isGuest ? 'زائر' : 'مسجل',
      c.isSuspended ? 'معلق' : 'نشط',
      c.pendingRewardBonus,
    ]);
    exportToExcelHtml('سجل العملاء والمحافظ', headers, rows, `alfa_clean_customers_${new Date().toISOString().split('T')[0]}`);
  };

  // Add cleaner submit
  const handleAddCleanerSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newCleanerForm.name && newCleanerForm.phone) {
      addCleaner(newCleanerForm);
      setShowAddCleanerModal(false);
      setNewCleanerForm({
        name: '',
        nameEn: '',
        phone: '',
        hourlyRate: 35,
        rating: 5.0,
        completedJobs: 0,
        status: 'active',
        nationality: 'الفلبين',
        nationalityEn: 'Philippines',
        avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
        workingHours: { start: '08:00', end: '20:00' },
        workingDays: [0, 1, 2, 3, 4, 5, 6],
      });
    }
  };

  // Add operational log submit
  const handleAddLogSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedCleanerForLog && newLogNotes.trim()) {
      addCleanerLog(selectedCleanerForLog.id, {
        authorName: currentUser?.name || 'مشرف العمليات',
        rating: newLogRating,
        category: newLogCategory,
        notes: newLogNotes.trim(),
      });
      setNewLogNotes('');
      // refresh selected cleaner
      const updated = cleaners.find((c) => c.id === selectedCleanerForLog.id);
      if (updated) setSelectedCleanerForLog(updated);
    }
  };

  // Filtered staff list
  const filteredCleaners = cleaners.filter((c) => {
    const matchesSearch =
      c.name.toLowerCase().includes(staffSearch.toLowerCase()) ||
      c.nameEn.toLowerCase().includes(staffSearch.toLowerCase()) ||
      c.nationality.toLowerCase().includes(staffSearch.toLowerCase()) ||
      c.phone.includes(staffSearch);
    const matchesStatus = staffStatusFilter === 'all' || c.status === staffStatusFilter;
    return matchesSearch && matchesStatus;
  });

  // Filtered customer list
  const filteredCustomers = customers.filter((c) => {
    const matchesSearch =
      c.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
      c.phone.includes(customerSearch) ||
      c.email.toLowerCase().includes(customerSearch.toLowerCase());
    const matchesType =
      customerTypeFilter === 'all'
        ? true
        : customerTypeFilter === 'guests'
        ? c.isGuest
        : !c.isGuest;
    return matchesSearch && matchesType;
  });

  return (
    <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-6">
      {/* Console Header Banner */}
      <div className="bg-gradient-to-r from-sky-900 via-sky-800 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-lg border border-sky-700/40">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-bold border border-amber-400/30">
              <Shield className="w-3.5 h-3.5" />
              <span>
                {isAdmin
                  ? language === 'ar' ? 'لوحة تحكم مدير المنظومة (Administrator)' : 'App Administrator Console'
                  : language === 'ar' ? 'لوحة تحكم مشرف العمليات (Operations Supervisor)' : 'Operations Supervisor Console'}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black">
              {language === 'ar' ? 'مركز القيادة والعمليات الميدانية' : 'Field Operations & Dispatch Hub'}
            </h1>
            <p className="text-xs sm:text-sm text-sky-200">
              {language === 'ar'
                ? `مرحباً بك: ${currentUser?.name} | صلاحية: ${currentUser?.role}`
                : `Welcome: ${currentUser?.name} | Role: ${currentUser?.role}`}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-3 py-1.5 rounded-xl bg-white/10 text-white text-xs font-bold border border-white/20">
              {cleaners.filter((c) => c.status === 'active').length} {language === 'ar' ? 'عاملات نشطات' : 'Active Cleaners'}
            </span>
            <span className="px-3 py-1.5 rounded-xl bg-amber-500/20 text-amber-300 text-xs font-bold border border-amber-400/30">
              {bookings.filter((b) => b.status === 'in_progress').length} {language === 'ar' ? 'قيد التنفيذ' : 'In Progress'}
            </span>
          </div>
        </div>
      </div>

      {/* Navigation Tabs Bar */}
      <div className="bg-white rounded-2xl p-2 border border-slate-200/80 shadow-xs flex items-center gap-1.5 overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveTab('matrix')}
          className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 whitespace-nowrap transition-all ${
            activeTab === 'matrix'
              ? 'bg-sky-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>{language === 'ar' ? 'جدول الحصص الأسبوعي (24 ساعة)' : '24h Timetable Matrix'}</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('staff')}
          className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 whitespace-nowrap transition-all ${
            activeTab === 'staff'
              ? 'bg-sky-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>{language === 'ar' ? 'فريق العمل والسجلات' : 'Staff Directory & Logs'}</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('customers')}
          className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 whitespace-nowrap transition-all ${
            activeTab === 'customers'
              ? 'bg-sky-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <UserCheck className="w-4 h-4" />
          <span>{language === 'ar' ? 'العملاء والمحافظ' : 'Customers & Wallets'}</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('areas')}
          className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 whitespace-nowrap transition-all ${
            activeTab === 'areas'
              ? 'bg-sky-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <MapPin className="w-4 h-4" />
          <span>{language === 'ar' ? 'المناطق وتكاليف الانتقال' : 'Service Areas & Fees'}</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('promo')}
          className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 whitespace-nowrap transition-all ${
            activeTab === 'promo'
              ? 'bg-sky-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Film className="w-4 h-4" />
          <span>{language === 'ar' ? 'الميديا الدعائية' : 'Promo Media'}</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('rewards')}
          className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 whitespace-nowrap transition-all ${
            activeTab === 'rewards'
              ? 'bg-sky-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Award className="w-4 h-4" />
          <span>{language === 'ar' ? 'سياسة المكافآت' : 'Rewards Policy'}</span>
        </button>

        <div className="w-px h-6 bg-slate-200 mx-1"></div>

        {/* USERS & SUPERVISORS TAB */}
        <button
          type="button"
          onClick={() => setActiveTab('users_manager')}
          className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-black flex items-center gap-2 whitespace-nowrap transition-all ${
            activeTab === 'users_manager'
              ? 'bg-amber-500 text-white shadow-xs'
              : 'text-amber-800 bg-amber-50 hover:bg-amber-100'
          }`}
        >
          <Lock className="w-4 h-4 text-amber-600" />
          <span>
            {language === 'ar' ? 'إدارة المستخدمين والمشرفين' : 'Users & Supervisors'}
          </span>
          {isAdmin ? (
            <span className="text-[10px] bg-amber-600 text-white px-2 py-0.5 rounded-full font-bold">
              {language === 'ar' ? 'صلاحية كاملة' : 'Admin'}
            </span>
          ) : (
            <span className="text-[10px] bg-slate-200 text-slate-700 px-2 py-0.5 rounded-full font-bold">
              {language === 'ar' ? 'استعراض' : 'View'}
            </span>
          )}
        </button>

        {/* BRAND & SOCIAL MEDIA SHARE TAB (For App Administrator & Operations Supervisor) */}
        <button
          type="button"
          onClick={() => setActiveTab('branding')}
          className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-black flex items-center gap-2 whitespace-nowrap transition-all ${
            activeTab === 'branding'
              ? 'bg-amber-500 text-white shadow-xs'
              : 'text-amber-800 bg-amber-50 hover:bg-amber-100'
          }`}
        >
          <Sparkles className="w-4 h-4 text-amber-600" />
          <span>{language === 'ar' ? 'الهوية وميديا التواصل الاجتماعي' : 'Brand & Social Share'}</span>
        </button>
      </div>

      {/* ============================================================== */}
      {/* 1. TIMETABLE MATRIX (جدول الحصص الأسبوعي 24 ساعة) */}
      {/* ============================================================== */}
      {activeTab === 'matrix' && (
        <div className="space-y-4">
          {/* Controls & Legend */}
          <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-sky-600" />
                <span>{language === 'ar' ? 'جدول الحصص الأسبوعي الميداني (24 ساعة)' : '24-Hour Weekly Timetable Matrix'}</span>
              </h2>
              <p className="text-xs text-slate-500">
                {language === 'ar'
                  ? 'مقسم إلى 12 فترة زمنية (كل فترة = ساعتان كاملتان). تظهر الفترات المشغولة باللون البرتقالي الداكن لتمييز الفراغات سريعاً.'
                  : 'Divided into 12 two-hour blocks. Busy blocks in bold amber orange.'}
              </p>
            </div>

            {/* Week navigation & legend */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2 text-xs font-bold">
                <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-600 text-white">
                  <span className="w-2 h-2 rounded-full bg-white"></span>
                  {language === 'ar' ? 'فترة محجوزة' : 'Busy / Booked'}
                </span>
                <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-sky-50 text-sky-800 border border-sky-200">
                  <span className="w-2 h-2 rounded-full bg-sky-400"></span>
                  {language === 'ar' ? 'فترة شاغرة' : 'Available'}
                </span>
              </div>

              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
                <button
                  onClick={() => setWeekOffset(weekOffset - 1)}
                  className="px-2.5 py-1 rounded-lg text-xs font-bold text-slate-700 hover:bg-white transition-colors"
                >
                  {language === 'ar' ? '← الأسبوع السابق' : '← Prev Week'}
                </button>
                <button
                  onClick={() => setWeekOffset(0)}
                  className="px-2.5 py-1 rounded-lg text-xs font-bold text-sky-700 bg-white shadow-xs"
                >
                  {language === 'ar' ? 'الأسبوع الحالي' : 'Current Week'}
                </button>
                <button
                  onClick={() => setWeekOffset(weekOffset + 1)}
                  className="px-2.5 py-1 rounded-lg text-xs font-bold text-slate-700 hover:bg-white transition-colors"
                >
                  {language === 'ar' ? 'الأسبوع القادم →' : 'Next Week →'}
                </button>
              </div>
            </div>
          </div>

          {/* Matrix Table */}
          <div className="bg-sky-50 border border-sky-200 rounded-3xl p-4 sm:p-6 shadow-sm overflow-x-auto">
            <table className="w-full min-w-[1000px] border-collapse text-xs">
              <thead>
                <tr className="border-b border-sky-200">
                  <th className="p-3 text-right font-black text-sky-950 w-44">
                    {language === 'ar' ? 'العاملة / اليوم' : 'Cleaner / Day'}
                  </th>
                  {matrixSlots.map((slot) => (
                    <th key={slot.start} className="p-2 text-center font-bold text-sky-900 border-x border-sky-200/60 min-w-[70px]">
                      {slot.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-sky-200/70">
                {cleaners.map((cleaner) => (
                  <React.Fragment key={cleaner.id}>
                    {/* Cleaner Header Row across week */}
                    <tr className="bg-sky-100/70">
                      <td colSpan={13} className="p-2.5 font-black text-sky-950 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <img
                            src={cleaner.avatarUrl}
                            alt={cleaner.name}
                            className="w-6 h-6 rounded-full object-cover border border-sky-300"
                          />
                          <span>{cleaner.name}</span>
                          <span className="text-[11px] font-normal text-sky-800">
                            ({cleaner.nationality} - ★ {cleaner.rating} - {cleaner.completedJobs} {language === 'ar' ? 'طلب' : 'jobs'})
                          </span>
                        </div>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-sky-200 text-sky-900 font-bold">
                          {language === 'ar' ? 'دوام العمل:' : 'Shift:'} {cleaner.workingHours.start} - {cleaner.workingHours.end}
                        </span>
                      </td>
                    </tr>

                    {/* 7 Days for this cleaner */}
                    {weekDays.map((day) => (
                      <tr key={`${cleaner.id}-${day.dateStr}`} className="hover:bg-sky-100/40 transition-colors">
                        <td className="p-2 font-bold text-slate-800 whitespace-nowrap bg-white/60 border-r border-sky-200">
                          <div>{language === 'ar' ? day.nameAr : day.nameEn}</div>
                          <div className="text-[10px] text-slate-400 font-mono">{day.dateStr}</div>
                        </td>

                        {/* 12 Slots */}
                        {matrixSlots.map((slot) => {
                          const booked = getSlotBooking(cleaner.id, day.dateStr, slot.start, slot.end);
                          return (
                            <td
                              key={slot.start}
                              className={`p-1.5 text-center border border-sky-200/60 transition-all ${
                                booked
                                  ? 'bg-amber-600 text-white font-bold cursor-pointer hover:bg-amber-700 shadow-inner'
                                  : 'bg-sky-50/70 text-sky-600/60 hover:bg-sky-100 cursor-pointer'
                              }`}
                              onClick={() => {
                                if (booked) setSelectedSlotBooking(booked);
                              }}
                              title={
                                booked
                                  ? `حجز #${booked.reference} - ${booked.customerName} (${booked.address.areaName})`
                                  : `${slot.label} - فترة شاغرة`
                              }
                            >
                              {booked ? (
                                <div className="text-[10px] leading-tight">
                                  <div className="font-mono text-[9px] truncate">#{booked.reference}</div>
                                  <div className="truncate text-[10px]">{booked.customerName.split(' ')[0]}</div>
                                  <div className="text-[9px] opacity-90 truncate">{booked.address.areaName.split(' ')[0]}</div>
                                </div>
                              ) : (
                                <span className="text-[9px] opacity-40">-</span>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>

          {/* Slot Booking Quick Modal */}
          {selectedSlotBooking && (
            <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
              <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-amber-500"></span>
                    <h3 className="text-base font-black text-slate-900">
                      {language === 'ar' ? 'تفاصيل الحجز بالجدول:' : 'Slot Booking Details:'} #{selectedSlotBooking.reference}
                    </h3>
                  </div>
                  <button
                    onClick={() => setSelectedSlotBooking(null)}
                    className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
                  >
                    ✕
                  </button>
                </div>

                <div className="space-y-2 text-xs text-slate-700">
                  <p><strong>{language === 'ar' ? 'العميل:' : 'Customer:'}</strong> {selectedSlotBooking.customerName}</p>
                  <p><strong>{language === 'ar' ? 'الهاتف:' : 'Phone:'}</strong> {selectedSlotBooking.customerPhone}</p>
                  <p><strong>{language === 'ar' ? 'التاريخ والوقت:' : 'Time:'}</strong> {selectedSlotBooking.date} ({selectedSlotBooking.startTime} - {selectedSlotBooking.endTime})</p>
                  <p><strong>{language === 'ar' ? 'العاملة المعتمدة:' : 'Cleaner:'}</strong> {selectedSlotBooking.cleanerName}</p>
                  <p><strong>{language === 'ar' ? 'المنطقة:' : 'Area:'}</strong> {selectedSlotBooking.address.areaName} (رسوم انتقال: {selectedSlotBooking.travelFee} د.إ)</p>
                  <p><strong>{language === 'ar' ? 'العنوان:' : 'Address:'}</strong> {selectedSlotBooking.address.building} - {selectedSlotBooking.address.apartment}</p>
                  <p><strong>{language === 'ar' ? 'الإجمالي:' : 'Total:'}</strong> {selectedSlotBooking.total} د.إ ({selectedSlotBooking.paymentMethod})</p>
                  <p><strong>{language === 'ar' ? 'الحالة:' : 'Status:'}</strong> <span className="font-bold text-sky-700">{selectedSlotBooking.status}</span></p>
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    onClick={() => setSelectedSlotBooking(null)}
                    className="px-5 py-2 rounded-xl bg-slate-900 text-white font-bold text-xs"
                  >
                    {language === 'ar' ? 'إغلاق' : 'Close'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ============================================================== */}
      {/* 2. STAFF DIRECTORY & LOGS (فريق العمل وسجلات الأداء) */}
      {/* ============================================================== */}
      {activeTab === 'staff' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm space-y-6">
          {/* Header & Export Actions */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-black text-slate-900">
                {language === 'ar' ? 'دليل كادر العاملات وسجلات العمل' : 'Staff Directory & Operations Logs'}
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                {language === 'ar'
                  ? 'متابعة تقييم وأداء العاملات وتصدير جداول وسجلات العمل باللغة العربية'
                  : 'Monitor cleaner performance, attendance logs, and export records'}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={handleExportStaffExcel}
                className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span>{language === 'ar' ? 'تصدير Excel (.xls)' : 'Export Excel'}</span>
              </button>

              <button
                onClick={handleExportStaffCsv}
                className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>{language === 'ar' ? 'تصدير CSV' : 'Export CSV'}</span>
              </button>

              <button
                onClick={() => setShowAddCleanerModal(true)}
                className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-black text-xs flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>{language === 'ar' ? 'إضافة عاملة جديدة' : 'Add New Cleaner'}</span>
              </button>
            </div>
          </div>

          {/* Search & Filter */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute top-3 right-3" />
              <input
                type="text"
                placeholder={language === 'ar' ? 'بحث باسم العاملة، الجنسية أو رقم الهاتف...' : 'Search by name, nationality or phone...'}
                value={staffSearch}
                onChange={(e) => setStaffSearch(e.target.value)}
                className="w-full pr-10 pl-4 py-2 rounded-xl border border-slate-200 text-xs focus:border-sky-500 outline-none"
              />
            </div>

            <select
              value={staffStatusFilter}
              onChange={(e) => setStaffStatusFilter(e.target.value)}
              className="px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-700 font-bold bg-white outline-none"
            >
              <option value="all">{language === 'ar' ? 'جميع الحالات' : 'All Statuses'}</option>
              <option value="active">{language === 'ar' ? 'نشطة فقط' : 'Active Only'}</option>
              <option value="on_leave">{language === 'ar' ? 'في إجازة' : 'On Leave'}</option>
            </select>
          </div>

          {/* Cleaners Table */}
          <div className="border border-slate-200 rounded-2xl overflow-x-auto">
            <table className="w-full text-xs text-right">
              <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                <tr>
                  <th className="p-3">{language === 'ar' ? 'العاملة' : 'Cleaner'}</th>
                  <th className="p-3">{language === 'ar' ? 'الهاتف' : 'Phone'}</th>
                  <th className="p-3">{language === 'ar' ? 'الجنسية' : 'Nationality'}</th>
                  <th className="p-3">{language === 'ar' ? 'التقييم' : 'Rating'}</th>
                  <th className="p-3">{language === 'ar' ? 'المهام المنجزة' : 'Jobs Done'}</th>
                  <th className="p-3">{language === 'ar' ? 'الحالة' : 'Status'}</th>
                  <th className="p-3 text-center">{language === 'ar' ? 'الإجراءات' : 'Actions'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredCleaners.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="p-3">
                      <div className="flex items-center gap-2.5">
                        <img
                          src={c.avatarUrl}
                          alt={c.name}
                          className="w-9 h-9 rounded-xl object-cover border border-slate-200"
                        />
                        <div>
                          <div className="font-black text-slate-900">{c.name}</div>
                          <div className="text-[11px] text-slate-400">{c.nameEn}</div>
                        </div>
                      </div>
                    </td>
                    <td className="p-3 font-mono font-medium">{c.phone}</td>
                    <td className="p-3 font-medium">{c.nationality}</td>
                    <td className="p-3 font-bold text-amber-500">★ {c.rating} / 5</td>
                    <td className="p-3 font-bold text-slate-800">{c.completedJobs}</td>
                    <td className="p-3">
                      <span
                        className={`inline-block px-2.5 py-1 rounded-full font-bold text-[10px] ${
                          c.status === 'active'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}
                      >
                        {c.status === 'active' ? (language === 'ar' ? 'نشطة' : 'Active') : (language === 'ar' ? 'إجازة' : 'On Leave')}
                      </span>
                    </td>
                    <td className="p-3 text-center">
                      <button
                        onClick={() => setSelectedCleanerForLog(c)}
                        className="px-3 py-1.5 rounded-xl bg-sky-50 text-sky-800 font-bold hover:bg-sky-100 transition-colors flex items-center gap-1 mx-auto"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>{language === 'ar' ? 'سجل العمل' : 'Operation Log'}</span>
                        <span className="w-4 h-4 rounded-full bg-sky-200 text-[10px] flex items-center justify-center">
                          {c.operationalLogs.length}
                        </span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Modal: Cleaner Operation Log */}
          {selectedCleanerForLog && (
            <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
              <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-2xl w-full shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                  <div className="flex items-center gap-3">
                    <img
                      src={selectedCleanerForLog.avatarUrl}
                      alt={selectedCleanerForLog.name}
                      className="w-12 h-12 rounded-2xl object-cover border"
                    />
                    <div>
                      <h3 className="text-lg font-black text-slate-900">
                        {language === 'ar' ? 'سجل العمل والأداء الميداني:' : 'Operations Log:'} {selectedCleanerForLog.name}
                      </h3>
                      <p className="text-xs text-slate-500">
                        {selectedCleanerForLog.nationality} • {selectedCleanerForLog.phone}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedCleanerForLog(null)}
                    className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600"
                  >
                    ✕
                  </button>
                </div>

                {/* Add new log entry */}
                <form onSubmit={handleAddLogSubmit} className="p-4 rounded-2xl bg-sky-50/60 border border-sky-100 space-y-3">
                  <h4 className="text-xs font-black text-sky-950">
                    {language === 'ar' ? 'إضافة مدخل جديد في سجل العمل:' : 'Add New Operation Log Entry:'}
                  </h4>

                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        {language === 'ar' ? 'التصنيف:' : 'Category:'}
                      </label>
                      <select
                        value={newLogCategory}
                        onChange={(e) => setNewLogCategory(e.target.value as any)}
                        className="w-full p-2 rounded-xl border border-slate-200 bg-white font-medium"
                      >
                        <option value="praise">{language === 'ar' ? 'إشادة وتميز' : 'Praise'}</option>
                        <option value="performance">{language === 'ar' ? 'ملاحظة أداء' : 'Performance'}</option>
                        <option value="attendance">{language === 'ar' ? 'حضور ومواعيد' : 'Attendance'}</option>
                        <option value="complaint">{language === 'ar' ? 'شكوى أو تنبيه' : 'Complaint / Alert'}</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        {language === 'ar' ? 'التقييم (1-5):' : 'Rating:'}
                      </label>
                      <select
                        value={newLogRating}
                        onChange={(e) => setNewLogRating(Number(e.target.value))}
                        className="w-full p-2 rounded-xl border border-slate-200 bg-white font-medium"
                      >
                        <option value={5}>5 ★ ممتاز</option>
                        <option value={4}>4 ★ جيد جداً</option>
                        <option value={3}>3 ★ متوسط</option>
                        <option value={2}>2 ★ يحتاج تحسين</option>
                        <option value={1}>1 ★ غير مقبول</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      {language === 'ar' ? 'نص الملاحظة أو التقرير:' : 'Log Details:'}
                    </label>
                    <textarea
                      rows={2}
                      required
                      placeholder={language === 'ar' ? 'اكتب ملاحظاتك حول التزام العاملة ومستوى النظافة...' : 'Enter feedback...'}
                      value={newLogNotes}
                      onChange={(e) => setNewLogNotes(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-slate-200 text-xs outline-none bg-white"
                    />
                  </div>

                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-sky-600 text-white font-bold text-xs shadow-xs"
                  >
                    {language === 'ar' ? 'حفظ المدخل في السجل' : 'Save Log Entry'}
                  </button>
                </form>

                {/* Existing logs list */}
                <div className="space-y-3">
                  <h4 className="text-xs font-black text-slate-800">
                    {language === 'ar' ? 'السجلات السابقة:' : 'Past Log History:'}
                  </h4>

                  {selectedCleanerForLog.operationalLogs.length > 0 ? (
                    selectedCleanerForLog.operationalLogs.map((log) => (
                      <div key={log.id} className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span
                            className={`px-2 py-0.5 rounded-md font-bold text-[10px] ${
                              log.category === 'praise'
                                ? 'bg-emerald-100 text-emerald-800'
                                : log.category === 'complaint'
                                ? 'bg-rose-100 text-rose-800'
                                : 'bg-sky-100 text-sky-800'
                            }`}
                          >
                            {log.category === 'praise'
                              ? 'إشادة'
                              : log.category === 'complaint'
                              ? 'شكوى'
                              : 'أداء'}
                          </span>
                          <span className="text-[11px] text-slate-400 font-mono">{log.date} • {log.authorName}</span>
                        </div>
                        <p className="text-slate-800 font-medium">{log.notes}</p>
                        <div className="text-amber-500 font-bold text-[11px]">★ {log.rating} / 5</div>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-slate-400 text-center py-4">
                      {language === 'ar' ? 'لا توجد مدخلات سابقة في سجل هذه العاملة.' : 'No previous log entries.'}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Modal: Add New Cleaner */}
          {showAddCleanerModal && (
            <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
              <form
                onSubmit={handleAddCleanerSubmit}
                className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl space-y-4"
              >
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h3 className="text-base font-black text-slate-900">
                    {language === 'ar' ? 'إضافة عاملة نظافة جديدة' : 'Add New Cleaner'}
                  </h3>
                  <button
                    type="button"
                    onClick={() => setShowAddCleanerModal(false)}
                    className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
                  >
                    ✕
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">الاسم بالعربية:</label>
                    <input
                      type="text"
                      required
                      value={newCleanerForm.name}
                      onChange={(e) => setNewCleanerForm({ ...newCleanerForm, name: e.target.value })}
                      className="w-full p-2.5 rounded-xl border border-slate-200 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Name in English:</label>
                    <input
                      type="text"
                      required
                      value={newCleanerForm.nameEn}
                      onChange={(e) => setNewCleanerForm({ ...newCleanerForm, nameEn: e.target.value })}
                      className="w-full p-2.5 rounded-xl border border-slate-200 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">رقم الهاتف:</label>
                    <input
                      type="tel"
                      required
                      placeholder="050 000 0000"
                      value={newCleanerForm.phone}
                      onChange={(e) => setNewCleanerForm({ ...newCleanerForm, phone: e.target.value })}
                      className="w-full p-2.5 rounded-xl border border-slate-200 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">الجنسية:</label>
                    <input
                      type="text"
                      required
                      value={newCleanerForm.nationality}
                      onChange={(e) => setNewCleanerForm({ ...newCleanerForm, nationality: e.target.value })}
                      className="w-full p-2.5 rounded-xl border border-slate-200 outline-none"
                    />
                  </div>
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowAddCleanerModal(false)}
                    className="px-4 py-2 rounded-xl border text-xs font-bold text-slate-600"
                  >
                    إلغاء
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-sky-600 text-white font-bold text-xs"
                  >
                    حفظ العاملة
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      )}

      {/* ============================================================== */}
      {/* 3. CUSTOMERS & WALLETS (العملاء والمحافظ والرصيد المعلق) */}
      {/* ============================================================== */}
      {activeTab === 'customers' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-black text-slate-900">
                {language === 'ar' ? 'إدارة العملاء والزوار والمحافظ' : 'Customers & Wallets Manager'}
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                {language === 'ar'
                  ? 'يتم تسمية الزوار تلقائياً بصيغة: عميل طلب #ALFA-XXXX - YYYY-MM-DD. يُمنع تصدير JSON للعملاء وفق السياسة.'
                  : 'Guests automatically designated as "عميل طلب #${ref} - ${date}". Strict Arabic Excel/CSV export only.'}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleExportCustomersExcel}
                className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span>{language === 'ar' ? 'تصدير Excel (.xls)' : 'Export Excel'}</span>
              </button>

              <button
                onClick={handleExportCustomersCsv}
                className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>{language === 'ar' ? 'تصدير CSV' : 'Export CSV'}</span>
              </button>
            </div>
          </div>

          {/* Search & Filter */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute top-3 right-3" />
              <input
                type="text"
                placeholder={language === 'ar' ? 'بحث باسم العميل، الهاتف، أو كود الطلب للزائر...' : 'Search customers...'}
                value={customerSearch}
                onChange={(e) => setCustomerSearch(e.target.value)}
                className="w-full pr-10 pl-4 py-2 rounded-xl border border-slate-200 text-xs focus:border-sky-500 outline-none"
              />
            </div>

            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-bold">
              <button
                onClick={() => setCustomerTypeFilter('all')}
                className={`px-3 py-1.5 rounded-lg transition-colors ${
                  customerTypeFilter === 'all' ? 'bg-white text-sky-700 shadow-xs' : 'text-slate-600'
                }`}
              >
                {language === 'ar' ? 'الكل' : 'All'}
              </button>
              <button
                onClick={() => setCustomerTypeFilter('registered')}
                className={`px-3 py-1.5 rounded-lg transition-colors ${
                  customerTypeFilter === 'registered' ? 'bg-white text-sky-700 shadow-xs' : 'text-slate-600'
                }`}
              >
                {language === 'ar' ? 'المسجلون' : 'Registered'}
              </button>
              <button
                onClick={() => setCustomerTypeFilter('guests')}
                className={`px-3 py-1.5 rounded-lg transition-colors ${
                  customerTypeFilter === 'guests' ? 'bg-white text-sky-700 shadow-xs' : 'text-slate-600'
                }`}
              >
                {language === 'ar' ? 'حجوزات الزوار' : 'Guests'}
              </button>
            </div>
          </div>

          {/* Customers Table */}
          <div className="border border-slate-200 rounded-2xl overflow-x-auto">
            <table className="w-full text-xs text-right">
              <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                <tr>
                  <th className="p-3">{language === 'ar' ? 'العميل' : 'Customer'}</th>
                  <th className="p-3">{language === 'ar' ? 'الهاتف' : 'Phone'}</th>
                  <th className="p-3">{language === 'ar' ? 'المحفظة' : 'Wallet'}</th>
                  <th className="p-3">{language === 'ar' ? 'النقاط' : 'Points'}</th>
                  <th className="p-3">{language === 'ar' ? 'الهدية المعلقة' : 'Pending Gift'}</th>
                  <th className="p-3">{language === 'ar' ? 'حالة الحساب' : 'Account Status'}</th>
                  <th className="p-3 text-center">{language === 'ar' ? 'التحكم والمحفظة' : 'Manage'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredCustomers.map((cust) => (
                  <tr key={cust.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="p-3">
                      <div className="font-bold text-slate-900">{cust.name}</div>
                      <div className="text-[11px] text-slate-400">
                        {cust.isGuest ? (
                          <span className="text-amber-600 font-semibold">
                            {language === 'ar' ? 'حجز زائر غير مسجل' : 'Guest Booking'}
                          </span>
                        ) : (
                          cust.email
                        )}
                      </div>
                    </td>
                    <td className="p-3 font-mono">{cust.phone}</td>
                    <td className="p-3 font-bold text-sky-700">{cust.walletBalance} د.إ</td>
                    <td className="p-3 font-bold text-amber-500">{cust.points} نقطة</td>
                    <td className="p-3">
                      {cust.pendingRewardBonus > 0 ? (
                        <div className="flex items-center gap-1.5">
                          <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 font-bold text-[10px] animate-pulse">
                            +{cust.pendingRewardBonus} د.إ معلق
                          </span>
                          <button
                            onClick={() => approveCustomerBonus(cust.id)}
                            title={language === 'ar' ? 'اعتماد الرصيد فوراً' : 'Approve Bonus Now'}
                            className="p-1 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition-colors"
                          >
                            <Check className="w-3 h-3" />
                          </button>
                        </div>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>
                    <td className="p-3">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          cust.isSuspended
                            ? 'bg-rose-100 text-rose-800 border border-rose-200'
                            : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        }`}
                      >
                        {cust.isSuspended ? (language === 'ar' ? 'معلق (ممنوع الحجز)' : 'Suspended') : (language === 'ar' ? 'نشط' : 'Active')}
                      </span>
                    </td>
                    <td className="p-3">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => setSelectedCustomerForWallet(cust)}
                          title={language === 'ar' ? 'تعديل رصيد المحفظة (+ / -)' : 'Adjust Wallet'}
                          className="px-2.5 py-1 rounded-xl bg-amber-50 text-amber-800 font-bold hover:bg-amber-100 text-[11px] flex items-center gap-1"
                        >
                          <DollarSign className="w-3 h-3" />
                          <span>{language === 'ar' ? 'المحفظة' : 'Wallet'}</span>
                        </button>

                        <button
                          onClick={() => toggleCustomerSuspension(cust.id)}
                          title={cust.isSuspended ? 'تنشيط الحساب' : 'تعليق الحساب لمنع الحجز'}
                          className={`p-1.5 rounded-xl border transition-colors ${
                            cust.isSuspended
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                              : 'bg-rose-50 text-rose-700 border-rose-300'
                          }`}
                        >
                          <Ban className="w-3.5 h-3.5" />
                        </button>

                        {!cust.isGuest && (
                          <button
                            onClick={() => {
                              setSelectedCustomerForPass(cust);
                              setNewPassInput('');
                            }}
                            title={language === 'ar' ? 'إعادة تعيين كلمة المرور' : 'Reset Password'}
                            className="p-1.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100"
                          >
                            <Lock className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Modal: Adjust Wallet Balance */}
          {selectedCustomerForWallet && (
            <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
              <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h3 className="text-base font-black text-slate-900">
                    {language === 'ar' ? 'التحكم بمحفظة العميل:' : 'Adjust Wallet Balance:'} {selectedCustomerForWallet.name}
                  </h3>
                  <button
                    onClick={() => setSelectedCustomerForWallet(null)}
                    className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
                  >
                    ✕
                  </button>
                </div>

                <div className="p-3 rounded-2xl bg-slate-50 border text-xs text-slate-700">
                  {language === 'ar' ? 'الرصيد الحالي:' : 'Current Balance:'}{' '}
                  <strong className="text-sky-700 text-sm font-black">{selectedCustomerForWallet.walletBalance} د.إ</strong>
                </div>

                <div className="space-y-3 text-xs">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      {language === 'ar' ? 'قيمة التعديل (درهم): استخدم قيمة سالبة للخصم' : 'Amount in AED (negative to deduct):'}
                    </label>
                    <input
                      type="number"
                      value={walletDelta}
                      onChange={(e) => setWalletDelta(Number(e.target.value))}
                      className="w-full p-2.5 rounded-xl border border-slate-300 font-bold outline-none text-slate-800"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      {language === 'ar' ? 'سبب الإيداع / الخصم المعتمد في السجل:' : 'Reason / Note:'}
                    </label>
                    <input
                      type="text"
                      required
                      value={walletReason}
                      onChange={(e) => setWalletReason(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-slate-300 outline-none text-slate-800"
                    />
                  </div>
                </div>

                <div className="pt-3 flex justify-end gap-2">
                  <button
                    onClick={() => setSelectedCustomerForWallet(null)}
                    className="px-4 py-2 rounded-xl border text-xs font-bold text-slate-600"
                  >
                    إلغاء
                  </button>
                  <button
                    onClick={() => {
                      adjustCustomerWallet(selectedCustomerForWallet.id, walletDelta, walletReason);
                      setSelectedCustomerForWallet(null);
                    }}
                    className="px-5 py-2 rounded-xl bg-sky-600 text-white font-black text-xs"
                  >
                    تطبيق التعديل
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Modal: Reset Password */}
          {selectedCustomerForPass && (
            <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
              <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h3 className="text-base font-black text-slate-900">
                    {language === 'ar' ? 'إعادة تعيين كلمة مرور:' : 'Reset Password:'} {selectedCustomerForPass.name}
                  </h3>
                  <button
                    onClick={() => setSelectedCustomerForPass(null)}
                    className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
                  >
                    ✕
                  </button>
                </div>

                <div className="space-y-3 text-xs">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      {language === 'ar' ? 'كلمة المرور الجديدة:' : 'New Password:'}
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. AlfaNewPass2026"
                      value={newPassInput}
                      onChange={(e) => setNewPassInput(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-slate-300 font-mono outline-none"
                    />
                  </div>
                </div>

                <div className="pt-3 flex justify-end gap-2">
                  <button
                    onClick={() => setSelectedCustomerForPass(null)}
                    className="px-4 py-2 rounded-xl border text-xs font-bold text-slate-600"
                  >
                    إلغاء
                  </button>
                  <button
                    onClick={() => {
                      if (newPassInput.trim()) {
                        resetCustomerPassword(selectedCustomerForPass.id, newPassInput.trim());
                        setSelectedCustomerForPass(null);
                      }
                    }}
                    className="px-5 py-2 rounded-xl bg-slate-900 text-white font-bold text-xs"
                  >
                    حفظ كلمة المرور
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ============================================================== */}
      {/* 4. SERVICE AREAS & TRAVEL FEES (المناطق وتكاليف الانتقال) */}
      {/* ============================================================== */}
      {activeTab === 'areas' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-black text-slate-900">
                {language === 'ar' ? 'مناطق التغطية وتكاليف الانتقال في أبوظبي' : 'Abu Dhabi Service Areas & Travel Fees'}
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                {language === 'ar'
                  ? 'تحديد تكلفة الانتقال بالدرهم لكل منطقة سكنية في إمارة أبوظبي (مع دعم 0 د.إ للانتقال المجاني)'
                  : 'Manage travel fees in AED per residential zone (0 AED supported for free delivery)'}
              </p>
            </div>

            <button
              onClick={() => setShowAddAreaModal(true)}
              className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-black text-xs flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>{language === 'ar' ? 'إضافة منطقة جديدة' : 'Add New Area'}</span>
            </button>
          </div>

          <div className="border border-slate-200 rounded-2xl overflow-x-auto">
            <table className="w-full text-xs text-right">
              <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                <tr>
                  <th className="p-3">{language === 'ar' ? 'المنطقة بالعربية' : 'Area Ar'}</th>
                  <th className="p-3">{language === 'ar' ? 'الاسم بالإنجليزية' : 'Area En'}</th>
                  <th className="p-3">{language === 'ar' ? 'القطاع' : 'Zone'}</th>
                  <th className="p-3">{language === 'ar' ? 'تكلفة الانتقال (د.إ)' : 'Travel Fee (AED)'}</th>
                  <th className="p-3">{language === 'ar' ? 'التفعيل' : 'Active'}</th>
                  <th className="p-3 text-center">{language === 'ar' ? 'حفظ التعديل' : 'Update'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {serviceAreas.map((area) => (
                  <tr key={area.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="p-3 font-bold text-slate-900">{area.nameAr}</td>
                    <td className="p-3 font-medium text-slate-600">{area.nameEn}</td>
                    <td className="p-3 text-slate-500">{area.zone}</td>
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min={0}
                          defaultValue={area.travelFee}
                          id={`fee-${area.id}`}
                          className="w-20 p-1.5 rounded-lg border border-slate-300 font-bold text-center text-xs outline-none"
                        />
                        <span className="text-[11px] text-slate-400">د.إ</span>
                      </div>
                    </td>
                    <td className="p-3">
                      <label className="inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          defaultChecked={area.isActive}
                          id={`active-${area.id}`}
                          className="w-4 h-4 rounded text-sky-600"
                        />
                        <span className="mr-2 text-[11px] text-slate-600">
                          {area.isActive ? (language === 'ar' ? 'مفعلة' : 'Active') : (language === 'ar' ? 'معطلة' : 'Disabled')}
                        </span>
                      </label>
                    </td>
                    <td className="p-3 text-center">
                      <button
                        onClick={() => {
                          const feeInput = document.getElementById(`fee-${area.id}`) as HTMLInputElement;
                          const activeInput = document.getElementById(`active-${area.id}`) as HTMLInputElement;
                          if (feeInput) {
                            updateServiceAreaFee(
                              area.id,
                              Number(feeInput.value),
                              activeInput ? activeInput.checked : true
                            );
                            alert(language === 'ar' ? 'تم تحديث تكلفة الانتقال بنجاح' : 'Area updated successfully');
                          }
                        }}
                        className="px-3 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-[11px] transition-colors"
                      >
                        {language === 'ar' ? 'تحديث' : 'Save'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Modal: Add Area */}
          {showAddAreaModal && (
            <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
              <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h3 className="text-base font-black text-slate-900">
                    {language === 'ar' ? 'إضافة منطقة سكنية جديدة' : 'Add New Service Area'}
                  </h3>
                  <button
                    onClick={() => setShowAddAreaModal(false)}
                    className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
                  >
                    ✕
                  </button>
                </div>

                <div className="space-y-3 text-xs">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">الاسم بالعربية:</label>
                    <input
                      type="text"
                      required
                      placeholder="مثال: جزيرة الحديريات"
                      value={newAreaForm.nameAr}
                      onChange={(e) => setNewAreaForm({ ...newAreaForm, nameAr: e.target.value })}
                      className="w-full p-2.5 rounded-xl border border-slate-300 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Name in English:</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Al Hudayriat Island"
                      value={newAreaForm.nameEn}
                      onChange={(e) => setNewAreaForm({ ...newAreaForm, nameEn: e.target.value })}
                      className="w-full p-2.5 rounded-xl border border-slate-300 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">تكلفة الانتقال (درهم):</label>
                    <input
                      type="number"
                      min={0}
                      value={newAreaForm.travelFee}
                      onChange={(e) => setNewAreaForm({ ...newAreaForm, travelFee: Number(e.target.value) })}
                      className="w-full p-2.5 rounded-xl border border-slate-300 outline-none font-bold"
                    />
                  </div>
                </div>

                <div className="pt-3 flex justify-end gap-2">
                  <button
                    onClick={() => setShowAddAreaModal(false)}
                    className="px-4 py-2 rounded-xl border text-xs font-bold text-slate-600"
                  >
                    إلغاء
                  </button>
                  <button
                    onClick={() => {
                      if (newAreaForm.nameAr.trim()) {
                        addServiceArea(newAreaForm);
                        setShowAddAreaModal(false);
                      }
                    }}
                    className="px-5 py-2 rounded-xl bg-sky-600 text-white font-bold text-xs"
                  >
                    إضافة المنطقة
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ============================================================== */}
      {/* 5. PROMO MEDIA SETTINGS (الميديا الدعائية بالصفحة الرئيسية) */}
      {/* ============================================================== */}
      {activeTab === 'promo' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h2 className="text-xl font-black text-slate-900">
              {language === 'ar' ? 'إعدادات الميديا الدعائية بالصفحة الرئيسية' : 'Homepage Promo Media Settings'}
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              {language === 'ar'
                ? 'التحكم في ظهور أو إخفاء البانر الدعائي، اختيار الفيديو أو الصورة، وتعديل النصوص وروابط الـ CTA'
                : 'Configure homepage promo banner, media type (video/image), URLs, titles, and CTA'}
            </p>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              updatePromoMedia(promoForm);
              alert(language === 'ar' ? 'تم حفظ إعدادات الميديا الترويجية بنجاح' : 'Promo settings updated');
            }}
            className="space-y-5 text-xs max-w-3xl"
          >
            {/* Toggle Enable */}
            <div className="p-4 rounded-2xl bg-sky-50 border border-sky-100 flex items-center justify-between">
              <div>
                <span className="font-black text-sky-950 block text-sm">
                  {language === 'ar' ? 'ظهور البانر الترويجي بالصفحة الرئيسية' : 'Display Promo Banner'}
                </span>
                <span className="text-slate-500 text-[11px]">
                  {language === 'ar' ? 'تفعيل أو تعطيل قسم العرض المرئي الترويجي في واجهة العملاء' : 'Toggle promotional video/image section on homepage'}
                </span>
              </div>
              <input
                type="checkbox"
                checked={promoForm.isEnabled}
                onChange={(e) => setPromoForm({ ...promoForm, isEnabled: e.target.checked })}
                className="w-5 h-5 rounded text-sky-600"
              />
            </div>

            {/* Media Type */}
            <div>
              <label className="block font-bold text-slate-700 mb-2">نوع العرض المرئي:</label>
              <div className="grid grid-cols-2 gap-3">
                <label
                  className={`p-3 rounded-2xl border flex items-center gap-2 cursor-pointer ${
                    promoForm.mediaType === 'video' ? 'border-sky-600 bg-sky-50 text-sky-900 font-bold' : 'border-slate-200'
                  }`}
                >
                  <input
                    type="radio"
                    name="mediaType"
                    checked={promoForm.mediaType === 'video'}
                    onChange={() => setPromoForm({ ...promoForm, mediaType: 'video' })}
                  />
                  <span>{language === 'ar' ? 'فيديو تفاعلي (YouTube / MP4)' : 'Interactive Video'}</span>
                </label>

                <label
                  className={`p-3 rounded-2xl border flex items-center gap-2 cursor-pointer ${
                    promoForm.mediaType === 'image' ? 'border-sky-600 bg-sky-50 text-sky-900 font-bold' : 'border-slate-200'
                  }`}
                >
                  <input
                    type="radio"
                    name="mediaType"
                    checked={promoForm.mediaType === 'image'}
                    onChange={() => setPromoForm({ ...promoForm, mediaType: 'image' })}
                  />
                  <span>{language === 'ar' ? 'صورة دعائية عالية الجودة' : 'High-Res Image'}</span>
                </label>
              </div>
            </div>

            {/* Media URL */}
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                {language === 'ar' ? 'رابط الميديا الخارجي (رابط يوتيوب أو فيديو مباشر أو صورة):' : 'Media URL (YouTube or direct MP4/image):'}
              </label>
              <input
                type="url"
                required
                value={promoForm.mediaUrl}
                onChange={(e) => setPromoForm({ ...promoForm, mediaUrl: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-slate-300 font-mono outline-none"
              />
            </div>

            {/* Titles AR & EN */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-bold text-slate-700 mb-1">العنوان الرئيسي (بالعربية):</label>
                <input
                  type="text"
                  required
                  value={promoForm.titleAr}
                  onChange={(e) => setPromoForm({ ...promoForm, titleAr: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-300 outline-none font-bold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Title in English:</label>
                <input
                  type="text"
                  required
                  value={promoForm.titleEn}
                  onChange={(e) => setPromoForm({ ...promoForm, titleEn: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-300 outline-none font-bold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">الوصف الترويجي (بالعربية):</label>
                <textarea
                  rows={2}
                  value={promoForm.subtitleAr}
                  onChange={(e) => setPromoForm({ ...promoForm, subtitleAr: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-300 outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Subtitle in English:</label>
                <textarea
                  rows={2}
                  value={promoForm.subtitleEn}
                  onChange={(e) => setPromoForm({ ...promoForm, subtitleEn: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-300 outline-none"
                />
              </div>
            </div>

            {/* CTA Button */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">نص زر الـ CTA بالعربية:</label>
                <input
                  type="text"
                  value={promoForm.ctaTextAr}
                  onChange={(e) => setPromoForm({ ...promoForm, ctaTextAr: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-300 outline-none font-bold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">CTA Text English:</label>
                <input
                  type="text"
                  value={promoForm.ctaTextEn}
                  onChange={(e) => setPromoForm({ ...promoForm, ctaTextEn: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-300 outline-none font-bold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">رابط زر الـ CTA:</label>
                <input
                  type="text"
                  value={promoForm.ctaLink}
                  onChange={(e) => setPromoForm({ ...promoForm, ctaLink: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-300 outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs flex items-center gap-2 shadow-xs cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>{language === 'ar' ? 'حفظ إعدادات الميديا' : 'Save Promo Settings'}</span>
            </button>
          </form>
        </div>
      )}

      {/* ============================================================== */}
      {/* 6. REWARDS POLICY SETTINGS (سياسة المكافآت والنقاط) */}
      {/* ============================================================== */}
      {activeTab === 'rewards' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h2 className="text-xl font-black text-slate-900">
              {language === 'ar' ? 'إعدادات سياسة المكافآت والنقاط الذكية' : 'Smart Rewards Policy Settings'}
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              {language === 'ar'
                ? 'تحديد معدل احتساب النقاط لكل درهم منفق، معدل تحويل النقاط لرصيد محفظة، واشتراط موافقة المشرف على رصيد الهدية'
                : 'Configure points per AED spent, wallet conversion rate, and supervisor approval on bonuses'}
            </p>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              updateRewardsPolicy(rewardsForm);
              alert(language === 'ar' ? 'تم حفظ سياسة المكافآت بنجاح' : 'Rewards policy updated');
            }}
            className="space-y-5 text-xs max-w-2xl"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  {language === 'ar' ? 'نقاط المكافأة لكل 1 درهم منفق:' : 'Points earned per 1 AED spent:'}
                </label>
                <input
                  type="number"
                  min={1}
                  value={rewardsForm.pointsPerAed}
                  onChange={(e) => setRewardsForm({ ...rewardsForm, pointsPerAed: Number(e.target.value) })}
                  className="w-full p-2.5 rounded-xl border border-slate-300 font-bold outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  {language === 'ar' ? 'معدل تحويل النقطة لرصيد محفظة (د.إ):' : 'Point redemption rate to AED:'}
                </label>
                <input
                  type="number"
                  step="0.01"
                  min={0.01}
                  value={rewardsForm.redemptionRate}
                  onChange={(e) => setRewardsForm({ ...rewardsForm, redemptionRate: Number(e.target.value) })}
                  className="w-full p-2.5 rounded-xl border border-slate-300 font-bold outline-none"
                />
                <span className="text-[10px] text-slate-400 mt-0.5 block">
                  (0.10 تعني 100 نقطة = 10 دراهم في المحفظة)
                </span>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  {language === 'ar' ? 'صلاحية النقاط بالأيام:' : 'Points validity (days):'}
                </label>
                <input
                  type="number"
                  min={30}
                  value={rewardsForm.validityDays}
                  onChange={(e) => setRewardsForm({ ...rewardsForm, validityDays: Number(e.target.value) })}
                  className="w-full p-2.5 rounded-xl border border-slate-300 font-bold outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  {language === 'ar' ? 'رصيد هدية الترحيب للعميل الجديد (د.إ):' : 'Welcome gift balance (AED):'}
                </label>
                <input
                  type="number"
                  min={0}
                  value={rewardsForm.welcomeBonusWalletAed}
                  onChange={(e) => setRewardsForm({ ...rewardsForm, welcomeBonusWalletAed: Number(e.target.value) })}
                  className="w-full p-2.5 rounded-xl border border-slate-300 font-bold outline-none"
                />
              </div>
            </div>

            {/* Toggle Lucky Wheel of Fortune */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-300 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-base">🎡</span>
                  <span className="font-black text-amber-950 block text-sm">
                    {language === 'ar' ? 'تفعيل عجلة الحظ التفاعلية في منتصف الواجهة' : 'Activate Centered Lucky Wheel in UI'}
                  </span>
                </div>
                <span className="text-amber-800 text-[11px] block mt-0.5">
                  {language === 'ar'
                    ? 'عرض عجلة الحظ في منتصف واجهة التطبيق أفقياً ورأسياً على كافة أبعاد الأجهزة (أندرويد، iOS، أجهزة لوحية، وحواسيب) لتقديم هدايا وخصومات فورية'
                    : 'Display centered Lucky Wheel across all mobile, tablet, and desktop viewports to give instant discounts and prizes'}
                </span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer shrink-0 ms-3">
                <input
                  type="checkbox"
                  checked={Boolean(rewardsForm.isWheelActive)}
                  onChange={(e) => setRewardsForm({ ...rewardsForm, isWheelActive: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
              </label>
            </div>

            {/* Toggle supervisor approval requirement */}
            <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200 flex items-center justify-between">
              <div>
                <span className="font-black text-amber-950 block text-sm">
                  {language === 'ar' ? 'اشتراط موافقة المشرف على رصيد الهدية الترحيبي' : 'Require Supervisor Approval for Welcome Bonus'}
                </span>
                <span className="text-amber-800 text-[11px]">
                  {language === 'ar'
                    ? 'عند تفعيل الخيار يوضع الرصيد كـ pendingRewardBonus حتى يعتمده المشرف بنقرة واحدة'
                    : 'Bonus remains pending until supervisor reviews and clicks approve'}
                </span>
              </div>
              <input
                type="checkbox"
                checked={rewardsForm.requireSupervisorApproval}
                onChange={(e) => setRewardsForm({ ...rewardsForm, requireSupervisorApproval: e.target.checked })}
                className="w-5 h-5 rounded text-amber-600"
              />
            </div>

            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs flex items-center gap-2 shadow-xs cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>{language === 'ar' ? 'حفظ سياسة المكافآت' : 'Save Policy'}</span>
            </button>
          </form>
        </div>
      )}

      {/* ============================================================== */}
      {/* 7. USERS & SUPERVISORS MANAGER (إدارة المستخدمين والمشرفين) */}
      {/* ============================================================== */}
      {activeTab === 'users_manager' && (
        <ErrorBoundary fallbackTitleAr="لوحة إدارة المستخدمين والمشرفين">
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-amber-200/80 shadow-sm space-y-6">
          {/* Header & Role Distinction */}
          <div className="border-b border-amber-100 pb-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 text-amber-800 text-xs font-bold mb-1.5">
                <Lock className="w-3.5 h-3.5 text-amber-600" />
                <span>
                  {isAdmin
                    ? (language === 'ar' ? 'صلاحية كاملة لمدير المنظومة (Admin)' : 'Full Admin Authority')
                    : (language === 'ar' ? 'استعراض الحسابات (مشرف العمليات)' : 'Viewer Mode (Supervisor)')}
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900">
                {language === 'ar' ? 'إدارة المستخدمين والمشرفين وكادر النظام' : 'Users & Supervisors Management'}
              </h2>
              <p className="text-xs text-slate-500 mt-1 max-w-2xl">
                {language === 'ar'
                  ? 'مراجعة وتعديل بيانات كافة مستخدمي المنظومة، كلمات المرور، أرقام الهواتف، رتب الصلاحيات وحالات الحسابات بلا استثناء.'
                  : 'Manage credentials, passwords, phones, roles, and suspension states of all system users.'}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {!isAdmin ? (
                <button
                  type="button"
                  onClick={() => {
                    login('alfacleanmaster@gmail.com', 'AlfaClean2026Master!', true);
                    setUserToast({ text: language === 'ar' ? 'تم التبديل إلى حساب مدير النظام بنجاح' : 'Switched to Admin account', type: 'success' });
                    setTimeout(() => setUserToast(null), 3000);
                  }}
                  className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs flex items-center gap-2 shadow-sm transition-all cursor-pointer"
                >
                  <Key className="w-4 h-4" />
                  <span>{language === 'ar' ? 'التبديل لحساب مدير النظام لتعديل الصلاحيات' : 'Switch to Admin Account'}</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowAddUserModal(true)}
                  className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs flex items-center gap-2 shadow-sm transition-all cursor-pointer"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>{language === 'ar' ? 'إضافة مستخدم / مشرف جديد' : 'Add New User / Supervisor'}</span>
                </button>
              )}
            </div>
          </div>

          {/* Toast Notification */}
          {userToast && (
            <div
              className={`p-3.5 rounded-2xl text-xs font-bold flex items-center gap-2 transition-all ${
                userToast.type === 'success'
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : 'bg-rose-50 text-rose-800 border border-rose-200'
              }`}
            >
              {userToast.type === 'success' ? (
                <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              )}
              <span>{userToast.text}</span>
            </div>
          )}

          {/* Supervisor Information Box */}
          {!isAdmin && (
            <div className="p-4 rounded-2xl bg-sky-50 border border-sky-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-sky-900">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-sky-600 shrink-0" />
                <span>
                  {language === 'ar'
                    ? 'أنت متصل حالياً كـ مشرف العمليات (Supervisor): يتيح لك النظام استعراض الكادر والمستخدمين؛ بينما تعديل كلمات المرور أو حذف الحسابات وتعيين المشرفين مخصص لمدير النظام.'
                    : 'Logged in as Supervisor: User viewing is allowed. Modifications & password resets require Admin login.'}
                </span>
              </div>
            </div>
          )}

          {/* Quick Statistics KPI Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-center">
              <span className="text-[10px] text-slate-500 font-bold block">{language === 'ar' ? 'إجمالي الحسابات' : 'Total Users'}</span>
              <span className="text-xl font-black text-slate-900">{(users || []).length}</span>
            </div>
            <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-center">
              <span className="text-[10px] text-amber-700 font-bold block">{language === 'ar' ? 'المدراء (Admin)' : 'Admins'}</span>
              <span className="text-xl font-black text-amber-800">{(users || []).filter(u => u?.role === 'admin').length}</span>
            </div>
            <div className="p-3.5 rounded-2xl bg-sky-50 border border-sky-200 text-center">
              <span className="text-[10px] text-sky-700 font-bold block">{language === 'ar' ? 'مشرفو العمليات' : 'Supervisors'}</span>
              <span className="text-xl font-black text-sky-800">{(users || []).filter(u => u?.role === 'supervisor').length}</span>
            </div>
            <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-center">
              <span className="text-[10px] text-emerald-700 font-bold block">{language === 'ar' ? 'العاملات' : 'Cleaners'}</span>
              <span className="text-xl font-black text-emerald-800">{(users || []).filter(u => u?.role === 'cleaner').length}</span>
            </div>
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-center">
              <span className="text-[10px] text-slate-500 font-bold block">{language === 'ar' ? 'العملاء' : 'Customers'}</span>
              <span className="text-xl font-black text-slate-700">{(users || []).filter(u => u?.role === 'customer').length}</span>
            </div>
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-center">
              <span className="text-[10px] text-rose-700 font-bold block">{language === 'ar' ? 'الحسابات المعلقة' : 'Suspended'}</span>
              <span className="text-xl font-black text-rose-800">{(users || []).filter(u => u?.status === 'suspended').length}</span>
            </div>
          </div>

          {/* Search & Filters Bar */}
          <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute top-3 right-3" />
              <input
                type="text"
                placeholder={language === 'ar' ? 'بحث بالاسم، اسم المستخدم، البريد، أو رقم الهاتف...' : 'Search by name, email, phone, or username...'}
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                className="w-full pr-10 pl-4 py-2.5 rounded-xl border border-slate-200 text-xs focus:border-amber-500 outline-none"
              />
            </div>

            {/* Role Filter */}
            <select
              value={userRoleFilter}
              onChange={(e) => setUserRoleFilter(e.target.value)}
              className="px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 bg-white outline-none"
            >
              <option value="all">{language === 'ar' ? 'كافة الرتب والصلاحيات' : 'All Roles'}</option>
              <option value="admin">{language === 'ar' ? 'مدير المنظومة (Admin)' : 'Admin'}</option>
              <option value="supervisor">{language === 'ar' ? 'مشرف العمليات (Supervisor)' : 'Supervisor'}</option>
              <option value="cleaner">{language === 'ar' ? 'كادر العاملات (Cleaner)' : 'Cleaner'}</option>
              <option value="customer">{language === 'ar' ? 'العملاء (Customer)' : 'Customer'}</option>
            </select>

            {/* Status Filter */}
            <select
              value={userStatusFilter}
              onChange={(e) => setUserStatusFilter(e.target.value)}
              className="px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 bg-white outline-none"
            >
              <option value="all">{language === 'ar' ? 'كافة الحالات' : 'All Statuses'}</option>
              <option value="active">{language === 'ar' ? 'نشط فقط' : 'Active Only'}</option>
              <option value="suspended">{language === 'ar' ? 'معلق فقط' : 'Suspended Only'}</option>
            </select>
          </div>

          {/* Users Table */}
          <div className="border border-slate-200 rounded-2xl overflow-x-auto shadow-2xs">
            <table className="w-full text-xs text-right">
              <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                <tr>
                  <th className="p-3.5">{language === 'ar' ? 'المستخدم' : 'User'}</th>
                  <th className="p-3.5">{language === 'ar' ? 'اسم المستخدم / البريد' : 'Username / Email'}</th>
                  <th className="p-3.5">{language === 'ar' ? 'رقم الهاتف' : 'Phone'}</th>
                  <th className="p-3.5">{language === 'ar' ? 'كلمة المرور' : 'Password'}</th>
                  <th className="p-3.5">{language === 'ar' ? 'الرتبة والصلاحية' : 'Role'}</th>
                  <th className="p-3.5">{language === 'ar' ? 'الحالة' : 'Status'}</th>
                  <th className="p-3.5 text-center">{language === 'ar' ? 'الإجراءات والتحكم' : 'Actions'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(users || [])
                  .filter((u) => {
                    if (!u) return false;
                    const q = (userSearch || '').toLowerCase().trim();
                    const name = (u.name || '').toLowerCase();
                    const email = (u.email || '').toLowerCase();
                    const username = (u.username || '').toLowerCase();
                    const phone = (u.phone || '').replace(/\s+/g, '');
                    const cleanQ = q.replace(/\s+/g, '');

                    const matchesSearch =
                      !q ||
                      name.includes(q) ||
                      email.includes(q) ||
                      username.includes(q) ||
                      (cleanQ ? phone.includes(cleanQ) : false);

                    const matchesRole = userRoleFilter === 'all' || u.role === userRoleFilter;
                    const matchesStatus = userStatusFilter === 'all' || u.status === userStatusFilter;
                    return matchesSearch && matchesRole && matchesStatus;
                  })
                  .map((u) => {
                    if (!u) return null;
                    const isRootAdmin = (u.email || '') === 'alfacleanmaster@gmail.com' || u.id === 'user-admin';
                    const isPasswordVisible = !!visiblePasswords[u.id];

                    return (
                      <tr key={u.id} className="hover:bg-amber-50/20 transition-colors">
                        {/* Name & Badge */}
                        <td className="p-3.5">
                          <div className="flex items-center gap-2.5">
                            <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs ${
                              u.role === 'admin'
                                ? 'bg-amber-100 text-amber-800'
                                : u.role === 'supervisor'
                                ? 'bg-sky-100 text-sky-800'
                                : u.role === 'cleaner'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-slate-100 text-slate-700'
                            }`}>
                              {u.role === 'admin' ? '👑' : u.role === 'supervisor' ? '🛡️' : u.role === 'cleaner' ? '🧹' : '👤'}
                            </div>
                            <div>
                              <div className="font-black text-slate-900 flex items-center gap-1.5">
                                <span>{u.name || 'بدون اسم'}</span>
                                {isRootAdmin && (
                                  <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-amber-500 text-slate-950 font-black">
                                    {language === 'ar' ? 'الرئيسي' : 'Root'}
                                  </span>
                                )}
                              </div>
                              <div className="text-[11px] text-slate-400 font-mono">ID: {u.id}</div>
                            </div>
                          </div>
                        </td>

                        {/* Username & Email */}
                        <td className="p-3.5 font-mono">
                          <div className="text-slate-800 font-bold">{u.username || u.email || '—'}</div>
                          <div className="text-[11px] text-slate-400">{u.email || '—'}</div>
                        </td>

                        {/* Phone */}
                        <td className="p-3.5 font-mono text-slate-700 font-medium whitespace-nowrap">
                          {u.phone || '—'}
                        </td>

                        {/* Password with View & Copy */}
                        <td className="p-3.5 font-mono">
                          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-xl max-w-fit">
                            <span className="text-slate-700 font-bold">
                              {isPasswordVisible ? (u.password || 'cleaner123') : '••••••••'}
                            </span>
                            <button
                              type="button"
                              onClick={() => setVisiblePasswords(prev => ({ ...prev, [u.id]: !prev[u.id] }))}
                              className="text-slate-400 hover:text-slate-700 p-0.5"
                              title={isPasswordVisible ? 'إخفاء' : 'إظهار'}
                            >
                              {isPasswordVisible ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                            </button>
                            <button
                              type="button"
                              onClick={async () => {
                                try {
                                  if (navigator?.clipboard?.writeText) {
                                    await navigator.clipboard.writeText(u.password || '');
                                  }
                                  setCopiedPassId(u.id);
                                  setTimeout(() => setCopiedPassId(null), 2000);
                                } catch (err) {
                                  console.warn('Clipboard write failed:', err);
                                }
                              }}
                              className="text-slate-400 hover:text-amber-600 p-0.5"
                              title="نسخ كلمة المرور"
                            >
                              {copiedPassId === u.id ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                            </button>
                          </div>
                        </td>

                        {/* Role */}
                        <td className="p-3.5">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-[11px] font-black ${
                              u.role === 'admin'
                                ? 'bg-amber-100 text-amber-900 border border-amber-300'
                                : u.role === 'supervisor'
                                ? 'bg-sky-100 text-sky-900 border border-sky-300'
                                : u.role === 'cleaner'
                                ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                                : 'bg-slate-100 text-slate-800 border border-slate-200'
                            }`}
                          >
                            <span>
                              {u.role === 'admin'
                                ? (language === 'ar' ? 'مدير المنظومة' : 'Admin')
                                : u.role === 'supervisor'
                                ? (language === 'ar' ? 'مشرف العمليات' : 'Supervisor')
                                : u.role === 'cleaner'
                                ? (language === 'ar' ? 'كادر العاملات' : 'Cleaner')
                                : (language === 'ar' ? 'عميل' : 'Customer')}
                            </span>
                          </span>
                        </td>

                        {/* Status */}
                        <td className="p-3.5">
                          <span
                            className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-bold ${
                              u.status === 'active'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-rose-50 text-rose-700 border border-rose-200'
                            }`}
                          >
                            {u.status === 'active' ? (language === 'ar' ? 'نشط' : 'Active') : (language === 'ar' ? 'معلق' : 'Suspended')}
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="p-3.5 text-center">
                          {isAdmin ? (
                            <div className="flex items-center justify-center gap-1.5">
                              {/* Toggle Suspension */}
                              <button
                                type="button"
                                disabled={isRootAdmin}
                                onClick={() => {
                                  const res = toggleUserSuspensionByAdmin(u.id);
                                  if (res.success) {
                                    setUserToast({
                                      text: language === 'ar' ? `تم تغيير حالة ${u.name} بنجاح` : `Status updated for ${u.name}`,
                                      type: 'success',
                                    });
                                  } else {
                                    setUserToast({ text: res.message || 'Error', type: 'error' });
                                  }
                                  setTimeout(() => setUserToast(null), 3000);
                                }}
                                title={u.status === 'active' ? 'تعليق الحساب' : 'تنشيط الحساب'}
                                className={`p-1.5 rounded-xl border transition-colors ${
                                  isRootAdmin
                                    ? 'opacity-40 cursor-not-allowed text-slate-300'
                                    : u.status === 'active'
                                    ? 'bg-rose-50 border-rose-200 text-rose-700 hover:bg-rose-100'
                                    : 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100'
                                }`}
                              >
                                <Ban className="w-3.5 h-3.5" />
                              </button>

                              {/* Quick Password Reset */}
                              <button
                                type="button"
                                onClick={() => {
                                  setUserForPasswordReset(u);
                                  setUserResetPasswordInput('');
                                }}
                                title="إعادة تعيين كلمة المرور"
                                className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition-colors"
                              >
                                <Key className="w-3.5 h-3.5" />
                              </button>

                              {/* Full Edit */}
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedUserForEdit(u);
                                  setUserEditForm({
                                    username: u.username,
                                    email: u.email,
                                    password: u.password || '',
                                    role: u.role,
                                    name: u.name,
                                    phone: u.phone,
                                    status: u.status,
                                  });
                                }}
                                title="تعديل البيانات الكاملة"
                                className="p-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 transition-colors"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>

                              {/* Delete (protected for root admin) */}
                              <button
                                type="button"
                                disabled={isRootAdmin}
                                onClick={() => setUserToDelete(u)}
                                title={isRootAdmin ? 'لا يمكن حذف الحساب الجذري' : 'حذف المستخدم'}
                                className={`p-1.5 rounded-xl border transition-colors ${
                                  isRootAdmin
                                    ? 'opacity-30 cursor-not-allowed border-slate-200 text-slate-300'
                                    : 'bg-white hover:bg-rose-50 text-rose-600 border-rose-200'
                                }`}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ) : (
                            <span className="text-slate-400 text-[11px] font-medium">
                              {language === 'ar' ? 'استعراض فقط' : 'Read-only'}
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>

          {/* RBAC Architecture & Privileges Reference */}
          <div className="p-5 rounded-3xl bg-slate-50 border border-slate-200 space-y-3">
            <h3 className="text-xs font-black text-slate-900 flex items-center gap-2">
              <Shield className="w-4 h-4 text-amber-500" />
              <span>{language === 'ar' ? 'مصفوفة الصلاحيات والرتب في منظومة ألفا كلين (RBAC Architecture):' : 'Role-Based Access Control Reference:'}</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-2xl bg-white border border-amber-200 space-y-1">
                <div className="flex items-center gap-1.5 font-black text-amber-900">
                  <span>👑 مدير / مشرف التطبيق (App Administrator):</span>
                </div>
                <p className="text-slate-600 leading-relaxed text-[11px]">
                  يمتلك كامل صلاحيات النظام، بالإضافة إلى **صلاحيتين حصريتين**: إدارة المستخدمين والمشرفين (تعديل وحذف وكلمات مرور كافة الحسابات بما فيها المشرف)، وإعدادات هوية التطبيق والشعار وبيانات مصرف أبوظبي الإسلامي ADIB والآيبان البنكي.
                </p>
              </div>

              <div className="p-3 rounded-2xl bg-white border border-sky-200 space-y-1">
                <div className="flex items-center gap-1.5 font-black text-sky-900">
                  <span>🛡️ مشرف العمليات (Operations Supervisor):</span>
                </div>
                <p className="text-slate-600 leading-relaxed text-[11px]">
                  إدارة جدول الحصص الأسبوعي (24 ساعة)، كادر العاملات وتصدير السجلات، سجلات أداء العمليات، إدارة العملاء والمحافظ والترقية، مناطق التغطية وتكاليف الانتقال، الميديا الدعائية، وسياسة المكافآت.
                </p>
              </div>

              <div className="p-3 rounded-2xl bg-white border border-emerald-200 space-y-1">
                <div className="flex items-center gap-1.5 font-black text-emerald-900">
                  <span>🧹 كادر العاملات (Cleaners):</span>
                </div>
                <p className="text-slate-600 leading-relaxed text-[11px]">
                  الدخول برقم الهاتف أو اسم المستخدم إلى بوابة مهام العاملة فقط: استعراض زيارات اليوم، تغيير حالة التنفيذ (في الطريق، قيد التنفيذ، منجز)، وتأكيد استلام الكاش من العميل وتدوين الملاحظات.
                </p>
              </div>

              <div className="p-3 rounded-2xl bg-white border border-slate-200 space-y-1">
                <div className="flex items-center gap-1.5 font-black text-slate-800">
                  <span>👤 العملاء والزوار (Customers & Guests):</span>
                </div>
                <p className="text-slate-600 leading-relaxed text-[11px]">
                  حجز خدمات التنظيف بالساعة عبر المعالج الذكي، تتبع الطلبات عبر الخط الزمني الحي، إدارة رصيد المحفظة الذكية، واستبدال نقاط المكافأة (مع منع تصدير JSON للعملاء).
                </p>
              </div>
            </div>
          </div>

          {/* Modal: Add New User / Supervisor */}
          {showAddUserModal && (
            <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (newUserForm.username && newUserForm.email && newUserForm.name) {
                    addNewUser(newUserForm);
                    setShowAddUserModal(false);
                    setNewUserForm({
                      username: '',
                      email: '',
                      password: '',
                      role: 'supervisor',
                      name: '',
                      phone: '',
                      status: 'active',
                    });
                    setUserToast({
                      text: language === 'ar' ? 'تمت إضافة المستخدم بنجاح إلى المنظومة' : 'User created successfully',
                      type: 'success',
                    });
                    setTimeout(() => setUserToast(null), 3000);
                  }
                }}
                className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl space-y-4"
              >
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <UserPlus className="w-5 h-5 text-amber-600" />
                    <h3 className="text-base font-black text-slate-900">
                      {language === 'ar' ? 'إضافة مستخدم / مشرف جديد' : 'Add New User / Supervisor'}
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowAddUserModal(false)}
                    className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
                  >
                    ✕
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">الاسم الكامل:</label>
                    <input
                      type="text"
                      required
                      placeholder="مثال: مروان الشامسي"
                      value={newUserForm.name}
                      onChange={(e) => setNewUserForm({ ...newUserForm, name: e.target.value })}
                      className="w-full p-2.5 rounded-xl border border-slate-300 outline-none font-bold"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">اسم المستخدم (Username):</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. marwan_ops"
                      value={newUserForm.username}
                      onChange={(e) => setNewUserForm({ ...newUserForm, username: e.target.value })}
                      className="w-full p-2.5 rounded-xl border border-slate-300 outline-none font-mono"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">البريد الإلكتروني:</label>
                    <input
                      type="email"
                      required
                      placeholder="name@alfaclean-uae.com"
                      value={newUserForm.email}
                      onChange={(e) => setNewUserForm({ ...newUserForm, email: e.target.value })}
                      className="w-full p-2.5 rounded-xl border border-slate-300 outline-none font-mono"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">رقم الهاتف:</label>
                    <input
                      type="tel"
                      required
                      placeholder="050 000 0000"
                      value={newUserForm.phone}
                      onChange={(e) => setNewUserForm({ ...newUserForm, phone: e.target.value })}
                      className="w-full p-2.5 rounded-xl border border-slate-300 outline-none font-mono"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">كلمة المرور:</label>
                    <div className="relative">
                      <input
                        type="text"
                        required
                        placeholder="••••••••"
                        value={newUserForm.password}
                        onChange={(e) => setNewUserForm({ ...newUserForm, password: e.target.value })}
                        className="w-full p-2.5 rounded-xl border border-slate-300 outline-none font-mono font-bold"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const randomPass = 'Alfa' + Math.floor(100000 + Math.random() * 900000) + '!';
                          setNewUserForm({ ...newUserForm, password: randomPass });
                        }}
                        className="absolute left-2 top-2.5 text-[10px] text-amber-700 font-bold bg-amber-100 px-1.5 py-0.5 rounded-md"
                      >
                        توليد
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">الرتبة والصلاحية:</label>
                    <select
                      value={newUserForm.role}
                      onChange={(e) => setNewUserForm({ ...newUserForm, role: e.target.value as any })}
                      className="w-full p-2.5 rounded-xl border border-slate-300 outline-none bg-white font-bold"
                    >
                      <option value="supervisor">مشرف العمليات (Supervisor)</option>
                      <option value="admin">مدير المنظومة (Admin)</option>
                      <option value="cleaner">عاملة نظافة (Cleaner)</option>
                      <option value="customer">عميل (Customer)</option>
                    </select>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block font-bold text-slate-700 mb-1">حالة الحساب:</label>
                    <select
                      value={newUserForm.status}
                      onChange={(e) => setNewUserForm({ ...newUserForm, status: e.target.value as any })}
                      className="w-full p-2.5 rounded-xl border border-slate-300 outline-none bg-white font-bold"
                    >
                      <option value="active">نشط (Active)</option>
                      <option value="suspended">معلق (Suspended)</option>
                    </select>
                  </div>
                </div>

                <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowAddUserModal(false)}
                    className="px-4 py-2 rounded-xl border text-xs font-bold text-slate-600"
                  >
                    إلغاء
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs"
                  >
                    إنشاء الحساب
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Modal: Quick Password Reset */}
          {userForPasswordReset && (
            <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
              <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <Key className="w-5 h-5 text-amber-600" />
                    <h3 className="text-base font-black text-slate-900">
                      {language === 'ar' ? 'إعادة تعيين كلمة المرور:' : 'Reset Password:'} {userForPasswordReset.name}
                    </h3>
                  </div>
                  <button
                    onClick={() => setUserForPasswordReset(null)}
                    className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
                  >
                    ✕
                  </button>
                </div>

                <div className="space-y-3 text-xs">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      {language === 'ar' ? 'كلمة المرور الجديدة (6 أحرف فأكثر):' : 'New Password:'}
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        required
                        placeholder="e.g. AlfaNewPass2026!"
                        value={userResetPasswordInput}
                        onChange={(e) => setUserResetPasswordInput(e.target.value)}
                        className="w-full p-2.5 rounded-xl border border-slate-300 font-mono font-bold outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const autoPass = 'Alfa' + Math.floor(100000 + Math.random() * 900000) + '!';
                          setUserResetPasswordInput(autoPass);
                        }}
                        className="absolute left-2 top-2.5 text-[10px] text-amber-700 font-bold bg-amber-100 px-1.5 py-0.5 rounded-md"
                      >
                        توليد كلمة
                      </button>
                    </div>
                  </div>
                </div>

                <div className="pt-3 flex justify-end gap-2">
                  <button
                    onClick={() => setUserForPasswordReset(null)}
                    className="px-4 py-2 rounded-xl border text-xs font-bold text-slate-600"
                  >
                    إلغاء
                  </button>
                  <button
                    onClick={() => {
                      if (userResetPasswordInput.trim()) {
                        const res = resetUserPasswordByAdmin(userForPasswordReset.id, userResetPasswordInput.trim());
                        if (res.success) {
                          setUserToast({
                            text: language === 'ar' ? `تم تغيير كلمة مرور ${userForPasswordReset.name} بنجاح` : 'Password reset successfully',
                            type: 'success',
                          });
                          setUserForPasswordReset(null);
                        } else {
                          setUserToast({ text: res.message || 'Error', type: 'error' });
                        }
                        setTimeout(() => setUserToast(null), 3000);
                      }
                    }}
                    className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs"
                  >
                    حفظ كلمة المرور
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Modal: Confirm Delete User */}
          {userToDelete && (
            <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
              <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h3 className="text-base font-black text-rose-600 flex items-center gap-2">
                    <Trash2 className="w-5 h-5" />
                    <span>{language === 'ar' ? 'تأكيد حذف الحساب' : 'Confirm User Deletion'}</span>
                  </h3>
                  <button
                    onClick={() => setUserToDelete(null)}
                    className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
                  >
                    ✕
                  </button>
                </div>

                <p className="text-xs text-slate-700 leading-relaxed">
                  {language === 'ar'
                    ? `هل أنت متأكد من رغبتك في حذف حساب "${userToDelete.name}" (${userToDelete.email || userToDelete.username})؟ لن يتمكن المستخدم من الدخول للنظام بعد الحذف.`
                    : `Are you sure you want to delete user "${userToDelete.name}"?`}
                </p>

                <div className="pt-2 flex justify-end gap-2">
                  <button
                    onClick={() => setUserToDelete(null)}
                    className="px-4 py-2 rounded-xl border text-xs font-bold text-slate-600"
                  >
                    إلغاء
                  </button>
                  <button
                    onClick={() => {
                      const res = deleteUserByAdmin(userToDelete.id);
                      if (res.success) {
                        setUserToast({
                          text: language === 'ar' ? `تم حذف حساب ${userToDelete.name} بنجاح` : 'User deleted',
                          type: 'success',
                        });
                        setUserToDelete(null);
                      } else {
                        setUserToast({ text: res.message || 'Error', type: 'error' });
                        setUserToDelete(null);
                      }
                      setTimeout(() => setUserToast(null), 3000);
                    }}
                    className="px-5 py-2 rounded-xl bg-rose-600 text-white font-black text-xs hover:bg-rose-700"
                  >
                    تأكيد الحذف
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Modal: Full Edit User */}
          {selectedUserForEdit && (
            <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
              <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h3 className="text-base font-black text-slate-900">
                    {language === 'ar' ? 'تعديل بيانات الحساب:' : 'Edit User:'} {selectedUserForEdit.name}
                  </h3>
                  <button
                    onClick={() => setSelectedUserForEdit(null)}
                    className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
                  >
                    ✕
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">الاسم الكامل:</label>
                    <input
                      type="text"
                      value={userEditForm.name}
                      onChange={(e) => setUserEditForm({ ...userEditForm, name: e.target.value })}
                      className="w-full p-2.5 rounded-xl border border-slate-300 outline-none font-bold"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">اسم المستخدم:</label>
                    <input
                      type="text"
                      value={userEditForm.username}
                      onChange={(e) => setUserEditForm({ ...userEditForm, username: e.target.value })}
                      className="w-full p-2.5 rounded-xl border border-slate-300 outline-none font-mono"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">البريد الإلكتروني:</label>
                    <input
                      type="email"
                      value={userEditForm.email}
                      onChange={(e) => setUserEditForm({ ...userEditForm, email: e.target.value })}
                      className="w-full p-2.5 rounded-xl border border-slate-300 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">كلمة المرور:</label>
                    <input
                      type="text"
                      value={userEditForm.password}
                      onChange={(e) => setUserEditForm({ ...userEditForm, password: e.target.value })}
                      className="w-full p-2.5 rounded-xl border border-slate-300 outline-none font-mono font-bold"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">الهاتف:</label>
                    <input
                      type="tel"
                      value={userEditForm.phone}
                      onChange={(e) => setUserEditForm({ ...userEditForm, phone: e.target.value })}
                      className="w-full p-2.5 rounded-xl border border-slate-300 outline-none font-mono"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">الرتبة:</label>
                    <select
                      value={userEditForm.role}
                      onChange={(e) => setUserEditForm({ ...userEditForm, role: e.target.value as any })}
                      className="w-full p-2.5 rounded-xl border border-slate-300 outline-none bg-white font-bold"
                    >
                      <option value="admin">admin (مدير المنظومة)</option>
                      <option value="supervisor">supervisor (مشرف العمليات)</option>
                      <option value="cleaner">cleaner (عاملة)</option>
                      <option value="customer">customer (عميل)</option>
                    </select>
                  </div>

                  <div className="col-span-2">
                    <label className="block font-bold text-slate-700 mb-1">الحالة:</label>
                    <select
                      value={userEditForm.status}
                      onChange={(e) => setUserEditForm({ ...userEditForm, status: e.target.value as any })}
                      className="w-full p-2.5 rounded-xl border border-slate-300 outline-none bg-white font-bold"
                    >
                      <option value="active">active (نشط)</option>
                      <option value="suspended">suspended (معلق)</option>
                    </select>
                  </div>
                </div>

                <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
                  <button
                    onClick={() => setSelectedUserForEdit(null)}
                    className="px-4 py-2 rounded-xl border text-xs font-bold text-slate-600"
                  >
                    إلغاء
                  </button>
                  <button
                    onClick={() => {
                      updateUserByAdmin({
                        ...selectedUserForEdit,
                        ...userEditForm,
                      });
                      setSelectedUserForEdit(null);
                      setUserToast({
                        text: language === 'ar' ? 'تم تحديث بيانات المستخدم بنجاح' : 'User updated successfully',
                        type: 'success',
                      });
                      setTimeout(() => setUserToast(null), 3000);
                    }}
                    className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs"
                  >
                    حفظ التغييرات
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
        </ErrorBoundary>
      )}

      {/* ============================================================== */}
      {/* 8. BRANDING, SOCIAL SHARE (الصورة المعبرة), LOGO & ADIB BANK SETTINGS */}
      {/* ============================================================== */}
      {activeTab === 'branding' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-amber-200 shadow-sm space-y-6">
          <div className="border-b border-amber-100 pb-4">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 text-amber-800 text-xs font-bold mb-1">
              <Share2 className="w-3.5 h-3.5" />
              <span>{language === 'ar' ? 'إدارة الهوية وميديا التواصل الاجتماعي' : 'Brand & Social Media Share Management'}</span>
            </div>
            <h2 className="text-xl font-black text-slate-900">
              {language === 'ar' ? 'الصورة المعبرة لوسائل التواصل وهيكل الهوية والبنك' : 'Social Share Image, Brand & Bank Settings'}
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              {language === 'ar'
                ? 'تخصيص الصورة المعبرة التي تظهر عند مشاركة رابط المنظومة على واتساب وفيسبوك، الشعار الرسمي، وبيانات مصرف أبوظبي الإسلامي (ADIB)'
                : 'Configure OpenGraph social preview card for WhatsApp & Facebook link sharing, official logo, and corporate bank details'}
            </p>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              updateBrandSettings(brandForm);
              alert(language === 'ar' ? 'تم حفظ الصورة المعبرة وإعدادات الهوية بنجاح!' : 'Social share image and brand settings saved successfully!');
            }}
            className="space-y-6 text-xs max-w-4xl"
          >
            {/* 1. SOCIAL SHARE OPENGRAPH IMAGE & LIVE PREVIEWS (الصورة المعبرة) */}
            <div className="p-5 rounded-2xl bg-gradient-to-br from-sky-50 via-slate-50 to-amber-50 border-2 border-sky-200 space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-sky-600 text-white flex items-center justify-center font-bold">
                    <Share2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-900">
                      {language === 'ar' ? 'الصورة المعبرة لوسائل التواصل الاجتماعي (OpenGraph Image)' : 'Social Share & OpenGraph Image'}
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      {language === 'ar'
                        ? 'تظهر هذه الصورة والنصوص تلقائياً عند قيام أي شخص بوضع أو إرسال رابط التطبيق في محادثات واتساب، منشورات فيسبوك، أو منصات التواصل الأخرى.'
                        : 'This image, title, and description automatically display when sharing the app link on WhatsApp, Facebook, Twitter/X, and link scrapers.'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Input for OG Image URL */}
              <div className="space-y-1.5">
                <label className="block font-bold text-slate-700">
                  {language === 'ar' ? 'رابط أو مسار الصورة المعبرة (OG Image URL):' : 'Social Share Image URL (og:image):'}
                </label>
                <div className="flex flex-col sm:flex-row items-center gap-2">
                  <input
                    type="text"
                    required
                    value={brandForm.ogImageUrl}
                    onChange={(e) => setBrandForm({ ...brandForm, ogImageUrl: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-300 font-mono text-xs bg-white outline-none focus:border-sky-500"
                    placeholder="https://example.com/banner.jpg"
                  />
                </div>
              </div>

              {/* Quick Presets */}
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-slate-400 block">
                  {language === 'ar' ? 'نماذج جاهزة للاختيار السريع:' : 'Quick Presets:'}
                </span>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      setBrandForm({
                        ...brandForm,
                        ogImageUrl: '/assets/aistudio/Logo_-_Circule_1f75fa0e.png',
                      })
                    }
                    className="px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 hover:border-sky-400 text-[11px] font-bold text-slate-700 flex items-center gap-1.5 cursor-pointer shadow-2xs"
                  >
                    <span>🛡️</span>
                    <span>{language === 'ar' ? 'الشعار المعتمد الدائري' : 'Official Logo'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setBrandForm({
                        ...brandForm,
                        ogImageUrl: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200&auto=format&fit=crop&q=80',
                      })
                    }
                    className="px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 hover:border-sky-400 text-[11px] font-bold text-slate-700 flex items-center gap-1.5 cursor-pointer shadow-2xs"
                  >
                    <span>🏡</span>
                    <span>{language === 'ar' ? 'شقة فاخرة ونظيفة بأبوظبي' : 'Luxury Villa Abu Dhabi'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setBrandForm({
                        ...brandForm,
                        ogImageUrl: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=1200&auto=format&fit=crop&q=80',
                      })
                    }
                    className="px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 hover:border-sky-400 text-[11px] font-bold text-slate-700 flex items-center gap-1.5 cursor-pointer shadow-2xs"
                  >
                    <span>✨</span>
                    <span>{language === 'ar' ? 'طاقم العمل والتعقيم الشامل' : 'Certified Cleaning Staff'}</span>
                  </button>
                </div>
              </div>

              {/* Title & Description inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    {language === 'ar' ? 'عنوان الرابط عند المشاركة (og:title):' : 'Social Title (og:title):'}
                  </label>
                  <input
                    type="text"
                    value={brandForm.ogTitle || ''}
                    onChange={(e) => setBrandForm({ ...brandForm, ogTitle: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-300 font-bold bg-white outline-none"
                    placeholder="ألفا كلين لخدمات تنظيف المنازل بالساعة في أبوظبي"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    {language === 'ar' ? 'وصف الرابط عند المشاركة (og:description):' : 'Social Description (og:description):'}
                  </label>
                  <input
                    type="text"
                    value={brandForm.ogDescription || ''}
                    onChange={(e) => setBrandForm({ ...brandForm, ogDescription: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-300 bg-white outline-none"
                    placeholder="المنظومة الأولى المعتمدة لحجز خدمات تنظيف المنازل بالساعة في أبوظبي"
                  />
                </div>
              </div>

              {/* LIVE SOCIAL MEDIA PREVIEW CARDS */}
              <div className="pt-3 border-t border-slate-200/80 space-y-3">
                <span className="font-black text-slate-800 text-xs block flex items-center gap-1.5">
                  <Eye className="w-4 h-4 text-sky-600" />
                  <span>{language === 'ar' ? 'المعاينة الحية التفاعلية للرابط على منصات التواصل:' : 'Interactive Live Previews on Social Networks:'}</span>
                </span>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* WhatsApp Link Card Preview */}
                  <div className="p-3.5 rounded-2xl bg-[#efeae2] border border-slate-300 shadow-inner space-y-2">
                    <div className="flex items-center justify-between text-[11px] font-bold text-emerald-800 border-b border-emerald-200 pb-1">
                      <span>💬 {language === 'ar' ? 'معاينة رابط واتساب (WhatsApp Preview)' : 'WhatsApp Link Preview'}</span>
                      <span className="text-[10px] text-slate-500 font-normal">10:42 AM</span>
                    </div>

                    <div className="bg-white rounded-xl overflow-hidden shadow-xs border border-slate-200 flex flex-col sm:flex-row">
                      <div className="w-full sm:w-28 h-24 sm:h-auto bg-slate-100 flex items-center justify-center shrink-0 overflow-hidden">
                        <img
                          src={brandForm.ogImageUrl || brandForm.logoUrl}
                          alt="WhatsApp Share Preview"
                          className="w-full h-full object-cover"
                          onError={(e: any) => {
                            e.target.src = '/assets/aistudio/Logo_-_Circule_1f75fa0e.png';
                          }}
                        />
                      </div>
                      <div className="p-2.5 flex-1 flex flex-col justify-center space-y-0.5">
                        <div className="font-bold text-slate-900 text-xs line-clamp-1">
                          {brandForm.ogTitle || brandForm.companyNameAr}
                        </div>
                        <div className="text-[10px] text-slate-600 line-clamp-2">
                          {brandForm.ogDescription || 'احجز الآن خدمات تنظيف المنازل بالساعة في أبوظبي.'}
                        </div>
                        <div className="text-[9px] text-slate-400 font-mono">
                          alfaclean-uae.com
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Facebook / Twitter Feed Card Preview */}
                  <div className="p-3.5 rounded-2xl bg-slate-100 border border-slate-300 shadow-inner space-y-2">
                    <div className="flex items-center justify-between text-[11px] font-bold text-blue-800 border-b border-blue-200 pb-1">
                      <span>🌐 {language === 'ar' ? 'معاينة فيسبوك وتويتر (Social Feed Card)' : 'Facebook / Social Feed Card'}</span>
                      <span className="text-[10px] text-slate-500 font-normal">Just now</span>
                    </div>

                    <div className="bg-white rounded-xl overflow-hidden shadow-xs border border-slate-200">
                      <div className="w-full h-32 bg-slate-200 flex items-center justify-center overflow-hidden">
                        <img
                          src={brandForm.ogImageUrl || brandForm.logoUrl}
                          alt="Facebook Share Preview"
                          className="w-full h-full object-cover"
                          onError={(e: any) => {
                            e.target.src = '/assets/aistudio/Logo_-_Circule_1f75fa0e.png';
                          }}
                        />
                      </div>
                      <div className="p-2.5 space-y-0.5 bg-slate-50">
                        <div className="text-[9px] font-mono uppercase text-slate-400 tracking-wider">
                          ALFACLEAN-UAE.COM
                        </div>
                        <div className="font-bold text-slate-900 text-xs line-clamp-1">
                          {brandForm.ogTitle || brandForm.companyNameAr}
                        </div>
                        <div className="text-[10px] text-slate-500 line-clamp-1">
                          {brandForm.ogDescription || 'منظومة حجز خدمات تنظيف المنازل بالساعة في أبوظبي.'}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 2. OFFICIAL LOGO PREVIEW & COMPANY INFORMATION */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row items-center gap-4">
              <div className="w-20 h-20 rounded-2xl bg-white border p-2 flex items-center justify-center shrink-0">
                <img
                  src={brandForm.logoUrl}
                  alt="Logo"
                  className="w-full h-full object-contain"
                />
              </div>
              <div className="flex-1 w-full space-y-1">
                <label className="block font-bold text-slate-700">
                  {language === 'ar' ? 'مسار أو رابط الشعار المعتمد:' : 'Logo URL / Path:'}
                </label>
                <input
                  type="text"
                  required
                  value={brandForm.logoUrl}
                  onChange={(e) => setBrandForm({ ...brandForm, logoUrl: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-300 font-mono outline-none bg-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-bold text-slate-700 mb-1">اسم المنظومة الرسمي (بالعربية):</label>
                <input
                  type="text"
                  required
                  value={brandForm.companyNameAr}
                  onChange={(e) => setBrandForm({ ...brandForm, companyNameAr: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-300 font-bold outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Official Name (English):</label>
                <input
                  type="text"
                  required
                  value={brandForm.companyNameEn}
                  onChange={(e) => setBrandForm({ ...brandForm, companyNameEn: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-300 font-bold outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">رقم الهاتف الرسمي:</label>
                <input
                  type="text"
                  value={brandForm.phone}
                  onChange={(e) => setBrandForm({ ...brandForm, phone: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-300 font-mono outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">البريد الإلكتروني للشركة:</label>
                <input
                  type="email"
                  value={brandForm.email}
                  onChange={(e) => setBrandForm({ ...brandForm, email: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-300 outline-none"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block font-bold text-slate-700 mb-1">عنوان المقر في أبوظبي:</label>
                <input
                  type="text"
                  value={brandForm.addressAr}
                  onChange={(e) => setBrandForm({ ...brandForm, addressAr: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-300 outline-none"
                />
              </div>
            </div>

            {/* 3. ADIB CORPORATE BANK ACCOUNT */}
            <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200 space-y-3">
              <h4 className="text-xs font-black text-amber-950 flex items-center gap-1.5">
                <Building className="w-4 h-4 text-amber-600" />
                <span>{language === 'ar' ? 'بيانات الحساب البنكي لمصرف أبوظبي الإسلامي (ADIB):' : 'ADIB Corporate Bank Details:'}</span>
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-amber-900 mb-1">اسم البنك:</label>
                  <input
                    type="text"
                    value={brandForm.bankName}
                    onChange={(e) => setBrandForm({ ...brandForm, bankName: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-amber-300 bg-white outline-none font-bold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-amber-900 mb-1">اسم صاحب الحساب بالإنجليزية:</label>
                  <input
                    type="text"
                    value={brandForm.bankAccountName}
                    onChange={(e) => setBrandForm({ ...brandForm, bankAccountName: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-amber-300 bg-white outline-none font-bold"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-bold text-amber-900 mb-1">رقم الآيبان (IBAN):</label>
                  <input
                    type="text"
                    value={brandForm.bankIban}
                    onChange={(e) => setBrandForm({ ...brandForm, bankIban: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-amber-300 bg-white font-mono font-bold outline-none text-sm"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-black text-xs flex items-center gap-2 shadow-xs cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>{language === 'ar' ? 'حفظ إعدادات الهوية وميديا التواصل والبنك' : 'Save Brand, Social Share & Bank Settings'}</span>
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
