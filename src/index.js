const TO_ADDRESS = 'photos@derekandapple.com';
const FROM_ADDRESS = 'Derek & Apple Website <noreply@derekandapple.com>';

function jsonResponse(body, status, headers = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...headers },
  });
}

function contactCorsHeaders(request) {
  const headers = {
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  const origin = request.headers.get('Origin');
  const url = new URL(request.url);
  const allowedOrigins = new Set([
    url.origin,
    'https://derekandapple.com',
    'https://www.derekandapple.com',
    'http://localhost:8787',
    'http://127.0.0.1:8787',
  ]);

  if (origin && allowedOrigins.has(origin)) {
    headers['Access-Control-Allow-Origin'] = origin;
    headers.Vary = 'Origin';
  }

  return headers;
}

function isValidEmail(value) {
  return !/[\r\n]/.test(value) && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

async function handleContact(request, env) {
  const ts = new Date().toISOString();
  console.log(`[contact ${ts}] invoked`);

  if (!env?.RESEND_API_KEY) {
    console.error(`[contact ${ts}] RESEND_API_KEY is missing from environment`);
    return jsonResponse({ error: 'Server misconfiguration' }, 500, contactCorsHeaders(request));
  }

  let body;
  try {
    body = await request.json();
  } catch (err) {
    console.warn(`[contact ${ts}] invalid request body`, {
      message: err.message,
    });
    return jsonResponse({ error: 'Invalid request body' }, 400, contactCorsHeaders(request));
  }

  try {
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
        headers: contactCorsHeaders(request),
      });
    }

    if (!name || !email || !message) {
      console.warn(`[contact ${ts}] validation failed — missing required fields`);
      return jsonResponse({ error: 'Missing required fields' }, 400, contactCorsHeaders(request));
    }

    if (!isValidEmail(email)) {
      console.warn(`[contact ${ts}] validation failed — invalid email`);
      return jsonResponse({ error: 'Invalid email address' }, 400, contactCorsHeaders(request));
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
      return jsonResponse({ success: true }, 200, contactCorsHeaders(request));
    }

    console.error(`[contact ${ts}] Resend rejected the send`, {
      status: resendRes.status,
      body: resendBody,
    });

    return jsonResponse({
      error: 'Unable to send message right now',
    }, 502, contactCorsHeaders(request));
  } catch (err) {
    console.error(`[contact ${ts}] unexpected error`, {
      message: err.message,
      stack: err.stack,
    });
    return jsonResponse({ error: 'Internal server error' }, 500, contactCorsHeaders(request));
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
            ...contactCorsHeaders(request),
          },
        });
      }

      if (request.method === 'POST') {
        return handleContact(request, env);
      }

      return jsonResponse({ error: 'Method not allowed' }, 405, {
        Allow: 'POST, OPTIONS',
        ...contactCorsHeaders(request),
      });
    }

    return env.ASSETS.fetch(request);
  },
};
