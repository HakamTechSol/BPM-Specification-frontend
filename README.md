# BluePlug campsite power hub

Manager console + guest screen for campsite power management (TanStack Start +
React + Tailwind).

```bash
npm run dev        # start the dev server
npm run test       # vitest
npm run lint       # eslint
npm run typecheck  # tsc --noEmit
```

## Page content

**All About-page text lives in [`src/content/about.ts`](src/content/about.ts).**
Edit that file only — never the route files or components — to change what the
pages say. Headings, paragraphs, the support-link labels, the subtitle and the
footer are all data there; layout and styling stay in the components, so
swapping copy needs no layout changes.

- `about` → title/subtitle, the four support links, the footer
- `supportPages.contact | bedrijf | privacy | voorwaarden` → the text of
  `/about/contact`, `/about/bedrijf`, `/about/privacy` and `/about/voorwaarden`

Every placeholder paragraph is prefixed with `[Placeholder] ` — replace the text
and delete that marker. Sections are `{ heading, paragraphs }` entries; add,
reorder or remove them freely, but keep the four page keys
(`contact`, `bedrijf`, `privacy`, `voorwaarden`) — the routes and the About
links point at them.

Routing conventions: [`src/routes/README.md`](src/routes/README.md).