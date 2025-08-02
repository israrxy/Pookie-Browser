import { useRef, useState } from "react";
import { useTabsStore } from "../store/tabs";
import { Plus, X, Copy, ExternalLink } from "lucide-react";
import classNames from "classnames";
import TabItem from "./TabItem";

type ContextPos = { x: number; y: number; tabId: string } | null;

export default function Sidebar() {
  // Select granular slices to avoid unnecessary re-renders that can thrash React 19's external store subscriptions.
  const tabs = useTabsStore((s) => s.tabs);
  const activeId = useTabsStore((s) => s.activeId);
  const addTab = useTabsStore((s) => s.addTab);
  const closeTab = useTabsStore((s) => s.closeTab);
  const duplicateTab = useTabsStore((s) => s.duplicateTab);
  const switchTab = useTabsStore((s) => s.switchTab);
  const sidebarWidth = useTabsStore((s) => s.sidebarWidth);
  const setSidebarWidth = useTabsStore((s) => s.setSidebarWidth);

  const [context, setContext] = useState<ContextPos>(null);
  const resizerRef = useRef<HTMLDivElement>(null);
  const startX = useRef(0);
  const startWidth = useRef(0);

  function onMouseDown(e: React.MouseEvent) {
    startX.current = e.clientX;
    startWidth.current = sidebarWidth;
    function onMove(ev: MouseEvent) {
      const delta = ev.clientX - startX.current;
      setSidebarWidth(startWidth.current + delta);
    }
    function onUp() {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    }
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  }

  function onContextMenu(e: React.MouseEvent, id: string) {
    e.preventDefault();
    setContext({ x: e.clientX, y: e.clientY, tabId: id });
  }

  function closeContext() {
    setContext(null);
  }

  return (
    <aside
      className="h-full select-none relative"
      style={{ width: sidebarWidth }}
    >
      <div className="absolute inset-0 bg-gradient-to-b from-indigo-500/20 to-purple-700/20" />
      <div className="absolute inset-0 backdrop-blur-md bg-glass/50 border-r border-white/10" />
      <div className="relative h-full flex flex-col">
        <div className="flex items-center justify-between px-3 py-3">
          <div className="text-sm font-semibold text-white/80">Tabs</div>
          <button
            onClick={() => addTab()}
            className="p-1.5 rounded-md bg-white/5 hover:bg-white/10 text-white/80 transition-colors"
            aria-label="New Tab"
          >
            <Plus size={16} />
          </button>
        </div>
        <div className="flex-1 overflow-auto px-2 pb-2">
          {tabs.map((t) => (
            <TabItem
              key={t.id}
              tab={t}
              active={t.id === activeId}
              onClick={() => switchTab(t.id)}
              onClose={() => closeTab(t.id)}
              onDuplicate={() => duplicateTab(t.id)}
              onContextMenu={(e) => onContextMenu(e, t.id)}
            />
          ))}
        </div>
      </div>
      <div
        ref={resizerRef}
        onMouseDown={onMouseDown}
        className="absolute top-0 right-0 w-1 cursor-col-resize h-full bg-transparent"
      />
      {context && (
        <ContextMenu
          x={context.x}
          y={context.y}
          onClose={closeContext}
          onCloseTab={() => {
            closeTab(context.tabId);
            closeContext();
          }}
          onDuplicate={() => {
            duplicateTab(context.tabId);
            closeContext();
          }}
          onOpenWindow={() => {
            const url = tabs.find((t) => t.id === context.tabId)?.url || "about:blank";
            window.open(url, "_blank", "noopener,noreferrer");
            closeContext();
          }}
        />
      )}
    </aside>
  );
}

function ContextMenu({
  x,
  y,
  onClose,
  onCloseTab,
  onDuplicate,
  onOpenWindow,
}: {
  x: number;
  y: number;
  onClose: () => void;
  onCloseTab: () => void;
  onDuplicate: () => void;
  onOpenWindow: () => void;
}) {
  return (
    <div className="fixed inset-0 z-40" onClick={onClose}>
      <div
        className="absolute z-50 min-w-40 rounded-lg border border-white/10 bg-glass/70 backdrop-blur-lg shadow-xl overflow-hidden"
        style={{ left: x, top: y }}
        onClick={(e) => e.stopPropagation()}
      >
        <MenuItem icon={<X size={14} />} label="Close" onClick={onCloseTab} />
        <MenuItem icon={<Copy size={14} />} label="Duplicate" onClick={onDuplicate} />
        <MenuItem icon={<ExternalLink size={14} />} label="Open in new window" onClick={onOpenWindow} />
      </div>
    </div>
  );
}

function MenuItem({
  icon,
  label,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-2 px-3 py-2 text-left text-white/80 hover:bg-white/10 transition-colors"
    >
      {icon}
      <span className="text-sm">{label}</span>
    </button>
  );
}
