import { createAdaptivePlaywrightRouter } from "crawlee";
import { z } from "zod";
import { parseVenue } from "./parse.ts";
import {
  CATEGORY_SLUGS,
  CATEGORY_TITLES,
  type CategorySlug,
  categorySlugFromUrl,
  Label,
} from "./types.ts";

const BASE_URL = "https://mapa.multisport.cz";

const SelectedCategoriesSchema = z.array(z.enum(CATEGORY_SLUGS)).catch([]);

/**
 * Maps a venue ID to the set of category slugs it was found under. A venue can
 * be listed in multiple categories, so this collects them all during the
 * category-listing phase before any detail page is scraped.
 */
export type VenueRegistry = Map<string, Set<CategorySlug>>;

const CategoryUserDataSchema = z.object({
  category: z.enum(CATEGORY_SLUGS),
});

const DetailUserDataSchema = z.object({
  categories: z.array(z.enum(CATEGORY_SLUGS)).catch([]),
});

/**
 * Build the crawler router. The category handler records venue → category
 * associations into `registry`; the caller enqueues the detail requests
 * afterwards (see `main.ts`), so every venue carries its full category list.
 */
export function createRouter(registry: VenueRegistry) {
  const router = createAdaptivePlaywrightRouter();

  // Landing page: collect the activity category links, keeping only the ones
  // the user asked for (or all of them when no filter was given).
  router.addHandler(Label.Main, async ({ request, addRequests, querySelector, log }) => {
    const selected = new Set(SelectedCategoriesSchema.parse(request.userData.categories));

    let urls = (await querySelector("a[data-search_type=ACTIVITY_CATEGORY][data-url]"))
      .map((_, el) => el.attribs["data-url"])
      .toArray()
      .filter((url): url is string => Boolean(url));

    if (selected.size > 0) {
      urls = urls.filter((url) => {
        const slug = categorySlugFromUrl(url);
        return slug !== null && selected.has(slug);
      });
    }

    log.info(`Enqueuing ${urls.length} categor${urls.length === 1 ? "y" : "ies"}`);

    await addRequests(
      urls.flatMap((url) => {
        const slug = categorySlugFromUrl(url);
        if (slug === null) return [];
        return [{ url: `${BASE_URL}${url}`, label: Label.Category, userData: { category: slug } }];
      }),
    );
  });

  // Category page: record which venues belong to this category. Detail
  // requests are NOT enqueued here — see `main.ts` phase two.
  router.addHandler(Label.Category, async ({ request, querySelector, log }) => {
    const { category } = CategoryUserDataSchema.parse(request.userData);

    const ids = (await querySelector("a[data-id]"))
      .map((_, el) => el.attribs["data-id"])
      .toArray()
      .filter((id): id is string => Boolean(id));

    for (const id of ids) {
      let categories = registry.get(id);
      if (categories === undefined) {
        categories = new Set();
        registry.set(id, categories);
      }
      categories.add(category);
    }

    log.info(`Found ${ids.length} venue IDs in "${CATEGORY_TITLES[category]}"`);
  });

  // Detail page: extract a single venue, tagged with its categories.
  router.addHandler(
    Label.Detail,
    async ({ request, querySelector, parseWithCheerio, pushData, log }) => {
      const { categories } = DetailUserDataSchema.parse(request.userData);

      // Wait only for the always-present title, then parse the rendered DOM once.
      // Optional fields (website, phone, …) must not be `await querySelector`-ed
      // individually, as the adaptive crawler would block waiting for elements
      // that legitimately do not exist on every venue.
      await querySelector(".detail-item-header h1");
      const $ = await parseWithCheerio();

      const sidebar = $("#id_sidebar_container");
      const hrefOf = (selector: string): string | null =>
        sidebar.find(selector).first().attr("href") ?? null;

      const venue = parseVenue({
        url: request.url,
        id: idFromUrl(request.url),
        title: $(".detail-item-header h1").first().text(),
        // `.card-desc` repeats once per card variant; only the first is meaningful.
        description: $(".card-desc").first().text(),
        categories: categories.map((slug) => CATEGORY_TITLES[slug]),
        activities: sidebar
          .find("a[data-search_type=ACTIVITY]")
          .toArray()
          .map((el) => $(el).text()),
        websiteHref: hrefOf("li:has(i.fa-globe) a[href]"),
        facebookHref: hrefOf('li a[href*="facebook.com"]'),
        phoneHref: hrefOf('li a[href^="tel:"]'),
        emailHref: hrefOf('li a[href^="mailto:"]'),
        street: sidebar.find("li:has(i.fa-map-marker-alt)").first().text() || null,
        city: sidebar.find("li:has(i.fa-building)").first().text() || null,
      });

      log.info(`Scraped venue "${venue.title}" (${venue.categories.length} categories)`);
      await pushData(venue);
    },
  );

  return router;
}

function idFromUrl(url: string): number | null {
  const match = /\/cs\/(\d+)/.exec(url);
  return match ? Number(match[1]) : null;
}
