import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";

const getSettings = vi.fn();

vi.mock("@/lib/api", () => ({
  clearToken: vi.fn(),
  isAuthenticated: () => true,
  getSettings: () => getSettings(),
}));

vi.mock("@tanstack/react-router", () => ({
  createFileRoute: () => (config: Record<string, unknown>) => config,
  Outlet: () => null,
  Link: ({ children, to, ...rest }: { children: React.ReactNode; to?: string }) => (
    <a href={to ?? "/"} {...rest}>
      {children}
    </a>
  ),
  useRouterState: () => "/about",
  useRouter: () => ({ navigate: vi.fn() }),
}));

import { Route as AboutLayoutRoute } from "./about";
import { Route as AboutIndexRoute } from "./about/index";
import { Route as ContactRoute } from "./about/contact";
import { Route as BedrijfRoute } from "./about/bedrijf";
import { Route as PrivacyRoute } from "./about/privacy";
import { Route as VoorwaardenRoute } from "./about/voorwaarden";
import { SupportPage } from "@/components/support-page";
import { about, supportPageHead, supportPages, type SupportPageKey } from "@/content/about";

function componentOf(route: unknown): React.ComponentType {
  return (route as { component: React.ComponentType }).component;
}

const AboutPage = componentOf(AboutIndexRoute);
const KEYS: SupportPageKey[] = ["contact", "bedrijf", "privacy", "voorwaarden"];

/** Every sub-page route, so each URL is covered. */
const SUB_ROUTES = {
  contact: ContactRoute,
  bedrijf: BedrijfRoute,
  privacy: PrivacyRoute,
  voorwaarden: VoorwaardenRoute,
} as const;

beforeEach(() => {
  getSettings.mockResolvedValue({
    id: 1,
    stroominstelling: ["6"],
    vrijverbruikinstelling: ["0"],
    sessionDurationDays: 14,
    eigenaar: {
      naam: "Camping De Bron",
      straat: "Bosweg",
      nummer: "12",
      postcode: "1234 AB",
      plaats: "Utrecht",
      telefoon: "030-1234567",
      email: "info@debron.nl",
      website: "https://debron.nl",
      kvk: "12345678",
      "btw-nummer": "NL123456789B01",
    },
  });
});

describe("about routes", () => {
  it("keeps /about as a layout that only renders children", () => {
    // The list must not live in the layout, or sub-pages would never render.
    expect((AboutLayoutRoute as unknown as { component: unknown }).component).toBe(
      componentOf(AboutLayoutRoute),
    );
    expect(AboutLayoutRoute).not.toBe(AboutIndexRoute);
  });

  it("registers a route for the list and for each sub-page", () => {
    for (const key of KEYS) {
      const route = SUB_ROUTES[key] as unknown as { component: React.ComponentType };
      expect(route.component).toBeTypeOf("function");
    }
    expect(componentOf(AboutIndexRoute)).toBeTypeOf("function");
  });
});

describe("about page (/about)", () => {
  it("shows the product and the version line, but no tagline", () => {
    render(<AboutPage />);

    expect(screen.getAllByText("BluePlug").length).toBeGreaterThan(0);
    // The version subtitle stays…
    expect(screen.getByText(about.subtitle)).toBeInTheDocument();
    // …the marketing tagline is gone.
    expect(
      screen.queryByText(/Slimme stroomvoorziening voor moderne campings/),
    ).not.toBeInTheDocument();
    expect(screen.queryByText(/bij een langzame internetverbinding/)).not.toBeInTheDocument();
  });

  it("lists the four support links without the old subtitles", () => {
    render(<AboutPage />);

    for (const link of about.links) {
      expect(screen.getByRole("link", { name: new RegExp(link.label, "i") })).toBeInTheDocument();
    }
    expect(screen.queryByText("Reactie binnen 4 uur")).not.toBeInTheDocument();
    expect(screen.queryByText(/BluePlug B\.V\. · Utrecht/)).not.toBeInTheDocument();
  });

  it("links each support entry to its own route", () => {
    render(<AboutPage />);

    expect(screen.getByRole("link", { name: /contact opnemen/i })).toHaveAttribute(
      "href",
      "/about/contact",
    );
    expect(screen.getByRole("link", { name: /^bedrijf$/i })).toHaveAttribute(
      "href",
      "/about/bedrijf",
    );
    expect(screen.getByRole("link", { name: /privacybeleid/i })).toHaveAttribute(
      "href",
      "/about/privacy",
    );
    expect(screen.getByRole("link", { name: /gebruiksvoorwaarden/i })).toHaveAttribute(
      "href",
      "/about/voorwaarden",
    );
  });
});

