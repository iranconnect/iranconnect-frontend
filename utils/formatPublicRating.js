// frontend/utils/formatPublicRating.js

export function formatPublicRating(value) {
  const numericValue = Number(value);

  if (!Number.isFinite(numericValue)) {
    return "0";
  }

  return numericValue
    .toFixed(2)
    .replace(/\.?0+$/, "");
}
