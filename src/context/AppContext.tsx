/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  User,
  UserRole,
  Cleaner,
  CleanerLog,
  Booking,
  BookingStatus,
  CustomerAccount,
  ServiceArea,
  PromoMediaSettings,
  RewardsPolicySettings,
  BrandSettings,
  Language,
} from '../types';
import {
  INITIAL_BRAND_SETTINGS,
  INITIAL_PROMO_MEDIA,
  INITIAL_REWARDS_POLICY,
  INITIAL_SERVICE_AREAS,
  INITIAL_CLEANERS,
  INITIAL_USERS,
  INITIAL_CUSTOMERS,
  INITIAL_BOOKINGS,
} from './seedData';
import {
  signInWithGoogle,
  registerWithEmail,
  firebaseSignOut,
} from '../services/firebase';

interface AppContextType {
  // Localization
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;

  // Active User / Auth
  currentUser: User | null;
  users: User[];
  login: (identity: string, password?: string, rememberMe?: boolean) => { success: boolean; message?: string; user?: User; role?: UserRole };
  loginWithGoogleAction: () => Promise<{ success: boolean; message?: string }>;
  signUpCustomerAction: (name: string, email: string, pass: string, phone: string) => Promise<{ success: boolean; message?: string }>;
  logout: () => void;
  updateUserByAdmin: (updatedUser: User) => void;
  addNewUser: (newUser: Omit<User, 'id' | 'createdAt'>) => void;
  deleteUserByAdmin: (userId: string) => { success: boolean; message?: string };
  toggleUserSuspensionByAdmin: (userId: string) => { success: boolean; message?: string };
  resetUserPasswordByAdmin: (userId: string, newPass: string) => { success: boolean; message?: string };

  // Settings
  brandSettings: BrandSettings;
  updateBrandSettings: (newSettings: Partial<BrandSettings>) => void;
  promoMedia: PromoMediaSettings;
  updatePromoMedia: (newSettings: Partial<PromoMediaSettings>) => void;
  rewardsPolicy: RewardsPolicySettings;
  updateRewardsPolicy: (newSettings: Partial<RewardsPolicySettings>) => void;

  // Service Areas
  serviceAreas: ServiceArea[];
  updateServiceAreaFee: (id: string, travelFee: number, isActive?: boolean) => void;
  addServiceArea: (newArea: Omit<ServiceArea, 'id'>) => void;

  // Cleaners
  cleaners: Cleaner[];
  addCleaner: (newCleaner: Omit<Cleaner, 'id' | 'operationalLogs'>) => void;
  updateCleaner: (cleanerId: string, updates: Partial<Cleaner>) => void;
  addCleanerLog: (cleanerId: string, log: Omit<CleanerLog, 'id' | 'cleanerId' | 'date'>) => void;

  // Customers
  customers: CustomerAccount[];
  adjustCustomerWallet: (customerId: string, deltaAmount: number, reason: string) => void;
  approveCustomerBonus: (customerId: string) => void;
  toggleCustomerSuspension: (customerId: string) => void;
  resetCustomerPassword: (customerId: string, newPass: string) => void;

  // Bookings
  bookings: Booking[];
  createBooking: (bookingInput: Omit<Booking, 'id' | 'reference' | 'createdAt' | 'updatedAt'>) => {
    success: boolean;
    booking?: Booking;
    error?: string;
  };
  updateBookingStatus: (bookingId: string, status: BookingStatus, extra?: Partial<Booking>) => void;
  submitBookingReview: (bookingId: string, rating: number, reviewText: string) => void;
  inProgressBooking: Booking | null;

  // Active View Navigation helper
  activeView: 'home' | 'booking' | 'tracking' | 'supervisor' | 'cleaner' | 'profile';
  setActiveView: (view: 'home' | 'booking' | 'tracking' | 'supervisor' | 'cleaner' | 'profile') => void;
  activeTrackingRef: string | null;
  setActiveTrackingRef: (ref: string | null) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

// Local storage helper
function loadStorage<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(`alfaclean_${key}`);
    if (!raw) return fallback;
    return JSON.parse(raw);
  } catch (e) {
    console.warn(`Error loading ${key} from storage:`, e);
    return fallback;
  }
}

