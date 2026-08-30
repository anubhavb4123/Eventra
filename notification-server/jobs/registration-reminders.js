// ============================================================
// Job: Registration Deadline Reminders
// ============================================================
// Runs every minute. For each event with registrationDeadline
// set and registrationOpen === true, sends reminders at:
//   • 24 hours before deadline
//   •  1 hour  before deadline
//
// Exclusively notifies registered teams of the event (no visitors).
// ============================================================

const { db } = require('../lib/firebase');
const { sendToEventTeams } = require('../lib/notifications');
const { hasBeenSent, markAsSent } = require('../lib/dedup');

// Window tolerance: ±2 minutes (in milliseconds)
const WINDOW_MS = 2 * 60 * 1000;

/**
 * Check registration deadlines and send reminders to registered teams.
 */
async function run() {
  try {
    const eventsSnap = await db.ref('events').once('value');
    if (!eventsSnap.exists()) return;

    const events = eventsSnap.val();
    const now = Date.now();

    for (const [eventId, eventData] of Object.entries(events)) {
      const settings = eventData.eventSettings || {};
      const details = eventData.details || {};
      const eventName = details.eventName || eventId;

      if (settings.registrationOpen === false) continue;

      const deadline = settings.registrationDeadline;
      if (!deadline) continue;

      const deadlineMs = new Date(deadline).getTime();
      if (isNaN(deadlineMs)) continue;

      const timeRemaining = deadlineMs - now;
      if (timeRemaining <= 0) continue;

      // ── 24-hour reminder ────────────────────────────────────
      const twentyFourHours = 24 * 60 * 60 * 1000;
      if (Math.abs(timeRemaining - twentyFourHours) <= WINDOW_MS) {
        const dedupKey = `${eventId}_reg_closing_24h_${deadline}`;

        if (!(await hasBeenSent(dedupKey))) {
          console.log(`[Reminder] 📢 24h reminder for event "${eventName}" (${eventId})`);

          const payload = {
            title: `⏰ Final 24 Hours!`,
            body: `Registration for "${eventName}" closes in 24 hours. Ensure your team details are up to date!`,
            url: `/register/${eventId}`,
            data: { eventId, type: 'registration_reminder_24h' },
          };

          const teamResult = await sendToEventTeams(eventId, payload);

          await markAsSent(dedupKey, {
            type: 'reg_closing_24h',
            eventId,
            eventName,
            deadline,
            teamsSent: teamResult.sent,
          });

          console.log(`[Reminder] 24h reminder sent — teams: ${teamResult.sent}`);
        }
      }

      // ── 1-hour reminder ─────────────────────────────────────
      const oneHour = 60 * 60 * 1000;
      if (Math.abs(timeRemaining - oneHour) <= WINDOW_MS) {
        const dedupKey = `${eventId}_reg_closing_1h_${deadline}`;

        if (!(await hasBeenSent(dedupKey))) {
          console.log(`[Reminder] 🚨 1h reminder for event "${eventName}" (${eventId})`);

          const payload = {
            title: `🚨 Final Hour Before Registration Closes!`,
            body: `Registration for "${eventName}" closes in 1 hour.`,
            url: `/register/${eventId}`,
            data: { eventId, type: 'registration_reminder_1h' },
          };

          const teamResult = await sendToEventTeams(eventId, payload);

          await markAsSent(dedupKey, {
            type: 'reg_closing_1h',
            eventId,
            eventName,
            deadline,
            teamsSent: teamResult.sent,
          });

          console.log(`[Reminder] 1h reminder sent — teams: ${teamResult.sent}`);
        }
      }
    }
  } catch (err) {
    console.error('[Reminder] Registration reminders job error:', err.message);
  }
}

module.exports = { run };
