import React, { useRef, useState } from 'react';
import { Download, Copy, CheckCheck, Calendar, MapPin, Users } from 'lucide-react';
import { QRCodeCanvas } from 'qrcode.react';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { copyToClipboard } from '@/lib/utils';
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

// Text style helper to ensure html2canvas captures explicit text colors
const txt = (color: string, extra: React.CSSProperties = {}): React.CSSProperties => ({
  color,
  WebkitTextFillColor: color,
  ...extra,
});

function formatPassDate(dateStr?: string): string {
  if (!dateStr) return 'TBA';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const day = String(d.getDate()).padStart(2, '0');
    const month = d.toLocaleString('en-US', { month: 'short' }).toUpperCase();
    const year = d.getFullYear();
    return `${day} ${month} ${year}`;
  } catch {
    return dateStr || 'TBA';
  }
}

function formatPassTime(dateStr?: string): string {
  if (!dateStr) return 'TBA';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return 'TBA';
    return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
  } catch {
    return 'TBA';
  }
}

// Minimal vector barcode
const MinimalBarcode: React.FC = () => {
  const bars = [
    2, 1, 3, 1, 1, 2, 4, 1, 2, 1, 3, 2, 1, 4, 1, 2, 1, 3, 1, 2,
    4, 1, 1, 3, 2, 1, 2, 4, 1, 3, 1, 2, 1, 1, 3, 2, 4, 1, 2, 1,
    3, 1, 2, 4, 1, 1, 2, 3, 1, 4, 2, 1, 3, 1, 2, 1, 4, 2, 1, 3,
  ];
  return (
    <svg width="180" height="24" viewBox="0 0 180 24" style={{ display: 'block', opacity: 0.65 }}>
      {bars.map((w, idx) => {
        const x = idx * 3;
        return (
          <rect key={idx} x={x} y="0" width={w * 0.6} height="24" fill="#C6A969" />
        );
      })}
    </svg>
  );
};

