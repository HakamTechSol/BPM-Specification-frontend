import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ManagerLayout } from "@/components/manager-layout";
import { Card, SectionLabel, ConfirmDialog, EmptyState, ErrorState } from "@/components/bp";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  getFailures,
  resolveFailure,
  resolveAllFailures,
  type FailureRecord,
} from "@/lib/api";
import {
  AlertTriangle,
  ShieldAlert,
  Zap,
  CircleAlert,
  Check,
  ChevronRight,
  Clock,
  RefreshCw,
  Loader2,
  CheckCircle2,
} from "lucide-react";

export const Route = createFileRoute("/failures")({
  component: FailurePage,
  head: () => ({
    meta: [
      { title: "Failures · BluePlug" },
      { name: "description", content: "Active hardware and connection failures." },
    ],
  }),
});

const sev = {
  critical: {
    bg: "bg-critical/10",
    text: "text-critical",
    ring: "ring-critical/25",
    dot: "bg-critical",
    label: "Kritiek",
    icon: ShieldAlert,
  },
  high: {
    bg: "bg-destructive-soft",
    text: "text-destructive",
    ring: "ring-destructive/20",
    dot: "bg-destructive",
    label: "Hoog",
    icon: AlertTriangle,
  },
  warning: {
    bg: "bg-warning-soft",
    text: "text-warning",
    ring: "ring-warning/25",
    dot: "bg-warning",
    label: "Waarschuwing",
    icon: CircleAlert,
  },
} as const;

