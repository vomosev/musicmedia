# Integration Notes for musicmedia

## Overview

MusicMedia is a responsive platform for authenticated artists to:

- Manage music distribution releases and tracks
- Register publishing works
- Create marketing campaigns
- Review dashboard summaries and recent activity

The application consists of two separately deployed processes:

1. **Next.js App Router frontend** — renders the public and authenticated user interfaces. All API requests are deferred until browser runtime.
2. **HTTPS Express API** — provides authentication and platform endpoints, uses MySQL for application data and persisted sessions, and hashes passwords with bcrypt.

The production frontend is expected at:

- `https://musicmedia.arx-app.com`

The browser-facing API URL defaults to:

- `https://musicmedia-api.arx-app.com:50101`

Authentication uses a secure, database-persisted Express session cookie. Frontend requests include credentials, so the frontend and API must be served from allowed HTTPS subdomains of `arx-app.com`.

## Prerequisites

Install or provide the following before setup:

- A Node.js version compatible with the `engines` requirement in `package.json`
- npm
- MySQL
- PM2 for production frontend process management:
  ```bash
  npm install --global pm2
  ```
- DNS records for the frontend and API hosts
- Valid TLS certificate files for the API at:
  - `/home/arx-app/backends/certs/certificate.crt`
  - `/home/arx-app/backends/certs/private.key`
- A MySQL database and dedicated application user with permission to use the MusicMedia schema
- Network access from the Express API host to the MySQL server

The API only permits credentialed browser traffic from HTTPS subdomains of `arx-app.com`. Local HTTP frontend origins are not part of the production CORS policy unless the server security configuration is deliberately adjusted for local development.

### Port planning

The supplied PM2 configuration fixes the Next.js frontend to port `50101`. The example API configuration also uses `BACKEND_PORT=50101`.

Two processes cannot bind the same host interface and port simultaneously. Use one of these deployment models:

- Run the frontend and API on separate hosts or isolated network addresses, both using port `50101`; or
- Keep the frontend on its required port `50101` and assign the API a different available HTTPS port, then update `BACKEND_PORT` and `NEXT_PUBLIC_API_BASE_URL` accordingly.

## Installation

### 1. Place the project in its production directory

The supplied PM2 configuration expects the project at:

```text
/home/arx-app/backends/musicmedia
```

Change into that directory:

```bash
cd /home/arx-app/backends/musicmedia
```

If deploying elsewhere, update `ecosystem.config.js` before using PM2.

### 2. Install Node.js dependencies

Install the dependencies declared in `package.json`:

```bash
npm install
```

For a reproducible production deployment with an existing lockfile, prefer:

```bash
npm ci
```

The package includes Next.js, React, Express, CORS, dotenv, mysql2, bcrypt, express-session, and Helmet.

### 3. Create the MySQL database and application user

Connect to MySQL as an administrator:

```bash
mysql -u root -p
```

Create the database and a dedicated user, adapting the host and password to the deployment:

```sql
CREATE DATABASE musicmedia
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

CREATE USER 'musicmedia_user'@'127.0.0.1'
  IDENTIFIED BY 'replace-with-a-strong-password';

GRANT ALL PRIVILEGES ON musicmedia.* TO 'musicmedia_user'@'127.0.0.1';
FLUSH PRIVILEGES;
```

If the API connects from another host, replace `127.0.0.1` in the MySQL account definition with the appropriate restricted source host.

Import the supplied schema:

```bash
mysql -u musicmedia_user -p -h 127.0.0.1 musicmedia < schema.sql
```

`schema.sql` creates the UTF-8 tables for:

- Users
- Persisted sessions
- Distribution releases
- Release tracks
- Publishing works
- Marketing campaigns

It also defines ownership foreign keys, cascading behavior, constraints, timestamps, and indexes used by dashboard and list queries.

### 4. Configure environment variables

Copy the example file:

```bash
cp .env.example .env
```

Edit `.env` and replace all placeholder secrets and connection values:

```bash
chmod 600 .env
```

Do not commit `.env`. The repository’s `.gitignore` retains `.env.example` while excluding local environment files.

Because `NEXT_PUBLIC_API_BASE_URL` is exposed to browser code, it is not a secret. All database credentials and `SESSION_SECRET` must remain server-side secrets.

### 5. Install the API TLS files

Ensure the administrator-provided certificate and private key are present at the exact paths expected by `server/index.js`:

```text
/home/arx-app/backends/certs/certificate.crt
/home/arx-app/backends/certs/private.key
```

Restrict access to the private key while allowing the API process to read it. For example, adapt the owner and group to the service account:

```bash
chmod 644 /home/arx-app/backends/certs/certificate.crt
chmod 600 /home/arx-app/backends/certs/private.key
```

The Express server creates HTTPS directly and will not start if these files are missing or unreadable.

