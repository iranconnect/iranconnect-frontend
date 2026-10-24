import { useEffect, useMemo, useState } from "react";
import apiClient from "../../../utils/apiClient";

const ALLOWED_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
]);

export default function useTicketMediaPreview(mode, ticketMediaReview) {
  const enabled =
    mode === "admin-create-ticket" ||
    mode === "admin-edit-request";

  const ticketId = Number(ticketMediaReview?.ticketId);

  const assets = useMemo(() => {
    if (!enabled || !Array.isArray(ticketMediaReview?.media)) {
      return [];
    }

    return ticketMediaReview.media.filter(
      (asset) =>
        asset?.snapshot_group === "requested" &&
        ["logo", "cover", "gallery"].includes(asset.role)
    );
  }, [enabled, ticketMediaReview?.media]);

  const identity = JSON.stringify({
    ticketId,
    assets: assets.map((asset) => [
      asset.asset_id,
      asset.role,
      asset.display_order,
      asset.preview_available,
    ]),
  });

  const [state, setState] = useState({
    ticketId: null,
    identity: null,
    images: [],
    loading: false,
    error: "",
  });

  useEffect(() => {
    if (!enabled || !Number.isSafeInteger(ticketId) || ticketId <= 0) {
      setState({
        ticketId: null,
        identity: null,
        images: [],
        loading: false,
        error: "",
      });
      return;
    }

    const controller = new AbortController();
    let cancelled = false;
    const urls = [];

    setState({
      ticketId,
      identity,
      images: [],
      loading: assets.length > 0,
      error: "",
    });

    async function load() {
      try {
        if (assets.some((asset) => asset.preview_available !== true)) {
          throw new Error("Ticket media preview unavailable.");
        }

        const images = await Promise.all(
          assets.map(async (asset) => {
            const assetId = Number(asset.asset_id);

            if (!Number.isSafeInteger(assetId) || assetId <= 0) {
              throw new Error("Invalid ticket asset ID.");
            }

            const response = await apiClient.get(
              `/admin/requests/${ticketId}/media/${assetId}/preview`,
              {
                responseType: "blob",
                withCredentials: true,
                signal: controller.signal,
              }
            );

            if (cancelled || controller.signal.aborted) return null;

            const blob = response.data;

            if (
              !(blob instanceof Blob) ||
              !ALLOWED_IMAGE_TYPES.has(blob.type)
            ) {
              throw new Error("Invalid ticket image response.");
            }

            const url = URL.createObjectURL(blob);
            urls.push(url);

            return {
              assetId,
              role: asset.role,
              displayOrder: asset.display_order,
              url,
            };
          })
        );

        if (cancelled || controller.signal.aborted) return;

        if (images.some((image) => !image)) {
          throw new Error("Incomplete ticket media preview.");
        }

        setState({
          ticketId,
          identity,
          images,
          loading: false,
          error: "",
        });
      } catch {
        if (!cancelled && !controller.signal.aborted) {
          setState({
            ticketId,
            identity,
            images: [],
            loading: false,
            error:
              "Ticket media verification failed. Do not approve without reviewing the requested images.",
          });
        }
      }
    }

    load();

    return () => {
      cancelled = true;
      controller.abort();
      urls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [enabled, ticketId, identity]);

  const verified =
    enabled &&
    state.ticketId === ticketId &&
    state.identity === identity &&
    !state.loading &&
    !state.error &&
    assets.length > 0 &&
    state.images.length === assets.length &&
    assets.every((asset) => asset.preview_available === true);

  return {
    ...state,
    images:
      state.ticketId === ticketId && state.identity === identity
        ? state.images
        : [],
    verified,
    assets,
  };
}
