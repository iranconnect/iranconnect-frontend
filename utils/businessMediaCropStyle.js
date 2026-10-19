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
    (version !== 1 && version !== 2) ||
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
  if (crop.version === 2) {
    const x = crop.positionX * 100;
    const y = crop.positionY * 100;

    return {
      objectFit: "cover",
      objectPosition: `${x}% ${y}%`,
      transform: `scale(${crop.zoom})`,
      transformOrigin: `${x}% ${y}%`,
    };
  }

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


/*
 * V2 geometry:
 * Position 0..1 describes the available travel distance
 * of the COVER-scaled source image, including at zoom=1.
 *
 * V1 above remains byte-for-byte unchanged.
 */
export function getMediaCropV2Geometry(
  config,
  imageWidth,
  imageHeight,
  frameWidth,
  frameHeight
) {
  const crop = normalizeMediaCrop(config);

  if (
    !crop || crop.version !== 2 ||
    ![imageWidth, imageHeight, frameWidth, frameHeight]
      .every((n) => Number.isFinite(n) && n > 0)
  ) {
    return null;
  }

  const baseScale = Math.max(
    frameWidth / imageWidth,
    frameHeight / imageHeight
  );
  const scale = baseScale * crop.zoom;
  const width = imageWidth * scale;
  const height = imageHeight * scale;
  const overflowX = Math.max(0, width - frameWidth);
  const overflowY = Math.max(0, height - frameHeight);

  return {
    width,
    height,
    overflowX,
    overflowY,
    left: -overflowX * crop.positionX,
    top: -overflowY * crop.positionY,
  };
}
