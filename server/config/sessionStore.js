'use strict';

const session = require('express-session');
const { pool } = require('./db');

const DEFAULT_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const DEFAULT_CLEANUP_INTERVAL_MS = 15 * 60 * 1000;

class SessionStore extends session.Store {
  constructor(options = {}) {
    super();

    this.pool = options.pool || pool;
    this.defaultTtlMs = Number.isFinite(options.defaultTtlMs)
      ? Math.max(60_000, options.defaultTtlMs)
      : DEFAULT_TTL_MS;
    this.cleanupIntervalMs = Number.isFinite(options.cleanupIntervalMs)
      ? Math.max(60_000, options.cleanupIntervalMs)
      : DEFAULT_CLEANUP_INTERVAL_MS;
    this.cleanupTimer = null;

    if (options.cleanup !== false) {
      this.cleanupTimer = setInterval(() => {
        this.cleanupExpired().catch((error) => {
          console.error('Session cleanup failed:', error.message);
        });
      }, this.cleanupIntervalMs);

      if (typeof this.cleanupTimer.unref === 'function') {
        this.cleanupTimer.unref();
      }
    }
  }

  get(sessionId, callback = () => {}) {
    this.pool
      .execute(
        `SELECT data
         FROM sessions
         WHERE session_id = ?
           AND expires_at > UTC_TIMESTAMP(3)
         LIMIT 1`,
        [sessionId]
      )
      .then(([rows]) => {
        if (!rows.length) {
          callback(null, null);
          return;
        }

        try {
          const storedData = rows[0].data;
          let parsed;

          if (Buffer.isBuffer(storedData)) {
            parsed = JSON.parse(storedData.toString('utf8'));
          } else if (typeof storedData === 'string') {
            parsed = JSON.parse(storedData);
          } else if (storedData && typeof storedData === 'object') {
            parsed = storedData;
          } else {
            throw new Error('Stored session data is invalid');
          }

          callback(null, parsed);
        } catch (error) {
          callback(error);
        }
      })
      .catch((error) => callback(error));
  }

  set(sessionId, sessionData, callback = () => {}) {
    let serialized;
    let expiresAt;

    try {
      serialized = JSON.stringify(sessionData);
      expiresAt = this.getExpirationDate(sessionData);
    } catch (error) {
      callback(error);
      return;
    }

    this.pool
      .execute(
        `INSERT INTO sessions (session_id, data, expires_at)
         VALUES (?, ?, ?)
         ON DUPLICATE KEY UPDATE
           data = VALUES(data),
           expires_at = VALUES(expires_at),
           updated_at = CURRENT_TIMESTAMP(3)`,
        [sessionId, serialized, expiresAt]
      )
      .then(() => callback(null))
      .catch((error) => callback(error));
  }

  destroy(sessionId, callback = () => {}) {
    this.pool
      .execute('DELETE FROM sessions WHERE session_id = ?', [sessionId])
      .then(() => callback(null))
      .catch((error) => callback(error));
  }

  touch(sessionId, sessionData, callback = () => {}) {
    let expiresAt;

    try {
      expiresAt = this.getExpirationDate(sessionData);
    } catch (error) {
      callback(error);
      return;
    }

    this.pool
      .execute(
        `UPDATE sessions
         SET expires_at = ?,
             updated_at = CURRENT_TIMESTAMP(3)
         WHERE session_id = ?`,
        [expiresAt, sessionId]
      )
      .then(() => callback(null))
      .catch((error) => callback(error));
  }

  cleanupExpired(callback) {
    const cleanupPromise = this.pool
      .execute(
        `DELETE FROM sessions
         WHERE expires_at <= UTC_TIMESTAMP(3)`
      )
      .then(([result]) => result.affectedRows);

    if (typeof callback === 'function') {
      cleanupPromise
        .then((affectedRows) => callback(null, affectedRows))
        .catch((error) => callback(error));
    }

    return cleanupPromise;
  }

  close(callback = () => {}) {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }

    callback(null);
  }

  getExpirationDate(sessionData) {
    const cookie = sessionData && sessionData.cookie ? sessionData.cookie : {};
    let expiration;

    if (cookie.expires) {
      expiration = new Date(cookie.expires);
    } else if (Number.isFinite(cookie.maxAge) && cookie.maxAge > 0) {
      expiration = new Date(Date.now() + cookie.maxAge);
    } else {
      expiration = new Date(Date.now() + this.defaultTtlMs);
    }

    if (Number.isNaN(expiration.getTime())) {
      throw new TypeError('Session expiration date is invalid');
    }

    return expiration;
  }
}

module.exports = SessionStore;
module.exports.SessionStore = SessionStore;