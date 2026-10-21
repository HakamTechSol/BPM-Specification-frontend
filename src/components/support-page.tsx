import { useEffect, useState, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { ChevronLeft } from "lucide-react";
import { ManagerLayout } from "@/components/manager-layout";
import { Card, SectionLabel } from "@/components/bp";
import { ThemeToggle } from "@/components/theme-toggle";
import { getSettings } from "@/lib/api";
import { supportPages, type ContentLink, type SupportPageKey } from "@/content/about";

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

/**
 * Renders one support page (/about/contact, /about/bedrijf, …). All copy comes
 * from `src/content/about.ts`; only the layout lives here, so the client can
 * replace the text without touching a component. Pages marked `live` fill
 * their content from /api/settings.
 */
export function SupportPage({ pageKey }: { pageKey: SupportPageKey }) {
  const page = supportPages[pageKey];
  const needsSettings = page.live !== undefined;

  const [days, setDays] = useState<number | null>(null);

  useEffect(() => {
    if (!needsSettings) return;
    let cancelled = false;
    getSettings()
      .then((settings) => {
        if (!cancelled) setDays(settings.sessionDurationDays ?? null);
      })
      .catch(() => {
        if (!cancelled) setDays(null);
      });
    return () => {
      cancelled = true;
    };
  }, [needsSettings]);

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
        ) : (
          page.sections.map((section) => (
            <div key={section.heading} className={section.headingInCard ? "mt-4" : undefined}>
              {!section.headingInCard && <SectionLabel>{section.heading}</SectionLabel>}
              <Card className="px-3.5 py-3 sm:px-4 sm:py-3.5">
                {section.headingInCard && (
                  <>
                    <h2 className="break-words text-[15px] font-semibold leading-snug">
                      {section.heading}
                    </h2>
                    <div className="my-2.5 h-px bg-border" />
                  </>
                )}
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
