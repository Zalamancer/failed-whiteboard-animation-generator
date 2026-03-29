import { create } from "zustand";
import { v4 as uuidv4 } from "uuid";
import {
  Clip,
  ClipType,
  Track,
  ProjectSettings,
  DEFAULT_TRANSFORM,
  DEFAULT_PROJECT_SETTINGS,
} from "@/engine/types";

interface EditorState {
  // Project
  project: ProjectSettings;
  setProject: (settings: Partial<ProjectSettings>) => void;

  // Playback
  currentTime: number;
  isPlaying: boolean;
  setCurrentTime: (time: number) => void;
  setIsPlaying: (playing: boolean) => void;

  // Zoom: pixels per second on the timeline
  zoom: number;
  setZoom: (zoom: number) => void;

  // Tracks
  tracks: Track[];
  addTrack: (type: ClipType, name?: string) => Track;
  removeTrack: (id: string) => void;
  updateTrack: (id: string, updates: Partial<Track>) => void;

  // Clips
  clips: Clip[];
  addClip: (clip: Omit<Clip, "id">) => Clip;
  removeClip: (id: string) => void;
  updateClip: (id: string, updates: Partial<Clip>) => void;
  moveClip: (id: string, trackId: string, startTime: number) => void;

  // Selection
  selectedClipId: string | null;
  selectedTrackId: string | null;
  selectClip: (id: string | null) => void;
  selectTrack: (id: string | null) => void;

  // Tool
  activeTool: "select" | "text" | "shape" | "cut";
  setActiveTool: (tool: "select" | "text" | "shape" | "cut") => void;

  // Snapping
  snapEnabled: boolean;
  toggleSnap: () => void;

  // Panel visibility
  leftPanelCollapsed: boolean;
  toggleLeftPanel: () => void;

  // Helpers
  getClipsForTrack: (trackId: string) => Clip[];
  getVisibleClips: (time: number) => Clip[];
  getSelectedClip: () => Clip | undefined;
}

export const useEditorStore = create<EditorState>((set, get) => ({
  // Project
  project: DEFAULT_PROJECT_SETTINGS,
  setProject: (settings) =>
    set((s) => ({ project: { ...s.project, ...settings } })),

  // Playback
  currentTime: 0,
  isPlaying: false,
  setCurrentTime: (time) => set({ currentTime: Math.max(0, time) }),
  setIsPlaying: (playing) => set({ isPlaying: playing }),

  // Zoom
  zoom: 50, // 50px per second
  setZoom: (zoom) => set({ zoom: Math.max(10, Math.min(500, zoom)) }),

  // Tracks
  tracks: [],
  addTrack: (type, name) => {
    const track: Track = {
      id: uuidv4(),
      name: name || `${type.charAt(0).toUpperCase() + type.slice(1)} ${get().tracks.length + 1}`,
      type,
      muted: false,
      locked: false,
      visible: true,
      order: get().tracks.length,
    };
    set((s) => ({ tracks: [...s.tracks, track] }));
    return track;
  },
  removeTrack: (id) =>
    set((s) => ({
      tracks: s.tracks.filter((t) => t.id !== id),
      clips: s.clips.filter((c) => c.trackId !== id),
    })),
  updateTrack: (id, updates) =>
    set((s) => ({
      tracks: s.tracks.map((t) => (t.id === id ? { ...t, ...updates } : t)),
    })),

  // Clips
  clips: [],
  addClip: (clipData) => {
    const clip: Clip = { ...clipData, id: uuidv4() };
    set((s) => ({ clips: [...s.clips, clip] }));
    return clip;
  },
  removeClip: (id) =>
    set((s) => ({
      clips: s.clips.filter((c) => c.id !== id),
      selectedClipId: s.selectedClipId === id ? null : s.selectedClipId,
    })),
  updateClip: (id, updates) =>
    set((s) => ({
      clips: s.clips.map((c) => (c.id === id ? { ...c, ...updates } : c)),
    })),
  moveClip: (id, trackId, startTime) =>
    set((s) => ({
      clips: s.clips.map((c) =>
        c.id === id ? { ...c, trackId, startTime: Math.max(0, startTime) } : c
      ),
    })),

  // Selection
  selectedClipId: null,
  selectedTrackId: null,
  selectClip: (id) => set({ selectedClipId: id }),
  selectTrack: (id) => set({ selectedTrackId: id }),

  // Tool
  activeTool: "select",
  setActiveTool: (tool) => set({ activeTool: tool }),

  // Snapping
  snapEnabled: true,
  toggleSnap: () => set((s) => ({ snapEnabled: !s.snapEnabled })),

  // Panel visibility
  leftPanelCollapsed: false,
  toggleLeftPanel: () => set((s) => ({ leftPanelCollapsed: !s.leftPanelCollapsed })),

  // Helpers
  getClipsForTrack: (trackId) => get().clips.filter((c) => c.trackId === trackId),
  getVisibleClips: (time) =>
    get().clips.filter(
      (c) => time >= c.startTime && time < c.startTime + c.duration
    ),
  getSelectedClip: () => get().clips.find((c) => c.id === get().selectedClipId),
}));

// Initialize with default tracks
export function initializeProject() {
  const store = useEditorStore.getState();
  if (store.tracks.length === 0) {
    store.addTrack("video", "Video 1");
    store.addTrack("video", "Video 2");
    store.addTrack("audio", "Audio 1");
  }
}
