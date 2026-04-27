"use client";

import { useState, useEffect, useRef } from "react";
import { v4 as uuidv4 } from "uuid";
import {
  Sparkles,
  Loader2,
  Copy,
  Check,
  RefreshCw,
  ChevronDown,
  CheckCircle2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  ContentFormat,
  ContentItem,
  FORMAT_LABELS,
  GenerateResponse,
} from "@/lib/types";
import { useContent } from "@/lib/ContentContext";

const QUICK_TOPICS = [
  "AI написал код за 30 секунд",
  "Промпт, который заменяет 2 часа работы",
  "Почему AI-агенты — это не ChatGPT",
  "Мой рабочий стек за $2000",
  "Vibe Coding: как я строю SaaS голосом",
  "5 AI-инструментов, которые я использую каждый день",
  "Сколько я трачу на AI в месяц",
  "Hackintosh в 2026 — кому и зачем",
  "Один факт про AI, который тебя удивит",
  "Код ДО AI vs ПОСЛЕ",
];

export default function Generator() {
  const { addItem, settings, templates } = useContent();
  const [topic, setTopic] = useState("");
  const [format, setFormat] = useState<ContentFormat>("short");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<GenerateResponse | null>(null);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState<string | null>(null);
  const [savedId, setSavedId] = useState<string | null>(null);

  // Pick up prefilled topic + format from IdeasBank
  useEffect(() => {
    const prefill = sessionStorage.getItem("itoq_prefill_topic");
    if (prefill) {
      setTopic(prefill);
      sessionStorage.removeItem("itoq_prefill_topic");
    }
    const prefillFmt = sessionStorage.getItem("itoq_prefill_format");
    if (prefillFmt && ["short", "longform", "reel", "post"].includes(prefillFmt)) {
      setFormat(prefillFmt as ContentFormat);
      sessionStorage.removeItem("itoq_prefill_format");
    }
  }, []);

  // Auto-save when result arrives — use ref for format to avoid stale closure
  const formatRef = useRef(format);
  formatRef.current = format;

  useEffect(() => {
    if (result && !savedId) {
      const id = uuidv4();
      const item: ContentItem = {
        id,
        title: result.title,
        hook: result.hook,
        script: result.script,
        description: result.description,
        hashtags: result.hashtags,
        format: formatRef.current,
        status: "scripted",
        platforms: [],
        duration: result.duration,
        notes: "",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      addItem(item);
      setSavedId(id);
    }
  }, [result, addItem, savedId]);

  async function handleGenerate() {
    if (!topic.trim()) return;
    setLoading(true);
    setError("");
    setResult(null);
    setSavedId(null);

    try {
      // Find matching user-editable content template
      const formatToCategory: Record<string, string> = { short: "short", longform: "longform", reel: "reel", post: "post" };
      const cat = formatToCategory[format] || "short";
      const tpl = templates.find((t) => t.category === cat);
      let customPrompt: string | undefined;
      if (tpl) {
        customPrompt = tpl.prompt
          .replace(/{topic}/g, topic.trim())
          .replace(/{brand}/g, settings.brandName)
          .replace(/{handle}/g, settings.brandHandle);
      }

      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: topic.trim(),
          format,
          apiKey: settings.llmProvider === "openrouter" ? settings.openrouterApiKey : settings.openaiApiKey,
          model: settings.llmModel,
          provider: settings.llmProvider,
          customPrompt,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Ошибка генерации");
        return;
      }
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка сети");
    } finally {
      setLoading(false);
    }
  }

  function handleCopy(text: string, field: string) {
    navigator.clipboard.writeText(text);
    setCopied(field);
    setTimeout(() => setCopied(null), 2000);
  }

  function CopyButton({ text, field }: { text: string; field: string }) {
    return (
      <button
        onClick={() => handleCopy(text, field)}
        className="p-1.5 rounded-md hover:bg-card-border transition-colors"
        title="Копировать"
      >
        {copied === field ? (
          <Check className="w-3.5 h-3.5 text-success" />
        ) : (
          <Copy className="w-3.5 h-3.5 text-muted" />
        )}
      </button>
    );
  }

  return (
    <div className="animate-slide-in max-w-4xl">
      <h1 className="text-2xl font-bold mb-6">
        <Sparkles className="w-6 h-6 text-accent inline mr-2" />
        AI Генератор контента
      </h1>

      {/* Input area */}
      <div className="bg-card border border-card-border rounded-xl p-5 mb-6">
        <label className="block text-sm font-medium text-muted mb-2">
          Тема / идея
        </label>
        <textarea
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          placeholder="Опишите тему для видео... Например: как AI пишет код быстрее джуна"
          className="w-full bg-input-bg border border-input-border rounded-lg p-3 text-foreground placeholder:text-muted/50 resize-none h-24 focus:outline-none focus:border-accent transition-colors"
        />

        {/* Quick topics */}
        <div className="mt-3">
          <div className="text-xs text-muted mb-2 flex items-center gap-1">
            <ChevronDown className="w-3 h-3" />
            Быстрые темы
          </div>
          <div className="flex flex-wrap gap-2">
            {QUICK_TOPICS.map((t) => (
              <button
                key={t}
                onClick={() => setTopic(t)}
                className="text-xs px-2.5 py-1.5 rounded-full bg-input-bg border border-input-border text-muted hover:text-foreground hover:border-accent/40 transition-colors"
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Format selector */}
        <div className="mt-4 flex items-center gap-3">
          <label className="text-sm text-muted">Формат:</label>
          <div className="flex gap-2">
            {(Object.keys(FORMAT_LABELS) as ContentFormat[]).map((f) => (
              <button
                key={f}
                onClick={() => setFormat(f)}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-sm transition-all",
                  format === f
                    ? "bg-accent text-white"
                    : "bg-input-bg border border-input-border text-muted hover:text-foreground"
                )}
              >
                {FORMAT_LABELS[f]}
              </button>
            ))}
          </div>
        </div>

        {/* Generate button */}
        <button
          onClick={handleGenerate}
          disabled={loading || !topic.trim()}
          className={cn(
            "mt-4 w-full py-3 rounded-lg font-semibold text-white transition-all flex items-center justify-center gap-2",
            loading || !topic.trim()
              ? "bg-muted/30 cursor-not-allowed"
              : "bg-accent hover:bg-accent-hover neon-glow"
          )}
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Генерирую...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              Сгенерировать
            </>
          )}
        </button>

        {error && (
          <div className="mt-3 p-3 bg-danger/10 border border-danger/30 rounded-lg text-danger text-sm">
            {error}
          </div>
        )}
      </div>

      {/* Result */}
      {result && (
        <div className="space-y-4 animate-slide-in">
          {/* Auto-save banner */}
          {savedId && (
            <div className="flex items-center gap-2 p-3 bg-success/10 border border-success/30 rounded-xl text-success text-sm">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              <span>Автоматически сохранено в контент-план</span>
            </div>
          )}

          {/* Title */}
          <div className="bg-card border border-card-border rounded-xl p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-accent uppercase tracking-wider">
                Заголовок
              </span>
              <CopyButton text={result.title} field="title" />
            </div>
            <div className="text-lg font-bold">{result.title}</div>
          </div>

          {/* Hook */}
          <div className="bg-card border border-neon-pink/30 rounded-xl p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-neon-pink uppercase tracking-wider">
                Хук (первые 2 секунды)
              </span>
              <CopyButton text={result.hook} field="hook" />
            </div>
            <div className="text-base font-semibold text-neon-pink">
              &ldquo;{result.hook}&rdquo;
            </div>
          </div>

          {/* Script */}
          <div className="bg-card border border-card-border rounded-xl p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-neon-green uppercase tracking-wider">
                Сценарий
              </span>
              <CopyButton text={result.script} field="script" />
            </div>
            <div className="text-sm whitespace-pre-wrap leading-relaxed font-mono bg-input-bg rounded-lg p-4 max-h-80 overflow-y-auto">
              {result.script}
            </div>
          </div>

          {/* Description */}
          <div className="bg-card border border-card-border rounded-xl p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-neon-orange uppercase tracking-wider">
                Описание для публикации
              </span>
              <CopyButton text={result.description} field="description" />
            </div>
            <div className="text-sm whitespace-pre-wrap">{result.description}</div>
          </div>

          {/* Hashtags */}
          <div className="bg-card border border-card-border rounded-xl p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-accent uppercase tracking-wider">
                Хэштеги
              </span>
              <CopyButton
                text={result.hashtags.map((h) => `#${h}`).join(" ")}
                field="hashtags"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              {result.hashtags.map((tag) => (
                <span
                  key={tag}
                  className="text-sm px-2.5 py-1 rounded-full bg-accent-dim text-accent"
                >
                  #{tag}
                </span>
              ))}
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex gap-3">
            <button
              onClick={handleGenerate}
              className="flex-1 px-4 py-3 rounded-lg bg-input-bg border border-input-border text-muted hover:text-foreground transition-colors flex items-center justify-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Перегенерировать
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
