/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { Sparkles, X, Gift, Check, Trophy, ArrowRight, RotateCw, Copy } from 'lucide-react';

interface WheelSlice {
  id: number;
  labelAr: string;
  labelEn: string;
  color: string;
  textColor: string;
  type: 'wallet' | 'discount' | 'points' | 'addon';
  value: number; // AED amount or discount percentage or points
  code?: string;
}

const SLICES: WheelSlice[] = [
  { id: 0, labelAr: '25 د.إ محفظة', labelEn: '25 AED Wallet', color: '#0284c7', textColor: '#ffffff', type: 'wallet', value: 25 },
  { id: 1, labelAr: 'خصم 15%', labelEn: '15% Discount', color: '#f59e0b', textColor: '#1e293b', type: 'discount', value: 15, code: 'ALFAWHEEL15' },
  { id: 2, labelAr: '50 نقطة', labelEn: '50 Points', color: '#10b981', textColor: '#ffffff', type: 'points', value: 50 },
  { id: 3, labelAr: 'ساعة مجانية', labelEn: '1 Free Hour', color: '#ec4899', textColor: '#ffffff', type: 'discount', value: 35, code: 'FREEHOUR35' },
  { id: 4, labelAr: '10 د.إ محفظة', labelEn: '10 AED Wallet', color: '#0ea5e9', textColor: '#ffffff', type: 'wallet', value: 10 },
  { id: 5, labelAr: 'خصم 20%', labelEn: '20% Discount', color: '#eab308', textColor: '#1e293b', type: 'discount', value: 20, code: 'ALFAVIP20' },
  { id: 6, labelAr: '100 نقطة', labelEn: '100 Points', color: '#8b5cf6', textColor: '#ffffff', type: 'points', value: 100 },
  { id: 7, labelAr: 'تعقيم مجاني', labelEn: 'Free Sanitize', color: '#06b6d4', textColor: '#ffffff', type: 'addon', value: 30, code: 'FREESANITIZE' },
];

