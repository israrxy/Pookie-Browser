import { useEffect } from "react";
import Sidebar from "./components/Sidebar";
import BrowserView from "./components/BrowserView";
import { useTabsStore } from "./store/tabs";
import { ArrowRight, RefreshCw, Shield, Moon, Sun } from "lucide-react";
import classNames from "classnames";

function AddressBar() {
  const { tabs, activeId, updateTab, addTab } = useTabsStore((s) => ({
    tabs: s.tabs,
    activeId: s.activeId,
    updateTab: s.updateTab,
    addTab: s.addTab,
  }));
  const active = tabs.find((t) => t.id === activeId) ?? null;

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!active) return;
    const data = new FormData(e.currentTarget);
    const raw = (data.get("q") as string) || "";
    let url = raw.trim();
    if (!url) return;

    // Basic URL normalization. If not a valid URL, search via DuckDuckGo (no telemetry).
    try {
      // If user typed without protocol, add https://
      if (!/^https?:\/\//i.test(url) && !/^about:/.test(url)) {
        if (/^[\w.-]+\.[a-z]{2,}($|[\/?])/i.test(url)) {
          url = "https://" + url;
        } else {
          url = "https://duckduckgo.com/?q=" + encodeURIComponent(raw);
        }
      }
      new URL(url); // validate
    } catch {
      url = "https://duckduckgo.com/?q=" + encodeURIComponent(raw);
    }

    updateTab(active.id, { url, title: url });
  }

  return (
    <form onSubmit={onSubmit} className="flex items-center gap-2">
      <div className="relative flex-1">
        <input
          name="q"
          defaultValue={active?.url === "about:home" ? "" : active?.url}
          placeholder="Search or enter address"
          className="w-full rounded-xl bg-white/5 border border-white/10 text-white/90 placeholder-white/50 px-4 py-2 outline-none focus:ring-2 focus:ring-indigo-500/40"
          autoComplete="off"
        />
        <div className="pointer-events-none absolute inset-0 rounded-xl backdrop-blur-[1px]" />
      </div>
      <button
        type="submit"
        aria-label="Go"
        className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white/80 transition-colors"
      >
        <ArrowRight size={16} />
      </button>
    </form>
  );
}

function ThemeToggle() {
  const { theme, setTheme } = useTabsStore((s) => ({
    theme: s.theme,
    setTheme: s.setTheme,
  }));
  const isDark = theme !== "light";
  return (
    <button
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="p-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-white/80 transition-colors"
      aria-label="Toggle theme"
      title="Toggle theme"
    >
      {isDark ? <Sun size={16} /> : <Moon size={16} />}
    </button>
  );
}

export default function App() {
  const { load, theme } = useTabsStore((s) => ({
    load: s.load,
    theme: s.theme,
  }));

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const root = document.documentElement;
    if (theme === "light") {
      root.classList.remove("dark");
    } else {
      root.classList.add("dark");
    }
  }, [theme]);

  return (
    <div className={classNames("h-screen w-screen overflow-hidden", "bg-[#0b0b0f] text-white")}>
      <div className="flex h-full">
        <Sidebar />
        <main className="flex-1 h-full relative p-3">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/20 to-purple-700/20" />
          <div className="absolute inset-0 backdrop-blur-xl" />
          <div className="relative h-full flex flex-col gap-3">
            <header className="rounded-2xl border border-white/10 bg-glass/60 backdrop-blur-xl shadow-lg p-3">
              <div className="flex items-center gap-3">
                <div className="hidden sm:flex items-center gap-2 text-white/70">
                  <Shield size={16} />
                  <span className="text-xs">Ad/tracker blocking ready</span>
                </div>
                <div className="ml-auto flex items-center gap-2">
                  <ThemeToggle />
                </div>
              </div>
              <div className="mt-3">
                <AddressBar />
              </div>
            </header>
            <section className="flex-1 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl overflow-hidden">
              <BrowserView />
            </section>
          </div>
        </main>
      </div>
    </div>
  );
}
