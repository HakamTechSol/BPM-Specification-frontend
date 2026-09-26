import { describe, expect, it } from "vitest";
import {
  changeLabels,
  changedFields,
  hasChanges,
  normalizeSettings,
  normalizeValues,
  settingsEqual,
  settingsFromApi,
  settingsKey,
  type SettingsShape,
} from "./settingsDraft";

const base: SettingsShape = {
  naam: "BluePlug",
  straat: "Dorpsstraat",
  nummer: "1",
  postcode: "1234AB",
  plaats: "Hoorn",
  land: "NL",
  telefoon: "0123456789",
  email: "info@blueplug.nl",
  website: "https://blueplug.nl",
  kvk: "12345678",
  btwNummer: "NL123456789B01",
  sessionDurationDays: 30,
  stroominstelling: ["6", "8", "10"],
  vrijverbruikinstelling: ["0", "2", "4"],
};

describe("normalizeValues", () => {
  it("sorts numerically ascending, not lexicographically", () => {
    expect(normalizeValues(["10", "6", "8"])).toEqual(["6", "8", "10"]);
  });

  it("keeps decimals as authored", () => {
    expect(normalizeValues(["6.5", "10"])).toEqual(["6.5", "10"]);
  });

  it("drops blanks, non-numbers, and numeric duplicates", () => {
    expect(normalizeValues(["8", "", "  ", "abc", "8.0", "10"])).toEqual(["8", "10"]);
  });

  it("returns an empty list for empty input", () => {
    expect(normalizeValues([])).toEqual([]);
  });
});

describe("normalizeSettings", () => {
  it("normalizes both option lists and leaves the rest untouched", () => {
    const result = normalizeSettings({
      ...base,
      stroominstelling: ["10", "6", "6.0"],
      vrijverbruikinstelling: ["4", "", "0"],
    });
    expect(result.stroominstelling).toEqual(["6", "10"]);
    expect(result.vrijverbruikinstelling).toEqual(["0", "4"]);
    expect(result.naam).toBe(base.naam);
    expect(result.sessionDurationDays).toBe(base.sessionDurationDays);
  });
});

describe("settingsFromApi", () => {
  it("maps every eigenaar field, including the hyphenated BTW key", () => {
    const result = settingsFromApi({
      eigenaar: { naam: "Hakker", "btw-nummer": "NL999" },
      sessionDurationDays: 14,
      stroominstelling: ["6"],
      vrijverbruikinstelling: ["0"],
    });
    expect(result.naam).toBe("Hakker");
    expect(result.btwNummer).toBe("NL999");
    expect(result.sessionDurationDays).toBe(14);
    expect(result.straat).toBe("");
  });

  it("tolerates a missing eigenaar object and defaults the session duration", () => {
    const result = settingsFromApi({});
    expect(result.naam).toBe("");
    expect(result.sessionDurationDays).toBe(30);
    expect(result.stroominstelling).toEqual([]);
  });
});

describe("hasChanges / changedFields", () => {
  it("is false for an untouched draft", () => {
    expect(hasChanges(base, { ...base })).toBe(false);
    expect(changedFields(base, { ...base })).toEqual([]);
    expect(settingsEqual(base, { ...base })).toBe(true);
  });

  it("ignores ordering differences within an option list", () => {
    const draft = { ...base, stroominstelling: ["10", "6", "8"] };
    expect(hasChanges(base, draft)).toBe(false);
  });

  it("detects an added stroom value", () => {
    const draft = { ...base, stroominstelling: ["6", "8", "10", "14"] };
    expect(changedFields(base, draft)).toEqual(["stroominstelling"]);
    expect(changeLabels(base, draft)).toEqual(["stroomwaarden"]);
  });

  it("detects an edited stroom value", () => {
    const draft = { ...base, stroominstelling: ["6", "8", "16"] };
    expect(changedFields(base, draft)).toEqual(["stroominstelling"]);
  });

  it("detects a removed stroom value", () => {
    const draft = { ...base, stroominstelling: ["6", "8"] };
    expect(changedFields(base, draft)).toEqual(["stroominstelling"]);
  });

  it("detects changes to the vrij verbruik list independently", () => {
    const draft = { ...base, vrijverbruikinstelling: ["0", "2", "4", "8"] };
    expect(changedFields(base, draft)).toEqual(["vrijverbruikinstelling"]);
  });

  it("reports both lists when both changed", () => {
    const draft = {
      ...base,
      stroominstelling: ["6", "8"],
      vrijverbruikinstelling: ["0"],
    };
    expect(changedFields(base, draft).sort()).toEqual([
      "stroominstelling",
      "vrijverbruikinstelling",
    ]);
  });

  it("detects scalar and eigenaar edits too", () => {
    expect(changedFields(base, { ...base, sessionDurationDays: 7 })).toEqual([
      "sessionDurationDays",
    ]);
    expect(changedFields(base, { ...base, naam: "Anders" })).toEqual(["naam"]);
  });

  it("treats an emptied list as a change", () => {
    expect(hasChanges(base, { ...base, stroominstelling: [] })).toBe(true);
    expect(hasChanges({ ...base, stroominstelling: [] }, base)).toBe(true);
  });

  it("uses a stable key that ignores list order", () => {
    expect(settingsKey({ ...base, stroominstelling: ["10", "6"] })).toBe(
      settingsKey({ ...base, stroominstelling: ["6", "10"] }),
    );
  });
});

describe("revert semantics", () => {
  it("a reverted draft equals the saved state, so hasChanges goes false", () => {
    const saved = { ...base };
    const draft = { ...saved, stroominstelling: ["6", "8", "10", "14"] };
    expect(hasChanges(saved, draft)).toBe(true);

    // Cancel assigns the saved object back onto the draft.
    const reverted = saved;
    expect(hasChanges(saved, reverted)).toBe(false);
    expect(reverted.stroominstelling).toEqual(["6", "8", "10"]);
  });

  it("a saved-and-renormalized draft is no longer dirty", () => {
    const saved = { ...base };
    const draft = { ...saved, stroominstelling: ["10", "6", "14"] };
    expect(hasChanges(saved, normalizeSettings(draft))).toBe(true);

    const next = normalizeSettings(draft);
    // After a successful save both sides become `next`.
    expect(hasChanges(next, next)).toBe(false);
    expect(next.stroominstelling).toEqual(["6", "10", "14"]);
  });
});
