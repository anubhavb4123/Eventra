// ============================================================
// Eventra Notification Server — Deduplication System
// ============================================================
// Prevents the same automatic notification from being sent
// repeatedly across scheduler runs. Uses RTDB path
// `notificationLog/{key}` to track dispatched notifications.
//
// Key design: when a deadline changes, the key hash changes
// automatically (because the deadline ISO string is part of
// the key), so fresh reminders fire for the new deadline.
// ============================================================

const { db } = require('./firebase');

/**
 * Check if a notification with the given key has already been sent.
 *
 * @param {string} key - Unique notification key
 * @returns {Promise<boolean>}
 */
async function hasBeenSent(key) {
  if (!key) return false;
  try {
    const snap = await db.ref(`notificationLog/${sanitizeKey(key)}`).once('value');
    return snap.exists();
  } catch (err) {
    console.error(`[Dedup] Error checking key "${key}":`, err.message);
    // If we can't check, assume NOT sent (better to send twice than miss)
    return false;
  }
}

/**
 * Mark a notification as sent in the dedup log.
 *
 * @param {string} key      - Unique notification key
 * @param {object} metadata - Additional metadata to store { type, eventId, detail, ... }
 */
async function markAsSent(key, metadata = {}) {
  if (!key) return;
  try {
    await db.ref(`notificationLog/${sanitizeKey(key)}`).set({
      sentAt: Date.now(),
      key,
      ...metadata,
    });
  } catch (err) {
    console.error(`[Dedup] Error marking key "${key}" as sent:`, err.message);
  }
}

/**
 * Clear all dedup records for a specific event and notification type.
 * Used when a deadline changes so new reminders can fire.
 *
 * @param {string} eventId - Event identifier
 * @param {string} type    - Notification type prefix (e.g., 'reg_closing')
 */
async function clearForEvent(eventId, type) {
  if (!eventId || !type) return;
  try {
    // Read all log entries and filter by eventId + type
    const snap = await db.ref('notificationLog').orderByChild('eventId').equalTo(eventId).once('value');
    if (!snap.exists()) return;

    const updates = {};
    snap.forEach((child) => {
      const data = child.val();
      if (data.type && data.type.startsWith(type)) {
        updates[child.key] = null; // Delete this entry
      }
    });

    if (Object.keys(updates).length > 0) {
      await db.ref('notificationLog').update(updates);
      console.log(`[Dedup] Cleared ${Object.keys(updates).length} dedup record(s) for event ${eventId}, type prefix: ${type}`);
    }
  } catch (err) {
    console.error(`[Dedup] Error clearing records for event ${eventId}:`, err.message);
  }
}

/**
 * Clean up old dedup records (older than the specified days).
 * Prevents the notificationLog from growing indefinitely.
 *
 * @param {number} daysOld - Delete records older than this many days (default: 7)
 */
async function cleanupOldRecords(daysOld = 7) {
  try {
    const cutoff = Date.now() - (daysOld * 24 * 60 * 60 * 1000);
    const snap = await db.ref('notificationLog').orderByChild('sentAt').endAt(cutoff).once('value');

    if (!snap.exists()) return;

    const updates = {};
    let count = 0;
    snap.forEach((child) => {
      updates[child.key] = null;
      count++;
    });

    if (count > 0) {
      await db.ref('notificationLog').update(updates);
      console.log(`[Dedup] Cleaned up ${count} old dedup record(s) (older than ${daysOld} days).`);
    }
  } catch (err) {
    console.error('[Dedup] Error cleaning up old records:', err.message);
  }
}

/**
 * Sanitize a key string for use as an RTDB node key.
 * Same logic as the frontend's sanitizeTokenKey but for dedup keys.
 */
function sanitizeKey(key) {
  return key.replace(/[.#$[\]/:]/g, '_');
}

module.exports = {
  hasBeenSent,
  markAsSent,
  clearForEvent,
  cleanupOldRecords,
  sanitizeKey,
};
