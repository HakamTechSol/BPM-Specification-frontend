import type { ReactNode } from "react";
import {
  Zap,
  Power,
  AlertTriangle,
  Radio,
  MinusCircle,
  ShieldAlert,
  UserX,
  UserCheck,
  WifiOff,
  Wifi,
  Sparkles,
  ServerCrash,
  Activity,
  Clock,
  RefreshCw,
  Loader2,
  Check,
  X,
  XCircle,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";

export type PitchStatus =
  | "on"
  | "off"
  | "warning"
  | "remote"
  | "inactive"
  | "critical"
  | "empty"
  | "in-use"
  | "remote-off"
  | "remote-on"
  | "always-on"
  | "error"
  | "system-error";

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
  empty: {
    label: "Empty",
    icon: UserX,
    bg: "bg-muted",
    fg: "text-muted-foreground",
    ring: "ring-border",
    dot: "bg-muted-foreground/60",
  },
  "in-use": {
    label: "In Use",
    icon: UserCheck,
    bg: "bg-success-soft",
    fg: "text-success",
    ring: "ring-success/20",
    dot: "bg-success",
  },
  "remote-off": {
    label: "Remote Off",
    icon: WifiOff,
    bg: "bg-warning-soft",
    fg: "text-warning",
    ring: "ring-warning/25",
    dot: "bg-warning",
  },
  "remote-on": {
    label: "Remote On",
    icon: Wifi,
    bg: "bg-info-soft",
    fg: "text-info",
    ring: "ring-info/20",
    dot: "bg-info",
  },
  "always-on": {
    label: "Always On",
    icon: Sparkles,
    bg: "bg-primary-soft",
    fg: "text-primary",
    ring: "ring-primary/20",
    dot: "bg-primary",
  },
  error: {
    label: "Error",
    icon: XCircle,
    bg: "bg-destructive-soft",
    fg: "text-destructive",
    ring: "ring-destructive/20",
    dot: "bg-destructive",
  },
  "system-error": {
    label: "System Error",
    icon: ServerCrash,
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
    sm: "gap-1 px-2 py-0.5 text-[12px]",
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
      <span className={`relative inline-flex h-2.5 w-2.5 rounded-full ${map[status].dot}`} />
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
    <div className="rounded-2xl border border-border bg-card p-2.5 sm:p-4 shadow-card">
      <div className="flex items-center justify-between text-muted-foreground">
        <span className="text-[11px] sm:text-[12px] font-medium uppercase tracking-wider">{label}</span>
        {Icon && <Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />}
      </div>
      <div className="mt-1.5 sm:mt-2 flex items-baseline gap-0.5 sm:gap-1">
        <span className={`text-[20px] sm:text-[26px] font-semibold tracking-tight tabular-nums ${toneCls}`}>
          {value}
        </span>
        {unit && <span className="text-[11px] sm:text-[13px] font-medium text-muted-foreground">{unit}</span>}
      </div>
      {hint && <div className="mt-1 sm:mt-1.5 text-[11px] sm:text-[12px] text-muted-foreground leading-none">{hint}</div>}
    </div>
  );
}

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`rounded-2xl border border-border bg-card shadow-card ${className}`}>
      {children}
    </div>
  );
}

export function SectionLabel({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`mt-4 mb-2 px-1 text-[12px] font-semibold uppercase tracking-wider text-muted-foreground ${className}`}>
      {children}
    </div>
  );
}

