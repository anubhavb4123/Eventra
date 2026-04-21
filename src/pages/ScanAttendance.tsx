import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { ref, get, update } from 'firebase/database';
import { db } from '@/lib/firebase';
import { withRetry } from '@/lib/db-retry';
import { haptic } from '@/lib/haptics';
import type { TeamWithId } from '@/types';
import { GlassCard } from '@/components/GlassCard';
import { QRScanner } from '@/components/QRScanner';
import { SuccessAnimation } from '@/components/SuccessAnimation';
import { Button } from '@/components/Button';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { StatusBadge } from '@/components/StatusBadge';
import { AlertCircle, ScanLine, RefreshCw, Users, CheckSquare, CalendarDays } from 'lucide-react';
import '@/styles/eventra-shared.css';

type ScanState = 'scanning' | 'loading' | 'found' | 'duplicate' | 'error' | 'success';

export const ScanAttendance: React.FC = () => {
  const { eventId } = useParams<{ eventId: string }>();

  // Day config loaded from Firebase eventSettings
  const [currentDay, setCurrentDay] = useState(1);
  const [totalDays, setTotalDays] = useState(1);
  const [configLoading, setConfigLoading] = useState(true);

  const [scanState, setScanState] = useState<ScanState>('scanning');
  const [team, setTeam] = useState<TeamWithId | null>(null);
  const [memberPresence, setMemberPresence] = useState<boolean[]>([]);
  const [errorMsg, setErrorMsg] = useState('');
  const [saving, setSaving] = useState(false);
  const [manualId, setManualId] = useState('');

  // Load day config on mount
  useEffect(() => {
    if (!eventId) return;
    const load = async () => {
      try {
        const snap = await withRetry(() => get(ref(db, `events/${eventId}/eventSettings`)));
        if (snap.exists()) {
          const s = snap.val();
          setCurrentDay(s.currentDay ?? 1);
          setTotalDays(s.numberOfDays ?? 1);
        }
      } catch (err) {
        console.error('Failed to load event settings:', err);
      } finally {
        setConfigLoading(false);
      }
    };
    load();
  }, [eventId]);

  const handleScanSuccess = async (decoded: string) => {
    if (scanState !== 'scanning') return;
    setScanState('loading');
    try {
      const parts = decoded.split('|');
      if (parts.length !== 2) {
        setErrorMsg('Invalid QR code format. Expected eventId|teamId.');
        haptic.error();
        setScanState('error'); return;
      }
      const [scannedEventId, scannedTeamId] = parts;
      const teamCode = scannedTeamId.split('-').pop() || scannedTeamId;

      if (scannedEventId !== eventId) {
        setErrorMsg(`QR belongs to a different event: "${scannedEventId}".`);
        haptic.error();
        setScanState('error'); return;
      }

      const teamSnap = await withRetry(() => get(ref(db, `events/${scannedEventId}/teams/${teamCode}`)));
      if (!teamSnap.exists()) {
        setErrorMsg(`Team "${scannedTeamId}" not found in database.`);
        haptic.error();
        setScanState('error'); return;
      }
      const teamData = { id: scannedTeamId, ...teamSnap.val() } as TeamWithId;

      // Check if attendance for THIS day is already marked
      const dayKey = String(currentDay);
      if (teamData.dayAttendance?.[dayKey]?.marked) {
        setTeam(teamData);
        haptic.light();
        setScanState('duplicate');
        return;
      }

      setTeam(teamData);
      setMemberPresence(teamData.members.map(() => true));
      haptic.light();
      setScanState('found');
    } catch (err) {
      console.error('Scan Error:', err);
      setErrorMsg('Failed to fetch team data. Check your connection.');
      haptic.error();
      setScanState('error');
    }
  };

  const handleMarkAttendance = async () => {
    if (!team || !eventId) return;
    setSaving(true);
    try {
      const updatedMembers = team.members.map((m, i) => ({ ...m, present: memberPresence[i] }));
      const teamCode = team.id.split('-').pop() || team.id;
      const dayKey = String(currentDay);

      const updates: Record<string, unknown> = {
        [`dayAttendance/${dayKey}/marked`]: true,
        [`dayAttendance/${dayKey}/members`]: updatedMembers,
        [`dayAttendance/${dayKey}/markedAt`]: Date.now(),
      };

      // Keep legacy attendanceMarked in sync for Day 1
      if (currentDay === 1) {
        updates.attendanceMarked = true;
        updates.members = updatedMembers;
      }

      await withRetry(() => update(ref(db, `events/${eventId}/teams/${teamCode}`), updates));
      haptic.success();
      setScanState('success');
    } catch (err) {
      console.error('Attendance Save Error:', err);
      setErrorMsg('Failed to save attendance. Please try again.');
      haptic.error();
      setScanState('error');
    } finally {
      setSaving(false);
    }
  };

  const resetScan = () => {
    setTeam(null); setMemberPresence([]); setErrorMsg(''); setScanState('scanning');
  };
  const toggleMember = (i: number) => {
    haptic.light();
    setMemberPresence(p => p.map((v, idx) => idx === i ? !v : v));
  };

  // Day colour
  const dayColor = currentDay === 1 ? '#4ADE80' : currentDay === 2 ? '#60A5FA' : '#F472B6';

  if (configLoading) {
    return (
      <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <LoadingSpinner text="Loading event configuration..." />
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 620, margin: '0 auto', padding: '3rem 1.5rem' }}>

      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
        <div style={{
          width: 64, height: 64, borderRadius: 16, margin: '0 auto 1.5rem',
          background: 'rgba(74,222,128,0.08)', border: '1px solid rgba(74,222,128,0.2)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 0 30px rgba(74,222,128,0.08)',
        }}>
          <ScanLine size={26} color="#4ADE80" />
        </div>
        <div className="ev-section-label" style={{ marginBottom: 10 }}>ORGANIZER TOOL · ATTENDANCE SCANNER</div>
        <h1 style={{ fontFamily: "'Crimson Pro', Georgia, serif", fontSize: 'clamp(2rem,5vw,2.8rem)', fontWeight: 700, color: '#eaeaea', marginBottom: '0.75rem', lineHeight: 1.1 }}>
          Scan Attendance
        </h1>

        {/* Day badge */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, flexWrap: 'wrap' }}>
          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.75rem', color: '#555' }}>
            Event: <span style={{ color: '#C6A969' }}>{eventId}</span>
          </span>
          <span style={{ color: '#2a2a2a' }}>·</span>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            padding: '4px 14px', borderRadius: 20,
            background: `${dayColor}12`, border: `1px solid ${dayColor}35`,
          }}>
            <CalendarDays size={11} color={dayColor} />
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.72rem', color: dayColor, fontWeight: 700 }}>
              Day {currentDay} of {totalDays}
            </span>
          </div>
        </div>
      </div>

      {/* SCANNING */}
      {scanState === 'scanning' && (
        <GlassCard>
          <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.75rem', color: '#555', textAlign: 'center', marginBottom: '1.25rem' }}>
            Point the camera at a team QR code to record attendance for Day {currentDay}.
          </p>
          <QRScanner onScanSuccess={handleScanSuccess} qrboxSize={250} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '1.5rem 0' }}>
            <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.04)' }} />
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.68rem', color: '#444', letterSpacing: '0.1em' }}>OR</span>
            <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.04)' }} />
          </div>
          <form onSubmit={(e) => { e.preventDefault(); if (manualId.trim()) handleScanSuccess(`${eventId}|${manualId.trim()}`); }}
            style={{ display: 'flex', gap: 8 }}>
            <input type="text" placeholder={`e.g. ${eventId}-T01`} className="ev-input"
              value={manualId} onChange={(e) => { setManualId(e.target.value); setErrorMsg(''); }} style={{ flex: 1 }} />
            <Button type="submit" variant="secondary" style={{ flexShrink: 0 }}>Lookup</Button>
          </form>
        </GlassCard>
      )}

      {/* LOADING */}
      {scanState === 'loading' && (
        <GlassCard style={{ textAlign: 'center' }} padding="xl">
          <LoadingSpinner text="Fetching team data..." />
        </GlassCard>
      )}

      {/* FOUND — confirm member list */}
      {scanState === 'found' && team && (
        <GlassCard className="ev-scale-in">
          <div style={{ marginBottom: '1.25rem', paddingBottom: '1.25rem', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
              <div>
                <p className="ev-section-label" style={{ marginBottom: 4 }}>{team.id}</p>
                <h2 style={{ fontFamily: "'Crimson Pro', Georgia, serif", fontSize: '1.75rem', fontWeight: 700, color: '#eaeaea', margin: 0 }}>{team.teamName}</h2>
                <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.75rem', color: '#666', margin: '4px 0 0' }}>Led by {team.leader}</p>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
                <span className="ev-pill" style={{ background: `${dayColor}12`, border: `1px solid ${dayColor}30`, color: dayColor, display: 'flex', alignItems: 'center', gap: 5 }}>
                  <CalendarDays size={10} /> Day {currentDay}
                </span>
                <span className="ev-pill ev-pill-ghost" style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <Users size={11} /> {team.members.length} members
                </span>
              </div>
            </div>
          </div>

          <p className="ev-section-label" style={{ marginBottom: 10 }}>Mark attendance per member</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: '1.5rem' }}>
            {team.members.map((m, i) => (
              <div key={i} className={`ev-member-toggle${memberPresence[i] ? ' present' : ''}`} onClick={() => toggleMember(i)}>
                <div>
                  <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.82rem', color: '#eaeaea', margin: 0 }}>
                    {i === 0 ? '👑 ' : ''}{m.name}
                  </p>
                  {(m.rollNumber || m.college || m.branch) && (
                    <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.68rem', color: '#555', margin: '2px 0 0' }}>
                      {[m.rollNumber, m.college, m.branch].filter(Boolean).join(' · ')}
                    </p>
                  )}
                </div>
                <div className={`ev-member-check${memberPresence[i] ? ' checked' : ''}`}>
                  {memberPresence[i] && (
                    <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
                      <path d="M2 6L5 9L10 3" stroke="#0a0a0f" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </div>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <Button variant="ghost" onClick={resetScan} style={{ flexShrink: 0 }}>
              <RefreshCw size={13} /> Rescan
            </Button>
            <Button onClick={handleMarkAttendance} loading={saving} fullWidth icon={<CheckSquare size={14} />}>
              Confirm ({memberPresence.filter(Boolean).length}/{team.members.length} present)
            </Button>
          </div>
        </GlassCard>
      )}

      {/* DUPLICATE */}
      {scanState === 'duplicate' && team && (
        <GlassCard className="ev-scale-in" style={{ textAlign: 'center' }} padding="xl">
          <div style={{ width: 64, height: 64, borderRadius: '50%', margin: '0 auto 1.25rem', background: 'rgba(251,191,36,0.08)', border: '2px solid rgba(251,191,36,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <AlertCircle size={30} color="#FBBF24" />
          </div>
          <h3 style={{ fontFamily: "'Crimson Pro', Georgia, serif", fontSize: '1.75rem', color: '#eaeaea', marginBottom: '0.5rem' }}>Already Checked In</h3>
          <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.78rem', color: '#666', marginBottom: '0.5rem' }}>
            <span style={{ color: '#C6A969', fontWeight: 700 }}>{team.teamName}</span>
          </p>
          <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.72rem', color: '#555', marginBottom: '1.5rem' }}>
            Already marked present for Day {currentDay}.
          </p>
          <div style={{ marginBottom: '1.5rem', display: 'flex', flexDirection: 'column', gap: 6 }}>
            {(team.dayAttendance?.[String(currentDay)]?.members ?? team.members).map((m, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.8rem', color: '#ccc' }}>{m.name}</span>
                <StatusBadge status={m.present ? 'present' : 'absent'} />
              </div>
            ))}
          </div>
          <Button variant="ghost" fullWidth onClick={resetScan} icon={<ScanLine size={14} />}>Scan Another</Button>
        </GlassCard>
      )}

      {/* ERROR */}
      {scanState === 'error' && (
        <GlassCard className="ev-scale-in" style={{ textAlign: 'center' }} padding="xl">
          <div style={{ width: 64, height: 64, borderRadius: '50%', margin: '0 auto 1.25rem', background: 'rgba(248,113,113,0.08)', border: '2px solid rgba(248,113,113,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <AlertCircle size={30} color="#F87171" />
          </div>
          <h3 style={{ fontFamily: "'Crimson Pro', Georgia, serif", fontSize: '1.75rem', color: '#eaeaea', marginBottom: '0.5rem' }}>Scan Error</h3>
          <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.78rem', color: '#666', marginBottom: '1.5rem', lineHeight: 1.6 }}>{errorMsg}</p>
          <Button fullWidth onClick={resetScan} icon={<ScanLine size={14} />}>Try Again</Button>
        </GlassCard>
      )}

      {/* SUCCESS */}
      {scanState === 'success' && (
        <GlassCard className="ev-scale-in" style={{ textAlign: 'center' }} padding="xl">
          <SuccessAnimation
            message="Attendance Marked!"
            subtitle={`${team?.teamName} — ${memberPresence.filter(Boolean).length} members present · Day ${currentDay}`}
          />
          <div style={{ marginTop: '2rem' }}>
            <Button fullWidth onClick={resetScan} icon={<ScanLine size={14} />}>Scan Next Team</Button>
          </div>
        </GlassCard>
      )}
    </div>
  );
};
