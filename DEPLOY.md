# Deployment Guide

## Recommended platform

Deploy this project to **Vercel** using the root repository.

## Build commands

From the project root:

```bash
npm install
npm run build
```

The root `package.json` build script runs the client build:

```bash
npm run build --prefix client
```
```

## Vercel configuration

The project contains `vercel.json`:

- `builds` uses `@vercel/static-build`
- `outputDirectory` is `client/dist`

## Deploying on Vercel

1. Push the repository to GitHub (or another Git provider).
2. Create a new Vercel project and import the repo.
3. Set the root project to the repository root.
4. In Vercel project settings:
   - Build command: `npm run build`
   - Output directory: `client/dist`
5. Deploy.

## Environment variables

The frontend build does not require additional environment variables for static hosting.

## Custom domain

1. In Vercel dashboard, go to the project settings.
2. Add a custom domain.
3. Follow DNS instructions to point the domain to Vercel.
4. Enable HTTPS via Vercel automatic certificates.

## Verification

After deployment, the site should open at the Vercel deployment URL and serve the built frontend from `client/dist`.
