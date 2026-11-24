import React, { useState } from 'react';
import { Grid3X3, Sparkles, UserCheck, Compass, AlignLeft } from 'lucide-react';
import { CommentAngle, PersonaType, LengthCategory } from '../types';

export const SmartMatrixView: React.FC = () => {
  const [selectedAngle, setSelectedAngle] = useState<CommentAngle>('Curiosity');
  const [selectedPersona, setSelectedPersona] = useState<PersonaType>('Casual viewer');
  const [selectedLength, setSelectedLength] = useState<LengthCategory>('short');

  const angles: CommentAngle[] = [
    'Curiosity',
    'Reaction',
    'Appreciation',
    'Question',
    'Agreement',
    'Observation',
    'Personal perspective',
    'Information seeking',
    'Humor ringan',
    'Emotional reaction',
    'Supportive response',
    'Educational response',
  ];

  const personas: PersonaType[] = [
    'Curious netizen',
    'Casual viewer',
    'Informative viewer',
    'Young audience',
    'Working professional',
    'General audience',
    'Enthusiastic viewer',
    'Skeptical-but-neutral viewer',
    'Question asker',
    'Detail reactor',
  ];

  const lengths: { id: LengthCategory; label: string; ratio: string }[] = [
    { id: 'short', label: 'Short', ratio: '30% (~3-7 kata)' },
    { id: 'medium', label: 'Medium', ratio: '40% (1-2 kalimat)' },
    { id: 'conversational', label: 'Conversational', ratio: '20% (opini & diskusi)' },
    { id: 'thoughtful', label: 'Thoughtful', ratio: '10% (reflektif mendalam)' },
  ];

  const getMatrixPreview = () => {
    if (selectedAngle === 'Curiosity' && selectedPersona === 'Casual viewer') {
      if (selectedLength === 'short') return 'eh beneran kayak gini? baru ngeh wkwk';
      if (selectedLength === 'medium') return 'kirain awalnya cuma gimmick, ternyata pas dicoba masuk akal juga ya';
      if (selectedLength === 'conversational') return 'penasaran banget sih, ada yang udah pernah nyoba langsung belum? pengen tahu review jujurnya sebelum mutusin beli';
      return 'menarik sih ini, kalau dipikir-pikir pendekatan kayak gini emang jarang kepikiran tapi solutif banget buat kebutuhan harian.';
    }
    if (selectedAngle === 'Reaction') {
      if (selectedLength === 'short') return 'asli relate banget ini mah 😭';
      if (selectedLength === 'medium') return 'kaget pas bagian akhir, ga nyangka ternyata hasilnya bisa sebagus itu!';
      return 'pas pertama nonton kirain bakal biasa aja, ternyata penjelasannya runtut banget dan gampang dipahami sama orang awam.';
    }
    if (selectedAngle === 'Humor ringan') {
      if (selectedLength === 'short') return 'info loker penonton setia dong bang wkwk';
      if (selectedLength === 'medium') return 'dompet saya menangis melihat racun ini, tapi tangan otomatis checkout 😂';
      return 'gapapa boncos dikit yang penting hati senang, relate banget sama kondisi tanggal tua begini haha.';
    }
    if (selectedAngle === 'Agreement') {
      return 'setuju banget sama poin utamanya, emang konsistensi yang paling susah diterapin.';
    }
    return `ohh paham sekarang, kombinasi ${selectedAngle} dengan sudut pandang ${selectedPersona} bikin obrolannya kerasa hidup dan natural.`;
  };

  return (
    <div className="space-y-6">
      {/* Intro Banner */}
      <div className="bg-gradient-to-r from-[#F4EFFD] via-[#FDF2F8] to-[#FFFBEB] rounded-2xl p-6 border border-[#DDD0FA] shadow-xs space-y-2">
        <div className="flex items-center gap-2 text-[#6322D8]">
          <Grid3X3 className="w-5 h-5" />
          <span className="text-xs font-bold tracking-wide">4D Permutation Engine</span>
        </div>
        <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900">
          Smart Comment Matrix (Angle × Persona × Tone × Length)
        </h2>
        <p className="text-xs sm:text-sm text-slate-600 max-w-3xl leading-relaxed">
          Ketika kebutuhan output besar (&gt;20 komentar), AI tidak sekadar mengulang pola kata yang sama.
          Sistem menyilangkan sudut pandang, tipe persona netizen, gaya tone, dan panjang komentar sehingga 100 komentar tetap terasa autentik, segar, dan bebas dari kesan bot AI.
        </p>
      </div>

      {/* Interactive Matrix Playground */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Column 1: Angle */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center gap-2 text-[#6322D8] font-bold text-xs">
            <Compass className="w-4 h-4" />
            <span>1. Content Angle ({angles.length})</span>
          </div>
          <div className="space-y-1.5 max-h-72 overflow-y-auto pr-1">
            {angles.map((a) => (
              <button
                key={a}
                type="button"
                onClick={() => setSelectedAngle(a)}
                className={`w-full text-left px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                  selectedAngle === a
                    ? 'bg-[#6322D8] text-white font-bold shadow-xs'
                    : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-100'
                }`}
              >
                {a}
              </button>
            ))}
          </div>
        </div>

        {/* Column 2: Persona */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center gap-2 text-[#EE2A8E] font-bold text-xs">
            <UserCheck className="w-4 h-4" />
            <span>2. Netizen Persona ({personas.length})</span>
          </div>
          <div className="space-y-1.5 max-h-72 overflow-y-auto pr-1">
            {personas.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setSelectedPersona(p)}
                className={`w-full text-left px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                  selectedPersona === p
                    ? 'bg-[#EE2A8E] text-white font-bold shadow-xs'
                    : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-100'
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        {/* Column 3: Length & Ratio */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center gap-2 text-[#D97706] font-bold text-xs">
            <AlignLeft className="w-4 h-4" />
            <span>3. Variasi Panjang & Distribusi</span>
          </div>
          <div className="space-y-2">
            {lengths.map((l) => (
              <button
                key={l.id}
                type="button"
                onClick={() => setSelectedLength(l.id)}
                className={`w-full text-left p-2.5 rounded-lg text-xs transition-all cursor-pointer ${
                  selectedLength === l.id
                    ? 'bg-[#FF9B00] text-white font-bold shadow-xs'
                    : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-100'
                }`}
              >
                <div className="flex justify-between items-center gap-2">
                  <span>{l.label}</span>
                  <span className="text-[10px] opacity-85 tabular-nums">{l.ratio}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Column 4: Interactive Result Preview */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between space-y-3">
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-emerald-700 font-bold text-xs">
              <Sparkles className="w-4 h-4 text-emerald-600" />
              <span>Simulasi Output Matrix</span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="flex items-center gap-1.5 flex-wrap text-[11px] text-slate-600 font-semibold">
                <span className="text-[#6322D8]">{selectedAngle}</span>
                <span className="text-slate-300" aria-hidden="true">·</span>
                <span className="text-[#EE2A8E]">{selectedPersona}</span>
                <span className="text-slate-300" aria-hidden="true">·</span>
                <span className="text-[#D97706]">{selectedLength}</span>
              </div>

              <p className="text-xs sm:text-sm text-slate-900 font-medium italic pt-1 leading-relaxed">
                "{getMatrixPreview()}"
              </p>
            </div>
          </div>

          <p className="text-[11px] text-slate-500 leading-normal">
            Kombinasi ini diaplikasikan otomatis oleh AI saat Anda memilih kuota besar di tab Generator.
          </p>
        </div>
      </div>
    </div>
  );
};
