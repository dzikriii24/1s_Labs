const nodemailer = require('nodemailer');
const path = require('path');
const { query } = require('../db');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const FROM_ADDRESS = process.env.MAIL_FROM_ADDRESS || 'info@1slabs.my.id';
const FROM_NAME = process.env.MAIL_FROM_NAME || '1s Labs';
const ADMIN_RECIPIENT = process.env.MAIL_ADMIN_RECIPIENT || 'dzikrirabbani2401@gmail.com';
const APP_URL = process.env.BASE_URL || 'https://1slabs.my.id';

// Official 1sLabs brand logo from InvoicePage / Header
const BRAND_LOGO_URL = 'https://r0.image2url.com/images/1757349056783-832654d1-b551-403e-9291-8aff487b3668.png';

let transporter = null;

function getTransporter() {
  if (transporter) return transporter;

  const mailHost = process.env.MAIL_HOST || '127.0.0.1';
  const mailPort = parseInt(process.env.MAIL_PORT || '465', 10);
  const mailSecure = process.env.MAIL_SECURE === 'true' || mailPort === 465;
  const mailUser = process.env.MAIL_USERNAME || process.env.MAIL_USER;
  const mailPass = process.env.MAIL_PASSWORD || process.env.MAIL_PASS;

  const transportConfig = {
    host: mailHost,
    port: mailPort,
    secure: mailSecure,
    tls: {
      rejectUnauthorized: false
    }
  };

  if (mailUser && mailPass) {
    transportConfig.auth = {
      user: mailUser,
      pass: mailPass
    };
  }

  transporter = nodemailer.createTransport(transportConfig);
  return transporter;
}

/**
 * Modern, Minimalist Monochrome HTML Email Wrapper
 * Consistent with 1sLabs web design system (Swiss typography, pure black buttons, subtle zinc borders)
 */
