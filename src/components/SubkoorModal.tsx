import React, { useState, useEffect } from 'react';
import { SubkoorMember } from '../types';
import { DEFAULT_SUBKOOR_MEMBERS } from '../data/constants';
import { X, Users, Plus, Trash2, Edit2, Check, RotateCcw } from 'lucide-react';

interface SubkoorModalProps {
  isOpen: boolean;
  onClose: () => void;
  subkoorList: SubkoorMember[];
  setSubkoorList: React.Dispatch<React.SetStateAction<SubkoorMember[]>>;
  onNotify: (msg: string, type?: 'success' | 'error') => void;
}

export const SubkoorModal: React.FC<SubkoorModalProps> = ({
  isOpen,
  onClose,
  subkoorList,
  setSubkoorList,
  onNotify,
}) => {
  const [newName, setNewName] = useState('');
  const [newRole, setNewRole] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editRole, setEditRole] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleAddSubkoor = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newName.trim();
    if (!trimmed) return;

    if (subkoorList.some((m) => m.name.toLowerCase() === trimmed.toLowerCase())) {
      onNotify(`Subkoor "${trimmed}" sudah ada dalam daftar.`, 'error');
      return;
    }

    const newMember: SubkoorMember = {
      id: `sub_${Date.now()}`,
      name: trimmed,
      role: newRole.trim() || 'Subkoor Tim',
      active: true,
    };

    setSubkoorList((prev) => [...prev, newMember]);
    setNewName('');
    setNewRole('');
    onNotify(`Subkoor "${trimmed}" ditambahkan.`);
  };

  const handleToggleActive = (id: string) => {
    setSubkoorList((prev) =>
      prev.map((m) => (m.id === id ? { ...m, active: !m.active } : m))
    );
  };

  const handleDelete = (id: string, name: string) => {
    setSubkoorList((prev) => prev.filter((m) => m.id !== id));
    onNotify(`Subkoor "${name}" dihapus.`);
  };

  const startEdit = (m: SubkoorMember) => {
    setEditingId(m.id);
    setEditName(m.name);
    setEditRole(m.role || '');
  };

  const saveEdit = (id: string) => {
    if (!editName.trim()) return;
    setSubkoorList((prev) =>
      prev.map((m) =>
        m.id === id ? { ...m, name: editName.trim(), role: editRole.trim() || undefined } : m
      )
    );
    setEditingId(null);
    onNotify('Data subkoor diperbarui.');
  };

  const handleResetDefault = () => {
    setSubkoorList(DEFAULT_SUBKOOR_MEMBERS);
    onNotify('Daftar Subkoor dikembalikan ke preset default (Amanda, Lestari, Eca, Yuni).');
  };

  const activeCount = subkoorList.filter((m) => m.active).length;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/45 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="bg-white border border-slate-200 rounded-2xl w-full max-w-xl shadow-xl overflow-hidden flex flex-col max-h-[88vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-[#F4EFFD] text-[#6322D8] border border-[#DDD0FA]">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <span>Daftar Subkoor</span>
                <span className="text-slate-300 font-normal" aria-hidden="true">·</span>
                <span className="text-xs font-semibold text-[#6322D8] tabular-nums">
                  {activeCount} aktif / {subkoorList.length} total
                </span>
              </h3>
              <p className="text-xs text-slate-500">
                Kelola daftar koordinator lapangan untuk pembagian &amp; delegasi task cepat
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            aria-label="Tutup modal Daftar Subkoor"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 overflow-y-auto space-y-4">
          {/* Add Form */}
          <form onSubmit={handleAddSubkoor} className="flex flex-col sm:flex-row gap-2">
            <input
              id="input-new-subkoor-name"
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Nama Subkoor (misal: Rina)"
              className="flex-1 px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 text-xs focus:bg-white focus:border-[#6322D8] focus:outline-none"
            />
            <input
              id="input-new-subkoor-role"
              type="text"
              value={newRole}
              onChange={(e) => setNewRole(e.target.value)}
              placeholder="Keterangan / Tim (opsional)"
              className="sm:w-44 px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 text-xs focus:bg-white focus:border-[#6322D8] focus:outline-none"
            />
            <button
              id="btn-add-subkoor"
              type="submit"
              disabled={!newName.trim()}
              className="px-4 py-2 rounded-xl bg-[#6322D8] hover:bg-[#521AB8] disabled:opacity-45 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer disabled:cursor-not-allowed whitespace-nowrap"
            >
              <Plus className="w-3.5 h-3.5" />
              Tambah
            </button>
          </form>

          {/* List */}
          <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden bg-white">
            {subkoorList.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-500">
                Belum ada Subkoor terdaftar. Tambahkan nama Subkoor di atas.
              </div>
            ) : (
              subkoorList.map((member, idx) => {
                const isEditing = editingId === member.id;
                return (
                  <div
                    key={member.id}
                    className={`px-4 py-3 flex items-center justify-between gap-3 transition-colors ${
                      member.active ? 'bg-white' : 'bg-slate-50/70 opacity-70'
                    }`}
                  >
                    {isEditing ? (
                      <div className="flex-1 flex flex-col sm:flex-row gap-2">
                        <input
                          type="text"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="flex-1 px-2.5 py-1.5 rounded-lg border border-[#6322D8] text-xs text-slate-900 focus:outline-none"
                        />
                        <input
                          type="text"
                          value={editRole}
                          onChange={(e) => setEditRole(e.target.value)}
                          placeholder="Keterangan"
                          className="sm:w-36 px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs text-slate-900 focus:outline-none"
                        />
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => saveEdit(member.id)}
                            className="px-2.5 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-semibold cursor-pointer"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingId(null)}
                            className="px-2.5 py-1.5 rounded-lg bg-slate-100 text-slate-700 text-xs font-medium cursor-pointer"
                          >
                            Batal
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center gap-3 min-w-0">
                          <span className="w-6 h-6 rounded-lg bg-[#F4EFFD] text-[#6322D8] text-[11px] font-bold font-mono tabular-nums flex items-center justify-center flex-shrink-0">
                            {idx + 1}
                          </span>
                          <div className="min-w-0">
                            <p className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                              {member.name}
                            </p>
                            <p className="text-[11px] text-slate-500 truncate">
                              {member.role || 'Subkoor Tim'}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          <button
                            type="button"
                            onClick={() => handleToggleActive(member.id)}
                            className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition-all cursor-pointer ${
                              member.active
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                                : 'bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-200'
                            }`}
                          >
                            {member.active ? 'Aktif' : 'Nonaktif'}
                          </button>
                          <button
                            type="button"
                            onClick={() => startEdit(member)}
                            className="p-1.5 rounded-lg bg-white hover:bg-slate-100 text-slate-500 hover:text-slate-900 border border-slate-200 transition-colors cursor-pointer"
                            title="Edit Subkoor"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(member.id, member.name)}
                            className="p-1.5 rounded-lg bg-white hover:bg-rose-50 text-slate-400 hover:text-rose-600 border border-slate-200 hover:border-rose-200 transition-colors cursor-pointer"
                            title="Hapus Subkoor"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 border-t border-slate-200 bg-slate-50 flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={handleResetDefault}
            className="px-3 py-1.5 rounded-xl bg-white hover:bg-slate-100 text-slate-600 hover:text-slate-900 border border-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset Preset Awal
          </button>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-[#6322D8] hover:bg-[#521AB8] text-white text-xs font-bold transition-all cursor-pointer"
          >
            Selesai
          </button>
        </div>
      </div>
    </div>
  );
};