describe.each(KEYS)("support page /about/%s", (key) => {
  const page = supportPages[key];

  it("renders its own content instead of the about list", async () => {
    const Component = componentOf(SUB_ROUTES[key]);
    render(<Component />);

    expect(screen.getByRole("heading", { level: 1, name: page.heading })).toBeInTheDocument();
    // The list belongs to /about only.
    expect(screen.queryByRole("link", { name: /contact opnemen/i })).not.toBeInTheDocument();
    if (page.live) {
      await waitFor(() => expect(getSettings).toHaveBeenCalled());
    } else {
      expect(getSettings).not.toHaveBeenCalled();
    }
  });

  it("offers a way back to the about page", () => {
    render(<SupportPage pageKey={key} />);

    const back = screen.getByRole("link", { name: /terug naar over ons/i });
    expect(back).toHaveAttribute("href", "/about");
  });

  it("names the page in its tab title", () => {
    const head = supportPageHead(key);

    expect(head.meta[0]).toEqual({ title: `${page.tabTitle} · BluePlug` });
    expect(head.meta[0].title).not.toMatch(/\[Placeholder\]/);
  });
});

describe("contact page", () => {
  it("shows both blocks with the exact contact details", () => {
    render(<SupportPage pageKey="contact" />);

    expect(screen.getByRole("heading", { level: 1, name: "Contact opnemen" })).toBeInTheDocument();
    expect(screen.getByText("van Heteren Recreatietechniek B.V.")).toBeInTheDocument();
    expect(screen.getByText("Onderhoud software: BlueDelta b.v.")).toBeInTheDocument();

    for (const value of [
      "Boortorenweg 15",
      "7554 RS",
      "Hengelo",
      "+31 (0)74-2045100",
      "f.meijerman@vanheteren.com",
      "J. Esvelt",
      "+31 (0) 88 - 7733773",
      "info@bluedelta.nl",
    ]) {
      expect(screen.getByText(value)).toBeInTheDocument();
    }
  });

  it("makes the phone numbers and e-mail addresses tappable", () => {
    render(<SupportPage pageKey="contact" />);

    const links = screen
      .getAllByRole("link")
      .filter((a) => /^(tel|mailto):/.test(a.getAttribute("href") ?? ""));
    const hrefs = links.map((a) => a.getAttribute("href"));

    expect(hrefs).toEqual(
      expect.arrayContaining([
        "tel:+31742045100",
        "mailto:f.meijerman@vanheteren.com",
        "tel:+31887733773",
        "mailto:info@bluedelta.nl",
      ]),
    );
    // Numbers are shown exactly as written, only the href is normalised.
    expect(screen.getByText("+31 (0)74-2045100")).toBeInTheDocument();
    expect(screen.getByText("+31 (0) 88 - 7733773")).toBeInTheDocument();
  });

  it("gives the tap targets a comfortable height", () => {
    render(<SupportPage pageKey="contact" />);

    const tel = screen.getByRole("link", { name: "+31 (0)74-2045100" });
    expect(tel.className).toContain("min-h-[40px]");
  });

  it("no longer shows the draft text or a Concepttekst label", () => {
    render(<SupportPage pageKey="contact" />);

    expect(screen.queryByText(/Contactgegevens volgen/)).not.toBeInTheDocument();
    expect(screen.queryByText(/plaatsnummer en wat u ziet/)).not.toBeInTheDocument();
    expect(screen.queryByText("Concepttekst")).not.toBeInTheDocument();
  });
});

