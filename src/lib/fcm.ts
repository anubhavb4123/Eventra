// ============================================================
// Eventra — Firebase Cloud Messaging (FCM) Push Notifications
// ============================================================

import { getMessaging, getToken, onMessage, isSupported, type Messaging } from 'firebase/messaging';
import { ref, set, update, serverTimestamp } from 'firebase/database';
import app, { db } from './firebase';
import { withRetry } from './db-retry';
import type { VisitorFcmToken, TeamFcmToken } from '@/types';

// VAPID Public Web Push Key from environment (optional, standard FCM web push configuration)
const VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY || undefined;

// Local storage cache keys
const STORAGE_KEY_TOKEN = 'eventra_fcm_token';
const STORAGE_KEY_SYNCED = 'eventra_fcm_synced_token';
const STORAGE_KEY_PERMISSION = 'eventra_notif_permission';

let messagingPromise: Promise<Messaging | null> | null = null;

/**
 * Check if the current browser environment supports Push Notifications & Firebase Messaging.
 */
export async function isPushNotificationSupported(): Promise<boolean> {
  if (typeof window === 'undefined') return false;
  if (!('Notification' in window)) return false;
  if (!('serviceWorker' in navigator)) return false;
  if (!('PushManager' in window)) return false;

  try {
    const supported = await isSupported();
    return supported;
  } catch (err) {
    console.warn('[FCM] isSupported check failed:', err);
    return false;
  }
}

/**
 * Lazily initialize and retrieve Firebase Messaging instance.
 */
export async function getMessagingInstance(): Promise<Messaging | null> {
  if (!messagingPromise) {
    messagingPromise = (async () => {
      const supported = await isPushNotificationSupported();
      if (!supported) {
        console.info('[FCM] Push messaging is not supported in this browser environment.');
        return null;
      }
      try {
        return getMessaging(app);
      } catch (err) {
        console.error('[FCM] Failed to initialize Firebase Messaging:', err);
        return null;
      }
    })();
  }
  return messagingPromise;
}

/**
 * Sanitize an FCM token string to be safe as a Firebase Realtime Database node key.
 * Firebase RTDB keys cannot contain `.`, `#`, `$`, `[`, `]`, `:`, or `/`.
 */
export function sanitizeTokenKey(token: string): string {
  return token.replace(/[.#$[\]/:]/g, '_');
}

/**
 * Get the current browser notification permission status.
 */
export function getNotificationPermission(): NotificationPermission | 'unsupported' {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'unsupported';
  }
  return Notification.permission;
}

/**
 * Retrieve cached token from local storage (if any).
 */
export function getStoredFcmToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(STORAGE_KEY_TOKEN);
}

/**
 * Register the Firebase Cloud Messaging Service Worker.
 */
export async function registerFcmServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return null;

  try {
    const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js', {
      scope: '/',
    });
    console.log('[FCM] Service Worker registered with scope:', registration.scope);
    return registration;
  } catch (err) {
    console.error('[FCM] Service Worker registration failed:', err);
    return null;
  }
}

/**
 * Request notification permission from the user and generate FCM registration token.
 * Stores the token in Firebase Realtime Database under `fcmTokens/visitors/<tokenKey>`.
 */
export async function requestPermissionAndGetToken(): Promise<{
  token: string | null;
  permission: NotificationPermission | 'unsupported';
  error?: string;
}> {
  const supported = await isPushNotificationSupported();
  if (!supported) {
    return { token: null, permission: 'unsupported', error: 'Push notifications are not supported in your browser.' };
  }

  try {
    let currentPermission = Notification.permission;
    if (currentPermission === 'default') {
      currentPermission = await Notification.requestPermission();
    }

    localStorage.setItem(STORAGE_KEY_PERMISSION, currentPermission);

    if (currentPermission !== 'granted') {
      console.info('[FCM] Notification permission was not granted:', currentPermission);
      return { token: null, permission: currentPermission };
    }

    const messaging = await getMessagingInstance();
    if (!messaging) {
      return { token: null, permission: currentPermission, error: 'Firebase Messaging could not be initialized.' };
    }

    // Register or get active service worker registration
    const swRegistration = await registerFcmServiceWorker();

    const token = await getToken(messaging, {
      vapidKey: VAPID_KEY,
      serviceWorkerRegistration: swRegistration || undefined,
    });

    if (!token) {
      console.warn('[FCM] No registration token available.');
      return { token: null, permission: currentPermission, error: 'Failed to generate FCM registration token.' };
    }

    console.log('[FCM] ========================================');
    console.log('[FCM] FCM Registration Token generated:');
    console.log(token);
    console.log('[FCM] Use this token in Firebase Console -> Cloud Messaging to test notifications!');
    console.log('[FCM] ========================================');

    // Save locally
    localStorage.setItem(STORAGE_KEY_TOKEN, token);

    return { token, permission: currentPermission };
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : 'An error occurred while generating notification token.';
    console.error('[FCM] Error requesting notification token:', err);
    return {
      token: null,
      permission: getNotificationPermission(),
      error: errMsg,
    };
  }
}

