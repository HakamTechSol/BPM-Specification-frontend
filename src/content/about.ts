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
 *  5. The Bedrijf page never shows the campsite's own data; it only shows the
 *     pending line until the client supplies the final text.
 */

/** Identifies one support page; also its URL segment (/about/<key>). */
export type SupportPageKey = "contact" | "bedrijf" | "privacy" | "voorwaarden";

export interface SupportLink {
  key: SupportPageKey;
  label: string;
  /** Icon name, mapped to a Lucide icon in the About page. */
  icon: "life-buoy" | "building" | "shield" | "file-text";
}

/** A tap target inside a paragraph, field or bullet (tel:, mailto:, …). */
export interface ContentLink {
  /** The exact text as written, e.g. "info@bluedelta.nl". */
  text: string;
  /** Target without spaces or brackets, e.g. "tel:+31742045100". */
  href: string;
}

/** A "Label: value" line, e.g. the contact details of a block. */
export interface ContentField {
  label: string;
  value: string;
  /** Makes the value a tap target with a large hit area. */
  href?: string;
}

export interface ContentSection {
  heading: string;
  /**
   * Render the heading inside the card as a title, with a divider below it,
   * instead of as a small label above the card.
   */
  headingInCard?: boolean;
  /** One paragraph per entry, rendered as its own paragraph. */
  paragraphs?: string[];
  /** Rendered as a real bullet list (<ul>). */
  bullets?: string[];
  /** Rendered as label/value rows, e.g. contact details or company data. */
  fields?: ContentField[];
  /** Paragraphs that come after the bullet list, keeping the client's order. */
  closing?: string[];
  /** Tap targets inside this section's paragraphs and bullets. */
  links?: ContentLink[];
}