function wrapHtmlEmail({ title, preheader, content, callToAction, badge = 'Official Notification' }) {
  const currentYear = new Date().getFullYear();

  let ctaHtml = '';
  if (callToAction && callToAction.url && callToAction.text) {
    ctaHtml = `
      <div style="margin: 32px 0 16px 0; text-align: left;">
        <!--[if mso]>
        <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="${callToAction.url}" style="height:46px;v-text-anchor:middle;width:240px;" arcsize="18%" stroke="f" fillcolor="#000000">
          <w:anchorlock/>
          <center style="color:#ffffff;font-family:sans-serif;font-size:14px;font-weight:bold;">${callToAction.text}</center>
        </v:roundrect>
        <![endif]-->
        <a href="${callToAction.url}" target="_blank" style="background-color: #000000; color: #ffffff; display: inline-block; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 14px; font-weight: 600; line-height: 46px; text-align: center; text-decoration: none; padding: 0 28px; border-radius: 10px; -webkit-text-size-adjust: none; box-shadow: 0 2px 6px rgba(0, 0, 0, 0.12); mso-hide: all; letter-spacing: -0.2px;">
          ${callToAction.text} &rarr;
        </a>
      </div>
    `;
  }

  return `
<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <!--[if mso]>
  <style type="text/css">
    body, table, td {font-family: Arial, Helvetica, sans-serif !important;}
  </style>
  <![endif]-->
</head>
<body style="margin: 0; padding: 0; background-color: #f4f4f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale; color: #18181b;">
  <div style="display: none; font-size: 1px; color: #ffffff; line-height: 1px; max-height: 0px; max-width: 0px; opacity: 0; overflow: hidden;">
    ${preheader || title}
  </div>

  <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f4f4f5; padding: 48px 12px;">
    <tr>
      <td align="center">
        <!-- Main Card Container -->
        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; background-color: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e4e4e7; box-shadow: 0 4px 16px rgba(0, 0, 0, 0.04);">
          
          <!-- Minimalist Header with Official Logo -->
          <tr>
            <td style="background-color: #ffffff; padding: 28px 36px; border-bottom: 1px solid #f0f0f0;">
              <table border="0" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td style="vertical-align: middle;">
                    <a href="${APP_URL}" target="_blank" style="text-decoration: none; display: inline-block;">
                      <img src="${BRAND_LOGO_URL}" alt="1s Labs" width="120" style="display: block; border: 0; outline: none; height: 36px; width: auto;" />
                    </a>
                  </td>
                  <td align="right" style="vertical-align: middle;">
                    <span style="display: inline-block; padding: 4px 10px; background-color: #f4f4f5; border: 1px solid #e4e4e7; border-radius: 9999px; font-size: 10px; font-weight: 700; color: #27272a; text-transform: uppercase; letter-spacing: 0.8px;">
                      ${badge}
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Body Content Area -->
          <tr>
            <td style="padding: 36px 36px 32px 36px; background-color: #ffffff;">
              ${content}
              ${ctaHtml}
            </td>
          </tr>

          <!-- Security Notice -->
          <tr>
            <td style="background-color: #fafafa; padding: 18px 36px; border-top: 1px solid #f0f0f0; font-size: 11px; line-height: 18px; color: #71717a;">
              <strong style="color: #18181b;">Pemberitahuan Keamanan:</strong> Email ini dikirimkan secara otomatis dari sistem resmi 1s Labs. Kami tidak akan pernah meminta kata sandi akun Anda melalui pesan email. Jika Anda tidak merasa melakukan transaksi ini, hubungi kami di <a href="mailto:info@1slabs.my.id" style="color: #18181b; text-decoration: underline;">info@1slabs.my.id</a>.
            </td>
          </tr>

          <!-- Clean Monochrome Footer -->
          <tr>
            <td style="background-color: #ffffff; padding: 24px 36px; text-align: center; border-top: 1px solid #f0f0f0; color: #71717a; font-size: 11px; line-height: 18px;">
              <p style="margin: 0 0 4px 0; color: #18181b; font-weight: 700; font-size: 12px; letter-spacing: -0.2px;">
                1s Labs
              </p>
              <p style="margin: 0 0 10px 0; color: #71717a;">
                High-Performance Cloud Web Hosting &bull; Software Engineering<br>
                Bandung, Jawa Barat, Indonesia &bull; WhatsApp: +62 851-5629-6580
              </p>
              <p style="margin: 0; color: #a1a1aa; font-size: 10px;">
                &copy; ${currentYear} 1s Labs. All rights reserved.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
}

/**
 * Generic email dispatcher with logging & error resilience
 */
async function sendMail({ to, subject, templateName, html, text, metadata = {} }) {
  let lastError = null;

  try {
    const t = getTransporter();
    const info = await t.sendMail({
      from: `"${FROM_NAME}" <${FROM_ADDRESS}>`,
      to,
      subject,
      text,
      html
    });

    // Record into email_logs
    try {
      await query(
        `INSERT INTO email_logs (recipient, subject, template_name, status, attempts, metadata_json, sent_at)
         VALUES (?, ?, ?, 'sent', 1, ?, NOW())`,
        [to, subject, templateName, JSON.stringify({ messageId: info.messageId, ...metadata })]
      );
    } catch (dbErr) {
      console.warn('[email.service] Failed to write email log:', dbErr.message);
    }

    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error(`[email.service] Error sending ${templateName} to ${to}:`, error.message);
    lastError = error.message;

    try {
      await query(
        `INSERT INTO email_logs (recipient, subject, template_name, status, attempts, last_error, metadata_json)
         VALUES (?, ?, ?, 'failed', 1, ?, ?)`,
        [to, subject, templateName, lastError, JSON.stringify(metadata)]
      );
    } catch (dbErr) {
      console.warn('[email.service] Failed to write failed email log:', dbErr.message);
    }

    // Return failure object instead of crashing caller process
    return { success: false, error: error.message };
  }
}

// ==========================================
// CUSTOMER TRANSACTIONAL EMAIL TEMPLATES
// ==========================================

/**
 * 1. Email Verification
 */
async function sendVerificationEmail({ to, name, token }) {
  const verifyUrl = `${APP_URL}/verify-email?token=${token}`;
  const subject = 'Verifikasi Alamat Email Akun 1sLabs Hosting';

  const content = `
    <h2 style="margin: 0 0 12px 0; font-size: 18px; font-weight: 700; color: #09090b; letter-spacing: -0.3px;">
      Verifikasi Alamat Email Anda
    </h2>
    <p style="margin: 0 0 16px 0; font-size: 14px; line-height: 24px; color: #3f3f46;">
      Halo <strong>${name}</strong>,<br>
      Terima kasih telah bergabung dengan platform hosting <strong>1s Labs</strong>. Untuk mengaktifkan akun dan mulai memesan paket hosting, silakan klik tombol verifikasi di bawah.
    </p>

    <div style="background-color: #fafafa; border: 1px solid #e4e4e7; border-left: 3px solid #18181b; padding: 14px 18px; border-radius: 0 8px 8px 0; margin: 24px 0;">
      <p style="margin: 0; font-size: 13px; line-height: 20px; color: #27272a;">
        <strong>Perhatian:</strong> Tautan verifikasi ini berlaku selama <strong>24 jam</strong> dan hanya dapat digunakan satu kali.
      </p>
    </div>

    <p style="margin: 0 0 8px 0; font-size: 12px; color: #71717a;">
      Atau salin tautan berikut ke browser jika tombol tidak dapat diklik:
    </p>
    <div style="background-color: #f4f4f5; border: 1px solid #e4e4e7; border-radius: 8px; padding: 10px 14px; margin-bottom: 20px; word-break: break-all; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; font-size: 11px; color: #3f3f46;">
      ${verifyUrl}
    </div>

    <p style="margin: 0; font-size: 13px; line-height: 20px; color: #71717a;">
      Jika Anda tidak pernah mendaftar di 1s Labs, abaikan email ini dengan aman.
    </p>
  `;

  const html = wrapHtmlEmail({
    title: subject,
    preheader: 'Klik untuk mengonfirmasi akun 1sLabs Anda.',
    content,
    callToAction: {
      text: 'Verifikasi Akun Sekarang',
      url: verifyUrl
    },
    badge: 'Verifikasi Email'
  });

  const text = `Halo ${name},\n\nTerima kasih telah mendaftar di 1s Labs.\nSilakan klik tautan berikut untuk memverifikasi akun Anda:\n${verifyUrl}\n\nTautan ini berlaku selama 24 jam.\n\n1s Labs Engineering Team`;

  return sendMail({ to, subject, templateName: 'customer_verify_email', html, text, metadata: { name } });
}

/**
 * 2. Order Created Notification
 */
async function sendOrderCreatedEmail({ to, name, order, plan, domain, amount, paymentUrl }) {
  const subject = `Pesanan Dibuat: #${order.order_number} - ${plan.name}`;
  const formattedAmount = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);

  const content = `
    <h2 style="margin: 0 0 12px 0; font-size: 18px; font-weight: 700; color: #09090b; letter-spacing: -0.3px;">
      Pesanan Hosting Baru Dibuat
    </h2>
    <p style="margin: 0 0 20px 0; font-size: 14px; line-height: 24px; color: #3f3f46;">
      Halo <strong>${name}</strong>,<br>
      Pesanan hosting Anda telah dicatat pada sistem kami. Selesaikan pembayaran manual melalui QRIS atau transfer rekening dalam waktu <strong>24 jam</strong>.
    </p>

    <!-- Monochrome Summary Table -->
    <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #fafafa; border: 1px solid #e4e4e7; border-radius: 12px; margin-bottom: 24px;">
      <tr>
        <td style="padding: 12px 18px; border-bottom: 1px solid #e4e4e7; font-size: 13px; color: #71717a;">Nomor Pesanan</td>
        <td style="padding: 12px 18px; border-bottom: 1px solid #e4e4e7; font-size: 13px; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; font-weight: 600; color: #09090b;" align="right">#${order.order_number}</td>
      </tr>
      <tr>
        <td style="padding: 12px 18px; border-bottom: 1px solid #e4e4e7; font-size: 13px; color: #71717a;">Paket Hosting</td>
        <td style="padding: 12px 18px; border-bottom: 1px solid #e4e4e7; font-size: 13px; font-weight: 600; color: #09090b;" align="right">${plan.name}</td>
      </tr>
      <tr>
        <td style="padding: 12px 18px; border-bottom: 1px solid #e4e4e7; font-size: 13px; color: #71717a;">Domain</td>
        <td style="padding: 12px 18px; border-bottom: 1px solid #e4e4e7; font-size: 13px; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; font-weight: 600; color: #09090b;" align="right">${domain}</td>
      </tr>
      <tr>
        <td style="padding: 12px 18px; border-bottom: 1px solid #e4e4e7; font-size: 13px; color: #71717a;">Status Pembayaran</td>
        <td style="padding: 12px 18px; border-bottom: 1px solid #e4e4e7; font-size: 13px; font-weight: 600;" align="right">
          <span style="display: inline-block; padding: 3px 8px; background-color: #f4f4f5; border: 1px solid #e4e4e7; border-radius: 6px; font-size: 11px; color: #18181b;">Menunggu Pembayaran</span>
        </td>
      </tr>
      <tr>
        <td style="padding: 16px 18px; font-size: 13px; font-weight: 700; color: #09090b;">Total Tagihan</td>
        <td style="padding: 16px 18px; font-size: 17px; font-weight: 800; color: #09090b;" align="right">${formattedAmount}</td>
      </tr>
    </table>

    <div style="background-color: #fafafa; border: 1px solid #e4e4e7; border-radius: 10px; padding: 14px 18px; margin-bottom: 16px;">
      <p style="margin: 0; font-size: 13px; line-height: 20px; color: #3f3f46;">
        <strong>Instruksi Pembayaran:</strong> Silakan buka tautan di bawah untuk melihat rincian QRIS atau rekening bank 1s Labs. Setelah mentransfer, unggah struk bukti transfer agar tim kami dapat segera memverifikasi.
      </p>
    </div>
  `;

  const html = wrapHtmlEmail({
    title: subject,
    preheader: `Rincian pesanan hosting #${order.order_number} Anda.`,
    content,
    callToAction: {
      text: 'Buka Halaman Pembayaran',
      url: paymentUrl || `${APP_URL}/payment/${order.order_number}`
    },
    badge: 'Pesanan Dibuat'
  });

  const text = `Halo ${name},\n\nPesanan #${order.order_number} untuk paket ${plan.name} (${domain}) telah dibuat.\nTotal: ${formattedAmount}.\nSelesaikan pembayaran di: ${APP_URL}/payment/${order.order_number}\n\n1s Labs`;

  return sendMail({ to, subject, templateName: 'customer_order_created', html, text, metadata: { orderNumber: order.order_number, domain } });
}

/**
 * 3. Payment Proof Received
 */
