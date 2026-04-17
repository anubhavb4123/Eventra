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
import {
  Calendar, MapPin, Users, Plus, Trash2, UserPlus, CreditCard, AlertCircle
} from 'lucide-react';

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
        
        if (!eventSnap.exists() || !detailsSnap.exists()) {
          setNotFound(true);
          return;
        }
        
        const d = detailsSnap.val() as EventDetailsType;
        const eData = eventSnap.val();
        // Fallback for older events without eventSettings
        const s = (settingsSnap.val() || {
           registrationOpen: true,
           registrationDeadline: (d as any).registrationDeadline,
           currentTeams: eData.teamCount || 0
        }) as EventSettings;

        setEventDetails(d);
        setEventSettings(s);
        
        if (s.registrationDeadline && new Date(s.registrationDeadline) < new Date()) {
          setDeadlinePassed(true);
        }
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
    
    const updateCountdown = () => {
      const now = new Date().getTime();
      const distance = deadline - now;
      if (distance < 0) {
        setDeadlinePassed(true);
        setTimeLeft('');
        return;
      }
      const d = Math.floor(distance / (1000 * 60 * 60 * 24));
      const h = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const m = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
      const s = Math.floor((distance % (1000 * 60)) / 1000);
      setTimeLeft(`${d > 0 ? d + 'd ' : ''}${h.toString().padStart(2, '0')}h ${m.toString().padStart(2, '0')}m ${s.toString().padStart(2, '0')}s`);
    };
    
    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [eventSettings?.registrationDeadline]);

  const validateForm = (): boolean => {
    const errs: Record<string, string> = {};
    if (!teamName.trim()) errs.teamName = 'Team name is required.';
    if (!leader.trim()) errs.leader = 'Leader name is required.';
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errs.email = 'Invalid email format.';

    const min = eventDetails?.teamSizeMin ?? 1;
    const max = eventDetails?.teamSizeMax ?? 10;
    const totalMembers = members.length + 1; // +1 for leader

    if (totalMembers < min) errs.memberCount = `Minimum team size is ${min} (including leader).`;
    if (totalMembers > max) errs.memberCount = `Maximum team size is ${max} (including leader).`;

    members.forEach((m, i) => {
      if (!m.name.trim()) errs[`member_${i}_name`] = 'Name is required.';
    });

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm() || !eventId) return;
    setSubmitting(true);
    try {
      if (email) {
        // Pre-check for duplicate email using utils.ts helper logic imported inline if missing
        const emailKey = email.toLowerCase().replace(/\./g, ',');
        const emailSnap = await withRetry(() => get(ref(db, `events/${eventId}/registeredEmails/${emailKey}`)));
        if (emailSnap.exists()) {
          setErrors({ submit: 'This email is already registered for this event.' });
          setSubmitting(false);
          return;
        }
      }

      // Atomic increment for currentTeams using transaction to prevent overbooking
      const transactionResult = await runTransaction(ref(db, `events/${eventId}/eventSettings/currentTeams`), (current) => {
        const count = current || 0;
        if (eventSettings?.maxTeams && count >= eventSettings.maxTeams) {
          return; // abort transaction by returning undefined
        }
        return count + 1;
      });

      if (!transactionResult.committed) {
        setErrors({ submit: 'Registration full. No more teams can be accepted.' });
        setSubmitting(false);
        return;
      }

      const newCount = transactionResult.snapshot.val();
      const teamId = generateTeamId(eventId, newCount);
      const teamCode = teamId.split('-').pop() || teamId;

      // Build members list with leader first
      const allMembers = [
        { name: leader, rollNumber: leaderRoll, college: leaderCollege, branch: leaderBranch, present: false },
        ...members.map((m) => ({ 
           name: m.name, 
           rollNumber: m.rollNumber, 
           college: m.sameCollegeAsLeader ? leaderCollege : m.college, 
           branch: m.branch, 
           present: false 
        })),
      ];

      const updates: any = {};
      updates[`events/${eventId}/teams/${teamCode}`] = {
        teamId, // optionally store full teamId
        teamName,
        leader,
        email: email || null,
        members: allMembers,
        attendanceMarked: false,
        createdAt: serverTimestamp(),
      };
      
      if (email) {
         const emailKey = email.toLowerCase().replace(/\./g, ',');
         updates[`events/${eventId}/registeredEmails/${emailKey}`] = true;
      }

      await Object.keys(updates).reduce(async (promise, path) => {
        await promise;
        const keys = path.split('/');
        const prop = keys.pop()!;
        const basePath = keys.join('/');
        return withRetry(() => set(ref(db, `${basePath}/${prop}`), updates[path]));
      }, Promise.resolve());

      navigate(`/registration-success/${eventId}/${teamId}`);
    } catch (err) {
      console.error('Registration Error:', err);
      setErrors({ submit: 'Registration failed. Please check your connection and try again.' });
    } finally {
      setSubmitting(false);
    }
  };

  const addMember = () => {
    const max = (eventDetails?.teamSizeMax ?? 10) - 1; // -1 for leader
    if (members.length < max) setMembers((prev) => [...prev, emptyMember()]);
  };

  const removeMember = (i: number) => {
    setMembers((prev) => prev.filter((_, idx) => idx !== i));
  };

  const updateMember = (i: number, field: keyof LocalMemberForm, value: string | boolean) => {
    setMembers((prev) => prev.map((m, idx) => idx === i ? { ...m, [field]: value } : m));
  };

  if (loadingEvent) {
    return (
      <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <LoadingSpinner text="Loading event..." />
      </div>
    );
  }

  if (notFound) {
    return (
      <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
        <GlassCard style={{ maxWidth: 400, width: '100%', textAlign: 'center' }}>
          <AlertCircle size={48} color="#F87171" style={{ margin: '0 auto 1rem' }} />
          <h2 style={{ fontFamily: "'Crimson Pro', Georgia, serif", fontSize: '2rem', color: '#EAEAEA', marginBottom: '0.5rem' }}>Event Not Found</h2>
          <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.8rem', color: '#9A9A9A' }}>
            The event ID "{eventId}" doesn't exist or has been removed.
          </p>
        </GlassCard>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 780, margin: '0 auto', padding: '3rem 1.5rem' }}>
      {/* Event Info Card */}
      <GlassCard style={{ marginBottom: '2rem' }} padding="lg">
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <span style={{
              fontFamily: "'JetBrains Mono', monospace", fontSize: '0.72rem', color: '#C6A969',
              padding: '0.2rem 0.65rem', borderRadius: '9999px',
              background: 'rgba(198,169,105,0.1)', border: '1px solid rgba(198,169,105,0.2)',
            }}>
              {eventId}
            </span>
            <h1 style={{ fontFamily: "'Crimson Pro', Georgia, serif", fontSize: '2.25rem', fontWeight: 700, color: '#EAEAEA', margin: '0.75rem 0 0.5rem' }}>
              {eventDetails?.eventName}
            </h1>
            <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.82rem', color: '#9A9A9A', lineHeight: 1.7, maxWidth: 500 }}>
              {eventDetails?.description}
            </p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', alignItems: 'flex-end' }}>
            {deadlinePassed && (
              <div style={{
                padding: '0.5rem 1rem', borderRadius: '0.5rem',
                background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.3)',
                fontFamily: "'JetBrains Mono', monospace", fontSize: '0.75rem', color: '#F87171',
              }}>
                ⚠ Registration Closed
              </div>
            )}
            {!deadlinePassed && eventSettings?.registrationOpen === false && (
              <div style={{
                padding: '0.5rem 1rem', borderRadius: '0.5rem',
                background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.3)',
                fontFamily: "'JetBrains Mono', monospace", fontSize: '0.75rem', color: '#F87171',
              }}>
                ⚠ Registration Paused
              </div>
            )}
            {!deadlinePassed && eventSettings?.maxTeams && eventSettings.currentTeams >= eventSettings.maxTeams && (
              <div style={{
                padding: '0.5rem 1rem', borderRadius: '0.5rem',
                background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.3)',
                fontFamily: "'JetBrains Mono', monospace", fontSize: '0.75rem', color: '#F87171',
              }}>
                ⚠ Registration Full
              </div>
            )}
            {timeLeft && (
              <div style={{
                padding: '0.5rem 1rem', borderRadius: '0.5rem',
                background: 'rgba(74,222,128,0.1)', border: '1px solid rgba(74,222,128,0.3)',
                fontFamily: "'JetBrains Mono', monospace", fontSize: '0.75rem', color: '#4ADE80',
              }}>
                Closes in: {timeLeft}
              </div>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', gap: '2rem', marginTop: '1.5rem', flexWrap: 'wrap' }}>
          {eventDetails?.dateTime && (
            <InfoItem icon={<Calendar size={14} color="#C6A969" />} label="Date & Time" value={formatDate(eventDetails.dateTime)} />
          )}
          {eventDetails?.venue && (
            <InfoItem icon={<MapPin size={14} color="#C6A969" />} label="Venue" value={eventDetails.venue} />
          )}
          <InfoItem
            icon={<Users size={14} color="#C6A969" />}
            label="Team Size"
            value={`${eventDetails?.teamSizeMin}–${eventDetails?.teamSizeMax} members`}
          />
          {eventDetails?.paymentLink && (
            <InfoItem
              icon={<CreditCard size={14} color="#C6A969" />}
              label="Payment"
              value={<a href={eventDetails.paymentLink} target="_blank" rel="noreferrer" style={{ color: '#C6A969', textDecoration: 'underline' }}>Pay Here</a>}
            />
          )}
        </div>
      </GlassCard>

      {/* Registration Form */}
      {(!deadlinePassed && eventSettings?.registrationOpen !== false && (!eventSettings?.maxTeams || eventSettings.currentTeams < eventSettings.maxTeams)) ? (
        <GlassCard>
          <h2 style={{ fontFamily: "'Crimson Pro', Georgia, serif", fontSize: '1.75rem', fontWeight: 700, color: '#EAEAEA', marginBottom: '0.5rem' }}>
            Team Registration
          </h2>
          <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.78rem', color: '#6a6a6a', marginBottom: '2rem' }}>
            Fill in the details for your team. The leader is counted as a member.
          </p>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {/* Team Info */}
            <SectionHeader title="Team Information" />
            <Input
              id="teamName"
              label="Team Name"
              placeholder="e.g. Project Nexus"
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
              error={errors.teamName}
            />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <Input
                id="leader"
                label="Leader Name"
                placeholder="Team leader's full name"
                value={leader}
                onChange={(e) => setLeader(e.target.value)}
                error={errors.leader}
              />
              <Input
                id="email"
                label="Leader Email (Optional)"
                type="email"
                placeholder="leader@college.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                error={errors.email}
              />
              <Input
                id="leaderRoll"
                label="Roll Number"
                placeholder="21CS001"
                value={leaderRoll}
                onChange={(e) => setLeaderRoll(e.target.value)}
              />
              <Input
                id="leaderCollege"
                label="College"
                placeholder="College name"
                value={leaderCollege}
                onChange={(e) => setLeaderCollege(e.target.value)}
              />
              <Input
                id="leaderBranch"
                label="Branch"
                placeholder="e.g. CSE, ECE"
                value={leaderBranch}
                onChange={(e) => setLeaderBranch(e.target.value)}
              />
            </div>

            {/* Members */}
            <SectionHeader title={`Team Members (${members.length + 1}/${eventDetails?.teamSizeMax})`} />
            {errors.memberCount && (
              <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.75rem', color: '#F87171' }}>{errors.memberCount}</p>
            )}

            {members.map((m, i) => (
              <div
                key={i}
                className="glass-card"
                style={{ padding: '1.25rem', position: 'relative', border: '1px solid rgba(198,169,105,0.15)' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                  <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.72rem', color: '#6a6a6a', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                    Member {i + 2}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeMember(i)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#F87171', display: 'flex', alignItems: 'center' }}
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <Input
                    id={`member_${i}_name`}
                    label="Full Name"
                    placeholder="Member name"
                    value={m.name}
                    onChange={(e) => updateMember(i, 'name', e.target.value)}
                    error={errors[`member_${i}_name`]}
                  />
                  <Input
                    id={`member_${i}_roll`}
                    label="Roll Number"
                    placeholder="21CS001"
                    value={m.rollNumber}
                    onChange={(e) => updateMember(i, 'rollNumber', e.target.value)}
                  />

                  <div style={{ gridColumn: '1 / -1', display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.25rem' }}>
                    <input 
                      type="checkbox" 
                      id={`same_college_${i}`}
                      checked={m.sameCollegeAsLeader || false}
                      onChange={(e) => updateMember(i, 'sameCollegeAsLeader', e.target.checked)}
                      style={{ accentColor: '#C6A969', width: '16px', height: '16px', cursor: 'pointer' }}
                    />
                    <label htmlFor={`same_college_${i}`} style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.8rem', color: '#EAEAEA', cursor: 'pointer' }}>
                      College same as leader
                    </label>
                  </div>

                  <Input
                    id={`member_${i}_college`}
                    label="College"
                    placeholder={m.sameCollegeAsLeader ? 'Same as leader' : 'College name'}
                    value={m.sameCollegeAsLeader ? leaderCollege : m.college}
                    onChange={(e) => updateMember(i, 'college', e.target.value)}
                    disabled={m.sameCollegeAsLeader}
                  />
                  <Input
                    id={`member_${i}_branch`}
                    label="Branch"
                    placeholder="e.g. CSE, ECE"
                    value={m.branch}
                    onChange={(e) => updateMember(i, 'branch', e.target.value)}
                  />
                </div>
              </div>
            ))}

            {members.length + 1 < (eventDetails?.teamSizeMax ?? 10) && (
              <button type="button" onClick={addMember} className="btn-secondary" style={{ alignSelf: 'flex-start' }}>
                <Plus size={15} /> Add Member
              </button>
            )}

            {errors.submit && (
              <p style={{
                fontFamily: "'JetBrains Mono', monospace", fontSize: '0.78rem', color: '#F87171',
                padding: '0.75rem', background: 'rgba(248,113,113,0.08)', borderRadius: '0.5rem',
                border: '1px solid rgba(248,113,113,0.2)',
              }}>
                {errors.submit}
              </p>
            )}

            <Button type="submit" loading={submitting} icon={<UserPlus size={16} />} fullWidth>
              Register Team
            </Button>
          </form>
        </GlassCard>
      ) : (
        <GlassCard style={{ textAlign: 'center', padding: '3rem' }}>
          <AlertCircle size={48} color="#F87171" style={{ margin: '0 auto 1rem' }} />
          <h3 style={{ fontFamily: "'Crimson Pro', Georgia, serif", fontSize: '1.5rem', color: '#EAEAEA' }}>
            Registration Closed
          </h3>
          <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.8rem', color: '#9A9A9A', marginTop: '0.5rem' }}>
            {deadlinePassed ? 'The registration deadline has passed.' : 
             (eventSettings?.maxTeams && eventSettings.currentTeams >= eventSettings.maxTeams) ? 'The event has reached its maximum capacity.' : 'Registrations are currently paused by the organizer.'}
          </p>
        </GlassCard>
      )}
    </div>
  );
};

const InfoItem: React.FC<{ icon: React.ReactNode; label: string; value: React.ReactNode }> = ({ icon, label, value }) => (
  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
    <div style={{ marginTop: 2 }}>{icon}</div>
    <div>
      <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.7rem', color: '#6a6a6a', letterSpacing: '0.08em', textTransform: 'uppercase', margin: '0 0 0.15rem' }}>
        {label}
      </p>
      <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.82rem', color: '#EAEAEA', margin: 0 }}>
        {value}
      </p>
    </div>
  </div>
);

const SectionHeader: React.FC<{ title: string }> = ({ title }) => (
  <div style={{
    paddingBottom: '0.5rem', borderBottom: '1px solid rgba(198,169,105,0.1)',
    fontFamily: "'JetBrains Mono', monospace", fontSize: '0.72rem',
    color: '#9A9A9A', letterSpacing: '0.1em', textTransform: 'uppercase',
  }}>
    {title}
  </div>
);
