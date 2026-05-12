/**
 * CONTACT FORM — Cloudflare Pages Function
 * Uses MailChannels for email delivery (free, no API key required).
 *
 * Notifications are sent to:  booking@derekandapple.com
 * Sender (for SPF / reply-to): noreply@derekandapple.com
 *
 * REMAINING DNS REQUIREMENT BEFORE PRODUCTION:
 *   Add MailChannels to derekandapple.com's SPF record in Cloudflare DNS.
 *   - Find the existing TXT record at @ starting with v=spf1
 *   - It will contain include:_spf.google.com (Google Workspace)
 *   - Add include:relay.mailchannels.net before the ~all
 *   - Final value: v=spf1 include:_spf.google.com include:relay.mailchannels.net ~all
 *   This can only be done after nameservers are pointed to Cloudflare.
 */

export async function onRequestPost(context) {
  try {
    const body = await context.request.json();
    const { name, email, 'session-type': sessionType, message, 'bot-field': honeypot } = body;

    // Honeypot check — silently accept spam without sending
    if (honeypot) {
      return new Response('OK', { status: 200 });
    }

    // Basic validation
    if (!name || !email || !message) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Send email via MailChannels (free, native to Cloudflare Workers)
    const emailRes = await fetch('https://api.mailchannels.net/tx/v1/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        personalizations: [{
          to: [{ email: 'booking@derekandapple.com', name: 'Derek & Apple Photography' }],
        }],
        from: { email: 'noreply@derekandapple.com', name: 'Derek & Apple Website' },
        reply_to: { email: email, name: name },
        subject: `New Inquiry — ${sessionType || 'General'} — ${name}`,
        content: [{
          type: 'text/plain',
          value: `Name: ${name}\nEmail: ${email}\nSession Type: ${sessionType || 'Not specified'}\n\nMessage:\n${message}`,
        }],
      }),
    });

    if (emailRes.status === 202) {
      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    } else {
      throw new Error(`MailChannels error: ${emailRes.status}`);
    }
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
