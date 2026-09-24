'use strict';

function asyncHandler(handler) {
  if (typeof handler !== 'function') {
    throw new TypeError('asyncHandler requires a function');
  }

  return function wrappedAsyncHandler(req, res, next) {
    Promise.resolve(handler(req, res, next)).catch(next);
  };
}

function notFoundHandler(req, res) {
  res.status(404).json({
    error: {
      code: 'NOT_FOUND',
      message: 'The requested resource was not found.'
    }
  });
}

function isDatabaseError(error) {
  return Boolean(
    error &&
      (typeof error.sql === 'string' ||
        typeof error.sqlMessage === 'string' ||
        typeof error.errno === 'number' ||
        (typeof error.code === 'string' && error.code.startsWith('ER_')))
  );
}

function normalizeStatus(error) {
  const candidate = Number(error && (error.statusCode || error.status));

  if (Number.isInteger(candidate) && candidate >= 400 && candidate <= 599) {
    return candidate;
  }

  if (error && error.type === 'entity.parse.failed') {
    return 400;
  }

  if (error && error.type === 'entity.too.large') {
    return 413;
  }

  if (error && error.code === 'ER_DUP_ENTRY') {
    return 409;
  }

  if (error && error.code === 'ER_NO_REFERENCED_ROW_2') {
    return 400;
  }

  if (error && error.code === 'ER_ROW_IS_REFERENCED_2') {
    return 409;
  }

  return 500;
}

function defaultCodeForStatus(status) {
  const codes = {
    400: 'BAD_REQUEST',
    401: 'UNAUTHORIZED',
    403: 'FORBIDDEN',
    404: 'NOT_FOUND',
    405: 'METHOD_NOT_ALLOWED',
    409: 'CONFLICT',
    413: 'PAYLOAD_TOO_LARGE',
    422: 'VALIDATION_ERROR',
    429: 'TOO_MANY_REQUESTS',
    500: 'INTERNAL_SERVER_ERROR',
    502: 'BAD_GATEWAY',
    503: 'SERVICE_UNAVAILABLE',
    504: 'GATEWAY_TIMEOUT'
  };

  return codes[status] || (status >= 500 ? 'SERVER_ERROR' : 'REQUEST_ERROR');
}

function safeErrorCode(error, status, databaseError) {
  if (databaseError) {
    if (error.code === 'ER_DUP_ENTRY') {
      return 'CONFLICT';
    }

    if (error.code === 'ER_NO_REFERENCED_ROW_2') {
      return 'INVALID_REFERENCE';
    }

    if (error.code === 'ER_ROW_IS_REFERENCED_2') {
      return 'RESOURCE_IN_USE';
    }

    return 'INTERNAL_SERVER_ERROR';
  }

  if (
    error &&
    typeof error.code === 'string' &&
    /^[A-Z][A-Z0-9_]{1,63}$/.test(error.code)
  ) {
    return error.code;
  }

  return defaultCodeForStatus(status);
}

function safeMessage(error, status, databaseError, production) {
  if (error && error.type === 'entity.parse.failed') {
    return 'The request body contains invalid JSON.';
  }

  if (error && error.type === 'entity.too.large') {
    return 'The request body is too large.';
  }

  if (databaseError) {
    if (error.code === 'ER_DUP_ENTRY') {
      return 'A record with those details already exists.';
    }

    if (error.code === 'ER_NO_REFERENCED_ROW_2') {
      return 'A referenced record does not exist.';
    }

    if (error.code === 'ER_ROW_IS_REFERENCED_2') {
      return 'The record cannot be changed because it is currently in use.';
    }

    return 'An unexpected server error occurred.';
  }

  if (status >= 500 && production) {
    return 'An unexpected server error occurred.';
  }

  if (error && typeof error.message === 'string' && error.message.trim()) {
    return error.message.trim();
  }

  return status >= 500
    ? 'An unexpected server error occurred.'
    : 'The request could not be completed.';
}

function logServerFailure(error, req, status, production) {
  const context = {
    status,
    method: req && req.method,
    path: req && (req.originalUrl || req.url),
    code:
      error && typeof error.code === 'string'
        ? error.code
        : 'INTERNAL_SERVER_ERROR'
  };

  if (production) {
    console.error('MusicMedia server request failed', context);
    return;
  }

  console.error('MusicMedia server request failed', {
    ...context,
    message: error && error.message,
    stack: error && error.stack
  });
}

function errorHandler(error, req, res, next) {
  if (res.headersSent) {
    return next(error);
  }

  const normalizedError =
    error instanceof Error || (error && typeof error === 'object')
      ? error
      : new Error('Unknown server error');

  const production = process.env.NODE_ENV === 'production';
  const databaseError = isDatabaseError(normalizedError);
  const status = normalizeStatus(normalizedError);
  const code = safeErrorCode(normalizedError, status, databaseError);
  const message = safeMessage(
    normalizedError,
    status,
    databaseError,
    production
  );

  if (status >= 500) {
    logServerFailure(normalizedError, req, status, production);
  }

  const response = {
    error: {
      code,
      message
    }
  };

  if (
    status < 500 &&
    normalizedError.details &&
    !databaseError &&
    (Array.isArray(normalizedError.details) ||
      (typeof normalizedError.details === 'object' &&
        normalizedError.details !== null))
  ) {
    response.error.details = normalizedError.details;
  }

  if (!production && status >= 500 && normalizedError.stack && !databaseError) {
    response.error.stack = normalizedError.stack;
  }

  return res.status(status).json(response);
}

module.exports = {
  asyncHandler,
  notFoundHandler,
  errorHandler
};