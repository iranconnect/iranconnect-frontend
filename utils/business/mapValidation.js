export function isValidGoogleMapsUrl(value) {
  if (!value) return false;

  return /^(https:\/\/)(www\.)?(google\.[a-z.]+\/maps|maps\.app\.goo\.gl|goo\.gl\/maps)/i.test(
    String(value).trim()
  );
}
