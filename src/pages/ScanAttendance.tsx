import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { ref, get, update } from 'firebase/database';
import { db } from '@/lib/firebase';
import { withRetry } from '@/lib/db-retry';
import type { TeamWithId } from '@/types';
import { GlassCard } from '@/components/GlassCard';
import { QRScanner } from '@/components/QRScanner';
import { SuccessAnimation } from '@/components/SuccessAnimation';
import { Button } from '@/components/Button';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { StatusBadge } from '@/components/StatusBadge';
import { AlertCircle, ScanLine, RefreshCw, Users, CheckSquare } from 'lucide-react';

type ScanState = 'scanning' | 'loading' | 'found' | 'duplicate' | 'error' | 'success';

export const ScanAttendance: React.FC = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const [scanState, setScanState] = useState<ScanState>('scanning');
  const [team, setTeam] = useState<TeamWithId | null>(null);
  const [memberPresence, setMemberPresence] = useState<boolean[]>([]);
  const [errorMsg, setErrorMsg] = useState('');
  const [saving, setSaving] = useState(false);
  const [manualId, setManualId] = useState('');

  const handleScanSuccess = async (decoded: string) => {
    if (scanState !== 'scanning') return;
    setScanState('loading');

    try {
      const parts = decoded.split('|');
      if (parts.length !== 2) {
        setErrorMsg('Invalid QR code format. Expected eventId|teamId.');
        setScanState('error');
        return;
      }

      const [scannedEventId, scannedTeamId] = parts;
      const teamCode = scannedTeamId.split('-').pop() || scannedTeamId;

      if (scannedEventId !== eventId) {
        setErrorMsg(`QR belongs to a different event: "${scannedEventId}". Expected: "${eventId}".`);
        setScanState('error');
        return;
      }

      const teamSnap = await withRetry(() => get(ref(db, `events/${scannedEventId}/teams/${teamCode}`)));
      if (!teamSnap.exists()) {
        setErrorMsg(`Team "${scannedTeamId}" not found in database.`);
        setScanState('error');
        return;
      }

      const teamData = { id: scannedTeamId, ...teamSnap.val() } as TeamWithId;

      if (teamData.attendanceMarked) {
        setTeam(teamData);
        setScanState('duplicate');
        return;
      }

      setTeam(teamData);
      setMemberPresence(teamData.members.map(() => true)); // default all present
      setScanState('found');
    } catch (err) {
      console.error('Scan Error:', err);
      setErrorMsg('Failed to fetch team data. Check your connection.');
      setScanState('error');
    }
  };

  const handleMarkAttendance = async () => {
    if (!team || !eventId) return;
    setSaving(true);
    try {
      const updatedMembers = team.members.map((m, i) => ({
        ...m,
        present: memberPresence[i],
      }));

      const teamCode = team.id.split('-').pop() || team.id;
      await withRetry(() => update(ref(db, `events/${eventId}/teams/${teamCode}`), {
        attendanceMarked: true,
        members: updatedMembers,
      }));

      setScanState('success');
    } catch (err) {
      console.error('Attendance Save Error:', err);
      setErrorMsg('Failed to save attendance. Please try again.');
      setScanState('error');
    } finally {
      setSaving(false);
    }
  };

  const resetScan = () => {
    setTeam(null);
    setMemberPresence([]);
    setErrorMsg('');
    setScanState('scanning');
  };

  const toggleMember = (i: number) => {
    setMemberPresence((prev) => prev.map((v, idx) => idx === i ? !v : v));
  };

  return (
    <div style={{ maxWidth: 640, margin: '0 auto', padding: '3rem 1.5rem' }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
        <div style={{
          width: 64, height: 64, borderRadius: '1rem', margin: '0 auto 1.25rem',
          background: 'rgba(198,169,105,0.08)',
          border: '1px solid rgba(198,169,105,0.25)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 0 25px rgba(198,169,105,0.1)',
        }}>
          <ScanLine size={28} color="#C6A969" />
        </div>
        <h1 style={{ fontFamily: "'Crimson Pro', Georgia, serif", fontSize: '2.5rem', fontWeight: 700, color: '#EAEAEA', marginBottom: '0.5rem' }}>
          Scan Attendance
        </h1>
        <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.82rem', color: '#9A9A9A' }}>
          Event: <span style={{ color: '#C6A969' }}>{eventId}</span>
        </p>
      </div>

      {/* SCANNING STATE */}
      {scanState === 'scanning' && (
        <GlassCard>
          <div style={{ marginBottom: '1.5rem' }}>
            <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.78rem', color: '#9A9A9A', textAlign: 'center', marginBottom: '1.25rem' }}>
              Point the camera at a team's QR code to begin.
            </p>
            <QRScanner onScanSuccess={handleScanSuccess} qrboxSize={250} />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', margin: '1.5rem 0' }}>
            <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.05)' }} />
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.75rem', color: '#6a6a6a', letterSpacing: '0.1em' }}>OR</span>
            <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.05)' }} />
          </div>

          <form 
            onSubmit={(e) => {
              e.preventDefault();
              if (manualId.trim()) handleScanSuccess(`${eventId}|${manualId.trim()}`);
            }}
            style={{ display: 'flex', gap: '0.5rem' }}
          >
            <input 
              type="text"
              placeholder={`e.g. ${eventId}-T01`}
              className="input-field"
              value={manualId}
              onChange={(e) => {
                setManualId(e.target.value);
                setErrorMsg('');
              }}
              style={{ flex: 1 }}
            />
            <Button type="submit" variant="secondary" style={{ flexShrink: 0 }}>
              Lookup
            </Button>
          </form>
        </GlassCard>
      )}

      {/* LOADING STATE */}
      {scanState === 'loading' && (
        <GlassCard style={{ textAlign: 'center', padding: '3rem' }}>
          <LoadingSpinner text="Fetching team data..." />
        </GlassCard>
      )}

      {/* FOUND STATE */}
      {scanState === 'found' && team && (
        <GlassCard className="animate-scale-in">
          {/* Team info */}
          <div style={{ marginBottom: '1.5rem', paddingBottom: '1.25rem', borderBottom: '1px solid rgba(198,169,105,0.1)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
              <div>
                <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.7rem', color: '#6a6a6a', marginBottom: '0.25rem' }}>
                  {team.id}
                </p>
                <h2 style={{ fontFamily: "'Crimson Pro', Georgia, serif", fontSize: '1.75rem', fontWeight: 700, color: '#EAEAEA', margin: 0 }}>
                  {team.teamName}
                </h2>
                <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.78rem', color: '#9A9A9A', margin: '0.25rem 0 0' }}>
                  Led by {team.leader}
                </p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Users size={14} color="#9A9A9A" />
                <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.78rem', color: '#9A9A9A' }}>
                  {team.members.length} members
                </span>
              </div>
            </div>
          </div>

          {/* Member checkboxes */}
          <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.72rem', color: '#6a6a6a', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '1rem' }}>
            Mark attendance per member
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1.5rem' }}>
            {team.members.map((m, i) => (
              <div
                key={i}
                onClick={() => toggleMember(i)}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '0.75rem 1rem', borderRadius: '0.75rem', cursor: 'pointer',
                  background: memberPresence[i] ? 'rgba(74,222,128,0.07)' : 'rgba(255,255,255,0.03)',
                  border: memberPresence[i] ? '1px solid rgba(74,222,128,0.25)' : '1px solid rgba(255,255,255,0.06)',
                  transition: 'all 0.2s ease',
                }}
              >
                <div>
                  <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.85rem', color: '#EAEAEA', margin: 0 }}>
                    {i === 0 ? '👑 ' : ''}{m.name}
                  </p>
                  {(m.rollNumber || m.college || m.branch) && (
                    <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.7rem', color: '#6a6a6a', margin: '0.15rem 0 0' }}>
                      {[m.rollNumber, m.college, m.branch].filter(Boolean).join(' · ')}
                    </p>
                  )}
                </div>
                <div style={{
                  width: 22, height: 22, borderRadius: '0.35rem', flexShrink: 0,
                  background: memberPresence[i] ? '#4ADE80' : 'transparent',
                  border: memberPresence[i] ? '2px solid #4ADE80' : '2px solid rgba(255,255,255,0.2)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'all 0.2s ease',
                }}>
                  {memberPresence[i] && (
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                      <path d="M2 6L5 9L10 3" stroke="#1A1A1A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <Button
              variant="secondary"
              onClick={resetScan}
              style={{ flex: '0 0 auto' }}
            >
              <RefreshCw size={14} /> Rescan
            </Button>
            <Button
              onClick={handleMarkAttendance}
              loading={saving}
              fullWidth
              icon={<CheckSquare size={15} />}
            >
              Confirm & Mark ({memberPresence.filter(Boolean).length}/{team.members.length} present)
            </Button>
          </div>
        </GlassCard>
      )}

      {/* DUPLICATE STATE */}
      {scanState === 'duplicate' && team && (
        <GlassCard style={{ textAlign: 'center', padding: '2.5rem' }} className="animate-scale-in">
          <div style={{
            width: 64, height: 64, borderRadius: '50%', margin: '0 auto 1.25rem',
            background: 'rgba(251,191,36,0.1)', border: '2px solid rgba(251,191,36,0.4)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <AlertCircle size={32} color="#FBBF24" />
          </div>
          <h3 style={{ fontFamily: "'Crimson Pro', Georgia, serif", fontSize: '1.75rem', color: '#EAEAEA', marginBottom: '0.5rem' }}>
            Already Checked In
          </h3>
          <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.82rem', color: '#9A9A9A', marginBottom: '1.5rem' }}>
            <span style={{ color: '#C6A969', fontWeight: 700 }}>{team.teamName}</span> attendance was already marked.
          </p>
          <div style={{ marginBottom: '1.5rem' }}>
            {team.members.map((m, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.5rem 0' }}>
                <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.82rem', color: '#EAEAEA' }}>{m.name}</span>
                <StatusBadge status={m.present ? 'present' : 'absent'} />
              </div>
            ))}
          </div>
          <button onClick={resetScan} className="btn-secondary" style={{ width: '100%', justifyContent: 'center' }}>
            <ScanLine size={14} /> Scan Another
          </button>
        </GlassCard>
      )}

      {/* ERROR STATE */}
      {scanState === 'error' && (
        <GlassCard style={{ textAlign: 'center', padding: '2.5rem' }} className="animate-scale-in">
          <div style={{
            width: 64, height: 64, borderRadius: '50%', margin: '0 auto 1.25rem',
            background: 'rgba(248,113,113,0.1)', border: '2px solid rgba(248,113,113,0.4)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <AlertCircle size={32} color="#F87171" />
          </div>
          <h3 style={{ fontFamily: "'Crimson Pro', Georgia, serif", fontSize: '1.75rem', color: '#EAEAEA', marginBottom: '0.5rem' }}>
            Scan Error
          </h3>
          <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.8rem', color: '#9A9A9A', marginBottom: '1.5rem' }}>
            {errorMsg}
          </p>
          <button onClick={resetScan} className="btn-primary" style={{ margin: '0 auto', display: 'flex' }}>
            <ScanLine size={14} /> Try Again
          </button>
        </GlassCard>
      )}

      {/* SUCCESS STATE */}
      {scanState === 'success' && (
        <GlassCard style={{ textAlign: 'center', padding: '3rem' }} className="animate-scale-in">
          <SuccessAnimation
            message="Attendance Marked!"
            subtitle={`${team?.teamName} — ${memberPresence.filter(Boolean).length} members marked present`}
          />
          <div style={{ marginTop: '2rem' }}>
            <button onClick={resetScan} className="btn-primary" style={{ margin: '0 auto', display: 'flex' }}>
              <ScanLine size={14} /> Scan Next Team
            </button>
          </div>
        </GlassCard>
      )}
    </div>
  );
};
