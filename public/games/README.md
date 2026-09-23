# Game cover images

Place game cover art for this project here, then point the database field
`Game.imageUrl` at the file's public path.

## How images are resolved

- `Game.imageUrl = "/games/tekken-8.webp"`  → served from this folder
  (`public/games/tekken-8.webp`) and rendered with `next/image`
  (optimised, lazy, fixed 16:9 → no layout shift).
- `Game.imageUrl = "https://…"` (full URL) → rendered with `next/image`
  using `unoptimized` (remote hosts are intentionally NOT whitelisted in
  `next.config.js`; add a trusted provider there before relying on
  optimised remote images).
- `Game.imageUrl = null` (current state of all seeded games) → the card
  shows the built-in premium fallback panel instead. No broken images.

## Recommended file setup

| Game                | Filename `prisma/seed.ts` picks up (first match wins) |
| ------------------- | ---------------------------------------------------- |
| Tekken 8            | `public/games/tekken-8.webp` or `tekken-8.jpg`        |
| EA Sports FC 25     | `public/games/ea-fc-25.webp` or `ea-fc-25.jpg`        |
| Grand Theft Auto V  | `public/games/gta-v.webp` or `gta-v.jpg`              |

After dropping a file in, run `npm run prisma:seed`: it writes
`Game.imageUrl` for that game and the card switches from the fallback panel to
the real cover art. (A file that is not there yet keeps `imageUrl` at `null`,
so nothing ever requests a missing image.)

## Rules

- Use WebP (or AVIF), 16:9, ideally 1280×720 or larger (DESIGN.md §52,
  docs/SEO.md §8: descriptive filenames, correct dimensions).
- Only use cover art you are licensed to use (official publisher press
  assets or art you own). Do NOT hot-link random copyrighted images.
- Update the database with Prisma (e.g. `npx prisma studio` →
  `Game.imageUrl`) — never hard-code image paths in components.
