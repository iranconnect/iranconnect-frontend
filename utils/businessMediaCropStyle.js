/*
 * PLR-03 — Shared, non-destructive media presentation.
 * Use this same geometry in the crop editor preview.
 */
export function normalizeMediaCrop(config) {
  if (!config || typeof config !== "object") {
    return null;
  }

  const { version, zoom, positionX, positionY } = config;

  if (
    version !== 1 ||
    ![zoom, positionX, positionY].every(
      (value) => typeof value === "number" &&
        Number.isFinite(value)
    ) ||
    zoom < 1 || zoom > 3 ||
    positionX < 0 || positionX > 1 ||
    positionY < 0 || positionY > 1
  ) {
    return null;
  }

  return { version, zoom, positionX, positionY };
}

export function getMediaCropStyle(config) {
  const crop = normalizeMediaCrop(config);

  if (!crop) {
    return {
      objectFit: "cover",
      objectPosition: "center",
    };
  }

  /*
   * Shared fixed-frame geometry.
   * The scaled image always covers its frame.
   * Position ranges 0..1 across available pan distance.
   */
  const extra = crop.zoom - 1;
  const translateX = (0.5 - crop.positionX) * extra * 100;
  const translateY = (0.5 - crop.positionY) * extra * 100;

  return {
    objectFit: "cover",
    objectPosition: "center",
    transform:
      `translate(${translateX}%, ${translateY}%) ` +
      `scale(${crop.zoom})`,
    transformOrigin: "center",
  };
}
