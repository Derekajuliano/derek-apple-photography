const TO_ADDRESS = 'photos@derekandapple.com';
const FROM_ADDRESS = 'Derek & Apple Website <noreply@derekandapple.com>';

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // Contact form endpoint
    if (url.pathname === '/contact') {
      if (request.method !== 'POST') {
        return new Response('Method Not Allowed', {
          status: 405,
          headers: {
            Allow: 'POST'
          }
        });
      }

      return handleContact(request, env);
    }

    // Everything else is served from your normal static site
    return env.ASSETS.fetch(request);
  }
};

async function handleContact(request, env) {
  const ts = new Date().toISOString();
  console.log(`[contact ${ts}] invoked`);

  if (!env.RESEND_API_KEY) {
    console.error(`[contact ${ts}] RESEND_API_KEY is missing`);

    return jsonResponse(
      {
        error: 'Server misconfiguration'
      },
      500
    );
  }

  try {
    const body = await request.json();

    const name = String(body.name || '').trim();
    const email = String(body.email || '').trim();
    const sessionType = String(body['session-type'] || '').trim();
    const message = String(body.message || '').trim();
    const honeypot = String(body['bot-field'] || '').trim();

    console.log(`[contact ${ts}] payload received`, {
      hasName: Boolean(name),
      hasEmail: Boolean(email),
      sessionType: sessionType || '(none)',
      messageLength: message.length,
      honeypotTriggered: Boolean(honeypot)
    });

    // Honeypot
    if (honeypot) {
      console.log(`[contact ${ts}] honeypot triggered`);

      return jsonResponse(
        {
          success: true
        },
        200
      );
    }

    // Required fields
    if (!name || !email || !message) {
      return jsonResponse(
        {
          error: 'Missing required fields'
        },
        400
      );
    }

    // Basic email validation
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailPattern.test(email)) {
      return jsonResponse(
        {
          error: 'Invalid email address'
        },
        400
      );
    }

    // Reasonable public-form limits
    if (
      name.length > 100 ||
      email.length > 254 ||
      sessionType.length > 100 ||
      message.length > 5000
    ) {
      return jsonResponse(
        {
          error: 'Input too long'
        },
        400
      );
    }

    // Prevent line breaks in email subject headers
    const safeName = name.replace(/[\r\n]+/g, ' ');
    const safeSessionType = sessionType.replace(/[\r\n]+/g, ' ');

    const resendPayload = {
      from: FROM_ADDRESS,
      to: [TO_ADDRESS],
      reply_to: email,
      subject:
        `New Inquiry — ${safeSessionType || 'General'} — ${safeName}`,
      text: [
        `Name: ${name}`,
        `Email: ${email}`,
        `Session Type: ${sessionType || 'Not specified'}`,
        '',
        'Message:',
        message
      ].join('\n')
    };

    console.log(`[contact ${ts}] calling Resend`, {
      to: resendPayload.to,
      from: resendPayload.from,
      replyTo: resendPayload.reply_to,
      subject: resendPayload.subject
    });

    const resendResponse = await fetch(
      'https://api.resend.com/emails',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${env.RESEND_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(resendPayload)
      }
    );

    const resendBody = await resendResponse.text();

    console.log(`[contact ${ts}] Resend response`, {
      status: resendResponse.status,
      ok: resendResponse.ok,
      body: resendBody || '(empty)'
    });

    if (!resendResponse.ok) {
      console.error(`[contact ${ts}] Resend rejected message`, {
        status: resendResponse.status,
        body: resendBody
      });

      return jsonResponse(
        {
          error: 'Unable to send message'
        },
        502
      );
    }

    console.log(`[contact ${ts}] success`);

    return jsonResponse(
      {
        success: true
      },
      200
    );
  } catch (error) {
    console.error(`[contact ${ts}] unexpected error`, {
      message: error.message,
      stack: error.stack
    });

    return jsonResponse(
      {
        error: 'Unable to process request'
      },
      500
    );
  }
}

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json'
    }
  });
}
