import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { collection, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { TeamWithId, EventDetails as EventDetailsType, DashboardStats } from '@/types';
import { exportTeamsToCSV } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';
import { GlassCard } from '@/components/GlassCard';
import { StatusBadge } from '@/components/StatusBadge';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { QRCodeDisplay } from '@/components/QRCodeDisplay';
import {
  Users, UserCheck, RefreshCw, Download, ScanLine, Search,
  ChevronDown, ChevronUp, Settings, AlertCircle, Copy,
  CheckCheck, LinkIcon, LogOut, Lock,
} from 'lucide-react';

type DashboardTab = 'teams' | 'lookup';

export const Dashboard: React.FC = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const { logout, eventId: sessionEventId } = useAuth();

  // Guard: if the URL eventId doesn't match the session eventId, block access
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

  // Team lookup state
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
        getDoc(doc(db, 'events', eventId, 'details', 'info')),
        getDocs(collection(db, 'events', eventId, 'teams')),
      ]);

      if (detailsSnap.exists()) setEventDetails(detailsSnap.data() as EventDetailsType);

      const teamList: TeamWithId[] = teamsSnap.docs.map((d) => ({ id: d.id, ...d.data() } as TeamWithId));
      teamList.sort((a, b) => a.id.localeCompare(b.id));
      setTeams(teamList);

      const totalMembers = teamList.reduce((acc, t) => acc + t.members.length, 0);
      const presentTeams = teamList.filter((t) => t.attendanceMarked).length;
      const presentMembers = teamList.reduce((acc, t) => acc + t.members.filter((m) => m.present).length, 0);
      setStats({ totalTeams: teamList.length, presentTeams, totalMembers, presentMembers });
      setLastRefreshed(new Date());
    } catch (err) {
      console.error(err);
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

  const handleLogout = () => {
    logout();
    navigate('/organizer-login');
  };

  // Team Lookup
  const parseEventIdFromTeam = (tid: string): string | null => {
    const match = tid.match(/^(.+)-T\d+$/);
    return match ? match[1] : null;
  };

  const handleLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = lookupId.trim();
    if (!trimmed) { setLookupError('Enter a Team ID.'); return; }
    const evId = parseEventIdFromTeam(trimmed);
    if (!evId) { setLookupError('Invalid Team ID format. Expected e.g. hackathon2026-T01'); return; }
    if (evId !== eventId) { setLookupError(`That team belongs to event "${evId}", not "${eventId}".`); return; }

    setLookupLoading(true);
    setLookupError('');
    setLookupTeam(null);
    try {
      const snap = await getDoc(doc(db, 'events', evId, 'teams', trimmed));
      if (!snap.exists()) { setLookupError(`No team found with ID "${trimmed}".`); return; }
      setLookupTeam({ id: snap.id, ...snap.data() } as TeamWithId);
    } catch (err) {
      console.error(err);
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

  const statCards = [
    { label: 'Total Teams', value: stats.totalTeams, icon: <Users size={20} color="#C6A969" />, color: '#C6A969' },
    { label: 'Present Teams', value: stats.presentTeams, icon: <UserCheck size={20} color="#4ADE80" />, color: '#4ADE80' },
    { label: 'Total Members', value: stats.totalMembers, icon: <Users size={20} color="#C6A969" />, color: '#C6A969' },
    { label: 'Present Members', value: stats.presentMembers, icon: <UserCheck size={20} color="#4ADE80" />, color: '#4ADE80' },
  ];

  // ── Access Denied ───────────────────────────────────────────────────────
  if (accessDenied) {
    return (
      <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
        <GlassCard style={{ maxWidth: 420, width: '100%', textAlign: 'center' }}>
          <Lock size={40} color="#F87171" style={{ margin: '0 auto 1rem' }} />
          <h2 style={{ fontFamily: "'Crimson Pro', Georgia, serif", fontSize: '2rem', color: '#EAEAEA', marginBottom: '0.5rem' }}>
            Access Denied
          </h2>
          <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.8rem', color: '#9A9A9A', marginBottom: '1.5rem' }}>
            You are logged in as organizer of <span style={{ color: '#C6A969' }}>{sessionEventId}</span>, not <span style={{ color: '#F87171' }}>{eventId}</span>.
          </p>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button className="btn-secondary" style={{ flex: 1, justifyContent: 'center' }} onClick={() => navigate(`/dashboard/${sessionEventId}`)}>
              My Dashboard
            </button>
            <button className="btn-danger" style={{ flex: '0 0 auto' }} onClick={handleLogout}>
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

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '3rem 1.5rem' }}>
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
            <span style={{
              fontFamily: "'JetBrains Mono', monospace", fontSize: '0.75rem', color: '#C6A969',
              padding: '0.2rem 0.65rem', borderRadius: '9999px',
              background: 'rgba(198,169,105,0.1)', border: '1px solid rgba(198,169,105,0.2)',
            }}>
              {eventId}
            </span>
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.7rem', color: '#6a6a6a' }}>
              Last updated: {lastRefreshed.toLocaleTimeString()}
            </span>
          </div>
          <h1 style={{ fontFamily: "'Crimson Pro', Georgia, serif", fontSize: '2.5rem', fontWeight: 700, color: '#EAEAEA' }}>
            {eventDetails?.eventName ?? 'Dashboard'}
          </h1>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <button onClick={loadData} className="btn-secondary" style={{ padding: '0.45rem 0.85rem', fontSize: '0.78rem' }}>
            <RefreshCw size={13} /> Refresh
          </button>
          <button onClick={() => exportTeamsToCSV(teams, eventId!)} className="btn-secondary" style={{ padding: '0.45rem 0.85rem', fontSize: '0.78rem' }}>
            <Download size={13} /> CSV
          </button>
          <Link to={`/scan/${eventId}`} style={{ textDecoration: 'none' }}>
            <button className="btn-primary" style={{ padding: '0.45rem 0.85rem', fontSize: '0.78rem' }}>
              <ScanLine size={13} /> Scan QR
            </button>
          </Link>
          <Link to={`/event-details/${eventId}`} style={{ textDecoration: 'none' }}>
            <button className="btn-secondary" style={{ padding: '0.45rem 0.75rem', fontSize: '0.78rem' }}>
              <Settings size={14} />
            </button>
          </Link>
          <button onClick={handleLogout} className="btn-danger" style={{ padding: '0.45rem 0.75rem', fontSize: '0.78rem' }} title="Logout">
            <LogOut size={14} />
          </button>
        </div>
      </div>

      {/* ── Registration Link (ORGANIZER ONLY) ─────────────────────────── */}
      <GlassCard style={{ marginBottom: '1.5rem' }} padding="sm">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          <div style={{
            width: 36, height: 36, borderRadius: '0.5rem', flexShrink: 0,
            background: 'rgba(198,169,105,0.08)', border: '1px solid rgba(198,169,105,0.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <LinkIcon size={16} color="#C6A969" />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.68rem', color: '#6a6a6a', marginBottom: '0.2rem', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              Registration Link — Share this with participants
            </p>
            <p style={{
              fontFamily: "'JetBrains Mono', monospace", fontSize: '0.78rem', color: '#C6A969',
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>
              {registrationUrl}
            </p>
          </div>
          <button onClick={handleCopyLink} className="btn-secondary" style={{ padding: '0.4rem 0.85rem', fontSize: '0.75rem', flexShrink: 0 }}>
            {linkCopied ? <CheckCheck size={14} /> : <Copy size={14} />}
            {linkCopied ? 'Copied!' : 'Copy Link'}
          </button>
        </div>
      </GlassCard>

      {/* ── Stats ──────────────────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        {statCards.map((s) => (
          <GlassCard key={s.label} padding="md">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
              <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.7rem', color: '#6a6a6a', letterSpacing: '0.08em', textTransform: 'uppercase', margin: 0 }}>
                {s.label}
              </p>
              <div style={{
                width: 36, height: 36, borderRadius: '0.5rem',
                background: `${s.color}15`, border: `1px solid ${s.color}25`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {s.icon}
              </div>
            </div>
            <p style={{ fontFamily: "'Crimson Pro', Georgia, serif", fontSize: '2.5rem', fontWeight: 700, color: s.color, margin: 0, lineHeight: 1 }}>
              {s.value}
            </p>
          </GlassCard>
        ))}
      </div>

      {/* Attendance progress */}
      {stats.totalTeams > 0 && (
        <GlassCard style={{ marginBottom: '1.5rem' }} padding="sm">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.75rem', color: '#9A9A9A' }}>
              Attendance Progress
            </span>
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.75rem', color: '#4ADE80' }}>
              {Math.round((stats.presentTeams / stats.totalTeams) * 100)}%
            </span>
          </div>
          <div style={{ height: 6, borderRadius: 3, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
            <div style={{
              height: '100%',
              width: `${(stats.presentTeams / stats.totalTeams) * 100}%`,
              background: 'linear-gradient(90deg, #C6A969, #4ADE80)',
              borderRadius: 3,
              transition: 'width 0.5s ease',
            }} />
          </div>
        </GlassCard>
      )}

      {/* ── Tabs ───────────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', gap: '0.25rem', marginBottom: '1.5rem', padding: '0.25rem', borderRadius: '0.75rem', background: 'rgba(255,255,255,0.03)', width: 'fit-content' }}>
        <TabBtn active={tab === 'teams'} onClick={() => setTab('teams')}>
          <Users size={13} /> Teams ({teams.length})
        </TabBtn>
        <TabBtn active={tab === 'lookup'} onClick={() => setTab('lookup')}>
          <Search size={13} /> Team Lookup
        </TabBtn>
      </div>

      {/* ── TEAMS TAB ──────────────────────────────────────────────────── */}
      {tab === 'teams' && (
        <>
          <div style={{ marginBottom: '1rem', position: 'relative' }}>
            <Search size={15} color="#6a6a6a" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)' }} />
            <input
              className="input-field"
              style={{ paddingLeft: '2.75rem' }}
              placeholder="Search by team name, ID, or leader..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {filtered.length === 0 ? (
            <GlassCard style={{ textAlign: 'center', padding: '3rem' }}>
              <AlertCircle size={36} color="#6a6a6a" style={{ margin: '0 auto 1rem' }} />
              <p style={{ fontFamily: "'Crimson Pro', Georgia, serif", fontSize: '1.25rem', color: '#9A9A9A' }}>
                {teams.length === 0 ? 'No teams registered yet.' : 'No teams match your search.'}
              </p>
            </GlassCard>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {filtered.map((team) => (
                <div
                  key={team.id}
                  className="glass-card"
                  style={{ padding: '1rem 1.25rem', cursor: 'pointer' }}
                  onClick={() => setExpandedTeam(expandedTeam === team.id ? null : team.id)}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.7rem', color: '#6a6a6a', margin: '0 0 0.2rem' }}>{team.id}</p>
                      <p style={{ fontFamily: "'Crimson Pro', Georgia, serif", fontSize: '1.1rem', fontWeight: 700, color: '#EAEAEA', margin: 0 }}>{team.teamName}</p>
                      <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.75rem', color: '#9A9A9A', margin: '0.15rem 0 0' }}>
                        Led by {team.leader} · {team.members.length} member{team.members.length !== 1 ? 's' : ''}
                      </p>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexShrink: 0 }}>
                      <StatusBadge status={team.attendanceMarked ? 'present' : 'absent'} />
                      {expandedTeam === team.id ? <ChevronUp size={15} color="#6a6a6a" /> : <ChevronDown size={15} color="#6a6a6a" />}
                    </div>
                  </div>

                  {expandedTeam === team.id && (
                    <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid rgba(198,169,105,0.1)' }}>
                      <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.7rem', color: '#6a6a6a', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '0.75rem' }}>
                        Members
                      </p>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                        {team.members.map((m, i) => (
                          <div key={i} style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                            padding: '0.5rem 0.75rem', borderRadius: '0.5rem', background: 'rgba(255,255,255,0.03)',
                          }}>
                            <div>
                              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.82rem', color: '#EAEAEA' }}>
                                {i === 0 ? '👑 ' : ''}{m.name}
                              </span>
                              {m.rollNumber && (
                                <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.7rem', color: '#6a6a6a', marginLeft: '0.75rem' }}>
                                  {m.rollNumber}
                                </span>
                              )}
                            </div>
                            {team.attendanceMarked && <StatusBadge status={m.present ? 'present' : 'absent'} />}
                          </div>
                        ))}
                      </div>
                      {team.email && (
                        <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.72rem', color: '#6a6a6a', marginTop: '0.75rem' }}>
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

      {/* ── TEAM LOOKUP TAB ────────────────────────────────────────────── */}
      {tab === 'lookup' && (
        <div style={{ maxWidth: 560 }}>
          <GlassCard style={{ marginBottom: '1.5rem' }}>
            <h3 style={{ fontFamily: "'Crimson Pro', Georgia, serif", fontSize: '1.5rem', fontWeight: 700, color: '#EAEAEA', marginBottom: '0.4rem' }}>
              Team Lookup
            </h3>
            <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.78rem', color: '#6a6a6a', marginBottom: '1.25rem' }}>
              Look up any registered team by their Team ID to view their QR code and details.
            </p>

            <form onSubmit={handleLookup} style={{ display: 'flex', gap: '0.75rem' }}>
              <div style={{ flex: 1, position: 'relative' }}>
                <Search size={15} color="#6a6a6a" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  className="input-field"
                  style={{ paddingLeft: '2.5rem' }}
                  placeholder={`${eventId}-T01`}
                  value={lookupId}
                  onChange={(e) => { setLookupId(e.target.value); setLookupError(''); }}
                />
              </div>
              <button type="submit" className="btn-primary" style={{ flexShrink: 0 }}>
                <Search size={14} /> Find
              </button>
            </form>

            {lookupError && (
              <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.75rem', color: '#F87171', marginTop: '0.75rem' }}>
                {lookupError}
              </p>
            )}
          </GlassCard>

          {/* Lookup loading */}
          {lookupLoading && (
            <GlassCard style={{ textAlign: 'center', padding: '2rem' }}>
              <LoadingSpinner text="Looking up team..." />
            </GlassCard>
          )}

          {/* Lookup result */}
          {!lookupLoading && lookupTeam && (
            <GlassCard className="animate-scale-in">
              <div style={{ marginBottom: '1.25rem', paddingBottom: '1.25rem', borderBottom: '1px solid rgba(198,169,105,0.1)' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <div>
                    <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.7rem', color: '#6a6a6a', marginBottom: '0.25rem' }}>
                      {lookupTeam.id}
                    </p>
                    <h3 style={{ fontFamily: "'Crimson Pro', Georgia, serif", fontSize: '1.5rem', fontWeight: 700, color: '#EAEAEA', margin: 0 }}>
                      {lookupTeam.teamName}
                    </h3>
                    <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.78rem', color: '#9A9A9A', margin: '0.25rem 0 0' }}>
                      Led by {lookupTeam.leader}
                    </p>
                  </div>
                  <StatusBadge status={lookupTeam.attendanceMarked ? 'present' : 'absent'} />
                </div>
              </div>

              <QRCodeDisplay
                value={`${eventId}|${lookupTeam.id}`}
                teamId={lookupTeam.id}
                size={180}
              />

              <div style={{ marginTop: '1.25rem', paddingTop: '1.25rem', borderTop: '1px solid rgba(198,169,105,0.1)' }}>
                <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.7rem', color: '#6a6a6a', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '0.75rem' }}>
                  Members
                </p>
                {lookupTeam.members.map((m, i) => (
                  <div key={i} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '0.5rem 0.75rem', borderRadius: '0.5rem', background: 'rgba(255,255,255,0.03)',
                    marginBottom: '0.35rem',
                  }}>
                    <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.82rem', color: '#EAEAEA' }}>
                      {i === 0 ? '👑 ' : ''}{m.name}
                    </span>
                    {lookupTeam.attendanceMarked && <StatusBadge status={m.present ? 'present' : 'absent'} />}
                  </div>
                ))}
              </div>
            </GlassCard>
          )}
        </div>
      )}
    </div>
  );
};

// ── Helpers ─────────────────────────────────────────────────────────────────

const TabBtn: React.FC<{ active: boolean; onClick: () => void; children: React.ReactNode }> = ({
  active, onClick, children,
}) => (
  <button
    onClick={onClick}
    style={{
      display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
      padding: '0.45rem 1rem', borderRadius: '0.5rem',
      background: active ? 'rgba(198,169,105,0.12)' : 'transparent',
      border: active ? '1px solid rgba(198,169,105,0.25)' : '1px solid transparent',
      color: active ? '#C6A969' : '#6a6a6a',
      fontFamily: "'JetBrains Mono', monospace", fontSize: '0.78rem', fontWeight: 600,
      cursor: 'pointer', transition: 'all 0.2s ease', letterSpacing: '0.03em',
    }}
  >
    {children}
  </button>
);
