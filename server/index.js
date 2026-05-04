const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const SibApiV3Sdk = require('sib-api-v3-sdk');

dotenv.config();

const app = express();
const PORT = process.env.PORT;

// ── Middleware ────────────────────────────────────────────────
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.options('*', cors());
app.use(express.json());

// ── Brevo (Sendinblue) Client Setup ──────────────────────────
const defaultClient = SibApiV3Sdk.ApiClient.instance;
const apiKey = defaultClient.authentications['api-key'];
apiKey.apiKey = process.env.BREVO_API_KEY;

const emailApi = new SibApiV3Sdk.TransactionalEmailsApi();

// ── Health Check ─────────────────────────────────────────────
app.get('/', (_req, res) => {
  res.json({ status: 'ok', service: 'Eventra Email Server', version: '2.0' });
});

// ── Debug Endpoint ───────────────────────────────────────────
app.get('/debug', (_req, res) => {
  res.json({
    brevo_api_key_set: !!process.env.BREVO_API_KEY,
    brevo_sender_email: process.env.BREVO_SENDER_EMAIL || 'NOT SET',
    port: process.env.PORT || 'NOT SET',
  });
});

// ── Send Email Endpoint ──────────────────────────────────────
app.post('/send-email', async (req, res) => {
  const { to_email, team_name, team_id, event_name, message } = req.body;

  if (!to_email || !team_name || !team_id || !event_name) {
    return res.status(400).json({
      success: false,
      error: 'Missing required fields: to_email, team_name, team_id, event_name',
    });
  }

  const customMessage = message
    ? `<p style="margin:16px 0;padding:14px 18px;background:#1a1a2e;border-left:3px solid #c6a969;border-radius:6px;color:#ccc;font-size:14px;line-height:1.7;">${message}</p>`
    : '';

  const htmlContent = `
    <div style="font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif;max-width:560px;margin:0 auto;background:#0d0d14;border:1px solid rgba(198,169,105,0.2);border-radius:12px;overflow:hidden;">
      <div style="background:linear-gradient(135deg,#1a1a2e,#16213e);padding:32px 28px;text-align:center;border-bottom:1px solid rgba(198,169,105,0.15);">
        <h1 style="margin:0 0 6px;font-size:26px;font-weight:700;color:#c6a969;letter-spacing:0.5px;">Eventra</h1>
        <p style="margin:0;font-size:13px;color:#888;">Registration Confirmed</p>
      </div>
      <div style="padding:28px;">
        <p style="margin:0 0 20px;font-size:15px;color:#ccc;line-height:1.6;">
          Hello <strong style="color:#eaeaea;">${team_name}</strong>,<br/>
          Your registration has been confirmed! Here are your details:
        </p>
        <table style="width:100%;border-collapse:collapse;margin-bottom:20px;">
          <tr>
            <td style="padding:10px 14px;font-size:12px;color:#888;text-transform:uppercase;letter-spacing:1px;border-bottom:1px solid rgba(255,255,255,0.06);">Team Name</td>
            <td style="padding:10px 14px;font-size:14px;color:#eaeaea;font-weight:600;border-bottom:1px solid rgba(255,255,255,0.06);">${team_name}</td>
          </tr>
          <tr>
            <td style="padding:10px 14px;font-size:12px;color:#888;text-transform:uppercase;letter-spacing:1px;border-bottom:1px solid rgba(255,255,255,0.06);">Team ID</td>
            <td style="padding:10px 14px;font-size:14px;color:#c6a969;font-weight:600;font-family:monospace;border-bottom:1px solid rgba(255,255,255,0.06);">${team_id}</td>
          </tr>
          <tr>
            <td style="padding:10px 14px;font-size:12px;color:#888;text-transform:uppercase;letter-spacing:1px;">Event</td>
            <td style="padding:10px 14px;font-size:14px;color:#eaeaea;font-weight:600;">${event_name}</td>
          </tr>
        </table>
        ${customMessage}
        <p style="margin:20px 0 0;font-size:13px;color:#666;line-height:1.6;">
          Please save your Team ID for check-in. Show your QR code at the venue for attendance marking.
        </p>
      </div>
      <div style="padding:18px 28px;text-align:center;border-top:1px solid rgba(198,169,105,0.1);background:rgba(198,169,105,0.03);">
        <p style="margin:0;font-size:11px;color:#555;">Powered by Eventra &bull; Event Management Platform</p>
      </div>
    </div>
  `;

  try {
    const sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();
    sendSmtpEmail.subject = 'Registration Confirmed - Eventra';
    sendSmtpEmail.htmlContent = htmlContent;
    sendSmtpEmail.sender = { name: 'Eventra', email: process.env.BREVO_SENDER_EMAIL };
    sendSmtpEmail.to = [{ email: to_email }];

    await emailApi.sendTransacEmail(sendSmtpEmail);

    return res.status(200).json({ success: true, message: 'Email sent successfully' });
  } catch (error) {
    const brevoError = error?.response?.body?.message || error?.message || 'Unknown error';
    console.error('Brevo email error:', brevoError, error?.response?.body || '');
    return res.status(500).json({
      success: false,
      error: brevoError,
    });
  }
});

// ── Start Server ─────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`Eventra Email Server running on port ${PORT}`);
});
