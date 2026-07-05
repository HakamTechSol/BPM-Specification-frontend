import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ManagerLayout } from "@/components/manager-layout";
import { Card, SectionLabel, ConnectionBadge, ConfirmDialog, ErrorState } from "@/components/bp";
import { Server, Wifi, Database, RefreshCw, Cpu, Activity, Clock, Cloud } from "lucide-react";

export const Route = createFileRoute("/maintenance")({
  component: MaintenancePage,
  head: () => ({
    meta: [
      { title: "Maintenance · BluePlug" },
      { name: "description", content: "System diagnostics and service controls." },
    ],
  }),
});

const services = [
  {
    icon: Server,
    label: "Server",
    status: "Operational",
    tone: "success" as const,
    meta: "99.98% uptime · 12 ms response",
  },
  {
    icon: Wifi,
    label: "Gateway connection",
    status: "Connected",
    tone: "success" as const,
    meta: "Signal: strong · 12 ms latency",
  },
  {
    icon: Database,
    label: "Database",
    status: "Healthy",
    tone: "success" as const,
    meta: "4 GB / 20 GB · 0 replication lag",
  },
  {
    icon: Cloud,
    label: "API",
    status: "Online",
    tone: "success" as const,
    meta: "v2.4.1 · 200 OK · 0 errors",
  },
  {
    icon: Cpu,
    label: "Meter bus",
    status: "Degraded",
    tone: "warning" as const,
    meta: "1 unit offline · 12 online",
  },
  {
    icon: Clock,
    label: "Last sync",
    status: "Synced",
    tone: "success" as const,
    meta: "2 seconds ago · Auto-sync every 30 s",
  },
];

function MaintenancePage() {
  const navigate = useNavigate();
  const [confirmAction, setConfirmAction] = useState<"gateway" | "database" | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (error) {
    return (
      <ManagerLayout title="Maintenance" subtitle="System diagnostics">
        <ErrorState
          title={error}
          description="A system error occurred. Try again or contact support."
          onRetry={() => setError(null)}
        />
      </ManagerLayout>
    );
  }

  return (
    <ManagerLayout title="Maintenance" subtitle="System diagnostics · Systemdiagnose">
      <Card className="p-4">
        <div className="flex items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-xl bg-success-soft text-success">
            <Activity className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <div className="text-[15px] font-semibold">All systems operating</div>
            <div className="text-[13px] text-muted-foreground">
              Laatste check (Last check) just now · Auto-refresh every 30 s
            </div>
          </div>
          <ConnectionBadge status="online" label="Live" />
        </div>
      </Card>

      <SectionLabel>Diagnostics (Diagnose)</SectionLabel>
      <div className="grid gap-3 sm:grid-cols-2">
        {services.map((s) => {
          const toneCls =
            s.tone === "success" ? "bg-success-soft text-success" : "bg-warning-soft text-warning";
          return (
            <Card key={s.label} className="p-4">
              <div className="flex items-center gap-3">
                <div className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl ${toneCls}`}>
                  <s.icon className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-[14.5px] font-semibold">{s.label}</div>
                  <div className="text-[12px] text-muted-foreground">{s.meta}</div>
                </div>
                <span className={`rounded-full px-2.5 py-1 text-[12px] font-semibold ${toneCls}`}>
                  {s.status}
                </span>
              </div>
            </Card>
          );
        })}
      </div>

      <SectionLabel>Actions (Acties)</SectionLabel>
      <div className="grid gap-3 sm:grid-cols-2">
        <button
          onClick={() => setConfirmAction("gateway")}
          className="bp-tap flex h-14 items-center justify-center gap-2 rounded-2xl border border-border bg-card text-[14px] font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <RefreshCw className="h-4 w-4" /> Restart gateway (Gateway herstarten)
        </button>
        <button
          onClick={() => setConfirmAction("database")}
          className="bp-tap flex h-14 items-center justify-center gap-2 rounded-2xl border border-border bg-card text-[14px] font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Database className="h-4 w-4" /> Re-sync database (Database synchroniseren)
        </button>
        <button className="bp-tap flex h-14 items-center justify-center gap-2 rounded-2xl border border-border bg-card text-[14px] font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:col-span-2">
          <Cpu className="h-4 w-4" /> Scan meter bus (Meterbus scannen)
        </button>
      </div>

      <ConfirmDialog
        open={confirmAction === "gateway"}
        onOpenChange={(open) => {
          if (!open) setConfirmAction(null);
        }}
        title="Restart gateway?"
        description="This will temporarily disconnect all connected meters. Guests may lose live data for up to 30 seconds."
        confirmLabel="Restart"
        variant="warning"
        icon={RefreshCw}
        onConfirm={() => setConfirmAction(null)}
      />

      <ConfirmDialog
        open={confirmAction === "database"}
        onOpenChange={(open) => {
          if (!open) setConfirmAction(null);
        }}
        title="Re-sync database?"
        description="This will re-synchronize all pitch data from the meters. Existing sessions will not be interrupted."
        confirmLabel="Re-sync"
        variant="default"
        icon={Database}
        onConfirm={() => setConfirmAction(null)}
      />
    </ManagerLayout>
  );
}
