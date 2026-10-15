import { createFileRoute, Outlet } from "@tanstack/react-router";

/**
 * Layout for everything under /about. It renders no UI of its own: the list
 * lives in `about/index.tsx` and each sub-page in `about/<topic>.tsx`, so both
 * keep their own title and content. The sidebar still highlights "Over ons",
 * because it marks a route active when the path starts with /about.
 */
export const Route = createFileRoute("/about")({
  component: AboutLayout,
});

function AboutLayout() {
  return <Outlet />;
}
