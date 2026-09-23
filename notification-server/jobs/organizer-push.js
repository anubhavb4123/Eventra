// ============================================================
// Job: Organizer-Queued Push Notifications
// ============================================================
// Runs every 30 seconds. Watches `notification_queue` table
// in Supabase for pending notifications queued by organizers.
// ============================================================

const { supabase } = require('../lib/supabase');
const { sendToEventTeams, sendToSpecificTeams, sendToQualifiedTeams, sendToWinnerTeams } = require('../lib/notifications');

/**
 * Process all pending organizer-queued notifications.
 */
async function run() {
  try {
    const { data: pending, error } = await supabase
      .from('notification_queue')
      .select('*, events(event_name)')
      .eq('processed', false)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('[Queue] Error querying notification_queue in Supabase:', error.message);
      return;
    }

    if (!pending || pending.length === 0) return;

    const now = new Date().toISOString();

    for (const entry of pending) {
      const eventId = entry.event_id;
      const eventName = entry.events?.event_name || eventId;
      const pushId = entry.id;

      if (!entry.title || !entry.body) {
        console.warn(`[Queue] Invalid queue entry ${pushId} for event ${eventId} — missing title/body`);
        await supabase
          .from('notification_queue')
          .update({
            processed: true,
            processed_at: now,
            error: 'Missing required fields: title, body',
          })
          .eq('id', pushId);
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
        },
      };

      const target = entry.target || 'all_teams';
      let result = { sent: 0, failed: 0, cleaned: 0 };

      try {
        if (target === 'all_teams' || target === 'all') {
          result = await sendToEventTeams(eventId, payload);
        } else if (target === 'qualified_round' && entry.target_round) {
          result = await sendToQualifiedTeams(eventId, entry.target_round, payload);
        } else if (target === 'winners') {
          result = await sendToWinnerTeams(eventId, payload);
        } else if (target === 'specific_teams' && Array.isArray(entry.team_codes)) {
          result = await sendToSpecificTeams(eventId, entry.team_codes, payload);
        } else {
          result = await sendToEventTeams(eventId, payload);
        }

        await supabase
          .from('notification_queue')
          .update({
            processed: true,
            processed_at: now,
            result: {
              sent: result.sent,
              failed: result.failed,
            },
          })
          .eq('id', pushId);

        console.log(`[Queue] ✅ Processed "${entry.title}" — sent to ${result.sent} registered teams (failed: ${result.failed})`);
      } catch (err) {
        console.error(`[Queue] Error processing ${pushId}:`, err.message);
        await supabase
          .from('notification_queue')
          .update({
            processed: true,
            processed_at: now,
            error: err.message,
          })
          .eq('id', pushId);
      }
    }

    // Clean up processed queue entries older than 24 hours
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    await supabase
      .from('notification_queue')
      .delete()
      .eq('processed', true)
      .lt('processed_at', oneDayAgo);

  } catch (err) {
    console.error('[Queue] Organizer push queue job error:', err.message);
  }
}

module.exports = { run };