### 6. Build the Next.js frontend

Create the required `.next` production build:

```bash
npm run build
```

The build does not contact the API. Dashboard, authentication, release, publishing, and campaign requests occur only after the relevant client components mount in the browser.

## Environment Variables

All variables are listed in `.env.example`. Set them in `.env` for direct execution and in the deployment environment where appropriate.

### `NEXT_PUBLIC_API_BASE_URL`

Public HTTPS base URL used by the browser for runtime API requests.

Example:

```dotenv
NEXT_PUBLIC_API_BASE_URL=https://musicmedia-api.arx-app.com:50101
```

This value is intentionally browser-visible. It must:

- Use HTTPS in production
- Resolve from end-user browsers
- Point to the Express API’s externally reachable port
- Match the host and port allowed by network and firewall rules

If unset, `lib/api.js` uses the exact fallback:

```text
https://musicmedia-api.arx-app.com:50101
```

Restart and rebuild the frontend after changing this public Next.js variable so the intended value is available to client code.

### `BACKEND_PORT`

HTTPS port on which the Express backend listens.

Example:

```dotenv
BACKEND_PORT=50101
```

The selected port must be available on the API host and must correspond to the port in `NEXT_PUBLIC_API_BASE_URL`. It must not conflict with the Next.js port when both processes run on the same host interface.

### `DB_HOST`

Hostname or IP address of the directly connected MySQL server.

Example:

```dotenv
DB_HOST=127.0.0.1
```

The API uses this value in the `mysql2/promise` connection pool configured by `server/config/db.js`.

### `DB_USER`

Dedicated MySQL application user.

Example:

```dotenv
DB_USER=musicmedia_user
```

Grant this account access only to the MusicMedia database and only from the required API host.

### `DB_PASSWORD`

Password for the MySQL application user.

Example:

```dotenv
DB_PASSWORD=replace-with-a-strong-password
```

Use a strong unique password. Never expose this value to the frontend or commit it to source control.

### `DB_NAME`

Name of the MySQL database containing the MusicMedia tables.

Example:

```dotenv
DB_NAME=musicmedia
```

This database must be initialized with `schema.sql` before the application is used.

### `SESSION_SECRET`

Long random secret used to sign Express session cookies.

Example:

```dotenv
SESSION_SECRET=replace-with-at-least-32-random-characters
```

Generate a high-entropy production value, for example:

```bash
openssl rand -base64 48
```

Keep the value stable across API restarts and consistent across API instances. Rotating it invalidates existing signed session cookies.

### `NODE_ENV`

Runtime environment controlling production security and error-handling behavior.

Example:

```dotenv
NODE_ENV=production
```

Use `production` for deployment so secure cookie behavior, error redaction, and other production safeguards are active.

### `PORT`

Port used by the Next.js process. The supplied PM2 configuration sets this to the required production frontend port.

Example:

```dotenv
PORT=50101
```

`ecosystem.config.js` runs the frontend with production `PORT=50101`. The `package.json` Next.js scripts are also configured around the required frontend port.

## Running the Application

### Available npm scripts

The project defines these scripts in `package.json`:

- `npm run dev` — run the Next.js development server
- `npm run build` — create the `.next` production build
- `npm run start` — run the built Next.js frontend
- `npm run server` — run the HTTPS Express API

Install dependencies and configure `.env` before using them.

### Development

Run the frontend in one terminal:

```bash
npm run dev
```

Run the HTTPS API in another terminal:

```bash
npm run server
```

The API requires:

- A reachable initialized MySQL database
- All required backend environment variables
- The certificate and private key at the configured fixed paths
- A free `BACKEND_PORT`

Because the API’s CORS and trusted-origin protections target HTTPS `*.arx-app.com` origins, browser testing should use an appropriate HTTPS development or staging subdomain. If local HTTP development is required, explicitly revise and review `server/middleware/security.js` and the CORS configuration rather than disabling origin protection indiscriminately.

Verify the API health endpoint:

```bash
curl --cacert /home/arx-app/backends/certs/certificate.crt \
  https://musicmedia-api.arx-app.com:50101/health
```

A healthy API returns exactly:

```json
{"status":"ok"}
```

If the certificate is issued by a publicly trusted authority, the `--cacert` option is normally unnecessary.

### Production frontend with PM2

Build the frontend first:

```bash
cd /home/arx-app/backends/musicmedia
npm ci
npm run build
```

Start it with the supplied CommonJS PM2 configuration:

```bash
pm2 start ecosystem.config.js
```

Persist and inspect the process:

```bash
pm2 save
pm2 status
pm2 logs musicmedia
```

After deploying frontend changes, rebuild and restart:

```bash
npm ci
npm run build
pm2 restart musicmedia
```

The PM2 configuration runs:

```text
node_modules/.bin/next start
```

from:

