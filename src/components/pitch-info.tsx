import { Card, SectionLabel, StatusIcon } from "@/components/bp";
import type { ReservationInfo } from "@/lib/api";

/**
 * The pitch fields the shared info block needs. Both `PitchSummary` (admin
 * pitch page) and `GuestPitchStatus` (guest page) satisfy it, so the same
 * block renders on both screens and they can never drift apart.
 */
export interface PitchInfoSource {
  /** 1 = power on, 0 = off. */
  gewenst: number;
  /** Live current in centi-ampere; rendered scaled (/100). */
  iverb: number;
  maxAmperage: number;
  kwhtot: number;
  reservation: ReservationInfo | null;
}

function formatCheckIn(checkIn: string): string {
  return new Date(checkIn).toLocaleDateString("nl-NL", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * One row of the usage table.
 *
 * The number and its unit are glued together in a single `whitespace-nowrap`
 * box that cannot shrink, and the row never wraps, so the value always stays
 * on the label's line. When the row is too narrow (small phones, large meter
 * readings) the label side yields instead: the check-in date drops to its own
 * line under the label, and the value stays put on the right.
 */
function UsageRow({
  label,
  sublabel,
  sublabelBelow = false,
  value,
  unit = "kWh",
  labelClassName = "text-[13px] text-muted-foreground",
  valueClassName = "text-[15px] font-semibold",
  unitClassName = "text-[11px] font-medium text-muted-foreground",
}: {
  label: string;
  /** Secondary text on the label side, e.g. the check-in date. */
  sublabel?: string;
  /** Put the sublabel on its own line under the label instead of beside it. */
  sublabelBelow?: boolean;
  value: string;
  unit?: string;
  labelClassName?: string;
  valueClassName?: string;
  unitClassName?: string;
}) {
  return (
    // No flex-wrap: the value never moves to a line of its own.
    <div className="flex items-baseline justify-between gap-3">
      <div className={`min-w-0 ${labelClassName}`}>
        {label}
        {sublabel && sublabelBelow && (
          <span className="block whitespace-nowrap text-[11px] font-normal text-muted-foreground/70">
            {sublabel}
          </span>
        )}
        {sublabel && !sublabelBelow && (
          <span className="ml-1.5 whitespace-nowrap text-[11px] font-normal text-muted-foreground/70">
            {sublabel}
          </span>
        )}
      </div>
      <span
        className={`ml-auto inline-flex shrink-0 items-baseline gap-1 whitespace-nowrap tabular-nums ${valueClassName}`}
      >
        {value}
        {unit && <span className={unitClassName}>{unit}</span>}
      </span>
    </div>
  );
}

/**
 * Read-only pitch information: the Aan/Uit status header, the current/max
 * current cards and the usage table. Shared verbatim by the manager pitch
 * page and the guest screen; admin-only controls live outside it.
 */
export function PitchInfo({ pitch }: { pitch: PitchInfoSource }) {
  const { gewenst, iverb, maxAmperage, kwhtot, reservation } = pitch;
  const powerOn = gewenst === 1;
  // #FREEUSAGEDB backend-supplied stay length; minimum 1 day.
  const freeDays = Math.max(1, Math.round(reservation?.freeDays ?? 0));

  return (
    <div data-testid="pitch-info" className="space-y-3">
      <Card className="overflow-hidden">
        <div className="p-3">
          <div className="flex items-center gap-2.5">
            <StatusIcon status={powerOn ? "on" : "off"} className="h-11 w-11" />
            <div className="flex items-baseline gap-1">
              <span className="text-[36px] font-semibold leading-none tracking-tight tabular-nums">
                {powerOn ? "Aan" : "Uit"}
              </span>
            </div>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-3 text-center">
            <div className="rounded-xl bg-muted/50 p-2.5">
              <div className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                Huidige Stroom
              </div>
              <div className="mt-1 text-[20px] font-semibold tabular-nums">
                {typeof iverb === "number" && iverb >= 0 ? `${(iverb / 100).toFixed(1)} A` : "—"}
              </div>
            </div>
            <div className="rounded-xl bg-muted/50 p-2.5">
              <div className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                Max Stroom
              </div>
              <div className="mt-1 text-[20px] font-semibold tabular-nums">{maxAmperage} A</div>
            </div>
          </div>
        </div>
      </Card>

      <SectionLabel>Verbruik</SectionLabel>
      <Card className="overflow-hidden">
        <div className="px-3 py-3">
          <UsageRow label="Meterstand totaal" value={Number(kwhtot).toFixed(2)} />

          {reservation && reservation.eStart != null && (
            <>
              <div className="mt-2">
                <UsageRow
                  label="Meterstand bij start"
                  sublabel={formatCheckIn(reservation.checkIn)}
                  value={Number(reservation.eStart).toFixed(2)}
                />
              </div>

              <div className="my-2.5 border-t border-border" />

              <UsageRow
                label="Verbruikt"
                labelClassName="text-[13px] font-semibold"
                valueClassName="text-[16px] font-bold text-success"
                unitClassName="text-[11px] font-medium"
                value={Math.max(0, Number(kwhtot) - Number(reservation.eStart)).toFixed(2)}
              />

              {/* Legacy free-usage rows (dispVerbruik.php). The backend computes
                  every figure, so manager and guest show the same numbers.
                  Shown only when there is an allowance. #FREEUSAGEDB */}
              {reservation.freeUsageTotal != null && reservation.freeUsageTotal > 0 && (
                <>
                  <UsageRow
                    label="Vrij verbruik"
                    sublabel={`(${freeDays} ${freeDays === 1 ? "dag" : "dagen"} × ${Number(
                      reservation.freeUsagePerDay ?? 0,
                    ).toFixed(2)} kWh)`}
                    sublabelBelow
                    value={Number(reservation.freeUsageTotal).toFixed(2)}
                  />

                  <UsageRow
                    label="Verschil"
                    value={Number(reservation.difference ?? 0).toFixed(2)}
                  />
                </>
              )}
            </>
          )}
        </div>
      </Card>
    </div>
  );
}
