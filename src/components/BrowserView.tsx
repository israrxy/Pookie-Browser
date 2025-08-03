import { useEffect, useMemo, useRef, useState } from "react";
import { useTabsStore } from "../store/tabs";
import type { Tab } from "../store/tabs";

// Extend the JSX namespace to include the webview element
declare global {
  namespace JSX {
    interface IntrinsicElements {
      webview: React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement> & {
          src?: string;
          style?: React.CSSProperties;
          className?: string;
          id?: string;
          nodeintegration?: boolean;
          webpreferences?: string;
          allowpopups?: boolean;
        },
        HTMLElement
      >;
    }
  }
}

export default function BrowserView() {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const lastTitleRef = useRef<string>("");
  const [blocked, setBlocked] = useState(false);

  // Select with shallow to avoid unstable object selectors
  const tabs = useTabsStore((s) => s.tabs);
  const activeId = useTabsStore((s) => s.activeId);
  const updateTab = useTabsStore((s) => s.updateTab);
  const useWebview = useTabsStore((s) => s.useWebview);

  const active = useMemo(
    () => tabs.find((t: Tab) => t.id === activeId) ?? null,
    [tabs, activeId]
  );

  // Handle navigation and determine if the site is likely blocked from embedding.
  useEffect(() => {
    const iv = iframeRef.current;
    if (!iv || !active || active.url === "about:home") return;

    // reset title snapshot and blocked state on each navigation
    lastTitleRef.current = active.title ?? "";
    setBlocked(false);

    // Diagnostic: log the URL being loaded
    console.debug("[BrowserView] Loading URL:", active.url);

    const onLoad = () => {
      // If we can access the document, update the title and consider it not blocked.
      try {
        const title = iv.contentDocument?.title?.trim();
        if (title && title.length > 0 && title !== lastTitleRef.current && title !== active.title) {
          lastTitleRef.current = title;
          updateTab(active.id, { title });
        }
        setBlocked(false);
      } catch {
        // Cross-origin access throws for most real sites.
        // Many legitimate sites that DO allow embedding will still throw here,
        // so we should not mark as blocked immediately.
      }

      // Heuristic after a short delay: if the iframe has non-zero size but remains visually empty,
      // show the "can't embed" overlay. We purposely use a longer timeout so normal sites have time to paint.
      const t = window.setTimeout(() => {
        try {
          const rect = iv.getBoundingClientRect();
          // If the iframe occupies space but we still couldn't read anything and user sees nothing,
          // it's likely blocked by frame-ancestors/XFO; show overlay.
          if (rect.width > 0 && rect.height > 0) {
            setBlocked(true);
          }
        } catch {
          setBlocked(true);
        }
      }, 600);

      // If the iframe navigates again, clear the pending check
      iv.addEventListener("load", () => window.clearTimeout(t), { once: true });
    };

    iv.addEventListener("load", onLoad);
    return () => {
      iv.removeEventListener("load", onLoad);
    };
  }, [active?.id, active?.url, updateTab]);

  if (!active) {
    return <div className="flex-1" />;
  }

  if (active.url === "about:home") {
    return <HomePage />;
  }

  // Render webview for Electron or iframe for web
  if (useWebview) {
    return (
      <div className="flex-1 relative overflow-hidden">
        <webview
          key={active.id}
          src={active.url}
          className="absolute inset-0 w-full h-full"
          style={{ backgroundColor: 'white' }}
          nodeintegration={false}
          webpreferences="contextIsolation=true"
          allowpopups={true}
        />
      </div>
    );
  }

  return (
    <div className="flex-1 relative overflow-hidden">
      <iframe
        key={active.id}
        ref={iframeRef}
        // Important: do not set display:none or visibility hidden; keep it paintable
        src={active.url}
        // Keep sandbox permissive enough for common embedded sites while still safe
        sandbox="allow-scripts allow-forms allow-same-origin allow-popups allow-modals allow-popups-to-escape-sandbox allow-top-navigation"
        className="absolute inset-0 w-full h-full bg-transparent"
        // Use a lenient referrer; some CDNs rely on this to serve assets
        referrerPolicy="no-referrer-when-downgrade"
        // Prevent the iframe from stealing focus on load; optional
        allow="autoplay; clipboard-read; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
        // Fallback diagnostic content if src fails to load entirely
        srcDoc={active.url.startsWith("http") ? undefined : `<html><body style="background:#000;color:#fff;padding:1rem;">Invalid URL: ${active.url}</body></html>`}
      />
      {blocked && (
        <div className="absolute inset-0 z-10 flex items-center justify-center">
          <div className="m-4 max-w-lg w-full rounded-xl border border-white/10 bg-black/60 backdrop-blur-md p-4 text-center">
            <div className="text-white/90 font-medium mb-2">This site can't be embedded</div>
            <div className="text-white/70 text-sm mb-4">
              The website sent security headers that prevent embedding. This is a limitation of web apps. Open it in a new browser tab.
            </div>
            <div className="flex items-center justify-center gap-2">
              <a
                className="px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20 border border-white/10 text-white/90"
                href={active.url}
                target="_blank"
                rel="noopener noreferrer"
              >
                Open in new tab
              </a>
              <button
                className="px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-white/80"
                onClick={() => setBlocked(false)}
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}
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
