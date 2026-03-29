"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { initializeProject, useEditorStore } from "@/store/editorStore";

// PixiJS requires browser APIs - must be client-only
const CanvasViewport = dynamic(() => import("@/components/CanvasViewport"), {
  ssr: false,
});
const Timeline = dynamic(() => import("@/components/Timeline"), { ssr: false });
const Toolbar = dynamic(() => import("@/components/Toolbar"), { ssr: false });
const PropertiesPanel = dynamic(() => import("@/components/PropertiesPanel"), {
  ssr: false,
});
const MediaBrowser = dynamic(() => import("@/components/MediaBrowser"), {
  ssr: false,
});

function LeftPanel() {
  const collapsed = useEditorStore((s) => s.leftPanelCollapsed);

  return (
    <div
      className="flex-shrink-0 overflow-hidden border-r border-editor-panel transition-[width] duration-200"
      style={{ width: collapsed ? 0 : 208 }}
    >
      <div className="w-52 h-full">
        <MediaBrowser />
      </div>
    </div>
  );
}

function PanelTogglePill() {
  const collapsed = useEditorStore((s) => s.leftPanelCollapsed);
  const toggle = useEditorStore((s) => s.toggleLeftPanel);

  return (
    <button
      onClick={toggle}
      className="w-5 flex-shrink-0 flex items-center justify-center
        bg-editor-panel/50 hover:bg-editor-panel border-r border-editor-panel
        text-editor-muted hover:text-editor-text transition-colors"
      title={collapsed ? "Expand media browser" : "Collapse media browser"}
    >
      <svg
        width="12"
        height="12"
        viewBox="0 0 12 12"
        fill="none"
        className={`transition-transform duration-200 ${collapsed ? "rotate-180" : ""}`}
      >
        <path
          d="M8 2L4 6L8 10"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  );
}

export default function EditorPage() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    initializeProject();
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-editor-bg">
        <div className="text-center">
          <div className="text-2xl font-bold text-editor-accent mb-2">
            ProAnimate
          </div>
          <div className="text-sm text-editor-muted">
            Initializing editor...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden bg-editor-bg">
      {/* Top toolbar */}
      <Toolbar />

      {/* Main content area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left panel: Media browser */}
        <LeftPanel />
        {/* Toggle pill — sibling of panel, never clipped by it */}
        <PanelTogglePill />

        {/* Center: Canvas viewport */}
        <div className="flex-1 min-w-0">
          <CanvasViewport />
        </div>

        {/* Right panel: Properties */}
        <div className="w-60 flex-shrink-0 border-l border-editor-panel overflow-y-auto">
          <PropertiesPanel />
        </div>
      </div>

      {/* Bottom: Timeline */}
      <div className="h-56 flex-shrink-0 border-t border-editor-panel">
        <Timeline />
      </div>
    </div>
  );
}