export function StatusLegend() {
  const entries: PitchStatus[] = [
    "on",
    "in-use",
    "off",
    "empty",
    "warning",
    "error",
    "critical",
    "system-error",
    "remote-on",
    "remote-off",
    "always-on",
    "inactive",
  ];
  return (
    <div className="rounded-2xl border border-border bg-card p-3 shadow-card">
      <div className="mb-3 text-[12px] font-semibold uppercase tracking-wider text-muted-foreground">
        Status Legend
      </div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {entries.map((s) => {
          const c = map[s];
          const Icon = c.icon;
          return (
            <div key={s} className="flex items-center gap-2 text-[12px]">
              <div
                className={`grid h-6 w-6 shrink-0 place-items-center rounded-md ${c.bg} ${c.fg}`}
              >
                <Icon className="h-3.5 w-3.5" strokeWidth={2.4} />
              </div>
              <span>{c.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function LoadingCard({ rows = 3 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="rounded-2xl border border-border bg-card p-4 shadow-card">
          <div className="flex items-center gap-3">
            <Skeleton className="h-12 w-12 shrink-0 rounded-xl" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-3.5 w-1/3" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function LoadingPitchCard() {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
      <div className="flex items-start gap-3">
        <Skeleton className="h-14 w-14 shrink-0 rounded-2xl" />
        <div className="flex-1 space-y-3">
          <Skeleton className="h-5 w-1/3" />
          <Skeleton className="h-4 w-1/4" />
          <Skeleton className="h-3.5 w-1/2" />
        </div>
      </div>
    </div>
  );
}

export function LoadingMetricsCard({ count = 3 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-2xl border border-border bg-card p-4 shadow-card">
          <Skeleton className="mb-3 h-4 w-16" />
          <Skeleton className="h-8 w-24" />
        </div>
      ))}
    </div>
  );
}

export function EmptyState({
  icon: Icon = Zap,
  title,
  description,
  action,
}: {
  icon?: typeof Zap;
  title: string;
  description: string;
  action?: { label: string; onClick: () => void };
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="grid h-16 w-16 place-items-center rounded-2xl bg-muted text-muted-foreground">
        <Icon className="h-8 w-8" strokeWidth={1.5} />
      </div>
      <h3 className="mt-4 text-[16px] font-semibold tracking-tight">{title}</h3>
      <p className="mt-1.5 max-w-xs text-[13px] text-muted-foreground">{description}</p>
      {action && (
        <button
          onClick={action.onClick}
          className="bp-tap mt-5 flex h-12 items-center justify-center gap-2 rounded-xl bg-primary px-5 text-[14px] font-semibold text-primary-foreground shadow-glow"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}

export function ErrorState({
  title = "Something went wrong",
  description = "We couldn't load this content. Please try again.",
  onRetry,
}: {
  title?: string;
  description?: string;
  onRetry?: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="grid h-16 w-16 place-items-center rounded-2xl bg-destructive-soft text-destructive">
        <AlertTriangle className="h-8 w-8" strokeWidth={1.5} />
      </div>
      <h3 className="mt-4 text-[16px] font-semibold tracking-tight">{title}</h3>
      <p className="mt-1.5 max-w-xs text-[13px] text-muted-foreground">{description}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="bp-tap mt-5 flex h-12 items-center justify-center gap-2 rounded-xl bg-primary px-5 text-[14px] font-semibold text-primary-foreground shadow-glow"
        >
          <RefreshCw className="h-4 w-4" /> Try again
        </button>
      )}
    </div>
  );
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  variant = "default",
  onConfirm,
  icon: Icon,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "default" | "destructive" | "warning";
  onConfirm: () => void;
  icon?: typeof AlertTriangle;
}) {
  const iconStyles = {
    default: "bg-primary-soft text-primary",
    destructive: "bg-destructive-soft text-destructive",
    warning: "bg-warning-soft text-warning",
  }[variant];

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-sm rounded-3xl sm:rounded-3xl">
        <AlertDialogHeader className="items-center text-center sm:text-center">
          {Icon && (
            <div className={`grid h-12 w-12 place-items-center rounded-2xl ${iconStyles}`}>
              <Icon className="h-6 w-6" />
            </div>
          )}
          <AlertDialogTitle className="text-[17px] font-semibold tracking-tight">
            {title}
          </AlertDialogTitle>
          <AlertDialogDescription className="text-[13px]">{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="grid grid-cols-2 gap-2 sm:grid-cols-2">
          <AlertDialogCancel className="bp-tap mt-0 h-12 rounded-xl border border-border bg-card text-[14px] font-semibold sm:mt-0">
            {cancelLabel}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className={`bp-tap h-12 rounded-xl text-[14px] font-semibold ${
              variant === "destructive"
                ? "bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90"
                : variant === "warning"
                  ? "bg-warning text-warning-foreground shadow-sm hover:bg-warning/90"
                  : "bg-primary text-primary-foreground shadow-glow hover:bg-primary/90"
            }`}
          >
            {confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export function ConnectionBadge({
  status,
  label,
}: {
  status: "online" | "offline" | "degraded";
  label: string;
}) {
  const styles = {
    online: "bg-success-soft text-success",
    offline: "bg-destructive-soft text-destructive",
    degraded: "bg-warning-soft text-warning",
  }[status];

  const dotStyles = {
    online: "bg-success",
    offline: "bg-destructive",
    degraded: "bg-warning",
  }[status];

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[12px] font-semibold ${styles}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${dotStyles}`} />
      {label}
    </span>
  );
}

export function SwitchRow({
  icon: Icon,
  label,
  description,
  checked,
  onCheckedChange,
  iconBg,
}: {
  icon: typeof Zap;
  label: string;
  description?: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  iconBg?: string;
}) {
  return (
    <div className="flex items-center gap-3 p-3">
      <div
        className={`grid h-9 w-9 place-items-center rounded-lg ${iconBg || "bg-primary-soft text-primary"}`}
      >
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-[14px] font-semibold">{label}</div>
        {description && <div className="text-[12px] text-muted-foreground">{description}</div>}
      </div>
      <Switch
        checked={checked}
        onCheckedChange={onCheckedChange}
        className="h-12 w-[60px] [&>span]:h-[34px] [&>span]:w-[34px] [&>span]:data-[state=checked]:translate-x-[24px]"
      />
    </div>
  );
}
