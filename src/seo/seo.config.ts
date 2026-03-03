export const DEFAULT_SITE_URL = 'https://fablheim.com';
export const SITE_NAME = 'Fablheim';
export const DEFAULT_OG_IMAGE = '/social-preview.png';

export function getSiteUrl(): string {
  const raw = import.meta.env.VITE_SITE_URL || DEFAULT_SITE_URL;
  return raw.endsWith('/') ? raw : `${raw}/`;
}

export function buildCanonicalUrl(canonicalPath: string): string {
  const path = canonicalPath.startsWith('/') ? canonicalPath : `/${canonicalPath}`;
  return new URL(path, getSiteUrl()).toString();
}

