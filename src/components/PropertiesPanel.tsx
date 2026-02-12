"use client";

import { useEditorStore } from "@/store/editorStore";

export default function PropertiesPanel() {
  const { clips, selectedClipId, updateClip, project, setProject } =
    useEditorStore();

  const clip = clips.find((c) => c.id === selectedClipId);

  if (!clip) {
    return (
      <div className="h-full bg-editor-surface p-3 overflow-y-auto">
        <h3 className="text-[10px] text-editor-muted uppercase tracking-wider mb-3">
          Properties
        </h3>

        {/* Project settings when nothing selected */}
        <Section title="Project">
          <NumberField
            label="Width"
            value={project.width}
            onChange={(v) => setProject({ width: v })}
            min={1}
            max={7680}
            step={1}
          />
          <NumberField
            label="Height"
            value={project.height}
            onChange={(v) => setProject({ height: v })}
            min={1}
            max={4320}
            step={1}
          />
          <NumberField
            label="FPS"
            value={project.fps}
            onChange={(v) => setProject({ fps: v })}
            min={1}
            max={120}
            step={1}
          />
          <NumberField
            label="Duration"
            value={project.duration}
            onChange={(v) => setProject({ duration: v })}
            min={1}
            max={3600}
            step={1}
            suffix="s"
          />
          <ColorField
            label="Background"
            value={project.backgroundColor}
            onChange={(v) => setProject({ backgroundColor: v })}
          />
        </Section>

        <div className="mt-6 text-xs text-editor-muted/60 text-center">
          Select a clip to edit properties
        </div>
      </div>
    );
  }

  const update = (updates: Record<string, unknown>) => {
    updateClip(clip.id, updates);
  };

  const updateTransform = (updates: Record<string, number>) => {
    updateClip(clip.id, {
      transform: { ...clip.transform, ...updates },
    });
  };

  return (
    <div className="h-full bg-editor-surface p-3 overflow-y-auto">
      <h3 className="text-[10px] text-editor-muted uppercase tracking-wider mb-3">
        Properties
      </h3>

      {/* Clip info */}
      <Section title="Clip">
        <TextField
          label="Name"
          value={clip.name}
          onChange={(v) => update({ name: v })}
        />
        <div className="text-[10px] text-editor-muted mt-1">
          Type: {clip.type}
        </div>
      </Section>

      {/* Timing */}
      <Section title="Timing">
        <NumberField
          label="Start"
          value={clip.startTime}
          onChange={(v) => update({ startTime: v })}
          min={0}
          step={0.1}
          suffix="s"
        />
        <NumberField
          label="Duration"
          value={clip.duration}
          onChange={(v) => update({ duration: v })}
          min={0.1}
          step={0.1}
          suffix="s"
        />
      </Section>

      {/* Transform */}
      <Section title="Transform">
        <NumberField
          label="X"
          value={clip.transform.x}
          onChange={(v) => updateTransform({ x: v })}
          step={1}
        />
        <NumberField
          label="Y"
          value={clip.transform.y}
          onChange={(v) => updateTransform({ y: v })}
          step={1}
        />
        <NumberField
          label="Scale X"
          value={clip.transform.scaleX}
          onChange={(v) => updateTransform({ scaleX: v })}
          step={0.1}
          min={0.01}
        />
        <NumberField
          label="Scale Y"
          value={clip.transform.scaleY}
          onChange={(v) => updateTransform({ scaleY: v })}
          step={0.1}
          min={0.01}
        />
        <NumberField
          label="Rotation"
          value={clip.transform.rotation}
          onChange={(v) => updateTransform({ rotation: v })}
          step={1}
          suffix="deg"
        />
        <NumberField
          label="Opacity"
          value={clip.transform.opacity}
          onChange={(v) => updateTransform({ opacity: v })}
          step={0.05}
          min={0}
          max={1}
        />
      </Section>

      {/* Text-specific */}
      {clip.type === "text" && (
        <Section title="Text">
          <TextField
            label="Content"
            value={clip.text || ""}
            onChange={(v) => update({ text: v })}
            multiline
          />
          <NumberField
            label="Font Size"
            value={clip.fontSize || 64}
            onChange={(v) => update({ fontSize: v })}
            min={1}
            max={500}
            step={1}
          />
          <TextField
            label="Font"
            value={clip.fontFamily || "Arial"}
            onChange={(v) => update({ fontFamily: v })}
          />
          <ColorField
            label="Color"
            value={clip.color || "#ffffff"}
            onChange={(v) => update({ color: v })}
          />
        </Section>
      )}

      {/* Shape-specific */}
      {clip.type === "shape" && (
        <Section title="Shape">
          <SelectField
            label="Type"
            value={clip.shape || "rectangle"}
            options={["rectangle", "ellipse", "triangle"]}
            onChange={(v) => update({ shape: v })}
          />
          <ColorField
            label="Fill"
            value={clip.fill || "#e94560"}
            onChange={(v) => update({ fill: v })}
          />
          <NumberField
            label="Width"
            value={clip.width || 200}
            onChange={(v) => update({ width: v })}
            min={1}
            step={1}
          />
          <NumberField
            label="Height"
            value={clip.height || 200}
            onChange={(v) => update({ height: v })}
            min={1}
            step={1}
          />
        </Section>
      )}

      {/* Media source */}
      {(clip.type === "video" || clip.type === "image") && (
        <Section title="Source">
          <TextField
            label="URL"
            value={clip.src || ""}
            onChange={(v) => update({ src: v })}
          />
        </Section>
      )}
    </div>
  );
}

