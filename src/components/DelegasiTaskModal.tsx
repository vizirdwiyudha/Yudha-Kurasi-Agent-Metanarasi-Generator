import React, { useState, useMemo, useEffect } from 'react';
import {
  SubkoorMember,
  TaskDelegationItem,
  GeneratedComment,
} from '../types';
import { TASKS, DEFAULT_DELEGATION_ITEMS } from '../data/constants';
import {
  X,
  ClipboardList,
  Plus,
  Trash2,
  Copy,
  Check,
  Users,
  Wand2,
  RotateCcw,
  FileText,
  Edit3,
} from 'lucide-react';

interface DelegasiTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  subkoorList: SubkoorMember[];
  delegationItems: TaskDelegationItem[];
  setDelegationItems: React.Dispatch<React.SetStateAction<TaskDelegationItem[]>>;
  customNote: string;
  setCustomNote: (note: string) => void;
  targetUrl: string;
  platform: string;
  comments: GeneratedComment[];
  onOpenSubkoorModal: () => void;
  onNotify: (msg: string, type?: 'success' | 'error') => void;
}

export const DelegasiTaskModal: React.FC<DelegasiTaskModalProps> = ({
  isOpen,
  onClose,
  subkoorList,
  delegationItems,
  setDelegationItems,
  customNote,
  setCustomNote,
  targetUrl,
  platform,
  comments,
  onOpenSubkoorModal,
  onNotify,
}) => {
  const [newTaskName, setNewTaskName] = useState<string>('Report Akun');
  const [includeUrlMeta, setIncludeUrlMeta] = useState<boolean>(false);
  const [isManualEdit, setIsManualEdit] = useState<boolean>(false);
  const [manualText, setManualText] = useState<string>('');
  const [copiedCommand, setCopiedCommand] = useState<boolean>(false);
  const [copiedSubkoorId, setCopiedSubkoorId] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  const activeSubkoors = useMemo(
    () => subkoorList.filter((m) => m.active),
    [subkoorList]
  );

  // Format delegation text cleanly matching the user's exact sample pattern
  const composedCommand = useMemo(() => {
    const lines: string[] = ['Tujuan / Jenis Task untuk di delegasikan ;'];

    if (includeUrlMeta && (targetUrl.trim() || platform)) {
      lines.push('');
      if (platform) lines.push(`Platform : ${platform.toUpperCase()}`);
      if (targetUrl.trim()) lines.push(`Link Konten : ${targetUrl.trim()}`);
    }

    lines.push('');

    delegationItems.forEach((item) => {
      const validAssignments = item.assignments.filter(
        (a) => a.subkoorName.trim() && a.value.trim()
      );
      if (validAssignments.length === 0) return;

      const formattedParts = validAssignments.map((a, idx) =>
        item.mode === 'range' && idx === 0
          ? `${a.subkoorName} : ${a.value}`
          : `${a.subkoorName} ${a.value}`
      );
      lines.push(`${item.taskName} : ${formattedParts.join(' , ')}`);
    });

    if (customNote.trim()) {
      lines.push('');
      lines.push(`Catatan Perintah : ${customNote.trim()}`);
    }

    return lines.join('\n');
  }, [delegationItems, customNote, includeUrlMeta, targetUrl, platform]);

  const activeOutputText = isManualEdit ? manualText : composedCommand;

  if (!isOpen) return null;

  const handleToggleManualEdit = () => {
    if (!isManualEdit) {
      setManualText(composedCommand);
      setIsManualEdit(true);
    } else {
      setIsManualEdit(false);
    }
  };

  const handleAddTaskRow = () => {
    const chosen = newTaskName.trim() || 'Komentar';
    const isRangeDefault =
      chosen === 'Komentar' || chosen === 'Posting' || chosen === 'Repost';
    const baseSubkoors = activeSubkoors.length > 0 ? activeSubkoors : subkoorList;

    const newItem: TaskDelegationItem = {
      id: `del_${Date.now()}`,
      taskName: chosen,
      mode: isRangeDefault ? 'range' : 'count',
      assignments: baseSubkoors.slice(0, 2).map((s, idx) => ({
        subkoorId: s.id,
        subkoorName: s.name,
        value: isRangeDefault ? `${idx * 10 + 1}-${(idx + 1) * 10}` : '10',
      })),
    };

    setDelegationItems((prev) => [...prev, newItem]);
    setIsManualEdit(false);
  };

  const handleRemoveTaskRow = (id: string) => {
    setDelegationItems((prev) => prev.filter((item) => item.id !== id));
    setIsManualEdit(false);
  };

  const handleChangeTaskName = (id: string, taskName: string) => {
    setDelegationItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, taskName } : item))
    );
    setIsManualEdit(false);
  };

  const handleChangeMode = (id: string, mode: 'range' | 'count') => {
    setDelegationItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, mode } : item))
    );
    setIsManualEdit(false);
  };

  const handleToggleMemberInRow = (rowId: string, member: SubkoorMember) => {
    setDelegationItems((prev) =>
      prev.map((item) => {
        if (item.id !== rowId) return item;
        const exists = item.assignments.some(
          (a) => a.subkoorId === member.id || a.subkoorName === member.name
        );
        if (exists) {
          return {
            ...item,
            assignments: item.assignments.filter(
              (a) => a.subkoorId !== member.id && a.subkoorName !== member.name
            ),
          };
        }
        return {
          ...item,
          assignments: [
            ...item.assignments,
            {
              subkoorId: member.id,
              subkoorName: member.name,
              value: item.mode === 'range' ? '1-10' : '10',
            },
          ],
        };
      })
    );
    setIsManualEdit(false);
  };

  const handleUpdateAssignmentValue = (
    rowId: string,
    subkoorKey: string,
    val: string
  ) => {
    setDelegationItems((prev) =>
      prev.map((item) => {
        if (item.id !== rowId) return item;
        return {
          ...item,
          assignments: item.assignments.map((a) =>
            a.subkoorId === subkoorKey || a.subkoorName === subkoorKey
              ? { ...a, value: val }
              : a
          ),
        };
      })
    );
    setIsManualEdit(false);
  };

  // Auto-split 1..N across assigned (or active) subkoors for range-based tasks
  const handleAutoDistributeRange = (rowId: string) => {
    const total = comments.length > 0 ? comments.length : 55;
    setDelegationItems((prev) =>
      prev.map((item) => {
        if (item.id !== rowId) return item;
        const targets =
          item.assignments.length > 0
            ? item.assignments
            : (activeSubkoors.length > 0 ? activeSubkoors : subkoorList).map((s) => ({
                subkoorId: s.id,
                subkoorName: s.name,
                value: '',
              }));

        if (targets.length === 0) return item;

        const base = Math.floor(total / targets.length);
        const rem = total % targets.length;
        let cursor = 1;

        const updated = targets.map((t, idx) => {
          const share = base + (idx < rem ? 1 : 0);
          if (share <= 0) {
            return { ...t, value: '' };
          }
          const start = cursor;
          const end = cursor + share - 1;
          cursor = end + 1;
          return {
            ...t,
            value: start === end ? `${start}` : `${start}-${end}`,
          };
        });

        return { ...item, mode: 'range', assignments: updated };
      })
    );
    setIsManualEdit(false);
    onNotify(
      `Nomor 1–${total} dibagi rata otomatis ke tim Subkoor.`
    );
  };

  const handleCopyCommand = async () => {
    try {
      await navigator.clipboard.writeText(activeOutputText);
      setCopiedCommand(true);
      setTimeout(() => setCopiedCommand(false), 2000);
      onNotify('Perintah delegasi task berhasil disalin ke clipboard.');
    } catch {
      onNotify('Gagal menyalin ke clipboard browser.', 'error');
    }
  };

  const handleDownloadWordDelegation = () => {
    const escapedLines = activeOutputText
      .split('\n')
      .map((line) =>
        `<p style="margin:4pt 0;font-family:Calibri,Arial,sans-serif;font-size:11pt;">${
          line
            ? line
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
            : '&nbsp;'
        }</p>`
      )
      .join('');

    const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>Delegasi Task Kurasi</title></head>
<body>
  <h2 style="font-family:Calibri,Arial,sans-serif;color:#4E18B3;">Delegasi Task &amp; Instruksi Subkoor</h2>
  ${escapedLines}
</body>
</html>`;

    const blob = new Blob(['\ufeff', html], { type: 'application/msword' });
    const objectUrl = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = objectUrl;
    link.download = `Delegasi_Task_${platform}_${new Date().toISOString().slice(0, 10)}.doc`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
    onNotify('File Word (.doc) delegasi task berhasil diunduh.');
  };

  const handleResetSample = () => {
    setDelegationItems(DEFAULT_DELEGATION_ITEMS);
    setCustomNote('');
    setIsManualEdit(false);
    onNotify('Template delegasi task dikembalikan ke contoh standar.');
  };

  // Extract range-based assignments that can be copied together with generated comments
  const rangeBundles = useMemo(() => {
    if (comments.length === 0) return [];
    const bundles: Array<{ key: string; label: string; text: string }> = [];

    delegationItems.forEach((item) => {
      if (item.mode !== 'range') return;
      item.assignments.forEach((a) => {
        const match = a.value.trim().match(/^(\d+)\s*-\s*(\d+)$/);
        const singleMatch = a.value.trim().match(/^(\d+)$/);
        let start = 0;
        let end = 0;
        if (match) {
          start = parseInt(match[1], 10);
          end = parseInt(match[2], 10);
        } else if (singleMatch) {
          start = parseInt(singleMatch[1], 10);
          end = start;
        }
        if (start > 0 && end >= start) {
          const slice = comments.filter((c) => c.no >= start && c.no <= end);
          if (slice.length > 0) {
            const header = `Tugas ${item.taskName} - ${a.subkoorName} (${a.value})${
              targetUrl.trim() ? `\nLink: ${targetUrl.trim()}` : ''
            }\n\n`;
            const body = slice.map((c) => `${c.no}. ${c.text}`).join('\n');
            bundles.push({
              key: `${item.id}_${a.subkoorId}`,
              label: `${a.subkoorName} · ${item.taskName} (${a.value})`,
              text: header + body,
            });
          }
        }
      });
    });

    return bundles;
  }, [delegationItems, comments, targetUrl]);

  const handleCopySubkoorBundle = async (bundle: { key: string; label: string; text: string }) => {
    try {
      await navigator.clipboard.writeText(bundle.text);
      setCopiedSubkoorId(bundle.key);
      setTimeout(() => setCopiedSubkoorId(null), 2000);
      onNotify(`Paket ${bundle.label} berhasil disalin.`);
    } catch {
      onNotify('Gagal menyalin paket Subkoor.', 'error');
    }
  };

  const taskOptions = Array.from(
    new Set([
      ...TASKS.map((t) => t.name),
      ...delegationItems.map((d) => d.taskName),
    ])
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/45 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="bg-white border border-slate-200 rounded-2xl w-full max-w-4xl shadow-xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-[#F4EFFD] text-[#6322D8] border border-[#DDD0FA]">
              <ClipboardList className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Delegasi Task &amp; Custom Perintah Subkoor
              </h3>
              <p className="text-xs text-slate-500">
                Atur pembagian rentang nomor komentar &amp; kuota engagement per Subkoor untuk siap disalin
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-center">
            <button
              type="button"
              onClick={onOpenSubkoorModal}
              className="px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-[#F4EFFD] text-slate-700 hover:text-[#6322D8] border border-slate-200 hover:border-[#CBB4F8] text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Users className="w-3.5 h-3.5" />
              Kelola Subkoor ({activeSubkoors.length})
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              aria-label="Tutup modal Delegasi Task"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-5 overflow-y-auto space-y-5">
          {/* Task Rows */}
          <div className="space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <span className="text-xs font-bold text-slate-800">
                Tujuan / Jenis Task untuk Didelegasikan
              </span>
              <span className="text-[11px] text-slate-500">
                {comments.length > 0
                  ? `Tersedia ${comments.length} komentar hasil generate (siap dibagi otomatis)`
                  : 'Gunakan format rentang (1-14) atau jumlah target (25)'}
              </span>
            </div>

            {delegationItems.map((item) => {
              const allMembersForRow = [...subkoorList];
              item.assignments.forEach((a) => {
                if (
                  !allMembersForRow.some(
                    (m) => m.id === a.subkoorId || m.name === a.subkoorName
                  )
                ) {
                  allMembersForRow.push({
                    id: a.subkoorId,
                    name: a.subkoorName,
                    active: true,
                  });
                }
              });

              return (
                <div
                  key={item.id}
                  className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3"
                >
                  {/* Row Top Controls */}
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <select
                        value={item.taskName}
                        onChange={(e) =>
                          handleChangeTaskName(item.id, e.target.value)
                        }
                        className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-xs font-bold text-slate-900 focus:border-[#6322D8] focus:outline-none"
                      >
                        {taskOptions.map((opt) => (
                          <option key={opt} value={opt}>
                            {opt}
                          </option>
                        ))}
                      </select>

                      <div className="flex items-center p-0.5 rounded-lg bg-slate-200/70 border border-slate-200 text-[11px]">
                        <button
                          type="button"
                          onClick={() => handleChangeMode(item.id, 'range')}
                          className={`px-2.5 py-1 rounded-md font-semibold transition-colors cursor-pointer ${
                            item.mode === 'range'
                              ? 'bg-white text-[#6322D8] shadow-2xs'
                              : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          Rentang No (1-14)
                        </button>
                        <button
                          type="button"
                          onClick={() => handleChangeMode(item.id, 'count')}
                          className={`px-2.5 py-1 rounded-md font-semibold transition-colors cursor-pointer ${
                            item.mode === 'count'
                              ? 'bg-white text-[#6322D8] shadow-2xs'
                              : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          Jumlah Target (25)
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {item.mode === 'range' && (
                        <button
                          type="button"
                          onClick={() => handleAutoDistributeRange(item.id)}
                          className="px-2.5 py-1.5 rounded-lg bg-[#F4EFFD] hover:bg-[#EAE0FC] text-[#6322D8] border border-[#DDD0FA] text-[11px] font-bold flex items-center gap-1 transition-colors cursor-pointer"
                          title={`Bagi nomor 1-${comments.length > 0 ? comments.length : 55} rata ke subkoor`}
                        >
                          <Wand2 className="w-3 h-3" />
                          Auto Bagi 1–{comments.length > 0 ? comments.length : 55}
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => handleRemoveTaskRow(item.id)}
                        className="p-1.5 rounded-lg bg-white hover:bg-rose-50 text-slate-400 hover:text-rose-600 border border-slate-200 hover:border-rose-200 transition-colors cursor-pointer"
                        title="Hapus task delegasi ini"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Subkoor Assignment Inputs */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
                    {allMembersForRow.map((member) => {
                      const assigned = item.assignments.find(
                        (a) =>
                          a.subkoorId === member.id ||
                          a.subkoorName === member.name
                      );
                      const isChecked = Boolean(assigned);

                      return (
                        <div
                          key={member.id}
                          className={`flex items-center gap-2 px-2.5 py-2 rounded-lg border transition-all ${
                            isChecked
                              ? 'bg-white border-[#CBB4F8]'
                              : 'bg-slate-100/60 border-slate-200/80 opacity-75'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() =>
                              handleToggleMemberInRow(item.id, member)
                            }
                            className="w-3.5 h-3.5 accent-[#6322D8] cursor-pointer flex-shrink-0"
                            aria-label={`Assign ${member.name} ke ${item.taskName}`}
                          />
                          <span className="text-xs font-semibold text-slate-800 truncate flex-1">
                            {member.name}
                          </span>
                          {isChecked && (
                            <input
                              type="text"
                              value={assigned?.value || ''}
                              onChange={(e) =>
                                handleUpdateAssignmentValue(
                                  item.id,
                                  member.id,
                                  e.target.value
                                )
                              }
                              placeholder={item.mode === 'range' ? '1-14' : '25'}
                              className="w-16 px-2 py-1 rounded bg-slate-50 border border-slate-200 text-xs font-mono tabular-nums text-slate-900 text-center focus:bg-white focus:border-[#6322D8] focus:outline-none"
                            />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}

            {/* Add Task Row Bar */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-1">
              <select
                value={newTaskName}
                onChange={(e) => setNewTaskName(e.target.value)}
                className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800 focus:bg-white focus:border-[#6322D8] focus:outline-none"
              >
                {taskOptions.map((opt) => (
                  <option key={opt} value={opt}>
                    Task: {opt}
                  </option>
                ))}
              </select>

              <button
                type="button"
                onClick={handleAddTaskRow}
                className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                Tambah Task Delegasi
              </button>

              <label className="sm:ml-auto flex items-center gap-2 text-xs text-slate-600 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={includeUrlMeta}
                  onChange={(e) => {
                    setIncludeUrlMeta(e.target.checked);
                    setIsManualEdit(false);
                  }}
                  className="w-3.5 h-3.5 accent-[#6322D8] rounded"
                />
                Sertakan Platform &amp; Link Konten
              </label>
            </div>
          </div>

          {/* Custom Note */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700">
              Custom Perintah / Catatan Tambahan (Opsional)
            </label>
            <input
              type="text"
              value={customNote}
              onChange={(e) => {
                setCustomNote(e.target.value);
                setIsManualEdit(false);
              }}
              placeholder="Contoh: Pastikan jeda posting natural 2-3 menit antar akun, lapor link bukti ke grup."
              className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:border-[#6322D8] focus:outline-none"
            />
          </div>

          {/* Output Command Preview */}
          <div className="p-4 rounded-xl bg-[#FAF9FE] border border-[#DDD0FA] space-y-3">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <span className="text-xs font-bold text-slate-900">
                Preview Format Perintah Delegasi (Siap Copy)
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleToggleManualEdit}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border flex items-center gap-1 cursor-pointer transition-colors ${
                    isManualEdit
                      ? 'bg-[#6322D8] text-white border-[#6322D8]'
                      : 'bg-white text-slate-600 border-slate-200 hover:text-slate-900'
                  }`}
                >
                  <Edit3 className="w-3 h-3" />
                  {isManualEdit ? 'Mode Edit Manual Aktif' : 'Edit Teks Manual'}
                </button>
              </div>
            </div>

            {isManualEdit ? (
              <textarea
                rows={7}
                value={manualText}
                onChange={(e) => setManualText(e.target.value)}
                className="w-full p-3 rounded-xl bg-white border border-[#6322D8] text-xs font-mono text-slate-900 leading-relaxed focus:outline-none"
              />
            ) : (
              <pre className="p-3.5 rounded-xl bg-white border border-slate-200 text-xs font-mono text-slate-800 whitespace-pre-wrap leading-relaxed select-all overflow-x-auto">
                {composedCommand}
              </pre>
            )}

            {/* Quick Per-Subkoor Comment Bundles when generated comments exist */}
            {rangeBundles.length > 0 && (
              <div className="pt-2 border-t border-slate-200/80 space-y-2">
                <span className="text-[11px] font-semibold text-slate-600 block">
                  Copy Cepat Paket Nomor Komentar per Subkoor (dari hasil generate):
                </span>
                <div className="flex items-center gap-2 flex-wrap">
                  {rangeBundles.map((b) => {
                    const isCopied = copiedSubkoorId === b.key;
                    return (
                      <button
                        key={b.key}
                        type="button"
                        onClick={() => handleCopySubkoorBundle(b)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold border flex items-center gap-1.5 transition-all cursor-pointer ${
                          isCopied
                            ? 'bg-emerald-600 text-white border-emerald-600'
                            : 'bg-white hover:bg-[#F4EFFD] text-slate-700 hover:text-[#6322D8] border-slate-200 hover:border-[#CBB4F8]'
                        }`}
                      >
                        {isCopied ? (
                          <Check className="w-3 h-3" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                        <span>{b.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-5 py-3.5 border-t border-slate-200 bg-slate-50 flex flex-wrap items-center justify-between gap-2">
          <button
            type="button"
            onClick={handleResetSample}
            className="px-3 py-1.5 rounded-xl bg-white hover:bg-slate-100 text-slate-600 hover:text-slate-900 border border-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset Contoh
          </button>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={handleDownloadWordDelegation}
              className="px-3.5 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-700 hover:text-slate-900 border border-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <FileText className="w-3.5 h-3.5 text-blue-600" />
              Export Word (.doc)
            </button>

            <button
              id="btn-copy-delegasi-command"
              type="button"
              onClick={handleCopyCommand}
              className="px-4 py-2 rounded-xl bg-[#6322D8] hover:bg-[#521AB8] text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
            >
              {copiedCommand ? (
                <Check className="w-3.5 h-3.5" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
              {copiedCommand ? 'Tersalin!' : 'Copy Perintah Delegasi'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
