export type PitchStatus =
  | "off"
  | "on"
  | "syncing"
  | "error_meter"
  | "error_actor"
  | "remote_off"
  | "remote_on";

export interface PitchStatusInput {
  stat: number;
  gewenst: number;
  errorcode: number;
  gastnaam: string | null;
}

/**
 * Calculate pitch status based on stat, gewenst, errorcode, and guest name.
 * Priority order:
 * 1. Error codes (override everything)
 * 2. Syncing state (stat != gewenst)
 * 3. Remote states (no guest assigned)
 * 4. Normal on/off states
 */
export function calculatePitchStatus(input: PitchStatusInput): PitchStatus {
  const { stat, gewenst, errorcode, gastnaam } = input;

  // Priority 1: Error codes override everything
  if (errorcode === 1) {
    return "error_meter";
  }
  if (errorcode === 2) {
    return "error_actor";
  }

  // Priority 2: Syncing state (hardware hasn't caught up yet)
  if (stat !== gewenst) {
    return "syncing";
  }

  // Priority 3: Remote states (no guest assigned)
  const hasGuest = gastnaam && gastnaam !== "-" && gastnaam.trim() !== "";
  if (!hasGuest) {
    if (gewenst === 0) {
      return "remote_off";
    }
    if (gewenst === 1) {
      return "remote_on";
    }
  }

  // Priority 4: Normal on/off states
  if (stat === 0 && gewenst === 0) {
    return "off";
  }
  if (stat === 1 && gewenst === 1) {
    return "on";
  }

  // Fallback (shouldn't reach here with valid data)
  return gewenst === 1 ? "on" : "off";
}