// --- Reusable field components ---

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-4">
      <div className="text-[10px] text-editor-muted/70 uppercase tracking-wider mb-1.5 border-b border-editor-panel/50 pb-1">
        {title}
      </div>
      <div className="space-y-1.5">{children}</div>
    </div>
  );
}

function NumberField({
  label,
  value,
  onChange,
  min,
  max,
  step = 1,
  suffix,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  step?: number;
  suffix?: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <label className="text-[11px] text-editor-muted w-16 flex-shrink-0">
        {label}
      </label>
      <input
        type="number"
        value={Number(value.toFixed(3))}
        onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
        min={min}
        max={max}
        step={step}
        className="flex-1 bg-editor-bg/50 border border-editor-panel rounded px-1.5 py-0.5 text-[11px] text-editor-text w-0"
      />
      {suffix && (
        <span className="text-[10px] text-editor-muted/60 w-6">{suffix}</span>
      )}
    </div>
  );
}

function TextField({
  label,
  value,
  onChange,
  multiline,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  multiline?: boolean;
}) {
  const inputClass =
    "flex-1 bg-editor-bg/50 border border-editor-panel rounded px-1.5 py-0.5 text-[11px] text-editor-text w-0";

  return (
    <div className="flex items-start gap-2">
      <label className="text-[11px] text-editor-muted w-16 flex-shrink-0 mt-0.5">
        {label}
      </label>
      {multiline ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={3}
          className={`${inputClass} resize-none`}
        />
      ) : (
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={inputClass}
        />
      )}
    </div>
  );
}

function ColorField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <label className="text-[11px] text-editor-muted w-16 flex-shrink-0">
        {label}
      </label>
      <input
        type="color"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-6 h-6 rounded border border-editor-panel cursor-pointer bg-transparent"
      />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="flex-1 bg-editor-bg/50 border border-editor-panel rounded px-1.5 py-0.5 text-[11px] text-editor-text font-mono w-0"
      />
    </div>
  );
}

function SelectField({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <label className="text-[11px] text-editor-muted w-16 flex-shrink-0">
        {label}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="flex-1 bg-editor-bg/50 border border-editor-panel rounded px-1.5 py-0.5 text-[11px] text-editor-text"
      >
        {options.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
    </div>
  );
}
