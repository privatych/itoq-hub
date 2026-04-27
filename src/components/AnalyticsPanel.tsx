"use client";

import { useState } from "react";
import { v4 as uuidv4 } from "uuid";
import {
  BarChart3, TrendingUp, Plus, Save, ChevronDown, ChevronUp,
  Send, Users, Play,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useContent } from "@/lib/ContentContext";
import { WeeklyStats, PlatformStats } from "@/lib/types";

const EMPTY_PLATFORM: PlatformStats = { youtube: 0, tiktok: 0, instagram: 0, telegram: 0, x: 0 };

function emptyStats(weekNum: number): WeeklyStats {
  return {
    id: uuidv4(),
    weekNumber: weekNum,
    weekLabel: `Неделя ${weekNum}`,
    date: new Date().toISOString().split("T")[0],
    shortsPublished: 0,
    longformPublished: 0,
    avgViews: 0,
    bestShortsViews: 0,
    bestShortsTitle: "",
    avgRetention: 0,
    subscribers: { ...EMPTY_PLATFORM },
    engagement: { commentsReceived: 0, commentsLeft: 0, dmRequests: 0 },
    hoursContent: 0,
    hoursDistribution: 0,
    insight: "",
  };
}

/* ===== Mini bar chart (pure SVG) ===== */
function MiniChart({ data, color, label }: { data: number[]; color: string; label: string }) {
  if (data.length === 0) return null;
  const max = Math.max(...data, 1);
  const w = 200;
  const h = 60;
  const barW = Math.max(6, (w - data.length * 2) / data.length);

  return (
    <div>
      <div className="text-[10px] text-muted mb-1">{label}</div>
      <svg width={w} height={h} className="overflow-visible">
        {data.map((v, i) => {
          const barH = (v / max) * (h - 10);
          return (
            <g key={i}>
              <rect
                x={i * (barW + 2)}
                y={h - barH}
                width={barW}
                height={barH}
                rx={2}
                fill={color}
                opacity={0.8}
              />
              <text
                x={i * (barW + 2) + barW / 2}
                y={h - barH - 3}
                textAnchor="middle"
                className="text-[8px] fill-muted"
              >
                {v}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

/* ===== Growth line (subscribers) ===== */
function GrowthLine({ stats, platform, color }: { stats: WeeklyStats[]; platform: keyof PlatformStats; color: string }) {
  const data = stats.map((s) => s.subscribers[platform]);
  if (data.length < 2) return null;
  const cumulative: number[] = [];
  data.reduce((acc, v) => { cumulative.push(acc + v); return acc + v; }, 0);

  const max = Math.max(...cumulative, 1);
  const w = 200;
  const h = 50;
  const points = cumulative.map((v, i) => `${(i / (cumulative.length - 1)) * w},${h - (v / max) * (h - 5)}`).join(" ");

  return (
    <div>
      <svg width={w} height={h}>
        <polyline fill="none" stroke={color} strokeWidth="2" points={points} />
        {cumulative.map((v, i) => (
          <circle key={i} cx={(i / (cumulative.length - 1)) * w} cy={h - (v / max) * (h - 5)} r="3" fill={color} />
        ))}
      </svg>
      <div className="text-[10px] text-muted">Всего: +{cumulative[cumulative.length - 1] || 0}</div>
    </div>
  );
}

export default function AnalyticsPanel() {
  const { weeklyStats, addWeeklyStats, updateWeeklyStats, deleteWeeklyStats, items } = useContent();
  const [editing, setEditing] = useState<WeeklyStats | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);

  function handleAddWeek() {
    const nextNum = weeklyStats.length + 1;
    const s = emptyStats(nextNum);
    addWeeklyStats(s);
    setEditing(s);
  }

  function handleSaveEditing() {
    if (!editing) return;
    updateWeeklyStats(editing.id, editing);
    setEditing(null);
  }

  // Auto-calculated stats from content items
  const totalContent = items.length;
  const published = items.filter((i) => i.status === "published").length;
  const shorts = items.filter((i) => i.format === "short").length;
  const longform = items.filter((i) => i.format === "longform").length;

  // Subscriber totals
  const totalSubs: PlatformStats = weeklyStats.reduce(
    (acc, s) => ({
      youtube: acc.youtube + s.subscribers.youtube,
      tiktok: acc.tiktok + s.subscribers.tiktok,
      instagram: acc.instagram + s.subscribers.instagram,
      telegram: acc.telegram + s.subscribers.telegram,
      x: acc.x + s.subscribers.x,
    }),
    { ...EMPTY_PLATFORM }
  );

  return (
    <div className="animate-slide-in">
      <h1 className="text-2xl font-bold mb-6">
        <BarChart3 className="w-6 h-6 text-accent inline mr-2" />
        Аналитика и Рост
      </h1>

      {/* Overview cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {[
          { label: "Всего контента", value: totalContent, color: "text-accent" },
          { label: "Опубликовано", value: published, color: "text-neon-green" },
          { label: "Shorts", value: shorts, color: "text-neon-pink" },
          { label: "Long-form", value: longform, color: "text-neon-orange" },
        ].map((c) => (
          <div key={c.label} className="bg-card border border-card-border rounded-xl p-4 text-center">
            <div className={cn("text-2xl font-bold", c.color)}>{c.value}</div>
            <div className="text-[10px] text-muted mt-1">{c.label}</div>
          </div>
        ))}
      </div>

      {/* Subscriber growth */}
      {weeklyStats.length > 0 && (
        <div className="bg-card border border-card-border rounded-xl p-5 mb-6">
          <h2 className="text-sm font-semibold mb-4">
            <TrendingUp className="w-4 h-4 inline mr-1 text-neon-green" />
            Рост подписчиков (кумулятивный)
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {[
              { platform: "youtube" as const, label: "YouTube", color: "#FF0000", icon: <Play className="w-3.5 h-3.5" /> },
              { platform: "tiktok" as const, label: "TikTok", color: "#00F2EA", icon: null },
              { platform: "instagram" as const, label: "Instagram", color: "#E1306C", icon: null },
              { platform: "telegram" as const, label: "Telegram", color: "#0088CC", icon: <Send className="w-3.5 h-3.5" /> },
              { platform: "x" as const, label: "X", color: "#1DA1F2", icon: null },
            ].map((p) => (
              <div key={p.platform}>
                <div className="flex items-center gap-1 mb-1">
                  {p.icon || <Users className="w-3.5 h-3.5" />}
                  <span className="text-xs font-medium">{p.label}</span>
                  <span className="text-xs font-bold ml-auto" style={{ color: p.color }}>+{totalSubs[p.platform]}</span>
                </div>
                <GrowthLine stats={weeklyStats} platform={p.platform} color={p.color} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Charts: content production */}
      {weeklyStats.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-card border border-card-border rounded-xl p-4">
            <MiniChart data={weeklyStats.map((s) => s.shortsPublished)} color="var(--neon-pink)" label="Shorts / неделю" />
          </div>
          <div className="bg-card border border-card-border rounded-xl p-4">
            <MiniChart data={weeklyStats.map((s) => s.avgViews)} color="var(--accent)" label="Средн. просмотры" />
          </div>
          <div className="bg-card border border-card-border rounded-xl p-4">
            <MiniChart data={weeklyStats.map((s) => s.avgRetention)} color="var(--neon-green)" label="Удержание %" />
          </div>
        </div>
      )}

      {/* Weekly reports */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold">Еженедельные отчёты</h2>
          <button
            onClick={handleAddWeek}
            className="px-3 py-1.5 rounded-lg bg-accent text-white text-xs font-medium flex items-center gap-1.5 hover:bg-accent-hover transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />Добавить неделю
          </button>
        </div>

        {weeklyStats.length === 0 && (
          <div className="bg-card border border-card-border rounded-xl p-8 text-center">
            <BarChart3 className="w-10 h-10 text-accent/20 mx-auto mb-3" />
            <p className="text-sm text-muted">Нет данных. Добавьте первую неделю.</p>
            <p className="text-xs text-muted/60 mt-1">Формат как в /itoq/reports/weekly_template.md</p>
          </div>
        )}

        {[...weeklyStats].reverse().map((s) => (
          <div key={s.id} className="bg-card border border-card-border rounded-xl overflow-hidden">
            <button
              onClick={() => setExpanded(expanded === s.id ? null : s.id)}
              className="w-full p-4 flex items-center justify-between text-left"
            >
              <div>
                <span className="text-sm font-semibold">{s.weekLabel}</span>
                <span className="text-xs text-muted ml-3">{s.date}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-muted">{s.shortsPublished} shorts</span>
                <span className="text-xs text-neon-green">+{s.subscribers.youtube} YT</span>
                {expanded === s.id ? <ChevronUp className="w-4 h-4 text-muted" /> : <ChevronDown className="w-4 h-4 text-muted" />}
              </div>
            </button>

            {expanded === s.id && (
              <div className="border-t border-card-border p-4">
                {editing?.id === s.id ? (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <Field label="Неделя" value={editing.weekLabel} onChange={(v) => setEditing({ ...editing, weekLabel: v })} />
                      <Field label="Дата" value={editing.date} onChange={(v) => setEditing({ ...editing, date: v })} type="date" />
                      <NumField label="Shorts опубл." value={editing.shortsPublished} onChange={(v) => setEditing({ ...editing, shortsPublished: v })} />
                      <NumField label="Long-form опубл." value={editing.longformPublished} onChange={(v) => setEditing({ ...editing, longformPublished: v })} />
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <NumField label="Средн. просмотры" value={editing.avgViews} onChange={(v) => setEditing({ ...editing, avgViews: v })} />
                      <NumField label="Лучший Shorts views" value={editing.bestShortsViews} onChange={(v) => setEditing({ ...editing, bestShortsViews: v })} />
                      <NumField label="Удержание %" value={editing.avgRetention} onChange={(v) => setEditing({ ...editing, avgRetention: v })} />
                      <Field label="Лучший Shorts" value={editing.bestShortsTitle} onChange={(v) => setEditing({ ...editing, bestShortsTitle: v })} />
                    </div>

                    <h4 className="text-xs text-accent uppercase tracking-wider pt-2">Прирост подписчиков</h4>
                    <div className="grid grid-cols-5 gap-3">
                      {(["youtube", "tiktok", "instagram", "telegram", "x"] as const).map((p) => (
                        <NumField key={p} label={p} value={editing.subscribers[p]}
                          onChange={(v) => setEditing({ ...editing, subscribers: { ...editing.subscribers, [p]: v } })} />
                      ))}
                    </div>

                    <h4 className="text-xs text-accent uppercase tracking-wider pt-2">Engagement</h4>
                    <div className="grid grid-cols-3 gap-3">
                      <NumField label="Комментов получено" value={editing.engagement.commentsReceived}
                        onChange={(v) => setEditing({ ...editing, engagement: { ...editing.engagement, commentsReceived: v } })} />
                      <NumField label="Комментов оставлено" value={editing.engagement.commentsLeft}
                        onChange={(v) => setEditing({ ...editing, engagement: { ...editing.engagement, commentsLeft: v } })} />
                      <NumField label="DM/запросов" value={editing.engagement.dmRequests}
                        onChange={(v) => setEditing({ ...editing, engagement: { ...editing.engagement, dmRequests: v } })} />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <NumField label="Часов на контент" value={editing.hoursContent} onChange={(v) => setEditing({ ...editing, hoursContent: v })} />
                      <NumField label="Часов на дистрибуцию" value={editing.hoursDistribution} onChange={(v) => setEditing({ ...editing, hoursDistribution: v })} />
                    </div>

                    <Field label="Инсайт / Вывод" value={editing.insight} onChange={(v) => setEditing({ ...editing, insight: v })} />

                    <button onClick={handleSaveEditing} className="w-full py-2 rounded-lg bg-accent text-white text-xs font-medium flex items-center justify-center gap-1.5">
                      <Save className="w-3.5 h-3.5" />Сохранить
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                      <Stat label="Shorts" value={s.shortsPublished} />
                      <Stat label="Long-form" value={s.longformPublished} />
                      <Stat label="Средн. просмотры" value={s.avgViews} />
                      <Stat label="Удержание" value={`${s.avgRetention}%`} />
                    </div>
                    <div className="grid grid-cols-5 gap-2 text-xs">
                      {(["youtube", "tiktok", "instagram", "telegram", "x"] as const).map((p) => (
                        <Stat key={p} label={p} value={`+${s.subscribers[p]}`} />
                      ))}
                    </div>
                    {s.insight && <p className="text-xs text-muted italic">&ldquo;{s.insight}&rdquo;</p>}
                    <div className="flex items-center gap-4">
                      <button onClick={() => setEditing({ ...s })} className="text-xs text-accent hover:text-accent-hover">Редактировать</button>
                      <button onClick={() => { if (confirm("Удалить эту неделю?")) { deleteWeeklyStats(s.id); setExpanded(null); } }} className="text-xs text-danger hover:text-danger/80">Удалить</button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ===== Helpers ===== */
function Field({ label, value, onChange, type = "text" }: { label: string; value: string; onChange: (v: string) => void; type?: string }) {
  return (
    <div>
      <label className="text-[10px] text-muted block mb-0.5">{label}</label>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)}
        className="w-full bg-input-bg border border-input-border rounded-lg p-2 text-foreground text-xs focus:outline-none focus:border-accent" />
    </div>
  );
}

function NumField({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <div>
      <label className="text-[10px] text-muted block mb-0.5">{label}</label>
      <input type="number" value={value} onChange={(e) => onChange(Number(e.target.value))}
        className="w-full bg-input-bg border border-input-border rounded-lg p-2 text-foreground text-xs focus:outline-none focus:border-accent" />
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="bg-background rounded-lg p-2 text-center">
      <div className="text-sm font-bold">{value}</div>
      <div className="text-[9px] text-muted">{label}</div>
    </div>
  );
}
