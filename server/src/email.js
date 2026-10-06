import nodemailer from 'nodemailer';

const ADMIN_EMAIL = 'denisesmiththaw@gmail.com';
const DASHBOARD_URL = 'https://lead-tracker-phi-seven.vercel.app/';

export async function sendIntakeNotification(job) {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || 587);
  const user = process.env.SMTP_USER;
  const password = process.env.SMTP_PASS;
  const from = process.env.SMTP_FROM_EMAIL || user;

  if (!host || !Number.isInteger(port) || !user || !password || !from) {
    return false;
  }

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: process.env.SMTP_SECURE ? process.env.SMTP_SECURE === 'true' : port === 465,
    auth: { user, pass: password },
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 15000
  });

  await transporter.sendMail({
    from,
    to: ADMIN_EMAIL,
    subject: `New service request${job.urgent ? ' — URGENT' : ''}`,
    text: [
      'THAW REFRIGERATION SERVICE',
      'New service request',
      '',
      `Customer: ${job.customer_name}`,
      `Phone: ${job.phone}`,
      `Urgency: ${job.urgent ? 'Urgent' : 'Standard'}`,
      '',
      'REPAIR DETAILS',
      job.issue,
      '',
      'ADDITIONAL NOTES',
      job.notes || 'No additional notes provided.',
      '',
      `Job ID: ${job.id}`,
      `Open dashboard: ${DASHBOARD_URL}`
    ].join('\n'),
    html: buildIntakeEmail(job)
  });

  return true;
}

function buildIntakeEmail(job) {
  const name = escapeHtml(job.customer_name);
  const phone = escapeHtml(job.phone);
  const issue = escapeHtml(job.issue);
  const notes = escapeHtml(job.notes || 'No additional notes provided.');
  const jobId = escapeHtml(job.id);
  const tel = String(job.phone).replace(/[^\d+]/g, '');
  const urgentBadge = job.urgent
    ? '<span style="display:inline-block;padding:6px 10px;border-radius:999px;background:#fce9e7;color:#a72720;font-size:12px;font-weight:700;letter-spacing:.04em;">URGENT</span>'
    : '<span style="display:inline-block;padding:6px 10px;border-radius:999px;background:#e4f3ea;color:#276c49;font-size:12px;font-weight:700;letter-spacing:.04em;">STANDARD</span>';

  return `<!doctype html>
<html lang="en">
  <head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>New service request</title></head>
  <body style="margin:0;padding:0;background:#f2f6f8;font-family:Arial,Helvetica,sans-serif;color:#0b1e26;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f2f6f8;padding:28px 12px;">
      <tr><td align="center">
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="width:100%;max-width:600px;border-collapse:separate;border-spacing:0;">
          <tr><td style="padding:22px 26px;background:#0b7a86;border-radius:14px 14px 0 0;color:#ffffff;">
            <div style="font-size:13px;font-weight:700;letter-spacing:2px;">THAW</div>
            <div style="margin-top:5px;font-size:14px;color:#d5f9ff;">Thaw Refrigeration Service</div>
          </td></tr>
          <tr><td style="padding:28px 26px 24px;background:#ffffff;border:1px solid #d6e1e7;border-top:0;">
            <div style="font-size:12px;font-weight:700;letter-spacing:1.2px;text-transform:uppercase;color:#4d616c;">Website intake</div>
            <h1 style="margin:8px 0 18px;font-size:25px;line-height:1.25;color:#0b1e26;">New service request</h1>
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;">
              <tr><td style="padding:10px 0;border-bottom:1px solid #e6edf0;color:#4d616c;font-size:13px;width:105px;">Customer</td><td style="padding:10px 0;border-bottom:1px solid #e6edf0;font-size:15px;font-weight:700;">${name}</td></tr>
              <tr><td style="padding:10px 0;border-bottom:1px solid #e6edf0;color:#4d616c;font-size:13px;">Phone</td><td style="padding:10px 0;border-bottom:1px solid #e6edf0;font-size:15px;"><a href="tel:${escapeHtml(tel)}" style="color:#006973;text-decoration:underline;">${phone}</a></td></tr>
              <tr><td style="padding:12px 0;color:#4d616c;font-size:13px;">Priority</td><td style="padding:12px 0;">${urgentBadge}</td></tr>
            </table>
            <div style="margin-top:17px;padding:17px;border:1px solid #d6e1e7;border-radius:10px;background:#f7fafb;">
              <div style="font-size:12px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:#4d616c;">Repair details</div>
              <div style="margin-top:9px;font-size:15px;line-height:1.6;white-space:pre-line;">${issue}</div>
            </div>
            <div style="margin-top:15px;padding:17px;border-radius:10px;background:#f2f6f8;">
              <div style="font-size:12px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:#4d616c;">Additional notes</div>
              <div style="margin-top:9px;font-size:14px;line-height:1.6;white-space:pre-line;">${notes}</div>
            </div>
            <div style="margin-top:23px;">
              <a href="${DASHBOARD_URL}" style="display:inline-block;padding:12px 18px;border-radius:8px;background:#0b7a86;color:#ffffff;font-size:14px;font-weight:700;text-decoration:none;">Open dashboard</a>
            </div>
            <div style="margin-top:18px;color:#73848c;font-size:11px;">Job ID: ${jobId}</div>
          </td></tr>
          <tr><td style="padding:16px 10px;text-align:center;color:#73848c;font-size:12px;">Thaw Refrigeration Service · New website request</td></tr>
        </table>
      </td></tr>
    </table>
  </body>
</html>`;
}

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  })[character]);
}
