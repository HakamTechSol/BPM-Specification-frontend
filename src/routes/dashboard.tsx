import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { ManagerLayout } from "@/components/manager-layout";
import { EmptyState, ErrorState } from "@/components/bp";
import { PitchCard, PitchCardSkeleton } from "@/components/pitch-card";
import { ThemeToggle } from "@/components/theme-toggle";
import { getAllPitches, type PitchSummary } from "@/lib/api";
import {
  Zap,
  Activity,
  ShieldAlert,
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

const filters = ["Alles", "Aan", "Uit"] as const;
type FilterLabel = (typeof filters)[number];
const filterMap: Record<FilterLabel, "All" | "On" | "Off"> = {
  Alles: "All",
  Aan: "On",
  Uit: "Off",
};

function Dashboard() {
  const [filter, setFilter] = useState<FilterLabel>("Alles");
  const [pitches, setPitches] = useState<PitchSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const data = await getAllPitches();
        if (!cancelled) {
          setPitches(data.pitches);
          setLoading(false);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Kan plaatsen niet laden");
          setLoading(false);
        }
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  const stats = useMemo(() => {
    const on = pitches.filter((p) => p.gewenst === 1).length;
    const off = pitches.filter((p) => p.gewenst === 0).length;
    return { on, off, total: pitches.length };
  }, [pitches]);

  const activeFilter = filterMap[filter];
  const visible = pitches.filter((p) => {
    if (activeFilter === "All") return true;
    if (activeFilter === "On") return p.gewenst === 1;
    return p.gewenst === 0;
  });

  if (error) {
    return (
      <ManagerLayout title="Duinrand Camping" subtitle="Verbinding verbroken">
        <ErrorState
          title={error}
          description="Kan pitch gegevens niet laden. Controleer de verbinding."
          onRetry={() => window.location.reload()}
        />
      </ManagerLayout>
    );
  }

  return (
    <ManagerLayout
      title="Duinrand Camping"
      subtitle={`${stats.total} plaatsen · ${stats.on} actief`}
      right={
        <div className="flex shrink-0 items-center gap-2">
          <ThemeToggle />
        </div>
      }
    >
      {/* Stats cards */}
      <div className="grid grid-cols-3 gap-2.5 sm:gap-4">
        <div className="rounded-2xl border border-border bg-card p-2.5 sm:p-4 shadow-card">
          <div className="grid h-8 w-8 sm:h-10 sm:w-10 place-items-center rounded-lg sm:rounded-xl bg-success-soft text-success">
            <Zap className="h-4 w-4 sm:h-5 sm:w-5" strokeWidth={2.4} />
          </div>
          <div className="mt-2 sm:mt-3 text-[20px] sm:text-[26px] font-bold tracking-tight tabular-nums text-foreground">
            {stats.on}
          </div>
          <div className="text-[12px] sm:text-[14px] font-medium text-muted-foreground">Aan</div>
        </div>
        <div className="rounded-2xl border border-border bg-card p-2.5 sm:p-4 shadow-card">
          <div className="grid h-8 w-8 sm:h-10 sm:w-10 place-items-center rounded-lg sm:rounded-xl bg-muted text-muted-foreground">
            <ShieldAlert className="h-4 w-4 sm:h-5 sm:w-5" strokeWidth={2.4} />
          </div>
          <div className="mt-2 sm:mt-3 text-[20px] sm:text-[26px] font-bold tracking-tight tabular-nums text-foreground">
            {stats.off}
          </div>
          <div className="text-[12px] sm:text-[14px] font-medium text-muted-foreground">Uit</div>
        </div>
        <div className="rounded-2xl border border-border bg-card p-2.5 sm:p-4 shadow-card">
          <div className="grid h-8 w-8 sm:h-10 sm:w-10 place-items-center rounded-lg sm:rounded-xl bg-primary-soft text-primary">
            <Activity className="h-4 w-4 sm:h-5 sm:w-5" strokeWidth={2.4} />
          </div>
          <div className="mt-2 sm:mt-3 text-[20px] sm:text-[26px] font-bold tracking-tight tabular-nums text-foreground">
            {stats.total}
          </div>
          <div className="text-[12px] sm:text-[14px] font-medium text-muted-foreground">Totaal</div>
        </div>
      </div>

      {/* Filter bar */}
      <div className="flex items-center gap-2 overflow-x-auto scrollbar-none">
        <div className="flex items-center gap-1 rounded-xl bg-secondary p-1 shrink-0">
          {filters.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`whitespace-nowrap rounded-lg px-3 sm:px-4 py-2 sm:py-2.5 text-[13px] sm:text-[15px] font-semibold min-h-[36px] sm:min-h-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                filter === f ? "bg-card text-foreground shadow-card" : "text-muted-foreground"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Pitch grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2.5 sm:gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <PitchCardSkeleton key={i} />
          ))}
        </div>
      ) : visible.length === 0 ? (
        <EmptyState
          icon={Zap}
          title="Geen plaatsen gevonden"
          description={`Geen plaatsen met filter "${filter}".`}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2.5 sm:gap-4">
          {visible.map((p) => (
            <PitchCard key={p.pitchId} pitch={p} />
          ))}
        </div>
      )}
    </ManagerLayout>
  );
}
