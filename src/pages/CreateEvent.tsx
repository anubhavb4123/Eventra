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

export const CreateEvent: React.FC = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({ approvalKey: '', eventId: '', password: '', confirmPassword: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'form' | 'success'>('form');
  const [createdEventId, setCreatedEventId] = useState('');
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  // Monitor connectivity for UI hints
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
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

      // Check uniqueness using RTDB 'get' with retry
      const existing = await withRetry(() => get(eventRef));

      if (existing.exists()) {
        setErrors((prev) => ({ ...prev, eventId: 'This Event ID is already taken. Choose another.' }));
        setLoading(false);
        return;
      }

      const passwordHash = await hashPassword(form.password);

      // Create event using RTDB 'set' with retry
      await withRetry(() => set(eventRef, {
        passwordHash,
        createdAt: serverTimestamp(),
        teamCount: 0,
      }));

      setCreatedEventId(eventIdClean);
      setStep('success');
    } catch (err: any) {
      console.error('Create Event Error:', err);
      const isNetworkError = !navigator.onLine || err.message?.includes('offline') || err.code === 'PERMISSION_DENIED';

      setErrors({
        submit: isNetworkError
          ? 'Network error: Please check your internet connection or database configuration.'
          : 'Failed to create event. Details: ' + (err.message || 'Unknown error'),
      });
    } finally {
      setLoading(false);
    }
  };

  if (step === 'success') {
    return (
      <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem 1.5rem' }}>
        <GlassCard style={{ maxWidth: 480, width: '100%' }} className="animate-scale-in">
          <div style={{ textAlign: 'center', padding: '1rem 0' }}>
            <div style={{
              width: 72, height: 72, borderRadius: '50%', margin: '0 auto 1.5rem',
              background: 'rgba(74,222,128,0.12)', border: '2px solid rgba(74,222,128,0.4)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 0 30px rgba(74,222,128,0.2)',
            }}>
              <CheckCircle size={36} color="#4ADE80" />
            </div>
            <h2 style={{ fontFamily: "'Crimson Pro', Georgia, serif", fontSize: '2rem', fontWeight: 700, color: '#EAEAEA', marginBottom: '0.5rem' }}>
              Event Created!
            </h2>
            <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.8rem', color: '#9A9A9A', marginBottom: '2rem' }}>
              Your event is live. Now set up the event details.
            </p>
            <div style={{
              padding: '0.75rem 1.25rem', borderRadius: '0.75rem',
              background: 'rgba(198,169,105,0.08)', border: '1px solid rgba(198,169,105,0.2)',
              fontFamily: "'JetBrains Mono', monospace", fontSize: '0.9rem',
              color: '#C6A969', fontWeight: 700, letterSpacing: '0.05em',
              marginBottom: '2rem',
            }}>
              {createdEventId}
            </div>
            <button className="btn-primary w-full justify-center" onClick={() => navigate(`/event-details/${createdEventId}`)}>
              Configure Event Details <Zap size={15} />
            </button>
          </div>
        </GlassCard>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem 1.5rem' }}>
      <div style={{ maxWidth: 520, width: '100%' }}>
        {/* Network Warning Banner */}
        {!isOnline && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: '0.75rem',
            padding: '0.75rem 1rem', background: 'rgba(248,113,113,0.1)',
            border: '1px solid rgba(248,113,113,0.3)', borderRadius: '0.75rem',
            marginBottom: '1.5rem', animation: 'fadeIn 0.3s ease forwards',
          }}>
            <WifiOff size={18} color="#F87171" strokeWidth={2.5} />
            <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.75rem', color: '#F87171', margin: 0, fontWeight: 600 }}>
              You are currently offline. Actions may fail.
            </p>
          </div>
        )}

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <h1 style={{ fontFamily: "'Crimson Pro', Georgia, serif", fontSize: '2.75rem', fontWeight: 700, color: '#EAEAEA', marginBottom: '0.5rem' }}>
            Create Event
          </h1>
          <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.82rem', color: '#9A9A9A' }}>
            Organizer-only. You need the approval key to proceed.
          </p>
        </div>

        <GlassCard>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {/* Approval Key */}
            <div>
              <div style={{
                display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem',
                paddingBottom: '0.75rem', borderBottom: '1px solid rgba(198,169,105,0.1)',
              }}>
                <Key size={14} color="#C6A969" />
                <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.72rem', color: '#9A9A9A', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                  Authorization
                </span>
              </div>
              <Input
                id="approvalKey"
                label="Approval Key"
                type="password"
                placeholder="Enter the organizer approval key"
                value={form.approvalKey}
                onChange={(e) => setForm((f) => ({ ...f, approvalKey: e.target.value }))}
                error={errors.approvalKey}
                icon={<Key size={15} />}
              />
            </div>

            {/* Event ID */}
            <div>
              <div style={{
                display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem',
                paddingBottom: '0.75rem', borderBottom: '1px solid rgba(198,169,105,0.1)',
              }}>
                <Hash size={14} color="#C6A969" />
                <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.72rem', color: '#9A9A9A', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                  Event Identity
                </span>
              </div>
              <Input
                id="eventId"
                label="Event ID"
                type="text"
                placeholder="e.g. hackathon2026"
                value={form.eventId}
                onChange={(e) => setForm((f) => ({ ...f, eventId: e.target.value.toLowerCase().replace(/\s+/g, '-') }))}
                error={errors.eventId}
                helper="Lowercase letters, numbers, hyphens only. This cannot be changed later."
                icon={<Hash size={15} />}
              />
            </div>

            {/* Password */}
            <div>
              <div style={{
                display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem',
                paddingBottom: '0.75rem', borderBottom: '1px solid rgba(198,169,105,0.1)',
              }}>
                <Lock size={14} color="#C6A969" />
                <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.72rem', color: '#9A9A9A', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                  Security
                </span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <Input
                  id="password"
                  label="Password"
                  type="password"
                  placeholder="Create a strong password"
                  value={form.password}
                  onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                  error={errors.password}
                  icon={<Lock size={15} />}
                />
                <Input
                  id="confirmPassword"
                  label="Confirm Password"
                  type="password"
                  placeholder="Re-enter password"
                  value={form.confirmPassword}
                  onChange={(e) => setForm((f) => ({ ...f, confirmPassword: e.target.value }))}
                  error={errors.confirmPassword}
                  icon={<Lock size={15} />}
                />
              </div>
            </div>

            {errors.submit && (
              <div style={{
                display: 'flex', alignItems: 'flex-start', gap: '0.75rem',
                padding: '1rem', background: 'rgba(248,113,113,0.08)',
                border: '1px solid rgba(248,113,113,0.2)', borderRadius: '0.75rem'
              }}>
                <AlertCircle size={18} color="#F87171" style={{ marginTop: '0.1rem', flexShrink: 0 }} />
                <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.78rem', color: '#F87171', margin: 0, lineHeight: 1.5 }}>
                  {errors.submit}
                </p>
              </div>
            )}

            <Button type="submit" loading={loading} fullWidth icon={<Zap size={16} />}>
              Create Event
            </Button>
          </form>
        </GlassCard>

        <p style={{ textAlign: 'center', marginTop: '1.5rem', fontFamily: "'JetBrains Mono', monospace", fontSize: '0.75rem', color: '#6a6a6a' }}>
          The approval key is required to prevent unauthorized event creation.
        </p>
      </div>
    </div>
  );
};
