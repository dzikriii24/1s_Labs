import os
import sys
import paramiko

if sys.platform == 'win32':
    sys.stdout.reconfigure(encoding='utf-8')
    sys.stderr.reconfigure(encoding='utf-8')

HOST = "103.119.237.132"
USER = "u1zh8984"
KEY_PATH = r"C:\Users\dzikri\.ssh\id_ed25519"

def main():
    print("=" * 60)
    print("Seeding Small Business Templates & Sources to Production DB")
    print("=" * 60)

    pkey = paramiko.Ed25519Key.from_private_key_file(KEY_PATH)
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    ssh.connect(HOST, port=22, username=USER, pkey=pkey, timeout=20)

    node_script = """
const { query } = require('/home/u1zh8984/oneslabs-backend/src/db');

async function seed() {
  console.log('1. Altering marketing_sources source_type to VARCHAR(100)...');
  try {
    await query("ALTER TABLE marketing_sources MODIFY COLUMN source_type VARCHAR(100) NOT NULL DEFAULT 'custom_directory'");
    console.log('  + source_type is now VARCHAR(100)');
  } catch (e) {
    console.warn('  ! Alter note:', e.message);
  }

  console.log('2. Ensuring Global Small Business source exists...');
  const existingSource = await query("SELECT id FROM marketing_sources WHERE source_type = 'international_business'");
  if (existingSource.length === 0) {
    await query(`
      INSERT INTO marketing_sources 
      (name, url, source_type, data_category, collection_method, permission_notes, schedule_cron, rate_limit_per_minute, max_records_per_run, is_active, health_status)
      VALUES 
      ('Global Small Business Directory (MY, SG, AU, UK, US, CA)', 'https://global-small-business.org', 'international_business', 'International Small Business', 'scraper', 'Direktori publik bisnis kecil internasional untuk target outreach global 1sLabs.', '0 12 * * *', 20, 50, 1, 'healthy')
    `);
    console.log('  + Inserted international_business source');
  } else {
    console.log('  = international_business source already exists (id: ' + existingSource[0].id + ')');
  }

  console.log('3. Seeding Small Business & International Email Templates...');
  const templates = [
    {
      name: 'Website UMKM & Bisnis Lokal (Profile, WhatsApp, Maps)',
      category: 'Small Business - Website',
      subject: 'Pengembangan Website & Digital Presence untuk {{business_name}}',
      body_html: `<p>Halo Tim <strong>{{business_name}}</strong>,</p>
<p>Salam kenal, kami dari <strong>1sLabs</strong> — studio teknologi & digital partner yang fokus membantu UMKM dan bisnis lokal di Indonesia meningkatkan visibilitas dan penjualan melalui website profesional yang terjangkau.</p>
<p>Berdasarkan pengamatan kami, <strong>{{business_name}}</strong> di {{city}} memiliki potensi besar untuk menjangkau lebih banyak pelanggan secara online.</p>
<p>Kami memiliki paket pengembangan <strong>Website Bisnis Lokal & UMKM</strong> yang siap pakai, meliputi:</p>
<ul>
  <li><strong>Desain Modern & Mobile-Friendly:</strong> Tampil elegan di smartphone maupun laptop.</li>
  <li><strong>Integrasi Tombol WhatsApp:</strong> Calon pelanggan dapat langsung chat & order dengan 1 klik.</li>
  <li><strong>Lokasi Google Maps & Jam Operasional:</strong> Memudahkan pelanggan datang langsung ke lokasi usaha Anda.</li>
  <li><strong>Galeri Produk / Layanan:</strong> Tampilkan foto menu, produk, atau jasa terbaik Anda.</li>
  <li><strong>Free Hosting 1 Tahun & Subdomain Resmi:</strong> Anda tidak perlu pusing biaya server di awal.</li>
  <li><strong>Garansi & Maintenance 1 Tahun:</strong> Didampingi tim teknis jika ada perubahan menu atau foto.</li>
</ul>
<p>Waktu pengerjaan umumnya hanya 1–2 minggu. Kami sangat ingin berdiskusi santai mengenai bagaimana website ini dapat membantu bisnis Anda berkembang.</p>
<p>Apabila berkenan, apakah kami boleh mengirimkan preview desain atau konsultasi singkat melalui WhatsApp?</p>
<p>Terima kasih banyak atas waktunya.<br><br>Salam hangat,<br><strong>Tim 1sLabs</strong><br><a href="https://1slabs.my.id" style="color: #10b981; font-weight: bold;">1slabs.my.id</a></p>
<hr style="border: none; border-top: 1px solid #e4e4e7; margin: 20px 0;" />
<p style="font-size: 11px; color: #a1a1aa;">Email ini dikirimkan khusus kepada pemilik/pengelola {{business_name}}. Jika tidak ingin menerima informasi ini, Anda dapat <a href="{{unsubscribe_url}}" style="color: #71717a;">berhenti berlangganan di sini</a>.</p>`,
      variables_json: JSON.stringify(["business_name", "city", "unsubscribe_url"])
    },
    {
      name: 'Digital Menu & QR Code Ordering (Cafe & Restoran)',
      category: 'Small Business - F&B',
      subject: 'Menu Digital Interaktif & QR Code untuk {{business_name}}',
      body_html: `<p>Halo Pengelola <strong>{{business_name}}</strong>,</p>
<p>Perkenalkan, kami dari <strong>1sLabs</strong>. Kami memperhatikan perkembangan sektor kuliner & cafe di {{city}}, termasuk <strong>{{business_name}}</strong> yang memiliki daya tarik tersendiri bagi para penikmat kuliner.</p>
<p>Untuk meningkatkan kenyamanan pelanggan dan efisiensi operasional, kami ingin menawarkan solusi <strong>Digital Menu & QR Code Ordering</strong>:</p>
<ul>
  <li><strong>Scan & View dari Meja:</strong> Pelanggan cukup scan QR di meja tanpa perlu antre atau menunggu buku menu fisik.</li>
  <li><strong>Foto & Deskripsi Menggugah Selera:</strong> Tampilkan foto hidangan terbaik dengan visual tajam.</li>
  <li><strong>Update Harga & Menu Mandiri:</strong> Ubah status menu habis atau ganti harga kapan saja tanpa cetak ulang kertas menu.</li>
  <li><strong>Langsung Order via WhatsApp:</strong> Pesanan otomatis terformat rapi ke WhatsApp kasir/barista.</li>
  <li><strong>Termasuk Free Hosting & Maintenance 1 Tahun.</strong></li>
</ul>
<p>Solusi ini sangat ramah di kantong UMKM F&B dan bisa aktif dalam hitungan hari.</p>
<p>Bolehkah kami mendemokan tampilan demo menu digital ini untuk {{business_name}}?</p>
<p>Terima kasih dan sukses selalu untuk usahanya!<br><br>Salam,<br><strong>Tim 1sLabs</strong><br><a href="https://1slabs.my.id" style="color: #10b981;">1slabs.my.id</a></p>
<hr style="border: none; border-top: 1px solid #e4e4e7; margin: 20px 0;" />
<p style="font-size: 11px; color: #a1a1aa;"><a href="{{unsubscribe_url}}" style="color: #71717a;">Unsubscribe</a></p>`,
      variables_json: JSON.stringify(["business_name", "city", "unsubscribe_url"])
    },
    {
      name: 'Online Booking & Reservasi (Salon, Barbershop & Studio)',
      category: 'Small Business - Booking',
      subject: 'Sistem Reservasi & Booking Online Praktis untuk {{business_name}}',
      body_html: `<p>Halo Tim <strong>{{business_name}}</strong>,</p>
<p>Perkenalkan, kami dari <strong>1sLabs</strong>. Kami melihat layanan dan kualitas yang dihadirkan {{business_name}} di {{city}} sangat diminati oleh pelanggan setia.</p>
<p>Seringkali pelanggan ingin memesan jadwal pangkas, perawatan, atau sesi studio di luar jam operasional. Kami membantu menyediakan <strong>Website & Sistem Booking Online</strong> yang simpel:</p>
<ul>
  <li>Pelanggan memilih layanan, tanggal, jam, dan kapster/stylist favorit.</li>
  <li>Konfirmasi reservasi otomatis masuk ke WhatsApp bisnis Anda.</li>
  <li>Mengurangi antrean menumpuk dan no-show pelanggan.</li>
  <li>Sudah termasuk domain, hosting 1 tahun, serta garansi penuh.</li>
</ul>
<p>Apakah kami dapat menjadwalkan obrolan singkat untuk menunjukkan cara kerjanya?</p>
<p>Salam sukses,<br><strong>1sLabs Digital Team</strong><br><a href="https://1slabs.my.id" style="color: #10b981;">1slabs.my.id</a></p>
<hr style="border: none; border-top: 1px solid #e4e4e7; margin: 20px 0;" />
<p style="font-size: 11px; color: #a1a1aa;"><a href="{{unsubscribe_url}}" style="color: #71717a;">Unsubscribe</a></p>`,
      variables_json: JSON.stringify(["business_name", "city", "unsubscribe_url"])
    },
    {
      name: 'Modern Website Support for {{business_name}} (EN)',
      category: 'International - General',
      subject: 'Digital Presence & Web Development Support for {{business_name}}',
      body_html: `<p>Hi <strong>{{business_name}}</strong> Team,</p>
<p>I hope this email finds you well.</p>
<p>My name is Dzikri from <strong>1sLabs</strong>. We are a digital development and web engineering studio specializing in helping small businesses, cafes, boutique stores, and service companies build modern, high-performing websites at an accessible investment.</p>
<p>We recently discovered <strong>{{business_name}}</strong> and were genuinely impressed by your offerings in {{city}}.</p>
<p>If you have been considering refreshing your website, launching an online booking/catalog system, or improving mobile accessibility, we would love to assist you. Our turnkey package includes:</p>
<ul>
  <li>Clean, lightning-fast responsive design tailored to your brand.</li>
  <li>Direct WhatsApp / enquiry integration for instant customer capture.</li>
  <li>Interactive location map and operating hours.</li>
  <li><strong>Complimentary 1-Year Fast Cloud Hosting & SSL.</strong></li>
  <li><strong>Complimentary 1-Year Maintenance & Support Warranty.</strong></li>
</ul>
<p>We believe in honest, consultative relationships without pushy sales. Would you be open to a brief 5-minute chat or seeing a customized concept demo for {{business_name}}?</p>
<p>Warm regards,<br><br><strong>1sLabs Engineering Team</strong><br><a href="https://1slabs.my.id" style="color: #10b981; font-weight: bold;">https://1slabs.my.id</a></p>
<hr style="border: none; border-top: 1px solid #e4e4e7; margin: 20px 0;" />
<p style="font-size: 11px; color: #a1a1aa;">You are receiving this message as a public business contact. If you prefer not to receive further insights, please <a href="{{unsubscribe_url}}" style="color: #71717a;">unsubscribe here</a>.</p>`,
      variables_json: JSON.stringify(["business_name", "city", "country", "unsubscribe_url"])
    },
    {
      name: 'Peluang Kerjasama Laman Web & Digitalisasi {{business_name}} (MY)',
      category: 'International - MY/SG',
      subject: 'Peluang Kerjasama Pembangunan Laman Web & Digital {{business_name}}',
      body_html: `<p>Salam sejahtera kepada Pengurusan <strong>{{business_name}}</strong>,</p>
<p>Saya Dzikri dari <strong>1sLabs</strong> — rakan kongsi pembangunan teknologi web & digital khusus untuk perniagaan kecil, kafe, dan usahawan tempatan.</p>
<p>Kami melihat potensi perniagaan <strong>{{business_name}}</strong> di {{city}} untuk meluaskan capaian pelanggan melalui laman web yang moden, pantas, dan mesra telefon bimbit.</p>
<p>Pakej pembangunan laman web kami merangkumi:</p>
<ul>
  <li>Rekaan moden yang ringkas & profesional.</li>
  <li>Integrasi pesanan/pertanyaan terus ke WhatsApp perniagaan.</li>
  <li>Peta lokasi Google Maps & maklumat waktu operasi tepat.</li>
  <li><strong>Percuma Cloud Hosting & Sijil Keselamatan SSL selama 1 tahun.</strong></li>
  <li><strong>Jaminan penyelenggaraan & sokongan teknikal 1 tahun penuh.</strong></li>
</ul>
<p>Jika pihak tuan/puan berminat untuk melihat contoh rekaan atau berbincang santai secara dalam talian, kami berbesar hati untuk berhubung.</p>
<p>Sekian, terima kasih.<br><br>Yang benar,<br><strong>1sLabs Team</strong><br><a href="https://1slabs.my.id" style="color: #10b981;">1slabs.my.id</a></p>
<hr style="border: none; border-top: 1px solid #e4e4e7; margin: 20px 0;" />
<p style="font-size: 11px; color: #a1a1aa;"><a href="{{unsubscribe_url}}" style="color: #71717a;">Henti Langganan / Unsubscribe</a></p>`,
      variables_json: JSON.stringify(["business_name", "city", "unsubscribe_url"])
    }
  ];

  for (const t of templates) {
    const existing = await query("SELECT id FROM marketing_email_templates WHERE name = ?", [t.name]);
    if (existing.length === 0) {
      await query(
        `INSERT INTO marketing_email_templates (name, category, subject, body_html, variables_json, is_default)
         VALUES (?, ?, ?, ?, ?, 0)`,
        [t.name, t.category, t.subject, t.body_html, t.variables_json]
      );
      console.log(`  + Inserted template: ${t.name}`);
    } else {
      await query(
        `UPDATE marketing_email_templates 
         SET category = ?, subject = ?, body_html = ?, variables_json = ? 
         WHERE id = ?`,
        [t.category, t.subject, t.body_html, t.variables_json, existing[0].id]
      );
      console.log(`  = Updated template: ${t.name}`);
    }
  }

  const allTemplates = await query('SELECT id, name, category FROM marketing_email_templates');
  console.log('\\nTotal templates now in DB:', allTemplates.length);
  console.table(allTemplates);

  const allSources = await query('SELECT id, name, source_type, is_active FROM marketing_sources');
  console.log('\\nTotal sources now in DB:', allSources.length);
  console.table(allSources);

  process.exit(0);
}

seed().catch(err => {
  console.error('Seed error:', err);
  process.exit(1);
});
"""

    sftp = ssh.open_sftp()
    with sftp.file('/home/u1zh8984/oneslabs-backend/run_seed_templates.js', 'w') as f:
        f.write(node_script)
    sftp.close()

    cmd = "source /home/u1zh8984/nodevenv/oneslabs-backend/22/bin/activate && cd /home/u1zh8984/oneslabs-backend && node run_seed_templates.js"
    stdin, stdout, stderr = ssh.exec_command(cmd)
    out = stdout.read().decode('utf-8', errors='replace')
    err = stderr.read().decode('utf-8', errors='replace')
    print(out)
    if err:
        print("STDERR:", err)

    ssh.close()

if __name__ == '__main__':
    main()
