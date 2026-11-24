import React, { useState, useMemo, useEffect } from 'react';
import { GeneratedComment, Platform, TaskType } from '../types';
import {
  Copy,
  Check,
  RotateCw,
  Edit2,
  Trash2,
  FileSpreadsheet,
  FileText,
  AlertTriangle,
  Sparkles,
  Search,
  Filter,
  CheckCircle2,
  Table,
  ClipboardList,
} from 'lucide-react';

interface OutputTableProps {
  comments: GeneratedComment[];
  platform: Platform;
  task: TaskType;
  url: string;
  tone: string;
  onCopyAll: () => void;
  onCopyComment: (comment: GeneratedComment) => void;
  onRegenerateSingle: (comment: GeneratedComment) => Promise<void>;
  onRegenerateDuplicates: () => Promise<void>;
  onRegenerateAll: () => void;
  onEditComment: (id: string, newText: string) => void;
  onDeleteComment: (id: string) => void;
  onCheckDuplicate: () => void;
  onOpenDelegasiModal?: () => void;
  onNotify?: (msg: string, type?: 'success' | 'error') => void;
  isRegeneratingDuplicates: boolean;
  isRegeneratingSingleId: string | null;
}

export const OutputTable: React.FC<OutputTableProps> = ({
  comments,
  platform,
  task,
  url,
  tone,
  onCopyAll,
  onCopyComment,
  onRegenerateSingle,
  onRegenerateDuplicates,
  onRegenerateAll,
  onEditComment,
  onDeleteComment,
  onCheckDuplicate,
  onOpenDelegasiModal,
  onNotify,
  isRegeneratingDuplicates,
  isRegeneratingSingleId,
}) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [copiedWord, setCopiedWord] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAngleFilter, setSelectedAngleFilter] = useState<string>('ALL');
  const [viewMode, setViewMode] = useState<'table' | 'word'>('table');

  // Word output options
  const [includeNumbering, setIncludeNumbering] = useState(true);
  const [rangeStart, setRangeStart] = useState<number>(1);
  const [rangeEnd, setRangeEnd] = useState<number>(comments.length);

  // Sync range bounds when comments length changes
  useEffect(() => {
    setRangeStart(1);
    setRangeEnd(comments.length);
  }, [comments.length]);

  const duplicateCount = comments.filter((c) => c.isDuplicate).length;
  const uniqueCount = comments.length - duplicateCount;

  // Ordered comments by generate number (`no`)
  const orderedComments = useMemo(
    () => [...comments].sort((a, b) => a.no - b.no),
    [comments]
  );

  // Filtered comments for Table view
  const filteredComments = orderedComments.filter((c) => {
    const matchesSearch =
      c.text.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.angle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.persona && c.persona.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesAngle = selectedAngleFilter === 'ALL' || c.angle === selectedAngleFilter;
    return matchesSearch && matchesAngle;
  });

  // Range-filtered comments for Output Word (Mass Copy)
  const wordComments = useMemo(() => {
    const start = Math.max(1, Number(rangeStart) || 1);
    const end = Math.min(orderedComments.length, Number(rangeEnd) || orderedComments.length);
    if (end < start) return orderedComments;
    return orderedComments.filter((c) => c.no >= start && c.no <= end);
  }, [orderedComments, rangeStart, rangeEnd]);

  const wordFormattedText = useMemo(() => {
    return wordComments
      .map((c) => (includeNumbering ? `${c.no}. ${c.text}` : c.text))
      .join('\n');
  }, [wordComments, includeNumbering]);

  const availableAngles = Array.from(new Set(comments.map((c) => c.angle)));

  const handleCopySingle = (comment: GeneratedComment) => {
    onCopyComment(comment);
    setCopiedId(comment.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleCopyWordOutput = async () => {
    if (!wordFormattedText) return;
    try {
      await navigator.clipboard.writeText(wordFormattedText);
      setCopiedWord(true);
      setTimeout(() => setCopiedWord(false), 2000);
      if (onNotify) {
        onNotify(`Output Word (${wordComments.length} komentar bernomor) berhasil disalin untuk copy massal.`);
      }
    } catch {
      if (onNotify) {
        onNotify('Gagal mengakses clipboard browser.', 'error');
      }
    }
  };

  const startEdit = (comment: GeneratedComment) => {
    setEditingId(comment.id);
    setEditText(comment.text);
  };

  const saveEdit = (id: string) => {
    if (editText.trim()) {
      onEditComment(id, editText.trim());
    }
    setEditingId(null);
  };

  // Export to Word (.doc) ordered by generate number
  const handleExportWord = () => {
    const escapeHtml = (val: string) =>
      val
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');

    const rowsHtml = wordComments
      .map(
        (c) =>
          `<p style="margin:5pt 0;font-family:Calibri,Arial,sans-serif;font-size:11pt;line-height:1.45;">${
            includeNumbering ? `<strong>${c.no}.</strong> ` : ''
          }${escapeHtml(c.text)}</p>`
      )
      .join('');

    const docHtml = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>Output Word Metanarasi - ${escapeHtml(platform)}</title></head>
<body style="font-family:Calibri,Arial,sans-serif;color:#0f172a;">
  <h2 style="color:#4E18B3;margin-bottom:4pt;">Kurasi Output Word · ${escapeHtml(platform.toUpperCase())} (${escapeHtml(task)})</h2>
  <p style="font-size:10pt;color:#475569;margin-top:0;">
    Total: ${wordComments.length} komentar · Tone: ${escapeHtml(tone)}${url ? ` · URL: ${escapeHtml(url)}` : ''}
  </p>
  <hr style="border:none;border-top:1px solid #cbd5e1;margin:10pt 0;" />
  ${rowsHtml}
</body>
</html>`;

    const blob = new Blob(['\ufeff', docHtml], { type: 'application/msword' });
    const objectUrl = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = objectUrl;
    link.download = `Output_Word_${platform}_${new Date().toISOString().slice(0, 10)}.doc`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
    if (onNotify) {
      onNotify(`File Word (.doc) berisi ${wordComments.length} komentar berhasil diunduh.`);
    }
  };

  // Export to CSV with proper URL cleanup
  const handleExportCSV = () => {
    const headers = ['No', 'Platform', 'Task', 'URL', 'Comment', 'Angle', 'Persona', 'Length', 'Tone', 'Status'];
    const rows = orderedComments.map((c) => [
      c.no,
      `"${platform}"`,
      `"${task}"`,
      `"${url.replace(/"/g, '""')}"`,
      `"${c.text.replace(/"/g, '""')}"`,
      `"${c.angle}"`,
      `"${c.persona || '-'}"`,
      `"${c.lengthCategory || 'medium'}"`,
      `"${tone}"`,
      `"${c.status}"`,
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const objectUrl = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = objectUrl;
    link.download = `Metanarasi_${platform}_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
  };

  // Export to Excel-compatible XLSX (XML Spreadsheet)
  const handleExportXLSX = () => {
    const escapeXml = (val: string | number | undefined | null) => {
      if (val === undefined || val === null) return '';
      return String(val)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
    };

    const headers = ['No', 'Platform', 'Task', 'URL', 'Comment', 'Angle', 'Persona', 'Length', 'Tone', 'Status'];
    let xml = `<?xml version="1.0"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:html="http://www.w3.org/TR/REC-html40">
 <Worksheet ss:Name="Metanarasi AI">
  <Table>
   <Row>`;
    headers.forEach((h) => {
      xml += `<Cell><Data ss:Type="String">${escapeXml(h)}</Data></Cell>`;
    });
    xml += `</Row>`;

    orderedComments.forEach((c) => {
      xml += `<Row>
        <Cell><Data ss:Type="Number">${c.no}</Data></Cell>
        <Cell><Data ss:Type="String">${escapeXml(platform)}</Data></Cell>
        <Cell><Data ss:Type="String">${escapeXml(task)}</Data></Cell>
        <Cell><Data ss:Type="String">${escapeXml(url)}</Data></Cell>
        <Cell><Data ss:Type="String">${escapeXml(c.text)}</Data></Cell>
        <Cell><Data ss:Type="String">${escapeXml(c.angle)}</Data></Cell>
        <Cell><Data ss:Type="String">${escapeXml(c.persona || '-')}</Data></Cell>
        <Cell><Data ss:Type="String">${escapeXml(c.lengthCategory)}</Data></Cell>
        <Cell><Data ss:Type="String">${escapeXml(tone)}</Data></Cell>
        <Cell><Data ss:Type="String">${escapeXml(c.status)}</Data></Cell>
      </Row>`;
    });

    xml += `</Table>
 </Worksheet>
</Workbook>`;

    const blob = new Blob([xml], { type: 'application/vnd.ms-excel' });
    const objectUrl = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = objectUrl;
    link.download = `Metanarasi_${platform}_${new Date().toISOString().slice(0, 10)}.xls`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
  };

  return (
    <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 shadow-xs space-y-5">
      {/* Duplicate Detection Bar */}
      <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-[#F4EFFD] text-[#6322D8] border border-[#DDD0FA]">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-bold text-slate-900 text-sm">
                Quality Control &amp; Hasil Generate
              </span>
              <span className="text-slate-300" aria-hidden="true">·</span>
              <span className="text-xs font-bold text-emerald-700 tabular-nums">
                Unique: {uniqueCount}
              </span>
              {duplicateCount > 0 && (
                <>
                  <span className="text-slate-300" aria-hidden="true">·</span>
                  <span className="text-xs font-bold text-amber-700 inline-flex items-center gap-1 tabular-nums">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                    Potential Duplicate: {duplicateCount}
                  </span>
                </>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Mendeteksi kesamaan pola pembuka, kemiripan jaccard n-gram, dan siap disalin massal dalam format Word.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto flex-wrap">
          <button
            id="btn-check-duplicate"
            type="button"
            onClick={onCheckDuplicate}
            className="px-3.5 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-700 hover:text-slate-900 text-xs font-bold border border-slate-200 transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap"
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-slate-500" />
            Check Duplicate
          </button>

          {duplicateCount > 0 && (
            <button
              id="btn-regenerate-duplicates"
              type="button"
              disabled={isRegeneratingDuplicates}
              onClick={onRegenerateDuplicates}
              className="px-3.5 py-2 rounded-xl bg-[#FF9B00] hover:bg-[#e68a00] text-white text-xs font-bold shadow-xs transition-all cursor-pointer disabled:opacity-50 flex items-center gap-1.5 whitespace-nowrap"
            >
              <RotateCw className={`w-3.5 h-3.5 ${isRegeneratingDuplicates ? 'animate-spin' : ''}`} />
              Regenerate Duplicates ({duplicateCount})
            </button>
          )}

          {onOpenDelegasiModal && (
            <button
              type="button"
              onClick={onOpenDelegasiModal}
              className="px-3.5 py-2 rounded-xl bg-[#F4EFFD] hover:bg-[#EAE0FC] text-[#6322D8] border border-[#DDD0FA] text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap"
            >
              <ClipboardList className="w-3.5 h-3.5" />
              Delegasi Task
            </button>
          )}
        </div>
      </div>

      {/* View Mode Switcher + Global Action Toolbar */}
      <div className="flex flex-col xl:flex-row items-stretch xl:items-center justify-between gap-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 flex-1">
          {/* Segmented View Switch: Tabel Detail vs Output Word */}
          <div className="inline-flex items-center p-1 rounded-xl bg-slate-100 border border-slate-200 self-start">
            <button
              id="tab-view-table"
              type="button"
              onClick={() => setViewMode('table')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
                viewMode === 'table'
                  ? 'bg-white text-[#6322D8] shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Table className="w-3.5 h-3.5" />
              Tabel Detail
            </button>
            <button
              id="tab-view-word"
              type="button"
              onClick={() => setViewMode('word')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
                viewMode === 'word'
                  ? 'bg-white text-[#6322D8] shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              Output Word (Massal)
            </button>
          </div>

          {/* Search & Filter (shown in table mode) */}
          {viewMode === 'table' && (
            <div className="flex items-center gap-2 flex-1 max-w-md">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <input
                  id="input-filter-comments"
                  type="text"
                  placeholder="Cari kata atau persona..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 text-xs focus:bg-white focus:border-[#6322D8] focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-1.5">
                <Filter className="w-3.5 h-3.5 text-slate-400" />
                <select
                  id="select-angle-filter"
                  value={selectedAngleFilter}
                  onChange={(e) => setSelectedAngleFilter(e.target.value)}
                  className="px-2.5 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 text-xs focus:bg-white focus:border-[#6322D8] focus:outline-none"
                >
                  <option value="ALL">Semua Angle ({comments.length})</option>
                  {availableAngles.map((a) => (
                    <option key={a} value={a}>
                      {a}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Global Buttons: Copy All, Regenerate All, Export Word/CSV/XLSX */}
        <div className="flex items-center gap-2 flex-wrap justify-start xl:justify-end">
          <button
            id="btn-copy-all"
            type="button"
            onClick={viewMode === 'word' ? handleCopyWordOutput : onCopyAll}
            className="px-3.5 py-2 rounded-xl bg-[#6322D8] hover:bg-[#521AB8] text-white text-xs font-bold shadow-xs transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap"
          >
            {copiedWord ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            {viewMode === 'word'
              ? copiedWord
                ? 'Output Word Tersalin!'
                : 'Copy Output Word'
              : 'Copy All'}
          </button>

          <button
            id="btn-regenerate-all"
            type="button"
            onClick={onRegenerateAll}
            className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap"
          >
            <RotateCw className="w-3.5 h-3.5" />
            Regenerate All
          </button>

          <button
            id="btn-export-word"
            type="button"
            onClick={handleExportWord}
            className="px-3 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-900 text-xs font-semibold border border-slate-200 transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap"
          >
            <FileText className="w-3.5 h-3.5 text-[#6322D8]" />
            Export Word (.doc)
          </button>

          <button
            id="btn-export-csv"
            type="button"
            onClick={handleExportCSV}
            className="px-3 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-900 text-xs font-semibold border border-slate-200 transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap"
          >
            <FileText className="w-3.5 h-3.5 text-blue-600" />
            Export CSV
          </button>

          <button
            id="btn-export-xlsx"
            type="button"
            onClick={handleExportXLSX}
            className="px-3 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-900 text-xs font-semibold border border-slate-200 transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            Export XLSX
          </button>
        </div>
      </div>

      {/* VIEW 1: OUTPUT WORD (ORDERED BY GENERATE NUMBER FOR MASS COPY) */}
      {viewMode === 'word' && (
        <div
          id="word-output-panel"
          className="rounded-xl border border-slate-200 bg-[#FAFBFD] p-4 sm:p-5 space-y-4 animate-in fade-in duration-150"
        >
          {/* Word Toolbar: Range Selector + Numbering Toggle */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
            <div className="flex items-center gap-2 flex-wrap text-xs">
              <span className="font-bold text-slate-800">Urutan Nomor Generate:</span>
              <div className="flex items-center gap-1.5">
                <label className="text-slate-500 text-[11px]">Dari</label>
                <input
                  type="number"
                  min={1}
                  max={comments.length}
                  value={rangeStart}
                  onChange={(e) => setRangeStart(Number(e.target.value) || 1)}
                  className="w-16 px-2 py-1 rounded-lg bg-white border border-slate-200 text-xs font-mono tabular-nums text-slate-900 text-center focus:border-[#6322D8] focus:outline-none"
                />
                <label className="text-slate-500 text-[11px]">s/d</label>
                <input
                  type="number"
                  min={1}
                  max={comments.length}
                  value={rangeEnd}
                  onChange={(e) => setRangeEnd(Number(e.target.value) || comments.length)}
                  className="w-16 px-2 py-1 rounded-lg bg-white border border-slate-200 text-xs font-mono tabular-nums text-slate-900 text-center focus:border-[#6322D8] focus:outline-none"
                />
              </div>
              <button
                type="button"
                onClick={() => {
                  setRangeStart(1);
                  setRangeEnd(comments.length);
                }}
                className="text-[11px] font-semibold text-[#6322D8] hover:underline cursor-pointer"
              >
                Semua (1–{comments.length})
              </button>
            </div>

            <div className="flex items-center gap-3 flex-wrap">
              <label className="flex items-center gap-1.5 text-xs text-slate-700 font-medium cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={includeNumbering}
                  onChange={(e) => setIncludeNumbering(e.target.checked)}
                  className="w-3.5 h-3.5 accent-[#6322D8] rounded"
                />
                Tampilkan Nomor (1. 2. 3...)
              </label>

              <button
                type="button"
                onClick={handleCopyWordOutput}
                className="px-3.5 py-1.5 rounded-lg bg-[#6322D8] hover:bg-[#521AB8] text-white text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
              >
                {copiedWord ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                {copiedWord ? 'Tersalin!' : `Copy ${wordComments.length} Baris`}
              </button>
            </div>
          </div>

          {/* Word-like Document Sheet */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 sm:p-7 shadow-2xs space-y-4">
            <div className="border-b border-slate-100 pb-3 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
              <span className="font-bold text-slate-900 text-sm">
                Daftar Urutan Komentar · {platform.toUpperCase()} ({task})
              </span>
              <span className="font-mono tabular-nums">
                Menampilkan {wordComments.length} dari {comments.length} item
              </span>
            </div>

            <div className="space-y-2.5 text-xs sm:text-[13px] text-slate-900 leading-relaxed select-all font-sans max-h-[480px] overflow-y-auto pr-1">
              {wordComments.map((c) => (
                <div key={c.id} className="flex items-start gap-2.5 py-0.5">
                  {includeNumbering && (
                    <span className="font-mono tabular-nums font-bold text-[#6322D8] min-w-[2.25rem] select-none">
                      {c.no}.
                    </span>
                  )}
                  <p className="flex-1 text-slate-900">{c.text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* VIEW 2: MAIN TABLE */}
      {viewMode === 'table' && (
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider text-[10px] font-bold">
                <th className="py-3 px-3 w-12 text-center">No</th>
                <th className="py-3 px-4 min-w-[320px]">Generated Comment</th>
                <th className="py-3 px-3 w-36">Angle</th>
                <th className="py-3 px-3 w-28 text-center">Status</th>
                <th className="py-3 px-3 w-36 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredComments.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-500 text-xs">
                    Tidak ada komentar yang cocok dengan filter.
                  </td>
                </tr>
              ) : (
                filteredComments.map((comment) => {
                  const isEditing = editingId === comment.id;
                  const isCopied = copiedId === comment.id;
                  const isRegeneratingThis = isRegeneratingSingleId === comment.id;

                  return (
                    <tr
                      key={comment.id}
                      className={`hover:bg-slate-50/90 transition-colors ${
                        comment.isDuplicate ? 'bg-amber-50/70' : ''
                      }`}
                    >
                      {/* No (Exact generate number) */}
                      <td className="py-3 px-3 text-center font-mono tabular-nums text-slate-500 font-semibold">
                        {comment.no}
                      </td>

                      {/* Comment Content */}
                      <td className="py-3 px-4 text-slate-900">
                        {isEditing ? (
                          <div className="space-y-2">
                            <textarea
                              value={editText}
                              onChange={(e) => setEditText(e.target.value)}
                              rows={2}
                              className="w-full p-2 rounded-lg bg-white border border-[#6322D8] text-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-[#6322D8]/15"
                            />
                            <div className="flex gap-2">
                              <button
                                type="button"
                                onClick={() => saveEdit(comment.id)}
                                className="px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold cursor-pointer"
                              >
                                Simpan
                              </button>
                              <button
                                type="button"
                                onClick={() => setEditingId(null)}
                                className="px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-medium cursor-pointer"
                              >
                                Batal
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-1">
                            <p className="text-xs sm:text-[13px] leading-relaxed select-all text-slate-900">
                              {comment.text}
                            </p>

                            {/* Clean unboxed metadata */}
                            <div className="flex items-center gap-2 flex-wrap text-[11px] text-slate-500">
                              {comment.persona && <span>{comment.persona}</span>}
                              {comment.persona && <span aria-hidden="true">·</span>}
                              <span>{comment.lengthCategory}</span>
                              {comment.isDuplicate && (
                                <>
                                  <span aria-hidden="true">·</span>
                                  <span className="inline-flex items-center gap-1 text-amber-700 font-semibold">
                                    <AlertTriangle className="w-3 h-3 text-amber-600" />
                                    {comment.duplicateReason || 'Potensi duplikat'}
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                        )}
                      </td>

                      {/* Angle */}
                      <td className="py-3 px-3">
                        <span className="inline-block text-xs font-semibold text-[#6322D8]">
                          {comment.angle}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-3 px-3 text-center">
                        <span
                          className={`text-xs font-semibold ${
                            comment.status === 'Ready'
                              ? 'text-emerald-700'
                              : comment.status === 'Edited'
                              ? 'text-blue-700'
                              : 'text-[#6322D8]'
                          }`}
                        >
                          {comment.status}
                        </span>
                      </td>

                      {/* Row Actions */}
                      <td className="py-3 px-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => handleCopySingle(comment)}
                            className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                              isCopied
                                ? 'bg-emerald-600 text-white border-emerald-600'
                                : 'bg-white hover:bg-slate-100 text-slate-600 hover:text-slate-900 border-slate-200'
                            }`}
                            title="Copy Komentar"
                          >
                            {isCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>

                          <button
                            type="button"
                            disabled={isRegeneratingThis}
                            onClick={() => onRegenerateSingle(comment)}
                            className="p-1.5 rounded-lg bg-white hover:bg-slate-100 text-slate-600 hover:text-slate-900 border border-slate-200 transition-all cursor-pointer disabled:opacity-50"
                            title="Regenerate Komentar Ini"
                          >
                            <RotateCw
                              className={`w-3.5 h-3.5 ${isRegeneratingThis ? 'animate-spin text-[#6322D8]' : ''}`}
                            />
                          </button>

                          <button
                            type="button"
                            onClick={() => startEdit(comment)}
                            className="p-1.5 rounded-lg bg-white hover:bg-slate-100 text-slate-600 hover:text-slate-900 border border-slate-200 transition-all cursor-pointer"
                            title="Edit Komentar"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => onDeleteComment(comment.id)}
                            className="p-1.5 rounded-lg bg-white hover:bg-rose-50 text-slate-500 hover:text-rose-600 border border-slate-200 hover:border-rose-200 transition-all cursor-pointer"
                            title="Hapus"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
