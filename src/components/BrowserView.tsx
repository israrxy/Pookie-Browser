import { useEffect, useMemo, useRef } from "react";
import { useTabsStore } from "../store/tabs";
import type { Tab } from "../store/tabs";

export default function BrowserView() {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const lastTitleRef = useRef<string>("");

  // Select with shallow to avoid unstable object selectors
  const tabs = useTabsStore((s) => s.tabs);
  const activeId = useTabsStore((s) => s.activeId);
  const updateTab = useTabsStore((s) => s.updateTab);

  const active = useMemo(
    () => tabs.find((t: Tab) => t.id === activeId) ?? null,
    [tabs, activeId]
  );

  // Update title on same-origin load, with persistent ref and strict guard to avoid feedback loops
  useEffect(() => {
    const iv = iframeRef.current;
    if (!iv || !active || active.url === "about:home") return;

    // reset last title when switching tab/id/url
    lastTitleRef.current = active.title ?? "";

    const handler = () => {
      try {
        const title = iv.contentDocument?.title?.trim();
        // Guard against redundant updates
        if (
          title &&
          title.length > 0 &&
          title !== lastTitleRef.current &&
          title !== active.title
        ) {
          lastTitleRef.current = title;
          // Debug: uncomment if needed
          // console.debug("[BrowserView] updating title", { id: active.id, title });
          updateTab(active.id, { title });
        }
      } catch {
        // cross-origin; ignore
      }
    };

    iv.addEventListener("load", handler);
    return () => {
      iv.removeEventListener("load", handler);
    };
  }, [active?.id, active?.url, updateTab]);

  if (!active) {
    return (
      <div className="flex-1 relative">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-purple-700/10" />
        <div className="absolute inset-0 backdrop-blur-md" />
      </div>
    );
  }

  if (active.url === "about:home") {
    return <HomePage />;
  }

  return (
    <div className="flex-1 relative rounded-xl overflow-hidden border border-white/10">
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-purple-700/10 pointer-events-none" />
      <iframe
        key={active.id}
        ref={iframeRef}
        src={active.url}
        sandbox="allow-scripts allow-forms allow-same-origin allow-popups"
        className="w-full h-full bg-black/20"
        referrerPolicy="no-referrer"
      />
    </div>
  );
}

function HomePage() {
  // Avoid object selector; select individually
  const updateTab = useTabsStore((s) => s.updateTab);
  const activeId = useTabsStore((s) => s.activeId);
  const bookmarks: Array<{ title: string; url: string }> = [
    { title: "MDN", url: "https://developer.mozilla.org/" },
    { title: "GitHub", url: "https://github.com/" },
    { title: "W3C", url: "https://www.w3.org/" },
    { title: "ECMA", url: "https://tc39.es/" },
    { title: "Wikipedia", url: "https://wikipedia.org/" },
    { title: "Archive", url: "https://archive.org/" },
  ];

  function openUrl(url: string) {
    if (!activeId) return;
    updateTab(activeId, { url, title: url });
  }

  return (
    <div className="flex-1 relative p-6">
      <div className="absolute inset-0 bg-gradient-to-b from-indigo-500/20 to-purple-700/20" />
      <div className="absolute inset-0 backdrop-blur-md" />
      <div className="relative">
        <h1 className="text-xl font-semibold text-white/90 mb-4">Home</h1>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {bookmarks.map((b) => (
            <button
              key={b.url}
              onClick={() => openUrl(b.url)}
              className="group rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition-colors p-4 text-left"
            >
              <div className="w-10 h-10 rounded-lg bg-white/10 mb-3" />
              <div className="text-white/90 group-hover:text-white text-sm">{b.title}</div>
              <div className="text-white/50 text-xs truncate">{b.url}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
