import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { GoogleGenAI, Type, ThinkingLevel } from '@google/genai';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '10mb' }));

// Initialize Gemini Client
function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// Helper: Calculate text similarity (Jaccard similarity on 2-grams / words)
function calculateSimilarity(textA: string, textB: string): number {
  const cleanA = textA.toLowerCase().replace(/[^\w\s]/g, '').trim();
  const cleanB = textB.toLowerCase().replace(/[^\w\s]/g, '').trim();
  if (cleanA === cleanB) return 1.0;

  const wordsA = new Set(cleanA.split(/\s+/).filter(Boolean));
  const wordsB = new Set(cleanB.split(/\s+/).filter(Boolean));
  if (wordsA.size === 0 || wordsB.size === 0) return 0;

  let intersection = 0;
  for (const w of wordsA) {
    if (wordsB.has(w)) intersection++;
  }
  const union = wordsA.size + wordsB.size - intersection;
  return intersection / union;
}

// Server Quality Control: duplicate and near-duplicate detection
function runQualityCheck(comments: Array<{ id: string; no: number; text: string; angle: string; persona?: string; lengthCategory: string; status: string }>, threshold = 0.65) {
  const checked = comments.map(c => ({
    ...c,
    isDuplicate: false,
    duplicateReason: undefined as string | undefined,
  }));

  for (let i = 0; i < checked.length; i++) {
    for (let j = i + 1; j < checked.length; j++) {
      const a = checked[i];
      const b = checked[j];
      const sim = calculateSimilarity(a.text, b.text);

      // Check same opening (first 3 words)
      const wordsA = a.text.toLowerCase().split(/\s+/).slice(0, 3).join(' ');
      const wordsB = b.text.toLowerCase().split(/\s+/).slice(0, 3).join(' ');
      const sameOpening = wordsA.length > 5 && wordsA === wordsB;

      if (sim >= threshold || sameOpening) {
        checked[j].isDuplicate = true;
        checked[j].duplicateReason = sameOpening
          ? `Pembuka kalimat mirip dengan #${a.no}`
          : `Kemiripan makna ${(sim * 100).toFixed(0)}% dengan #${a.no}`;
      }
    }
  }

  const duplicates = checked.filter(c => c.isDuplicate).length;
  const unique = checked.length - duplicates;

  return {
    comments: checked,
    stats: {
      total: checked.length,
      unique,
      duplicates,
    },
  };
}

// Platform-specific styling guidelines for AI Prompt
const PLATFORM_GUIDELINES: Record<string, string> = {
  instagram: `Instagram: Casual, conversational, ringkas, natural, emoji moderat (1-2 wajar), gaya audiens feed/reels/carousel. Hindari bahasa kaku.`,
  facebook: `Facebook: Conversational, sedikit lebih informatif, gaya bahasa komunitas/keluarga, sopan tapi akrab, natural.`,
  threads: `Threads: Spontan, opinion-based, conversational, humor ringan, netizen banter yang santai, gaya percakapan langsung antar user.`,
  whatsapp: `WhatsApp: Seperti chat sehari-hari dengan kawan, sangat conversational, pendek, santai, natural, gunakan panggilan santai.`,
  x: `X (Twitter): Singkat, punchy, ceplas-ceplos natural, slang relevan, hindari kalimat panjang berbelit, gaya kultwit/reply netizen.`,
  youtube: `YouTube: Seperti komentar penonton video, merespons timestamp/informasi/storytelling/opini kreator, variasikan panjang komentar.`,
  tiktok: `TikTok: Sangat casual, spontan, netizen slang, ekspresi populer wajar (wkwk, bjir, relate, valid, spill), cocok untuk komentar singkat dan to-the-point.`,
  linkedin: `LinkedIn: Profesional namun tetap hangat dan humanis, fokus memberi insight konstruktif, refleksi pengalaman kerja/industri, apresiasi poin kunci tanpa terdengar kaku seperti robot.`,
  shopee: `Shopee: Gaya bahasa pembeli/penonton Indonesia yang antusias, ramah, dan natural (cocok untuk Shopee Video, Live, maupun ulasan/pertanyaan produk). PENTING: Jangan mengarang klaim pengiriman/pembelian fiktif yang tidak ada dalam brief/konteks!`,
  google_review: `Google Review: Natural, believable, berbasis pengalaman nyata. PENTING: Jangan membuat klaim spesifik atau mengarang pengalaman fiktif yang tidak diberikan user dalam input!`,
};

// Task-specific instructions
const TASK_GUIDELINES: Record<string, string> = {
  posting: `Task: Posting Feed/Konten. Buat metanarasi/caption/komentar utama yang memicu diskusi dan keterlibatan audiens.`,
  komentar: `Task: Komentar. Buat variasi komentar netizen yang natural, interaktif, relevan langsung dengan konteks konten, dan siap ditempelkan ke kolom komentar.`,
  like: `Task: Like / Reaction. Buat copy pendukung singkat bernada apresiasi/afirmasi cepat yang cocok mendampingi interaksi like.`,
  dislike: `Task: Dislike / Tanggapan Kritis. Buat copy komentar ketidaksetujuan, koreksi, atau masukan kritis yang tetap sopan, logis, objektif, dan natural ala netizen Indonesia (hindari ujaran kebencian, fitnah, atau kata kasar).`,
  share: `Task: Share / Rekomendasi Bagikan. Buat copy pengantar yang cocok saat membagikan link ke teman, WhatsApp group, atau story ("Btw ini relate banget...", "Wajib nonton sih yang ini").`,
  repost: `Task: Repost. Buat copy quote/repost yang memberikan sudut pandang atau highlight menarik dari konten aslinya.`,
  save: `Task: Save / Bookmark. Buat copy tipe pengingat/penyimpan referensi ("Bookmark dulu buat diterapin nanti", "Catet buat referensi").`,
  report_komentar: `Task: Report Komentar. BANTUAN DRAFT: Buat deskripsi laporan yang faktual, objektif, dan berbasis bukti pelanggaran kebijakan komunitas (misal: spam, ujaran kebencian, penipuan). Bukan bot report otomatis.`,
  report_akun: `Task: Report Akun. BANTUAN DRAFT: Buat formulasi deskripsi pelaporan akun yang faktual, objektif, dan terstruktur berdasarkan pelanggaran pedoman komunitas (misal: penipuan, impersonation, spam terkoordinasi, atau ujaran kebencian). Bukan bot report otomatis.`,
  report_issue: `Task: Report Issue / Masalah. BANTUAN DRAFT: Buat formulasi laporan masalah teknis/isu konten yang jelas, terstruktur, dan objektif.`,
  follow: `Task: Follow. Buat komentar engagement salam kenal / follow-up yang natural menandakan user tertarik mengikuti update konten akun tersebut.`,
  subscribe: `Task: Subscribe. Buat komentar apresiasi dan dukungan bagi channel/kreator untuk terus berkarya ("Ditunggu part selanjutnya bang!", "Langsung nyalain lonceng").`,
};

// Helper to decode HTML entities from scraped metadata/paragraphs
function decodeHtmlEntities(input: string): string {
  if (!input) return '';
  return input
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#0*39;|&apos;/gi, "'")
    .replace(/&nbsp;/gi, ' ')
    .replace(/&#(\d+);/g, (_, dec) => {
      const code = Number(dec);
      return Number.isFinite(code) ? String.fromCharCode(code) : _;
    })
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) => {
      const code = parseInt(hex, 16);
      return Number.isFinite(code) ? String.fromCharCode(code) : _;
    })
    .replace(/\s+/g, ' ')
    .trim();
}

let lastAiGenerationError: string | null = null;

