import { Link, useRouterState } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { LayoutDashboard, AlertTriangle, Wrench, Settings, Info, Zap, LogOut } from "lucide-react";

const nav = [
  { to: "/dashboard", label: "Pitches", icon: LayoutDashboard },
  { to: "/failures", label: "Failures", icon: AlertTriangle },
  { to: "/maintenance", label: "Maintenance", icon: Wrench },
  { to: "/settings", label: "Settings", icon: Settings },
  { to: "/about", label: "About", icon: Info },
];

export function ManagerLayout({
  children,
  title,
  subtitle,
  right,
}: {
  children: ReactNode;
  title?: string;
  subtitle?: string;
  right?: ReactNode;
}) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <div className="min-h-screen bg-background">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-border bg-sidebar lg:flex">
        <div className="flex h-16 items-center gap-2.5 px-6">
          <div className="grid h-9 w-9 place-items-center rounded-xl bg-primary text-primary-foreground shadow-glow">
            <Zap className="h-5 w-5" strokeWidth={2.5} />
          </div>
          <div className="leading-tight">
            <div className="text-[15px] font-semibold tracking-tight">BluePlug</div>
            <div className="text-[12px] text-muted-foreground">Manager Console</div>
          </div>
        </div>
        <nav className="flex-1 space-y-1 px-3 py-4">
          {nav.map((n) => {
            const active = pathname.startsWith(n.to);
            return (
              <Link
                key={n.to}
                to={n.to}
                className={`bp-tap flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                  active
                    ? "bg-primary-soft text-primary"
                    : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                }`}
              >
                <n.icon className="h-[18px] w-[18px]" />
                {n.label}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-sidebar-border p-3">
          <Link
            to="/login"
            className="bp-tap flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-sidebar-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <LogOut className="h-[18px] w-[18px]" />
            Sign out (Uitloggen)
          </Link>
          <div className="mt-3 flex items-center gap-2.5 rounded-lg bg-sidebar-accent/60 px-3 py-2.5">
            <div className="grid h-8 w-8 place-items-center rounded-full bg-primary text-[13px] font-semibold text-primary-foreground">
              JD
            </div>
            <div className="min-w-0 leading-tight">
              <div className="truncate text-[13px] font-semibold">Jonas de Vries</div>
              <div className="truncate text-[12px] text-muted-foreground">Duinrand Camping</div>
            </div>
          </div>
        </div>
      </aside>

      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 border-b border-border/70 bg-background/85 backdrop-blur-xl pt-[env(safe-area-inset-top,0px)]">
          <div className="mx-auto flex h-16 max-w-5xl items-center gap-3 px-5 lg:px-8">
            <Link
              to="/dashboard"
              className="flex items-center gap-2 lg:hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-lg"
              aria-label="BluePlug"
            >
              <div className="grid h-9 w-9 place-items-center rounded-xl bg-primary text-primary-foreground">
                <Zap className="h-5 w-5" strokeWidth={2.5} />
              </div>
            </Link>
            <div className="min-w-0 flex-1">
              {title && (
                <h1 className="truncate text-[17px] font-semibold tracking-tight lg:text-[19px]">
                  {title}
                </h1>
              )}
              {subtitle && <p className="truncate text-[12px] text-muted-foreground">{subtitle}</p>}
            </div>
            {right}
          </div>
        </header>

        <main className="mx-auto max-w-5xl px-5 pb-24 pt-5 lg:px-8 lg:pb-10 lg:pt-7">
          {children}
        </main>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-background/95 backdrop-blur-xl lg:hidden">
        <div className="mx-auto grid max-w-lg grid-cols-5 px-2 pb-[max(env(safe-area-inset-bottom),0.75rem)] pt-2">
          {nav.map((n) => {
            const active = pathname.startsWith(n.to);
            return (
              <Link
                key={n.to}
                to={n.to}
                className="bp-tap relative flex flex-col items-center gap-1 rounded-lg px-2 py-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                aria-current={active ? "page" : undefined}
              >
                {active && (
                  <span className="absolute -top-2 left-1/2 h-1 w-8 -translate-x-1/2 rounded-full bg-primary" />
                )}
                <n.icon
                  className={`h-[22px] w-[22px] ${
                    active ? "text-primary" : "text-muted-foreground"
                  }`}
                  strokeWidth={active ? 2.4 : 1.8}
                />
                <span
                  className={`text-[12px] font-medium ${
                    active ? "text-primary" : "text-muted-foreground"
                  }`}
                >
                  {n.label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
