/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Booking, Cleaner, ServiceArea, BookingFrequency } from '../types';

/**
 * Converts "HH:MM" (24-hour) to minutes from midnight
 */
export function timeToMinutes(timeStr: string): number {
  if (!timeStr) return 0;
  const [h, m] = timeStr.split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
}

/**
 * Converts minutes from midnight to "HH:MM" format
 */
export function minutesToTime(mins: number): string {
  const normalized = Math.max(0, Math.min(mins, 24 * 60 - 1));
  const h = Math.floor(normalized / 60);
  const m = normalized % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
}

/**
 * Calculates end time given start time and duration in hours
 */
export function calculateEndTime(startTime: string, hours: number): string {
  const startMins = timeToMinutes(startTime);
  const durationMins = Math.round(hours * 60);
  const endMins = startMins + durationMins;
  return minutesToTime(endMins);
}

/**
 * Checks if a given date string "YYYY-MM-DD" is strictly before today in local timezone
 */
export function isPastDate(dateStr: string, referenceDate: Date = new Date()): boolean {
  if (!dateStr) return true;
  const [y, m, d] = dateStr.split('-').map(Number);
  if (!y || !m || !d) return true;

  const target = new Date(y, m - 1, d);
  target.setHours(0, 0, 0, 0);

  const ref = new Date(referenceDate);
  ref.setHours(0, 0, 0, 0);

  return target.getTime() < ref.getTime();
}

/**
 * Gets formatted today date "YYYY-MM-DD"
 */
