import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const getSettings = vi.fn();
const updateSettings = vi.fn();
const getOvercurrent = vi.fn();
const updateOvercurrent = vi.fn();

vi.mock("@/lib/api", () => ({
  getSettings: () => getSettings(),
  updateSettings: (payload: unknown) => updateSettings(payload),
  getOvercurrent: () => getOvercurrent(),
  updateOvercurrent: (payload: unknown) => updateOvercurrent(payload),
}));

vi.mock("@tanstack/react-router", () => ({
  createFileRoute: () => (config: Record<string, unknown>) => ({
    ...config,
    useParams: () => ({}),
  }),
  Link: ({ children, to, ...rest }: { children: React.ReactNode; to?: string }) => (
    <a href={to ?? "/"} {...rest}>
      {children}
    </a>
  ),
  useRouterState: () => "/settings",
  useRouter: () => ({ navigate: vi.fn() }),
}));

import { Route } from "./settings";

function mount() {
  const Component = (Route as unknown as { component: React.ComponentType }).component;
  return render(<Component />);
}

/** Both action bars render a Save and a Cancel; scope queries to the lg bar. */
const saveButtons = () => screen.getAllByRole("button", { name: /opslaan/i });
const cancelButtons = () => screen.getAllByRole("button", { name: /annuleren/i });
/** The desktop bar (last in the DOM) is the one that carries the text labels. */
const opslaan = () => saveButtons()[saveButtons().length - 1];
const annuleren = () => cancelButtons()[cancelButtons().length - 1];

const stroomInput = (i: number) => screen.getByRole("spinbutton", { name: `Stroomwaarde ${i}` });
const vrijInput = (i: number) => screen.getByRole("spinbutton", { name: `Verbruikswaarde ${i}` });
const newStroom = () => screen.getByRole("spinbutton", { name: "Nieuwe stroomwaarde" });
const newVrij = () => screen.getByRole("spinbutton", { name: "Nieuwe verbruikswaarde" });

/**
 * Both lists render a button labelled "Toevoegen", so resolve it through the
 * row that holds the matching "new value" input.
 */
function addButtonFor(newInputLabel: string) {
  const row = screen.getByRole("spinbutton", { name: newInputLabel }).parentElement;
  if (!row) throw new Error(`no row found for ${newInputLabel}`);
  return within(row as HTMLElement).getByRole("button", { name: /toevoegen/i });
}
const addStroom = () => addButtonFor("Nieuwe stroomwaarde");
const addVrij = () => addButtonFor("Nieuwe verbruikswaarde");
const removeStroom = (value: string) =>
  screen.getByRole("button", { name: `Verwijder Stroomwaarde ${value} A` });
const removeVrij = (value: string) =>
  screen.getByRole("button", { name: `Verwijder Verbruikswaarde ${value} kWh` });

/** Every value currently rendered for a list, in row order. */
function listValues(label: string): string[] {
  return screen
    .queryAllByRole("spinbutton", { name: new RegExp(`^${label} \\d+$`) })
    .map((el) => (el as HTMLInputElement).value);
}
const stroomValues = () => listValues("Stroomwaarde");
const vrijValues = () => listValues("Verbruikswaarde");

beforeEach(() => {
  getSettings.mockResolvedValue({
    id: 1,
    stroominstelling: ["6", "8", "10"],
    vrijverbruikinstelling: ["0", "2", "4"],
    sessionDurationDays: 30,
    eigenaar: { naam: "BluePlug", "btw-nummer": "NL123456789B01" },
  });
  updateSettings.mockResolvedValue({ success: true });
  getOvercurrent.mockResolvedValue({
    available: true,
    seconds: 90,
    amps: 1.5,
    notify: true,
    disablePitch: true,
  });
  updateOvercurrent.mockImplementation(async (payload: Record<string, unknown>) => ({
    success: true,
    available: true,
    seconds: 90,
    amps: 1.5,
    notify: true,
    disablePitch: true,
    ...payload,
  }));
});

