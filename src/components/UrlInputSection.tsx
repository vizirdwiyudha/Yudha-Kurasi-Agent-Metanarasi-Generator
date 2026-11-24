import React, { useState, useMemo, useEffect } from 'react';
import {
  Search,
  Sparkles,
  CheckCircle,
  Link2,
  FileText,
  Info,
  ArrowDownRight,
  Tag,
  Play,
  ExternalLink,
  Quote,
  ListChecks,
  EyeOff,
  Video,
  Globe,
  Copy,
  Check,
  AlertCircle,
} from 'lucide-react';
import { SAMPLE_CONTEXTS } from '../data/constants';
import { AnalyzedContentData } from '../types';

interface UrlInputSectionProps {
  url: string;
  setUrl: (url: string) => void;
  context: string;
  setContext: (context: string) => void;
  onAnalyzeUrl: () => Promise<void>;
  isAnalyzing: boolean;
  analysisResult: {
    canAnalyze: boolean;
    detectedPlatform?: string;
    message?: string;
    error?: string;
    analysis?: AnalyzedContentData;
  } | null;
  onSelectSample: (sample: typeof SAMPLE_CONTEXTS[0]) => void;
}

export const UrlInputSection: React.FC<UrlInputSectionProps> = ({
  url,
  setUrl,
  context,
  setContext,
  onAnalyzeUrl,
  isAnalyzing,
  analysisResult,
  onSelectSample,
}) => {
  const [showVideoPlayer, setShowVideoPlayer] = useState(false);
  const [copiedSnippet, setCopiedSnippet] = useState(false);
  const [faviconFailed, setFaviconFailed] = useState(false);

  const analysis = analysisResult?.analysis;

  // Reset media & favicon error states whenever URL or analysis result updates
  useEffect(() => {
    setFaviconFailed(false);
    setShowVideoPlayer(false);
    setCopiedSnippet(false);
  }, [url, analysisResult]);

  const displayDomain = useMemo(() => {
    if (analysis?.domain) return analysis.domain;
    if (url) {
      try {
        const u = new URL(url.startsWith('http') ? url : `https://${url}`);
        return u.hostname.replace(/^www\./, '');
      } catch {
        return 'web';
      }
    }
    return '';
  }, [analysis?.domain, url]);

  const faviconUrl = useMemo(() => {
    if (analysis?.faviconUrl) return analysis.faviconUrl;
    if (displayDomain && displayDomain !== 'web') {
      return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(displayDomain)}&sz=128`;
    }
    return '';
  }, [analysis?.faviconUrl, displayDomain]);

  const displaySnippet = useMemo(() => {
    if (analysis?.snippet) return analysis.snippet;
    if (analysis?.rawTextSnippet) return analysis.rawTextSnippet.slice(0, 300);
    if (analysis?.summary) return analysis.summary.slice(0, 300);
    return 'Konten berhasil diambil dan diekstraksi dari tautan.';
  }, [analysis?.snippet, analysis?.rawTextSnippet, analysis?.summary]);

  const handleCopySnippet = async () => {
    if (!displaySnippet) return;
    try {
      await navigator.clipboard.writeText(displaySnippet);
      setCopiedSnippet(true);
      setTimeout(() => setCopiedSnippet(false), 2000);
    } catch {
      // Clipboard blocked
    }
  };

  const handleApplySuggestedContext = () => {
    if (analysisResult?.analysis?.suggestedContext) {
      setContext(analysisResult.analysis.suggestedContext);
    } else if (analysisResult?.analysis?.summary) {
      setContext(analysisResult.analysis.summary);
    }
  };

  const handleAddAngleToContext = (angle: string) => {
    if (!context.includes(angle)) {
      setContext(context ? `${context}\n[Angle: ${angle}]` : `[Angle: ${angle}]`);
    }
  };

  return (
    <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 shadow-xs space-y-4">
      {/* Header & Quick Samples Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-[#F4EFFD] text-[#6322D8] border border-[#DDD0FA]">
            <Link2 className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2 flex-wrap">
              <span>URL & Pemahaman Konten</span>
              <span className="text-xs font-medium text-slate-400">·</span>
              <span className="text-xs font-medium text-[#6322D8]">Deep Reader & Watcher</span>
            </h2>
            <p className="text-xs text-slate-500">
              AI membaca teks, transkrip, deskripsi, dan memahami alur konten secara menyeluruh
            </p>
          </div>
        </div>

        {/* Quick Sample Presets */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0 text-xs">
          <span className="text-[11px] text-slate-500 whitespace-nowrap font-medium">Contoh:</span>
          {SAMPLE_CONTEXTS.slice(0, 4).map((sample, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => onSelectSample(sample)}
              className="text-[11px] px-2.5 py-1 rounded-lg bg-slate-50 hover:bg-[#F4EFFD] hover:text-[#6322D8] hover:border-[#CBB4F8] border border-slate-200 text-slate-600 font-medium whitespace-nowrap transition-all cursor-pointer"
            >
              {sample.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main URL Input and Analyze Button */}
      <div className="flex flex-col sm:flex-row gap-2.5">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            id="input-content-url"
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && url.trim() && !isAnalyzing) {
                e.preventDefault();
                onAnalyzeUrl();
              }
            }}
            placeholder="Paste link YouTube, TikTok, Instagram, X (Twitter), Threads, Berita/Web..."
            className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-[#6322D8] focus:ring-2 focus:ring-[#6322D8]/15 focus:outline-none text-slate-900 placeholder-slate-400 text-xs sm:text-sm transition-all"
          />
        </div>

        <button
          id="btn-analyze-url"
          type="button"
          onClick={onAnalyzeUrl}
          disabled={isAnalyzing || !url.trim()}
          className="px-5 py-3 rounded-xl bg-[#6322D8] hover:bg-[#521AB8] disabled:opacity-50 text-white text-xs sm:text-sm font-bold flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer disabled:cursor-not-allowed flex-shrink-0 whitespace-nowrap"
        >
          {isAnalyzing ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>Membaca & Memahami Konten...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 text-amber-200" />
              <span>Baca & Analisis URL</span>
            </>
          )}
        </button>
      </div>

      {/* Error / Unreadable URL Feedback */}
      {analysisResult && !analysisResult.canAnalyze && (
        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            {analysisResult.message ||
              analysisResult.error ||
              'URL belum dapat dianalisis. Periksa format tautan atau isi kolom konteks secara manual.'}
          </p>
        </div>
      )}

      {/* Link Preview Card - Visual Confirmation of Fetched Content */}
      {analysisResult?.canAnalyze && analysis && (
        <div
          id="link-preview-card"
          className="p-4 sm:p-5 rounded-2xl bg-[#FAF9FE] border border-[#DDD0FA] text-slate-800 space-y-4 animate-in fade-in slide-in-from-top-2 duration-200"
        >
          {/* Top Bar: Favicon + Domain + Verified Status + Actions */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200/80 pb-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-7 h-7 rounded-lg bg-white border border-slate-200 p-1 flex items-center justify-center flex-shrink-0 shadow-2xs">
                {faviconUrl && !faviconFailed ? (
                  <img
                    src={faviconUrl}
                    alt={displayDomain}
                    className="w-4 h-4 object-contain rounded-sm"
                    referrerPolicy="no-referrer"
                    onError={() => setFaviconFailed(true)}
                  />
                ) : (
                  <Globe className="w-4 h-4 text-[#6322D8]" />
                )}
              </div>

              <div className="flex items-center gap-2 min-w-0 flex-wrap text-xs">
                <span className="font-bold text-slate-900 truncate tracking-wide">
                  {displayDomain}
                </span>
                <span className="text-slate-300" aria-hidden="true">·</span>
                {analysis.contentReadSuccess === false ? (
                  <span className="inline-flex items-center gap-1 font-semibold text-amber-700">
                    <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                    Tautan Privat / Terbatas · Metadata URL
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 font-semibold text-emerald-700">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                    Link Preview Terverifikasi
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {analysis.embedUrl && (
                <button
                  type="button"
                  onClick={() => setShowVideoPlayer(!showVideoPlayer)}
                  className="text-xs px-3 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-semibold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap"
                >
                  {showVideoPlayer ? (
                    <>
                      <EyeOff className="w-3.5 h-3.5" />
                      Tutup Pemutar
                    </>
                  ) : (
                    <>
                      <Play className="w-3.5 h-3.5 fill-rose-600 text-rose-600" />
                      Tonton Video
                    </>
                  )}
                </button>
              )}

              <button
                type="button"
                onClick={handleApplySuggestedContext}
                className="text-xs px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs whitespace-nowrap"
              >
                <ArrowDownRight className="w-3.5 h-3.5" />
                Terapkan ke Konteks
              </button>

              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs p-1.5 rounded-lg bg-white hover:bg-slate-100 text-slate-600 border border-slate-200 flex items-center transition-all"
                title="Buka tautan asli di tab baru"
              >
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>

          {/* Embedded Video Player */}
          {showVideoPlayer && analysis.embedUrl && (
            <div className="rounded-xl overflow-hidden border border-slate-200 bg-black aspect-video max-w-2xl mx-auto shadow-md animate-in fade-in duration-200">
              <iframe
                src={`${analysis.embedUrl}?autoplay=1`}
                title={analysis.originalTitle || 'Video Player'}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="w-full h-full border-0"
              />
            </div>
          )}

          {/* Main Link Preview Content */}
          <div className="flex flex-col md:flex-row gap-4 items-start">
            {analysis.thumbnailUrl && !showVideoPlayer && (
              <div className="relative group rounded-xl overflow-hidden border border-slate-200 bg-slate-100 w-full md:w-56 flex-shrink-0 aspect-video md:aspect-[16/10]">
                <img
                  src={analysis.thumbnailUrl}
                  alt={analysis.originalTitle || 'Media Preview'}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
                {analysis.embedUrl ? (
                  <button
                    type="button"
                    onClick={() => setShowVideoPlayer(true)}
                    className="absolute inset-0 bg-black/35 hover:bg-black/20 flex items-center justify-center transition-all cursor-pointer"
                    aria-label="Putar preview video"
                  >
                    <div className="w-11 h-11 rounded-full bg-rose-600/95 text-white flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform">
                      <Play className="w-5 h-5 ml-0.5 fill-white" />
                    </div>
                  </button>
                ) : (
                  <div className="absolute top-2 right-2 px-2 py-0.5 rounded bg-slate-900/75 text-[10px] font-semibold text-white">
                    {analysisResult.detectedPlatform?.toUpperCase()}
                  </div>
                )}
              </div>
            )}

            <div className="flex-1 min-w-0 space-y-2.5">
              {/* Clean Unboxed Metadata Line */}
              <div className="flex items-center gap-2 flex-wrap text-xs text-slate-500">
                <span className="font-bold text-[#6322D8] uppercase">
                  {analysisResult.detectedPlatform || 'Media'}
                </span>
                {analysis.brand && (
                  <>
                    <span aria-hidden="true">·</span>
                    <span>
                      Kreator: <strong className="text-slate-800">{analysis.brand}</strong>
                    </span>
                  </>
                )}
                {analysis.mediaType === 'video' && (
                  <>
                    <span aria-hidden="true">·</span>
                    <span className="inline-flex items-center gap-1 text-rose-700 font-medium">
                      <Video className="w-3.5 h-3.5" /> Video
                    </span>
                  </>
                )}
                {analysis.sentiment && (
                  <>
                    <span aria-hidden="true">·</span>
                    <span className="text-emerald-700 font-medium">{analysis.sentiment}</span>
                  </>
                )}
              </div>

              {/* Title from URL */}
              <h3 className="text-sm sm:text-base font-bold text-slate-900 leading-snug">
                {analysis.originalTitle || analysis.topic || 'Konten Tautan Terbaca'}
              </h3>

              {/* Brief snippet of content fetched from the URL */}
              <div className="p-3.5 rounded-xl bg-white border border-slate-200 space-y-2">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-700 font-semibold flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-[#6322D8]" />
                    Cuplikan Konten yang Diambil (Fetched Snippet)
                  </span>
                  <button
                    type="button"
                    onClick={handleCopySnippet}
                    className="text-slate-500 hover:text-[#6322D8] flex items-center gap-1 transition-colors cursor-pointer font-medium"
                    title="Salin cuplikan teks"
                  >
                    {copiedSnippet ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-600" />
                        <span className="text-emerald-700">Tersalin</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        <span>Salin</span>
                      </>
                    )}
                  </button>
                </div>

                <p className="text-xs text-slate-700 leading-relaxed italic line-clamp-3 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                  "{displaySnippet}"
                </p>

                {analysis.contentReadSuccess === false ? (
                  <div className="flex items-start gap-1.5 text-[11px] text-amber-800 pt-0.5">
                    <AlertCircle className="w-3.5 h-3.5 text-amber-600 flex-shrink-0 mt-0.5" />
                    <span>
                      Halaman penuh tidak terbuka ke publik (privat/login-walled). AI memakai metadata tautan &amp; catatan Anda—tambahkan ringkasan atau caption di kolom Konteks agar komentar makin akurat.
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 text-[11px] text-emerald-700 pt-0.5">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                    <span>
                      Konfirmasi Visual: AI telah membaca cuplikan di atas dan menggunakannya untuk menghasilkan metanarasi.
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Key Points */}
          {analysis.keyPoints && analysis.keyPoints.length > 0 && (
            <div className="space-y-2 pt-2 border-t border-slate-200/80">
              <span className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                <ListChecks className="w-3.5 h-3.5 text-emerald-600" />
                Poin Fakta & Alur Konten yang Ditemukan AI
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {analysis.keyPoints.map((point, idx) => (
                  <div
                    key={idx}
                    className="text-xs p-2.5 rounded-lg bg-white border border-slate-200 text-slate-700 flex items-start gap-2"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-[#6322D8] mt-1.5 flex-shrink-0" />
                    <span>{point}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Content Highlights / Quotes */}
          {analysis.contentHighlights && analysis.contentHighlights.length > 0 && (
            <div className="space-y-1.5 pt-1">
              <span className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                <Quote className="w-3.5 h-3.5 text-[#FF9B00]" />
                Kutipan / Momen Menarik dari Konten
              </span>
              <div className="flex flex-col gap-1.5">
                {analysis.contentHighlights.map((hl, idx) => (
                  <p
                    key={idx}
                    className="text-xs italic text-amber-900 bg-amber-50 border border-amber-200 px-3 py-2 rounded-lg"
                  >
                    "{hl}"
                  </p>
                ))}
              </div>
            </div>
          )}

          {/* Potential Angles Suggestions */}
          {analysis.potentialAngles && analysis.potentialAngles.length > 0 && (
            <div className="space-y-2 pt-2 border-t border-slate-200/80">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <span className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5 text-[#EE2A8E]" />
                  Saran Sudut Pandang (Angle) Komentar Netizen
                </span>
                <span className="text-[11px] text-slate-500">
                  Klik untuk menyematkan ke konteks
                </span>
              </div>
              <div className="flex items-center gap-1.5 flex-wrap">
                {analysis.potentialAngles.map((angle, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleAddAngleToContext(angle)}
                    title="Klik untuk menambahkan sudut pandang ini ke konteks"
                    className="text-xs px-2.5 py-1 rounded-lg bg-white hover:bg-[#F4EFFD] hover:border-[#CBB4F8] hover:text-[#6322D8] border border-slate-200 text-slate-700 font-medium transition-all cursor-pointer flex items-center gap-1"
                  >
                    <span>+</span>
                    <span>{angle}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Context / Caption / Brief field */}
      <div className="space-y-1.5 pt-1">
        <div className="flex items-center justify-between">
          <label
            htmlFor="input-context"
            className="text-xs font-semibold text-slate-700 flex items-center gap-1.5"
          >
            <FileText className="w-3.5 h-3.5 text-[#6322D8]" />
            Konteks Konten / Catatan Khusus
            <span className="text-[11px] text-slate-400 font-normal">
              (Otomatis terisi saat URL dibaca)
            </span>
          </label>
          <span className="text-[11px] text-slate-500 font-mono tabular-nums">
            {context.length} karakter
          </span>
        </div>

        <textarea
          id="input-context"
          rows={3}
          value={context}
          onChange={(e) => setContext(e.target.value)}
          placeholder="Hasil bacaan URL, caption postingan, transkrip, poin pembahasan, atau arahan khusus..."
          className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-[#6322D8] focus:ring-2 focus:ring-[#6322D8]/15 focus:outline-none text-slate-900 placeholder-slate-400 text-xs sm:text-sm transition-all resize-y leading-relaxed"
        />
        <div className="flex items-center justify-between text-[11px] text-slate-500">
          <span className="flex items-center gap-1">
            <Info className="w-3 h-3 text-slate-400" />
            Semakin mendalam konteksnya, AI dapat merespons video/konten dengan sangat natural ala netizen asli.
          </span>
          {context && (
            <button
              type="button"
              onClick={() => setContext('')}
              className="text-slate-500 hover:text-rose-600 transition-colors cursor-pointer font-medium"
            >
              Bersihkan
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
