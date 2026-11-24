import React, { useState } from 'react';
import { GenerationMetadata } from '../types';
import { PLATFORMS } from '../data/constants';
import {
  History,
  Trash2,
  RotateCcw,
  Copy,
  Check,
  Search,
  Calendar,
} from 'lucide-react';

interface HistoryViewProps {
  history: GenerationMetadata[];
  onLoadProject: (project: GenerationMetadata) => void;
  onDeleteHistoryItem: (id: string) => void;
  onClearAllHistory: () => void;
}

export const HistoryView: React.FC<HistoryViewProps> = ({
  history,
  onLoadProject,
  onDeleteHistoryItem,
  onClearAllHistory,
}) => {
  const [search, setSearch] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [confirmClearAll, setConfirmClearAll] = useState(false);

  const filtered = history.filter((item) => {
    const q = search.toLowerCase();
    return (
      item.platform.toLowerCase().includes(q) ||
      item.task.toLowerCase().includes(q) ||
      (item.url && item.url.toLowerCase().includes(q)) ||
      (item.clientBrief && item.clientBrief.toLowerCase().includes(q)) ||
      (item.context && item.context.toLowerCase().includes(q))
    );
  });

  const handleCopyAllFromHistory = async (item: GenerationMetadata) => {
    const text = item.comments.map((c, i) => `${i + 1}. ${c.text}`).join('\n\n');
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(item.id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      // Clipboard blocked
    }
  };

  return (
    <div className="space-y-5">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-[#F4EFFD] text-[#6322D8] border border-[#DDD0FA]">
            <History className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900">Generation History</h2>
            <p className="text-xs text-slate-500">
              Menyimpan seluruh draft metanarasi yang pernah dibuat untuk referensi ulang
            </p>
          </div>
        </div>

        {history.length > 0 && (
          <div className="flex items-center gap-2 self-start sm:self-auto">
            {confirmClearAll ? (
              <>
                <span className="text-xs text-rose-700 font-semibold">Hapus semua?</span>
                <button
                  type="button"
                  onClick={() => {
                    onClearAllHistory();
                    setConfirmClearAll(false);
                  }}
                  className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-all cursor-pointer"
                >
                  Ya, Hapus
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmClearAll(false)}
                  className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-all cursor-pointer"
                >
                  Batal
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => setConfirmClearAll(true)}
                className="px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Hapus Semua Riwayat
              </button>
            )}
          </div>
        )}
      </div>

      {/* Search Filter */}
      {history.length > 0 && (
        <div className="relative max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Cari riwayat berdasarkan URL, topik, atau platform..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-900 placeholder-slate-400 text-xs focus:border-[#6322D8] focus:outline-none"
          />
        </div>
      )}

      {/* History Items */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center text-slate-500 text-xs border border-slate-200 space-y-2">
          <p className="text-sm font-semibold text-slate-800">
            {history.length === 0 ? 'Belum ada riwayat tersimpan.' : 'Tidak ada riwayat yang cocok dengan pencarian.'}
          </p>
          <p>
            Setiap kali Anda menekan "Generate Metanarasi", hasil akan otomatis tercatat di sini.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((item) => {
            const plat = PLATFORMS.find((p) => p.id === item.platform) || PLATFORMS[0];
            const dateStr = new Date(item.timestamp).toLocaleString('id-ID', {
              dateStyle: 'medium',
              timeStyle: 'short',
            });
            const isCopied = copiedId === item.id;

            return (
              <div
                key={item.id}
                className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-3.5 hover:border-slate-300 transition-all"
              >
                {/* Item Top Bar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2 flex-wrap text-xs text-slate-600">
                    <span className="font-bold text-[#6322D8]">{plat.name}</span>
                    <span aria-hidden="true">·</span>
                    <span>Task: <strong className="text-slate-800">{item.task}</strong></span>
                    <span aria-hidden="true">·</span>
                    <span className="tabular-nums font-medium">{item.comments.length} Komentar</span>
                    <span aria-hidden="true">·</span>
                    <span>Tone: {item.tone}</span>
                  </div>

                  <div className="flex items-center gap-1.5 text-xs text-slate-500 tabular-nums">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>{dateStr}</span>
                  </div>
                </div>

                {/* Brief & URL details */}
                {(item.url || item.clientBrief) && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                    {item.url && (
                      <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/80">
                        <span className="text-[11px] text-slate-500 block mb-0.5">Target URL:</span>
                        <a
                          href={item.url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[#6322D8] hover:underline truncate block font-medium"
                        >
                          {item.url}
                        </a>
                      </div>
                    )}

                    {item.clientBrief && (
                      <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/80">
                        <span className="text-[11px] text-slate-500 block mb-0.5">Client Brief:</span>
                        <p className="text-slate-800 line-clamp-2">{item.clientBrief}</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Sample Comments Preview */}
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80 space-y-1 text-xs">
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">
                    Contoh Output:
                  </span>
                  <div className="space-y-1">
                    {item.comments.slice(0, 3).map((c, i) => (
                      <p key={c.id || i} className="text-slate-700 text-xs truncate">
                        • "{c.text}" <span className="text-[#6322D8] text-[11px] font-medium">({c.angle})</span>
                      </p>
                    ))}
                    {item.comments.length > 3 && (
                      <span className="text-[11px] text-slate-500 italic">
                        + {item.comments.length - 3} komentar lainnya...
                      </span>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => handleCopyAllFromHistory(item)}
                    className="px-3 py-1.5 rounded-lg bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold border border-slate-200 transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    {isCopied ? 'Tersalin!' : 'Copy All'}
                  </button>

                  <button
                    type="button"
                    onClick={() => onLoadProject(item)}
                    className="px-3.5 py-1.5 rounded-lg bg-[#6322D8] hover:bg-[#521AB8] text-white text-xs font-bold shadow-xs transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    Buka di Workspace
                  </button>

                  <button
                    type="button"
                    onClick={() => onDeleteHistoryItem(item.id)}
                    className="p-1.5 rounded-lg bg-white hover:bg-rose-50 text-slate-500 hover:text-rose-600 border border-slate-200 hover:border-rose-200 transition-all cursor-pointer"
                    title="Hapus Dari Riwayat"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
