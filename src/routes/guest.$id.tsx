import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { getPitch } from "@/lib/pitches";
import { StatusChip, StatusIcon, MetricCard, Card } from "@/components/bp";
import { Zap, RotateCcw, Activity, Gauge, Clock, TreePine } from "lucide-react";

export const Route = createFileRoute("/guest/$id")({
  component: GuestScreen,
  head: ({ params }) => ({
    meta: [
      { title: `Pitch ${params.id} · BluePlug` },
      {
        name: "description",
        content: "Live electricity usage for your campsite pitch.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
});

function GuestScreen() {
  const { id } = Route.useParams();
  const pitch = getPitch(id);
  const [locked, setLocked] = useState(pitch?.status === "warning");
  const [secondsLeft, setSecondsLeft] = useState(45);

  useEffect(() => {
    if (!locked) return;
    const t = setInterval(() => {
      setSecondsLeft((s) => (s > 0 ? s - 1 : 0));
    }, 1000);
    return () => clearInterval(t);
  }, [locked]);

  if (!pitch) {
    return (
      <div className="grid min-h-screen place-items-center bg-background p-6 text-center">
        <div>
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-muted text-muted-foreground">
            <Zap className="h-7 w-7" />
          </div>
          <h1 className="mt-4 text-[20px] font-semibold">Pitch not found</h1>
          <p className="mt-1 text-[13px] text-muted-foreground">
            Please rescan the QR on your pitch.
          </p>
        </div>
      </div>
    );
  }

  const overCurrent = pitch.currentAmp >= pitch.maxAmp - 0.1 || pitch.status === "warning";
  const canReset = locked && secondsLeft === 0;

  const reset = () => {
    if (!canReset) return;
    setLocked(false);
    setSecondsLeft(45);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Branded header */}
      <header className="relative overflow-hidden">
        <div
          aria-hidden
          className="absolute inset-0 -z-10"
          style={{
            background:
              "linear-gradient(180deg, color-mix(in oklab, var(--primary) 14%, transparent), transparent 80%)",
          }}
        />
        <div className="mx-auto flex max-w-md items-center justify-between px-5 pb-2 pt-6">
          <div className="flex items-center gap-2">
            <div className="grid h-8 w-8 place-items-center rounded-lg bg-primary text-primary-foreground">
              <Zap className="h-4 w-4" strokeWidth={2.6} />
            </div>
            <span className="text-[14px] font-semibold tracking-tight">BluePlug</span>
          </div>
          <div className="flex items-center gap-1.5 text-[11.5px] text-muted-foreground">
            <TreePine className="h-3.5 w-3.5" /> Duinrand Camping
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-md space-y-3 px-5 pb-10">
        {/* Pitch header */}
        <div className="pt-2">
          <div className="text-[12.5px] font-medium uppercase tracking-wider text-muted-foreground">
            Your pitch
          </div>
          <h1 className="mt-0.5 text-[26px] font-semibold tracking-tight">{pitch.name}</h1>
          <div className="mt-1 flex items-center gap-2 text-[13px] text-muted-foreground">
            <span className="rounded-md bg-muted px-1.5 py-0.5 text-[11px] font-medium">
              {pitch.number}
            </span>
            {pitch.guest && <span>Welcome, {pitch.guest}</span>}
          </div>
        </div>

        {/* Big status card */}
        <Card className="overflow-hidden">
          <div
            className="p-5"
            style={{
              background: overCurrent
                ? "linear-gradient(135deg, color-mix(in oklab, var(--warning) 14%, transparent), transparent 60%)"
                : "linear-gradient(135deg, color-mix(in oklab, var(--success) 12%, transparent), transparent 60%)",
            }}
          >
            <div className="flex items-center gap-3">
              <StatusIcon
                status={overCurrent ? "warning" : "on"}
                className="h-14 w-14"
              />
              <div>
                <StatusChip status={overCurrent ? "warning" : "on"} />
                <div className="mt-1 text-[13px] text-muted-foreground">
                  {overCurrent
                    ? "Over current — reduce load"
                    : "Everything running smoothly"}
                </div>
              </div>
            </div>

            <div className="mt-5 flex items-end justify-between">
              <div>
                <div className="text-[12px] font-medium uppercase tracking-wider text-muted-foreground">
                  Current draw
                </div>
                <div className="mt-1 flex items-baseline gap-1.5">
                  <span className="text-[48px] font-semibold leading-none tracking-tight tabular-nums">
                    {pitch.currentAmp.toFixed(1)}
                  </span>
                  <span className="text-[16px] font-medium text-muted-foreground">A</span>
                </div>
                <div className="mt-1 text-[12px] text-muted-foreground">
                  max {pitch.maxAmp} A
                </div>
              </div>
              <div className="text-right">
                <div className="text-[12px] font-medium uppercase tracking-wider text-muted-foreground">
                  Live
                </div>
                <div className="mt-1 inline-flex items-center gap-1.5 rounded-full bg-success-soft px-2.5 py-1 text-[12px] font-semibold text-success">
                  <span className="relative inline-flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-60" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-success" />
                  </span>
                  updating
                </div>
              </div>
            </div>

            <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-white/60">
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${Math.min(100, (pitch.currentAmp / pitch.maxAmp) * 100)}%`,
                  background: overCurrent
                    ? "var(--color-warning)"
                    : "var(--color-success)",
                }}
              />
            </div>
          </div>
        </Card>

        {/* Metrics */}
        <div className="grid grid-cols-2 gap-3">
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
        </div>

        {/* Reset over-current */}
        <Card className="p-4">
          <div className="flex items-start gap-3">
            <div
              className={`grid h-11 w-11 place-items-center rounded-xl ${
                locked ? "bg-warning-soft text-warning" : "bg-success-soft text-success"
              }`}
            >
              {locked ? <Clock className="h-5 w-5" /> : <RotateCcw className="h-5 w-5" />}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-[14.5px] font-semibold">
                {locked ? "Cool-down active" : "Ready to reset"}
              </div>
              <p className="mt-0.5 text-[12.5px] text-muted-foreground">
                {locked
                  ? "Unplug high-power devices first, then reset when the timer ends."
                  : "You can reset your socket after an over-current trip."}
              </p>
            </div>
          </div>

          {locked && (
            <div className="mt-4">
              <div className="flex items-center justify-between text-[12px] text-muted-foreground">
                <span>Time remaining</span>
                <span className="tabular-nums font-semibold text-foreground">
                  {String(Math.floor(secondsLeft / 60)).padStart(2, "0")}:
                  {String(secondsLeft % 60).padStart(2, "0")}
                </span>
              </div>
              <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-warning transition-all"
                  style={{ width: `${((45 - secondsLeft) / 45) * 100}%` }}
                />
              </div>
            </div>
          )}

          <button
            disabled={!canReset && locked}
            onClick={reset}
            className={`bp-tap mt-4 flex h-14 w-full items-center justify-center gap-2 rounded-2xl text-[15px] font-semibold ${
              canReset || !locked
                ? "bg-primary text-primary-foreground shadow-glow"
                : "cursor-not-allowed bg-muted text-muted-foreground"
            }`}
          >
            <RotateCcw className="h-4 w-4" />
            {locked ? (canReset ? "Reset now" : "Please wait…") : "Reset socket"}
          </button>
        </Card>

        <p className="pt-2 text-center text-[11px] text-muted-foreground">
          No login required · Data refreshes every few seconds
        </p>
      </main>
    </div>
  );
}
