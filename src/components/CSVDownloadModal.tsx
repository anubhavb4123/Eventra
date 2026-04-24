import React, { useEffect, useRef } from 'react';
import { haptic } from '@/lib/haptics';
import {
  exportAllDetailsCSV, exportRoundQualifiedCSV, exportDayAttendanceCSV,
} from '@/lib/utils';
import {
  Download, X, FileSpreadsheet, Trophy, CalendarDays, Database,
} from 'lucide-react';
import '@/styles/eventra-shared.css';

export interface CSVDownloadOption {
  id: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  count: number;
  onDownload: () => void;
}

interface CSVDownloadModalProps {
  open: boolean;
  onClose: () => void;
  options: CSVDownloadOption[];
  eventName?: string;
}

export const CSVDownloadModal: React.FC<CSVDownloadModalProps> = ({
  open, onClose, options, eventName,
}) => {
  const overlayRef = useRef<HTMLDivElement>(null);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);

  // Close on overlay click
  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === overlayRef.current) onClose();
  };

  if (!open) return null;

  return (
    <div
      ref={overlayRef}
      onClick={handleOverlayClick}
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: 'rgba(0,0,0,0.65)',
        backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '1.5rem',
        animation: 'ev-modal-fade-in 0.2s ease forwards',
      }}
    >
      <div
        style={{
          width: '100%', maxWidth: 480,
          background: '#111118',
          border: '1px solid rgba(198,169,105,0.2)',
          borderRadius: 20,
          boxShadow: '0 25px 80px rgba(0,0,0,0.5), 0 0 60px rgba(198,169,105,0.04)',
          animation: 'ev-modal-scale-in 0.25s ease forwards',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div style={{
          padding: '20px 24px 16px',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 40, height: 40, borderRadius: 12,
              background: 'rgba(198,169,105,0.08)', border: '1px solid rgba(198,169,105,0.2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <FileSpreadsheet size={20} color="#C6A969" />
            </div>
            <div>
              <h3 style={{
                fontFamily: "'Crimson Pro', Georgia, serif",
                fontSize: '1.3rem', fontWeight: 700, color: '#eaeaea', margin: 0,
              }}>
                Download CSV
              </h3>
              <p style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: '0.68rem', color: '#555', margin: '2px 0 0',
              }}>
                {eventName ? `${eventName} — ` : ''}Choose a dataset
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              width: 34, height: 34, borderRadius: 10,
              background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', color: '#555', transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(248,113,113,0.1)'; e.currentTarget.style.borderColor = 'rgba(248,113,113,0.3)'; e.currentTarget.style.color = '#F87171'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = '#555'; }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Options list */}
        <div style={{ padding: '12px 16px 20px', display: 'flex', flexDirection: 'column', gap: 6, maxHeight: '60vh', overflowY: 'auto' }}>
          {options.map((opt, idx) => (
            <button
              key={opt.id}
              id={`csv-download-${opt.id}`}
              onClick={() => {
                haptic.medium();
                opt.onDownload();
                onClose();
              }}
              style={{
                display: 'flex', alignItems: 'center', gap: 14,
                padding: '14px 16px', borderRadius: 14,
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid rgba(255,255,255,0.06)',
                cursor: 'pointer', textAlign: 'left',
                transition: 'all 0.2s',
                animation: `ev-fade-up 0.3s ease ${idx * 0.05}s both`,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = `${opt.color}08`;
                e.currentTarget.style.borderColor = `${opt.color}30`;
                e.currentTarget.style.transform = 'translateY(-1px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.02)';
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              {/* Icon */}
              <div style={{
                width: 40, height: 40, borderRadius: 12, flexShrink: 0,
                background: `${opt.color}12`, border: `1px solid ${opt.color}25`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: opt.color,
              }}>
                {opt.icon}
              </div>

              {/* Text */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{
                  fontFamily: "'Crimson Pro', Georgia, serif",
                  fontSize: '1.05rem', fontWeight: 700, color: '#eaeaea',
                  margin: 0, lineHeight: 1.2,
                }}>
                  {opt.label}
                </p>
                <p style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: '0.68rem', color: '#555', margin: '3px 0 0',
                }}>
                  {opt.description}
                </p>
              </div>

              {/* Count badge + download icon */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                <span style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: '0.72rem', fontWeight: 700,
                  color: opt.color,
                  padding: '3px 10px', borderRadius: 20,
                  background: `${opt.color}12`, border: `1px solid ${opt.color}25`,
                }}>
                  {opt.count}
                </span>
                <Download size={14} color="#444" />
              </div>
            </button>
          ))}
        </div>

        {/* Footer */}
        <div style={{
          padding: '12px 20px',
          borderTop: '1px solid rgba(255,255,255,0.04)',
          textAlign: 'center',
        }}>
          <p style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: '0.62rem', color: '#333', margin: 0,
          }}>
            Files are exported as .csv — open in Excel, Google Sheets, or any spreadsheet app
          </p>
        </div>
      </div>

      {/* Keyframe animations (injected inline) */}
      <style>{`
        @keyframes ev-modal-fade-in {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes ev-modal-scale-in {
          from { opacity: 0; transform: scale(0.92) translateY(10px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>
    </div>
  );
};

// ── Helper: Build options array from teams + settings ───────────

export function buildCSVOptions(
  teams: Array<{ id: string } & import('@/types').Team>,
  eventId: string,
  totalRounds: number,
  totalDays: number,
): CSVDownloadOption[] {
  const options: CSVDownloadOption[] = [];

  // 1. All Details
  options.push({
    id: 'all-details',
    label: 'All Details',
    description: 'Complete team data with qualifications & attendance',
    icon: <Database size={18} />,
    color: '#C6A969',
    count: teams.length,
    onDownload: () => exportAllDetailsCSV(teams, eventId, totalRounds, totalDays),
  });

  // 2. Round-qualified teams (one option per round)
  for (let r = 1; r <= totalRounds; r++) {
    const qualifiedCount = teams.filter(t => t.qualifications?.[String(r)] === true).length;
    options.push({
      id: `round-${r}-qualified`,
      label: `Round ${r} Qualified`,
      description: `Teams that passed Round ${r}`,
      icon: <Trophy size={18} />,
      color: '#818CF8',
      count: qualifiedCount,
      onDownload: () => exportRoundQualifiedCSV(teams, eventId, r),
    });
  }

  // 3. Day attendance (one option per day)
  for (let d = 1; d <= totalDays; d++) {
    const presentCount = teams.filter(t => t.dayAttendance?.[String(d)]?.marked).length;
    options.push({
      id: `day-${d}-present`,
      label: `Day ${d} Present`,
      description: `Teams present on Day ${d}`,
      icon: <CalendarDays size={18} />,
      color: d === 1 ? '#4ADE80' : d === 2 ? '#60A5FA' : '#F472B6',
      count: presentCount,
      onDownload: () => exportDayAttendanceCSV(teams, eventId, d),
    });
  }

  return options;
}
