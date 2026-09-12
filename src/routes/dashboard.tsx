import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { ManagerLayout } from "@/components/manager-layout";
import { EmptyState, ErrorState } from "@/components/bp";
import { PitchCard, PitchCardSkeleton } from "@/components/pitch-card";
import { ThemeToggle } from "@/components/theme-toggle";
import { getAllPitches } from "@/lib/api";
import { Zap, Activity, ShieldAlert } from "lucide-react";

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

const SCROLL_ANCHOR_KEY = "blueplug-dashboard-scroll-anchor";

type ScrollAnchor = { pitchId: string; offsetFromTop: number };

function readAnchor(): ScrollAnchor | null {
  const raw = sessionStorage.getItem(SCROLL_ANCHOR_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    if (typeof parsed?.pitchId === "string" && typeof parsed?.offsetFromTop === "number") {
      return parsed;
    }
  } catch {
    // ignore malformed value
  }
  return null;
}

function writeAnchor(anchor: ScrollAnchor) {
  sessionStorage.setItem(SCROLL_ANCHOR_KEY, JSON.stringify(anchor));
}

// Finds the first pitch card whose bottom edge is still below the top of the
// viewport (i.e. the topmost card currently in view, even if only partially)
// and records how far its top edge sits from the viewport top. This is what
// we restore against instead of a raw scrollY number, so reordering/refetch
// between leave and return can't make us land on the wrong card.
function captureVisibleAnchor(): ScrollAnchor | null {
  const cards = document.querySelectorAll<HTMLElement>("[data-pitch-id]");
  for (const card of Array.from(cards)) {
    const rect = card.getBoundingClientRect();
    if (rect.bottom > 0) {
      return { pitchId: card.dataset.pitchId!, offsetFromTop: rect.top };
    }
  }
  return null;
}

function Dashboard() {
  const [filter, setFilter] = useState<FilterLabel>("Alles");

  const pitchesQuery = useQuery({
    queryKey: ["pitches"],
    queryFn: getAllPitches,
    staleTime: 60_000,
    placeholderData: (prev) => prev,
  });

  const pitches = useMemo(() => pitchesQuery.data?.pitches ?? [], [pitchesQuery.data]);
  const loading = pitchesQuery.isPending;
  const fatalError =
    pitchesQuery.isError && pitches.length === 0
      ? pitchesQuery.error instanceof Error
        ? pitchesQuery.error.message
        : "Kan plaatsen niet laden"
      : null;

  // Continuously record which card sits at the top of the viewport as the
  // user scrolls, and again on unmount (cleanup runs before the router hands
  // off to the next route, same reasoning as the old lastScrollRef pattern).
  const lastAnchorRef = useRef<ScrollAnchor | null>(null);
  useEffect(() => {
    const saveAnchor = () => {
      const anchor = captureVisibleAnchor();
      if (anchor) {
        lastAnchorRef.current = anchor;
        writeAnchor(anchor);
      }
    };
    window.addEventListener("scroll", saveAnchor, { passive: true });
    return () => {
      if (lastAnchorRef.current) {
        writeAnchor(lastAnchorRef.current);
      }
      window.removeEventListener("scroll", saveAnchor);
    };
  }, []);

  // Restore by finding the anchored pitchId in the current DOM and scrolling
  // it back to its recorded offset — not by replaying a pixel number. Reruns
  // whenever loading finishes AND whenever the query's data actually changes
  // (dataUpdatedAt), so a background refetch that reorders/resizes cards
  // after the first pass gets corrected too, instead of only having one
  // ~1.5s window right after mount. The anchor is NOT consumed/cleared here,
  // so it stays valid for the next leave/return cycle.
  useEffect(() => {
    if (loading || fatalError) return;
    const anchor = readAnchor();
    if (!anchor) return;

    let frame = 0;
    let raf = 0;
    const timers: number[] = [];

    const apply = () => {
      const el = document.querySelector<HTMLElement>(
        `[data-pitch-id="${anchor.pitchId}"]`
      );
      if (!el) {
        // card no longer in the (possibly filtered/refetched) list — nothing
        // sane to restore against, stop trying this pass.
        return;
      }
      const rect = el.getBoundingClientRect();
      const delta = rect.top - anchor.offsetFromTop;
      if (Math.abs(delta) > 1) {
        window.scrollBy(0, delta);
      }
      frame += 1;
      if (frame <= 90) {
        raf = requestAnimationFrame(apply);
      }
    };
    apply();
    timers.push(window.setTimeout(apply, 500));
    timers.push(window.setTimeout(apply, 1200));

    return () => {
      cancelAnimationFrame(raf);
      timers.forEach((t) => window.clearTimeout(t));
    };
    // dataUpdatedAt added so a background refetch that changes card
    // order/count re-triggers the anchor search against the fresh DOM.
  }, [loading, fatalError, pitchesQuery.dataUpdatedAt]);

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

  if (fatalError) {
    return (
      <ManagerLayout title="Duinrand Camping" subtitle="Verbinding verbroken">
        <ErrorState
          title={fatalError}
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
            <div key={p.pitchId} data-pitch-id={p.pitchId}>
              <PitchCard pitch={p} />
            </div>
          ))}
        </div>
      )}
    </ManagerLayout>
  );
}