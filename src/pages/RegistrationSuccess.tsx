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
import '@/styles/eventra-shared.css';

export const RegistrationSuccess: React.FC = () => {
  const { eventId, teamId } = useParams<{ eventId: string; teamId: string }>();
  const [teamName, setTeamName] = useState('');
  const [team, setTeam] = useState<TeamWithId | null>(null);
  const [eventDetails, setEventDetails] = useState<EventDetailsType | null>(null);
  const [loading, setLoading] = useState(true);
  const [show, setShow] = useState(false);

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
              await withRetry(() => update(ref(db, `events/${eventId}/teams/${teamCode}`), { emailSent: true }));
              await sendRegistrationEmail({
                team_name: tData.teamName, team_id: teamId, event_name: dData.eventName,
                ticket_link: `${window.location.origin}/ticket/${eventId}/${teamId}`, to_email: tData.email
              });
            } catch (err) { console.error('Auto-email failure:', err); }
          }
        }
      } catch (e) {
        console.error('Load Registration Success Error:', e);
      } finally {
        setLoading(false);
        setTimeout(() => setShow(true), 80);
      }
    };
    load();
  }, [eventId, teamId]);

  const qrValue = `${eventId}|${teamId}`;

  if (loading) return (
    <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <LoadingSpinner text="Loading your registration..." />
    </div>
  );

  return (
    <div style={{ minHeight: '80vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '3rem 1.5rem' }}>
      <div style={{ maxWidth: 500, width: '100%', opacity: show ? 1 : 0, transform: show ? 'translateY(0)' : 'translateY(16px)', transition: 'all 0.5s ease' }}>

        {/* Hero */}
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          {/* Animated rings */}
          <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.75rem' }}>
            <style>{`
              @keyframes reg-ring { 0% { transform: scale(0.8); opacity: 0.5; } 100% { transform: scale(1.7); opacity: 0; } }
            `}</style>
            <div style={{ position: 'absolute', width: 120, height: 120, borderRadius: '50%', border: '1px solid rgba(198,169,105,0.2)', animation: 'reg-ring 2s ease-out infinite' }} />
            <div style={{ position: 'absolute', width: 90,  height: 90,  borderRadius: '50%', border: '1px solid rgba(198,169,105,0.12)', animation: 'reg-ring 2s 0.5s ease-out infinite' }} />
            <div style={{
              width: 72, height: 72, borderRadius: '50%',
              background: 'linear-gradient(135deg, rgba(198,169,105,0.12), rgba(212,175,55,0.18))',
              border: '2px solid rgba(198,169,105,0.45)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 0 32px rgba(198,169,105,0.22)',
              fontSize: '2rem',
            }}>🎉</div>
          </div>

          <h1 style={{ fontFamily: "'Crimson Pro', Georgia, serif", fontSize: 'clamp(2.2rem,5vw,3rem)', fontWeight: 700, color: '#eaeaea', marginBottom: '0.5rem', lineHeight: 1.1 }}>
            You're Registered!
          </h1>
          {teamName && (
            <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.82rem', color: '#666' }}>
              Team <span style={{ color: '#C6A969', fontWeight: 700 }}>{teamName}</span> is confirmed.
            </p>
          )}
        </div>

        {/* Ticket */}
        {team && eventDetails && (
          <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'center' }}>
            <TicketCard eventId={eventId!} teamId={teamId!} team={team} eventDetails={eventDetails} qrValue={qrValue} />
          </div>
        )}

        {/* Steps */}
        <GlassCard padding="sm" style={{ marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[
              { emoji: '1️⃣', text: 'Download or screenshot your QR code.' },
              { emoji: '2️⃣', text: 'Show it to the organizer when you arrive.' },
              { emoji: '3️⃣', text: 'Your attendance will be marked by scanning.' },
            ].map((item) => (
              <div key={item.emoji} style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                <span style={{ fontSize: '1rem', flexShrink: 0 }}>{item.emoji}</span>
                <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.75rem', color: '#666', margin: 0, lineHeight: 1.6 }}>{item.text}</p>
              </div>
            ))}
          </div>
        </GlassCard>

        {/* Nav */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <Link to="/" style={{ textDecoration: 'none' }}>
            <button className="ev-btn ev-btn-ghost ev-btn-full" style={{ gap: 8 }}>
              <Home size={14} /> Back to Home
            </button>
          </Link>
          <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.68rem', color: '#333', textAlign: 'center', margin: 0 }}>
            💡 Save or download your QR code — contact the organizer if you lose it.
          </p>
        </div>
      </div>
    </div>
  );
};
