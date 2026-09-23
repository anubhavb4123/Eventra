// ============================================================
// Eventra — Firebase Cloud Messaging (FCM) Push Notifications
// ============================================================

import { getMessaging, getToken, onMessage, isSupported, type Messaging } from 'firebase/messaging';
import app from './firebase';
import { storeVisitorTokenInSupabase, associateTokenWithTeamInSupabase } from './supabase';
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
 * Store a general visitor FCM registration token in Supabase database.
 * Prevents duplicates by caching synced state in local storage.
 */
export async function storeVisitorTokenInDatabase(token: string): Promise<void> {
  if (!token) return;

  const lastSynced = localStorage.getItem(STORAGE_KEY_SYNCED);
  if (lastSynced === token) {
    // Already synced, skip duplicate database write
    return;
  }

  try {
    await storeVisitorTokenInSupabase(token);
    localStorage.setItem(STORAGE_KEY_SYNCED, token);
    console.log('[FCM] General visitor token stored in Supabase under fcm_visitor_tokens');
  } catch (err) {
    console.error('[FCM] Failed to store visitor token in Supabase:', err);
  }
}

/**
 * Associate an FCM registration token with a registered team in Supabase.
 * Updates both fcm_team_tokens and teams.fcm_token.
 */
export async function associateTokenWithTeam(
  eventId: string,
  teamCode: string,
  token: string,
  teamMetadata: { teamId: string; teamName: string; leader: string; email?: string }
): Promise<void> {
  if (!eventId || !teamCode || !token) return;

  try {
    await associateTokenWithTeamInSupabase(eventId, teamCode, token, teamMetadata);
    console.log(`[FCM] Successfully associated FCM token with team ${teamMetadata.teamId} in Supabase`);
  } catch (err) {
    console.error('[FCM] Failed to associate token with team in Supabase:', err);
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
