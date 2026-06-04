import { describe, expect, it } from "vitest";
import { parseVenue } from "./parse.ts";

describe("parseVenue", () => {
  it("normalizes a fully populated venue", () => {
    const venue = parseVenue({
      url: "https://mapa.multisport.cz/cs/16",
      id: 16,
      title: "  Plavecký areál Zábřeh ",
      description: "Krytý bazén dospělí (60min)",
      categories: ["Bazény a vodní sporty", "Wellness a relax"],
      activities: ["Bazén", "  Sauna/Pára ", ""],
      websiteHref: "http://zabreh-bazen.cz",
      facebookHref: "https://www.facebook.com/zabrehplaveckyareal/",
      phoneHref: "tel:+420 583 550 361",
      emailHref: "mailto:recepce@ekozabreh.cz",
      street: "  Oborník 608/39 ",
      city: "Zábřeh",
    });

    expect(venue).toEqual({
      url: "https://mapa.multisport.cz/cs/16",
      id: 16,
      title: "Plavecký areál Zábřeh",
      description: "Krytý bazén dospělí (60min)",
      categories: ["Bazény a vodní sporty", "Wellness a relax"],
      activities: ["Bazén", "Sauna/Pára"],
      street: "Oborník 608/39",
      city: "Zábřeh",
      phone: "+420 583 550 361",
      email: "recepce@ekozabreh.cz",
      website: "http://zabreh-bazen.cz",
      facebook: "https://www.facebook.com/zabrehplaveckyareal/",
    });
  });

  it("keeps a single-activity venue's activity", () => {
    const venue = parseVenue({
      url: "https://mapa.multisport.cz/cs/31",
      id: 31,
      title: "Plavecký bazén Všestary",
      description: "Bazén",
      categories: ["Bazény a vodní sporty"],
      activities: ["Bazén"],
      websiteHref: "http://skvlnka.cz/hlavni-stranka.html",
      facebookHref: null,
      phoneHref: "tel:+420 775 690 307",
      emailHref: "mailto:skvlnka@seznam.cz",
      street: "Všestary 57",
      city: "Všestary",
    });

    expect(venue.activities).toEqual(["Bazén"]);
    expect(venue.categories).toEqual(["Bazény a vodní sporty"]);
    expect(venue.facebook).toBeNull();
    expect(venue.phone).toBe("+420 775 690 307");
  });

  it("returns null for missing contact fields", () => {
    const venue = parseVenue({
      url: "https://mapa.multisport.cz/cs/99",
      id: 99,
      title: "Empty Venue",
      description: "",
      categories: [],
      activities: [],
      websiteHref: null,
      facebookHref: null,
      phoneHref: null,
      emailHref: null,
      street: null,
      city: null,
    });

    expect(venue.website).toBeNull();
    expect(venue.phone).toBeNull();
    expect(venue.email).toBeNull();
    expect(venue.street).toBeNull();
    expect(venue.city).toBeNull();
    expect(venue.activities).toEqual([]);
  });
});
