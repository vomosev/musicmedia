export const API_BASE_URL = (
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  'https://musicmedia-api.arx-app.com:50101'
).replace(/\/+$/, '');

const DEFAULT_TIMEOUT_MS = 15000;
const MAX_TIMEOUT_MS = 60000;

export class ApiError extends Error {
  constructor(message, options = {}) {
    super(message);
    this.name = 'ApiError';
    this.status = Number.isInteger(options.status) ? options.status : 0;
    this.code = options.code || 'REQUEST_ERROR';
    this.category = options.category || 'request';
    this.details = options.details ?? null;
    this.unavailable = this.category === 'unavailable';
    this.unauthorized = this.category === 'unauthorized';
    this.validation = this.category === 'validation';
    this.server = this.category === 'server';

    if (options.cause) {
      this.cause = options.cause;
    }
  }
}

function normalizeTimeout(value) {
  const timeout = Number(value);

  if (!Number.isFinite(timeout) || timeout <= 0) {
    return DEFAULT_TIMEOUT_MS;
  }

  return Math.min(Math.floor(timeout), MAX_TIMEOUT_MS);
}

function buildUrl(path) {
  if (typeof path !== 'string' || !path.trim()) {
    throw new ApiError('A valid API path is required.', {
      code: 'INVALID_REQUEST',
      category: 'validation'
    });
  }

  const normalizedPath = path.trim();

  if (/^https?:\/\//i.test(normalizedPath)) {
    const requestedUrl = new URL(normalizedPath);
    const apiUrl = new URL(API_BASE_URL);

    if (requestedUrl.origin !== apiUrl.origin) {
      throw new ApiError('The requested API URL is not allowed.', {
        code: 'INVALID_REQUEST',
        category: 'validation'
      });
    }

    return requestedUrl.toString();
  }

  return `${API_BASE_URL}${normalizedPath.startsWith('/') ? '' : '/'}${normalizedPath}`;
}

async function parseResponse(response) {
  if (response.status === 204 || response.status === 205) {
    return null;
  }

  const text = await response.text();

  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

function getErrorMessage(payload) {
  if (payload && typeof payload === 'object') {
    if (typeof payload.error === 'string' && payload.error.trim()) {
      return payload.error.trim();
    }

    if (
      payload.error &&
      typeof payload.error === 'object' &&
      typeof payload.error.message === 'string' &&
      payload.error.message.trim()
    ) {
      return payload.error.message.trim();
    }

    if (typeof payload.message === 'string' && payload.message.trim()) {
      return payload.message.trim();
    }
  }

  return null;
}

function getErrorDetails(payload) {
  if (!payload || typeof payload !== 'object') {
    return null;
  }

  if (payload.error && typeof payload.error === 'object') {
    return payload.error.details ?? payload.details ?? null;
  }

  return payload.details ?? null;
}

function createResponseError(response, payload) {
  const status = response.status;
  const responseMessage = getErrorMessage(payload);
  const details = getErrorDetails(payload);

  if (status === 401) {
    return new ApiError('Please sign in to continue.', {
      status,
      code: 'UNAUTHORIZED',
      category: 'unauthorized',
      details
    });
  }

  if (status === 400 || status === 409 || status === 422) {
    return new ApiError(
      responseMessage || 'Please review the submitted information and try again.',
      {
        status,
        code: 'VALIDATION_ERROR',
        category: 'validation',
        details
      }
    );
  }

  if (status >= 500) {
    return new ApiError('The service could not complete your request. Please try again.', {
      status,
      code: 'SERVER_ERROR',
      category: 'server'
    });
  }

  if (status === 403) {
    return new ApiError(responseMessage || 'This request is not permitted.', {
      status,
      code: 'FORBIDDEN',
      category: 'request',
      details
    });
  }

  return new ApiError(responseMessage || 'The request could not be completed.', {
    status,
    code: 'REQUEST_ERROR',
    category: 'request',
    details
  });
}

export async function request(path, options = {}) {
  if (typeof window === 'undefined') {
    throw new ApiError('The API is available only in the browser.', {
      code: 'API_UNAVAILABLE',
      category: 'unavailable'
    });
  }

  const {
    method = 'GET',
    body,
    headers: suppliedHeaders,
    timeout = DEFAULT_TIMEOUT_MS,
    signal: externalSignal,
    ...fetchOptions
  } = options;

  const controller = new AbortController();
  const timeoutMs = normalizeTimeout(timeout);
  let timedOut = false;

  const abortFromExternalSignal = () => {
    controller.abort(externalSignal.reason);
  };

  if (externalSignal) {
    if (externalSignal.aborted) {
      controller.abort(externalSignal.reason);
    } else {
      externalSignal.addEventListener('abort', abortFromExternalSignal, { once: true });
    }
  }

  const timeoutId = window.setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, timeoutMs);

  try {
    const headers = new Headers(suppliedHeaders || {});
    headers.set('Accept', 'application/json');

    const normalizedMethod = String(method).toUpperCase();
    const requestOptions = {
      ...fetchOptions,
      method: normalizedMethod,
      headers,
      credentials: 'include',
      signal: controller.signal
    };

    if (body !== undefined && normalizedMethod !== 'GET' && normalizedMethod !== 'HEAD') {
      if (
        typeof body === 'string' ||
        body instanceof FormData ||
        body instanceof URLSearchParams ||
        body instanceof Blob ||
        body instanceof ArrayBuffer
      ) {
        requestOptions.body = body;
      } else {
        headers.set('Content-Type', 'application/json');
        requestOptions.body = JSON.stringify(body);
      }
    }

    const response = await fetch(buildUrl(path), requestOptions);
    const payload = await parseResponse(response);

    if (!response.ok) {
      throw createResponseError(response, payload);
    }

    return payload;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }

    if (timedOut) {
      throw new ApiError('The service took too long to respond. Please try again.', {
        code: 'API_UNAVAILABLE',
        category: 'unavailable',
        cause: error
      });
    }

    if (controller.signal.aborted) {
      throw new ApiError('The request was interrupted. Please try again.', {
        code: 'API_UNAVAILABLE',
        category: 'unavailable',
        cause: error
      });
    }

    throw new ApiError('The service is currently unavailable. Please try again.', {
      code: 'API_UNAVAILABLE',
      category: 'unavailable',
      cause: error
    });
  } finally {
    window.clearTimeout(timeoutId);

    if (externalSignal) {
      externalSignal.removeEventListener('abort', abortFromExternalSignal);
    }
  }
}

export function get(path, options = {}) {
  return request(path, {
    ...options,
    method: 'GET'
  });
}

export function post(path, data, options = {}) {
  return request(path, {
    ...options,
    method: 'POST',
    body: data
  });
}