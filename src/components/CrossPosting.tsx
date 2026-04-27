"use client";

import { useState } from "react";
import {
  Platform,
  ContentItem,
  PLATFORM_LABELS,
  PLATFORM_COLORS,
  STATUS_LABELS,
  FORMAT_LABELS,
} from "@/lib/types";
import { useContent } from "@/lib/ContentContext";
import { cn } from "@/lib/utils";
import {
  Send,
  CheckCircle2,
  Clock,
  ExternalLink,
  Copy,
  Check,
  FileVideo,
  AlertCircle,
  Loader2,
  Zap,
  ClipboardCopy,
} from "lucide-react";

// Compose plain-text post for a given platform
function composeText(item: ContentItem): string {
  const parts: string[] = [];
  parts.push(item.title);
  if (item.hook) parts.push(`\n${item.hook}`);
  if (item.description) parts.push(`\n\n${item.description}`);
  if (item.hashtags.length > 0) parts.push(`\n\n${item.hashtags.map((h) => `#${h}`).join(" ")}`);
  return parts.join("");
}

// Compose Telegram HTML message
function composeTelegramHTML(item: ContentItem): string {
  const lines: string[] = [];
  lines.push(`<b>${item.title}</b>`);
  if (item.hook) lines.push(`\n\n🎬 <i>${item.hook}</i>`);
  if (item.description) lines.push(`\n\n${item.description}`);
  if (item.hashtags.length > 0) lines.push(`\n\n${item.hashtags.map((h) => `#${h}`).join(" ")}`);
  return lines.join("");
}

// Build smart deep-link URL that pre-fills content text
function buildSmartUrl(platform: Platform, item: ContentItem): string {
  const text = composeText(item);
  const short = text.length > 280 ? text.slice(0, 277) + "..." : text;

  switch (platform) {
    case "x":
      return `https://x.com/intent/tweet?text=${encodeURIComponent(short)}`;
    case "facebook":
      return `https://www.facebook.com/sharer/sharer.php?quote=${encodeURIComponent(text)}`;
    case "telegram":
      return `https://t.me/share/url?text=${encodeURIComponent(text)}&url=${encodeURIComponent(" ")}`;
    case "threads":
      return `https://www.threads.net/intent/post?text=${encodeURIComponent(short)}`;
    case "youtube":
      return "https://studio.youtube.com/";
    case "tiktok":
      return "https://www.tiktok.com/upload";
    case "instagram":
      return "https://www.instagram.com/";
    default:
      return "#";
  }
}

export default function CrossPosting() {
  const { items, updateItem, settings } = useContent();
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [posting, setPosting] = useState<Record<string, boolean>>({});
  const [postResult, setPostResult] = useState<Record<string, { ok: boolean; msg: string }>>({});

  const tgConnected = !!(settings.telegramBotToken && settings.telegramChannelId);

  const readyItems = items.filter(
    (i) => i.status !== "idea" && i.status !== "published"
  );

  // Auto-select first ready item if none selected
  const selectedItem = selectedItemId
    ? items.find((i) => i.id === selectedItemId) || null
    : readyItems[0] || null;

  function handleCopy(text: string, field: string) {
    navigator.clipboard.writeText(text);
    setCopied(field);
    setTimeout(() => setCopied(null), 2000);
  }

  function handleTogglePlatform(platform: Platform) {
    if (!selectedItem) return;
    const platforms = selectedItem.platforms.includes(platform)
      ? selectedItem.platforms.filter((p) => p !== platform)
      : [...selectedItem.platforms, platform];
    updateItem(selectedItem.id, { platforms });
  }

  function handlePublishAll() {
    if (!selectedItem) return;
    const allPlatforms: Platform[] = ["youtube", "tiktok", "instagram", "x", "threads", "facebook", "telegram"];
    updateItem(selectedItem.id, {
      platforms: allPlatforms,
      status: "published",
      publishedDate: new Date().toISOString(),
    });
  }

  return (
    <div className="animate-slide-in">
      <h1 className="text-2xl font-bold mb-6">
        <Send className="w-6 h-6 text-neon-orange inline mr-2" />
        Кросс-постинг
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Content list */}
        <div className="bg-card border border-card-border rounded-xl overflow-hidden">
          <div className="p-4 border-b border-card-border">
            <h2 className="text-sm font-semibold">Готово к публикации</h2>
            <p className="text-xs text-muted mt-0.5">{readyItems.length} единиц контента</p>
          </div>
          <div className="max-h-[calc(100vh-250px)] overflow-y-auto">
            {readyItems.length === 0 ? (
              <div className="text-center py-12 text-muted">
                <FileVideo className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Нет контента для публикации</p>
                <p className="text-xs mt-1">Создайте контент в Генераторе</p>
              </div>
            ) : (
              readyItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setSelectedItemId(item.id)}
                  className={cn(
                    "w-full text-left p-3 border-b border-card-border transition-colors",
                    selectedItem?.id === item.id
                      ? "bg-accent-dim border-l-2 border-l-accent"
                      : "hover:bg-input-bg"
                  )}
                >
                  <div className="text-sm font-medium truncate">{item.title}</div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] text-muted">{FORMAT_LABELS[item.format]}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-input-bg text-muted">
                      {STATUS_LABELS[item.status]}
                    </span>
                  </div>
                  {item.platforms.length > 0 && (
                    <div className="flex gap-1 mt-1.5">
                      {item.platforms.map((p) => (
                        <CheckCircle2
                          key={p}
                          className="w-3 h-3"
                          style={{ color: PLATFORM_COLORS[p] }}
                        />
                      ))}
                    </div>
                  )}
                </button>
              ))
            )}
          </div>
        </div>

        {/* Posting panel */}
        <div className="lg:col-span-2">
          {selectedItem ? (
            <div className="space-y-4">
              {/* Content preview */}
              <div className="bg-card border border-card-border rounded-xl p-5">
                <h2 className="text-lg font-semibold mb-3">{selectedItem.title}</h2>

                {/* Copyable fields */}
                {selectedItem.hook && (
                  <div className="mb-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-neon-pink uppercase">Хук</span>
                      <button
                        onClick={() => handleCopy(selectedItem.hook, "hook")}
                        className="text-xs text-muted hover:text-foreground flex items-center gap-1"
                      >
                        {copied === "hook" ? (
                          <Check className="w-3 h-3 text-success" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                        Копировать
                      </button>
                    </div>
                    <div className="text-sm bg-input-bg rounded-lg p-3 font-semibold text-neon-pink">
                      &ldquo;{selectedItem.hook}&rdquo;
                    </div>
                  </div>
                )}

                {selectedItem.description && (
                  <div className="mb-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-muted uppercase">Описание</span>
                      <button
                        onClick={() => handleCopy(selectedItem.description, "desc")}
                        className="text-xs text-muted hover:text-foreground flex items-center gap-1"
                      >
                        {copied === "desc" ? (
                          <Check className="w-3 h-3 text-success" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                        Копировать
                      </button>
                    </div>
                    <div className="text-sm bg-input-bg rounded-lg p-3 whitespace-pre-wrap max-h-32 overflow-y-auto">
                      {selectedItem.description}
                    </div>
                  </div>
                )}

                {selectedItem.script && (
                  <div className="mb-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-neon-green uppercase">Сценарий</span>
                      <button
                        onClick={() => handleCopy(selectedItem.script, "script")}
                        className="text-xs text-muted hover:text-foreground flex items-center gap-1"
                      >
                        {copied === "script" ? (
                          <Check className="w-3 h-3 text-success" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                        Копировать
                      </button>
                    </div>
                    <div className="text-xs font-mono bg-input-bg rounded-lg p-3 whitespace-pre-wrap max-h-40 overflow-y-auto">
                      {selectedItem.script}
                    </div>
                  </div>
                )}

                {selectedItem.hashtags.length > 0 && (
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-muted uppercase">Хэштеги</span>
                      <button
                        onClick={() =>
                          handleCopy(
                            selectedItem.hashtags.map((h) => `#${h}`).join(" "),
                            "tags"
                          )
                        }
                        className="text-xs text-muted hover:text-foreground flex items-center gap-1"
                      >
                        {copied === "tags" ? (
                          <Check className="w-3 h-3 text-success" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                        Копировать
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedItem.hashtags.map((tag) => (
                        <span
                          key={tag}
                          className="text-xs px-2 py-1 rounded-full bg-accent-dim text-accent"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Telegram direct publish (if bot connected) */}
              {tgConnected && (
                <div className="bg-card border border-[#0088CC]/30 rounded-xl p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <Zap className="w-4 h-4 text-neon-green" />
                    <h3 className="text-sm font-semibold">Telegram канал (бот)</h3>
                    {postResult.telegram?.ok && <CheckCircle2 className="w-3.5 h-3.5 text-success ml-auto" />}
                  </div>
                  <p className="text-[10px] text-muted mb-2 line-clamp-2">
                    {composeTelegramHTML(selectedItem).replace(/<[^>]+>/g, "").slice(0, 120)}...
                  </p>
                  <button
                    onClick={async () => {
                      setPosting((p) => ({ ...p, telegram: true }));
                      setPostResult((r) => {
                        const next = { ...r };
                        delete next.telegram;
                        return next;
                      });
                      try {
                        const res = await fetch("/api/post/telegram", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({
                            botToken: settings.telegramBotToken,
                            channelId: settings.telegramChannelId,
                            text: composeTelegramHTML(selectedItem),
                          }),
                        });
                        const data = await res.json();
                        if (res.ok) {
                          setPostResult((r) => ({ ...r, telegram: { ok: true, msg: "Опубликовано в канал!" } }));
                          if (!selectedItem.platforms.includes("telegram")) handleTogglePlatform("telegram");
                        } else {
                          setPostResult((r) => ({ ...r, telegram: { ok: false, msg: data.error } }));
                        }
                      } catch {
                        setPostResult((r) => ({ ...r, telegram: { ok: false, msg: "Ошибка сети" } }));
                      }
                      setPosting((p) => ({ ...p, telegram: false }));
                    }}
                    disabled={posting.telegram}
                    className="w-full py-2.5 rounded-lg text-xs font-medium bg-[#0088CC]/20 text-[#0088CC] hover:bg-[#0088CC]/30 transition-colors flex items-center justify-center gap-1.5"
                  >
                    {posting.telegram ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                    Опубликовать в Telegram канал
                  </button>
                  {postResult.telegram && (
                    <p className={cn("text-xs mt-2", postResult.telegram.ok ? "text-success" : "text-danger")}>{postResult.telegram.msg}</p>
                  )}
                </div>
              )}

              {/* Platform grid — smart deep-links */}
              <div className="bg-card border border-card-border rounded-xl p-5">
                <h3 className="text-sm font-semibold mb-2">Платформы</h3>
                <p className="text-[10px] text-muted mb-4">Нажмите «Открыть» — текст автоматически подставится в форму публикации. Для YouTube/TikTok/Instagram текст копируется в буфер обмена.</p>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {(Object.keys(PLATFORM_LABELS) as Platform[]).map((platform) => {
                    const isPublished = selectedItem.platforms.includes(platform);
                    const hasDeepLink = ["x", "facebook", "threads", "telegram"].includes(platform);
                    return (
                      <div
                        key={platform}
                        className={cn(
                          "border rounded-xl p-4 transition-all",
                          isPublished
                            ? "border-success/30 bg-success/5"
                            : "border-card-border hover:border-accent/30"
                        )}
                      >
                        <div className="flex items-center justify-between mb-3">
                          <span
                            className="text-sm font-semibold"
                            style={{ color: PLATFORM_COLORS[platform] }}
                          >
                            {PLATFORM_LABELS[platform]}
                          </span>
                          {isPublished ? (
                            <CheckCircle2 className="w-4 h-4 text-success" />
                          ) : hasDeepLink ? (
                            <Zap className="w-3.5 h-3.5 text-neon-green" />
                          ) : (
                            <ClipboardCopy className="w-3.5 h-3.5 text-muted" />
                          )}
                        </div>

                        <div className="flex gap-2">
                          <a
                            href={buildSmartUrl(platform, selectedItem)}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={() => {
                              if (!hasDeepLink) {
                                navigator.clipboard.writeText(composeText(selectedItem));
                                setCopied(`open-${platform}`);
                                setTimeout(() => setCopied(null), 2000);
                              }
                            }}
                            className="flex-1 text-xs py-2 px-3 rounded-lg bg-input-bg border border-input-border text-center hover:border-accent/40 transition-colors flex items-center justify-center gap-1"
                          >
                            <ExternalLink className="w-3 h-3" />
                            {copied === `open-${platform}` ? "Скопировано!" : "Открыть"}
                          </a>
                          <button
                            onClick={() => handleTogglePlatform(platform)}
                            className={cn(
                              "flex-1 text-xs py-2 px-3 rounded-lg text-center transition-all flex items-center justify-center gap-1",
                              isPublished
                                ? "bg-success/20 text-success hover:bg-danger/10 hover:text-danger"
                                : "bg-accent/20 text-accent hover:bg-accent/30"
                            )}
                          >
                            {isPublished ? (
                              <>
                                <Check className="w-3 h-3" />
                                Готово
                              </>
                            ) : (
                              "Отметить"
                            )}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Publish all button */}
                <button
                  onClick={handlePublishAll}
                  className="w-full mt-4 py-3 rounded-lg bg-gradient-to-r from-accent to-neon-pink text-white font-semibold flex items-center justify-center gap-2 hover:opacity-90 transition-opacity neon-glow-pink"
                >
                  <Send className="w-4 h-4" />
                  Отметить все как опубликовано
                </button>
              </div>

              {/* Info banner */}
              <div className="bg-accent-dim border border-accent/20 rounded-xl p-4 flex gap-3">
                <AlertCircle className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
                <div className="text-sm text-muted">
                  <p className="font-medium text-foreground mb-1">Как это работает</p>
                  <p>
                    1. Выберите контент из списка слева<br />
                    2. Нажмите «Открыть» — соцсеть откроется с заполненным текстом<br />
                    3. Проверьте текст и нажмите «Опубликовать» в соцсети<br />
                    4. Вернитесь и нажмите «Отметить» ✓
                  </p>
                  <p className="mt-2 text-[10px]">
                    <Zap className="w-3 h-3 text-neon-green inline" /> X, Facebook, Threads, Telegram — текст автоматически подставляется.
                    <ClipboardCopy className="w-3 h-3 text-muted inline ml-2" /> YouTube, TikTok, Instagram — текст копируется в буфер, вставьте Ctrl+V.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-card border border-card-border rounded-xl p-12 text-center">
              <Send className="w-12 h-12 mx-auto mb-4 text-muted/30" />
              <p className="text-muted">Выберите контент из списка слева</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
