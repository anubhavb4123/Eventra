import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, QrCode, Users, BarChart3, ScanLine, Shield, Zap } from 'lucide-react';
import { GlassCard } from '@/components/GlassCard';

const features = [
  {
    icon: <Zap size={22} color="#C6A969" />,
    title: 'Instant Event Creation',
    desc: 'Create events with custom IDs, descriptions, and registration details in seconds.',
  },
  {
    icon: <Users size={22} color="#C6A969" />,
    title: 'Team Registration',
    desc: 'Dynamic multi-member forms with auto-generated Team IDs and unique QR codes.',
  },
  {
    icon: <QrCode size={22} color="#C6A969" />,
    title: 'QR-Based Attendance',
    desc: 'Scan team QR codes with any camera. Mark per-member attendance in seconds.',
  },
  {
    icon: <BarChart3 size={22} color="#C6A969" />,
    title: 'Live Dashboard',
    desc: 'Real-time stats, team lists, presence tracking, and CSV export for organizers.',
  },
  {
    icon: <ScanLine size={22} color="#C6A969" />,
    title: 'Camera Scanner',
    desc: 'Browser-native QR scanning — no app download required.',
  },
  {
    icon: <Shield size={22} color="#C6A969" />,
    title: 'Secure by Design',
    desc: 'Hashed passwords, validated operations, and controlled access.',
  },
];

