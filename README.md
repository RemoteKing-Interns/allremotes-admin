This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Admin Live Sync Setup

To make admin edits update the live storefront, point this admin app to the API app that is backed by MongoDB.

1. In this admin app, set `NEXT_PUBLIC_API_BASE_URL` to your storefront/API origin.
2. In the API app (the `allremotes` project), set `MONGODB_URI` and optionally `MONGODB_DB`.
3. Deploy both apps with those variables.

Example admin `.env.local`:

```bash
NEXT_PUBLIC_API_BASE_URL=https://allremotes.vercel.app
```

Example API app env:

```bash
MONGODB_URI=mongodb+srv://<user>:<password>@<cluster>/<db>?retryWrites=true&w=majority
MONGODB_DB=allremotes
```

After this setup, saves from the admin editor use the API content routes and now trigger server revalidation so updates appear on public pages faster.

## Next.js 16 Build Configuration Note

This project currently does not enable `cacheComponents` in `next.config.ts`, and the root route does not export `unstable_instant`.

Why:

- Enabling `cacheComponents` only to support `unstable_instant` introduced broader route validation requirements across the app.
- Several routes use client-side hooks and async params patterns that then require strict Suspense placement and additional refactors.
- For stable production builds, we keep the current route setup with explicit Suspense boundaries where needed and avoid `unstable_instant` until a full route-level instant-navigation migration is planned.

If you want to reintroduce instant-navigation validation later, do it as a dedicated migration and validate all routes together.

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

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