async function sendPaymentProofReceivedEmail({ to, name, orderNumber, amount, senderBank, senderAccount }) {
  const subject = `Bukti Pembayaran Diterima: Pesanan #${orderNumber}`;
  const formattedAmount = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);

  const content = `
    <h2 style="margin: 0 0 12px 0; font-size: 18px; font-weight: 700; color: #09090b; letter-spacing: -0.3px;">
      Bukti Pembayaran Berhasil Diterima
    </h2>
    <p style="margin: 0 0 20px 0; font-size: 14px; line-height: 24px; color: #3f3f46;">
      Halo <strong>${name}</strong>,<br>
      Struk bukti transfer untuk pesanan <strong>#${orderNumber}</strong> telah berhasil kami terima.
    </p>

    <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #fafafa; border: 1px solid #e4e4e7; border-radius: 12px; margin-bottom: 24px;">
      <tr>
        <td style="padding: 12px 18px; border-bottom: 1px solid #e4e4e7; font-size: 13px; color: #71717a;">Nomor Pesanan</td>
        <td style="padding: 12px 18px; border-bottom: 1px solid #e4e4e7; font-size: 13px; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; font-weight: 600; color: #09090b;" align="right">#${orderNumber}</td>
      </tr>
      <tr>
        <td style="padding: 12px 18px; border-bottom: 1px solid #e4e4e7; font-size: 13px; color: #71717a;">Nominal Transfer</td>
        <td style="padding: 12px 18px; border-bottom: 1px solid #e4e4e7; font-size: 13px; font-weight: 700; color: #09090b;" align="right">${formattedAmount}</td>
      </tr>
      ${senderBank ? `
      <tr>
        <td style="padding: 12px 18px; border-bottom: 1px solid #e4e4e7; font-size: 13px; color: #71717a;">Pengirim / Bank</td>
        <td style="padding: 12px 18px; border-bottom: 1px solid #e4e4e7; font-size: 13px; font-weight: 600; color: #09090b;" align="right">${senderBank} ${senderAccount ? `(${senderAccount})` : ''}</td>
      </tr>` : ''}
      <tr>
        <td style="padding: 14px 18px; font-size: 13px; color: #71717a;">Status Verifikasi</td>
        <td style="padding: 14px 18px; font-size: 13px; font-weight: 600;" align="right">
          <span style="display: inline-block; padding: 3px 8px; background-color: #f4f4f5; border: 1px solid #e4e4e7; border-radius: 6px; font-size: 11px; color: #18181b;">Menunggu Review Admin</span>
        </td>
      </tr>
    </table>

    <p style="margin: 0; font-size: 13px; line-height: 22px; color: #71717a;">
      Tim Finance 1s Labs saat ini sedang memvalidasi mutasi pembayaran. Begitu transfer terkonfirmasi, invoice lunas akan diterbitkan dan layanan hosting langsung diaktifkan.
    </p>
  `;

  const html = wrapHtmlEmail({
    title: subject,
    preheader: `Bukti transfer pesanan #${orderNumber} sedang ditinjau.`,
    content,
    callToAction: {
      text: 'Lihat Status Pesanan',
      url: `${APP_URL}/payment/${orderNumber}`
    },
    badge: 'Review Pembayaran'
  });

  const text = `Halo ${name},\n\nBukti pembayaran pesanan #${orderNumber} sebesar ${formattedAmount} telah diterima dan sedang ditinjau oleh admin 1s Labs.\nStatus: ${APP_URL}/payment/${orderNumber}\n\n1s Labs`;

  return sendMail({ to, subject, templateName: 'customer_payment_proof_received', html, text, metadata: { orderNumber } });
}

/**
 * 4. Payment Approved Notification
 */
async function sendPaymentApprovedEmail({ to, name, orderNumber, invoiceNumber, planName, domain, amount, invoiceUrl }) {
  const subject = `Pembayaran Terverifikasi Lunas: Pesanan #${orderNumber} (Invoice #${invoiceNumber})`;
  const formattedAmount = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);

  const content = `
    <h2 style="margin: 0 0 12px 0; font-size: 18px; font-weight: 700; color: #09090b; letter-spacing: -0.3px;">
      Pembayaran Telah Diverifikasi Lunas
    </h2>
    <p style="margin: 0 0 20px 0; font-size: 14px; line-height: 24px; color: #3f3f46;">
      Halo <strong>${name}</strong>,<br>
      Pembayaran untuk pesanan <strong>#${orderNumber}</strong> telah berhasil diverifikasi oleh tim administrator 1s Labs.
    </p>

    <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #fafafa; border: 1px solid #e4e4e7; border-radius: 12px; margin-bottom: 24px;">
      <tr>
        <td style="padding: 12px 18px; border-bottom: 1px solid #e4e4e7; font-size: 13px; color: #71717a;">Nomor Invoice</td>
        <td style="padding: 12px 18px; border-bottom: 1px solid #e4e4e7; font-size: 13px; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; font-weight: 700; color: #09090b;" align="right">#${invoiceNumber}</td>
      </tr>
      <tr>
        <td style="padding: 12px 18px; border-bottom: 1px solid #e4e4e7; font-size: 13px; color: #71717a;">Paket Hosting</td>
        <td style="padding: 12px 18px; border-bottom: 1px solid #e4e4e7; font-size: 13px; font-weight: 600; color: #09090b;" align="right">${planName}</td>
      </tr>
      <tr>
        <td style="padding: 12px 18px; border-bottom: 1px solid #e4e4e7; font-size: 13px; color: #71717a;">Domain</td>
        <td style="padding: 12px 18px; border-bottom: 1px solid #e4e4e7; font-size: 13px; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; font-weight: 600; color: #09090b;" align="right">${domain}</td>
      </tr>
      <tr>
        <td style="padding: 12px 18px; border-bottom: 1px solid #e4e4e7; font-size: 13px; color: #71717a;">Status Pembayaran</td>
        <td style="padding: 12px 18px; border-bottom: 1px solid #e4e4e7; font-size: 13px;" align="right">
          <span style="display: inline-block; padding: 3px 8px; background-color: #f4f4f5; border: 1px solid #e4e4e7; border-radius: 6px; font-size: 11px; font-weight: 700; color: #18181b;">LUNAS / PAID</span>
        </td>
      </tr>
      <tr>
        <td style="padding: 16px 18px; font-size: 13px; font-weight: 700; color: #09090b;">Total Terbayar</td>
        <td style="padding: 16px 18px; font-size: 17px; font-weight: 800; color: #09090b;" align="right">${formattedAmount}</td>
      </tr>
    </table>

    <p style="margin: 0; font-size: 13px; line-height: 22px; color: #71717a;">
      Invoice elektronik resmi telah diterbitkan dan dapat Anda unduh atau cetak kapan saja. Sumber daya hosting Anda sedang dikonfigurasi di server cloud 1s Labs.
    </p>
  `;

  const html = wrapHtmlEmail({
    title: subject,
    preheader: `Pembayaran pesanan #${orderNumber} lunas. Invoice #${invoiceNumber}.`,
    content,
    callToAction: {
      text: 'Lihat Dokumen Invoice',
      url: invoiceUrl || `${APP_URL}/invoice/${invoiceNumber}`
    },
    badge: 'Pembayaran Lunas'
  });

  const text = `Halo ${name},\n\nPembayaran pesanan #${orderNumber} telah diverifikasi lunas. Invoice #${invoiceNumber} telah terbit.\nLihat invoice di: ${APP_URL}/invoice/${invoiceNumber}\n\n1s Labs`;

  return sendMail({ to, subject, templateName: 'customer_payment_approved', html, text, metadata: { orderNumber, invoiceNumber } });
}

/**
 * 5. Payment Rejected Notification
 */
