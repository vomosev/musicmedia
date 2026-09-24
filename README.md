# MusicMedia

MusicMedia is a responsive music distribution, publishing, and marketing platform for artists. Authenticated users can manage releases and tracks, register publishing works, create marketing campaigns, and review dashboard summaries.

The application consists of:

- A Next.js App Router frontend
- An HTTPS Express API
- A MySQL database
- MySQL-persisted, cookie-based sessions
- bcrypt password hashing
- PM2 configuration for the production frontend
- A detached API startup script

## Production URLs

- Frontend: <https://musicmedia.arx-app.com>
- API: <https://musicmedia-api.arx-app.com:50101>
- API health check: <https://musicmedia-api.arx-app.com:50101/health>

The browser performs API requests only at runtime. No backend API connection is required during `npm run build`.

## Prerequisites

Install and configure the following before deploying MusicMedia:

- A Node.js version satisfying the `engines` requirement in `package.json`
- npm
- MySQL 8 or a compatible MySQL server
- An application database and MySQL user
- TLS certificates supplied by the server administrator
- PM2 for managed production frontend deployment
- DNS and reverse-proxy or firewall configuration for the production hostnames

The API connects directly to MySQL using the configured database credentials.

## Installation

Clone or copy the project to the deployment directory:

```bash
cd /home/arx-app/backends/musicmedia
npm install
```

Create the local environment file:

```bash
cp .env.example .env
```

Edit `.env` with deployment-specific values. Do not commit `.env`, database credentials, session secrets, or private keys.

## MySQL Setup

Create the database if it does not already exist:

```sql
CREATE DATABASE musicmedia
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;
```

Create a dedicated application user and grant only the permissions required by the application. Use deployment-specific credentials rather than the examples below:

```sql
CREATE USER 'musicmedia_app'@'application-host' IDENTIFIED BY 'replace-with-a-strong-password';
GRANT SELECT, INSERT, UPDATE, DELETE ON musicmedia.* TO 'musicmedia_app'@'application-host';
FLUSH PRIVILEGES;
```

Import the schema:

```bash
mysql -h <database-host> -u <database-user> -p <database-name> < schema.sql
```

For a local database using the default example database name:

```bash
mysql -u musicmedia_app -p musicmedia < schema.sql
```

The schema creates the following tables:

- `users`
- `sessions`
- `distribution_releases`
- `release_tracks`
- `publishing_works`
- `marketing_campaigns`

The tables use `utf8mb4`, ownership foreign keys, indexes for list and dashboard queries, timestamps, validation-oriented constraints, and cascading cleanup where appropriate.

Re-running destructive schema operations against a populated production database should only be done after reviewing `schema.sql` and creating a verified backup.

## Environment Variables

All supported variables are listed in `.env.example`.

### `NEXT_PUBLIC_API_BASE_URL`

Public HTTPS origin used by the browser for runtime API requests.

Production value:

```dotenv
NEXT_PUBLIC_API_BASE_URL=https://musicmedia-api.arx-app.com:50101
```

Because this variable is prefixed with `NEXT_PUBLIC_`, its value is embedded in the frontend bundle. It must not contain credentials or secrets. If omitted, the frontend API helper uses its configured production fallback.

Changes to this value require rebuilding the frontend.

### `BACKEND_PORT`

HTTPS port used by the Express API server.

Example:

```dotenv
BACKEND_PORT=50101
```

The API and frontend are separate processes and may use the same numeric port only when they are exposed through separate hosts, containers, network interfaces, or proxy mappings. They cannot bind the same host interface and port simultaneously.

### `DB_HOST`

Hostname or address of the directly connected MySQL server.

Example:

```dotenv
DB_HOST=127.0.0.1
```

### `DB_USER`

MySQL application username.

Example:

```dotenv
DB_USER=musicmedia_app
```

### `DB_PASSWORD`

Password for the MySQL application user.

Example:

```dotenv
DB_PASSWORD=replace-with-a-strong-password
```

This value is secret and must never be committed.

### `DB_NAME`

Name of the MySQL database containing the MusicMedia tables.

Example:

```dotenv
DB_NAME=musicmedia
```

### `SESSION_SECRET`

Long, random secret used to sign session cookies.

Example format:

```dotenv
SESSION_SECRET=replace-with-a-long-random-secret
```

