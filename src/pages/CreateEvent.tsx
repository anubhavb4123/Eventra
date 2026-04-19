import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ref, get, set, serverTimestamp } from 'firebase/database';
import { db } from '@/lib/firebase';
import { withRetry } from '@/lib/db-retry';
import { APPROVAL_KEY } from '@/lib/constants';
import { hashPassword, isValidEventId } from '@/lib/utils';
import { GlassCard } from '@/components/GlassCard';
import { Input } from '@/components/Input';
import { Button } from '@/components/Button';
import { Key, Hash, Lock, Zap, CheckCircle, WifiOff, AlertCircle } from 'lucide-react';
import '@/styles/eventra-shared.css';

export const CreateEvent: React.FC = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({ approvalKey: '', eventId: '', password: '', confirmPassword: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'form' | 'success'>('form');
  const [createdEventId, setCreatedEventId] = useState('');
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const on = () => setIsOnline(true);
    const off = () => setIsOnline(false);
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    return () => { window.removeEventListener('online', on); window.removeEventListener('offline', off); };
  }, []);

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (form.approvalKey !== APPROVAL_KEY) errs.approvalKey = 'Invalid approval key.';
    if (!isValidEventId(form.eventId)) errs.eventId = 'Use only lowercase letters, numbers, hyphens. Min 3 chars.';
    if (form.password.length < 6) errs.password = 'Password must be at least 6 characters.';
    if (form.password !== form.confirmPassword) errs.confirmPassword = 'Passwords do not match.';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      const eventIdClean = form.eventId.trim().toLowerCase();
      const eventRef = ref(db, `events/${eventIdClean}`);
      const existing = await withRetry(() => get(eventRef));
      if (existing.exists()) {
        setErrors((prev) => ({ ...prev, eventId: 'This Event ID is already taken. Choose another.' }));
        setLoading(false);
        return;
      }
      const passwordHash = await hashPassword(form.password);
      await withRetry(() => set(eventRef, { passwordHash, createdAt: serverTimestamp(), teamCount: 0 }));
      setCreatedEventId(eventIdClean);
      setStep('success');
    } catch (err: any) {
      const isNetworkError = !navigator.onLine || err.message?.includes('offline') || err.code === 'PERMISSION_DENIED';
      setErrors({ submit: isNetworkError ? 'Network error: check your connection or database config.' : 'Failed to create event. ' + (err.message || 'Unknown error') });
    } finally {
      setLoading(false);
    }
  };

  /* ── Success state ─────────────────────────────────────────── */
  if (step === 'success') {
    return (
      <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem 1.5rem' }}>
        <div className="ev-scale-in" style={{ maxWidth: 460, width: '100%', textAlign: 'center' }}>
          {/* Animated ring */}
          <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: '2rem' }}>
            <div style={{ position: 'absolute', width: 110, height: 110, borderRadius: '50%', border: '1px solid rgba(74,222,128,0.2)', animation: 'ev-ring-expand 2s ease-out infinite' }} />
            <div style={{ position: 'absolute', width: 85, height: 85, borderRadius: '50%', border: '1px solid rgba(74,222,128,0.12)', animation: 'ev-ring-expand 2s 0.6s ease-out infinite' }} />
            <div style={{
              width: 68, height: 68, borderRadius: '50%',
              background: 'rgba(74,222,128,0.1)', border: '2px solid rgba(74,222,128,0.4)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 0 30px rgba(74,222,128,0.2)',
            }}>
              <CheckCircle size={32} color="#4ADE80" />
            </div>
          </div>

          <h1 style={{ fontFamily: "'Crimson Pro', Georgia, serif", fontSize: '2.5rem', fontWeight: 700, color: '#eaeaea', marginBottom: '0.5rem' }}>
            Event Created!
          </h1>
          <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.8rem', color: '#666', marginBottom: '2rem' }}>
            Your event is ready. Configure it below.
          </p>

          <div style={{
            padding: '12px 20px', borderRadius: 12, marginBottom: '2rem',
            background: 'rgba(198,169,105,0.08)', border: '1px solid rgba(198,169,105,0.25)',
            fontFamily: "'JetBrains Mono', monospace", fontSize: '1rem',
            color: '#C6A969', fontWeight: 700, letterSpacing: '0.08em',
          }}>
            {createdEventId}
          </div>

          <Button fullWidth icon={<Zap size={15} />} onClick={() => navigate(`/event-details/${createdEventId}`)}>
            Configure Event Details
          </Button>
        </div>
      </div>
    );
  }

  /* ── Form ──────────────────────────────────────────────────── */
  const SectionRow = ({ icon, label }: { icon: React.ReactNode; label: string }) => (
    <div className="ev-section-row">
      {icon}
      <span className="ev-section-row-label">{label}</span>
    </div>
  );

  return (
    <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem 1.5rem' }}>
      <div style={{ maxWidth: 520, width: '100%' }}>

        {/* Offline banner */}
        {!isOnline && (
          <div className="ev-alert ev-alert-error" style={{ marginBottom: 24 }}>
            <WifiOff size={16} style={{ flexShrink: 0, marginTop: 1 }} />
            <span>You are offline. Actions may fail until connection is restored.</span>
          </div>
        )}

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <div className="ev-section-label" style={{ marginBottom: 12 }}>ORGANIZER PORTAL</div>
          <h1 style={{ fontFamily: "'Crimson Pro', Georgia, serif", fontSize: 'clamp(2rem,5vw,3rem)', fontWeight: 700, color: '#eaeaea', marginBottom: '0.5rem', lineHeight: 1.1 }}>
            Create an Event
          </h1>
          <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.78rem', color: '#666', lineHeight: 1.7 }}>
            You need the approval key to create events.
          </p>
        </div>

        <GlassCard accent>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

            <SectionRow icon={<Key size={14} color="#C6A969" />} label="Authorization" />
            <Input
              id="approvalKey"
              label="Approval Key"
              type="password"
              placeholder="Enter the organizer approval key"
              value={form.approvalKey}
              onChange={(e) => setForm((f) => ({ ...f, approvalKey: e.target.value }))}
              error={errors.approvalKey}
              icon={<Key size={14} />}
            />

            <SectionRow icon={<Hash size={14} color="#C6A969" />} label="Event Identity" />
            <Input
              id="eventId"
              label="Event ID"
              type="text"
              placeholder="e.g. hackathon2026"
              value={form.eventId}
              onChange={(e) => setForm((f) => ({ ...f, eventId: e.target.value.toLowerCase().replace(/\s+/g, '-') }))}
              error={errors.eventId}
              helper="Lowercase letters, numbers, hyphens only. Cannot be changed later."
              icon={<Hash size={14} />}
            />

            <SectionRow icon={<Lock size={14} color="#C6A969" />} label="Security" />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <Input
                id="password"
                label="Password"
                type="password"
                placeholder="Create a strong password"
                value={form.password}
                onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                error={errors.password}
                icon={<Lock size={14} />}
              />
              <Input
                id="confirmPassword"
                label="Confirm Password"
                type="password"
                placeholder="Re-enter your password"
                value={form.confirmPassword}
                onChange={(e) => setForm((f) => ({ ...f, confirmPassword: e.target.value }))}
                error={errors.confirmPassword}
                icon={<Lock size={14} />}
              />
            </div>

            {errors.submit && (
              <div className="ev-alert ev-alert-error">
                <AlertCircle size={15} style={{ flexShrink: 0, marginTop: 1 }} />
                <span>{errors.submit}</span>
              </div>
            )}

            <Button type="submit" loading={loading} fullWidth size="lg" icon={<Zap size={16} />}>
              Create Event
            </Button>
          </form>
        </GlassCard>

        <p style={{ textAlign: 'center', marginTop: '1.25rem', fontFamily: "'JetBrains Mono', monospace", fontSize: '0.68rem', color: '#333' }}>
          The approval key prevents unauthorized event creation.
        </p>
      </div>
    </div>
  );
};
