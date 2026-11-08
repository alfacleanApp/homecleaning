/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type UserRole = 'admin' | 'supervisor' | 'cleaner' | 'customer';

export type UserStatus = 'active' | 'suspended';

export interface User {
  id: string;
  username: string;
  email: string;
  password?: string;
  role: UserRole;
  name: string;
  phone: string;
  status: UserStatus;
  cleanerId?: string; // If role === 'cleaner'
  customerId?: string; // If role === 'customer'
  avatarUrl?: string;
  googleUid?: string;
  createdAt: string;
}

export type CleanerStatus = 'active' | 'on_leave' | 'inactive';

export interface CleanerLog {
  id: string;
  cleanerId: string;
  date: string;
  authorName: string;
  rating: number; // 1-5
  category: 'performance' | 'attendance' | 'complaint' | 'praise';
  notes: string;
}

export interface Cleaner {
  id: string;
  name: string;
  nameEn: string;
  phone: string;
  hourlyRate: number; // AED
  rating: number; // 1-5
  completedJobs: number;
  status: CleanerStatus;
  nationality: string;
  nationalityEn: string;
  avatarUrl?: string;
  workingHours: {
    start: string; // "08:00"
    end: string;   // "20:00"
  };
  workingDays: number[]; // 0=Sun, 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri, 6=Sat
  operationalLogs: CleanerLog[];
}

export type BookingFrequency = 'once' | 'weekly' | 'biweekly' | 'monthly';

export type PaymentMethod = 'cash' | 'bank_transfer' | 'card';

export type PaymentStatus = 'pending' | 'paid' | 'confirmed_cash';

export type BookingStatus = 'pending' | 'confirmed' | 'dispatched' | 'in_progress' | 'completed' | 'cancelled';

export interface BookingAddress {
  areaId: string;
  areaName: string;
  areaNameEn: string;
  street: string;
  building: string;
  apartment: string;
  notes?: string;
}

export interface Booking {
  id: string;
  reference: string; // e.g. "ALFA-4829"
  customerId: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  isGuest: boolean;
  date: string; // "YYYY-MM-DD"
  startTime: string; // "09:00"
  endTime: string; // "12:00"
  hours: number;
  cleanerId: string;
  cleanerName: string;
  serviceType: string;
  frequency: BookingFrequency;
  addOns: string[];
  address: BookingAddress;
  subtotal: number;
  travelFee: number;
  discount: number;
  discountSource?: string;
  total: number;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  status: BookingStatus;
  cleanerNotes?: string;
  rating?: number;
  reviewText?: string;
  reviewDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CustomerAddress {
  id: string;
  label: string;
  areaId: string;
  areaName: string;
  street: string;
  building: string;
  apartment: string;
}

export interface ActivityLogItem {
  id: string;
  timestamp: string;
  type: 'wallet_credit' | 'wallet_debit' | 'points_earned' | 'points_redeemed' | 'booking_created' | 'status_change';
  description: string;
  amount?: number;
}

export interface CustomerAccount {
  id: string;
  name: string;
  email: string;
  phone: string;
  walletBalance: number;
  points: number;
  savedAddresses: CustomerAddress[];
  activityLog: ActivityLogItem[];
  isGuest: boolean;
  guestOrderRef?: string;
  pendingRewardBonus: number;
  isSuspended: boolean;
  avatarUrl?: string;
  googleUid?: string;
  createdAt: string;
}

export interface ServiceArea {
  id: string;
  nameAr: string;
  nameEn: string;
  travelFee: number; // In AED, can be 0
  isActive: boolean;
  zone: string;
}

export interface PromoMediaSettings {
  isEnabled: boolean;
  mediaType: 'video' | 'image';
  mediaUrl: string; // Youtube link or MP4 or image
  titleAr: string;
  titleEn: string;
  subtitleAr: string;
  subtitleEn: string;
  ctaTextAr: string;
  ctaTextEn: string;
  ctaLink: string;
}

export interface RewardsPolicySettings {
  pointsPerAed: number; // e.g. 1 point per 1 AED spent
  redemptionRate: number; // e.g. 100 points = 10 AED (0.10)
  validityDays: number; // e.g. 90
  requireSupervisorApproval: boolean;
  welcomeBonusPoints: number; // e.g. 50 points
  welcomeBonusWalletAed: number; // e.g. 25 AED
  isWheelActive: boolean; // Managed by Operations Supervisor & App Admin to toggle the Wheel of Fortune
}

export interface BrandSettings {
  logoUrl: string;
  ogImageUrl: string; // The expressive image shown when sharing the link on WhatsApp, Facebook, etc.
  ogTitle?: string;
  ogDescription?: string;
  companyNameAr: string;
  companyNameEn: string;
  phone: string;
  email: string;
  addressAr: string;
  addressEn: string;
  bankName: string;
  bankAccountName: string;
  bankIban: string;
  bankAccountNumber: string;
  bankSwift: string;
  hourlyBaseRate: number; // Default 35 AED / hour
}

export type Language = 'ar' | 'en';
