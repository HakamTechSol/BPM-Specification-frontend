import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";

const getAllPitches = vi.fn();
const getSettings = vi.fn();
const getGuestPitchStatus = vi.fn();

vi.mock("@/lib/api", () => ({
  getAllPitches: () => getAllPitches(),
  getSettings: () => getSettings(),
  getGuestPitchStatus: (pitchId: number) => getGuestPitchStatus(pitchId),
  resolveHash: vi.fn(),
  resetPitchError: vi.fn(),
  triggerSync: vi.fn(),
}));

vi.mock("@tanstack/react-router", () => ({
  createFileRoute: () => (config: Record<string, unknown>) => ({
    ...config,
    useParams: () => ({ id: "85" }),
  }),
  Link: ({ children, to, ...rest }: { children: React.ReactNode; to?: string }) => (
    <a href={to ?? "/"} {...rest}>
      {children}
    </a>
  ),
  useRouterState: () => "/pitch/85",
  useRouter: () => ({ navigate: vi.fn() }),
}));

import { Route as AdminRoute } from "./pitch.$id";
import { Route as GuestRoute } from "./guest.$id";
import type { GuestPitchStatus, PitchSummary } from "@/lib/api";

const RESERVATION = {
  checkIn: "2026-07-01T14:00:00.000Z",
  reserveringNummer: "R-2026-1",
  usageLimit: 40,
  eStart: 25.5,
};

/** #FREEUSAGEDB the worked example the backend produces for pitch 77. */
const FREE_USAGE_RESERVATION = {
  ...RESERVATION,
  eStart: 2759.97,
  freeDays: 3,
  freeUsagePerDay: 4,
  freeUsageTotal: 12,
  difference: 26.54,
};

/** The same pitch, shaped the way each API returns it. */
function adminPitch(overrides: Partial<PitchSummary> = {}): PitchSummary {
  return {
    pitchId: 85,
    pitchName: "85",
    veldNaam: "Veld A",
    stat: 1,
    gewenst: 1,
    kwhnu: 0,
    kwhtot: 100.25,
    iverb: 1234,
    maxAmperage: 10,
    freeUsage: 0,
    errorcode: 0,
    guestName: null,
    afstandbesturing: 0,
    reservation: RESERVATION,
    ...overrides,
  };
}

function guestPitch(overrides: Partial<GuestPitchStatus> = {}): GuestPitchStatus {
  return {
    pitchId: 85,
    pitchName: "85",
    veldNaam: "Veld A",
    stat: 1,
    gewenst: 1,
    kwhnu: 0,
    kwhtot: 100.25,
    iverb: 1234,
    maxAmperage: 10,
    errorcode: 0,
    reservation: RESERVATION,
    ...overrides,
  };
}

function componentOf(route: unknown): React.ComponentType {
  return (route as { component: React.ComponentType }).component;
}

const Admin = () => {
  const Component = componentOf(AdminRoute);
  return <Component />;
};

const Guest = () => {
  const Component = componentOf(GuestRoute);
  return <Component />;
};

/** Mount a page, wait for the shared info block and return its markup + text. */
async function infoBlock(Component: React.ComponentType) {
  const { unmount } = render(<Component />);
  await waitFor(() => expect(screen.getByTestId("pitch-info")).toBeInTheDocument());
  const block = screen.getByTestId("pitch-info");
  const result = { html: block.innerHTML, text: block.textContent ?? "", block };
  unmount();
  return result;
}

/**
 * The value box of every usage-table row: the number plus its unit. Boxes that
 * only mention a unit in their caption ("(3 dagen × 4.00 kWh)") are skipped by
 * requiring the nested unit span.
 */
function usageValues(block: HTMLElement): HTMLElement[] {
  return Array.from(block.querySelectorAll<HTMLElement>("span.whitespace-nowrap")).filter(
    (el) => el.textContent?.includes("kWh") && el.querySelector("span") !== null,
  );
}

beforeEach(() => {
  getAllPitches.mockResolvedValue({ pitches: [adminPitch()] });
  getSettings.mockResolvedValue({
    id: 1,
    stroominstelling: ["6", "8", "10", "12", "16"],
    vrijverbruikinstelling: ["0", "1", "2", "4", "8"],
    sessionDurationDays: 1,
    eigenaar: {},
  });
  getGuestPitchStatus.mockResolvedValue(guestPitch());
});