const secondsInput = () => screen.getByRole("textbox", { name: "Actie ondernemen na (seconden)" });
const ampsInput = () => screen.getByRole("textbox", { name: "Actie ondernemen boven (ampère)" });
const notifySwitch = () => screen.getByRole("switch", { name: "Melding weergeven" });
const disablePitchSwitch = () => screen.getByRole("switch", { name: "Staanplaats uitschakelen" });

async function ready() {
  await waitFor(() => expect(stroomInput(1)).toBeInTheDocument());
}

describe("Instellingen — initial state", () => {
  it("shows the persisted values with Save and Cancel disabled", async () => {
    mount();
    await ready();

    expect(stroomValues()).toEqual(["6", "8", "10"]);
    expect(opslaan()).toBeDisabled();
    expect(annuleren()).toBeDisabled();
    expect(updateSettings).not.toHaveBeenCalled();
  });

  it("keeps every Save/Cancel control disabled, in both bars", async () => {
    mount();
    await ready();

    saveButtons().forEach((b) => expect(b).toBeDisabled());
    cancelButtons().forEach((b) => expect(b).toBeDisabled());
  });
});

describe("Instellingen — Stroom: add then Cancel", () => {
  it("removes the added 14A and disables Save again", async () => {
    const user = userEvent.setup();
    mount();
    await ready();

    // Add 14A.
    await user.clear(newStroom());
    await user.type(newStroom(), "14");
    await user.click(addStroom());

    expect(stroomValues()).toEqual(["6", "8", "10", "14"]);
    expect(opslaan()).toBeEnabled();
    expect(annuleren()).toBeEnabled();
    // Draft only: nothing was persisted.
    expect(updateSettings).not.toHaveBeenCalled();

    // Cancel.
    await user.click(annuleren());

    expect(stroomValues()).toEqual(["6", "8", "10"]);
    expect(screen.queryByDisplayValue("14")).not.toBeInTheDocument();
    expect(opslaan()).toBeDisabled();
    expect(annuleren()).toBeDisabled();
    expect(updateSettings).not.toHaveBeenCalled();
  });
});

describe("Instellingen — Stroom: edit then Cancel", () => {
  it("restores the original 10A and disables Save again", async () => {
    const user = userEvent.setup();
    mount();
    await ready();

    await user.clear(stroomInput(3));
    await user.type(stroomInput(3), "16");

    expect(stroomInput(3)).toHaveValue(16);
    expect(opslaan()).toBeEnabled();
    expect(updateSettings).not.toHaveBeenCalled();

    await user.click(annuleren());

    expect(stroomInput(3)).toHaveValue(10);
    expect(stroomValues()).toEqual(["6", "8", "10"]);
    expect(opslaan()).toBeDisabled();
    expect(updateSettings).not.toHaveBeenCalled();
  });
});

describe("Instellingen — Stroom: remove then Cancel", () => {
  it("restores the removed 8A row and disables Save again", async () => {
    const user = userEvent.setup();
    mount();
    await ready();

    await user.click(removeStroom("8"));
    expect(stroomValues()).toEqual(["6", "10"]);
    expect(opslaan()).toBeEnabled();
    expect(updateSettings).not.toHaveBeenCalled();

    await user.click(annuleren());

    expect(stroomValues()).toEqual(["6", "8", "10"]);
    expect(removeStroom("8")).toBeInTheDocument();
    expect(opslaan()).toBeDisabled();
    expect(updateSettings).not.toHaveBeenCalled();
  });
});

