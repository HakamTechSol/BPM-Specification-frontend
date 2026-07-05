import { createFileRoute } from "@tanstack/react-router";
import { ManagerLayout } from "@/components/manager-layout";
import { Card, SectionLabel } from "@/components/bp";
import { Server, Wifi, Database, RefreshCw, Cpu, Activity } from "lucide-react";

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
  { icon: Server, label: "Server", status: "Operational", tone: "success", meta: "99.98% uptime" },
  { icon: Wifi, label: "Gateway connection", status: "Connected", tone: "success", meta: "12 ms" },
  { icon: Database, label: "Database", status: "Healthy", tone: "success", meta: "4 GB / 20 GB" },
  { icon: Cpu, label: "Meter bus", status: "Degraded", tone: "warning", meta: "1 unit offline" },
] as const;

function MaintenancePage() {
  return (
    <ManagerLayout title="Maintenance" subtitle="System diagnostics">
      <Card className="p-4">
        <div className="flex items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-xl bg-success-soft text-success">
            <Activity className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <div className="text-[15px] font-semibold">All systems operating</div>
            <div className="text-[12.5px] text-muted-foreground">
              Last check just now · Auto-refresh every 30 s
            </div>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-success-soft px-2.5 py-1 text-[11.5px] font-semibold text-success">
            <span className="h-1.5 w-1.5 rounded-full bg-success" /> Live
          </span>
        </div>
      </Card>

      <SectionLabel>Diagnostics</SectionLabel>
      <div className="grid gap-3 sm:grid-cols-2">
        {services.map((s) => {
          const tone =
            s.tone === "success"
              ? "bg-success-soft text-success"
              : "bg-warning-soft text-warning";
          return (
            <Card key={s.label} className="p-4">
              <div className="flex items-center gap-3">
                <div className={`grid h-11 w-11 place-items-center rounded-xl ${tone}`}>
                  <s.icon className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-[14.5px] font-semibold">{s.label}</div>
                  <div className="text-[12px] text-muted-foreground">{s.meta}</div>
                </div>
                <span
                  className={`rounded-full px-2.5 py-1 text-[11.5px] font-semibold ${tone}`}
                >
                  {s.status}
                </span>
              </div>
            </Card>
          );
        })}
      </div>

      <SectionLabel>Actions</SectionLabel>
      <div className="grid gap-3 sm:grid-cols-2">
        <button className="bp-tap flex h-14 items-center justify-center gap-2 rounded-2xl border border-border bg-card text-[14px] font-semibold">
          <RefreshCw className="h-4 w-4" /> Restart gateway
        </button>
        <button className="bp-tap flex h-14 items-center justify-center gap-2 rounded-2xl border border-border bg-card text-[14px] font-semibold">
          <Database className="h-4 w-4" /> Re-sync database
        </button>
        <button className="bp-tap flex h-14 items-center justify-center gap-2 rounded-2xl border border-border bg-card text-[14px] font-semibold sm:col-span-2">
          <Cpu className="h-4 w-4" /> Scan meter bus
        </button>
      </div>
    </ManagerLayout>
  );
}
