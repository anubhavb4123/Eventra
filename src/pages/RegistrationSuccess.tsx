import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { GlassCard } from '@/components/GlassCard';
import { QRCodeDisplay } from '@/components/QRCodeDisplay';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { Home } from 'lucide-react';

export const RegistrationSuccess: React.FC = () => {
  const { eventId, teamId } = useParams<{ eventId: string; teamId: string }>();
  const [teamName, setTeamName] = useState('');
  const [loading, setLoading] = useState(true);
  const [confettiDone, setConfettiDone] = useState(false);

  useEffect(() => {
    const load = async () => {
      if (!eventId || !teamId) return;
      try {
        const snap = await getDoc(doc(db, 'events', eventId, 'teams', teamId));
        if (snap.exists()) setTeamName(snap.data().teamName);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
        setTimeout(() => setConfettiDone(true), 100);
      }
    };
    load();
  }, [eventId, teamId]);

  const qrValue = `${eventId}|${teamId}`;

  if (loading) {
    return (
      <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <LoadingSpinner text="Loading your registration..." />
      </div>
    );
  }

  return (
    <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '3rem 1.5rem' }}>
      <div style={{ maxWidth: 500, width: '100%' }}>
        {/* Success header */}
        <div
          className={`transition-all duration-700 ${confettiDone ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
          style={{ textAlign: 'center', marginBottom: '2rem' }}
        >
          {/* Animated rings */}
          <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem' }}>
            <div style={{
              position: 'absolute',
              width: 120, height: 120, borderRadius: '50%',
              border: '2px solid rgba(198,169,105,0.2)',
              animation: 'ring-expand 2s ease-out infinite',
            }} />
            <div style={{
              position: 'absolute',
              width: 90, height: 90, borderRadius: '50%',
              border: '1px solid rgba(198,169,105,0.15)',
              animation: 'ring-expand 2s 0.5s ease-out infinite',
            }} />
            <div style={{
              width: 72, height: 72, borderRadius: '50%',
              background: 'linear-gradient(135deg, rgba(198,169,105,0.15), rgba(212,175,55,0.2))',
              border: '2px solid rgba(198,169,105,0.5)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 0 30px rgba(198,169,105,0.25)',
              fontSize: '2rem',
            }}>
              🎉
            </div>
          </div>

          <style>{`
            @keyframes ring-expand {
              0% { transform: scale(0.8); opacity: 0.6; }
              100% { transform: scale(1.5); opacity: 0; }
            }
          `}</style>

          <h1 style={{ fontFamily: "'Crimson Pro', Georgia, serif", fontSize: '2.5rem', fontWeight: 700, color: '#EAEAEA', marginBottom: '0.5rem' }}>
            You're Registered!
          </h1>
          {teamName && (
            <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.9rem', color: '#9A9A9A' }}>
              Team <span style={{ color: '#C6A969', fontWeight: 700 }}>{teamName}</span> is confirmed.
            </p>
          )}
        </div>

        {/* QR Card */}
        <GlassCard style={{ marginBottom: '1.5rem' }}>
          <p style={{
            fontFamily: "'JetBrains Mono', monospace", fontSize: '0.72rem', color: '#9A9A9A',
            textAlign: 'center', marginBottom: '1.5rem', letterSpacing: '0.05em',
          }}>
            📱 Save your QR code — you'll need it for attendance verification.
          </p>
          <QRCodeDisplay
            value={qrValue}
            teamId={teamId!}
            size={220}
          />
        </GlassCard>

        {/* Instructions */}
        <GlassCard padding="sm" style={{ marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {[
              { emoji: '1️⃣', text: 'Download or screenshot your QR code.' },
              { emoji: '2️⃣', text: 'Show it to the organizer when you arrive.' },
              { emoji: '3️⃣', text: 'Your attendance will be marked by scanning.' },
            ].map((item) => (
              <div key={item.emoji} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                <span style={{ fontSize: '1rem', flexShrink: 0 }}>{item.emoji}</span>
                <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.78rem', color: '#9A9A9A', margin: 0 }}>
                  {item.text}
                </p>
              </div>
            ))}
          </div>
        </GlassCard>

        {/* Navigation */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <Link to="/" style={{ textDecoration: 'none' }}>
            <button className="btn-secondary" style={{ width: '100%', justifyContent: 'center' }}>
              <Home size={15} /> Back to Home
            </button>
          </Link>
          <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.72rem', color: '#4a4a4a', textAlign: 'center', margin: 0 }}>
            💡 Save or download your QR code above — contact the organizer if you lose it.
          </p>
        </div>
      </div>
    </div>
  );
};
