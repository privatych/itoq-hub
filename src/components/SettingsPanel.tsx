"use client";

import { useState, useEffect, useCallback } from "react";
import { Settings, Save, Check, Eye, EyeOff, Trash2, Zap, Star, Image as ImageIcon, Download, Upload, Send, LinkIcon, CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { AppSettings, RECOMMENDED_TEXT_MODELS, RECOMMENDED_IMAGE_MODELS } from "@/lib/types";
import { useContent, defaultSettings } from "@/lib/ContentContext";
import { cn } from "@/lib/utils";

export default function SettingsPanel() {
  const { settings, saveSettings, exportData, importData } = useContent();
  const [draft, setDraft] = useState<AppSettings>(settings);
  const [saved, setSaved] = useState(false);
  const [showOpenAI, setShowOpenAI] = useState(false);
  const [showOpenRouter, setShowOpenRouter] = useState(false);
  const [showFal, setShowFal] = useState(false);
  const [importStatus, setImportStatus] = useState<"idle" | "success" | "error">("idle");
  const [showTgToken, setShowTgToken] = useState(false);
  const [tgTestStatus, setTgTestStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [tgTestMsg, setTgTestMsg] = useState("");
  const [xConnecting, setXConnecting] = useState(false);

  // Sync draft when settings hydrate from localStorage
  const [synced, setSynced] = useState(false);
  if (!synced && settings.openaiApiKey !== defaultSettings.openaiApiKey) {
    setDraft(settings);
    setSynced(true);
  }

  // Listen for X OAuth callback tokens
  useEffect(() => {
    function checkXTokens() {
      const tokensStr = localStorage.getItem("itoq_x_tokens");
      if (tokensStr) {
        try {
          const tokens = JSON.parse(tokensStr);
          if (tokens.accessToken) {
            const updated = { ...draft, xAccessToken: tokens.accessToken, xRefreshToken: tokens.refreshToken || "" };
            setDraft(updated);
            saveSettings(updated);
            localStorage.removeItem("itoq_x_tokens");
            setXConnecting(false);
          }
        } catch { /* ignore */ }
      }
    }
    const interval = setInterval(checkXTokens, 1000);
    return () => clearInterval(interval);
  }, [draft, saveSettings]);

  // PKCE helpers
  function generatePKCE() {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    const verifier = btoa(String.fromCharCode(...array)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
    return crypto.subtle.digest("SHA-256", new TextEncoder().encode(verifier)).then((hash) => {
      const challenge = btoa(String.fromCharCode(...new Uint8Array(hash))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
      return { verifier, challenge };
    });
  }

  const handleConnectX = useCallback(async () => {
    if (!draft.xClientId) { alert("Введите X Client ID"); return; }
    setXConnecting(true);
    const { verifier, challenge } = await generatePKCE();
    const state = crypto.randomUUID();
    sessionStorage.setItem("x_oauth_code_verifier", verifier);
    sessionStorage.setItem("x_oauth_state", state);
    sessionStorage.setItem("x_oauth_client_id", draft.xClientId);
    sessionStorage.setItem("x_oauth_client_secret", draft.xClientSecret);
    const redirectUri = `${window.location.origin}/auth/x/callback`;
    const authUrl = `https://twitter.com/i/oauth2/authorize?response_type=code&client_id=${encodeURIComponent(draft.xClientId)}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent("tweet.read tweet.write users.read offline.access")}&state=${state}&code_challenge=${challenge}&code_challenge_method=S256`;
    window.open(authUrl, "x_oauth", "width=600,height=700");
  }, [draft.xClientId, draft.xClientSecret]);

  async function handleTestTelegram() {
    if (!draft.telegramBotToken || !draft.telegramChannelId) {
      setTgTestMsg("Введите Bot Token и Channel ID");
      setTgTestStatus("error");
      return;
    }
    setTgTestStatus("loading");
    try {
      const res = await fetch("/api/post/telegram", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          botToken: draft.telegramBotToken,
          channelId: draft.telegramChannelId,
          text: "✅ ITOQ Hub подключён! Тестовое сообщение.",
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setTgTestStatus("success");
        setTgTestMsg("Сообщение отправлено!");
      } else {
        setTgTestStatus("error");
        setTgTestMsg(data.error);
      }
    } catch {
      setTgTestStatus("error");
      setTgTestMsg("Ошибка сети");
    }
    setTimeout(() => setTgTestStatus("idle"), 4000);
  }

  function handleSave() {
    saveSettings(draft);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  function handleReset() {
    if (confirm("Сбросить все настройки? Это не удалит контент.")) {
      saveSettings(defaultSettings);
      setDraft(defaultSettings);
    }
  }

  const inputClass = "w-full bg-input-bg border border-input-border rounded-lg p-3 text-foreground text-sm focus:outline-none focus:border-accent";

  return (
    <div className="animate-slide-in max-w-3xl">
      <h1 className="text-2xl font-bold mb-6">
        <Settings className="w-6 h-6 text-muted inline mr-2" />
        Настройки
      </h1>

      <div className="space-y-6">
        {/* API Keys */}
        <div className="bg-card border border-card-border rounded-xl p-5">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-accent mb-4">
            API Ключи
          </h2>
          <div className="space-y-4">
            <div>
              <label className="text-xs text-muted block mb-1.5">OpenAI API Key</label>
              <div className="relative">
                <input
                  type={showOpenAI ? "text" : "password"}
                  value={draft.openaiApiKey}
                  onChange={(e) => setDraft({ ...draft, openaiApiKey: e.target.value })}
                  placeholder="sk-..."
                  className={`${inputClass} pr-10 font-mono`}
                />
                <button onClick={() => setShowOpenAI(!showOpenAI)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-foreground">
                  {showOpenAI ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-[11px] text-muted mt-1">
                <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">platform.openai.com/api-keys</a>
                {" "}· Для DALL-E 3 и GPT моделей
              </p>
            </div>

            <div>
              <label className="text-xs text-muted block mb-1.5">
                OpenRouter API Key
              </label>
              <div className="relative">
                <input
                  type={showOpenRouter ? "text" : "password"}
                  value={draft.openrouterApiKey}
                  onChange={(e) => setDraft({ ...draft, openrouterApiKey: e.target.value })}
                  placeholder="sk-or-..."
                  className={`${inputClass} pr-10 font-mono`}
                />
                <button onClick={() => setShowOpenRouter(!showOpenRouter)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-foreground">
                  {showOpenRouter ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-[11px] text-muted mt-1">
                <a href="https://openrouter.ai/keys" target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">openrouter.ai/keys</a>
                {" "}· Один ключ → 200+ LLM моделей (Claude, Gemini, Llama...)
              </p>
            </div>

            <div>
              <label className="text-xs text-muted block mb-1.5">
                fal.ai API Key
                <span className="text-neon-green ml-1 text-[10px]">РЕКОМЕНДУЕМ ДЛЯ ИЗОБРАЖЕНИЙ</span>
              </label>
              <div className="relative">
                <input
                  type={showFal ? "text" : "password"}
                  value={draft.falApiKey}
                  onChange={(e) => setDraft({ ...draft, falApiKey: e.target.value })}
                  placeholder="fal-..."
                  className={`${inputClass} pr-10 font-mono`}
                />
                <button onClick={() => setShowFal(!showFal)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-foreground">
                  {showFal ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-[11px] text-muted mt-1">
                <a href="https://fal.ai/dashboard/keys" target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">fal.ai/dashboard/keys</a>
                {" "}· Flux 2, Ideogram 3.0, Recraft V4, Imagen 4 — $0.01–0.05/изображение
              </p>
            </div>
          </div>
        </div>

        {/* LLM Provider + Model */}
        <div className="bg-card border border-card-border rounded-xl p-5">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-neon-pink mb-4">
            <Zap className="w-3.5 h-3.5 inline mr-1" />
            Текстовая AI модель (скрипты, хуки, описания)
          </h2>

          <div className="space-y-4">
            <div className="flex gap-2">
              <button
                onClick={() => setDraft({ ...draft, llmProvider: "openai" })}
                className={cn("flex-1 py-2.5 rounded-lg text-sm font-medium border transition-all",
                  draft.llmProvider === "openai" ? "border-accent bg-accent-dim text-accent" : "border-card-border text-muted"
                )}
              >
                OpenAI Direct
              </button>
              <button
                onClick={() => setDraft({ ...draft, llmProvider: "openrouter" })}
                className={cn("flex-1 py-2.5 rounded-lg text-sm font-medium border transition-all",
                  draft.llmProvider === "openrouter" ? "border-neon-green bg-neon-green/10 text-neon-green" : "border-card-border text-muted"
                )}
              >
                OpenRouter (200+ моделей)
              </button>
            </div>

            <div>
              <label className="text-xs text-muted block mb-2">Модель для генерации контента</label>
              <div className="space-y-1.5">
                {RECOMMENDED_TEXT_MODELS.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => setDraft({ ...draft, llmModel: m.id, llmProvider: m.id.startsWith("openai/") || !m.id.includes("/") ? (draft.openaiApiKey ? "openai" : "openrouter") : "openrouter" })}
                    className={cn(
                      "w-full text-left p-3 rounded-lg border transition-all",
                      draft.llmModel === m.id
                        ? "border-accent bg-accent-dim"
                        : "border-card-border hover:border-accent/30"
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{m.name}</span>
                        {m.recommended && <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />}
                      </div>
                      <span className="text-[10px] text-muted">{m.provider}</span>
                    </div>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-[10px] text-neon-green">{m.cost}</span>
                      <span className="text-[10px] text-muted">Качество: {m.quality}</span>
                      <span className="text-[10px] text-muted">{m.speed}</span>
                    </div>
                    <p className="text-[10px] text-muted/70 mt-1">{m.description}</p>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Image model */}
        <div className="bg-card border border-card-border rounded-xl p-5">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-neon-orange mb-4">
            <ImageIcon className="w-3.5 h-3.5 inline mr-1" />
            Модель для обложек / превью
          </h2>

          <div className="space-y-1.5">
            {RECOMMENDED_IMAGE_MODELS.map((m) => (
              <button
                key={m.id}
                onClick={() => {
                  const prov = m.id === "dalle3" ? "dalle3" as const
                    : m.provider === "fal.ai" ? "fal" as const
                    : "openrouter-image" as const;
                  setDraft({ ...draft, imageModel: m.id, imageProvider: prov });
                }}
                className={cn(
                  "w-full text-left p-3 rounded-lg border transition-all",
                  draft.imageModel === m.id
                    ? "border-neon-orange bg-neon-orange/10"
                    : "border-card-border hover:border-neon-orange/30"
                )}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{m.name}</span>
                    {m.recommended && <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />}
                  </div>
                  <span className="text-[10px] text-muted">{m.provider}</span>
                </div>
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-[10px] text-neon-green">{m.cost}</span>
                  <span className="text-[10px] text-muted">{m.speed}</span>
                </div>
                <p className="text-[10px] text-muted/70 mt-1">{m.description}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Brand */}
        <div className="bg-card border border-card-border rounded-xl p-5">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-neon-green mb-4">Бренд</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-muted block mb-1.5">Название</label>
              <input value={draft.brandName} onChange={(e) => setDraft({ ...draft, brandName: e.target.value })} className={inputClass} />
            </div>
            <div>
              <label className="text-xs text-muted block mb-1.5">Хэндл</label>
              <input value={draft.brandHandle} onChange={(e) => setDraft({ ...draft, brandHandle: e.target.value })} className={inputClass} />
            </div>
            <div className="col-span-2">
              <label className="text-xs text-muted block mb-1.5">Язык контента</label>
              <select value={draft.language} onChange={(e) => setDraft({ ...draft, language: e.target.value })} className={inputClass}>
                <option value="ru">Русский</option>
                <option value="en">English</option>
              </select>
            </div>
          </div>
        </div>

        {/* Social Media Connections */}
        <div className="bg-card border border-card-border rounded-xl p-5">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-neon-orange mb-4">
            <LinkIcon className="w-3.5 h-3.5 inline mr-1" />
            Подключение соцсетей
          </h2>

          {/* Telegram */}
          <div className="border border-card-border rounded-xl p-4 mb-4">
            <div className="flex items-center gap-2 mb-3">
              <Send className="w-4 h-4 text-[#0088CC]" />
              <span className="text-sm font-semibold">Telegram</span>
              {draft.telegramBotToken && draft.telegramChannelId ? (
                <span className="ml-auto text-[10px] text-success flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Настроен</span>
              ) : (
                <span className="ml-auto text-[10px] text-muted">Не подключён</span>
              )}
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-muted block mb-1">Bot Token</label>
                <div className="relative">
                  <input
                    type={showTgToken ? "text" : "password"}
                    value={draft.telegramBotToken}
                    onChange={(e) => setDraft({ ...draft, telegramBotToken: e.target.value })}
                    placeholder="123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11"
                    className={`${inputClass} pr-10 font-mono text-xs`}
                  />
                  <button onClick={() => setShowTgToken(!showTgToken)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-foreground">
                    {showTgToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-[10px] text-muted mt-1">
                  Создайте бота через <a href="https://t.me/BotFather" target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">@BotFather</a> → скопируйте токен
                </p>
              </div>
              <div>
                <label className="text-xs text-muted block mb-1">Channel ID</label>
                <input
                  value={draft.telegramChannelId}
                  onChange={(e) => setDraft({ ...draft, telegramChannelId: e.target.value })}
                  placeholder="@my_channel или -1001234567890"
                  className={`${inputClass} font-mono text-xs`}
                />
                <p className="text-[10px] text-muted mt-1">Добавьте бота как администратора канала с правом публикации</p>
              </div>
              <button
                onClick={handleTestTelegram}
                disabled={tgTestStatus === "loading"}
                className="w-full py-2 rounded-lg text-xs font-medium bg-[#0088CC]/10 text-[#0088CC] hover:bg-[#0088CC]/20 transition-colors flex items-center justify-center gap-2"
              >
                {tgTestStatus === "loading" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                Тест: отправить сообщение
              </button>
              {tgTestStatus === "success" && <p className="text-xs text-success flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> {tgTestMsg}</p>}
              {tgTestStatus === "error" && <p className="text-xs text-danger">{tgTestMsg}</p>}
            </div>
          </div>

          {/* X (Twitter) */}
          <div className="border border-card-border rounded-xl p-4 mb-4">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-sm font-bold">𝕏</span>
              <span className="text-sm font-semibold">X (Twitter)</span>
              {draft.xAccessToken ? (
                <span className="ml-auto text-[10px] text-success flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Подключён</span>
              ) : (
                <span className="ml-auto text-[10px] text-muted">Не подключён</span>
              )}
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-muted block mb-1">Client ID</label>
                <input
                  value={draft.xClientId}
                  onChange={(e) => setDraft({ ...draft, xClientId: e.target.value })}
                  placeholder="Ваш X App Client ID"
                  className={`${inputClass} font-mono text-xs`}
                />
              </div>
              <div>
                <label className="text-xs text-muted block mb-1">Client Secret</label>
                <input
                  type="password"
                  value={draft.xClientSecret}
                  onChange={(e) => setDraft({ ...draft, xClientSecret: e.target.value })}
                  placeholder="Client Secret (если confidential app)"
                  className={`${inputClass} font-mono text-xs`}
                />
                <p className="text-[10px] text-muted mt-1">
                  <a href="https://developer.x.com/en/portal/projects-and-apps" target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">developer.x.com</a>
                  {" "}→ Создайте App → OAuth 2.0 → Redirect URI: <code className="text-[9px] bg-input-bg px-1 rounded">{typeof window !== "undefined" ? window.location.origin : ""}/auth/x/callback</code>
                </p>
              </div>
              {draft.xAccessToken ? (
                <div className="flex gap-2">
                  <div className="flex-1 py-2 rounded-lg bg-success/10 text-success text-xs font-medium text-center flex items-center justify-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5" /> X подключён
                  </div>
                  <button
                    onClick={() => { setDraft({ ...draft, xAccessToken: "", xRefreshToken: "" }); }}
                    className="px-3 py-2 rounded-lg text-xs text-danger border border-danger/30 hover:bg-danger/10"
                  >
                    Отключить
                  </button>
                </div>
              ) : (
                <button
                  onClick={handleConnectX}
                  disabled={xConnecting || !draft.xClientId}
                  className={cn(
                    "w-full py-2 rounded-lg text-xs font-medium flex items-center justify-center gap-2 transition-colors",
                    !draft.xClientId ? "bg-muted/20 text-muted cursor-not-allowed" : "bg-foreground/10 text-foreground hover:bg-foreground/20"
                  )}
                >
                  {xConnecting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <LinkIcon className="w-3.5 h-3.5" />}
                  {xConnecting ? "Ожидание авторизации..." : "Подключить X"}
                </button>
              )}
            </div>
          </div>

          {/* YouTube, Instagram, etc — manual */}
          <div className="border border-card-border rounded-xl p-4 opacity-60">
            <div className="flex items-center gap-2">
              <span className="text-sm">▶</span>
              <span className="text-sm font-semibold">YouTube · Instagram · TikTok · Facebook</span>
            </div>
            <p className="text-[10px] text-muted mt-2">
              Ручной постинг через «Открыть» в разделе Кросс-постинг. Авто-публикация через API этих платформ требует бизнес-аккаунты и верификацию приложения.
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={handleSave}
            className={`flex-1 py-3 rounded-lg font-semibold flex items-center justify-center gap-2 transition-all ${
              saved ? "bg-success/20 text-success border border-success/30" : "bg-accent hover:bg-accent-hover text-white neon-glow"
            }`}
          >
            {saved ? <><Check className="w-4 h-4" /> Сохранено</> : <><Save className="w-4 h-4" /> Сохранить настройки</>}
          </button>
          <button onClick={handleReset} className="px-4 py-3 rounded-lg bg-input-bg border border-input-border text-muted hover:text-danger hover:border-danger/40 transition-colors">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>

        {/* Export/Import */}
        <div className="bg-card border border-card-border rounded-xl p-5">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-accent mb-4">
            <Download className="w-3.5 h-3.5 inline mr-1" />
            Экспорт / Импорт данных
          </h2>
          <p className="text-xs text-muted mb-4">
            Все данные хранятся в браузере. Экспортируйте JSON-бэкап, чтобы не потерять контент.
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => {
                const json = exportData();
                const blob = new Blob([json], { type: "application/json" });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = `itoq-hub-backup-${new Date().toISOString().split("T")[0]}.json`;
                a.click();
                URL.revokeObjectURL(url);
              }}
              className="flex-1 py-2.5 rounded-lg bg-neon-green/10 text-neon-green text-sm font-medium flex items-center justify-center gap-2 hover:bg-neon-green/20 transition-colors"
            >
              <Download className="w-4 h-4" />
              Экспорт JSON
            </button>
            <label className="flex-1 py-2.5 rounded-lg bg-accent/10 text-accent text-sm font-medium flex items-center justify-center gap-2 hover:bg-accent/20 transition-colors cursor-pointer">
              <Upload className="w-4 h-4" />
              Импорт JSON
              <input type="file" accept=".json" className="hidden" onChange={(e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                const reader = new FileReader();
                reader.onload = () => {
                  const ok = importData(reader.result as string);
                  setImportStatus(ok ? "success" : "error");
                  if (ok) setDraft(settings);
                  setTimeout(() => setImportStatus("idle"), 3000);
                };
                reader.readAsText(file);
                e.target.value = "";
              }} />
            </label>
          </div>
          {importStatus === "success" && (
            <div className="mt-2 text-xs text-success flex items-center gap-1"><Check className="w-3 h-3" /> Данные импортированы успешно</div>
          )}
          {importStatus === "error" && (
            <div className="mt-2 text-xs text-danger">Ошибка: некорректный файл JSON</div>
          )}
        </div>

        {/* Info */}
        <div className="bg-card border border-card-border rounded-xl p-5 text-xs text-muted">
          <p>Все данные локально в браузере. API запросы идут напрямую к провайдерам.</p>
          <p className="mt-1"><strong>fal.ai</strong> — лучший для изображений: Flux 2, Ideogram 3.0, Recraft V4 ($0.01–0.05/шт)</p>
          <p className="mt-1"><strong>OpenRouter</strong> — единый ключ для 200+ LLM моделей (Claude, Gemini, Llama...)</p>
        </div>
      </div>
    </div>
  );
}
