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

async function sendViaWeb3Forms({ name, email, message }) {
  const accessKey = process.env.WEB3FORMS_ACCESS_KEY || '120a3271-7ed1-4627-a41b-c71a66fcb011';

  const res = await fetch('https://api.web3forms.com/submit', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({
      access_key: accessKey,
      name,
      email,
      replyto: email,
      subject: `Portfolio message from ${name}`,
      message,
      botcheck: false,
    }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok || data.success !== true) {
    return { error: data.message || 'Web3Forms request failed.' };
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

  try {
    const result = await sendViaWeb3Forms(parsed);
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