Generate a unique production value using a cryptographically secure secret generator. Changing it invalidates existing signed sessions.

### `NODE_ENV`

Runtime mode used by Next.js and Express security and error-handling behavior.

Development:

```dotenv
NODE_ENV=development
```

Production:

```dotenv
NODE_ENV=production
```

Production mode enables secure cookie behavior and suppresses internal server details from API error responses.

### `PORT`

Port supplied to the Next.js process. The production frontend is fixed to port `50101` by the PM2 configuration.

Example:

```dotenv
PORT=50101
```

## TLS Certificates

The Express API always starts as an HTTPS server and reads administrator-provided TLS files from these exact paths:

```text
/home/arx-app/backends/certs/certificate.crt
/home/arx-app/backends/certs/private.key
```

Before starting the API, an administrator must:

1. Install a valid certificate at `certificate.crt`.
2. Install the corresponding private key at `private.key`.
3. Ensure the operating-system user running MusicMedia can read both files.
4. Restrict private-key permissions so unrelated users cannot read it.
5. Ensure the certificate covers the deployed API hostname.
6. Renew and replace the files before certificate expiration.

Example permission setup must be adapted to the actual service account and administrator group:

```bash
sudo chown root:<service-group> /home/arx-app/backends/certs/certificate.crt
sudo chown root:<service-group> /home/arx-app/backends/certs/private.key
sudo chmod 640 /home/arx-app/backends/certs/certificate.crt
sudo chmod 640 /home/arx-app/backends/certs/private.key
```

Do not place private keys in the repository.

## Development

Install dependencies and configure `.env` first.

### Run the frontend

```bash
npm run dev
```

The development command starts Next.js on the frontend port defined by the project scripts.

### Run the API

In a separate terminal:

```bash
npm run server
```

The API validates required environment variables, verifies the MySQL connection, reads the configured TLS files, and starts an HTTPS server on `BACKEND_PORT`.

The frontend and API must be separate processes. Both commands should be run from the project root.

The API accepts credentialed browser requests from approved HTTPS `arx-app.com` origins. State-changing requests from untrusted origins are rejected. For browser-based development, use an approved HTTPS development hostname or an appropriate local reverse-proxy setup rather than weakening the origin checks.

## Production Build

Create the `.next` production build before starting the frontend:

```bash
npm install
npm run build
```

The generated `.next` directory is required by `npm run start` and PM2. It is build output and is not committed to source control.

The build does not fetch account or platform data. Authentication, dashboard, release, publishing, and campaign requests are deferred until browser runtime.

To test the production frontend directly:

```bash
NODE_ENV=production npm run start
```

Start the API separately:

```bash
NODE_ENV=production npm run server
```

## Production Deployment

The frontend and API are intentionally deployed as separate processes.

### 1. Prepare the application

```bash
cd /home/arx-app/backends/musicmedia
npm install
cp .env.example .env
```

Configure `.env`, install the TLS certificate files, import `schema.sql`, and verify database access.

### 2. Build the frontend

```bash
npm run build
```

This creates the required `.next` build.

### 3. Start the API with `START.sh`

Make the script executable if needed:

```bash
chmod +x START.sh
```

Start the detached HTTPS API process:

```bash
./START.sh
```

`START.sh` uses strict shell error handling, creates the log directory, launches `npm run server` as a detached background task, records its process ID, and redirects process output to the configured log files.

The script starts the API only. It does not build or start the Next.js frontend.

Before starting another API instance, check the recorded PID and existing process to avoid duplicate servers or port conflicts.

### 4. Start the frontend with PM2

Install PM2 globally if it is not already managed by the server:

```bash
npm install --global pm2
```

Start the production frontend from the supplied configuration:

```bash
cd /home/arx-app/backends/musicmedia
pm2 start ecosystem.config.js
```

The PM2 configuration:

- Uses CommonJS configuration syntax
- Runs `node_modules/.bin/next`
- Starts the production Next.js server
- Uses `/home/arx-app/backends/musicmedia` as the working directory
- Sets production mode
- Uses frontend port `50101`

Useful PM2 commands:

```bash
pm2 status
pm2 logs musicmedia
pm2 restart musicmedia
pm2 stop musicmedia
pm2 delete musicmedia
pm2 save
```

After application code or public environment values change, rebuild and restart:

```bash
npm install
npm run build
pm2 restart musicmedia
```

