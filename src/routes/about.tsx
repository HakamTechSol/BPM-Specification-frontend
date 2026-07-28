import { createFileRoute } from "@tanstack/react-router";
import { ManagerLayout } from "@/components/manager-layout";
import { Card, SectionLabel } from "@/components/bp";
import { ThemeToggle } from "@/components/theme-toggle";
import { Zap, LifeBuoy, ShieldCheck, FileText, ChevronRight, Building2 } from "lucide-react";

export const Route = createFileRoute("/about")({
  component: AboutPage,
  head: () => ({
    meta: [
      { title: "About · BluePlug" },
      { name: "description", content: "About BluePlug and support." },
    ],
  }),
});

function AboutPage() {
  return (
    <ManagerLayout title="Over ons" subtitle="Versie & ondersteuning" right={<ThemeToggle />}>
      <Card className="p-4 sm:p-5 max-w-full">
        <div className="flex items-center gap-3">
          <div className="grid h-14 w-14 place-items-center rounded-2xl bg-primary text-primary-foreground shadow-glow shrink-0">
            <Zap className="h-7 w-7" strokeWidth={2.5} />
          </div>
          <div>
            <div className="text-[18px] font-semibold tracking-tight">BluePlug</div>
          </div>
        </div>
        <p className="mt-4 text-[14px] leading-relaxed text-muted-foreground">
          Slimme stroomvoorziening voor moderne campings. Betrouwbaar in de buitenlucht —
          ook bij een langzame internetverbinding.
        </p>
      </Card>

      <SectionLabel>Ondersteuning</SectionLabel>
      <Card className="divide-y divide-border max-w-full">
        {[
          {
            icon: LifeBuoy,
            label: "Contact opnemen",
            meta: "Reactie binnen 4 uur",
          },
          { icon: Building2, label: "Bedrijf", meta: "BluePlug B.V. · Utrecht, NL" },
          { icon: ShieldCheck, label: "Privacybeleid", meta: "" },
          { icon: FileText, label: "Gebruiksvoorwaarden", meta: "" },
        ].map((r) => (
          <button
            key={r.label}
            className="bp-tap flex w-full items-center gap-3 p-3.5 sm:p-4 text-left hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <div className="grid h-9 w-9 place-items-center rounded-lg bg-primary-soft text-primary shrink-0">
              <r.icon className="h-4 w-4" />
            </div>
            <div className="min-w-0 flex-1 leading-snug">
              <div className="text-[14px] font-semibold">{r.label}</div>
              {r.meta && <div className="text-[12px] text-muted-foreground mt-0.5">{r.meta}</div>}
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
          </button>
        ))}
      </Card>

      <p className="mt-8 text-center text-[12px] text-muted-foreground">
        © 2026 BluePlug B.V. · Gemaakt voor de natuur.
      </p>
    </ManagerLayout>
  );
}
