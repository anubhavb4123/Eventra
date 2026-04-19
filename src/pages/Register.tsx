import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ref, get, set, runTransaction, serverTimestamp } from 'firebase/database';
import { db } from '@/lib/firebase';
import { generateTeamId, formatDate } from '@/lib/utils';
import { withRetry } from '@/lib/db-retry';
import { GlassCard } from '@/components/GlassCard';
import { Input } from '@/components/Input';
import { Button } from '@/components/Button';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import type { EventDetails as EventDetailsType, EventSettings, MemberForm } from '@/types';
import { Calendar, MapPin, Users, Plus, Trash2, UserPlus, CreditCard, AlertCircle } from 'lucide-react';
import '@/styles/eventra-shared.css';

interface LocalMemberForm extends MemberForm {
  sameCollegeAsLeader?: boolean;
}

const emptyMember = (): LocalMemberForm => ({ name: '', rollNumber: '', college: '', branch: '', sameCollegeAsLeader: false });

export const Register: React.FC = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const [eventDetails, setEventDetails] = useState<EventDetailsType | null>(null);
  const [eventSettings, setEventSettings] = useState<EventSettings | null>(null);
  const [loadingEvent, setLoadingEvent] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [deadlinePassed, setDeadlinePassed] = useState(false);
  const [timeLeft, setTimeLeft] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);

  const [teamName, setTeamName] = useState('');
  const [leader, setLeader] = useState('');
  const [email, setEmail] = useState('');
  const [leaderRoll, setLeaderRoll] = useState('');
  const [leaderCollege, setLeaderCollege] = useState('');
  const [leaderBranch, setLeaderBranch] = useState('');
  const [members, setMembers] = useState<LocalMemberForm[]>([emptyMember()]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    const loadEvent = async () => {
      if (!eventId) return;
      try {
        const [eventSnap, detailsSnap, settingsSnap] = await Promise.all([
          withRetry(() => get(ref(db, `events/${eventId}`))),
          withRetry(() => get(ref(db, `events/${eventId}/details`))),
          withRetry(() => get(ref(db, `events/${eventId}/eventSettings`))),
        ]);
        if (!eventSnap.exists() || !detailsSnap.exists()) { setNotFound(true); return; }
        const d = detailsSnap.val() as EventDetailsType;
        const eData = eventSnap.val();
        const s = (settingsSnap.val() || { registrationOpen: true, registrationDeadline: (d as any).registrationDeadline, currentTeams: eData.teamCount || 0 }) as EventSettings;
        setEventDetails(d);
        setEventSettings(s);
        if (s.registrationDeadline && new Date(s.registrationDeadline) < new Date()) setDeadlinePassed(true);
      } catch (err) {
        console.error('Load Event Error:', err);
        setNotFound(true);
      } finally {
        setLoadingEvent(false);
      }
    };
    loadEvent();
  }, [eventId]);

  useEffect(() => {
    if (!eventSettings?.registrationDeadline) return;
    const deadline = new Date(eventSettings.registrationDeadline).getTime();
    const update = () => {
      const dist = deadline - Date.now();
      if (dist < 0) { setDeadlinePassed(true); setTimeLeft(''); return; }
      const d = Math.floor(dist / 86400000);
      const h = Math.floor((dist % 86400000) / 3600000);
      const m = Math.floor((dist % 3600000) / 60000);
      const s = Math.floor((dist % 60000) / 1000);
      setTimeLeft(`${d > 0 ? d + 'd ' : ''}${String(h).padStart(2,'0')}h ${String(m).padStart(2,'0')}m ${String(s).padStart(2,'0')}s`);
    };
    update();
    const iv = setInterval(update, 1000);
    return () => clearInterval(iv);
  }, [eventSettings?.registrationDeadline]);

  const validateForm = (): boolean => {
    const errs: Record<string, string> = {};
    if (!teamName.trim()) errs.teamName = 'Team name is required.';
    if (!leader.trim()) errs.leader = 'Leader name is required.';
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errs.email = 'Invalid email format.';
    const min = eventDetails?.teamSizeMin ?? 1;
    const max = eventDetails?.teamSizeMax ?? 10;
    const total = members.length + 1;
    if (total < min) errs.memberCount = `Minimum team size is ${min} (including leader).`;
    if (total > max) errs.memberCount = `Maximum team size is ${max} (including leader).`;
    members.forEach((m, i) => { if (!m.name.trim()) errs[`member_${i}_name`] = 'Name is required.'; });
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm() || !eventId) return;
    setSubmitting(true);
    try {
      if (email) {
        const emailKey = email.toLowerCase().replace(/\./g, ',');
        const emailSnap = await withRetry(() => get(ref(db, `events/${eventId}/registeredEmails/${emailKey}`)));
        if (emailSnap.exists()) { setErrors({ submit: 'This email is already registered for this event.' }); setSubmitting(false); return; }
      }
      const result = await runTransaction(ref(db, `events/${eventId}/eventSettings/currentTeams`), (current) => {
        const count = current || 0;
        if (eventSettings?.maxTeams && count >= eventSettings.maxTeams) return;
        return count + 1;
      });
      if (!result.committed) { setErrors({ submit: 'Registration full. No more teams can be accepted.' }); setSubmitting(false); return; }
      const newCount = result.snapshot.val();
      const teamId = generateTeamId(eventId, newCount);
      const teamCode = teamId.split('-').pop() || teamId;
      const allMembers = [
        { name: leader, rollNumber: leaderRoll, college: leaderCollege, branch: leaderBranch, present: false },
        ...members.map((m) => ({ name: m.name, rollNumber: m.rollNumber, college: m.sameCollegeAsLeader ? leaderCollege : m.college, branch: m.branch, present: false })),
      ];
      const updates: any = {};
      updates[`events/${eventId}/teams/${teamCode}`] = { teamId, teamName, leader, email: email || null, members: allMembers, attendanceMarked: false, createdAt: serverTimestamp() };
      if (email) { const emailKey = email.toLowerCase().replace(/\./g, ','); updates[`events/${eventId}/registeredEmails/${emailKey}`] = true; }
      await Object.keys(updates).reduce(async (promise, path) => {
        await promise;
        const keys = path.split('/'); const prop = keys.pop()!; const base = keys.join('/');
        return withRetry(() => set(ref(db, `${base}/${prop}`), updates[path]));
      }, Promise.resolve());
      navigate(`/registration-success/${eventId}/${teamId}`);
    } catch (err) {
      console.error('Registration Error:', err);
      setErrors({ submit: 'Registration failed. Check your connection and try again.' });
    } finally {
      setSubmitting(false);
    }
  };

  const addMember = () => { const max = (eventDetails?.teamSizeMax ?? 10) - 1; if (members.length < max) setMembers(p => [...p, emptyMember()]); };
  const removeMember = (i: number) => setMembers(p => p.filter((_, idx) => idx !== i));
  const updateMember = (i: number, field: keyof LocalMemberForm, value: string | boolean) =>
    setMembers(p => p.map((m, idx) => idx === i ? { ...m, [field]: value } : m));

  /* ── States ── */
  if (loadingEvent) return (
    <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <LoadingSpinner text="Loading event..." />
    </div>
  );

  if (notFound) return (
    <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
      <GlassCard style={{ maxWidth: 400, width: '100%', textAlign: 'center' }} padding="xl">
        <AlertCircle size={44} color="#F87171" style={{ margin: '0 auto 1rem' }} />
        <h2 style={{ fontFamily: "'Crimson Pro', Georgia, serif", fontSize: '2rem', color: '#eaeaea', marginBottom: '0.5rem' }}>Event Not Found</h2>
        <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.78rem', color: '#666' }}>
          The event "{eventId}" doesn't exist or has been removed.
        </p>
      </GlassCard>
    </div>
  );

  const registrationClosed = deadlinePassed || eventSettings?.registrationOpen === false || (!!eventSettings?.maxTeams && (eventSettings.currentTeams ?? 0) >= eventSettings.maxTeams);

  return (
    <div style={{ maxWidth: 780, margin: '0 auto', padding: '3rem 1.5rem' }}>

      {/* ── Event Info Card ─────────────────────────── */}
      <GlassCard accent style={{ marginBottom: '2rem' }} padding="lg">
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <span className="ev-pill ev-pill-gold" style={{ marginBottom: 12, display: 'inline-flex' }}>{eventId}</span>
            <h1 style={{ fontFamily: "'Crimson Pro', Georgia, serif", fontSize: 'clamp(1.8rem,4vw,2.4rem)', fontWeight: 700, color: '#eaeaea', marginBottom: '0.5rem', lineHeight: 1.1 }}>
              {eventDetails?.eventName}
            </h1>
            <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.78rem', color: '#666', lineHeight: 1.7, maxWidth: 500 }}>
              {eventDetails?.description}
            </p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'flex-end', flexShrink: 0 }}>
            {deadlinePassed && <span className="ev-pill ev-pill-red">⚠ Registration Closed</span>}
            {!deadlinePassed && eventSettings?.registrationOpen === false && <span className="ev-pill ev-pill-yellow">⚠ Registration Paused</span>}
            {!deadlinePassed && eventSettings?.maxTeams && (eventSettings.currentTeams ?? 0) >= eventSettings.maxTeams && <span className="ev-pill ev-pill-red">⚠ Registration Full</span>}
            {timeLeft && <span className="ev-pill ev-pill-green"><span className="ev-dot ev-dot-green" />Closes in: {timeLeft}</span>}
            {!registrationClosed && !timeLeft && <span className="ev-pill ev-pill-green"><span className="ev-dot ev-dot-green" />Open</span>}
          </div>
        </div>

        <div className="ev-divider-subtle" style={{ margin: '1.25rem 0' }} />

        <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
          {eventDetails?.dateTime && <InfoItem icon={<Calendar size={13} color="#C6A969" />} label="Date & Time" value={formatDate(eventDetails.dateTime)} />}
          {eventDetails?.venue && <InfoItem icon={<MapPin size={13} color="#C6A969" />} label="Venue" value={eventDetails.venue} />}
          <InfoItem icon={<Users size={13} color="#C6A969" />} label="Team Size" value={`${eventDetails?.teamSizeMin}–${eventDetails?.teamSizeMax} members`} />
          {eventDetails?.paymentLink && (
            <InfoItem icon={<CreditCard size={13} color="#C6A969" />} label="Payment"
              value={<a href={eventDetails.paymentLink} target="_blank" rel="noreferrer" style={{ color: '#C6A969', textDecoration: 'underline' }}>Pay Here</a>} />
          )}
        </div>
      </GlassCard>

      {/* ── Registration Form / Closed ──────────────── */}
      {!registrationClosed ? (
        <GlassCard>
          <h2 style={{ fontFamily: "'Crimson Pro', Georgia, serif", fontSize: '1.75rem', fontWeight: 700, color: '#eaeaea', marginBottom: '0.35rem' }}>
            Team Registration
          </h2>
          <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.75rem', color: '#555', marginBottom: '2rem' }}>
            Fill in your team details. The leader counts as a member.
          </p>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {/* Team info */}
            <div className="ev-section-row"><Users size={13} color="#C6A969" /><span className="ev-section-row-label">Team Information</span></div>
            <Input id="teamName" label="Team Name" placeholder="e.g. Project Nexus"
              value={teamName} onChange={(e) => setTeamName(e.target.value)} error={errors.teamName} />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <Input id="leader" label="Leader Name" placeholder="Full name"
                value={leader} onChange={(e) => setLeader(e.target.value)} error={errors.leader} />
              <Input id="email" label="Leader Email (Optional)" type="email" placeholder="leader@college.edu"
                value={email} onChange={(e) => setEmail(e.target.value)} error={errors.email} />
              <Input id="leaderRoll" label="Roll Number" placeholder="21CS001"
                value={leaderRoll} onChange={(e) => setLeaderRoll(e.target.value)} />
              <Input id="leaderCollege" label="College" placeholder="College name"
                value={leaderCollege} onChange={(e) => setLeaderCollege(e.target.value)} />
              <Input id="leaderBranch" label="Branch" placeholder="e.g. CSE, ECE"
                value={leaderBranch} onChange={(e) => setLeaderBranch(e.target.value)} />
            </div>

            {/* Members */}
            <div className="ev-section-row">
              <Users size={13} color="#C6A969" />
              <span className="ev-section-row-label">Team Members ({members.length + 1}/{eventDetails?.teamSizeMax})</span>
            </div>
            {errors.memberCount && <p className="ev-field-error">{errors.memberCount}</p>}

            {members.map((m, i) => (
              <div key={i} className="ev-card ev-card-p-md" style={{ border: '1px solid rgba(198,169,105,0.15)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                  <span className="ev-section-label">Member {i + 2}</span>
                  <button type="button" onClick={() => removeMember(i)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#555', display: 'flex', padding: 4, borderRadius: 6, transition: 'color 0.2s' }}
                    onMouseEnter={e => e.currentTarget.style.color = '#F87171'}
                    onMouseLeave={e => e.currentTarget.style.color = '#555'}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <Input id={`member_${i}_name`} label="Full Name" placeholder="Member name"
                    value={m.name} onChange={(e) => updateMember(i, 'name', e.target.value)} error={errors[`member_${i}_name`]} />
                  <Input id={`member_${i}_roll`} label="Roll Number" placeholder="21CS001"
                    value={m.rollNumber} onChange={(e) => updateMember(i, 'rollNumber', e.target.value)} />
                  <div style={{ gridColumn: '1 / -1', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <input type="checkbox" id={`same_college_${i}`} checked={m.sameCollegeAsLeader || false}
                      onChange={(e) => updateMember(i, 'sameCollegeAsLeader', e.target.checked)}
                      className="ev-checkbox" />
                    <label htmlFor={`same_college_${i}`} style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.76rem', color: '#888', cursor: 'pointer' }}>
                      Same college as leader
                    </label>
                  </div>
                  <Input id={`member_${i}_college`} label="College"
                    placeholder={m.sameCollegeAsLeader ? 'Same as leader' : 'College name'}
                    value={m.sameCollegeAsLeader ? leaderCollege : m.college}
                    onChange={(e) => updateMember(i, 'college', e.target.value)}
                    disabled={m.sameCollegeAsLeader} />
                  <Input id={`member_${i}_branch`} label="Branch" placeholder="e.g. CSE, ECE"
                    value={m.branch} onChange={(e) => updateMember(i, 'branch', e.target.value)} />
                </div>
              </div>
            ))}

            {members.length + 1 < (eventDetails?.teamSizeMax ?? 10) && (
              <button type="button" onClick={addMember} className="ev-btn ev-btn-ghost" style={{ alignSelf: 'flex-start', gap: 6 }}>
                <Plus size={14} /> Add Member
              </button>
            )}

            {errors.submit && (
              <div className="ev-alert ev-alert-error">
                <AlertCircle size={14} style={{ flexShrink: 0, marginTop: 1 }} />
                <span>{errors.submit}</span>
              </div>
            )}

            <Button type="submit" loading={submitting} fullWidth size="lg" icon={<UserPlus size={16} />}>
              Register Team
            </Button>
          </form>
        </GlassCard>
      ) : (
        <GlassCard style={{ textAlign: 'center' }} padding="xl">
          <AlertCircle size={44} color="#F87171" style={{ margin: '0 auto 1rem' }} />
          <h3 style={{ fontFamily: "'Crimson Pro', Georgia, serif", fontSize: '1.75rem', color: '#eaeaea', marginBottom: '0.5rem' }}>
            Registration Closed
          </h3>
          <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.78rem', color: '#666' }}>
            {deadlinePassed ? 'The registration deadline has passed.' :
              (eventSettings?.maxTeams && (eventSettings.currentTeams ?? 0) >= eventSettings.maxTeams) ? 'The event has reached its maximum capacity.' :
              'Registrations are currently paused by the organizer.'}
          </p>
        </GlassCard>
      )}
    </div>
  );
};

const InfoItem: React.FC<{ icon: React.ReactNode; label: string; value: React.ReactNode }> = ({ icon, label, value }) => (
  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
    <div style={{ marginTop: 2 }}>{icon}</div>
    <div>
      <p className="ev-section-label" style={{ marginBottom: 2 }}>{label}</p>
      <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.8rem', color: '#ccc', margin: 0 }}>{value}</p>
    </div>
  </div>
);
