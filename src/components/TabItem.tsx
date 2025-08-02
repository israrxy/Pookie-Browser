import type { Tab } from "../store/tabs";
import classNames from "classnames";
import { Copy, X } from "lucide-react";
import React from "react";

function truncateTitle(title: string, max = 20) {
  if (title.length <= max) return title;
  return title.slice(0, max - 1) + "…";
}

export default function TabItem({
  tab,
  active,
  onClick,
  onClose,
  onDuplicate,
  onContextMenu,
}: {
  tab: Tab;
  active: boolean;
  onClick: () => void;
  onClose: () => void;
  onDuplicate: () => void;
  onContextMenu: (e: React.MouseEvent) => void;
}) {
  return (
    <div
      onClick={onClick}
      onContextMenu={onContextMenu}
      className={classNames(
        "group flex items-center gap-2 rounded-lg px-2 py-2 mb-1 transition-all",
        "bg-white/0 hover:bg-white/5",
        active ? "bg-white/10 shadow-inner" : ""
      )}
    >
      <div className="w-5 h-5 rounded bg-white/10 shrink-0 overflow-hidden" />
      <div className={classNames("text-sm text-white/80 flex-1 truncate", active && "text-white")}>
        {truncateTitle(tab.title || tab.url)}
      </div>
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDuplicate();
          }}
          className="p-1 rounded hover:bg-white/10 text-white/70"
          aria-label="Duplicate Tab"
        >
          <Copy size={14} />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
          className="p-1 rounded hover:bg-white/10 text-white/70"
          aria-label="Close Tab"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
}
