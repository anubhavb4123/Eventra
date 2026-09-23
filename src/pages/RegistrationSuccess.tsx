import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getEvent, getTeam, mapEventRowToDetails } from '@/lib/supabase';
import { withRetry } from '@/lib/db-retry';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { Home } from 'lucide-react';
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
        const [teamData, eventData] = await Promise.all([
          withRetry(() => getTeam(eventId, teamCode)),
          withRetry(() => getEvent(eventId)),
        ]);
        if (teamData && eventData) {
          setTeamName(teamData.teamName);
          setTeam(teamData);
          setEventDetails(mapEventRowToDetails(eventData));
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
      <div style={{ maxWidth: 920, width: '100%', opacity: show ? 1 : 0, transform: show ? 'translateY(0)' : 'translateY(16px)', transition: 'all 0.5s ease' }}>

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

        {/* Nav */}
        <div style={{ maxWidth: 420, margin: '0.5rem auto 0', display: 'flex', flexDirection: 'column', gap: 10, width: '100%' }}>
          <Link to="/" style={{ textDecoration: 'none' }}>
            <button className="ev-btn ev-btn-ghost ev-btn-full" style={{ gap: 8 }}>
              <Home size={14} /> Back to Home
            </button>
          </Link>
          <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.68rem', color: '#444', textAlign: 'center', margin: 0 }}>
            💡 Save your boarding pass to your device before arriving at the venue.
          </p>
        </div>
      </div>
    </div>
  );
};
