import { describe, expect, it } from "vitest";
import {
  DEFAULT_SETTINGS,
  SETTING_KEYS,
  changedFields,
  hasChanges,
  isRemoteActive,
  isSwitchingToLokaal,
  settingsEqual,
  settingsFromPitch,
  type PitchSettings,
} from "./pitchSettings";

const saved: PitchSettings = {
  power: true,
  maxAmp: 10,
  freeUsage: 0,
  afstand: 0,
};

describe("settingsFromPitch", () => {
  it("maps an API pitch record onto the editable settings", () => {
    expect(
      settingsFromPitch({
        gewenst: 1,
        maxAmperage: 16,
        freeUsage: 4,
        afstandbesturing: 3,
      }),
    ).toEqual({ power: true, maxAmp: 16, freeUsage: 4, afstand: 3 });
  });

  it("treats any gewenst other than 1 as off", () => {
    expect(
      settingsFromPitch({ gewenst: 0, maxAmperage: 10, freeUsage: 0, afstandbesturing: 0 }).power,
    ).toBe(false);
    expect(
      settingsFromPitch({ gewenst: 2, maxAmperage: 10, freeUsage: 0, afstandbesturing: 0 }).power,
    ).toBe(false);
  });

  it("falls back to the defaults for a missing amperage / free usage", () => {
    const result = settingsFromPitch({
      gewenst: 0,
      maxAmperage: 0,
      freeUsage: 0,
      afstandbesturing: null,
    });
    expect(result).toEqual(DEFAULT_SETTINGS);
  });

  it("reads a null afstandbesturing as Lokaal", () => {
    const result = settingsFromPitch({
      gewenst: 1,
      maxAmperage: 10,
      freeUsage: 0,
      afstandbesturing: null,
    });
    expect(result.afstand).toBe(0);
  });
});

describe("changedFields / hasChanges", () => {
  it("reports nothing when the draft equals the saved state", () => {
    expect(changedFields(saved, { ...saved })).toEqual([]);
    expect(hasChanges(saved, { ...saved })).toBe(false);
    expect(settingsEqual(saved, { ...saved })).toBe(true);
  });

  it.each([
    ["maxAmp", { maxAmp: 8 }],
    ["freeUsage", { freeUsage: 2 }],
    ["afstand", { afstand: 1 }],
    ["power", { power: false }],
  ] as const)("detects a single change to %s", (key, patch) => {
    const draft = { ...saved, ...patch };
    expect(changedFields(saved, draft)).toEqual([key]);
    expect(hasChanges(saved, draft)).toBe(true);
  });

  it("lists every field that differs", () => {
    const draft: PitchSettings = { power: false, maxAmp: 8, freeUsage: 2, afstand: 3 };
    expect(changedFields(saved, draft).sort()).toEqual(
      ["afstand", "freeUsage", "maxAmp", "power"].sort(),
    );
  });

  it("returns to no-change when a field is set back to its saved value", () => {
    const draft: PitchSettings = { ...saved, maxAmp: 8 };
    expect(hasChanges(saved, draft)).toBe(true);
    draft.maxAmp = saved.maxAmp;
    expect(hasChanges(saved, draft)).toBe(false);
  });

  it("is order-insensitive on the key list", () => {
    expect(SETTING_KEYS).toEqual(["power", "maxAmp", "freeUsage", "afstand"]);
  });
});

describe("isRemoteActive", () => {
  it("is inactive for Lokaal and active for both remote modes", () => {
    expect(isRemoteActive({ ...saved, afstand: 0 })).toBe(false);
    expect(isRemoteActive({ ...saved, afstand: 1 })).toBe(true);
    expect(isRemoteActive({ ...saved, afstand: 3 })).toBe(true);
  });
});

describe("isSwitchingToLokaal", () => {
  it("is true only when leaving a remote mode for Lokaal", () => {
    expect(isSwitchingToLokaal({ ...saved, afstand: 1 }, { ...saved, afstand: 0 })).toBe(true);
    expect(isSwitchingToLokaal({ ...saved, afstand: 3 }, { ...saved, afstand: 0 })).toBe(true);
  });

  it("is false when entering remote mode, staying put, or already Lokaal", () => {
    expect(isSwitchingToLokaal({ ...saved, afstand: 0 }, { ...saved, afstand: 1 })).toBe(false);
    expect(isSwitchingToLokaal({ ...saved, afstand: 0 }, { ...saved, afstand: 0 })).toBe(false);
    expect(isSwitchingToLokaal({ ...saved, afstand: 1 }, { ...saved, afstand: 1 })).toBe(false);
  });
});
