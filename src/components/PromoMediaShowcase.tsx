/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useApp } from '../context/AppContext';
import { Play, Sparkles, ArrowRight, ShieldCheck, Star } from 'lucide-react';

export const PromoMediaShowcase: React.FC = () => {
  const { promoMedia, language, setActiveView } = useApp();

  if (!promoMedia.isEnabled) {
    return null;
  }

  const isVideo = promoMedia.mediaType === 'video';
  const title = language === 'ar' ? promoMedia.titleAr : promoMedia.titleEn;
  const subtitle = language === 'ar' ? promoMedia.subtitleAr : promoMedia.subtitleEn;
  const ctaText = language === 'ar' ? promoMedia.ctaTextAr : promoMedia.ctaTextEn;

  // Determine if it's youtube or direct video
  const isYoutube =
    isVideo && (promoMedia.mediaUrl.includes('youtube.com') || promoMedia.mediaUrl.includes('youtu.be'));

  const getYoutubeEmbed = (url: string) => {
    if (url.includes('embed/')) return url;
    const match = url.match(/(?:youtu\.be\/|v\/|u\/\w\/|embed\/|watch\?v=)([^#&?]*).*/);
    return match && match[1] ? `https://www.youtube.com/embed/${match[1]}?autoplay=0&rel=0` : url;
  };

  return (
    <section className="py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-slate-900 via-sky-950 to-slate-900 text-white shadow-xl border border-sky-800/40">
        {/* Glow ambient background elements */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-sky-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative grid grid-cols-1 lg:grid-cols-12 gap-8 items-center p-6 sm:p-10 lg:p-12">
          {/* Text & CTA column */}
          <div className="lg:col-span-6 space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-sky-500/20 border border-sky-400/30 text-sky-300 text-xs font-bold tracking-wide">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>{language === 'ar' ? 'العرض المرئي الترويجي المعتمد' : 'Official Visual Showcase'}</span>
            </div>

            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white leading-tight">
              {title}
            </h2>

            <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-xl">
              {subtitle}
            </p>

            {/* Badges */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="flex items-center gap-2 p-3 rounded-2xl bg-white/5 border border-white/10">
                <ShieldCheck className="w-5 h-5 text-sky-400 shrink-0" />
                <span className="text-xs font-semibold text-slate-200">
                  {language === 'ar' ? 'فريق عمل مرخص ومفحوص' : 'Certified & Background-checked'}
                </span>
              </div>
              <div className="flex items-center gap-2 p-3 rounded-2xl bg-white/5 border border-white/10">
                <Star className="w-5 h-5 text-amber-400 shrink-0" />
                <span className="text-xs font-semibold text-slate-200">
                  {language === 'ar' ? 'تقييم 4.9 من عملاء أبوظبي' : '4.9 Rating in Abu Dhabi'}
                </span>
              </div>
            </div>

            <div className="pt-2">
              <button
                onClick={() => setActiveView('booking')}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-black text-sm sm:text-base shadow-lg shadow-amber-500/20 transition-all hover:scale-[1.02] cursor-pointer"
              >
                <span>{ctaText}</span>
                <ArrowRight className={`w-4 h-4 ${language === 'ar' ? 'rotate-180' : ''}`} />
              </button>
            </div>
          </div>

          {/* Media Player Column */}
          <div className="lg:col-span-6">
            <div className="relative rounded-2xl overflow-hidden bg-black/60 aspect-video border border-white/20 shadow-2xl">
              {isVideo ? (
                isYoutube ? (
                  <iframe
                    src={getYoutubeEmbed(promoMedia.mediaUrl)}
                    title="Promo Video"
                    className="w-full h-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                ) : (
                  <video
                    src={promoMedia.mediaUrl}
                    controls
                    autoPlay
                    muted
                    loop
                    playsInline
                    className="w-full h-full object-cover"
                  >
                    {language === 'ar' ? 'متصفحك لا يدعم تشغيل الفيديو' : 'Your browser does not support the video tag.'}
                  </video>
                )
              ) : (
                <div className="relative w-full h-full">
                  <img
                    src={promoMedia.mediaUrl}
                    alt={title}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      // Fallback image
                      (e.target as HTMLImageElement).src =
                        'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=800&auto=format&fit=crop&q=80';
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-4">
                    <span className="text-xs text-white/90 font-medium flex items-center gap-1.5">
                      <Play className="w-3.5 h-3.5 text-amber-400" />
                      {title}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
