const express = require('express');
const router = express.Router();
const path = require('path');
const { query, withTransaction } = require('../db');
const { requireAuth, requireVerifiedEmail } = require('../middleware/auth');
const { uploadPaymentProof } = require('../middleware/upload');
const {
  sendPaymentProofReceivedEmail,
  sendAdminPaymentProofNotification
} = require('../services/email.service');

// GET /payments/qris-info - Public QRIS configuration
router.get('/qris-info', async (req, res) => {
  try {
    const settings = await query(
      'SELECT setting_key, setting_value FROM hosting_settings WHERE setting_key IN (?, ?, ?)',
      ['qris_image_path', 'whatsapp_support', 'cpanel_url']
    );

    const settingMap = {};
    settings.forEach(s => {
      settingMap[s.setting_key] = s.setting_value;
    });

    return res.json({
      success: true,
      qris: {
        imageUrl: settingMap['qris_image_path'] || '/qris.jpeg',
        merchantName: '1sLabs',
        supportedApps: [
          'BCA Mobile / myBCA',
          'Livin by Mandiri',
          'BRImo',
          'BNI Mobile Banking',
          'GoPay',
          'OVO',
          'DANA',
          'ShopeePay',
          'LinkAja'
        ],
        whatsappSupport: settingMap['whatsapp_support'] || '6285156296580',
        instructions: [
          'Buka aplikasi m-Banking atau dompet digital (e-Wallet) pilihan Anda.',
          'Pilih menu Scan / Bayar menggunakan QRIS.',
          'Scan kode QRIS 1sLabs yang tertera di layar.',
          'Pastikan nama merchant tertera 1sLabs.',
          'Masukkan nominal pembayaran PERSIS sesuai total tagihan pesanan Anda.',
          'Selesaikan transaksi dan simpan tangkapan layar (screenshot) struk bukti pembayaran.',
          'Unggah bukti transfer pada form konfirmasi di bawah untuk diverifikasi oleh tim 1sLabs.'
        ]
      }
    });
  } catch (error) {
    console.error('Fetch QRIS info error:', error);
    return res.status(500).json({
      success: false,
      message: 'Gagal memuat konfigurasi pembayaran QRIS.'
    });
  }
});

// POST /payments/:orderNumber/confirm - Customer submits manual payment proof
router.post('/:orderNumber/confirm', requireAuth, requireVerifiedEmail, (req, res) => {
  uploadPaymentProof.single('proof_image')(req, res, async (err) => {
    if (err) {
      return res.status(400).json({
        success: false,
        message: err.message || 'Gagal mengunggah file bukti pembayaran.'
      });
    }

    try {
      const { orderNumber } = req.params;
      const { sender_bank_or_wallet, sender_account_name, notes } = req.body;

      // Find order
      const orders = await query(
        'SELECT id, user_id, status FROM orders WHERE order_number = ?',
        [orderNumber]
      );

      if (orders.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Pesanan tidak ditemukan.'
        });
      }

      const order = orders[0];

      // Ownership check
      if (order.user_id !== req.user.id && req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Anda tidak memiliki hak akses untuk pesanan ini.'
        });
      }

      if (order.status === 'paid') {
        return res.status(400).json({
          success: false,
          message: 'Pesanan ini sudah terverifikasi lunas.'
        });
      }

      // Find payment record
      const payments = await query(
        'SELECT id, payment_number, amount, status FROM payments WHERE order_id = ?',
        [order.id]
      );

      if (payments.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Data pembayaran untuk pesanan ini tidak ditemukan.'
        });
      }

      const payment = payments[0];
      const proofImagePath = req.file ? `/uploads/proofs/${req.file.filename}` : (req.body?.proof_image || null);

      if (!proofImagePath && payment.status === 'unpaid') {
        return res.status(400).json({
          success: false,
          message: 'Foto atau tangkapan layar bukti transfer wajib diunggah.'
        });
      }

      // Update in transaction
      await withTransaction(async (conn) => {
        let updatePaymentSql = `
          UPDATE payments 
          SET status = 'pending_verification',
              sender_bank_or_wallet = ?,
              sender_account_name = ?,
              notes = ?,
              rejection_reason = NULL,
              updated_at = NOW()
        `;
        const paymentParams = [
          sender_bank_or_wallet ? sender_bank_or_wallet.trim() : null,
          sender_account_name ? sender_account_name.trim() : null,
          notes ? notes.trim() : null
        ];

        if (proofImagePath) {
          updatePaymentSql += ', proof_image = ?';
          paymentParams.push(proofImagePath);
        }

        updatePaymentSql += ' WHERE id = ?';
        paymentParams.push(payment.id);

        await conn.query(updatePaymentSql, paymentParams);

        await conn.query(
          "UPDATE orders SET status = 'pending_verification', updated_at = NOW() WHERE id = ?",
          [order.id]
        );
      });

      // Send email to customer confirming receipt of proof
      sendPaymentProofReceivedEmail({
        to: req.user.email,
        name: req.user.name,
        orderNumber,
        amount: payment.amount,
        senderBank: sender_bank_or_wallet,
        senderAccount: sender_account_name
      }).catch(mailErr => console.error('[payments] Background customer proof receipt email error:', mailErr.message));

      // Send immediate alert to admin (dzikrirabbani2401@gmail.com)
      sendAdminPaymentProofNotification({
        order: { order_number: orderNumber },
        payment: { ...payment, sender_bank_or_wallet, sender_account_name },
        user: req.user
      }).catch(mailErr => console.error('[payments] Background admin alert email error:', mailErr.message));

      return res.json({
        success: true,
        message: 'Konfirmasi pembayaran berhasil dikirim. Tim admin 1sLabs akan memverifikasi dalam waktu singkat.',
        status: 'pending_verification'
      });
    } catch (error) {
      console.error('Confirm payment error:', error);
      return res.status(500).json({
        success: false,
        message: 'Gagal memproses konfirmasi pembayaran.'
      });
    }
  });
});

module.exports = router;