// Helper to generate content safely with model fallback
async function safeGenerateContent(ai: any, contents: string, schema: any) {
  const models = ['gemini-4-hydrogen', 'gemini-3.1-flash-lite'];
  lastAiGenerationError = null;
  for (const model of models) {
    try {
      const config: Record<string, any> = {
        responseMimeType: 'application/json',
        responseSchema: schema,
      };
      if (model === 'gemini-4-hydrogen') {
        config.thinkingConfig = { thinkingLevel: ThinkingLevel.LOW };
      }
      const response: any = await Promise.race([
        ai.models.generateContent({
          model,
          contents,
          config,
        }),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error(`${model} timeout after 25s`)), 25000)
        ),
      ]);
      const rawText = response?.text?.trim();
      if (rawText) {
        const cleaned = rawText
          .replace(/^```json\s*/i, '')
          .replace(/^```\s*/i, '')
          .replace(/```\s*$/i, '')
          .trim();
        return JSON.parse(cleaned);
      }
    } catch (err: any) {
      const msg = err?.message || String(err);
      lastAiGenerationError = `${model}: ${msg}`;
      console.warn(`Model ${model} unavailable or error:`, msg);
    }
  }
  return null;
}

interface ExtractedContent {
  resolvedUrl?: string;
  title?: string;
  author?: string;
  handle?: string;
  description?: string;
  transcriptSnippet?: string;
  rawTextSnippet?: string;
  aiUrlContextReading?: string;
  keywords?: string[];
  thumbnailUrl?: string;
  mediaType: 'video' | 'post' | 'article' | 'review';
  videoId?: string;
  embedUrl?: string;
  viewCount?: string;
  duration?: string;
  domain?: string;
  faviconUrl?: string;
  snippet?: string;
}

function detectPlatformFromHost(urlStr: string): string {
  try {
    const parsed = new URL(urlStr.startsWith('http') ? urlStr : `https://${urlStr}`);
    const host = parsed.hostname.toLowerCase();
    if (host.includes('instagram.com') || host.includes('instagr.am')) return 'instagram';
    if (host.includes('facebook.com') || host.includes('fb.watch') || host.includes('fb.me') || host.includes('fb.com')) return 'facebook';
    if (host.includes('threads.net') || host.includes('threads.com')) return 'threads';
    if (host.includes('wa.me') || host.includes('whatsapp.com')) return 'whatsapp';
    if (host.includes('twitter.com') || host.includes('x.com') || host === 't.co') return 'x';
    if (host.includes('youtube.com') || host.includes('youtu.be')) return 'youtube';
    if (host.includes('tiktok.com')) return 'tiktok';
    if (host.includes('linkedin.com') || host === 'lnkd.in') return 'linkedin';
    if (host.includes('shopee.') || host.includes('shp.ee')) return 'shopee';
    if (host.includes('maps.google') || host.includes('goo.gl') || host.includes('maps.app.goo.gl')) return 'google_review';
  } catch {
    // ignore
  }
  return 'web';
}

// Extract <meta> tag content regardless of attribute ordering (property/name before or after content)
function extractMetaTag(html: string, key: string): string | undefined {
  const escaped = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const patternA = new RegExp(`<meta[^>]+(?:property|name)=["']${escaped}["'][^>]+content=["']([^"']+)["']`, 'i');
  const patternB = new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["']${escaped}["']`, 'i');
  const match = html.match(patternA) || html.match(patternB);
  return match ? decodeHtmlEntities(match[1]) : undefined;
}

// Extract structured JSON-LD metadata from news/article/video pages
function extractJsonLd(html: string): { headline?: string; description?: string; articleBody?: string; author?: string } {
  const out: { headline?: string; description?: string; articleBody?: string; author?: string } = {};
  const matches = [...html.matchAll(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)];
  for (const m of matches) {
    try {
      const raw = JSON.parse(m[1].trim());
      const items = Array.isArray(raw) ? raw : raw['@graph'] && Array.isArray(raw['@graph']) ? raw['@graph'] : [raw];
      for (const item of items) {
        if (!item || typeof item !== 'object') continue;
        if (item.headline && !out.headline) out.headline = decodeHtmlEntities(String(item.headline));
        if (item.name && !out.headline && (item['@type'] === 'Article' || item['@type'] === 'NewsArticle' || item['@type'] === 'VideoObject')) {
          out.headline = decodeHtmlEntities(String(item.name));
        }
        if (item.description && !out.description) out.description = decodeHtmlEntities(String(item.description));
        if (item.articleBody && !out.articleBody) out.articleBody = decodeHtmlEntities(String(item.articleBody));
        if (item.author && !out.author) {
          const auth = Array.isArray(item.author) ? item.author[0] : item.author;
          if (typeof auth === 'string') out.author = decodeHtmlEntities(auth);
          else if (auth?.name) out.author = decodeHtmlEntities(String(auth.name));
        }
      }
    } catch {
      // Ignore malformed JSON-LD blocks
    }
  }
  return out;
}

// Resolve shortlinks/redirects (vt.tiktok.com, t.co, bit.ly, fb.watch, maps.app.goo.gl, etc.)
async function resolveCanonicalUrl(urlStr: string): Promise<string> {
  const normalized = urlStr.startsWith('http') ? urlStr : `https://${urlStr}`;
  try {
    const host = new URL(normalized).hostname.toLowerCase();
    const isShortener =
      host.includes('vt.tiktok.com') ||
      host.includes('vm.tiktok.com') ||
      host === 't.co' ||
      host.includes('fb.watch') ||
      host.includes('fb.me') ||
      host.includes('goo.gl') ||
      host.includes('bit.ly') ||
      host.includes('s.id') ||
      host.includes('tinyurl.com') ||
      host.includes('lnkd.in') ||
      host.includes('shp.ee') ||
      host.includes('s.shopee.') ||
      host.includes('instagr.am');

    if (!isShortener) return normalized;

    const res = await fetch(normalized, {
      method: 'GET',
      redirect: 'follow',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
      },
      signal: AbortSignal.timeout(4000),
    });
    return res.url || normalized;
  } catch {
    return normalized;
  }
}

// Fetch YouTube spoken captions/transcript if available
async function fetchYouTubeTranscript(player: any): Promise<string | undefined> {
  try {
    const tracks = player?.captions?.playerCaptionsTracklistRenderer?.captionTracks;
    if (!Array.isArray(tracks) || tracks.length === 0) return undefined;

    // Prefer Indonesian -> English -> first available track
    const chosen =
      tracks.find((t: any) => t.languageCode === 'id' || t.languageCode?.startsWith('id')) ||
      tracks.find((t: any) => t.languageCode === 'en' || t.languageCode?.startsWith('en')) ||
      tracks[0];

    if (!chosen?.baseUrl) return undefined;

    const captionUrl = chosen.baseUrl.includes('fmt=') ? chosen.baseUrl : `${chosen.baseUrl}&fmt=json3`;
    const capRes = await fetch(captionUrl, { signal: AbortSignal.timeout(3500) });
    if (!capRes.ok) return undefined;

    const body = await capRes.text();
    if (body.trim().startsWith('{')) {
      const json = JSON.parse(body);
      const lines: string[] = [];
      for (const ev of json.events || []) {
        if (Array.isArray(ev.segs)) {
          const text = ev.segs.map((s: any) => s.utf8 || '').join('').trim();
          if (text && text !== '\n') lines.push(text.replace(/\s+/g, ' '));
        }
      }
      const combined = decodeHtmlEntities(lines.join(' '));
      return combined ? combined.slice(0, 3500) : undefined;
    }

    // Fallback XML captions
    const xmlTexts = [...body.matchAll(/<text[^>]*>([\s\S]*?)<\/text>/gi)]
      .map((m) => decodeHtmlEntities(m[1]))
      .filter(Boolean);
    const combined = xmlTexts.join(' ');
    return combined ? combined.slice(0, 3500) : undefined;
  } catch {
    return undefined;
  }
}

