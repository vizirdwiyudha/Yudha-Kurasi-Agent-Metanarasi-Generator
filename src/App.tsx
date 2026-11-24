import React, { useState, useEffect, useRef } from 'react';
import { Header } from './components/Header';
import { UrlInputSection } from './components/UrlInputSection';
import { PlatformSelector } from './components/PlatformSelector';
import { TaskSelector } from './components/TaskSelector';
import { QuantityAndBrief } from './components/QuantityAndBrief';
import { OutputTable } from './components/OutputTable';
import { GenerationProgressModal } from './components/GenerationProgressModal';
import { DashboardView } from './components/DashboardView';
import { SmartMatrixView } from './components/SmartMatrixView';
import { HistoryView } from './components/HistoryView';
import { SettingsModal } from './components/SettingsModal';
import { SubkoorModal } from './components/SubkoorModal';
import { DelegasiTaskModal } from './components/DelegasiTaskModal';
import {
  DEFAULT_SETTINGS,
  SAMPLE_CONTEXTS,
  DEFAULT_SUBKOOR_MEMBERS,
  DEFAULT_DELEGATION_ITEMS,
} from './data/constants';
import {
  Platform,
  TaskType,
  Tone,
  AISettings,
  GeneratedComment,
  GenerationMetadata,
  AnalyzedContentData,
  SubkoorMember,
  TaskDelegationItem,
} from './types';
import { Check, AlertCircle } from 'lucide-react';

const STORAGE_KEY_HISTORY = 'metanarasi_ai_history_v1';
const STORAGE_KEY_SETTINGS = 'metanarasi_ai_settings_v1';
const STORAGE_KEY_SUBKOOR = 'kurasi_subkoor_list_v1';
const STORAGE_KEY_DELEGATION = 'kurasi_delegation_items_v1';
const STORAGE_KEY_DELEGATION_NOTE = 'kurasi_delegation_note_v1';

