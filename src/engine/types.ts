export type ClipType = "video" | "audio" | "image" | "text" | "shape";

export interface Transform {
  x: number;
  y: number;
  scaleX: number;
  scaleY: number;
  rotation: number; // degrees
  anchorX: number;
  anchorY: number;
  opacity: number;
}

export interface Clip {
  id: string;
  type: ClipType;
  name: string;
  trackId: string;
  /** Start time on timeline in seconds */
  startTime: number;
  /** Duration on timeline in seconds */
  duration: number;
  /** Offset into source media in seconds */
  sourceOffset: number;
  /** Source media duration in seconds */
  sourceDuration: number;
  transform: Transform;
  /** Source file URL or data URI */
  src?: string;
  /** Text content for text clips */
  text?: string;
  fontSize?: number;
  fontFamily?: string;
  color?: string;
  /** Shape type for shape clips */
  shape?: "rectangle" | "ellipse" | "triangle";
  /** Fill color for shape clips */
  fill?: string;
  /** Shape width */
  width?: number;
  /** Shape height */
  height?: number;
}

export interface Track {
  id: string;
  name: string;
  type: ClipType;
  muted: boolean;
  locked: boolean;
  visible: boolean;
  order: number;
}

export interface ProjectSettings {
  width: number;
  height: number;
  fps: number;
  duration: number; // total project duration in seconds
  backgroundColor: string;
}

export const DEFAULT_TRANSFORM: Transform = {
  x: 0,
  y: 0,
  scaleX: 1,
  scaleY: 1,
  rotation: 0,
  anchorX: 0.5,
  anchorY: 0.5,
  opacity: 1,
};

export const DEFAULT_PROJECT_SETTINGS: ProjectSettings = {
  width: 1920,
  height: 1080,
  fps: 30,
  duration: 60,
  backgroundColor: "#000000",
};
