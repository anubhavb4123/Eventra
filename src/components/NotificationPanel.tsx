import React, { useState, useEffect } from 'react';
import { GlassCard } from './GlassCard';
import { Input } from './Input';
import { Textarea } from './Textarea';
import { Button } from './Button';
import { BellRing, AlertCircle, CheckCheck, Send, Users, Trophy, Award, CheckSquare, Square, Clock } from 'lucide-react';
import { ref, push, onValue, serverTimestamp } from 'firebase/database';
import { db } from '@/lib/firebase';
import { withRetry } from '@/lib/db-retry';
import type { TeamWithId } from '@/types';

interface NotificationPanelProps {
  eventId: string;
  eventName?: string;
  teams: TeamWithId[];
}

type NotificationTarget = 'all_teams' | 'qualified_round' | 'winners' | 'specific_teams';

interface QueuedItem {
  id: string;
  title: string;
  body: string;
  target: string;
  targetRound?: number;
  teamCodes?: string[];
  createdAt: number;
  processed?: boolean;
  processedAt?: number;
  result?: { sent: number; failed: number };
}

export const NotificationPanel: React.FC<NotificationPanelProps> = ({ eventId, eventName, teams }) => {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [url, setUrl] = useState('');
  const [target, setTarget] = useState<NotificationTarget>('all_teams');
  const [selectedRound, setSelectedRound] = useState<number>(1);
  const [selectedTeamCodes, setSelectedTeamCodes] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{ type: 'error' | 'success'; text: string } | null>(null);
  const [recentQueue, setRecentQueue] = useState<QueuedItem[]>([]);

  const teamsWithPush = teams.filter(t => t.fcmToken);

  // Calculate target audience counts
  const getRecipientTeams = (): TeamWithId[] => {
    switch (target) {
      case 'all_teams':
        return teamsWithPush;
      case 'qualified_round':
        return teamsWithPush.filter(t => t.qualifications?.[String(selectedRound)] === true);
      case 'winners':
        return teamsWithPush.filter(t => t.position && t.position > 0);
      case 'specific_teams':
        return teamsWithPush.filter(t => selectedTeamCodes.includes(t.id));
      default:
        return teamsWithPush;
    }
  };

  const recipientTeams = getRecipientTeams();

  // Listen to recent queued broadcasts in RTDB
  useEffect(() => {
    if (!eventId) return;
    const queueRef = ref(db, `notificationQueue/${eventId}`);
    const unsubscribe = onValue(queueRef, (snapshot) => {
      if (!snapshot.exists()) {
        setRecentQueue([]);
        return;
      }
      const data = snapshot.val();
      const list: QueuedItem[] = Object.entries(data).map(([id, val]: [string, any]) => ({
        id,
        title: val.title || '',
        body: val.body || '',
        target: val.target || 'all_teams',
        targetRound: val.targetRound,
        teamCodes: val.teamCodes,
        createdAt: val.createdAt || Date.now(),
        processed: !!val.processed,
        processedAt: val.processedAt,
        result: val.result,
      }));
      list.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
      setRecentQueue(list.slice(0, 5));
    });

    return () => unsubscribe();
  }, [eventId]);

  const toggleTeamSelection = (teamId: string) => {
    setSelectedTeamCodes(prev =>
      prev.includes(teamId) ? prev.filter(id => id !== teamId) : [...prev, teamId]
    );
  };

  const selectAllPushTeams = () => {
    setSelectedTeamCodes(teamsWithPush.map(t => t.id));
  };

  const clearTeamSelection = () => {
    setSelectedTeamCodes([]);
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !body.trim()) {
      setStatus({ type: 'error', text: 'Notification title and message are required.' });
      return;
    }

    if (target === 'specific_teams' && selectedTeamCodes.length === 0) {
      setStatus({ type: 'error', text: 'Please select at least one registered team.' });
      return;
    }

    setLoading(true);
    setStatus(null);

    try {
      const queueRef = ref(db, `notificationQueue/${eventId}`);
      await withRetry(async () => {
        await push(queueRef, {
          title: title.trim(),
          body: body.trim(),
          target,
          ...(target === 'qualified_round' ? { targetRound: selectedRound } : {}),
          ...(target === 'specific_teams' ? { teamCodes: selectedTeamCodes } : {}),
          url: url.trim() || `/register/${eventId}`,
          createdAt: serverTimestamp(),
          processed: false,
          source: 'organizer_dashboard',
        });
      });

      setStatus({
        type: 'success',
        text: `Push notification queued for ${recipientTeams.length} registered device(s)! The server will dispatch it momentarily.`,
      });
      setTitle('');
      setBody('');
      setUrl('');
      if (target === 'specific_teams') setSelectedTeamCodes([]);
    } catch (err: any) {
      console.error('[FCM Broadcast] Failed to queue notification:', err);
      setStatus({
        type: 'error',
        text: err?.message || 'Failed to queue push notification. Please check database permissions.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem', maxWidth: 1050 }}>
      {/* Compose Card */}
      <GlassCard>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: 'rgba(198,169,105,0.12)', border: '1px solid rgba(198,169,105,0.25)',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <BellRing size={18} color="#C6A969" />
          </div>
          <div>
            <h3 style={{ fontFamily: "'Crimson Pro', Georgia, serif", fontSize: '1.5rem', fontWeight: 700, color: '#EAEAEA', margin: 0 }}>
              Push Notification Broadcast
            </h3>
            <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.75rem', color: '#888', margin: '0.2rem 0 0' }}>
              Direct device push alerts to registered teams & participants.
            </p>
          </div>
        </div>

        {/* Audience Count Summary */}
        <div style={{
          padding: '0.75rem 1rem', borderRadius: '0.75rem', background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.06)', marginBottom: '1.25rem',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
            <Users size={14} color="#C6A969" />
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.75rem', color: '#BBB' }}>
              Target Audience: <strong style={{ color: '#EAEAEA' }}>{recipientTeams.length}</strong> Registered Device{recipientTeams.length !== 1 ? 's' : ''}
            </span>
          </div>
          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.75rem', color: '#888' }}>
            ({teamsWithPush.length}/{teams.length} teams enabled)
          </span>
        </div>

        <form onSubmit={handleSend} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Target Audience Selector */}
          <div>
            <label style={{ display: 'block', fontFamily: "'JetBrains Mono', monospace", fontSize: '0.72rem', color: '#888', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>
              Select Recipients
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 8 }}>
              {[
                { id: 'all_teams', label: 'All Registered Teams', icon: <Users size={13} />, desc: `${teamsWithPush.length} active` },
                { id: 'qualified_round', label: 'Qualified Teams', icon: <Trophy size={13} />, desc: 'By Round' },
                { id: 'winners', label: 'Winner Teams', icon: <Award size={13} />, desc: '1st, 2nd, 3rd' },
                { id: 'specific_teams', label: 'Selected Teams', icon: <CheckSquare size={13} />, desc: `${selectedTeamCodes.length} chosen` },
              ].map((opt) => {
                const active = target === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setTarget(opt.id as any)}
                    style={{
                      padding: '9px 10px',
                      borderRadius: 8,
                      textAlign: 'left',
                      background: active ? 'rgba(198,169,105,0.12)' : 'rgba(255,255,255,0.02)',
                      border: `1px solid ${active ? 'rgba(198,169,105,0.4)' : 'rgba(255,255,255,0.06)'}`,
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                      <span style={{ color: active ? '#C6A969' : '#888' }}>{opt.icon}</span>
                      <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.72rem', fontWeight: 600, color: active ? '#C6A969' : '#CCC' }}>
                        {opt.label}
                      </span>
                    </div>
                    <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.62rem', color: '#666', display: 'block' }}>
                      {opt.desc}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Round selector if qualified_round selected */}
          {target === 'qualified_round' && (
            <div style={{ padding: '10px 14px', borderRadius: 8, background: 'rgba(129,140,248,0.08)', border: '1px solid rgba(129,140,248,0.2)' }}>
              <label style={{ display: 'block', fontFamily: "'JetBrains Mono', monospace", fontSize: '0.72rem', color: '#818CF8', marginBottom: 6 }}>
                Target Qualified Round:
              </label>
              <div style={{ display: 'flex', gap: 8 }}>
                {[1, 2, 3, 4, 5].map((r) => {
                  const qualifiedCount = teamsWithPush.filter(t => t.qualifications?.[String(r)] === true).length;
                  const active = selectedRound === r;
                  return (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setSelectedRound(r)}
                      style={{
                        padding: '6px 12px',
                        borderRadius: 6,
                        background: active ? '#818CF8' : 'rgba(255,255,255,0.04)',
                        color: active ? '#0F1026' : '#CCC',
                        border: '1px solid rgba(129,140,248,0.3)',
                        fontFamily: "'JetBrains Mono', monospace",
                        fontSize: '0.72rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      Round {r} ({qualifiedCount})
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Specific team selector if specific_teams selected */}
          {target === 'specific_teams' && (
            <div style={{ padding: '10px 14px', borderRadius: 8, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.72rem', color: '#BBB' }}>
                  Select Teams ({selectedTeamCodes.length} selected):
                </span>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button type="button" onClick={selectAllPushTeams} className="ev-btn ev-btn-ghost ev-btn-sm" style={{ padding: '2px 6px', fontSize: '0.65rem' }}>Select All</button>
                  <button type="button" onClick={clearTeamSelection} className="ev-btn ev-btn-ghost ev-btn-sm" style={{ padding: '2px 6px', fontSize: '0.65rem' }}>Clear</button>
                </div>
              </div>
              <div style={{ maxHeight: 150, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 4 }}>
                {teams.map((t) => {
                  const selected = selectedTeamCodes.includes(t.id);
                  const hasPush = !!t.fcmToken;
                  return (
                    <div
                      key={t.id}
                      onClick={() => hasPush && toggleTeamSelection(t.id)}
                      style={{
                        padding: '5px 8px',
                        borderRadius: 6,
                        background: selected ? 'rgba(198,169,105,0.12)' : 'rgba(255,255,255,0.01)',
                        border: `1px solid ${selected ? 'rgba(198,169,105,0.3)' : 'transparent'}`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        cursor: hasPush ? 'pointer' : 'not-allowed',
                        opacity: hasPush ? 1 : 0.4,
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        {selected ? <CheckSquare size={13} color="#C6A969" /> : <Square size={13} color="#555" />}
                        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.72rem', color: selected ? '#C6A969' : '#CCC' }}>
                          {t.id} · {t.teamName}
                        </span>
                      </div>
                      <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.62rem', color: hasPush ? '#4ADE80' : '#666' }}>
                        {hasPush ? 'Push Active' : 'No Push'}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <Input
            id="notif_title"
            label="Notification Title"
            placeholder="e.g. 📢 Round 2 Starting in 15 Minutes!"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />

          <Textarea
            id="notif_body"
            label="Message Body"
            placeholder="e.g. Please proceed to Lab 3. Attendance scanning is now active."
            value={body}
            onChange={(e) => setBody(e.target.value)}
          />

          <Input
            id="notif_url"
            label="Action Link / URL (Optional)"
            placeholder={`/register/${eventId}`}
            value={url}
            onChange={(e) => setUrl(e.target.value)}
          />

          {status && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: '0.75rem',
              padding: '0.75rem 1rem', borderRadius: '0.75rem',
              background: status.type === 'error' ? 'rgba(248,113,113,0.1)' : 'rgba(74,222,128,0.1)',
              border: status.type === 'error' ? '1px solid rgba(248,113,113,0.3)' : '1px solid rgba(74,222,128,0.3)',
            }}>
              {status.type === 'error' ? <AlertCircle size={16} color="#F87171" style={{ flexShrink: 0 }} /> : <CheckCheck size={16} color="#4ADE80" style={{ flexShrink: 0 }} />}
              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.78rem', color: status.type === 'error' ? '#F87171' : '#4ADE80' }}>
                {status.text}
              </span>
            </div>
          )}

          <Button type="submit" loading={loading} icon={<Send size={15} />} fullWidth disabled={recipientTeams.length === 0}>
            Send Push to {recipientTeams.length} Registered Team{recipientTeams.length !== 1 ? 's' : ''}
          </Button>
        </form>
      </GlassCard>

      {/* Recent Broadcast History */}
      <GlassCard>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: 'rgba(129,140,248,0.12)', border: '1px solid rgba(129,140,248,0.25)',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <Clock size={18} color="#818CF8" />
          </div>
          <div>
            <h3 style={{ fontFamily: "'Crimson Pro', Georgia, serif", fontSize: '1.4rem', fontWeight: 700, color: '#EAEAEA', margin: 0 }}>
              Recent Broadcasts
            </h3>
            <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.72rem', color: '#888', margin: '0.2rem 0 0' }}>
              Live server dispatch queue
            </p>
          </div>
        </div>

        {recentQueue.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2.5rem 1rem', border: '1px dashed rgba(255,255,255,0.08)', borderRadius: 12 }}>
            <BellRing size={28} color="#333" style={{ margin: '0 auto 0.75rem' }} />
            <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.78rem', color: '#666', margin: 0 }}>
              No broadcast sent yet for this event.
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {recentQueue.map((item) => (
              <div
                key={item.id}
                style={{
                  padding: '12px 14px',
                  borderRadius: 10,
                  background: 'rgba(255,255,255,0.02)',
                  border: '1px solid rgba(255,255,255,0.06)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, marginBottom: 4 }}>
                  <span style={{ fontFamily: "'Crimson Pro', Georgia, serif", fontSize: '1rem', fontWeight: 700, color: '#EAEAEA' }}>
                    {item.title}
                  </span>
                  <span style={{
                    padding: '2px 8px', borderRadius: 12,
                    fontSize: '0.65rem', fontFamily: "'JetBrains Mono', monospace", fontWeight: 700,
                    background: item.processed ? 'rgba(74,222,128,0.1)' : 'rgba(251,191,36,0.1)',
                    color: item.processed ? '#4ADE80' : '#FBBF24',
                    border: `1px solid ${item.processed ? 'rgba(74,222,128,0.3)' : 'rgba(251,191,36,0.3)'}`,
                  }}>
                    {item.processed ? '✓ Sent' : '⏳ Queued'}
                  </span>
                </div>
                <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.74rem', color: '#888', margin: '0 0 8px', lineHeight: 1.4 }}>
                  {item.body}
                </p>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.65rem', fontFamily: "'JetBrains Mono', monospace", color: '#555' }}>
                  <span>Target: {item.target === 'all_teams' ? 'All Teams' : item.target === 'qualified_round' ? `Round ${item.targetRound} Qualifiers` : item.target === 'winners' ? 'Winners' : 'Selected Teams'}</span>
                  {item.result && (
                    <span style={{ color: '#4ADE80' }}>
                      Dispatched: {item.result.sent} devices {item.result.failed > 0 ? `(${item.result.failed} failed)` : ''}
                    </span>
                  )}
                  <span>{new Date(item.createdAt).toLocaleTimeString()}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </GlassCard>
    </div>
  );
};
