import { useState } from "react";
import { getMediaCropStyle } from "../../utils/businessMediaCropStyle";

/**
 * Presentation-only image renderer.
 *
 * A keyed instance resets its error state when src or fallbackSrc changes.
 * The fallback is attempted at most once per instance.
 */
function LogoImage({
  src,
  fallbackSrc,
  alt,
  loading,
  decoding,
  imageClassName,
  cropConfig,
}) {
  const [primaryFailed, setPrimaryFailed] = useState(false);

  const primarySrc =
    typeof src === "string" ? src.trim() : "";

  const safeFallback =
    typeof fallbackSrc === "string"
      ? fallbackSrc.trim()
      : "";

  const displaySrc =
    !primaryFailed && primarySrc
      ? primarySrc
      : safeFallback;

  if (!displaySrc) {
    return null;
  }

  return (
    <img
      src={displaySrc}
      alt={alt}
      loading={loading}
      decoding={decoding}
      className={imageClassName}
      onError={() => {
        if (!primaryFailed && primarySrc) {
          setPrimaryFailed(true);
        }
      }}
      style={{
        display: "block",
        width: "100%",
        height: "100%",
        maxWidth: "100%",
        maxHeight: "100%",
        ...getMediaCropStyle(primaryFailed ? null : cropConfig),
        borderRadius: "8px",
      }}
    />
  );
}

/**
 * Canonical IranConnect business logo presentation frame.
 *
 * The consumer owns source selection, fallback choice, accessibility text,
 * external dimensions and image loading preferences.
 *
 * No upload, crop, file, Blob, authorization or persistence behavior.
 */
export default function LogoFrame({
  src,
  fallbackSrc,
  alt = "",
  className = "",
  imageClassName = "",
  loading,
  decoding,
  style,
  cropConfig,
}) {
  const sourceKey = JSON.stringify([src, fallbackSrc]);

  return (
    <div
      className={className}
      style={{
        ...style,
        position: "relative",
        aspectRatio: "1 / 1",
        boxSizing: "border-box",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
        overflow: "hidden",
        padding: 0,
        backgroundColor: "#FFFFFF",
        border: "1px solid #E2E8F0",
        borderRadius: "12px",
        boxShadow: "0 1px 2px rgba(0, 0, 0, 0.06)",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: "6%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          overflow: "hidden",
          borderRadius: "8px",
        }}
      >
        <LogoImage
          key={sourceKey}
          src={src}
          fallbackSrc={fallbackSrc}
          alt={alt}
          loading={loading}
          decoding={decoding}
          imageClassName={imageClassName}
          cropConfig={cropConfig}
        />
      </div>
    </div>
  );
}
