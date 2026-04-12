const OPGG_RE = /^https:\/\/(www\.)?op\.gg\/summoners\/[a-z0-9_-]+\/.+$/i;

export function validateOpggUrl(url: string): boolean {
  return OPGG_RE.test(url.trim());
}
