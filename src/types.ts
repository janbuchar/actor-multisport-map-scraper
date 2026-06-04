import { z } from "zod";

/**
 * Slugs of the activity categories offered by the MultiSport map. A slug is
 * the path segment used in the category URL (`/cs/category/<slug>`).
 *
 * This tuple is the single source of truth for the input enum
 * (`.actor/actor.json`), input validation, and routing.
 */
export const CATEGORY_SLUGS = [
  "bazeny-a-vodni-sporty-1",
  "rodice-s-detmi-2",
  "joga-a-zdravotni-cviceni-3",
  "lezecke-steny-4",
  "posilovny-a-silove-treninky-5",
  "pro-tehotne-6",
  "raketove-a-micove-sporty-7",
  "sezonni-a-ostatni-aktivity-8",
  "skupinove-a-tanecni-lekce-9",
  "wellness-a-relax-10",
] as const;

export type CategorySlug = (typeof CATEGORY_SLUGS)[number];

/** Human-readable Czech titles for each category slug, as shown on the site. */
export const CATEGORY_TITLES: Record<CategorySlug, string> = {
  "bazeny-a-vodni-sporty-1": "Bazény a vodní sporty",
  "rodice-s-detmi-2": "Rodiče s dětmi",
  "joga-a-zdravotni-cviceni-3": "Jóga a zdravotní cvičení",
  "lezecke-steny-4": "Lezecké stěny",
  "posilovny-a-silove-treninky-5": "Posilovny a silové tréninky",
  "pro-tehotne-6": "Pro těhotné",
  "raketove-a-micove-sporty-7": "Raketové a míčové sporty",
  "sezonni-a-ostatni-aktivity-8": "Sezónní a ostatní aktivity",
  "skupinove-a-tanecni-lekce-9": "Skupinové a taneční lekce",
  "wellness-a-relax-10": "Wellness a relax",
};

function isCategorySlug(value: string): value is CategorySlug {
  return (CATEGORY_SLUGS as readonly string[]).includes(value);
}

/** Resolve a category slug from a category `data-url` (`/cs/category/<slug>`). */
export function categorySlugFromUrl(url: string): CategorySlug | null {
  const slug = url.split("/").pop() ?? "";
  return isCategorySlug(slug) ? slug : null;
}

/** Input schema for the Actor, mirrors .actor/actor.json. */
export const InputSchema = z.object({
  /**
   * Activity categories to scrape. When empty, every category is scraped.
   */
  categories: z.array(z.enum(CATEGORY_SLUGS)).default([]),
});

export type Input = z.infer<typeof InputSchema>;

/** Labels used to route requests through the crawler. */
export const Label = {
  Main: "main",
  Category: "category",
  Detail: "detail",
} as const;

export type Label = (typeof Label)[keyof typeof Label];

/** A single MultiSport venue scraped from a detail page. */
export interface Venue {
  url: string;
  id: number | null;
  title: string;
  description: string;
  /** Human-readable titles of every category this venue was listed under. */
  categories: string[];
  activities: string[];
  street: string | null;
  city: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  facebook: string | null;
}
