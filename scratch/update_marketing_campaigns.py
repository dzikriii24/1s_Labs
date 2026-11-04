with open('src/components/admin/views/marketing/EmailCampaignsTab.tsx', 'r', encoding='utf-8') as f:
    code = f.read()

# 1. Add imports from utils/emailFormatter
old_import = """import {
  api,
  MarketingCampaign,"""

new_import = """import {
  formatTextToEmailHtml,
  htmlToFormattedText,
  cleanMojibake
} from '../../../../utils/emailFormatter';
import {
  api,
  MarketingCampaign,"""

if old_import in code and 'from \'../../../../utils/emailFormatter\'' not in code:
    code = code.replace(old_import, new_import, 1)

# 2. Update handleTemplateSelect
old_select = """  const handleTemplateSelect = (keyOrId: string) => {
    setSelectedTemplateKey(keyOrId);
    const official = OFFICIAL_1SLABS_TEMPLATES.find(t => t.id === keyOrId);
    if (official) {
      setCampaignSubject(official.subject);
      setCampaignBody(official.body_html);
      return;
    }
    const dbTpl = templates.find(t => String(t.id) === keyOrId);
    if (dbTpl) {
      setCampaignSubject(dbTpl.subject);
      setCampaignBody(dbTpl.body_html);
    }
  };"""

new_select = """  const handleTemplateSelect = (keyOrId: string) => {
    setSelectedTemplateKey(keyOrId);
    const official = OFFICIAL_1SLABS_TEMPLATES.find(t => t.id === keyOrId);
    if (official) {
      setCampaignSubject(cleanMojibake(official.subject));
      setCampaignBody(htmlToFormattedText(official.body_html));
      return;
    }
    const dbTpl = templates.find(t => String(t.id) === keyOrId);
    if (dbTpl) {
      setCampaignSubject(cleanMojibake(dbTpl.subject));
      setCampaignBody(htmlToFormattedText(dbTpl.body_html));
    }
  };"""

code = code.replace(old_select, new_select)

# 3. Update handleOpenCreate
old_create = """    const firstTpl = OFFICIAL_1SLABS_TEMPLATES[0];
    setSelectedTemplateKey(firstTpl.id);
    setCampaignSubject(firstTpl.subject);
    setCampaignBody(firstTpl.body_html);"""

new_create = """    const firstTpl = OFFICIAL_1SLABS_TEMPLATES[0];
    setSelectedTemplateKey(firstTpl.id);
    setCampaignSubject(cleanMojibake(firstTpl.subject));
    setCampaignBody(htmlToFormattedText(firstTpl.body_html));"""

code = code.replace(old_create, new_create)

# 4. Update handleOpenEdit
old_edit = """      setCampaignName(camp.name);
      setCampaignSubject(camp.subject);
      setCampaignBody(camp.body_html);"""

new_edit = """      setCampaignName(camp.name);
      setCampaignSubject(camp.subject);
      setCampaignBody(htmlToFormattedText(camp.body_html));"""

code = code.replace(old_edit, new_edit)

# 5. Update handleOpenFollowUp
old_followup = """      setSelectedTemplateKey(followUpTpl.id);
      setCampaignSubject(followUpTpl.subject);
      setCampaignBody(followUpTpl.body_html);"""

new_followup = """      setSelectedTemplateKey(followUpTpl.id);
      setCampaignSubject(cleanMojibake(followUpTpl.subject));
      setCampaignBody(htmlToFormattedText(followUpTpl.body_html));"""

code = code.replace(old_followup, new_followup)

# 6. Update handleSaveCampaign body_html conversion
old_save_update = """        res = await api.marketing.updateCampaign(editingCampaign.id, {
          name: campaignName,
          subject: campaignSubject,
          body_html: campaignBody,"""

new_save_update = """        res = await api.marketing.updateCampaign(editingCampaign.id, {
          name: campaignName,
          subject: campaignSubject,
          body_html: formatTextToEmailHtml(campaignBody),"""

code = code.replace(old_save_update, new_save_update)

old_save_create = """        res = await api.marketing.createCampaign({
          name: campaignName,
          subject: campaignSubject,
          body_html: campaignBody,"""

new_save_create = """        res = await api.marketing.createCampaign({
          name: campaignName,
          subject: campaignSubject,
          body_html: formatTextToEmailHtml(campaignBody),"""

code = code.replace(old_save_create, new_save_create)

# 7. Update renderedPreviewHtml to wrap substituted with formatTextToEmailHtml
old_preview_calc = """    const substituted = campaignBody
      .replace(/{{business_name}}/gi, sampleCompName)
      .replace(/{{company_name}}/gi, sampleCompName)
      .replace(/{{contact_name}}/gi, sampleContact)
      .replace(/{{city}}/gi, sampleCity)
      .replace(/{{country}}/gi, sampleCountry)
      .replace(/{{province}}/gi, isEnglish ? 'Wilayah Persekutuan' : 'Jawa Barat')
      .replace(/{{unsubscribe_url}}/gi, '#unsubscribe');

    return substituted;"""

new_preview_calc = """    const substituted = campaignBody
      .replace(/{{business_name}}/gi, sampleCompName)
      .replace(/{{company_name}}/gi, sampleCompName)
      .replace(/{{contact_name}}/gi, sampleContact)
      .replace(/{{city}}/gi, sampleCity)
      .replace(/{{country}}/gi, sampleCountry)
      .replace(/{{province}}/gi, isEnglish ? 'Wilayah Persekutuan' : 'Jawa Barat')
      .replace(/{{unsubscribe_url}}/gi, '#unsubscribe');

    return formatTextToEmailHtml(substituted);"""

code = code.replace(old_preview_calc, new_preview_calc)

# 8. Update textarea label & class
old_textarea = """                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-semibold text-zinc-800">
                        Isi Pesan Email (HTML Template)
                      </label>
                      <span className="text-[11px] text-zinc-400">
                        Perubahan langsung ter-render pada panel preview di sebelah kanan
                      </span>
                    </div>
                    <textarea
                      rows={12}
                      value={campaignBody}
                      onChange={e => setCampaignBody(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs text-zinc-900 font-mono leading-relaxed focus:outline-none focus:ring-1 focus:ring-zinc-400"
                      placeholder="Tuliskan kode HTML email..."
                    />"""

new_textarea = """                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-semibold text-zinc-800">
                        Isi Pesan Email <span className="text-zinc-400 font-normal">(Mendukung teks biasa, Enter untuk paragraf, **teks tebal**, dan - untuk poin)</span>
                      </label>
                      <span className="text-[11px] text-zinc-400">
                        Perubahan langsung ter-render pada panel preview di sebelah kanan
                      </span>
                    </div>
                    <textarea
                      rows={12}
                      value={campaignBody}
                      onChange={e => setCampaignBody(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs text-zinc-900 font-sans leading-relaxed focus:outline-none focus:ring-1 focus:ring-zinc-400"
                      placeholder="Tulis pesan email disini (gunakan Enter untuk paragraf baru, **teks tebal**, dan - untuk poin bullet)..."
                    />"""

code = code.replace(old_textarea, new_textarea)

with open('src/components/admin/views/marketing/EmailCampaignsTab.tsx', 'w', encoding='utf-8') as f:
    f.write(code)

print("EmailCampaignsTab updated successfully!")

