import { createFileRoute } from "@tanstack/react-router";
import { SupportPage } from "@/components/support-page";
import { supportPageHead } from "@/content/about";

export const Route = createFileRoute("/about/voorwaarden")({
  component: () => <SupportPage pageKey="voorwaarden" />,
  head: () => supportPageHead("voorwaarden"),
});