```text
/home/arx-app/backends/musicmedia
```

with production `PORT=50101`.

### Production API with `START.sh`

Ensure the script is executable:

```bash
chmod +x START.sh
```

Launch the API as a detached background process:

```bash
./START.sh
```

`START.sh` uses strict shell error handling, creates the log directory, runs `npm run server` in the background, records its PID, and redirects API output to logs.

Use the generated PID file and log output for operational checks. Before launching the script again, verify that an API process is not already bound to `BACKEND_PORT`.

The API and frontend are separate processes. Starting PM2 does not start the Express API, and running `START.sh` does not start the Next.js frontend.

### Authentication behavior

Authentication is session-based:

1. Signup or login establishes an Express session.
2. Only the authenticated user ID is stored in the session.
3. Session data is persisted in the MySQL `sessions` table.
4. The API returns a secure cookie scoped for `.arx-app.com`.
5. Browser API requests include credentials.
6. `AuthProvider` requests `GET /api/auth/me` only after browser runtime mount.
7. Logout destroys the stored session and clears the cookie.

The public landing, login, and signup interfaces remain available if the API is offline. Authenticated screens display actionable unavailable or retry states rather than exposing internal server details.

### API endpoints

#### Health

- `GET /health` — returns `{"status":"ok"}`

#### Authentication

- `POST /api/auth/signup` — create an account and establish a session
- `POST /api/auth/login` — verify credentials and establish a session
- `POST /api/auth/logout` — destroy the authenticated session
- `GET /api/auth/me` — return the current safe user profile

#### Platform

All platform endpoints require an authenticated session:

- `GET /api/dashboard` — return account summaries and recent activity
- `GET /api/releases` — list the current user’s releases
- `POST /api/releases` — create a release and its primary track
- `GET /api/works` — list the current user’s publishing works
- `POST /api/works` — create a publishing work
- `GET /api/campaigns` — list the current user’s campaigns
- `POST /api/campaigns` — create a marketing campaign

State-changing requests are protected by trusted-origin validation. SQL queries are parameterized and scoped to `req.session.userId`.

## Project Structure

```text
musicmedia/
├── app/
├── components/
├── lib/
├── server/
├── .env.example
├── .gitignore
├── ecosystem.config.js
├── next.config.js
├── package.json
├── README.md
├── schema.sql
└── START.sh
```

### Root configuration

- `.env.example` — safe templates for every required environment variable.
- `.gitignore` — excludes dependencies, builds, secrets, logs, PID files, and local tooling artifacts.
- `package.json` — dependencies, Node.js engine requirement, and frontend/API scripts.
- `next.config.js` — strict-mode and production response-header configuration without build-time API dependencies.
- `ecosystem.config.js` — PM2 definition for the production Next.js process.
- `START.sh` — detached HTTPS API launcher with logging and PID recording.
- `schema.sql` — complete MySQL schema for users, sessions, releases, tracks, works, and campaigns.
- `README.md` — repository-level setup, deployment, endpoint, and structure documentation.

### `app/`

The Next.js App Router application:

- `app/layout.jsx` — root metadata, Inter font, global stylesheet import, `AuthProvider`, and shared `AppShell`.
- `app/page.jsx` — public landing page.
- `app/login/page.jsx` and `app/signup/page.jsx` — runtime authentication forms.
- `app/dashboard/page.jsx` — authenticated summary interface.
- `app/releases/page.jsx` — distribution release management.
- `app/publishing/page.jsx` — publishing work registration.
- `app/campaigns/page.jsx` — marketing campaign management.
- `app/loading.jsx` — accessible route loading state with reserved layout space.
- `app/error.jsx` — retryable App Router error boundary.
- `app/not-found.jsx` — missing-page state with a home link.
- `app/globals.css` — the application’s single token-based global semantic CSS system.

### `components/`

Shared shell, authentication state, icons, UI primitives, and feature views:

- `components/AppShell.jsx` — common header, centered main container, and footer.
- `components/SiteHeader.jsx` — responsive authenticated navigation and mobile modal menu.
- `components/SiteFooter.jsx` — platform links and canonical site reference.
- `components/AuthProvider.jsx` — runtime session lookup, user state, refresh, and logout.
- `components/Icon.jsx` — accessible inline SVG icon mapping.
- `components/ui/` — buttons, fields, cards, modal, responsive table, badges, spinner, empty states, and loading/error states.
- `components/features/LandingView.jsx` — static product landing content.
- `components/features/AuthForm.jsx` — login and signup validation and submission.
- `components/features/DashboardView.jsx` — runtime dashboard data and summaries.
- `components/features/ReleasesView.jsx` — release listing and creation workflow.
- `components/features/PublishingView.jsx` — work listing and registration workflow.
- `components/features/CampaignsView.jsx` — campaign listing and creation workflow.

