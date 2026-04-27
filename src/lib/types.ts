export type ContentStatus = "idea" | "scripted" | "recorded" | "edited" | "published";
export type ContentFormat = "short" | "longform" | "reel" | "post";
export type Platform = "youtube" | "tiktok" | "instagram" | "x" | "threads" | "facebook" | "telegram";

export interface ContentItem {
  id: string;
  title: string;
  hook: string;
  script: string;
  description: string;
  hashtags: string[];
  format: ContentFormat;
  status: ContentStatus;
  platforms: Platform[];
  scheduledDate?: string;
  publishedDate?: string;
  duration?: number; // seconds
  thumbnailStyle?: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface GenerateRequest {
  topic: string;
  format: ContentFormat;
  tone?: string;
  language?: string;
}

export interface GenerateResponse {
  title: string;
  hook: string;
  script: string;
  description: string;
  hashtags: string[];
  duration: number;
}

export type LLMProvider = "openai" | "openrouter";
export type ImageProvider = "dalle3" | "openrouter-image" | "fal";

export interface AppSettings {
  openaiApiKey: string;
  openrouterApiKey: string;
  falApiKey: string;
  llmProvider: LLMProvider;
  llmModel: string;
  imageProvider: ImageProvider;
  imageModel: string;
  language: string;
  brandName: string;
  brandHandle: string;
  // Social media integrations
  telegramBotToken: string;
  telegramChannelId: string;
  xClientId: string;
  xClientSecret: string;
  xAccessToken: string;
  xRefreshToken: string;
}

export interface ThumbnailVariant {
  id: string;
  promptName: string;
  promptText: string;
  imageUrl: string;
  style: string;
  rating?: number; // 1-5 user rating for A/B testing
  createdAt: string;
}

export interface ABTest {
  id: string;
  title: string;
  variants: ThumbnailVariant[];
  winner?: string; // variant id
  createdAt: string;
}

export interface ModelInfo {
  id: string;
  name: string;
  provider: string;
  type: "text" | "image";
  cost: string;
  quality: string;
  speed: string;
  recommended: boolean;
  description: string;
}

export const RECOMMENDED_TEXT_MODELS: ModelInfo[] = [
  {
    id: "anthropic/claude-sonnet-4",
    name: "Claude Sonnet 4",
    provider: "Anthropic",
    type: "text",
    cost: "$3/$15 per 1M tokens",
    quality: "Отличное",
    speed: "Быстрый",
    recommended: true,
    description: "Лучший для креативного контента, сценариев, хуков. Понимает русский отлично.",
  },
  {
    id: "google/gemini-2.5-flash-preview",
    name: "Gemini 2.5 Flash",
    provider: "Google",
    type: "text",
    cost: "$0.15/$0.60 per 1M tokens",
    quality: "Отличное",
    speed: "Очень быстрый",
    recommended: true,
    description: "Самый дешёвый топовый вариант. Идеален для массовой генерации идей.",
  },
  {
    id: "openai/gpt-4o-mini",
    name: "GPT-4o Mini",
    provider: "OpenAI",
    type: "text",
    cost: "$0.15/$0.60 per 1M tokens",
    quality: "Хорошее",
    speed: "Очень быстрый",
    recommended: true,
    description: "Баланс цена/качество. Хорош для описаний и хэштегов.",
  },
  {
    id: "openai/gpt-4o",
    name: "GPT-4o",
    provider: "OpenAI",
    type: "text",
    cost: "$2.50/$10 per 1M tokens",
    quality: "Отличное",
    speed: "Быстрый",
    recommended: false,
    description: "Топовый OpenAI. Дороже, но умнее для сложных сценариев long-form.",
  },
  {
    id: "meta-llama/llama-4-maverick",
    name: "Llama 4 Maverick",
    provider: "Meta",
    type: "text",
    cost: "$0.20/$0.60 per 1M tokens",
    quality: "Хорошее",
    speed: "Быстрый",
    recommended: false,
    description: "Open-source, дешёвый. Хорош для батч-генерации идей.",
  },
  {
    id: "deepseek/deepseek-chat-v3-0324",
    name: "DeepSeek V3",
    provider: "DeepSeek",
    type: "text",
    cost: "$0.14/$0.28 per 1M tokens",
    quality: "Хорошее",
    speed: "Быстрый",
    recommended: true,
    description: "Самый дешёвый умный вариант. Отличный русский. Идеален для экономии.",
  },
];

export const RECOMMENDED_IMAGE_MODELS: ModelInfo[] = [
  // --- fal.ai models (best value) ---
  {
    id: "fal-ai/flux-2-flex",
    name: "Flux 2 Flex",
    provider: "fal.ai",
    type: "image",
    cost: "~$0.03 / изображение",
    quality: "Лучшее",
    speed: "5–8 сек",
    recommended: true,
    description: "Король фотореализма. Кожа, свет, позы как DSLR. Идеально для YouTube-обложек.",
  },
  {
    id: "fal-ai/flux-2/klein/9b/base",
    name: "Flux 2 Klein 9B",
    provider: "fal.ai",
    type: "image",
    cost: "~$0.01 / изображение",
    quality: "Хорошее",
    speed: "2–4 сек",
    recommended: true,
    description: "Самый дешёвый и быстрый. Идеален для A/B тестирования множества вариантов.",
  },
  {
    id: "ideogram/ideogram-3.0",
    name: "Ideogram 3.0",
    provider: "fal.ai",
    type: "image",
    cost: "~$0.04 / изображение",
    quality: "Отличное",
    speed: "5–10 сек",
    recommended: true,
    description: "Лучший для текста на изображениях. Нет ошибок в надписях.",
  },
  {
    id: "fal-ai/recraft/v4/text-to-image",
    name: "Recraft V4",
    provider: "fal.ai",
    type: "image",
    cost: "~$0.04 / изображение",
    quality: "Отличное",
    speed: "5–8 сек",
    recommended: false,
    description: "Лучший для дизайна, лого, векторной графики. #1 на HuggingFace.",
  },
  {
    id: "fal-ai/nano-banana-2",
    name: "Nano Banana 2 (Gemini)",
    provider: "fal.ai",
    type: "image",
    cost: "~$0.02 / изображение",
    quality: "Отличное",
    speed: "3–6 сек",
    recommended: false,
    description: "Google Gemini Image. Мульти-turn редактирование через диалог.",
  },
  {
    id: "google/imagen-4-fast",
    name: "Imagen 4 Fast",
    provider: "fal.ai",
    type: "image",
    cost: "~$0.02 / изображение",
    quality: "Отличное",
    speed: "3–5 сек",
    recommended: false,
    description: "Google Imagen 4. Фотореалистичность + скорость.",
  },
  {
    id: "fal-ai/flux-pro/kontext",
    name: "Flux Kontext (Edit)",
    provider: "fal.ai",
    type: "image",
    cost: "~$0.05 / изображение",
    quality: "Отличное",
    speed: "6–10 сек",
    recommended: false,
    description: "Редактирование существующих изображений + консистентность персонажей.",
  },
  // --- Legacy providers ---
  {
    id: "dalle3",
    name: "DALL-E 3",
    provider: "OpenAI",
    type: "image",
    cost: "$0.04–0.12 / изображение",
    quality: "Хорошее",
    speed: "15–20 сек",
    recommended: false,
    description: "Запасной вариант. Хорошее понимание промпта, но дороже и медленнее.",
  },
];

export const THUMBNAIL_PROMPT_TEMPLATES: { id: string; name: string; description: string; prompt: string }[] = [
  {
    id: "cinematic-face",
    name: "Кинематографичный с лицом",
    description: "Драматичный свет, эмоция, как у MrBeast",
    prompt: `Photorealistic cinematic YouTube thumbnail. A person looking directly at camera with {emotion} expression. Dramatic side lighting, shallow depth of field, dark moody background with {color} accent light. Professional studio quality, 8K, ultra-detailed face. Topic context: {topic}. NO TEXT on image.`,
  },
  {
    id: "tech-setup",
    name: "Tech Setup / Рабочее место",
    description: "Гаджеты, мониторы, неоновый свет",
    prompt: `Professional tech workspace photograph for YouTube thumbnail. Multiple monitors with glowing code, mechanical keyboard, {color} LED ambient lighting, dark room. Cinematic perspective, shallow depth of field, cyberpunk aesthetic. Ultra-realistic, 8K quality. Topic: {topic}. NO TEXT.`,
  },
  {
    id: "before-after",
    name: "До / После (split)",
    description: "Разделённый экран — контраст",
    prompt: `YouTube thumbnail with dramatic split screen composition. Left side: dark, messy, chaotic coding scene. Right side: clean, glowing, futuristic AI-powered result with {color} neon accents. Sharp dividing line in the middle. Professional quality, dramatic lighting. Topic: {topic}. NO TEXT.`,
  },
  {
    id: "floating-objects",
    name: "Парящие объекты",
    description: "3D объекты в воздухе, магический вайб",
    prompt: `3D rendered floating tech objects in dark void for YouTube thumbnail. Glowing {color} holographic screens, code snippets as light particles, AI neural network visualization, isometric perspective. Unreal Engine quality, volumetric lighting, dark background. Topic: {topic}. NO TEXT.`,
  },
  {
    id: "minimal-bold",
    name: "Минимал Bold",
    description: "Чёрный фон, один яркий элемент",
    prompt: `Ultra-minimalist YouTube thumbnail. Pure black background. Single striking visual element in center — glowing {color} geometric shape or icon related to: {topic}. Extreme contrast, clean edges, professional graphic design. Apple-style minimalism. NO TEXT.`,
  },
  {
    id: "hacker-terminal",
    name: "Хакер / Терминал",
    description: "Код на экране, зелёный свет, матрица",
    prompt: `Hacker aesthetic YouTube thumbnail. Dark room, person silhouette in front of multiple monitors with green terminal code. Matrix-style falling characters, {color} glow on face. Moody cyberpunk atmosphere, volumetric fog. Photorealistic, 8K. Topic: {topic}. NO TEXT.`,
  },
  {
    id: "money-success",
    name: "Деньги / Успех",
    description: "Доход, графики вверх, золотой свет",
    prompt: `YouTube thumbnail about financial success and tech income. Holographic rising charts and graphs, golden {color} light beams, luxury but tasteful dark aesthetic. Professional studio lighting, bokeh background. Conveys achievement and expertise. Topic: {topic}. NO TEXT.`,
  },
  {
    id: "ai-brain",
    name: "AI Мозг / Нейросеть",
    description: "Мозг из нейронов, будущее AI",
    prompt: `Futuristic AI brain visualization for YouTube thumbnail. Glowing {color} neural network forming a human brain shape, data streams, holographic interface elements floating around. Dark space background, volumetric lighting, sci-fi aesthetic. 8K quality. Topic: {topic}. NO TEXT.`,
  },
];

// --- Competitor Analysis ---
export interface CompetitorAnalysis {
  id: string;
  imageDataUrl: string; // base64 thumbnail
  analysis: {
    composition: string;
    colors: string;
    lighting: string;
    mood: string;
    elements: string;
    style: string;
    whatWorks: string;
  };
  generatedPrompt: string;
  generatedVariants: ThumbnailVariant[];
  createdAt: string;
}

// --- Custom Prompt Templates (user-editable) ---
export type PromptCategory = "thumbnail" | "short" | "longform" | "reel" | "post";

export interface CustomPromptTemplate {
  id: string;
  name: string;
  description: string;
  prompt: string;
  category: PromptCategory;
  isBuiltIn: boolean; // true = system template, false = user created
  createdAt: string;
  updatedAt: string;
}

export const PROMPT_CATEGORY_LABELS: Record<PromptCategory, string> = {
  thumbnail: "Обложки",
  short: "Shorts",
  longform: "Long-form",
  reel: "Reels",
  post: "Посты",
};

// --- Default content generation templates (editable by user) ---
export const DEFAULT_CONTENT_TEMPLATES: CustomPromptTemplate[] = [
  {
    id: "gen-short",
    name: "Shorts / Reels скрипт",
    description: "Короткий ударный скрипт 15-60 сек",
    category: "short",
    isBuiltIn: true,
    prompt: `Создай контент на тему: "{topic}"

Формат: Shorts/Reels (15-60 секунд). Скрипт должен быть ОЧЕНЬ коротким и ударным.
Бренд: {brand} ({handle})

Ответь СТРОГО в JSON:
{
  "title": "Цепляющий заголовок",
  "hook": "Крючок за 2 секунды (1-2 предложения)",
  "script": "Сценарий с [визуальными указаниями]",
  "description": "Описание с эмодзи",
  "hashtags": ["хэштег1", "хэштег2", "хэштег3", "хэштег4", "хэштег5"],
  "duration": 30
}`,
    createdAt: "",
    updatedAt: "",
  },
  {
    id: "gen-longform",
    name: "Long-form сценарий",
    description: "Структурированный скрипт 8-15 мин с таймкодами",
    category: "longform",
    isBuiltIn: true,
    prompt: `Создай контент на тему: "{topic}"

Формат: Long-form видео (8-15 минут). Структура: Вступление → Основная часть (3-5 блоков) → Заключение.
Бренд: {brand} ({handle})

Ответь СТРОГО в JSON:
{
  "title": "SEO-оптимизированный заголовок",
  "hook": "Крючок на первые 5 секунд",
  "script": "Полный сценарий с [таймкодами] и [визуальными указаниями]",
  "description": "Описание для YouTube с ключевыми словами",
  "hashtags": ["хэштег1", "хэштег2", "хэштег3", "хэштег4", "хэштег5"],
  "duration": 600
}`,
    createdAt: "",
    updatedAt: "",
  },
  {
    id: "gen-post",
    name: "Пост для соцсетей",
    description: "Текстовый пост с эмодзи и хэштегами",
    category: "post",
    isBuiltIn: true,
    prompt: `Создай пост для соцсетей на тему: "{topic}"

Формат: Текстовый пост. Краткий, цепляющий, с эмодзи.
Бренд: {brand} ({handle})
Платформы: Instagram, X, Threads

Ответь СТРОГО в JSON:
{
  "title": "Заголовок поста",
  "hook": "Первая строка-крючок",
  "script": "Полный текст поста (3-5 абзацев, эмодзи)",
  "description": "Альтернативная короткая версия для X",
  "hashtags": ["хэштег1", "хэштег2", "хэштег3", "хэштег4", "хэштег5"],
  "duration": 0
}`,
    createdAt: "",
    updatedAt: "",
  },
  {
    id: "gen-reel",
    name: "Reel / TikTok скрипт",
    description: "Визуальный скрипт с трендовыми переходами",
    category: "reel",
    isBuiltIn: true,
    prompt: `Создай скрипт Reel/TikTok на тему: "{topic}"

Формат: Reel 30-90 секунд. Трендовые переходы, быстрый монтаж.
Бренд: {brand} ({handle})
Стиль: динамичный, визуально насыщенный, trending audio vibes

Ответь СТРОГО в JSON:
{
  "title": "Вирусный заголовок",
  "hook": "Стоп-фраза для scroll-stop за 1 секунду",
  "script": "Покадровый сценарий: [Кадр 1: ...] [Кадр 2: ...] [Переход: ...] ...",
  "description": "Описание для TikTok/Instagram",
  "hashtags": ["хэштег1", "хэштег2", "хэштег3", "хэштег4", "хэштег5"],
  "duration": 45
}`,
    createdAt: "",
    updatedAt: "",
  },
];

export const STATUS_LABELS: Record<ContentStatus, string> = {
  idea: "💡 Идея",
  scripted: "📝 Сценарий",
  recorded: "🎬 Записано",
  edited: "✂️ Монтаж",
  published: "✅ Опубликовано",
};

export const STATUS_COLORS: Record<ContentStatus, { bg: string; border: string; text: string; dot: string }> = {
  idea: { bg: "bg-yellow-400/10", border: "border-yellow-400/30", text: "text-yellow-400", dot: "bg-yellow-400" },
  scripted: { bg: "bg-blue-400/10", border: "border-blue-400/30", text: "text-blue-400", dot: "bg-blue-400" },
  recorded: { bg: "bg-orange-400/10", border: "border-orange-400/30", text: "text-orange-400", dot: "bg-orange-400" },
  edited: { bg: "bg-purple-400/10", border: "border-purple-400/30", text: "text-purple-400", dot: "bg-purple-400" },
  published: { bg: "bg-green-400/10", border: "border-green-400/30", text: "text-green-400", dot: "bg-green-400" },
};

export const FORMAT_LABELS: Record<ContentFormat, string> = {
  short: "Shorts",
  longform: "Long-form",
  reel: "Reel",
  post: "Пост",
};

export const PLATFORM_LABELS: Record<Platform, string> = {
  youtube: "YouTube",
  tiktok: "TikTok",
  instagram: "Instagram",
  x: "X (Twitter)",
  threads: "Threads",
  facebook: "Facebook",
  telegram: "Telegram",
};

export const PLATFORM_COLORS: Record<Platform, string> = {
  youtube: "#FF0000",
  tiktok: "#00F2EA",
  instagram: "#E1306C",
  x: "#1DA1F2",
  threads: "#000000",
  facebook: "#1877F2",
  telegram: "#0088CC",
};

// --- Checklists ---
export interface ChecklistItem {
  id: string;
  text: string;
  description?: string;
  done: boolean;
  section: string;
}

export interface Checklist {
  id: string;
  name: string;
  icon: string;
  items: ChecklistItem[];
  resetSchedule: "daily" | "weekly" | "manual";
  lastReset: string;
}

// --- Analytics / Stats ---
export interface WeeklyStats {
  id: string;
  weekNumber: number;
  weekLabel: string; // e.g. "Неделя 3 / Месяц 1"
  date: string;
  shortsPublished: number;
  longformPublished: number;
  avgViews: number;
  bestShortsViews: number;
  bestShortsTitle: string;
  avgRetention: number;
  subscribers: PlatformStats;
  engagement: {
    commentsReceived: number;
    commentsLeft: number;
    dmRequests: number;
  };
  hoursContent: number;
  hoursDistribution: number;
  insight: string;
}

export interface PlatformStats {
  youtube: number;
  tiktok: number;
  instagram: number;
  telegram: number;
  x: number;
}

// --- Ideas Bank ---
export type IdeaPriority = "hot" | "normal" | "backlog";
export type IdeaSource = "trend" | "ai" | "competitor" | "personal" | "audience";

export interface Idea {
  id: string;
  text: string;
  tags: string[];
  priority: IdeaPriority;
  source: IdeaSource;
  format?: ContentFormat;
  usedInContentId?: string;
  createdAt: string;
}

export const IDEA_PRIORITY_LABELS: Record<IdeaPriority, string> = {
  hot: "Горящая",
  normal: "Обычная",
  backlog: "Запас",
};

export const IDEA_SOURCE_LABELS: Record<IdeaSource, string> = {
  trend: "Тренд",
  ai: "AI",
  competitor: "Конкурент",
  personal: "Личная",
  audience: "Аудитория",
};
