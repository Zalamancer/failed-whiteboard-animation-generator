"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { initializeProject } from "@/store/editorStore";

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
        <div className="w-52 flex-shrink-0 border-r border-editor-panel">
          <MediaBrowser />
        </div>

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
