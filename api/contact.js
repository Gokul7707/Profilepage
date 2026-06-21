const nodemailer = require('nodemailer');

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
  const contactEmail = process.env.CONTACT_EMAIL || smtpUser;
  const smtpHost = process.env.SMTP_HOST || 'smtp.gmail.com';
  const smtpPort = Number(process.env.SMTP_PORT || 587);

  if (!smtpHost || !smtpUser || !smtpPass || !contactEmail) {
    return res.status(503).json({
      success: false,
      message: 'Email service is not configured yet. Please try again later or email gokulsrinivasan2020@gmail.com directly.',
      emailed: false,
      email_note: 'Add SMTP_USER and SMTP_PASSWORD in Vercel environment variables.',
    });
  }

  try {
    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: false,
      auth: { user: smtpUser, pass: smtpPass },
    });

    await transporter.sendMail({
      from: smtpUser,
      to: contactEmail,
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
      message: err.message || 'Email send failed. Try again or email gokulsrinivasan2020@gmail.com directly.',
      emailed: false,
    });
  }
};