async function sendPaymentRejectedEmail({ to, name, orderNumber, planName, rejectionReason, resubmitUrl }) {
  const subject = `Pemberitahuan: Pembayaran Pesanan #${orderNumber} Belum Dapat Diterima`;

  const content = `
    <h2 style="margin: 0 0 12px 0; font-size: 18px; font-weight: 700; color: #09090b; letter-spacing: -0.3px;">
      Pembayaran Belum Dapat Disetujui
    </h2>
    <p style="margin: 0 0 20px 0; font-size: 14px; line-height: 24px; color: #3f3f46;">
      Halo <strong>${name}</strong>,<br>
      Setelah dilakukan pemeriksaan mutasi, bukti pembayaran yang Anda unggah untuk pesanan <strong>#${orderNumber}</strong> (${planName}) <strong>belum dapat disetujui</strong>.
    </p>

    <div style="background-color: #fafafa; border: 1px solid #e4e4e7; border-left: 3px solid #71717a; border-radius: 0 8px 8px 0; padding: 14px 18px; margin-bottom: 24px;">
      <p style="margin: 0 0 4px 0; font-size: 11px; text-transform: uppercase; font-weight: 700; color: #71717a; letter-spacing: 0.5px;">
        Catatan Administrator:
      </p>
      <p style="margin: 0; font-size: 13px; line-height: 20px; color: #18181b; font-weight: 500;">
        ${rejectionReason || 'Bukti transfer tidak terbaca atau mutasi pembayaran belum terkonfirmasi masuk ke rekening 1s Labs.'}
      </p>
    </div>

    <p style="margin: 0 0 8px 0; font-size: 13px; line-height: 22px; color: #71717a;">
      Anda dapat mengunggah kembali foto bukti transfer yang jelas melalui tombol di bawah. Jika membutuhkan klarifikasi langsung, hubungi kami melalui WhatsApp di <strong>+62 851-5629-6580</strong>.
    </p>
  `;

  const html = wrapHtmlEmail({
    title: subject,
    preheader: `Pemberitahuan verifikasi pembayaran pesanan #${orderNumber}.`,
    content,
    callToAction: {
      text: 'Unggah Ulang Bukti Transfer',
      url: resubmitUrl || `${APP_URL}/payment/${orderNumber}`
    },
    badge: 'Verifikasi Pembayaran'
  });

  const text = `Halo ${name},\n\nPembayaran pesanan #${orderNumber} ditolak dengan alasan: ${rejectionReason}.\nSilakan unggah bukti transfer ulang di: ${APP_URL}/payment/${orderNumber}\n\n1s Labs`;

  return sendMail({ to, subject, templateName: 'customer_payment_rejected', html, text, metadata: { orderNumber, rejectionReason } });
}

/**
 * 6. Hosting Activated Notification
 */
async function sendHostingActivatedEmail({ to, name, serviceCode, domain, planName, serverIp, nameservers, expiresAt }) {
  const subject = `Layanan Hosting Aktif: ${domain} (${serviceCode})`;
  const formattedExpiry = new Date(expiresAt).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' });

  const content = `
    <h2 style="margin: 0 0 12px 0; font-size: 18px; font-weight: 700; color: #09090b; letter-spacing: -0.3px;">
      Layanan Hosting Anda Telah Aktif
    </h2>
    <p style="margin: 0 0 20px 0; font-size: 14px; line-height: 24px; color: #3f3f46;">
      Halo <strong>${name}</strong>,<br>
      Layanan hosting untuk domain <strong>${domain}</strong> telah selesai dikonfigurasi dan kini berstatus <strong>AKTIF</strong> di server cloud 1s Labs.
    </p>

    <!-- Technical Specs Table -->
    <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #fafafa; border: 1px solid #e4e4e7; border-radius: 12px; margin-bottom: 24px;">
      <tr>
        <td style="padding: 12px 18px; border-bottom: 1px solid #e4e4e7; font-size: 13px; color: #71717a;">Kode Layanan</td>
        <td style="padding: 12px 18px; border-bottom: 1px solid #e4e4e7; font-size: 13px; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; font-weight: 700; color: #09090b;" align="right">${serviceCode}</td>
      </tr>
      <tr>
        <td style="padding: 12px 18px; border-bottom: 1px solid #e4e4e7; font-size: 13px; color: #71717a;">Paket Hosting</td>
        <td style="padding: 12px 18px; border-bottom: 1px solid #e4e4e7; font-size: 13px; font-weight: 600; color: #09090b;" align="right">${planName}</td>
      </tr>
      <tr>
        <td style="padding: 12px 18px; border-bottom: 1px solid #e4e4e7; font-size: 13px; color: #71717a;">Server IP</td>
        <td style="padding: 12px 18px; border-bottom: 1px solid #e4e4e7; font-size: 13px; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; font-weight: 600; color: #09090b;" align="right">${serverIp || '103.119.237.132'}</td>
      </tr>
      <tr>
        <td style="padding: 12px 18px; border-bottom: 1px solid #e4e4e7; font-size: 13px; color: #71717a;">Nameservers DNS</td>
        <td style="padding: 12px 18px; border-bottom: 1px solid #e4e4e7; font-size: 12px; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; color: #09090b;" align="right">${nameservers || 'ns1.domainmurah.net, ns2.domainmurah.net'}</td>
      </tr>
      <tr>
        <td style="padding: 12px 18px; font-size: 13px; color: #71717a;">Masa Aktif Hingga</td>
        <td style="padding: 12px 18px; font-size: 13px; font-weight: 600; color: #09090b;" align="right">${formattedExpiry}</td>
      </tr>
    </table>

    <p style="margin: 0; font-size: 13px; line-height: 22px; color: #71717a;">
      Anda dapat mengelola file website via File Manager terintegrasi, mengatur akun FTP, dan mengelola database MySQL langsung dari Customer Portal 1s Labs.
    </p>
  `;

  const html = wrapHtmlEmail({
    title: subject,
    preheader: `Layanan hosting Anda untuk ${domain} telah aktif dan siap digunakan.`,
    content,
    callToAction: {
      text: 'Kelola Hosting di Portal',
      url: `${APP_URL}/portal?tab=detail&service=${serviceCode}`
    },
    badge: 'Hosting Aktif'
  });

  const text = `Selamat ${name}!\n\nLayanan hosting untuk domain ${domain} (${serviceCode}) telah aktif.\nServer IP: ${serverIp || '103.119.237.132'}\nNameservers: ${nameservers || 'ns1.domainmurah.net, ns2.domainmurah.net'}\nAktif hingga: ${formattedExpiry}\nBuka portal di: ${APP_URL}/portal\n\n1s Labs`;

  return sendMail({ to, subject, templateName: 'customer_hosting_activated', html, text, metadata: { serviceCode, domain } });
}

/**
 * 7. Expiration Reminder
 */
