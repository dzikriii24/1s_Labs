import paramiko
import sys
import json

if sys.platform == 'win32':
    sys.stdout.reconfigure(encoding='utf-8')
    sys.stderr.reconfigure(encoding='utf-8')

HOSTNAME = "103.119.237.132"
USERNAME = "u1zh8984"
KEY_PATH = r"C:\Users\dzikri\.ssh\id_ed25519"

templates_updates = [
    (
        1,
        "Application Received (Konfirmasi Lamaran)",
        "Terima Kasih atas Lamaran Anda di 1sLabs - {{position_name}}",
        "<p>Halo <strong>{{candidate_name}}</strong>,</p><p>Terima kasih atas ketertarikan Anda untuk bergabung dengan tim <strong>1sLabs</strong> sebagai <strong>{{position_name}}</strong>.</p><p>Kami telah menerima berkas lamaran Anda dengan baik. Tim HR kami saat ini sedang meninjau kualifikasi dan pengalaman Anda sesuai kebutuhan posisi terkait.</p><p>Apabila profil Anda sesuai dengan kriteria yang dicari, tim kami akan menghubungi Anda kembali untuk tahapan proses seleksi selanjutnya dalam waktu 3-5 hari kerja.</p><p>Salam hangat,<br><strong>Tim Rekrutmen 1sLabs</strong></p>",
        "Halo {{candidate_name}}, terima kasih telah melamar posisi {{position_name}} di 1sLabs. Lamaran Anda telah kami terima dan sedang dalam tahap review."
    ),
    (
        2,
        "Initial Screening Invitation (Undangan Screening Awal)",
        "Undangan Diskusi Awal Seleksi 1sLabs - {{position_name}}",
        "<p>Halo <strong>{{candidate_name}}</strong>,</p><p>Terima kasih telah melamar untuk posisi <strong>{{position_name}}</strong> di <strong>1sLabs</strong>. Berdasarkan review awal terhadap profil dan portofolio Anda, kami sangat tertarik untuk mengenal Anda lebih lanjut.</p><p>Kami ingin mengundang Anda dalam sesi screening awal singkat selama 20-30 menit secara daring untuk mendiskusikan latar belakang pengalaman Anda serta gambaran peran ini di 1sLabs.</p><p>Silakan klik tautan di bawah ini untuk memilih jadwal yang paling sesuai dengan ketersediaan Anda:</p><p style=\"text-align: center; margin: 30px 0;\"><a href=\"{{scheduling_link}}\" style=\"background: #18181b; color: #ffffff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; display: inline-block;\">Pilih Jadwal Sesi &rarr;</a></p><p>Jika ada pertanyaan atau kendala, silakan langsung membalas email ini.</p><p>Salam hangat,<br><strong>Tim Rekrutmen 1sLabs</strong></p>",
        "Halo {{candidate_name}}, kami mengundang Anda untuk sesi screening awal posisi {{position_name}}. Silakan pilih jadwal Anda di {{scheduling_link}}."
    ),
    (
        3,
        "Interview Invitation (Undangan Interview Kerja)",
        "Undangan Interview Kerja di 1sLabs - {{position_name}}",
        "<p>Halo <strong>{{candidate_name}}</strong>,</p><p>Kabar baik! Anda berhasil lolos ke tahap interview untuk posisi <strong>{{position_name}}</strong> di <strong>1sLabs</strong>.</p><p>Kami ingin mengundang Anda ke sesi wawancara mendalam bersama tim kami untuk mengeksplorasi kompetensi, studi kasus proyek, serta keselarasan budaya kerja.</p><p>Untuk memudahkan Anda menyesuaikan jadwal, silakan pilih slot waktu wawancara yang tersedia melalui tautan berikut:</p><p style=\"text-align: center; margin: 30px 0;\"><a href=\"{{scheduling_link}}\" style=\"background: #18181b; color: #ffffff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; display: inline-block;\">Pilih Jadwal Interview &rarr;</a></p><p>Tautan Google Meet resmi akan dikirimkan otomatis setelah Anda mengonfirmasi waktu wawancara.</p><p>Salam hangat,<br><strong>Tim Rekrutmen 1sLabs</strong></p>",
        "Halo {{candidate_name}}, selamat! Anda lolos ke tahap interview posisi {{position_name}} di 1sLabs. Silakan pilih jadwal di {{scheduling_link}}."
    ),
    (
        4,
        "Interview Confirmation (Konfirmasi Jadwal & Link Meeting)",
        "Konfirmasi Jadwal Interview: {{position_name}} - 1sLabs",
        "<p>Halo <strong>{{candidate_name}}</strong>,</p><p>Jadwal interview Anda untuk posisi <strong>{{position_name}}</strong> di <strong>1sLabs</strong> telah resmi dikonfirmasi dengan rincian berikut:</p><div style=\"background-color: #fafafa; border: 1px solid #e4e4e7; border-radius: 8px; padding: 16px 20px; margin: 20px 0;\"><p style=\"margin: 6px 0;\"><strong>Tanggal:</strong> {{interview_date}}</p><p style=\"margin: 6px 0;\"><strong>Waktu:</strong> {{interview_time}} ({{timezone}})</p><p style=\"margin: 6px 0;\"><strong>Platform:</strong> {{meeting_platform}}</p><p style=\"margin: 6px 0;\"><strong>Tautan Pertemuan:</strong> <a href=\"{{meeting_link}}\" target=\"_blank\" style=\"color: #2563eb; text-decoration: underline;\">{{meeting_link}}</a></p></div><p style=\"text-align: center; margin: 28px 0;\"><a href=\"{{meeting_link}}\" style=\"background: #18181b; color: #ffffff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; display: inline-block;\">Buka Link Google Meet &rarr;</a></p><p><strong>Petunjuk Tambahan:</strong></p><ul><li>Mohon hadir 5 menit sebelum sesi dimulai.</li><li>Pastikan kamera, mikrofon, dan koneksi internet stabil.</li><li>Siapkan portfolio atau proyek terkait jika diperlukan.</li></ul><p>Salam hangat,<br><strong>Tim Rekrutmen 1sLabs</strong></p>",
        "Halo {{candidate_name}}, jadwal interview Anda untuk {{position_name}} dikonfirmasi pada {{interview_date}} jam {{interview_time}}. Link meet: {{meeting_link}}."
    ),
    (
        5,
        "Interview Rescheduled (Perubahan Jadwal Interview)",
        "Pembaruan Jadwal Interview: {{position_name}} - 1sLabs",
        "<p>Halo <strong>{{candidate_name}}</strong>,</p><p>Terdapat pembaruan pada jadwal interview Anda untuk posisi <strong>{{position_name}}</strong> di <strong>1sLabs</strong>. Berikut jadwal terbaru yang telah disesuaikan:</p><div style=\"background-color: #fafafa; border: 1px solid #e4e4e7; border-radius: 8px; padding: 16px 20px; margin: 20px 0;\"><p style=\"margin: 6px 0;\"><strong>Tanggal Baru:</strong> {{interview_date}}</p><p style=\"margin: 6px 0;\"><strong>Waktu:</strong> {{interview_time}} ({{timezone}})</p><p style=\"margin: 6px 0;\"><strong>Platform:</strong> {{meeting_platform}}</p><p style=\"margin: 6px 0;\"><strong>Tautan Pertemuan:</strong> <a href=\"{{meeting_link}}\" target=\"_blank\" style=\"color: #2563eb; text-decoration: underline;\">{{meeting_link}}</a></p></div><p style=\"text-align: center; margin: 28px 0;\"><a href=\"{{meeting_link}}\" style=\"background: #18181b; color: #ffffff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; display: inline-block;\">Buka Link Google Meet &rarr;</a></p><p>Jika jadwal baru ini berhalangan dengan agenda Anda, silakan membalas email ini untuk konfirmasi ulang.</p><p>Salam hangat,<br><strong>Tim Rekrutmen 1sLabs</strong></p>",
        "Pemberitahuan perubahan jadwal interview posisi {{position_name}} di 1sLabs. Jadwal baru: {{interview_date}} {{interview_time}}. Link: {{meeting_link}}."
    ),
    (
        6,
        "Candidate Follow-up (Follow-up Lamaran / Tahapan)",
        "Follow-up Proses Seleksi: {{position_name}} - 1sLabs",
        "<p>Halo <strong>{{candidate_name}}</strong>,</p><p>Kami ingin menindaklanjuti proses rekrutmen Anda untuk posisi <strong>{{position_name}}</strong> di <strong>1sLabs</strong>.</p><p>Apabila Anda memerlukan informasi tambahan mengenai tahapan proses seleksi atau kelanjutan jadwal, silakan membalas email ini secara langsung.</p><p>Kami sangat mengapresiasi antusiasme dan komitmen Anda terhadap 1sLabs.</p><p>Salam hangat,<br><strong>Tim Rekrutmen 1sLabs</strong></p>",
        "Halo {{candidate_name}}, follow-up kelanjutan proses rekrutmen posisi {{position_name}} di 1sLabs."
    ),
    (
        7,
        "Acceptance / Job Offer (Penawaran Bergabung)",
        "Selamat! Penawaran Bergabung di 1sLabs - {{position_name}}",
        "<p>Halo <strong>{{candidate_name}}</strong>,</p><p>Selamat! Setelah melalui serangkaian proses seleksi yang komprehensif, kami dengan senang hati menawarkan Anda posisi <strong>{{position_name}}</strong> di <strong>1sLabs</strong>.</p><p>Tim kami sangat terkesan dengan kapabilitas, pengalaman, serta antusiasme yang Anda tunjukkan selama proses evaluasi. Kami percaya kehadiran Anda akan membawa dampak positif yang signifikan bagi kemajuan 1sLabs.</p><p>Rincian resmi penawaran kerja (Offering Letter) beserta rincian kompensasi dan tanggal mulai bergabung terlampir pada dokumen pendukung.</p><p>Mohon konfirmasi kesediaan Anda dengan membalas email ini paling lambat dalam 3 hari kerja.</p><p>Salam hangat,<br><strong>Tim Rekrutmen 1sLabs</strong></p>",
        "Halo {{candidate_name}}, selamat! Kami dengan senang hati menawarkan Anda posisi {{position_name}} di 1sLabs."
    ),
    (
        8,
        "Rejection Notification (Pemberitahuan Hasil Seleksi)",
        "Pembaruan Status Lamaran di 1sLabs - {{position_name}}",
        "<p>Halo <strong>{{candidate_name}}</strong>,</p><p>Terima kasih banyak atas waktu dan minat yang Anda dedikasikan untuk melamar posisi <strong>{{position_name}}</strong> di <strong>1sLabs</strong>, serta atas diskusi berharga selama proses seleksi berlangsung.</p><p>Setelah mempertimbangkan seluruh kandidat dengan seksama, kami memutuskan untuk melanjutkan proses dengan kandidat lain yang kualifikasinya saat ini lebih mendekati kebutuhan spesifik peran ini.</p><p>Keputusan ini tidak mencerminkan kekurangan pada kualitas kemampuan Anda. Kami akan menyimpan data profil Anda di dalam talent pool kami untuk peluang kolaborasi di masa mendatang yang sesuai.</p><p>Kami mendoakan kesuksesan terbaik dalam perjalanan karir profesional Anda.</p><p>Salam hormat,<br><strong>Tim Rekrutmen 1sLabs</strong></p>",
        "Halo {{candidate_name}}, terima kasih atas minat Anda melamar posisi {{position_name}} di 1sLabs. Saat ini kami belum dapat melanjutkan ke tahap berikutnya. Sukses untuk karir Anda."
    )
]

