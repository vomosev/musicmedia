'use strict';

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

function isAllowedArxOrigin(origin) {
  if (origin === undefined || origin === null || origin === '') {
    return true;
  }

  if (typeof origin !== 'string' || origin === 'null') {
    return false;
  }

  try {
    const parsedOrigin = new URL(origin);

    if (parsedOrigin.protocol !== 'https:') {
      return false;
    }

    if (parsedOrigin.username || parsedOrigin.password) {
      return false;
    }

    const hostname = parsedOrigin.hostname.toLowerCase();

    return hostname.endsWith('.arx-app.com') && hostname !== '.arx-app.com';
  } catch {
    return false;
  }
}

function requireTrustedOrigin(req, res, next) {
  const method = String(req.method || '').toUpperCase();

  if (SAFE_METHODS.has(method)) {
    return next();
  }

  const origin = req.get('origin');

  if (isAllowedArxOrigin(origin)) {
    return next();
  }

  return res.status(403).json({
    error: {
      code: 'FORBIDDEN',
      message: 'Request origin is not allowed.'
    }
  });
}

module.exports = {
  isAllowedArxOrigin,
  requireTrustedOrigin
};