// Deep content reader & watcher across YouTube, TikTok, Instagram, X, Threads, Facebook, & Web
async function fetchDeepUrlContent(rawUrl: string, initialPlatform: string): Promise<ExtractedContent> {
  const canonicalUrl = await resolveCanonicalUrl(rawUrl);
  const platform = detectPlatformFromHost(canonicalUrl) || initialPlatform;

  const result: ExtractedContent = {
    resolvedUrl: canonicalUrl,
    mediaType: platform === 'youtube' || platform === 'tiktok' ? 'video' : 'post',
    keywords: [],
  };

  try {
    const parsed = new URL(canonicalUrl);
    const pathname = parsed.pathname;
    result.domain = parsed.hostname.replace(/^www\./, '');
    result.faviconUrl = `https://www.google.com/s2/favicons?domain=${encodeURIComponent(parsed.hostname)}&sz=128`;

    // 1. YouTube Deep Watcher & Transcript Extractor
    if (platform === 'youtube') {
      result.mediaType = 'video';
      let videoId = '';
      if (pathname.includes('/watch')) {
        videoId = parsed.searchParams.get('v') || '';
      } else if (parsed.hostname.includes('youtu.be')) {
        videoId = pathname.replace(/^\//, '').split('/')[0];
      } else if (pathname.includes('/shorts/')) {
        const shortsMatch = pathname.match(/\/shorts\/([a-zA-Z0-9_-]{11})/);
        if (shortsMatch) videoId = shortsMatch[1];
      } else if (pathname.includes('/embed/')) {
        const embedMatch = pathname.match(/\/embed\/([a-zA-Z0-9_-]{11})/);
        if (embedMatch) videoId = embedMatch[1];
      } else if (pathname.includes('/live/')) {
        const liveMatch = pathname.match(/\/live\/([a-zA-Z0-9_-]{11})/);
        if (liveMatch) videoId = liveMatch[1];
      }

      if (videoId) {
        result.videoId = videoId;
        result.thumbnailUrl = `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
        result.embedUrl = `https://www.youtube.com/embed/${videoId}`;
      }

      try {
        const oembedRes = await fetch(`https://www.youtube.com/oembed?url=${encodeURIComponent(canonicalUrl)}&format=json`, {
          signal: AbortSignal.timeout(4000),
        });
        if (oembedRes.ok) {
          const oembedData: any = await oembedRes.json();
          if (oembedData.title) result.title = decodeHtmlEntities(oembedData.title);
          if (oembedData.author_name) result.author = decodeHtmlEntities(oembedData.author_name);
        }
      } catch {
        // oEmbed fallback
      }

      if (videoId) {
        try {
          const ytRes = await fetch(`https://www.youtube.com/watch?v=${videoId}`, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
              'Accept-Language': 'id,en-US;q=0.9,en;q=0.8',
            },
            signal: AbortSignal.timeout(4500),
          });
          if (ytRes.ok) {
            const html = await ytRes.text();
            const playerMatch =
              html.match(/ytInitialPlayerResponse\s*=\s*(\{[\s\S]*?\});\s*(?:var\s|<\/script>)/) ||
              html.match(/ytInitialPlayerResponse\s*=\s*({.+?});/);
            if (playerMatch) {
              const player = JSON.parse(playerMatch[1]);
              const details = player?.videoDetails;
              if (details) {
                if (details.title && !result.title) result.title = decodeHtmlEntities(details.title);
                if (details.author && !result.author) result.author = decodeHtmlEntities(details.author);
                if (details.shortDescription) {
                  const cleanDesc = decodeHtmlEntities(details.shortDescription);
                  result.description = cleanDesc.slice(0, 1800);
                }
                if (Array.isArray(details.keywords)) {
                  result.keywords = details.keywords.slice(0, 12);
                }
                if (details.viewCount) result.viewCount = details.viewCount;
                if (details.lengthSeconds) {
                  const sec = parseInt(details.lengthSeconds, 10);
                  result.duration = `${Math.floor(sec / 60)}:${(sec % 60).toString().padStart(2, '0')}`;
                }
              }
              const transcript = await fetchYouTubeTranscript(player);
              if (transcript) {
                result.transcriptSnippet = transcript;
              }
            }
          }
        } catch {
          // Page fetch fallback
        }
      }

      const parts: string[] = [];
      if (result.description) parts.push(`Deskripsi Video: ${result.description}`);
      if (result.transcriptSnippet) parts.push(`Transkrip Ucapan Video: ${result.transcriptSnippet}`);
      if (parts.length > 0) {
        result.rawTextSnippet = parts.join('\n\n').slice(0, 4500);
      }
      return result;
    }

    // 2. TikTok Deep Extractor (oEmbed + HTML fallback)
    if (platform === 'tiktok') {
      result.mediaType = 'video';
      const tiktokUserMatch = pathname.match(/@([a-zA-Z0-9._]+)/);
      if (tiktokUserMatch) result.handle = `@${tiktokUserMatch[1]}`;

      try {
        const oembedRes = await fetch(`https://www.tiktok.com/oembed?url=${encodeURIComponent(canonicalUrl)}`, {
          signal: AbortSignal.timeout(4500),
        });
        if (oembedRes.ok) {
          const data: any = await oembedRes.json();
          if (data.title) {
            result.title = decodeHtmlEntities(data.title);
            result.rawTextSnippet = decodeHtmlEntities(data.title);
            result.description = decodeHtmlEntities(data.title);
          }
          if (data.author_name) result.author = decodeHtmlEntities(data.author_name);
          if (data.thumbnail_url) result.thumbnailUrl = data.thumbnail_url;
        }
      } catch {
        // oEmbed fallback
      }

      if (!result.rawTextSnippet) {
        try {
          const ttRes = await fetch(canonicalUrl, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
              'Accept-Language': 'id,en-US;q=0.9',
            },
            signal: AbortSignal.timeout(4000),
          });
          if (ttRes.ok) {
            const html = await ttRes.text();
            const ogTitle = extractMetaTag(html, 'og:title') || extractMetaTag(html, 'twitter:title');
            const ogDesc = extractMetaTag(html, 'og:description') || extractMetaTag(html, 'description');
            const ogImg = extractMetaTag(html, 'og:image');
            if (ogTitle && !ogTitle.toLowerCase().includes('tiktok - make your day')) result.title = ogTitle;
            if (ogImg) result.thumbnailUrl = ogImg;
            if (ogDesc && !ogDesc.toLowerCase().includes('trends start here')) {
              result.description = ogDesc;
              result.rawTextSnippet = ogDesc;
            }
          }
        } catch {
          // ignore
        }
      }
      return result;
    }

    // 3. Instagram Deep Extractor
    if (platform === 'instagram') {
      const igUserMatch = pathname.match(/^\/([a-zA-Z0-9._]+)(?:\/reel|\/p|\/|$)/);
      if (igUserMatch && !['p', 'reel', 'reels', 'explore', 'stories'].includes(igUserMatch[1])) {
        result.handle = `@${igUserMatch[1]}`;
      }
      const isReel = pathname.includes('/reel');
      result.mediaType = isReel ? 'video' : 'post';

      const shortcodeMatch = pathname.match(/\/(?:p|reel|reels)\/([a-zA-Z0-9_-]+)/);
      if (shortcodeMatch) {
        result.embedUrl = `https://www.instagram.com/${isReel ? 'reel' : 'p'}/${shortcodeMatch[1]}/embed`;
      }

      try {
        const igRes = await fetch(canonicalUrl, {
          headers: {
            'User-Agent': 'facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)',
            'Accept': 'text/html,application/xhtml+xml',
          },
          signal: AbortSignal.timeout(4500),
        });
        if (igRes.ok) {
          const html = await igRes.text();
          const ogTitle = extractMetaTag(html, 'og:title') || extractMetaTag(html, 'twitter:title');
          const ogDesc = extractMetaTag(html, 'og:description') || extractMetaTag(html, 'description');
          const ogImg = extractMetaTag(html, 'og:image');

          if (ogTitle && !/^instagram$/i.test(ogTitle)) result.title = ogTitle;
          if (ogImg) result.thumbnailUrl = ogImg;
          if (ogDesc) {
            result.description = ogDesc;
            result.rawTextSnippet = ogDesc;
            const captionMatch = ogDesc.match(/:\s*["“]([\s\S]+?)["”]$/);
            if (captionMatch) {
              result.rawTextSnippet = captionMatch[1];
            }
          }
        }
      } catch {
        // Continue
      }
      return result;
    }

    // 4. X (Twitter) Deep Extractor (oEmbed + Syndication API fallback)
    if (platform === 'x') {
      result.mediaType = 'post';
      const xMatch = pathname.match(/^\/([a-zA-Z0-9_]+)(?:\/status|\/|$)/);
      if (xMatch && !['explore', 'home', 'notifications', 'messages', 'i'].includes(xMatch[1])) {
        result.handle = `@${xMatch[1]}`;
      }

      try {
        const tweetUrl = canonicalUrl.replace('x.com', 'twitter.com');
        const oembedRes = await fetch(`https://publish.twitter.com/oembed?url=${encodeURIComponent(tweetUrl)}`, {
          signal: AbortSignal.timeout(4000),
        });
        if (oembedRes.ok) {
          const data: any = await oembedRes.json();
          if (data.author_name) result.author = decodeHtmlEntities(data.author_name);
          if (data.html) {
            const cleanText = decodeHtmlEntities(
              data.html.replace(/<br\s*\/?>/gi, '\n').replace(/<[^>]+>/g, ' ')
            );
            result.title = cleanText.slice(0, 140);
            result.rawTextSnippet = cleanText;
            result.description = cleanText;
          }
        }
      } catch {
        // oEmbed fallback
      }

      if (!result.rawTextSnippet) {
        const statusIdMatch = pathname.match(/\/status\/(\d+)/);
        if (statusIdMatch) {
          try {
            const synRes = await fetch(
              `https://cdn.syndication.twimg.com/tweet-result?id=${statusIdMatch[1]}&token=a`,
              { signal: AbortSignal.timeout(4000) }
            );
            if (synRes.ok) {
              const synData: any = await synRes.json();
              if (synData?.text) {
                const tweetText = decodeHtmlEntities(synData.text);
                result.rawTextSnippet = tweetText;
                result.description = tweetText;
                result.title = tweetText.slice(0, 140);
              }
              if (synData?.user?.name) result.author = decodeHtmlEntities(synData.user.name);
              if (synData?.user?.screen_name) result.handle = `@${synData.user.screen_name}`;
              if (synData?.photos?.[0]?.url) result.thumbnailUrl = synData.photos[0].url;
            }
          } catch {
            // Syndication fallback
          }
        }
      }
      return result;
    }

    // 5. Threads & Facebook Deep Extractor
    if (platform === 'threads' || platform === 'facebook') {
      result.mediaType = canonicalUrl.includes('/reel') || canonicalUrl.includes('/watch') ? 'video' : 'post';
      const threadsMatch = pathname.match(/@([a-zA-Z0-9._]+)/);
      if (threadsMatch) result.handle = `@${threadsMatch[1]}`;

      try {
        const res = await fetch(canonicalUrl, {
          headers: {
            'User-Agent': 'facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)',
            'Accept': 'text/html,application/xhtml+xml',
          },
          signal: AbortSignal.timeout(4500),
        });
        if (res.ok) {
          const html = await res.text();
          const ogTitle = extractMetaTag(html, 'og:title') || extractMetaTag(html, 'twitter:title');
          const ogDesc = extractMetaTag(html, 'og:description') || extractMetaTag(html, 'description');
          const ogImg = extractMetaTag(html, 'og:image');
          if (ogTitle) result.title = ogTitle;
          if (ogImg) result.thumbnailUrl = ogImg;
          if (ogDesc) {
            result.description = ogDesc;
            result.rawTextSnippet = ogDesc;
          }
        }
      } catch {
        // Continue
      }
      return result;
    }

    // 6. Generic Web Article, News, Blog, Marketplace, or Google Review
    result.mediaType = platform === 'google_review' ? 'review' : 'article';
    try {
      const pageRes = await fetch(canonicalUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'id,en-US;q=0.9,en;q=0.8',
        },
        signal: AbortSignal.timeout(5000),
      });

      if (pageRes.ok) {
        const html = await pageRes.text();
        const titleTagMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
        const ogTitle = extractMetaTag(html, 'og:title') || extractMetaTag(html, 'twitter:title');
        const ogDesc = extractMetaTag(html, 'og:description') || extractMetaTag(html, 'twitter:description');
        const metaDesc = extractMetaTag(html, 'description');
        const ogImg = extractMetaTag(html, 'og:image') || extractMetaTag(html, 'twitter:image');
        const siteName = extractMetaTag(html, 'og:site_name');
        const metaAuthor = extractMetaTag(html, 'author');
        const jsonLd = extractJsonLd(html);

        result.title = ogTitle || jsonLd.headline || (titleTagMatch ? decodeHtmlEntities(titleTagMatch[1]) : undefined);
        result.description = ogDesc || jsonLd.description || metaDesc;
        result.author = jsonLd.author || metaAuthor || siteName;
        if (ogImg) result.thumbnailUrl = ogImg;

        const cleanArticleHtml = html
          .replace(/<script[\s\S]*?<\/script>/gi, ' ')
          .replace(/<style[\s\S]*?<\/style>/gi, ' ')
          .replace(/<noscript[\s\S]*?<\/noscript>/gi, ' ');

        const articleScope = cleanArticleHtml.match(/<article[^>]*>([\s\S]*?)<\/article>/i)?.[1] || cleanArticleHtml;
        const headingMatches = [...articleScope.matchAll(/<h[1-3][^>]*>([\s\S]*?)<\/h[1-3]>/gi)]
          .map((m) => decodeHtmlEntities(m[1].replace(/<[^>]+>/g, ' ')))
          .filter((t) => t.length > 10)
          .slice(0, 5);
        const pMatches = [...articleScope.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/gi)]
          .map((m) => decodeHtmlEntities(m[1].replace(/<[^>]+>/g, ' ')))
          .filter((t) => t.length > 25);

        const bodyParts: string[] = [];
        if (jsonLd.articleBody) bodyParts.push(jsonLd.articleBody.slice(0, 2500));
        else if (pMatches.length > 0) bodyParts.push(pMatches.slice(0, 12).join('\n\n'));
        if (headingMatches.length > 0 && bodyParts.length > 0) {
          bodyParts.unshift(`Subjudul: ${headingMatches.join(' | ')}`);
        }

        if (bodyParts.length > 0) {
          result.rawTextSnippet = bodyParts.join('\n\n').slice(0, 4000);
        } else if (result.description) {
          result.rawTextSnippet = result.description;
        }
      }
    } catch {
      // Continue
    }
  } catch {
    // URL parsing error
  }

  return result;
}

