"use client";

import { useState, useRef, useCallback } from "react";
import { v4 as uuidv4 } from "uuid";
import {
  Image as ImageIcon, Download, Type, Sparkles, Loader2,
  AlertCircle, Star, Trash2, FlaskConical, Eye, Upload,
  Search, Wand2, Plus, Save, Pencil, Copy, Check,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useContent } from "@/lib/ContentContext";
import {
  ThumbnailVariant, RECOMMENDED_IMAGE_MODELS,
  CustomPromptTemplate, PROMPT_CATEGORY_LABELS, PromptCategory,
} from "@/lib/types";

type Tab = "generate" | "analyze" | "templates";
type AspectRatio = "16:9" | "9:16" | "1:1";
const ACCENT_COLORS = ["purple neon", "cyan electric", "hot pink", "golden amber", "lime green", "blood red"];

/* ───────── Variant Card (shared) ───────── */
function VariantCard({ v, onRate, onDelete, onDownload, loading }: {
  v: ThumbnailVariant;
  onRate: (id: string, r: number) => void;
  onDelete: (id: string) => void;
  onDownload: (url: string, name: string) => void;
  loading: string | null;
}) {
  const [showPrompt, setShowPrompt] = useState(false);
  const [copied, setCopied] = useState(false);

  return (
    <div className="bg-card border border-card-border rounded-xl overflow-hidden">
      <div className="relative">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={v.imageUrl} alt={v.promptName} className="w-full h-auto" />
        {loading === v.promptName && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-accent" />
          </div>
        )}
      </div>
      <div className="p-3">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-accent">{v.promptName}</span>
          <span className="text-[10px] text-muted">{v.style}</span>
        </div>
        <div className="flex items-center gap-1 mb-2">
          {[1, 2, 3, 4, 5].map((star) => (
            <button key={star} onClick={() => onRate(v.id, star)} className="transition-transform hover:scale-125">
              <Star className={cn("w-4 h-4", (v.rating || 0) >= star ? "text-yellow-400 fill-yellow-400" : "text-muted/30")} />
            </button>
          ))}
          {v.rating && <span className="text-[10px] text-muted ml-1">{v.rating}/5</span>}
        </div>
        {/* Show/hide prompt */}
        <button onClick={() => setShowPrompt(!showPrompt)} className="text-[10px] text-muted hover:text-accent mb-2 flex items-center gap-1">
          <Eye className="w-3 h-3" />{showPrompt ? "Скрыть промпт" : "Показать промпт"}
        </button>
        {showPrompt && (
          <div className="relative mb-2">
            <pre className="text-[10px] text-muted/80 bg-background rounded-lg p-2 max-h-24 overflow-y-auto whitespace-pre-wrap">{v.promptText}</pre>
            <button
              onClick={() => { navigator.clipboard.writeText(v.promptText); setCopied(true); setTimeout(() => setCopied(false), 1500); }}
              className="absolute top-1 right-1 p-1 rounded bg-card border border-card-border"
            >
              {copied ? <Check className="w-3 h-3 text-neon-green" /> : <Copy className="w-3 h-3 text-muted" />}
            </button>
          </div>
        )}
        <div className="flex gap-2">
          <button onClick={() => onDownload(v.imageUrl, v.promptName)} className="flex-1 py-1.5 rounded-lg bg-accent/10 text-accent text-xs font-medium hover:bg-accent/20 transition-colors flex items-center justify-center gap-1">
            <Download className="w-3 h-3" />Скачать
          </button>
          <button onClick={() => onDelete(v.id)} className="px-2.5 py-1.5 rounded-lg bg-danger/10 text-danger text-xs hover:bg-danger/20 transition-colors">
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  );
}

