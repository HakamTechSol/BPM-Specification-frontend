import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, useRef } from "react";
import { ManagerLayout } from "@/components/manager-layout";
import {
  StatusChip,
  MetricCard,
  Card,
  SectionLabel,
  ConfirmDialog,
  LoadingPitchCard,
  LoadingMetricsCard,
  SwitchRow,
} from "@/components/bp";
import { getAllPitches, triggerSync, getSettings, type PitchSummary } from "@/lib/api";
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
  Save,
  Loader2,
  AlertTriangle,
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


function PitchDetail() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const [pitch, setPitch] = useState<PitchSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [power, setPower] = useState(false);
  const [amps, setAmps] = useState<number[]>([6, 8, 10, 12, 16]);
  const [maxAmp, setMaxAmp] = useState(10);
  const [confirm, setConfirm] = useState<null | "checkout" | "checkin" | "save">(null);
  const [saving, setSaving] = useState(false);

  const initialPower = useRef(false);
  const initialMaxAmp = useRef(10);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const [pitchData, settingsData] = await Promise.all([
          getAllPitches(),
          getSettings(),
        ]);
        if (!cancelled) {
          // Load amperage options from settings
          const ampOptions = settingsData.stroominstelling.map(Number).filter((n) => !isNaN(n));
          setAmps(ampOptions.length > 0 ? ampOptions : [6, 8, 10, 12, 16]);

          const pitchId = parseInt(id.replace(/\D/g, ""), 10);
          const found = pitchData.pitches.find((p) => p.pitchId === pitchId);
          if (found) {
            setPitch(found);
            setPower(found.gewenst === 1);
            setMaxAmp(found.maxAmperage || 10);
            initialPower.current = found.gewenst === 1;
            initialMaxAmp.current = found.maxAmperage || 10;
          }
          setLoading(false);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load pitch");
          setLoading(false);
        }
      }
    }
    load();
    return () => { cancelled = true; };
  }, [id]);

  if (loading) {
    return (
      <ManagerLayout title="Laden...">
        <LoadingPitchCard />
        <div className="mt-3">
          <LoadingMetricsCard count={3} />
        </div>
      </ManagerLayout>
    );
  }

  if (error || !pitch) {
    return (
      <ManagerLayout title="Pitch niet gevonden">
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="grid h-16 w-16 place-items-center rounded-2xl bg-muted text-muted-foreground">
            <Zap className="h-8 w-8" strokeWidth={1.5} />
          </div>
          <h3 className="mt-4 text-[16px] font-semibold tracking-tight">Pitch niet gevonden</h3>
          <p className="mt-1.5 max-w-xs text-[13px] text-muted-foreground">
            Deze plaats bestaat niet of is verwijderd.
          </p>
          <Link
            to="/dashboard"
            className="bp-tap mt-5 flex h-12 items-center justify-center gap-2 rounded-xl bg-primary px-5 text-[14px] font-semibold text-primary-foreground shadow-glow"
          >
            <ChevronLeft className="h-4 w-4" /> Terug naar dashboard
          </Link>
        </div>
      </ManagerLayout>
    );
  }

  return (
    <ManagerLayout
      title={pitch.veldNaam ? `${pitch.veldNaam} ${pitch.pitchName}` : pitch.pitchName}
      subtitle={`Plaats #${pitch.pitchId}`}
      right={
        <Link
          to="/dashboard"
          className="bp-tap hidden h-12 items-center gap-1.5 rounded-xl border border-border bg-card px-3 text-[13px] font-medium text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:inline-flex"
        >
          <ChevronLeft className="h-4 w-4" /> Terug
        </Link>
      }
    >
      <div className="flex flex-col gap-3 lg:gap-4 max-w-4xl mx-auto w-full pb-32 sm:pb-24 lg:pb-20">
        <Link
          to="/dashboard"
          className="bp-tap -mt-1 mb-1 inline-flex h-9 items-center gap-1 text-[13px] font-medium text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:hidden"
        >
          <ChevronLeft className="h-4 w-4" /> Alle plaatsen
        </Link>

        {saving ? (
          <>
            <LoadingPitchCard />
            <div className="mt-3">
              <LoadingMetricsCard count={3} />
            </div>
          </>
        ) : (
          <>
            <div className="mb-1.5 flex flex-wrap items-center gap-x-2 gap-y-0.5">
              <StatusChip status={pitch.gewenst === 1 ? "on" : "off"} size="sm" />
              <span className="text-[12px] text-muted-foreground">
                {pitch.gewenst === 1 ? "Aan" : "Uit"} · Max {maxAmp}A
              </span>
            </div>

            <Card className="mt-1.5 overflow-hidden">
              <SwitchRow
                icon={Power}
                label="Elektriciteit"
                description={power ? "Stopcontact is ingeschakeld" : "Stopcontact is uit"}
                checked={power}
                onCheckedChange={setPower}
                iconBg={power ? "bg-success-soft text-success" : "bg-muted text-muted-foreground"}
              />
              <div className="border-t border-border px-3 py-1.5">
                <div className="mt-2 mb-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Maximale stroom
                </div>
                <div className="grid grid-cols-4 gap-1.5">
                  {amps.map((a) => (
                    <button
                      key={a}
                      onClick={() => setMaxAmp(a)}
                      className={`bp-tap flex h-9 flex-col items-center justify-center rounded-lg border text-[13.5px] font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                        maxAmp === a
                          ? "border-primary bg-primary text-primary-foreground shadow-glow"
                          : "border-border bg-card text-foreground hover:border-primary/40"
                      }`}
                    >
                      <span className="tabular-nums leading-none">{a}</span>
                      <span
                        className={`text-[9.5px] font-medium leading-none mt-0.5 ${
                          maxAmp === a ? "text-primary-foreground/85" : "text-muted-foreground"
                        }`}
                      >
                        Amp
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </Card>

            <SectionLabel>Verbruik</SectionLabel>
            <div className="grid grid-cols-2 gap-2 lg:gap-3">
              <MetricCard
                label="Vandaag"
                value="--"
                unit="kWh"
                icon={Activity}
                tone="primary"
              />
              <MetricCard
                label="Totaal"
                value="--"
                unit="kWh"
                icon={Gauge}
              />
            </div>
          </>
        )}
      </div>

      <div className="fixed bottom-20 lg:bottom-0 inset-x-0 lg:left-64 z-20 border-t border-border bg-background/95 backdrop-blur-xl pt-2 pb-2 px-5 lg:px-8">
        <div className="mx-auto max-w-4xl">
          {saving ? (
            <div className="grid grid-cols-2 gap-2">
              <div className="flex h-10 items-center justify-center rounded-xl bg-muted">
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              </div>
              <div className="flex h-10 items-center justify-center rounded-xl bg-muted">
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setConfirm("save")}
                className="bp-tap flex h-10 items-center justify-center gap-1.5 rounded-xl bg-primary text-[13.5px] font-semibold text-primary-foreground shadow-glow hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <Save className="h-4 w-4" /> Opslaan
              </button>
              {power ? (
                <button
                  onClick={() => setConfirm("checkout")}
                  className="bp-tap flex h-10 items-center justify-center gap-1.5 rounded-xl border border-border bg-card text-[13.5px] font-semibold text-destructive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <LogOut className="h-4 w-4" /> Uitchecken
                </button>
              ) : (
                <button
                  onClick={() => setConfirm("checkin")}
                  className="bp-tap flex h-10 items-center justify-center gap-1.5 rounded-xl bg-success text-[13.5px] font-semibold text-white shadow-sm hover:bg-success/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <LogIn className="h-4 w-4" /> Inchecken
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={confirm === "save"}
        onOpenChange={(open) => { if (!open) setConfirm(null); }}
        title="Wijzigingen opslaan?"
        description="De instellingen worden direct toegepast."
        confirmLabel="Opslaan"
        variant="default"
        icon={Save}
        onConfirm={async () => {
          setConfirm(null);
          setSaving(true);
          try {
            if (power !== initialPower.current) {
              await triggerSync({ pitchId: pitch.pitchId, action: "toggle_power" });
            }
            if (maxAmp !== initialMaxAmp.current) {
              await triggerSync({ pitchId: pitch.pitchId, action: "set_amperage", value: maxAmp });
            }
            navigate({ to: "/dashboard" });
          } catch (err) {
            console.error("Sync mislukt:", err);
            setSaving(false);
          }
        }}
      />

      <ConfirmDialog
        open={confirm === "checkout"}
        onOpenChange={(open) => { if (!open) setConfirm(null); }}
        title="Gast uitchecken?"
        description="De stroom wordt uitgeschakeld en de sessie wordt beëindigd."
        confirmLabel="Uitchecken"
        variant="destructive"
        icon={LogOut}
        onConfirm={async () => {
          setConfirm(null);
          setSaving(true);
          try {
            await triggerSync({ pitchId: pitch.pitchId, action: "set_power_state", value: 0 });
            navigate({ to: "/dashboard" });
          } catch (err) {
            console.error("Checkout mislukt:", err);
            setSaving(false);
          }
        }}
      />

      <ConfirmDialog
        open={confirm === "checkin"}
        onOpenChange={(open) => { if (!open) setConfirm(null); }}
        title="Gast inchecken?"
        description="Er start een nieuwe sessie en de stroom wordt ingeschakeld."
        confirmLabel="Inchecken"
        variant="default"
        icon={LogIn}
        onConfirm={async () => {
          setConfirm(null);
          setSaving(true);
          try {
            await triggerSync({ pitchId: pitch.pitchId, action: "set_power_state", value: 1 });
            navigate({ to: "/dashboard" });
          } catch (err) {
            console.error("Checkin mislukt:", err);
            setSaving(false);
          }
        }}
      />
    </ManagerLayout>
  );
}