export const LuckyWheelModal: React.FC = () => {
  const {
    language,
    rewardsPolicy,
    currentUser,
    customers,
    adjustCustomerWallet,
    setActiveView,
  } = useApp();

  const customerAccount = currentUser?.customerId
    ? customers.find((c) => c.id === currentUser.customerId)
    : null;

  // If wheel is deactivated by Operations Supervisor or App Admin, do not render
  if (!rewardsPolicy.isWheelActive) {
    return null;
  }

  const [isOpen, setIsOpen] = useState<boolean>(true);
  const [isSpinning, setIsSpinning] = useState<boolean>(false);
  const [rotationDegree, setRotationDegree] = useState<number>(0);
  const [winningSlice, setWinningSlice] = useState<WheelSlice | null>(null);
  const [hasSpun, setHasSpun] = useState<boolean>(false);
  const [copiedCode, setCopiedCode] = useState<boolean>(false);
  const [creditedWallet, setCreditedWallet] = useState<boolean>(false);

  const wheelRef = useRef<SVGSVGElement | null>(null);
  const sliceCount = SLICES.length;
  const sliceAngle = 360 / sliceCount;

  // Spin the wheel
  const handleSpin = () => {
    if (isSpinning) return;

    setIsSpinning(true);
    setWinningSlice(null);
    setCopiedCode(false);
    setCreditedWallet(false);

    // Pick a winning index
    const prizeIndex = Math.floor(Math.random() * sliceCount);
    const selectedPrize = SLICES[prizeIndex];

    // Number of full rotations (5 to 7 turns)
    const extraRotations = (5 + Math.floor(Math.random() * 3)) * 360;
    
    // Top pointer is at 0 degrees / 12 o'clock
    // Slice angle center calculation
    const targetSliceDegree = 360 - (prizeIndex * sliceAngle + sliceAngle / 2);
    const finalDegree = rotationDegree + extraRotations + (targetSliceDegree - (rotationDegree % 360));

    setRotationDegree(finalDegree);

    // After 4.5s animation completes
    setTimeout(() => {
      setIsSpinning(false);
      setWinningSlice(selectedPrize);
      setHasSpun(true);

      // Auto-credit if wallet prize and customer logged in
      if (selectedPrize.type === 'wallet' && customerAccount && !customerAccount.isGuest) {
        adjustCustomerWallet(
          customerAccount.id,
          selectedPrize.value,
          language === 'ar' ? `جائزة عجلة الحظ الكبرى (+${selectedPrize.value} د.إ)` : `Lucky Wheel Prize (+${selectedPrize.value} AED)`
        );
        setCreditedWallet(true);
      }
    }, 4600);
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  // Minimized floating launcher button when user closes the modal
  if (!isOpen) {
    return (
      <aside aria-label="عجلة الحظ" className="fixed bottom-5 start-5 z-40">
        <button
          onClick={() => setIsOpen(true)}
          className="group flex items-center gap-2.5 px-3.5 py-2.5 sm:px-4 sm:py-3 rounded-full bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 text-slate-950 font-black text-xs sm:text-sm shadow-xl shadow-amber-500/30 hover:scale-105 active:scale-95 transition-all cursor-pointer border-2 border-white/80 animate-bounce"
          title={language === 'ar' ? 'افتح عجلة الحظ لربح جوائز فورية' : 'Open Lucky Wheel for instant prizes'}
        >
          <span className="text-lg">🎡</span>
          <span className="hidden sm:inline">
            {language === 'ar' ? 'عجلة الحظ والهدايا' : 'Lucky Wheel'}
          </span>
          <span className="w-2 h-2 rounded-full bg-white animate-ping"></span>
        </button>
      </aside>
    );
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="lucky-wheel-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 overflow-y-auto bg-slate-950/70 backdrop-blur-xs transition-all"
    >
      {/* Modal Card - Perfectly Centered in Viewport across Android, iOS, Tablet, and Desktop */}
      <div className="relative w-full max-w-[340px] sm:max-w-[400px] md:max-w-[440px] bg-white rounded-3xl shadow-2xl border-2 border-amber-300 p-4 sm:p-6 flex flex-col items-center justify-center text-center my-auto">
        {/* Close Button */}
        <button
          type="button"
          onClick={() => setIsOpen(false)}
          className="absolute top-3 end-3 sm:top-4 sm:end-4 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition-all cursor-pointer text-sm font-bold z-10"
          aria-label={language === 'ar' ? 'إغلاق عجلة الحظ' : 'Close Lucky Wheel'}
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="space-y-1 mb-3 sm:mb-4 px-4">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 text-amber-900 text-[11px] font-black">
            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
            <span>{language === 'ar' ? 'مفاجآت وهدايا ألفا كلين اليومية' : 'Daily Alfa Clean Prizes'}</span>
          </div>
          <h2 id="lucky-wheel-title" className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
            {language === 'ar' ? 'عجلة الحظ الذهبية' : 'Golden Lucky Wheel'}
          </h2>
          <p className="text-[11px] sm:text-xs text-slate-500">
            {language === 'ar'
              ? 'دوّر العجلة واربح خصومات فورية ورصيد محفظة وساعات تنظيف مجانية!'
              : 'Spin the wheel and win instant wallet credits and cleaning discounts!'}
          </p>
        </div>

        {/* Wheel Container with Pointer */}
        <div className="relative flex items-center justify-center my-2 select-none">
          {/* Top Indicator Needle */}
          <div className="absolute -top-3 z-20 flex flex-col items-center filter drop-shadow-md">
            <div className="w-0 h-0 border-l-[10px] border-l-transparent border-r-[10px] border-r-transparent border-t-[20px] border-t-amber-500"></div>
            <div className="w-3 h-3 rounded-full bg-amber-600 -mt-5 border border-white"></div>
          </div>

          {/* SVG Wheel - Scaled for Mobile, Tablet, and Desktop */}
          <div className="w-[260px] h-[260px] sm:w-[310px] sm:h-[310px] md:w-[340px] md:h-[340px] relative rounded-full p-2 bg-gradient-to-tr from-amber-400 via-yellow-300 to-amber-500 shadow-xl border-4 border-white">
            <svg
              ref={wheelRef}
              viewBox="0 0 400 400"
              className="w-full h-full rounded-full"
              style={{
                transform: `rotate(${rotationDegree}deg)`,
                transition: isSpinning ? 'transform 4.5s cubic-bezier(0.17, 0.67, 0.12, 0.99)' : 'none',
              }}
            >
              {SLICES.map((slice, index) => {
                const angle = 360 / sliceCount;
                const startAngle = index * angle;
                const endAngle = startAngle + angle;
                const radStart = ((startAngle - 90) * Math.PI) / 180;
                const radEnd = ((endAngle - 90) * Math.PI) / 180;

                const x1 = 200 + 195 * Math.cos(radStart);
                const y1 = 200 + 195 * Math.sin(radStart);
                const x2 = 200 + 195 * Math.cos(radEnd);
                const y2 = 200 + 195 * Math.sin(radEnd);

                const pathData = `M 200 200 L ${x1} ${y1} A 195 195 0 0 1 ${x2} ${y2} Z`;
                const textAngle = startAngle + angle / 2;

                return (
                  <g key={slice.id}>
                    <path
                      d={pathData}
                      fill={slice.color}
                      stroke="#ffffff"
                      strokeWidth="2.5"
                    />
                    <g
                      transform={`rotate(${textAngle}, 200, 200) translate(200, 75)`}
                    >
                      <text
                        textAnchor="middle"
                        fill={slice.textColor}
                        fontSize="15"
                        fontWeight="900"
                        transform="rotate(90)"
                        className="select-none font-sans"
                      >
                        {language === 'ar' ? slice.labelAr : slice.labelEn}
                      </text>
                    </g>
                  </g>
                );
              })}
              {/* Outer decorative dots */}
              {Array.from({ length: 24 }).map((_, i) => {
                const dotAngle = (i * 360) / 24;
                const rad = ((dotAngle - 90) * Math.PI) / 180;
                const cx = 200 + 190 * Math.cos(rad);
                const cy = 200 + 190 * Math.sin(rad);
                return <circle key={i} cx={cx} cy={cy} r="3" fill="#ffffff" opacity="0.9" />;
              })}
            </svg>

            {/* Center Spin Button / Hub */}
            <button
              type="button"
              onClick={handleSpin}
              disabled={isSpinning}
              className="absolute inset-0 m-auto w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-tr from-slate-900 to-slate-800 text-amber-400 font-black text-xs sm:text-sm flex flex-col items-center justify-center shadow-lg border-4 border-amber-400 hover:scale-105 active:scale-95 transition-all cursor-pointer disabled:opacity-80 z-10"
              title={language === 'ar' ? 'انقر لتدوير العجلة' : 'Click to spin'}
            >
              <RotateCw className={`w-4 h-4 mb-0.5 ${isSpinning ? 'animate-spin' : ''}`} />
              <span>{isSpinning ? (language === 'ar' ? 'جارٍ...' : 'Spin...') : (language === 'ar' ? 'دوّر' : 'SPIN')}</span>
            </button>
          </div>
        </div>

        {/* Winning Prize Banner */}
        {winningSlice && !isSpinning && (
          <div className="w-full mt-3 p-3.5 rounded-2xl bg-gradient-to-r from-amber-50 via-yellow-50 to-amber-50 border-2 border-amber-300 animate-in fade-in zoom-in-90 duration-300 space-y-2">
            <div className="flex items-center justify-center gap-2 text-amber-900 font-black text-sm">
              <Trophy className="w-5 h-5 text-amber-600 animate-bounce" />
              <span>
                {language === 'ar' ? 'مبروك! ربحت:' : 'Congratulations! You won:'}{' '}
                <span className="text-amber-700 underline font-extrabold">
                  {language === 'ar' ? winningSlice.labelAr : winningSlice.labelEn}
                </span>
              </span>
            </div>

            {/* Voucher Code Copy if applicable */}
            {winningSlice.code && (
              <div className="flex items-center justify-between gap-2 p-2 rounded-xl bg-white border border-amber-200">
                <div className="text-[11px] text-slate-600">
                  <span className="font-bold">{language === 'ar' ? 'كوبون الخصم:' : 'Voucher Code:'}</span>{' '}
                  <span className="font-mono font-black text-slate-900 bg-amber-100 px-1.5 py-0.5 rounded">
                    {winningSlice.code}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => handleCopyCode(winningSlice.code!)}
                  className="px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-[11px] flex items-center gap-1 transition-all cursor-pointer"
                >
                  {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-900" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedCode ? (language === 'ar' ? 'تم النسخ' : 'Copied') : (language === 'ar' ? 'نسخ' : 'Copy')}</span>
                </button>
              </div>
            )}

            {/* Wallet credit confirmation */}
            {creditedWallet && (
              <div className="text-[11px] font-bold text-emerald-800 bg-emerald-50 p-2 rounded-xl border border-emerald-200">
                ✓ {language === 'ar' ? `تم إضافة ${winningSlice.value} درهم إلى محفظتك بنجاح!` : `${winningSlice.value} AED added to your wallet!`}
              </div>
            )}

            {/* Action to book now */}
            <div className="pt-1 flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  setActiveView('booking');
                }}
                className="flex-1 py-2 px-3 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs shadow-xs transition-all cursor-pointer flex items-center justify-center gap-1.5"
              >
                <span>{language === 'ar' ? 'استخدم الجائزة واحجز الآن' : 'Use Prize & Book Now'}</span>
                <ArrowRight className="w-3.5 h-3.5 rtl:rotate-180" />
              </button>
            </div>
          </div>
        )}

        {/* Footer info */}
        {!winningSlice && (
          <div className="mt-3 flex items-center justify-between w-full text-[11px] text-slate-400 px-2">
            <span>{language === 'ar' ? 'فرصة يومية لكل زائر وعميل' : 'Daily chance for every visitor'}</span>
            <button
              type="button"
              onClick={handleSpin}
              disabled={isSpinning}
              className="text-amber-600 font-bold hover:underline cursor-pointer disabled:opacity-50"
            >
              {language === 'ar' ? 'جرّب حظك الآن' : 'Try Your Luck'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
