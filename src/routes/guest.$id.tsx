import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { getGuestPitchStatus, resolveHash, resetPitchError, type GuestPitchStatus } from "@/lib/api";
import {
  StatusIcon,
  MetricCard,
  Card,
  ConnectionBadge,
  EmptyState,
} from "@/components/bp";
import { Zap, Activity, Gauge, TreePine, Wifi, RefreshCw, Loader2, AlertTriangle, CheckCircle } from "lucide-react";

export const Route = createFileRoute("/guest/$id")({
  component: GuestScreen,
  head: ({ params }) => ({
    meta: [
      { title: `Plaats · BluePlug` },
      {
        name: "description",
        content: "Live elektriciteitsverbruik voor uw kampeerplaats.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
});

async function resolvePitchId(raw: string): Promise<number> {
  const numeric = parseInt(raw.replace(/\D/g, ""), 10);
  if (!isNaN(numeric)) return numeric;
  const result = await resolveHash(raw);
  return result.pitchId;
}

function GuestScreen() {
  const { id } = Route.useParams();
  const [status, setStatus] = useState<GuestPitchStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [connected, setConnected] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [pitchId, setPitchId] = useState<number | null>(null);
  const [resetCooldown, setResetCooldown] = useState<number>(0);
  const [resetSuccess, setResetSuccess] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let interval: ReturnType<typeof setInterval>;

    async function init() {
      try {
        const resolved = await resolvePitchId(id);
        if (cancelled) return;
        setPitchId(resolved);
        setLoading(false);
      } catch {
        if (!cancelled) {
          setError("Ongeldige QR-code of plaatsnummer");
          setLoading(false);
        }
      }
    }
    init();

    return () => { cancelled = true; };
  }, [id]);

  useEffect(() => {
    if (pitchId === null) return;
    let cancelled = false;
    let interval: ReturnType<typeof setInterval>;

    async function fetchStatus() {
      try {
        const data = await getGuestPitchStatus(pitchId!);
        if (!cancelled) {
          setStatus(data);
          setConnected(true);
          setLastUpdated(new Date());
          setLoading(false);
        }
      } catch {
        if (!cancelled) {
          setConnected(false);
          setLoading(false);
        }
      }
    }

    fetchStatus();
    interval = setInterval(fetchStatus, 5000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [pitchId]);

  useEffect(() => {
    const t = setInterval(() => {
      setLastUpdated(new Date());
    }, 5000);
    return () => clearInterval(t);
  }, []);

  // Countdown timer for reset cooldown
  useEffect(() => {
    if (resetCooldown > 0) {
      const timer = setInterval(() => {
        setResetCooldown((prev) => prev - 1);
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [resetCooldown]);

  // Clear success message after 3 seconds
  useEffect(() => {
    if (resetSuccess) {
      const timer = setTimeout(() => setResetSuccess(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [resetSuccess]);

  const handleReset = async () => {
    if (!pitchId || resetCooldown > 0) return;
    try {
      await resetPitchError(pitchId);
      setResetCooldown(60);
      setResetSuccess(true);
      // Refresh status immediately after reset
      const data = await getGuestPitchStatus(pitchId);
      setStatus(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Reset mislukt");
    }
  };

  if (loading) {
    return (
      <div className="grid min-h-screen place-items-center bg-background p-6">
        <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !status) {
    return (
      <div className="grid min-h-screen place-items-center bg-background p-6 text-center">
        <EmptyState
          icon={Zap}
          title="Plaats niet gevonden"
          description="Scan opnieuw de QR-code op uw plaats."
        />
      </div>
    );
  }

  const { pitchName, veldNaam, gewenst, maxAmperage, kwhnu, kwhtot, iverb, errorcode } = status;
  const powerOn = gewenst === 1;
  const timeSinceUpdate = Math.floor((Date.now() - lastUpdated.getTime()) / 1000);
  const canReset = errorcode === 1 && resetCooldown === 0;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="relative overflow-hidden shrink-0">
        <div
          aria-hidden
          className="absolute inset-0 -z-10"
          style={{
            background:
              "linear-gradient(180deg, color-mix(in oklab, var(--primary) 14%, transparent), transparent 80%)",
          }}
        />
        <div className="mx-auto flex max-w-md items-center justify-between px-4 pb-1 pt-3">
          <div className="flex items-center gap-1.5">
            <div className="grid h-7 w-7 place-items-center rounded-lg bg-primary text-primary-foreground">
              <Zap className="h-3.5 w-3.5" strokeWidth={2.6} />
            </div>
            <span className="text-[13.5px] font-semibold tracking-tight">BluePlug</span>
          </div>
          <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
            <TreePine className="h-3 w-3" /> Duinrand Camping
          </div>
        </div>
      </header>

      <main className="flex-1 space-y-3 px-4 pb-24 pt-4 max-w-md mx-auto w-full overflow-y-auto sm:max-w-lg md:max-w-xl lg:max-w-2xl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-[22px] font-semibold tracking-tight leading-tight">{veldNaam ? `${veldNaam} ` : ''}{pitchName}</h1>
          </div>
          <div className="flex flex-col items-end gap-1">
            {powerOn ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-success-soft px-2 py-0.5 text-[11px] font-semibold text-success">
                <span className="h-1.5 w-1.5 rounded-full bg-success" />
                Actief
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-full bg-destructive-soft px-2 py-0.5 text-[11px] font-semibold text-destructive">
                <span className="h-1.5 w-1.5 rounded-full bg-destructive" />
                Uitgeschakeld
              </span>
            )}
            <ConnectionBadge
              status={connected ? "online" : "offline"}
              label={connected ? "Verbonden" : "Offline"}
            />
          </div>
        </div>

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
                  {iverb >= 0 ? `${iverb.toFixed(1)}A` : '—'}
                </div>
              </div>
              <div className="rounded-xl bg-muted/50 p-2.5">
                <div className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                  Max Stroom
                </div>
                <div className="mt-1 text-[20px] font-semibold tabular-nums">
                  {maxAmperage}A
                </div>
              </div>
            </div>

            <div className="mt-2 flex items-center justify-between text-[11px] text-muted-foreground">
              <div className="flex items-center gap-1">
                <Wifi className="h-3 w-3" />
                {connected ? "Verbonden" : "Geen verbinding"}
              </div>
              <div className="flex items-center gap-1">
                <RefreshCw className="h-3 w-3" />
                {timeSinceUpdate < 60
                  ? `${timeSinceUpdate}s geleden`
                  : `${Math.floor(timeSinceUpdate / 60)}m geleden`}
              </div>
            </div>
          </div>
        </Card>

        <div className="grid grid-cols-2 gap-3">
          <MetricCard
            label="Vandaag"
            value={kwhnu.toFixed(2)}
            unit="kWh"
            icon={Activity}
            tone="primary"
          />
          <MetricCard
            label="Totaal"
            value={kwhtot.toFixed(2)}
            unit="kWh"
            icon={Gauge}
          />
        </div>

        <p className="text-center text-[11px] text-muted-foreground leading-tight">
          Geen login nodig · gegevens worden elke 5 seconden ververst
          {errorcode !== 0 && (
            <span className="block mt-1 text-destructive font-medium">
              Foutcode: {errorcode}
            </span>
          )}
        </p>
      </main>

      <div className="sticky bottom-0 z-20 border-t border-border bg-background/95 backdrop-blur-xl pt-2 pb-[max(env(safe-area-inset-bottom),0.75rem)] px-4 shrink-0">
        <div className="mx-auto max-w-md space-y-2">
          {canReset && (
            <button
              onClick={handleReset}
              className="bp-tap flex items-center justify-center gap-2 w-full rounded-2xl bg-destructive text-[15px] font-semibold text-destructive-foreground shadow-glow hover:bg-destructive/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring py-4"
            >
              <AlertTriangle className="h-5 w-5" />
              Stroomstoring resetten
            </button>
          )}

          {resetCooldown > 0 && (
            <div className="flex items-center justify-center gap-2 rounded-2xl bg-muted py-4">
              <RefreshCw className="h-5 w-5 animate-spin text-muted-foreground" />
              <span className="text-[15px] font-semibold text-muted-foreground">
                Wacht {resetCooldown}s voor volgende reset
              </span>
            </div>
          )}

          {resetSuccess && (
            <div className="flex items-center justify-center gap-2 rounded-2xl bg-success-soft py-4">
              <CheckCircle className="h-5 w-5 text-success" />
              <span className="text-[15px] font-semibold text-success">
                Reset gelukt
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
