import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ref, get, update } from 'firebase/database';
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
  CheckCheck, LinkIcon, LogOut, Lock, Mail, CalendarDays,
  Trophy, Star, StarOff, ChevronLeft, ChevronRight,
} from 'lucide-react';
import '@/styles/eventra-shared.css';

type DashboardTab = 'teams' | 'qualified' | 'lookup' | 'email';

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
  const [lbCopied, setLbCopied] = useState(false);

  // Day config (for attendance)
  const [currentDay, setCurrentDay] = useState(1);
  const [totalDays, setTotalDays] = useState(1);
  // Round config (for qualification)
  const [currentRound, setCurrentRound] = useState(1);
  const [totalRounds, setTotalRounds] = useState(1);
  // Which round is selected in the Qualified tab
  const [viewingRound, setViewingRound] = useState(1);
  // Which team's qualification is being toggled
  const [qualifyingTeam, setQualifyingTeam] = useState<string | null>(null);

  const [lookupId, setLookupId] = useState('');
  const [lookupTeam, setLookupTeam] = useState<TeamWithId | null>(null);
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupError, setLookupError] = useState('');

  const registrationUrl = `${window.location.origin}/register/${eventId}`;
  const leaderboardUrl = `${window.location.origin}/leaderboard/${eventId}`;

  const loadData = useCallback(async () => {
    if (!eventId) return;
    setLoading(true);
    try {
      const [detailsSnap, teamsSnap, settingsSnap] = await Promise.all([
        withRetry(() => get(ref(db, `events/${eventId}/details`))),
        withRetry(() => get(ref(db, `events/${eventId}/teams`))),
        withRetry(() => get(ref(db, `events/${eventId}/eventSettings`))),
      ]);
      if (detailsSnap.exists()) setEventDetails(detailsSnap.val() as EventDetailsType);
      if (settingsSnap.exists()) {
        const s = settingsSnap.val();
        const day = s.currentDay ?? 1;
        const round = s.currentRound ?? 1;
        setCurrentDay(day);
        setTotalDays(s.numberOfDays ?? 1);
        setCurrentRound(round);
        setTotalRounds(s.numberOfRounds ?? 1);
        setViewingRound(round);
      }
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

  const handleCopyLeaderboard = async () => {
    await navigator.clipboard.writeText(leaderboardUrl);
    setLbCopied(true);
    setTimeout(() => setLbCopied(false), 2000);
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
    setLookupLoading(true); setLookupError(''); setLookupTeam(null);
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

  /** Toggle qualification for a specific round */
  const handleToggleQualification = async (team: TeamWithId, round: number) => {
    if (!eventId) return;
    const teamCode = team.id.split('-').pop() || team.id;
    const roundKey = String(round);
    const currentlyQualified = team.qualifications?.[roundKey] ?? false;
    setQualifyingTeam(`${team.id}-${round}`);
    try {
      await withRetry(() => update(ref(db, `events/${eventId}/teams/${teamCode}`), {
        [`qualifications/${roundKey}`]: !currentlyQualified,
      }));
      // Optimistic update
      setTeams(prev => prev.map(t =>
        t.id === team.id
          ? { ...t, qualifications: { ...(t.qualifications ?? {}), [roundKey]: !currentlyQualified } }
          : t
      ));
    } catch (err) {
      console.error('Qualify Error:', err);
    } finally {
      setQualifyingTeam(null);
    }
  };

  /** Assign a podium position (1/2/3) in the final round. Clicking same pos again clears it. */
  const handleSetPosition = async (team: TeamWithId, pos: number) => {
    if (!eventId) return;
    const teamCode = team.id.split('-').pop() || team.id;
    const alreadyThis = team.position === pos;
    const newPos = alreadyThis ? null : pos;

    // Find any other team that currently holds this position and clear it
    const prevHolder = !alreadyThis ? teams.find(t => t.id !== team.id && t.position === pos) : null;

    try {
      const writes: Promise<void>[] = [
        withRetry(() => update(ref(db, `events/${eventId}/teams/${teamCode}`), { position: newPos })),
      ];
      if (prevHolder) {
        const prevCode = prevHolder.id.split('-').pop() || prevHolder.id;
        writes.push(withRetry(() => update(ref(db, `events/${eventId}/teams/${prevCode}`), { position: null })));
      }
      await Promise.all(writes);
      // Optimistic update
      setTeams(prev => prev.map(t => {
        if (t.id === team.id) return { ...t, position: newPos ?? undefined };
        if (prevHolder && t.id === prevHolder.id) return { ...t, position: undefined };
        return t;
      }));
    } catch (err) {
      console.error('Position Error:', err);
    }
  };

  const filtered = teams.filter((t) =>
    t.teamName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.leader.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Day stats
  const dayKey = String(currentDay);
  const todayPresent = teams.filter(t => t.dayAttendance?.[dayKey]?.marked).length;
  const dayPct = stats.totalTeams > 0 ? Math.round((todayPresent / stats.totalTeams) * 100) : 0;
  const dayColor = currentDay === 1 ? '#4ADE80' : currentDay === 2 ? '#60A5FA' : '#F472B6';

  // Round stats for qualification tab
  const qualifiedInRound = (round: number) =>
    teams.filter(t => t.qualifications?.[String(round)] === true).length;

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
            <button className="ev-btn ev-btn-secondary ev-btn-full" onClick={() => navigate(`/dashboard/${sessionEventId}`)}>My Dashboard</button>
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

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '3rem 1.5rem' }}>

      {/* ── Header ──────────────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10, flexWrap: 'wrap' }}>
            <span className="ev-pill ev-pill-gold">{eventId}</span>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 10px', borderRadius: 20, background: `${dayColor}12`, border: `1px solid ${dayColor}30` }}>
              <CalendarDays size={10} color={dayColor} />
              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.68rem', color: dayColor, fontWeight: 700 }}>
                Day {currentDay} / {totalDays}
              </span>
            </div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 10px', borderRadius: 20, background: 'rgba(129,140,248,0.1)', border: '1px solid rgba(129,140,248,0.25)' }}>
              <Trophy size={10} color="#818CF8" />
              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.68rem', color: '#818CF8', fontWeight: 700 }}>
                Round {currentRound} / {totalRounds}
              </span>
            </div>
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.65rem', color: '#444' }}>
              Updated {lastRefreshed.toLocaleTimeString()}
            </span>
          </div>
          <h1 style={{ fontFamily: "'Crimson Pro', Georgia, serif", fontSize: 'clamp(2rem,5vw,2.75rem)', fontWeight: 700, color: '#eaeaea', lineHeight: 1.1, margin: 0 }}>
            {eventDetails?.eventName ?? 'Dashboard'}
          </h1>
        </div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
          <button onClick={loadData} className="ev-btn ev-btn-ghost ev-btn-sm" style={{ gap: 6 }}><RefreshCw size={12} /> Refresh</button>
          <button onClick={() => exportTeamsToCSV(teams, eventId!)} className="ev-btn ev-btn-ghost ev-btn-sm" style={{ gap: 6 }}><Download size={12} /> CSV</button>
          <Link to={`/scan/${eventId}`} style={{ textDecoration: 'none' }}>
            <button className="ev-btn ev-btn-primary ev-btn-sm" style={{ gap: 6 }}><ScanLine size={12} /> Scan QR</button>
          </Link>
          <Link to={`/event-details/${eventId}`} style={{ textDecoration: 'none' }}>
            <button className="ev-btn ev-btn-ghost ev-btn-sm"><Settings size={13} /></button>
          </Link>
          <button onClick={handleLogout} className="ev-btn ev-btn-danger ev-btn-sm" title="Logout"><LogOut size={13} /></button>
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
            <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.75rem', color: '#C6A969', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{registrationUrl}</p>
          </div>
          <button onClick={handleCopyLink} className="ev-btn ev-btn-secondary ev-btn-sm" style={{ flexShrink: 0, gap: 6 }}>
            {linkCopied ? <CheckCheck size={13} /> : <Copy size={13} />}
            {linkCopied ? 'Copied!' : 'Copy'}
          </button>
        </div>
      </GlassCard>

      {/* ── Leaderboard Link ─────────────────────────────────────── */}
      <GlassCard padding="sm" style={{ marginBottom: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, flexShrink: 0, background: 'rgba(129,140,248,0.08)', border: '1px solid rgba(129,140,248,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Trophy size={16} color="#818CF8" />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p className="ev-section-label" style={{ marginBottom: 2 }}>Leaderboard — Share with participants to check their status</p>
            <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.75rem', color: '#818CF8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{leaderboardUrl}</p>
          </div>
          <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
            <a href={leaderboardUrl} target="_blank" rel="noreferrer" className="ev-btn ev-btn-ghost ev-btn-sm" style={{ gap: 5, textDecoration: 'none' }}>
              <LinkIcon size={12} /> View
            </a>
            <button onClick={handleCopyLeaderboard} className="ev-btn ev-btn-secondary ev-btn-sm" style={{ gap: 6 }}>
              {lbCopied ? <CheckCheck size={13} /> : <Copy size={13} />}
              {lbCopied ? 'Copied!' : 'Copy'}
            </button>
          </div>
        </div>
      </GlassCard>

      {/* ── Stats ───────────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.25rem' }}>
        {[
          { label: 'Total Teams',           value: stats.totalTeams,  icon: <Users size={18} />,     color: '#C6A969' },
          { label: `Day ${currentDay} Present`, value: todayPresent,  icon: <CalendarDays size={18} />, color: dayColor },
          { label: 'Total Members',          value: stats.totalMembers, icon: <Users size={18} />,    color: '#C6A969' },
          { label: `Round ${currentRound} Qualified`, value: qualifiedInRound(currentRound), icon: <Trophy size={18} />, color: '#818CF8' },
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

      {/* ── Day Attendance Progress ───────────────────────────────── */}
      {stats.totalTeams > 0 && (
        <GlassCard padding="sm" style={{ marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.72rem', color: '#555' }}>
              Day {currentDay} Attendance Progress
            </span>
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.72rem', color: dayColor, fontWeight: 700 }}>{dayPct}%</span>
          </div>
          <div className="ev-progress-track">
            <div className="ev-progress-fill" style={{ width: `${dayPct}%`, background: dayColor }} />
          </div>
          {/* Day-by-day mini breakdown */}
          {totalDays > 1 && (
            <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
              {Array.from({ length: totalDays }, (_, i) => i + 1).map(d => {
                const dKey = String(d);
                const dPresent = teams.filter(t => t.dayAttendance?.[dKey]?.marked).length;
                const dColor = d === 1 ? '#4ADE80' : d === 2 ? '#60A5FA' : '#F472B6';
                return (
                  <div key={d} style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.68rem', color: '#555' }}>
                    <span style={{ color: dColor }}>D{d}</span>: {dPresent}/{stats.totalTeams}
                  </div>
                );
              })}
            </div>
          )}
        </GlassCard>
      )}

      {/* ── Tabs ─────────────────────────────────────────────────── */}
      <div className="ev-tabs" style={{ marginBottom: '1.5rem' }}>
        <button className={`ev-tab${tab === 'teams' ? ' active' : ''}`} onClick={() => setTab('teams')}>
          <Users size={13} /> Teams ({teams.length})
        </button>
        <button className={`ev-tab${tab === 'qualified' ? ' active' : ''}`} onClick={() => setTab('qualified')}>
          <Trophy size={13} /> Qualified Teams
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
            <input className="ev-input" style={{ paddingLeft: 38 }} placeholder="Search by team name, ID, or leader..."
              value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
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
              {filtered.map((team) => {
                const dayAttn = team.dayAttendance ?? {};
                const isExpanded = expandedTeam === team.id;

                return (
                  <div key={team.id} className="ev-card" style={{ padding: '14px 18px' }}>
                    {/* Header row */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', cursor: 'pointer' }}
                      onClick={() => setExpandedTeam(isExpanded ? null : team.id)}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p className="ev-section-label" style={{ marginBottom: 3 }}>{team.id}</p>
                        <p style={{ fontFamily: "'Crimson Pro', Georgia, serif", fontSize: '1.15rem', fontWeight: 700, color: '#eaeaea', margin: 0 }}>{team.teamName}</p>
                        <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.72rem', color: '#555', margin: '3px 0 0' }}>
                          Led by {team.leader} · {team.members.length} member{team.members.length !== 1 ? 's' : ''}
                        </p>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                        {/* Per-day attendance badges */}
                        <div style={{ display: 'flex', gap: 4 }}>
                          {Array.from({ length: totalDays }, (_, i) => i + 1).map(d => {
                            const done = dayAttn[String(d)]?.marked;
                            const dColor = d === 1 ? '#4ADE80' : d === 2 ? '#60A5FA' : '#F472B6';
                            return (
                              <div key={d} title={`Day ${d}: ${done ? 'Attended' : 'Not yet'}`}
                                style={{
                                  width: 22, height: 22, borderRadius: 6,
                                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                                  background: done ? `${dColor}22` : 'rgba(255,255,255,0.03)',
                                  border: `1px solid ${done ? dColor + '55' : 'rgba(255,255,255,0.07)'}`,
                                  fontSize: '0.58rem',
                                  fontFamily: "'JetBrains Mono', monospace",
                                  color: done ? dColor : '#333',
                                }}>
                                D{d}
                              </div>
                            );
                          })}
                        </div>
                        <StatusBadge status={team.attendanceMarked ? 'present' : 'absent'} />
                        {isExpanded ? <ChevronUp size={14} color="#444" /> : <ChevronDown size={14} color="#444" />}
                      </div>
                    </div>

                    {/* Expanded */}
                    {isExpanded && (
                      <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                        {/* Day-by-day breakdown */}
                        {totalDays > 1 && (
                          <div style={{ marginBottom: '1rem' }}>
                            <p className="ev-section-label" style={{ marginBottom: 8 }}>Day Attendance</p>
                            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                              {Array.from({ length: totalDays }, (_, i) => i + 1).map(d => {
                                const rec = dayAttn[String(d)];
                                const dColor = d === 1 ? '#4ADE80' : d === 2 ? '#60A5FA' : '#F472B6';
                                const presentCount = rec?.members?.filter(m => m.present).length ?? 0;
                                const totalCount = rec?.members?.length ?? team.members.length;
                                return (
                                  <div key={d} style={{ padding: '6px 12px', borderRadius: 8, background: rec?.marked ? `${dColor}10` : 'rgba(255,255,255,0.02)', border: `1px solid ${rec?.marked ? dColor + '30' : 'rgba(255,255,255,0.05)'}` }}>
                                    <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.7rem', color: rec?.marked ? dColor : '#333' }}>
                                      Day {d}: {rec?.marked ? `${presentCount}/${totalCount} present` : '—'}
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {/* Round qualifications */}
                        {totalRounds > 0 && (
                          <div style={{ marginBottom: '1rem' }}>
                            <p className="ev-section-label" style={{ marginBottom: 8 }}>Round Qualifications</p>
                            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                              {Array.from({ length: totalRounds }, (_, i) => i + 1).map(r => {
                                const qualified = team.qualifications?.[String(r)] === true;
                                return (
                                  <div key={r} style={{
                                    padding: '5px 12px', borderRadius: 8,
                                    background: qualified ? 'rgba(129,140,248,0.1)' : 'rgba(255,255,255,0.02)',
                                    border: `1px solid ${qualified ? 'rgba(129,140,248,0.3)' : 'rgba(255,255,255,0.05)'}`,
                                    fontFamily: "'JetBrains Mono', monospace",
                                    fontSize: '0.7rem',
                                    color: qualified ? '#818CF8' : '#333',
                                    display: 'flex', alignItems: 'center', gap: 5,
                                  }}>
                                    {qualified ? <Star size={9} fill="#818CF8" color="#818CF8" /> : <StarOff size={9} color="#333" />}
                                    Round {r}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        <p className="ev-section-label" style={{ marginBottom: 8 }}>Members</p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                          {team.members.map((m, i) => (
                            <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '7px 10px', borderRadius: 8, background: 'rgba(255,255,255,0.02)' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.8rem', color: '#ccc' }}>{i === 0 ? '👑 ' : ''}{m.name}</span>
                                {m.rollNumber && <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.68rem', color: '#444' }}>{m.rollNumber}</span>}
                              </div>
                              {team.attendanceMarked && <StatusBadge status={m.present ? 'present' : 'absent'} />}
                            </div>
                          ))}
                        </div>
                        {team.email && <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.68rem', color: '#444', marginTop: 10, marginBottom: 0 }}>📧 {team.email}</p>}
                        {team.createdAt && <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.68rem', color: '#444', marginTop: 4, marginBottom: 0 }}>🕒 Registered: {new Date(team.createdAt).toLocaleString()}</p>}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* ── QUALIFIED TEAMS TAB ──────────────────────────────────── */}
      {tab === 'qualified' && (
        <div>
          {/* Round selector */}
          <GlassCard padding="sm" style={{ marginBottom: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
              <div>
                <p className="ev-section-label" style={{ marginBottom: 4 }}>Manage Qualification</p>
                <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.72rem', color: '#555' }}>
                  Toggle which teams qualify for each round. Use the arrows to switch rounds.
                </p>
              </div>
              {/* Round stepper */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 0, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, overflow: 'hidden' }}>
                <button
                  onClick={() => setViewingRound(r => Math.max(1, r - 1))}
                  disabled={viewingRound <= 1}
                  style={{ padding: '8px 13px', background: 'transparent', border: 'none', borderRight: '1px solid rgba(255,255,255,0.06)', cursor: viewingRound <= 1 ? 'not-allowed' : 'pointer', color: viewingRound <= 1 ? '#2a2a2a' : '#777', display: 'flex' }}>
                  <ChevronLeft size={14} />
                </button>
                <div style={{ padding: '8px 18px', textAlign: 'center' }}>
                  <span style={{ fontFamily: "'Crimson Pro', Georgia, serif", fontSize: '1.2rem', fontWeight: 700, color: '#818CF8' }}>Round {viewingRound}</span>
                  <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.68rem', color: '#444', marginLeft: 6 }}>of {totalRounds}</span>
                </div>
                <button
                  onClick={() => setViewingRound(r => Math.min(totalRounds, r + 1))}
                  disabled={viewingRound >= totalRounds}
                  style={{ padding: '8px 13px', background: 'transparent', border: 'none', borderLeft: '1px solid rgba(255,255,255,0.06)', cursor: viewingRound >= totalRounds ? 'not-allowed' : 'pointer', color: viewingRound >= totalRounds ? '#2a2a2a' : '#777', display: 'flex' }}>
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          </GlassCard>

          {/* Qualification / Winners block */}
          {(() => {
            const isLastRound = viewingRound === totalRounds;

            // Eligible teams: Round 1 → all; Round N → qualified from N-1
            const eligibleTeams = viewingRound === 1
              ? teams
              : teams.filter(t => t.qualifications?.[String(viewingRound - 1)] === true);

            // ── LAST ROUND: Winners Podium ─────────────────────────
            if (isLastRound) {
              const winner1 = eligibleTeams.find(t => t.position === 1);
              const winner2 = eligibleTeams.find(t => t.position === 2);
              const winner3 = eligibleTeams.find(t => t.position === 3);

              const PodiumSlot = ({ pos, team, color, medal, height }: {
                pos: number; team: TeamWithId | undefined; color: string; medal: string; height: number;
              }) => (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
                  <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.68rem', color: '#555', marginBottom: 6 }}>
                    {team ? team.teamName : <span style={{ color: '#2a2a2a' }}>—</span>}
                  </div>
                  <div style={{
                    width: '100%', height, borderRadius: '8px 8px 0 0',
                    background: team ? `${color}18` : 'rgba(255,255,255,0.02)',
                    border: `1px solid ${team ? color + '40' : 'rgba(255,255,255,0.05)'}`,
                    borderBottom: 'none',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4,
                  }}>
                    <span style={{ fontSize: '1.8rem', lineHeight: 1 }}>{medal}</span>
                    <span style={{ fontFamily: "'Crimson Pro', Georgia, serif", fontSize: '1.1rem', fontWeight: 700, color: team ? color : '#2a2a2a' }}>
                      #{pos}
                    </span>
                  </div>
                </div>
              );

              return (
                <>
                  {/* Podium display */}
                  {(winner1 || winner2 || winner3) && (
                    <GlassCard style={{ marginBottom: '1.25rem' }}>
                      <p className="ev-section-label" style={{ marginBottom: '1rem', textAlign: 'center' }}>🏆 Final Results</p>
                      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6 }}>
                        <PodiumSlot pos={2} team={winner2} color="#C0C0C0" medal="🥈" height={70} />
                        <PodiumSlot pos={1} team={winner1} color="#FFD700" medal="🥇" height={100} />
                        <PodiumSlot pos={3} team={winner3} color="#CD7F32" medal="🥉" height={55} />
                      </div>
                    </GlassCard>
                  )}

                  {/* Context hint */}
                  <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.72rem', color: '#555', marginBottom: '0.75rem' }}>
                    {viewingRound > 1 && (
                      <span style={{ display: 'block', marginBottom: 2, color: '#444' }}>
                        Showing {eligibleTeams.length} finalist{eligibleTeams.length !== 1 ? 's' : ''} from Round {viewingRound - 1}
                      </span>
                    )}
                    Assign positions — click a medal to set or clear it.
                  </div>

                  {eligibleTeams.length === 0 ? (
                    <GlassCard style={{ textAlign: 'center' }} padding="xl">
                      <Trophy size={34} color="#333" style={{ margin: '0 auto 1rem' }} />
                      <p style={{ fontFamily: "'Crimson Pro', Georgia, serif", fontSize: '1.25rem', color: '#555', marginBottom: '0.4rem' }}>
                        No finalists from Round {viewingRound - 1}
                      </p>
                      <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.72rem', color: '#3a3a3a' }}>
                        Go to Round {viewingRound - 1} and qualify teams first.
                      </p>
                    </GlassCard>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {eligibleTeams.map((team) => {
                        const pos = team.position;
                        const medalMap: Record<number, { emoji: string; color: string; label: string }> = {
                          1: { emoji: '🥇', color: '#FFD700', label: '1st Place' },
                          2: { emoji: '🥈', color: '#C0C0C0', label: '2nd Place' },
                          3: { emoji: '🥉', color: '#CD7F32', label: '3rd Place' },
                        };
                        const current = pos ? medalMap[pos] : null;

                        return (
                          <div key={team.id} className="ev-card" style={{ padding: '12px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, outline: current ? `1px solid ${current.color}40` : undefined }}>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              {current && (
                                <span style={{ fontSize: '1.1rem', marginRight: 6 }}>{current.emoji}</span>
                              )}
                              <span style={{ fontFamily: "'Crimson Pro', Georgia, serif", fontSize: '1.1rem', fontWeight: 700, color: current ? current.color : '#eaeaea' }}>
                                {team.teamName}
                              </span>
                              <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.7rem', color: '#555', margin: '2px 0 0' }}>
                                {team.id} · Led by {team.leader}
                              </p>
                            </div>
                            {/* Position buttons */}
                            <div style={{ display: 'flex', gap: 5, flexShrink: 0 }}>
                              {([1, 2, 3] as const).map((p) => {
                                const m = medalMap[p];
                                const active = team.position === p;
                                return (
                                  <button
                                    key={p}
                                    onClick={() => handleSetPosition(team, p)}
                                    title={active ? `Clear ${m.label}` : `Set as ${m.label}`}
                                    style={{
                                      width: 38, height: 38, borderRadius: 8, border: 'none',
                                      cursor: 'pointer',
                                      background: active ? `${m.color}22` : 'rgba(255,255,255,0.03)',
                                      outline: active ? `1px solid ${m.color}60` : '1px solid rgba(255,255,255,0.06)',
                                      fontSize: '1.1rem',
                                      transition: 'all 0.18s',
                                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    }}>
                                    {m.emoji}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </>
              );
            }

            // ── NON-LAST ROUND: Qualify toggle ─────────────────────
            const qualifiedCount = eligibleTeams.filter(t => t.qualifications?.[String(viewingRound)] === true).length;
            const pct = eligibleTeams.length > 0 ? Math.round(qualifiedCount / eligibleTeams.length * 100) : 0;

            return (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: '0.75rem' }}>
                  <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.72rem', color: '#555', lineHeight: 1.6 }}>
                    {viewingRound > 1 && (
                      <span style={{ color: '#444', display: 'block', marginBottom: 2 }}>
                        Showing {eligibleTeams.length} team{eligibleTeams.length !== 1 ? 's' : ''} qualified in Round {viewingRound - 1}
                      </span>
                    )}
                    <span style={{ color: '#818CF8', fontWeight: 700 }}>{qualifiedCount}</span>
                    {' '}/{' '}{eligibleTeams.length} qualified for Round {viewingRound}
                  </div>
                  <div style={{ flex: 1, height: 4, background: 'rgba(129,140,248,0.1)', borderRadius: 2 }}>
                    <div style={{ height: '100%', borderRadius: 2, background: '#818CF8', width: `${pct}%`, transition: 'width 0.4s ease' }} />
                  </div>
                </div>

                {eligibleTeams.length === 0 ? (
                  <GlassCard style={{ textAlign: 'center' }} padding="xl">
                    <Trophy size={34} color="#333" style={{ margin: '0 auto 1rem' }} />
                    <p style={{ fontFamily: "'Crimson Pro', Georgia, serif", fontSize: '1.25rem', color: '#555', marginBottom: '0.4rem' }}>
                      No teams from Round {viewingRound - 1}
                    </p>
                    <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.72rem', color: '#3a3a3a' }}>
                      Go to Round {viewingRound - 1} and qualify teams first.
                    </p>
                  </GlassCard>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {eligibleTeams.map((team) => {
                      const roundKey = String(viewingRound);
                      const isQualified = team.qualifications?.[roundKey] === true;
                      const toggleId = `${team.id}-${viewingRound}`;
                      const isToggling = qualifyingTeam === toggleId;

                      return (
                        <div key={team.id} className="ev-card" style={{ padding: '12px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <p className="ev-section-label" style={{ marginBottom: 2 }}>{team.id}</p>
                            <p style={{ fontFamily: "'Crimson Pro', Georgia, serif", fontSize: '1.1rem', fontWeight: 700, color: '#eaeaea', margin: 0 }}>{team.teamName}</p>
                            <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.7rem', color: '#555', margin: '2px 0 0' }}>
                              Led by {team.leader} · {team.members.length} members
                            </p>
                          </div>
                          <button
                            onClick={() => handleToggleQualification(team, viewingRound)}
                            disabled={isToggling}
                            style={{
                              display: 'flex', alignItems: 'center', gap: 7,
                              padding: '8px 16px', borderRadius: 8, border: 'none',
                              cursor: isToggling ? 'wait' : 'pointer',
                              background: isQualified ? 'rgba(129,140,248,0.12)' : 'rgba(255,255,255,0.03)',
                              outline: isQualified ? '1px solid rgba(129,140,248,0.35)' : '1px solid rgba(255,255,255,0.07)',
                              color: isQualified ? '#818CF8' : '#444',
                              fontFamily: "'JetBrains Mono', monospace",
                              fontSize: '0.75rem',
                              fontWeight: isQualified ? 700 : 400,
                              transition: 'all 0.2s',
                              flexShrink: 0,
                            }}>
                            {isToggling ? (
                              <RefreshCw size={12} style={{ animation: 'spin 1s linear infinite' }} />
                            ) : isQualified ? (
                              <Star size={12} fill="#818CF8" color="#818CF8" />
                            ) : (
                              <StarOff size={12} />
                            )}
                            {isToggling ? 'Saving…' : isQualified ? 'Qualified' : 'Not Qualified'}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </>
            );
          })()}


        </div>
      )}


      {/* ── LOOKUP TAB ───────────────────────────────────────────── */}
      {tab === 'lookup' && (
        <div style={{ maxWidth: 560 }}>
          <GlassCard style={{ marginBottom: '1.5rem' }}>
            <h3 style={{ fontFamily: "'Crimson Pro', Georgia, serif", fontSize: '1.5rem', fontWeight: 700, color: '#eaeaea', marginBottom: '0.4rem' }}>Team Lookup</h3>
            <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.76rem', color: '#555', marginBottom: '1.25rem', lineHeight: 1.6 }}>
              Look up any registered team by their Team ID to view their QR code and details.
            </p>
            <form onSubmit={handleLookup} style={{ display: 'flex', gap: 8 }}>
              <div style={{ flex: 1, position: 'relative' }}>
                <Search size={13} color="#444" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
                <input className="ev-input" style={{ paddingLeft: 36 }} placeholder={`${eventId}-T01`}
                  value={lookupId} onChange={(e) => { setLookupId(e.target.value); setLookupError(''); }} />
              </div>
              <button type="submit" className="ev-btn ev-btn-primary" style={{ flexShrink: 0, gap: 6 }}><Search size={13} /> Find</button>
            </form>
            {lookupError && <p className="ev-field-error" style={{ marginTop: 8 }}>{lookupError}</p>}
          </GlassCard>
          {lookupLoading && <GlassCard style={{ textAlign: 'center' }} padding="lg"><LoadingSpinner text="Looking up team..." /></GlassCard>}
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
