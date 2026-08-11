const TO_ADDRESS = 'photos@derekandapple.com';
const FROM_ADDRESS = 'Derek & Apple Website <noreply@derekandapple.com>';

function jsonResponse(body, status, headers = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...headers },
  });
}

function contactCorsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
}

async function handleContact(request, env) {
  const ts = new Date().toISOString();
  console.log(`[contact ${ts}] invoked`);

  if (!env?.RESEND_API_KEY) {
    console.error(`[contact ${ts}] RESEND_API_KEY is missing from environment`);
    return jsonResponse({
      error: 'Server misconfiguration',
      detail: 'RESEND_API_KEY env var not set on the Cloudflare project',
    }, 500, contactCorsHeaders());
  }

  try {
    const body = await request.json();
    const { name, email, 'session-type': sessionType, message, 'bot-field': honeypot } = body;

    console.log(`[contact ${ts}] payload received`, {
      hasName: !!name,
      hasEmail: !!email,
      sessionType: sessionType || '(none)',
      messageLength: (message || '').length,
      honeypotTriggered: !!honeypot,
    });

    if (honeypot) {
      console.log(`[contact ${ts}] honeypot triggered, dropping silently`);
      return new Response('OK', {
        status: 200,
        headers: contactCorsHeaders(),
      });
    }

    if (!name || !email || !message) {
      console.warn(`[contact ${ts}] validation failed — missing required fields`);
      return jsonResponse({ error: 'Missing required fields' }, 400, contactCorsHeaders());
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
        Authorization: 'Bearer ' + env.RESEND_API_KEY,
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
    resendRes.headers.forEach((value, key) => {
      resendHeaders[key] = value;
    });

    console.log(`[contact ${ts}] Resend response`, {
      status: resendRes.status,
      statusText: resendRes.statusText,
      ok: resendRes.ok,
      headers: resendHeaders,
      body: resendBody || '(empty)',
    });

    if (resendRes.ok) {
      console.log(`[contact ${ts}] success — accepted by Resend`);
      return jsonResponse({ success: true }, 200, contactCorsHeaders());
    }

    console.error(`[contact ${ts}] Resend rejected the send`, {
      status: resendRes.status,
      body: resendBody,
    });

    return jsonResponse({
      error: 'Resend send failed',
      upstream: {
        status: resendRes.status,
        statusText: resendRes.statusText,
        body: resendBody,
      },
    }, 502, contactCorsHeaders());
  } catch (err) {
    console.error(`[contact ${ts}] unexpected error`, {
      message: err.message,
      stack: err.stack,
    });
    return jsonResponse({ error: err.message }, 500, contactCorsHeaders());
  }
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === '/api/contact') {
      if (request.method === 'OPTIONS') {
        return new Response(null, {
          status: 204,
          headers: {
            Allow: 'POST, OPTIONS',
            ...contactCorsHeaders(),
          },
        });
      }

      if (request.method === 'POST') {
        return handleContact(request, env);
      }

      return jsonResponse({ error: 'Method not allowed' }, 405, {
        Allow: 'POST, OPTIONS',
        ...contactCorsHeaders(),
      });
    }

    return env.ASSETS.fetch(request);
  },
};
