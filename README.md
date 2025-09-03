# Lama Dev School Management Dashboard

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Lama Dev Youtube Channel](https://youtube.com/lamadev) 
- [Next.js](https://nextjs.org/learn)
## Sports Reporting

This project uses Prisma with SQLite to store sport session reports.

### Setup

1. Copy `.env.example` to `.env` and adjust if needed.
2. Run `npx prisma migrate dev` to create the database.
3. Run `npm run dev` to start the development server.

A simple form is available at `/reports/new` to create daily reports. Submissions are saved with a unique ID and can be accessed through the API at `/api/reports`.
