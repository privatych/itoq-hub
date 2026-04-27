"use client";

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { ContentItem, AppSettings, CustomPromptTemplate, DEFAULT_CONTENT_TEMPLATES, THUMBNAIL_PROMPT_TEMPLATES, Checklist, WeeklyStats, Idea } from "./types";

const CONTENT_KEY = "itoq_content";
const SETTINGS_KEY = "itoq_settings";
const TEMPLATES_KEY = "itoq_templates";
const CHECKLISTS_KEY = "itoq_checklists";
const STATS_KEY = "itoq_stats";
const IDEAS_KEY = "itoq_ideas";

export const defaultSettings: AppSettings = {
  openaiApiKey: "",
  openrouterApiKey: "",
  falApiKey: "",
  llmProvider: "openai",
  llmModel: "gpt-4o-mini",
  imageProvider: "fal",
  imageModel: "fal-ai/flux-2-flex",
  language: "ru",
  brandName: "ITOQ",
  brandHandle: "@itoq_ru",
  telegramBotToken: "",
  telegramChannelId: "",
  xClientId: "",
  xClientSecret: "",
  xAccessToken: "",
  xRefreshToken: "",
};

// Build default thumbnail templates from the built-in array
function getDefaultTemplates(): CustomPromptTemplate[] {
  const thumbTemplates: CustomPromptTemplate[] = THUMBNAIL_PROMPT_TEMPLATES.map((t) => ({
    id: t.id,
    name: t.name,
    description: t.description,
    prompt: t.prompt,
    category: "thumbnail" as const,
    isBuiltIn: true,
    createdAt: "",
    updatedAt: "",
  }));
  return [...thumbTemplates, ...DEFAULT_CONTENT_TEMPLATES];
}

interface ContentContextValue {
  items: ContentItem[];
  settings: AppSettings;
  templates: CustomPromptTemplate[];
  checklists: Checklist[];
  weeklyStats: WeeklyStats[];
  ideas: Idea[];
  addItem: (item: ContentItem) => void;
  updateItem: (id: string, updates: Partial<ContentItem>) => void;
  deleteItem: (id: string) => void;
  saveSettings: (settings: AppSettings) => void;
  saveTemplate: (template: CustomPromptTemplate) => void;
  deleteTemplate: (id: string) => void;
  saveChecklists: (checklists: Checklist[]) => void;
  addWeeklyStats: (stats: WeeklyStats) => void;
  updateWeeklyStats: (id: string, updates: Partial<WeeklyStats>) => void;
  deleteWeeklyStats: (id: string) => void;
  addIdea: (idea: Idea) => void;
  updateIdea: (id: string, updates: Partial<Idea>) => void;
  deleteIdea: (id: string) => void;
  exportData: () => string;
  importData: (json: string) => boolean;
}

const ContentContext = createContext<ContentContextValue | null>(null);

