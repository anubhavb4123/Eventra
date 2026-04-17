import React, { useEffect, useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ref, get } from 'firebase/database';
import { db } from '@/lib/firebase';
import { withRetry } from '@/lib/db-retry';
import { GlassCard } from '@/components/GlassCard';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { Home } from 'lucide-react';
import type { TeamWithId, EventDetails as EventDetailsType } from '@/types';
import { TicketCard } from '@/components/TicketCard';

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
        console.error("Failed to load ticket data:", err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [eventId, teamId]);

  if (loading) {
    return (
      <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <LoadingSpinner text="Generating your ticket..." />
      </div>
    );
  }

  if (!team || !eventDetails) {
    return (
      <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
        <GlassCard style={{ textAlign: 'center' }}>
          <h2 style={{ fontFamily: "'Crimson Pro', Georgia, serif", fontSize: '2rem', color: '#F87171' }}>Ticket Not Found</h2>
          <p style={{ fontFamily: "'JetBrains Mono', monospace", color: '#9A9A9A' }}>This ticket could not be found or the URL is invalid.</p>
        </GlassCard>
      </div>
    );
  }

  const qrValue = `${eventId}|${teamId}`;

  return (
    <div style={{ minHeight: '80vh', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '3rem 1.5rem', gap: '2rem' }}>
      <TicketCard
        eventId={eventId!}
        teamId={teamId!}
        team={team}
        eventDetails={eventDetails}
        qrValue={qrValue}
      />

      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <Link to="/" style={{ textDecoration: 'none' }}>
          <button className="btn-secondary">
            <Home size={16} /> Back to Home
          </button>
        </Link>
      </div>
    </div>
  );
};
