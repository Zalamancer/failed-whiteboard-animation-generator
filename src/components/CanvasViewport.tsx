"use client";

import { useRef, useEffect, useCallback, useState } from "react";
import { PixiRenderer } from "@/engine/PixiRenderer";
import { PlaybackEngine } from "@/engine/PlaybackEngine";
import { useEditorStore } from "@/store/editorStore";
import { DEFAULT_TRANSFORM } from "@/engine/types";

export default function CanvasViewport() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<PixiRenderer | null>(null);
  const engineRef = useRef<PlaybackEngine | null>(null);
  const [backendType, setBackendType] = useState<string>("initializing...");

  // Canvas interaction state
  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef<{
    clipId: string;
    startMouseX: number;
    startMouseY: number;
    startClipX: number;
    startClipY: number;
  } | null>(null);

  const {
    project,
    clips,
    tracks,
    currentTime,
    isPlaying,
    setCurrentTime,
    setIsPlaying,
    selectedClipId,
    selectClip,
    updateClip,
    addClip,
    addTrack,
    activeTool,
    setActiveTool,
  } = useEditorStore();

  // Initialize PixiJS renderer
  useEffect(() => {
    if (!canvasRef.current) return;

    const renderer = new PixiRenderer(project);
    const engine = new PlaybackEngine(renderer, project);

    renderer.init(canvasRef.current).then(() => {
      setBackendType(renderer.rendererType);

      // Fit canvas to container via CSS only – keep renderer at project resolution
      if (containerRef.current && canvasRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const scale = Math.min(
          rect.width / project.width,
          rect.height / project.height
        );
        canvasRef.current.style.width = `${project.width * scale}px`;
        canvasRef.current.style.height = `${project.height * scale}px`;
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
      if (!entry || !canvasRef.current) return;

      const { width, height } = entry.contentRect;
      const scale = Math.min(
        width / project.width,
        height / project.height
      );
      canvasRef.current.style.width = `${project.width * scale}px`;
      canvasRef.current.style.height = `${project.height * scale}px`;
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

  // Convert CSS pixel coords on the <canvas> element to project coords
  const cssToProject = useCallback(
    (clientX: number, clientY: number): { x: number; y: number } | null => {
      const canvas = canvasRef.current;
      if (!canvas) return null;
      const rect = canvas.getBoundingClientRect();
      const scaleX = project.width / rect.width;
      const scaleY = project.height / rect.height;
      return {
        x: (clientX - rect.left) * scaleX,
        y: (clientY - rect.top) * scaleY,
      };
    },
    [project.width, project.height]
  );

  // Canvas pointer down: select / start drag / text tool
  const handleCanvasPointerDown = useCallback(
    (e: React.PointerEvent) => {
      const renderer = rendererRef.current;
      if (!renderer) return;

      const pt = cssToProject(e.clientX, e.clientY);
      if (!pt) return;

      if (activeTool === "text") {
        // Add a text clip at click position
        const store = useEditorStore.getState();

        // Find or create a text track
        let textTrack = store.tracks.find((t) => t.type === "text");
        if (!textTrack) {
          textTrack = addTrack("text", "Text");
        }
        const trackId = textTrack.id;

        // Place after existing clips on this track (or at currentTime)
        const trackClips = store.clips.filter((c) => c.trackId === trackId);
        const lastEnd = trackClips.reduce(
          (max, c) => Math.max(max, c.startTime + c.duration),
          0
        );
        const startTime = Math.max(currentTime, lastEnd);

        const clip = addClip({
          type: "text",
          name: "Text clip",
          trackId,
          startTime,
          duration: 3,
          sourceOffset: 0,
          sourceDuration: 3,
          transform: {
            ...DEFAULT_TRANSFORM,
            x: pt.x - project.width / 2,
            y: pt.y - project.height / 2,
          },
          text: "New Text",
          fontSize: 64,
          fontFamily: "Arial",
          color: "#ffffff",
        });
        selectClip(clip.id);
        setActiveTool("select");
        return;
      }

      // Select tool: hit-test
      const hitId = renderer.hitTest(pt.x, pt.y);
      selectClip(hitId);

      if (hitId) {
        const clip = clips.find((c) => c.id === hitId);
        if (clip) {
          dragRef.current = {
            clipId: hitId,
            startMouseX: pt.x,
            startMouseY: pt.y,
            startClipX: clip.transform.x,
            startClipY: clip.transform.y,
          };
          setIsDragging(true);
          (e.target as HTMLElement).setPointerCapture(e.pointerId);
        }
      }
    },
    [
      activeTool,
      clips,
      currentTime,
      project.width,
      project.height,
      cssToProject,
      selectClip,
      addClip,
      addTrack,
      setActiveTool,
    ]
  );

  const handleCanvasPointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!isDragging || !dragRef.current) return;

      const pt = cssToProject(e.clientX, e.clientY);
      if (!pt) return;

      const dx = pt.x - dragRef.current.startMouseX;
      const dy = pt.y - dragRef.current.startMouseY;

      const clip = clips.find((c) => c.id === dragRef.current!.clipId);
      if (!clip) return;

      updateClip(dragRef.current.clipId, {
        transform: {
          ...clip.transform,
          x: dragRef.current.startClipX + dx,
          y: dragRef.current.startClipY + dy,
        },
      });
    },
    [isDragging, cssToProject, clips, updateClip]
  );

  const handleCanvasPointerUp = useCallback(() => {
    dragRef.current = null;
    setIsDragging(false);
  }, []);

  // Sync bounding box with selection
  useEffect(() => {
    rendererRef.current?.showBoundingBox(selectedClipId);
  }, [selectedClipId, clips, currentTime]);

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
          style={{
            imageRendering: "auto",
            cursor:
              activeTool === "text"
                ? "crosshair"
                : isDragging
                  ? "grabbing"
                  : "default",
          }}
          onPointerDown={handleCanvasPointerDown}
          onPointerMove={handleCanvasPointerMove}
          onPointerUp={handleCanvasPointerUp}
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
