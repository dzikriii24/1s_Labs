const express = require('express');
const router = express.Router();
const { query } = require('../db');

// GET /plans
router.get('/', async (req, res) => {
  try {
    const plans = await query(
      'SELECT id, slug, name, target, price, period, billing_cycle_months, description, storage_gb, databases_count, bandwidth, ssl_type, backup_frequency, email_accounts, is_recommended, is_active, display_order, features_json FROM hosting_plans WHERE is_active = 1 ORDER BY display_order ASC'
    );

    const formatted = plans.map(p => ({
      ...p,
      features: typeof p.features_json === 'string' ? JSON.parse(p.features_json) : (p.features_json || [])
    }));

    return res.json({
      success: true,
      plans: formatted
    });
  } catch (error) {
    console.error('Fetch plans error:', error);
    return res.status(500).json({
      success: false,
      message: 'Gagal memuat katalog paket hosting.'
    });
  }
});

// GET /plans/:idOrSlug
router.get('/:idOrSlug', async (req, res) => {
  try {
    const { idOrSlug } = req.params;
    let rows;

    if (!isNaN(idOrSlug)) {
      rows = await query('SELECT * FROM hosting_plans WHERE id = ?', [idOrSlug]);
    } else {
      rows = await query('SELECT * FROM hosting_plans WHERE slug = ?', [idOrSlug]);
    }

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Paket hosting tidak ditemukan.'
      });
    }

    const plan = rows[0];
    const features = typeof plan.features_json === 'string' 
      ? JSON.parse(plan.features_json) 
      : (plan.features_json || []);

    return res.json({
      success: true,
      plan: {
        ...plan,
        features
      }
    });
  } catch (error) {
    console.error('Fetch single plan error:', error);
    return res.status(500).json({
      success: false,
      message: 'Gagal memuat detail paket hosting.'
    });
  }
});

module.exports = router;
