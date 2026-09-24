'use strict';

function requireAuth(req, res, next) {
  if (!req.session || !req.session.userId) {
    return res.status(401).json({
      error: {
        code: 'UNAUTHORIZED',
        message: 'Authentication is required.'
      }
    });
  }

  return next();
}

module.exports = requireAuth;