// Use Gemini's built-in urlContext tool to directly read live URLs when scraping is incomplete
async function fetchGeminiUrlContext(ai: any, targetUrl: string): Promise<string | undefined> {
  try {
    const prompt = `Akses dan baca isi faktual dari tautan berikut: ${targetUrl}

Tuliskan secara ringkas dan akurat dalam Bahasa Indonesia (hanya berdasarkan isi halaman yang benar-benar berhasil diakses, jangan mengarang):
1. Judul / Topik Utama
2. Kreator / Penulis / Media / Brand
3. Ringkasan isi lengkap, poin-poin pembahasan, angka/fakta kunci, dan kutipan penting.
Jika halaman tidak dapat diakses atau tidak ditemukan, jawab persis: "URL_UNAVAILABLE".`;

    const response: any = await Promise.race([
      ai.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents: prompt,
        config: {
          tools: [{ urlContext: {} }],
        },
      }),
      new Promise((_, reject) => setTimeout(() => reject(new Error('urlContext timeout')), 7500)),
    ]);

    const urlMeta = response?.candidates?.[0]?.urlContextMetadata?.urlMetadata;
    if (Array.isArray(urlMeta) && urlMeta.length > 0) {
      const hasFailedOnly = urlMeta.every(
        (m: any) => m.urlRetrievalStatus && m.urlRetrievalStatus !== 'URL_RETRIEVAL_STATUS_SUCCESS'
      );
      if (hasFailedOnly) return undefined;
    }

    const text = response?.text?.trim();
    if (!text || text.includes('URL_UNAVAILABLE')) return undefined;
    return text.slice(0, 3000);
  } catch (err: any) {
    console.warn('Gemini urlContext skipped:', err?.message || err);
    return undefined;
  }
}

