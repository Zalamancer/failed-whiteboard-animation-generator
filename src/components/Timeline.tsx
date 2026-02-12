"use client";

import { useRef, useCallback, useEffect, useState } from "react";
import { useEditorStore } from "@/store/editorStore";
import { ClipType, DEFAULT_TRANSFORM } from "@/engine/types";

const TRACK_HEIGHT = 44;
const HEADER_WIDTH = 160;
const RULER_HEIGHT = 28;

const CLIP_COLORS: Record<ClipType, string> = {
  video: "bg-editor-clip-video",
  audio: "bg-editor-clip-audio",
  text: "bg-editor-clip-text",
  image: "bg-editor-clip-image",
  shape: "bg-editor-clip-image",
};

export default function Timeline() {
  const {
    tracks,
    clips,
    currentTime,
    setCurrentTime,
    zoom,
    project,
    selectedClipId,
    selectClip,
    selectedTrackId,
    selectTrack,
    addTrack,
    removeTrack,
    addClip,
    removeClip,
    updateClip,
    updateTrack,
    isPlaying,
    setIsPlaying,
  } = useEditorStore();

  const timelineRef = useRef<HTMLDivElement>(null);
  const [draggingClip, setDraggingClip] = useState<string | null>(null);
  const [dragStartX, setDragStartX] = useState(0);
  const [dragStartTime, setDragStartTime] = useState(0);
  const [resizingClip, setResizingClip] = useState<{
    id: string;
    side: "left" | "right";
  } | null>(null);

  const timeToX = (time: number) => time * zoom;
  const xToTime = (x: number) => x / zoom;

  // Ruler click to seek
  const handleRulerClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const time = xToTime(x);
      setCurrentTime(Math.max(0, Math.min(time, project.duration)));
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [zoom, project.duration, setCurrentTime]
  );

  // Render ruler ticks
  const renderRuler = () => {
    const totalWidth = project.duration * zoom;
    const ticks: React.ReactElement[] = [];

    // Determine tick interval based on zoom
    let interval = 1;
    if (zoom < 20) interval = 10;
    else if (zoom < 40) interval = 5;
    else if (zoom < 100) interval = 1;
    else interval = 0.5;

    for (let t = 0; t <= project.duration; t += interval) {
      const x = timeToX(t);
      const isMajor = t % (interval >= 1 ? 5 : 1) === 0;

      ticks.push(
        <div
          key={t}
          className="absolute top-0"
          style={{ left: `${x}px` }}
        >
          <div
            className={`w-px ${isMajor ? "h-4 bg-editor-muted" : "h-2 bg-editor-panel"}`}
          />
          {isMajor && (
            <span className="absolute top-3 text-[9px] text-editor-muted -translate-x-1/2 select-none">
              {formatRulerTime(t)}
            </span>
          )}
        </div>
      );
    }
    return (
      <div
        className="relative h-full cursor-pointer"
        style={{ width: `${totalWidth}px` }}
        onClick={handleRulerClick}
      >
        {ticks}
      </div>
    );
  };

  const formatRulerTime = (t: number) => {
    if (t < 60) return `${t.toFixed(t % 1 === 0 ? 0 : 1)}s`;
    const m = Math.floor(t / 60);
    const s = Math.floor(t % 60);
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  // Clip drag handlers
  const handleClipMouseDown = (
    e: React.MouseEvent,
    clipId: string
  ) => {
    e.stopPropagation();
    selectClip(clipId);

    const clip = clips.find((c) => c.id === clipId);
    if (!clip) return;

    setDraggingClip(clipId);
    setDragStartX(e.clientX);
    setDragStartTime(clip.startTime);
  };

  const handleResizeMouseDown = (
    e: React.MouseEvent,
    clipId: string,
    side: "left" | "right"
  ) => {
    e.stopPropagation();
    selectClip(clipId);
    setResizingClip({ id: clipId, side });
    setDragStartX(e.clientX);
  };

  // Global mouse move/up for dragging
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (draggingClip) {
        const dx = e.clientX - dragStartX;
        const dt = xToTime(dx);
        const newTime = Math.max(0, dragStartTime + dt);

        const snap = useEditorStore.getState().snapEnabled;
        let snappedTime = newTime;
        if (snap) {
          snappedTime = Math.round(newTime * 10) / 10;
        }

        useEditorStore.getState().updateClip(draggingClip, { startTime: snappedTime });
      }

      if (resizingClip) {
        const dx = e.clientX - dragStartX;
        const dt = xToTime(dx);
        const clip = clips.find((c) => c.id === resizingClip.id);
        if (!clip) return;

        if (resizingClip.side === "right") {
          const newDuration = Math.max(0.1, clip.duration + dt);
          useEditorStore.getState().updateClip(resizingClip.id, { duration: newDuration });
        } else {
          const newStart = Math.max(0, clip.startTime + dt);
          const durationDelta = clip.startTime - newStart;
          const newDuration = Math.max(0.1, clip.duration + durationDelta);
          useEditorStore
            .getState()
            .updateClip(resizingClip.id, {
              startTime: newStart,
              duration: newDuration,
            });
        }
        setDragStartX(e.clientX);
      }
    };

    const handleMouseUp = () => {
      setDraggingClip(null);
      setResizingClip(null);
    };

    if (draggingClip || resizingClip) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
      return () => {
        window.removeEventListener("mousemove", handleMouseMove);
        window.removeEventListener("mouseup", handleMouseUp);
      };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draggingClip, resizingClip, dragStartX, dragStartTime, clips]);

  // Add new clip to selected track
  const handleAddClip = (type: ClipType) => {
    let trackId = selectedTrackId;
    if (!trackId) {
      const track = tracks.find((t) => t.type === type) || tracks[0];
      if (!track) return;
      trackId = track.id;
    }

    const trackClips = clips.filter((c) => c.trackId === trackId);
    const lastEnd = trackClips.reduce(
      (max, c) => Math.max(max, c.startTime + c.duration),
      currentTime
    );

    const defaultProps: Record<string, unknown> =
      type === "text"
        ? { text: "New Text", fontSize: 64, fontFamily: "Arial", color: "#ffffff" }
        : type === "shape"
          ? { shape: "rectangle" as const, fill: "#e94560", width: 300, height: 200 }
          : {};

    addClip({
      type,
      name: `${type.charAt(0).toUpperCase() + type.slice(1)} clip`,
      trackId: trackId!,
      startTime: lastEnd,
      duration: 3,
      sourceOffset: 0,
      sourceDuration: 3,
      transform: { ...DEFAULT_TRANSFORM },
      ...defaultProps,
    });
  };

  const handleAddTrack = (type: ClipType) => {
    addTrack(type);
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement)
        return;

      switch (e.key) {
        case " ":
          e.preventDefault();
          setIsPlaying(!isPlaying);
          break;
        case "Delete":
        case "Backspace":
          if (selectedClipId) removeClip(selectedClipId);
          break;
        case "Escape":
          selectClip(null);
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedClipId, isPlaying, selectClip, removeClip, setIsPlaying]);

  const totalWidth = project.duration * zoom + 200;

  return (
    <div className="flex flex-col h-full bg-editor-surface select-none">
      {/* Timeline toolbar */}
      <div className="flex items-center gap-1 px-2 py-1 border-b border-editor-panel bg-editor-bg/50">
        <span className="text-[10px] text-editor-muted uppercase tracking-wider mr-2">
          Timeline
        </span>
        <button
          onClick={() => handleAddClip("text")}
          className="px-2 py-0.5 text-[10px] rounded bg-editor-clip-text/20 text-editor-clip-text hover:bg-editor-clip-text/30 transition-colors"
        >
          + Text
        </button>
        <button
          onClick={() => handleAddClip("shape")}
          className="px-2 py-0.5 text-[10px] rounded bg-editor-clip-image/20 text-editor-clip-image hover:bg-editor-clip-image/30 transition-colors"
        >
          + Shape
        </button>
        <button
          onClick={() => handleAddTrack("video")}
          className="px-2 py-0.5 text-[10px] rounded bg-editor-clip-video/20 text-editor-clip-video hover:bg-editor-clip-video/30 transition-colors ml-2"
        >
          + Video Track
        </button>
        <button
          onClick={() => handleAddTrack("audio")}
          className="px-2 py-0.5 text-[10px] rounded bg-editor-clip-audio/20 text-editor-clip-audio hover:bg-editor-clip-audio/30 transition-colors"
        >
          + Audio Track
        </button>
      </div>

      {/* Timeline body */}
      <div className="flex flex-1 overflow-hidden">
        {/* Track headers */}
        <div
          className="flex-shrink-0 border-r border-editor-panel overflow-y-auto"
          style={{ width: `${HEADER_WIDTH}px` }}
        >
          {/* Ruler header corner */}
          <div
            className="border-b border-editor-panel bg-editor-bg/30"
            style={{ height: `${RULER_HEIGHT}px` }}
          />

          {/* Track header rows */}
          {tracks.map((track) => (
            <div
              key={track.id}
              onClick={() => selectTrack(track.id)}
              className={`flex items-center gap-1.5 px-2 border-b border-editor-panel/50 cursor-pointer transition-colors ${
                selectedTrackId === track.id
                  ? "bg-editor-panel/50"
                  : "hover:bg-editor-panel/20"
              }`}
              style={{ height: `${TRACK_HEIGHT}px` }}
            >
              {/* Visibility toggle */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  updateTrack(track.id, { visible: !track.visible });
                }}
                className={`w-5 h-5 flex items-center justify-center rounded text-[10px] ${
                  track.visible ? "text-editor-text" : "text-editor-muted/40"
                }`}
                title={track.visible ? "Hide" : "Show"}
              >
                {track.visible ? "👁" : "—"}
              </button>

              {/* Lock toggle */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  updateTrack(track.id, { locked: !track.locked });
                }}
                className={`w-5 h-5 flex items-center justify-center rounded text-[10px] ${
                  track.locked ? "text-editor-accent" : "text-editor-muted/40"
                }`}
                title={track.locked ? "Unlock" : "Lock"}
              >
                {track.locked ? "L" : "·"}
              </button>

              {/* Track name */}
              <span className="text-[11px] text-editor-text truncate flex-1">
                {track.name}
              </span>

              {/* Delete track */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  removeTrack(track.id);
                }}
                className="w-4 h-4 flex items-center justify-center text-editor-muted/40 hover:text-editor-accent text-[10px]"
                title="Delete track"
              >
                x
              </button>
            </div>
          ))}
        </div>

        {/* Scrollable track area */}
        <div ref={timelineRef} className="flex-1 overflow-auto relative">
          {/* Ruler */}
          <div
            className="sticky top-0 z-20 border-b border-editor-panel bg-editor-bg/90 backdrop-blur"
            style={{ height: `${RULER_HEIGHT}px`, width: `${totalWidth}px` }}
          >
            {renderRuler()}
          </div>

          {/* Track rows */}
          <div style={{ width: `${totalWidth}px` }}>
            {tracks.map((track) => (
              <div
                key={track.id}
                className="relative border-b border-editor-panel/30"
                style={{ height: `${TRACK_HEIGHT}px` }}
              >
                {/* Background stripe */}
                <div className="absolute inset-0 bg-editor-track/30" />

                {/* Clips in this track */}
                {clips
                  .filter((c) => c.trackId === track.id)
                  .map((clip) => (
                    <div
                      key={clip.id}
                      className={`absolute top-1 bottom-1 rounded cursor-pointer transition-shadow ${
                        CLIP_COLORS[clip.type]
                      } ${
                        selectedClipId === clip.id
                          ? "ring-2 ring-white shadow-lg"
                          : "hover:brightness-110"
                      } ${track.locked ? "opacity-50 pointer-events-none" : ""}`}
                      style={{
                        left: `${timeToX(clip.startTime)}px`,
                        width: `${Math.max(timeToX(clip.duration), 4)}px`,
                      }}
                      onMouseDown={(e) => handleClipMouseDown(e, clip.id)}
                    >
                      {/* Left resize handle */}
                      <div
                        className="clip-handle clip-handle-left"
                        onMouseDown={(e) =>
                          handleResizeMouseDown(e, clip.id, "left")
                        }
                      />

                      {/* Clip label */}
                      <div className="px-1.5 py-0.5 h-full flex items-center overflow-hidden">
                        <span className="text-[10px] text-white/90 truncate font-medium">
                          {clip.name}
                        </span>
                      </div>

                      {/* Right resize handle */}
                      <div
                        className="clip-handle clip-handle-right"
                        onMouseDown={(e) =>
                          handleResizeMouseDown(e, clip.id, "right")
                        }
                      />
                    </div>
                  ))}
              </div>
            ))}
          </div>

          {/* Playhead */}
          <div
            className="absolute top-0 bottom-0 w-px bg-editor-accent z-30 pointer-events-none"
            style={{ left: `${timeToX(currentTime)}px` }}
          >
            {/* Playhead top marker */}
            <div className="absolute -top-0 left-1/2 -translate-x-1/2 w-3 h-3 bg-editor-accent" style={{ clipPath: "polygon(0 0, 100% 0, 50% 100%)" }} />
          </div>
        </div>
      </div>
    </div>
  );
}
