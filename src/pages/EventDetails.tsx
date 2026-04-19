import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ref, get, set } from 'firebase/database';
import { db } from '@/lib/firebase';
import { withRetry } from '@/lib/db-retry';
import { GlassCard } from '@/components/GlassCard';
import { Input } from '@/components/Input';
import { Textarea } from '@/components/Textarea';
import { Button } from '@/components/Button';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { Calendar, MapPin, Users, LinkIcon, FileText, Copy, CheckCheck, Zap, ShieldAlert } from 'lucide-react';
import '@/styles/eventra-shared.css';

export const EventDetails: React.FC = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [copied, setCopied] = useState(false);
  const [existing, setExisting] = useState(false);
  const [form, setForm] = useState({
    eventName: '', description: '', dateTime: '',
    teamSizeMin: '1', teamSizeMax: '5', venue: '',
    registrationDeadline: '', paymentLink: '',
    registrationOpen: true, maxTeams: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const registrationUrl = `${window.location.origin}/register/${eventId}`;

  useEffect(() => {
    const fetchDetails = async () => {
      if (!eventId) return;
      setLoading(true);
      try {
        const [detailsSnap, settingsSnap] = await Promise.all([
          withRetry(() => get(ref(db, `events/${eventId}/details`))),
          withRetry(() => get(ref(db, `events/${eventId}/eventSettings`)))
        ]);
        if (detailsSnap.exists() || settingsSnap.exists()) {
          const data = detailsSnap.val() || {};
          const settings = settingsSnap.val() || {};
          setForm({
            eventName: data.eventName ?? '',
            description: data.description ?? '',
            dateTime: data.dateTime ?? '',
            teamSizeMin: String(data.teamSizeMin ?? 1),
            teamSizeMax: String(data.teamSizeMax ?? 5),
            venue: data.venue ?? '',
            registrationDeadline: settings.registrationDeadline ?? data.registrationDeadline ?? '',
            paymentLink: data.paymentLink ?? '',
            registrationOpen: settings.registrationOpen ?? true,
            maxTeams: settings.maxTeams ? String(settings.maxTeams) : '',
          });
          setExisting(true);
        }
      } catch (err) {
        console.error('Fetch Details Error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchDetails();
  }, [eventId]);

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!form.eventName.trim()) errs.eventName = 'Event name is required.';
    if (!form.description.trim()) errs.description = 'Description is required.';
    if (!form.venue.trim()) errs.venue = 'Venue / mode is required.';
    if (Number(form.teamSizeMin) < 1) errs.teamSizeMin = 'Min must be ≥ 1.';
    if (Number(form.teamSizeMax) < Number(form.teamSizeMin)) errs.teamSizeMax = 'Max must be ≥ min.';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate() || !eventId) return;
    setSaving(true);
    try {
      const settingsSnap = await withRetry(() => get(ref(db, `events/${eventId}/eventSettings`)));
      const currentSettings = settingsSnap.val() || { currentTeams: 0 };
      await Promise.all([
        withRetry(() => set(ref(db, `events/${eventId}/details`), {
          eventName: form.eventName, description: form.description, dateTime: form.dateTime,
          teamSizeMin: Number(form.teamSizeMin), teamSizeMax: Number(form.teamSizeMax),
          venue: form.venue, paymentLink: form.paymentLink || null,
        })),
        withRetry(() => set(ref(db, `events/${eventId}/eventSettings`), {
          ...currentSettings, registrationOpen: form.registrationOpen,
          registrationDeadline: form.registrationDeadline || null,
          maxTeams: form.maxTeams ? Number(form.maxTeams) : null,
          currentTeams: currentSettings.currentTeams || 0,
        }))
      ]);
      setSaved(true);
      setExisting(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      console.error('Save Details Error:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(registrationUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <LoadingSpinner text="Loading event details..." />
      </div>
    );
  }

  const SRow = ({ icon, label }: { icon: React.ReactNode; label: string }) => (
    <div className="ev-section-row" style={{ marginTop: 8 }}>
      {icon}
      <span className="ev-section-row-label">{label}</span>
    </div>
  );

  return (
    <div style={{ maxWidth: 720, margin: '0 auto', padding: '3rem 1.5rem' }}>
      {/* Header */}
      <div style={{ marginBottom: '2.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
          <span className="ev-pill ev-pill-gold">{eventId}</span>
          {existing && <span className="ev-pill ev-pill-green"><span className="ev-dot ev-dot-green" />Configured</span>}
        </div>
        <h1 style={{ fontFamily: "'Crimson Pro', Georgia, serif", fontSize: 'clamp(2rem,5vw,3rem)', fontWeight: 700, color: '#eaeaea', marginBottom: '0.5rem', lineHeight: 1.1 }}>
          Event Details
        </h1>
        <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.78rem', color: '#555', lineHeight: 1.7 }}>
          Configure your event. Teams will see this on the registration page.
        </p>
      </div>

      {/* Registration URL */}
      <GlassCard padding="sm" style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10, flexShrink: 0,
            background: 'rgba(198,169,105,0.08)', border: '1px solid rgba(198,169,105,0.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <LinkIcon size={15} color="#C6A969" />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p className="ev-section-label" style={{ marginBottom: 3 }}>Registration URL</p>
            <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.75rem', color: '#C6A969', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {registrationUrl}
            </p>
          </div>
          <button
            onClick={handleCopy}
            className="ev-btn ev-btn-secondary ev-btn-sm"
            style={{ flexShrink: 0, gap: 6 }}
          >
            {copied ? <CheckCheck size={13} /> : <Copy size={13} />}
            {copied ? 'Copied' : 'Copy'}
          </button>
        </div>
      </GlassCard>

      {/* Form */}
      <GlassCard accent>
        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <SRow icon={<FileText size={14} color="#C6A969" />} label="Basic Information" />
          <Input id="eventName" label="Event Name" placeholder="e.g. National Hackathon 2026"
            value={form.eventName} onChange={(e) => setForm((f) => ({ ...f, eventName: e.target.value }))} error={errors.eventName} />
          <Textarea id="description" label="Description" placeholder="Tell participants what this event is about..."
            value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} error={errors.description} />

          <SRow icon={<Calendar size={14} color="#C6A969" />} label="Schedule" />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <Input id="dateTime" label="Date & Time" type="datetime-local"
              value={form.dateTime} onChange={(e) => setForm((f) => ({ ...f, dateTime: e.target.value }))} />
            <Input id="registrationDeadline" label="Registration Deadline" type="datetime-local"
              value={form.registrationDeadline} onChange={(e) => setForm((f) => ({ ...f, registrationDeadline: e.target.value }))} />
          </div>

          <SRow icon={<ShieldAlert size={14} color="#C6A969" />} label="Registration Control" />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', alignItems: 'end' }}>
            <div className="ev-field-wrap">
              <label className="ev-label">Status</label>
              <button
                type="button"
                onClick={() => setForm(f => ({ ...f, registrationOpen: !f.registrationOpen }))}
                className={['ev-btn', form.registrationOpen ? 'ev-btn-secondary' : 'ev-btn-danger'].join(' ')}
                style={{
                  width: '100%', justifyContent: 'center', padding: '11px',
                  border: form.registrationOpen ? '1px solid rgba(74,222,128,0.3)' : undefined,
                  background: form.registrationOpen ? 'rgba(74,222,128,0.08)' : undefined,
                  color: form.registrationOpen ? '#4ADE80' : undefined,
                }}
              >
                {form.registrationOpen ? '✓ Registration Open' : '✗ Registration Closed'}
              </button>
            </div>
            <Input id="maxTeams" label="Max Teams Capacity" type="number"
              placeholder="Leave empty for no limit"
              value={form.maxTeams} onChange={(e) => setForm(f => ({ ...f, maxTeams: e.target.value }))} />
          </div>

          <SRow icon={<MapPin size={14} color="#C6A969" />} label="Venue & Team Configuration" />
          <Input id="venue" label="Venue / Mode" placeholder="e.g. Main Auditorium or Online (Google Meet)"
            value={form.venue} onChange={(e) => setForm((f) => ({ ...f, venue: e.target.value }))} error={errors.venue} />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <Input id="teamSizeMin" label="Min Team Size" type="number" min="1"
              value={form.teamSizeMin} onChange={(e) => setForm((f) => ({ ...f, teamSizeMin: e.target.value }))}
              error={errors.teamSizeMin} icon={<Users size={13} />} />
            <Input id="teamSizeMax" label="Max Team Size" type="number" min="1"
              value={form.teamSizeMax} onChange={(e) => setForm((f) => ({ ...f, teamSizeMax: e.target.value }))}
              error={errors.teamSizeMax} icon={<Users size={13} />} />
          </div>

          <SRow icon={<LinkIcon size={14} color="#C6A969" />} label="Payment (Optional)" />
          <Input id="paymentLink" label="Payment Link" type="url"
            placeholder="https://razorpay.com/..."
            value={form.paymentLink} onChange={(e) => setForm((f) => ({ ...f, paymentLink: e.target.value }))}
            helper="Optional. Shown to participants after registration." />

          {saved && (
            <div className="ev-alert ev-alert-success">
              <CheckCheck size={14} style={{ flexShrink: 0 }} />
              <span>Event details saved successfully!</span>
            </div>
          )}

          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <Button type="submit" loading={saving} fullWidth size="lg" icon={<Zap size={15} />}>
              {existing ? 'Update Details' : 'Save Details'}
            </Button>
            {existing && (
              <Button type="button" variant="ghost" style={{ flexShrink: 0 }} onClick={() => navigate(`/dashboard/${eventId}`)}>
                Dashboard →
              </Button>
            )}
          </div>
        </form>
      </GlassCard>
    </div>
  );
};
