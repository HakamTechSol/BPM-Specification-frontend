import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const triggerSync = vi.fn();
const getAllPitches = vi.fn();
const getSettings = vi.fn();

vi.mock("@/lib/api", () => ({
  getAllPitches: () => getAllPitches(),
  getSettings: () => getSettings(),
  triggerSync: (payload: unknown) => triggerSync(payload),
}));

vi.mock("@tanstack/react-router", () => ({
  // createFileRoute(path) is called and the result is then invoked with the
  // route config, so the mock must be a factory returning a function.
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

import { Route } from "./pitch.$id";
import type { PitchSummary } from "@/lib/api";

/** Build a pitch record; the defaults are the "saved" baseline for every test. */
function pitch(overrides: Partial<PitchSummary> = {}): PitchSummary {
  return {
    pitchId: 85,
    pitchName: "85",
    veldNaam: "Veld A",
    stat: 1,
    gewenst: 1,
    kwhnu: 0,
    kwhtot: 100,
    iverb: 1200,
    maxAmperage: 10,
    freeUsage: 0,
    errorcode: 0,
    guestName: null,
    afstandbesturing: 0,
    reservation: null,
    ...overrides,
  };
}

function mount() {
  // The route module exports the generated route object; its component is the
  // page under test.
  const Component = (Route as unknown as { component: React.ComponentType }).component;
  return render(<Component />);
}

const opslaan = () => screen.getByRole("button", { name: /opslaan/i });
const annuleren = () => screen.getByRole("button", { name: /annuleren/i });

/** The amperage chip is the button whose accessible name is e.g. "8 Amp". */
function ampChip(a: number) {
  return screen.getByRole("button", { name: new RegExp(`^${a}\\s*Amp$`, "i") });
}
/** The free-usage chip is the button whose accessible name is e.g. "4 kWh". */
function freeChip(f: number) {
  return screen.getByRole("button", { name: new RegExp(`^${f}\\s*kWh$`, "i") });
}
const afstandChip = (label: string) => screen.getByRole("button", { name: label });

function isSelected(el: HTMLElement) {
  return el.className.includes("bg-primary");
}

beforeEach(() => {
  getAllPitches.mockResolvedValue({ pitches: [pitch()] });
  getSettings.mockResolvedValue({
    id: 1,
    stroominstelling: ["6", "8", "10", "12", "16"],
    vrijverbruikinstelling: ["0", "1", "2", "4", "8"],
    sessionDurationDays: 1,
    eigenaar: {},
  });
  triggerSync.mockResolvedValue({ success: true, pitchId: 85, action: "ok" });
});

async function ready() {
  await waitFor(() => expect(ampChip(10)).toBeInTheDocument());
}

/** Confirm the afstand change in its dialog, which is how the UI commits it. */
async function chooseAfstand(user: ReturnType<typeof userEvent.setup>, label: string) {
  await user.click(afstandChip(label));
  const dialog = await screen.findByRole("alertdialog");
  await user.click(within(dialog).getByRole("button", { name: /bevestigen/i }));
}

describe("pitch detail — document title", () => {
  it("names the page 'Plaats', not 'Pitch'", () => {
    const head = (
      Route as unknown as {
        head: (ctx: { params: { id: string } }) => { meta: { title?: string }[] };
      }
    ).head;

    const meta = head({ params: { id: "77" } }).meta;

    expect(meta[0].title).toBe("Plaats 77 · BluePlug");
    expect(meta.map((m) => m.title ?? m)).not.toContain("Pitch 77 · BluePlug");
  });
});

describe("pitch detail — initial state", () => {
  it("starts with Opslaan and Annuleren disabled and the saved values shown", async () => {
    mount();
    await ready();

    expect(opslaan()).toBeDisabled();
    expect(annuleren()).toBeDisabled();
    expect(isSelected(ampChip(10))).toBe(true);
    expect(isSelected(freeChip(0))).toBe(true);
    expect(isSelected(afstandChip("Lokaal"))).toBe(true);
    expect(triggerSync).not.toHaveBeenCalled();
  });
});

describe("pitch detail — Maximale stroom draft + cancel", () => {
  it("reverts 10A to 10A and disables Opslaan after selecting 8A then cancelling", async () => {
    const user = userEvent.setup();
    mount();
    await ready();

    // Select 8A while 10A is the saved value.
    await user.click(ampChip(8));

    // Draft only: the chip moves, Opslaan enables, and nothing is sent yet.
    expect(isSelected(ampChip(8))).toBe(true);
    expect(isSelected(ampChip(10))).toBe(false);
    expect(opslaan()).toBeEnabled();
    expect(annuleren()).toBeEnabled();
    expect(triggerSync).not.toHaveBeenCalled();

    // Cancel discards the draft.
    await user.click(annuleren());

    expect(isSelected(ampChip(10))).toBe(true);
    expect(isSelected(ampChip(8))).toBe(false);
    expect(opslaan()).toBeDisabled();
    expect(annuleren()).toBeDisabled();
    expect(triggerSync).not.toHaveBeenCalled();
  });
});

describe("pitch detail — Gratis verbruik draft + cancel", () => {
  it("reverts to the saved kWh and disables Opslaan after selecting 4 kWh then cancelling", async () => {
    const user = userEvent.setup();
    mount();
    await ready();

    await user.click(freeChip(4));
    expect(isSelected(freeChip(4))).toBe(true);
    expect(opslaan()).toBeEnabled();
    expect(triggerSync).not.toHaveBeenCalled();

    await user.click(annuleren());

    expect(isSelected(freeChip(0))).toBe(true);
    expect(isSelected(freeChip(4))).toBe(false);
    expect(opslaan()).toBeDisabled();
    expect(annuleren()).toBeDisabled();
    expect(triggerSync).not.toHaveBeenCalled();
  });
});

describe("pitch detail — Afstandbesturing is persisted on confirm", () => {
  it("stores the choice immediately and leaves Opslaan grey", async () => {
    const user = userEvent.setup();
    mount();
    await ready();

    await chooseAfstand(user, "Afstand");

    // Persisted right away: no second click on Opslaan needed.
    await waitFor(() =>
      expect(triggerSync).toHaveBeenCalledWith({
        pitchId: 85,
        action: "set_afstandbesturing",
        value: 1,
      }),
    );
    expect(triggerSync).toHaveBeenCalledTimes(1);
    expect(isSelected(afstandChip("Afstand"))).toBe(true);
    expect(opslaan()).toBeDisabled();
    expect(annuleren()).toBeDisabled();
  });

  it("stores 'Afstand aan' and locks the local controls", async () => {
    const user = userEvent.setup();
    mount();
    await ready();

    expect(ampChip(8)).toBeEnabled();

    await chooseAfstand(user, "Afstand aan");

    await waitFor(() =>
      expect(triggerSync).toHaveBeenCalledWith({
        pitchId: 85,
        action: "set_afstandbesturing",
        value: 3,
      }),
    );
    expect(isSelected(afstandChip("Afstand aan"))).toBe(true);
    expect(ampChip(8)).toBeDisabled();
    expect(freeChip(4)).toBeDisabled();
  });

  it("releases remote control immediately when switching back to Lokaal", async () => {
    const user = userEvent.setup();
    getAllPitches.mockResolvedValue({ pitches: [pitch({ afstandbesturing: 1 })] });
    mount();
    await ready();

    expect(isSelected(afstandChip("Afstand"))).toBe(true);
    expect(ampChip(8)).toBeDisabled();

    await chooseAfstand(user, "Lokaal");

    await waitFor(() =>
      expect(triggerSync).toHaveBeenCalledWith({
        pitchId: 85,
        action: "set_afstandbesturing",
        value: 0,
      }),
    );
    expect(triggerSync).toHaveBeenCalledTimes(1);
    expect(isSelected(afstandChip("Lokaal"))).toBe(true);
    expect(ampChip(8)).toBeEnabled();
    expect(opslaan()).toBeDisabled();
  });

  it("sends nothing when the dialog is cancelled", async () => {
    const user = userEvent.setup();
    mount();
    await ready();

    await user.click(afstandChip("Afstand"));
    const dialog = await screen.findByRole("alertdialog");
    await user.click(within(dialog).getByRole("button", { name: /annuleren/i }));

    await waitFor(() => expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument());

    expect(triggerSync).not.toHaveBeenCalled();
    expect(isSelected(afstandChip("Lokaal"))).toBe(true);
    expect(isSelected(afstandChip("Afstand"))).toBe(false);
    expect(opslaan()).toBeDisabled();
  });

  it("flushes pending local edits before entering remote mode", async () => {
    const user = userEvent.setup();
    mount();
    await ready();

    // A local edit that the backend would reject once remote control is on.
    await user.click(ampChip(8));
    await chooseAfstand(user, "Afstand");

    await waitFor(() => expect(triggerSync).toHaveBeenCalledTimes(2));
    expect(triggerSync).toHaveBeenNthCalledWith(1, {
      pitchId: 85,
      action: "set_amperage",
      value: 8,
    });
    expect(triggerSync).toHaveBeenNthCalledWith(2, {
      pitchId: 85,
      action: "set_afstandbesturing",
      value: 1,
    });
    // Both are stored, so nothing is left pending.
    await waitFor(() => expect(opslaan()).toBeDisabled());
    expect(annuleren()).toBeDisabled();
  });

  it("still shows the stored mode after a reload", async () => {
    const user = userEvent.setup();
    const first = mount();
    await ready();

    await chooseAfstand(user, "Afstand");
    await waitFor(() => expect(triggerSync).toHaveBeenCalledTimes(1));
    first.unmount();

    // A reload re-seeds from the API, which now reports the stored value.
    getAllPitches.mockResolvedValue({ pitches: [pitch({ afstandbesturing: 1 })] });
    const second = mount();
    await ready();

    expect(isSelected(afstandChip("Afstand"))).toBe(true);
    expect(isSelected(afstandChip("Lokaal"))).toBe(false);
    expect(ampChip(8)).toBeDisabled();
    expect(opslaan()).toBeDisabled();

    // …and back to Lokaal, which is stored just as durably.
    await chooseAfstand(user, "Lokaal");
    await waitFor(() => expect(triggerSync).toHaveBeenCalledTimes(2));
    second.unmount();

    getAllPitches.mockResolvedValue({ pitches: [pitch({ afstandbesturing: 0 })] });
    mount();
    await ready();

    expect(isSelected(afstandChip("Lokaal"))).toBe(true);
    expect(ampChip(8)).toBeEnabled();
  });

  it("rolls the selection back and reports the error when the call fails", async () => {
    const user = userEvent.setup();
    triggerSync.mockRejectedValueOnce(new Error("backend down"));
    mount();
    await ready();

    await chooseAfstand(user, "Afstand");

    await waitFor(() => expect(screen.getByRole("alert")).toHaveTextContent(/backend down/i));
    expect(isSelected(afstandChip("Lokaal"))).toBe(true);
    expect(isSelected(afstandChip("Afstand"))).toBe(false);
    // The failed choice is not left behind as a pending change.
    expect(opslaan()).toBeDisabled();
  });
});

describe("pitch detail — cancel reverts every control at once", () => {
  it("discards a multi-field draft in one click", async () => {
    const user = userEvent.setup();
    mount();
    await ready();

    await user.click(ampChip(8));
    await user.click(freeChip(2));
    await user.click(screen.getByRole("switch"));

    expect(opslaan()).toBeEnabled();

    await user.click(annuleren());

    expect(isSelected(ampChip(10))).toBe(true);
    expect(isSelected(freeChip(0))).toBe(true);
    expect(isSelected(afstandChip("Lokaal"))).toBe(true);
    expect(screen.getByRole("switch")).toHaveAttribute("data-state", "checked");
    expect(opslaan()).toBeDisabled();
    expect(triggerSync).not.toHaveBeenCalled();
  });
});

describe("pitch detail — Opslaan sends only what changed", () => {
  it("sends a single set_amperage call and re-disables Opslaan afterwards", async () => {
    const user = userEvent.setup();
    mount();
    await ready();

    await user.click(ampChip(8));
    await user.click(opslaan());

    const dialog = await screen.findByRole("alertdialog");
    await user.click(within(dialog).getByRole("button", { name: /^opslaan$/i }));

    await waitFor(() => expect(triggerSync).toHaveBeenCalledTimes(1));
    expect(triggerSync).toHaveBeenCalledWith({
      pitchId: 85,
      action: "set_amperage",
      value: 8,
    });

    await waitFor(() => expect(opslaan()).toBeDisabled());
    expect(annuleren()).toBeDisabled();
    // The committed value is now the saved one.
    expect(isSelected(ampChip(8))).toBe(true);
  });

  it("sends nothing when Opslaan is clicked with no pending change", async () => {
    const user = userEvent.setup();
    mount();
    await ready();

    expect(opslaan()).toBeDisabled();
    await user.click(opslaan());
    expect(triggerSync).not.toHaveBeenCalled();
  });

  it("sends each changed field exactly once and nothing for untouched fields", async () => {
    const user = userEvent.setup();
    mount();
    await ready();

    await user.click(ampChip(16));
    await user.click(freeChip(4));
    await user.click(opslaan());

    const dialog = await screen.findByRole("alertdialog");
    await user.click(within(dialog).getByRole("button", { name: /^opslaan$/i }));

    await waitFor(() => expect(triggerSync).toHaveBeenCalledTimes(2));
    expect(triggerSync).toHaveBeenNthCalledWith(1, {
      pitchId: 85,
      action: "set_amperage",
      value: 16,
    });
    expect(triggerSync).toHaveBeenNthCalledWith(2, {
      pitchId: 85,
      action: "set_free_usage",
      value: 4,
    });
    await waitFor(() => expect(opslaan()).toBeDisabled());
  });

  it("keeps the draft and leaves Opslaan enabled when the save fails", async () => {
    const user = userEvent.setup();
    triggerSync.mockRejectedValueOnce(new Error("boom"));
    mount();
    await ready();

    await user.click(ampChip(8));
    await user.click(opslaan());
    const dialog = await screen.findByRole("alertdialog");
    await user.click(within(dialog).getByRole("button", { name: /^opslaan$/i }));

    await waitFor(() => expect(screen.getByRole("button", { name: /opslaan/i })).toBeEnabled());
    // Draft survives the failure so the manager can retry or cancel.
    expect(isSelected(ampChip(8))).toBe(true);
  });
});
