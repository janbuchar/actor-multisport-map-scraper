import { Actor, log } from "apify";
import { AdaptivePlaywrightCrawler } from "crawlee";
import { createRouter, type VenueRegistry } from "./routes.ts";
import { InputSchema, Label } from "./types.ts";

const BASE_URL = "https://mapa.multisport.cz";

await Actor.init();

const input = InputSchema.parse((await Actor.getInput()) ?? {});

const proxyConfiguration = await Actor.createProxyConfiguration();

// venue ID -> categories it appears in, filled during phase one.
const registry: VenueRegistry = new Map();

const crawler = new AdaptivePlaywrightCrawler({
  proxyConfiguration,
  requestHandler: createRouter(registry),
  // Two passes (plain HTTP vs. rendered) should agree on what they collected.
  resultComparator: (a, b) =>
    a.datasetItems.length === b.datasetItems.length &&
    a.enqueuedUrls.length === b.enqueuedUrls.length,
  renderingTypeDetectionRatio: 0.3,
});

const selected = input.categories.length > 0 ? input.categories.join(", ") : "all categories";
log.info(`Starting MultiSport map crawl (${selected})...`);

// Phase one: discover which venues belong to which categories. A venue may be
// listed in several categories, so we must collect them all before scraping
// any detail page (otherwise each venue's category list would be incomplete).
await crawler.run([
  {
    url: `${BASE_URL}/cs/`,
    label: Label.Main,
    userData: { categories: input.categories },
  },
]);

log.info(`Discovered ${registry.size} unique venues. Scraping details...`);

// Phase two: scrape each venue once, tagged with its full category list.
await crawler.run(
  [...registry].map(([id, categories]) => ({
    url: `${BASE_URL}/cs/${id}`,
    label: Label.Detail,
    userData: { categories: [...categories] },
  })),
);

log.info("Crawl finished.");

await Actor.exit();
