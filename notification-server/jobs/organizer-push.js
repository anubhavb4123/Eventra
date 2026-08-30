// ============================================================
// Job: Organizer-Queued Push Notifications
// ============================================================
// Runs every 30 seconds. Watches `notificationQueue/{eventId}/`
// in RTDB for pending notifications queued by organizers.
//
// Targets supported:
//   • 'all_teams'        — All registered teams of this event
//   • 'qualified_round'  — Teams qualified for targetRound
//   • 'winners'          — Winning teams (1st, 2nd, 3rd place)
//   • 'specific_teams'   — Selected team codes array
// ============================================================

const { db } = require('../lib/firebase');
const { sendToEventTeams, sendToSpecificTeams, sendToQualifiedTeams, sendToWinnerTeams } = require('../lib/notifications');

/**
 * Process all pending organizer-queued notifications.
 */
async function run() {
  try {
    const queueSnap = await db.ref('notificationQueue').once('value');
    if (!queueSnap.exists()) return;

    const queue = queueSnap.val();
    const now = Date.now();

    for (const [eventId, entries] of Object.entries(queue)) {
      if (!entries || typeof entries !== 'object') continue;

      let eventName = eventId;
      try {
        const detailsSnap = await db.ref(`events/${eventId}/details/eventName`).once('value');
        if (detailsSnap.exists()) eventName = detailsSnap.val();
      } catch (_) { /* ignore */ }

      for (const [pushId, entry] of Object.entries(entries)) {
        if (entry.processed) {
          if (entry.processedAt && (now - entry.processedAt) > 24 * 60 * 60 * 1000) {
            await db.ref(`notificationQueue/${eventId}/${pushId}`).remove();
          }
          continue;
        }

        if (!entry.title || !entry.body) {
          console.warn(`[Queue] Invalid queue entry ${pushId} for event ${eventId} — missing title/body`);
          await db.ref(`notificationQueue/${eventId}/${pushId}`).update({
            processed: true,
            processedAt: now,
            error: 'Missing required fields: title, body',
          });
          continue;
        }

        console.log(`[Queue] Processing broadcast for "${eventName}": "${entry.title}" (target: ${entry.target})`);

        const payload = {
          title: entry.title,
          body: entry.body,
          url: entry.url || `/ticket/${eventId}`,
          data: {
            eventId,
            type: 'organizer_push',
            pushId,
            ...(entry.data || {}),
          },
        };

        const target = entry.target || 'all_teams';
        let result = { sent: 0, failed: 0, cleaned: 0 };

        try {
          if (target === 'all_teams' || target === 'all') {
            result = await sendToEventTeams(eventId, payload);
          } else if (target === 'qualified_round' && entry.targetRound) {
            result = await sendToQualifiedTeams(eventId, entry.targetRound, payload);
          } else if (target === 'winners') {
            result = await sendToWinnerTeams(eventId, payload);
          } else if (target === 'specific_teams' && Array.isArray(entry.teamCodes)) {
            result = await sendToSpecificTeams(eventId, entry.teamCodes, payload);
          } else {
            // Default to event teams
            result = await sendToEventTeams(eventId, payload);
          }

          await db.ref(`notificationQueue/${eventId}/${pushId}`).update({
            processed: true,
            processedAt: now,
            result: {
              sent: result.sent,
              failed: result.failed,
            },
          });

          console.log(`[Queue] ✅ Processed "${entry.title}" — sent to ${result.sent} registered teams (failed: ${result.failed})`);
        } catch (err) {
          console.error(`[Queue] Error processing ${pushId}:`, err.message);
          await db.ref(`notificationQueue/${eventId}/${pushId}`).update({
            processed: true,
            processedAt: now,
            error: err.message,
          });
        }
      }
    }
  } catch (err) {
    console.error('[Queue] Organizer push queue job error:', err.message);
  }
}

module.exports = { run };