// Unified deep URL analyzer used by both /api/analyze-url and /api/generate-metanarasi
async function analyzeUrlDeeply(rawUrl: string, userContext: string, ai: any) {
  const trimmedUrl = rawUrl.trim();
  const parsedUrl = new URL(trimmedUrl.startsWith('http') ? trimmedUrl : `https://${trimmedUrl}`);
  const initialPlatform = detectPlatformFromHost(parsedUrl.href);

  const content = await fetchDeepUrlContent(parsedUrl.href, initialPlatform);
  const detectedPlatform = detectPlatformFromHost(content.resolvedUrl || parsedUrl.href) || initialPlatform;

  // Enrich via Gemini urlContext tool when direct scraping returned sparse content
  const scrapedLength = (content.rawTextSnippet || content.description || '').length;
  if (ai && scrapedLength < 250) {
    const aiReading = await fetchGeminiUrlContext(ai, content.resolvedUrl || parsedUrl.href);
    if (aiReading) {
      content.aiUrlContextReading = aiReading;
      content.rawTextSnippet = content.rawTextSnippet
        ? `${content.rawTextSnippet}\n\n[Pembacaan Langsung Halaman URL]:\n${aiReading}`.slice(0, 4500)
        : aiReading;
    }
  }

  const contentReadSuccess = Boolean(
    content.title || content.rawTextSnippet || content.description || content.aiUrlContextReading
  );

  if (ai) {
    const prompt = `Anda adalah analis konten multimedia dan pakar metanarasi media sosial Indonesia yang bertugas MEMBACA DAN MEMAHAMI ISI TAUTAN SECARA AKURAT.

Tautan Konten: ${trimmedUrl}
${content.resolvedUrl && content.resolvedUrl !== trimmedUrl ? `Tautan Tujuan: ${content.resolvedUrl}` : ''}
Platform: ${detectedPlatform.toUpperCase()}
Tipe Media: ${content.mediaType.toUpperCase()}
${content.author ? `Kreator / Pemilik / Media: ${content.author}` : ''}
${content.handle ? `Akun / Handle: ${content.handle}` : ''}
${content.title ? `Judul / Caption Asli: ${content.title}` : ''}
${content.duration ? `Durasi Video: ${content.duration}` : ''}
${content.viewCount ? `Jumlah Penayangan: ${content.viewCount}` : ''}
${content.keywords && content.keywords.length > 0 ? `Kata Kunci / Tags: ${content.keywords.join(', ')}` : ''}

ISI TEKS / TRANSKRIP / DESKRIPSI / KONTEN HALAMAN YANG BERHASIL DIEKSTRAK:
"""
${content.rawTextSnippet || content.description || 'Konten halaman tidak terbuka penuh (mungkin privat/login-walled). Gunakan informasi URL, metadata yang tersedia, serta catatan pengguna tanpa mengarang fakta palsu.'}
"""

Catatan Tambahan Pengguna: ${userContext || 'Tidak ada catatan manual'}

TUGAS ANDA:
1. Pahami secara mendalam dan faktual apa yang dibahas di dalam konten URL ini (subjek utama, alur, argumen, produk/merek, fakta kunci). JANGAN mengarang fakta yang tidak ada di sumber.
2. Tentukan nama brand, media, atau kreator secara akurat.
3. Buat ringkasan detail yang jelas agar generator komentar tahu persis topik yang sedang dibahas.
4. Identifikasi 3-5 poin fakta atau alur bahasan kunci (keyPoints).
5. Ambil 2-3 kutipan menarik / highlight kalimat / detail spesifik dari konten (contentHighlights).
6. Tentukan 5-6 sudut pandang (potentialAngles) komentar netizen Indonesia yang SANGAT RELEVAN dengan isi spesifik konten tersebut.
7. Buat teks 'suggestedContext' padat & informatif yang merangkum keseluruhan isi URL untuk langsung dipakai menghasilkan komentar yang tepat sasaran.

Format respon HARUS JSON dengan struktur:
- topic: topik utama konten (maks 10 kata, spesifik)
- brand: nama brand / kreator / channel
- sentiment: sentimen konten
- summary: ringkasan faktual isi konten (3-4 kalimat mendalam)
- keyPoints: array 3-5 poin fakta / alur kunci konten
- contentHighlights: array 2-3 kutipan atau detail spesifik dari konten
- potentialAngles: array 5-6 sudut pandang komentar netizen Indonesia yang spesifik
- suggestedContext: ringkasan konteks komprehensif dari URL ini`;

    const schema = {
      type: Type.OBJECT,
      properties: {
        topic: { type: Type.STRING },
        brand: { type: Type.STRING },
        sentiment: { type: Type.STRING },
        summary: { type: Type.STRING },
        keyPoints: { type: Type.ARRAY, items: { type: Type.STRING } },
        contentHighlights: { type: Type.ARRAY, items: { type: Type.STRING } },
        potentialAngles: { type: Type.ARRAY, items: { type: Type.STRING } },
        suggestedContext: { type: Type.STRING },
      },
      required: ['topic', 'brand', 'sentiment', 'summary', 'keyPoints', 'potentialAngles', 'suggestedContext'],
    };

    const parsed = await safeGenerateContent(ai, prompt, schema);
    if (parsed && parsed.topic) {
      const snippetText = (content.rawTextSnippet || content.description || parsed.summary || '').slice(0, 320);
      return {
        canAnalyze: true,
        detectedPlatform,
        analysis: {
          ...parsed,
          sourceUrl: trimmedUrl,
          contentReadSuccess,
          mediaType: content.mediaType,
          thumbnailUrl: content.thumbnailUrl,
          videoId: content.videoId,
          embedUrl: content.embedUrl,
          originalTitle: content.title,
          author: content.author || content.handle,
          keywords: content.keywords,
          rawTextSnippet: content.rawTextSnippet ? content.rawTextSnippet.slice(0, 1200) : undefined,
          domain: content.domain,
          faviconUrl: content.faviconUrl,
          snippet: snippetText,
        },
      };
    }
  }

  // Heuristic fallback when offline or Gemini unavailable
  const fallbackBrand = content.author || content.handle || 'Kreator Konten';
  const fallbackTopic =
    content.title ||
    (userContext
      ? 'Konten Berdasarkan Konteks Pengguna'
      : `Konten ${detectedPlatform.toUpperCase()} (${parsedUrl.pathname.split('/').filter(Boolean).slice(0, 2).join(' ') || 'Post'})`);
  const fallbackSummary =
    content.rawTextSnippet ||
    content.description ||
    userContext ||
    `Konten ${detectedPlatform.toUpperCase()} dari ${fallbackBrand}.`;
  const fallbackSnippet = (content.rawTextSnippet || content.description || fallbackSummary).slice(0, 320);

  return {
    canAnalyze: true,
    detectedPlatform,
    analysis: {
      sourceUrl: trimmedUrl,
      contentReadSuccess,
      topic: fallbackTopic.slice(0, 80),
      brand: fallbackBrand,
      sentiment: 'Positif & Diskusi Hangat',
      summary: fallbackSummary.slice(0, 350),
      keyPoints: [
        content.title ? `Judul: ${content.title}` : 'Konten media sosial sesuai tautan pengguna',
        'Alur bahasan relevan dengan percakapan warganet',
        'Siap direspon dengan variasi komentar casual, apresiasi, maupun pertanyaan',
      ],
      contentHighlights: content.title ? [content.title] : [],
      potentialAngles: ['Reaction', 'Curiosity', 'Appreciation', 'Relatable Experience', 'Humor ringan', 'Observation'],
      suggestedContext: `${fallbackTopic}. ${fallbackSummary.slice(0, 280)}`,
      mediaType: content.mediaType,
      thumbnailUrl: content.thumbnailUrl,
      videoId: content.videoId,
      embedUrl: content.embedUrl,
      originalTitle: content.title,
      author: fallbackBrand,
      rawTextSnippet: content.rawTextSnippet ? content.rawTextSnippet.slice(0, 1200) : undefined,
      domain: content.domain,
      faviconUrl: content.faviconUrl,
      snippet: fallbackSnippet,
    },
  };
}