export const TicketCard: React.FC<TicketCardProps> = ({
  eventId,
  teamId,
  team,
  eventDetails,
  qrValue,
}) => {
  const [downloading, setDownloading] = useState(false);
  const [copied, setCopied] = useState(false);
  const ticketRef = useRef<HTMLDivElement>(null);

  const passDate = formatPassDate(eventDetails.dateTime);
  const passTime = formatPassTime(eventDetails.dateTime);

  const handleDownload = async () => {
    if (!ticketRef.current || downloading) return;
    setDownloading(true);
    try {
      await document.fonts.ready;
      const canvas = await html2canvas(ticketRef.current, {
        scale: 2.5,
        backgroundColor: '#0a0a0f',
        useCORS: true,
        logging: false,
      });
      const link = document.createElement('a');
      link.download = `${eventId}-pass-${teamId}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (err) {
      console.error('Failed to download pass:', err);
    } finally {
      setDownloading(false);
    }
  };

  const handleCopy = async () => {
    await copyToClipboard(teamId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.25rem', width: '100%' }}>
      {/* Horizontal Scroll wrapper for mobile */}
      <div style={{
        width: '100%',
        overflowX: 'auto',
        WebkitOverflowScrolling: 'touch',
        padding: '4px 2px 12px',
        display: 'flex',
        justifyContent: 'center',
      }}>
        {/* Minimal Horizontal Pass */}
        <div
          ref={ticketRef}
          style={{
            width: 820,
            minWidth: 820,
            background: '#0d1117',
            border: '1px solid rgba(198,169,105,0.3)',
            borderRadius: 18,
            position: 'relative',
            boxShadow: '0 20px 50px -15px rgba(0,0,0,0.8), 0 0 25px rgba(198,169,105,0.08)',
            WebkitTextFillColor: 'unset',
            overflow: 'hidden',
            display: 'flex',
          }}
        >
          {/* ============================================================ */}
          {/* LEFT SECTION: MAIN EVENT PASS (70% width) */}
          {/* ============================================================ */}
          <div style={{ flex: '1 1 560px', display: 'flex', flexDirection: 'column' }}>
            {/* Top Minimal Header */}
            <div style={{
              background: 'rgba(198,169,105,0.06)',
              padding: '12px 24px',
              borderBottom: '1px solid rgba(198,169,105,0.15)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{
                  ...txt('#C6A969'),
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  letterSpacing: '0.12em',
                }}>
                  EVENTRA
                </span>
                <span style={{ color: '#444' }}>·</span>
                <span style={{
                  ...txt('#888'),
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: '0.62rem',
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                }}>
                  EVENT PASS
                </span>
              </div>

              <div style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: '0.68rem',
                ...txt('#C6A969'),
                letterSpacing: '0.06em',
              }}>
                REF: {teamId}
              </div>
            </div>

            {/* Event Name & Headline */}
            <div style={{ padding: '18px 24px 14px', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
              <p style={{
                ...txt('#64748b'),
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: '0.55rem',
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                margin: '0 0 4px',
              }}>
                EVENT
              </p>
              <h1 style={{
                ...txt('#eaeaea'),
                fontFamily: "'Crimson Pro', Georgia, serif",
                fontSize: '1.75rem',
                fontWeight: 700,
                lineHeight: 1.15,
                margin: 0,
              }}>
                {eventDetails.eventName}
              </h1>
            </div>

            {/* Event Metadata Grid */}
            <div style={{
              padding: '16px 24px',
              display: 'grid',
              gridTemplateColumns: '1.4fr 1.2fr 1fr 1fr',
              gap: '12px 16px',
              flex: 1,
            }}>
              <div>
                <p style={{ ...txt('#64748b'), fontFamily: "'JetBrains Mono', monospace", fontSize: '0.52rem', textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 0 3px' }}>
                  TEAM / ATTENDEE
                </p>
                <p style={{ ...txt('#C6A969'), fontFamily: "'JetBrains Mono', monospace", fontSize: '0.95rem', fontWeight: 700, margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {team.teamName}
                </p>
                <p style={{ ...txt('#888'), fontFamily: "'JetBrains Mono', monospace", fontSize: '0.62rem', margin: '2px 0 0' }}>
                  Lead: {team.leader}
                </p>
              </div>

              <div>
                <p style={{ ...txt('#64748b'), fontFamily: "'JetBrains Mono', monospace", fontSize: '0.52rem', textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 0 3px' }}>
                  DATE & TIME
                </p>
                <p style={{ ...txt('#eaeaea'), fontFamily: "'JetBrains Mono', monospace", fontSize: '0.8rem', fontWeight: 600, margin: 0 }}>
                  {passDate}
                </p>
                <p style={{ ...txt('#888'), fontFamily: "'JetBrains Mono', monospace", fontSize: '0.65rem', margin: '2px 0 0' }}>
                  {passTime}
                </p>
              </div>

              <div>
                <p style={{ ...txt('#64748b'), fontFamily: "'JetBrains Mono', monospace", fontSize: '0.52rem', textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 0 3px' }}>
                  VENUE
                </p>
                <p style={{ ...txt('#eaeaea'), fontFamily: "'JetBrains Mono', monospace", fontSize: '0.8rem', fontWeight: 600, margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {eventDetails.venue || 'TBA'}
                </p>
              </div>

              <div>
                <p style={{ ...txt('#64748b'), fontFamily: "'JetBrains Mono', monospace", fontSize: '0.52rem', textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 0 3px' }}>
                  ADMITTANCE
                </p>
                <p style={{ ...txt('#4ADE80'), fontFamily: "'JetBrains Mono', monospace", fontSize: '0.8rem', fontWeight: 700, margin: 0 }}>
                  {team.members.length} Member{team.members.length !== 1 ? 's' : ''}
                </p>
              </div>
            </div>

            {/* Bottom Barcode Footer */}
            <div style={{
              background: 'rgba(0,0,0,0.25)',
              padding: '10px 24px',
              borderTop: '1px solid rgba(255,255,255,0.03)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 16,
            }}>
              <MinimalBarcode />
              <p style={{
                ...txt('#64748b'),
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: '0.52rem',
                letterSpacing: '0.06em',
                margin: 0,
                textTransform: 'uppercase',
              }}>
                OFFICIAL ENTRY PASS · PRESENT AT GATE FOR CHECK-IN
              </p>
            </div>
          </div>

          {/* ============================================================ */}
          {/* VERTICAL PERFORATION WITH NOTCHES */}
          {/* ============================================================ */}
          <div style={{
            position: 'relative',
            width: 0,
            borderLeft: '2px dashed rgba(198,169,105,0.25)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            alignItems: 'center',
            zIndex: 3,
          }}>
            {/* Top Cutout Notch */}
            <div style={{
              position: 'absolute',
              top: -13,
              left: -13,
              width: 26,
              height: 26,
              borderRadius: '50%',
              background: '#0a0a0f',
              border: '1px solid rgba(198,169,105,0.3)',
              boxShadow: 'inset 0 2px 5px rgba(0,0,0,0.8)',
              zIndex: 4,
            }} />

            {/* Bottom Cutout Notch */}
            <div style={{
              position: 'absolute',
              bottom: -13,
              left: -13,
              width: 26,
              height: 26,
              borderRadius: '50%',
              background: '#0a0a0f',
              border: '1px solid rgba(198,169,105,0.3)',
              boxShadow: 'inset 0 -2px 5px rgba(0,0,0,0.8)',
              zIndex: 4,
            }} />
          </div>

          {/* ============================================================ */}
          {/* RIGHT SECTION: STUB WITH QR CODE (30% width) */}
          {/* ============================================================ */}
          <div style={{
            width: 260,
            minWidth: 260,
            background: 'rgba(255,255,255,0.015)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}>
            {/* Stub Header */}
            <div style={{
              background: 'rgba(198,169,105,0.06)',
              padding: '12px 16px',
              borderBottom: '1px solid rgba(198,169,105,0.15)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}>
              <span style={{
                ...txt('#C6A969'),
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: '0.68rem',
                fontWeight: 700,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
              }}>
                CHECK-IN STUB
              </span>
              <span style={{
                ...txt('#888'),
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: '0.55rem',
              }}>
                {eventId}
              </span>
            </div>

            {/* Stub Body - Pure Minimal QR Only */}
            <div style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '16px',
            }}>
              {/* Crisp Black-on-White High-Contrast QR Code */}
              <div style={{
                background: '#FFFFFF',
                padding: '10px',
                borderRadius: '14px',
                boxShadow: '0 8px 24px rgba(0,0,0,0.6)',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <QRCodeCanvas
                  value={qrValue}
                  size={120}
                  bgColor="#FFFFFF"
                  fgColor="#000000"
                  level="M"
                  marginSize={1}
                />
              </div>
            </div>

            {/* Stub Footer */}
            <div style={{
              background: 'rgba(0,0,0,0.25)',
              padding: '8px 16px',
              borderTop: '1px solid rgba(255,255,255,0.03)',
              textAlign: 'center',
            }}>
              <span style={{
                ...txt('#64748b'),
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: '0.52rem',
                letterSpacing: '0.06em',
              }}>
                KEEP THIS STUB FOR ENTRY
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons Below Pass */}
      <div style={{ display: 'flex', gap: 10, width: '100%', maxWidth: 380 }}>
        <button
          className="ev-btn ev-btn-primary"
          onClick={handleDownload}
          disabled={downloading}
          style={{ flex: 1.2, justifyContent: 'center', gap: 8 }}
        >
          {downloading ? <LoadingSpinner size="sm" /> : <><Download size={15} /> Save Pass</>}
        </button>

        <button
          className="ev-btn ev-btn-secondary"
          onClick={handleCopy}
          style={{ flex: 1, justifyContent: 'center', gap: 6 }}
        >
          {copied ? <CheckCheck size={14} /> : <Copy size={14} />}
          {copied ? 'Copied!' : 'Copy ID'}
        </button>
      </div>
    </div>
  );
};
