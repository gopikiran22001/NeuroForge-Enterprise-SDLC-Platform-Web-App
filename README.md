# NeuroForge Enterprise SDLC Platform — Frontend

React SPA frontend for the NeuroForge Enterprise SDLC Platform.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | React 19 |
| Build Tool | Vite 8 |
| Routing | TanStack Router v1 |
| Data Fetching | TanStack Query v5 |
| UI Components | Radix UI + shadcn/ui |
| Styling | Tailwind CSS v4 |
| Forms | React Hook Form + Zod |
| Animations | Framer Motion |
| Charts | Recharts |
| Package Manager | Bun / npm |

---

## Project Structure

```
src/
├── routes/          # File-based routes (TanStack Router)
│   ├── index.jsx            # Dashboard
│   ├── login.jsx            # Authentication
│   ├── register.jsx         # Registration
│   ├── users.jsx            # User management
│   ├── projects/            # Projects + detail view
│   ├── teams.jsx            # Team management
│   ├── sprints.jsx          # Sprint management
│   ├── milestones.jsx       # Milestone tracking
│   ├── roles.jsx            # Role management
│   ├── settings.jsx         # App settings
│   └── ...                  # Audit log, reports, pipelines, etc.
├── components/      # Shared UI components
├── services/        # API service layer (api-services.js)
├── lib/
│   ├── api.js       # Fetch client with JWT refresh logic
│   ├── session.jsx  # Auth session context
│   ├── permissions.js
│   └── ...
└── styles.css       # Global styles
```

---

## Getting Started

### Prerequisites

- Node.js 18+ (or Bun)
- Running backend API (see `../Backend/README.md`)

### 1. Clone and configure

```bash
git clone <repo-url>
cd Frontend
cp .env.example .env
# Edit .env if your backend runs on a different port
```

### 2. Install dependencies

```bash
npm install
# or
bun install
```

### 3. Run in development

```bash
npm run dev
# or
bun dev
```

The app will be available at `http://localhost:3000`.

In development, Vite automatically proxies all `/api/*` requests to the backend URL defined in `VITE_API_BASE_URL`, so no CORS issues during local development.

---

## Environment Variables

Copy `.env.example` to `.env`. **Never commit `.env`.**

| Variable | Description | Default |
|---|---|---|
| `VITE_API_BASE_URL` | Backend API base URL | `http://localhost:8080` |

> **Note:** Vite env vars are **baked in at build time**. For production deployments, set `VITE_API_BASE_URL` before running `npm run build`.

---

## Available Scripts

| Script | Description |
|---|---|
| `npm run dev` | Start dev server at `localhost:3000` with hot reload |
| `npm run build` | Production build (outputs to `dist/`) |
| `npm run build:dev` | Development mode build |
| `npm run preview` | Preview the production build locally |
| `npm run lint` | Run ESLint |
| `npm run format` | Format code with Prettier |

---

## Key Features

- **Authentication** — JWT-based auth with HttpOnly cookie sessions and automatic token refresh
- **Dashboard** — Overview of projects, sprints, and milestones
- **Project Management** — Create and manage projects with full CRUD
- **Team Management** — Organize users into teams
- **Sprint Tracking** — Plan and track development sprints
- **Milestone Tracking** — Monitor key project milestones
- **User Management** — Admin-level user management with role assignment
- **Role Management** — Fine-grained permission control
- **Settings** — Application and profile settings

---

## Production Build

```bash
# Set backend URL at build time
VITE_API_BASE_URL=https://api.yourdomain.com npm run build
```

The `dist/` folder contains a fully static bundle — deploy to any static host (Nginx, Vercel, Netlify, S3 + CloudFront, etc.).

### Nginx example config

```nginx
server {
    listen 80;
    root /usr/share/nginx/html;
    index index.html;

    # SPA fallback — route all paths to index.html
    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

---

## API Communication

All API calls go through [`src/lib/api.js`](src/lib/api.js), which provides:

- Automatic `credentials: "include"` for cookie-based auth
- **Silent token refresh** — on a `401` response, the client automatically calls `/api/auth/refresh` and retries the original request
- **Queue deduplication** — concurrent requests during a refresh are queued and retried together
- Consistent error handling with typed error objects