/* ───────── Main component ───────── */
export default function PreviewGenerator() {
  const { settings, templates, saveTemplate, deleteTemplate } = useContent();
  const [tab, setTab] = useState<Tab>("generate");

  // --- Generate tab state ---
  const [title, setTitle] = useState("AI написал этот код за 30 секунд");
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>("16:9");
  const [selectedTemplates, setSelectedTemplates] = useState<string[]>(["cinematic-face", "tech-setup"]);
  const [accentColor, setAccentColor] = useState("purple neon");
  const [customPrompt, setCustomPrompt] = useState("");
  const [variants, setVariants] = useState<ThumbnailVariant[]>([]);
  const [loading, setLoading] = useState<string | null>(null);
  const [batchLoading, setBatchLoading] = useState(false);
  const [error, setError] = useState("");
  const [userPhoto, setUserPhoto] = useState<string | null>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);

  // --- Analyze tab state ---
  const [analyzeImage, setAnalyzeImage] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<{ analysis: Record<string, string>; generatedPrompt: string } | null>(null);
  const [analyzeError, setAnalyzeError] = useState("");
  const analyzeInputRef = useRef<HTMLInputElement>(null);

  // --- Templates tab state ---
  const [editingTemplate, setEditingTemplate] = useState<CustomPromptTemplate | null>(null);
  const [templateFilter, setTemplateFilter] = useState<PromptCategory | "all">("all");

  const thumbTemplates = templates.filter((t) => t.category === "thumbnail");

  /* ===== Shared helpers ===== */
  async function generateImage(promptName: string, promptText: string) {
    setLoading(promptName);
    setError("");
    try {
      // If user uploaded photo, prepend instruction to include it
      let finalPrompt = promptText;
      if (userPhoto) {
        finalPrompt = `${promptText}\n\nIMPORTANT: Include a reference photo element described here — the user wants their personal photo/branding incorporated into the composition.`;
      }
      const res = await fetch("/api/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: finalPrompt,
          apiKey: settings.openaiApiKey,
          openrouterApiKey: settings.openrouterApiKey,
          falApiKey: settings.falApiKey,
          size: aspectRatio,
          imageProvider: settings.imageProvider,
          imageModel: settings.imageModel,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Ошибка генерации"); return; }
      const variant: ThumbnailVariant = {
        id: uuidv4(), promptName, promptText: finalPrompt,
        imageUrl: data.imageUrl, style: data.model || settings.imageModel,
        createdAt: new Date().toISOString(),
      };
      setVariants((prev) => [...prev, variant]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка сети");
    } finally { setLoading(null); }
  }

  async function handleGenerateAB() {
    if (!title.trim() || selectedTemplates.length === 0) return;
    setBatchLoading(true); setError("");
    const prompts = selectedTemplates.map((tid) => {
      const t = thumbTemplates.find((t) => t.id === tid);
      if (!t) return null;
      return { name: t.name, text: t.prompt.replace(/{topic}/g, title).replace(/{color}/g, accentColor).replace(/{emotion}/g, "surprised and excited") };
    }).filter(Boolean) as { name: string; text: string }[];
    if (customPrompt.trim()) {
      prompts.push({ name: "Custom", text: customPrompt.replace(/{topic}/g, title).replace(/{color}/g, accentColor) });
    }
    for (const p of prompts) { await generateImage(p.name, p.text); }
    setBatchLoading(false);
  }

  function handleRate(id: string, r: number) { setVariants((prev) => prev.map((v) => v.id === id ? { ...v, rating: r } : v)); }
  function handleDeleteVariant(id: string) { setVariants((prev) => prev.filter((v) => v.id !== id)); }

  async function handleDownload(url: string, name: string) {
    try {
      const r = await fetch(url); const b = await r.blob();
      const u = URL.createObjectURL(b); const a = document.createElement("a");
      a.download = `itoq-${name.replace(/\s+/g, "-")}-${Date.now()}.png`; a.href = u; a.click(); URL.revokeObjectURL(u);
    } catch { window.open(url, "_blank"); }
  }

  function toggleTemplate(id: string) { setSelectedTemplates((p) => p.includes(id) ? p.filter((t) => t !== id) : [...p, id]); }

  /* ===== Photo upload ===== */
  function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => setUserPhoto(reader.result as string);
    reader.readAsDataURL(file);
  }

  /* ===== Competitor analysis ===== */
  function handleAnalyzeUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => { setAnalyzeImage(reader.result as string); setAnalysisResult(null); };
    reader.readAsDataURL(file);
  }

  const handleAnalyze = useCallback(async () => {
    if (!analyzeImage) return;
    setAnalyzing(true); setAnalyzeError(""); setAnalysisResult(null);
    try {
      const apiKey = settings.llmProvider === "openrouter" ? settings.openrouterApiKey : settings.openaiApiKey;
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageDataUrl: analyzeImage,
          apiKey,
          provider: settings.llmProvider,
          model: settings.llmProvider === "openrouter" ? "openai/gpt-4o" : "gpt-4o",
        }),
      });
      const data = await res.json();
      if (!res.ok) { setAnalyzeError(data.error || "Ошибка анализа"); return; }
      setAnalysisResult(data);
    } catch (err) {
      setAnalyzeError(err instanceof Error ? err.message : "Ошибка сети");
    } finally { setAnalyzing(false); }
  }, [analyzeImage, settings]);

  async function handleGenerateFromAnalysis() {
    if (!analysisResult?.generatedPrompt) return;
    await generateImage("Конкурент (клон)", analysisResult.generatedPrompt);
    setTab("generate");
  }

  function handleSaveAnalysisAsTemplate() {
    if (!analysisResult?.generatedPrompt) return;
    const t: CustomPromptTemplate = {
      id: `competitor-${Date.now()}`,
      name: `Стиль конкурента ${new Date().toLocaleDateString("ru")}`,
      description: "Промпт из анализа обложки конкурента",
      prompt: analysisResult.generatedPrompt,
      category: "thumbnail",
      isBuiltIn: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    saveTemplate(t);
  }

  /* ===== Template editor ===== */
  function handleSaveEditingTemplate() {
    if (!editingTemplate) return;
    saveTemplate(editingTemplate);
    setEditingTemplate(null);
  }

  function handleNewTemplate() {
    setEditingTemplate({
      id: `custom-${Date.now()}`,
      name: "",
      description: "",
      prompt: "",
      category: templateFilter === "all" ? "thumbnail" : templateFilter,
      isBuiltIn: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  }

  const imgModel = RECOMMENDED_IMAGE_MODELS.find((m) => m.id === settings.imageModel);
  const filteredTemplates = templateFilter === "all" ? templates : templates.filter((t) => t.category === templateFilter);

  /* ===== RENDER ===== */
  return (
    <div className="animate-slide-in">
      <h1 className="text-2xl font-bold mb-1">
        <ImageIcon className="w-6 h-6 text-neon-pink inline mr-2" />
        AI Превью Studio
      </h1>
      <p className="text-xs text-muted mb-4">
        Модель: <span className="text-accent">{imgModel?.name || settings.imageModel}</span>
        {imgModel && <span className="ml-2 text-muted/60">{imgModel.cost}</span>}
      </p>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-card border border-card-border rounded-lg p-1 w-fit">
        {([
          { id: "generate" as Tab, label: "A/B Генерация", icon: <FlaskConical className="w-3.5 h-3.5" /> },
          { id: "analyze" as Tab, label: "Анализ конкурентов", icon: <Search className="w-3.5 h-3.5" /> },
          { id: "templates" as Tab, label: "Шаблоны промптов", icon: <Pencil className="w-3.5 h-3.5" /> },
        ]).map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              "px-4 py-2 rounded-md text-xs font-medium flex items-center gap-1.5 transition-all",
              tab === t.id ? "bg-accent text-white" : "text-muted hover:text-foreground"
            )}
          >
            {t.icon}{t.label}
          </button>
        ))}
      </div>

      {/* ═══════ TAB: GENERATE ═══════ */}
      {tab === "generate" && (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-1 space-y-4">
            {/* Title */}
            <div className="bg-card border border-card-border rounded-xl p-4">
              <label className="text-xs text-muted uppercase tracking-wider block mb-2">
                <Type className="w-3.5 h-3.5 inline mr-1" />Тема обложки
              </label>
              <textarea value={title} onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-input-bg border border-input-border rounded-lg p-3 text-foreground resize-none h-16 text-sm focus:outline-none focus:border-accent"
                placeholder="Тема видео..." />
            </div>

            {/* Photo upload */}
            <div className="bg-card border border-card-border rounded-xl p-4">
              <label className="text-xs text-muted uppercase tracking-wider block mb-2">
                <Upload className="w-3.5 h-3.5 inline mr-1" />Своё фото для обложки (опц.)
              </label>
              <input type="file" ref={photoInputRef} accept="image/*" onChange={handlePhotoUpload} className="hidden" />
              {userPhoto ? (
                <div className="flex items-center gap-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={userPhoto} alt="Uploaded" className="w-16 h-16 rounded-lg object-cover border border-card-border" />
                  <div className="flex-1">
                    <p className="text-xs text-neon-green">Фото загружено</p>
                    <p className="text-[10px] text-muted">Будет добавлено как overlay при скачивании</p>
                  </div>
                  <button onClick={() => setUserPhoto(null)} className="text-xs text-danger">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <button onClick={() => photoInputRef.current?.click()}
                  className="w-full py-3 rounded-lg border-2 border-dashed border-card-border text-muted text-xs hover:border-accent/40 transition-colors flex items-center justify-center gap-2">
                  <Upload className="w-4 h-4" />Загрузить фото / картинку
                </button>
              )}
            </div>

            {/* Templates */}
            <div className="bg-card border border-card-border rounded-xl p-4">
              <label className="text-xs text-muted uppercase tracking-wider block mb-2">
                <FlaskConical className="w-3.5 h-3.5 inline mr-1" />Шаблоны (выбери для A/B)
              </label>
              <div className="space-y-1.5 max-h-[220px] overflow-y-auto">
                {thumbTemplates.map((t) => (
                  <button key={t.id} onClick={() => toggleTemplate(t.id)}
                    className={cn("w-full text-left p-2.5 rounded-lg border transition-all text-xs",
                      selectedTemplates.includes(t.id) ? "border-accent bg-accent-dim text-foreground" : "border-card-border bg-background text-muted hover:border-accent/30"
                    )}>
                    <div className="flex items-center justify-between">
                      <span className="font-semibold">{t.name}</span>
                      {!t.isBuiltIn && <span className="text-[9px] text-neon-green">custom</span>}
                    </div>
                    <div className="text-[10px] opacity-70 mt-0.5">{t.description}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Custom prompt + colors + ratio */}
            <div className="bg-card border border-card-border rounded-xl p-4">
              <label className="text-xs text-muted uppercase tracking-wider block mb-2"><Eye className="w-3.5 h-3.5 inline mr-1" />Свой промпт</label>
              <textarea value={customPrompt} onChange={(e) => setCustomPrompt(e.target.value)}
                className="w-full bg-input-bg border border-input-border rounded-lg p-2.5 text-foreground resize-none h-14 text-xs focus:outline-none focus:border-accent"
                placeholder="{topic} {color} — переменные" />
            </div>
            <div className="bg-card border border-card-border rounded-xl p-4">
              <div className="flex flex-wrap gap-1.5">
                {ACCENT_COLORS.map((c) => (
                  <button key={c} onClick={() => setAccentColor(c)}
                    className={cn("px-2 py-0.5 rounded-full text-[10px] border transition-all",
                      accentColor === c ? "border-accent bg-accent-dim text-foreground" : "border-card-border text-muted"
                    )}>{c}</button>
                ))}
              </div>
            </div>
            <div className="flex gap-2">
              {(["16:9", "9:16", "1:1"] as const).map((r) => (
                <button key={r} onClick={() => setAspectRatio(r)}
                  className={cn("px-3 py-1.5 rounded-lg text-xs flex-1", aspectRatio === r ? "bg-accent text-white" : "bg-input-bg border border-input-border text-muted")}>{r}</button>
              ))}
            </div>

            <button onClick={handleGenerateAB} disabled={batchLoading || !title.trim() || selectedTemplates.length === 0}
              className={cn("w-full py-3 rounded-lg font-semibold text-white flex items-center justify-center gap-2 transition-all",
                batchLoading || !title.trim() || selectedTemplates.length === 0 ? "bg-muted/30 cursor-not-allowed" : "bg-gradient-to-r from-neon-pink to-accent hover:opacity-90 neon-glow-pink"
              )}>
              {batchLoading ? <><Loader2 className="w-4 h-4 animate-spin" />Генерирую...</> : <><FlaskConical className="w-4 h-4" />A/B Тест: {selectedTemplates.length + (customPrompt.trim() ? 1 : 0)} вар.</>}
            </button>
            {error && <div className="p-3 bg-danger/10 border border-danger/30 rounded-lg text-danger text-sm flex items-start gap-2"><AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />{error}</div>}
          </div>

          {/* Results grid */}
          <div className="xl:col-span-2">
            {variants.length === 0 ? (
              <div className="bg-card border border-card-border rounded-xl p-12 flex flex-col items-center justify-center text-center">
                <Sparkles className="w-12 h-12 text-accent/30 mb-4" />
                <div className="text-sm font-medium text-muted">Выберите шаблоны и нажмите A/B Тест</div>
                <div className="text-xs text-muted/60 mt-2 max-w-sm">Генерирует несколько вариантов. Оценивайте 1-5 звёзд.</div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-semibold"><FlaskConical className="w-4 h-4 inline mr-1 text-neon-pink" />{variants.length} вариантов</h2>
                  {variants.some((v) => v.rating) && (
                    <div className="text-xs text-muted">Лучший: <span className="text-accent font-bold">{variants.reduce((b, v) => (v.rating || 0) > (b.rating || 0) ? v : b, variants[0]).promptName}</span></div>
                  )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {variants.map((v) => <VariantCard key={v.id} v={v} onRate={handleRate} onDelete={handleDeleteVariant} onDownload={handleDownload} loading={loading} />)}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ═══════ TAB: ANALYZE COMPETITOR ═══════ */}
      {tab === "analyze" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="bg-card border border-card-border rounded-xl p-5">
              <h2 className="text-sm font-semibold mb-3"><Search className="w-4 h-4 inline mr-1 text-neon-orange" />Загрузите обложку конкурента</h2>
              <input type="file" ref={analyzeInputRef} accept="image/*" onChange={handleAnalyzeUpload} className="hidden" />
              {analyzeImage ? (
                <div className="space-y-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={analyzeImage} alt="Competitor" className="w-full rounded-lg border border-card-border" />
                  <div className="flex gap-2">
                    <button onClick={() => analyzeInputRef.current?.click()} className="flex-1 py-2 rounded-lg bg-input-bg border border-input-border text-muted text-xs hover:text-foreground">Другое изображение</button>
                    <button onClick={() => { setAnalyzeImage(null); setAnalysisResult(null); }} className="px-3 py-2 rounded-lg bg-danger/10 text-danger text-xs"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                </div>
              ) : (
                <button onClick={() => analyzeInputRef.current?.click()}
                  className="w-full py-10 rounded-lg border-2 border-dashed border-card-border text-muted hover:border-neon-orange/40 transition-colors flex flex-col items-center gap-2">
                  <Upload className="w-8 h-8" />
                  <span className="text-xs">Загрузите скриншот обложки конкурента</span>
                  <span className="text-[10px] opacity-60">PNG, JPG, WebP</span>
                </button>
              )}
            </div>

            {analyzeImage && (
              <button onClick={handleAnalyze} disabled={analyzing}
                className={cn("w-full py-3 rounded-lg font-semibold text-white flex items-center justify-center gap-2 transition-all",
                  analyzing ? "bg-muted/30 cursor-not-allowed" : "bg-gradient-to-r from-neon-orange to-accent hover:opacity-90"
                )}>
                {analyzing ? <><Loader2 className="w-4 h-4 animate-spin" />GPT-4o анализирует...</> : <><Wand2 className="w-4 h-4" />Анализировать обложку</>}
              </button>
            )}

            {analyzeError && <div className="p-3 bg-danger/10 border border-danger/30 rounded-lg text-danger text-sm"><AlertCircle className="w-4 h-4 inline mr-1" />{analyzeError}</div>}

            <div className="bg-card border border-card-border rounded-xl p-4 text-[11px] text-muted">
              <strong>Как работает:</strong> GPT-4o Vision анализирует обложку → разбивает на: композицию, цвета, свет, настроение, элементы → генерирует промпт для воссоздания похожей обложки.
            </div>
          </div>

          {/* Analysis results */}
          <div>
            {analysisResult ? (
              <div className="space-y-4">
                <div className="bg-card border border-card-border rounded-xl p-5">
                  <h3 className="text-sm font-semibold mb-3 text-neon-orange">Анализ обложки</h3>
                  <div className="space-y-2.5">
                    {Object.entries(analysisResult.analysis).map(([key, val]) => (
                      <div key={key}>
                        <div className="text-[10px] text-accent uppercase tracking-wider">{
                          { composition: "Композиция", colors: "Цвета", lighting: "Освещение", mood: "Настроение", elements: "Элементы", style: "Стиль", whatWorks: "Почему работает" }[key] || key
                        }</div>
                        <p className="text-xs text-foreground/80 mt-0.5">{val}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-card border border-accent/30 rounded-xl p-5">
                  <h3 className="text-sm font-semibold mb-2 text-accent">Сгенерированный промпт</h3>
                  <pre className="text-xs text-foreground/80 bg-background rounded-lg p-3 whitespace-pre-wrap max-h-40 overflow-y-auto">{analysisResult.generatedPrompt}</pre>
                  <div className="flex gap-2 mt-3">
                    <button onClick={handleGenerateFromAnalysis} disabled={batchLoading}
                      className="flex-1 py-2.5 rounded-lg bg-accent text-white text-xs font-medium flex items-center justify-center gap-1.5 hover:bg-accent-hover transition-colors">
                      <Sparkles className="w-3.5 h-3.5" />Сгенерировать обложку
                    </button>
                    <button onClick={handleSaveAnalysisAsTemplate}
                      className="px-4 py-2.5 rounded-lg bg-neon-green/10 text-neon-green text-xs font-medium flex items-center gap-1.5 hover:bg-neon-green/20 transition-colors">
                      <Save className="w-3.5 h-3.5" />В шаблоны
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-card border border-card-border rounded-xl p-12 flex flex-col items-center justify-center text-center h-full">
                <Search className="w-12 h-12 text-neon-orange/20 mb-4" />
                <div className="text-sm text-muted">Загрузите обложку и нажмите &ldquo;Анализировать&rdquo;</div>
                <div className="text-xs text-muted/60 mt-2">AI разберёт стиль и создаст промпт для клонирования</div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ═══════ TAB: TEMPLATES ═══════ */}
      {tab === "templates" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Template list */}
          <div className="lg:col-span-1 space-y-4">
            <div className="flex gap-1 flex-wrap">
              {(["all", "thumbnail", "short", "longform", "reel", "post"] as const).map((cat) => (
                <button key={cat} onClick={() => setTemplateFilter(cat)}
                  className={cn("px-2.5 py-1 rounded-full text-[10px] border transition-all",
                    templateFilter === cat ? "border-accent bg-accent-dim text-foreground" : "border-card-border text-muted"
                  )}>{cat === "all" ? "Все" : PROMPT_CATEGORY_LABELS[cat]}</button>
              ))}
            </div>

            <div className="space-y-1.5 max-h-[500px] overflow-y-auto">
              {filteredTemplates.map((t) => (
                <button key={t.id} onClick={() => setEditingTemplate({ ...t })}
                  className={cn("w-full text-left p-3 rounded-lg border transition-all text-xs",
                    editingTemplate?.id === t.id ? "border-accent bg-accent-dim" : "border-card-border hover:border-accent/30"
                  )}>
                  <div className="flex items-center justify-between">
                    <span className="font-semibold">{t.name}</span>
                    <span className={cn("text-[9px] px-1.5 py-0.5 rounded",
                      t.isBuiltIn ? "bg-muted/20 text-muted" : "bg-neon-green/20 text-neon-green"
                    )}>{t.isBuiltIn ? "встроенный" : "свой"}</span>
                  </div>
                  <div className="text-[10px] opacity-60 mt-0.5">{PROMPT_CATEGORY_LABELS[t.category]} · {t.description}</div>
                </button>
              ))}
            </div>

            <button onClick={handleNewTemplate}
              className="w-full py-2.5 rounded-lg border-2 border-dashed border-card-border text-muted text-xs hover:border-accent/40 transition-colors flex items-center justify-center gap-1.5">
              <Plus className="w-4 h-4" />Новый шаблон
            </button>
          </div>

          {/* Template editor */}
          <div className="lg:col-span-2">
            {editingTemplate ? (
              <div className="bg-card border border-card-border rounded-xl p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold"><Pencil className="w-4 h-4 inline mr-1 text-accent" />Редактирование шаблона</h3>
                  {!editingTemplate.isBuiltIn && (
                    <button onClick={() => { deleteTemplate(editingTemplate.id); setEditingTemplate(null); }}
                      className="text-xs text-danger flex items-center gap-1"><Trash2 className="w-3.5 h-3.5" />Удалить</button>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-muted block mb-1">Название</label>
                    <input value={editingTemplate.name}
                      onChange={(e) => setEditingTemplate({ ...editingTemplate, name: e.target.value })}
                      className="w-full bg-input-bg border border-input-border rounded-lg p-2.5 text-foreground text-sm focus:outline-none focus:border-accent" />
                  </div>
                  <div>
                    <label className="text-xs text-muted block mb-1">Категория</label>
                    <select value={editingTemplate.category}
                      onChange={(e) => setEditingTemplate({ ...editingTemplate, category: e.target.value as PromptCategory })}
                      className="w-full bg-input-bg border border-input-border rounded-lg p-2.5 text-foreground text-sm focus:outline-none focus:border-accent">
                      {Object.entries(PROMPT_CATEGORY_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-xs text-muted block mb-1">Описание</label>
                  <input value={editingTemplate.description}
                    onChange={(e) => setEditingTemplate({ ...editingTemplate, description: e.target.value })}
                    className="w-full bg-input-bg border border-input-border rounded-lg p-2.5 text-foreground text-sm focus:outline-none focus:border-accent" />
                </div>

                <div>
                  <label className="text-xs text-muted block mb-1">Промпт</label>
                  <textarea value={editingTemplate.prompt}
                    onChange={(e) => setEditingTemplate({ ...editingTemplate, prompt: e.target.value })}
                    className="w-full bg-input-bg border border-input-border rounded-lg p-3 text-foreground text-xs font-mono resize-none focus:outline-none focus:border-accent"
                    rows={12} />
                  <div className="flex flex-wrap gap-2 mt-1.5">
                    <span className="text-[10px] text-muted">Переменные:</span>
                    {["{topic}", "{color}", "{emotion}", "{brand}", "{handle}"].map((v) => (
                      <span key={v} className="text-[10px] text-accent bg-accent/10 px-1.5 py-0.5 rounded">{v}</span>
                    ))}
                  </div>
                </div>

                <button onClick={handleSaveEditingTemplate}
                  className="w-full py-2.5 rounded-lg bg-accent text-white text-sm font-medium flex items-center justify-center gap-2 hover:bg-accent-hover transition-colors">
                  <Save className="w-4 h-4" />Сохранить шаблон
                </button>
              </div>
            ) : (
              <div className="bg-card border border-card-border rounded-xl p-12 flex flex-col items-center justify-center text-center h-full">
                <Pencil className="w-12 h-12 text-accent/20 mb-4" />
                <div className="text-sm text-muted">Выберите шаблон для редактирования</div>
                <div className="text-xs text-muted/60 mt-2 max-w-sm">
                  Редактируйте встроенные или создавайте свои шаблоны для обложек, скриптов, постов и reels.
                  Переменные: {"{topic}"}, {"{color}"}, {"{brand}"}, {"{handle}"}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
