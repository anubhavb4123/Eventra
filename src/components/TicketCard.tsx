import React, { useRef, useState } from 'react';
import { Calendar, MapPin, Users, Download } from 'lucide-react';
import { QRCodeDisplay } from '@/components/QRCodeDisplay';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { formatDate } from '@/lib/utils';
import type { TeamWithId, EventDetails as EventDetailsType } from '@/types';
import html2canvas from 'html2canvas';
import '@/styles/eventra-shared.css';

interface TicketCardProps {
  eventId: string;
  teamId: string;
  team: TeamWithId;
  eventDetails: EventDetailsType;
  qrValue: string;
}

/* Reusable text style helper — always forces the fill color explicitly
   so -webkit-text-fill-color from parent gradient-clip elements can't leak in */
const txt = (color: string, extra: React.CSSProperties = {}): React.CSSProperties => ({
  color,
  WebkitTextFillColor: color,  // ← the key: override any inherited transparent fill
  ...extra,
});

export const TicketCard: React.FC<TicketCardProps> = ({ eventId, teamId, team, eventDetails, qrValue }) => {
  const [downloading, setDownloading] = useState(false);
  const ticketRef = useRef<HTMLDivElement>(null);

  const handleDownload = async () => {
    if (!ticketRef.current || downloading) return;
    setDownloading(true);
    try {
      await document.fonts.ready;
      const canvas = await html2canvas(ticketRef.current, {
        scale: 2,
        backgroundColor: '#0a0a0a',
        useCORS: true,
      });
      const link = document.createElement('a');
      link.download = `${eventId}-ticket-${teamId}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (err) {
      console.error('Failed to download ticket:', err);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem', width: '100%' }}>
      {/* The Printable Ticket Area */}
      <div
        ref={ticketRef}
        style={{
          maxWidth: 400,
          width: '100%',
          background: 'radial-gradient(ellipse at top, rgba(198,169,105,0.08) 0%, rgba(10,10,15,0.98) 70%)',
          backgroundColor: '#0a0a0f',
          border: '1px solid rgba(198,169,105,0.25)',
          borderRadius: '1.25rem',
          padding: '2rem',
          position: 'relative',
          boxShadow: '0 10px 40px -10px rgba(198,169,105,0.2)',
          /* Aggressively reset any inherited -webkit-text-fill-color: transparent */
          WebkitTextFillColor: 'unset',
        }}
      >
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <span style={{
            ...txt('#C6A969'),
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: '0.63rem',
            padding: '3px 12px',
            borderRadius: '9999px',
            background: 'rgba(198,169,105,0.1)',
            border: '1px solid rgba(198,169,105,0.25)',
            textTransform: 'uppercase',
            letterSpacing: '0.12em',
            display: 'inline-block',
          }}>
            Digital Entry Ticket
          </span>
          <h1 style={{
            ...txt('#EAEAEA'),
            fontFamily: "'Crimson Pro', Georgia, serif",
            fontSize: '2.2rem',
            fontWeight: 700,
            marginTop: '1rem',
            marginBottom: '0.25rem',
            lineHeight: 1.1,
          }}>
            {eventDetails.eventName}
          </h1>
        </div>

        {/* QR */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '2rem' }}>
          <QRCodeDisplay value={qrValue} teamId={teamId} size={180} />
        </div>

        {/* Team info */}
        <div style={{
          borderTop: '1px dashed rgba(198,169,105,0.3)',
          borderBottom: '1px dashed rgba(198,169,105,0.3)',
          padding: '1.25rem 0',
          marginBottom: '1.25rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.85rem',
        }}>
          <div>
            <p style={{ ...txt('#888'), fontFamily: "'JetBrains Mono', monospace", fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.12em', margin: '0 0 4px' }}>
              Team Name
            </p>
            <p style={{ ...txt('#EAEAEA'), fontFamily: "'JetBrains Mono', monospace", fontSize: '1.15rem', fontWeight: 700, margin: 0 }}>
              {team.teamName}
            </p>
          </div>
          <div>
            <p style={{ ...txt('#888'), fontFamily: "'JetBrains Mono', monospace", fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.12em', margin: '0 0 4px' }}>
              Led By
            </p>
            <p style={{ ...txt('#C6A969'), fontFamily: "'JetBrains Mono', monospace", fontSize: '0.88rem', margin: 0 }}>
              {team.leader}
            </p>
          </div>
        </div>

        {/* Event meta */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {eventDetails.dateTime && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Calendar size={13} color="#C6A969" />
              <span style={{ ...txt('#EAEAEA'), fontFamily: "'JetBrains Mono', monospace", fontSize: '0.72rem' }}>
                {formatDate(eventDetails.dateTime)}
              </span>
            </div>
          )}
          {eventDetails.venue && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <MapPin size={13} color="#C6A969" />
              <span style={{ ...txt('#EAEAEA'), fontFamily: "'JetBrains Mono', monospace", fontSize: '0.72rem' }}>
                {eventDetails.venue}
              </span>
            </div>
          )}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Users size={13} color="#C6A969" />
            <span style={{ ...txt('#EAEAEA'), fontFamily: "'JetBrains Mono', monospace", fontSize: '0.72rem' }}>
              {team.members.length} Member{team.members.length !== 1 ? 's' : ''} Admitted
            </span>
          </div>
        </div>

        {/* Footer watermark */}
        <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
          <p style={{ ...txt('rgba(255,255,255,0.2)'), fontFamily: "'JetBrains Mono', monospace", fontSize: '0.55rem', textTransform: 'uppercase', letterSpacing: '0.1em', margin: 0 }}>
            {qrValue}
          </p>
        </div>
      </div>

      <button
        className="ev-btn ev-btn-primary ev-btn-full"
        onClick={handleDownload}
        disabled={downloading}
        style={{ maxWidth: 400 }}
      >
        {downloading ? <LoadingSpinner size="sm" /> : <><Download size={15} /> Download Image</>}
      </button>
    </div>
  );
};
