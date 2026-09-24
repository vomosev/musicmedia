const express = require('express');
const {
  signup,
  login,
  logout,
  me,
} = require('../controllers/authController');
const requireAuth = require('../middleware/requireAuth');
const { requireTrustedOrigin } = require('../middleware/security');
const { asyncHandler } = require('../middleware/errorHandler');

const router = express.Router();

router.post(
  '/api/auth/signup',
  requireTrustedOrigin,
  asyncHandler(signup)
);

router.post(
  '/api/auth/login',
  requireTrustedOrigin,
  asyncHandler(login)
);

router.post(
  '/api/auth/logout',
  requireTrustedOrigin,
  requireAuth,
  asyncHandler(logout)
);

router.get(
  '/api/auth/me',
  requireAuth,
  asyncHandler(me)
);

module.exports = router;