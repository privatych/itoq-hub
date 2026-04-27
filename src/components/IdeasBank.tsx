"use client";

import { useState } from "react";
import { v4 as uuidv4 } from "uuid";
import {
  Lightbulb, Plus, Trash2, Tag, Flame, Archive, Filter,
  Sparkles, ArrowRight, Loader2, X, Wand2, Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useContent } from "@/lib/ContentContext";
import {
  Idea, IdeaPriority, IdeaSource,
  IDEA_PRIORITY_LABELS, IDEA_SOURCE_LABELS,
  FORMAT_LABELS, ContentFormat,
} from "@/lib/types";
import type { View } from "./Sidebar";

interface IdeaExpansion {
  expandedTitle: string;
  hook: string;
  keyPoints: string[];
  targetAudience: string;
  viralPotential: string;
  suggestedFormats: string[];
  similarTrends: string;
  uniqueAngle: string;
}

const PRIORITY_COLORS: Record<IdeaPriority, string> = {
  hot: "text-red-400 bg-red-400/10 border-red-400/30",
  normal: "text-accent bg-accent/10 border-accent/30",
  backlog: "text-muted bg-muted/10 border-muted/30",
};

const SOURCE_ICONS: Record<IdeaSource, React.ReactNode> = {
  trend: <Flame className="w-3 h-3" />,
  ai: <Sparkles className="w-3 h-3" />,
  competitor: <Filter className="w-3 h-3" />,
  personal: <Lightbulb className="w-3 h-3" />,
  audience: <Tag className="w-3 h-3" />,
};

interface IdeasBankProps {
  onNavigate: (view: View) => void;
}

