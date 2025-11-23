/**
 * Diagnostic routes to check server status and version
 */

import express from 'express';

const router = express.Router();

// Get server version and last deployment info
router.get('/version', (req, res) => {
  res.json({
    version: '1.0.0',
    lastUpdated: new Date().toISOString(),
    commit: process.env.GIT_COMMIT || 'e3c1791',
    environment: process.env.NODE_ENV || 'production',
    features: {
      paymentCreation: true, // Feature flag for payment creation
      detailedLogging: true,
    },
    timestamp: new Date().toISOString(),
  });
});

// Health check
router.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

module.exports = router;