export interface ContentPage {
  /** Browser tab title, shown as "<tabTitle> · BluePlug". */
  tabTitle: string;
  /** Heading in the page header (ManagerLayout title). */
  heading: string;
  /** Small line under the heading, e.g. "Laatst bijgewerkt: …". */
  updated?: string;
  intro?: string;
  sections: ContentSection[];
  /**
   * Fill the page with live data from /api/settings:
   *  "session" → the configured session duration, usable as {dagen}.
   */
  live?: "session";
  /**
   * The page has no text of its own (yet): one neutral line is shown instead.
   * Used while the client's final text is still pending.
   */
  pending?: string;
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

export const supportPages: Record<SupportPageKey, ContentPage> = {
  contact: {
    tabTitle: "Contact opnemen",
    heading: "Contact opnemen",
    sections: [
      {
        heading: "van Heteren Recreatietechniek B.V.",
        headingInCard: true,
        fields: [
          { label: "Adres", value: "Boortorenweg 15" },
          { label: "Postcode", value: "7554 RS" },
          { label: "Woonplaats", value: "Hengelo" },
          { label: "Telefoon", value: "+31 (0)74-2045100", href: "tel:+31742045100" },
          {
            label: "E-mail",
            value: "f.meijerman@vanheteren.com",
            href: "mailto:f.meijerman@vanheteren.com",
          },
        ],
      },
      {
        heading: "Onderhoud software: BlueDelta b.v.",
        headingInCard: true,
        fields: [
          { label: "Contactpersoon", value: "J. Esvelt" },
          { label: "Telefoon", value: "+31 (0) 88 - 7733773", href: "tel:+31887733773" },
          { label: "E-mail", value: "info@bluedelta.nl", href: "mailto:info@bluedelta.nl" },
        ],
      },
    ],
  },

  bedrijf: {
    tabTitle: "Bedrijf",
    heading: "Bedrijf",
    // The campsite's own company data must not be shown here. Only this neutral
    // line is displayed until the client supplies the final text.
    pending: "De bedrijfsgegevens worden binnenkort toegevoegd.",
    sections: [],
  },

  privacy: {
    tabTitle: "Privacyverklaring",
    heading: "Privacyverklaring",
    updated: "Laatst bijgewerkt: 10-07-2026",
    intro:
      "Deze privacyverklaring is bestemd voor gebruikers van de beheerderomgeving van BluePlug (locatie-eigenaren, locatie-managers en systeembeheerders). Voor eindklanten die via een QR-code een dienst afnemen geldt een aparte publieke privacyverklaring.",
    sections: [
      {
        heading: "1. Verwerkingsverantwoordelijke",
        fields: [
          { label: "Onderneming", value: "BlueDelta b.v." },
          { label: "Adres", value: "Industrieweg 26, 2254 AE, Voorschoten" },
          { label: "KvK-nummer", value: "09117157" },
          {
            label: "Contact",
            value: "info@bluedelta.nl",
            href: "mailto:info@bluedelta.nl",
          },
        ],
      },
      {
        heading: "2. Welke gegevens verwerken wij van u?",
        paragraphs: ["Voor de beheerderomgeving verwerken wij de volgende persoonsgegevens:"],
        bullets: [
          "Accountgegevens: naam, e-mailadres, functie/rol, en een versleuteld wachtwoord.",
          "Rol en rechten: uw toegewezen rol (beheerder, locatie-eigenaar of locatie-manager) en de locaties waarvoor u bevoegd bent.",
          "Inlog- en sessiegegevens: tijdstip van inloggen, IP-adres van het inlogverzoek, en een sessiecookie om uw sessie te herkennen.",
          "Handelingen in het systeem: mutaties die u uitvoert (zoals het aanmaken van locaties, aanpassen van prijzen of het bevestigen van storingen) worden gelogd voor audit- en beveiligingsdoeleinden.",
          "Technische logs: IP-adres, browsertype en tijdstippen van bezoek, opgeslagen in serverlogs.",
        ],
      },
      {
        heading: "3. Waarom verwerken wij deze gegevens?",
        bullets: [
          "Om u toegang te geven tot de beheerderomgeving en de juiste rechten toe te kennen.",
          "Om de veiligheid van het systeem te waarborgen (fraude- en misbruikpreventie, detectie van ongeoorloofde toegang).",
          "Om te kunnen herleiden wie welke wijziging heeft doorgevoerd (audit trail).",
          "Om technische storingen op te lossen en het systeem te onderhouden.",
          "Om te voldoen aan wettelijke bewaar- en verantwoordingsplichten.",
        ],
      },
      {
        heading: "4. Grondslagen",
        bullets: [
          "Uitvoering van de overeenkomst (art. 6 lid 1 sub b AVG) — wij hebben uw gegevens nodig om u toegang tot de beheerderomgeving te kunnen verlenen.",
          "Gerechtvaardigd belang (art. 6 lid 1 sub f AVG) — beveiliging van het systeem, audit trail en misbruikpreventie zijn zwaarwegende belangen. Uw privacybelang is meegewogen: er worden geen gedragsprofielen aangelegd en de logs zijn alleen inzichtelijk voor bevoegde beheerders.",
          "Wettelijke verplichting (art. 6 lid 1 sub c AVG) — voor zover wij op grond van bijvoorbeeld de fiscale of civielrechtelijke verantwoordingsplicht gegevens moeten bewaren.",
        ],
      },
      {
        heading: "5. Wie heeft toegang tot uw gegevens?",
        bullets: [
          "Interne beheerders: alleen bevoegde systeembeheerders van [Naam onderneming] hebben inzage in accountlogs en audit trails.",
          "Hostingprovider: onze webhost verwerkt technische logs namens ons op basis van een verwerkersovereenkomst.",
          "Wettelijke autoriteiten: alleen indien wij daartoe wettelijk verplicht zijn.",
        ],
        closing: [
          "Uw gegevens worden niet verkocht of doorgegeven aan derden voor commerciële doeleinden.",
        ],
      },
      {
        heading: "6. Bewaartermijnen",
        bullets: [
          "Accountgegevens: zolang uw account actief is, en tot maximaal 12 maanden na deactivatie voor eventueel herstel.",
          "Inlog- en auditlogs: 24 maanden, tenzij een langere termijn wettelijk vereist is (bijvoorbeeld bij lopende juridische procedures).",
          "Serverlogs (IP-adressen): maximaal 90 dagen.",
          "Sessiecookie: verdwijnt bij het sluiten van de browser of uitloggen.",
        ],
      },
      {
        heading: "7. Beveiliging",
        paragraphs: [
          "Wij nemen passende technische en organisatorische maatregelen om uw gegevens te beschermen:",
        ],
        bullets: [
          "Wachtwoorden worden opgeslagen als eenrichtingshash.",
          "Verbindingen naar de beheerderomgeving verlopen over HTTPS.",
          "Toegang tot beheerderfuncties is rolgebaseerd en per locatie ingeperkt.",
          "Gevoelige velden (zoals betaalcredentials) zijn alleen zichtbaar en aanpasbaar voor systeembeheerders.",
        ],
      },
      {
        heading: "8. Uw rechten",
        paragraphs: ["U heeft, met betrekking tot de over u verwerkte gegevens, het recht om:"],
        bullets: [
          "Inzage te vragen in de gegevens die wij van u verwerken;",
          "Onjuiste gegevens te laten corrigeren;",
          "Gegevens te laten verwijderen (voor zover geen wettelijke bewaarplicht of gerechtvaardigd belang zich daartegen verzet);",
          "Bezwaar te maken tegen verwerking of deze te laten beperken;",
          "Uw accountgegevens in gestructureerde vorm te ontvangen (dataportabiliteit).",
        ],
        closing: [
          "Verzoeken kunt u indienen via info@bluedelta.nl. Wij reageren binnen vier weken.",
        ],
        links: [{ text: "info@bluedelta.nl", href: "mailto:info@bluedelta.nl" }],
      },
      {
        heading: "9. Klacht indienen",
        paragraphs: [
          "Bent u het niet eens met hoe wij met uw gegevens omgaan? Neem dan eerst contact met ons op. U heeft ook het recht een klacht in te dienen bij de Autoriteit Persoonsgegevens via autoriteitpersoonsgegevens.nl.",
        ],
      },
      {
        heading: "10. Wijzigingen",
        paragraphs: [
          "Wij kunnen deze verklaring aanpassen wanneer wetgeving of onze dienstverlening dat vereist. De actuele versie is altijd op deze pagina beschikbaar.",
        ],
      },
    ],
  },

  voorwaarden: {
    tabTitle: "Gebruiksvoorwaarden",
    heading: "Gebruiksvoorwaarden",
    // TODO: replace with the final text from the client
    pending: "De gebruiksvoorwaarden worden binnenkort toegevoegd.",
    sections: [],
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
