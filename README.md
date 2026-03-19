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

1. Push project to GitHub
2. Open Render Dashboard and click New + > Web Service
3. Connect repository
4. Configure service:
	Root Directory: backend
	Build Command: npm install
	Start Command: npm start
5. Add environment variables from backend/.env.example:
	PORT=5000
	MONGODB_URI=<your atlas uri>
	JWT_SECRET=<strong random value>
	GEMINI_API_KEY=<your key>
	RAZORPAY_KEY_ID=<your key>
	RAZORPAY_KEY_SECRET=<your secret>
	CORS_ORIGIN=https://your-frontend-domain.vercel.app
6. Deploy and copy backend URL (example: https://your-api.onrender.com)
7. Verify health endpoint:

```bash
https://your-api.onrender.com/api/health
```

Expected response:

```json
{"status":"ok"}
```

## 3. Configure Frontend Production API URL

This project uses a Vercel rewrite to forward frontend /api calls to Render.

1. Keep src/environments/environment.prod.ts apiBaseUrl as /api
2. Set geminiApiKey for production
3. Ensure vercel.json rewrite destination points to your Render backend URL

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
	"rewrites": [
		{
			"source": "/api/:path*",
			"destination": "https://your-api.onrender.com/api/:path*"
		}
	]
}
```

## 4. Deploy Frontend on Vercel

1. Open Vercel Dashboard > Add New > Project
2. Import your GitHub repository
3. Configure:
	Framework Preset: Angular
	Build Command: npm run build:prod
	Output Directory: dist/angular-app/browser
4. Deploy
5. Copy frontend URL (example: https://your-app.vercel.app)
6. Update backend env CORS_ORIGIN to this URL (or wildcard like https://*.vercel.app) and redeploy backend

## 5. Verify End-to-End Production

Run this checklist:

1. Open frontend URL and test login
2. Check Network tab for API calls to your Render URL (not localhost)
3. Upload a notice/document to confirm uploads route works
4. Test payment order creation endpoint
5. Check Atlas collections update in real time

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
