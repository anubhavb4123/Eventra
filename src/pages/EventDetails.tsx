import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { GlassCard } from '@/components/GlassCard';
import { Input } from '@/components/Input';
import { Textarea } from '@/components/Textarea';
import { Button } from '@/components/Button';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { Calendar, MapPin, Users, LinkIcon, FileText, Copy, CheckCheck, Zap } from 'lucide-react';

export const EventDetails: React.FC = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [copied, setCopied] = useState(false);
  const [existing, setExisting] = useState(false);
  const [form, setForm] = useState({
    eventName: '',
    description: '',
    dateTime: '',
    teamSizeMin: '1',
    teamSizeMax: '5',
    venue: '',
    registrationDeadline: '',
    paymentLink: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const registrationUrl = `${window.location.origin}/register/${eventId}`;

  useEffect(() => {
    const fetchDetails = async () => {
      if (!eventId) return;
      setLoading(true);
      try {
        const ref = doc(db, 'events', eventId, 'details', 'info');
        const snap = await getDoc(ref);
        if (snap.exists()) {
          const data = snap.data();
          setForm({
            eventName: data.eventName ?? '',
            description: data.description ?? '',
            dateTime: data.dateTime ?? '',
            teamSizeMin: String(data.teamSizeMin ?? 1),
            teamSizeMax: String(data.teamSizeMax ?? 5),
            venue: data.venue ?? '',
            registrationDeadline: data.registrationDeadline ?? '',
            paymentLink: data.paymentLink ?? '',
          });
          setExisting(true);
        }
      } catch (err) {
        console.error(err);
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
      await setDoc(doc(db, 'events', eventId, 'details', 'info'), {
        eventName: form.eventName,
        description: form.description,
        dateTime: form.dateTime,
        teamSizeMin: Number(form.teamSizeMin),
        teamSizeMax: Number(form.teamSizeMax),
        venue: form.venue,
        registrationDeadline: form.registrationDeadline,
        paymentLink: form.paymentLink || null,
      });
      setSaved(true);
      setExisting(true);
    } catch (err) {
      console.error(err);
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

  return (
    <div style={{ maxWidth: 720, margin: '0 auto', padding: '3rem 1.5rem' }}>
      {/* Header */}
      <div style={{ marginBottom: '2.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
          <span style={{
            fontFamily: "'JetBrains Mono', monospace", fontSize: '0.75rem', color: '#C6A969',
            padding: '0.2rem 0.65rem', borderRadius: '9999px',
            background: 'rgba(198,169,105,0.1)', border: '1px solid rgba(198,169,105,0.2)',
          }}>
            {eventId}
          </span>
          {existing && (
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.72rem', color: '#4ADE80' }}>
              ● Configured
            </span>
          )}
        </div>
        <h1 style={{ fontFamily: "'Crimson Pro', Georgia, serif", fontSize: '2.5rem', fontWeight: 700, color: '#EAEAEA', marginBottom: '0.5rem' }}>
          Event Details
        </h1>
        <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.82rem', color: '#9A9A9A' }}>
          Configure your event information. Teams will see this on the registration page.
        </p>
      </div>

      {/* Registration Link */}
      <GlassCard style={{ marginBottom: '1.5rem' }} padding="sm">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <LinkIcon size={16} color="#C6A969" style={{ flexShrink: 0 }} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.72rem', color: '#6a6a6a', marginBottom: '0.2rem', letterSpacing: '0.08em' }}>
              REGISTRATION URL
            </p>
            <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.78rem', color: '#C6A969', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {registrationUrl}
            </p>
          </div>
          <button onClick={handleCopy} className="btn-secondary" style={{ padding: '0.4rem 0.85rem', fontSize: '0.75rem', flexShrink: 0 }}>
            {copied ? <CheckCheck size={14} /> : <Copy size={14} />}
            {copied ? 'Copied' : 'Copy'}
          </button>
        </div>
      </GlassCard>

      {/* Form */}
      <GlassCard>
        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Basic Info */}
          <SectionHeader icon={<FileText size={14} color="#C6A969" />} title="Basic Information" />
          <Input
            id="eventName"
            label="Event Name"
            placeholder="e.g. National Hackathon 2026"
            value={form.eventName}
            onChange={(e) => setForm((f) => ({ ...f, eventName: e.target.value }))}
            error={errors.eventName}
          />
          <Textarea
            id="description"
            label="Description"
            placeholder="Tell participants what this event is about..."
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            error={errors.description}
          />

          {/* Schedule */}
          <SectionHeader icon={<Calendar size={14} color="#C6A969" />} title="Schedule" />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <Input
              id="dateTime"
              label="Date & Time"
              type="datetime-local"
              value={form.dateTime}
              onChange={(e) => setForm((f) => ({ ...f, dateTime: e.target.value }))}
            />
            <Input
              id="registrationDeadline"
              label="Registration Deadline"
              type="datetime-local"
              value={form.registrationDeadline}
              onChange={(e) => setForm((f) => ({ ...f, registrationDeadline: e.target.value }))}
            />
          </div>

          {/* Venue & Team */}
          <SectionHeader icon={<MapPin size={14} color="#C6A969" />} title="Venue & Team Configuration" />
          <Input
            id="venue"
            label="Venue / Mode"
            placeholder="e.g. Main Auditorium, Block A or Online (Google Meet)"
            value={form.venue}
            onChange={(e) => setForm((f) => ({ ...f, venue: e.target.value }))}
            error={errors.venue}
          />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <Input
              id="teamSizeMin"
              label="Min Team Size"
              type="number"
              min="1"
              value={form.teamSizeMin}
              onChange={(e) => setForm((f) => ({ ...f, teamSizeMin: e.target.value }))}
              error={errors.teamSizeMin}
              icon={<Users size={14} />}
            />
            <Input
              id="teamSizeMax"
              label="Max Team Size"
              type="number"
              min="1"
              value={form.teamSizeMax}
              onChange={(e) => setForm((f) => ({ ...f, teamSizeMax: e.target.value }))}
              error={errors.teamSizeMax}
              icon={<Users size={14} />}
            />
          </div>

          {/* Payment */}
          <SectionHeader icon={<LinkIcon size={14} color="#C6A969" />} title="Payment (Optional)" />
          <Input
            id="paymentLink"
            label="Payment Link"
            type="url"
            placeholder="https://razorpay.com/..."
            value={form.paymentLink}
            onChange={(e) => setForm((f) => ({ ...f, paymentLink: e.target.value }))}
            helper="Optional. Will be shown to participants after form submission."
          />

          {saved && (
            <div style={{
              padding: '0.75rem 1rem', borderRadius: '0.75rem',
              background: 'rgba(74,222,128,0.08)', border: '1px solid rgba(74,222,128,0.25)',
              fontFamily: "'JetBrains Mono', monospace", fontSize: '0.78rem', color: '#4ADE80',
              textAlign: 'center',
            }}>
              ✓ Event details saved successfully!
            </div>
          )}

          <div style={{ display: 'flex', gap: '1rem' }}>
            <Button type="submit" loading={saving} icon={<Zap size={15} />} fullWidth>
              {existing ? 'Update Details' : 'Save Details'}
            </Button>
            {existing && (
              <button
                type="button"
                className="btn-secondary"
                style={{ flex: '0 0 auto' }}
                onClick={() => navigate(`/dashboard/${eventId}`)}
              >
                Dashboard →
              </button>
            )}
          </div>
        </form>
      </GlassCard>
    </div>
  );
};

const SectionHeader: React.FC<{ icon: React.ReactNode; title: string }> = ({ icon, title }) => (
  <div style={{
    display: 'flex', alignItems: 'center', gap: '0.5rem',
    paddingBottom: '0.5rem', borderBottom: '1px solid rgba(198,169,105,0.1)',
  }}>
    {icon}
    <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.72rem', color: '#9A9A9A', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
      {title}
    </span>
  </div>
);
