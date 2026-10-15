/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  PAGE CONTENT — edit the text here, never in the route files.
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Everything the About page and its sub-pages show lives in this file:
 * headings, paragraphs, link labels, the company-field labels and the footer.
 * Layout, styling and routing are handled by the route files and
 * `src/components/support-page.tsx`, so replacing copy never requires touching
 * a component.
 *
 * HOW TO EDIT
 *  1. Replace any paragraph marked "[Placeholder] " with the real text and
 *     delete the marker.
 *  2. Add, reorder or remove whole sections by editing the `sections` arrays.
 *     Each entry is { heading, paragraphs } and is rendered as one card.
 *  3. Keep the four page keys (contact, bedrijf, privacy, voorwaarden) — the
 *     routes and the About links point at them.
 *  4. `{dagen}` inside a paragraph is replaced by the configured session
 *     duration from the settings. Leave it in place unless you want a fixed
 *     number.
 *  5. Pages with `live` read their data from the API; their copy should not
 *     contain company details, those are filled in automatically.
 */

/** Identifies one support page; also its URL segment (/about/<key>). */
export type SupportPageKey = "contact" | "bedrijf" | "privacy" | "voorwaarden";

export interface SupportLink {
  key: SupportPageKey;
  label: string;
  /** Icon name, mapped to a Lucide icon in the About page. */
  icon: "life-buoy" | "building" | "shield" | "file-text";
}

export interface ContentSection {
  heading: string;
  /** One paragraph per entry, rendered as its own paragraph. */
  paragraphs: string[];
}

export interface ContentPage {
  /** Browser tab title, shown as "<tabTitle> · BluePlug". */
  tabTitle: string;
  /** Heading in the page header (ManagerLayout title). */
  heading: string;
  intro?: string;
  sections: ContentSection[];
  /**
   * Fill the page with live data from /api/settings:
   *  "eigenaar" → the campsite's own company details,
   *  "session"  → the configured session duration, usable as {dagen}.
   */
  live?: "eigenaar" | "session";
  /** Marks a draft text: shows a small "Concepttekst" line. */
  concept?: boolean;
  /** Shown when the live data is empty or could not be loaded. */
  emptyNote?: string;
  errorNote?: string;
}

export const about = {
  productName: "BluePlug",
  /** Shown under the "Over ons" heading. */
  subtitle: "Versie & ondersteuning",
  footer: "© 2026 BluePlug B.V. · Gemaakt voor de natuur.",
  links: [
    { key: "contact", label: "Contact opnemen", icon: "life-buoy" },
    { key: "bedrijf", label: "Bedrijf", icon: "building" },
    { key: "privacy", label: "Privacybeleid", icon: "shield" },
    { key: "voorwaarden", label: "Gebruiksvoorwaarden", icon: "file-text" },
  ] satisfies SupportLink[],
};

/**
 * The Bedrijf page shows these fields straight from /api/settings → eigenaar.
 * Empty fields are hidden, so nothing is invented: keep the list and the
 * labels in sync with what the settings form offers.
 */
export const companyFields = [
  { key: "naam", label: "Naam" },
  { key: "adres", label: "Adres" },
  { key: "postcodePlaats", label: "Postcode en plaats" },
  { key: "telefoon", label: "Telefoon" },
  { key: "email", label: "E-mailadres" },
  { key: "website", label: "Website" },
  { key: "kvk", label: "KvK-nummer" },
  { key: "btwNummer", label: "Btw-nummer" },
] as const;

export const supportPages: Record<SupportPageKey, ContentPage> = {
  contact: {
    tabTitle: "Contact opnemen",
    heading: "Contact opnemen",
    intro:
      "Werkt de stroom van een plaats niet? Neem contact op met de camping en vermeld het plaatsnummer, dan kan het snel worden opgelost.",
    sections: [
      {
        heading: "Wat kunt u doorgeven",
        paragraphs: [
          "Het plaatsnummer en wat u ziet: de stroom staat uit, er verschijnt een foutcode op het scherm, of de stroom valt steeds uit.",
        ],
      },
      {
        heading: "Contactgegevens",
        paragraphs: ["[Placeholder] Contactgegevens volgen."],
      },
    ],
  },

  bedrijf: {
    tabTitle: "Bedrijf",
    heading: "Bedrijf",
    intro: "Dit zijn de bedrijfsgegevens van deze camping, rechtstreeks uit het beheersysteem.",
    live: "eigenaar",
    sections: [
      {
        heading: "Gegevens",
        paragraphs: ["[Placeholder] Hier staan de gegevens die bij de camping zijn ingevuld."],
      },
    ],
    // The live card replaces `sections`; these are shown when the API fails.
    emptyNote: "Er zijn nog geen bedrijfsgegevens ingevuld.",
    errorNote: "De bedrijfsgegevens konden niet worden geladen.",
  },

  privacy: {
    tabTitle: "Privacybeleid",
    heading: "Privacybeleid",
    concept: true,
    live: "session",
    intro:
      "Gasten gebruiken de BluePlug-app zonder account en zonder cookies. Alleen de beheerder logt in.",
    sections: [
      {
        heading: "Gasten",
        paragraphs: [
          "Voor gasten is geen account nodig: de app opent direct met het plaatsnummer. Er worden geen cookies geplaatst en er wordt geen profiel aangemaakt.",
          "Van een gast wordt alleen getoond wat bij de plaats hoort: de stand van de stroom, het stroomverbruik en het reserveringsnummer.",
        ],
      },
      {
        heading: "Beheerder",
        paragraphs: [
          "De beheerder logt in met een eigen account. Dat inlogtoken wordt alleen op het apparaat zelf bewaard en verloopt na de ingestelde sessieduur van {dagen} dagen.",
        ],
      },
      {
        heading: "Verstrekking",
        paragraphs: [
          "Er worden geen gegevens verkocht of doorgegeven aan andere partijen.",
          "Vragen over deze gegevens? Neem dan contact op met de camping via de gegevens op de contactpagina.",
        ],
      },
    ],
  },

  voorwaarden: {
    tabTitle: "Gebruiksvoorwaarden",
    heading: "Gebruiksvoorwaarden",
    concept: true,
    intro: "Met deze app volgt en bedient de camping de stroom van een kampeerplaats.",
    sections: [
      {
        heading: "Gebruik",
        paragraphs: [
          "De app laat zien of de stroom aanstaat en hoeveel een plaats heeft verbruikt. De beheerder stelt daarbij de stroomsterkte en het gratis verbruik per dag in.",
        ],
      },
      {
        heading: "Storing zelf herstellen",
        paragraphs: [
          "Is de stroom uitgevallen door overbelasting? Dan kan de gast na de wachttijd de stroomstoring zelf herstellen met de resetknop in de app.",
        ],
      },
      {
        heading: "Afstandbediening",
        paragraphs: [
          "Plaatsen die op afstand worden bestuurd, kunnen niet lokaal worden bediend. De app laat dan zien dat de plaats op afstand staat.",
        ],
      },
      {
        heading: "Verantwoordelijkheid",
        paragraphs: [
          "De camping is verantwoordelijk voor de juiste instellingen van iedere plaats, zoals de stroomsterkte en de stroom die per dag gratis is.",
        ],
      },
    ],
  },
};

/** Browser tab metadata for a support page, derived from its content. */
export function supportPageHead(pageKey: SupportPageKey) {
  const page = supportPages[pageKey];
  return {
    meta: [
      { title: `${page.tabTitle} · BluePlug` },
      { name: "description", content: `${page.heading} van BluePlug.` },
    ],
  };
}
