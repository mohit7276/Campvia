# FS Angular App Global Deployment Guide

This project is split into:

1. Angular frontend (root project)
2. Express + MongoDB backend (backend folder)
3. MongoDB Atlas database

Recommended production setup for global access and strong performance:

1. Frontend on Vercel (global CDN)
2. Backend API on Render Web Service
3. Database on MongoDB Atlas

This gives fast static delivery and a stable API without running MongoDB locally.

## 1. Important Security Step First

Your local backend .env currently contains real secrets and API keys.

Do this before pushing to GitHub:

1. Rotate all exposed secrets:
	JWT secret, Gemini key, Razorpay key/secret, MongoDB password
2. Keep secrets only in environment variables on hosting platforms
3. Use backend/.env.example as the template for required keys

## 2. Deploy Backend on Render

1. Push the repo to GitHub.
2. Open Render and create a new Web Service from the repository.
3. Use the included [render.yaml](render.yaml) blueprint or configure manually with:
	Root Directory: `backend`
	Build Command: `npm install`
	Start Command: `npm start`
4. Add the backend environment variables from [backend/.env.example](backend/.env.example):
	`MONGODB_URI`
	`JWT_SECRET`
	`GEMINI_API_KEY`
	`RAZORPAY_KEY_ID`
	`RAZORPAY_KEY_SECRET`
	`CORS_ORIGIN`
5. Deploy and copy the public backend URL. With the blueprint above, the URL will normally be `https://campvia-api.onrender.com`.
6. Verify the health endpoint:

```bash
https://campvia-api.onrender.com/api/health
```

Expected response:

```json
{"status":"ok"}
```

## 3. Configure Frontend Production API URL

This project uses a Vercel rewrite to forward frontend `/api` calls to Render.

1. Keep [src/environments/environment.prod.ts](src/environments/environment.prod.ts) `apiBaseUrl` as `/api`.
2. Keep [vercel.json](vercel.json) pointed at the Render backend URL.
3. Deploy the frontend to Vercel from the repo root.

Example:

```ts
export const environment = {
  production: true,
  geminiApiKey: 'YOUR_GEMINI_API_KEY',
  apiBaseUrl: '/api'
};
```

And in vercel.json:

```json
{
	"outputDirectory": "dist/angular-app",
	"rewrites": [
		{
			"source": "/api/:path*",
			"destination": "https://campvia-api.onrender.com/api/:path*"
		},
		{
			"source": "/(.*)",
			"destination": "/index.html"
		}
	]
}
```

## 4. Deploy Frontend on Vercel

1. Open Vercel Dashboard > Add New > Project.
2. Import the same GitHub repository.
3. Use the root project settings:
	Framework Preset: Angular
	Build Command: `npm run build:prod`
	Output Directory: `dist/angular-app`
4. Deploy.
5. Copy the frontend URL and add it to the backend `CORS_ORIGIN` value if you want to lock CORS down more tightly than `https://*.vercel.app`.
6. Redeploy the backend after changing `CORS_ORIGIN`.

## 5. Verify End-to-End Production

Run this checklist:

1. Open frontend URL and test login
2. Check Network tab for API calls to your Render URL (not localhost)
3. Upload a notice/document to confirm uploads route works
4. Test payment order creation endpoint
5. Check Atlas collections update in real time

## 5. Important Deployment Note

Notice file uploads currently go to the backend filesystem under `backend/uploads`. That works for development and basic deployments, but Render’s filesystem is not a long-term storage layer. If you need uploaded files to survive redeploys and restarts, move them to object storage like S3, Cloudinary, or a Render persistent disk.

## 6. Performance Tips (Low Lag / Fast Loading)

No system can guarantee zero lag everywhere, but this setup minimizes delay:

1. Keep Vercel + Render + Atlas in nearby regions
2. Keep API payloads small and paginate large lists
3. Enable backend compression (already enabled)
4. Use production builds only (already configured)
5. Keep images optimized and avoid huge uploads
6. Monitor Render logs for slow endpoints
7. Monitor Atlas slow queries and add indexes where needed

## 7. Local Development Commands

From project root:

```bash
npm install
cd backend && npm install && cd ..
npm run dev:all
```

If ports are busy, dev:all already clears 4200 and 5000 before starting.

## 8. Production Files Added/Updated

1. angular.json (production file replacement)
2. src/environments/environment.ts (apiBaseUrl)
3. src/environments/environment.prod.ts (production API target)
4. src/app/services/api.service.ts (env based API URL)
5. src/app/services/razorpay.service.ts (env based API URL)
6. backend/server.js (CORS origin allowlist + gzip compression)
7. backend/package.json (compression dependency)
8. backend/.env.example (deployment env template)
9. .gitignore (ignore env files)
