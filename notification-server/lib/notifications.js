// ============================================================
// Eventra Notification Server — Core Notification Dispatch
// ============================================================
// Sends FCM push notifications exclusively to registered teams/participants:
//   • All registered teams of an event
//   • Qualified teams by competition round
//   • Winning teams (1st, 2nd, 3rd place)
//   • Selected registered teams
//
// Automatically cleans up stale/invalid tokens from RTDB.
// ============================================================

const { db, messaging } = require('./firebase');

// In-memory stats for health endpoint reporting
const stats = {
  totalSent: 0,
  totalFailed: 0,
  totalCleaned: 0,
  lastSendTime: null,
  lastError: null,
};

/**
 * Return current notification dispatch statistics.
 */
function getStats() {
  return { ...stats };
}

/**
 * Send an FCM notification to a single device token.
 *
 * @param {string} token   - FCM registration token
 * @param {object} payload - { title, body, icon?, url?, data? }
 * @returns {Promise<{ success: boolean, error?: string, isInvalidToken?: boolean }>}
 */
async function sendToToken(token, payload) {
  if (!token) return { success: false, error: 'Empty token' };

  const message = {
    token,
    notification: {
      title: payload.title,
      body: payload.body,
    },
    webpush: {
      notification: {
        title: payload.title,
        body: payload.body,
        icon: payload.icon || '/favicon.ico',
        badge: '/favicon.ico',
        requireInteraction: false,
      },
      fcmOptions: {
        link: payload.url || '/',
      },
    },
  };

  if (payload.data && typeof payload.data === 'object') {
    message.data = {};
    for (const [k, v] of Object.entries(payload.data)) {
      message.data[k] = String(v);
    }
  }

  try {
    await messaging.send(message);
    stats.totalSent++;
    stats.lastSendTime = new Date().toISOString();
    return { success: true };
  } catch (err) {
    stats.totalFailed++;
    stats.lastError = err.message;

    const isInvalidToken =
      err.code === 'messaging/registration-token-not-registered' ||
      err.code === 'messaging/invalid-registration-token' ||
      err.code === 'messaging/invalid-argument';

    if (isInvalidToken) {
      console.warn(`[Notify] Invalid token detected (will be cleaned): ${token.substring(0, 20)}...`);
    } else {
      console.error(`[Notify] FCM send error: ${err.code || err.message}`);
    }

    return { success: false, error: err.code || err.message, isInvalidToken };
  }
}

/**
 * Remove a stale team token from RTDB.
 */
async function cleanTeamToken(eventId, teamCode) {
  try {
    await db.ref(`fcmTokens/teams/${eventId}/${teamCode}`).remove();
    await db.ref(`events/${eventId}/teams/${teamCode}/fcmToken`).remove();
    await db.ref(`events/${eventId}/teams/${teamCode}/fcmTokenUpdatedAt`).remove();
    stats.totalCleaned++;
    console.log(`[Notify] Cleaned stale team token: ${eventId}/${teamCode}`);
  } catch (err) {
    console.error(`[Notify] Failed to clean team token:`, err.message);
  }
}

/**
 * Send a push notification to ALL registered teams of a specific event.
 * Reads from `fcmTokens/teams/{eventId}/`.
 */
async function sendToEventTeams(eventId, payload) {
  const result = { sent: 0, failed: 0, cleaned: 0 };
  if (!eventId) return result;

  try {
    const snap = await db.ref(`fcmTokens/teams/${eventId}`).once('value');
    if (!snap.exists()) {
      console.log(`[Notify] No team tokens found for event: ${eventId}`);
      return result;
    }

    const teams = snap.val();
    const entries = Object.entries(teams);
    console.log(`[Notify] Sending to ${entries.length} registered team(s) for event ${eventId}...`);

    for (const [teamCode, data] of entries) {
      const token = data?.token;
      if (!token) continue;

      const res = await sendToToken(token, payload);
      if (res.success) {
        result.sent++;
      } else {
        result.failed++;
        if (res.isInvalidToken) {
          await cleanTeamToken(eventId, teamCode);
          result.cleaned++;
        }
      }
    }
  } catch (err) {
    console.error(`[Notify] Error sending to event teams (${eventId}):`, err.message);
  }

  return result;
}

/**
 * Send a push notification to specific teams within an event.
 */
async function sendToSpecificTeams(eventId, teamCodes, payload) {
  const result = { sent: 0, failed: 0, cleaned: 0 };
  if (!eventId || !teamCodes?.length) return result;

  for (const teamCode of teamCodes) {
    try {
      const snap = await db.ref(`fcmTokens/teams/${eventId}/${teamCode}`).once('value');
      if (!snap.exists()) continue;

      const data = snap.val();
      const token = data?.token;
      if (!token) continue;

      const res = await sendToToken(token, payload);
      if (res.success) {
        result.sent++;
      } else {
        result.failed++;
        if (res.isInvalidToken) {
          await cleanTeamToken(eventId, teamCode);
          result.cleaned++;
        }
      }
    } catch (err) {
      console.error(`[Notify] Error sending to team ${teamCode}:`, err.message);
    }
  }

  return result;
}

/**
 * Send a push notification to teams qualified for a specific competition round.
 */
async function sendToQualifiedTeams(eventId, round, payload) {
  const result = { sent: 0, failed: 0, cleaned: 0 };
  if (!eventId || !round) return result;

  try {
    const teamsSnap = await db.ref(`events/${eventId}/teams`).once('value');
    if (!teamsSnap.exists()) return result;

    const teams = teamsSnap.val();
    const qualifiedTeamCodes = [];

    for (const [teamCode, teamData] of Object.entries(teams)) {
      if (teamData?.qualifications?.[String(round)] === true) {
        qualifiedTeamCodes.push(teamCode);
      }
    }

    if (qualifiedTeamCodes.length === 0) {
      console.log(`[Notify] No teams qualified for round ${round} in event ${eventId}`);
      return result;
    }

    return await sendToSpecificTeams(eventId, qualifiedTeamCodes, payload);
  } catch (err) {
    console.error(`[Notify] Error sending to round ${round} qualified teams:`, err.message);
    return result;
  }
}

/**
 * Send a push notification to winning teams (1st, 2nd, 3rd place).
 */
async function sendToWinnerTeams(eventId, payload) {
  const result = { sent: 0, failed: 0, cleaned: 0 };
  if (!eventId) return result;

  try {
    const teamsSnap = await db.ref(`events/${eventId}/teams`).once('value');
    if (!teamsSnap.exists()) return result;

    const teams = teamsSnap.val();
    const winnerTeamCodes = [];

    for (const [teamCode, teamData] of Object.entries(teams)) {
      if (teamData?.position && teamData.position > 0) {
        winnerTeamCodes.push(teamCode);
      }
    }

    if (winnerTeamCodes.length === 0) {
      console.log(`[Notify] No winner teams found for event ${eventId}`);
      return result;
    }

    return await sendToSpecificTeams(eventId, winnerTeamCodes, payload);
  } catch (err) {
    console.error(`[Notify] Error sending to winner teams:`, err.message);
    return result;
  }
}

module.exports = {
  sendToToken,
  sendToEventTeams,
  sendToSpecificTeams,
  sendToQualifiedTeams,
  sendToWinnerTeams,
  getStats,
};
