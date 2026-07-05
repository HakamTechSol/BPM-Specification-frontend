import type { ReactNode } from "react";
import { Zap, Power, AlertTriangle, Radio, MinusCircle, ShieldAlert } from "lucide-react";

export type PitchStatus = "on" | "off" | "warning" | "remote" | "inactive" | "critical";

const map: Record<
  PitchStatus,
  { label: string; icon: typeof Zap; bg: string; fg: string; ring: string; dot: string }
> = {
  on: {
    label: "Powered",
    icon: Zap,
    bg: "bg-success-soft",
    fg: "text-success",
    ring: "ring-success/20",
    dot: "bg-success",
  },
  off: {
    label: "Off",
    icon: Power,
    bg: "bg-destructive-soft",
    fg: "text-destructive",
    ring: "ring-destructive/20",
    dot: "bg-destructive",
  },
  warning: {
    label: "Warning",
    icon: AlertTriangle,
    bg: "bg-warning-soft",
    fg: "text-warning",
    ring: "ring-warning/25",
    dot: "bg-warning",
  },
  remote: {
    label: "Remote",
    icon: Radio,
    bg: "bg-info-soft",
    fg: "text-info",
    ring: "ring-info/20",
    dot: "bg-info",
  },
  inactive: {
    label: "Inactive",
    icon: MinusCircle,
    bg: "bg-muted",
    fg: "text-muted-foreground",
    ring: "ring-border",
    dot: "bg-muted-foreground/60",
  },
  critical: {
    label: "Critical",
    icon: ShieldAlert,
    bg: "bg-critical/10",
    fg: "text-critical",
    ring: "ring-critical/25",
    dot: "bg-critical",
  },
};

export function StatusChip({
  status,
  size = "md",
  label,
}: {
  status: PitchStatus;
  size?: "sm" | "md" | "lg";
  label?: string;
}) {
  const c = map[status];
  const Icon = c.icon;
  const sizes = {
    sm: "gap-1 px-2 py-0.5 text-[11px]",
    md: "gap-1.5 px-2.5 py-1 text-[12px]",
    lg: "gap-2 px-3 py-1.5 text-[13px]",
  }[size];
  const icon = { sm: 12, md: 13, lg: 15 }[size];
  return (
    <span
      className={`inline-flex items-center rounded-full font-medium ring-1 ring-inset ${c.bg} ${c.fg} ${c.ring} ${sizes}`}
    >
      <Icon size={icon} strokeWidth={2.4} />
      {label ?? c.label}
    </span>
  );
}

export function StatusDot({ status }: { status: PitchStatus }) {
  return (
    <span className="relative inline-flex h-2.5 w-2.5">
      <span
        className={`absolute inline-flex h-full w-full animate-ping rounded-full opacity-60 ${map[status].dot}`}
      />
      <span
        className={`relative inline-flex h-2.5 w-2.5 rounded-full ${map[status].dot}`}
      />
    </span>
  );
}

export function StatusIcon({
  status,
  className = "",
}: {
  status: PitchStatus;
  className?: string;
}) {
  const c = map[status];
  const Icon = c.icon;
  return (
    <div
      className={`grid place-items-center rounded-2xl ring-1 ring-inset ${c.bg} ${c.fg} ${c.ring} ${className}`}
    >
      <Icon className="h-1/2 w-1/2" strokeWidth={2.2} />
    </div>
  );
}

export function MetricCard({
  label,
  value,
  unit,
  icon: Icon,
  tone = "neutral",
  hint,
}: {
  label: string;
  value: string | number;
  unit?: string;
  icon?: typeof Zap;
  tone?: "neutral" | "primary" | "success" | "warning" | "danger";
  hint?: ReactNode;
}) {
  const toneCls = {
    neutral: "text-foreground",
    primary: "text-primary",
    success: "text-success",
    warning: "text-warning",
    danger: "text-destructive",
  }[tone];
  return (
    <div className="rounded-2xl border border-border bg-card p-4 shadow-card">
      <div className="flex items-center justify-between text-muted-foreground">
        <span className="text-[11.5px] font-medium uppercase tracking-wider">{label}</span>
        {Icon && <Icon className="h-4 w-4" />}
      </div>
      <div className="mt-2 flex items-baseline gap-1">
        <span className={`text-[26px] font-semibold tracking-tight tabular-nums ${toneCls}`}>
          {value}
        </span>
        {unit && (
          <span className="text-[13px] font-medium text-muted-foreground">{unit}</span>
        )}
      </div>
      {hint && <div className="mt-1.5 text-[11.5px] text-muted-foreground">{hint}</div>}
    </div>
  );
}

export function Card({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-2xl border border-border bg-card shadow-card ${className}`}
    >
      {children}
    </div>
  );
}

export function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <div className="mb-2 px-1 text-[11.5px] font-semibold uppercase tracking-wider text-muted-foreground">
      {children}
    </div>
  );
}
