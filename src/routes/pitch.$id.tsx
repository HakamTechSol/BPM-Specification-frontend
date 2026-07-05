import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ManagerLayout } from "@/components/manager-layout";
import { StatusChip, MetricCard, Card, SectionLabel } from "@/components/bp";
import { getPitch } from "@/lib/pitches";
import {
  ChevronLeft,
  Power,
  Zap,
  Activity,
  Gauge,
  Check,
  LogIn,
  LogOut,
  Sparkles,
  ChevronDown,
} from "lucide-react";

export const Route = createFileRoute("/pitch/$id")({
  component: PitchDetail,
  head: ({ params }) => ({
    meta: [
      { title: `Pitch ${params.id} · BluePlug` },
      { name: "description", content: "Control power and view usage for this pitch." },
    ],
  }),
});

const AMPS = [4, 6, 10, 16] as const;
const FREE = ["Off", "0.5 kWh / day", "1 kWh / day", "2 kWh / day", "Unlimited"] as const;

function PitchDetail() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const pitch = getPitch(id);
  const [power, setPower] = useState(pitch?.status === "on");
  const [maxAmp, setMaxAmp] = useState<(typeof AMPS)[number]>(
    (pitch?.maxAmp as (typeof AMPS)[number]) ?? 10,
  );
  const [free, setFree] = useState<(typeof FREE)[number]>("Off");
  const [confirm, setConfirm] = useState<null | "checkout" | "checkin">(null);

  if (!pitch) {
    return (
      <ManagerLayout title="Pitch not found">
        <p className="text-muted-foreground">This pitch doesn't exist.</p>
      </ManagerLayout>
    );
  }

  const usagePct = Math.min(100, (pitch.currentAmp / maxAmp) * 100);

  return (
    <ManagerLayout
      title={pitch.name}
      subtitle={`Pitch ${pitch.number}${pitch.guest ? " · " + pitch.guest : ""}`}
      right={
        <Link
          to="/dashboard"
          className="bp-tap hidden h-10 items-center gap-1.5 rounded-xl border border-border bg-card px-3 text-[13px] font-medium text-muted-foreground sm:inline-flex"
        >
          <ChevronLeft className="h-4 w-4" /> Back
        </Link>
      }
    >
      <Link
        to="/dashboard"
        className="bp-tap -mt-1 mb-3 inline-flex items-center gap-1 text-[13px] font-medium text-muted-foreground sm:hidden"
      >
        <ChevronLeft className="h-4 w-4" /> All pitches
      </Link>

      {/* Hero status */}
      <Card className="overflow-hidden">
        <div
          className="relative p-5"
          style={{
            background:
              "linear-gradient(135deg, color-mix(in oklab, var(--primary) 10%, transparent), transparent 60%)",
          }}
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <StatusChip status={pitch.status} size="lg" />
              <div className="mt-3 flex items-baseline gap-1.5">
                <span className="text-[42px] font-semibold tracking-tight tabular-nums">
                  {pitch.currentAmp.toFixed(1)}
                </span>
                <span className="text-[16px] font-medium text-muted-foreground">A</span>
              </div>
              <div className="text-[12.5px] text-muted-foreground">
                of {maxAmp} A max · updated just now
              </div>
            </div>
            <div className="grid h-14 w-14 place-items-center rounded-2xl bg-primary-soft text-primary">
              <Zap className="h-7 w-7" strokeWidth={2.3} />
            </div>
          </div>

          <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${usagePct}%`,
                background:
                  usagePct > 90
                    ? "var(--color-destructive)"
                    : usagePct > 70
                      ? "var(--color-warning)"
                      : "var(--color-success)",
              }}
            />
          </div>
        </div>
      </Card>

      {/* Metrics */}
      <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
        <MetricCard
          label="Today"
          value={pitch.todayKwh.toFixed(2)}
          unit="kWh"
          icon={Activity}
          tone="primary"
        />
        <MetricCard
          label="Total"
          value={pitch.totalKwh.toFixed(1)}
          unit="kWh"
          icon={Gauge}
        />
        <MetricCard
          label="Current"
          value={pitch.currentAmp.toFixed(1)}
          unit="A"
          icon={Zap}
          tone={usagePct > 90 ? "danger" : usagePct > 70 ? "warning" : "success"}
          hint={`${usagePct.toFixed(0)}% of limit`}
        />
      </div>

      {/* Power toggle */}
      <SectionLabel>Power</SectionLabel>
      <Card className="p-4">
        <div className="flex items-center gap-3">
          <div
            className={`grid h-12 w-12 place-items-center rounded-xl ${
              power ? "bg-success-soft text-success" : "bg-muted text-muted-foreground"
            }`}
          >
            <Power className="h-6 w-6" strokeWidth={2.3} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-[15px] font-semibold">Electricity</div>
            <div className="text-[12.5px] text-muted-foreground">
              {power ? "Power is delivered to the socket" : "Socket is switched off"}
            </div>
          </div>
          <button
            role="switch"
            aria-checked={power}
            onClick={() => setPower(!power)}
            className={`bp-tap relative h-8 w-14 rounded-full transition-colors ${
              power ? "bg-success" : "bg-muted"
            }`}
          >
            <span
              className={`absolute top-1 h-6 w-6 rounded-full bg-white shadow transition-transform ${
                power ? "translate-x-[26px]" : "translate-x-1"
              }`}
            />
          </button>
        </div>
      </Card>

      {/* Max current segmented */}
      <SectionLabel>Maximum current</SectionLabel>
      <Card className="p-3">
        <div className="grid grid-cols-4 gap-2">
          {AMPS.map((a) => (
            <button
              key={a}
              onClick={() => setMaxAmp(a)}
              className={`bp-tap flex h-14 flex-col items-center justify-center rounded-xl border text-[15px] font-semibold ${
                maxAmp === a
                  ? "border-primary bg-primary text-primary-foreground shadow-glow"
                  : "border-border bg-card text-foreground hover:border-primary/40"
              }`}
            >
              <span className="tabular-nums">{a}</span>
              <span
                className={`text-[10.5px] font-medium ${
                  maxAmp === a ? "text-primary-foreground/80" : "text-muted-foreground"
                }`}
              >
                Amp
              </span>
            </button>
          ))}
        </div>
      </Card>

      {/* Free usage dropdown */}
      <SectionLabel>Free usage allowance</SectionLabel>
      <Card>
        <details className="group">
          <summary className="flex cursor-pointer list-none items-center gap-3 p-4">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-info-soft text-info">
              <Sparkles className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-[14px] font-semibold">{free}</div>
              <div className="text-[12px] text-muted-foreground">
                Complimentary energy included per day
              </div>
            </div>
            <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform group-open:rotate-180" />
          </summary>
          <div className="border-t border-border p-2">
            {FREE.map((o) => (
              <button
                key={o}
                onClick={() => setFree(o)}
                className="bp-tap flex w-full items-center justify-between rounded-lg px-3 py-3 text-left text-[14px] hover:bg-muted"
              >
                <span>{o}</span>
                {free === o && <Check className="h-4 w-4 text-primary" />}
              </button>
            ))}
          </div>
        </details>
      </Card>

      {/* Actions */}
      <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <button className="bp-tap col-span-1 flex h-14 items-center justify-center gap-2 rounded-2xl bg-primary text-[15px] font-semibold text-primary-foreground shadow-glow sm:col-span-3">
          <Check className="h-4 w-4" /> Save changes
        </button>
        {pitch.checkedIn ? (
          <button
            onClick={() => setConfirm("checkout")}
            className="bp-tap flex h-14 items-center justify-center gap-2 rounded-2xl border border-border bg-card text-[15px] font-semibold text-destructive sm:col-span-3"
          >
            <LogOut className="h-4 w-4" /> Check out guest
          </button>
        ) : (
          <button
            onClick={() => setConfirm("checkin")}
            className="bp-tap flex h-14 items-center justify-center gap-2 rounded-2xl border border-border bg-card text-[15px] font-semibold text-success sm:col-span-3"
          >
            <LogIn className="h-4 w-4" /> Check in guest
          </button>
        )}
      </div>

      {/* Confirm dialog */}
      {confirm && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-foreground/40 p-4 backdrop-blur-sm sm:items-center">
          <div className="w-full max-w-sm rounded-3xl bg-card p-5 shadow-elevated">
            <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-primary-soft text-primary">
              {confirm === "checkout" ? (
                <LogOut className="h-6 w-6" />
              ) : (
                <LogIn className="h-6 w-6" />
              )}
            </div>
            <h3 className="mt-3 text-center text-[17px] font-semibold tracking-tight">
              {confirm === "checkout" ? "Check out guest?" : "Check in guest?"}
            </h3>
            <p className="mt-1 text-center text-[13px] text-muted-foreground">
              {confirm === "checkout"
                ? "Power will be switched off and the session will end."
                : "A new session will start and power will be enabled."}
            </p>
            <div className="mt-5 grid grid-cols-2 gap-2">
              <button
                onClick={() => setConfirm(null)}
                className="bp-tap h-12 rounded-xl border border-border bg-card text-[14px] font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setConfirm(null);
                  navigate({ to: "/dashboard" });
                }}
                className="bp-tap h-12 rounded-xl bg-primary text-[14px] font-semibold text-primary-foreground shadow-glow"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </ManagerLayout>
  );
}
