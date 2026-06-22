const nodemailer = require('nodemailer');

const CONTACT_INBOX = process.env.CONTACT_EMAIL || 'gokulsrinivasan2020@gmail.com';

function validatePayload(body) {
  const name = String(body?.name || '').trim();
  const email = String(body?.email || '').trim();
  const message = String(body?.message || '').trim();

  if (name.length < 2) return { error: 'Please enter your name.' };
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { error: 'Please enter a valid email.' };
  }
  if (message.length < 10) return { error: 'Message should be at least 10 characters.' };

  return { name, email, message };
}

async function readJsonBody(req) {
  if (req.body && typeof req.body === 'object' && !Buffer.isBuffer(req.body)) {
    return req.body;
  }

  if (typeof req.body === 'string' && req.body.trim()) {
    try {
      return JSON.parse(req.body);
    } catch {
      return {};
    }
  }

  return new Promise((resolve, reject) => {
    let raw = '';
    req.on('data', (chunk) => {
      raw += chunk;
    });
    req.on('end', () => {
      if (!raw.trim()) {
        resolve({});
        return;
      }
      try {
        resolve(JSON.parse(raw));
      } catch {
        resolve({});
      }
    });
    req.on('error', reject);
  });
}

async function sendViaFormSubmit({ name, email, message }, req) {
  const origin = req.headers.origin
    || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'https://profilepage-ashen-beta.vercel.app');
  const referer = req.headers.referer || `${origin}/hello.html`;

  const res = await fetch(`https://formsubmit.co/ajax/${encodeURIComponent(CONTACT_INBOX)}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      Origin: origin,
      Referer: referer,
    },
    body: JSON.stringify({
      name,
      email,
      message,
      _subject: `Portfolio message from ${name}`,
      _replyto: email,
      _template: 'table',
      _captcha: 'false',
    }),
  });

  const data = await res.json().catch(() => ({}));
  const ok = data.success === true || data.success === 'true';
  if (!ok) {
    const note = data.message || 'Could not send message.';
    if (/activation/i.test(note)) {
      return {
        error: `FormSubmit needs activation. Open ${CONTACT_INBOX} and click the Activate Form link, then try again.`,
      };
    }
    return { error: note };
  }

  return { success: true, message: 'Thanks! Your message was received.', emailed: true };
}

module.exports = async (req, res) => {
  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  let body;
  try {
    body = await readJsonBody(req);
  } catch {
    return res.status(400).json({ success: false, message: 'Invalid request body.' });
  }

  const parsed = validatePayload(body);
  if (parsed.error) {
    return res.status(400).json({ success: false, message: parsed.error });
  }

  const { name, email, message } = parsed;
  const smtpUser = process.env.SMTP_USER || '';
  const smtpPass = (process.env.SMTP_PASSWORD || '').replace(/\s/g, '');
  const smtpHost = process.env.SMTP_HOST || 'smtp.gmail.com';
  const smtpPort = Number(process.env.SMTP_PORT || 587);

  if (smtpUser && smtpPass) {
    try {
      const transporter = nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: false,
        auth: { user: smtpUser, pass: smtpPass },
      });

      await transporter.sendMail({
        from: smtpUser,
        to: CONTACT_INBOX,
        replyTo: email,
        subject: `Portfolio message from ${name}`,
        text: `New message from your portfolio\n\nName: ${name}\nEmail: ${email}\nTime: ${new Date().toISOString()}\n\nMessage:\n${message}\n`,
      });

      return res.status(200).json({
        success: true,
        message: 'Thanks! Your message was received.',
        emailed: true,
      });
    } catch (err) {
      return res.status(500).json({
        success: false,
        message: err.message || 'Email send failed.',
        emailed: false,
      });
    }
  }

  try {
    const result = await sendViaFormSubmit({ name, email, message }, req);
    if (result.error) {
      return res.status(503).json({ success: false, message: result.error, emailed: false });
    }
    return res.status(200).json(result);
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message || 'Could not send message.',
      emailed: false,
    });
  }
};
