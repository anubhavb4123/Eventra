import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ref, get, update } from 'firebase/database';
import { db } from '@/lib/firebase';
import { withRetry } from '@/lib/db-retry';
import { GlassCard } from '@/components/GlassCard';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { Home } from 'lucide-react';
import { sendRegistrationEmail } from '@/lib/email';
import { TicketCard } from '@/components/TicketCard';
import type { TeamWithId, EventDetails as EventDetailsType } from '@/types';

export const RegistrationSuccess: React.FC = () => {
  const { eventId, teamId } = useParams<{ eventId: string; teamId: string }>();
  const [teamName, setTeamName] = useState('');
  const [team, setTeam] = useState<TeamWithId | null>(null);
  const [eventDetails, setEventDetails] = useState<EventDetailsType | null>(null);
  const [loading, setLoading] = useState(true);
  const [confettiDone, setConfettiDone] = useState(false);

  useEffect(() => {
    const load = async () => {
      if (!eventId || !teamId) return;
      try {
        const teamCode = teamId.split('-').pop() || teamId;
        const [snap, detailsSnap] = await Promise.all([
          withRetry(() => get(ref(db, `events/${eventId}/teams/${teamCode}`))),
          withRetry(() => get(ref(db, `events/${eventId}/details`)))
        ]);

        if (snap.exists() && detailsSnap.exists()) {
          const tData = snap.val();
          const dData = detailsSnap.val();
          setTeamName(tData.teamName);
          setTeam({ id: teamCode, ...tData });
          setEventDetails(dData);

          if (tData.email && !tData.emailSent) {
            try {
              // Mark as sent in DB immediately to prevent duplicate sends on quick reloads
              await withRetry(() => update(ref(db, `events/${eventId}/teams/${teamCode}`), {
                emailSent: true
              }));
              
              await sendRegistrationEmail({
                team_name: tData.teamName,
                team_id: teamId,
                event_name: dData.eventName,
                ticket_link: `${window.location.origin}/ticket/${eventId}/${teamId}`,
                to_email: tData.email
              });
            } catch (err) {
              console.error("Auto-email failure:", err);
            }
          }
        }
      } catch (e) {
        console.error('Load Registration Success Error:', e);
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

        {/* Digital Ticket */}
        {team && eventDetails && (
          <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'center' }}>
            <TicketCard 
              eventId={eventId!} 
              teamId={teamId!} 
              team={team} 
              eventDetails={eventDetails} 
              qrValue={qrValue} 
            />
          </div>
        )}

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