export function getTodayDateString(referenceDate: Date = new Date()): string {
  const y = referenceDate.getFullYear();
  const m = (referenceDate.getMonth() + 1).toString().padStart(2, '0');
  const d = referenceDate.getDate().toString().padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Checks if two time intervals overlap, taking into account an optional buffer in minutes
 */
export function doIntervalsOverlap(
  startA: number,
  endA: number,
  startB: number,
  endB: number,
  bufferMinutes: number = 30
): boolean {
  // Interval A with buffer: [startA - buffer, endA + buffer] vs [startB, endB]
  return Math.max(startA - bufferMinutes, 0) < endB && startB < endA + bufferMinutes;
}

/**
 * Checks if a cleaner is available on a specific date and time slot
 * with a mandatory 30-minute transition buffer between consecutive jobs
 */
export function isCleanerAvailable(
  cleaner: Cleaner,
  dateStr: string,
  startTime: string,
  endTime: string,
  existingBookings: Booking[],
  excludeBookingId?: string,
  bufferMinutes: number = 30
): boolean {
  if (cleaner.status !== 'active') return false;

  // Check day of week (0=Sunday ... 6=Saturday)
  const [y, m, d] = dateStr.split('-').map(Number);
  const dateObj = new Date(y, m - 1, d);
  const dayOfWeek = dateObj.getDay();

  if (!cleaner.workingDays.includes(dayOfWeek)) {
    return false;
  }

  const reqStart = timeToMinutes(startTime);
  const reqEnd = timeToMinutes(endTime);

  const cleanerWorkStart = timeToMinutes(cleaner.workingHours.start);
  const cleanerWorkEnd = timeToMinutes(cleaner.workingHours.end);

  // Must fall completely within cleaner work shift
  if (reqStart < cleanerWorkStart || reqEnd > cleanerWorkEnd) {
    return false;
  }

  // Check conflicting bookings on the same date
  const sameDayBookings = existingBookings.filter(
    b =>
      b.cleanerId === cleaner.id &&
      b.date === dateStr &&
      b.status !== 'cancelled' &&
      b.id !== excludeBookingId
  );

  for (const b of sameDayBookings) {
    const bStart = timeToMinutes(b.startTime);
    const bEnd = timeToMinutes(b.endTime);

    if (doIntervalsOverlap(reqStart, reqEnd, bStart, bEnd, bufferMinutes)) {
      return false;
    }
  }

  return true;
}

/**
 * Finds all cleaners available for the chosen date and time window
 */
export function getAvailableCleaners(
  cleaners: Cleaner[],
  dateStr: string,
  startTime: string,
  endTime: string,
  existingBookings: Booking[],
  excludeBookingId?: string
): Cleaner[] {
  return cleaners.filter(c =>
    isCleanerAvailable(c, dateStr, startTime, endTime, existingBookings, excludeBookingId, 30)
  );
}

/**
 * Suggest alternative available slots on the same day if the chosen one is occupied
 */
export function suggestAlternativeSlots(
  cleaners: Cleaner[],
  dateStr: string,
  hours: number,
  existingBookings: Booking[],
  candidateTimes: string[] = ['08:00', '10:00', '12:00', '14:00', '16:00', '18:00']
): { time: string; cleaner: Cleaner }[] {
  const suggestions: { time: string; cleaner: Cleaner }[] = [];

  for (const slotStart of candidateTimes) {
    const slotEnd = calculateEndTime(slotStart, hours);
    // ensure within 08:00 to 20:00
    if (timeToMinutes(slotEnd) > timeToMinutes('20:00')) continue;

    for (const c of cleaners) {
      if (isCleanerAvailable(c, dateStr, slotStart, slotEnd, existingBookings, undefined, 30)) {
        suggestions.push({ time: slotStart, cleaner: c });
        break; // found one available cleaner for this slot
      }
    }
  }

  return suggestions;
}

/**
 * Add-on services pricing in AED
 */
export const ADD_ON_PRICES: Record<string, { price: number; nameAr: string; nameEn: string }> = {
  ironing: { price: 25, nameAr: 'كوي الملابس (ساعة إضافية)', nameEn: 'Clothes Ironing (+1hr)' },
  interior_windows: { price: 30, nameAr: 'تنظيف النوافذ الداخلية', nameEn: 'Interior Windows Cleaning' },
  balcony: { price: 25, nameAr: 'غسيل وتعقيم الشرفة / البلكونة', nameEn: 'Balcony Washing & Disinfection' },
  oven_deep: { price: 35, nameAr: 'تنظيف عميق للفرن والثلاجة', nameEn: 'Oven & Fridge Deep Clean' },
  cleaning_materials: { price: 20, nameAr: 'توفير مواد ومعدات التنظيف المعتمدة', nameEn: 'Provide Certified Cleaning Supplies' },
};

/**
 * Calculates pricing breakdown
 */
export function calculatePricing({
  hours,
  baseRate = 35,
  addOns = [],
  frequency = 'once',
  area,
  walletBalanceToUse = 0,
  promoDiscount = 0,
}: {
  hours: number;
  baseRate: number;
  addOns: string[];
  frequency: BookingFrequency;
  area?: ServiceArea | null;
  walletBalanceToUse?: number;
  promoDiscount?: number;
}): {
  subtotal: number;
  travelFee: number;
  frequencyDiscount: number;
  frequencyPercent: number;
  addOnsTotal: number;
  promoDiscount: number;
  walletUsed: number;
  total: number;
} {
  const hoursCost = hours * baseRate;

  let addOnsTotal = 0;
  for (const key of addOns) {
    if (ADD_ON_PRICES[key]) {
      addOnsTotal += ADD_ON_PRICES[key].price;
    }
  }

  const subtotal = hoursCost + addOnsTotal;

  let frequencyPercent = 0;
  if (frequency === 'weekly') frequencyPercent = 15;
  else if (frequency === 'biweekly') frequencyPercent = 10;
  else if (frequency === 'monthly') frequencyPercent = 5;

  const frequencyDiscount = Math.round((subtotal * frequencyPercent) / 100);

  const travelFee = area ? area.travelFee : 0;

  // Gross total before wallet
  const grossAfterDiscounts = Math.max(0, subtotal + travelFee - frequencyDiscount - promoDiscount);

  // Wallet deduction capped at remaining balance
  const walletUsed = Math.min(walletBalanceToUse, grossAfterDiscounts);
  const total = Math.max(0, Math.round(grossAfterDiscounts - walletUsed));

  return {
    subtotal,
    travelFee,
    frequencyDiscount,
    frequencyPercent,
    addOnsTotal,
    promoDiscount,
    walletUsed,
    total,
  };
}

/**
 * Export data to UTF-8 BOM CSV (ensuring perfect Arabic display in MS Excel / Mac)
 */
export function exportToCsv(
  headers: { key: string; label: string }[],
  rows: Record<string, any>[],
  filename: string
): void {
  const bom = '\uFEFF';
  const headerLine = headers.map(h => `"${(h.label || '').replace(/"/g, '""')}"`).join(',');
  const rowLines = rows.map(row => {
    return headers
      .map(h => {
        const val = row[h.key] !== undefined && row[h.key] !== null ? String(row[h.key]) : '';
        return `"${val.replace(/"/g, '""')}"`;
      })
      .join(',');
  });

  const csvContent = bom + [headerLine, ...rowLines].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  triggerDownload(blob, filename.endsWith('.csv') ? filename : `${filename}.csv`);
}

/**
 * Export data to Arabized HTML-based Excel (.xls) file with dir="rtl" and styling
 */
export function exportToExcelHtml(
  title: string,
  headers: string[],
  rows: (string | number)[][],
  filename: string
): void {
  const bom = '\uFEFF';
  const html = `
<!DOCTYPE html>
<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
  <!--[if gte mso 9]>
  <xml>
    <x:ExcelWorkbook>
      <x:ExcelWorksheets>
        <x:ExcelWorksheet>
          <x:Name>${title}</x:Name>
          <x:WorksheetOptions>
            <x:DisplayRightToLeft/>
          </x:WorksheetOptions>
        </x:ExcelWorksheet>
      </x:ExcelWorksheets>
    </x:ExcelWorkbook>
  </xml>
  <![endif]-->
  <style>
    body { font-family: 'Segoe UI', Tahoma, Arial, sans-serif; }
    table { border-collapse: collapse; width: 100%; direction: rtl; text-align: right; }
    th { background-color: #0284c7; color: #ffffff; padding: 10px 14px; border: 1px solid #0369a1; font-size: 13px; font-weight: bold; }
    td { padding: 8px 12px; border: 1px solid #e2e8f0; font-size: 12px; color: #1e293b; }
    tr:nth-child(even) td { background-color: #f8fafc; }
    .title { font-size: 18px; font-weight: bold; color: #0284c7; margin-bottom: 12px; text-align: right; }
  </style>
</head>
<body dir="rtl">
  <div class="title">منظومة ألفا كلين - ${title}</div>
  <table>
    <thead>
      <tr>
        ${headers.map(h => `<th>${h}</th>`).join('')}
      </tr>
    </thead>
    <tbody>
      ${rows
        .map(
          r =>
            `<tr>${r
              .map(cell => `<td>${cell !== undefined && cell !== null ? String(cell) : ''}</td>`)
              .join('')}</tr>`
        )
        .join('')}
    </tbody>
  </table>
</body>
</html>
  `.trim();

  const blob = new Blob([bom + html], { type: 'application/vnd.ms-excel;charset=utf-8;' });
  triggerDownload(blob, filename.endsWith('.xls') ? filename : `${filename}.xls`);
}

function triggerDownload(blob: Blob, filename: string): void {
  if (typeof window === 'undefined') return;
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
