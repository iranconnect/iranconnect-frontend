import { useRef, useState } from "react";
import {
  getMediaCropStyle,
  normalizeMediaCrop,
} from "../../utils/businessMediaCropStyle";

const DEFAULT_CROP = {
  version: 1,
  zoom: 1,
  positionX: 0.5,
  positionY: 0.5,
};

const clamp = (value, min, max) =>
  Math.min(max, Math.max(min, value));

export default function BusinessMediaCropEditor({
  src,
  mediaRole,
  initialConfig = null,
  onSave,
  onCancel,
  saving = false,
}) {
  const [config, setConfig] = useState(
    () => normalizeMediaCrop(initialConfig) || DEFAULT_CROP
  );
  const drag = useRef(null);

  const isLogo = mediaRole === "logo";
  const validRole = isLogo || mediaRole === "cover";

  function update(patch) {
    setConfig((previous) => ({
      ...previous,
      ...patch,
    }));
  }

  function startDrag(event) {
    if (saving || event.button > 0) return;

    drag.current = {
      x: event.clientX,
      y: event.clientY,
      positionX: config.positionX,
      positionY: config.positionY,
    };

    event.currentTarget.setPointerCapture?.(event.pointerId);
  }

  function moveDrag(event) {
    if (!drag.current || saving) return;

    const rect = event.currentTarget.getBoundingClientRect();

    if (!rect.width || !rect.height) return;

    const extra = config.zoom - 1;
    if (extra <= 0) return;

    update({
      positionX: clamp(
        drag.current.positionX -
          (event.clientX - drag.current.x) /
            (rect.width * extra),
        0,
        1
      ),
      positionY: clamp(
        drag.current.positionY -
          (event.clientY - drag.current.y) /
            (rect.height * extra),
        0,
        1
      ),
    });
  }

  function stopDrag() {
    drag.current = null;
  }

  if (!validRole || !src) return null;

  return (
    <section className="w-full max-w-2xl space-y-4 rounded-2xl border border-slate-200 bg-white p-4 text-slate-900 shadow-sm sm:p-6">
      <div>
        <h2 className="text-lg font-semibold">
          Adjust {isLogo ? "Logo" : "Cover"}
        </h2>
        <p className="mt-1 text-sm text-slate-600">
          Adjust how your existing image appears.
          The original file will not be changed.
        </p>
      </div>

      <div
        className={`relative mx-auto w-full overflow-hidden rounded-xl border border-slate-300 bg-white ${
          isLogo
            ? "max-w-xs aspect-square"
            : "aspect-[3/1]"
        }`}
        style={{
          touchAction: "none",
          cursor: saving ? "default" : "grab",
        }}
        onPointerDown={startDrag}
        onPointerMove={moveDrag}
        onPointerUp={stopDrag}
        onPointerCancel={stopDrag}
        onLostPointerCapture={stopDrag}
        aria-label="Drag image to adjust its position"
      >
        <img
          src={src}
          alt="Crop preview"
          draggable={false}
          className="pointer-events-none h-full w-full select-none"
          style={getMediaCropStyle(config)}
        />
      </div>

      <div className="space-y-2">
        <label
          htmlFor={`crop-zoom-${mediaRole}`}
          className="flex justify-between text-sm font-medium"
        >
          <span>Zoom</span>
          <span>{config.zoom.toFixed(2)}×</span>
        </label>
        <input
          id={`crop-zoom-${mediaRole}`}
          type="range"
          min="1"
          max="3"
          step="0.05"
          value={config.zoom}
          disabled={saving}
          onChange={(event) =>
            update({ zoom: Number(event.target.value) })
          }
          className="w-full accent-teal-600"
        />
        <p className="text-xs text-slate-500">
          Drag the image to adjust its position.
        </p>
      </div>

      <div className="flex flex-wrap justify-end gap-3">
        <button
          type="button"
          disabled={saving}
          onClick={() => setConfig(DEFAULT_CROP)}
          className="rounded-lg border px-4 py-2 text-sm"
        >
          Reset
        </button>
        <button
          type="button"
          disabled={saving}
          onClick={onCancel}
          className="rounded-lg border px-4 py-2 text-sm"
        >
          Cancel
        </button>
        <button
          type="button"
          disabled={saving || typeof onSave !== "function"}
          onClick={() => onSave({ ...config })}
          className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save display settings"}
        </button>
      </div>
    </section>
  );
}