function buildUrlContextEvidenceBlock(url: string, context: string, analyzedContent: any): string {
  const sections: string[] = [];
  if (url) sections.push(`- URL Target: ${url}`);
  if (analyzedContent) {
    if (analyzedContent.originalTitle) sections.push(`- Judul Asli Konten: ${analyzedContent.originalTitle}`);
    if (analyzedContent.brand || analyzedContent.author) {
      sections.push(`- Kreator / Brand / Media: ${analyzedContent.brand || analyzedContent.author}`);
    }
    if (analyzedContent.topic) sections.push(`- Topik Utama: ${analyzedContent.topic}`);
    if (analyzedContent.summary) sections.push(`- Ringkasan Isi URL: ${analyzedContent.summary}`);
    if (Array.isArray(analyzedContent.keyPoints) && analyzedContent.keyPoints.length > 0) {
      sections.push(`- Poin Fakta & Alur Konten:\n  * ${analyzedContent.keyPoints.join('\n  * ')}`);
    }
    if (Array.isArray(analyzedContent.contentHighlights) && analyzedContent.contentHighlights.length > 0) {
      sections.push(`- Kutipan / Momen Penting:\n  * ${analyzedContent.contentHighlights.join('\n  * ')}`);
    }
    if (analyzedContent.rawTextSnippet || analyzedContent.snippet) {
      sections.push(
        `- Cuplikan Teks / Transkrip dari URL:\n"""\n${(analyzedContent.rawTextSnippet || analyzedContent.snippet).slice(0, 1500)}\n"""`
      );
    }
  }
  if (context) sections.push(`- Konteks / Catatan Tambahan User: ${context}`);
  return sections.join('\n');
}

// Endpoint 1: Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    hasGeminiKey: Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'MY_GEMINI_API_KEY'),
  });
});

// Endpoint 2: Analyze URL
app.post('/api/analyze-url', async (req, res) => {
  try {
    const { url, context = '' } = req.body;

    if (!url || typeof url !== 'string' || !url.trim()) {
      return res.status(400).json({
        canAnalyze: false,
        error: 'URL tidak valid. Silakan masukkan URL media sosial atau halaman web yang benar.',
      });
    }

    const trimmedUrl = url.trim();
    try {
      new URL(trimmedUrl.startsWith('http') ? trimmedUrl : `https://${trimmedUrl}`);
    } catch {
      return res.status(400).json({
        canAnalyze: false,
        error: 'Format URL tidak valid. Contoh: https://instagram.com/p/... atau https://youtube.com/watch?v=...',
      });
    }

    const ai = getGeminiClient();
    const result = await analyzeUrlDeeply(trimmedUrl, String(context || ''), ai);
    return res.json(result);
  } catch (err: any) {
    console.error('URL analysis error:', err);
    return res.json({
      canAnalyze: false,
      message: 'URL belum dapat dibaca otomatis. Pastikan tautan dapat diakses publik atau tambahkan ringkasan konten di kolom Konteks.',
    });
  }
});

