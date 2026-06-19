# deadegos

Full-stack clothing website for the **DeadEgos** brand with seasonal theming, animated hero, and an admin portal for managing product listings.

## Features

- **Blue season theme** — Logo in navbar, footer, hero, and favicon
- **Animated motion background** — Canvas-based blue particle/star animation on the hero
- **"HAVE NO ENEMIES." slogan** — Michroma extended font on the hero page
- **Shop** — Browse and view product listings
- **Admin Portal** — Upload images and create/edit/delete listings

## Getting Started

```bash
npm install
npm run db:push
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### Admin Portal

- URL: [http://localhost:3000/admin](http://localhost:3000/admin)
- Default password: `200Orders!` (change in `.env`)

## Seasonal Themes

Edit `CURRENT_SEASON` in `src/lib/theme.ts` to switch between `blue`, `pink`, and `green`.

## Tech Stack

- Next.js 15 (App Router)
- TypeScript
- Tailwind CSS 4
- Prisma + SQLite
- Canvas animation for motion background
