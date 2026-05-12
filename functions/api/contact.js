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
 *
 * DEBUGGING:
 *   This function logs the full MailChannels response (status, status text, headers, body)
 *   on every invocation. View the logs live at:
 *     Cloudflare Dashboard → Pages project → Functions → Real-time Logs
 *   Or via wrangler:
 *     wrangler pages deployment tail --project-name derek-apple-photography
 */

export async function onRequestPost(context) {
  const ts = new Date().toISOString();
  console.log(`[contact ${ts}] invoked`);

  try {
    const body = await context.request.json();
    const { name, email, 'session-type': sessionType, message, 'bot-field': honeypot } = body;

    console.log(`[contact ${ts}] payload received`, {
      hasName: !!name,
      hasEmail: !!email,
      sessionType: sessionType || '(none)',
      messageLength: (message || '').length,
      honeypotTriggered: !!honeypot,
    });

    // Honeypot check — silently accept spam without sending
    if (honeypot) {
      console.log(`[contact ${ts}] honeypot triggered, dropping silently`);
      return new Response('OK', { status: 200 });
    }

    // Basic validation
    if (!name || !email || !message) {
      console.warn(`[contact ${ts}] validation failed — missing required fields`);
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Build MailChannels payload
    const mcPayload = {
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
    };

    console.log(`[contact ${ts}] calling MailChannels`, {
      to: mcPayload.personalizations[0].to[0].email,
      from: mcPayload.from.email,
      replyTo: mcPayload.reply_to.email,
      subject: mcPayload.subject,
    });

    // Send via MailChannels (free, native to Cloudflare Workers)
    const emailRes = await fetch('https://api.mailchannels.net/tx/v1/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(mcPayload),
    });

    // Always read the body, even on success — needed for debugging
    let mcBody = '';
    try {
      mcBody = await emailRes.text();
    } catch (readErr) {
      mcBody = `(failed to read body: ${readErr.message})`;
    }

    // Collect response headers for the log
    const mcHeaders = {};
    emailRes.headers.forEach((value, key) => { mcHeaders[key] = value; });

    console.log(`[contact ${ts}] MailChannels response`, {
      status: emailRes.status,
      statusText: emailRes.statusText,
      ok: emailRes.ok,
      headers: mcHeaders,
      body: mcBody || '(empty)',
    });

    if (emailRes.status === 202) {
      console.log(`[contact ${ts}] success — accepted by MailChannels`);
      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Non-202 — return the upstream details so the frontend can surface them
    console.error(`[contact ${ts}] MailChannels rejected the send`, {
      status: emailRes.status,
      body: mcBody,
    });

    return new Response(JSON.stringify({
      error: 'MailChannels send failed',
      upstream: {
        status: emailRes.status,
        statusText: emailRes.statusText,
        body: mcBody,
      },
    }), {
      status: 502,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error(`[contact ${ts}] unexpected error`, {
      message: err.message,
      stack: err.stack,
    });
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
