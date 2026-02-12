"use client";

import { useEditorStore } from "@/store/editorStore";

export default function Toolbar() {
  const {
    activeTool,
    setActiveTool,
    snapEnabled,
    toggleSnap,
    project,
    zoom,
    setZoom,
  } = useEditorStore();

  const tools = [
    { id: "select" as const, label: "V", title: "Select (V)" },
    { id: "text" as const, label: "T", title: "Text (T)" },
    { id: "shape" as const, label: "S", title: "Shape (S)" },
    { id: "cut" as const, label: "C", title: "Cut (C)" },
  ];

  return (
    <div className="flex items-center gap-1 bg-editor-surface border-b border-editor-panel px-3 py-1.5 h-10">
      {/* Tool buttons */}
      <div className="flex items-center gap-0.5 mr-4">
        {tools.map((tool) => (
          <button
            key={tool.id}
            title={tool.title}
            onClick={() => setActiveTool(tool.id)}
            className={`w-8 h-7 flex items-center justify-center rounded text-xs font-bold transition-colors ${
              activeTool === tool.id
                ? "bg-editor-accent text-white"
                : "text-editor-muted hover:bg-editor-panel hover:text-editor-text"
            }`}
          >
            {tool.label}
          </button>
        ))}
      </div>

      {/* Separator */}
      <div className="w-px h-5 bg-editor-panel mx-2" />

      {/* Snap toggle */}
      <button
        title="Toggle Snap"
        onClick={toggleSnap}
        className={`px-2 h-7 rounded text-xs font-medium transition-colors ${
          snapEnabled
            ? "bg-editor-accent/20 text-editor-accent border border-editor-accent/40"
            : "text-editor-muted hover:bg-editor-panel"
        }`}
      >
        Snap
      </button>

      {/* Separator */}
      <div className="w-px h-5 bg-editor-panel mx-2" />

      {/* Zoom control */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-editor-muted">Zoom</span>
        <input
          type="range"
          min="10"
          max="200"
          value={zoom}
          onChange={(e) => setZoom(Number(e.target.value))}
          className="w-20"
        />
        <span className="text-xs text-editor-muted w-8">{zoom}px</span>
      </div>

      {/* Separator */}
      <div className="w-px h-5 bg-editor-panel mx-2" />

      {/* Project info */}
      <div className="flex items-center gap-3 ml-auto">
        <span className="text-xs text-editor-muted">
          {project.width}x{project.height}
        </span>
        <span className="text-xs text-editor-muted">{project.fps}fps</span>
      </div>
    </div>
  );
}
