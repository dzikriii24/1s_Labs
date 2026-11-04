import re

with open('src/components/admin/views/hr/HREmailCampaignsTab.tsx', 'r', encoding='utf-8') as f:
    code = f.read()

# 1. Update imports
import_target = "import notify from '../../../../lib/notify';"
import_replacement = """import notify from '../../../../lib/notify';
import {
  formatTextToEmailHtml,
  htmlToFormattedText,
  cleanMojibake
} from '../../../../utils/emailFormatter';"""

if import_target in code and 'from \'../../../../utils/emailFormatter\'' not in code:
    code = code.replace(import_target, import_replacement, 1)

# 2. Remove local cleanMojibake function
code = re.sub(r'function cleanMojibake\(text: string\): string \{[\s\S]*?\}\n\n', '', code)

# 3. Update fetchTemplates pre-populate
code = code.replace(
    'return first.body_html;',
    'return htmlToFormattedText(first.body_html);'
)

# 4. Update applyTemplate
code = code.replace(
    'setComposeBody(cleanMojibake(t.body_html));',
    'setComposeBody(htmlToFormattedText(t.body_html));'
)

# 5. Update handleTemplateSelectChange
code = code.replace(
    'setComposeBody(cleanMojibake(tmpl.body_html));',
    'setComposeBody(htmlToFormattedText(tmpl.body_html));'
)

# 6. Update renderPreviewContent
old_render_preview = """    const processed = replacePreviewText(content, recipientName, positionName);
    const isHtml = /<[a-z][\s\S]*>/i.test(processed);

    if (isHtml) {
      return (
        <div
          className="email-rendered-body"
          dangerouslySetInnerHTML={{ __html: processed }}
        />
      );
    }

    return (
      <div className="email-rendered-body whitespace-pre-wrap">
        {processed}
      </div>
    );"""

new_render_preview = """    const processed = replacePreviewText(content, recipientName, positionName);
    const html = formatTextToEmailHtml(processed);

    return (
      <div
        className="email-rendered-body"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    );"""

code = code.replace(old_render_preview, new_render_preview)

# 7. Update composeBody textarea label & placeholder & font
old_compose_textarea = """                <textarea
                  rows={11}
                  required
                  value={composeBody}
                  onChange={e => setComposeBody(e.target.value)}
                  placeholder="Tulis isi email disini atau gunakan template siap pakai..."
                  className="w-full text-xs p-3 rounded-xl border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-zinc-900 bg-white font-mono"
                />"""

new_compose_textarea = """                <textarea
                  rows={11}
                  required
                  value={composeBody}
                  onChange={e => setComposeBody(e.target.value)}
                  placeholder="Tulis pesan email disini (gunakan Enter untuk paragraf, **teks tebal**, dan - untuk poin bullet)..."
                  className="w-full text-xs p-3.5 rounded-xl border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-zinc-900 bg-white font-sans leading-relaxed"
                />"""

code = code.replace(old_compose_textarea, new_compose_textarea)

# 8. Update handleOpenEditTemplate
old_edit_tmpl = """    setTemplateForm({
      template_key: tmpl.template_key,
      name: tmpl.name,
      subject: tmpl.subject,
      body_html: tmpl.body_html
    });"""

new_edit_tmpl = """    setTemplateForm({
      template_key: tmpl.template_key,
      name: tmpl.name,
      subject: tmpl.subject,
      body_html: htmlToFormattedText(tmpl.body_html)
    });"""

code = code.replace(old_edit_tmpl, new_edit_tmpl)

# 9. Update handleSubmitTemplate
old_submit_tmpl = """      if (editingTemplate) {
        await api.hr.updateEmailTemplate(editingTemplate.id, {
          name: templateForm.name,
          subject: templateForm.subject,
          body_html: templateForm.body_html
        });
        notify.success('Template berhasil diperbarui.');
      } else {
        await api.hr.createEmailTemplate(templateForm);
        notify.success('Template baru berhasil ditambahkan.');
      }"""

new_submit_tmpl = """      const formattedHtml = formatTextToEmailHtml(templateForm.body_html);
      if (editingTemplate) {
        await api.hr.updateEmailTemplate(editingTemplate.id, {
          name: templateForm.name,
          subject: templateForm.subject,
          body_html: formattedHtml,
          body_text: templateForm.body_html
        });
        notify.success('Template berhasil diperbarui.');
      } else {
        await api.hr.createEmailTemplate({
          template_key: templateForm.template_key,
          name: templateForm.name,
          subject: templateForm.subject,
          body_html: formattedHtml,
          body_text: templateForm.body_html
        });
        notify.success('Template baru berhasil ditambahkan.');
      }"""

code = code.replace(old_submit_tmpl, new_submit_tmpl)

# 10. Update template modal label and textarea
old_tmpl_modal = """                  <label className="block text-xs font-semibold text-zinc-700">
                    Isi Format HTML <span className="text-rose-500">*</span>
                  </label>"""

new_tmpl_modal = """                  <label className="block text-xs font-semibold text-zinc-700">
                    Isi Pesan Template <span className="text-zinc-400 font-normal">(Teks biasa, mendukung Enter untuk paragraf, **teks tebal**, dan - untuk poin)</span> <span className="text-rose-500">*</span>
                  </label>"""

code = code.replace(old_tmpl_modal, new_tmpl_modal)

old_tmpl_textarea = """                <textarea
                  rows={6}
                  required
                  value={templateForm.body_html}
                  onChange={e => setTemplateForm({ ...templateForm, body_html: e.target.value })}
                  placeholder="<p>Halo <strong>{{candidate_name}}</strong>, ...</p>"
                  className="w-full text-xs p-3 rounded-xl border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-zinc-900 bg-white font-mono"
                />"""

new_tmpl_textarea = """                <textarea
                  rows={7}
                  required
                  value={templateForm.body_html}
                  onChange={e => setTemplateForm({ ...templateForm, body_html: e.target.value })}
                  placeholder="Halo **{{candidate_name}}**,&#10;&#10;Terima kasih atas minat Anda bergabung dengan tim 1sLabs sebagai **{{position_name}}**...&#10;&#10;Salam hangat,&#10;**Tim Rekrutmen 1sLabs**"
                  className="w-full text-xs p-3.5 rounded-xl border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-zinc-900 bg-white font-sans leading-relaxed"
                />"""

code = code.replace(old_tmpl_textarea, new_tmpl_textarea)

with open('src/components/admin/views/hr/HREmailCampaignsTab.tsx', 'w', encoding='utf-8') as f:
    f.write(code)

print("HREmailCampaignsTab updated successfully!")

