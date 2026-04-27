"use client";

import { STATUS_LABELS, STATUS_COLORS, ContentStatus, FORMAT_LABELS } from "@/lib/types";
import { useContent } from "@/lib/ContentContext";
import {
  Sparkles,
  TrendingUp,
  Video,
  CheckCircle2,
  Clock,
  BarChart3,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { View } from "./Sidebar";

interface DashboardProps {
  onNavigate: (view: View) => void;
}

export default function Dashboard({ onNavigate }: DashboardProps) {
  const { items } = useContent();

  const stats = {
    total: items.length,
    ideas: items.filter((i) => i.status === "idea").length,
    scripted: items.filter((i) => i.status === "scripted").length,
    recorded: items.filter((i) => i.status === "recorded").length,
    edited: items.filter((i) => i.status === "edited").length,
    published: items.filter((i) => i.status === "published").length,
    shorts: items.filter((i) => i.format === "short").length,
    longform: items.filter((i) => i.format === "longform").length,
  };

  const recentItems = items.slice(0, 5);

  const statCards = [
    { label: "Всего контента", value: stats.total, icon: BarChart3, color: "text-accent" },
    { label: "Идеи", value: stats.ideas, icon: Sparkles, color: "text-neon-green" },
    { label: "В работе", value: stats.scripted + stats.recorded + stats.edited, icon: Clock, color: "text-neon-orange" },
    { label: "Опубликовано", value: stats.published, icon: CheckCircle2, color: "text-success" },
    { label: "Shorts", value: stats.shorts, icon: Video, color: "text-neon-pink" },
    { label: "Long-form", value: stats.longform, icon: TrendingUp, color: "text-accent" },
  ];

  return (
    <div className="animate-slide-in">
      <h1 className="text-2xl font-bold mb-6">
        <span className="text-accent">ITOQ</span> Content Hub
      </h1>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.label}
              className="bg-card border border-card-border rounded-xl p-4 hover:border-accent/30 transition-colors"
            >
              <Icon className={`w-5 h-5 ${stat.color} mb-2`} />
              <div className="text-2xl font-bold">{stat.value}</div>
              <div className="text-xs text-muted mt-1">{stat.label}</div>
            </div>
          );
        })}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <button
          onClick={() => onNavigate("generator")}
          className="bg-gradient-to-br from-accent/20 to-accent/5 border border-accent/30 rounded-xl p-5 text-left hover:border-accent/50 transition-all group"
        >
          <Sparkles className="w-6 h-6 text-accent mb-3 group-hover:scale-110 transition-transform" />
          <div className="font-semibold">Генерировать контент</div>
          <div className="text-xs text-muted mt-1">AI создаст сценарий за секунды</div>
        </button>

        <button
          onClick={() => onNavigate("calendar")}
          className="bg-gradient-to-br from-neon-green/20 to-neon-green/5 border border-neon-green/30 rounded-xl p-5 text-left hover:border-neon-green/50 transition-all group"
        >
          <Clock className="w-6 h-6 text-neon-green mb-3 group-hover:scale-110 transition-transform" />
          <div className="font-semibold">Контент-план</div>
          <div className="text-xs text-muted mt-1">Управлять расписанием</div>
        </button>

        <button
          onClick={() => onNavigate("preview")}
          className="bg-gradient-to-br from-neon-pink/20 to-neon-pink/5 border border-neon-pink/30 rounded-xl p-5 text-left hover:border-neon-pink/50 transition-all group"
        >
          <Video className="w-6 h-6 text-neon-pink mb-3 group-hover:scale-110 transition-transform" />
          <div className="font-semibold">Создать превью</div>
          <div className="text-xs text-muted mt-1">Обложки в стиле ITOQ</div>
        </button>

        <button
          onClick={() => onNavigate("posting")}
          className="bg-gradient-to-br from-neon-orange/20 to-neon-orange/5 border border-neon-orange/30 rounded-xl p-5 text-left hover:border-neon-orange/50 transition-all group"
        >
          <TrendingUp className="w-6 h-6 text-neon-orange mb-3 group-hover:scale-110 transition-transform" />
          <div className="font-semibold">Кросс-постинг</div>
          <div className="text-xs text-muted mt-1">Опубликовать на все платформы</div>
        </button>
      </div>

      {/* Pipeline overview */}
      <div className="bg-card border border-card-border rounded-xl p-5 mb-8">
        <h2 className="text-lg font-semibold mb-4">Пайплайн контента</h2>
        <div className="flex gap-2 items-end h-20">
          {(Object.keys(STATUS_LABELS) as ContentStatus[]).map((status) => {
            const count = items.filter((i) => i.status === status).length;
            const maxCount = Math.max(1, ...Object.keys(STATUS_LABELS).map((s) =>
              items.filter((i) => i.status === s).length
            ));
            const height = Math.max(8, (count / maxCount) * 100);
            const colors = STATUS_COLORS[status];
            return (
              <div key={status} className="flex-1 flex flex-col items-center gap-2">
                <div
                  className={cn("w-full rounded-t-lg transition-all duration-500", colors.bg)}
                  style={{ height: `${height}%` }}
                />
                <div className="flex items-center gap-1">
                  <div className={cn("w-1.5 h-1.5 rounded-full", colors.dot)} />
                  <span className="text-xs text-muted text-center">{STATUS_LABELS[status].split(" ")[0]}</span>
                </div>
                <div className={cn("text-sm font-bold", colors.text)}>{count}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent items */}
      <div className="bg-card border border-card-border rounded-xl p-5">
        <h2 className="text-lg font-semibold mb-4">Последний контент</h2>
        {recentItems.length === 0 ? (
          <div className="text-center py-8 text-muted">
            <Sparkles className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p>Пока пусто. Начните с генератора!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {recentItems.map((item) => {
              const c = STATUS_COLORS[item.status];
              return (
                <div
                  key={item.id}
                  onClick={() => onNavigate("calendar")}
                  className="flex items-center justify-between p-3 bg-background rounded-lg border border-card-border cursor-pointer hover:border-accent/30 transition-colors"
                >
                  <div className="flex items-center gap-2.5 flex-1 min-w-0">
                    <div className={cn("w-2 h-2 rounded-full flex-shrink-0", c.dot)} />
                    <div className="min-w-0">
                      <div className="font-medium truncate">{item.title}</div>
                      <div className="text-xs text-muted mt-0.5">
                        {FORMAT_LABELS[item.format]} · {new Date(item.createdAt).toLocaleDateString("ru-RU")}
                      </div>
                    </div>
                  </div>
                  <span className={cn("text-xs px-2 py-1 rounded-full whitespace-nowrap ml-3", c.bg, c.text)}>
                    {STATUS_LABELS[item.status]}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
