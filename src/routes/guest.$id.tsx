import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { getPitch } from "@/lib/pitches";
import {
  StatusChip,
  StatusIcon,
  MetricCard,
  Card,
  ConnectionBadge,
  EmptyState,
} from "@/components/bp";
import { Zap, RotateCcw, Activity, Gauge, Clock, TreePine, Wifi, RefreshCw } from "lucide-react";

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
  const [locked, setLocked] = useState(pitch?.status === "warning" || pitch?.status === "error");
  const [secondsLeft, setSecondsLeft] = useState(45);
  const [connected, setConnected] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!locked) return;
    const t = setInterval(() => {
      setSecondsLeft((s) => (s > 0 ? s - 1 : 0));
    }, 1000);
    return () => clearInterval(t);
  }, [locked]);

  useEffect(() => {
    const t = setInterval(() => {
      setLastUpdated(new Date());
    }, 5000);
    return () => clearInterval(t);
  }, []);

  if (!pitch) {
    return (
      <div className="grid min-h-screen place-items-center bg-background p-6 text-center">
        <EmptyState
          icon={Zap}
          title="Pitch not found"
          description="Please rescan the QR code on your pitch (Plaats)."
        />
      </div>
    );
  }

  const overCurrent =
    pitch.currentAmp >= pitch.maxAmp - 0.1 ||
    pitch.status === "warning" ||
    pitch.status === "error";
  const canReset = locked && secondsLeft === 0;
  const powerAvailable =
    pitch.status === "on" ||
    pitch.status === "in-use" ||
    pitch.status === "always-on" ||
    pitch.status === "remote-on";

  const reset = () => {
    if (!canReset) return;
    setLocked(false);
    setSecondsLeft(45);
  };

  const timeSinceUpdate = Math.floor((Date.now() - lastUpdated.getTime()) / 1000);

  return (
    <div className="min-h-screen bg-background">
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
          <div className="flex items-center gap-1.5 text-[12px] text-muted-foreground">
            <TreePine className="h-3.5 w-3.5" /> Duinrand Camping
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-md space-y-3 px-5 pb-[max(env(safe-area-inset-bottom),2.5rem)]">
        <div className="flex items-center justify-between pt-2">
          <div>
            <div className="text-[12px] font-medium uppercase tracking-wider text-muted-foreground">
              Uw plaats (Your pitch)
            </div>
            <h1 className="mt-0.5 text-[26px] font-semibold tracking-tight">{pitch.name}</h1>
            <div className="mt-1 flex items-center gap-2 text-[13px] text-muted-foreground">
              <span className="rounded-md bg-muted px-1.5 py-0.5 text-[12px] font-medium">
                {pitch.number}
              </span>
              {pitch.guest && <span>Welkom, {pitch.guest}</span>}
            </div>
          </div>
          <div className="flex flex-col items-end gap-1.5">
            {powerAvailable ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-success-soft px-2.5 py-1 text-[12px] font-semibold text-success">
                <span className="h-1.5 w-1.5 rounded-full bg-success" />
                Power Available
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-destructive-soft px-2.5 py-1 text-[12px] font-semibold text-destructive">
                <span className="h-1.5 w-1.5 rounded-full bg-destructive" />
                Power Disabled
              </span>
            )}
            <ConnectionBadge
              status={connected ? "online" : "offline"}
              label={connected ? "Verbonden" : "Offline"}
            />
          </div>
        </div>

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
              <StatusIcon status={overCurrent ? "warning" : "on"} className="h-14 w-14" />
              <div>
                <StatusChip status={overCurrent ? "warning" : "on"} />
                <div className="mt-1 text-[13px] text-muted-foreground">
                  {overCurrent ? "Over current — reduce load" : "Everything running smoothly"}
                </div>
              </div>
            </div>

            <div className="mt-5 flex items-end justify-between">
              <div>
                <div className="text-[12px] font-medium uppercase tracking-wider text-muted-foreground">
                  Current draw (Stroom)
                </div>
                <div className="mt-1 flex items-baseline gap-1.5">
                  <span className="text-[48px] font-semibold leading-none tracking-tight tabular-nums">
                    {pitch.currentAmp.toFixed(1)}
                  </span>
                  <span className="text-[16px] font-medium text-muted-foreground">A</span>
                </div>
                <div className="mt-1 text-[12px] text-muted-foreground">max {pitch.maxAmp} A</div>
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
                  background: overCurrent ? "var(--color-warning)" : "var(--color-success)",
                }}
              />
            </div>

            <div className="mt-3 flex items-center justify-between text-[12px] text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <Wifi className="h-3.5 w-3.5" />
                {connected ? "Connected" : "Disconnected"}
              </div>
              <div className="flex items-center gap-1.5">
                <RefreshCw className="h-3.5 w-3.5" />
                {timeSinceUpdate < 60
                  ? `${timeSinceUpdate}s geleden`
                  : `${Math.floor(timeSinceUpdate / 60)}m geleden`}
              </div>
            </div>
          </div>
        </Card>

        <div className="grid grid-cols-2 gap-3">
          <MetricCard
            label="Vandaag (Today)"
            value={pitch.todayKwh.toFixed(2)}
            unit="kWh"
            icon={Activity}
            tone="primary"
          />
          <MetricCard
            label="Totaal (Total)"
            value={pitch.totalKwh.toFixed(1)}
            unit="kWh"
            icon={Gauge}
          />
        </div>

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
                {locked ? "Cool-down active (Afkoeling)" : "Ready to reset"}
              </div>
              <p className="mt-0.5 text-[13px] text-muted-foreground">
                {locked
                  ? "Unplug high-power devices first, then reset when the timer ends."
                  : "You can reset your socket after an over-current trip."}
              </p>
            </div>
          </div>

          {locked && (
            <div className="mt-4">
              <div className="flex items-center justify-between text-[12px] text-muted-foreground">
                <span>Tijd over (Time remaining)</span>
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
            className={`bp-tap mt-4 flex h-14 w-full items-center justify-center gap-2 rounded-2xl text-[15px] font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
              canReset || !locked
                ? "bg-primary text-primary-foreground shadow-glow hover:bg-primary/90"
                : "cursor-not-allowed bg-muted text-muted-foreground"
            }`}
          >
            <RotateCcw className={`h-4 w-4 ${locked && !canReset ? "animate-spin" : ""}`} />
            {locked ? (canReset ? "Reset now" : "Please wait…") : "Reset socket"}
          </button>
        </Card>

        <p className="pt-2 text-center text-[12px] text-muted-foreground">
          Geen login nodig · No login required · Data refreshes every few seconds
        </p>
      </main>
    </div>
  );
}