// Endpoint 3: Generate Metanarasi (Core Engine - Always Grounded in URL Context)
app.post('/api/generate-metanarasi', async (req, res) => {
  try {
    const {
      platform = 'instagram',
      task = 'posting',
      quantity = 10,
      url = '',
      context = '',
      clientBrief = '',
      tone = 'Casual',
      settings = {},
      analyzedContent = null,
    } = req.body;

    const count = Math.min(Math.max(Number(quantity) || 10, 1), 100);

    if (Number(quantity) > 100) {
      return res.status(400).json({
        error: 'Jumlah output terlalu besar untuk satu proses. Silakan pecah menjadi beberapa batch (maksimal 100 per proses).',
      });
    }

    const ai = getGeminiClient();
    const trimmedUrl = typeof url === 'string' ? url.trim() : '';

    // Automatically read and analyze the URL if provided and not yet analyzed for this exact URL
    let resolvedAnalysis = analyzedContent;
    if (trimmedUrl) {
      const needsFreshRead =
        !resolvedAnalysis ||
        (resolvedAnalysis.sourceUrl && resolvedAnalysis.sourceUrl !== trimmedUrl) ||
        (!resolvedAnalysis.rawTextSnippet && !resolvedAnalysis.summary && !resolvedAnalysis.originalTitle);

      if (needsFreshRead) {
        try {
          new URL(trimmedUrl.startsWith('http') ? trimmedUrl : `https://${trimmedUrl}`);
          const deepRes = await analyzeUrlDeeply(trimmedUrl, String(context || ''), ai);
          if (deepRes?.canAnalyze && deepRes.analysis) {
            resolvedAnalysis = deepRes.analysis;
          }
        } catch {
          // Invalid URL format; proceed with user context/brief
        }
      }
    }

    const effectiveContext =
      String(context || '').trim() ||
      resolvedAnalysis?.suggestedContext ||
      resolvedAnalysis?.summary ||
      '';

    const platformRule = PLATFORM_GUIDELINES[platform] || PLATFORM_GUIDELINES.instagram;
    const taskRule = TASK_GUIDELINES[task] || TASK_GUIDELINES.posting;

    const emojiFreq = settings.emojiFrequency || 'MEDIUM';
    const slangIntensity = settings.slangIntensity || 'NATURAL';

    const urlEvidenceBlock = buildUrlContextEvidenceBlock(trimmedUrl, effectiveContext, resolvedAnalysis);

    const systemPrompt = `Anda adalah "Yudha Kurasi Agent Metanarasi Generator", AI spesialis pembuat metanarasi, komentar, dan engagement copy media sosial dengan gaya bahasa NETIZEN INDONESIA ASLI (bukan terjemahan dan bukan gaya bot kaku).

ATURAN WAJIB KETERIKATAN KONTEKS URL (STRICT RELEVANCE):
- Setiap komentar WAJIB merujuk atau merespons secara natural isi spesifik dari URL/konten yang diberikan (topik, nama kreator/brand/produk, kejadian, kutipan, tips, isu, atau momen tertentu dari ringkasan/transkrip URL).
- DILARANG keras membuat komentar generik yang terlalu umum seperti "wah keren banget infonya", "setuju banget sama ini", atau "mantap min" tanpa mengaitkannya dengan hal spesifik di dalam konten/URL!
- Bahkan komentar pendek (~3-7 kata) harus terasa jelas ditujukan untuk konten/topik spesifik tersebut.

PEDOMAN GAYA NETIZEN INDONESIA:
- Gunakan bahasa Indonesia percakapan sehari-hari yang luwes, natural, dan variatif.
- Variasikan gaya penulisan: ada yang huruf kecil semua (lowercase), ada yang casing natural.
- Variasikan panjang komentar:
  * ~30% Komentar pendek (punchy / to the point)
  * ~40% Komentar sedang (1-2 kalimat wajar)
  * ~20% Komentar conversational (bertanya, berbagi pandangan, relate)
  * ~10% Komentar lebih thoughtful / reflektif
- Variasikan partikel & slang khas Indonesia secara natural sesuai platform: "wkwk", "hehe", "btw", "emang", "kayaknya", "ternyata", "gue/gua/aku", "kita", "kok", "sih", "ya", "nih", "loh", "dong", "deh", "baru ngeh", "relate", dsb. Jangan gunakan satu pola berulang!
- Hindari kalimat kaku seperti "Sangat menginspirasi sekali kak!" atau "Postingan yang sangat edukatif dan bermanfaat". Ini adalah ciri khas AI bot yang DILARANG!
- Setiap komentar HARUS memiliki wording berbeda, struktur pembuka berbeda, dan tidak mengulang kata-kata yang sama.

ATURAN KHUSUS:
- Platform: ${platformRule}
- Task: ${taskRule}
- Tone yang diminta: ${tone}
- Emoji Frequency: ${emojiFreq} (Jika OFF: 0 emoji. Jika LOW: hanya sesekali. Jika MEDIUM: 1 emoji wajar per komentar. Jika HIGH: ekspresif).
- Slang Intensity: ${slangIntensity}

${count > 20 ? `Gunakan SMART COMMENT MATRIX: Kombinasikan berbagai Angle (Reaction, Appreciation, Curiosity, Question, Agreement, Observation, Personal perspective, Info seeking, Humor ringan, Emotional, Supportive) dengan Persona (Curious netizen, Casual viewer, Informative viewer, Young audience, Working professional, Enthusiastic viewer, Skeptical-but-neutral viewer) agar hasil sebanyak ${count} tetap fresh dan tidak repetitif.` : ''}

RESPONSIBLE GENERATION:
- Jangan mengarang fakta fiktif atau klaim pengalaman pribadi yang tidak ada dalam konteks/URL/brief!
- Jika Google Review: harus natural, grounded pada brief, dan tidak melebih-lebihkan fakta.
- Jika Report Komentar / Issue: buat narasi deskripsi laporan berbasis pelanggaran yang jelas dan objektif.`;

    const userPrompt = `TOLONG GENERATE SEBANYAK TEPAT ${count} KOMENTAR/METANARASI UNIK YANG RELEVAN DENGAN KONTEN URL DI BAWAH INI.

DATA & KONTEKS AKTUAL DARI URL / LINK:
${urlEvidenceBlock || '- Konteks umum sesuai brief pengguna'}

PARAMETER OUTPUT:
- Platform: ${platform}
- Task: ${task}
- Client Brief / Arahan Tambahan: ${clientBrief || 'Buat komentar natural ala netizen Indonesia yang nyambung langsung dengan topik & detail isi URL di atas'}
- Target Jumlah: ${count} komentar

Pastikan setiap komentar memiliki variasi sudut pandang (Angle) dan panjang (LengthCategory: 'short' | 'medium' | 'conversational' | 'thoughtful') serta benar-benar nyambung dengan isi URL/link yang diberikan.`;

    let generatedList: Array<{ no: number; text: string; angle: string; persona?: string; lengthCategory: string }> = [];

    const commentSchema = {
      type: Type.OBJECT,
      properties: {
        comments: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              no: { type: Type.INTEGER },
              text: { type: Type.STRING, description: 'Isi komentar natural ala netizen Indonesia yang relevan dengan isi URL' },
              angle: { type: Type.STRING, description: 'Angle komentar seperti Reaction, Curiosity, Appreciation, Observation, dll' },
              persona: { type: Type.STRING, description: 'Tipe persona audience' },
              lengthCategory: { type: Type.STRING, description: 'short, medium, conversational, atau thoughtful' },
            },
            required: ['no', 'text', 'angle', 'lengthCategory'],
          },
        },
      },
      required: ['comments'],
    };

    if (ai) {
      const parsed = await safeGenerateContent(ai, `${systemPrompt}\n\n${userPrompt}`, commentSchema);
      if (parsed && Array.isArray(parsed.comments) && parsed.comments.length > 0) {
        generatedList = parsed.comments;
      }
    }

    // Topic-aware fallback generator when offline, no API key, or AI service temporary spike
    if (generatedList.length === 0) {
      const topicAnchor = resolvedAnalysis?.topic || resolvedAnalysis?.originalTitle || effectiveContext.slice(0, 45) || 'topik ini';
      const angles = [
        'Reaction', 'Curiosity', 'Appreciation', 'Question', 'Agreement',
        'Observation', 'Personal perspective', 'Humor ringan', 'Supportive response', 'Educational response'
      ];
      const personas = [
        'Curious netizen', 'Casual viewer', 'Young audience', 'Working professional',
        'General audience', 'Enthusiastic viewer', 'Detail reactor'
      ];
      const lengths = ['short', 'medium', 'conversational', 'thoughtful'];

      const isModerationTask =
        task === 'report_akun' || task === 'report_komentar' || task === 'report_issue';

      const fallbackTemplates = isModerationTask
        ? [
            `Mohon peninjauan atas indikasi pelanggaran pedoman komunitas terkait ${topicAnchor}.`,
            `Laporan objektif: ditemukan aktivitas yang tidak sesuai ketentuan platform mengenai ${topicAnchor}.`,
            `Perlu verifikasi moderasi terhadap laporan ${topicAnchor} demi menjaga keamanan pengguna lain.`,
            `Mengajukan peninjauan konten/akun karena terdapat indikasi pelanggaran pada kasus ${topicAnchor}.`,
          ]
        : [
            `ohh ternyata soal ${topicAnchor} konteksnya kayak gini, baru ngeh deh`,
            `kirain awalnya beda, pas lihat pembahasan ${topicAnchor} masuk akal juga sih`,
            `menarik banget bahasan ${topicAnchor} ini, ada yang baru tahu juga gak sih?`,
            `relate banget sih sama poin di ${topicAnchor} ini wkwk`,
            `setuju sih sama pembahasan ${topicAnchor}, penting banget buat diterapin`,
            `btw ada detail lanjutannya soal ${topicAnchor} ga ya? pengen tahu lebih dalam`,
            `penjelasannya soal ${topicAnchor} ringkas dan gampang dipahami`,
            `kalo dipikir-pikir soal ${topicAnchor} emang ga sesimpel kelihatannya`,
            `auto save dulu pembahasan ${topicAnchor} buat referensi nanti`,
            `akhirnya ada yang bahas ${topicAnchor} dengan sudut pandang yang jelas`,
          ];

      for (let i = 1; i <= count; i++) {
        const base = fallbackTemplates[(i - 1) % fallbackTemplates.length];
        const angle = angles[(i - 1) % angles.length];
        const persona = personas[(i - 1) % personas.length];
        const lengthCategory = lengths[(i - 1) % lengths.length];
        generatedList.push({
          no: i,
          text: i > fallbackTemplates.length ? `${base} (variasi #${i})` : base,
          angle,
          persona,
          lengthCategory,
        });
      }
    }

    const formattedComments = generatedList.map((item, idx) => ({
      id: `comm_${Date.now()}_${idx + 1}`,
      no: item.no || (idx + 1),
      text: item.text,
      angle: item.angle || 'Reaction',
      persona: item.persona || 'General audience',
      lengthCategory: (item.lengthCategory as any) || 'medium',
      status: 'Ready',
    }));

    const threshold =
      typeof settings.duplicateThreshold === 'number'
        ? Math.min(Math.max(settings.duplicateThreshold / 100, 0.5), 0.9)
        : 0.65;
    const qcResult = runQualityCheck(formattedComments, threshold);

    res.json({
      success: true,
      comments: qcResult.comments,
      stats: qcResult.stats,
      analyzedContext: resolvedAnalysis || undefined,
      detectedPlatform: platform,
      metadata: {
        platform,
        task,
        quantity: count,
        tone,
        clientBrief,
        context: effectiveContext,
        url: trimmedUrl,
        timestamp: Date.now(),
      },
    });
  } catch (err: any) {
    console.error('Generate metanarasi error:', err);
    res.status(500).json({
      error: 'Gagal membuat metanarasi: ' + (err.message || 'Unknown error'),
    });
  }
});

