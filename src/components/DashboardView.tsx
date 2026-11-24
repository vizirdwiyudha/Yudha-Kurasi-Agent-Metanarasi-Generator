import React from 'react';
import { GenerationMetadata } from '../types';
import { PLATFORMS } from '../data/constants';
import {
  TrendingUp,
  MessageSquare,
  Sparkles,
  Layers,
  ArrowUpRight,
  Clock,
  RotateCcw,
} from 'lucide-react';

interface DashboardViewProps {
  history: GenerationMetadata[];
  onLoadProject: (project: GenerationMetadata) => void;
  onGoToGenerator: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  history,
  onLoadProject,
  onGoToGenerator,
}) => {
  const totalGenerations = history.length;
  const totalComments = history.reduce((acc, curr) => acc + (curr.comments?.length || 0), 0);

  // Compute real average uniqueness from saved project stats
  const avgUniqueness = (() => {
    if (totalGenerations === 0 || totalComments === 0) return '100%';
    const totalUnique = history.reduce(
      (acc, curr) => acc + (curr.stats?.unique ?? curr.comments?.length ?? 0),
      0
    );
    return `${((totalUnique / totalComments) * 100).toFixed(1)}%`;
  })();

  // Platform usage calculation
  const platformCounts: Record<string, number> = {};
  PLATFORMS.forEach((p) => {
    platformCounts[p.id] = 0;
  });

  history.forEach((h) => {
    if (platformCounts[h.platform] !== undefined) {
      platformCounts[h.platform]++;
    } else {
      platformCounts[h.platform] = 1;
    }
  });

  // history already stores newest at index 0
  const recentProjects = history.slice(0, 8);

  return (
    <div className="space-y-6">
      {/* Top Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold">Total Generations</span>
            <div className="p-2 rounded-lg bg-[#F4EFFD] text-[#6322D8]">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 tabular-nums">
            {totalGenerations}
          </div>
          <p className="text-[11px] text-slate-500">Proses kurasi metanarasi dieksekusi</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold">Total Comments Drafted</span>
            <div className="p-2 rounded-lg bg-pink-50 text-[#EE2A8E]">
              <MessageSquare className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 tabular-nums">
            {totalComments}
          </div>
          <p className="text-[11px] text-slate-500">Komentar & copy engagement dibuat</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold">Average Uniqueness</span>
            <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-emerald-600 tabular-nums">
            {avgUniqueness}
          </div>
          <p className="text-[11px] text-slate-500">Anti-duplicate threshold terpenuhi</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold">AI Style Mode</span>
            <div className="p-2 rounded-lg bg-amber-50 text-[#D97706]">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-[#D97706]">
            Netizen Indo
          </div>
          <p className="text-[11px] text-slate-500">Natural tone & slang synthesis</p>
        </div>
      </div>

      {/* Platform Usage & Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Platform Usage Breakdown */}
        <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Layers className="w-4 h-4 text-[#6322D8]" />
              Platform Usage
            </h3>
            <span className="text-xs text-slate-500">Distribusi Platform</span>
          </div>

          <div className="space-y-3 pt-2">
            {PLATFORMS.map((p) => {
              const count = platformCounts[p.id] || 0;
              const percent = totalGenerations > 0 ? Math.round((count / totalGenerations) * 100) : 0;

              return (
                <div key={p.id} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="font-semibold text-slate-800">{p.name}</span>
                    <span className="text-slate-500 font-mono tabular-nums">
                      {count} ({percent}%)
                    </span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className={`h-full bg-gradient-to-r ${p.color}`}
                      style={{ width: `${totalGenerations > 0 && count > 0 ? Math.max(percent, 4) : 0}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Recent Projects List */}
        <div className="lg:col-span-2 bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#EE2A8E]" />
              <h3 className="text-sm font-bold text-slate-900">Recent Projects</h3>
            </div>
            <button
              type="button"
              onClick={onGoToGenerator}
              className="text-xs text-[#6322D8] hover:text-[#521AB8] font-semibold flex items-center gap-1 cursor-pointer"
            >
              Mulai Project Baru <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {recentProjects.length === 0 ? (
            <div className="py-12 text-center text-slate-500 text-xs space-y-3">
              <p>Belum ada riwayat proses generasi.</p>
              <button
                type="button"
                onClick={onGoToGenerator}
                className="px-4 py-2 rounded-xl bg-[#6322D8] hover:bg-[#521AB8] text-white font-bold text-xs cursor-pointer transition-colors"
              >
                Buat Metanarasi Pertama
              </button>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {recentProjects.map((p) => {
                const plat = PLATFORMS.find((x) => x.id === p.platform) || PLATFORMS[0];
                const dateStr = new Date(p.timestamp).toLocaleDateString('id-ID', {
                  day: 'numeric',
                  month: 'short',
                  hour: '2-digit',
                  minute: '2-digit',
                });

                return (
                  <div
                    key={p.id}
                    className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-slate-50 px-2 rounded-xl transition-colors"
                  >
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2 text-xs">
                        <span className="font-bold text-[#6322D8] shrink-0">
                          {plat.name}
                        </span>
                        <span className="text-slate-300" aria-hidden="true">·</span>
                        <span className="font-semibold text-slate-900 truncate max-w-xs sm:max-w-md">
                          {p.clientBrief || p.url || `Task: ${p.task}`}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-slate-500 tabular-nums">
                        <span>{dateStr}</span>
                        <span aria-hidden="true">·</span>
                        <span>{p.comments.length} Komentar</span>
                        <span aria-hidden="true">·</span>
                        <span>Tone: {p.tone}</span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => onLoadProject(p)}
                      className="px-3 py-1.5 rounded-lg bg-slate-50 hover:bg-[#6322D8] hover:text-white text-slate-700 text-xs font-semibold border border-slate-200 hover:border-[#6322D8] transition-all cursor-pointer flex items-center gap-1.5 flex-shrink-0 self-end sm:self-auto whitespace-nowrap"
                    >
                      <RotateCcw className="w-3 h-3" />
                      Buka Kembali
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
