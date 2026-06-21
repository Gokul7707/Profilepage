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

module.exports = async (req, res) => {
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  const parsed = validatePayload(req.body);
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
    return res.status(200).json({
      success: true,
      message: 'Thanks! Your message was received.',
      emailed: false,
      email_note: 'SMTP not configured in Vercel environment variables',
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
      message: err.message || 'Email send failed',
    });
  }
};
