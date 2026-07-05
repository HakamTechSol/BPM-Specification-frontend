import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ManagerLayout } from "@/components/manager-layout";
import { StatusChip, StatusIcon, ConnectionBadge, LoadingCard, EmptyState } from "@/components/bp";
import { pitches } from "@/lib/pitches";
import {
  ChevronRight,
  Search,
  Zap,
  Activity,
  AlertTriangle,
  Filter,
  Wifi,
  Database,
  RefreshCw,
} from "lucide-react";

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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [gatewayOnline, setGatewayOnline] = useState(true);
  const [dbOnline, setDbOnline] = useState(true);

  const stats = useMemo(() => {
    const on = pitches.filter((p) =>
      ["on", "in-use", "remote-on", "always-on"].includes(p.status),
    ).length;
    const warn = pitches.filter((p) => ["warning", "error"].includes(p.status)).length;
    const fail = pitches.filter((p) => ["critical", "system-error"].includes(p.status)).length;
    const kwh = pitches.reduce((s, p) => s + p.todayKwh, 0);
    const occupied = pitches.filter((p) => p.checkedIn).length;
    const total = pitches.length;
    return { on, warn, fail, kwh, occupied, total };
  }, []);

  const visible = pitches.filter((p) => {
    if (filter === "All") return true;
    if (filter === "On") return ["on", "in-use", "remote-on", "always-on"].includes(p.status);
    if (filter === "Warning") return ["warning", "error"].includes(p.status);
    if (filter === "Off") return ["off", "inactive", "empty", "remote-off"].includes(p.status);
    if (filter === "Failure") return ["critical", "system-error"].includes(p.status);
    return true;
  });

  if (error) {
    return (
      <ManagerLayout title="Duinrand Camping" subtitle="Connection lost">
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="grid h-16 w-16 place-items-center rounded-2xl bg-destructive-soft text-destructive">
            <AlertTriangle className="h-8 w-8" strokeWidth={1.5} />
          </div>
          <h3 className="mt-4 text-[16px] font-semibold tracking-tight">{error}</h3>
          <p className="mt-1.5 max-w-xs text-[13px] text-muted-foreground">
            Could not load pitch data.
          </p>
          <button
            onClick={() => setError(null)}
            className="bp-tap mt-5 flex h-12 items-center justify-center gap-2 rounded-xl bg-primary px-5 text-[14px] font-semibold text-primary-foreground shadow-glow"
          >
            <RefreshCw className="h-4 w-4" /> Try again
          </button>
        </div>
      </ManagerLayout>
    );
  }

  return (
    <ManagerLayout
      title="Duinrand Camping"
      subtitle={`${stats.total} pitches · ${stats.occupied} bezet (occupied)`}
      right={
        <div className="flex shrink-0 items-center gap-2">
          <div className="hidden sm:flex items-center gap-2">
            <ConnectionBadge
              status={gatewayOnline ? "online" : "offline"}
              label={gatewayOnline ? "Gateway" : "Offline"}
            />
            <ConnectionBadge
              status={dbOnline ? "online" : "offline"}
              label={dbOnline ? "Database" : "Offline"}
            />
          </div>
          <button
            onClick={() => setLoading(true)}
            className="bp-tap grid h-11 w-11 place-items-center rounded-xl border border-border bg-card"
            aria-label="Search pitches"
          >
            <Search className="h-4 w-4" />
          </button>
        </div>
      }
    >
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-2xl border border-border bg-card p-3.5 shadow-card">
          <div className="grid h-8 w-8 place-items-center rounded-lg bg-success-soft text-success">
            <Zap className="h-4 w-4" strokeWidth={2.4} />
          </div>
          <div className="mt-2.5 text-[22px] font-semibold tracking-tight tabular-nums">
            {stats.on}
          </div>
          <div className="text-[12px] font-medium text-muted-foreground">Powered</div>
        </div>
        <div className="rounded-2xl border border-border bg-card p-3.5 shadow-card">
          <div className="grid h-8 w-8 place-items-center rounded-lg bg-warning-soft text-warning">
            <AlertTriangle className="h-4 w-4" strokeWidth={2.4} />
          </div>
          <div className="mt-2.5 text-[22px] font-semibold tracking-tight tabular-nums">
            {stats.warn}
          </div>
          <div className="text-[12px] font-medium text-muted-foreground">Warnings</div>
        </div>
        <div className="rounded-2xl border border-border bg-card p-3.5 shadow-card">
          <div className="grid h-8 w-8 place-items-center rounded-lg bg-destructive-soft text-destructive">
            <AlertTriangle className="h-4 w-4" strokeWidth={2.4} />
          </div>
          <div className="mt-2.5 text-[22px] font-semibold tracking-tight tabular-nums">
            {stats.fail}
          </div>
          <div className="text-[12px] font-medium text-muted-foreground">Failures</div>
        </div>
        <div className="rounded-2xl border border-border bg-card p-3.5 shadow-card">
          <div className="grid h-8 w-8 place-items-center rounded-lg bg-primary-soft text-primary">
            <Activity className="h-4 w-4" strokeWidth={2.4} />
          </div>
          <div className="mt-2.5 text-[22px] font-semibold tracking-tight tabular-nums">
            {stats.kwh.toFixed(1)}
          </div>
          <div className="text-[12px] font-medium text-muted-foreground">Today (kWh)</div>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-4 gap-3">
        <div className="col-span-4 flex items-center gap-3 rounded-2xl border border-border bg-card p-3 shadow-card sm:col-span-4">
          <div
            className={`grid h-9 w-9 place-items-center rounded-lg ${gatewayOnline ? "bg-success-soft text-success" : "bg-destructive-soft text-destructive"}`}
          >
            <Wifi className="h-4 w-4" strokeWidth={2.4} />
          </div>
          <div className="flex-1">
            <div className="text-[13px] font-semibold">Gateway</div>
            <div className="text-[12px] text-muted-foreground">
              {gatewayOnline ? "Online · 12 ms" : "Offline"}
            </div>
          </div>
          <ConnectionBadge
            status={gatewayOnline ? "online" : "offline"}
            label={gatewayOnline ? "Connected" : "Disconnected"}
          />
        </div>
        <div className="col-span-4 flex items-center gap-3 rounded-2xl border border-border bg-card p-3 shadow-card sm:col-span-4">
          <div
            className={`grid h-9 w-9 place-items-center rounded-lg ${dbOnline ? "bg-success-soft text-success" : "bg-destructive-soft text-destructive"}`}
          >
            <Database className="h-4 w-4" strokeWidth={2.4} />
          </div>
          <div className="flex-1">
            <div className="text-[13px] font-semibold">Database</div>
            <div className="text-[12px] text-muted-foreground">
              {dbOnline ? "Healthy · 4 GB / 20 GB" : "Offline"}
            </div>
          </div>
          <ConnectionBadge
            status={dbOnline ? "online" : "offline"}
            label={dbOnline ? "Connected" : "Disconnected"}
          />
        </div>
      </div>

      <div className="mt-6 -mx-5 flex items-center gap-2 overflow-x-auto px-5 pb-1 lg:mx-0 lg:px-0">
        <div className="flex items-center gap-1 rounded-xl bg-secondary p-1">
          {filters.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`bp-tap whitespace-nowrap rounded-lg px-3.5 py-[11px] text-[13px] font-medium min-h-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                filter === f ? "bg-card text-foreground shadow-card" : "text-muted-foreground"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
        <button className="bp-tap ml-auto flex h-11 items-center gap-1.5 rounded-lg border border-border bg-card px-3 text-[13px] font-medium text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
          <Filter className="h-3.5 w-3.5" /> Sort
        </button>
      </div>

      {loading ? (
        <LoadingCard rows={3} />
      ) : visible.length === 0 ? (
        <EmptyState
          icon={Zap}
          title="No pitches found"
          description={`No pitches match the "${filter}" filter. Try a different filter.`}
        />
      ) : (
        <ul className="mt-3 space-y-2">
          {visible.map((p) => (
            <li key={p.id}>
              <Link
                to="/pitch/$id"
                params={{ id: p.id }}
                className="bp-tap flex items-center gap-3.5 rounded-2xl border border-border bg-card p-3.5 shadow-card hover:border-primary/30 hover:shadow-elevated focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:p-4"
              >
                <StatusIcon status={p.status} className="h-12 w-12 shrink-0 sm:h-14 sm:w-14" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="truncate text-[15px] font-semibold tracking-tight">
                      {p.name}
                    </span>
                    <span className="shrink-0 rounded-md bg-muted px-1.5 py-0.5 text-[12px] font-medium text-muted-foreground">
                      {p.number}
                    </span>
                  </div>
                  <div className="mt-0.5 flex items-center gap-1.5 text-[13px] text-muted-foreground">
                    <StatusChip status={p.status} size="sm" />
                    {p.guest && <span className="truncate">· {p.guest}</span>}
                  </div>
                  <div className="mt-2 flex items-center gap-4 text-[12px] tabular-nums text-muted-foreground">
                    <span>
                      <b className="font-semibold text-foreground">{p.currentAmp.toFixed(1)}</b>
                      <span className="ml-0.5">/ {p.maxAmp} A</span>
                    </span>
                    <span>
                      <b className="font-semibold text-foreground">{p.todayKwh.toFixed(1)}</b>
                      <span className="ml-0.5">kWh vandaag (today)</span>
                    </span>
                    <span className="hidden sm:inline">
                      <b className="font-semibold text-foreground">{p.totalKwh.toFixed(1)}</b>
                      <span className="ml-0.5">kWh totaal</span>
                    </span>
                  </div>
                </div>
                <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground" />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </ManagerLayout>
  );
}
