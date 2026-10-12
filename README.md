# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:


## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
# Job Application Tracker

## Run locally

Requirements: Node.js and MongoDB running at `mongodb://localhost:27017/`.

Copy `backend/.env.example` to `backend/.env` and adjust the settings if needed. The MongoDB database is named `job_application_tracker`; MongoDB creates it when the first account is registered. If `JWT_SECRET` is blank, a development-only signing key is generated when the backend starts. Configure a persistent `JWT_SECRET` before deploying.

Start the backend in one terminal:

```powershell
cd backend
npm install
npm run dev
```

Start the Vite app from the project root in a second terminal:

```powershell
npm install
npm run dev
```

Open the local URL printed by Vite. The development server proxies `/api` requests to the backend on port 5000.

## Authentication

- `POST /api/auth/signup` creates an account and hashes its password with bcrypt.
- `POST /api/auth/login` verifies the password and sets an HTTP-only authentication cookie.
- Email addresses are normalized to lowercase. Passwords must be at least 8 characters.

### Google sign-in

Create a Web application OAuth client in Google Cloud Console. Add `http://localhost:5000/api/auth/google/callback` as an authorized redirect URI, then put the client ID and client secret in `backend/.env` as `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`. Keep the secret in the backend environment only. Set `GOOGLE_CALLBACK_URL` to the same registered URI if it differs.

The Google button supports both sign-up and login: a new verified Google email creates an account, while an existing verified email is linked to its account. The backend uses signed OAuth state, PKCE, and the existing HTTP-only session cookie. Without credentials configured, the button returns to the auth page with a setup error toast.

## Dashboard

After signing in, `/dashboard` shows statistics only, including totals, stage distribution, monthly activity, and response rate. `/applications` is the Kanban board; search applications, add or edit cards, and drag them between stages. Applications can also be deleted. `GET`, `POST`, `PUT`, and `DELETE /api/applications` require the authentication cookie, and each record is scoped to its owner.

Login, signup, logout, and application actions show toast notifications for success and failure.

The frontend and backend do not log passwords. The cookie is configured as secure in production; set `JWT_SECRET`, `NODE_ENV=production`, and `CLIENT_ORIGIN` in the deployment environment.
