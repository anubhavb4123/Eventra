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

const { messaging } = require('./firebase');
const { supabase } = require('./supabase');

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
 * Remove a stale team token from Supabase.
 */
async function cleanTeamToken(eventId, teamCode) {
  try {
    await supabase.from('fcm_team_tokens').delete().eq('event_id', eventId).eq('team_code', teamCode);
    await supabase.from('teams').update({ fcm_token: null, fcm_token_updated_at: null }).eq('event_id', eventId).eq('team_code', teamCode);
    stats.totalCleaned++;
    console.log(`[Notify] Cleaned stale team token in Supabase: ${eventId}/${teamCode}`);
  } catch (err) {
    console.error(`[Notify] Failed to clean team token:`, err.message);
  }
}

/**
 * Send a push notification to ALL registered teams of a specific event.
 */
async function sendToEventTeams(eventId, payload) {
  const result = { sent: 0, failed: 0, cleaned: 0 };
  if (!eventId) return result;

  try {
    const { data: teamTokens, error } = await supabase
      .from('fcm_team_tokens')
      .select('token, team_code')
      .eq('event_id', eventId);

    if (error) throw error;
    if (!teamTokens || teamTokens.length === 0) {
      console.log(`[Notify] No team tokens found in Supabase for event: ${eventId}`);
      return result;
    }

    console.log(`[Notify] Sending to ${teamTokens.length} registered team(s) for event ${eventId}...`);

    for (const item of teamTokens) {
      const token = item.token;
      if (!token) continue;

      const res = await sendToToken(token, payload);
      if (res.success) {
        result.sent++;
      } else {
        result.failed++;
        if (res.isInvalidToken) {
          await cleanTeamToken(eventId, item.team_code);
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

  try {
    const { data: teamTokens, error } = await supabase
      .from('fcm_team_tokens')
      .select('token, team_code')
      .eq('event_id', eventId)
      .in('team_code', teamCodes);

    if (error) throw error;
    if (!teamTokens || teamTokens.length === 0) return result;

    for (const item of teamTokens) {
      const token = item.token;
      if (!token) continue;

      const res = await sendToToken(token, payload);
      if (res.success) {
        result.sent++;
      } else {
        result.failed++;
        if (res.isInvalidToken) {
          await cleanTeamToken(eventId, item.team_code);
          result.cleaned++;
        }
      }
    }
  } catch (err) {
    console.error(`[Notify] Error sending to specific teams:`, err.message);
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
    const { data: teams, error } = await supabase
      .from('teams')
      .select('team_code, qualifications')
      .eq('event_id', eventId);

    if (error) throw error;

    const roundKey = String(round);
    const qualifiedCodes = (teams || [])
      .filter(t => t.qualifications?.[roundKey] === true)
      .map(t => t.team_code);

    if (qualifiedCodes.length === 0) {
      console.log(`[Notify] No teams qualified for round ${round} in event ${eventId}`);
      return result;
    }

    return await sendToSpecificTeams(eventId, qualifiedCodes, payload);
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
    const { data: teams, error } = await supabase
      .from('teams')
      .select('team_code, position')
      .eq('event_id', eventId)
      .not('position', 'is', null)
      .gt('position', 0);

    if (error) throw error;

    const winnerCodes = (teams || []).map(t => t.team_code);
    if (winnerCodes.length === 0) {
      console.log(`[Notify] No winner teams found for event ${eventId}`);
      return result;
    }

    return await sendToSpecificTeams(eventId, winnerCodes, payload);
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
