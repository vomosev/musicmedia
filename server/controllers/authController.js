const bcrypt = require('bcrypt');
const { pool } = require('../config/db');

const BCRYPT_ROUNDS = 12;
const SESSION_COOKIE_NAME = 'musicmedia.sid';
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validationResponse(res, message, fields) {
  return res.status(400).json({
    error: {
      code: 'VALIDATION_ERROR',
      message,
      ...(fields && Object.keys(fields).length > 0 ? { fields } : {})
    }
  });
}

function normalizeText(value) {
  return typeof value === 'string' ? value.trim().replace(/\s+/g, ' ') : '';
}

function normalizeEmail(value) {
  return typeof value === 'string' ? value.trim().toLowerCase() : '';
}

function validateSignupInput(body) {
  const source = body && typeof body === 'object' ? body : {};
  const name = normalizeText(source.name);
  const artistName = normalizeText(source.artistName);
  const email = normalizeEmail(source.email);
  const password = typeof source.password === 'string' ? source.password : '';
  const fields = {};

  if (name.length < 2 || name.length > 100) {
    fields.name = 'Name must be between 2 and 100 characters.';
  }

  if (artistName.length < 2 || artistName.length > 120) {
    fields.artistName = 'Artist name must be between 2 and 120 characters.';
  }

  if (!EMAIL_PATTERN.test(email) || email.length > 254) {
    fields.email = 'Enter a valid email address.';
  }

  const passwordBytes = Buffer.byteLength(password, 'utf8');
  if (password.length < 8) {
    fields.password = 'Password must be at least 8 characters.';
  } else if (passwordBytes > 72) {
    fields.password = 'Password must not exceed 72 bytes.';
  }

  return {
    values: { name, artistName, email, password },
    fields
  };
}

function validateLoginInput(body) {
  const source = body && typeof body === 'object' ? body : {};
  const email = normalizeEmail(source.email);
  const password = typeof source.password === 'string' ? source.password : '';
  const fields = {};

  if (!EMAIL_PATTERN.test(email) || email.length > 254) {
    fields.email = 'Enter a valid email address.';
  }

  if (!password) {
    fields.password = 'Password is required.';
  } else if (Buffer.byteLength(password, 'utf8') > 72) {
    fields.password = 'Password must not exceed 72 bytes.';
  }

  return {
    values: { email, password },
    fields
  };
}

function safeUser(user) {
  return {
    id: user.id,
    name: user.name,
    artistName: user.artist_name,
    email: user.email,
    createdAt: user.created_at
  };
}

function regenerateSession(req) {
  return new Promise((resolve, reject) => {
    req.session.regenerate((error) => {
      if (error) {
        reject(error);
        return;
      }
      resolve();
    });
  });
}

function saveSession(req) {
  return new Promise((resolve, reject) => {
    req.session.save((error) => {
      if (error) {
        reject(error);
        return;
      }
      resolve();
    });
  });
}

function destroySession(req) {
  return new Promise((resolve, reject) => {
    if (!req.session) {
      resolve();
      return;
    }

    req.session.destroy((error) => {
      if (error) {
        reject(error);
        return;
      }
      resolve();
    });
  });
}

async function establishSession(req, userId) {
  await regenerateSession(req);
  req.session.userId = userId;
  await saveSession(req);
}

async function signup(req, res) {
  const { values, fields } = validateSignupInput(req.body);

  if (Object.keys(fields).length > 0) {
    return validationResponse(
      res,
      'Please correct the highlighted fields.',
      fields
    );
  }

  const [existingUsers] = await pool.execute(
    'SELECT id FROM users WHERE email = ? LIMIT 1',
    [values.email]
  );

  if (existingUsers.length > 0) {
    return res.status(409).json({
      error: {
        code: 'EMAIL_IN_USE',
        message: 'An account with this email address already exists.',
        fields: {
          email: 'This email address is already registered.'
        }
      }
    });
  }

  const passwordHash = await bcrypt.hash(values.password, BCRYPT_ROUNDS);

  let result;
  try {
    [result] = await pool.execute(
      `INSERT INTO users (name, artist_name, email, password_hash)
       VALUES (?, ?, ?, ?)`,
      [values.name, values.artistName, values.email, passwordHash]
    );
  } catch (error) {
    if (error && (error.code === 'ER_DUP_ENTRY' || error.errno === 1062)) {
      return res.status(409).json({
        error: {
          code: 'EMAIL_IN_USE',
          message: 'An account with this email address already exists.',
          fields: {
            email: 'This email address is already registered.'
          }
        }
      });
    }
    throw error;
  }

  const [users] = await pool.execute(
    `SELECT id, name, artist_name, email, created_at
     FROM users
     WHERE id = ?
     LIMIT 1`,
    [result.insertId]
  );

  if (users.length === 0) {
    const error = new Error('Unable to load the newly created account.');
    error.status = 500;
    throw error;
  }

  await establishSession(req, users[0].id);

  return res.status(201).json({
    user: safeUser(users[0])
  });
}

async function login(req, res) {
  const { values, fields } = validateLoginInput(req.body);

  if (Object.keys(fields).length > 0) {
    return validationResponse(
      res,
      'Enter a valid email address and password.',
      fields
    );
  }

  const [users] = await pool.execute(
    `SELECT id, name, artist_name, email, password_hash, created_at
     FROM users
     WHERE email = ?
     LIMIT 1`,
    [values.email]
  );

  const user = users[0];
  const passwordMatches = user
    ? await bcrypt.compare(values.password, user.password_hash)
    : false;

  if (!user || !passwordMatches) {
    return res.status(401).json({
      error: {
        code: 'INVALID_CREDENTIALS',
        message: 'The email address or password is incorrect.'
      }
    });
  }

  await establishSession(req, user.id);

  return res.status(200).json({
    user: safeUser(user)
  });
}

async function logout(req, res) {
  await destroySession(req);

  res.clearCookie(SESSION_COOKIE_NAME, {
    domain: '.arx-app.com',
    path: '/',
    httpOnly: true,
    secure: true,
    sameSite: 'lax'
  });

  return res.status(200).json({
    message: 'You have been logged out.'
  });
}

async function me(req, res) {
  const [users] = await pool.execute(
    `SELECT id, name, artist_name, email, created_at
     FROM users
     WHERE id = ?
     LIMIT 1`,
    [req.session.userId]
  );

  if (users.length === 0) {
    await destroySession(req);

    res.clearCookie(SESSION_COOKIE_NAME, {
      domain: '.arx-app.com',
      path: '/',
      httpOnly: true,
      secure: true,
      sameSite: 'lax'
    });

    return res.status(401).json({
      error: {
        code: 'UNAUTHORIZED',
        message: 'Authentication is required.'
      }
    });
  }

  return res.status(200).json({
    user: safeUser(users[0])
  });
}

module.exports = {
  signup,
  login,
  logout,
  me
};