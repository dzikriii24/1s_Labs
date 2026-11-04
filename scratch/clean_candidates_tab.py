with open('src/components/admin/views/hr/HRCandidatesTab.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

bad_insertion = """                </div>
                <div className="pt-2 mt-2 border-t border-zinc-200/60 text-[11px] text-zinc-500">
                  <span className="font-semibold text-zinc-700">Tombol Aksi (CTA Button):</span> Tulis tautan di baris tersendiri seperti <code className="bg-white px-1.5 py-0.5 rounded border border-zinc-200 font-mono text-[10px] text-zinc-800">[Pilih Jadwal Interview -&gt;]({'{{scheduling_link}}'})</code> untuk otomatis menghasilkan tombol aksi hitam resmi 1sLabs.
                </div>"""

count = content.count(bad_insertion)
print(f"Found {count} bad insertions.")
content = content.replace(bad_insertion, "                </div>")

content = content.replace("""                <div>
                  <span className="font-bold text-zinc-900 block mb-1">Variabel Dinamis Tersedia:</span>
                </div>""", '                <span className="font-bold text-zinc-900 block mb-1">Variabel Dinamis Tersedia:</span>')

with open('src/components/admin/views/hr/HRCandidatesTab.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print('Cleaned HRCandidatesTab.tsx successfully')
