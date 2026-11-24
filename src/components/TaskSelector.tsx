import React from 'react';
import { TASKS } from '../data/constants';
import { TaskType } from '../types';
import {
  Layers,
  ShieldAlert,
  Heart,
  Share2,
  Bookmark,
  UserPlus,
  Bell,
  MessageSquarePlus,
  MessageCircle,
  UserX,
  RefreshCw,
  ThumbsDown,
  Users,
  ClipboardList,
} from 'lucide-react';

interface TaskSelectorProps {
  selectedTask: TaskType;
  setSelectedTask: (task: TaskType) => void;
  subkoorCount?: number;
  onOpenSubkoorModal?: () => void;
  onOpenDelegasiModal?: () => void;
}

const TASK_ICONS: Record<TaskType, React.ReactNode> = {
  posting: <MessageSquarePlus className="w-3.5 h-3.5 text-[#6322D8]" />,
  komentar: <MessageCircle className="w-3.5 h-3.5 text-[#6322D8]" />,
  like: <Heart className="w-3.5 h-3.5 text-[#EE2A8E]" />,
  dislike: <ThumbsDown className="w-3.5 h-3.5 text-slate-600" />,
  share: <Share2 className="w-3.5 h-3.5 text-blue-600" />,
  repost: <RefreshCw className="w-3.5 h-3.5 text-emerald-600" />,
  save: <Bookmark className="w-3.5 h-3.5 text-[#FF9B00]" />,
  report_komentar: <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />,
  report_akun: <UserX className="w-3.5 h-3.5 text-rose-700" />,
  report_issue: <ShieldAlert className="w-3.5 h-3.5 text-[#FF5E00]" />,
  follow: <UserPlus className="w-3.5 h-3.5 text-[#6322D8]" />,
  subscribe: <Bell className="w-3.5 h-3.5 text-rose-600" />,
};

export const TaskSelector: React.FC<TaskSelectorProps> = ({
  selectedTask,
  setSelectedTask,
  subkoorCount = 4,
  onOpenSubkoorModal,
  onOpenDelegasiModal,
}) => {
  const currentTask = TASKS.find((t) => t.id === selectedTask) || TASKS[0];

  return (
    <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 shadow-xs space-y-4">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-[#F4EFFD] text-[#6322D8] border border-[#DDD0FA]">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2 flex-wrap">
              <span>Tujuan / Jenis Task</span>
              <span className="text-slate-300 font-normal" aria-hidden="true">·</span>
              <span className="text-xs font-semibold text-[#6322D8]">
                {currentTask.name}
              </span>
            </h2>
            <p className="text-xs text-slate-500">
              Metanarasi diformulasikan sesuai intensi engagement atau pelaporan yang diinginkan
            </p>
          </div>
        </div>

        {/* Delegation & Subkoor Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          {onOpenSubkoorModal && (
            <button
              id="btn-daftar-subkoor"
              type="button"
              onClick={onOpenSubkoorModal}
              className="px-3.5 py-2 rounded-xl bg-slate-50 hover:bg-[#F4EFFD] text-slate-700 hover:text-[#6322D8] border border-slate-200 hover:border-[#CBB4F8] text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap"
            >
              <Users className="w-3.5 h-3.5 text-[#6322D8]" />
              <span>Daftar Subkoor</span>
              <span className="text-slate-400 font-mono tabular-nums">({subkoorCount})</span>
            </button>
          )}

          {onOpenDelegasiModal && (
            <button
              id="btn-delegasi-task"
              type="button"
              onClick={onOpenDelegasiModal}
              className="px-3.5 py-2 rounded-xl bg-[#6322D8] hover:bg-[#521AB8] text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all cursor-pointer whitespace-nowrap"
            >
              <ClipboardList className="w-3.5 h-3.5" />
              <span>Delegasi Task</span>
            </button>
          )}
        </div>
      </div>

      {/* Grid of Tasks */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
        {TASKS.map((task) => {
          const isSelected = selectedTask === task.id;
          return (
            <button
              key={task.id}
              id={`task-btn-${task.id}`}
              type="button"
              onClick={() => setSelectedTask(task.id)}
              className={`p-2.5 rounded-xl border text-center transition-all duration-150 cursor-pointer flex flex-col items-center justify-center gap-1.5 ${
                isSelected
                  ? 'bg-[#FAF7FF] border-[#6322D8] ring-2 ring-[#6322D8]/15 text-[#4E18B3] shadow-xs'
                  : 'bg-slate-50/70 border-slate-200 text-slate-600 hover:text-slate-900 hover:border-slate-300 hover:bg-white'
              }`}
            >
              <div className={`p-1.5 rounded-lg border ${isSelected ? 'bg-white border-[#DDD0FA]' : 'bg-white border-slate-200'}`}>
                {TASK_ICONS[task.id]}
              </div>
              <span className="font-bold text-xs truncate max-w-full">{task.name}</span>
            </button>
          );
        })}
      </div>

      {/* Notice Banner */}
      <div className="px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200/80 text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
        <div className="text-slate-600">
          <strong className="text-slate-900 mr-1.5">{currentTask.name}:</strong>
          {currentTask.description}
        </div>
        {!currentTask.isDirectCopy && (
          <span className="text-[11px] text-amber-800 font-semibold whitespace-nowrap">
            Copy Bantuan Rekomendasi
          </span>
        )}
      </div>
    </div>
  );
};
