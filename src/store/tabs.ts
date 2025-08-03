import { create } from "zustand";

export type Tab = {
  id: string;
  title: string;
  url: string;
  favicon?: string | null;
  incognito?: boolean;
};

export type Theme = "dark" | "light" | "frosted";

type TabsState = {
  tabs: Tab[];
  activeId: string | null;
  sidebarWidth: number; // px
  theme: Theme;
  useWebview: boolean; // Electron switch
  addTab: (partial?: Partial<Tab>) => void;
  closeTab: (id: string) => void;
  duplicateTab: (id: string) => void;
  switchTab: (id: string) => void;
  updateTab: (id: string, patch: Partial<Tab>) => void;
  setSidebarWidth: (w: number) => void;
  setTheme: (t: Theme) => void;
  setUseWebview: (v: boolean) => void;
  load: () => void;
};

const STORAGE_KEY = "pookie.tabs.v1";

// Check if we're running in Electron
const isElectron = typeof window !== 'undefined' && !!(window as any).electron;

const sampleTabs: Tab[] = [
  { id: crypto.randomUUID(), title: "Start", url: "about:home", favicon: null },
];

export const useTabsStore = create<TabsState>((set, get) => ({
  tabs: sampleTabs,
  activeId: sampleTabs[0].id,
  sidebarWidth: 280,
  theme: "dark",
  useWebview: !!isElectron,

  addTab: (partial) =>
    set((s) => {
      const tab: Tab = {
        id: crypto.randomUUID(),
        title: partial?.title ?? "New Tab",
        url: partial?.url ?? "about:home",
        favicon: null,
        incognito: !!partial?.incognito,
      };
      // no-op update if identical to prevent redundant notifications
      return { tabs: [...s.tabs, tab], activeId: tab.id };
    }),

  closeTab: (id) =>
    set((s) => {
      const idx = s.tabs.findIndex((t) => t.id === id);
      if (idx === -1) return s;
      const nextTabs = s.tabs.filter((t) => t.id !== id);
      let nextActive = s.activeId;
      if (s.activeId === id) {
        const fallback = nextTabs[idx] ?? nextTabs[idx - 1] ?? null;
        nextActive = fallback ? fallback.id : null;
      }
      return { tabs: nextTabs, activeId: nextActive };
    }),

  duplicateTab: (id) =>
    set((s) => {
      const t = s.tabs.find((x) => x.id === id);
      if (!t) return s;
      const dup: Tab = { ...t, id: crypto.randomUUID() };
      return { tabs: [...s.tabs, dup], activeId: dup.id };
    }),

  switchTab: (id) =>
    set((s) => (s.activeId === id ? s : { activeId: id })),

  updateTab: (id, patch) =>
    set((s) => {
      let changed = false;
      const next = s.tabs.map((t) => {
        if (t.id !== id) return t;
        const merged = { ...t, ...patch };
        if (
          merged.title !== t.title ||
          merged.url !== t.url ||
          merged.favicon !== t.favicon ||
          merged.incognito !== t.incognito
        ) {
          changed = true;
        }
        return merged;
      });
      return changed ? { tabs: next } : s;
    }),

  setSidebarWidth: (w) =>
    set((s) => {
      const clamped = Math.min(420, Math.max(200, w));
      return s.sidebarWidth === clamped ? s : { sidebarWidth: clamped };
    }),

  setTheme: (t) =>
    set((s) => (s.theme === t ? s : { theme: t })),

  setUseWebview: (v) =>
    set((s) => (s.useWebview === v ? s : { useWebview: v })),

  load: () => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const saved = JSON.parse(raw);
      const nextTabs =
        Array.isArray(saved.tabs) && saved.tabs.length ? saved.tabs : sampleTabs;
      const nextActive =
        typeof saved.activeId === "string" &&
        nextTabs.some((t: Tab) => t.id === saved.activeId)
          ? saved.activeId
          : nextTabs[0].id;
      const nextSidebar =
        typeof saved.sidebarWidth === "number" ? saved.sidebarWidth : 280;
      const nextTheme: Theme =
        saved.theme === "light" || saved.theme === "frosted" ? saved.theme : "dark";

      set((s) => {
        // Avoid redundant notify if nothing changes
        if (
          s.tabs === nextTabs &&
          s.activeId === nextActive &&
          s.sidebarWidth === nextSidebar &&
          s.theme === nextTheme
        ) {
          return s;
        }
        return {
          tabs: nextTabs,
          activeId: nextActive,
          sidebarWidth: nextSidebar,
          theme: nextTheme,
        };
      });
    } catch {
      set((s) => s); // no-op
    }
  },
}));

function persist() {
  try {
    const { tabs, activeId, sidebarWidth, theme } = useTabsStore.getState();
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ tabs, activeId, sidebarWidth, theme })
    );
  } catch {}
}
