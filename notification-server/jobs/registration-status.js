// ============================================================
// Job: Registration Status Monitor
// ============================================================
// Runs every minute. Detects changes to:
//   • registrationOpen (closed / opened)
//   • registrationDeadline (updated deadline)
//   • Deadline passage
//
// Exclusively notifies registered teams of the event (no visitors).
// ============================================================

const { supabase } = require('../lib/supabase');
const { sendToEventTeams } = require('../lib/notifications');
const { hasBeenSent, markAsSent, clearForEvent } = require('../lib/dedup');

// In-memory state cache: { eventId: { registrationOpen, registrationDeadline, deadlinePassed } }
const stateCache = {};

/**
 * Monitor registration status changes across all events.
 */
async function run() {
  try {
    const { data: events, error } = await supabase
      .from('events')
      .select('id, event_name, registration_open, registration_deadline');

    if (error) {
      console.error('[Status] Error fetching events from Supabase:', error.message);
      return;
    }

    if (!events || events.length === 0) return;

    const now = Date.now();

    for (const event of events) {
      const eventId = event.id;
      const eventName = event.event_name || eventId;
      const currentOpen = event.registration_open !== false;
      const currentDeadline = event.registration_deadline || null;

      const prev = stateCache[eventId];

      // ── First run for this event: just cache the state ──────
      if (!prev) {
        stateCache[eventId] = {
          registrationOpen: currentOpen,
          registrationDeadline: currentDeadline,
          deadlinePassed: currentDeadline ? new Date(currentDeadline).getTime() <= now : false,
        };
        continue;
      }

      // ── Registration status transition ──────────────────────
      if (prev.registrationOpen !== currentOpen) {
        if (!currentOpen) {
          // Open → Closed
          const dedupKey = `${eventId}_reg_closed_${now}`;
          if (!(await hasBeenSent(dedupKey))) {
            console.log(`[Status] ❌ Registration CLOSED for "${eventName}"`);

            const payload = {
              title: `Registration Closed`,
              body: `Registration for "${eventName}" has now officially closed. Check your team ticket for schedule details!`,
              url: `/register/${eventId}`,
              data: { eventId, type: 'registration_closed' },
            };

            const teamResult = await sendToEventTeams(eventId, payload);

            await markAsSent(dedupKey, {
              type: 'registration_closed',
              eventId,
              eventName,
              teamsSent: teamResult.sent,
            });

            console.log(`[Status] Closed notification sent to ${teamResult.sent} registered team(s).`);
          }
        }

        prev.registrationOpen = currentOpen;
      }

      // ── Deadline value changed (organizer updated it) ───────
      if (prev.registrationDeadline !== currentDeadline && currentDeadline) {
        const dedupKey = `${eventId}_deadline_changed_${currentDeadline}`;

        if (prev.registrationDeadline && !(await hasBeenSent(dedupKey))) {
          console.log(`[Status] 📅 Deadline changed for "${eventName}": ${prev.registrationDeadline} → ${currentDeadline}`);

          await clearForEvent(eventId, 'reg_closing');

          const payload = {
            title: `📅 Schedule Update: Deadline Extended`,
            body: `The registration deadline for "${eventName}" has been updated to ${new Date(currentDeadline).toLocaleString()}.`,
            url: `/register/${eventId}`,
            data: { eventId, type: 'deadline_changed', newDeadline: currentDeadline },
          };

          const teamResult = await sendToEventTeams(eventId, payload);

          await markAsSent(dedupKey, {
            type: 'deadline_changed',
            eventId,
            eventName,
            oldDeadline: prev.registrationDeadline,
            newDeadline: currentDeadline,
            teamsSent: teamResult.sent,
          });

          console.log(`[Status] Deadline change notification sent to ${teamResult.sent} team(s).`);
        }

        prev.registrationDeadline = currentDeadline;
        prev.deadlinePassed = false;
      }

      // ── Deadline just passed ────────────────────────────────
      if (currentDeadline && !prev.deadlinePassed) {
        const deadlineMs = new Date(currentDeadline).getTime();
        if (!isNaN(deadlineMs) && deadlineMs <= now) {
          const dedupKey = `${eventId}_deadline_passed_${currentDeadline}`;

          if (!(await hasBeenSent(dedupKey))) {
            console.log(`[Status] ⏳ Deadline PASSED for "${eventName}"`);

            const payload = {
              title: `Registration Closed`,
              body: `The registration deadline for "${eventName}" has passed. Stay tuned for round announcements!`,
              url: `/register/${eventId}`,
              data: { eventId, type: 'deadline_passed' },
            };

            const teamResult = await sendToEventTeams(eventId, payload);

            await markAsSent(dedupKey, {
              type: 'deadline_passed',
              eventId,
              eventName,
              deadline: currentDeadline,
              teamsSent: teamResult.sent,
            });

            console.log(`[Status] Deadline passed notification sent to ${teamResult.sent} team(s).`);
          }

          prev.deadlinePassed = true;
        }
      }
    }
  } catch (err) {
    console.error('[Status] Registration status monitor error:', err.message);
  }
}

module.exports = { run };
