import { EmailMessage } from 'cloudflare:email';

/**
 * POST /api/contact — the site's contact form (multipart/form-data).
 * Sends one email to the shop's inbox through the Cloudflare Email Routing `send_email`
 * binding (CONTACT_EMAIL), with Reply-To set to the customer and their files attached.
 */

const TYPES = {
  question: 'Domanda',
  custom: 'Stampa su misura',
  order: 'Ordine',
  other: 'Altro',
};

const MAX_FILES = 3;
const MAX_TOTAL_BYTES = 8 * 1024 * 1024;
const ALLOWED_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp', 'heic', 'gif', 'pdf', 'stl', '3mf', 'obj', 'step', 'stp'];
const EMAIL_RE = /^[^\s@<>()[\]\\,;:"]+@[^\s@<>()[\]\\,;:"]+\.[^\s@<>()[\]\\,;:"]{2,}$/;

const clean = (value, max) =>
  String(value ?? '')
    .replace(/\r\n?/g, '\n')
    .trim()
    .slice(0, max);

// Header values must never carry line breaks (header injection)
const oneLine = (value, max) => clean(value, max).replace(/[\r\n]+/g, ' ');

export async function handleContact(request, env) {
  if (!env.CONTACT_EMAIL) return { status: 503, body: { error: 'email_not_configured' } };

  let form;
  try {
    form = await request.formData();
  } catch {
    return { status: 400, body: { error: 'invalid_form' } };
  }

  // Bots fill every field; people never see this one
  if (clean(form.get('website'), 200)) return { status: 200, body: { ok: true } };

  const data = {
    name: oneLine(form.get('name'), 100),
    email: oneLine(form.get('email'), 254),
    phone: oneLine(form.get('phone'), 40),
    type: oneLine(form.get('type'), 20),
    size: oneLine(form.get('size'), 120),
    color: oneLine(form.get('color'), 80),
    quantity: oneLine(form.get('quantity'), 20),
    deadline: oneLine(form.get('deadline'), 40),
    message: clean(form.get('message'), 5000),
    locale: oneLine(form.get('locale'), 5),
  };

  if (!data.name || !data.message || !EMAIL_RE.test(data.email) || !(data.type in TYPES)) {
    return { status: 400, body: { error: 'invalid_fields' } };
  }

  const files = form.getAll('files').filter((f) => typeof f === 'object' && f && f.size > 0);
  if (files.length > MAX_FILES) return { status: 400, body: { error: 'too_many_files' } };
  let total = 0;
  for (const file of files) {
    total += file.size;
    const ext = (file.name.split('.').pop() || '').toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(ext)) return { status: 400, body: { error: 'file_type' } };
  }
  if (total > MAX_TOTAL_BYTES) return { status: 400, body: { error: 'files_too_large' } };

  const attachments = await Promise.all(
    files.map(async (file) => ({
      name: safeFilename(file.name),
      type: /^[\w.+-]+\/[\w.+-]+$/.test(file.type) ? file.type : 'application/octet-stream',
      data: new Uint8Array(await file.arrayBuffer()),
    })),
  );

  const from = env.CONTACT_FROM || 'sito@brandilab.it';
  const to = env.CONTACT_TO || 'brandilab3d@gmail.com';
  const subject = `[Sito] ${TYPES[data.type]} — ${data.name}`;

  const raw = buildMime({
    from: { name: 'BrandiLab — sito', address: from },
    to,
    replyTo: { name: data.name, address: data.email },
    subject,
    text: textBody(data, attachments),
    html: htmlBody(data, attachments),
    attachments,
  });

  try {
    await env.CONTACT_EMAIL.send(new EmailMessage(from, to, raw));
  } catch (e) {
    console.error('Contact email failed:', e);
    return { status: 502, body: { error: 'send_failed' } };
  }

  return { status: 200, body: { ok: true } };
}

/* ── Email content ─────────────────────────────────────────── */

function rows(data) {
  return [
    ['Tipo di richiesta', TYPES[data.type]],
    ['Nome', data.name],
    ['Email', data.email],
    ['Telefono', data.phone],
    ['Misure indicative', data.size],
    ['Colore', data.color],
    ['Quantità', data.quantity],
    ['Serve entro', data.deadline],
    ['Lingua del sito', data.locale === 'en' ? 'Inglese' : 'Italiano'],
  ].filter(([, value]) => value);
}

function textBody(data, attachments) {
  const lines = rows(data).map(([k, v]) => `${k}: ${v}`);
  lines.push('', 'Messaggio:', data.message);
  if (attachments.length) lines.push('', `Allegati: ${attachments.map((a) => a.name).join(', ')}`);
  lines.push('', 'Rispondi a questa email per scrivere direttamente al cliente.');
  return lines.join('\n');
}

const esc = (s) =>
  String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

