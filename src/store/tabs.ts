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

const sampleTabs: Tab[] = [
  { id: crypto.randomUUID(), title: "Start", url: "about:home", favicon: null },
  { id: crypto.randomUUID(), title: "MDN", url: "https://developer.mozilla.org/", favicon: null },
  { id: crypto.randomUUID(), title: "GitHub", url: "https://github.com/", favicon: null },
];

export const useTabsStore = create<TabsState>((set, get) => ({
  tabs: sampleTabs,
  activeId: sampleTabs[0].id,
  sidebarWidth: 280,
  theme: "dark",
  useWebview: false,
  addTab: (partial) => {
    const tab: Tab = {
      id: crypto.randomUUID(),
      title: partial?.title ?? "New Tab",
      url: partial?.url ?? "about:home",
      favicon: null,
      incognito: !!partial?.incognito,
    };
    set((s) => ({ tabs: [...s.tabs, tab], activeId: tab.id }));
    persist();
  },
  closeTab: (id) => {
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
    });
    persist();
  },
  duplicateTab: (id) => {
    const t = get().tabs.find((x) => x.id === id);
    if (!t) return;
    const dup: Tab = { ...t, id: crypto.randomUUID() };
    set((s) => ({ tabs: [...s.tabs, dup], activeId: dup.id }));
    persist();
  },
  switchTab: (id) => set({ activeId: id }),
  updateTab: (id, patch) => {
    set((s) => ({ tabs: s.tabs.map((t) => (t.id === id ? { ...t, ...patch } : t)) }));
    persist();
  },
  setSidebarWidth: (w) => set({ sidebarWidth: Math.min(420, Math.max(200, w)) }),
  setTheme: (t) => {
    set({ theme: t });
    persist();
  },
  setUseWebview: (v) => set({ useWebview: v }),
  load: () => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const saved = JSON.parse(raw);
      set({
        tabs: saved.tabs?.length ? saved.tabs : sampleTabs,
        activeId: saved.activeId ?? saved.tabs?.[0]?.id ?? sampleTabs[0].id,
        sidebarWidth: saved.sidebarWidth ?? 280,
        theme: saved.theme ?? "dark",
      });
    } catch {}
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
