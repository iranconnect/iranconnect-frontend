import { useEffect, useRef, useState } from "react";
import {
  getMediaCropV2Geometry,
  normalizeMediaCrop,
} from "../../utils/businessMediaCropStyle";

const DEFAULT_CROP = {
  version: 2,
  zoom: 1,
  positionX: 0.5,
  positionY: 0.5,
};

const clamp = (value, min, max) =>
  Math.min(max, Math.max(min, value));

const initialV2 = (value) => {
  const crop = normalizeMediaCrop(value);
  return crop?.version === 2 ? crop : { ...DEFAULT_CROP };
};

export default function BusinessMediaCropEditor({
  src,
  mediaRole,
  initialConfig = null,
  onSave,
  onCancel,
  saving = false,
  saveDisabled = false,
  statusNotice = "",
  errorNotice = "",
  quotaNotice = "",
  onRetryQuota,
}) {
  const [config, setConfig] = useState(
    () => initialV2(initialConfig)
  );
  const [imageSize, setImageSize] = useState(null);
  const [frameSize, setFrameSize] = useState(null);
  const [frameOffset, setFrameOffset] = useState(null);

  const workspaceRef = useRef(null);
  const frameRef = useRef(null);
  const dragRef = useRef(null);

  const isLogo = mediaRole === "logo";
  const validRole = isLogo || mediaRole === "cover";

  const previousCrop = normalizeMediaCrop(initialConfig);
  const legacy = previousCrop?.version === 1;

  useEffect(() => {
    setConfig(initialV2(initialConfig));
    setImageSize(null);
    dragRef.current = null;
  }, [src, mediaRole, initialConfig]);

  useEffect(() => {
    const workspace = workspaceRef.current;
    const frame = frameRef.current;

    if (!workspace || !frame) return;

    const measure = () => {
      const outer = workspace.getBoundingClientRect();
      const inner = frame.getBoundingClientRect();

      if (!inner.width || !inner.height) return;

      setFrameSize({
        width: inner.width,
        height: inner.height,
      });
      setFrameOffset({
        left: inner.left - outer.left,
        top: inner.top - outer.top,
      });
    };

    measure();

    const observer = new ResizeObserver(measure);
    observer.observe(workspace);
    observer.observe(frame);

    return () => observer.disconnect();
  }, [validRole, src, mediaRole]);

  const geometry =
    imageSize && frameSize
      ? getMediaCropV2Geometry(
          config,
          imageSize.width,
          imageSize.height,
          frameSize.width,
          frameSize.height
        )
      : null;

  function startDrag(event) {
    if (
      saving ||
      !geometry ||
      event.button > 0 ||
      !event.isPrimary
    ) return;

    dragRef.current = {
      pointerId: event.pointerId,
      x: event.clientX,
      y: event.clientY,
      overflowX: geometry.overflowX,
      overflowY: geometry.overflowY,
    };

    event.currentTarget.focus({ preventScroll: true });
    event.currentTarget.setPointerCapture?.(event.pointerId);
  }

  function moveDrag(event) {
    const drag = dragRef.current;
    if (
      !drag ||
      saving ||
      drag.pointerId !== event.pointerId
    ) return;

    const dx = event.clientX - drag.x;
    const dy = event.clientY - drag.y;

    drag.x = event.clientX;
    drag.y = event.clientY;

    if (dx === 0 && dy === 0) return;

    setConfig((previous) => ({
      ...previous,
      positionX: drag.overflowX > 0.001
        ? clamp(previous.positionX - dx / drag.overflowX, 0, 1)
        : 0.5,
      positionY: drag.overflowY > 0.001
        ? clamp(previous.positionY - dy / drag.overflowY, 0, 1)
        : 0.5,
    }));
  }

  function stopDrag(event) {
    if (
      dragRef.current?.pointerId === event.pointerId
    ) {
      dragRef.current = null;
    }
  }

  function handleWorkspaceKeyDown(event) {
    if (saving || !geometry) return;

    const step = event.shiftKey ? 20 : 5;

    const directions = {
      ArrowLeft: [-step, 0],
      ArrowRight: [step, 0],
      ArrowUp: [0, -step],
      ArrowDown: [0, step],
    };

    const movement = directions[event.key];
    if (!movement) return;

    event.preventDefault();

    const [dx, dy] = movement;

    setConfig((previous) => ({
      ...previous,
      positionX: geometry.overflowX > 0.001
        ? clamp(
            previous.positionX - dx / geometry.overflowX,
            0, 1
          )
        : 0.5,
      positionY: geometry.overflowY > 0.001
        ? clamp(
            previous.positionY - dy / geometry.overflowY,
            0, 1
          )
        : 0.5,
    }));
  }

  if (!validRole || !src) return null;

  return (
    <section className="w-full max-w-2xl space-y-4 rounded-2xl border border-slate-200 bg-white p-4 text-slate-900 shadow-sm sm:p-6">
      <div>
        <h2 className="text-lg font-semibold">
          Adjust {isLogo ? "Logo" : "Cover"}
        </h2>
        <p className="mt-1 text-sm text-slate-600">
          Move and zoom the original image within the crop frame.
          The source file will not be changed.
        </p>
        {legacy && (
          <p className="mt-2 text-xs text-amber-800">
            This image has a previous crop setting. The new
            editor starts with a centered V2 crop. Your saved
            setting remains unchanged unless you save.
          </p>
        )}
      </div>

      <div
        ref={workspaceRef}
        className="relative mx-auto h-[310px] w-full overflow-hidden rounded-xl border border-slate-300 bg-slate-200 sm:h-[390px]"
        style={{
          touchAction: "none",
          cursor: saving ? "default" : "grab",
        }}
        onPointerDown={startDrag}
        onPointerMove={moveDrag}
        onPointerUp={stopDrag}
        onPointerCancel={stopDrag}
        onLostPointerCapture={stopDrag}
        tabIndex={saving ? -1 : 0}
        onKeyDown={handleWorkspaceKeyDown}
        aria-keyshortcuts="ArrowLeft ArrowRight ArrowUp ArrowDown"
        aria-label="Drag image within the crop workspace"
      >
        <img
          src={src}
          alt=""
          aria-hidden="true"
          className="hidden"
          onLoad={(event) => {
            const image = event.currentTarget;
            setImageSize({
              width: image.naturalWidth,
              height: image.naturalHeight,
            });
          }}
          onError={() => setImageSize(null)}
        />

        {geometry && frameOffset && (
          <img
            src={src}
            alt="Image being cropped"
            draggable={false}
            className="pointer-events-none absolute max-w-none select-none"
            style={{
              width: geometry.width,
              height: geometry.height,
              left: frameOffset.left + geometry.left,
              top: frameOffset.top + geometry.top,
              maxWidth: "none",
            }}
          />
        )}

        <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center">
          <div
            ref={frameRef}
            className={
              "relative shrink-0 overflow-visible rounded-sm border-2 border-white " +
              (isLogo
                ? "aspect-square w-[min(68%,280px)]"
                : "aspect-[3/1] w-[92%]")
            }
            style={{
              boxShadow:
                "0 0 0 2000px rgba(15,23,42,0.58)",
            }}
          >
            <span className="sr-only">
              Visible crop area
            </span>
          </div>
        </div>

        {!geometry && (
          <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center text-sm text-slate-700">
            Loading crop preview...
          </div>
        )}
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
          disabled={saving || !geometry}
          onChange={(event) =>
            setConfig((previous) => ({
              ...previous,
              zoom: Number(event.target.value),
            }))
          }
          className="w-full accent-teal-600"
        />
        <p className="text-xs text-slate-500">
          Drag to position the image. The crop frame
          always remains covered.
        </p>
      </div>

      {statusNotice && (
        <p role="status" className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm font-medium text-green-800">
          {statusNotice}
        </p>
      )}
      {errorNotice && !statusNotice && (
        <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
          {errorNotice}
        </p>
      )}
      {quotaNotice && !statusNotice && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
          <p role="status">{quotaNotice}</p>
          {!errorNotice &&
            quotaNotice.startsWith("Unable to") &&
            typeof onRetryQuota === "function" && (
              <button
                type="button"
                onClick={onRetryQuota}
                className="mt-2 rounded border border-amber-400 px-3 py-1 font-medium"
              >
                Retry quota check
              </button>
            )}
        </div>
      )}
      <div className="flex flex-wrap justify-end gap-3">
        <button
          type="button"
          disabled={saving}
          onClick={() => setConfig({ ...DEFAULT_CROP })}
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
          disabled={
            saving ||
            saveDisabled ||
            !geometry ||
            typeof onSave !== "function"
          }
          onClick={() => onSave({ ...config })}
          className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save display settings"}
        </button>
      </div>
    </section>
  );
}
