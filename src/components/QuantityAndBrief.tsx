import React from 'react';
import { QUANTITY_PRESETS, TONE_OPTIONS } from '../data/constants';
import { Tone } from '../types';
import { Hash, Sparkles, Sliders, FileSignature, ArrowRight } from 'lucide-react';

interface QuantityAndBriefProps {
  quantity: number;
  setQuantity: (q: number) => void;
  clientBrief: string;
  setClientBrief: (brief: string) => void;
  tone: Tone | string;
  setTone: (tone: Tone | string) => void;
  customTone: string;
  setCustomTone: (val: string) => void;
  isGenerating: boolean;
  onGenerate: () => void;
}

export const QuantityAndBrief: React.FC<QuantityAndBriefProps> = ({
  quantity,
  setQuantity,
  clientBrief,
  setClientBrief,
  tone,
  setTone,
  customTone,
  setCustomTone,
  isGenerating,
  onGenerate,
}) => {
  const isCustomTone = tone === 'Custom' || !TONE_OPTIONS.includes(tone as Tone);

  return (
    <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 shadow-xs space-y-5">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Quantity Section */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <label className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Hash className="w-4 h-4 text-[#6322D8]" />
              Jumlah Output Komentar
            </label>
            <span className="text-xs font-bold text-[#6322D8] font-mono tabular-nums">
              {quantity} Komentar
            </span>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            {QUANTITY_PRESETS.map((num) => (
              <button
                key={num}
                id={`qty-preset-${num}`}
                type="button"
                onClick={() => setQuantity(num)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold tabular-nums transition-all cursor-pointer ${
                  quantity === num
                    ? 'bg-[#6322D8] text-white shadow-xs ring-2 ring-[#6322D8]/20'
                    : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                {num}
              </button>
            ))}

            <div className="flex items-center gap-1.5 ml-auto">
              <span className="text-[11px] text-slate-500 font-medium">Custom:</span>
              <input
                id="input-custom-qty"
                type="number"
                min={1}
                max={100}
                value={quantity}
                onChange={(e) => {
                  const val = parseInt(e.target.value, 10);
                  if (!isNaN(val)) {
                    setQuantity(Math.min(Math.max(val, 1), 100));
                  }
                }}
                className="w-16 px-2 py-1.5 text-center rounded-lg bg-slate-50 border border-slate-200 text-slate-900 text-xs font-bold tabular-nums focus:bg-white focus:border-[#6322D8] focus:outline-none"
              />
            </div>
          </div>

          {quantity > 20 && (
            <p className="text-[11px] text-[#6322D8] font-medium flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#6322D8] flex-shrink-0" />
              Smart Comment Matrix aktif: Variasi angle & persona otomatis diatur agar 100% segar.
            </p>
          )}
        </div>

        {/* Tone & Gaya Bahasa */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <label className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Sliders className="w-4 h-4 text-[#EE2A8E]" />
              Tone & Gaya Bahasa
            </label>
            <span className="text-xs text-slate-500">Pilih gaya netizen</span>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {TONE_OPTIONS.map((t) => {
              const isSelected = t === 'Custom' ? isCustomTone : tone === t;
              return (
                <button
                  key={t}
                  id={`tone-btn-${t.toLowerCase().replace(/\s+/g, '-')}`}
                  type="button"
                  onClick={() => setTone(t)}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                    isSelected
                      ? 'bg-[#EE2A8E] text-white shadow-xs ring-2 ring-[#EE2A8E]/20'
                      : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200'
                  }`}
                >
                  {t}
                </button>
              );
            })}
          </div>

          {isCustomTone && (
            <div className="pt-0.5">
              <input
                id="input-custom-tone"
                type="text"
                value={customTone}
                onChange={(e) => {
                  setCustomTone(e.target.value);
                  setTone(e.target.value || 'Custom');
                }}
                placeholder="Tuliskan gaya bahasa sendiri (contoh: Santai ala anak tongkrongan Jaksel)..."
                className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 text-xs focus:bg-white focus:border-[#EE2A8E] focus:outline-none"
              />
            </div>
          )}
        </div>
      </div>

      {/* Client Brief Section */}
      <div className="space-y-1.5 border-t border-slate-200 pt-4">
        <div className="flex items-center justify-between">
          <label
            htmlFor="input-client-brief"
            className="text-xs font-semibold text-slate-700 flex items-center gap-1.5"
          >
            <FileSignature className="w-3.5 h-3.5 text-[#FF9B00]" />
            Client Brief / Catatan Khusus
            <span className="text-slate-400 font-normal">(Opsional)</span>
          </label>
          <span className="text-[11px] text-slate-500">
            Kebutuhan pesan sponsor atau arahan khusus
          </span>
        </div>

        <textarea
          id="input-client-brief"
          rows={2}
          value={clientBrief}
          onChange={(e) => setClientBrief(e.target.value)}
          placeholder="Contoh: Buat komentar yang mendukung konten ini, gunakan gaya netizen Indonesia santai, jangan terlalu kaku/formal, variasikan panjang..."
          className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-[#6322D8] focus:ring-2 focus:ring-[#6322D8]/15 focus:outline-none text-slate-900 placeholder-slate-400 text-xs sm:text-sm transition-all resize-y"
        />
      </div>

      {/* Primary CTA Button matching Kurasi brand gradient */}
      <div className="pt-1">
        <button
          id="btn-generate-metanarasi"
          type="button"
          disabled={isGenerating}
          onClick={onGenerate}
          className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-[#6322D8] via-[#EE2A8E] to-[#FF6418] hover:opacity-95 disabled:opacity-50 text-white font-extrabold text-sm sm:text-base flex items-center justify-center gap-3 shadow-md shadow-[#6322D8]/20 active:scale-[0.995] transition-all cursor-pointer disabled:cursor-not-allowed"
        >
          {isGenerating ? (
            <>
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>Memproses Metanarasi AI (Quality Control & Anti-Duplicate)...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5 text-amber-200" />
              <span>Generate Metanarasi ({quantity} Komentar)</span>
              <ArrowRight className="w-5 h-5 text-white/90" />
            </>
          )}
        </button>
      </div>
    </div>
  );
};
