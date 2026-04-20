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
        backgroundColor: '#0a0a0f',
        useCORS: true,
      });
      const link = document.createElement('a');
      link.download = `${eventId}-boarding-pass-${teamId}.png`;
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
          maxWidth: 380,
          width: '100%',
          background: '#0a0a0f',
          border: '1px solid rgba(198,169,105,0.3)',
          borderRadius: '1.25rem',
          position: 'relative',
          boxShadow: '0 15px 40px -15px rgba(198,169,105,0.2)',
          WebkitTextFillColor: 'unset',
          overflow: 'hidden',
        }}
      >
        {/* Top Header - Airline style */}
        <div style={{ 
          background: 'rgba(198,169,105,0.1)', 
          padding: '1.25rem 1.5rem', 
          borderBottom: '1px solid rgba(198,169,105,0.15)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center'
        }}>
          <div>
            <h2 style={{ ...txt('#C6A969'), fontFamily: "'JetBrains Mono', monospace", fontSize: '0.85rem', fontWeight: 700, margin: 0, textTransform: 'uppercase', letterSpacing: '0.15em' }}>
              BOARDING PASS
            </h2>
            <p style={{ ...txt('rgba(198,169,105,0.6)'), fontFamily: "'JetBrains Mono', monospace", fontSize: '0.55rem', margin: '4px 0 0', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              EVENTRA PREMIUM CLASS
            </p>
          </div>
          <div style={{ padding: '0.5rem', background: 'rgba(198,169,105,0.15)', borderRadius: '0.5rem' }}>
            {/* Using Ticket icon to conceptually represent the pass */}
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#C6A969" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 6L2 6M22 10L2 10M22 14L2 14M22 18L2 18" strokeDasharray="2 4"/>
              <rect x="2" y="4" width="20" height="16" rx="2" ry="2"/>
            </svg>
          </div>
        </div>

        <div style={{ padding: '1.5rem 1.5rem 0' }}>
          {/* Flight Route / Event Name */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', marginBottom: '1.5rem' }}>
            <span style={{ ...txt('#888'), fontFamily: "'JetBrains Mono', monospace", fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.12em' }}>
              DESTINATION EVENT
            </span>
            <h1 style={{ ...txt('#EAEAEA'), fontFamily: "'Crimson Pro', Georgia, serif", fontSize: '1.8rem', fontWeight: 700, margin: 0, lineHeight: 1.1 }}>
              {eventDetails.eventName}
            </h1>
          </div>

          {/* Grid of Flight Info */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem 0', marginBottom: '1.5rem' }}>
            <div>
              <p style={{ ...txt('#888'), fontFamily: "'JetBrains Mono', monospace", fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.12em', margin: '0 0 4px' }}>PASSENGER / TEAM</p>
              <p style={{ ...txt('#C6A969'), fontFamily: "'JetBrains Mono', monospace", fontSize: '1.1rem', fontWeight: 700, margin: 0 }}>
                {team.teamName}
              </p>
            </div>
            <div>
              <p style={{ ...txt('#888'), fontFamily: "'JetBrains Mono', monospace", fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.12em', margin: '0 0 4px' }}>CAPTAIN</p>
              <p style={{ ...txt('#EAEAEA'), fontFamily: "'JetBrains Mono', monospace", fontSize: '0.9rem', fontWeight: 700, margin: 0 }}>
                {team.leader}
              </p>
            </div>
            
            <div>
              <p style={{ ...txt('#888'), fontFamily: "'JetBrains Mono', monospace", fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.12em', margin: '0 0 4px' }}>DEPARTURE DATE</p>
              <p style={{ ...txt('#EAEAEA'), fontFamily: "'JetBrains Mono', monospace", fontSize: '0.8rem', margin: 0 }}>
                {eventDetails.dateTime ? formatDate(eventDetails.dateTime) : 'TBA'}
              </p>
            </div>
            <div>
              <p style={{ ...txt('#888'), fontFamily: "'JetBrains Mono', monospace", fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.12em', margin: '0 0 4px' }}>GATE / VENUE</p>
              <p style={{ ...txt('#EAEAEA'), fontFamily: "'JetBrains Mono', monospace", fontSize: '0.8rem', margin: 0 }}>
                {eventDetails.venue || 'TBA'}
              </p>
            </div>

            <div>
              <p style={{ ...txt('#888'), fontFamily: "'JetBrains Mono', monospace", fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.12em', margin: '0 0 4px' }}>ADMITTANCE</p>
              <p style={{ ...txt('#EAEAEA'), fontFamily: "'JetBrains Mono', monospace", fontSize: '0.8rem', margin: 0 }}>
                {team.members.length} Member{team.members.length !== 1 ? 's' : ''}
              </p>
            </div>
            <div>
              <p style={{ ...txt('#888'), fontFamily: "'JetBrains Mono', monospace", fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.12em', margin: '0 0 4px' }}>TICKET REF</p>
              <p style={{ ...txt('#C6A969'), fontFamily: "'JetBrains Mono', monospace", fontSize: '0.8rem', margin: 0 }}>
                {qrValue.split('-').pop()}
              </p>
            </div>
          </div>
        </div>

        {/* Separator with cutouts */}
        <div style={{ position: 'relative', height: '2rem', display: 'flex', alignItems: 'center' }}>
          <div style={{ position: 'absolute', left: '-1rem', width: '2rem', height: '2rem', borderRadius: '50%', background: '#050505', border: '1px solid rgba(198,169,105,0.3)', borderLeftColor: 'transparent', borderTopColor: 'transparent', borderBottomColor: 'transparent', zIndex: 1, boxShadow: 'inset -2px 0 5px rgba(0,0,0,0.5)' }}></div>
          <div style={{ flex: 1, borderTop: '2px dashed rgba(198,169,105,0.2)' }}></div>
          <div style={{ position: 'absolute', right: '-1rem', width: '2rem', height: '2rem', borderRadius: '50%', background: '#050505', border: '1px solid rgba(198,169,105,0.3)', borderRightColor: 'transparent', borderTopColor: 'transparent', borderBottomColor: 'transparent', zIndex: 1, boxShadow: 'inset 2px 0 5px rgba(0,0,0,0.5)' }}></div>
        </div>

        {/* Bottom Stub - QR Code */}
        <div style={{ padding: '0 1.5rem 1.5rem', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <p style={{ ...txt('#888'), fontFamily: "'JetBrains Mono', monospace", fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: '1rem' }}>
            SCAN AT GATE
          </p>
          <div style={{ background: 'rgba(26,26,26,0.7)', border: '1px solid rgba(198,169,105,0.3)', padding: '0.75rem', borderRadius: '0.75rem', display: 'inline-block', boxShadow: 'inset 0 0 15px rgba(0,0,0,0.5)' }}>
            <QRCodeDisplay value={qrValue} teamId={teamId} size={140} />
          </div>
          <p style={{ ...txt('rgba(255,255,255,0.2)'), fontFamily: "'JetBrains Mono', monospace", fontSize: '0.55rem', textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: '1rem', marginBottom: 0 }}>
            {qrValue}
          </p>
        </div>
      </div>

      <button
        className="ev-btn ev-btn-primary ev-btn-full"
        onClick={handleDownload}
        disabled={downloading}
        style={{ maxWidth: 380 }}
      >
        {downloading ? <LoadingSpinner size="sm" /> : <><Download size={15} /> Save Boarding Pass</>}
      </button>
    </div>
  );
};
