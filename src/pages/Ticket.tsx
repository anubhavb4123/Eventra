import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ref, get } from 'firebase/database';
import { db } from '@/lib/firebase';
import { withRetry } from '@/lib/db-retry';
import { GlassCard } from '@/components/GlassCard';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { Home } from 'lucide-react';
import type { TeamWithId, EventDetails as EventDetailsType } from '@/types';
import { TicketCard } from '@/components/TicketCard';
import '@/styles/eventra-shared.css';

export const Ticket: React.FC = () => {
  const { eventId, teamId } = useParams<{ eventId: string; teamId: string }>();
  const [team, setTeam] = useState<TeamWithId | null>(null);
  const [eventDetails, setEventDetails] = useState<EventDetailsType | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      if (!eventId || !teamId) return;
      try {
        const teamCode = teamId.split('-').pop() || teamId;
        const [teamSnap, detailsSnap] = await Promise.all([
          withRetry(() => get(ref(db, `events/${eventId}/teams/${teamCode}`))),
          withRetry(() => get(ref(db, `events/${eventId}/details`)))
        ]);
        if (teamSnap.exists() && detailsSnap.exists()) {
          setTeam({ id: teamSnap.key!, ...teamSnap.val() } as TeamWithId);
          setEventDetails(detailsSnap.val() as EventDetailsType);
        }
      } catch (err) {
        console.error('Failed to load ticket data:', err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [eventId, teamId]);

  if (loading) return (
    <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <LoadingSpinner text="Generating your ticket..." />
    </div>
  );

  if (!team || !eventDetails) return (
    <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
      <GlassCard style={{ textAlign: 'center', maxWidth: 380, width: '100%' }} padding="xl">
        <h2 style={{ fontFamily: "'Crimson Pro', Georgia, serif", fontSize: '2rem', color: '#F87171', marginBottom: '0.5rem' }}>
          Ticket Not Found
        </h2>
        <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.78rem', color: '#666' }}>
          This ticket could not be found or the URL is invalid.
        </p>
      </GlassCard>
    </div>
  );

  const qrValue = `${eventId}|${teamId}`;

  return (
    <div style={{ minHeight: '80vh', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '3rem 1.5rem', gap: '2rem' }}>
      <div className="ev-section-label" style={{ letterSpacing: '0.14em' }}>YOUR TICKET</div>
      <TicketCard eventId={eventId!} teamId={teamId!} team={team} eventDetails={eventDetails} qrValue={qrValue} />
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <Link to="/" style={{ textDecoration: 'none' }}>
          <button className="ev-btn ev-btn-ghost" style={{ gap: 8 }}>
            <Home size={14} /> Back to Home
          </button>
        </Link>
      </div>
    </div>
  );
};
