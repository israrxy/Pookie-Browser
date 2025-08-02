import { ArrowRight } from "lucide-react";
import { useTabsStore } from "../store/tabs";

export default function AddressBar() {
  const { tabs, activeId, updateTab } = useTabsStore((s) => ({
    tabs: s.tabs,
    activeId: s.activeId,
    updateTab: s.updateTab,
  }));
  const active = tabs.find((t) => t.id === activeId) ?? null;

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!active) return;
    const data = new FormData(e.currentTarget);
    const raw = (data.get("q") as string) || "";
    let url = raw.trim();
    if (!url) return;

    try {
      if (!/^https?:\/\//i.test(url) && !/^about:/.test(url)) {
        if (/^[\w.-]+\.[a-z]{2,}($|[\/?])/i.test(url)) {
          url = "https://" + url;
        } else {
          url = "https://duckduckgo.com/?q=" + encodeURIComponent(raw);
        }
      }
      new URL(url);
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