describe("privacy page (client text, verbatim)", () => {
  it("shows the title, the update line and all ten numbered sections", () => {
    render(<SupportPage pageKey="privacy" />);

    expect(
      screen.getByRole("heading", { level: 1, name: "Privacyverklaring" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Laatst bijgewerkt: 10-07-2026")).toBeInTheDocument();

    const headings = [
      "1. Verwerkingsverantwoordelijke",
      "2. Welke gegevens verwerken wij van u?",
      "3. Waarom verwerken wij deze gegevens?",
      "4. Grondslagen",
      "5. Wie heeft toegang tot uw gegevens?",
      "6. Bewaartermijnen",
      "7. Beveiliging",
      "8. Uw rechten",
      "9. Klacht indienen",
      "10. Wijzigingen",
    ];
    for (const heading of headings) {
      expect(screen.getByText(heading)).toBeInTheDocument();
    }
  });

  it("renders the lists of sections 2 to 8 as real bullet lists", () => {
    render(<SupportPage pageKey="privacy" />);

    const bulletCounts = [5, 5, 3, 3, 4, 4, 5];
    const lists = screen.getAllByRole("list");

    expect(lists).toHaveLength(bulletCounts.length);
    expect(lists.map((list) => within(list).getAllByRole("listitem").length)).toEqual(bulletCounts);
  });

  it("keeps the company details verbatim, including the placeholder", () => {
    render(<SupportPage pageKey="privacy" />);

    expect(screen.getByText("BlueDelta b.v.")).toBeInTheDocument();
    expect(screen.getByText("Industrieweg 26, 2254 AE, Voorschoten")).toBeInTheDocument();
    expect(screen.getByText("09117157")).toBeInTheDocument();
    expect(
      screen.getByText(/systeembeheerders van \[Naam onderneming\] hebben inzage/),
    ).toBeInTheDocument();
  });

  it("makes info@bluedelta.nl a mailto link wherever it appears", () => {
    render(<SupportPage pageKey="privacy" />);

    const mailto = screen
      .getAllByRole("link")
      .filter((a) => a.getAttribute("href") === "mailto:info@bluedelta.nl");

    // Section 1 (Contact) and section 8 (Verzoeken).
    expect(mailto).toHaveLength(2);
    for (const link of mailto) {
      expect(link.textContent).toBe("info@bluedelta.nl");
    }

    // The sentence in section 8 keeps its wording, only the address is a link.
    const sentence = [...document.querySelectorAll("p")].find((p) =>
      p.textContent?.startsWith("Verzoeken kunt u indienen via"),
    );
    expect(sentence?.textContent).toBe(
      "Verzoeken kunt u indienen via info@bluedelta.nl. Wij reageren binnen vier weken.",
    );
    expect(sentence?.querySelector("a")?.getAttribute("href")).toBe("mailto:info@bluedelta.nl");
  });

  it("keeps the sentences that come after a bullet list below it", () => {
    render(<SupportPage pageKey="privacy" />);

    const paragraphs = [...document.querySelectorAll("p")].map((p) => p.textContent ?? "");
    const closing5 = paragraphs.findIndex((t) => t.startsWith("Uw gegevens worden niet verkocht"));
    const lastBullet5 = paragraphs.findIndex((t) =>
      t.startsWith("Wettelijke autoriteiten: alleen indien"),
    );
    const closing8 = paragraphs.findIndex((t) => t.startsWith("Verzoeken kunt u indienen"));
    const lastBullet8 = paragraphs.findIndex((t) =>
      t.startsWith("Uw accountgegevens in gestructureerde vorm"),
    );

    expect(closing5).toBeGreaterThan(lastBullet5);
    expect(closing8).toBeGreaterThan(lastBullet8);
  });

  it("is readable body text and no longer marked as a draft", () => {
    render(<SupportPage pageKey="privacy" />);

    expect(screen.queryByText("Concepttekst")).not.toBeInTheDocument();

    const paragraph = screen.getByText(/Deze privacyverklaring is bestemd voor gebruikers/);
    expect(paragraph.className).toContain("text-[15px]");
    expect(paragraph.className).toContain("leading-relaxed");
  });
});

describe("bedrijf page", () => {
  it("shows the campsite's own company data from the settings", async () => {
    render(<SupportPage pageKey="bedrijf" />);

    await waitFor(() => expect(screen.getByText("Camping De Bron")).toBeInTheDocument());
    expect(screen.getByText("Bosweg 12")).toBeInTheDocument();
    expect(screen.getByText("1234 AB Utrecht")).toBeInTheDocument();
    expect(screen.getByText("030-1234567")).toBeInTheDocument();
    expect(screen.getByText("info@debron.nl")).toBeInTheDocument();
    expect(screen.getByText("NL123456789B01")).toBeInTheDocument();
  });

  it("hides fields the campsite has not filled in", async () => {
    getSettings.mockResolvedValue({
      id: 1,
      stroominstelling: [],
      vrijverbruikinstelling: [],
      sessionDurationDays: 30,
      eigenaar: { naam: "Camping De Bron", kvk: "12345678" },
    });
    render(<SupportPage pageKey="bedrijf" />);

    await waitFor(() => expect(screen.getByText("Camping De Bron")).toBeInTheDocument());
    expect(screen.getByText("12345678")).toBeInTheDocument();
    for (const label of ["Telefoon", "E-mailadres", "Website", "Adres"]) {
      expect(screen.queryByText(label)).not.toBeInTheDocument();
    }
  });
});

describe("privacy and terms pages", () => {
  it("shows only the neutral line on the terms page, without a draft label", () => {
    render(<SupportPage pageKey="voorwaarden" />);

    expect(
      screen.getByRole("heading", { level: 1, name: "Gebruiksvoorwaarden" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText("De gebruiksvoorwaarden worden binnenkort toegevoegd."),
    ).toBeInTheDocument();
    expect(screen.queryByText("Concepttekst")).not.toBeInTheDocument();
    // No draft legal text of our own is left behind.
    expect(screen.queryByText(/wachttijd/)).not.toBeInTheDocument();
    expect(screen.queryByText(/verantwoordelijk/)).not.toBeInTheDocument();
    expect(screen.queryByText(/op afstand worden bestuurd/)).not.toBeInTheDocument();
  });

  it("keeps the title and the back button on the terms page", () => {
    render(<SupportPage pageKey="voorwaarden" />);

    expect(screen.getByRole("link", { name: /terug naar over ons/i })).toHaveAttribute(
      "href",
      "/about",
    );
  });

  it("marks both texts as pending in the content file", () => {
    expect(supportPages.voorwaarden.pending).toBe(
      "De gebruiksvoorwaarden worden binnenkort toegevoegd.",
    );
    expect(supportPages.bedrijf.pending).toBe("De bedrijfsgegevens worden binnenkort toegevoegd.");
    expect(supportPages.voorwaarden.sections).toEqual([]);
    expect(supportPages.bedrijf.sections).toEqual([]);
  });
});

describe("bedrijf page without company data", () => {
  it("shows the neutral line instead of our own text", async () => {
    getSettings.mockResolvedValue({
      id: 1,
      stroominstelling: [],
      vrijverbruikinstelling: [],
      sessionDurationDays: 30,
      eigenaar: {},
    });
    render(<SupportPage pageKey="bedrijf" />);

    await waitFor(() =>
      expect(
        screen.getByText("De bedrijfsgegevens worden binnenkort toegevoegd."),
      ).toBeInTheDocument(),
    );
    expect(screen.queryByText(/rechtstreeks uit het beheersysteem/)).not.toBeInTheDocument();
    expect(screen.queryByText(/\[Placeholder\]/)).not.toBeInTheDocument();
    expect(screen.queryByText("Concepttekst")).not.toBeInTheDocument();
  });
});

describe("support pages", () => {
  it("covers every link on the about page", () => {
    expect(about.links.map((link) => link.key)).toEqual(KEYS);
    expect(Object.keys(supportPages).sort()).toEqual([...KEYS].sort());
  });

  it("gives every page its own tab title", () => {
    const titles = KEYS.map((key) => supportPages[key].tabTitle);

    expect(new Set(titles).size).toBe(titles.length);
  });
});
