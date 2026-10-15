import { createFileRoute, Link } from "@tanstack/react-router";
import { ManagerLayout } from "@/components/manager-layout";
import { Card, SectionLabel } from "@/components/bp";
import { ThemeToggle } from "@/components/theme-toggle";
import { about } from "@/content/about";
import { Zap, LifeBuoy, ShieldCheck, FileText, ChevronRight, Building2 } from "lucide-react";

export const Route = createFileRoute("/about/")({
  component: AboutPage,
  head: () => ({
    meta: [
      { title: "About · BluePlug" },
      { name: "description", content: "About BluePlug and support." },
    ],
  }),
});

const LINK_ICONS = {
  "life-buoy": LifeBuoy,
  building: Building2,
  shield: ShieldCheck,
  "file-text": FileText,
} as const;

// Each support page is its own route; the content key decides which one.
const LINK_ROUTES = {
  contact: "/about/contact",
  bedrijf: "/about/bedrijf",
  privacy: "/about/privacy",
  voorwaarden: "/about/voorwaarden",
} as const;

function AboutPage() {
  return (
    <ManagerLayout title="Over ons" subtitle={about.subtitle} right={<ThemeToggle />}>
      <Card className="p-4 sm:p-5 max-w-full">
        <div className="flex items-center gap-3">
          <div className="grid h-14 w-14 place-items-center rounded-2xl bg-primary text-primary-foreground shadow-glow shrink-0">
            <Zap className="h-7 w-7" strokeWidth={2.5} />
          </div>
          <div>
            <div className="text-[18px] font-semibold tracking-tight">{about.productName}</div>
          </div>
        </div>
      </Card>

      <SectionLabel>Ondersteuning</SectionLabel>
      <Card className="divide-y divide-border max-w-full">
        {about.links.map((link) => {
          const Icon = LINK_ICONS[link.icon];
          return (
            <Link
              key={link.key}
              to={LINK_ROUTES[link.key]}
              className="bp-tap flex w-full items-center gap-3 p-3.5 sm:p-4 text-left hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <div className="grid h-9 w-9 place-items-center rounded-lg bg-primary-soft text-primary shrink-0">
                <Icon className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1 leading-snug">
                <div className="text-[14px] font-semibold">{link.label}</div>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
            </Link>
          );
        })}
      </Card>

      <p className="mt-8 text-center text-[12px] text-muted-foreground">{about.footer}</p>
    </ManagerLayout>
  );
}
