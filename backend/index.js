const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const { testConnection } = require('./src/db');
const authRoutes = require('./src/routes/auth.routes');
const plansRoutes = require('./src/routes/plans.routes');
const ordersRoutes = require('./src/routes/orders.routes');
const paymentsRoutes = require('./src/routes/payments.routes');
const servicesRoutes = require('./src/routes/services.routes');
const invoicesRoutes = require('./src/routes/invoices.routes');
const adminRoutes = require('./src/routes/admin.routes');
const analyticsRoutes = require('./src/routes/analytics.routes');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: '*'
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Ensure upload folders exist
const uploadsDir = path.join(__dirname, 'uploads');
const proofsDir = path.join(uploadsDir, 'proofs');
if (!fs.existsSync(proofsDir)) {
  fs.mkdirSync(proofsDir, { recursive: true });
}

// Serve uploaded proof images
app.use('/uploads', express.static(uploadsDir));
app.use('/api/uploads', express.static(uploadsDir));

// Direct tracker.js script endpoint
app.get('/tracker.js', (req, res, next) => {
  req.url = '/tracker.js';
  analyticsRoutes(req, res, next);
});

// API Router
const apiRouter = express.Router();

// Root API info
apiRouter.get('/', (req, res) => {
  return res.json({
    success: true,
    service: '1sLabs Hosting Management Platform API',
    version: '1.0.0',
    status: 'operational'
  });
});

// Health Check
apiRouter.get('/health', async (req, res) => {
  const dbOk = await testConnection();
  return res.json({
    status: dbOk ? 'healthy' : 'degraded',
    service: '1sLabs Hosting API',
    database: dbOk ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Mount modular subroutes
apiRouter.use('/auth', authRoutes);
apiRouter.use('/plans', plansRoutes);
apiRouter.use('/orders', ordersRoutes);
apiRouter.use('/payments', paymentsRoutes);
apiRouter.use('/services', servicesRoutes);
apiRouter.use('/invoices', invoicesRoutes);
apiRouter.use('/admin', adminRoutes);
apiRouter.use('/analytics', analyticsRoutes);

// Mount router on both '/api' and '/' for Passenger & proxy flexibility
app.use('/api', apiRouter);
app.use('/', apiRouter);

// 404 Handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Endpoint ${req.method} ${req.originalUrl} tidak ditemukan pada server 1sLabs API.`
  });
});

// Error Handler
app.use((err, req, res, next) => {
  console.error('Unhandled Server Error:', err);
  res.status(500).json({
    success: false,
    message: err.message || 'Terjadi kesalahan internal pada server 1sLabs.'
  });
});

// Start Server (Passenger and Standalone compatible)
if (typeof(PhusionPassenger) !== 'undefined') {
  app.listen('passenger');
} else {
  app.listen(PORT, () => {
    console.log(`[1sLabs API] Server aktif dan mendengarkan pada port ${PORT}`);
  });
}

module.exports = app;
