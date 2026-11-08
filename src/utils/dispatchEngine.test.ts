/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import {
  timeToMinutes,
  minutesToTime,
  calculateEndTime,
  isPastDate,
  doIntervalsOverlap,
  isCleanerAvailable,
  calculatePricing,
} from './dispatchEngine';
import { Cleaner, Booking } from '../types';

test('timeToMinutes and minutesToTime conversions', () => {
  assert.equal(timeToMinutes('00:00'), 0);
  assert.equal(timeToMinutes('08:30'), 510);
  assert.equal(timeToMinutes('14:15'), 855);
  assert.equal(minutesToTime(510), '08:30');
  assert.equal(minutesToTime(855), '14:15');
});

test('calculateEndTime adds hours correctly', () => {
  assert.equal(calculateEndTime('09:00', 3), '12:00');
  assert.equal(calculateEndTime('13:30', 2.5), '16:00');
  assert.equal(calculateEndTime('16:00', 4), '20:00');
});

test('isPastDate strictly rejects past dates', () => {
  const refDate = new Date(2026, 10, 1); // 2026-11-01
  assert.equal(isPastDate('2026-10-31', refDate), true);
  assert.equal(isPastDate('2026-11-01', refDate), false);
  assert.equal(isPastDate('2026-11-02', refDate), false);
});

test('doIntervalsOverlap respects 30-minute travel buffer', () => {
  // Job 1: 09:00 - 11:00 (540 - 660 mins)
  // Job 2: 11:15 - 13:15 (675 - 795 mins) -> gap is only 15 mins (< 30 min buffer)
  assert.equal(doIntervalsOverlap(540, 660, 675, 795, 30), true);

  // Job 3: 11:35 - 13:35 (695 - 815 mins) -> gap is 35 mins (>= 30 min buffer)
  assert.equal(doIntervalsOverlap(540, 660, 695, 815, 30), false);
});

test('isCleanerAvailable checks working shift, days, and existing bookings with buffer', () => {
  const cleaner: Cleaner = {
    id: 'cleaner-1',
    name: 'مريم نور',
    nameEn: 'Mariam Nour',
    phone: '0501112233',
    hourlyRate: 35,
    rating: 4.9,
    completedJobs: 142,
    status: 'active',
    nationality: 'الفلبين',
    nationalityEn: 'Philippines',
    workingHours: { start: '08:00', end: '20:00' },
    workingDays: [0, 1, 2, 3, 4, 5, 6], // All week
    operationalLogs: [],
  };

  const existingBookings: Booking[] = [
    {
      id: 'b1',
      reference: 'ALFA-1001',
      customerId: 'c1',
      customerName: 'فاطمة الكعبي',
      customerPhone: '0509998877',
      customerEmail: 'fatima@example.com',
      isGuest: false,
      date: '2026-11-05',
      startTime: '09:00',
      endTime: '12:00',
      hours: 3,
      cleanerId: 'cleaner-1',
      cleanerName: 'مريم نور',
      serviceType: 'home_cleaning',
      frequency: 'once',
      addOns: [],
      address: {
        areaId: 'reem',
        areaName: 'جزيرة الريم',
        areaNameEn: 'Al Reem Island',
        street: 'شارع السلام',
        building: 'برج الشمس',
        apartment: '1402',
      },
      subtotal: 105,
      travelFee: 20,
      discount: 0,
      total: 125,
      paymentMethod: 'cash',
      paymentStatus: 'pending',
      status: 'confirmed',
      createdAt: '2026-11-01',
      updatedAt: '2026-11-01',
    },
  ];

  // Slot starting at 12:15 -> only 15 min buffer from 12:00 -> NOT available
  assert.equal(
    isCleanerAvailable(cleaner, '2026-11-05', '12:15', '14:15', existingBookings, undefined, 30),
    false
  );

  // Slot starting at 12:30 -> 30 min buffer from 12:00 -> IS available
  assert.equal(
    isCleanerAvailable(cleaner, '2026-11-05', '12:30', '14:30', existingBookings, undefined, 30),
    true
  );

  // Outside working hours: 07:00 - 09:00 -> NOT available
  assert.equal(
    isCleanerAvailable(cleaner, '2026-11-05', '07:00', '09:00', existingBookings, undefined, 30),
    false
  );
});

test('calculatePricing computes transparent invoice breakdown correctly', () => {
  const result = calculatePricing({
    hours: 4,
    baseRate: 35, // 4 * 35 = 140
    addOns: ['ironing', 'interior_windows'], // 25 + 30 = 55
    frequency: 'weekly', // 15% off subtotal (140 + 55 = 195 * 0.15 = 29.25 ~ 29)
    area: {
      id: 'yas',
      nameAr: 'جزيرة ياس',
      nameEn: 'Yas Island',
      travelFee: 25,
      isActive: true,
      zone: 'Zone A',
    },
    walletBalanceToUse: 20,
  });

  assert.equal(result.subtotal, 195);
  assert.equal(result.travelFee, 25);
  assert.equal(result.frequencyPercent, 15);
  assert.equal(result.frequencyDiscount, 29);
  assert.equal(result.addOnsTotal, 55);
  assert.equal(result.walletUsed, 20);
  // Gross: 195 + 25 - 29 = 191; after wallet: 191 - 20 = 171
  assert.equal(result.total, 171);
});
