import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  useLocation,
  HeadContent,
  Scripts,
  redirect,
} from "@tanstack/react-router";
import { type ReactNode, useEffect } from "react";
import { isAuthenticated } from "../lib/api";

import appCss from "../styles.css?url";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Pagina niet gevonden</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          De pagina die u zoekt bestaat niet of is verplaatst.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Naar startpagina
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          Deze pagina kon niet worden geladen
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Er is iets misgegaan. Probeer de pagina te vernieuwen of ga terug naar de startpagina.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Opnieuw proberen
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Naar startpagina
          </a>
        </div>
      </div>
    </div>
  );
}

const PUBLIC_PREFIXES = ['/login', '/guest'];

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  beforeLoad: () => {
    if (typeof window === 'undefined') return;
    const path = window.location.pathname;
    const isPublic = PUBLIC_PREFIXES.some((p) => path.startsWith(p));
    if (!isPublic && !isAuthenticated()) {
      throw redirect({ to: '/login' });
    }
  },
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1, viewport-fit=cover" },
      { title: "BluePlug — Slimme stroomvoorziening voor campings" },
      {
        name: "description",
        content:
          "BluePlug laat kampeerplaatsbeheerders elektriciteit beheren en gasten live verbruik laten zien — mobiel-first, geen login voor gasten.",
      },
      { name: "author", content: "BluePlug" },
      { name: "theme-color", content: "#2f6fed" },
      { property: "og:title", content: "BluePlug — Slimme stroomvoorziening voor campings" },
      {
        property: "og:description",
        content:
          "Beheer plaatsstroom, monitor live ampères en los storingen op vanaf elk apparaat.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="nl">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const location = useLocation();

  // Apply the theme on the client side only, to prevent hydration mismatch.
  // Admin pages use the admin preference (localStorage "theme"); guest pages
  // (/guest/$id) use their OWN preference (localStorage "guest-theme"), so the
  // two are fully decoupled and the admin's dark/light choice never leaks into
  // guest pages (and vice versa).
  useEffect(() => {
    const isGuest = location.pathname.startsWith("/guest/");
    const key = isGuest ? "guest-theme" : "theme";

    const stored = localStorage.getItem(key) as "light" | "dark" | "system" | null;
    let theme: "light" | "dark" | "system" = stored || "system";

    const getSystemTheme = (): "light" | "dark" => {
      return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    };

    const resolvedTheme = theme === "system" ? getSystemTheme() : theme;
    const root = document.documentElement;

    if (resolvedTheme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
  }, [location.pathname]);

  return (
    <QueryClientProvider client={queryClient}>
      {/* Required: nested routes render here. Removing <Outlet /> breaks all child routes. */}
      <Outlet />
    </QueryClientProvider>
  );
}