export const Home: React.FC = () => {
  return (
    <div style={{ minHeight: '90vh', padding: '0 1.5rem' }}>
      {/* Hero Section */}
      <section style={{ maxWidth: 900, margin: '0 auto', paddingTop: '6rem', paddingBottom: '5rem', textAlign: 'center' }}>
        {/* Badge */}
        <div
          className="animate-fade-in"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.3rem 1rem',
            borderRadius: '9999px',
            border: '1px solid rgba(198,169,105,0.3)',
            background: 'rgba(198,169,105,0.07)',
            marginBottom: '2rem',
          }}
        >
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#4ADE80', display: 'inline-block', boxShadow: '0 0 8px #4ADE80' }} />
          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.72rem', color: '#9A9A9A', letterSpacing: '0.08em' }}>
            v1.0 — Now Live
          </span>
        </div>

        {/* Headline */}
        <h1
          className="animate-fade-in delay-100"
          style={{
            fontFamily: "'Crimson Pro', Georgia, serif",
            fontSize: 'clamp(3rem, 8vw, 5.5rem)',
            fontWeight: 700,
            lineHeight: 1.05,
            letterSpacing: '-0.02em',
            color: '#EAEAEA',
            marginBottom: '0.5rem',
          }}
        >
          Event Management,{' '}
          <span
            style={{
              background: 'linear-gradient(135deg, #C6A969, #D4AF37, #C6A969)',
              WebkitBackgroundClip: 'text',
              backgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            Reimagined
          </span>
        </h1>

        <p
          className="animate-fade-in delay-200"
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: '1rem',
            color: '#9A9A9A',
            maxWidth: 550,
            margin: '1.5rem auto 2.5rem',
            lineHeight: 1.7,
          }}
        >
          Create events, manage team registrations, and track attendance — all powered by QR codes.
          Built for organizers who demand professionalism.
        </p>

        {/* CTAs */}
        <div className="animate-fade-in delay-300" style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link to="/create-event" style={{ textDecoration: 'none' }}>
            <button className="btn-primary" style={{ fontSize: '0.9rem', padding: '0.75rem 2rem' }}>
              <Zap size={17} />
              Create an Event
              <ArrowRight size={17} />
            </button>
          </Link>
          <Link to="/organizer-login" style={{ textDecoration: 'none' }}>
            <button className="btn-secondary" style={{ fontSize: '0.9rem', padding: '0.75rem 2rem' }}>
              Organizer Login
            </button>
          </Link>
        </div>

        {/* Stats row */}
        <div
          className="animate-fade-in delay-400"
          style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '3rem',
            marginTop: '4rem',
            flexWrap: 'wrap',
          }}
        >
          {[
            { value: 'Custom', label: 'Event IDs' },
            { value: 'QR', label: 'Attendance' },
            { value: 'Live', label: 'Dashboard' },
          ].map((stat) => (
            <div key={stat.label} style={{ textAlign: 'center' }}>
              <p style={{ fontFamily: "'Crimson Pro', Georgia, serif", fontSize: '2.5rem', fontWeight: 700, color: '#C6A969', lineHeight: 1 }}>
                {stat.value}
              </p>
              <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.72rem', color: '#6a6a6a', letterSpacing: '0.1em', marginTop: '0.25rem' }}>
                {stat.label}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Divider */}
      <div style={{ maxWidth: 700, margin: '0 auto 4rem', height: 1, background: 'linear-gradient(90deg, transparent, rgba(198,169,105,0.2), transparent)' }} />

      {/* Features */}
      <section style={{ maxWidth: 1100, margin: '0 auto', paddingBottom: '6rem' }}>
        <h2
          style={{
            fontFamily: "'Crimson Pro', Georgia, serif",
            fontSize: '2.5rem',
            fontWeight: 700,
            textAlign: 'center',
            color: '#EAEAEA',
            marginBottom: '0.75rem',
          }}
        >
          Everything you need
        </h2>
        <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.85rem', color: '#6a6a6a', textAlign: 'center', marginBottom: '3rem' }}>
          One platform, end-to-end event management
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.25rem' }}>
          {features.map((f, i) => (
            <GlassCard key={f.title} className={`animate-fade-in-up delay-${(i % 4 + 1) * 100}`}>
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                <div style={{
                  width: 44, height: 44, borderRadius: '0.75rem', flexShrink: 0,
                  background: 'rgba(198,169,105,0.08)',
                  border: '1px solid rgba(198,169,105,0.2)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {f.icon}
                </div>
                <div>
                  <h3 style={{ fontFamily: "'Crimson Pro', Georgia, serif", fontSize: '1.15rem', fontWeight: 700, color: '#EAEAEA', margin: '0 0 0.4rem' }}>
                    {f.title}
                  </h3>
                  <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.78rem', color: '#9A9A9A', lineHeight: 1.6, margin: 0 }}>
                    {f.desc}
                  </p>
                </div>
              </div>
            </GlassCard>
          ))}
        </div>
      </section>

      {/* Quick start flow */}
      <section style={{ maxWidth: 900, margin: '0 auto', paddingBottom: '6rem', textAlign: 'center' }}>
        <h2 style={{ fontFamily: "'Crimson Pro', Georgia, serif", fontSize: '2.5rem', fontWeight: 700, color: '#EAEAEA', marginBottom: '3rem' }}>
          Get started in minutes
        </h2>
        <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', justifyContent: 'center' }}>
          {[
            { step: '01', title: 'Create Event', desc: 'Generate a unique Event ID and set up your event details.', to: '/create-event' },
            { step: '02', title: 'Share Link', desc: 'Teams register via your public registration link.', to: null },
            { step: '03', title: 'Scan & Track', desc: 'Use the camera scanner to mark attendance at the door.', to: '/organizer-login' },
          ].map((s) => (
            <div key={s.step} style={{ flex: '1 1 220px', maxWidth: 260 }}>
              <GlassCard>
                <div
                  style={{
                    fontFamily: "'Crimson Pro', Georgia, serif",
                    fontSize: '3rem',
                    fontWeight: 800,
                    color: 'rgba(198,169,105,0.2)',
                    lineHeight: 1,
                    marginBottom: '0.75rem',
                  }}
                >
                  {s.step}
                </div>
                <h3 style={{ fontFamily: "'Crimson Pro', Georgia, serif", fontSize: '1.25rem', fontWeight: 700, color: '#EAEAEA', margin: '0 0 0.5rem' }}>
                  {s.title}
                </h3>
                <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.78rem', color: '#9A9A9A', margin: '0 0 1.25rem', lineHeight: 1.6 }}>
                  {s.desc}
                </p>
                {s.to && (
                  <Link to={s.to} style={{ textDecoration: 'none' }}>
                    <button className="btn-secondary" style={{ fontSize: '0.78rem', padding: '0.4rem 1rem' }}>
                      Start →
                    </button>
                  </Link>
                )}
              </GlassCard>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
