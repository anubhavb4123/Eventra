// ============================================================
// Eventra — Application Constants
// ============================================================

/** The static secret key required to create new events. */
export const APPROVAL_KEY = import.meta.env.VITE_APPROVAL_KEY || '';


/** App metadata */
export const APP_NAME = 'Eventra';
export const APP_TAGLINE = 'Modern event management with QR attendance tracking';
export const APP_VERSION = '1.0.0';

/** Database table names in Supabase */
export const TABLES = {
  EVENTS: 'events',
  TEAMS: 'teams',
  FCM_VISITOR_TOKENS: 'fcm_visitor_tokens',
  FCM_TEAM_TOKENS: 'fcm_team_tokens',
  NOTIFICATION_QUEUE: 'notification_queue',
} as const;

/** Legacy collections alias for backward compatibility */
export const COLLECTIONS = TABLES;