The API must be restarted separately when backend code or backend environment values change.

## Authentication and Sessions

MusicMedia uses server-side sessions rather than browser-stored authentication tokens.

Authentication behavior includes:

- Signup passwords are hashed with bcrypt before storage.
- Login passwords are compared against the stored bcrypt hash.
- Session identity is regenerated before authentication is established.
- Only the authenticated user ID is stored in the session.
- Session records are persisted in the MySQL `sessions` table.
- The browser sends the session cookie using credentialed HTTPS requests.
- Production cookies are secure and scoped for the `.arx-app.com` domain.
- Logout destroys the server-side session and clears the cookie.
- Protected endpoints return HTTP `401` when no authenticated session exists.
- The frontend checks the current session only after browser runtime mount.
- If the API is unavailable, public pages remain usable and authenticated UI reports an actionable unavailable state.

State-changing requests are protected by trusted-origin checks. Browser requests must originate from an approved HTTPS subdomain of `arx-app.com`.

## API Endpoints

All API responses use JSON except where no response body is required by normal HTTP behavior.

### Health

#### `GET /health`

Public health check.

Successful response:

```json
{"status":"ok"}
```

### Authentication

#### `POST /api/auth/signup`

Creates a user, hashes the password, establishes a persisted session, and returns safe user fields.

Typical input includes:

- Name
- Artist name
- Email
- Password

#### `POST /api/auth/login`

Validates an email and password, regenerates the session, and establishes authenticated identity.

#### `POST /api/auth/logout`

Requires authentication. Destroys the persisted session and clears the session cookie.

#### `GET /api/auth/me`

Requires authentication. Returns the current user's safe account fields.

### Dashboard

#### `GET /api/dashboard`

Requires authentication. Returns account-scoped summary counts and recent releases, publishing works, and campaigns.

### Distribution Releases

#### `GET /api/releases`

Requires authentication. Returns the current user's releases in stable newest-first order.

#### `POST /api/releases`

Requires authentication and a trusted request origin. Creates a release and its primary track in a database transaction.

Validated fields include:

- Release title
- Artist
- Release type
- Release date
- Genre
- Label
- Primary track
- ISRC
- UPC

### Publishing Works

#### `GET /api/works`

Requires authentication. Returns the current user's publishing works in stable newest-first order.

#### `POST /api/works`

Requires authentication and a trusted request origin. Creates a publishing work.

Validated fields include:

- Work title
- Alternate title
- Writers
- Ownership share
- Performing-rights organization
- IPI number
- Registration status

### Marketing Campaigns

#### `GET /api/campaigns`

Requires authentication. Returns the current user's campaigns in stable newest-first order.

#### `POST /api/campaigns`

Requires authentication and a trusted request origin. Creates a marketing campaign.

Validated fields include:

- Campaign name
- Release
- Objective
- Channel
- Budget
- Start date
- End date

## API Errors

The API returns consistent JSON error responses with an HTTP status appropriate to the failure.

Common statuses include:

- `400` for invalid input
- `401` for missing or invalid authentication
- `403` for untrusted state-changing request origins
- `404` for unknown routes or unavailable owned records
- `409` for conflicts such as an existing account email
- `500` for unexpected server failures
- `503` for unavailable services where applicable

Production responses do not expose stack traces, SQL details, credentials, or session internals.

## Security Notes

- Keep `.env` outside source control.
- Never commit TLS private keys.
- Use a unique, long `SESSION_SECRET`.
- Use a dedicated MySQL user with limited privileges.
- Serve both frontend and API exclusively over HTTPS in production.
- Preserve the trusted proxy configuration when deploying behind a reverse proxy.
- Forward the original protocol and host headers correctly.
- Do not disable trusted-origin validation to support local development.
- Restrict direct access to MySQL.
- Back up the database before schema or application upgrades.
- Monitor API and PM2 logs without exposing passwords, cookies, or private user data.

## Project Structure

