"use client";

import { cn } from "@/lib/utils";
import {
  Sparkles,
  CalendarDays,
  Image,
  Send,
  Settings,
  LayoutDashboard,
  Zap,
  CheckSquare,
  BarChart3,
  Lightbulb,
} from "lucide-react";

export type View = "dashboard" | "generator" | "calendar" | "preview" | "posting" | "checklists" | "analytics" | "ideas" | "settings";

interface SidebarProps {
  active: View;
  onNavigate: (view: View) => void;
}

const NAV_ITEMS: { id: View; label: string; icon: React.ElementType; section?: string }[] = [
  { id: "dashboard", label: "Дашборд", icon: LayoutDashboard },
  { id: "generator", label: "Генератор", icon: Sparkles },
  { id: "ideas", label: "Банк идей", icon: Lightbulb },
  { id: "calendar", label: "Календарь", icon: CalendarDays },
  { id: "preview", label: "Превью Studio", icon: Image },
  { id: "posting", label: "Постинг", icon: Send },
  { id: "checklists", label: "Чек-листы", icon: CheckSquare, section: "Управление" },
  { id: "analytics", label: "Аналитика", icon: BarChart3 },
  { id: "settings", label: "Настройки", icon: Settings },
];

export default function Sidebar({ active, onNavigate }: SidebarProps) {
  return (
    <aside className="fixed left-0 top-0 h-screen w-[220px] bg-sidebar-bg border-r border-card-border flex flex-col z-50">
      {/* Logo */}
      <div className="p-5 border-b border-card-border">
        <div className="flex items-center gap-2">
          <Zap className="w-6 h-6 text-accent" />
          <span className="text-lg font-bold tracking-wider">
            <span className="text-accent">ITOQ</span>
            <span className="text-muted text-sm ml-1">Hub</span>
          </span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = active === item.id;
          return (
            <div key={item.id}>
              {item.section && (
                <div className="text-[10px] text-muted/50 uppercase tracking-widest px-3 pt-3 pb-1">{item.section}</div>
              )}
              <button
                onClick={() => onNavigate(item.id)}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                  isActive
                    ? "bg-accent-dim text-accent neon-glow"
                    : "text-muted hover:text-foreground hover:bg-card"
                )}
              >
                <Icon className="w-4.5 h-4.5" />
                {item.label}
              </button>
            </div>
          );
        })}
      </nav>

      {/* Brand footer */}
      <div className="p-4 border-t border-card-border">
        <div className="text-xs text-muted">
          <div className="font-mono">@itoq_ru</div>
          <div className="mt-1 text-[10px]">AI · IT · Marketing</div>
        </div>
      </div>
    </aside>
  );
}
