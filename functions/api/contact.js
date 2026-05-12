/**
 * CONTACT FORM — Cloudflare Pages Function (Resend)
 *
 * Uses Resend for transactional email. Free tier: 3,000 emails/month.
 * MailChannels free tier was deprecated August 2024 — this replaced it.
 *
 * Notifications are sent to: booking@derekandapple.com
 *
 * SENDER ADDRESS:
 *   For now, mail is sent FROM `onboarding@resend.dev` (Resend's test domain — no
 *   DNS required, works immediately). The reply_to is set to the visitor's email
 *   so booking@derekandapple.com can reply directly.
 *
 *   PRODUCTION: When derekandapple.com's nameservers have been pointed to
 *   Cloudflare, add the domain inside Resend:
 *     Resend dashboard → Domains → Add Domain → derekandapple.com
 *   Resend will give 2-3 DNS records (SPF / DKIM / optional return-path).
 *   Add them in Cloudflare DNS — the SPF entry must be MERGED into the existing
 *   Google Workspace SPF record (do not create a second SPF record).
 *   Once Resend reports the domain as "Verified", change the `from` below to:
 *     'Derek & Apple Website <noreply@derekandapple.com>'
 *
 * REQUIRED ENV (Cloudflare Pages → Settings → Variables and Secrets):
 *   RESEND_API_KEY  — secret, starts with re_...
 *
 * DEBUGGING:
 *   This function logs the full Resend response (status, headers, body) on every
 *   invocation. View logs at:
 *     Cloudflare Dashboard → Pages project → Functions → Real-time Logs
 *   Or via wrangler:
 *     wrangler pages deployment tail --project-name derek-apple-photography
 */

const TO_ADDRESS = 'booking@derekandapple.com';
const FROM_ADDRESS = 'Derek & Apple Website <onboarding@resend.dev>';

export async function onRequestPost(context) {
  const ts = new Date().toISOString();
  console.log(`[contact ${ts}] invoked`);

  // Fail loudly if the secret isn't set
  if (!context.env || !context.env.RESEND_API_KEY) {
    console.error(`[contact ${ts}] RESEND_API_KEY is missing from environment`);
    return new Response(JSON.stringify({
      error: 'Server misconfiguration',
      detail: 'RESEND_API_KEY env var not set on the Pages project',
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

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

    // Honeypot — silently accept spam without sending
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

    const resendPayload = {
      from: FROM_ADDRESS,
      to: [TO_ADDRESS],
      reply_to: email,
      subject: `New Inquiry — ${sessionType || 'General'} — ${name}`,
      text: [
        `Name: ${name}`,
        `Email: ${email}`,
        `Session Type: ${sessionType || 'Not specified'}`,
        '',
        'Message:',
        message,
      ].join('\n'),
    };

    console.log(`[contact ${ts}] calling Resend`, {
      to: resendPayload.to,
      from: resendPayload.from,
      replyTo: resendPayload.reply_to,
      subject: resendPayload.subject,
    });

    const resendRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${context.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(resendPayload),
    });

    let resendBody = '';
    try {
      resendBody = await resendRes.text();
    } catch (readErr) {
      resendBody = `(failed to read body: ${readErr.message})`;
    }

    const resendHeaders = {};
    resendRes.headers.forEach((value, key) => { resendHeaders[key] = value; });

    console.log(`[contact ${ts}] Resend response`, {
      status: resendRes.status,
      statusText: resendRes.statusText,
      ok: resendRes.ok,
      headers: resendHeaders,
      body: resendBody || '(empty)',
    });

    if (resendRes.ok) {
      console.log(`[contact ${ts}] success — accepted by Resend`);
      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Non-2xx — surface the upstream details so we can debug in DevTools
    console.error(`[contact ${ts}] Resend rejected the send`, {
      status: resendRes.status,
      body: resendBody,
    });

    return new Response(JSON.stringify({
      error: 'Resend send failed',
      upstream: {
        status: resendRes.status,
        statusText: resendRes.statusText,
        body: resendBody,
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
