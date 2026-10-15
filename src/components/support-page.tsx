import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { AlertTriangle, ChevronLeft } from "lucide-react";
import { ManagerLayout } from "@/components/manager-layout";
import { Card, SectionLabel } from "@/components/bp";
import { ThemeToggle } from "@/components/theme-toggle";
import { getSettings, type Eigenaar } from "@/lib/api";
import { companyFields, supportPages, type SupportPageKey } from "@/content/about";

/** Resolves the `{dagen}` placeholder from the configured session duration. */
function withDays(text: string, days: number | null): string {
  return days === null
    ? text.replaceAll("{dagen}", "ingestelde")
    : text.replaceAll("{dagen}", String(days));
}

/** The rows of the live Bedrijf page, built from the settings and never invented. */
function companyRows(eigenaar: Eigenaar): { label: string; value: string }[] {
  const adres = [eigenaar.straat, eigenaar.nummer].filter(Boolean).join(" ");
  const postcodePlaats = [eigenaar.postcode, eigenaar.plaats].filter(Boolean).join(" ");

  const values: Record<string, string> = {
    naam: eigenaar.naam ?? "",
    adres,
    postcodePlaats,
    telefoon: eigenaar.telefoon ?? "",
    email: eigenaar.email ?? "",
    website: eigenaar.website ?? "",
    kvk: eigenaar.kvk ?? "",
    btwNummer: eigenaar["btw-nummer"] ?? "",
  };

  return companyFields
    .map((field) => ({ label: field.label, value: values[field.key]?.trim() ?? "" }))
    .filter((row) => row.value.length > 0);
}

/**
 * Renders one support page (/about/contact, /about/bedrijf, …). All copy comes
 * from `src/content/about.ts`; only the layout lives here, so the client can
 * replace the text without touching a component. Pages marked `live` fill
 * their content from /api/settings.
 */
export function SupportPage({ pageKey }: { pageKey: SupportPageKey }) {
  const page = supportPages[pageKey];
  const needsSettings = page.live !== undefined;

  const [eigenaar, setEigenaar] = useState<Eigenaar | null>(null);
  const [days, setDays] = useState<number | null>(null);
  const [liveState, setLiveState] = useState<"idle" | "loading" | "ready" | "error">("idle");

  useEffect(() => {
    if (!needsSettings) return;
    let cancelled = false;
    setLiveState("loading");
    getSettings()
      .then((settings) => {
        if (cancelled) return;
        setEigenaar(settings.eigenaar ?? {});
        setDays(settings.sessionDurationDays ?? null);
        setLiveState("ready");
      })
      .catch(() => {
        if (!cancelled) setLiveState("error");
      });
    return () => {
      cancelled = true;
    };
  }, [needsSettings]);

  const rows = liveState === "ready" && eigenaar ? companyRows(eigenaar) : [];

  return (
    <ManagerLayout title={page.heading} right={<ThemeToggle />}>
      <div className="mx-auto w-full max-w-2xl">
        <Link
          to="/about"
          className="bp-tap -mt-1 mb-1 inline-flex h-9 items-center gap-1 text-[13px] font-medium text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <ChevronLeft className="h-4 w-4" /> Terug naar Over ons
        </Link>
        {page.concept && (
          <p className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-warning-soft px-3.5 py-1 text-[11.5px] font-semibold text-warning">
            <AlertTriangle className="h-3 w-3" /> Concepttekst
          </p>
        )}

        {page.intro && (
          <p className="mt-2 text-[14px] leading-relaxed text-muted-foreground">
            {withDays(page.intro, days)}
          </p>
        )}

        {page.live === "eigenaar" ? (
          <>
            <SectionLabel>{page.sections[0]?.heading ?? "Gegevens"}</SectionLabel>
            <Card className="overflow-hidden">
              {liveState === "loading" && (
                <div className="px-3.5 py-3 text-[14px] text-muted-foreground">Laden…</div>
              )}
              {liveState === "error" && (
                <div className="px-3.5 py-3 text-[14px] text-destructive">{page.errorNote}</div>
              )}
              {liveState === "ready" && rows.length === 0 && (
                <div className="px-3.5 py-3 text-[14px] text-muted-foreground">
                  {page.emptyNote}
                </div>
              )}
              {rows.length > 0 && (
                <div className="divide-y divide-border">
                  {rows.map((row) => (
                    <div
                      key={row.label}
                      className="flex items-baseline justify-between gap-3 px-3.5 py-2.5"
                    >
                      <span className="text-[13px] text-muted-foreground">{row.label}</span>
                      <span className="min-w-0 break-words text-right text-[13.5px] font-medium">
                        {row.value}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </>
        ) : (
          page.sections.map((section) => (
            <div key={section.heading}>
              <SectionLabel>{section.heading}</SectionLabel>
              <Card className="px-3.5 py-3 sm:px-4 sm:py-3.5">
                {section.paragraphs.map((paragraph, index) => (
                  <p
                    key={index}
                    className={`text-[14px] leading-relaxed text-muted-foreground ${
                      index > 0 ? "mt-2.5" : ""
                    }`}
                  >
                    {withDays(paragraph, days)}
                  </p>
                ))}
              </Card>
            </div>
          ))
        )}
      </div>
    </ManagerLayout>
  );
}