async function sendExpirationReminderEmail({ to, name, serviceCode, domain, daysLeft, expiresAt }) {
  const subject = `Peringatan: Hosting ${domain} Akan Kedaluwarsa dalam ${daysLeft} Hari`;
  const formattedExpiry = new Date(expiresAt).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' });

  const content = `
    <h2 style="margin: 0 0 12px 0; font-size: 18px; font-weight: 700; color: #09090b; letter-spacing: -0.3px;">
      Pengingat Masa Aktif Hosting
    </h2>
    <p style="margin: 0 0 20px 0; font-size: 14px; line-height: 24px; color: #3f3f46;">
      Halo <strong>${name}</strong>,<br>
      Masa aktif paket hosting untuk domain <strong>${domain}</strong> (${serviceCode}) akan berakhir pada <strong>${formattedExpiry}</strong> (tersisa <strong>${daysLeft} hari lagi</strong>).
    </p>

    <div style="background-color: #fafafa; border: 1px solid #e4e4e7; border-left: 3px solid #18181b; padding: 14px 18px; border-radius: 0 8px 8px 0; margin-bottom: 24px;">
      <p style="margin: 0; font-size: 13px; line-height: 20px; color: #27272a;">
        Untuk memastikan situs web dan email domain Anda tetap beroperasi tanpa henti, lakukan perpanjangan sebelum tanggal jatuh tempo.
      </p>
    </div>
  `;

  const html = wrapHtmlEmail({
    title: subject,
    preheader: `Pengingat masa aktif hosting ${domain} tersisa ${daysLeft} hari.`,
    content,
    callToAction: {
      text: 'Perpanjang Layanan Sekarang',
      url: `${APP_URL}/portal`
    },
    badge: 'Masa Aktif Hosting'
  });

  const text = `Halo ${name},\n\nHosting ${domain} (${serviceCode}) akan berakhir pada ${formattedExpiry} (sisa ${daysLeft} hari).\nPerpanjang di: ${APP_URL}/portal\n\n1s Labs`;

  return sendMail({ to, subject, templateName: 'customer_expiration_reminder', html, text, metadata: { serviceCode, domain, daysLeft } });
}

/**
 * 8. Password Reset Email
 */
async function sendPasswordResetEmail({ to, name, token }) {
  const resetUrl = `${APP_URL}/reset-password?token=${token}`;
  const subject = 'Permintaan Pengaturan Ulang Kata Sandi Akun 1sLabs';

  const content = `
    <h2 style="margin: 0 0 12px 0; font-size: 18px; font-weight: 700; color: #09090b; letter-spacing: -0.3px;">
      Atur Ulang Kata Sandi Akun
    </h2>
    <p style="margin: 0 0 20px 0; font-size: 14px; line-height: 24px; color: #3f3f46;">
      Halo <strong>${name}</strong>,<br>
      Kami menerima permintaan pengaturan ulang kata sandi untuk akun 1s Labs Anda. Klik tombol di bawah untuk membuat kata sandi baru.
    </p>

    <div style="background-color: #fafafa; border: 1px solid #e4e4e7; border-left: 3px solid #18181b; padding: 14px 18px; border-radius: 0 8px 8px 0; margin-bottom: 24px;">
      <p style="margin: 0; font-size: 13px; line-height: 20px; color: #27272a;">
        Tautan reset ini hanya berlaku selama <strong>1 jam</strong>. Jika Anda tidak merasa melakukan permintaan ini, akun Anda tetap aman dan abaikan pesan ini.
      </p>
    </div>
  `;

  const html = wrapHtmlEmail({
    title: subject,
    preheader: 'Atur ulang kata sandi akun 1sLabs Anda.',
    content,
    callToAction: {
      text: 'Atur Ulang Kata Sandi',
      url: resetUrl
    },
    badge: 'Keamanan Akun'
  });

  const text = `Halo ${name},\n\nTautan reset kata sandi akun 1s Labs:\n${resetUrl}\n\nTautan berlaku selama 1 jam.\n\n1s Labs`;

  return sendMail({ to, subject, templateName: 'customer_password_reset', html, text, metadata: { to } });
}

// ==========================================
// ADMINISTRATOR NOTIFICATION EMAIL TEMPLATES
// (Recipient: dzikrirabbani2401@gmail.com)
// ==========================================

/**
 * Admin Notification: New Customer Registration
 */
async function sendAdminNewCustomerNotification({ user }) {
  const subject = `[Admin Alert] Registrasi Pelanggan Baru: ${user.name} (${user.email})`;

  const content = `
    <h2 style="margin: 0 0 12px 0; font-size: 18px; font-weight: 700; color: #09090b; letter-spacing: -0.3px;">
      Pelanggan Baru Mendaftar
    </h2>
    <p style="margin: 0 0 18px 0; font-size: 14px; color: #71717a;">
      Terdapat pengguna baru yang mendaftar pada portal 1s Labs:
    </p>

    <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #fafafa; border: 1px solid #e4e4e7; border-radius: 12px; margin-bottom: 20px;">
      <tr>
        <td style="padding: 12px 18px; border-bottom: 1px solid #e4e4e7; font-size: 13px; color: #71717a;">Nama Pelanggan</td>
        <td style="padding: 12px 18px; border-bottom: 1px solid #e4e4e7; font-size: 13px; font-weight: 600; color: #09090b;" align="right">${user.name}</td>
      </tr>
      <tr>
        <td style="padding: 12px 18px; border-bottom: 1px solid #e4e4e7; font-size: 13px; color: #71717a;">Alamat Email</td>
        <td style="padding: 12px 18px; border-bottom: 1px solid #e4e4e7; font-size: 13px; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; font-weight: 600; color: #09090b;" align="right">${user.email}</td>
      </tr>
      <tr>
        <td style="padding: 12px 18px; font-size: 13px; color: #71717a;">Nomor WhatsApp</td>
        <td style="padding: 12px 18px; font-size: 13px; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; font-weight: 600; color: #09090b;" align="right">${user.phone || '-'}</td>
      </tr>
    </table>
  `;

  const html = wrapHtmlEmail({
    title: subject,
    preheader: `Pelanggan baru ${user.name} baru saja mendaftar.`,
    content,
    callToAction: {
      text: 'Buka Admin Panel',
      url: `${APP_URL}/admin`
    },
    badge: 'Admin Alert'
  });

  const text = `Pelanggan baru mendaftar:\nNama: ${user.name}\nEmail: ${user.email}\nWhatsApp: ${user.phone}\nAdmin: ${APP_URL}/admin`;

  return sendMail({ to: ADMIN_RECIPIENT, subject, templateName: 'admin_new_customer', html, text, metadata: { userId: user.id } });
}

/**
 * Admin Notification: New Hosting Order
 */
async function sendAdminNewOrderNotification({ order, user, plan, domain, amount }) {
  const subject = `[Admin Alert] Pesanan Baru #${order.order_number} - ${plan.name} (${domain})`;
  const formattedAmount = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);

  const content = `
    <h2 style="margin: 0 0 12px 0; font-size: 18px; font-weight: 700; color: #09090b; letter-spacing: -0.3px;">
      Pesanan Hosting Baru Dibuat
    </h2>
    <p style="margin: 0 0 18px 0; font-size: 14px; color: #71717a;">
      Pelanggan baru saja melakukan checkout paket hosting:
    </p>

    <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #fafafa; border: 1px solid #e4e4e7; border-radius: 12px; margin-bottom: 20px;">
      <tr>
        <td style="padding: 12px 18px; border-bottom: 1px solid #e4e4e7; font-size: 13px; color: #71717a;">Nomor Order</td>
        <td style="padding: 12px 18px; border-bottom: 1px solid #e4e4e7; font-size: 13px; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; font-weight: 700; color: #09090b;" align="right">#${order.order_number}</td>
      </tr>
      <tr>
        <td style="padding: 12px 18px; border-bottom: 1px solid #e4e4e7; font-size: 13px; color: #71717a;">Pelanggan</td>
        <td style="padding: 12px 18px; border-bottom: 1px solid #e4e4e7; font-size: 13px; font-weight: 600; color: #09090b;" align="right">${user.name} (${user.email})</td>
      </tr>
      <tr>
        <td style="padding: 12px 18px; border-bottom: 1px solid #e4e4e7; font-size: 13px; color: #71717a;">Nomor WhatsApp</td>
        <td style="padding: 12px 18px; border-bottom: 1px solid #e4e4e7; font-size: 13px; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; font-weight: 600; color: #09090b;" align="right">${user.phone}</td>
      </tr>
      <tr>
        <td style="padding: 12px 18px; border-bottom: 1px solid #e4e4e7; font-size: 13px; color: #71717a;">Paket &amp; Domain</td>
        <td style="padding: 12px 18px; border-bottom: 1px solid #e4e4e7; font-size: 13px; font-weight: 600; color: #09090b;" align="right">${plan.name} &bull; ${domain}</td>
      </tr>
      <tr>
        <td style="padding: 16px 18px; font-size: 13px; font-weight: 700; color: #09090b;">Total Tagihan</td>
        <td style="padding: 16px 18px; font-size: 17px; font-weight: 800; color: #09090b;" align="right">${formattedAmount}</td>
      </tr>
    </table>
  `;

  const html = wrapHtmlEmail({
    title: subject,
    preheader: `Pesanan hosting #${order.order_number} dibuat oleh ${user.name}.`,
    content,
    callToAction: {
      text: 'Tinjau di Dashboard Admin',
      url: `${APP_URL}/admin`
    },
    badge: 'Order Alert'
  });

  const text = `Pesanan Baru #${order.order_number}\nPelanggan: ${user.name} (${user.email}, WA: ${user.phone})\nPaket: ${plan.name} (${domain})\nTotal: ${formattedAmount}\nAdmin: ${APP_URL}/admin`;

  return sendMail({ to: ADMIN_RECIPIENT, subject, templateName: 'admin_new_order', html, text, metadata: { orderNumber: order.order_number } });
}