### `lib/`

Browser-safe shared utilities:

- `lib/api.js` — runtime-only API client, credentialed requests, timeouts, response parsing, and normalized errors.
- `lib/formatters.js` — stable date, currency, status, and text formatting helpers.

### `server/`

The HTTPS Express API:

- `server/index.js` — environment validation, HTTPS startup, proxy trust, Helmet, CORS, sessions, routers, database verification, and graceful shutdown.
- `server/config/db.js` — MySQL promise-pool creation and connection check.
- `server/config/sessionStore.js` — MySQL-backed `express-session` store and expired-session cleanup.
- `server/middleware/requireAuth.js` — authenticated-session enforcement.
- `server/middleware/security.js` — allowed-origin and trusted-origin checks.
- `server/middleware/errorHandler.js` — async wrapping, JSON 404 handling, and production-safe errors.
- `server/routes/healthRoutes.js` — health endpoint.
- `server/routes/authRoutes.js` — signup, login, logout, and current-user routes.
- `server/routes/platformRoutes.js` — dashboard, release, work, and campaign routes.
- `server/controllers/authController.js` — account validation, bcrypt hashing/comparison, session regeneration, and safe user responses.
- `server/controllers/platformController.js` — user-scoped queries, validation, aggregation, and transactional release creation.

## Next Steps / Production Considerations

1. **Resolve process port placement.** Confirm that the fixed frontend port and API port do not compete on the same interface. If they share a server, assign the API another port and update both `BACKEND_PORT` and `NEXT_PUBLIC_API_BASE_URL`.

2. **Configure DNS and firewall rules.** Route `musicmedia.arx-app.com` to the frontend and `musicmedia-api.arx-app.com` to the API. Expose only required HTTPS ports and restrict MySQL to trusted application hosts.

3. **Use trusted TLS certificates.** Monitor expiration for:
   - `/home/arx-app/backends/certs/certificate.crt`
   - `/home/arx-app/backends/certs/private.key`

   Restart the API after certificate renewal because the HTTPS server reads the files at startup.

4. **Protect secrets.** Store `DB_PASSWORD` and `SESSION_SECRET` in a deployment secret manager where possible. Restrict `.env` permissions and never place backend secrets in variables prefixed with `NEXT_PUBLIC_`.

5. **Back up MySQL.** Schedule encrypted backups and test restoration of all application tables, especially `users`, `sessions`, releases, works, and campaigns.

6. **Manage schema changes.** Treat `schema.sql` as initial provisioning. Introduce versioned database migrations before changing a live production schema.

7. **Supervise the API process.** `START.sh` launches a detached process but is not a full service manager. For automatic restart, boot-time startup, resource limits, and log rotation, consider a dedicated PM2 entry or a systemd service for `npm run server`.

8. **Configure log rotation and monitoring.** Monitor frontend and API logs, process availability, MySQL pool errors, authentication failure rates, and `/health`. Ensure logs do not contain passwords, session cookies, database details, or sensitive user input.

9. **Review proxy behavior.** `server/index.js` trusts a proxy and uses secure cookies. Ensure the reverse proxy preserves the original HTTPS scheme and forwards appropriate headers. Do not expose the API through an untrusted proxy path.

10. **Validate cookie and CORS behavior.** Production requests must originate from HTTPS `*.arx-app.com` hosts and include credentials. Test signup, login, session persistence, logout, and state-changing origin checks using the final public domains.

11. **Harden MySQL access.** Use a least-privilege application account, require encrypted database transport when MySQL is remote, rotate credentials, and avoid exposing port `3306` publicly.

12. **Deploy frontend updates correctly.** Any frontend change requires:

    ```bash
    npm ci
    npm run build
    pm2 restart musicmedia
    ```

    Changes to `NEXT_PUBLIC_API_BASE_URL` also require rebuilding the frontend.

13. **Test responsive and accessibility behavior.** Verify authentication, forms, tables, modals, keyboard focus trapping, reduced motion, error states, and 360px layouts on representative browsers and devices.

14. **Add operational checks.** Use `/health` for API liveness and add separate readiness monitoring for MySQL connectivity if required. The frontend should also be monitored at `https://musicmedia.arx-app.com`.

15. **Plan horizontal scaling carefully.** Database-persisted sessions support multiple API instances, but every instance must share the same `SESSION_SECRET`, database, cookie configuration, TLS policy, and compatible application version.

## Database Provisioning

A mysql database has been automatically provisioned for this app.

- **Database:** app_musicmedia
- **Host:** testdb.gridiron-app.com
- **Port:** 3306
- **User:** musicmedia
- **Credentials stored in Vault at:** `secret/data/mysql/musicmedia`

Retrieve the password securely from Vault and set it as an environment variable (e.g. `DB_PASSWORD`) in your deployment settings — do not commit it to source control.
