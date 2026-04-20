import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { ref, get } from 'firebase/database';
import { db } from '@/lib/firebase';
import { withRetry } from '@/lib/db-retry';
import type { TeamWithId, EventDetails as EventDetailsType } from '@/types';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { GlassCard } from '@/components/GlassCard';
import {
  Trophy, Search, CalendarDays, AlertCircle,
  Star, StarOff, ChevronRight, Medal, Users,
} from 'lucide-react';
import '@/styles/eventra-shared.css';

export const Leaderboard: React.FC = () => {
  const { eventId } = useParams<{ eventId: string }>();

  const [loading, setLoading] = useState(true);
  const [teams, setTeams] = useState<TeamWithId[]>([]);
  const [eventDetails, setEventDetails] = useState<EventDetailsType | null>(null);
  const [currentRound, setCurrentRound] = useState(1);
  const [totalRounds, setTotalRounds] = useState(1);
  const [currentDay, setCurrentDay] = useState(1);
  const [totalDays, setTotalDays] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [highlightId, setHighlightId] = useState('');

  useEffect(() => {
    if (!eventId) return;
    const load = async () => {
      try {
        const [detailsSnap, teamsSnap, settingsSnap] = await Promise.all([
          withRetry(() => get(ref(db, `events/${eventId}/details`))),
          withRetry(() => get(ref(db, `events/${eventId}/teams`))),
          withRetry(() => get(ref(db, `events/${eventId}/eventSettings`))),
        ]);
        if (detailsSnap.exists()) setEventDetails(detailsSnap.val() as EventDetailsType);
        if (settingsSnap.exists()) {
          const s = settingsSnap.val();
          setCurrentRound(s.currentRound ?? 1);
          setTotalRounds(s.numberOfRounds ?? 1);
          setCurrentDay(s.currentDay ?? 1);
          setTotalDays(s.numberOfDays ?? 1);
        }
        const teamData = teamsSnap.val();
        const list: TeamWithId[] = [];
        if (teamData) {
          Object.keys(teamData).forEach((code) => {
            const t = teamData[code];
            list.push({ id: t.teamId || `${eventId}-${code}`, ...t } as TeamWithId);
          });
        }
        // Sort by position first (1,2,3), then alphabetically
        list.sort((a, b) => {
          const pa = a.position ?? 999;
          const pb = b.position ?? 999;
          if (pa !== pb) return pa - pb;
          return a.teamName.localeCompare(b.teamName);
        });
        setTeams(list);
      } catch (err) {
        console.error('Leaderboard load error:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [eventId]);

  const isLastRound = currentRound === totalRounds;

  // Winners
  const winner1 = teams.find(t => t.position === 1);
  const winner2 = teams.find(t => t.position === 2);
  const winner3 = teams.find(t => t.position === 3);
  const hasWinners = isLastRound && (winner1 || winner2 || winner3);

  // Filter
  const filtered = teams.filter(t => {
    const term = searchTerm.trim().toLowerCase();
    const matches = !term ||
      t.teamName.toLowerCase().includes(term) ||
      t.id.toLowerCase().includes(term) ||
      t.leader.toLowerCase().includes(term);

    // If there's a search term, show matching teams
    if (term) return matches;

    // If no search term:
    // In Round 1, leaderboard is empty by default
    if (currentRound === 1) return false;

    // After Round 1, show teams that qualified for at least the first round
    // (teams that were eliminated in round 1 won't clutter the default view)
    return t.qualifications?.['1'] === true;
  });

  // Status helpers
  const getTeamStatus = (team: TeamWithId) => {
    if (team.position) {
      const medals: Record<number, { emoji: string; label: string; color: string }> = {
        1: { emoji: '🥇', label: '1st Place', color: '#FFD700' },
        2: { emoji: '🥈', label: '2nd Place', color: '#C0C0C0' },
        3: { emoji: '🥉', label: '3rd Place', color: '#CD7F32' },
      };
      return medals[team.position];
    }
    // Check qualification for current round
    if (currentRound === 1) {
      return { emoji: '✅', label: 'Participating', color: '#4ADE80' };
    }
    const qualifiedForCurrent = team.qualifications?.[String(currentRound)] === true;
    const qualifiedForPrevious = team.qualifications?.[String(currentRound - 1)] === true;
    if (isLastRound && qualifiedForPrevious && !team.position) {
      return { emoji: '🏁', label: 'Finalist', color: '#818CF8' };
    }
    if (qualifiedForCurrent) {
      return { emoji: '⭐', label: `Qualified — Round ${currentRound}`, color: '#818CF8' };
    }
    if (qualifiedForPrevious) {
      return { emoji: '⭐', label: `Qualified — Round ${currentRound - 1}`, color: '#60A5FA' };
    }
    // Check if eliminated
    for (let r = currentRound - 1; r >= 1; r--) {
      if (team.qualifications?.[String(r)] === false) {
        return { emoji: '❌', label: `Eliminated — Round ${r}`, color: '#F87171' };
      }
    }
    return { emoji: '📋', label: 'Registered', color: '#555' };
  };

  const dayColor = currentDay === 1 ? '#4ADE80' : currentDay === 2 ? '#60A5FA' : '#F472B6';

  if (loading) {
    return (
      <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <LoadingSpinner text="Loading leaderboard..." />
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 780, margin: '0 auto', padding: '3rem 1.5rem' }}>

      {/* ── Header ──────────────────────────────────────────────── */}
      <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
        <div style={{
          width: 72, height: 72, borderRadius: 20, margin: '0 auto 1.5rem',
          background: 'rgba(198,169,105,0.08)', border: '1px solid rgba(198,169,105,0.2)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 0 40px rgba(198,169,105,0.06)',
        }}>
          <Trophy size={32} color="#C6A969" />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
          <span className="ev-pill ev-pill-gold">{eventId}</span>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 12px', borderRadius: 20, background: `${dayColor}12`, border: `1px solid ${dayColor}30` }}>
            <CalendarDays size={10} color={dayColor} />
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.68rem', color: dayColor, fontWeight: 700 }}>
              Day {currentDay} / {totalDays}
            </span>
          </div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 12px', borderRadius: 20, background: 'rgba(129,140,248,0.1)', border: '1px solid rgba(129,140,248,0.25)' }}>
            <Trophy size={10} color="#818CF8" />
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.68rem', color: '#818CF8', fontWeight: 700 }}>
              Round {currentRound} / {totalRounds}
            </span>
          </div>
        </div>

        <h1 style={{ fontFamily: "'Crimson Pro', Georgia, serif", fontSize: 'clamp(2rem,5vw,3rem)', fontWeight: 700, color: '#eaeaea', lineHeight: 1.1, marginBottom: '0.5rem' }}>
          {eventDetails?.eventName ?? 'Leaderboard'}
        </h1>
        <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.78rem', color: '#555' }}>
          Live qualification status for all registered teams
        </p>
      </div>

      {/* ── Winners Podium ───────────────────────────────────────── */}
      {hasWinners && (
        <GlassCard style={{ marginBottom: '2rem', textAlign: 'center' }}>
          <p className="ev-section-label" style={{ marginBottom: '1.25rem' }}>🏆 Final Rankings</p>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8 }}>
            {/* 2nd */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.72rem', color: '#C0C0C0', marginBottom: 6, lineHeight: 1.4 }}>
                {winner2?.teamName ?? '—'}
              </p>
              <div style={{ width: '100%', height: 80, borderRadius: '8px 8px 0 0', background: 'rgba(192,192,192,0.08)', border: '1px solid rgba(192,192,192,0.25)', borderBottom: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                <span style={{ fontSize: '2rem' }}>🥈</span>
                <span style={{ fontFamily: "'Crimson Pro', Georgia, serif", fontSize: '1rem', fontWeight: 700, color: '#C0C0C0' }}>2nd</span>
              </div>
            </div>
            {/* 1st */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.75rem', color: '#FFD700', marginBottom: 6, lineHeight: 1.4, fontWeight: 700 }}>
                {winner1?.teamName ?? '—'}
              </p>
              <div style={{ width: '100%', height: 116, borderRadius: '8px 8px 0 0', background: 'rgba(255,215,0,0.08)', border: '1px solid rgba(255,215,0,0.3)', borderBottom: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4, boxShadow: '0 0 30px rgba(255,215,0,0.06)' }}>
                <span style={{ fontSize: '2.4rem' }}>🥇</span>
                <span style={{ fontFamily: "'Crimson Pro', Georgia, serif", fontSize: '1.2rem', fontWeight: 700, color: '#FFD700' }}>1st</span>
              </div>
            </div>
            {/* 3rd */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.72rem', color: '#CD7F32', marginBottom: 6, lineHeight: 1.4 }}>
                {winner3?.teamName ?? '—'}
              </p>
              <div style={{ width: '100%', height: 60, borderRadius: '8px 8px 0 0', background: 'rgba(205,127,50,0.08)', border: '1px solid rgba(205,127,50,0.25)', borderBottom: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                <span style={{ fontSize: '1.7rem' }}>🥉</span>
                <span style={{ fontFamily: "'Crimson Pro', Georgia, serif", fontSize: '0.9rem', fontWeight: 700, color: '#CD7F32' }}>3rd</span>
              </div>
            </div>
          </div>
          {/* Base bar */}
          <div style={{ width: '100%', height: 6, background: 'rgba(198,169,105,0.12)', borderRadius: '0 0 6px 6px', border: '1px solid rgba(198,169,105,0.1)', borderTop: 'none' }} />
        </GlassCard>
      )}

      {/* ── Round progress pills ─────────────────────────────────── */}
      <div style={{ display: 'flex', gap: 8, marginBottom: '1.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.68rem', color: '#444', marginRight: 4 }}>Rounds:</span>
        {Array.from({ length: totalRounds }, (_, i) => i + 1).map(r => {
          const isActive = r === currentRound;
          const isPast = r < currentRound;
          const isLast = r === totalRounds;
          return (
            <React.Fragment key={r}>
              <div style={{
                padding: '4px 12px', borderRadius: 20, fontFamily: "'JetBrains Mono', monospace", fontSize: '0.68rem',
                background: isActive ? 'rgba(129,140,248,0.15)' : isPast ? 'rgba(74,222,128,0.08)' : 'rgba(255,255,255,0.02)',
                border: isActive ? '1px solid rgba(129,140,248,0.4)' : isPast ? '1px solid rgba(74,222,128,0.2)' : '1px solid rgba(255,255,255,0.05)',
                color: isActive ? '#818CF8' : isPast ? '#4ADE80' : '#333',
                fontWeight: isActive ? 700 : 400,
              }}>
                {isLast ? '🏆 ' : ''}{isActive ? '● ' : isPast ? '✓ ' : '○ '}Round {r}
              </div>
              {r < totalRounds && <ChevronRight size={12} color="#2a2a2a" />}
            </React.Fragment>
          );
        })}
      </div>

      {/* ── Team Search ──────────────────────────────────────────── */}
      <div style={{ marginBottom: '1rem', position: 'relative' }}>
        <Search size={14} color="#444" style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', zIndex: 1 }} />
        <input
          id="leaderboard-search"
          className="ev-input"
          style={{ paddingLeft: 38 }}
          placeholder="Search by Team ID, team name, or leader…"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Quick-find by exact ID */}
      {highlightId && (
        <div style={{ marginBottom: 8, fontFamily: "'JetBrains Mono', monospace", fontSize: '0.7rem', color: '#555' }}>
          Highlighting team: <span style={{ color: '#C6A969' }}>{highlightId}</span>
          <button onClick={() => setHighlightId('')} style={{ background: 'none', border: 'none', color: '#444', cursor: 'pointer', marginLeft: 8, fontSize: '0.7rem' }}>✕ clear</button>
        </div>
      )}

      {/* ── Stats strip ─────────────────────────────────────────── */}
      <div style={{ display: 'flex', gap: 16, marginBottom: '1.25rem', flexWrap: 'wrap' }}>
        {[
          { label: 'Total Teams', value: teams.length, color: '#C6A969' },
          {
            label: `Round ${currentRound} Qualified`,
            value: teams.filter(t =>
              currentRound === 1
                ? true
                : t.qualifications?.[String(currentRound)] === true || t.qualifications?.[String(currentRound - 1)] === true
            ).length,
            color: '#818CF8',
          },
          { label: 'Finalists', value: isLastRound ? teams.filter(t => t.qualifications?.[String(currentRound - 1)] === true || t.position).length : 0, color: '#4ADE80' },
        ].map(s => (
          <div key={s.label} style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.72rem', color: '#555' }}>
            <span style={{ color: s.color, fontWeight: 700 }}>{s.value}</span> {s.label}
          </div>
        ))}
      </div>

      {/* ── Team List ────────────────────────────────────────────── */}
      {filtered.length === 0 ? (
        <GlassCard style={{ textAlign: 'center' }} padding="xl">
          <AlertCircle size={36} color="#333" style={{ margin: '0 auto 1rem' }} />
          <p style={{ fontFamily: "'Crimson Pro', Georgia, serif", fontSize: '1.25rem', color: '#555', marginBottom: '0.5rem' }}>
            {teams.length === 0
              ? 'No teams registered yet.'
              : currentRound === 1 && !searchTerm.trim()
                ? 'Leaderboard will populate after Round 1.'
                : 'No teams match your search.'}
          </p>
          {currentRound === 1 && !searchTerm.trim() && teams.length > 0 && (
            <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.75rem', color: '#444' }}>
              Use the search bar above to look up your team's ID and verify your registration.
            </p>
          )}
        </GlassCard>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {filtered.map((team, idx) => {
            const status = getTeamStatus(team);
            const isHighlighted = highlightId && team.id.toLowerCase() === highlightId.toLowerCase();

            // Per-round qualification indicators
            const roundDots = Array.from({ length: totalRounds }, (_, i) => i + 1).map(r => {
              const q = team.qualifications?.[String(r)];
              if (q === true) return { r, color: '#4ADE80', icon: '✓' };
              if (q === false) return { r, color: '#F87171', icon: '✗' };
              return { r, color: '#2a2a2a', icon: '○' };
            });

            return (
              <div
                key={team.id}
                id={`team-${team.id}`}
                className="ev-card"
                style={{
                  padding: '14px 18px',
                  outline: isHighlighted ? '1px solid rgba(198,169,105,0.5)' : team.position ? `1px solid ${status.color}30` : undefined,
                  transition: 'all 0.2s',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  {/* Rank number */}
                  <div style={{
                    width: 32, height: 32, borderRadius: 8, flexShrink: 0,
                    background: team.position ? `${status.color}15` : 'rgba(255,255,255,0.02)',
                    border: `1px solid ${team.position ? status.color + '30' : 'rgba(255,255,255,0.06)'}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontFamily: "'JetBrains Mono', monospace", fontSize: '0.75rem',
                    color: team.position ? status.color : '#333',
                  }}>
                    {team.position ? ['🥇', '🥈', '🥉'][team.position - 1] : `#${idx + 1}`}
                  </div>

                  {/* Team info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      <p style={{ fontFamily: "'Crimson Pro', Georgia, serif", fontSize: '1.1rem', fontWeight: 700, color: team.position ? status.color : '#eaeaea', margin: 0 }}>
                        {team.teamName}
                      </p>
                      {/* Status pill */}
                      <span style={{
                        display: 'inline-flex', alignItems: 'center', gap: 4,
                        padding: '2px 9px', borderRadius: 20,
                        background: `${status.color}12`, border: `1px solid ${status.color}30`,
                        fontFamily: "'JetBrains Mono', monospace", fontSize: '0.62rem',
                        color: status.color, fontWeight: 600,
                        whiteSpace: 'nowrap',
                      }}>
                        {status.emoji} {status.label}
                      </span>
                    </div>
                    <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.68rem', color: '#555', margin: '3px 0 0' }}>
                      {team.id} · Led by {team.leader} · <Users size={9} style={{ verticalAlign: 'middle' }} /> {team.members.length}
                    </p>
                  </div>

                  {/* Round qualification dots */}
                  <div style={{ display: 'flex', gap: 5, flexShrink: 0 }}>
                    {roundDots.map(({ r, color, icon }) => (
                      <div key={r} title={`Round ${r}: ${icon === '✓' ? 'Qualified' : icon === '✗' ? 'Eliminated' : 'Pending'}`}
                        style={{
                          width: 24, height: 24, borderRadius: 6,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          background: `${color}12`,
                          border: `1px solid ${color}35`,
                          fontFamily: "'JetBrains Mono', monospace",
                          fontSize: '0.62rem',
                          color,
                        }}>
                        R{r}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Footer ──────────────────────────────────────────────── */}
      <div style={{ textAlign: 'center', marginTop: '3rem', padding: '1.5rem 0', borderTop: '1px solid rgba(255,255,255,0.04)' }}>
        <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.68rem', color: '#333', lineHeight: 1.7 }}>
          Powered by <span style={{ color: '#C6A969' }}>Eventra</span> · This page updates automatically
        </p>
      </div>
    </div>
  );
};
