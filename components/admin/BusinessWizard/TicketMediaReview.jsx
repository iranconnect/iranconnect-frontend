import { useEffect, useRef, useState } from "react";
import LogoFrame from "../../business/LogoFrame";
import { getMediaCropStyle } from "../../../utils/businessMediaCropStyle";

export default function TicketMediaReview({
  mode,
  ticketMediaReview,
  preview,
  currentGallery = [],
}) {
  const [originalUrl, setOriginalUrl] = useState(null);
  const viewerCloseRef = useRef(null);

  useEffect(() => {
    if (!originalUrl) return;

    const previousFocus = document.activeElement;

    const onEscape = (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        setOriginalUrl(null);
      }
    };

    document.addEventListener("keydown", onEscape);
    viewerCloseRef.current?.focus();

    return () => {
      document.removeEventListener("keydown", onEscape);
      if (previousFocus?.isConnected) {
        previousFocus.focus();
      }
    };
  }, [originalUrl]);

  const isNewTicket = mode === "admin-create-ticket";

  const assets = Array.isArray(ticketMediaReview?.media)
    ? ticketMediaReview.media.filter(
        (asset) =>
          asset?.snapshot_group === "requested" &&
          ["logo", "cover", "gallery"].includes(asset.role)
      )
    : [];

  const verified =
    preview?.verified === true &&
    preview?.ticketId === ticketMediaReview?.ticketId &&
    assets.length > 0;

  const images = verified ? preview.images : [];
  const logo = images.find((image) => image.role === "logo");
  const cover = images.find((image) => image.role === "cover");
  const gallery = images
    .filter((image) => image.role === "gallery")
    .sort((a, b) => a.displayOrder - b.displayOrder);

  if (!verified) {
    return (
      <p role="alert" className="admin-error text-red-600">
        {preview?.loading
          ? "Loading requested ticket media..."
          : preview?.error ||
            "Ticket media verification is required."}
      </p>
    );
  }

  const openOriginal = (url) => setOriginalUrl(url);

  return (
    <div>
      {logo && (
        <div className="mb-5">
          <p
            className={
              isNewTicket
                ? "mb-2 text-sm font-semibold text-gray-900"
                : "mb-2 text-sm font-semibold text-red-600"
            }
          >
            {isNewTicket
              ? "Requested"
              : "Changed — Requested Logo"}
          </p>
          <button
            type="button"
            onClick={() => openOriginal(logo.url)}
            aria-label="View original requested logo"
          >
            <LogoFrame
              src={logo.url}
              cropConfig={ticketMediaReview?.crop?.logo ?? null}
              alt="Requested logo"
              style={{ width: 130, height: 130 }}
            />
          </button>
        </div>
      )}

      {cover && (
        <div className="mb-5">
          <p
            className={
              isNewTicket
                ? "mb-2 text-sm font-semibold text-gray-900"
                : "mb-2 text-sm font-semibold text-red-600"
            }
          >
            {isNewTicket
              ? "Requested"
              : "Changed — Requested Cover"}
          </p>
          <button
            type="button"
            onClick={() => openOriginal(cover.url)}
            aria-label="View original requested cover"
            style={{
              display: "block",
              width: 300,
              maxWidth: "100%",
              aspectRatio: "3 / 1",
              overflow: "hidden",
              position: "relative",
              borderRadius: 8,
              padding: 0,
              border: 0,
              background: "transparent",
              cursor: "zoom-in",
            }}
          >
            <img
              src={cover.url}
              alt="Requested cover"
              style={{
                width: "100%",
                height: "100%",
                ...getMediaCropStyle(ticketMediaReview?.crop?.cover ?? null),
              }}
            />
          </button>
        </div>
      )}

      {ticketMediaReview?.galleryRemovalRequested === true && (
        <p className="mb-4 text-sm font-semibold text-red-600">
          Gallery Image Removal Requested — Review the ticket removal details.
        </p>
      )}

      {gallery.length > 0 && (
        <div className="mb-5">
          <p
            className={
  isNewTicket ? "mb-2 text-sm font-semibold text-gray-900"
                : "mb-2 text-sm font-semibold text-red-600"
            }
          >
            {isNewTicket
              ? "Requested"
              : "Added — Review Required"}
          </p>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {gallery.map((image) => (
              <button
                key={image.assetId}
                type="button"
                onClick={() => openOriginal(image.url)}
                aria-label="View original requested gallery image"
              >
                <img
                  src={image.url}
                  alt="Requested gallery image"
                  className="h-28 w-full rounded-lg object-cover"
                />
              </button>
            ))}
          </div>
        </div>
      )}

      {gallery.length === 0 &&
        Array.isArray(currentGallery) &&
        currentGallery.length > 0 && (
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {currentGallery.map((image, index) => {
              const url = typeof image === "string" ? image : image?.url;
              return url ? (
                <button
                  key={index}
                  type="button"
                  onClick={() => openOriginal(url)}
                >
                  <img
                    src={url}
                    alt="Current gallery image"
                    className="h-28 w-full rounded-lg object-cover"
                  />
                </button>
              ) : null;
            })}
          </div>
        )}

      {originalUrl && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-6"
          role="dialog"
          aria-modal="true"
          aria-label="Original ticket image"
          onClick={(event) => {
            if (event.target === event.currentTarget) {
              setOriginalUrl(null);
            }
          }}
        >
          <button
            ref={viewerCloseRef}
            type="button"
            className="absolute right-6 top-6 rounded bg-white px-4 py-2 text-black"
            onClick={() => setOriginalUrl(null)}
          >
            Close
          </button>
          <img
            src={originalUrl}
            alt="Original uncropped ticket image"
            style={{ maxWidth: "95vw", maxHeight: "85vh", objectFit: "contain" }}
          />
        </div>
      )}
    </div>
  );
}
