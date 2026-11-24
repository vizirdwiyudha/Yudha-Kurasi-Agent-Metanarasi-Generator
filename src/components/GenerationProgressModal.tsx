import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { KurasiLogo } from './KurasiLogo';
import { Check, Loader2, Cpu } from 'lucide-react';

interface GenerationProgressModalProps {
  isOpen: boolean;
  currentStep: number;
  totalQuantity: number;
  platform: string;
}

const STEPS = [
  { step: 1, label: 'Analyzing URL & Source Content', desc: 'Memeriksa struktur link, meta tag, dan platform target' },
  { step: 2, label: 'Understanding Context & Sentiment', desc: 'Menganalisis topik konten, pesan inti, dan kultur audiens' },
  { step: 3, label: 'Creating Comment Angles & Personas', desc: 'Menyusun variasi sudut pandang: Reaksi, Curios, Observasi, Relate' },
  { step: 4, label: 'Generating Metanarasi Comments', desc: 'Menghasilkan copy natural ala netizen Indonesia (slang wajar, non-formal)' },
  { step: 5, label: 'Quality Checking & Anti-Duplicate Scan', desc: 'Memverifikasi variasi kata, kesamaan pembuka, dan skor orisinalitas' },
  { step: 6, label: 'Complete & Ready to Export', desc: 'Draft metanarasi siap dikurasi, diedit, dan disalin!' },
];

export const GenerationProgressModal: React.FC<GenerationProgressModalProps> = ({
  isOpen,
  currentStep,
  totalQuantity,
  platform,
}) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96 }}
          className="w-full max-w-lg bg-white border border-slate-200 rounded-2xl shadow-2xl p-6 sm:p-8 space-y-6"
        >
          {/* Header */}
          <div className="flex items-center gap-4">
            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
              <KurasiLogo size={36} variant="solid" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-lg font-bold text-slate-900">Kurasi AI Engine</h3>
                <span className="text-slate-300" aria-hidden="true">·</span>
                <span className="text-xs font-mono font-bold text-[#6322D8]">
                  {platform.toUpperCase()}
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Memproses {totalQuantity} metanarasi natural ala netizen Indonesia
              </p>
            </div>
          </div>

          {/* Progress bar */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs font-semibold text-slate-700">
              <span>Progress Pemrosesan</span>
              <span className="text-[#6322D8] font-mono tabular-nums">
                {Math.round((currentStep / STEPS.length) * 100)}%
              </span>
            </div>
            <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-[#6322D8] via-[#EE2A8E] to-[#FF9B00] rounded-full"
                animate={{ width: `${(currentStep / STEPS.length) * 100}%` }}
                transition={{ duration: 0.35 }}
              />
            </div>
          </div>

          {/* Steps list */}
          <div className="space-y-2.5 pt-1">
            {STEPS.map((item) => {
              const isCompleted = currentStep > item.step;
              const isCurrent = currentStep === item.step;

              return (
                <div
                  key={item.step}
                  className={`flex items-start gap-3 p-2.5 rounded-xl transition-all ${
                    isCurrent
                      ? 'bg-[#FAF7FF] border border-[#DDD0FA]'
                      : isCompleted
                      ? 'bg-slate-50 text-slate-600'
                      : 'opacity-45'
                  }`}
                >
                  <div className="flex-shrink-0 mt-0.5">
                    {isCompleted ? (
                      <div className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center">
                        <Check className="w-3 h-3 stroke-[3]" />
                      </div>
                    ) : isCurrent ? (
                      <div className="w-5 h-5 rounded-full bg-[#6322D8] text-white flex items-center justify-center">
                        <Loader2 className="w-3 h-3 animate-spin" />
                      </div>
                    ) : (
                      <div className="w-5 h-5 rounded-full bg-slate-100 border border-slate-200 text-slate-500 text-[10px] flex items-center justify-center font-mono tabular-nums">
                        {item.step}
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p
                      className={`text-xs font-bold ${
                        isCurrent ? 'text-[#6322D8]' : isCompleted ? 'text-slate-800' : 'text-slate-500'
                      }`}
                    >
                      {item.step}. {item.label}
                    </p>
                    <p className="text-[11px] text-slate-500 truncate">
                      {item.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="text-center text-[11px] text-slate-500 flex items-center justify-center gap-1.5 pt-1">
            <Cpu className="w-3.5 h-3.5 text-[#6322D8]" />
            <span>Server-side Gemini 4 Hydrogen · Quality Control & Anti-Slop Enforcement</span>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
