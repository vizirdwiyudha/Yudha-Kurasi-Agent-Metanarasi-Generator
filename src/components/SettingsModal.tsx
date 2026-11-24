import React from 'react';
import { AISettings, EmojiFrequency, SlangIntensity } from '../types';
import { DEFAULT_SETTINGS } from '../data/constants';
import { Settings2, RotateCcw, Sparkles, Smile, ShieldAlert } from 'lucide-react';

interface SettingsModalProps {
  settings: AISettings;
  setSettings: React.Dispatch<React.SetStateAction<AISettings>>;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  settings,
  setSettings,
  onClose,
}) => {
  const handleReset = () => {
    setSettings(DEFAULT_SETTINGS);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-[#F4EFFD] text-[#6322D8] border border-[#DDD0FA]">
            <Settings2 className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900">AI Engine Settings & Configuration</h2>
            <p className="text-xs text-slate-500">
              Konfigurasi parameter bahasa, intensitas slang netizen, dan ambang batas deteksi duplikasi
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleReset}
          className="px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 hover:text-slate-900 border border-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Reset Default
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Slang Intensity */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#6322D8]" />
              Slang Intensity
            </label>
            <span className="text-xs font-mono text-[#6322D8] font-semibold">
              {settings.slangIntensity}
            </span>
          </div>
          <p className="text-xs text-slate-500">
            Mengatur seberapa kental penggunaan partikel percakapan netizen (wkwk, relate, sih, ya, nih, loh, deh).
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
            {(['FORMAL', 'NATURAL', 'CASUAL', 'VERY CASUAL'] as SlangIntensity[]).map((lvl) => (
              <button
                key={lvl}
                type="button"
                onClick={() => setSettings((s) => ({ ...s, slangIntensity: lvl }))}
                className={`py-2 px-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  settings.slangIntensity === lvl
                    ? 'bg-[#6322D8] text-white shadow-xs'
                    : 'bg-slate-50 text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                {lvl}
              </button>
            ))}
          </div>
        </div>

        {/* Emoji Frequency */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Smile className="w-4 h-4 text-[#EE2A8E]" />
              Emoji Frequency
            </label>
            <span className="text-xs font-mono text-[#EE2A8E] font-semibold">
              {settings.emojiFrequency}
            </span>
          </div>
          <p className="text-xs text-slate-500">
            Mengatur frekuensi kemunculan emoji per komentar (OFF = 0 emoji, HIGH = ekspresif).
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
            {(['OFF', 'LOW', 'MEDIUM', 'HIGH'] as EmojiFrequency[]).map((lvl) => (
              <button
                key={lvl}
                type="button"
                onClick={() => setSettings((s) => ({ ...s, emojiFrequency: lvl }))}
                className={`py-2 px-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  settings.emojiFrequency === lvl
                    ? 'bg-[#EE2A8E] text-white shadow-xs'
                    : 'bg-slate-50 text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                {lvl}
              </button>
            ))}
          </div>
        </div>

        {/* Duplicate Sensitivity Threshold */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-[#FF9B00]" />
              Duplicate Detection Threshold
            </label>
            <span className="text-xs font-mono tabular-nums text-[#D97706] font-bold">
              {settings.duplicateThreshold}%
            </span>
          </div>
          <p className="text-xs text-slate-500">
            Tingkat sensitivitas kemiripan kata dan n-gram sebelum komentar ditandai sebagai "Potential Duplicate".
          </p>
          <input
            type="range"
            min={50}
            max={85}
            step={5}
            value={settings.duplicateThreshold}
            onChange={(e) =>
              setSettings((s) => ({ ...s, duplicateThreshold: Number(e.target.value) }))
            }
            className="w-full accent-[#FF9B00] cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-slate-500 tabular-nums">
            <span>Lebih Ketat (50%)</span>
            <span>Standar Rekomendasi (65%)</span>
            <span>Toleran (85%)</span>
          </div>
        </div>

        {/* Default Language & Variation */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-sm font-bold text-slate-900">
              Default Language Mode
            </label>
            <span className="text-xs text-slate-500">Bahasa Target</span>
          </div>
          <select
            value={settings.defaultLanguage}
            onChange={(e) =>
              setSettings((s) => ({
                ...s,
                defaultLanguage: e.target.value as any,
              }))
            }
            className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:bg-white focus:border-[#6322D8] focus:outline-none"
          >
            <option value="Bahasa Indonesia">Bahasa Indonesia (Netizen Sehari-hari)</option>
            <option value="Campuran / Slang Indo">Campuran / Slang Indo (Gaya Jaksel / Gaul)</option>
            <option value="English">English (Casual / Slang)</option>
          </select>
          <p className="text-[11px] text-slate-500">
            Secara default AI menggunakan bahasa Indonesia alami yang digunakan oleh netizen aktif.
          </p>
        </div>
      </div>

      <div className="flex justify-end pt-2">
        <button
          type="button"
          onClick={onClose}
          className="px-6 py-2.5 rounded-xl bg-[#6322D8] hover:bg-[#521AB8] text-white font-bold text-xs shadow-xs transition-all cursor-pointer"
        >
          Terapkan & Kembali ke Generator
        </button>
      </div>
    </div>
  );
};
