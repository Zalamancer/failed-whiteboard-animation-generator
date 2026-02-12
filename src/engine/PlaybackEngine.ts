import { PixiRenderer } from "./PixiRenderer";
import { Clip, ProjectSettings } from "./types";

export type PlaybackCallback = (currentTime: number) => void;

/**
 * PlaybackEngine drives the animation loop and coordinates
 * time-based rendering through the PixiRenderer.
 */
export class PlaybackEngine {
  private renderer: PixiRenderer;
  private settings: ProjectSettings;
  private animFrameId: number | null = null;
  private lastTimestamp: number = 0;
  private _currentTime: number = 0;
  private _isPlaying: boolean = false;
  private onTimeUpdate: PlaybackCallback | null = null;

  constructor(renderer: PixiRenderer, settings: ProjectSettings) {
    this.renderer = renderer;
    this.settings = settings;
  }

  get currentTime(): number {
    return this._currentTime;
  }

  get isPlaying(): boolean {
    return this._isPlaying;
  }

  setTimeUpdateCallback(cb: PlaybackCallback): void {
    this.onTimeUpdate = cb;
  }

  play(): void {
    if (this._isPlaying) return;
    this._isPlaying = true;
    this.lastTimestamp = performance.now();
    this.tick(this.lastTimestamp);
  }

  pause(): void {
    this._isPlaying = false;
    if (this.animFrameId !== null) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
  }

  seek(time: number): void {
    this._currentTime = Math.max(0, Math.min(time, this.settings.duration));
    this.onTimeUpdate?.(this._currentTime);
  }

  stop(): void {
    this.pause();
    this._currentTime = 0;
    this.onTimeUpdate?.(0);
  }

  private tick = (timestamp: number): void => {
    if (!this._isPlaying) return;

    const delta = (timestamp - this.lastTimestamp) / 1000;
    this.lastTimestamp = timestamp;

    this._currentTime += delta;

    // Loop back to start if past project duration
    if (this._currentTime >= this.settings.duration) {
      this._currentTime = 0;
    }

    this.onTimeUpdate?.(this._currentTime);
    this.animFrameId = requestAnimationFrame(this.tick);
  };

  /**
   * Render a single frame. Called externally after clip resolution.
   */
  renderFrame(
    visibleClips: Clip[],
    trackOrder: Map<string, number>
  ): void {
    this.renderer.renderFrame(visibleClips, this._currentTime, trackOrder);
  }

  destroy(): void {
    this.pause();
    this.renderer.destroy();
  }
}