describe("Instellingen — Vrij verbruik: add, edit, remove then Cancel", () => {
  it("discards an added 8 kWh", async () => {
    const user = userEvent.setup();
    mount();
    await ready();

    await user.clear(newVrij());
    await user.type(newVrij(), "8");
    await user.click(addVrij());

    expect(vrijValues()).toEqual(["0", "2", "4", "8"]);
    expect(opslaan()).toBeEnabled();

    await user.click(annuleren());

    expect(vrijValues()).toEqual(["0", "2", "4"]);
    expect(opslaan()).toBeDisabled();
  });

  it("discards an edited 4 kWh back to 4", async () => {
    const user = userEvent.setup();
    mount();
    await ready();

    await user.clear(vrijInput(3));
    await user.type(vrijInput(3), "9");
    expect(vrijInput(3)).toHaveValue(9);

    await user.click(annuleren());

    expect(vrijInput(3)).toHaveValue(4);
    expect(opslaan()).toBeDisabled();
  });

  it("discards a removed 2 kWh", async () => {
    const user = userEvent.setup();
    mount();
    await ready();

    await user.click(removeVrij("2"));
    expect(screen.queryByRole("button", { name: /Verwijder Verbruikswaarde 2 kWh/ })).toBeNull();

    await user.click(annuleren());

    expect(removeVrij("2")).toBeInTheDocument();
    expect(opslaan()).toBeDisabled();
  });
});

describe("Instellingen — Cancel reverts both lists at once", () => {
  it("discards a mixed multi-list draft in one click", async () => {
    const user = userEvent.setup();
    mount();
    await ready();

    await user.clear(newStroom());
    await user.type(newStroom(), "14");
    await user.click(addStroom());
    await user.clear(stroomInput(1));
    await user.type(stroomInput(1), "7");
    await user.clear(vrijInput(2));
    await user.type(vrijInput(2), "3");
    await user.click(removeVrij("4"));

    expect(opslaan()).toBeEnabled();

    await user.click(annuleren());

    expect(stroomValues()).toEqual(["6", "8", "10"]);
    expect(vrijValues()).toEqual(["0", "2", "4"]);
    expect(opslaan()).toBeDisabled();
    expect(annuleren()).toBeDisabled();
    expect(updateSettings).not.toHaveBeenCalled();
  });
});

describe("Instellingen — Opslaan", () => {
  it("sends the normalized lists and greys out after a successful save", async () => {
    const user = userEvent.setup();
    mount();
    await ready();

    await user.clear(newStroom());
    await user.type(newStroom(), "14");
    await user.click(addStroom());
    await user.click(opslaan());

    await waitFor(() => expect(updateSettings).toHaveBeenCalledTimes(1));
    const payload = updateSettings.mock.calls[0][0];
    expect(payload.stroominstelling).toEqual(["6", "8", "10", "14"]);
    expect(payload.vrijverbruikinstelling).toEqual(["0", "2", "4"]);
    expect(payload.sessionDurationDays).toBe(30);
    expect(payload.eigenaar).toMatchObject({ naam: "BluePlug", "btw-nummer": "NL123456789B01" });

    await waitFor(() => expect(opslaan()).toBeDisabled());
    expect(annuleren()).toBeDisabled();
    // The committed values stay on screen.
    expect(stroomValues()).toEqual(["6", "8", "10", "14"]);
  });

  it("sorts and de-duplicates the list before persisting", async () => {
    const user = userEvent.setup();
    mount();
    await ready();

    await user.clear(newStroom());
    await user.type(newStroom(), "9");
    await user.click(addStroom());
    await user.click(opslaan());

    await waitFor(() => expect(updateSettings).toHaveBeenCalledTimes(1));
    expect(updateSettings.mock.calls[0][0].stroominstelling).toEqual(["6", "8", "9", "10"]);
    // Normalized result becomes the saved state, so no phantom dirty flag.
    await waitFor(() => expect(opslaan()).toBeDisabled());
  });

  it("does not call the API when Save is clicked with no pending change", async () => {
    const user = userEvent.setup();
    mount();
    await ready();

    expect(opslaan()).toBeDisabled();
    await user.click(opslaan());
    expect(updateSettings).not.toHaveBeenCalled();
  });

  it("keeps the draft and Save enabled when persisting fails", async () => {
    const user = userEvent.setup();
    updateSettings.mockRejectedValueOnce(new Error("network down"));
    mount();
    await ready();

    await user.clear(newStroom());
    await user.type(newStroom(), "14");
    await user.click(addStroom());
    await user.click(opslaan());

    await waitFor(() => expect(screen.getByText(/network down/i)).toBeInTheDocument());
    expect(stroomValues()).toEqual(["6", "8", "10", "14"]);
    expect(opslaan()).toBeEnabled();
    expect(annuleren()).toBeEnabled();
  });

  it("Cancel is available after a failed save to discard the draft", async () => {
    const user = userEvent.setup();
    updateSettings.mockRejectedValueOnce(new Error("network down"));
    mount();
    await ready();

    await user.clear(newStroom());
    await user.type(newStroom(), "14");
    await user.click(addStroom());
    await user.click(opslaan());
    await waitFor(() => expect(screen.getByText(/network down/i)).toBeInTheDocument());

    await user.click(annuleren());

    expect(stroomValues()).toEqual(["6", "8", "10"]);
    expect(opslaan()).toBeDisabled();
  });
});

