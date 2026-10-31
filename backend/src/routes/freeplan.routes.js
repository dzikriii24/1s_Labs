const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const FreePlanService = require('../services/freePlan.service');

// GET /freeplan/status - Check if authenticated user can claim
router.get('/status', requireAuth, async (req, res) => {
  try {
    const status = await FreePlanService.checkEligibility(req.user.id);
    return res.json({
      success: true,
      ...status
    });
  } catch (err) {
    console.error('FreePlan status check error:', err);
    return res.status(500).json({
      success: false,
      message: 'Gagal memeriksa status program Free Plan.'
    });
  }
});

// GET /freeplan/check-subdomain?subdomain=... - Realtime availability check
router.get('/check-subdomain', requireAuth, async (req, res) => {
  try {
    const subdomain = req.query.subdomain;
    if (!subdomain) {
      return res.status(400).json({
        success: false,
        available: false,
        message: 'Parameter subdomain wajib disertakan.'
      });
    }

    const result = await FreePlanService.checkSubdomainAvailability(subdomain);
    return res.json({
      success: true,
      ...result
    });
  } catch (err) {
    console.error('Check subdomain error:', err);
    return res.status(500).json({
      success: false,
      available: false,
      message: 'Gagal memvalidasi ketersediaan subdomain.'
    });
  }
});

// POST /freeplan/claim - Claim free plan
router.post('/claim', requireAuth, async (req, res) => {
  try {
    const { subdomain, agreeTerms } = req.body;

    if (!agreeTerms) {
      return res.status(400).json({
        success: false,
        message: 'Anda wajib menyetujui ketentuan layanan program Free Plan sebelum melakukan klaim.'
      });
    }

    if (!subdomain) {
      return res.status(400).json({
        success: false,
        message: 'Nama subdomain wajib diisi.'
      });
    }

    const result = await FreePlanService.claimFreePlan(req.user.id, subdomain);
    return res.json({
      success: true,
      message: 'Klaim program Free Plan berhasil diaktifkan!',
      ...result
    });
  } catch (err) {
    console.error('Claim FreePlan error:', err);
    return res.status(400).json({
      success: false,
      message: err.message || 'Terjadi kesalahan saat memproses klaim Free Plan.'
    });
  }
});

module.exports = router;

