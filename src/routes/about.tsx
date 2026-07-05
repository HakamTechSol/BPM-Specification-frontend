import { createFileRoute } from "@tanstack/react-router";
import { ManagerLayout } from "@/components/manager-layout";
import { Card, SectionLabel } from "@/components/bp";
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
    <ManagerLayout title="About (Over Ons)" subtitle="Version & support · Versie & ondersteuning">
      <Card className="p-5">
        <div className="flex items-center gap-3">
          <div className="grid h-14 w-14 place-items-center rounded-2xl bg-primary text-primary-foreground shadow-glow">
            <Zap className="h-7 w-7" strokeWidth={2.5} />
          </div>
          <div>
            <div className="text-[18px] font-semibold tracking-tight">BluePlug</div>
            <div className="text-[13px] text-muted-foreground">Version 2.4.1 · Build 2026.07</div>
          </div>
        </div>
        <p className="mt-4 text-[14px] leading-relaxed text-muted-foreground">
          Smart electricity control for modern campsites. Built for reliability in the outdoors —
          even on slow networks. Slimme stroomvoorziening voor moderne campings.
        </p>
      </Card>

      <SectionLabel>Support (Ondersteuning)</SectionLabel>
      <Card className="divide-y divide-border">
        {[
          {
            icon: LifeBuoy,
            label: "Contact support",
            meta: "Response within 4 h · Reactie binnen 4 uur",
          },
          { icon: Building2, label: "Company (Bedrijf)", meta: "BluePlug B.V. · Utrecht, NL" },
          { icon: ShieldCheck, label: "Privacy policy (Privacybeleid)", meta: "" },
          { icon: FileText, label: "Terms of service (Gebruiksvoorwaarden)", meta: "" },
        ].map((r) => (
          <button
            key={r.label}
            className="bp-tap flex w-full items-center gap-3 p-4 text-left hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <div className="grid h-9 w-9 place-items-center rounded-lg bg-primary-soft text-primary">
              <r.icon className="h-4 w-4" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-[14px] font-semibold">{r.label}</div>
              {r.meta && <div className="text-[12px] text-muted-foreground">{r.meta}</div>}
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </button>
        ))}
      </Card>

      <p className="mt-8 text-center text-[12px] text-muted-foreground">
        © 2026 BluePlug B.V. · Made for the outdoors. · Gemaakt voor de natuur.
      </p>
    </ManagerLayout>
  );
}
