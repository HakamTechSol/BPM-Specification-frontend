import { useEffect, useState, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { ChevronLeft } from "lucide-react";
import { ManagerLayout } from "@/components/manager-layout";
import { Card, SectionLabel } from "@/components/bp";
import { ThemeToggle } from "@/components/theme-toggle";
import { getSettings, type Eigenaar } from "@/lib/api";
import {
  companyFields,
  supportPages,
  type ContentLink,
  type SupportPageKey,
} from "@/content/about";

/** Resolves the `{dagen}` placeholder from the configured session duration. */
function withDays(text: string, days: number | null): string {
  return days === null
    ? text.replaceAll("{dagen}", "ingestelde")
    : text.replaceAll("{dagen}", String(days));
}

/**
 * Renders text with the section's tap targets (tel:, mailto:, …) as links. The
 * text itself is copied verbatim; only the marked substrings become anchors.
 */
function withText(text: string, links?: ContentLink[]): ReactNode {
  if (!links || links.length === 0) return text;

  const nodes: ReactNode[] = [];
  let rest = text;
  let key = 0;

  while (rest.length > 0) {
    const next = links
      .map((link) => ({ link, index: rest.indexOf(link.text) }))
      .filter((candidate) => candidate.index >= 0)
      .sort((a, b) => a.index - b.index)[0];

    if (!next) {
      nodes.push(rest);
      break;
    }
    if (next.index > 0) nodes.push(rest.slice(0, next.index));
    nodes.push(
      <a
        key={key++}
        href={next.link.href}
        className="font-medium text-primary underline decoration-primary/40 underline-offset-2 hover:decoration-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        {next.link.text}
      </a>,
    );
    rest = rest.slice(next.index + next.link.text.length);
  }

  return nodes;
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
      {/* Extra bottom room so the fixed mobile navigation never covers the end
          of a long text. */}
      <div className="mx-auto w-full max-w-2xl pb-8">
        <Link
          to="/about"
          className="bp-tap -mt-1 mb-1 inline-flex h-9 items-center gap-1 text-[13px] font-medium text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <ChevronLeft className="h-4 w-4" /> Terug naar Over ons
        </Link>

        {page.updated && <p className="mt-2 text-[13px] text-muted-foreground">{page.updated}</p>}

        {page.intro && (
          <p className="mt-2 text-[15px] leading-relaxed text-muted-foreground">
            {withDays(page.intro, days)}
          </p>
        )}

        {page.pending && !needsSettings ? (
          <Card className="px-3.5 py-3 sm:px-4 sm:py-3.5">
            <p className="text-[15px] leading-relaxed text-muted-foreground">{page.pending}</p>
          </Card>
        ) : page.live === "eigenaar" ? (
          <>
            {(liveState !== "ready" || rows.length > 0) && (
              <SectionLabel>{page.sections[0]?.heading ?? "Gegevens"}</SectionLabel>
            )}
            <Card className="overflow-hidden">
              {liveState === "loading" && (
                <div className="px-3.5 py-3 text-[14px] text-muted-foreground">Laden…</div>
              )}
              {liveState === "error" && (
                <div className="px-3.5 py-3 text-[14px] text-destructive">{page.errorNote}</div>
              )}
              {liveState === "ready" && rows.length === 0 && page.pending && (
                <div className="px-3.5 py-3 text-[15px] leading-relaxed text-muted-foreground">
                  {page.pending}
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
                {section.paragraphs?.map((paragraph, index) => (
                  <p
                    key={index}
                    className={`text-[15px] leading-relaxed text-muted-foreground ${
                      index > 0 ? "mt-3" : ""
                    }`}
                  >
                    {withText(withDays(paragraph, days), section.links)}
                  </p>
                ))}

                {section.bullets && section.bullets.length > 0 && (
                  <ul className="mt-2.5 space-y-2">
                    {section.bullets.map((bullet, index) => (
                      <li
                        key={index}
                        className="flex gap-2.5 text-[15px] leading-relaxed text-muted-foreground"
                      >
                        <span
                          aria-hidden
                          className="mt-[9px] h-1.5 w-1.5 shrink-0 rounded-full bg-muted-foreground/60"
                        />
                        <span className="min-w-0">
                          {withText(withDays(bullet, days), section.links)}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}

                {section.fields && section.fields.length > 0 && (
                  <div
                    className={
                      section.paragraphs || section.bullets?.length ? "mt-2.5 space-y-0.5" : ""
                    }
                  >
                    {section.fields.map((field) => (
                      <div
                        key={field.label}
                        className="flex flex-wrap items-baseline justify-between gap-x-3"
                      >
                        <span className="text-[14px] text-muted-foreground">{field.label}</span>
                        {field.href ? (
                          // Large tap target: elderly users must be able to hit it.
                          <a
                            href={field.href}
                            className="inline-flex min-h-[40px] items-center break-all text-[15px] font-medium text-primary underline decoration-primary/40 underline-offset-4 hover:decoration-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                          >
                            {field.value}
                          </a>
                        ) : (
                          <span className="min-w-0 break-words text-[15px] font-medium">
                            {field.value}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
                {section.closing && section.closing.length > 0 && (
                  <div className={section.bullets?.length || section.fields?.length ? "mt-3" : ""}>
                    {section.closing.map((paragraph, index) => (
                      <p
                        key={index}
                        className={`text-[15px] leading-relaxed text-muted-foreground ${
                          index > 0 ? "mt-3" : ""
                        }`}
                      >
                        {withText(withDays(paragraph, days), section.links)}
                      </p>
                    ))}
                  </div>
                )}
              </Card>
            </div>
          ))
        )}
      </div>
    </ManagerLayout>
  );
}
