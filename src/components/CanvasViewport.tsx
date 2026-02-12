"use client";

import { useRef, useEffect, useCallback, useState } from "react";
import { PixiRenderer } from "@/engine/PixiRenderer";
import { PlaybackEngine } from "@/engine/PlaybackEngine";
import { useEditorStore } from "@/store/editorStore";

export default function CanvasViewport() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<PixiRenderer | null>(null);
  const engineRef = useRef<PlaybackEngine | null>(null);
  const [backendType, setBackendType] = useState<string>("initializing...");

  const {
    project,
    clips,
    tracks,
    currentTime,
    isPlaying,
    setCurrentTime,
    setIsPlaying,
  } = useEditorStore();

  // Initialize PixiJS renderer
  useEffect(() => {
    if (!canvasRef.current) return;

    const renderer = new PixiRenderer(project);
    const engine = new PlaybackEngine(renderer, project);

    renderer.init(canvasRef.current).then(() => {
      setBackendType(renderer.rendererType);

      // Fit canvas to container
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const scale = Math.min(
          rect.width / project.width,
          rect.height / project.height
        );
        const w = project.width * scale;
        const h = project.height * scale;
        renderer.resize(w, h);
        if (canvasRef.current) {
          canvasRef.current.style.width = `${w}px`;
          canvasRef.current.style.height = `${h}px`;
        }
      }
    });

    engine.setTimeUpdateCallback((time) => {
      setCurrentTime(time);
    });

    rendererRef.current = renderer;
    engineRef.current = engine;

    return () => {
      engine.destroy();
      rendererRef.current = null;
      engineRef.current = null;
    };
    // Only run on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Handle play/pause
  useEffect(() => {
    const engine = engineRef.current;
    if (!engine) return;

    if (isPlaying) {
      engine.seek(currentTime);
      engine.play();
    } else {
      engine.pause();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPlaying]);

  // Render frame on time/clip changes
  useEffect(() => {
    const renderer = rendererRef.current;
    if (!renderer) return;

    const trackOrder = new Map(tracks.map((t) => [t.id, t.order]));
    const visibleClips = clips.filter(
      (c) =>
        currentTime >= c.startTime &&
        currentTime < c.startTime + c.duration &&
        tracks.find((t) => t.id === c.trackId)?.visible !== false
    );

    renderer.renderFrame(visibleClips, currentTime, trackOrder);
  }, [clips, tracks, currentTime]);

  // Resize observer
  useEffect(() => {
    if (!containerRef.current || !canvasRef.current) return;

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry || !rendererRef.current || !canvasRef.current) return;

      const { width, height } = entry.contentRect;
      const scale = Math.min(
        width / project.width,
        height / project.height
      );
      const w = project.width * scale;
      const h = project.height * scale;
      rendererRef.current.resize(w, h);
      canvasRef.current.style.width = `${w}px`;
      canvasRef.current.style.height = `${h}px`;
    });

    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [project.width, project.height]);

  // Transport controls
  const togglePlay = useCallback(() => {
    setIsPlaying(!isPlaying);
  }, [isPlaying, setIsPlaying]);

  const stopPlayback = useCallback(() => {
    setIsPlaying(false);
    setCurrentTime(0);
    engineRef.current?.stop();
  }, [setIsPlaying, setCurrentTime]);

  const skipBackward = useCallback(() => {
    setCurrentTime(Math.max(0, currentTime - 1));
    engineRef.current?.seek(Math.max(0, currentTime - 1));
  }, [currentTime, setCurrentTime]);

  const skipForward = useCallback(() => {
    setCurrentTime(Math.min(project.duration, currentTime + 1));
    engineRef.current?.seek(Math.min(project.duration, currentTime + 1));
  }, [currentTime, project.duration, setCurrentTime]);

  const formatTime = (t: number) => {
    const mins = Math.floor(t / 60);
    const secs = Math.floor(t % 60);
    const frames = Math.floor((t % 1) * project.fps);
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}:${frames.toString().padStart(2, "0")}`;
  };

  return (
    <div className="flex flex-col h-full bg-editor-bg">
      {/* Renderer badge */}
      <div className="flex items-center justify-between px-3 py-1 bg-editor-surface border-b border-editor-panel">
        <span className="text-[10px] text-editor-muted uppercase tracking-wider">
          Preview
        </span>
        <span className="text-[10px] px-1.5 py-0.5 rounded bg-editor-panel text-editor-accent font-mono">
          {backendType}
        </span>
      </div>

      {/* Canvas area */}
      <div
        ref={containerRef}
        className="flex-1 flex items-center justify-center overflow-hidden p-4"
      >
        <canvas
          ref={canvasRef}
          className="rounded shadow-2xl shadow-black/50"
          style={{ imageRendering: "auto" }}
        />
      </div>

      {/* Transport bar */}
      <div className="flex items-center justify-center gap-3 px-4 py-2 bg-editor-surface border-t border-editor-panel">
        <button
          onClick={stopPlayback}
          className="w-8 h-8 flex items-center justify-center rounded hover:bg-editor-panel text-editor-muted hover:text-editor-text transition-colors"
          title="Stop"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
            <rect x="2" y="2" width="10" height="10" rx="1" />
          </svg>
        </button>

        <button
          onClick={skipBackward}
          className="w-8 h-8 flex items-center justify-center rounded hover:bg-editor-panel text-editor-muted hover:text-editor-text transition-colors"
          title="Skip backward 1s"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
            <rect x="1" y="2" width="2" height="10" rx="0.5" />
            <path d="M12 2L5 7l7 5V2z" />
          </svg>
        </button>

        <button
          onClick={togglePlay}
          className="w-10 h-10 flex items-center justify-center rounded-full bg-editor-accent hover:bg-editor-accent/80 text-white transition-colors"
          title={isPlaying ? "Pause" : "Play"}
        >
          {isPlaying ? (
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <rect x="3" y="2" width="4" height="12" rx="1" />
              <rect x="9" y="2" width="4" height="12" rx="1" />
            </svg>
          ) : (
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <path d="M4 2l10 6-10 6V2z" />
            </svg>
          )}
        </button>

        <button
          onClick={skipForward}
          className="w-8 h-8 flex items-center justify-center rounded hover:bg-editor-panel text-editor-muted hover:text-editor-text transition-colors"
          title="Skip forward 1s"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
            <path d="M2 2l7 5-7 5V2z" />
            <rect x="11" y="2" width="2" height="10" rx="0.5" />
          </svg>
        </button>

        {/* Timecode */}
        <span className="font-mono text-sm text-editor-text ml-4 tabular-nums">
          {formatTime(currentTime)}
        </span>
        <span className="text-xs text-editor-muted">
          / {formatTime(project.duration)}
        </span>
      </div>
    </div>
  );
}
