This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

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

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Captcha (Cloudflare Turnstile)

Login and registration are protected by Cloudflare Turnstile.

Set environment variables:

```bash
NEXT_PUBLIC_TURNSTILE_SITE_KEY="0x..."
TURNSTILE_SECRET_KEY="0x..."
```

## Environment Variables

**Database**
- `DB_PROVIDER`: `postgres` | `sqlite` | `mysql`
- `DATABASE_URL`: Postgres connection string
- `DATABASE_URL_SQLITE`: SQLite connection string
- `DATABASE_URL_MYSQL`: MySQL/MariaDB connection string

**Uploads**
- `UPLOAD_DIR`: directory for private uploads (defaults to platform-specific path)
- `PUBLIC_UPLOAD_DIR`: directory for public images (defaults to platform-specific path)

## Security Notes

- CSRF uses a double-submit cookie (`csrf_token`) set in middleware and must be sent for state-changing operations.
- `/api/upload` requires same-origin requests and CSRF token via `x-csrf-token` header.

## Project Plan

See the implementation plan: `.trae/documents/PLAN_оптимизация-модернизация.md`.

## Production

Build and run:

```bash
npm run build
npm run start
```

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