print(f"Connecting to {USERNAME}@{HOSTNAME}...")
pkey = paramiko.Ed25519Key.from_private_key_file(KEY_PATH)
ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect(hostname=HOSTNAME, port=22, username=USERNAME, pkey=pkey, timeout=15)

node_script = """
const { query } = require('../src/db');

const updates = """ + json.dumps(templates_updates) + """;

async function run() {
  for (const [id, name, subject, body_html, body_text] of updates) {
    await query(
      'UPDATE hr_email_templates SET name = ?, subject = ?, body_html = ?, body_text = ?, updated_at = NOW() WHERE id = ?',
      [name, subject, body_html, body_text, id]
    );
    console.log(`Updated template ID ${id}: ${name}`);
  }
  console.log('ALL TEMPLATES CLEANED SUCCESSFULLY!');
  process.exit(0);
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
"""

sftp = ssh.open_sftp()
with sftp.file("/home/u1zh8984/oneslabs-backend/tmp/clean_templates.js", "w") as f:
    f.write(node_script)
sftp.close()

stdin, stdout, stderr = ssh.exec_command("node /home/u1zh8984/oneslabs-backend/tmp/clean_templates.js")
print(stdout.read().decode('utf-8'))
err = stderr.read().decode('utf-8')
if err:
    print("Error:", err)

# Cleanup
ssh.exec_command("rm -f /home/u1zh8984/oneslabs-backend/tmp/clean_templates.js")
ssh.close()
