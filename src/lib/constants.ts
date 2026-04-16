// ============================================================
// Eventra — Application Constants
// ============================================================

/** The static secret key required to create new events. */
export const APPROVAL_KEY = 'EVENTRA-2026-APPROVE';

/** App metadata */
export const APP_NAME = 'Eventra';
export const APP_TAGLINE = 'Modern event management with QR attendance tracking';
export const APP_VERSION = '1.0.0';

/** Firestore collection names */
export const COLLECTIONS = {
  EVENTS: 'events',
  TEAMS: 'teams',
  DETAILS: 'details',
} as const;
