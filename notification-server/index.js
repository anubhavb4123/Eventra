// ============================================================
// Eventra Notification Server — Main Entry Point
// ============================================================
// Express server with health/debug/manual-push endpoints.
// Initializes cron jobs on boot for automated notifications.
//
// Deployed as a separate Render service alongside the
// existing email server at /server.
// ============================================================

const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const cron = require('node-cron');

dotenv.config();

// ── Firebase Admin Init (must happen before job imports) ─────
const { db } = require('./lib/firebase');
const { getStats } = require('./lib/notifications');
const { cleanupOldRecords } = require('./lib/dedup');

// ── Import cron jobs ─────────────────────────────────────────
const registrationReminders = require('./jobs/registration-reminders');
const registrationStatus = require('./jobs/registration-status');
const qualificationNotifications = require('./jobs/qualification-notifications');
const organizerPush = require('./jobs/organizer-push');

// ── Express Setup ────────────────────────────────────────────
const app = express();
const PORT = process.env.PORT || 3001;
const startTime = Date.now();

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.options('*', cors());
app.use(express.json());

// ── Cron Job Tracking ────────────────────────────────────────
const cronStatus = {
  registrationReminders: { lastRun: null, runs: 0, errors: 0 },
  registrationStatus: { lastRun: null, runs: 0, errors: 0 },
  qualificationNotifications: { lastRun: null, runs: 0, errors: 0 },
  organizerPush: { lastRun: null, runs: 0, errors: 0 },
};

function wrapJob(name, jobFn) {
  return async () => {
    try {
      cronStatus[name].runs++;
      cronStatus[name].lastRun = new Date().toISOString();
      await jobFn();
    } catch (err) {
      cronStatus[name].errors++;
      console.error(`[Cron] Job "${name}" failed:`, err.message);
    }
  };
}

// ── Health Check ─────────────────────────────────────────────
app.get('/', (_req, res) => {
  const uptimeMs = Date.now() - startTime;
  const uptimeHours = (uptimeMs / 3600000).toFixed(2);

  res.json({
    status: 'ok',
    service: 'Eventra Notification Server',
    version: '1.0.0',
    uptime: `${uptimeHours} hours`,
    startedAt: new Date(startTime).toISOString(),
    cronJobs: {
      registrationReminders: `Every minute — ${cronStatus.registrationReminders.runs} runs`,
      registrationStatus: `Every minute — ${cronStatus.registrationStatus.runs} runs`,
      qualificationNotifications: `Every 2 minutes — ${cronStatus.qualificationNotifications.runs} runs`,
      organizerPush: `Every 30 seconds — ${cronStatus.organizerPush.runs} runs`,
    },
  });
});

// ── Detailed Status ──────────────────────────────────────────
app.get('/status', (_req, res) => {
  res.json({
    status: 'ok',
    notifications: getStats(),
    cronJobs: cronStatus,
    uptime: `${((Date.now() - startTime) / 3600000).toFixed(2)} hours`,
  });
});

// ── Debug Endpoint ───────────────────────────────────────────
app.get('/debug', async (_req, res) => {
  let dbConnected = false;
  try {
    const testSnap = await db.ref('.info/connected').once('value');
    dbConnected = testSnap.val() === true;
  } catch (_) { /* ignore */ }

  res.json({
    firebase_service_account_set: !!process.env.FIREBASE_SERVICE_ACCOUNT || !!process.env.GOOGLE_APPLICATION_CREDENTIALS,
    firebase_database_url: process.env.FIREBASE_DATABASE_URL || 'DEFAULT',
    database_connected: dbConnected,
    port: PORT,
    node_version: process.version,
  });
});

// ── Manual Notification Trigger ──────────────────────────────
// POST /notify
// Body: {
//   eventId: string,          — required
//   title: string,            — required
//   body: string,             — required
//   target: 'all_teams' | 'qualified_round' | 'winners' | 'specific_teams',
//   targetRound?: number,     — required when target = 'qualified_round'
//   teamCodes?: string[],     — required when target = 'specific_teams'
//   url?: string
// }
app.post('/notify', async (req, res) => {
  const { eventId, title, body, target = 'all_teams', targetRound, teamCodes, url } = req.body;

  if (!eventId || !title || !body) {
    return res.status(400).json({
      success: false,
      error: 'Missing required fields: eventId, title, body',
    });
  }

  const { sendToEventTeams, sendToSpecificTeams, sendToQualifiedTeams, sendToWinnerTeams } = require('./lib/notifications');

  const payload = {
    title,
    body,
    url: url || `/ticket/${eventId}`,
    data: { eventId, type: 'manual_push' },
  };

  try {
    let result = { sent: 0, failed: 0 };

    if (target === 'all_teams' || target === 'all') {
      result = await sendToEventTeams(eventId, payload);
    } else if (target === 'qualified_round' && targetRound) {
      result = await sendToQualifiedTeams(eventId, Number(targetRound), payload);
    } else if (target === 'winners') {
      result = await sendToWinnerTeams(eventId, payload);
    } else if (target === 'specific_teams' && Array.isArray(teamCodes)) {
      result = await sendToSpecificTeams(eventId, teamCodes, payload);
    } else {
      result = await sendToEventTeams(eventId, payload);
    }

    res.json({
      success: true,
      sent: result.sent,
      failed: result.failed,
    });
  } catch (err) {
    console.error('[Notify] Manual push error:', err.message);
    res.status(500).json({
      success: false,
      error: err.message,
    });
  }
});

// ── Start Cron Jobs ──────────────────────────────────────────
function startCronJobs() {
  console.log('[Cron] Starting scheduled notification jobs...');

  // Registration deadline reminders — every minute
  cron.schedule('* * * * *', wrapJob('registrationReminders', registrationReminders.run));
  console.log('[Cron] ✅ Registration reminders — every minute');

  // Registration status monitor — every minute
  cron.schedule('* * * * *', wrapJob('registrationStatus', registrationStatus.run));
  console.log('[Cron] ✅ Registration status monitor — every minute');

  // Qualification change notifications — every 2 minutes
  cron.schedule('*/2 * * * *', wrapJob('qualificationNotifications', qualificationNotifications.run));
  console.log('[Cron] ✅ Qualification notifications — every 2 minutes');

  // Organizer-queued push notifications — every 30 seconds
  cron.schedule('*/30 * * * * *', wrapJob('organizerPush', organizerPush.run));
  console.log('[Cron] ✅ Organizer push queue — every 30 seconds');

  // Dedup log cleanup — daily at 3:00 AM
  cron.schedule('0 3 * * *', async () => {
    console.log('[Cron] Running daily dedup log cleanup...');
    await cleanupOldRecords(7);
  });
  console.log('[Cron] ✅ Dedup cleanup — daily at 3:00 AM');

  console.log('[Cron] All jobs started successfully.');
}

// ── Start Server ─────────────────────────────────────────────
app.listen(PORT, () => {
  console.log('');
  console.log('='.repeat(56));
  console.log('  Eventra Notification Server');
  console.log(`  Running on port ${PORT}`);
  console.log(`  Started at ${new Date().toISOString()}`);
  console.log('='.repeat(56));
  console.log('');

  startCronJobs();
});
