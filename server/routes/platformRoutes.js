const express = require('express');
const {
  getDashboard,
  listReleases,
  createRelease,
  listWorks,
  createWork,
  listCampaigns,
  createCampaign,
} = require('../controllers/platformController');
const requireAuth = require('../middleware/requireAuth');
const { requireTrustedOrigin } = require('../middleware/security');
const { asyncHandler } = require('../middleware/errorHandler');

const router = express.Router();

router.get('/api/dashboard', requireAuth, asyncHandler(getDashboard));

router.get('/api/releases', requireAuth, asyncHandler(listReleases));
router.post(
  '/api/releases',
  requireAuth,
  requireTrustedOrigin,
  asyncHandler(createRelease)
);

router.get('/api/works', requireAuth, asyncHandler(listWorks));
router.post(
  '/api/works',
  requireAuth,
  requireTrustedOrigin,
  asyncHandler(createWork)
);

router.get('/api/campaigns', requireAuth, asyncHandler(listCampaigns));
router.post(
  '/api/campaigns',
  requireAuth,
  requireTrustedOrigin,
  asyncHandler(createCampaign)
);

module.exports = router;