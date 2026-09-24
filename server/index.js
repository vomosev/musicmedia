require('dotenv').config();

const fs = require('fs');
const https = require('https');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const session = require('express-session');

const REQUIRED_ENVIRONMENT_VARIABLES = [
  'BACKEND_PORT',
  'DB_HOST',
  'DB_USER',
  'DB_PASSWORD',
  'DB_NAME',
  'SESSION_SECRET',
];

const missingEnvironmentVariables = REQUIRED_ENVIRONMENT_VARIABLES.filter(
  (name) => !process.env[name] || !process.env[name].trim()
);

if (missingEnvironmentVariables.length > 0) {
  throw new Error(
    `Missing required environment variables: ${missingEnvironmentVariables.join(', ')}`
  );
}

const backendPort = Number.parseInt(process.env.BACKEND_PORT, 10);

if (
  !Number.isInteger(backendPort) ||
  backendPort < 1 ||
  backendPort > 65535
) {
  throw new Error('BACKEND_PORT must be an integer between 1 and 65535.');
}

if (
  process.env.NODE_ENV === 'production' &&
  process.env.SESSION_SECRET.trim().length < 32
) {
  throw new Error(
    'SESSION_SECRET must contain at least 32 characters in production.'
  );
}

const { pool, checkDatabaseConnection } = require('./config/db');
const { SessionStore } = require('./config/sessionStore');
const {
  isAllowedArxOrigin,
  requireTrustedOrigin,
} = require('./middleware/security');
const {
  notFoundHandler,
  errorHandler,
} = require('./middleware/errorHandler');
const healthRoutes = require('./routes/healthRoutes');
const authRoutes = require('./routes/authRoutes');
const platformRoutes = require('./routes/platformRoutes');

const CERTIFICATE_PATH =
  '/home/arx-app/backends/certs/certificate.crt';
const PRIVATE_KEY_PATH =
  '/home/arx-app/backends/certs/private.key';
const SESSION_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;
const SHUTDOWN_TIMEOUT_MS = 10000;

const app = express();

app.disable('x-powered-by');
app.set('trust proxy', 1);

app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'same-site' },
  })
);

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || isAllowedArxOrigin(origin)) {
        callback(null, true);
        return;
      }

      callback(null, false);
    },
    credentials: true,
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Accept'],
    maxAge: 86400,
    optionsSuccessStatus: 204,
  })
);

app.use(requireTrustedOrigin);
app.use(express.json({ limit: '100kb', strict: true }));

const sessionStore = new SessionStore(pool);

app.use(
  session({
    name: 'musicmedia.sid',
    secret: process.env.SESSION_SECRET,
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    rolling: true,
    proxy: true,
    cookie: {
      domain: '.arx-app.com',
      path: '/',
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      maxAge: SESSION_MAX_AGE_MS,
    },
  })
);

app.use(healthRoutes);
app.use(authRoutes);
app.use(platformRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

let server;
let isShuttingDown = false;

async function closeDatabasePool() {
  try {
    await pool.end();
  } catch (error) {
    console.error('Failed to close the database pool cleanly.');
  }
}

async function shutdown(signal, exitCode = 0) {
  if (isShuttingDown) {
    return;
  }

  isShuttingDown = true;
  console.log(`${signal} received. Shutting down MusicMedia API.`);

  const forceExitTimer = setTimeout(() => {
    console.error('Graceful shutdown timed out.');
    process.exit(1);
  }, SHUTDOWN_TIMEOUT_MS);

  forceExitTimer.unref();

  if (!server || !server.listening) {
    await closeDatabasePool();
    clearTimeout(forceExitTimer);
    process.exit(exitCode);
    return;
  }

  server.close(async (error) => {
    if (error) {
      console.error('Failed to close the HTTPS server cleanly.');
      exitCode = 1;
    }

    await closeDatabasePool();
    clearTimeout(forceExitTimer);
    process.exit(exitCode);
  });

  if (typeof server.closeIdleConnections === 'function') {
    server.closeIdleConnections();
  }
}

async function startServer() {
  try {
    await checkDatabaseConnection();

    const tlsOptions = {
      cert: fs.readFileSync(CERTIFICATE_PATH),
      key: fs.readFileSync(PRIVATE_KEY_PATH),
      minVersion: 'TLSv1.2',
    };

    server = https.createServer(tlsOptions, app);

    server.on('error', (error) => {
      console.error('MusicMedia HTTPS server error:', error.message);

      if (!server.listening) {
        void shutdown('HTTPS server error', 1);
      }
    });

    server.listen(backendPort, '0.0.0.0', () => {
      console.log(`MusicMedia API listening securely on port ${backendPort}.`);
    });
  } catch (error) {
    console.error(
      'Unable to start the MusicMedia API:',
      error && error.message ? error.message : 'Unknown startup error.'
    );
    await closeDatabasePool();
    process.exit(1);
  }
}

process.once('SIGTERM', () => {
  void shutdown('SIGTERM');
});

process.once('SIGINT', () => {
  void shutdown('SIGINT');
});

process.on('uncaughtException', (error) => {
  console.error(
    'Uncaught exception:',
    error && error.message ? error.message : 'Unknown error.'
  );
  void shutdown('uncaughtException', 1);
});

process.on('unhandledRejection', (reason) => {
  const message =
    reason instanceof Error
      ? reason.message
      : 'A promise was rejected without an error object.';
  console.error('Unhandled rejection:', message);
  void shutdown('unhandledRejection', 1);
});

void startServer();