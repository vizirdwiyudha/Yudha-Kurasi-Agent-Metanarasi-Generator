export type Platform =
  | 'instagram'
  | 'facebook'
  | 'threads'
  | 'whatsapp'
  | 'x'
  | 'youtube'
  | 'tiktok'
  | 'linkedin'
  | 'shopee'
  | 'google_review';

export type TaskType =
  | 'posting'
  | 'komentar'
  | 'like'
  | 'dislike'
  | 'share'
  | 'repost'
  | 'save'
  | 'report_komentar'
  | 'report_akun'
  | 'report_issue'
  | 'follow'
  | 'subscribe';

export type Tone =
  | 'Casual'
  | 'Friendly'
  | 'Professional'
  | 'Gen Z'
  | 'Informative'
  | 'Curious'
  | 'Humorous'
  | 'Supportive'
  | 'Neutral'
  | 'Enthusiastic'
  | 'Custom';

export type CommentAngle =
  | 'Reaction'
  | 'Appreciation'
  | 'Curiosity'
  | 'Question'
  | 'Agreement'
  | 'Observation'
  | 'Personal perspective'
  | 'Information seeking'
  | 'Humor ringan'
  | 'Emotional reaction'
  | 'Supportive response'
  | 'Educational response';

export type LengthCategory = 'short' | 'medium' | 'conversational' | 'thoughtful';

export type PersonaType =
  | 'Curious netizen'
  | 'Casual viewer'
  | 'Informative viewer'
  | 'Young audience'
  | 'Working professional'
  | 'General audience'
  | 'Enthusiastic viewer'
  | 'Skeptical-but-neutral viewer'
  | 'Question asker'
  | 'Detail reactor';

export type EmojiFrequency = 'OFF' | 'LOW' | 'MEDIUM' | 'HIGH';
export type SlangIntensity = 'FORMAL' | 'NATURAL' | 'CASUAL' | 'VERY CASUAL';

export interface AISettings {
  defaultLanguage: 'Bahasa Indonesia' | 'English' | 'Campuran / Slang Indo';
  defaultTone: Tone;
  emojiFrequency: EmojiFrequency;
  slangIntensity: SlangIntensity;
  outputVariation: 'Standard' | 'High' | 'Maximum';
  duplicateThreshold: number; // e.g. 75%
  maxQuantity: number;
}

export interface GeneratedComment {
  id: string;
  no: number;
  text: string;
  angle: CommentAngle | string;
  persona?: PersonaType | string;
  lengthCategory: LengthCategory;
  status: 'Ready' | 'Edited' | 'Regenerated';
  isDuplicate?: boolean;
  duplicateReason?: string;
}

export interface AnalyzedContentData {
  topic?: string;
  brand?: string;
  author?: string;
  sentiment?: string;
  summary?: string;
  keyPoints?: string[];
  contentHighlights?: string[];
  potentialAngles?: string[];
  suggestedContext?: string;
  mediaType?: 'video' | 'post' | 'article' | 'review';
  thumbnailUrl?: string;
  videoId?: string;
  embedUrl?: string;
  originalTitle?: string;
  keywords?: string[];
  rawTextSnippet?: string;
  domain?: string;
  faviconUrl?: string;
  snippet?: string;
  sourceUrl?: string;
  contentReadSuccess?: boolean;
}

export interface GenerationMetadata {
  id: string;
  timestamp: number;
  url: string;
  platform: Platform;
  task: TaskType;
  quantity: number;
  tone: string;
  clientBrief: string;
  context: string;
  analyzedContext?: AnalyzedContentData & {
    isMockOrOffline?: boolean;
  };
  comments: GeneratedComment[];
  stats: {
    total: number;
    unique: number;
    duplicates: number;
  };
}

export interface PlatformInfo {
  id: Platform;
  name: string;
  shortName: string;
  badge: string;
  styleDescription: string;
  characteristics: string[];
  color: string;
  bgColor: string;
  borderColor: string;
}

export interface TaskInfo {
  id: TaskType;
  name: string;
  category: 'Copy / Metanarasi' | 'Engagement Action' | 'Moderation / Reporting';
  description: string;
  isDirectCopy: boolean;
  badge: string;
}

export interface SubkoorMember {
  id: string;
  name: string;
  role?: string;
  active: boolean;
}

export interface TaskDelegationAssignment {
  subkoorId: string;
  subkoorName: string;
  value: string; // e.g. "1-14" or "25"
}

export interface TaskDelegationItem {
  id: string;
  taskName: string; // e.g. "Komentar", "Like", "Repost", "Share", "Report Akun"
  mode: 'range' | 'count';
  assignments: TaskDelegationAssignment[];
}
