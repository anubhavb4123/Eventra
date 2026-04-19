import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ref, get } from 'firebase/database';
import { db } from '@/lib/firebase';
import { withRetry } from '@/lib/db-retry';
import type { TeamWithId, EventDetails as EventDetailsType, DashboardStats } from '@/types';
import { exportTeamsToCSV } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';
import { GlassCard } from '@/components/GlassCard';
import { StatusBadge } from '@/components/StatusBadge';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { QRCodeDisplay } from '@/components/QRCodeDisplay';
import { EmailPanel } from '@/components/EmailPanel';
import {
  Users, UserCheck, RefreshCw, Download, ScanLine, Search,
  ChevronDown, ChevronUp, Settings, AlertCircle, Copy,
  CheckCheck, LinkIcon, LogOut, Lock, Mail,
} from 'lucide-react';
import '@/styles/eventra-shared.css';

type DashboardTab = 'teams' | 'lookup' | 'email';

export const Dashboard: React.FC = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const { logout, eventId: sessionEventId } = useAuth();

  const accessDenied = sessionEventId && eventId && sessionEventId !== eventId;

  const [tab, setTab] = useState<DashboardTab>('teams');
  const [teams, setTeams] = useState<TeamWithId[]>([]);
  const [eventDetails, setEventDetails] = useState<EventDetailsType | null>(null);
  const [stats, setStats] = useState<DashboardStats>({ totalTeams: 0, presentTeams: 0, totalMembers: 0, presentMembers: 0 });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedTeam, setExpandedTeam] = useState<string | null>(null);
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());
  const [linkCopied, setLinkCopied] = useState(false);

  const [lookupId, setLookupId] = useState('');
  const [lookupTeam, setLookupTeam] = useState<TeamWithId | null>(null);
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupError, setLookupError] = useState('');

  const registrationUrl = `${window.location.origin}/register/${eventId}`;

  const loadData = useCallback(async () => {
    if (!eventId) return;
    setLoading(true);
    try {
      const [detailsSnap, teamsSnap] = await Promise.all([
        withRetry(() => get(ref(db, `events/${eventId}/details`))),
        withRetry(() => get(ref(db, `events/${eventId}/teams`))),
      ]);
      if (detailsSnap.exists()) setEventDetails(detailsSnap.val() as EventDetailsType);
      const teamsData = teamsSnap.val();
      const teamList: TeamWithId[] = [];
      if (teamsData) {
        Object.keys(teamsData).forEach((teamCode) => {
          const tData = teamsData[teamCode];
          const fullId = tData.teamId || `${eventId}-${teamCode}`;
          teamList.push({ id: fullId, ...tData } as TeamWithId);
        });
      }
      teamList.sort((a, b) => a.id.localeCompare(b.id));
      setTeams(teamList);
      const totalMembers = teamList.reduce((acc, t) => acc + t.members.length, 0);
      const presentTeams = teamList.filter((t) => t.attendanceMarked).length;
      const presentMembers = teamList.reduce((acc, t) => acc + t.members.filter((m) => m.present).length, 0);
      setStats({ totalTeams: teamList.length, presentTeams, totalMembers, presentMembers });
      setLastRefreshed(new Date());
    } catch (err) {
      console.error('Dashboard Load Error:', err);
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleCopyLink = async () => {
    await navigator.clipboard.writeText(registrationUrl);
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2000);
  };

  const handleLogout = () => { logout(); navigate('/organizer-login'); };

  const parseEventIdFromTeam = (tid: string): string | null => {
    const match = tid.match(/^(.+)-T\d+$/);
    return match ? match[1] : null;
  };

  const handleLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = lookupId.trim();
    if (!trimmed) { setLookupError('Enter a Team ID.'); return; }
    const evId = parseEventIdFromTeam(trimmed);
    const teamCode = trimmed.split('-').pop() || trimmed;
    if (!evId) { setLookupError('Invalid Team ID format. Expected e.g. hackathon2026-T01'); return; }
    if (evId !== eventId) { setLookupError(`That team belongs to event "${evId}", not "${eventId}".`); return; }
    setLookupLoading(true);
    setLookupError('');
    setLookupTeam(null);
    try {
      const snap = await withRetry(() => get(ref(db, `events/${evId}/teams/${teamCode}`)));
      if (!snap.exists()) { setLookupError(`No team found with ID "${trimmed}".`); return; }
      setLookupTeam({ id: trimmed, ...snap.val() } as TeamWithId);
    } catch (err) {
      console.error('Lookup Error:', err);
      setLookupError('Lookup failed. Check your connection.');
    } finally {
      setLookupLoading(false);
    }
  };

  const filtered = teams.filter((t) =>
    t.teamName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.leader.toLowerCase().includes(searchTerm.toLowerCase())
  );

  /* ── Access Denied ─────────────────────────────────────────── */
  if (accessDenied) {
    return (
      <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
        <GlassCard style={{ maxWidth: 420, width: '100%', textAlign: 'center' }} padding="xl">
          <div style={{ width: 64, height: 64, borderRadius: '50%', margin: '0 auto 1.25rem', background: 'rgba(248,113,113,0.08)', border: '2px solid rgba(248,113,113,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Lock size={28} color="#F87171" />
          </div>
          <h2 style={{ fontFamily: "'Crimson Pro', Georgia, serif", fontSize: '2rem', color: '#eaeaea', marginBottom: '0.5rem' }}>Access Denied</h2>
          <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.78rem', color: '#666', marginBottom: '1.75rem', lineHeight: 1.6 }}>
            You are logged in as organizer of <span style={{ color: '#C6A969' }}>{sessionEventId}</span>,
            not <span style={{ color: '#F87171' }}>{eventId}</span>.
          </p>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="ev-btn ev-btn-secondary ev-btn-full" onClick={() => navigate(`/dashboard/${sessionEventId}`)}>
              My Dashboard
            </button>
            <button className="ev-btn ev-btn-danger" onClick={handleLogout} style={{ flexShrink: 0 }}>
              <LogOut size={14} /> Switch
            </button>
          </div>
        </GlassCard>
      </div>
    );
  }

  if (loading && teams.length === 0) {
    return (
      <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <LoadingSpinner text="Loading dashboard..." />
      </div>
    );
  }

  const attendancePct = stats.totalTeams > 0 ? Math.round((stats.presentTeams / stats.totalTeams) * 100) : 0;

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '3rem 1.5rem' }}>
      {/* ── Header ──────────────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
            <span className="ev-pill ev-pill-gold">{eventId}</span>
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.65rem', color: '#444' }}>
              Updated {lastRefreshed.toLocaleTimeString()}
            </span>
          </div>
          <h1 style={{ fontFamily: "'Crimson Pro', Georgia, serif", fontSize: 'clamp(2rem,5vw,2.75rem)', fontWeight: 700, color: '#eaeaea', lineHeight: 1.1, margin: 0 }}>
            {eventDetails?.eventName ?? 'Dashboard'}
          </h1>
        </div>

        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
          <button onClick={loadData} className="ev-btn ev-btn-ghost ev-btn-sm" style={{ gap: 6 }}>
            <RefreshCw size={12} /> Refresh
          </button>
          <button onClick={() => exportTeamsToCSV(teams, eventId!)} className="ev-btn ev-btn-ghost ev-btn-sm" style={{ gap: 6 }}>
            <Download size={12} /> CSV
          </button>
          <Link to={`/scan/${eventId}`} style={{ textDecoration: 'none' }}>
            <button className="ev-btn ev-btn-primary ev-btn-sm" style={{ gap: 6 }}>
              <ScanLine size={12} /> Scan QR
            </button>
          </Link>
          <Link to={`/event-details/${eventId}`} style={{ textDecoration: 'none' }}>
            <button className="ev-btn ev-btn-ghost ev-btn-sm" style={{ gap: 6 }}>
              <Settings size={13} />
            </button>
          </Link>
          <button onClick={handleLogout} className="ev-btn ev-btn-danger ev-btn-sm" title="Logout" style={{ gap: 6 }}>
            <LogOut size={13} />
          </button>
        </div>
      </div>

      {/* ── Registration Link ────────────────────────────────────── */}
      <GlassCard padding="sm" style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, flexShrink: 0, background: 'rgba(198,169,105,0.08)', border: '1px solid rgba(198,169,105,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <LinkIcon size={16} color="#C6A969" />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p className="ev-section-label" style={{ marginBottom: 2 }}>Registration Link — Share with participants</p>
            <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.75rem', color: '#C6A969', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {registrationUrl}
            </p>
          </div>
          <button onClick={handleCopyLink} className="ev-btn ev-btn-secondary ev-btn-sm" style={{ flexShrink: 0, gap: 6 }}>
            {linkCopied ? <CheckCheck size={13} /> : <Copy size={13} />}
            {linkCopied ? 'Copied!' : 'Copy'}
          </button>
        </div>
      </GlassCard>

      {/* ── Stats ───────────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.25rem' }}>
        {[
          { label: 'Total Teams',     value: stats.totalTeams,    icon: <Users size={18} />,     color: '#C6A969' },
          { label: 'Present Teams',   value: stats.presentTeams,  icon: <UserCheck size={18} />, color: '#4ADE80' },
          { label: 'Total Members',   value: stats.totalMembers,  icon: <Users size={18} />,     color: '#C6A969' },
          { label: 'Present Members', value: stats.presentMembers,icon: <UserCheck size={18} />, color: '#4ADE80' },
        ].map((s) => (
          <div key={s.label} className="ev-card ev-card-p-md" style={{ textAlign: 'left' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <p className="ev-section-label">{s.label}</p>
              <div style={{ width: 34, height: 34, borderRadius: 9, background: `${s.color}15`, border: `1px solid ${s.color}22`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: s.color }}>
                {s.icon}
              </div>
            </div>
            <p style={{ fontFamily: "'Crimson Pro', Georgia, serif", fontSize: '2.5rem', fontWeight: 700, color: s.color, margin: 0, lineHeight: 1 }}>
              {s.value}
            </p>
          </div>
        ))}
      </div>

      {/* ── Attendance Progress ──────────────────────────────────── */}
      {stats.totalTeams > 0 && (
        <GlassCard padding="sm" style={{ marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.72rem', color: '#555' }}>Attendance Progress</span>
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.72rem', color: '#4ADE80', fontWeight: 700 }}>{attendancePct}%</span>
          </div>
          <div className="ev-progress-track">
            <div className="ev-progress-fill" style={{ width: `${attendancePct}%` }} />
          </div>
        </GlassCard>
      )}

      {/* ── Tabs ─────────────────────────────────────────────────── */}
      <div className="ev-tabs" style={{ marginBottom: '1.5rem' }}>
        <button className={`ev-tab${tab === 'teams' ? ' active' : ''}`} onClick={() => setTab('teams')}>
          <Users size={13} /> Teams ({teams.length})
        </button>
        <button className={`ev-tab${tab === 'lookup' ? ' active' : ''}`} onClick={() => setTab('lookup')}>
          <Search size={13} /> Lookup
        </button>
        <button className={`ev-tab${tab === 'email' ? ' active' : ''}`} onClick={() => setTab('email')}>
          <Mail size={13} /> Broadcast
        </button>
      </div>

      {/* ── TEAMS TAB ────────────────────────────────────────────── */}
      {tab === 'teams' && (
        <>
          <div style={{ marginBottom: '1rem', position: 'relative' }}>
            <Search size={14} color="#444" style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)' }} />
            <input
              className="ev-input"
              style={{ paddingLeft: 38 }}
              placeholder="Search by team name, ID, or leader..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {filtered.length === 0 ? (
            <GlassCard style={{ textAlign: 'center' }} padding="xl">
              <AlertCircle size={36} color="#444" style={{ margin: '0 auto 1rem' }} />
              <p style={{ fontFamily: "'Crimson Pro', Georgia, serif", fontSize: '1.25rem', color: '#555' }}>
                {teams.length === 0 ? 'No teams registered yet.' : 'No teams match your search.'}
              </p>
            </GlassCard>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {filtered.map((team) => (
                <div
                  key={team.id}
                  className="ev-card"
                  style={{ padding: '14px 18px', cursor: 'pointer', transition: 'all 0.2s' }}
                  onClick={() => setExpandedTeam(expandedTeam === team.id ? null : team.id)}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p className="ev-section-label" style={{ marginBottom: 3 }}>{team.id}</p>
                      <p style={{ fontFamily: "'Crimson Pro', Georgia, serif", fontSize: '1.15rem', fontWeight: 700, color: '#eaeaea', margin: 0 }}>
                        {team.teamName}
                      </p>
                      <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.72rem', color: '#555', margin: '3px 0 0' }}>
                        Led by {team.leader} · {team.members.length} member{team.members.length !== 1 ? 's' : ''}
                      </p>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
                      <StatusBadge status={team.attendanceMarked ? 'present' : 'absent'} />
                      {expandedTeam === team.id ? <ChevronUp size={14} color="#444" /> : <ChevronDown size={14} color="#444" />}
                    </div>
                  </div>

                  {expandedTeam === team.id && (
                    <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                      <p className="ev-section-label" style={{ marginBottom: 8 }}>Members</p>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        {team.members.map((m, i) => (
                          <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '7px 10px', borderRadius: 8, background: 'rgba(255,255,255,0.02)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.8rem', color: '#ccc' }}>
                                {i === 0 ? '👑 ' : ''}{m.name}
                              </span>
                              {m.rollNumber && <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.68rem', color: '#444' }}>{m.rollNumber}</span>}
                            </div>
                            {team.attendanceMarked && <StatusBadge status={m.present ? 'present' : 'absent'} />}
                          </div>
                        ))}
                      </div>
                      {team.email && (
                        <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.68rem', color: '#444', marginTop: 10 }}>
                          📧 {team.email}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* ── LOOKUP TAB ───────────────────────────────────────────── */}
      {tab === 'lookup' && (
        <div style={{ maxWidth: 560 }}>
          <GlassCard style={{ marginBottom: '1.5rem' }}>
            <h3 style={{ fontFamily: "'Crimson Pro', Georgia, serif", fontSize: '1.5rem', fontWeight: 700, color: '#eaeaea', marginBottom: '0.4rem' }}>
              Team Lookup
            </h3>
            <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.76rem', color: '#555', marginBottom: '1.25rem', lineHeight: 1.6 }}>
              Look up any registered team by their Team ID to view their QR code and details.
            </p>
            <form onSubmit={handleLookup} style={{ display: 'flex', gap: 8 }}>
              <div style={{ flex: 1, position: 'relative' }}>
                <Search size={13} color="#444" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  className="ev-input"
                  style={{ paddingLeft: 36 }}
                  placeholder={`${eventId}-T01`}
                  value={lookupId}
                  onChange={(e) => { setLookupId(e.target.value); setLookupError(''); }}
                />
              </div>
              <button type="submit" className="ev-btn ev-btn-primary" style={{ flexShrink: 0, gap: 6 }}>
                <Search size={13} /> Find
              </button>
            </form>
            {lookupError && <p className="ev-field-error" style={{ marginTop: 8 }}>{lookupError}</p>}
          </GlassCard>

          {lookupLoading && (
            <GlassCard style={{ textAlign: 'center' }} padding="lg">
              <LoadingSpinner text="Looking up team..." />
            </GlassCard>
          )}

          {!lookupLoading && lookupTeam && (
            <GlassCard className="ev-scale-in">
              <div style={{ marginBottom: '1.25rem', paddingBottom: '1.25rem', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
                  <div>
                    <p className="ev-section-label" style={{ marginBottom: 4 }}>{lookupTeam.id}</p>
                    <h3 style={{ fontFamily: "'Crimson Pro', Georgia, serif", fontSize: '1.5rem', fontWeight: 700, color: '#eaeaea', margin: 0 }}>{lookupTeam.teamName}</h3>
                    <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.75rem', color: '#555', margin: '4px 0 0' }}>Led by {lookupTeam.leader}</p>
                  </div>
                  <StatusBadge status={lookupTeam.attendanceMarked ? 'present' : 'absent'} />
                </div>
              </div>

              <QRCodeDisplay value={`${eventId}|${lookupTeam.id}`} teamId={lookupTeam.id} size={180} />

              <div style={{ marginTop: '1.25rem', paddingTop: '1.25rem', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                <p className="ev-section-label" style={{ marginBottom: 8 }}>Members</p>
                {lookupTeam.members.map((m, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '7px 10px', borderRadius: 8, background: 'rgba(255,255,255,0.02)', marginBottom: 4 }}>
                    <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.8rem', color: '#ccc' }}>{i === 0 ? '👑 ' : ''}{m.name}</span>
                    {lookupTeam.attendanceMarked && <StatusBadge status={m.present ? 'present' : 'absent'} />}
                  </div>
                ))}
              </div>
            </GlassCard>
          )}
        </div>
      )}

      {/* ── EMAIL BROADCAST TAB ──────────────────────────────────── */}
      {tab === 'email' && <EmailPanel teams={teams} />}
    </div>
  );
};
