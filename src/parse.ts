import type { Venue } from "./types.ts";

/** Collapse runs of whitespace (incl. newlines) and trim. */
export function normalizeText(raw: string | null | undefined): string {
  return (raw ?? "").replace(/\s+/g, " ").trim();
}

/** Strip a `tel:` / `mailto:` scheme from a link href. */
function stripScheme(href: string | null | undefined): string | null {
  const value = normalizeText(href);
  if (!value) return null;
  return value.replace(/^(tel:|mailto:)/i, "").trim() || null;
}

/** Return a non-empty trimmed string or null. */
function orNull(value: string | null | undefined): string | null {
  const v = normalizeText(value);
  return v.length > 0 ? v : null;
}

export interface RawVenue {
  url: string;
  id: number | null;
  /** Raw venue title (`.detail-item-header h1`). */
  title: string;
  /** Raw `.card-desc` text (only the first occurrence). */
  description: string;
  /** Human-readable category titles this venue was listed under. */
  categories: string[];
  /** Activity badge labels. */
  activities: string[];
  /** Raw href of the website link, if any. */
  websiteHref: string | null;
  /** Raw href of the Facebook link, if any. */
  facebookHref: string | null;
  /** Raw href of the `tel:` link, if any. */
  phoneHref: string | null;
  /** Raw href of the `mailto:` link, if any. */
  emailHref: string | null;
  /** Raw street text. */
  street: string | null;
  /** Raw city text. */
  city: string | null;
}

/** Normalize the raw, already-classified fields into a clean Venue. */
export function parseVenue(raw: RawVenue): Venue {
  return {
    url: raw.url,
    id: raw.id,
    title: normalizeText(raw.title),
    description: normalizeText(raw.description),
    categories: raw.categories,
    activities: raw.activities.map((a) => normalizeText(a)).filter((a) => a.length > 0),
    street: orNull(raw.street),
    city: orNull(raw.city),
    phone: stripScheme(raw.phoneHref),
    email: stripScheme(raw.emailHref),
    website: orNull(raw.websiteHref),
    facebook: orNull(raw.facebookHref),
  };
}