describe("Instellingen — pending-change summary", () => {
  it("names the list that has a pending change", async () => {
    const user = userEvent.setup();
    mount();
    await ready();

    expect(screen.queryByText(/Niet opgeslagen/)).toBeNull();

    await user.clear(newStroom());
    await user.type(newStroom(), "14");
    await user.click(addStroom());

    const banner = screen.getByText(/Niet opgeslagen/i);
    expect(banner).toHaveTextContent("stroomwaarden");

    await user.click(annuleren());
    expect(screen.queryByText(/Niet opgeslagen/)).toBeNull();
  });
});

describe("Instellingen — eigenaar fields share the same draft", () => {
  it("marks Save dirty and Cancel restores the field", async () => {
    const user = userEvent.setup();
    mount();
    await ready();

    const naam = screen.getByRole("textbox", { name: "Bedrijfsnaam" });
    await user.clear(naam);
    await user.type(naam, "Nieuw");
    expect(opslaan()).toBeEnabled();

    await user.click(annuleren());

    expect(screen.getByRole("textbox", { name: "Bedrijfsnaam" })).toHaveValue("BluePlug");
    expect(opslaan()).toBeDisabled();
  });
});

// #OVERSCHRIJDINGDB
describe("Instellingen — stroom overschrijding", () => {
  it("renders the overcurrent fields above the current-level section", async () => {
    mount();
    await ready();

    expect(secondsInput()).toHaveValue("90");
    expect(ampsInput()).toHaveValue("1.5");
    expect(notifySwitch()).toBeChecked();
    expect(disablePitchSwitch()).toBeChecked();
    expect(screen.getByText("Stroomniveaus")).toBeInTheDocument();

    const overcurrentHeading = screen.getByText("Stroom overschrijding");
    const currentHeading = screen.getByText("Stroomniveaus");
    expect(
      overcurrentHeading.compareDocumentPosition(currentHeading) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });

  it("shows the section disabled without blocking the rest of the page", async () => {
    const user = userEvent.setup();
    getOvercurrent.mockResolvedValueOnce({
      available: false,
      seconds: 0,
      amps: 0,
      notify: false,
      disablePitch: false,
    });
    mount();
    await ready();

    expect(screen.getByText("Niet beschikbaar op deze server")).toBeInTheDocument();
    expect(secondsInput()).toBeDisabled();
    expect(ampsInput()).toBeDisabled();
    expect(notifySwitch()).toBeDisabled();
    expect(disablePitchSwitch()).toBeDisabled();

    // The existing groups still work.
    await user.clear(newStroom());
    await user.type(newStroom(), "14");
    await user.click(addStroom());
    await user.click(opslaan());

    await waitFor(() => expect(updateSettings).toHaveBeenCalledTimes(1));
    expect(updateOvercurrent).not.toHaveBeenCalled();
  });

  it("saves only the changed overcurrent field and greys out again", async () => {
    const user = userEvent.setup();
    mount();
    await ready();

    await user.clear(secondsInput());
    await user.type(secondsInput(), "120");

    expect(opslaan()).toBeEnabled();
    expect(screen.getByText(/Niet opgeslagen/i)).toHaveTextContent("stroom overschrijding");

    await user.click(opslaan());

    await waitFor(() => expect(updateOvercurrent).toHaveBeenCalledTimes(1));
    expect(updateOvercurrent).toHaveBeenCalledWith({ seconds: 120 });
    expect(updateSettings).not.toHaveBeenCalled();
    await waitFor(() => expect(opslaan()).toBeDisabled());
    expect(secondsInput()).toHaveValue("120");
  });

  it("saves a checkbox as a boolean", async () => {
    const user = userEvent.setup();
    mount();
    await ready();

    await user.click(notifySwitch());
    await user.click(opslaan());

    await waitFor(() => expect(updateOvercurrent).toHaveBeenCalledTimes(1));
    expect(updateOvercurrent).toHaveBeenCalledWith({ notify: false });
    expect(updateSettings).not.toHaveBeenCalled();
  });

  it("keeps only the failed group dirty when the other call succeeds", async () => {
    const user = userEvent.setup();
    updateOvercurrent.mockRejectedValueOnce(new Error("configuratie.php busy"));
    mount();
    await ready();

    const naam = screen.getByRole("textbox", { name: "Bedrijfsnaam" });
    await user.clear(naam);
    await user.type(naam, "Nieuw");
    await user.clear(secondsInput());
    await user.type(secondsInput(), "120");
    await user.click(opslaan());

    await waitFor(() => expect(screen.getByText(/configuratie\.php busy/i)).toBeInTheDocument());
    expect(updateOvercurrent).toHaveBeenCalledTimes(1);
    expect(updateSettings).toHaveBeenCalledTimes(1);

    const banner = screen.getByText(/Niet opgeslagen/i);
    expect(banner).toHaveTextContent("stroom overschrijding");
    expect(banner).not.toHaveTextContent("bedrijfsnaam");
    expect(opslaan()).toBeEnabled();
  });

  it("Cancel restores the saved overcurrent values", async () => {
    const user = userEvent.setup();
    mount();
    await ready();

    await user.clear(secondsInput());
    await user.type(secondsInput(), "120");
    await user.clear(ampsInput());
    await user.type(ampsInput(), "4.25");
    await user.click(notifySwitch());

    await user.click(annuleren());

    expect(secondsInput()).toHaveValue("90");
    expect(ampsInput()).toHaveValue("1.5");
    expect(notifySwitch()).toBeChecked();
    expect(opslaan()).toBeDisabled();
  });

  it("rejects >2-decimal amps before calling the API", async () => {
    const user = userEvent.setup();
    mount();
    await ready();

    await user.clear(ampsInput());
    await user.type(ampsInput(), "1.234");
    await user.click(opslaan());

    await waitFor(() => expect(screen.getByText(/maximaal 2 decimalen/i)).toBeInTheDocument());
    expect(updateOvercurrent).not.toHaveBeenCalled();
    expect(updateSettings).not.toHaveBeenCalled();
    expect(opslaan()).toBeEnabled();
  });

  it("keeps working when the overcurrent GET fails", async () => {
    const user = userEvent.setup();
    getOvercurrent.mockRejectedValueOnce(new Error("offline"));
    mount();
    await ready();

    expect(screen.getByText("Niet beschikbaar op deze server")).toBeInTheDocument();

    await user.clear(newStroom());
    await user.type(newStroom(), "14");
    await user.click(addStroom());
    await user.click(opslaan());

    await waitFor(() => expect(updateSettings).toHaveBeenCalledTimes(1));
    expect(updateOvercurrent).not.toHaveBeenCalled();
  });
});
