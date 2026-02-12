import {
  Application,
  Container,
  Graphics,
  Text,
  TextStyle,
  Sprite,
  Texture,
  type ColorSource,
} from "pixi.js";
import { Clip, ProjectSettings } from "./types";

/**
 * PixiRenderer manages the WebGL2/WebGPU rendering canvas for the video editor.
 * It creates PixiJS display objects for each visible clip and composites them.
 */
export class PixiRenderer {
  private app: Application;
  private stage: Container;
  private clipContainers: Map<string, Container> = new Map();
  private videoElements: Map<string, HTMLVideoElement> = new Map();
  private imageTextures: Map<string, Texture> = new Map();
  private initialized = false;
  private settings: ProjectSettings;

  constructor(settings: ProjectSettings) {
    this.app = new Application();
    this.stage = new Container();
    this.settings = settings;
  }

  async init(canvas: HTMLCanvasElement): Promise<void> {
    if (this.initialized) return;

    await this.app.init({
      canvas,
      width: this.settings.width,
      height: this.settings.height,
      backgroundColor: this.settings.backgroundColor as ColorSource,
      antialias: true,
      autoDensity: true,
      preference: "webgpu",
      // Falls back to webgl2 if webgpu unavailable
    });

    this.stage = this.app.stage;
    this.stage.sortableChildren = true;
    this.initialized = true;
  }

  get rendererType(): string {
    if (!this.initialized) return "not initialized";
    // PixiJS v8 uses different renderer backends
    const renderer = this.app.renderer;
    if (renderer.type === 0b10) return "WebGPU";
    if (renderer.type === 0b01) return "WebGL";
    return "Unknown";
  }

  get canvas(): HTMLCanvasElement | null {
    return this.initialized ? this.app.canvas as HTMLCanvasElement : null;
  }

  resize(width: number, height: number): void {
    if (!this.initialized) return;
    this.app.renderer.resize(width, height);
  }

  /**
   * Render a frame at the given time with the provided visible clips.
   * Clips are sorted by track order (lower = further back).
   */
  renderFrame(visibleClips: Clip[], currentTime: number, trackOrder: Map<string, number>): void {
    if (!this.initialized) return;

    // Track which clip IDs are currently visible
    const activeIds = new Set(visibleClips.map((c) => c.id));

    // Remove containers for clips no longer visible
    for (const [id, container] of this.clipContainers) {
      if (!activeIds.has(id)) {
        this.stage.removeChild(container);
        container.destroy({ children: true });
        this.clipContainers.delete(id);
      }
    }

    // Render each visible clip
    for (const clip of visibleClips) {
      let container = this.clipContainers.get(clip.id);

      if (!container) {
        container = this.createClipContainer(clip);
        if (container) {
          this.clipContainers.set(clip.id, container);
          this.stage.addChild(container);
        }
      }

      if (container) {
        this.updateClipContainer(container, clip, currentTime, trackOrder);
      }
    }
  }

  private createClipContainer(clip: Clip): Container {
    const container = new Container();

    switch (clip.type) {
      case "text":
        this.createTextDisplay(container, clip);
        break;
      case "shape":
        this.createShapeDisplay(container, clip);
        break;
      case "image":
        this.createImageDisplay(container, clip);
        break;
      case "video":
        this.createVideoDisplay(container, clip);
        break;
      default:
        this.createPlaceholder(container, clip);
        break;
    }

    return container;
  }

  private createTextDisplay(container: Container, clip: Clip): void {
    const style = new TextStyle({
      fontFamily: clip.fontFamily || "Arial",
      fontSize: clip.fontSize || 64,
      fill: clip.color || "#ffffff",
      wordWrap: true,
      wordWrapWidth: this.settings.width * 0.8,
      align: "center",
    });

    const text = new Text({ text: clip.text || "Text", style });
    text.anchor.set(0.5);
    text.label = "content";
    container.addChild(text);
  }

