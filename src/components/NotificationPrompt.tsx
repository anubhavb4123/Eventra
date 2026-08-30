import React, { useState, useEffect } from 'react';
import { BellRing, X } from 'lucide-react';
import { setupForegroundMessageHandler } from '@/lib/fcm';
import { haptic } from '@/lib/haptics';

/**
 * Foreground Push Notification Receiver
 * Listens for push messages while the user is browsing Eventra
 * and renders an elegant in-app toast notification.
 */
export const NotificationPrompt: React.FC = () => {
  const [toastMessage, setToastMessage] = useState<{ title: string; body: string; url?: string } | null>(null);

  useEffect(() => {
    // Listen to foreground notifications
    const unsub = setupForegroundMessageHandler((payload) => {
      try {
        haptic.success();
      } catch (_) {}
      const title = payload.notification?.title || payload.data?.title || 'Eventra Alert';
      const body = payload.notification?.body || payload.data?.body || 'You have a new update.';
      const url = payload.data?.url || payload.fcmOptions?.link;
      setToastMessage({ title, body, url });

      // Auto-hide toast after 7s
      setTimeout(() => {
        setToastMessage(null);
      }, 7000);
    });

    return () => {
      if (unsub) unsub();
    };
  }, []);

  if (!toastMessage) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 24,
        right: 24,
        zIndex: 9999,
        maxWidth: 380,
        width: 'calc(100% - 48px)',
        background: 'linear-gradient(135deg, rgba(16,16,24,0.96), rgba(24,20,12,0.96))',
        border: '1px solid rgba(198,169,105,0.4)',
        boxShadow: '0 12px 32px rgba(0,0,0,0.6), 0 0 20px rgba(198,169,105,0.15)',
        borderRadius: 14,
        padding: '16px 18px',
        backdropFilter: 'blur(16px)',
        animation: 'ev-fade-up 0.3s ease forwards',
        display: 'flex',
        alignItems: 'flex-start',
        gap: 12,
      }}
    >
      <div
        style={{
          width: 36,
          height: 36,
          borderRadius: 10,
          background: 'rgba(198,169,105,0.15)',
          border: '1px solid rgba(198,169,105,0.3)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <BellRing size={18} color="#C6A969" />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 3 }}>
          <span style={{ fontFamily: "'Crimson Pro', Georgia, serif", fontSize: '1rem', fontWeight: 700, color: '#eaeaea' }}>
            {toastMessage.title}
          </span>
          <button
            onClick={() => setToastMessage(null)}
            style={{ background: 'none', border: 'none', color: '#888', cursor: 'pointer', padding: 2 }}
          >
            <X size={14} />
          </button>
        </div>
        <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.78rem', color: '#aaa', margin: 0, lineHeight: 1.4 }}>
          {toastMessage.body}
        </p>
      </div>
    </div>
  );
};