describe("shared pitch info block", () => {
  it("renders identical markup on the manager and the guest page for the same pitch", async () => {
    const admin = await infoBlock(Admin);
    const guest = await infoBlock(Guest);

    expect(admin.html).toBe(guest.html);
  });

  it("shows the same scaled current, max current and usage figures on both pages", async () => {
    const admin = await infoBlock(Admin);
    const guest = await infoBlock(Guest);

    for (const block of [admin.text, guest.text]) {
      expect(block).toContain("Aan");
      // iverb arrives in centi-ampere and is always rendered as /100.
      expect(block).toContain("Huidige Stroom12.3 A");
      expect(block).toContain("Max Stroom10 A");
      expect(block).toContain("Verbruik");
      expect(block).toMatch(/Meterstand totaal\s*100\.25\s*kWh/);
      expect(block).toMatch(/Meterstand bij start.*25\.50\s*kWh/s);
      expect(block).toMatch(/Verbruikt\s*74\.75\s*kWh/);
    }
  });

  it("renders identical markup for a powered-off pitch without a reservation", async () => {
    getAllPitches.mockResolvedValue({
      pitches: [adminPitch({ gewenst: 0, iverb: -1, reservation: null })],
    });
    getGuestPitchStatus.mockResolvedValue(guestPitch({ gewenst: 0, iverb: -1, reservation: null }));

    const admin = await infoBlock(Admin);
    const guest = await infoBlock(Guest);

    expect(admin.html).toBe(guest.html);
    expect(admin.text).toContain("Uit");
  });
});

describe("usage table rows never split the value from its unit", () => {
  /** Big meter readings: the width where the old rows broke "kWh" onto its own line. */
  const bigPitches = () => {
    const reservation = { ...RESERVATION, eStart: 2759.97 };
    return {
      admin: adminPitch({ kwhtot: 12345.67, reservation }),
      guest: guestPitch({ kwhtot: 12345.67, reservation }),
    };
  };

  it.each([
    ["manager page", Admin],
    ["guest page", Guest],
  ])("keeps number and unit in one unshrinkable box on the %s", async (_name, Page) => {
    const big = bigPitches();
    getAllPitches.mockResolvedValue({ pitches: [big.admin] });
    getGuestPitchStatus.mockResolvedValue(big.guest);

    const { block } = await infoBlock(Page);
    const values = usageValues(block);

    expect(values.map((el) => el.textContent)).toEqual(["12345.67kWh", "2759.97kWh", "9585.70kWh"]);

    for (const value of values) {
      // Nothing in the box may break, and the box itself may not be squeezed.
      expect(value.className).toContain("whitespace-nowrap");
      expect(value.className).toContain("shrink-0");
      // The unit lives inside the same box as the number, not beside it.
      expect(value.querySelector("span")?.textContent).toBe("kWh");

      // The row must not wrap: the value stays on the label's line and the
      // label side is the one that yields.
      const row = value.parentElement as HTMLElement;
      expect(row.className).not.toContain("flex-wrap");
      expect(row.className).toContain("items-baseline");
      const label = value.previousElementSibling as HTMLElement;
      expect(label.className).toContain("min-w-0");
    }
  });

  it("keeps the check-in date whole so it drops under the label", async () => {
    const big = bigPitches();
    getAllPitches.mockResolvedValue({ pitches: [big.admin] });
    getGuestPitchStatus.mockResolvedValue(big.guest);

    const { block } = await infoBlock(Admin);
    const date = Array.from(block.querySelectorAll<HTMLElement>("span.whitespace-nowrap")).find(
      (el) => !el.textContent?.includes("kWh"),
    );

    expect(date?.textContent).toBe("1 jul 2026, 19:00");
    expect(date?.className).toContain("whitespace-nowrap");
  });

  it("stays identical on both pages with the large values", async () => {
    const big = bigPitches();
    getAllPitches.mockResolvedValue({ pitches: [big.admin] });
    getGuestPitchStatus.mockResolvedValue(big.guest);

    const admin = await infoBlock(Admin);
    const guest = await infoBlock(Guest);

    expect(admin.html).toBe(guest.html);
  });
});