/**
 * Store a general visitor FCM registration token in Firebase Realtime Database.
 * Prevents duplicates by using a sanitized token key and caching synced state.
 */
export async function storeVisitorTokenInDatabase(token: string): Promise<void> {
  if (!token) return;

  const lastSynced = localStorage.getItem(STORAGE_KEY_SYNCED);
  if (lastSynced === token) {
    // Already synced, skip duplicate database write
    return;
  }

  try {
    const tokenKey = sanitizeTokenKey(token);
    const visitorData: Partial<VisitorFcmToken> & { updatedAt: any; createdAt?: any } = {
      token,
      updatedAt: serverTimestamp(),
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
      platform: typeof navigator !== 'undefined' ? navigator.platform : '',
      language: typeof navigator !== 'undefined' ? navigator.language : 'en',
    };

    // Store in `fcmTokens/visitors/<tokenKey>`
    await withRetry(() => set(ref(db, `fcmTokens/visitors/${tokenKey}`), {
      ...visitorData,
      createdAt: serverTimestamp(),
    }));

    localStorage.setItem(STORAGE_KEY_SYNCED, token);
    console.log('[FCM] General visitor token stored in RTDB under fcmTokens/visitors');
  } catch (err) {
    console.error('[FCM] Failed to store visitor token in Realtime Database:', err);
  }
}

/**
 * Associate an FCM registration token with a registered team.
 * Keeps registered-team tokens categorized and updates both:
 * 1. `fcmTokens/teams/<eventId>/<teamCode>`
 * 2. `events/<eventId>/teams/<teamCode>/fcmToken`
 */
export async function associateTokenWithTeam(
  eventId: string,
  teamCode: string,
  token: string,
  teamMetadata: { teamId: string; teamName: string; leader: string; email?: string }
): Promise<void> {
  if (!eventId || !teamCode || !token) return;

  try {
    const teamTokenData: Partial<TeamFcmToken> & { updatedAt: any } = {
      token,
      teamId: teamMetadata.teamId,
      teamName: teamMetadata.teamName,
      leader: teamMetadata.leader,
      email: teamMetadata.email || '',
      eventId,
      updatedAt: serverTimestamp(),
    };

    // 1. Store in team tokens index: `fcmTokens/teams/<eventId>/<teamCode>`
    await withRetry(() => set(ref(db, `fcmTokens/teams/${eventId}/${teamCode}`), teamTokenData));

    // 2. Also attach directly to the team record for fast team-level lookup:
    await withRetry(() => update(ref(db, `events/${eventId}/teams/${teamCode}`), {
      fcmToken: token,
      fcmTokenUpdatedAt: serverTimestamp(),
    }));

    console.log(`[FCM] Successfully associated FCM token with team ${teamMetadata.teamId} (${teamCode})`);
  } catch (err) {
    console.error('[FCM] Failed to associate token with team:', err);
  }
}

/**
 * Set up foreground message listener.
 * Displays foreground notifications when the user is actively viewing the website.
 */
export function setupForegroundMessageHandler(
  onMessageReceived: (payload: any) => void
): (() => void) | null {
  let unsubscribe: (() => void) | null = null;

  getMessagingInstance().then((messaging) => {
    if (!messaging) return;
    try {
      unsubscribe = onMessage(messaging, (payload) => {
        console.log('[FCM] Foreground push notification received:', payload);
        onMessageReceived(payload);
      });
    } catch (err) {
      console.warn('[FCM] Failed to attach foreground onMessage handler:', err);
    }
  });

  return () => {
    if (unsubscribe) unsubscribe();
  };
}