export default function App() {
  // Navigation
  const [activeTab, setActiveTab] = useState<
    'generator' | 'dashboard' | 'matrix' | 'history' | 'settings'
  >('generator');

  // Generator inputs
  const [url, setUrl] = useState('');
  const [context, setContext] = useState('');
  const [isContextAutoFilled, setIsContextAutoFilled] = useState(false);
  const [selectedPlatform, setSelectedPlatform] = useState<Platform>('instagram');
  const [selectedTask, setSelectedTask] = useState<TaskType>('posting');
  const [quantity, setQuantity] = useState<number>(20);
  const [clientBrief, setClientBrief] = useState('');
  const [tone, setTone] = useState<Tone | string>('Casual');
  const [customTone, setCustomTone] = useState('');

  // Settings & History persisted in localStorage
  const [settings, setSettings] = useState<AISettings>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_SETTINGS);
      return saved ? JSON.parse(saved) : DEFAULT_SETTINGS;
    } catch {
      return DEFAULT_SETTINGS;
    }
  });

  const [history, setHistory] = useState<GenerationMetadata[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_HISTORY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Generator results & processing states
  const [currentComments, setCurrentComments] = useState<GeneratedComment[]>([]);
  const [isAnalyzingUrl, setIsAnalyzingUrl] = useState(false);
  const [urlAnalysisResult, setUrlAnalysisResult] = useState<{
    canAnalyze: boolean;
    detectedPlatform?: string;
    message?: string;
    error?: string;
    analysis?: AnalyzedContentData;
  } | null>(null);

  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStep, setGenerationStep] = useState(1);
  const [isRegeneratingDuplicates, setIsRegeneratingDuplicates] = useState(false);
  const [isRegeneratingSingleId, setIsRegeneratingSingleId] = useState<string | null>(null);

  // Subkoor & Task Delegation state persisted in localStorage
  const [subkoorList, setSubkoorList] = useState<SubkoorMember[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_SUBKOOR);
      return saved ? JSON.parse(saved) : DEFAULT_SUBKOOR_MEMBERS;
    } catch {
      return DEFAULT_SUBKOOR_MEMBERS;
    }
  });

  const [delegationItems, setDelegationItems] = useState<TaskDelegationItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_DELEGATION);
      return saved ? JSON.parse(saved) : DEFAULT_DELEGATION_ITEMS;
    } catch {
      return DEFAULT_DELEGATION_ITEMS;
    }
  });

  const [delegationCustomNote, setDelegationCustomNote] = useState<string>(() => {
    try {
      return localStorage.getItem(STORAGE_KEY_DELEGATION_NOTE) || '';
    } catch {
      return '';
    }
  });

  const [isSubkoorModalOpen, setIsSubkoorModalOpen] = useState(false);
  const [isDelegasiModalOpen, setIsDelegasiModalOpen] = useState(false);

  // Toast feedback
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Persist settings
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(settings));
    } catch (e) {
      console.error('Failed to save settings:', e);
    }
  }, [settings]);

  // Persist history
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_HISTORY, JSON.stringify(history));
    } catch (e) {
      console.error('Failed to save history:', e);
    }
  }, [history]);

  // Persist subkoor & delegation settings
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_SUBKOOR, JSON.stringify(subkoorList));
    } catch (e) {
      console.error('Failed to save subkoor list:', e);
    }
  }, [subkoorList]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_DELEGATION, JSON.stringify(delegationItems));
    } catch (e) {
      console.error('Failed to save delegation items:', e);
    }
  }, [delegationItems]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_DELEGATION_NOTE, delegationCustomNote);
    } catch (e) {
      console.error('Failed to save delegation note:', e);
    }
  }, [delegationCustomNote]);

  // Cleanup toast timer on unmount
  useEffect(() => {
    return () => {
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    };
  }, []);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    if (toastTimerRef.current) {
      clearTimeout(toastTimerRef.current);
    }
    setToast({ message, type });
    toastTimerRef.current = setTimeout(() => {
      setToast(null);
    }, 3500);
  };

  const handleUrlChange = (newUrl: string) => {
    setUrl(newUrl);
    if (urlAnalysisResult?.analysis?.sourceUrl && newUrl.trim() !== urlAnalysisResult.analysis.sourceUrl) {
      setUrlAnalysisResult(null);
      if (isContextAutoFilled) {
        setContext('');
        setIsContextAutoFilled(false);
      }
    }
  };

  const handleContextChange = (val: string) => {
    setContext(val);
    setIsContextAutoFilled(false);
  };

  // Analyze URL handler
  const handleAnalyzeUrl = async () => {
    if (!url.trim()) return;
    setIsAnalyzingUrl(true);
    setUrlAnalysisResult(null);

    try {
      const res = await fetch('/api/analyze-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: url.trim(), context: context.trim() }),
      });

      const data = await res.json();
      setUrlAnalysisResult({
        ...data,
        message: data.message || data.error,
      });

      if (
        data.detectedPlatform &&
        data.detectedPlatform !== 'web' &&
        data.detectedPlatform !== selectedPlatform
      ) {
        setSelectedPlatform(data.detectedPlatform as Platform);
      }

      // Auto-populate context if empty or previously auto-filled from an earlier URL
      if (data.canAnalyze && data.analysis?.suggestedContext && (!context.trim() || isContextAutoFilled)) {
        setContext(data.analysis.suggestedContext);
        setIsContextAutoFilled(true);
      }

      if (data.canAnalyze) {
        const platLabel =
          data.detectedPlatform && data.detectedPlatform !== 'web'
            ? ` Platform diset ke ${data.detectedPlatform.toUpperCase()}.`
            : ' Konteks artikel web siap digunakan.';
        showToast(`URL berhasil dianalisis.${platLabel}`);
      } else {
        showToast(data.message || data.error || 'URL belum dapat dianalisis.', 'error');
      }
    } catch {
      setUrlAnalysisResult({
        canAnalyze: false,
        message:
          'URL belum dapat dianalisis. Tambahkan caption, screenshot, atau ringkasan konten agar AI dapat menghasilkan komentar yang lebih relevan.',
      });
      showToast('Gagal menghubungi server analisis URL.', 'error');
    } finally {
      setIsAnalyzingUrl(false);
    }
  };

  // Select quick sample context
  const handleSelectSample = (sample: typeof SAMPLE_CONTEXTS[0]) => {
    setUrl(sample.url);
    setSelectedPlatform(sample.platform);
    setSelectedTask(sample.task);
    setTone(sample.tone);
    setClientBrief(sample.brief);
    setContext(sample.context);
    setIsContextAutoFilled(false);
    setUrlAnalysisResult(null);
    showToast(`Memuat template: ${sample.label}`);
  };

  // Generate Metanarasi handler with 6-step progress simulation
  const handleGenerate = async () => {
    setIsGenerating(true);
    setGenerationStep(1);

    const timer1 = setTimeout(() => setGenerationStep(2), 600);
    const timer2 = setTimeout(() => setGenerationStep(3), 1300);
    const timer3 = setTimeout(() => setGenerationStep(4), 2000);

    try {
      const trimmedUrl = url.trim();
      const matchingAnalysis =
        urlAnalysisResult?.canAnalyze &&
        urlAnalysisResult.analysis &&
        (!urlAnalysisResult.analysis.sourceUrl || urlAnalysisResult.analysis.sourceUrl === trimmedUrl)
          ? urlAnalysisResult.analysis
          : undefined;

      const response = await fetch('/api/generate-metanarasi', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          platform: selectedPlatform,
          task: selectedTask,
          quantity,
          url: trimmedUrl,
          context: context.trim(),
          clientBrief: clientBrief.trim(),
          tone: tone === 'Custom' ? customTone || 'Casual' : tone,
          settings,
          analyzedContent: matchingAnalysis,
        }),
      });

      const data = await response.json();

      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);

      if (!response.ok) {
        throw new Error(data.error || 'Gagal memproses metanarasi');
      }

      setGenerationStep(5);
      await new Promise((r) => setTimeout(r, 500));
      setGenerationStep(6);
      await new Promise((r) => setTimeout(r, 350));

      if (data.analyzedContext) {
        setUrlAnalysisResult({
          canAnalyze: true,
          detectedPlatform: data.detectedPlatform || selectedPlatform,
          analysis: data.analyzedContext,
        });
        if ((!context.trim() || isContextAutoFilled) && data.analyzedContext.suggestedContext) {
          setContext(data.analyzedContext.suggestedContext);
          setIsContextAutoFilled(true);
        }
      }

      const newComments: GeneratedComment[] = data.comments || [];
      setCurrentComments(newComments);

      const effectiveContextUsed =
        context.trim() || data.analyzedContext?.suggestedContext || data.analyzedContext?.summary || '';

      // Save to history (newest first)
      const newEntry: GenerationMetadata = {
        id: `gen_${Date.now()}`,
        timestamp: Date.now(),
        url: trimmedUrl,
        platform: selectedPlatform,
        task: selectedTask,
        quantity: newComments.length,
        tone: tone === 'Custom' ? customTone || 'Casual' : tone,
        clientBrief: clientBrief.trim(),
        context: effectiveContextUsed,
        analyzedContext: data.analyzedContext,
        comments: newComments,
        stats: data.stats || {
          total: newComments.length,
          unique: newComments.filter((c) => !c.isDuplicate).length,
          duplicates: newComments.filter((c) => c.isDuplicate).length,
        },
      };

      setHistory((prev) => [newEntry, ...prev.slice(0, 49)]);
      showToast(`Berhasil menghasilkan ${newComments.length} metanarasi unik.`);
    } catch (err: any) {
      showToast(err.message || 'Terjadi kesalahan saat generate metanarasi.', 'error');
    } finally {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      setIsGenerating(false);
    }
  };

  // Copy All comments formatted with numbering
  const handleCopyAll = async () => {
    if (currentComments.length === 0) return;
    const formatted = currentComments
      .map((c, idx) => `${idx + 1}. ${c.text}`)
      .join('\n\n');

    try {
      await navigator.clipboard.writeText(formatted);
      showToast(`Seluruh ${currentComments.length} komentar berhasil disalin ke clipboard.`);
    } catch {
      showToast('Gagal mengakses clipboard browser.', 'error');
    }
  };

  // Copy single comment
  const handleCopySingleComment = async (c: GeneratedComment) => {
    try {
      await navigator.clipboard.writeText(c.text);
      showToast(`Komentar #${c.no} tersalin.`);
    } catch {
      showToast('Gagal mengakses clipboard browser.', 'error');
    }
  };

  // Regenerate single comment
  const handleRegenerateSingle = async (c: GeneratedComment) => {
    setIsRegeneratingSingleId(c.id);
    try {
      const res = await fetch('/api/regenerate-single', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          commentId: c.id,
          originalText: c.text,
          angle: c.angle,
          platform: selectedPlatform,
          task: selectedTask,
          tone: tone === 'Custom' ? customTone || 'Casual' : tone,
          url: url.trim(),
          context: context.trim() || clientBrief.trim(),
          analyzedContent:
            urlAnalysisResult?.canAnalyze &&
            (!urlAnalysisResult.analysis?.sourceUrl || urlAnalysisResult.analysis.sourceUrl === url.trim())
              ? urlAnalysisResult.analysis
              : undefined,
          existingComments: currentComments.map((x) => x.text),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Gagal meregenerasi komentar');
      }

      if (data.success && data.comment) {
        setCurrentComments((prev) =>
          prev.map((item) =>
            item.id === c.id
              ? {
                  ...item,
                  text: data.comment.text,
                  angle: data.comment.angle || item.angle,
                  persona: data.comment.persona || item.persona,
                  status: 'Regenerated',
                  isDuplicate: false,
                  duplicateReason: undefined,
                }
              : item
          )
        );
        showToast(`Komentar #${c.no} berhasil diregenerasi.`);
      }
    } catch (e: any) {
      showToast('Gagal meregenerasi komentar: ' + (e.message || 'Unknown error'), 'error');
    } finally {
      setIsRegeneratingSingleId(null);
    }
  };

  // Regenerate duplicates handler
  const handleRegenerateDuplicates = async () => {
    const duplicates = currentComments.filter((c) => c.isDuplicate);
    if (duplicates.length === 0) {
      showToast('Tidak ada komentar duplikat yang perlu diganti.');
      return;
    }

    setIsRegeneratingDuplicates(true);
    try {
      const res = await fetch('/api/regenerate-duplicates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          duplicateComments: duplicates,
          allComments: currentComments,
          platform: selectedPlatform,
          tone: tone === 'Custom' ? customTone || 'Casual' : tone,
          url: url.trim(),
          context: context.trim() || clientBrief.trim(),
          analyzedContent:
            urlAnalysisResult?.canAnalyze &&
            (!urlAnalysisResult.analysis?.sourceUrl || urlAnalysisResult.analysis.sourceUrl === url.trim())
              ? urlAnalysisResult.analysis
              : undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Gagal meregenerasi duplikat');
      }

      if (data.success && Array.isArray(data.regenerated)) {
        const replacementMap = new Map(data.regenerated.map((r: any) => [r.id, r]));

        setCurrentComments((prev) =>
          prev.map((item) => {
            const repl = replacementMap.get(item.id) as GeneratedComment;
            if (repl) {
              return {
                ...item,
                text: repl.text,
                angle: repl.angle || item.angle,
                persona: repl.persona || item.persona,
                status: 'Regenerated',
                isDuplicate: false,
                duplicateReason: undefined,
              };
            }
            return item;
          })
        );
        showToast(`${duplicates.length} komentar duplikat berhasil diperbarui menjadi unik.`);
      }
    } catch (e: any) {
      showToast('Gagal meregenerasi duplikat: ' + (e.message || 'Unknown error'), 'error');
    } finally {
      setIsRegeneratingDuplicates(false);
    }
  };

  // Inline edit comment
  const handleEditComment = (id: string, newText: string) => {
    setCurrentComments((prev) =>
      prev.map((c) => (c.id === id ? { ...c, text: newText, status: 'Edited' } : c))
    );
    showToast('Komentar berhasil diperbarui.');
  };

  // Delete comment & keep sequential numbering
  const handleDeleteComment = (id: string) => {
    setCurrentComments((prev) =>
      prev.filter((c) => c.id !== id).map((c, idx) => ({ ...c, no: idx + 1 }))
    );
    showToast('Komentar dihapus.');
  };

  // Re-run client side duplicate check
  const handleCheckDuplicate = () => {
    let duplicateCount = 0;
    const checked = currentComments.map((c, idx) => ({
      ...c,
      no: idx + 1,
      isDuplicate: false,
      duplicateReason: undefined as string | undefined,
    }));

    for (let i = 0; i < checked.length; i++) {
      for (let j = i + 1; j < checked.length; j++) {
        const textA = checked[i].text.toLowerCase().trim();
        const textB = checked[j].text.toLowerCase().trim();

        const wordsA = textA.split(/\s+/).slice(0, 3).join(' ');
        const wordsB = textB.split(/\s+/).slice(0, 3).join(' ');

        if (wordsA.length > 5 && wordsA === wordsB) {
          checked[j].isDuplicate = true;
          checked[j].duplicateReason = `Pembuka kalimat sama dengan #${checked[i].no}`;
          duplicateCount++;
        }
      }
    }

    setCurrentComments(checked);
    if (duplicateCount > 0) {
      showToast(`Ditemukan ${duplicateCount} komentar dengan potensi kemiripan.`);
    } else {
      showToast('Seluruh komentar 100% unik dan tidak ada pembuka yang sama.');
    }
  };

  // Load project from History or Dashboard into workspace
  const handleLoadProject = (project: GenerationMetadata) => {
    setUrl(project.url || '');
    setSelectedPlatform(project.platform);
    setSelectedTask(project.task);
    setQuantity(project.quantity);
    setClientBrief(project.clientBrief || '');
    setContext(project.context || '');
    setIsContextAutoFilled(false);
    setUrlAnalysisResult(
      project.analyzedContext
        ? {
            canAnalyze: true,
            detectedPlatform: project.platform,
            analysis: project.analyzedContext,
          }
        : null
    );
    setTone(project.tone || 'Casual');
    setCurrentComments(project.comments || []);
    setActiveTab('generator');
    showToast(`Project dari ${new Date(project.timestamp).toLocaleDateString('id-ID')} berhasil dimuat.`);
  };

  return (
    <div className="min-h-screen bg-[#F8F9FC] text-slate-900 flex flex-col font-sans">
      {/* Global Header & Nav */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        totalGenerationsCount={history.length}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* TAB 1: GENERATOR WORKSPACE */}
        {activeTab === 'generator' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* 1. URL Input Section */}
            <UrlInputSection
              url={url}
              setUrl={handleUrlChange}
              context={context}
              setContext={handleContextChange}
              onAnalyzeUrl={handleAnalyzeUrl}
              isAnalyzing={isAnalyzingUrl}
              analysisResult={urlAnalysisResult}
              onSelectSample={handleSelectSample}
            />

            {/* 2. Platform Selector */}
            <PlatformSelector
              selectedPlatform={selectedPlatform}
              setSelectedPlatform={setSelectedPlatform}
            />

            {/* 3. Task Selector */}
            <TaskSelector
              selectedTask={selectedTask}
              setSelectedTask={setSelectedTask}
              subkoorCount={subkoorList.filter((s) => s.active).length}
              onOpenSubkoorModal={() => setIsSubkoorModalOpen(true)}
              onOpenDelegasiModal={() => setIsDelegasiModalOpen(true)}
            />

            {/* 4. Quantity, Tone, Client Brief, and CTA */}
            <QuantityAndBrief
              quantity={quantity}
              setQuantity={setQuantity}
              clientBrief={clientBrief}
              setClientBrief={setClientBrief}
              tone={tone}
              setTone={setTone}
              customTone={customTone}
              setCustomTone={setCustomTone}
              isGenerating={isGenerating}
              onGenerate={handleGenerate}
            />

            {/* 5. Output Table if comments exist */}
            {currentComments.length > 0 && (
              <div id="output-results-section" className="pt-2 animate-in fade-in duration-300">
                <OutputTable
                  comments={currentComments}
                  platform={selectedPlatform}
                  task={selectedTask}
                  url={url}
                  tone={tone === 'Custom' ? customTone : (tone as string)}
                  onCopyAll={handleCopyAll}
                  onCopyComment={handleCopySingleComment}
                  onRegenerateSingle={handleRegenerateSingle}
                  onRegenerateDuplicates={handleRegenerateDuplicates}
                  onRegenerateAll={handleGenerate}
                  onEditComment={handleEditComment}
                  onDeleteComment={handleDeleteComment}
                  onCheckDuplicate={handleCheckDuplicate}
                  onOpenDelegasiModal={() => setIsDelegasiModalOpen(true)}
                  onNotify={showToast}
                  isRegeneratingDuplicates={isRegeneratingDuplicates}
                  isRegeneratingSingleId={isRegeneratingSingleId}
                />
              </div>
            )}
          </div>
        )}

        {/* TAB 2: DASHBOARD */}
        {activeTab === 'dashboard' && (
          <DashboardView
            history={history}
            onLoadProject={handleLoadProject}
            onGoToGenerator={() => setActiveTab('generator')}
          />
        )}

        {/* TAB 3: SMART MATRIX */}
        {activeTab === 'matrix' && <SmartMatrixView />}

        {/* TAB 4: HISTORY */}
        {activeTab === 'history' && (
          <HistoryView
            history={history}
            onLoadProject={handleLoadProject}
            onDeleteHistoryItem={(id) => {
              setHistory((prev) => prev.filter((h) => h.id !== id));
              showToast('Riwayat dihapus.');
            }}
            onClearAllHistory={() => {
              setHistory([]);
              showToast('Seluruh riwayat telah dikosongkan.');
            }}
          />
        )}

        {/* TAB 5: SETTINGS */}
        {activeTab === 'settings' && (
          <SettingsModal
            settings={settings}
            setSettings={setSettings}
            onClose={() => setActiveTab('generator')}
          />
        )}
      </main>

      {/* Progress Modal during generation */}
      <GenerationProgressModal
        isOpen={isGenerating}
        currentStep={generationStep}
        totalQuantity={quantity}
        platform={selectedPlatform}
      />

      {/* Daftar Subkoor Modal */}
      <SubkoorModal
        isOpen={isSubkoorModalOpen}
        onClose={() => setIsSubkoorModalOpen(false)}
        subkoorList={subkoorList}
        setSubkoorList={setSubkoorList}
        onNotify={showToast}
      />

      {/* Delegasi Task Modal */}
      <DelegasiTaskModal
        isOpen={isDelegasiModalOpen}
        onClose={() => setIsDelegasiModalOpen(false)}
        subkoorList={subkoorList}
        delegationItems={delegationItems}
        setDelegationItems={setDelegationItems}
        customNote={delegationCustomNote}
        setCustomNote={setDelegationCustomNote}
        targetUrl={url}
        platform={selectedPlatform}
        comments={currentComments}
        onOpenSubkoorModal={() => {
          setIsDelegasiModalOpen(false);
          setIsSubkoorModalOpen(true);
        }}
        onNotify={showToast}
      />

      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom-5 fade-in duration-200">
          <div
            className={`px-4 py-3 rounded-xl bg-white border shadow-lg text-slate-900 text-xs sm:text-sm font-semibold flex items-center gap-2.5 ${
              toast.type === 'error' ? 'border-rose-300' : 'border-slate-200'
            }`}
          >
            {toast.type === 'error' ? (
              <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
            ) : (
              <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            )}
            <span>{toast.message}</span>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-4 px-4 text-center text-xs text-slate-500 mt-auto">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <p>
            <strong className="text-slate-700">Kurasi</strong> · Your Data Storyteller Partner
          </p>
          <p className="text-[11px] text-slate-400">
            Netizen Indonesia Dialect Synthesis · Quality Control Engine
          </p>
        </div>
      </footer>
    </div>
  );
}