function htmlBody(data, attachments) {
  const tableRows = rows(data)
    .map(
      ([k, v]) =>
        `<tr><td style="padding:10px 16px 10px 0;color:#6e6e73;font-size:14px;white-space:nowrap;vertical-align:top;border-bottom:1px solid #d2d2d7">${esc(k)}</td>` +
        `<td style="padding:10px 0;color:#1d1d1f;font-size:15px;border-bottom:1px solid #d2d2d7">${esc(v)}</td></tr>`,
    )
    .join('');
  const files = attachments.length
    ? `<p style="margin:24px 0 0;font-size:14px;color:#6e6e73">Allegati: ${attachments.map((a) => esc(a.name)).join(', ')}</p>`
    : '';
  return `<!doctype html><html><body style="margin:0;background:#f5f5f7;font-family:-apple-system,'Segoe UI',Helvetica,Arial,sans-serif">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f7;padding:32px 12px"><tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#ffffff">
<tr><td style="background:#1d1d1f;padding:20px 28px;color:#f5f5f7;font-size:20px;font-weight:800;letter-spacing:-0.02em">BrandiLab</td></tr>
<tr><td style="padding:28px">
<p style="margin:0 0 6px;display:inline-block;background:#0071e3;color:#ffffff;font-size:13px;font-weight:700;padding:4px 10px">${esc(TYPES[data.type])}</p>
<h1 style="margin:12px 0 20px;font-size:26px;line-height:1.15;color:#1d1d1f;letter-spacing:-0.02em">Nuova richiesta da ${esc(data.name)}</h1>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-top:2px solid #1d1d1f">${tableRows}</table>
<p style="margin:24px 0 8px;font-size:14px;font-weight:700;color:#1d1d1f">Messaggio</p>
<div style="background:#f5f5f7;padding:16px;font-size:15px;line-height:1.55;color:#1d1d1f;white-space:pre-wrap">${esc(data.message)}</div>
${files}
<p style="margin:28px 0 0;font-size:13px;color:#86868b">Rispondi a questa email per scrivere direttamente a ${esc(data.email)}.</p>
</td></tr></table></td></tr></table></body></html>`;
}

/* ── Minimal MIME builder (UTF-8, base64, multipart) ───────── */

function bytesToBase64(bytes) {
  let binary = '';
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode.apply(null, bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}

const utf8Base64 = (str) => bytesToBase64(new TextEncoder().encode(str));
const wrap76 = (b64) => b64.replace(/.{1,76}/g, '$&\r\n').trimEnd();
const isPlainAscii = (str) => /^[\x20-\x7e]*$/.test(str);
const encodeWord = (str) => (isPlainAscii(str) ? str : `=?UTF-8?B?${utf8Base64(str)}?=`);
// Display names are always quoted (or encoded) so ":" "@" "," in a name can't change how the address parses
const mailbox = ({ name, address }) =>
  isPlainAscii(name)
    ? `"${name.replace(/[\\"]/g, '\\$&')}" <${address}>`
    : `${encodeWord(name)} <${address}>`;

function safeFilename(name) {
  const cleaned = String(name || 'file')
    .replace(/[\r\n"\\/]/g, '_')
    .slice(-120);
  return cleaned || 'file';
}

function buildMime({ from, to, replyTo, subject, text, html, attachments }) {
  const mixed = `mix_${crypto.randomUUID()}`;
  const alt = `alt_${crypto.randomUUID()}`;
  const domain = from.address.split('@')[1];
  const lines = [
    `From: ${mailbox(from)}`,
    `To: ${to}`,
    `Reply-To: ${mailbox(replyTo)}`,
    `Subject: ${encodeWord(subject)}`,
    `Date: ${new Date().toUTCString()}`,
    `Message-ID: <${crypto.randomUUID()}@${domain}>`,
    'MIME-Version: 1.0',
    `Content-Type: multipart/mixed; boundary="${mixed}"`,
    '',
    `--${mixed}`,
    `Content-Type: multipart/alternative; boundary="${alt}"`,
    '',
    `--${alt}`,
    'Content-Type: text/plain; charset=UTF-8',
    'Content-Transfer-Encoding: base64',
    '',
    wrap76(utf8Base64(text)),
    `--${alt}`,
    'Content-Type: text/html; charset=UTF-8',
    'Content-Transfer-Encoding: base64',
    '',
    wrap76(utf8Base64(html)),
    `--${alt}--`,
  ];
  for (const file of attachments) {
    const encodedName = encodeWord(file.name);
    lines.push(
      `--${mixed}`,
      `Content-Type: ${file.type}; name="${encodedName}"`,
      `Content-Disposition: attachment; filename="${encodedName}"`,
      'Content-Transfer-Encoding: base64',
      '',
      wrap76(bytesToBase64(file.data)),
    );
  }
  lines.push(`--${mixed}--`, '');
  return lines.join('\r\n');
}
