"use client";

import { useCallback } from "react";
import { useEditorStore } from "@/store/editorStore";
import { DEFAULT_TRANSFORM } from "@/engine/types";

export default function MediaBrowser() {
  const { tracks, addClip, addTrack, currentTime } = useEditorStore();

  const handleFileDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      const files = Array.from(e.dataTransfer.files);

      for (const file of files) {
        const url = URL.createObjectURL(file);
        const isVideo = file.type.startsWith("video/");
        const isImage = file.type.startsWith("image/");
        const isAudio = file.type.startsWith("audio/");

        if (!isVideo && !isImage && !isAudio) continue;

        const type = isVideo ? "video" : isImage ? "image" : "audio";

        // Find or create appropriate track
        let track = tracks.find((t) => t.type === type);
        if (!track) {
          track = addTrack(type);
        }

        addClip({
          type: type as "video" | "image" | "audio",
          name: file.name,
          trackId: track.id,
          startTime: currentTime,
          duration: isImage ? 5 : 10,
          sourceOffset: 0,
          sourceDuration: isImage ? 5 : 10,
          transform: { ...DEFAULT_TRANSFORM },
          src: url,
        });
      }
    },
    [tracks, addClip, addTrack, currentTime]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
  }, []);

  return (
    <div className="h-full bg-editor-surface flex flex-col">
      <div className="px-3 py-2 border-b border-editor-panel">
        <h3 className="text-[10px] text-editor-muted uppercase tracking-wider">
          Media
        </h3>
      </div>

      <div
        onDrop={handleFileDrop}
        onDragOver={handleDragOver}
        className="flex-1 flex flex-col items-center justify-center p-4 m-2 border-2 border-dashed border-editor-panel/50 rounded-lg hover:border-editor-accent/40 transition-colors cursor-pointer"
      >
        <svg
          className="w-8 h-8 text-editor-muted/40 mb-2"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
          />
        </svg>
        <p className="text-[11px] text-editor-muted/60 text-center">
          Drop video, image, or audio files here
        </p>
        <p className="text-[10px] text-editor-muted/40 mt-1">
          MP4, WebM, PNG, JPG, MP3, WAV
        </p>
      </div>
    </div>
  );
}