```text
musicmedia/
├── .env.example
├── .gitignore
├── README.md
├── START.sh
├── ecosystem.config.js
├── next.config.js
├── package.json
├── schema.sql
├── app/
│   ├── error.jsx
│   ├── globals.css
│   ├── layout.jsx
│   ├── loading.jsx
│   ├── not-found.jsx
│   ├── page.jsx
│   ├── campaigns/
│   │   └── page.jsx
│   ├── dashboard/
│   │   └── page.jsx
│   ├── login/
│   │   └── page.jsx
│   ├── publishing/
│   │   └── page.jsx
│   ├── releases/
│   │   └── page.jsx
│   └── signup/
│       └── page.jsx
├── components/
│   ├── AppShell.jsx
│   ├── AuthProvider.jsx
│   ├── Icon.jsx
│   ├── SiteFooter.jsx
│   ├── SiteHeader.jsx
│   ├── features/
│   │   ├── AuthForm.jsx
│   │   ├── CampaignsView.jsx
│   │   ├── DashboardView.jsx
│   │   ├── LandingView.jsx
│   │   ├── PublishingView.jsx
│   │   └── ReleasesView.jsx
│   └── ui/
│       ├── Badge.jsx
│       ├── Button.jsx
│       ├── Card.jsx
│       ├── DataState.jsx
│       ├── EmptyState.jsx
│       ├── Field.jsx
│       ├── Modal.jsx
│       ├── Spinner.jsx
│       └── Table.jsx
├── lib/
│   ├── api.js
│   └── formatters.js
└── server/
    ├── index.js
    ├── config/
    │   ├── db.js
    │   └── sessionStore.js
    ├── controllers/
    │   ├── authController.js
    │   └── platformController.js
    ├── middleware/
    │   ├── errorHandler.js
    │   ├── requireAuth.js
    │   └── security.js
    └── routes/
        ├── authRoutes.js
        ├── healthRoutes.js
        └── platformRoutes.js
```

### Root Files

- `.env.example` documents safe environment variable examples.
- `.gitignore` excludes dependencies, builds, local environment files, logs, process IDs, and editor or operating-system artifacts.
- `README.md` contains installation, deployment, and operational documentation.
- `START.sh` starts the HTTPS API as a detached process and records logs and its PID.
- `ecosystem.config.js` defines the PM2-managed production frontend process.
- `next.config.js` configures strict mode and production-safe response headers.
- `package.json` defines dependencies and the `dev`, `build`, `start`, and `server` scripts.
- `schema.sql` defines the MySQL database schema.

### Frontend Application

- `app/layout.jsx` defines metadata, the Inter font, authentication context, and shared application shell.
- `app/page.jsx` renders the public landing page.
- `app/loading.jsx` provides route-level loading feedback.
- `app/error.jsx` provides a retryable route error boundary.
- `app/not-found.jsx` renders the missing-page state.
- `app/login/page.jsx` and `app/signup/page.jsx` render authentication forms.
- `app/dashboard/page.jsx` renders authenticated performance summaries.
- `app/releases/page.jsx` renders distribution management.
- `app/publishing/page.jsx` renders publishing registrations.
- `app/campaigns/page.jsx` renders campaign management.
- `app/globals.css` contains the shared token-driven responsive design system.

### Shared Components

- `components/AppShell.jsx` composes the shared header, main content container, and footer.
- `components/AuthProvider.jsx` manages runtime session state.
- `components/SiteHeader.jsx` provides responsive navigation and authentication actions.
- `components/SiteFooter.jsx` provides platform links and ownership information.
- `components/Icon.jsx` provides accessible inline SVG icons.
- `components/ui/` contains reusable buttons, fields, cards, tables, badges, modals, spinners, and data states.
- `components/features/` contains the landing, authentication, dashboard, release, publishing, and campaign experiences.

### Frontend Utilities

- `lib/api.js` provides credentialed runtime API requests, timeouts, response parsing, and normalized errors.
- `lib/formatters.js` provides stable date, currency, status, and text formatting.

### API

- `server/index.js` configures and starts the HTTPS Express server.
- `server/config/db.js` creates the MySQL connection pool.
- `server/config/sessionStore.js` implements MySQL-backed Express session persistence.
- `server/controllers/authController.js` handles signup, login, logout, and current-user requests.
- `server/controllers/platformController.js` handles dashboard, release, work, and campaign operations.
- `server/middleware/requireAuth.js` protects authenticated routes.
- `server/middleware/security.js` validates trusted HTTPS origins.
- `server/middleware/errorHandler.js` provides asynchronous routing and safe error responses.
- `server/routes/healthRoutes.js` exposes the health check.
- `server/routes/authRoutes.js` exposes authentication routes.
- `server/routes/platformRoutes.js` exposes authenticated platform routes.