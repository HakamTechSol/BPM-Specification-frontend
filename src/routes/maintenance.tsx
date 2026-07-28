import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ManagerLayout } from "@/components/manager-layout";
import { Card, SectionLabel, ConfirmDialog, EmptyState, ErrorState } from "@/components/bp";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  getAllPitches,
  resolveAllFailures,
  testSwitches,
  type PitchSummary,
} from "@/lib/api";
import {
  AlertTriangle,
  ShieldAlert,
  Zap,
  Cpu,
  CheckCircle2,
  Loader2,
  Check,
  X,
  ChevronDown,
} from "lucide-react";

export const Route = createFileRoute("/maintenance")({
  component: MaintenancePage,
  head: () => ({
    meta: [
      { title: "Maintenance · BluePlug" },
      { name: "description", content: "System diagnostics and service controls." },
    ],
  }),
});

type DialogState =
  | null
  | { type: "reset-failures" }
  | { type: "test-switches"; selectedPitchId: number | null };

type FeedbackState =
  | null
  | { type: "success"; message: string }
  | { type: "error"; message: string };

function MaintenancePage() {
  const [pitches, setPitches] = useState<PitchSummary[]>([]);
  const [loadingPitches, setLoadingPitches] = useState(true);
  const [dialog, setDialog] = useState<DialogState>(null);
  const [working, setWorking] = useState(false);
  const [feedback, setFeedback] = useState<FeedbackState>(null);
  const [pageError, setPageError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const data = await getAllPitches();
        if (!cancelled) {
          setPitches(data.pitches);
          setLoadingPitches(false);
        }
      } catch (err) {
        if (!cancelled) {
          setPageError(err instanceof Error ? err.message : "Kan plaatsen niet laden");
          setLoadingPitches(false);
        }
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!feedback) return;
    const t = setTimeout(() => setFeedback(null), 5000);
    return () => clearTimeout(t);
  }, [feedback]);

  if (pageError) {
    return (
      <ManagerLayout title="Onderhoud" subtitle="Systeemdiagnose">
        <ErrorState
          title={pageError}
          description="Kan pitch-gegevens niet laden. Controleer de verbinding."
          onRetry={() => { setPageError(null); setLoadingPitches(true); window.location.reload(); }}
        />
      </ManagerLayout>
    );
  }

  async function handleResetFailures() {
    setWorking(true);
    try {
      const result = await resolveAllFailures();
      setDialog(null);
      if (result.resolved === 0) {
        setFeedback({ type: "success", message: "Geen actieve storingen om op te lossen." });
      } else {
        setFeedback({ type: "success", message: `${result.resolved} storing(en) opgelost voor ${result.pitchesAffected.length} plaats(en).` });
      }
    } catch (err) {
      setFeedback({ type: "error", message: err instanceof Error ? err.message : "Actie mislukt" });
    } finally {
      setWorking(false);
    }
  }

  async function handleTestSwitches() {
    if (dialog?.type !== "test-switches" || dialog.selectedPitchId === null) return;
    setWorking(true);
    try {
      const result = await testSwitches(dialog.selectedPitchId);
      setDialog(null);
      setFeedback({
        type: result.success ? "success" : "error",
        message: result.message,
      });
    } catch (err) {
      setFeedback({ type: "error", message: err instanceof Error ? err.message : "Actie mislukt" });
    } finally {
      setWorking(false);
    }
  }

  const firstPitchId = pitches.length > 0 ? pitches[0].pitchId : null;

  return (
    <ManagerLayout title="Onderhoud" subtitle="Systeemdiagnose" right={<ThemeToggle />}>
      {/* Feedback banner */}
      {feedback && (
        <div
          className={`flex items-center gap-2 rounded-xl px-4 py-3 text-[13px] font-medium ${
            feedback.type === "success"
              ? "bg-success-soft text-success"
              : "bg-destructive-soft text-destructive"
          }`}
        >
          {feedback.type === "success" ? (
            <Check className="h-4 w-4 shrink-0" />
          ) : (
            <AlertTriangle className="h-4 w-4 shrink-0" />
          )}
          {feedback.message}
        </div>
      )}

      <SectionLabel>Acties</SectionLabel>
      <div className="grid gap-3 sm:grid-cols-2">
        {/* Reset failures */}
        <button
          onClick={() => setDialog({ type: "reset-failures" })}
          className="bp-tap flex items-center justify-center w-full py-3.5 px-4 min-h-[3.5rem] gap-2 rounded-2xl border border-border bg-card text-[14px] font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <CheckCircle2 className="h-4 w-4 shrink-0" /> Storingen oplossen
        </button>

        {/* Test switches */}
        <button
          onClick={() => setDialog({ type: "test-switches", selectedPitchId: firstPitchId })}
          disabled={loadingPitches || pitches.length === 0}
          className="bp-tap flex items-center justify-center w-full py-3.5 px-4 min-h-[3.5rem] gap-2 rounded-2xl border border-border bg-card text-[14px] font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
        >
          <Cpu className="h-4 w-4 shrink-0" /> Schakelaars testen
        </button>
      </div>

      {/* Confirm: Reset failures */}
      <ConfirmDialog
        open={dialog?.type === "reset-failures"}
        onOpenChange={(open) => { if (!open) setDialog(null); }}
        title="Alle storingen oplossen?"
        description="Hiermee worden alle actieve storingen opgelost en de foutcodes voor alle betreffende plaatsen gereset."
        confirmLabel={working ? "Bezig..." : "Alles oplossen"}
        variant="warning"
        icon={CheckCircle2}
        onConfirm={handleResetFailures}
      />

      {/* Confirm: Test switches */}
      <ConfirmDialog
        open={dialog?.type === "test-switches"}
        onOpenChange={(open) => { if (!open) setDialog(null); }}
        title="Schakelaars testen?"
        description="Zend een testcommando naar de EIB gateway voor de geselecteerde plaats. De gewenste staat wordt niet gewijzigd."
        confirmLabel={working ? "Bezig..." : "Testen"}
        variant="default"
        icon={Cpu}
        onConfirm={handleTestSwitches}
      />

      {/* Pitch selector — rendered inside confirm dialogs via portal-style approach.
          Since ConfirmDialog doesn't support custom content, we use a separate
          inline dialog for the pitch selectors. */}

      {/* Test switches — pitch selector */}
      {dialog?.type === "test-switches" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm rounded-3xl bg-background p-6 shadow-xl">
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-primary-soft text-primary mx-auto">
              <Cpu className="h-6 w-6" />
            </div>
            <h3 className="mt-4 text-center text-[17px] font-semibold tracking-tight">
              Schakelaars testen
            </h3>
            <p className="mt-2 text-center text-[13px] text-muted-foreground">
              Zend een testcommando naar de EIB gateway. De gewenste staat wordt niet gewijzigd.
            </p>
            <select
              value={dialog.selectedPitchId ?? ""}
              onChange={(e) => setDialog({ type: "test-switches", selectedPitchId: Number(e.target.value) })}
              className="mt-4 h-12 w-full rounded-xl border border-input bg-card px-3 text-[14px] font-medium outline-none focus:ring-2 focus:ring-ring"
            >
              {pitches.map((p) => (
                <option key={p.pitchId} value={p.pitchId}>
                  {p.pitchName} (#{p.pitchId})
                </option>
              ))}
            </select>
            <div className="mt-5 grid grid-cols-2 gap-2">
              <button
                onClick={() => setDialog(null)}
                className="bp-tap h-12 rounded-xl border border-border bg-card text-[14px] font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                Annuleren
              </button>
              <button
                onClick={handleTestSwitches}
                disabled={working || dialog.selectedPitchId === null}
                className="bp-tap h-12 rounded-xl bg-primary text-[14px] font-semibold text-primary-foreground shadow-glow hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60"
              >
                {working ? <Loader2 className="h-4 w-4 animate-spin mx-auto" /> : "Testen"}
              </button>
            </div>
          </div>
        </div>
      )}
    </ManagerLayout>
  );
}