export default function IdeasBank({ onNavigate }: IdeasBankProps) {
  const { ideas, addIdea, updateIdea, deleteIdea, settings } = useContent();
  const [newText, setNewText] = useState("");
  const [newPriority, setNewPriority] = useState<IdeaPriority>("normal");
  const [newSource, setNewSource] = useState<IdeaSource>("personal");
  const [newTags, setNewTags] = useState("");
  const [filterPriority, setFilterPriority] = useState<IdeaPriority | "all">("all");
  const [filterSource, setFilterSource] = useState<IdeaSource | "all">("all");
  const [selectedIdea, setSelectedIdea] = useState<string | null>(null);
  const [expansion, setExpansion] = useState<IdeaExpansion | null>(null);
  const [expanding, setExpanding] = useState(false);
  const [expandError, setExpandError] = useState("");

  function handleAdd() {
    if (!newText.trim()) return;
    const idea: Idea = {
      id: uuidv4(),
      text: newText.trim(),
      tags: newTags.split(",").map((t) => t.trim()).filter(Boolean),
      priority: newPriority,
      source: newSource,
      createdAt: new Date().toISOString(),
    };
    addIdea(idea);
    setNewText("");
    setNewTags("");
  }

  function cyclePriority(id: string, current: IdeaPriority) {
    const cycle: IdeaPriority[] = ["hot", "normal", "backlog"];
    const next = cycle[(cycle.indexOf(current) + 1) % cycle.length];
    updateIdea(id, { priority: next });
  }

  async function handleExpand(idea: Idea) {
    setSelectedIdea(idea.id);
    setExpansion(null);
    setExpanding(true);
    setExpandError("");

    const apiKey = settings.llmProvider === "openrouter" ? settings.openrouterApiKey : settings.openaiApiKey;
    if (!apiKey) { setExpandError("API ключ не настроен. Перейдите в Настройки."); setExpanding(false); return; }

    try {
      const res = await fetch("/api/expand-idea", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ideaText: idea.text,
          tags: idea.tags,
          apiKey,
          provider: settings.llmProvider,
          model: settings.llmModel,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setExpandError(data.error || "Ошибка AI"); return; }
      setExpansion(data);
    } catch (err) {
      setExpandError(err instanceof Error ? err.message : "Ошибка сети");
    } finally {
      setExpanding(false);
    }
  }

  function handleCreateContent(idea: Idea) {
    // Store idea text + suggested format in sessionStorage for Generator to pick up
    sessionStorage.setItem("itoq_prefill_topic", expansion?.expandedTitle || idea.text);
    // Map suggested format to ContentFormat if available
    if (expansion?.suggestedFormats?.length) {
      const fmt = expansion.suggestedFormats[0].toLowerCase();
      const mapped = fmt.includes("short") ? "short"
        : fmt.includes("long") ? "longform"
        : fmt.includes("reel") ? "reel"
        : fmt.includes("post") || fmt.includes("пост") ? "post"
        : null;
      if (mapped) sessionStorage.setItem("itoq_prefill_format", mapped);
    }
    updateIdea(idea.id, { usedInContentId: "pending" });
    onNavigate("generator");
  }

  const filtered = ideas.filter((i) => {
    if (filterPriority !== "all" && i.priority !== filterPriority) return false;
    if (filterSource !== "all" && i.source !== filterSource) return false;
    return true;
  });

  const hotCount = ideas.filter((i) => i.priority === "hot").length;
  const totalCount = ideas.length;
  const usedCount = ideas.filter((i) => i.usedInContentId).length;
  const selected = selectedIdea ? ideas.find((i) => i.id === selectedIdea) : null;

  return (
    <div className="animate-slide-in">
      <h1 className="text-2xl font-bold mb-1">
        <Lightbulb className="w-6 h-6 text-yellow-400 inline mr-2" />
        Банк идей
      </h1>
      <p className="text-xs text-muted mb-6">{totalCount} идей · {hotCount} горящих · {usedCount} использовано</p>

      {/* Quick add */}
      <div className="bg-card border border-card-border rounded-xl p-4 mb-6">
        <div className="flex gap-2 mb-3">
          <input
            value={newText}
            onChange={(e) => setNewText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAdd()}
            className="flex-1 bg-input-bg border border-input-border rounded-lg p-3 text-foreground text-sm focus:outline-none focus:border-accent"
            placeholder="Быстрая идея... (Enter для добавления)"
          />
          <button
            onClick={handleAdd}
            disabled={!newText.trim()}
            className={cn(
              "px-4 rounded-lg font-medium text-white text-sm flex items-center gap-1.5 transition-all",
              newText.trim() ? "bg-accent hover:bg-accent-hover" : "bg-muted/30 cursor-not-allowed"
            )}
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        <div className="flex gap-2 flex-wrap items-center">
          <div className="flex gap-1">
            {(Object.keys(IDEA_PRIORITY_LABELS) as IdeaPriority[]).map((p) => (
              <button key={p} onClick={() => setNewPriority(p)}
                className={cn("px-2 py-0.5 rounded-full text-[10px] border transition-all",
                  newPriority === p ? PRIORITY_COLORS[p] : "border-card-border text-muted"
                )}>{IDEA_PRIORITY_LABELS[p]}</button>
            ))}
          </div>
          <div className="w-px h-4 bg-card-border" />
          <div className="flex gap-1">
            {(Object.keys(IDEA_SOURCE_LABELS) as IdeaSource[]).map((s) => (
              <button key={s} onClick={() => setNewSource(s)}
                className={cn("px-2 py-0.5 rounded-full text-[10px] border flex items-center gap-0.5 transition-all",
                  newSource === s ? "border-accent bg-accent-dim text-foreground" : "border-card-border text-muted"
                )}>{SOURCE_ICONS[s]}{IDEA_SOURCE_LABELS[s]}</button>
            ))}
          </div>
          <div className="w-px h-4 bg-card-border" />
          <input
            value={newTags}
            onChange={(e) => setNewTags(e.target.value)}
            className="bg-input-bg border border-input-border rounded-lg px-2 py-1 text-[10px] text-foreground w-32 focus:outline-none focus:border-accent"
            placeholder="теги через ,"
          />
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-4 flex-wrap">
        <span className="text-xs text-muted py-1">Фильтр:</span>
        <button onClick={() => setFilterPriority("all")}
          className={cn("px-2 py-0.5 rounded-full text-[10px] border", filterPriority === "all" ? "border-accent bg-accent-dim text-foreground" : "border-card-border text-muted")}>Все</button>
        {(Object.keys(IDEA_PRIORITY_LABELS) as IdeaPriority[]).map((p) => (
          <button key={p} onClick={() => setFilterPriority(p)}
            className={cn("px-2 py-0.5 rounded-full text-[10px] border", filterPriority === p ? PRIORITY_COLORS[p] : "border-card-border text-muted")}>{IDEA_PRIORITY_LABELS[p]}</button>
        ))}
        <div className="w-px h-4 bg-card-border self-center" />
        <button onClick={() => setFilterSource("all")}
          className={cn("px-2 py-0.5 rounded-full text-[10px] border", filterSource === "all" ? "border-accent bg-accent-dim text-foreground" : "border-card-border text-muted")}>Все источники</button>
        {(Object.keys(IDEA_SOURCE_LABELS) as IdeaSource[]).map((s) => (
          <button key={s} onClick={() => setFilterSource(s)}
            className={cn("px-2 py-0.5 rounded-full text-[10px] border flex items-center gap-0.5",
              filterSource === s ? "border-accent bg-accent-dim text-foreground" : "border-card-border text-muted"
            )}>{SOURCE_ICONS[s]}{IDEA_SOURCE_LABELS[s]}</button>
        ))}
      </div>

      <div className={cn("grid gap-6", selected ? "grid-cols-1 lg:grid-cols-2" : "grid-cols-1")}>
        {/* Ideas list */}
        <div>
          {filtered.length === 0 ? (
            <div className="bg-card border border-card-border rounded-xl p-12 text-center">
              <Lightbulb className="w-10 h-10 text-yellow-400/20 mx-auto mb-3" />
              <p className="text-sm text-muted">Нет идей. Добавьте первую!</p>
              <p className="text-xs text-muted/60 mt-1">Утренний мониторинг → 2-3 идеи в банк каждый день</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filtered.map((idea) => (
                <div key={idea.id} className={cn(
                  "bg-card border rounded-xl p-3 flex items-start gap-3 group transition-all cursor-pointer",
                  idea.usedInContentId ? "border-neon-green/30 opacity-60" : "border-card-border",
                  selectedIdea === idea.id && "border-accent ring-1 ring-accent/30"
                )}
                  onClick={() => { setSelectedIdea(idea.id === selectedIdea ? null : idea.id); setExpansion(null); setExpandError(""); }}
                >
                  {/* Priority badge */}
                  <button onClick={(e) => { e.stopPropagation(); cyclePriority(idea.id, idea.priority); }}
                    className={cn("px-2 py-0.5 rounded-full text-[10px] border flex-shrink-0 mt-0.5 transition-all", PRIORITY_COLORS[idea.priority])}
                    title="Клик: сменить приоритет"
                  >
                    {idea.priority === "hot" ? <Flame className="w-3 h-3 inline" /> : idea.priority === "backlog" ? <Archive className="w-3 h-3 inline" /> : null}
                    {IDEA_PRIORITY_LABELS[idea.priority]}
                  </button>

                  <div className="flex-1 min-w-0">
                    <p className="text-sm">{idea.text}</p>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <span className="text-[10px] text-muted flex items-center gap-0.5">
                        {SOURCE_ICONS[idea.source]}{IDEA_SOURCE_LABELS[idea.source]}
                      </span>
                      {idea.format && <span className="text-[10px] text-accent">{FORMAT_LABELS[idea.format]}</span>}
                      {idea.tags.map((t) => (
                        <span key={t} className="text-[10px] text-muted bg-muted/10 px-1.5 py-0.5 rounded">#{t}</span>
                      ))}
                      <span className="text-[9px] text-muted/40">{new Date(idea.createdAt).toLocaleDateString("ru")}</span>
                    </div>
                  </div>

                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={(e) => { e.stopPropagation(); if (!confirm("Удалить эту идею?")) return; deleteIdea(idea.id); if (selectedIdea === idea.id) setSelectedIdea(null); }}
                      className="p-1.5 rounded-lg text-danger hover:bg-danger/10">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Detail / AI panel */}
        {selected && (
          <div className="space-y-4 animate-slide-in">
            {/* Selected idea header */}
            <div className="bg-card border border-card-border rounded-xl p-4">
              <div className="flex items-start justify-between mb-3">
                <h3 className="text-sm font-semibold flex-1">{selected.text}</h3>
                <button onClick={() => setSelectedIdea(null)} className="p-1 text-muted hover:text-foreground">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="flex gap-2 flex-wrap mb-4">
                <span className={cn("px-2 py-0.5 rounded-full text-[10px] border", PRIORITY_COLORS[selected.priority])}>
                  {IDEA_PRIORITY_LABELS[selected.priority]}
                </span>
                <span className="text-[10px] text-muted flex items-center gap-0.5">
                  {SOURCE_ICONS[selected.source]}{IDEA_SOURCE_LABELS[selected.source]}
                </span>
                {selected.tags.map((t) => (
                  <span key={t} className="text-[10px] text-muted bg-muted/10 px-1.5 py-0.5 rounded">#{t}</span>
                ))}
              </div>

              {/* Action buttons */}
              <div className="flex gap-2">
                <button
                  onClick={() => handleExpand(selected)}
                  disabled={expanding}
                  className="flex-1 py-2.5 rounded-lg bg-accent/20 text-accent text-xs font-medium flex items-center justify-center gap-1.5 hover:bg-accent/30 transition-colors disabled:opacity-50"
                >
                  {expanding ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Wand2 className="w-3.5 h-3.5" />}
                  {expanding ? "AI думает..." : "AI: Развернуть идею"}
                </button>
                <button
                  onClick={() => handleCreateContent(selected)}
                  className="flex-1 py-2.5 rounded-lg bg-neon-green/20 text-neon-green text-xs font-medium flex items-center justify-center gap-1.5 hover:bg-neon-green/30 transition-colors"
                >
                  <Zap className="w-3.5 h-3.5" />
                  Создать контент
                </button>
              </div>

              {expandError && (
                <div className="mt-3 p-2 bg-danger/10 border border-danger/30 rounded-lg text-danger text-xs">{expandError}</div>
              )}
            </div>

            {/* AI Expansion result */}
            {expansion && (
              <div className="space-y-3 animate-slide-in">
                <div className="bg-card border border-accent/20 rounded-xl p-4">
                  <h4 className="text-xs text-accent uppercase tracking-wider font-semibold mb-2">Заголовок</h4>
                  <p className="text-sm font-semibold">{expansion.expandedTitle}</p>
                </div>

                <div className="bg-card border border-neon-pink/20 rounded-xl p-4">
                  <h4 className="text-xs text-neon-pink uppercase tracking-wider font-semibold mb-2">Хук (первые 2 секунды)</h4>
                  <p className="text-sm font-medium text-neon-pink">&ldquo;{expansion.hook}&rdquo;</p>
                </div>

                <div className="bg-card border border-card-border rounded-xl p-4">
                  <h4 className="text-xs text-neon-green uppercase tracking-wider font-semibold mb-2">Ключевые тезисы</h4>
                  <ul className="space-y-1.5">
                    {expansion.keyPoints.map((point, i) => (
                      <li key={i} className="text-xs flex gap-2">
                        <span className="text-accent font-bold">{i + 1}.</span>
                        <span>{point}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-card border border-card-border rounded-xl p-3">
                    <h4 className="text-[10px] text-muted uppercase tracking-wider font-semibold mb-1">Целевая аудитория</h4>
                    <p className="text-xs">{expansion.targetAudience}</p>
                  </div>
                  <div className="bg-card border border-card-border rounded-xl p-3">
                    <h4 className="text-[10px] text-muted uppercase tracking-wider font-semibold mb-1">Виральность</h4>
                    <p className="text-xs">{expansion.viralPotential}</p>
                  </div>
                </div>

                <div className="bg-card border border-card-border rounded-xl p-4">
                  <h4 className="text-xs text-muted uppercase tracking-wider font-semibold mb-2">Похожие тренды</h4>
                  <p className="text-xs text-muted">{expansion.similarTrends}</p>
                </div>

                <div className="bg-card border border-neon-orange/20 rounded-xl p-4">
                  <h4 className="text-xs text-neon-orange uppercase tracking-wider font-semibold mb-2">Наш уникальный угол</h4>
                  <p className="text-xs">{expansion.uniqueAngle}</p>
                </div>

                {expansion.suggestedFormats.length > 0 && (
                  <div className="flex gap-2 items-center">
                    <span className="text-[10px] text-muted">Форматы:</span>
                    {expansion.suggestedFormats.map((f) => (
                      <span key={f} className="text-[10px] px-2 py-0.5 rounded-full bg-accent-dim text-accent border border-accent/20">
                        {FORMAT_LABELS[f as ContentFormat] || f}
                      </span>
                    ))}
                  </div>
                )}

                <button
                  onClick={() => handleCreateContent(selected)}
                  className="w-full py-3 rounded-lg bg-gradient-to-r from-accent to-neon-green text-white text-sm font-semibold flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
                >
                  <ArrowRight className="w-4 h-4" />
                  Создать контент из этой идеи
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
