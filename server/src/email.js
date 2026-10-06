const RESEND_ENDPOINT = 'https://api.resend.com/emails';

export async function sendIntakeNotification(job) {
  const apiKey = process.env.RESEND_API_KEY;
  const adminEmail = process.env.ADMIN_EMAIL;
  const fromEmail = process.env.RESEND_FROM_EMAIL;

  if (!apiKey || !adminEmail || !fromEmail) {
    return false;
  }

  const details = [
    `Customer: ${job.customer_name}`,
    `Phone: ${job.phone}`,
    `Issue: ${job.issue}`,
    `Urgent: ${job.urgent ? 'Yes' : 'No'}`,
    `Notes: ${job.notes || 'None'}`,
    `Job ID: ${job.id}`
  ].join('\n');

  const response = await fetch(RESEND_ENDPOINT, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      from: fromEmail,
      to: [adminEmail],
      subject: `New service request: ${job.customer_name}`,
      text: details
    })
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Email provider returned ${response.status}: ${errorBody.slice(0, 300)}`);
  }

  return true;
}