// Endpoint 4: Regenerate single comment (grounded in URL context)
app.post('/api/regenerate-single', async (req, res) => {
  try {
    const {
      commentId,
      originalText,
      angle,
      platform = 'instagram',
      task = 'posting',
      tone = 'Casual',
      url = '',
      context = '',
      analyzedContent = null,
      existingComments = [],
    } = req.body;

    const ai = getGeminiClient();
    const platformRule = PLATFORM_GUIDELINES[platform] || PLATFORM_GUIDELINES.instagram;
    const urlEvidenceBlock = buildUrlContextEvidenceBlock(url, context, analyzedContent);

    if (ai) {
      const prompt = `Regenerate satu komentar pengganti untuk media sosial ${platform} (Task: ${task}).
Komentar lama: "${originalText}"
Angle lama: ${angle || 'Reaction'}
Tone: ${tone}
Pedoman Platform: ${platformRule}

KONTEKS AKTUAL DARI URL / TAUTAN:
${urlEvidenceBlock || 'Komentar netizen'}

Syarat penting:
1. Buat komentar BARU yang BERBEDA dari komentar lama namun TETAP relevan langsung dengan isi spesifik konten URL/konteks di atas.
2. Gunakan gaya bahasa netizen Indonesia yang natural dan luwes.
3. Jangan mengulang kata-kata pembuka dari komentar berikut: ${existingComments.slice(0, 6).join(' | ')}
4. Berikan angle baru yang segar.`;

      const singleSchema = {
        type: Type.OBJECT,
        properties: {
          text: { type: Type.STRING },
          angle: { type: Type.STRING },
          persona: { type: Type.STRING },
          lengthCategory: { type: Type.STRING },
        },
        required: ['text', 'angle'],
      };

      const parsed = await safeGenerateContent(ai, prompt, singleSchema);
      if (parsed && parsed.text) {
        return res.json({
          success: true,
          comment: {
            id: commentId || `comm_${Date.now()}`,
            text: parsed.text,
            angle: parsed.angle || 'Observation',
            persona: parsed.persona || 'Curious netizen',
            lengthCategory: parsed.lengthCategory || 'medium',
            status: 'Regenerated',
            isDuplicate: false,
          },
        });
      }
    }

    return res.json({
      success: true,
      comment: {
        id: commentId || `comm_${Date.now()}`,
        text: `wah bener juga ya, ada insight baru nih yang belum kepikiran sebelumnya`,
        angle: 'Observation',
        persona: 'Casual viewer',
        lengthCategory: 'medium',
        status: 'Regenerated',
        isDuplicate: false,
      },
    });
  } catch (err: any) {
    console.error('Regenerate single error:', err);
    res.status(500).json({ error: 'Gagal meregenerasi komentar: ' + err.message });
  }
});

// Endpoint 5: Regenerate duplicates (grounded in URL context)
app.post('/api/regenerate-duplicates', async (req, res) => {
  try {
    const { duplicateComments, allComments, platform, tone, url = '', context = '', analyzedContent = null } = req.body;
    if (!Array.isArray(duplicateComments) || duplicateComments.length === 0) {
      return res.json({ success: true, regenerated: [] });
    }

    const ai = getGeminiClient();
    const count = duplicateComments.length;
    const urlEvidenceBlock = buildUrlContextEvidenceBlock(url, context, analyzedContent);

    if (ai) {
      const existingSample = (allComments || [])
        .filter((c: any) => !duplicateComments.some((d: any) => d.id === c.id))
        .slice(0, 10)
        .map((c: any) => c.text)
        .join(' | ');

      const prompt = `Ganti ${count} komentar yang terdeteksi duplikat/mirip agar menjadi 100% UNIK, berbeda, dan TETAP relevan langsung dengan isi URL/konteks di bawah ini.
Platform: ${platform}
Tone: ${tone}

KONTEKS AKTUAL DARI URL / TAUTAN:
${urlEvidenceBlock || context}

Komentar yang SUDAH ADA (JANGAN SAMPAI MIRIP DENGAN INI):
${existingSample}

Hasil harus bervariasi dengan sudut pandang dan pembuka kalimat baru yang merujuk spesifik pada isi konten URL!`;

      const dupSchema = {
        type: Type.OBJECT,
        properties: {
          items: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                text: { type: Type.STRING },
                angle: { type: Type.STRING },
                persona: { type: Type.STRING },
                lengthCategory: { type: Type.STRING },
              },
              required: ['text', 'angle'],
            },
          },
        },
        required: ['items'],
      };

      const parsed = await safeGenerateContent(ai, prompt, dupSchema);
      const items = parsed?.items || [];

      if (items.length > 0) {
        const regenerated = duplicateComments.map((orig: any, i: number) => {
          const replacement = items[i] || {
            text: `sudut pandang yang menarik nih, baru sadar ada aspek ini juga`,
            angle: 'Perspective',
          };
          return {
            ...orig,
            text: replacement.text,
            angle: replacement.angle || orig.angle,
            persona: replacement.persona || orig.persona,
            lengthCategory: replacement.lengthCategory || orig.lengthCategory,
            status: 'Regenerated',
            isDuplicate: false,
            duplicateReason: undefined,
          };
        });

        return res.json({ success: true, regenerated });
      }
    }

    const alternatives = [
      'kalau dilihat dari kacamata lain, ini bener-bener membuka wawasan sih',
      'menarik banget diskusinya, jadi kepikiran buat nyobain juga',
      'wah baru tahu ada detail kayak gini, terima kasih infonya!',
      'ini sih sudut pandang yang jarang dibahas orang lain',
    ];

    const regenerated = duplicateComments.map((orig: any, i: number) => ({
      ...orig,
      text: alternatives[i % alternatives.length] || `Komentar variasi unik #${i + 1}`,
      status: 'Regenerated',
      isDuplicate: false,
      duplicateReason: undefined,
    }));

    return res.json({ success: true, regenerated });
  } catch (err: any) {
    console.error('Regenerate duplicates error:', err);
    res.status(500).json({ error: 'Gagal meregenerasi duplikat: ' + err.message });
  }
});

// Vite middleware or static serving
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