export function ContentProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ContentItem[]>([]);
  const [settings, setSettings] = useState<AppSettings>(defaultSettings);
  const [templates, setTemplates] = useState<CustomPromptTemplate[]>(getDefaultTemplates);
  const [checklists, setChecklists] = useState<Checklist[]>([]);
  const [weeklyStats, setWeeklyStats] = useState<WeeklyStats[]>([]);
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [hydrated, setHydrated] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const storedContent = localStorage.getItem(CONTENT_KEY);
      if (storedContent) setItems(JSON.parse(storedContent));
      const storedSettings = localStorage.getItem(SETTINGS_KEY);
      if (storedSettings) setSettings({ ...defaultSettings, ...JSON.parse(storedSettings) });
      const storedTemplates = localStorage.getItem(TEMPLATES_KEY);
      if (storedTemplates) {
        const stored: CustomPromptTemplate[] = JSON.parse(storedTemplates);
        const defaults = getDefaultTemplates();
        const storedIds = new Set(stored.map((t) => t.id));
        setTemplates([...stored, ...defaults.filter((d) => !storedIds.has(d.id))]);
      }
      const storedChecklists = localStorage.getItem(CHECKLISTS_KEY);
      if (storedChecklists) setChecklists(JSON.parse(storedChecklists));
      const storedStats = localStorage.getItem(STATS_KEY);
      if (storedStats) setWeeklyStats(JSON.parse(storedStats));
      const storedIdeas = localStorage.getItem(IDEAS_KEY);
      if (storedIdeas) setIdeas(JSON.parse(storedIdeas));
    } catch (e) {
      console.error("Failed to load from localStorage:", e);
    }
    setHydrated(true);
  }, []);

  // Persist all data
  useEffect(() => { if (hydrated) localStorage.setItem(CONTENT_KEY, JSON.stringify(items)); }, [items, hydrated]);
  useEffect(() => { if (hydrated) localStorage.setItem(TEMPLATES_KEY, JSON.stringify(templates)); }, [templates, hydrated]);
  useEffect(() => { if (hydrated) localStorage.setItem(CHECKLISTS_KEY, JSON.stringify(checklists)); }, [checklists, hydrated]);
  useEffect(() => { if (hydrated) localStorage.setItem(STATS_KEY, JSON.stringify(weeklyStats)); }, [weeklyStats, hydrated]);
  useEffect(() => { if (hydrated) localStorage.setItem(IDEAS_KEY, JSON.stringify(ideas)); }, [ideas, hydrated]);

  const addItem = useCallback((item: ContentItem) => { setItems((prev) => [item, ...prev]); }, []);
  const updateItem = useCallback((id: string, updates: Partial<ContentItem>) => {
    setItems((prev) => prev.map((item) => item.id === id ? { ...item, ...updates, updatedAt: new Date().toISOString() } : item));
  }, []);
  const deleteItem = useCallback((id: string) => { setItems((prev) => prev.filter((item) => item.id !== id)); }, []);

  const saveSettingsHandler = useCallback((newSettings: AppSettings) => {
    setSettings(newSettings); localStorage.setItem(SETTINGS_KEY, JSON.stringify(newSettings));
  }, []);

  const saveTemplate = useCallback((template: CustomPromptTemplate) => {
    setTemplates((prev) => {
      const idx = prev.findIndex((t) => t.id === template.id);
      if (idx !== -1) { const u = [...prev]; u[idx] = { ...template, updatedAt: new Date().toISOString() }; return u; }
      return [...prev, { ...template, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }];
    });
  }, []);
  const deleteTemplate = useCallback((id: string) => { setTemplates((prev) => prev.filter((t) => t.id !== id)); }, []);

  // Checklists
  const saveChecklists = useCallback((cls: Checklist[]) => { setChecklists(cls); }, []);

  // Stats
  const addWeeklyStats = useCallback((s: WeeklyStats) => { setWeeklyStats((prev) => [...prev, s]); }, []);
  const updateWeeklyStats = useCallback((id: string, updates: Partial<WeeklyStats>) => {
    setWeeklyStats((prev) => prev.map((s) => s.id === id ? { ...s, ...updates } : s));
  }, []);
  const deleteWeeklyStats = useCallback((id: string) => { setWeeklyStats((prev) => prev.filter((s) => s.id !== id)); }, []);

  // Ideas
  const addIdea = useCallback((idea: Idea) => { setIdeas((prev) => [idea, ...prev]); }, []);
  const updateIdea = useCallback((id: string, updates: Partial<Idea>) => {
    setIdeas((prev) => prev.map((i) => i.id === id ? { ...i, ...updates } : i));
  }, []);
  const deleteIdea = useCallback((id: string) => { setIdeas((prev) => prev.filter((i) => i.id !== id)); }, []);

  const exportData = useCallback(() => {
    return JSON.stringify({
      version: 1,
      exportedAt: new Date().toISOString(),
      content: items,
      settings,
      templates,
      checklists,
      weeklyStats,
      ideas,
    }, null, 2);
  }, [items, settings, templates, checklists, weeklyStats, ideas]);

  const importData = useCallback((json: string): boolean => {
    try {
      const data = JSON.parse(json);
      if (data.content) setItems(data.content);
      if (data.settings) setSettings({ ...defaultSettings, ...data.settings });
      if (data.templates) setTemplates(data.templates);
      if (data.checklists) setChecklists(data.checklists);
      if (data.weeklyStats) setWeeklyStats(data.weeklyStats);
      if (data.ideas) setIdeas(data.ideas);
      return true;
    } catch {
      return false;
    }
  }, []);

  return (
    <ContentContext.Provider
      value={{
        items, settings, templates, checklists, weeklyStats, ideas,
        addItem, updateItem, deleteItem,
        saveSettings: saveSettingsHandler,
        saveTemplate, deleteTemplate,
        saveChecklists,
        addWeeklyStats, updateWeeklyStats, deleteWeeklyStats,
        addIdea, updateIdea, deleteIdea,
        exportData, importData,
      }}
    >
      {children}
    </ContentContext.Provider>
  );
}

export function useContent() {
  const ctx = useContext(ContentContext);
  if (!ctx) throw new Error("useContent must be used within ContentProvider");
  return ctx;
}
