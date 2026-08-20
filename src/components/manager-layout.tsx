import { Link, useRouter, useRouterState } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { LayoutDashboard, AlertTriangle, Wrench, Settings, Info, Zap, LogOut } from "lucide-react";
import { clearToken } from "@/lib/api";

const nav = [
  { to: "/dashboard", label: "Plaatsen", icon: LayoutDashboard },
  { to: "/failures", label: "Storingen", icon: AlertTriangle },
  { to: "/maintenance", label: "Onderhoud", icon: Wrench },
  { to: "/settings", label: "Instellingen", icon: Settings },
  { to: "/about", label: "Over ons", icon: Info },
];

export function ManagerLayout({
  children,
  title,
  subtitle,
  right,
  noScroll = false,
}: {
  children: ReactNode;
  title?: string;
  subtitle?: string;
  right?: ReactNode;
  noScroll?: boolean;
}) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const router = useRouter();

  const handleSignOut = () => {
    clearToken();
    router.navigate({ to: '/login' });
  };

  return (
    <div className={`bg-background ${noScroll ? "h-screen overflow-hidden flex flex-col lg:h-auto lg:overflow-visible" : "min-h-screen"}`}>
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-slate-100 dark:border-slate-800/50 bg-sidebar lg:flex">
        <div className="flex h-16 items-center gap-2.5 px-6">
          <div className="grid h-9 w-9 place-items-center rounded-xl bg-primary text-primary-foreground shadow-glow">
            <Zap className="h-5 w-5" strokeWidth={2.5} />
          </div>
          <div className="leading-tight">
            <div className="text-[15px] font-semibold tracking-tight">BluePlug</div>
            <div className="text-[12px] text-muted-foreground">Beheerdersconsole</div>
          </div>
        </div>
        <nav className="flex-1 space-y-1 px-3 py-4">
          {nav.map((n) => {
            const active = pathname.startsWith(n.to);
            return (
              <Link
                key={n.to}
                to={n.to}
                className={`bp-tap flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-colors ${
                  active
                    ? "bg-blue-50 text-blue-600 dark:bg-blue-950/30 dark:text-blue-400"
                    : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                }`}
              >
                <n.icon className="h-[18px] w-[18px]" />
                {n.label}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-slate-100 dark:border-slate-800/50 p-3">
          <button
            onClick={handleSignOut}
            className="bp-tap flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-sidebar-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring w-full"
          >
            <LogOut className="h-[18px] w-[18px]" />
            Sign out (Uitloggen)
          </button>
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

      <div className={`lg:pl-64 ${noScroll ? "flex-1 flex flex-col min-h-0" : ""}`}>
        <header className="sticky top-0 z-20 border-b border-slate-100 dark:border-slate-800/50 bg-background/85 backdrop-blur-xl pt-[env(safe-area-inset-top,0px)] shrink-0">
          <div className="mx-auto flex h-16 items-center gap-3 px-4 sm:px-5 lg:max-w-full lg:px-8">
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
            <div className="flex items-center gap-2">
              {right}
              <button
                onClick={handleSignOut}
                className="bp-tap flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground hover:bg-destructive-soft hover:text-destructive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring lg:hidden"
                aria-label="Sign out"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          </div>
        </header>

        <main className={`mx-auto w-full px-5 lg:max-w-7xl lg:px-8 lg:pb-10 lg:pt-7 ${
          noScroll 
            ? "flex-1 flex flex-col min-h-0 pb-0 pt-2 overflow-y-auto" 
            : "space-y-3 sm:space-y-4 pb-20 pt-4 sm:pb-24 sm:pt-5"
        }`}>
          {children}
        </main>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-100 dark:border-slate-800/50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-lg lg:hidden">
        <div className="mx-auto grid max-w-lg grid-cols-5 px-2 pb-[max(env(safe-area-inset-bottom),0.75rem)] pt-2">
          {nav.map((n) => {
            const active = pathname.startsWith(n.to);
            return (
              <Link
                key={n.to}
                to={n.to}
                className={`bp-tap relative flex flex-col items-center gap-1 rounded-lg px-2 py-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                  active ? "bg-blue-50/50 dark:bg-blue-950/20" : ""
                }`}
                aria-current={active ? "page" : undefined}
              >
                {active && (
                  <span className="absolute -top-2 left-1/2 h-1 w-8 -translate-x-1/2 rounded-full bg-blue-600 dark:bg-blue-400" />
                )}
                <n.icon
                  className={`h-[22px] w-[22px] ${
                    active ? "text-blue-600 dark:text-blue-400" : "text-muted-foreground"
                  }`}
                  strokeWidth={active ? 2.4 : 1.8}
                />
                <span
                  className={`text-[10px] sm:text-[11px] font-semibold tracking-tight ${
                    active ? "text-blue-600 dark:text-blue-400" : "text-muted-foreground"
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
