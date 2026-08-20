import { Link } from "@tanstack/react-router";
import { Zap, Power, ChevronRight, Activity, Gauge, AlertTriangle } from "lucide-react";
import type { PitchSummary } from "@/lib/api";

const powerMap: Record<"on" | "off", { label: string; icon: typeof Zap; bg: string; fg: string }> = {
  on: { label: "Aan", icon: Zap, bg: "bg-success-soft", fg: "text-success" },
  off: { label: "Uit", icon: Power, bg: "bg-muted", fg: "text-muted-foreground" },
};

function formatKWh(value: number | undefined | null): string {
  if (value === undefined || value === null) return '0.00';
  return value.toFixed(2);
}

function formatAmps(value: number | undefined | null): string {
  if (value === undefined || value === null || value < 0) return '—';
  return value.toFixed(1) + ' A';
}

export function PitchCard({ pitch }: { pitch: PitchSummary }) {
  const status: "on" | "off" = pitch.gewenst === 1 ? "on" : "off";
  const c = powerMap[status];
  const Icon = c.icon;

  return (
    <Link
      to="/pitch/$id"
      params={{ id: String(pitch.pitchId) }}
      className={`group flex items-center gap-4 rounded-2xl border bg-card p-4 shadow-card hover:shadow-elevated focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-all ${
        pitch.errorcode !== 0 ? "border-destructive/40" : "border-border hover:border-primary/30"
      }`}
    >
      <div className="relative">
        <div className={`grid h-14 w-14 shrink-0 place-items-center rounded-2xl ring-1 ring-inset ${c.bg} ${c.fg} ${status === "on" ? "ring-success/20" : "ring-border"}`}>
          <Icon className="h-7 w-7" strokeWidth={2.2} />
        </div>
        {pitch.errorcode !== 0 && (
          <div className="absolute -top-1 -right-1 grid h-5 w-5 place-items-center rounded-full bg-destructive text-destructive-foreground shadow-sm">
            <AlertTriangle className="h-3 w-3" strokeWidth={2.5} />
          </div>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="truncate text-[17px] font-bold tracking-tight text-foreground">
            {pitch.veldNaam ? `${pitch.veldNaam} ` : ''}{pitch.pitchName}
          </span>
          <span className="shrink-0 rounded-md bg-muted px-2 py-0.5 text-[12px] font-semibold text-muted-foreground">
            #{pitch.pitchId}
          </span>
        </div>
        <div className="mt-1 flex items-center gap-2.5">
          <span className="text-[14px] font-medium text-muted-foreground tabular-nums">
            {formatAmps(pitch.iverb)}
          </span>
        </div>
        <div className="mt-2 grid grid-cols-2 gap-2 text-[12px]">
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Activity className="h-3 w-3" />
            <span className="tabular-nums">{formatKWh(pitch.kwhnu)} kWh</span>
          </div>
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Gauge className="h-3 w-3" />
            <span className="tabular-nums">{formatKWh(pitch.kwhtot)} kWh</span>
          </div>
        </div>
      </div>
      <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground/40 group-hover:text-muted-foreground transition-colors" />
    </Link>
  );
}

export function PitchCardSkeleton() {
  return (
    <div className="flex items-center gap-4 rounded-2xl border border-border bg-card p-4 shadow-card animate-pulse">
      <div className="h-14 w-14 shrink-0 rounded-2xl bg-muted" />
      <div className="min-w-0 flex-1 space-y-2.5">
        <div className="h-4 w-2/3 rounded bg-muted" />
        <div className="h-3.5 w-1/3 rounded bg-muted" />
      </div>
      <div className="h-5 w-5 rounded bg-muted" />
    </div>
  );
}
