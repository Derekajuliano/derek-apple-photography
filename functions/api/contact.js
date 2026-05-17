/**
 * CONTACT FORM — Cloudflare Pages Function (Resend, production)
 *
 * Uses Resend for transactional email. Free tier: 3,000 emails/month.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * CURRENT STATE: PRODUCTION
 * ─────────────────────────────────────────────────────────────────────────────
 *   TO_ADDRESS   = booking@derekandapple.com
 *   FROM_ADDRESS = noreply@derekandapple.com  (verified domain)
 *   reply_to     = the visitor's submitted email (clicking Reply goes to them)
 *
 * Domain derekandapple.com is verified in Resend via DNS records at Porkbun
 * (registrar AND DNS host for this domain):
 *   - TXT  resend._domainkey   (DKIM signing key)
 *   - TXT  send                (SPF: v=spf1 include:amazonses.com ~all)
 *   - MX   send                (feedback-smtp.us-east-1.amazonses.com, prio 10)
 *
 * Note: Resend's modern setup uses the `send.derekandapple.com` subdomain for
 * sending infrastructure, so the existing Zoho Mail SPF at the root (`@`) is
 * completely untouched. Both coexist without conflict.
 *
 * Email at this domain is hosted by Zoho Mail. Mailboxes like booking@ live
 * in Zoho — the Resend setup only sends outbound transactional mail.
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

// ── Production addresses ─────────────────────────────────────────────────────
const TO_ADDRESS = 'booking@derekandapple.com';
const FROM_ADDRESS = 'Derek & Apple Website <noreply@derekandapple.com>';

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