describe("free-usage rows (legacy dispVerbruik.php)", () => {
  /** Backend figures for one pitch: 3 days × 4 kWh free out of 38.54 kWh used. */
  function withFreeUsage(reservation: Record<string, unknown> = FREE_USAGE_RESERVATION) {
    const used = Number(FREE_USAGE_RESERVATION.eStart) + 38.54;
    getAllPitches.mockResolvedValue({
      pitches: [adminPitch({ kwhtot: used, reservation: reservation as never })],
    });
    getGuestPitchStatus.mockResolvedValue(
      guestPitch({ kwhtot: used, reservation: reservation as never }),
    );
  }

  /** Row labels in render order, so the table order can be asserted. */
  async function rowLabels(block: HTMLElement): Promise<string[]> {
    return Array.from(block.querySelectorAll<HTMLElement>(".min-w-0")).map(
      (label) => label.firstChild?.textContent ?? "",
    );
  }

  it.each([
    ["manager page", Admin],
    ["guest page", Guest],
  ])("adds Vrij verbruik and Verschil after Verbruikt on the %s", async (_name, Page) => {
    withFreeUsage();

    const { block, text } = await infoBlock(Page);

    expect(await rowLabels(block)).toEqual([
      "Meterstand totaal",
      "Meterstand bij start",
      "Verbruikt",
      "Vrij verbruik",
      "Verschil",
    ]);
    // The worked example: 38.54 used, 12.00 free, 26.54 to invoice.
    expect(text).toMatch(/Verbruikt\s*38\.54\s*kWh/);
    expect(text).toMatch(/Vrij verbruik\s*\(3 dagen × 4\.00 kWh\)\s*12\.00\s*kWh/);
    expect(text).toMatch(/Verschil\s*26\.54\s*kWh/);
  });

  it.each([
    ["manager page", Admin],
    ["guest page", Guest],
  ])("keeps the free-usage values unbreakable on the %s", async (_name, Page) => {
    withFreeUsage();

    const { block } = await infoBlock(Page);
    const values = usageValues(block);

    expect(values.map((el) => el.textContent)).toEqual([
      "2798.51kWh",
      "2759.97kWh",
      "38.54kWh",
      "12.00kWh",
      "26.54kWh",
    ]);
    for (const value of values) {
      expect(value.className).toContain("whitespace-nowrap");
      expect(value.className).toContain("shrink-0");
      // Same line as the label, on both the manager and the guest screen.
      expect((value.parentElement as HTMLElement).className).not.toContain("flex-wrap");
    }

    // The "(3 dagen × 4.00 kWh)" explanation sits under the label, on its own
    // line, so the label side yields instead of the value.
    const caption = Array.from(block.querySelectorAll<HTMLElement>("span.block")).find((el) =>
      el.textContent?.startsWith("("),
    );
    expect(caption?.textContent).toBe("(3 dagen × 4.00 kWh)");
    expect(caption?.previousSibling?.textContent).toBe("Vrij verbruik");
  });

  it("uses the singular 'dag' for a one-day stay", async () => {
    withFreeUsage({ ...FREE_USAGE_RESERVATION, freeDays: 1 });

    const { text } = await infoBlock(Guest);

    expect(text).toContain("(1 dag × 4.00 kWh)");
    expect(text).not.toContain("dagen");
  });

  it("raises a zero day count to one, so the caption is never '(0 dagen …)'", async () => {
    withFreeUsage({
      ...FREE_USAGE_RESERVATION,
      freeDays: 0,
      freeUsageTotal: 4,
      freeUsagePerDay: 4,
    });

    const { text } = await infoBlock(Admin);

    expect(text).toContain("(1 dag × 4.00 kWh)");
    expect(text).not.toContain("0 dagen");
  });

  it("shows no extra rows when the allowance is zero", async () => {
    withFreeUsage({
      ...FREE_USAGE_RESERVATION,
      freeDays: 3,
      freeUsagePerDay: 0,
      freeUsageTotal: 0,
      difference: 38.54,
    });

    const { block, text } = await infoBlock(Guest);

    expect(await rowLabels(block)).toEqual([
      "Meterstand totaal",
      "Meterstand bij start",
      "Verbruikt",
    ]);
    expect(text).not.toContain("Vrij verbruik");
    expect(text).not.toContain("Verschil");
  });

  it("shows no extra rows for a backend that does not send free usage yet", async () => {
    withFreeUsage({ ...RESERVATION });

    const { block, text } = await infoBlock(Admin);

    expect(await rowLabels(block)).toEqual([
      "Meterstand totaal",
      "Meterstand bij start",
      "Verbruikt",
    ]);
    expect(text).not.toContain("Vrij verbruik");
  });

  it("renders identical free-usage rows on both pages", async () => {
    withFreeUsage();

    const admin = await infoBlock(Admin);
    const guest = await infoBlock(Guest);

    expect(admin.html).toBe(guest.html);
  });
});
