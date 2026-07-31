export function resolveSentrySampleRate(value, fallback) {
  if (
    value === undefined ||
    value === null ||
    String(value).trim() === ""
  ) {
    return fallback;
  }

  const parsed = Number(value);

  if (
    Number.isFinite(parsed) &&
    parsed >= 0 &&
    parsed <= 1
  ) {
    return parsed;
  }

  return fallback;
}
