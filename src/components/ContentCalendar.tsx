"use client";

import { useState } from "react";
import {
  ContentStatus,
  STATUS_LABELS,
  STATUS_COLORS,
  FORMAT_LABELS,
  PLATFORM_LABELS,
  Platform,
  ContentFormat,
} from "@/lib/types";
import { useContent } from "@/lib/ContentContext";
import { cn } from "@/lib/utils";
import {
  CalendarDays,
  GripVertical,
  Trash2,
  X,
  ChevronLeft,
  ChevronRight,
  LayoutGrid,
  Calendar,
  Filter,
} from "lucide-react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addMonths, subMonths } from "date-fns";
import { ru } from "date-fns/locale";

type ViewMode = "kanban" | "calendar";

export default function ContentCalendar() {
  const { items, updateItem, deleteItem } = useContent();
  const [viewMode, setViewMode] = useState<ViewMode>("kanban");
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [filterStatus, setFilterStatus] = useState<ContentStatus | "all">("all");
  const [filterFormat, setFilterFormat] = useState<ContentFormat | "all">("all");

  const selectedItem = selectedItemId ? items.find((i) => i.id === selectedItemId) || null : null;

  const filteredItems = items.filter((i) => {
    if (filterStatus !== "all" && i.status !== filterStatus) return false;
    if (filterFormat !== "all" && i.format !== filterFormat) return false;
    return true;
  });

  function handleStatusChange(id: string, status: ContentStatus) {
    updateItem(id, { status });
  }

  function handleDelete(id: string) {
    if (!confirm("Удалить этот контент?")) return;
    deleteItem(id);
    setSelectedItemId(null);
  }

  function handleDateChange(id: string, date: string) {
    updateItem(id, { scheduledDate: date });
  }

  function handlePlatformToggle(id: string, platform: Platform) {
    const item = items.find((i) => i.id === id);
    if (!item) return;
    const platforms = item.platforms.includes(platform)
      ? item.platforms.filter((p) => p !== platform)
      : [...item.platforms, platform];
    updateItem(id, { platforms });
  }

  const columns: ContentStatus[] = ["idea", "scripted", "recorded", "edited", "published"];

  // Calendar days
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Stats row
  const statusCounts = columns.map((s) => ({ status: s, count: items.filter((i) => i.status === s).length }));

  return (
    <div className="animate-slide-in">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">
          <CalendarDays className="w-6 h-6 text-neon-green inline mr-2" />
          Контент-план
        </h1>
        <div className="flex gap-2">
          <button
            onClick={() => setViewMode("kanban")}
            className={cn(
              "px-3 py-1.5 rounded-lg text-sm flex items-center gap-1.5 transition-all",
              viewMode === "kanban"
                ? "bg-accent text-white"
                : "bg-input-bg border border-input-border text-muted"
            )}
          >
            <LayoutGrid className="w-4 h-4" />
            Канбан
          </button>
          <button
            onClick={() => setViewMode("calendar")}
            className={cn(
              "px-3 py-1.5 rounded-lg text-sm flex items-center gap-1.5 transition-all",
              viewMode === "calendar"
                ? "bg-accent text-white"
                : "bg-input-bg border border-input-border text-muted"
            )}
          >
            <Calendar className="w-4 h-4" />
            Календарь
          </button>
        </div>
      </div>

      {/* Status summary chips */}
      <div className="flex gap-2 mb-3 flex-wrap">
        {statusCounts.map(({ status, count }) => (
          <div key={status} className="flex items-center gap-1.5 text-[10px]">
            <div className={cn("w-2 h-2 rounded-full", STATUS_COLORS[status].dot)} />
            <span className="text-muted">{STATUS_LABELS[status].replace(/^.+\s/, "")}</span>
            <span className="font-bold">{count}</span>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-5 flex-wrap items-center">
        <Filter className="w-3.5 h-3.5 text-muted" />
        <button onClick={() => setFilterStatus("all")}
          className={cn("px-2 py-0.5 rounded-full text-[10px] border transition-all",
            filterStatus === "all" ? "border-accent bg-accent-dim text-foreground" : "border-card-border text-muted"
          )}>Все статусы</button>
        {columns.map((s) => (
          <button key={s} onClick={() => setFilterStatus(filterStatus === s ? "all" : s)}
            className={cn("px-2 py-0.5 rounded-full text-[10px] border transition-all flex items-center gap-1",
              filterStatus === s ? `${STATUS_COLORS[s].bg} ${STATUS_COLORS[s].border} ${STATUS_COLORS[s].text}` : "border-card-border text-muted"
            )}>
            <div className={cn("w-1.5 h-1.5 rounded-full", STATUS_COLORS[s].dot)} />
            {STATUS_LABELS[s].replace(/^.+\s/, "")}
          </button>
        ))}
        <div className="w-px h-4 bg-card-border" />
        <button onClick={() => setFilterFormat("all")}
          className={cn("px-2 py-0.5 rounded-full text-[10px] border transition-all",
            filterFormat === "all" ? "border-accent bg-accent-dim text-foreground" : "border-card-border text-muted"
          )}>Все форматы</button>
        {(Object.keys(FORMAT_LABELS) as ContentFormat[]).map((f) => (
          <button key={f} onClick={() => setFilterFormat(filterFormat === f ? "all" : f)}
            className={cn("px-2 py-0.5 rounded-full text-[10px] border transition-all",
              filterFormat === f ? "border-accent bg-accent-dim text-foreground" : "border-card-border text-muted"
            )}>{FORMAT_LABELS[f]}</button>
        ))}
      </div>

      {viewMode === "kanban" ? (
        /* Kanban View */
        <div className="flex gap-4 overflow-x-auto pb-4">
          {columns.map((status) => {
            const columnItems = filteredItems.filter((i) => i.status === status);
            const colors = STATUS_COLORS[status];
            return (
              <div
                key={status}
                className="min-w-[250px] flex-shrink-0 bg-card border border-card-border rounded-xl"
              >
                <div className={cn("p-3 border-b flex items-center justify-between", colors.border)}>
                  <div className="flex items-center gap-2">
                    <div className={cn("w-2.5 h-2.5 rounded-full", colors.dot)} />
                    <span className={cn("text-sm font-semibold", colors.text)}>
                      {STATUS_LABELS[status].replace(/^.+\s/, "")}
                    </span>
                  </div>
                  <span className={cn("text-xs px-2 py-0.5 rounded-full", colors.bg, colors.text)}>
                    {columnItems.length}
                  </span>
                </div>
                <div className="p-2 space-y-2 max-h-[calc(100vh-300px)] overflow-y-auto">
                  {columnItems.length === 0 ? (
                    <div className="text-xs text-muted text-center py-8">Пусто</div>
                  ) : (
                    columnItems.map((item) => {
                      const itemColors = STATUS_COLORS[item.status];
                      return (
                        <div
                          key={item.id}
                          onClick={() => setSelectedItemId(item.id)}
                          className={cn(
                            "bg-background border rounded-lg p-3 cursor-pointer transition-all group",
                            `${itemColors.border} hover:${itemColors.border}`
                          )}
                        >
                          <div className="flex items-start gap-2">
                            <GripVertical className="w-3.5 h-3.5 text-muted/30 mt-0.5 flex-shrink-0" />
                            <div className="min-w-0 flex-1">
                              <div className="text-sm font-medium truncate">{item.title}</div>
                              <div className="flex items-center gap-2 mt-1">
                                <span className={cn("text-[10px] px-1.5 py-0.5 rounded", itemColors.bg, itemColors.text)}>
                                  {FORMAT_LABELS[item.format]}
                                </span>
                                {item.scheduledDate && (
                                  <span className="text-[10px] text-muted">
                                    {new Date(item.scheduledDate).toLocaleDateString("ru-RU", { day: "numeric", month: "short" })}
                                  </span>
                                )}
                              </div>
                              {item.platforms.length > 0 && (
                                <div className="flex gap-1 mt-1.5">
                                  {item.platforms.map((p) => (
                                    <span
                                      key={p}
                                      className="text-[10px] px-1.5 py-0.5 rounded bg-input-bg text-muted"
                                    >
                                      {PLATFORM_LABELS[p].split(" ")[0]}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Calendar View */
        <div className="bg-card border border-card-border rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
              className="p-2 hover:bg-input-bg rounded-lg transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <h2 className="text-lg font-semibold capitalize">
              {format(currentMonth, "LLLL yyyy", { locale: ru })}
            </h2>
            <button
              onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
              className="p-2 hover:bg-input-bg rounded-lg transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1">
            {["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"].map((d) => (
              <div key={d} className="text-center text-xs text-muted py-2 font-medium">
                {d}
              </div>
            ))}
            {/* padding for first day */}
            {Array.from({ length: (monthStart.getDay() + 6) % 7 }).map((_, i) => (
              <div key={`pad-${i}`} />
            ))}
            {days.map((day) => {
              const dayItems = filteredItems.filter(
                (i) => i.scheduledDate && isSameDay(new Date(i.scheduledDate), day)
              );
              const isToday = isSameDay(day, new Date());
              return (
                <div
                  key={day.toISOString()}
                  className={cn(
                    "min-h-[80px] p-1.5 rounded-lg border transition-colors",
                    isToday ? "border-accent/50 bg-accent-dim" : "border-card-border hover:border-card-border/80"
                  )}
                >
                  <div className={cn("text-xs mb-1", isToday ? "text-accent font-bold" : "text-muted")}>
                    {format(day, "d")}
                  </div>
                  <div className="space-y-0.5">
                    {dayItems.map((item) => {
                      const c = STATUS_COLORS[item.status];
                      return (
                        <div
                          key={item.id}
                          onClick={() => setSelectedItemId(item.id)}
                          className={cn(
                            "text-[10px] px-1.5 py-0.5 rounded truncate cursor-pointer transition-all flex items-center gap-1",
                            c.bg, c.text, `hover:opacity-80`
                          )}
                        >
                          <div className={cn("w-1 h-1 rounded-full flex-shrink-0", c.dot)} />
                          {item.title}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Calendar legend */}
          <div className="flex gap-4 mt-4 pt-3 border-t border-card-border flex-wrap">
            {columns.map((s) => (
              <div key={s} className="flex items-center gap-1.5 text-[10px] text-muted">
                <div className={cn("w-2 h-2 rounded-full", STATUS_COLORS[s].dot)} />
                {STATUS_LABELS[s].replace(/^.+\s/, "")}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Item Detail Modal */}
      {selectedItem && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card border border-card-border rounded-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto animate-slide-in">
            <div className={cn("flex items-center justify-between p-5 border-b", STATUS_COLORS[selectedItem.status].border)}>
              <div className="flex items-center gap-2 min-w-0 pr-4">
                <div className={cn("w-3 h-3 rounded-full flex-shrink-0", STATUS_COLORS[selectedItem.status].dot)} />
                <h3 className="font-semibold text-lg truncate">{selectedItem.title}</h3>
              </div>
              <button
                onClick={() => setSelectedItemId(null)}
                className="p-1.5 hover:bg-input-bg rounded-lg flex-shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              {/* Status */}
              <div>
                <label className="text-xs text-muted uppercase tracking-wider block mb-2">Статус</label>
                <div className="flex flex-wrap gap-2">
                  {columns.map((s) => {
                    const c = STATUS_COLORS[s];
                    return (
                      <button
                        key={s}
                        onClick={() => handleStatusChange(selectedItem.id, s)}
                        className={cn(
                          "text-xs px-3 py-1.5 rounded-full transition-all flex items-center gap-1.5",
                          selectedItem.status === s
                            ? `${c.bg} ${c.border} ${c.text} border`
                            : "bg-input-bg border border-input-border text-muted hover:text-foreground"
                        )}
                      >
                        <div className={cn("w-1.5 h-1.5 rounded-full", selectedItem.status === s ? c.dot : "bg-muted/40")} />
                        {STATUS_LABELS[s].replace(/^.+\s/, "")}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Format */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted">Формат:</span>
                <span className={cn("text-xs px-2 py-0.5 rounded-full", STATUS_COLORS[selectedItem.status].bg, STATUS_COLORS[selectedItem.status].text)}>
                  {FORMAT_LABELS[selectedItem.format]}
                </span>
              </div>

              {/* Hook */}
              {selectedItem.hook && (
                <div>
                  <label className="text-xs text-neon-pink uppercase tracking-wider block mb-1">Хук</label>
                  <div className="text-sm bg-input-bg rounded-lg p-3">&ldquo;{selectedItem.hook}&rdquo;</div>
                </div>
              )}

              {/* Script preview */}
              {selectedItem.script && (
                <div>
                  <label className="text-xs text-neon-green uppercase tracking-wider block mb-1">Сценарий</label>
                  <div className="text-xs font-mono bg-input-bg rounded-lg p-3 max-h-40 overflow-y-auto whitespace-pre-wrap">
                    {selectedItem.script}
                  </div>
                </div>
              )}

              {/* Scheduled date */}
              <div>
                <label className="text-xs text-muted uppercase tracking-wider block mb-2">Дата публикации</label>
                <input
                  type="date"
                  value={selectedItem.scheduledDate || ""}
                  onChange={(e) => {
                    handleDateChange(selectedItem.id, e.target.value);
                  }}
                  className="bg-input-bg border border-input-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-accent"
                />
              </div>

              {/* Platforms */}
              <div>
                <label className="text-xs text-muted uppercase tracking-wider block mb-2">Платформы</label>
                <div className="flex flex-wrap gap-2">
                  {(Object.keys(PLATFORM_LABELS) as Platform[]).map((p) => (
                    <button
                      key={p}
                      onClick={() => handlePlatformToggle(selectedItem.id, p)}
                      className={cn(
                        "text-xs px-3 py-1.5 rounded-full transition-all",
                        selectedItem.platforms.includes(p)
                          ? "bg-accent text-white"
                          : "bg-input-bg border border-input-border text-muted hover:text-foreground"
                      )}
                    >
                      {PLATFORM_LABELS[p]}
                    </button>
                  ))}
                </div>
              </div>

              {/* Hashtags */}
              {selectedItem.hashtags.length > 0 && (
                <div>
                  <label className="text-xs text-muted uppercase tracking-wider block mb-2">Хэштеги</label>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedItem.hashtags.map((tag) => (
                      <span key={tag} className="text-xs px-2 py-1 rounded-full bg-accent-dim text-accent">
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Delete */}
              <button
                onClick={() => handleDelete(selectedItem.id)}
                className="flex items-center gap-2 text-sm text-danger hover:text-danger/80 transition-colors mt-4"
              >
                <Trash2 className="w-4 h-4" />
                Удалить
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