  private createShapeDisplay(container: Container, clip: Clip): void {
    const g = new Graphics();
    const w = clip.width || 200;
    const h = clip.height || 200;
    const fillColor = clip.fill || "#e94560";

    switch (clip.shape) {
      case "ellipse":
        g.ellipse(0, 0, w / 2, h / 2);
        g.fill(fillColor);
        break;
      case "triangle":
        g.moveTo(0, -h / 2);
        g.lineTo(w / 2, h / 2);
        g.lineTo(-w / 2, h / 2);
        g.closePath();
        g.fill(fillColor);
        break;
      case "rectangle":
      default:
        g.rect(-w / 2, -h / 2, w, h);
        g.fill(fillColor);
        break;
    }

    g.label = "content";
    container.addChild(g);
  }

  private createImageDisplay(container: Container, clip: Clip): void {
    if (!clip.src) {
      this.createPlaceholder(container, clip);
      return;
    }

    // Check if texture is already cached
    let texture = this.imageTextures.get(clip.src);
    if (!texture) {
      texture = Texture.from(clip.src);
      this.imageTextures.set(clip.src, texture);
    }

    const sprite = new Sprite(texture);
    sprite.anchor.set(0.5);
    // Scale to fill canvas while maintaining aspect
    sprite.width = this.settings.width;
    sprite.height = this.settings.height;
    sprite.label = "content";
    container.addChild(sprite);
  }

  private createVideoDisplay(container: Container, clip: Clip): void {
    if (!clip.src) {
      this.createPlaceholder(container, clip);
      return;
    }

    let video = this.videoElements.get(clip.id);
    if (!video) {
      video = document.createElement("video");
      video.src = clip.src;
      video.crossOrigin = "anonymous";
      video.muted = true;
      video.playsInline = true;
      video.preload = "auto";
      this.videoElements.set(clip.id, video);
    }

    const texture = Texture.from(video);
    const sprite = new Sprite(texture);
    sprite.anchor.set(0.5);
    sprite.width = this.settings.width;
    sprite.height = this.settings.height;
    sprite.label = "content";
    container.addChild(sprite);
  }

  private createPlaceholder(container: Container, clip: Clip): void {
    const g = new Graphics();
    const w = clip.width || this.settings.width * 0.5;
    const h = clip.height || this.settings.height * 0.5;

    g.rect(-w / 2, -h / 2, w, h);
    g.fill({ color: "#333333", alpha: 0.8 });
    g.stroke({ color: "#666666", width: 2 });

    const style = new TextStyle({
      fontSize: 24,
      fill: "#888888",
    });
    const label = new Text({ text: clip.name, style });
    label.anchor.set(0.5);

    g.label = "content";
    container.addChild(g);
    container.addChild(label);
  }

  private updateClipContainer(
    container: Container,
    clip: Clip,
    currentTime: number,
    trackOrder: Map<string, number>
  ): void {
    const t = clip.transform;

    // Position: clip transform is relative to canvas center
    container.x = this.settings.width / 2 + t.x;
    container.y = this.settings.height / 2 + t.y;
    container.scale.set(t.scaleX, t.scaleY);
    container.rotation = (t.rotation * Math.PI) / 180;
    container.alpha = t.opacity;

    // Z-ordering: lower track order = further back
    const order = trackOrder.get(clip.trackId) ?? 0;
    container.zIndex = order;

    // Update video element playback position
    if (clip.type === "video" && clip.src) {
      const video = this.videoElements.get(clip.id);
      if (video) {
        const clipTime = currentTime - clip.startTime + clip.sourceOffset;
        if (Math.abs(video.currentTime - clipTime) > 0.1) {
          video.currentTime = clipTime;
        }
      }
    }
  }

  /**
   * Seek all active video elements to match the playback time.
   */
  seekVideos(clips: Clip[], currentTime: number): void {
    for (const clip of clips) {
      if (clip.type === "video") {
        const video = this.videoElements.get(clip.id);
        if (video) {
          const clipTime = currentTime - clip.startTime + clip.sourceOffset;
          video.currentTime = Math.max(0, clipTime);
        }
      }
    }
  }

  destroy(): void {
    // Clean up video elements
    for (const video of this.videoElements.values()) {
      video.pause();
      video.src = "";
    }
    this.videoElements.clear();
    this.imageTextures.clear();
    this.clipContainers.clear();

    if (this.initialized) {
      this.app.destroy(true);
      this.initialized = false;
    }
  }
}
