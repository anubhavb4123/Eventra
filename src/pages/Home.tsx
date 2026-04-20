import React, { useEffect, useRef, useState } from "react";

export const Home: React.FC = () => {
  const sendPrompt = (msg: string) => {
    console.log(msg);
  };

  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      <style dangerouslySetInnerHTML={{
        __html: `
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700;900&family=DM+Sans:wght@300;400;500;600&family=DM+Mono:wght@400;500&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        :root {
          --gold: #C9A84C;
          --gold-light: #E2C06E;
          --gold-dim: rgba(201,168,76,0.15);
          --gold-border: rgba(201,168,76,0.22);
          --bg: #080810;
          --bg2: #0d0d18;
          --surface: rgba(255,255,255,0.03);
          --surface-hover: rgba(201,168,76,0.05);
          --text: #E8E4DC;
          --text-muted: #7A7570;
          --text-dim: #4A4640;
          --green: #3DD68C;
          --serif: 'Playfair Display', Georgia, serif;
          --sans: 'DM Sans', system-ui, sans-serif;
          --mono: 'DM Mono', 'Courier New', monospace;
        }

        html { scroll-behavior: smooth; }

        body {
          font-family: var(--sans);
          background: var(--bg);
          color: var(--text);
          overflow-x: hidden;
          -webkit-font-smoothing: antialiased;
        }

        /* ─── NAV ─── */
        .nav {
          position: fixed;
          top: 0; left: 0; right: 0;
          z-index: 100;
          padding: 20px 40px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          transition: background .3s, border-color .3s, backdrop-filter .3s;
        }
        .nav.scrolled {
          background: rgba(8,8,16,0.85);
          backdrop-filter: blur(16px);
          border-bottom: 1px solid var(--gold-border);
        }
        .nav-brand {
          font-family: var(--serif);
          font-size: 1.5rem;
          font-weight: 900;
          letter-spacing: .01em;
          color: var(--gold-light);
          text-decoration: none;
        }
        .nav-links {
          display: flex;
          gap: 32px;
          list-style: none;
        }
        .nav-links a {
          font-size: .8rem;
          font-weight: 500;
          color: var(--text-muted);
          text-decoration: none;
          letter-spacing: .08em;
          text-transform: uppercase;
          transition: color .2s;
        }
        .nav-links a:hover { color: var(--gold-light); }
        .nav-cta {
          padding: 9px 22px;
          border-radius: 6px;
          border: 1px solid var(--gold-border);
          background: transparent;
          color: var(--gold-light);
          font-family: var(--sans);
          font-size: .8rem;
          font-weight: 600;
          cursor: pointer;
          letter-spacing: .06em;
          transition: background .2s, border-color .2s;
        }
        .nav-cta:hover {
          background: var(--gold-dim);
          border-color: var(--gold);
        }

        /* ─── HERO ─── */
        .hero-wrap {
          position: relative;
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 120px 24px 80px;
          text-align: center;
          overflow: hidden;
        }
        .hero-bg {
          position: absolute;
          inset: 0;
          pointer-events: none;
          z-index: 0;
        }
        .hero-bg::before {
          content: '';
          position: absolute;
          top: -10%;
          left: 50%;
          transform: translateX(-50%);
          width: 900px;
          height: 900px;
          border-radius: 50%;
          background: radial-gradient(ellipse, rgba(201,168,76,0.07) 0%, transparent 65%);
        }
        .hero-bg::after {
          content: '';
          position: absolute;
          inset: 0;
          background-image:
            linear-gradient(rgba(201,168,76,0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(201,168,76,0.03) 1px, transparent 1px);
          background-size: 60px 60px;
          mask-image: radial-gradient(ellipse 80% 60% at 50% 40%, black 0%, transparent 100%);
        }
        .hero-inner { position: relative; z-index: 1; max-width: 860px; margin: 0 auto; }

        .pill-badge {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 6px 16px;
          border-radius: 9999px;
          border: 1px solid var(--gold-border);
          background: rgba(201,168,76,0.06);
          font-family: var(--mono);
          font-size: .7rem;
          color: var(--text-muted);
          letter-spacing: .1em;
          margin-bottom: 36px;
        }
        .live-dot {
          width: 6px; height: 6px;
          border-radius: 50%;
          background: var(--green);
          box-shadow: 0 0 8px var(--green);
          flex-shrink: 0;
          animation: pulse 2s ease-in-out infinite;
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; box-shadow: 0 0 8px var(--green); }
          50% { opacity: .6; box-shadow: 0 0 3px var(--green); }
        }

        .hero-eyebrow {
          font-family: var(--mono);
          font-size: .72rem;
          color: var(--gold);
          letter-spacing: .18em;
          text-transform: uppercase;
          margin-bottom: 20px;
        }

        h1.hero-title {
          font-family: var(--serif);
          font-size: clamp(3rem, 8vw, 5.8rem);
          font-weight: 900;
          line-height: 1.02;
          letter-spacing: -.01em;
          color: var(--text);
          margin-bottom: 28px;
        }
        h1.hero-title .accent {
          font-style: italic;
          background: linear-gradient(120deg, var(--gold), var(--gold-light), #F0D485);
          -webkit-background-clip: text;
          background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .hero-sub {
          font-size: 1.05rem;
          line-height: 1.8;
          color: var(--text-muted);
          max-width: 560px;
          margin: 0 auto 44px;
          font-weight: 300;
        }

        .hero-ctas {
          display: flex;
          gap: 14px;
          justify-content: center;
          flex-wrap: wrap;
          margin-bottom: 64px;
        }

        .btn-primary {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 14px 32px;
          border-radius: 8px;
          border: none;
          background: linear-gradient(135deg, #B8952E, var(--gold), #DFC06A);
          color: #0a0806;
          font-family: var(--sans);
          font-size: .88rem;
          font-weight: 700;
          letter-spacing: .04em;
          cursor: pointer;
          transition: opacity .2s, transform .15s, box-shadow .2s;
          box-shadow: 0 4px 24px rgba(201,168,76,0.25);
        }
        .btn-primary:hover {
          opacity: .9;
          transform: translateY(-2px);
          box-shadow: 0 8px 32px rgba(201,168,76,0.35);
        }

        .btn-ghost {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 14px 32px;
          border-radius: 8px;
          border: 1px solid rgba(255,255,255,0.1);
          background: rgba(255,255,255,0.04);
          color: var(--text-muted);
          font-family: var(--sans);
          font-size: .88rem;
          font-weight: 500;
          cursor: pointer;
          transition: background .2s, border-color .2s, color .2s;
        }
        .btn-ghost:hover {
          background: rgba(255,255,255,0.07);
          border-color: rgba(255,255,255,0.18);
          color: var(--text);
        }

        .stats-strip {
          display: flex;
          justify-content: center;
          gap: 0;
          flex-wrap: wrap;
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 14px;
          overflow: hidden;
          background: rgba(255,255,255,0.02);
        }
        .stat-item {
          flex: 1;
          min-width: 140px;
          padding: 24px 32px;
          text-align: center;
          border-right: 1px solid rgba(255,255,255,0.07);
        }
        .stat-item:last-child { border-right: none; }
        .stat-val {
          font-family: var(--serif);
          font-size: 2rem;
          font-weight: 700;
          color: var(--gold-light);
          line-height: 1;
          margin-bottom: 6px;
        }
        .stat-lbl {
          font-family: var(--mono);
          font-size: .65rem;
          color: var(--text-dim);
          letter-spacing: .12em;
          text-transform: uppercase;
        }

        /* ─── SECTION BASE ─── */
        .section {
          max-width: 1140px;
          margin: 0 auto;
          padding: 100px 32px;
        }
        .section-header {
          text-align: center;
          margin-bottom: 60px;
        }
        .section-tag {
          font-family: var(--mono);
          font-size: .68rem;
          color: var(--gold);
          letter-spacing: .2em;
          text-transform: uppercase;
          margin-bottom: 14px;
        }
        .section-title {
          font-family: var(--serif);
          font-size: clamp(2rem, 4.5vw, 3rem);
          font-weight: 700;
          color: var(--text);
          line-height: 1.15;
          margin-bottom: 14px;
        }
        .section-sub {
          font-size: .9rem;
          color: var(--text-muted);
          font-weight: 300;
          line-height: 1.7;
        }

        .rule {
          width: 100%;
          height: 1px;
          background: linear-gradient(90deg, transparent, var(--gold-border), transparent);
          margin: 0;
        }

        /* ─── FEATURES ─── */
        .feat-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 16px;
        }
        .feat-card {
          background: var(--surface);
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 14px;
          padding: 28px;
          position: relative;
          overflow: hidden;
          transition: border-color .25s, background .25s, transform .2s;
        }
        .feat-card::before {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0;
          height: 1px;
          background: linear-gradient(90deg, transparent, rgba(201,168,76,0.3), transparent);
          opacity: 0;
          transition: opacity .25s;
        }
        .feat-card:hover {
          border-color: var(--gold-border);
          background: var(--surface-hover);
          transform: translateY(-2px);
        }
        .feat-card:hover::before { opacity: 1; }
        .feat-icon-wrap {
          width: 46px; height: 46px;
          border-radius: 12px;
          background: var(--gold-dim);
          border: 1px solid var(--gold-border);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 20px;
          margin-bottom: 18px;
        }
        .feat-name {
          font-size: 1rem;
          font-weight: 600;
          color: var(--text);
          margin-bottom: 8px;
          letter-spacing: -.01em;
        }
        .feat-desc {
          font-size: .8rem;
          color: var(--text-muted);
          line-height: 1.7;
          font-weight: 300;
          margin-bottom: 16px;
        }
        .feat-tags {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
        }
        .tag {
          font-family: var(--mono);
          font-size: .65rem;
          padding: 3px 10px;
          border-radius: 9999px;
          background: var(--gold-dim);
          border: 1px solid var(--gold-border);
          color: #9A7830;
          letter-spacing: .04em;
        }

        /* ─── HOW IT WORKS ─── */
        .steps-container {
          display: grid;
          grid-template-columns: repeat(5, 1fr);
          gap: 0;
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 16px;
          overflow: hidden;
          background: rgba(255,255,255,0.02);
        }
        @media (max-width: 768px) {
          .steps-container { grid-template-columns: 1fr; }
          .step-item { border-right: none !important; border-bottom: 1px solid rgba(255,255,255,0.06); }
          .step-item:last-child { border-bottom: none; }
        }
        .step-item {
          padding: 36px 24px;
          text-align: center;
          border-right: 1px solid rgba(255,255,255,0.06);
          position: relative;
          transition: background .2s;
        }
        .step-item:last-child { border-right: none; }
        .step-item:hover { background: rgba(201,168,76,0.03); }
        .step-number {
          font-family: var(--serif);
          font-size: 3.5rem;
          font-weight: 900;
          color: rgba(201,168,76,0.1);
          line-height: 1;
          margin-bottom: 12px;
        }
        .step-name {
          font-size: .92rem;
          font-weight: 600;
          color: var(--text);
          margin-bottom: 8px;
        }
        .step-desc {
          font-size: .75rem;
          color: var(--text-muted);
          line-height: 1.65;
          font-weight: 300;
        }

        /* ─── PREVIEW ─── */
        .preview-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 24px;
          align-items: start;
        }
        @media (max-width: 700px) { .preview-grid { grid-template-columns: 1fr; } }

        .ticket-card {
          background: linear-gradient(145deg, #0f0f1c, #13131f);
          border: 1px solid rgba(201,168,76,0.28);
          border-radius: 18px;
          padding: 28px;
          position: relative;
          overflow: hidden;
        }
        .ticket-card::after {
          content: '';
          position: absolute;
          top: -80px; right: -80px;
          width: 200px; height: 200px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(201,168,76,0.07) 0%, transparent 70%);
          pointer-events: none;
        }
        .ticket-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 22px;
        }
        .ticket-event {
          font-family: var(--serif);
          font-size: 1.15rem;
          font-weight: 700;
          color: var(--gold-light);
        }
        .ticket-id-label {
          font-family: var(--mono);
          font-size: .62rem;
          color: var(--text-dim);
          margin-top: 4px;
          letter-spacing: .08em;
        }
        .qr-wrap {
          width: 76px; height: 76px;
          background: white;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .ticket-divider {
          border: none;
          border-top: 1px dashed rgba(255,255,255,0.08);
          margin: 18px -28px;
        }
        .ticket-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 10px;
        }
        .t-lbl {
          font-family: var(--mono);
          font-size: .62rem;
          color: var(--text-dim);
          letter-spacing: .08em;
        }
        .t-val {
          font-family: var(--mono);
          font-size: .7rem;
          color: #B0A898;
          font-weight: 500;
        }
        .ticket-team-badge {
          font-family: var(--mono);
          font-size: 1.3rem;
          font-weight: 700;
          letter-spacing: .12em;
          color: var(--gold-light);
          text-align: center;
          margin-top: 18px;
        }
        .confirm-bar {
          margin-top: 16px;
          padding: 10px 16px;
          background: rgba(61,214,140,0.07);
          border: 1px solid rgba(61,214,140,0.2);
          border-radius: 8px;
          display: flex;
          align-items: center;
          gap: 9px;
        }
        .confirm-dot {
          width: 7px; height: 7px;
          border-radius: 50%;
          background: var(--green);
          box-shadow: 0 0 6px var(--green);
          flex-shrink: 0;
        }
        .confirm-text {
          font-family: var(--mono);
          font-size: .68rem;
          color: var(--green);
        }

        .dash-card {
          background: var(--surface);
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 18px;
          padding: 24px;
          overflow: hidden;
        }
        .dash-top {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 22px;
        }
        .dash-title {
          font-size: .88rem;
          font-weight: 600;
          color: var(--text);
        }
        .live-badge {
          display: flex;
          align-items: center;
          gap: 5px;
          font-family: var(--mono);
          font-size: .65rem;
          padding: 4px 10px;
          border-radius: 9999px;
          background: rgba(61,214,140,0.08);
          border: 1px solid rgba(61,214,140,0.2);
          color: var(--green);
        }
        .live-badge-dot {
          width: 5px; height: 5px;
          border-radius: 50%;
          background: var(--green);
        }
        .mini-stats {
          display: flex;
          gap: 10px;
          margin-bottom: 20px;
        }
        .mini-stat {
          flex: 1;
          background: rgba(255,255,255,0.04);
          border-radius: 10px;
          padding: 14px 10px;
          text-align: center;
        }
        .mini-val {
          font-family: var(--serif);
          font-size: 1.5rem;
          font-weight: 700;
          color: var(--gold-light);
          line-height: 1;
        }
        .mini-lbl {
          font-family: var(--mono);
          font-size: .6rem;
          color: var(--text-dim);
          margin-top: 4px;
          letter-spacing: .06em;
        }
        .recent-label {
          font-family: var(--mono);
          font-size: .6rem;
          color: var(--text-dim);
          letter-spacing: .1em;
          text-transform: uppercase;
          margin-bottom: 12px;
        }
        .team-row {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 9px 0;
          border-bottom: 1px solid rgba(255,255,255,0.05);
        }
        .team-row:last-of-type { border-bottom: none; }
        .team-avatar {
          width: 32px; height: 32px;
          border-radius: 8px;
          background: var(--gold-dim);
          border: 1px solid var(--gold-border);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: .7rem;
          font-weight: 700;
          color: var(--gold);
          flex-shrink: 0;
          font-family: var(--mono);
        }
        .team-name {
          font-size: .82rem;
          color: #CCC;
          flex: 1;
        }
        .status-present {
          font-family: var(--mono);
          font-size: .62rem;
          padding: 2px 9px;
          border-radius: 9999px;
          background: rgba(61,214,140,0.08);
          border: 1px solid rgba(61,214,140,0.2);
          color: var(--green);
        }
        .status-pending {
          font-family: var(--mono);
          font-size: .62rem;
          padding: 2px 9px;
          border-radius: 9999px;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.08);
          color: var(--text-dim);
        }
        .dash-actions {
          display: flex;
          gap: 8px;
          margin-top: 16px;
        }
        .btn-sm {
          flex: 1;
          padding: 8px 12px;
          border-radius: 8px;
          border: 1px solid rgba(255,255,255,0.1);
          background: rgba(255,255,255,0.04);
          color: var(--text-muted);
          font-family: var(--sans);
          font-size: .75rem;
          font-weight: 500;
          cursor: pointer;
          transition: background .2s, border-color .2s;
        }
        .btn-sm:hover {
          background: rgba(255,255,255,0.08);
          border-color: rgba(255,255,255,0.18);
        }

        /* ─── BENEFITS ─── */
        .benefits-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(230px, 1fr));
          gap: 18px;
        }
        .benefit-card {
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 14px;
          padding: 30px 24px;
          text-align: center;
          transition: border-color .25s, background .25s;
          background: rgba(255,255,255,0.02);
        }
        .benefit-card:hover {
          border-color: var(--gold-border);
          background: var(--gold-dim);
        }
        .benefit-icon { font-size: 26px; margin-bottom: 14px; }
        .benefit-name {
          font-size: 1rem;
          font-weight: 600;
          color: var(--text);
          margin-bottom: 8px;
        }
        .benefit-desc {
          font-size: .78rem;
          color: var(--text-muted);
          line-height: 1.7;
          font-weight: 300;
        }

        /* ─── CTA BOX ─── */
        .cta-section {
          max-width: 760px;
          margin: 0 auto;
          padding: 40px 32px 100px;
          text-align: center;
        }
        .cta-box {
          background: linear-gradient(135deg, rgba(201,168,76,0.07), rgba(201,168,76,0.02));
          border: 1px solid var(--gold-border);
          border-radius: 22px;
          padding: 60px 48px;
          position: relative;
          overflow: hidden;
        }
        .cta-box::before {
          content: '';
          position: absolute;
          top: -50%;
          left: 50%;
          transform: translateX(-50%);
          width: 500px; height: 300px;
          border-radius: 50%;
          background: radial-gradient(ellipse, rgba(201,168,76,0.06) 0%, transparent 70%);
          pointer-events: none;
        }
        .cta-title {
          font-family: var(--serif);
          font-size: clamp(1.8rem, 4vw, 2.6rem);
          font-weight: 700;
          color: var(--text);
          line-height: 1.2;
          margin-bottom: 14px;
        }
        .cta-sub {
          font-size: .88rem;
          color: var(--text-muted);
          line-height: 1.8;
          margin-bottom: 36px;
          font-weight: 300;
          max-width: 500px;
          margin-left: auto;
          margin-right: auto;
        }

        /* ─── FOOTER ─── */
        footer {
          border-top: 1px solid rgba(255,255,255,0.05);
          padding: 40px 32px;
        }
        .footer-inner {
          max-width: 1100px;
          margin: 0 auto;
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 20px;
        }
        .footer-brand {
          font-family: var(--serif);
          font-size: 1.2rem;
          font-weight: 900;
          color: var(--gold-light);
        }
        .footer-links {
          display: flex;
          gap: 28px;
          flex-wrap: wrap;
        }
        .footer-links a {
          font-family: var(--mono);
          font-size: .7rem;
          color: var(--text-dim);
          text-decoration: none;
          letter-spacing: .08em;
          transition: color .2s;
          text-transform: uppercase;
        }
        .footer-links a:hover { color: var(--gold); }
        .footer-copy {
          font-family: var(--mono);
          font-size: .66rem;
          color: var(--text-dim);
          text-align: center;
          margin-top: 24px;
          max-width: 1100px;
          margin-left: auto;
          margin-right: auto;
          padding: 0 32px 20px;
          letter-spacing: .06em;
        }

        @media (max-width: 900px) {
          .nav { padding: 16px 20px; }
          .nav-links { display: none; }
          .section { padding: 70px 20px; }
          .cta-box { padding: 40px 24px; }
          .stats-strip { flex-direction: column; }
          .stat-item { border-right: none; border-bottom: 1px solid rgba(255,255,255,0.07); }
          .stat-item:last-child { border-bottom: none; }
        }
      `}} />

      <div style={{ background: 'var(--bg)', minHeight: '100vh', color: 'var(--text)' }}>

        {/* NAV */}
        <nav className={`nav${scrolled ? ' scrolled' : ''}`}>
          <a className="nav-brand" href="#">Eventra</a>
          <ul className="nav-links">
            <li><a href="/create-event">Create Event</a></li>
            <li><a href="/organizer-login">Organizer Login</a></li>
          </ul>
          <button className="nav-cta" onClick={() => sendPrompt('How do I create my first event on Eventra?')}>
            <li><a href="https://anubhavb-tech-hub.web.app/">Meet the Founder</a></li>
          </button>
        </nav>

        {/* HERO */}
        <div className="hero-wrap">
          <div className="hero-bg" />
          <div className="hero-inner">
            <div className="pill-badge">
              <span className="live-dot" />
              v1.5.4 — Now Live
            </div>
            <p className="hero-eyebrow">Event Management, Reimagined</p>
            <h1 className="hero-title">
              Manage Events Smarter
              <br />with <span className="accent">Eventra</span>
            </h1>
            <p className="hero-sub">
              A complete event management platform built to simplify registrations,
              automate workflows, and deliver a seamless experience for organizers
              and participants alike.
            </p>
            <div className="hero-ctas">
              <button className="btn-primary" onClick={() => sendPrompt('Show me how to create an event on Eventra')}>
                <svg width={15} height={15} fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                  <path d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                <li><a href="/create-event">Create Event</a></li>
              </button>
              <button className="btn-ghost" onClick={() => sendPrompt('Tell me about all Eventra features')}>
                <li><a href="#features">Explore Features ↓</a></li>
              </button>
            </div>
            <div className="stats-strip">
              <div className="stat-item">
                <div className="stat-val">QR</div>
                <div className="stat-lbl">Ticket System</div>
              </div>
              <div className="stat-item">
                <div className="stat-val">Auto</div>
                <div className="stat-lbl">Email Alerts</div>
              </div>
              <div className="stat-item">
                <div className="stat-val">Live</div>
                <div className="stat-lbl">Dashboard</div>
              </div>
              <div className="stat-item">
                <div className="stat-val">0 App</div>
                <div className="stat-lbl">Downloads Needed</div>
              </div>
            </div>
          </div>
        </div>

        <div className="rule" />

        {/* FEATURES */}
        <div className="section">
          <div className="section-header">
            <div className="section-tag">Features</div>
            <h2 className="section-title">Everything you need to run events</h2>
            <p className="section-sub">One platform, end-to-end — from creation to closure</p>
          </div>
          <div className="feat-grid">
            {[
              { icon: "⚡", title: "Smart Event Creation", desc: "Create events with a custom Event ID, organizer credentials, and full event details — ready to share in seconds.", tags: ["Custom ID", "Secure Login", "Full Control"] },
              { icon: "👥", title: "Team Registration System", desc: "Share a unique link and let teams register themselves. Auto-generated Team IDs prevent duplicates and keep things clean.", tags: ["Shareable Link", "Duplicate Guard", "Team-based"] },
              { icon: "🎫", title: "Digital Boarding Passes", desc: "Every registered team gets a fully styled, downloadable digital pass designed like a premium flight ticket with a secure QR code.", tags: ["Premium Design", "Downloadable", "QR Code"] },
              { icon: "📅", title: "Multi-Day Attendance", desc: "Hosting a 3-day hackathon? Scan teams at the door each morning. Eventra tracks presence Day 1 through Day N automatically with member-wise precision.", tags: ["Camera Scanner", "Day-by-Day Track", "Anti-Duplicate"] },
              { icon: "📧", title: "Email Automation", desc: "Auto-send confirmation emails with ticket details on registration. Broadcast announcements to all teams at once.", tags: ["Auto Confirm", "Ticket Attached", "Broadcast"] },
              { icon: "🔒", title: "Registration Control", desc: "Open or close registrations on demand. Set deadlines, auto-close on timer expiry, and define team slot limits.", tags: ["Countdown Timer", "Auto-close", "Slot Limits"] },
              { icon: "📊", title: "Organizer Dashboard", desc: "See all teams, track attendance live, send announcements, and manage every aspect of your event from one place.", tags: ["Live Stats", "CSV Export", "Announcements"] },
              { icon: "🎯", title: "Team Limit System", desc: "Set a maximum team cap. Track remaining slots in real time. Registration auto-stops when the limit is reached.", tags: ["Slot Counter", "Auto Stop", "Live Tracking"] },
              { icon: "🏆", title: "Multi-Round Qualifiers", desc: "Host elimination-style events effortlessly. Advance teams round-by-round, manage qualified pools, and award podium medals to finalists.", tags: ["Eliminations", "Medals System", "Live Toggles"] },
              { icon: "🌐", title: "Public Leaderboard", desc: "Share a public page where participants can search their Team ID, see if they passed to the next round, and view live final rankings.", tags: ["Public URL", "Searchable", "Live Progress"] },
            ].map((f, i) => (
              <div className="feat-card" key={i}>
                <div className="feat-icon-wrap">{f.icon}</div>
                <div className="feat-name">{f.title}</div>
                <div className="feat-desc">{f.desc}</div>
                <div className="feat-tags">
                  {f.tags.map((t, j) => <span className="tag" key={j}>{t}</span>)}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rule" />

        {/* HOW IT WORKS */}
        <div className="section">
          <div className="section-header">
            <div className="section-tag">How It Works</div>
            <h2 className="section-title">Get started in minutes</h2>
            <p className="section-sub">Five simple steps from idea to successful event</p>
          </div>
          <div className="steps-container">
            {[
              { n: "01", title: "Create Event", desc: "Generate a unique Event ID and configure all your event details." },
              { n: "02", title: "Share the Link", desc: "Distribute the registration link to participants via any channel." },
              { n: "03", title: "Teams Register", desc: "Participants fill in their team details — Eventra handles the rest." },
              { n: "04", title: "Ticket Generated", desc: "Each team receives a QR digital pass automatically by email." },
              { n: "05", title: "Scan & Manage", desc: "Use the camera scanner at the door to mark attendance instantly." },
            ].map((s, i) => (
              <div className="step-item" key={i}>
                <div className="step-number">{s.n}</div>
                <div className="step-name">{s.title}</div>
                <div className="step-desc">{s.desc}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="rule" />

        {/* PRODUCT PREVIEW */}
        <div className="section">
          <div className="section-header">
            <div className="section-tag">Product Preview</div>
            <h2 className="section-title">See Eventra in action</h2>
            <p className="section-sub">Real UI previews — what your participants and dashboard look like</p>
          </div>
          <div className="preview-grid">
            {/* Ticket Card */}
            <div className="ticket-card">
              <div className="ticket-header">
                <div>
                  <div className="ticket-event">TechFest 2025</div>
                  <div className="ticket-id-label">EVENT · TF2025</div>
                </div>
                <div className="qr-wrap">
                  <svg width={64} height={64} viewBox="0 0 7 7" xmlns="http://www.w3.org/2000/svg" shapeRendering="crispEdges">
                    <rect width={7} height={7} fill="white" />
                    <rect x={0} y={0} width={3} height={3} fill="#000" />
                    <rect x={1} y={1} width={1} height={1} fill="white" />
                    <rect x={4} y={0} width={3} height={3} fill="#000" />
                    <rect x={5} y={1} width={1} height={1} fill="white" />
                    <rect x={0} y={4} width={3} height={3} fill="#000" />
                    <rect x={1} y={5} width={1} height={1} fill="white" />
                    <rect x={3} y={3} width={1} height={1} fill="#000" />
                    <rect x={4} y={3} width={1} height={1} fill="#000" />
                    <rect x={6} y={4} width={1} height={1} fill="#000" />
                    <rect x={4} y={5} width={2} height={1} fill="#000" />
                    <rect x={3} y={6} width={1} height={1} fill="#000" />
                    <rect x={5} y={6} width={2} height={1} fill="#000" />
                  </svg>
                </div>
              </div>
              <hr className="ticket-divider" />
              <div className="ticket-row">
                <span className="t-lbl">TEAM NAME</span>
                <span className="t-val">Phantom Coders</span>
              </div>
              <div className="ticket-row">
                <span className="t-lbl">MEMBERS</span>
                <span className="t-val">3 / 4</span>
              </div>
              <div className="ticket-row">
                <span className="t-lbl">DATE</span>
                <span className="t-val">14 Dec 2025 · 10:00 AM</span>
              </div>
              <div className="ticket-row">
                <span className="t-lbl">VENUE</span>
                <span className="t-val">Main Auditorium</span>
              </div>
              <div className="ticket-team-badge">TEAM · PC-8472</div>
              <div className="confirm-bar">
                <span className="confirm-dot" />
                <span className="confirm-text">Registration Confirmed · Email Sent</span>
              </div>
            </div>

            {/* Dashboard Card */}
            <div className="dash-card">
              <div className="dash-top">
                <div className="dash-title">Organizer Dashboard</div>
                <div className="live-badge">
                  <span className="live-badge-dot" />
                  Live
                </div>
              </div>
              <div className="mini-stats">
                <div className="mini-stat">
                  <div className="mini-val">142</div>
                  <div className="mini-lbl">Teams Registered</div>
                </div>
                <div className="mini-stat">
                  <div className="mini-val">89</div>
                  <div className="mini-lbl">Checked In</div>
                </div>
                <div className="mini-stat">
                  <div className="mini-val">8</div>
                  <div className="mini-lbl">Slots Left</div>
                </div>
              </div>
              <div className="recent-label">Recent Teams</div>
              <div className="team-row">
                <div className="team-avatar">PC</div>
                <div className="team-name">Phantom Coders</div>
                <span className="status-present">Present</span>
              </div>
              <div className="team-row">
                <div className="team-avatar">BX</div>
                <div className="team-name">Binary Foxes</div>
                <span className="status-present">Present</span>
              </div>
              <div className="team-row">
                <div className="team-avatar">NX</div>
                <div className="team-name">NexGen Squad</div>
                <span className="status-pending">Pending</span>
              </div>
              <div className="team-row">
                <div className="team-avatar">QH</div>
                <div className="team-name">Quantum Hawks</div>
                <span className="status-pending">Pending</span>
              </div>
              <div className="dash-actions">
                <button className="btn-sm">📢 Broadcast</button>
                <button className="btn-sm">⬇ Export CSV</button>
              </div>
            </div>
          </div>
        </div>

        <div className="rule" />

        {/* WHY EVENTRA */}
        <div className="section">
          <div className="section-header">
            <div className="section-tag">Why Eventra</div>
            <h2 className="section-title">Built for organizers who demand more</h2>
            <p className="section-sub">No compromises — professional grade from day one</p>
          </div>
          <div className="benefits-grid">
            {[
              { icon: "⚡", title: "Instant & Fast", desc: "Zero lag. QR scanning, ticket generation, and email delivery happen in real time — no waiting." },
              { icon: "🔐", title: "Secure by Design", desc: "Hashed passwords, validated operations, and controlled organizer access protect every event." },
              { icon: "🤖", title: "Fully Automated", desc: "Emails, ticket IDs, slot counters, and deadline closures — automated so you focus on the event." },
              { icon: "📱", title: "No App Needed", desc: "QR scanning and participant registration work entirely in the browser — no downloads required." },
            ].map((b, i) => (
              <div className="benefit-card" key={i}>
                <div className="benefit-icon">{b.icon}</div>
                <div className="benefit-name">{b.title}</div>
                <div className="benefit-desc">{b.desc}</div>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="cta-section">
          <div className="cta-box">
            <h2 className="cta-title">
              Start Managing Your Event <span style={{ fontStyle: 'italic', background: 'linear-gradient(120deg, var(--gold), var(--gold-light))', WebkitBackgroundClip: 'text', backgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Today</span>
            </h2>
            <p className="cta-sub">
              Join the organizers who've switched to Eventra for a smoother,
              more professional event experience.
            </p>
            <button className="btn-primary" style={{ margin: '0 auto' }} onClick={() => sendPrompt('How do I create my first event on Eventra?')}>
              <svg width={15} height={15} fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                <path d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <li><a href="/create-event">Create Your First Event</a></li>
            </button>
          </div>
        </div>

        {/* FOOTER */}
        <footer>
          <div className="footer-inner">
            <div className="footer-brand">Eventra</div>
            <div className="footer-links">
              <a href="/create-event">Create Event</a>
              <a href="/register-team">Register Team</a>
              <a href="#">Leaderboard</a>
              <a href="/organizer-login">Organizer Login</a>
              <a href="#">Scanner</a>
              <a href="#">Dashboard</a>
            </div>
          </div>
          <div className="footer-copy">
            Built by <span className="gold-text"><a href="https://anubhavb-tech-hub.web.app/">ANUBHAV BAJPAI</a></span>
          </div>
        </footer>
      </div>
    </>
  );
};