function saveStorage<T>(key: string, value: T): void {
  try {
    localStorage.setItem(`alfaclean_${key}`, JSON.stringify(value));
  } catch (e) {
    console.warn(`Error saving ${key} to storage:`, e);
  }
}

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Language
  const [language, setLanguageState] = useState<Language>(() => loadStorage<Language>('lang', 'ar'));

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    saveStorage('lang', lang);
    if (typeof document !== 'undefined') {
      document.documentElement.lang = lang;
      document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    }
  };

  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.lang = language;
      document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
    }
  }, [language]);

  // Main collections state
  const [brandSettings, setBrandSettings] = useState<BrandSettings>(() =>
    loadStorage('brand', INITIAL_BRAND_SETTINGS)
  );
  const [promoMedia, setPromoMedia] = useState<PromoMediaSettings>(() =>
    loadStorage('promo', INITIAL_PROMO_MEDIA)
  );
  const [rewardsPolicy, setRewardsPolicy] = useState<RewardsPolicySettings>(() =>
    loadStorage('rewards', INITIAL_REWARDS_POLICY)
  );
  const [serviceAreas, setServiceAreas] = useState<ServiceArea[]>(() =>
    loadStorage('areas', INITIAL_SERVICE_AREAS)
  );
  const [cleaners, setCleaners] = useState<Cleaner[]>(() =>
    loadStorage('cleaners', INITIAL_CLEANERS)
  );
  const [users, setUsers] = useState<User[]>(() => {
    const rawUsers = loadStorage<User[]>('users', INITIAL_USERS);
    if (!Array.isArray(rawUsers) || rawUsers.length === 0) {
      return INITIAL_USERS;
    }
    // Normalize users to guarantee all required fields exist
    const sanitized: User[] = rawUsers.map((u, idx) => ({
      id: u?.id || `user-${idx + 1}`,
      username: u?.username || u?.email || `user_${idx + 1}`,
      email: u?.email || '',
      password: u?.password || '',
      role: u?.role || 'customer',
      name: u?.name || u?.username || 'مستخدم',
      phone: u?.phone || '',
      status: u?.status === 'suspended' ? ('suspended' as const) : ('active' as const),
      cleanerId: u?.cleanerId,
      customerId: u?.customerId,
      createdAt: u?.createdAt || '2026-01-01',
    }));

    // Guarantee root admin is present with up-to-date credentials
    const adminIdx = sanitized.findIndex(u => u.email === 'alfacleanmaster@gmail.com' || u.id === 'user-admin');
    if (adminIdx === -1) {
      sanitized.unshift(INITIAL_USERS[0]);
    } else {
      sanitized[adminIdx] = {
        ...sanitized[adminIdx],
        username: 'alfacleanmaster@gmail.com',
        email: 'alfacleanmaster@gmail.com',
        password: 'Saferoo##44H%',
        role: 'admin',
        status: 'active',
      };
    }
    // Guarantee supervisor is present
    if (!sanitized.some(u => u.email === 'alfacleanmaster888@gmail.com' || u.id === 'user-supervisor')) {
      sanitized.splice(1, 0, INITIAL_USERS[1]);
    }

    return sanitized;
  });
  const [customers, setCustomers] = useState<CustomerAccount[]>(() =>
    loadStorage('customers', INITIAL_CUSTOMERS)
  );
  const [bookings, setBookings] = useState<Booking[]>(() =>
    loadStorage('bookings', INITIAL_BOOKINGS)
  );

  // Active user session
  const [currentUser, setCurrentUser] = useState<User | null>(() =>
    loadStorage<User | null>('currentUser', null)
  );

  // Active View routing
  const [activeView, setActiveView] = useState<'home' | 'booking' | 'tracking' | 'supervisor' | 'cleaner' | 'profile'>('home');
  const [activeTrackingRef, setActiveTrackingRef] = useState<string | null>(null);

  // Sync to local storage
  useEffect(() => saveStorage('brand', brandSettings), [brandSettings]);
  useEffect(() => saveStorage('promo', promoMedia), [promoMedia]);
  useEffect(() => saveStorage('rewards', rewardsPolicy), [rewardsPolicy]);
  useEffect(() => saveStorage('areas', serviceAreas), [serviceAreas]);
  useEffect(() => saveStorage('cleaners', cleaners), [cleaners]);
  useEffect(() => saveStorage('users', users), [users]);
  useEffect(() => saveStorage('customers', customers), [customers]);
  useEffect(() => saveStorage('bookings', bookings), [bookings]);
  useEffect(() => saveStorage('currentUser', currentUser), [currentUser]);

  // Authentication
  const login = (
    identity: string,
    password?: string,
    _rememberMe: boolean = true
  ): { success: boolean; message?: string; user?: User; role?: UserRole } => {
    const trimmed = identity.trim().toLowerCase();

    // Direct check for Supervisor credentials
    if (
      (trimmed === 'alfacleanmaster888@gmail.com' || trimmed === 'supervisor') &&
      password === 'Saferoo#$88$14'
    ) {
      const sup = users.find(u => u.role === 'supervisor') || INITIAL_USERS[1];
      setCurrentUser(sup);
      return { success: true, user: sup, role: sup.role };
    }

    // Direct check for Admin credentials (official)
    if (
      (trimmed === 'alfacleanmaster@gmail.com' || trimmed === 'admin' || trimmed === 'alfacleanmaster') &&
      password === 'Saferoo##44H%'
    ) {
      const adm = users.find(u => u.role === 'admin' || u.email === 'alfacleanmaster@gmail.com') || INITIAL_USERS[0];
      const updatedAdm: User = {
        ...adm,
        username: 'alfacleanmaster@gmail.com',
        email: 'alfacleanmaster@gmail.com',
        password: 'Saferoo##44H%',
        role: 'admin',
        status: 'active',
      };
      setCurrentUser(updatedAdm);
      return { success: true, user: updatedAdm, role: 'admin' };
    }

    // Check user by email or username or phone
    const foundUser = users.find(
      u =>
        u.email.toLowerCase() === trimmed ||
        u.username.toLowerCase() === trimmed ||
        u.phone.replace(/\s+/g, '') === trimmed.replace(/\s+/g, '')
    );

    if (foundUser) {
      if (foundUser.status === 'suspended') {
        return {
          success: false,
          message: language === 'ar' ? 'هذا الحساب معلق حالياً، يرجى التواصل مع الإدارة.' : 'This account is suspended.',
        };
      }
      const isOfficialAdminPass =
        (foundUser.role === 'admin' || foundUser.email === 'alfacleanmaster@gmail.com' || foundUser.username === 'admin') &&
        password === 'Saferoo##44H%';
      const isOfficialSupervisorPass =
        (foundUser.role === 'supervisor' || foundUser.email === 'alfacleanmaster888@gmail.com') &&
        password === 'Saferoo#$88$14';

      if (!isOfficialAdminPass && !isOfficialSupervisorPass && foundUser.password && password && foundUser.password !== password) {
        return {
          success: false,
          message: language === 'ar' ? 'كلمة المرور غير صحيحة' : 'Invalid password',
        };
      }
      setCurrentUser(foundUser);
      return { success: true, user: foundUser, role: foundUser.role };
    }

    // Cleaner login by phone without prior user object
    const foundCleaner = cleaners.find(
      c => c.phone.replace(/\s+/g, '') === trimmed.replace(/\s+/g, '')
    );
    if (foundCleaner) {
      const cleanerUser: User = {
        id: `user-${foundCleaner.id}`,
        username: foundCleaner.phone,
        email: `${foundCleaner.id}@alfaclean-uae.com`,
        role: 'cleaner',
        name: foundCleaner.name,
        phone: foundCleaner.phone,
        status: foundCleaner.status === 'inactive' ? 'suspended' : 'active',
        cleanerId: foundCleaner.id,
        createdAt: '2026-01-01',
      };
      setCurrentUser(cleanerUser);
      return { success: true, user: cleanerUser, role: 'cleaner' };
    }

    return {
      success: false,
      message: language === 'ar' ? 'بيانات الدخول غير صحيحة' : 'Invalid credentials',
    };
  };

  // Real Google Sign-in action
  const loginWithGoogleAction = async (): Promise<{ success: boolean; message?: string }> => {
    try {
      const result = await signInWithGoogle();
      if (!result.success || !result.user) {
        return {
          success: false,
          message: result.error || (language === 'ar' ? 'تعذر إتمام تسجيل الدخول عبر Google' : 'Google Sign-In failed'),
        };
      }

      const gUser = result.user;
      const email = (gUser.email || '').toLowerCase().trim();
      const displayName = gUser.displayName || email.split('@')[0] || 'عميل ألفا كلين';
      const photo = gUser.photoURL || undefined;
      const phone = gUser.phoneNumber || '';
      const uid = gUser.uid;

      // 1. Check if customer already exists (by email or googleUid)
      let existingCustomer = customers.find(
        c => c.googleUid === uid || (c.email && c.email.toLowerCase() === email)
      );

      let customerId = existingCustomer?.id;

      if (!existingCustomer) {
        customerId = `cust-g-${Date.now()}`;
        const welcomeAed = rewardsPolicy.welcomeBonusWalletAed || 25;
        const welcomePts = rewardsPolicy.welcomeBonusPoints || 50;

        const newCustomer: CustomerAccount = {
          id: customerId,
          name: displayName,
          email: email,
          phone: phone,
          walletBalance: welcomeAed,
          points: welcomePts,
          savedAddresses: [],
          activityLog: [
            {
              id: `act-${Date.now()}`,
              timestamp: new Date().toLocaleString(),
              type: 'wallet_credit',
              description: 'رصيد الهدية الترحيبية عند التسجيل عبر Google',
              amount: welcomeAed,
            },
          ],
          isGuest: false,
          pendingRewardBonus: 0,
          isSuspended: false,
          avatarUrl: photo,
          googleUid: uid,
          createdAt: new Date().toISOString().split('T')[0],
        };

        setCustomers(prev => [newCustomer, ...prev]);
        existingCustomer = newCustomer;
      } else {
        // Sync real photo and uid to existing customer profile
        setCustomers(prev =>
          prev.map(c =>
            c.id === existingCustomer!.id
              ? {
                  ...c,
                  name: displayName || c.name,
                  avatarUrl: photo || c.avatarUrl,
                  googleUid: uid,
                }
              : c
          )
        );
      }

      // 2. Check if user exists in `users`
      let existingUser = users.find(
        u => u.googleUid === uid || (u.email && u.email.toLowerCase() === email)
      );

      if (!existingUser) {
        const newUser: User = {
          id: `user-g-${Date.now()}`,
          username: email.split('@')[0] || `google_${uid.slice(0, 6)}`,
          email: email,
          name: displayName,
          phone: phone,
          role: 'customer',
          status: 'active',
          customerId: customerId,
          avatarUrl: photo,
          googleUid: uid,
          createdAt: new Date().toISOString().split('T')[0],
        };

        setUsers(prev => [newUser, ...prev]);
        existingUser = newUser;
      } else {
        const updated: User = {
          ...existingUser,
          name: displayName || existingUser.name,
          avatarUrl: photo || existingUser.avatarUrl,
          googleUid: uid,
          customerId: customerId || existingUser.customerId,
        };
        setUsers(prev => prev.map(u => (u.id === existingUser!.id ? updated : u)));
        existingUser = updated;
      }

      setCurrentUser(existingUser);
      return { success: true };
    } catch (err: any) {
      console.error('Google Sign-In App Error:', err);
      return {
        success: false,
        message: err?.message || 'حدث خطأ أثناء الاتصال بحساب Google',
      };
    }
  };

  // Sign up customer action
  const signUpCustomerAction = async (
    name: string,
    email: string,
    pass: string,
    phone: string
  ): Promise<{ success: boolean; message?: string }> => {
    try {
      const trimmedEmail = email.trim().toLowerCase();
      const res = await registerWithEmail(name.trim(), trimmedEmail, pass);
      if (!res.success) {
        return { success: false, message: res.error };
      }

      const customerId = `cust-${Date.now()}`;
      const welcomeAed = rewardsPolicy.welcomeBonusWalletAed || 25;
      const welcomePts = rewardsPolicy.welcomeBonusPoints || 50;

      const newCustomer: CustomerAccount = {
        id: customerId,
        name: name.trim() || 'عميل ألفا كلين',
        email: trimmedEmail,
        phone: phone.trim(),
        walletBalance: welcomeAed,
        points: welcomePts,
        savedAddresses: [],
        activityLog: [
          {
            id: `act-${Date.now()}`,
            timestamp: new Date().toLocaleString(),
            type: 'wallet_credit',
            description: 'مكافأة التسجيل والاشتراك الترحيبي في منظومة ألفا كلين',
            amount: welcomeAed,
          },
        ],
        isGuest: false,
        pendingRewardBonus: 0,
        isSuspended: false,
        createdAt: new Date().toISOString().split('T')[0],
      };

      setCustomers(prev => [newCustomer, ...prev]);

      const newUser: User = {
        id: `user-${Date.now()}`,
        username: trimmedEmail.split('@')[0],
        email: trimmedEmail,
        password: pass,
        role: 'customer',
        name: name.trim() || 'عميل ألفا كلين',
        phone: phone.trim(),
        status: 'active',
        customerId: customerId,
        createdAt: new Date().toISOString().split('T')[0],
      };

      setUsers(prev => [newUser, ...prev]);
      setCurrentUser(newUser);

      return { success: true };
    } catch (err: any) {
      console.error('Sign up error:', err);
      return { success: false, message: err?.message || 'تعذر إتمام التسجيل' };
    }
  };

  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem('alfaclean_currentUser');
    firebaseSignOut().catch(() => {});
    setActiveView('home');
  };

  // Admin exclusive user management
  const updateUserByAdmin = (updatedUser: User) => {
    setUsers(prev => prev.map(u => (u.id === updatedUser.id ? updatedUser : u)));
    // If updating currently logged in user
    if (currentUser?.id === updatedUser.id) {
      setCurrentUser(updatedUser);
    }
  };

  const addNewUser = (newUser: Omit<User, 'id' | 'createdAt'>) => {
    const id = `user-${Date.now()}`;
    const user: User = {
      ...newUser,
      id,
      createdAt: new Date().toISOString().split('T')[0],
    };
    setUsers(prev => [...prev, user]);
  };

  const deleteUserByAdmin = (userId: string): { success: boolean; message?: string } => {
    const target = users.find(u => u.id === userId);
    if (!target) {
      return { success: false, message: 'المستخدم غير موجود' };
    }
    if (target.email === 'alfacleanmaster@gmail.com' || target.id === 'user-admin') {
      return {
        success: false,
        message: language === 'ar' ? 'لا يمكن حذف الحساب الجذري لمدير النظام' : 'Cannot delete primary root administrator',
      };
    }
    if (currentUser?.id === userId) {
      return {
        success: false,
        message: language === 'ar' ? 'لا يمكنك حذف حسابك الحالي أثناء تسجيل الدخول به' : 'Cannot delete currently active account',
      };
    }
    setUsers(prev => prev.filter(u => u.id !== userId));
    return { success: true };
  };

  const toggleUserSuspensionByAdmin = (userId: string): { success: boolean; message?: string } => {
    const target = users.find(u => u.id === userId);
    if (!target) {
      return { success: false, message: 'المستخدم غير موجود' };
    }
    if (target.email === 'alfacleanmaster@gmail.com' || target.id === 'user-admin') {
      return {
        success: false,
        message: language === 'ar' ? 'لا يمكن تعليق الحساب الجذري لمدير النظام' : 'Cannot suspend primary root administrator',
      };
    }
    const nextStatus = target.status === 'active' ? 'suspended' : 'active';
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, status: nextStatus } : u));
    return { success: true };
  };

  const resetUserPasswordByAdmin = (userId: string, newPass: string): { success: boolean; message?: string } => {
    if (!newPass || newPass.trim().length < 6) {
      return {
        success: false,
        message: language === 'ar' ? 'يجب أن لا تقل كلمة المرور عن 6 أحرف' : 'Password must be at least 6 characters',
      };
    }
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, password: newPass.trim() } : u));
    return { success: true };
  };

  // Brand and policies
  const updateBrandSettings = (newSettings: Partial<BrandSettings>) => {
    setBrandSettings(prev => {
      const updated = { ...prev, ...newSettings };
      if (typeof document !== 'undefined') {
        if (updated.ogImageUrl) {
          const ogImg = document.querySelector('meta[property="og:image"]');
          if (ogImg) ogImg.setAttribute('content', updated.ogImageUrl);
          const twImg = document.querySelector('meta[name="twitter:image"]');
          if (twImg) twImg.setAttribute('content', updated.ogImageUrl);
        }
        if (updated.ogTitle) {
          const ogTitle = document.querySelector('meta[property="og:title"]');
          if (ogTitle) ogTitle.setAttribute('content', updated.ogTitle);
        }
        if (updated.ogDescription) {
          const ogDesc = document.querySelector('meta[property="og:description"]');
          if (ogDesc) ogDesc.setAttribute('content', updated.ogDescription);
        }
      }
      return updated;
    });
  };

  const updatePromoMedia = (newSettings: Partial<PromoMediaSettings>) => {
    setPromoMedia(prev => ({ ...prev, ...newSettings }));
  };

  const updateRewardsPolicy = (newSettings: Partial<RewardsPolicySettings>) => {
    setRewardsPolicy(prev => ({ ...prev, ...newSettings }));
  };

  // Service Areas
  const updateServiceAreaFee = (id: string, travelFee: number, isActive?: boolean) => {
    setServiceAreas(prev =>
      prev.map(area =>
        area.id === id
          ? {
              ...area,
              travelFee,
              isActive: isActive !== undefined ? isActive : area.isActive,
            }
          : area
      )
    );
  };

  const addServiceArea = (newArea: Omit<ServiceArea, 'id'>) => {
    const id = `area-${Date.now()}`;
    setServiceAreas(prev => [...prev, { ...newArea, id }]);
  };

  // Cleaners
  const addCleaner = (newCleaner: Omit<Cleaner, 'id' | 'operationalLogs'>) => {
    const id = `cleaner-${Date.now()}`;
    const cleaner: Cleaner = {
      ...newCleaner,
      id,
      operationalLogs: [],
    };
    setCleaners(prev => [...prev, cleaner]);
  };

  const updateCleaner = (cleanerId: string, updates: Partial<Cleaner>) => {
    setCleaners(prev =>
      prev.map(c => (c.id === cleanerId ? { ...c, ...updates } : c))
    );
  };

  const addCleanerLog = (
    cleanerId: string,
    log: Omit<CleanerLog, 'id' | 'cleanerId' | 'date'>
  ) => {
    const newLog: CleanerLog = {
      id: `log-${Date.now()}`,
      cleanerId,
      date: new Date().toISOString().split('T')[0],
      ...log,
    };
    setCleaners(prev =>
      prev.map(c => {
        if (c.id === cleanerId) {
          return {
            ...c,
            operationalLogs: [newLog, ...c.operationalLogs],
          };
        }
        return c;
      })
    );
  };

  // Customers & Wallet
  const adjustCustomerWallet = (customerId: string, deltaAmount: number, reason: string) => {
    setCustomers(prev =>
      prev.map(c => {
        if (c.id === customerId) {
          const newBal = Math.max(0, c.walletBalance + deltaAmount);
          const actItem = {
            id: `act-${Date.now()}`,
            timestamp: new Date().toLocaleString(),
            type: deltaAmount >= 0 ? ('wallet_credit' as const) : ('wallet_debit' as const),
            description: reason,
            amount: Math.abs(deltaAmount),
          };
          return {
            ...c,
            walletBalance: newBal,
            activityLog: [actItem, ...c.activityLog],
          };
        }
        return c;
      })
    );
  };

  const approveCustomerBonus = (customerId: string) => {
    setCustomers(prev =>
      prev.map(c => {
        if (c.id === customerId && c.pendingRewardBonus > 0) {
          const bonus = c.pendingRewardBonus;
          return {
            ...c,
            walletBalance: c.walletBalance + bonus,
            pendingRewardBonus: 0,
            activityLog: [
              {
                id: `act-${Date.now()}`,
                timestamp: new Date().toLocaleString(),
                type: 'wallet_credit' as const,
                description: 'اعتماد رصيد الهدية الترحيبية من قبل مشرف العمليات',
                amount: bonus,
              },
              ...c.activityLog,
            ],
          };
        }
        return c;
      })
    );
  };

  const toggleCustomerSuspension = (customerId: string) => {
    setCustomers(prev =>
      prev.map(c => {
        if (c.id === customerId) {
          const nextState = !c.isSuspended;
          return {
            ...c,
            isSuspended: nextState,
            activityLog: [
              {
                id: `act-${Date.now()}`,
                timestamp: new Date().toLocaleString(),
                type: 'status_change' as const,
                description: nextState ? 'تم تعليق الحساب' : 'تم رفع التعليق وتنشيط الحساب',
              },
              ...c.activityLog,
            ],
          };
        }
        return c;
      })
    );
  };

  const resetCustomerPassword = (customerId: string, newPass: string) => {
    const cust = customers.find(c => c.id === customerId);
    if (!cust) return;
    setUsers(prev =>
      prev.map(u => (u.customerId === customerId || u.email === cust.email ? { ...u, password: newPass } : u))
    );
  };

  // Bookings
  const createBooking = (
    bookingInput: Omit<Booking, 'id' | 'reference' | 'createdAt' | 'updatedAt'>
  ) => {
    // Generate unique reference e.g. ALFA-8219
    const randomCode = Math.floor(1000 + Math.random() * 9000);
    const reference = `ALFA-${randomCode}`;
    const nowIso = new Date().toISOString();
    const todayStr = nowIso.split('T')[0];

    // Check if customer is suspended
    let targetCustomer = customers.find(c => c.id === bookingInput.customerId || c.phone === bookingInput.customerPhone);

    if (targetCustomer && targetCustomer.isSuspended) {
      return {
        success: false,
        error: language === 'ar' ? 'نعتذر، هذا الحساب معلق ولا يمكن إتمام الحجز. يرجى التواصل مع خدمة العملاء.' : 'Sorry, this account is suspended and cannot make bookings.',
      };
    }

    let customerId = bookingInput.customerId;

    // If guest booking: automatically create guest customer record per specifications:
    // "عميل طلب #${guestRef} - ${guestDate}"
    if (bookingInput.isGuest || !targetCustomer) {
      const guestName = bookingInput.isGuest
        ? `عميل طلب #${reference} - ${todayStr}`
        : bookingInput.customerName;

      customerId = `cust-${Date.now()}`;
      const newCustomer: CustomerAccount = {
        id: customerId,
        name: guestName,
        email: bookingInput.customerEmail || `guest_${randomCode}@alfaclean-guest.ae`,
        phone: bookingInput.customerPhone,
        walletBalance: 0,
        points: Math.round(bookingInput.total * rewardsPolicy.pointsPerAed),
        savedAddresses: [
          {
            id: `addr-${Date.now()}`,
            label: bookingInput.address.areaName,
            areaId: bookingInput.address.areaId,
            areaName: bookingInput.address.areaName,
            street: bookingInput.address.street,
            building: bookingInput.address.building,
            apartment: bookingInput.address.apartment,
          },
        ],
        activityLog: [
          {
            id: `act-${Date.now()}`,
            timestamp: new Date().toLocaleString(),
            type: 'booking_created',
            description: `حجز جديد برقم ${reference}`,
            amount: bookingInput.total,
          },
        ],
        isGuest: bookingInput.isGuest,
        guestOrderRef: bookingInput.isGuest ? reference : undefined,
        pendingRewardBonus: rewardsPolicy.requireSupervisorApproval ? rewardsPolicy.welcomeBonusWalletAed : 0,
        isSuspended: false,
        createdAt: todayStr,
      };

      setCustomers(prev => [newCustomer, ...prev]);
    } else {
      // Registered customer: update points and activity
      const earnedPoints = Math.round(bookingInput.total * rewardsPolicy.pointsPerAed);
      setCustomers(prev =>
        prev.map(c => {
          if (c.id === targetCustomer!.id) {
            return {
              ...c,
              points: c.points + earnedPoints,
              activityLog: [
                {
                  id: `act-${Date.now()}`,
                  timestamp: new Date().toLocaleString(),
                  type: 'points_earned' as const,
                  description: `اكتساب ${earnedPoints} نقطة من الحجز #${reference}`,
                  amount: earnedPoints,
                },
                ...c.activityLog,
              ],
            };
          }
          return c;
        })
      );
    }

    const newBooking: Booking = {
      ...bookingInput,
      id: `booking-${Date.now()}`,
      reference,
      customerId,
      createdAt: nowIso,
      updatedAt: nowIso,
    };

    setBookings(prev => [newBooking, ...prev]);

    return {
      success: true,
      booking: newBooking,
    };
  };

  const updateBookingStatus = (
    bookingId: string,
    status: BookingStatus,
    extra?: Partial<Booking>
  ) => {
    setBookings(prev =>
      prev.map(b =>
        b.id === bookingId
          ? {
              ...b,
              status,
              ...(extra || {}),
              updatedAt: new Date().toISOString(),
            }
          : b
      )
    );
  };

  const submitBookingReview = (bookingId: string, rating: number, reviewText: string) => {
    const today = new Date().toISOString().split('T')[0];
    setBookings(prev =>
      prev.map(b =>
        b.id === bookingId
          ? {
              ...b,
              rating,
              reviewText,
              reviewDate: today,
              updatedAt: new Date().toISOString(),
            }
          : b
      )
    );
  };

  // Glowing red alert button for in-progress bookings
  const inProgressBooking =
    bookings.find(b => b.status === 'in_progress') || null;

  // Simple translations helper
  const t = (key: string): string => {
    const dict: Record<string, { ar: string; en: string }> = {
      brand_tagline: {
        ar: 'المنظومة الذكية لحجز خدمات تنظيف المنازل بالساعة في أبوظبي',
        en: 'The Smart System for Hourly Home Cleaning Services in Abu Dhabi',
      },
      book_now: { ar: 'احجز الآن', en: 'Book Now' },
      track_order: { ar: 'تتبع طلبك', en: 'Track Booking' },
      login: { ar: 'تسجيل الدخول', en: 'Sign In' },
      logout: { ar: 'تسجيل الخروج', en: 'Sign Out' },
      dashboard: { ar: 'لوحة التحكم', en: 'Dashboard' },
      cleaner_portal: { ar: 'بوابة مهام العاملة', en: 'Cleaner Portal' },
      wallet: { ar: 'المحفظة', en: 'Wallet' },
      aed: { ar: 'د.إ', en: 'AED' },
      points: { ar: 'نقطة', en: 'Pts' },
      in_progress_alert: {
        ar: 'طلب قيد التنفيذ الآن',
        en: 'Order In-Progress Now',
      },
      click_to_track: { ar: 'اضغط للتتبع المباشر', en: 'Click for live tracking' },
    };
    if (dict[key]) {
      return language === 'ar' ? dict[key].ar : dict[key].en;
    }
    return key;
  };

  return (
    <AppContext.Provider
      value={{
        language,
        setLanguage,
        t,
        currentUser,
        users,
        login,
        loginWithGoogleAction,
        signUpCustomerAction,
        logout,
        updateUserByAdmin,
        addNewUser,
        deleteUserByAdmin,
        toggleUserSuspensionByAdmin,
        resetUserPasswordByAdmin,
        brandSettings,
        updateBrandSettings,
        promoMedia,
        updatePromoMedia,
        rewardsPolicy,
        updateRewardsPolicy,
        serviceAreas,
        updateServiceAreaFee,
        addServiceArea,
        cleaners,
        addCleaner,
        updateCleaner,
        addCleanerLog,
        customers,
        adjustCustomerWallet,
        approveCustomerBonus,
        toggleCustomerSuspension,
        resetCustomerPassword,
        bookings,
        createBooking,
        updateBookingStatus,
        submitBookingReview,
        inProgressBooking,
        activeView,
        setActiveView,
        activeTrackingRef,
        setActiveTrackingRef,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const ctx = useContext(AppContext);
  if (!ctx) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return ctx;
};