/**
 * Admin Notification: Payment Proof Submitted (Urgent action needed)
 */
async function sendAdminPaymentProofNotification({ order, payment, user }) {
  const subject = `[ACTION REQUIRED] Bukti Pembayaran Baru Diunggah: Pesanan #${order.order_number}`;
  const formattedAmount = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(payment.amount);

  const content = `
    <h2 style="margin: 0 0 12px 0; font-size: 18px; font-weight: 700; color: #09090b; letter-spacing: -0.3px;">
      Bukti Pembayaran Menunggu Verifikasi Manual
    </h2>
    <p style="margin: 0 0 18px 0; font-size: 14px; color: #3f3f46;">
      Pelanggan <strong>${user.name}</strong> baru saja mengunggah struk transfer bukti pembayaran:
    </p>

    <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #fafafa; border: 1px solid #e4e4e7; border-radius: 12px; margin-bottom: 24px;">
      <tr>
        <td style="padding: 12px 18px; border-bottom: 1px solid #e4e4e7; font-size: 13px; color: #71717a;">Nomor Pesanan</td>
        <td style="padding: 12px 18px; border-bottom: 1px solid #e4e4e7; font-size: 13px; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; font-weight: 700; color: #09090b;" align="right">#${order.order_number}</td>
      </tr>
      <tr>
        <td style="padding: 12px 18px; border-bottom: 1px solid #e4e4e7; font-size: 13px; color: #71717a;">Nominal Transfer</td>
        <td style="padding: 12px 18px; border-bottom: 1px solid #e4e4e7; font-size: 15px; font-weight: 800; color: #09090b;" align="right">${formattedAmount}</td>
      </tr>
      <tr>
        <td style="padding: 12px 18px; border-bottom: 1px solid #e4e4e7; font-size: 13px; color: #71717a;">Pengirim / Bank</td>
        <td style="padding: 12px 18px; border-bottom: 1px solid #e4e4e7; font-size: 13px; font-weight: 600; color: #09090b;" align="right">${payment.sender_bank_or_wallet || '-'} (${payment.sender_account_name || '-'})</td>
      </tr>
      <tr>
        <td style="padding: 12px 18px; font-size: 13px; color: #71717a;">Kontak WhatsApp</td>
        <td style="padding: 12px 18px; font-size: 13px; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; font-weight: 700; color: #09090b;" align="right">${user.phone}</td>
      </tr>
    </table>

    <p style="margin: 0; font-size: 13px; line-height: 22px; color: #71717a;">
      Buka dashboard admin untuk membandingkan mutasi QRIS atau rekening sebelum menekan tombol Setujui (Approve).
    </p>
  `;

  const html = wrapHtmlEmail({
    title: subject,
    preheader: `Verifikasi pembayaran diperlukan untuk pesanan #${order.order_number}.`,
    content,
    callToAction: {
      text: 'Verifikasi Pembayaran Sekarang',
      url: `${APP_URL}/admin`
    },
    badge: 'Verifikasi Manual'
  });

  const text = `Bukti Transfer Baru Diunggah!\nPesanan: #${order.order_number}\nPelanggan: ${user.name} (WA: ${user.phone})\nNominal: ${formattedAmount}\nBank/Pengirim: ${payment.sender_bank_or_wallet} / ${payment.sender_account_name}\nVerifikasi: ${APP_URL}/admin`;

  return sendMail({ to: ADMIN_RECIPIENT, subject, templateName: 'admin_payment_proof_submitted', html, text, metadata: { orderNumber: order.order_number, paymentId: payment.id } });
}

/**
 * Admin Notification: Hosting Provisioning Failure
 */
async function sendAdminProvisioningFailureNotification({ serviceCode, domain, errorMessage }) {
  const subject = `[ALERT KRITIS] Gagal Aktivasi Hosting: ${domain} (${serviceCode})`;

  const content = `
    <h2 style="margin: 0 0 12px 0; font-size: 18px; font-weight: 700; color: #09090b; letter-spacing: -0.3px;">
      Aktivasi Hosting Gagal Diproses
    </h2>
    <p style="margin: 0 0 18px 0; font-size: 14px; color: #3f3f46;">
      Terjadi kesalahan saat sistem mencoba mengaktifkan hosting untuk domain <strong>${domain}</strong> (${serviceCode}):
    </p>

    <div style="background-color: #fafafa; border: 1px solid #e4e4e7; border-left: 3px solid #18181b; border-radius: 0 8px 8px 0; padding: 14px 18px; margin-bottom: 24px;">
      <p style="margin: 0; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; font-size: 12px; color: #18181b; word-break: break-all;">
        ${errorMessage || 'Unknown provisioning error occurred.'}
      </p>
    </div>
  `;

  const html = wrapHtmlEmail({
    title: subject,
    preheader: `Gagal aktivasi hosting untuk ${domain}.`,
    content,
    callToAction: {
      text: 'Buka Admin Panel',
      url: `${APP_URL}/admin`
    },
    badge: 'Alert Kritis'
  });

  const text = `Gagal provisioning hosting ${domain} (${serviceCode}):\nError: ${errorMessage}\nPeriksa di: ${APP_URL}/admin`;

  return sendMail({ to: ADMIN_RECIPIENT, subject, templateName: 'admin_provisioning_failure', html, text, metadata: { serviceCode, domain, errorMessage } });
}

