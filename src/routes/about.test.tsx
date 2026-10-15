import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";

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
  it("explains how to reach support without inventing contact details", () => {
    render(<SupportPage pageKey="contact" />);

    expect(screen.getByText(/Neem contact op met de camping/i)).toBeInTheDocument();
    expect(screen.getByText(/Contactgegevens volgen/)).toBeInTheDocument();
    // No phone numbers, e-mail addresses or response-time promises.
    const text = document.body.textContent ?? "";
    expect(text).not.toMatch(/\+31/);
    expect(text).not.toMatch(/@/);
    expect(text).not.toMatch(/binnen \d+ (uur|minuten)/i);
    expect(text).not.toMatch(/Reactie binnen/);
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

  it("says so when there is no company data at all", async () => {
    getSettings.mockResolvedValue({
      id: 1,
      stroominstelling: [],
      vrijverbruikinstelling: [],
      sessionDurationDays: 30,
      eigenaar: {},
    });
    render(<SupportPage pageKey="bedrijf" />);

    await waitFor(() =>
      expect(screen.getByText(supportPages.bedrijf.emptyNote as string)).toBeInTheDocument(),
    );
  });
});

describe("privacy and terms pages", () => {
  it("fill in the configured session duration instead of a guess", async () => {
    render(<SupportPage pageKey="privacy" />);

    await waitFor(() => expect(screen.getByText(/sessieduur van 14 dagen/)).toBeInTheDocument());
    expect(screen.queryByText(/\{dagen\}/)).not.toBeInTheDocument();
  });

  it.each(["privacy", "voorwaarden"] as const)("marks the %s page as a draft", (key) => {
    render(<SupportPage pageKey={key} />);

    expect(screen.getByText("Concepttekst")).toBeInTheDocument();
  });

  it("covers the topics the campsite has to agree on", () => {
    const all = (key: SupportPageKey) =>
      [supportPages[key].intro ?? "", ...supportPages[key].sections.flatMap((s) => s.paragraphs)]
        .join(" ")
        .toLowerCase();
    const privacy = all("privacy");
    const terms = all("voorwaarden");

    expect(privacy).toMatch(/zonder cookies/);
    expect(privacy).toMatch(/geen account nodig/);
    expect(privacy).toMatch(/geen gegevens verkocht/);
    expect(privacy).toMatch(/reserveringsnummer/);
    expect(terms).toMatch(/wachttijd/);
    expect(terms).toMatch(/afstand/);
    expect(terms).toMatch(/verantwoordelijk/);
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
