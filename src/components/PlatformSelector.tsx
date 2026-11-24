import React from 'react';
import { PLATFORMS } from '../data/constants';
import { Platform } from '../types';
import { Check, MessageSquare } from 'lucide-react';

interface PlatformSelectorProps {
  selectedPlatform: Platform;
  setSelectedPlatform: (platform: Platform) => void;
}

export const PlatformSelector: React.FC<PlatformSelectorProps> = ({
  selectedPlatform,
  setSelectedPlatform,
}) => {
  const currentPlatformInfo = PLATFORMS.find((p) => p.id === selectedPlatform) || PLATFORMS[0];

  return (
    <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 shadow-xs space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-pink-50 text-[#EE2A8E] border border-pink-200">
            <MessageSquare className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2 flex-wrap">
              <span>Platform Target</span>
              <span className="text-slate-300 font-normal" aria-hidden="true">·</span>
              <span className="text-xs font-semibold text-[#EE2A8E]">
                {currentPlatformInfo.name}
              </span>
            </h2>
          </div>
        </div>
        <p className="text-xs text-slate-500">
          Dialek dan panjang komentar disesuaikan dengan kultur audiens tiap platform
        </p>
      </div>

      {/* Modern Compact Grid of Platforms */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-5 gap-2">
        {PLATFORMS.map((plat) => {
          const isSelected = selectedPlatform === plat.id;
          return (
            <button
              key={plat.id}
              id={`platform-btn-${plat.id}`}
              type="button"
              onClick={() => setSelectedPlatform(plat.id)}
              className={`p-2.5 rounded-xl border text-left transition-all duration-150 cursor-pointer flex flex-col justify-between gap-1.5 ${
                isSelected
                  ? 'bg-[#FAF7FF] border-[#6322D8] ring-2 ring-[#6322D8]/15 shadow-xs'
                  : 'bg-slate-50/70 border-slate-200 hover:border-slate-300 hover:bg-white'
              }`}
            >
              <div className="flex items-center justify-between gap-1">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className={`inline-block w-2.5 h-2.5 rounded-full bg-gradient-to-tr shrink-0 ${plat.color}`} />
                  <span className="font-bold text-xs text-slate-900 truncate">
                    {plat.name}
                  </span>
                </div>
                {isSelected && (
                  <div className="w-4 h-4 rounded-full bg-[#6322D8] text-white flex items-center justify-center shrink-0">
                    <Check className="w-2.5 h-2.5 stroke-[3]" />
                  </div>
                )}
              </div>
              <span className="text-[11px] text-slate-500 block truncate">
                {plat.badge}
              </span>
            </button>
          );
        })}
      </div>

      {/* Characteristic Banner */}
      <div className="px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-slate-500">Gaya Bahasa {currentPlatformInfo.name}:</span>
          <span className="font-semibold text-[#6322D8]">{currentPlatformInfo.styleDescription}</span>
        </div>
        <div className="flex items-center gap-2 text-[11px] text-slate-600 font-medium flex-wrap">
          {currentPlatformInfo.characteristics.map((char, idx) => (
            <React.Fragment key={idx}>
              {idx > 0 && <span className="text-slate-300" aria-hidden="true">·</span>}
              <span>{char}</span>
            </React.Fragment>
          ))}
        </div>
      </div>
    </div>
  );
};