// ==========================================
// EMAIL TEMPLATES REPOSITORY & CUSTOMIZATION
// ==========================================
const DEFAULT_TEMPLATES = {
  customer_verify_email: {
    template_key: 'customer_verify_email',
    name: 'Verifikasi Alamat Email',
    category: 'Authentication',
    subject: 'Verifikasi Alamat Email Akun 1sLabs Hosting',
    heading: 'Verifikasi Alamat Email Anda',
    body_html: `<p>Halo <strong>{{customer_name}}</strong>,</p><p>Terima kasih telah bergabung dengan platform hosting <strong>1s Labs</strong>. Untuk mengaktifkan akun dan mulai memesan paket hosting, silakan klik tombol verifikasi di bawah.</p>`,
    button_text: 'Verifikasi Akun Sekarang',
    button_url: '{{verification_url}}',
    footer_text: 'Tautan ini berlaku selama 24 jam.',
    brand_color: '#000000',
    variables: ['customer_name', 'customer_email', 'verification_url']
  },
  customer_order_created: {
    template_key: 'customer_order_created',
    name: 'Pesanan Hosting Baru Dibuat',
    category: 'Orders',
    subject: 'Pesanan Dibuat: #{{order_number}} - {{service_name}}',
    heading: 'Pesanan Hosting Baru Dibuat',
    body_html: `<p>Halo <strong>{{customer_name}}</strong>,</p><p>Pesanan hosting Anda <strong>#{{order_number}}</strong> untuk paket <strong>{{service_name}}</strong> (Domain: {{domain_name}}) telah dicatat. Selesaikan pembayaran dalam waktu 24 jam.</p>`,
    button_text: 'Selesaikan Pembayaran',
    button_url: '{{payment_url}}',
    footer_text: 'Harap unggah bukti transfer setelah melakukan pembayaran.',
    brand_color: '#000000',
    variables: ['customer_name', 'customer_email', 'order_number', 'service_name', 'domain_name', 'invoice_total', 'payment_url']
  },
  customer_payment_approved: {
    template_key: 'customer_payment_approved',
    name: 'Pembayaran Disetujui & Hosting Aktif',
    category: 'Billing',
    subject: 'Pembayaran Diterima & Layanan Aktif: #{{order_number}}',
    heading: 'Pembayaran Anda Telah Terverifikasi Sah',
    body_html: `<p>Halo <strong>{{customer_name}}</strong>,</p><p>Kabar baik! Pembayaran sebesar <strong>{{invoice_total}}</strong> untuk pesanan <strong>#{{order_number}}</strong> telah kami verifikasi sah.</p>`,
    button_text: 'Buka Customer Portal',
    button_url: '{{portal_url}}',
    footer_text: 'Invoice resmi Anda telah diterbitkan.',
    brand_color: '#000000',
    variables: ['customer_name', 'customer_email', 'order_number', 'invoice_number', 'service_name', 'domain_name', 'invoice_total', 'portal_url']
  },
  customer_payment_rejected: {
    template_key: 'customer_payment_rejected',
    name: 'Pembayaran Ditolak',
    category: 'Billing',
    subject: 'Pemberitahuan Status Pembayaran: #{{order_number}}',
    heading: 'Verifikasi Pembayaran Membutuhkan Tindakan',
    body_html: `<p>Halo <strong>{{customer_name}}</strong>,</p><p>Bukti pembayaran untuk pesanan <strong>#{{order_number}}</strong> belum dapat kami verifikasi karena: <em>{{rejection_reason}}</em>.</p>`,
    button_text: 'Unggah Ulang Bukti Pembayaran',
    button_url: '{{payment_url}}',
    footer_text: 'Silakan hubungi WhatsApp support kami jika Anda membutuhkan bantuan.',
    brand_color: '#000000',
    variables: ['customer_name', 'customer_email', 'order_number', 'service_name', 'rejection_reason', 'payment_url']
  },
  customer_hosting_activated: {
    template_key: 'customer_hosting_activated',
    name: 'Aktivasi Layanan Hosting Sukses',
    category: 'Hosting',
    subject: 'Layanan Hosting Aktif: {{domain_name}} ({{service_code}})',
    heading: 'Layanan Hosting Cloud Anda Telah Aktif',
    body_html: `<p>Halo <strong>{{customer_name}}</strong>,</p><p>Selamat! Layanan hosting Anda dengan domain <strong>{{domain_name}}</strong> telah aktif di server cloud 1sLabs.</p>`,
    button_text: 'Kelola Hosting Anda',
    button_url: '{{portal_url}}',
    footer_text: 'Server IP: {{server_ip}} | Nameservers: {{nameservers}}',
    brand_color: '#000000',
    variables: ['customer_name', 'customer_email', 'service_code', 'domain_name', 'service_name', 'server_ip', 'nameservers', 'hosting_expiration', 'portal_url']
  },
  customer_expiration_reminder: {
    template_key: 'customer_expiration_reminder',
    name: 'Pengingat Masa Berlaku Layanan',
    category: 'Hosting',
    subject: 'Pengingat: Layanan Hosting {{domain_name}} Segera Berakhir',
    heading: 'Masa Berlaku Hosting Anda Segera Berakhir',
    body_html: `<p>Halo <strong>{{customer_name}}</strong>,</p><p>Layanan hosting Anda untuk domain <strong>{{domain_name}}</strong> akan kedaluwarsa pada <strong>{{hosting_expiration}}</strong> (tersisa {{days_remaining}} hari).</p>`,
    button_text: 'Perpanjang Layanan Sekarang',
    button_url: '{{renewal_url}}',
    footer_text: 'Perpanjang sebelum tanggal kedaluwarsa untuk menghindari penangguhan website.',
    brand_color: '#000000',
    variables: ['customer_name', 'customer_email', 'domain_name', 'service_name', 'hosting_expiration', 'days_remaining', 'renewal_url']
  },
  customer_invoice_sent: {
    template_key: 'customer_invoice_sent',
    name: 'Pengiriman Faktur Invoice',
    category: 'Billing',
    subject: 'Faktur Invoice Resmi 1sLabs: {{invoice_number}}',
    heading: 'Faktur Invoice Resmi Tagihan Layanan',
    body_html: `<p>Halo <strong>{{customer_name}}</strong>,</p><p>Berikut adalah invoice resmi tagihan layanan Anda <strong>{{invoice_number}}</strong> dengan total sebesar <strong>{{invoice_total}}</strong>.</p>`,
    button_text: 'Lihat & Unduh Invoice PDF',
    button_url: '{{invoice_url}}',
    footer_text: 'Invoice ini sah dan diterbitkan secara digital oleh 1sLabs Technology.',
    brand_color: '#000000',
    variables: ['customer_name', 'customer_email', 'invoice_number', 'invoice_total', 'due_date', 'invoice_url']
  },
  customer_password_reset: {
    template_key: 'customer_password_reset',
    name: 'Reset Kata Sandi Akun',
    category: 'Authentication',
    subject: 'Permintaan Reset Kata Sandi Akun 1sLabs',
    heading: 'Atur Ulang Kata Sandi Akun',
    body_html: `<p>Halo <strong>{{customer_name}}</strong>,</p><p>Kami menerima permintaan untuk mengatur ulang kata sandi akun 1sLabs Anda. Klik tombol di bawah untuk membuat kata sandi baru.</p>`,
    button_text: 'Reset Kata Sandi',
    button_url: '{{reset_url}}',
    footer_text: 'Tautan ini berlaku selama 1 jam. Jika Anda tidak meminta ini, abaikan pesan ini.',
    brand_color: '#000000',
    variables: ['customer_name', 'customer_email', 'reset_url']
  },
  admin_new_customer: {
    template_key: 'admin_new_customer',
    name: 'Notifikasi Pelanggan Baru Terdaftar',
    category: 'Admin Notifications',
    subject: '[1sLabs Admin] Pelanggan Baru Terdaftar: {{customer_name}}',
    heading: 'Pemberitahuan Akun Pelanggan Baru',
    body_html: `<p>Halo Administrator,</p><p>Pelanggan baru bernama <strong>{{customer_name}}</strong> (<em>{{customer_email}}</em>) telah berhasil mendaftar akun di platform 1sLabs Hosting.</p>`,
    button_text: 'Buka Customer Management',
    button_url: '{{admin_url}}',
    footer_text: 'Notifikasi otomatis sistem 1sLabs.',
    brand_color: '#000000',
    variables: ['customer_name', 'customer_email', 'admin_url']
  },
  admin_new_order: {
    template_key: 'admin_new_order',
    name: 'Notifikasi Pesanan Hosting Baru',
    category: 'Admin Notifications',
    subject: '[1sLabs Admin] Pesanan Baru: #{{order_number}} - {{customer_name}}',
    heading: 'Pesanan Hosting Masuk',
    body_html: `<p>Halo Administrator,</p><p>Pesanan hosting baru <strong>#{{order_number}}</strong> telah dibuat oleh <strong>{{customer_name}}</strong> untuk paket <strong>{{service_name}}</strong> (Domain: {{domain_name}}).</p>`,
    button_text: 'Periksa Pesanan',
    button_url: '{{admin_url}}',
    footer_text: 'Menunggu proses pembayaran pelanggan.',
    brand_color: '#000000',
    variables: ['customer_name', 'customer_email', 'order_number', 'service_name', 'domain_name', 'admin_url']
  },
  admin_payment_proof: {
    template_key: 'admin_payment_proof',
    name: 'Notifikasi Bukti Pembayaran Diunggah',
    category: 'Admin Notifications',
    subject: '[1sLabs Admin] Bukti Pembayaran Baru: #{{order_number}}',
    heading: 'Verifikasi Pembayaran Diperlukan',
    body_html: `<p>Halo Administrator,</p><p>Pelanggan <strong>{{customer_name}}</strong> telah mengunggah bukti transfer untuk pesanan <strong>#{{order_number}}</strong> sebesar <strong>{{invoice_total}}</strong>.</p>`,
    button_text: 'Verifikasi Pembayaran Sekarang',
    button_url: '{{admin_url}}',
    footer_text: 'Verifikasi cepat memicu provisioning instan cPanel.',
    brand_color: '#000000',
    variables: ['customer_name', 'customer_email', 'order_number', 'invoice_total', 'admin_url']
  },
  admin_provisioning_failure: {
    template_key: 'admin_provisioning_failure',
    name: 'Notifikasi Kegagalan Provisioning cPanel',
    category: 'Admin Notifications',
    subject: '[1sLabs ALERT] Kegagalan Provisioning Layanan: {{domain_name}}',
    heading: 'Peringatan Operasional Server',
    body_html: `<p>Perhatian Administrator,</p><p>Provisioning otomatis akun cPanel untuk layanan <strong>{{domain_name}}</strong> (Order: #{{order_number}}) gagal dengan error: <code>{{error_message}}</code>.</p>`,
    button_text: 'Investigasi di Admin Panel',
    button_url: '{{admin_url}}',
    footer_text: 'Tindakan manual diperlukan segera.',
    brand_color: '#dc2626',
    variables: ['customer_name', 'order_number', 'domain_name', 'error_message', 'admin_url']
  }
};

