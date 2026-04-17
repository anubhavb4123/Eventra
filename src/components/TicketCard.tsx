import React, { useRef, useState } from 'react';
import { Calendar, MapPin, Users, Download } from 'lucide-react';
import { QRCodeDisplay } from '@/components/QRCodeDisplay';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { formatDate } from '@/lib/utils';
import type { TeamWithId, EventDetails as EventDetailsType } from '@/types';
import html2canvas from 'html2canvas';

interface TicketCardProps {
  eventId: string;
  teamId: string;
  team: TeamWithId;
  eventDetails: EventDetailsType;
  qrValue: string;
}

export const TicketCard: React.FC<TicketCardProps> = ({ eventId, teamId, team, eventDetails, qrValue }) => {
  const [downloading, setDownloading] = useState(false);
  const ticketRef = useRef<HTMLDivElement>(null);

  const handleDownload = async () => {
    if (!ticketRef.current || downloading) return;
    setDownloading(true);
    try {
      // Ensure all fonts are fully loaded for html2canvas to render text properly
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
      console.error("Failed to download ticket:", err);
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
          background: 'radial-gradient(ellipse at top, rgba(198,169,105,0.08) 0%, rgba(0,0,0,0) 70%)',
          border: '1px solid rgba(198,169,105,0.2)',
          borderRadius: '1.25rem',
          padding: '2rem',
          position: 'relative',
          boxShadow: '0 10px 40px -10px rgba(198,169,105,0.15)'
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <span style={{
            fontFamily: "'JetBrains Mono', monospace", fontSize: '0.65rem', color: '#C6A969',
            padding: '0.2rem 0.65rem', borderRadius: '9999px',
            background: 'rgba(198,169,105,0.1)', border: '1px solid rgba(198,169,105,0.2)',
            textTransform: 'uppercase', letterSpacing: '0.1em'
          }}>
            Digital Entry Ticket
          </span>
          <h1 style={{ fontFamily: "'Crimson Pro', Georgia, serif", fontSize: '2.5rem', fontWeight: 700, color: '#EAEAEA', marginTop: '1rem', marginBottom: '0.25rem', lineHeight: 1.1 }}>
            {eventDetails.eventName}
          </h1>
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '2rem' }}>
          <QRCodeDisplay value={qrValue} teamId={teamId} size={180} />
        </div>

        <div style={{
          borderTop: '1px dashed rgba(198,169,105,0.3)',
          borderBottom: '1px dashed rgba(198,169,105,0.3)',
          padding: '1.5rem 0',
          marginBottom: '1.5rem',
          display: 'flex', flexDirection: 'column', gap: '1rem'
        }}>
          <div>
            <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.65rem', color: '#9A9A9A', textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 0 0.2rem' }}>Team Name</p>
            <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '1.2rem', fontWeight: 700, color: '#EAEAEA', margin: 0 }}>{team.teamName}</p>
          </div>
          <div>
            <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.65rem', color: '#9A9A9A', textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 0 0.2rem' }}>Led By</p>
            <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.9rem', color: '#C6A969', margin: 0 }}>{team.leader}</p>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {eventDetails.dateTime && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Calendar size={14} color="#C6A969" />
              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.75rem', color: '#EAEAEA' }}>{formatDate(eventDetails.dateTime)}</span>
            </div>
          )}
          {eventDetails.venue && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <MapPin size={14} color="#C6A969" />
              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.75rem', color: '#EAEAEA' }}>{eventDetails.venue}</span>
            </div>
          )}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Users size={14} color="#C6A969" />
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.75rem', color: '#EAEAEA' }}>{team.members.length} Members Admits</span>
          </div>
        </div>
        
        {/* Ticket ID Watermark / Footer */}
        <div style={{ marginTop: '2rem', textAlign: 'center' }}>
          <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.6rem', color: 'rgba(234, 234, 234, 0.4)', textTransform: 'uppercase', letterSpacing: '0.1em', margin: 0 }}>
            {qrValue}
          </p>
        </div>
      </div>

      <button className="btn-primary" onClick={handleDownload} disabled={downloading} style={{ maxWidth: 400, width: '100%', justifyContent: 'center' }}>
        {downloading ? <LoadingSpinner text="Saving..." /> : <><Download size={16} /> Download Image</>}
      </button>
    </div>
  );
};