function formatTimeAgo(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  if (diffSec < 60) return `${diffSec}s geleden`;
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin} min geleden`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `${diffH} uur geleden`;
  const diffD = Math.floor(diffH / 24);
  return `${diffD} dag(en) geleden`;
}

const FAILURE_LABELS: Record<number, string> = {
  2: "Actor offline",
  4: "Statusafwijking",
  11: "Vals verbruik",
  13: "Meter offline",
};

function failureTypeLabel(code: number): string {
  return FAILURE_LABELS[code] ?? `Foutcode ${code}`;
}

function FailurePage() {
  const [failures, setFailures] = useState<FailureRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [resolveId, setResolveId] = useState<number | null>(null);
  const [resolveAllOpen, setResolveAllOpen] = useState(false);
  const [resolving, setResolving] = useState(false);
  const [totalHistoricalCount, setTotalHistoricalCount] = useState(0);

  async function fetchFailures() {
    try {
      const data = await getFailures();
      setFailures(data.failures);
      setTotalHistoricalCount(data.totalHistoricalCount);
      setLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Kan storingen niet laden");
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchFailures();
  }, []);

  const active = failures.filter((f) => f.resolvedAt === null);
  const resolved = failures.filter((f) => f.resolvedAt !== null);

  const counts = {
    critical: failures.filter((f) => f.severity === "critical").length,
    high: failures.filter((f) => f.severity === "high").length,
    warning: failures.filter((f) => f.severity === "warning").length,
  };

  async function handleResolve() {
    if (resolveId === null) return;
    setResolving(true);
    try {
      await resolveFailure(resolveId);
      setResolveId(null);
      await fetchFailures();
    } catch {
      // keep dialog open on error — user can retry
    } finally {
      setResolving(false);
    }
  }

  async function handleResolveAll() {
    setResolving(true);
    try {
      await resolveAllFailures();
      setResolveAllOpen(false);
      await fetchFailures();
    } catch {
      // keep dialog open on error
    } finally {
      setResolving(false);
    }
  }

  if (loading) {
    return (
      <ManagerLayout title="Storingscentrum" subtitle="Laden..." right={<ThemeToggle />}>
        <div className="grid grid-cols-3 gap-3">
          {(["critical", "high", "warning"] as const).map((s) => (
            <div key={s} className="animate-pulse rounded-2xl p-3.5 ring-1 ring-inset bg-muted/30 ring-border">
              <div className="h-6 w-8 rounded bg-muted" />
              <div className="mt-1 h-3 w-16 rounded bg-muted" />
            </div>
          ))}
        </div>
        <div className="mt-5 space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="animate-pulse rounded-2xl border border-border bg-card p-4">
              <div className="flex items-start gap-3">
                <div className="h-11 w-11 shrink-0 rounded-xl bg-muted" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-1/3 rounded bg-muted" />
                  <div className="h-3 w-2/3 rounded bg-muted" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </ManagerLayout>
    );
  }

  if (error) {
    return (
      <ManagerLayout title="Storingscentrum" right={<ThemeToggle />}>
        <ErrorState
          title={error}
          description="Kan storingen niet laden. Controleer de verbinding."
          onRetry={() => { setError(null); setLoading(true); fetchFailures(); }}
        />
      </ManagerLayout>
    );
  }

  return (
    <ManagerLayout
      title="Storingscentrum"
      subtitle={`${active.length} actief · ${resolved.length} recent${totalHistoricalCount > 0 ? ` · ${totalHistoricalCount} totaal` : ""}`}
      right={
        <div className="flex items-center gap-2">
          {active.length > 0 && (
            <button
              onClick={() => setResolveAllOpen(true)}
              className="bp-tap flex h-9 items-center gap-1.5 rounded-lg bg-destructive px-3 text-[13px] font-semibold text-destructive-foreground hover:bg-destructive/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <CheckCircle2 className="h-3.5 w-3.5" /> Alles oplossen
            </button>
          )}
          <ThemeToggle />
        </div>
      }
    >
      {/* Severity counts */}
      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        {(["critical", "high", "warning"] as const).map((s) => {
          const c = sev[s];
          return (
            <div key={s} className={`overflow-hidden rounded-2xl p-3 sm:p-3.5 ring-1 ring-inset ${c.bg} ${c.ring}`}>
              <div className={`text-[22px] font-semibold tabular-nums ${c.text}`}>{counts[s]}</div>
              <div className={`text-[11px] sm:text-[12px] font-semibold uppercase tracking-wider ${c.text} truncate`}>
                {c.label}
              </div>
            </div>
          );
        })}
      </div>

      {/* Active failures */}
      {active.length === 0 ? (
        <EmptyState
          icon={ShieldAlert}
          title="Geen storingen"
          description="Alle systemen werken normaal. Geen actieve storingen."
        />
      ) : (
        <ul className="mt-5 space-y-3">
          {active.map((f) => {
            const c = sev[f.severity];
            const Icon = c.icon;
            return (
              <li key={f.id}>
                <Card className="overflow-hidden">
                  <div className={`h-1 w-full ${c.dot}`} />
                  <div className="p-4">
                    <div className="flex items-start gap-3">
                      <div
                        className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl ring-1 ring-inset ${c.bg} ${c.text} ${c.ring}`}
                      >
                        <Icon className="h-5 w-5" strokeWidth={2.3} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-[15px] font-semibold tracking-tight">
                            {failureTypeLabel(f.failureCode)}
                          </span>
                          <span
                            className={`rounded-full px-2 py-0.5 text-[12px] font-semibold uppercase tracking-wider ${c.bg} ${c.text}`}
                          >
                            {c.label}
                          </span>
                        </div>
                        <p className="mt-1 text-[13px] text-muted-foreground">{f.description}</p>
                        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] text-muted-foreground">
                          <Link
                            to="/pitch/$id"
                            params={{ id: String(f.pitchId) }}
                            className="inline-flex items-center gap-1 rounded-md bg-muted px-1.5 py-0.5 font-medium text-foreground hover:bg-primary-soft hover:text-primary"
                          >
                            {f.pitchName} (#{f.pitchId})
                          </Link>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formatTimeAgo(f.occurredAt)}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="mt-4 grid grid-cols-2 gap-2">
                      <Link
                        to="/pitch/$id"
                        params={{ id: String(f.pitchId) }}
                        className="bp-tap flex h-12 items-center justify-center gap-2 rounded-xl border border-border bg-card text-[13.5px] font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        Bekijk plaats <ChevronRight className="h-3.5 w-3.5" />
                      </Link>
                      <button
                        onClick={() => setResolveId(f.id)}
                        className="bp-tap flex h-12 items-center justify-center gap-2 rounded-xl bg-primary text-[13.5px] font-semibold text-primary-foreground shadow-glow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        <Check className="h-4 w-4" /> Oplossen
                      </button>
                    </div>
                  </div>
                </Card>
              </li>
            );
          })}
        </ul>
      )}

      {/* Resolved failures */}
      {resolved.length > 0 && (
        <>
          <SectionLabel>Opgeloste storingen ({resolved.length})</SectionLabel>
          <ul className="space-y-2 opacity-60">
            {resolved.map((f) => {
              const c = sev[f.severity];
              return (
                <li key={f.id}>
                  <Card className="p-3">
                    <div className="flex items-center gap-3">
                      <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-success-soft text-success">
                        <Check className="h-4 w-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-[13px] font-medium text-foreground">
                          {failureTypeLabel(f.failureCode)} — {f.pitchName}
                        </div>
                        <div className="text-[11px] text-muted-foreground">
                          Opgelost {f.resolvedAt ? formatTimeAgo(f.resolvedAt) : ""}
                        </div>
                      </div>
                    </div>
                  </Card>
                </li>
              );
            })}
          </ul>
        </>
      )}

      {/* Confirm: single resolve */}
      <ConfirmDialog
        open={resolveId !== null}
        onOpenChange={(open) => {
          if (!open) setResolveId(null);
        }}
        title="Storing oplossen?"
        description="De storing wordt gemarkeerd als opgelost. Het foutcode in de gegevens-tabel wordt teruggezet naar 0."
        confirmLabel={resolving ? "Bezig..." : "Oplossen"}
        variant="default"
        icon={Check}
        onConfirm={handleResolve}
      />

      {/* Confirm: resolve all */}
      <ConfirmDialog
        open={resolveAllOpen}
        onOpenChange={(open) => {
          if (!open) setResolveAllOpen(false);
        }}
        title="Alle storingen oplossen?"
        description={`Hiermee worden ${active.length} actieve storingen opgelost en de foutcodes voor alle betreffende plaatsen gereset.`}
        confirmLabel={resolving ? "Bezig..." : "Alles oplossen"}
        variant="warning"
        icon={CheckCircle2}
        onConfirm={handleResolveAll}
      />
    </ManagerLayout>
  );
}