/**
 * Replace placeholders like {{variable_name}} with actual values
 */
function substituteVariables(text, vars = {}) {
  if (!text) return '';
  return text.replace(/\{\{([a-zA-Z0-9_]+)\}\}/g, (match, key) => {
    return vars[key] !== undefined && vars[key] !== null ? String(vars[key]) : match;
  });
}

/**
 * Send official invoice notification via email
 */
async function sendInvoiceEmail({ to, name, invoice, invoiceUrl }) {
  const formattedTotal = new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0
  }).format(invoice.amount || invoice.subtotal || 0);

  const subject = `Faktur Invoice Resmi 1sLabs: ${invoice.invoice_number}`;
  const dueDateStr = invoice.due_date ? new Date(invoice.due_date).toLocaleDateString('id-ID', { dateStyle: 'long' }) : 'Sesuai pesanan';

  const content = `
    <h2 style="margin: 0 0 12px 0; font-size: 18px; font-weight: 700; color: #09090b; letter-spacing: -0.3px;">
      Faktur Invoice Resmi Tagihan Layanan
    </h2>
    <p style="margin: 0 0 20px 0; font-size: 14px; line-height: 24px; color: #3f3f46;">
      Halo <strong>${name}</strong>,<br>
      Faktur invoice resmi untuk transaksi layanan Anda telah diterbitkan. Berikut rincian ringkasan invoice:
    </p>

    <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #fafafa; border: 1px solid #e4e4e7; border-radius: 12px; margin-bottom: 24px;">
      <tr>
        <td style="padding: 12px 18px; border-bottom: 1px solid #e4e4e7; font-size: 13px; color: #71717a;">Nomor Invoice</td>
        <td style="padding: 12px 18px; border-bottom: 1px solid #e4e4e7; font-size: 13px; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; font-weight: 700; color: #09090b;" align="right">${invoice.invoice_number}</td>
      </tr>
      <tr>
        <td style="padding: 12px 18px; border-bottom: 1px solid #e4e4e7; font-size: 13px; color: #71717a;">Status Pembayaran</td>
        <td style="padding: 12px 18px; border-bottom: 1px solid #e4e4e7; font-size: 13px; font-weight: 700;" align="right">
          ${invoice.status === 'paid' ? '<span style="color: #15803d;">LUNAS / PAID</span>' : '<span style="color: #b45309;">MENUNGGU PEMBAYARAN</span>'}
        </td>
      </tr>
      <tr>
        <td style="padding: 12px 18px; border-bottom: 1px solid #e4e4e7; font-size: 13px; color: #71717a;">Jatuh Tempo</td>
        <td style="padding: 12px 18px; border-bottom: 1px solid #e4e4e7; font-size: 13px; color: #09090b;" align="right">${dueDateStr}</td>
      </tr>
      <tr>
        <td style="padding: 16px 18px; font-size: 13px; font-weight: 700; color: #09090b;">Total Tagihan</td>
        <td style="padding: 16px 18px; font-size: 17px; font-weight: 800; color: #09090b;" align="right">${formattedTotal}</td>
      </tr>
    </table>

    <p style="margin: 0; font-size: 13px; line-height: 20px; color: #71717a;">
      Anda dapat mencetak atau menyimpan dokumen invoice resmi dalam format PDF melalui tombol di bawah.
    </p>
  `;

  const html = wrapHtmlEmail({
    title: subject,
    preheader: `Invoice ${invoice.invoice_number} sebesar ${formattedTotal}.`,
    content,
    callToAction: {
      text: 'Lihat & Unduh Invoice PDF',
      url: invoiceUrl || `${APP_URL}/invoice/${invoice.invoice_number}`
    },
    badge: 'Faktur Resmi'
  });

  const text = `Halo ${name},\n\nFaktur invoice resmi Anda telah terbit: ${invoice.invoice_number}\nTotal: ${formattedTotal}\nLihat invoice di: ${invoiceUrl || `${APP_URL}/invoice/${invoice.invoice_number}`}\n\n1s Labs Finance Team`;

  return sendMail({
    to,
    subject,
    templateName: 'customer_invoice_sent',
    html,
    text,
    metadata: { invoiceNumber: invoice.invoice_number, amount: invoice.amount }
  });
}

module.exports = {
  sendMail,
  wrapHtmlEmail,
  sendVerificationEmail,
  sendOrderCreatedEmail,
  sendPaymentProofReceivedEmail,
  sendPaymentApprovedEmail,
  sendPaymentRejectedEmail,
  sendHostingActivatedEmail,
  sendExpirationReminderEmail,
  sendPasswordResetEmail,
  sendInvoiceEmail,
  sendAdminNewCustomerNotification,
  sendAdminNewOrderNotification,
  sendAdminPaymentProofNotification,
  sendAdminProvisioningFailureNotification,
  DEFAULT_TEMPLATES,
  substituteVariables
};

