import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ManagerLayout } from "@/components/manager-layout";
import { StatusChip, StatusIcon } from "@/components/bp";
import { pitches } from "@/lib/pitches";
import { ChevronRight, Search, Zap, Activity, AlertTriangle, Filter } from "lucide-react";

export const Route = createFileRoute("/dashboard")({
  component: Dashboard,
  head: () => ({
    meta: [
      { title: "Pitches · BluePlug" },
      { name: "description", content: "Live overview of every pitch on your campsite." },
    ],
  }),
});

const filters = ["All", "On", "Warning", "Off", "Failure"] as const;

function Dashboard() {
  const [filter, setFilter] = useState<(typeof filters)[number]>("All");

  const stats = useMemo(() => {
    const on = pitches.filter((p) => p.status === "on").length;
    const warn = pitches.filter((p) => p.status === "warning").length;
    const fail = pitches.filter((p) => p.status === "critical").length;
    const kwh = pitches.reduce((s, p) => s + p.todayKwh, 0);
    return { on, warn, fail, kwh };
  }, []);

  const visible = pitches.filter((p) => {
    if (filter === "All") return true;
    if (filter === "On") return p.status === "on";
    if (filter === "Warning") return p.status === "warning";
    if (filter === "Off") return p.status === "off" || p.status === "inactive";
    if (filter === "Failure") return p.status === "critical";
    return true;
  });

  return (
    <ManagerLayout
      title="Duinrand Camping"
      subtitle="10 pitches · Live status"
      right={
        <button className="bp-tap grid h-10 w-10 place-items-center rounded-xl border border-border bg-card">
          <Search className="h-4 w-4" />
        </button>
      }
    >
      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard icon={Zap} tone="success" value={stats.on} label="Powered" />
        <StatCard icon={AlertTriangle} tone="warning" value={stats.warn} label="Warnings" />
        <StatCard icon={AlertTriangle} tone="danger" value={stats.fail} label="Failures" />
        <StatCard
          icon={Activity}
          tone="primary"
          value={stats.kwh.toFixed(1)}
          label="Today (kWh)"
        />
      </div>

      {/* Filter */}
      <div className="mt-6 -mx-5 flex items-center gap-2 overflow-x-auto px-5 pb-1 lg:mx-0 lg:px-0">
        <div className="flex items-center gap-1 rounded-xl bg-secondary p-1">
          {filters.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`bp-tap whitespace-nowrap rounded-lg px-3.5 py-2 text-[13px] font-medium ${
                filter === f
                  ? "bg-card text-foreground shadow-card"
                  : "text-muted-foreground"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
        <button className="bp-tap ml-auto hidden h-9 items-center gap-1.5 rounded-lg border border-border bg-card px-3 text-[13px] font-medium text-muted-foreground sm:inline-flex">
          <Filter className="h-3.5 w-3.5" /> Sort
        </button>
      </div>

      {/* Pitch list */}
      <ul className="mt-3 space-y-2">
        {visible.map((p) => (
          <li key={p.id}>
            <Link
              to="/pitch/$id"
              params={{ id: p.id }}
              className="bp-tap flex items-center gap-3.5 rounded-2xl border border-border bg-card p-3.5 shadow-card hover:border-primary/30 hover:shadow-elevated sm:p-4"
            >
              <StatusIcon status={p.status} className="h-12 w-12 shrink-0 sm:h-14 sm:w-14" />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="truncate text-[15px] font-semibold tracking-tight">
                    {p.name}
                  </span>
                  <span className="shrink-0 rounded-md bg-muted px-1.5 py-0.5 text-[10.5px] font-medium text-muted-foreground">
                    {p.number}
                  </span>
                </div>
                <div className="mt-0.5 flex items-center gap-1.5 text-[12.5px] text-muted-foreground">
                  <StatusChip status={p.status} size="sm" />
                  {p.guest && <span className="truncate">· {p.guest}</span>}
                </div>
                <div className="mt-2 flex items-center gap-4 text-[12px] tabular-nums text-muted-foreground">
                  <span>
                    <b className="font-semibold text-foreground">
                      {p.currentAmp.toFixed(1)}
                    </b>
                    <span className="ml-0.5">/ {p.maxAmp} A</span>
                  </span>
                  <span>
                    <b className="font-semibold text-foreground">
                      {p.todayKwh.toFixed(1)}
                    </b>
                    <span className="ml-0.5">kWh today</span>
                  </span>
                  <span className="hidden sm:inline">
                    <b className="font-semibold text-foreground">
                      {p.totalKwh.toFixed(1)}
                    </b>
                    <span className="ml-0.5">kWh total</span>
                  </span>
                </div>
              </div>
              <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground" />
            </Link>
          </li>
        ))}
      </ul>
    </ManagerLayout>
  );
}

function StatCard({
  icon: Icon,
  value,
  label,
  tone,
}: {
  icon: typeof Zap;
  value: number | string;
  label: string;
  tone: "primary" | "success" | "warning" | "danger";
}) {
  const t = {
    primary: "bg-primary-soft text-primary",
    success: "bg-success-soft text-success",
    warning: "bg-warning-soft text-warning",
    danger: "bg-destructive-soft text-destructive",
  }[tone];
  return (
    <div className="rounded-2xl border border-border bg-card p-3.5 shadow-card">
      <div className={`grid h-8 w-8 place-items-center rounded-lg ${t}`}>
        <Icon className="h-4 w-4" strokeWidth={2.4} />
      </div>
      <div className="mt-2.5 text-[22px] font-semibold tracking-tight tabular-nums">
        {value}
      </div>
      <div className="text-[11.5px] font-medium text-muted-foreground">{label}</div>
    </div>
  );
}
