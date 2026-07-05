import { createFileRoute, Link } from "@tanstack/react-router";
import { Zap, ArrowRight, QrCode } from "lucide-react";

export const Route = createFileRoute("/")({
  component: Splash,
});

function Splash() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      {/* backdrop */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 opacity-70"
        style={{
          background:
            "radial-gradient(60% 60% at 50% 0%, color-mix(in oklab, var(--primary) 18%, transparent), transparent 70%), radial-gradient(60% 60% at 100% 100%, color-mix(in oklab, var(--info) 15%, transparent), transparent 70%)",
        }}
      />
      <div className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-between px-6 py-14">
        <div />
        <div className="flex flex-col items-center text-center">
          <div className="relative">
            <div className="absolute inset-0 -z-10 animate-pulse rounded-[28px] bg-primary/40 blur-2xl" />
            <div className="grid h-20 w-20 place-items-center rounded-[28px] bg-primary text-primary-foreground shadow-glow">
              <Zap className="h-10 w-10" strokeWidth={2.4} />
            </div>
          </div>
          <h1 className="mt-6 text-[34px] font-semibold tracking-tight">BluePlug</h1>
          <p className="mt-2 max-w-xs text-[14px] leading-relaxed text-muted-foreground">
            Smart electricity control for modern campsites. Manage every pitch or
            monitor your own — from any device.
          </p>
          <div className="mt-2 flex items-center gap-2 text-[12px] text-muted-foreground">
            <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-success" />
            Connected · v2.4.1
          </div>
        </div>

        <div className="w-full space-y-3">
          <Link
            to="/login"
            className="bp-tap flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-primary text-[15px] font-semibold text-primary-foreground shadow-glow"
          >
            Manager sign in
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            to="/guest/$id"
            params={{ id: "A12" }}
            className="bp-tap flex h-14 w-full items-center justify-center gap-2 rounded-2xl border border-border bg-card text-[15px] font-semibold text-foreground"
          >
            <QrCode className="h-4 w-4" />
            Open guest demo
          </Link>
          <p className="pt-2 text-center text-[11px] text-muted-foreground">
            © 2026 BluePlug B.V. · Made for the outdoors.
          </p>
        </div>
      </div>
    </div>
  );
}
