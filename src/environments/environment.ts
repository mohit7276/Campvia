// IMPORTANT: Do NOT store real API keys in this file. This repository had
// a leaked key earlier; keep secrets on the server (backend/.env) or in a
// CI/hosting secrets manager. The frontend calls the backend `/chat` route
// which uses `process.env.GEMINI_API_KEY` on the server side.
export const environment = {
    production: false,
    // Keep API keys server-side. Frontend should not include secrets.
    apiBaseUrl: '/api'
};
