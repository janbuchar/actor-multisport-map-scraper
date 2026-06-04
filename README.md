# MultiSport Map Scraper

An [Apify Actor](https://apify.com/actors) that scrapes the
[MultiSport map](https://mapa.multisport.cz/cs/) for venues that accept the
MultiSport card.

It walks the activity categories, collects every venue ID, and then scrapes each
venue's detail page into a structured record.

## Output

Each dataset item is a venue:

```json
{
  "url": "https://mapa.multisport.cz/cs/193",
  "id": 193,
  "title": "Legion Gym",
  "description": "Fitness a Skupinové lekce ( TRX, Funkční trénink, Strečink)",
  "categories": ["Posilovny a silové tréninky", "Skupinové a taneční lekce"],
  "activities": ["Funkční trénink", "Posilovna", "Stretching", "..."],
  "street": "Husova 100",
  "city": "Jaroměř",
  "phone": "+420 606 182 647",
  "email": "info@legiongym.cz",
  "website": "http://legiongym.cz/",
  "facebook": "https://www.facebook.com/legiongymjaromer"
}
```

Fields that a venue does not provide (e.g. `facebook`, `website`) are `null`.
`categories` lists every activity category the venue was found under (a venue
can appear in more than one), and is always non-empty.

## Input

| Field        | Type            | Default    | Description                                                          |
| ------------ | --------------- | ---------- | -------------------------------------------------------------------- |
| `categories` | array of string | `[]` (all) | Activity categories to scrape. Leave empty to scrape every category. |

The available category slugs are:

| Slug                            | Category                    |
| ------------------------------- | --------------------------- |
| `bazeny-a-vodni-sporty-1`       | Bazény a vodní sporty       |
| `rodice-s-detmi-2`              | Rodiče s dětmi              |
| `joga-a-zdravotni-cviceni-3`    | Jóga a zdravotní cvičení    |
| `lezecke-steny-4`               | Lezecké stěny               |
| `posilovny-a-silove-treninky-5` | Posilovny a silové tréninky |
| `pro-tehotne-6`                 | Pro těhotné                 |
| `raketove-a-micove-sporty-7`    | Raketové a míčové sporty    |
| `sezonni-a-ostatni-aktivity-8`  | Sezónní a ostatní aktivity  |
| `skupinove-a-tanecni-lekce-9`   | Skupinové a taneční lekce   |
| `wellness-a-relax-10`           | Wellness a relax            |

Example input (scrape only climbing walls and pools):

```json
{
  "categories": ["lezecke-steny-4", "bazeny-a-vodni-sporty-1"]
}
```

## Tech stack

- Node.js 24 with native TypeScript execution (no build step)
- [Crawlee](https://crawlee.dev/)'s `AdaptivePlaywrightCrawler` — uses plain HTTP
  where possible and falls back to a real browser only when needed
- [Apify SDK](https://docs.apify.com/sdk/js/) for input, proxy, and dataset
- `zod` for input validation, `oxlint`/`oxfmt` for linting/formatting,
  `vitest` for tests

The crawler uses Apify Proxy by default when run on the platform.

## Development

```bash
npm install
npm start          # run locally against the live site
npm test           # run unit tests
npm run lint       # lint
npm run fmt        # format
npm run typecheck  # type check
```

Without an Apify token, `Actor.createProxyConfiguration()` returns no proxy, so
local runs hit the site directly — no extra configuration needed.
