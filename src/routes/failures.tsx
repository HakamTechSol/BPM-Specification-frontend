import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ManagerLayout } from "@/components/manager-layout";
import { Card, SectionLabel, ConnectionBadge, ConfirmDialog, EmptyState } from "@/components/bp";
import {
  AlertTriangle,
  ShieldAlert,
  Zap,
  Check,
  ChevronRight,
  WifiOff,
  ServerCrash,
  Clock,
  RefreshCw,
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

type Fail = {
  id: string;
  type: string;
  desc: string;
  pitch: string;
  pitchNumber: string;
  time: string;
  severity: "critical" | "high" | "warning";
  currentStatus: string;
};

const fails: Fail[] = [
  {
    id: "1",
    type: "Ground fault",
    desc: "Residual current tripped on socket",
    pitch: "Forest C01",
    pitchNumber: "C-01",
    time: "2 min ago",
    severity: "critical",
    currentStatus: "Socket disabled",
  },
  {
    id: "2",
    type: "Over current",
    desc: "Repeated over-current detected — guest cannot reset",
    pitch: "Dune View A13",
    pitchNumber: "A-13",
    time: "18 min ago",
    severity: "high",
    currentStatus: "Auto-locked",
  },
  {
    id: "3",
    type: "Meter offline",
    desc: "Meter has not reported for 12 minutes",
    pitch: "Orchard E01",
    pitchNumber: "E-01",
    time: "42 min ago",
    severity: "warning",
    currentStatus: "No communication",
  },
];

const sev = {
  critical: {
    bg: "bg-critical/10",
    text: "text-critical",
    ring: "ring-critical/25",
    dot: "bg-critical",
    label: "Critical",
    icon: ShieldAlert,
  },
  high: {
    bg: "bg-destructive-soft",
    text: "text-destructive",
    ring: "ring-destructive/20",
    dot: "bg-destructive",
    label: "High",
    icon: AlertTriangle,
  },
  warning: {
    bg: "bg-warning-soft",
    text: "text-warning",
    ring: "ring-warning/25",
    dot: "bg-warning",
    label: "Warning",
    icon: Zap,
  },
} as const;

function FailurePage() {
  const [resolveId, setResolveId] = useState<string | null>(null);
  const [resolved, setResolved] = useState<Set<string>>(new Set());

  const active = fails.filter((f) => !resolved.has(f.id));

  const counts = {
    critical: active.filter((f) => f.severity === "critical").length,
    high: active.filter((f) => f.severity === "high").length,
    warning: active.filter((f) => f.severity === "warning").length,
  };

  const handleResolve = () => {
    if (resolveId) {
      setResolved((prev) => new Set(prev).add(resolveId));
      setResolveId(null);
    }
  };

  return (
    <ManagerLayout
      title="Failure center"
      subtitle={`${active.length} active issues · ${resolved.size} resolved`}
    >
      <div className="grid grid-cols-3 gap-3">
        {(["critical", "high", "warning"] as const).map((s) => {
          const c = sev[s];
          return (
            <div key={s} className={`rounded-2xl p-3.5 ring-1 ring-inset ${c.bg} ${c.ring}`}>
              <div className={`text-[22px] font-semibold tabular-nums ${c.text}`}>{counts[s]}</div>
              <div className={`text-[12px] font-semibold uppercase tracking-wider ${c.text}`}>
                {c.label}
              </div>
            </div>
          );
        })}
      </div>

      {active.length === 0 ? (
        <EmptyState
          icon={ShieldAlert}
          title="All clear"
          description="No active failures. Everything is operating normally."
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
                          <span className="text-[15px] font-semibold tracking-tight">{f.type}</span>
                          <span
                            className={`rounded-full px-2 py-0.5 text-[12px] font-semibold uppercase tracking-wider ${c.bg} ${c.text}`}
                          >
                            {c.label}
                          </span>
                        </div>
                        <p className="mt-1 text-[13px] text-muted-foreground">{f.desc}</p>
                        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] text-muted-foreground">
                          <Link
                            to="/pitch/$id"
                            params={{ id: f.pitchNumber }}
                            className="inline-flex items-center gap-1 rounded-md bg-muted px-1.5 py-0.5 font-medium text-foreground hover:bg-primary-soft hover:text-primary"
                          >
                            {f.pitch}
                          </Link>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {f.time}
                          </span>
                          <span className="flex items-center gap-1">
                            <Zap className="h-3 w-3" />
                            {f.currentStatus}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="mt-4 grid grid-cols-2 gap-2">
                      <Link
                        to="/pitch/$id"
                        params={{ id: f.pitchNumber }}
                        className="bp-tap flex h-12 items-center justify-center gap-2 rounded-xl border border-border bg-card text-[13.5px] font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        View pitch <ChevronRight className="h-3.5 w-3.5" />
                      </Link>
                      <button
                        onClick={() => setResolveId(f.id)}
                        className="bp-tap flex h-12 items-center justify-center gap-2 rounded-xl bg-primary text-[13.5px] font-semibold text-primary-foreground shadow-glow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        <Check className="h-4 w-4" /> Resolve
                      </button>
                    </div>
                  </div>
                </Card>
              </li>
            );
          })}
        </ul>
      )}

      <ConfirmDialog
        open={resolveId !== null}
        onOpenChange={(open) => {
          if (!open) setResolveId(null);
        }}
        title="Resolve failure?"
        description="Mark this failure as resolved. The pitch will return to normal operation."
        confirmLabel="Resolve"
        variant="default"
        icon={Check}
        onConfirm={handleResolve}
      />
    </ManagerLayout>
  );
}
