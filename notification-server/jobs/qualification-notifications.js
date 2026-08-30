// ============================================================
// Job: Qualification & Winner Notifications
// ============================================================
// Runs every 2 minutes. Detects when:
//   1. An organizer qualifies/disqualifies a team for a round
//   2. A team wins a place/position (1st, 2nd, 3rd Place)
//
// Sends targeted push notifications directly to the affected team's FCM token.
// ============================================================

const { db } = require('../lib/firebase');
const { sendToSpecificTeams } = require('../lib/notifications');
const { hasBeenSent, markAsSent } = require('../lib/dedup');

// In-memory caches:
const qualCache = {};     // { `${eventId}/${teamCode}`: { '1': true, '2': false, ... } }
const winnerCache = {};   // { `${eventId}/${teamCode}`: positionNumber }

/**
 * Scan all events/teams for round qualification and winner placement updates.
 */
async function run() {
  try {
    const eventsSnap = await db.ref('events').once('value');
    if (!eventsSnap.exists()) return;

    const events = eventsSnap.val();

    for (const [eventId, eventData] of Object.entries(events)) {
      const teams = eventData.teams;
      if (!teams) continue;

      const details = eventData.details || {};
      const eventName = details.eventName || eventId;

      for (const [teamCode, teamData] of Object.entries(teams)) {
        const teamName = teamData.teamName || teamCode;
        const cacheKey = `${eventId}/${teamCode}`;

        // ── 1. Check Winner Placement (1st, 2nd, 3rd Place) ──────
        const currentPosition = teamData.position;
        const prevPosition = winnerCache[cacheKey];

        if (currentPosition !== undefined && currentPosition !== null && currentPosition > 0) {
          if (prevPosition !== currentPosition) {
            const posText = currentPosition === 1 ? '1st Place 🥇' : currentPosition === 2 ? '2nd Place 🥈' : currentPosition === 3 ? '3rd Place 🥉' : `Position #${currentPosition}`;
            const dedupKey = `${eventId}_${teamCode}_winner_pos${currentPosition}`;

            if (!(await hasBeenSent(dedupKey))) {
              console.log(`[Winner] 🏆 Team "${teamName}" (${teamCode}) placed ${posText} in "${eventName}"`);

              const payload = {
                title: `🏆 Congratulations on ${posText}!`,
                body: `Outstanding job "${teamName}"! You have been awarded ${posText} in "${eventName}".`,
                url: `/ticket/${eventId}/${teamCode}`,
                data: { eventId, teamCode, type: 'winner_announcement', position: String(currentPosition) },
              };

              await sendToSpecificTeams(eventId, [teamCode], payload);
              await markAsSent(dedupKey, {
                type: 'winner_placement',
                eventId,
                eventName,
                teamCode,
                teamName,
                position: currentPosition,
              });
            }

            winnerCache[cacheKey] = currentPosition;
          }
        }

        // ── 2. Check Round Qualifications ────────────────────────
        const qualifications = teamData.qualifications;
        if (!qualifications) continue;

        const prev = qualCache[cacheKey];

        // First run for this team — initialize cache
        if (!prev) {
          qualCache[cacheKey] = { ...qualifications };
          continue;
        }

        for (const [round, qualified] of Object.entries(qualifications)) {
          const prevQualified = prev[round];

          if (prevQualified === qualified) continue;

          const dedupKey = `${eventId}_${teamCode}_qual_round${round}_${qualified}_${Date.now()}`;
          let payload;

          if (qualified) {
            payload = {
              title: `🎉 Qualified for Round ${round}!`,
              body: `Congratulations "${teamName}"! Your team has qualified for Round ${round} in "${eventName}".`,
              url: `/ticket/${eventId}/${teamCode}`,
              data: { eventId, teamCode, type: 'qualification', round, qualified: 'true' },
            };
          } else {
            payload = {
              title: `Round ${round} Status Update`,
              body: `"${teamName}" — Your team status for Round ${round} in "${eventName}" has been updated.`,
              url: `/ticket/${eventId}/${teamCode}`,
              data: { eventId, teamCode, type: 'qualification', round, qualified: 'false' },
            };
          }

          console.log(`[Qual] ${qualified ? '✅' : '❌'} Team "${teamName}" (${teamCode}) — Round ${round}: ${prevQualified} → ${qualified}`);
          await sendToSpecificTeams(eventId, [teamCode], payload);
          await markAsSent(dedupKey, {
            type: `qualification_round${round}`,
            eventId,
            eventName,
            teamCode,
            teamName,
            qualified,
          });

          prev[round] = qualified;
        }

        qualCache[cacheKey] = { ...qualifications };
      }
    }
  } catch (err) {
    console.error('[Qual] Qualification notifications job error:', err.message);
  }
}

module.exports = { run };
