"use client";

import { useState } from "react";
import { ContentProvider } from "@/lib/ContentContext";
import Sidebar, { type View } from "@/components/Sidebar";
import Dashboard from "@/components/Dashboard";
import Generator from "@/components/Generator";
import ContentCalendar from "@/components/ContentCalendar";
import PreviewGenerator from "@/components/PreviewGenerator";
import CrossPosting from "@/components/CrossPosting";
import ChecklistsPanel from "@/components/ChecklistsPanel";
import AnalyticsPanel from "@/components/AnalyticsPanel";
import IdeasBank from "@/components/IdeasBank";
import SettingsPanel from "@/components/SettingsPanel";

export default function Home() {
  const [view, setView] = useState<View>("dashboard");

  function renderView() {
    switch (view) {
      case "dashboard":
        return <Dashboard onNavigate={setView} />;
      case "generator":
        return <Generator />;
      case "calendar":
        return <ContentCalendar />;
      case "preview":
        return <PreviewGenerator />;
      case "posting":
        return <CrossPosting />;
      case "checklists":
        return <ChecklistsPanel />;
      case "analytics":
        return <AnalyticsPanel />;
      case "ideas":
        return <IdeasBank onNavigate={setView} />;
      case "settings":
        return <SettingsPanel />;
    }
  }

  return (
    <ContentProvider>
      <div className="flex min-h-screen bg-background">
        <Sidebar active={view} onNavigate={setView} />
        <main className="ml-[220px] flex-1 p-6 overflow-y-auto">
          {renderView()}
        </main>
      </div>
    </ContentProvider>
  );
}
