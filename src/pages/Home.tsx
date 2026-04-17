import React from "react";

export const Home: React.FC = () => {
  const sendPrompt = (msg: string) => {
    console.log(msg);
  };

  return (
    <>
  <style
    dangerouslySetInnerHTML={{
      __html:
        "\n*{box-sizing:border-box;margin:0;padding:0}\nbody{font-family:var(--font-sans)}\n.page{background:#0a0a0f;min-height:100vh;color:#eaeaea;overflow-x:hidden}\n.gold{background:linear-gradient(135deg,#C6A969,#D4AF37,#e8c870);-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent}\n.badge{display:inline-flex;align-items:center;gap:8px;padding:5px 14px;border-radius:9999px;border:1px solid rgba(198,169,105,0.3);background:rgba(198,169,105,0.07);font-size:11px;letter-spacing:.08em;color:#9a9a9a;font-family:var(--font-mono)}\n.dot-live{width:6px;height:6px;border-radius:50%;background:#4ADE80;box-shadow:0 0 8px #4ADE80;flex-shrink:0}\n.hero{max-width:900px;margin:0 auto;padding:80px 24px 60px;text-align:center}\nh1.headline{font-size:clamp(2.6rem,7vw,5rem);font-weight:700;line-height:1.06;letter-spacing:-.02em;color:#eaeaea;margin:24px 0 8px}\n.sub{font-size:1rem;color:#888;max-width:580px;margin:20px auto 36px;line-height:1.75;font-family:var(--font-mono)}\n.ctas{display:flex;gap:14px;justify-content:center;flex-wrap:wrap;margin-bottom:56px}\n.btn-gold{padding:12px 28px;border-radius:10px;border:none;background:linear-gradient(135deg,#C6A969,#D4AF37);color:#0a0a0f;font-weight:700;font-size:.9rem;cursor:pointer;display:inline-flex;align-items:center;gap:8px;letter-spacing:.02em;transition:opacity .2s,transform .15s}\n.btn-gold:hover{opacity:.88;transform:translateY(-1px)}\n.btn-outline{padding:12px 28px;border-radius:10px;border:1px solid rgba(198,169,105,0.35);background:rgba(198,169,105,0.06);color:#C6A969;font-size:.9rem;cursor:pointer;font-family:var(--font-sans);transition:background .2s,border-color .2s}\n.btn-outline:hover{background:rgba(198,169,105,0.12);border-color:rgba(198,169,105,.6)}\n.stats-row{display:flex;justify-content:center;gap:56px;flex-wrap:wrap;padding-top:8px}\n.stat-val{font-size:2.2rem;font-weight:700;color:#C6A969;line-height:1}\n.stat-lbl{font-size:11px;color:#555;letter-spacing:.1em;margin-top:4px;font-family:var(--font-mono)}\n.divider{max-width:700px;margin:0 auto 64px;height:1px;background:linear-gradient(90deg,transparent,rgba(198,169,105,0.18),transparent)}\nsection.wrap{max-width:1100px;margin:0 auto;padding:0 24px 80px}\n.sec-label{font-family:var(--font-mono);font-size:11px;color:#C6A969;letter-spacing:.12em;text-align:center;margin-bottom:12px}\n.sec-title{font-size:clamp(1.8rem,4vw,2.8rem);font-weight:700;text-align:center;color:#eaeaea;margin-bottom:10px}\n.sec-sub{font-family:var(--font-mono);font-size:.82rem;color:#555;text-align:center;margin-bottom:48px}\n.feat-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(290px,1fr));gap:18px}\n.glass-card{background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.07);border-radius:16px;padding:24px;transition:border-color .25s,background .25s;position:relative;overflow:hidden}\n.glass-card::before{content:'';position:absolute;inset:0;border-radius:16px;background:linear-gradient(135deg,rgba(198,169,105,0.04),transparent);pointer-events:none}\n.glass-card:hover{border-color:rgba(198,169,105,0.25);background:rgba(198,169,105,0.04)}\n.feat-icon{width:44px;height:44px;border-radius:12px;background:rgba(198,169,105,0.08);border:1px solid rgba(198,169,105,0.2);display:flex;align-items:center;justify-content:center;margin-bottom:16px;font-size:20px}\n.feat-title{font-size:1.05rem;font-weight:600;color:#eaeaea;margin-bottom:6px}\n.feat-desc{font-family:var(--font-mono);font-size:.76rem;color:#777;line-height:1.65}\n.feat-tags{display:flex;flex-wrap:wrap;gap:6px;margin-top:14px}\n.tag{font-family:var(--font-mono);font-size:10px;padding:3px 10px;border-radius:9999px;background:rgba(198,169,105,0.08);border:1px solid rgba(198,169,105,0.18);color:#9a7a3a}\n.steps-row{display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:0;position:relative;padding:0 12px}\n.step-card{text-align:center;padding:32px 20px;position:relative}\n.step-card:not(:last-child)::after{content:'';position:absolute;right:0;top:50px;width:1px;height:60px;background:linear-gradient(180deg,transparent,rgba(198,169,105,0.3),transparent)}\n.step-num{font-size:2.8rem;font-weight:800;color:rgba(198,169,105,0.15);line-height:1;margin-bottom:10px;font-variant-numeric:tabular-nums}\n.step-title{font-size:.95rem;font-weight:600;color:#eaeaea;margin-bottom:8px}\n.step-desc{font-family:var(--font-mono);font-size:.73rem;color:#666;line-height:1.6}\n.preview-grid{display:grid;grid-template-columns:1fr 1fr;gap:24px;align-items:start}\n@media(max-width:700px){.preview-grid{grid-template-columns:1fr}}\n.ticket-card{background:linear-gradient(135deg,#0f0f18,#141420);border:1px solid rgba(198,169,105,0.25);border-radius:20px;padding:28px;position:relative;overflow:hidden}\n.ticket-card::before{content:'';position:absolute;top:-60px;right:-60px;width:180px;height:180px;border-radius:50%;background:radial-gradient(circle,rgba(198,169,105,0.08),transparent 70%)}\n.ticket-header{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:20px}\n.ticket-event{font-size:1.1rem;font-weight:700;color:#C6A969}\n.ticket-id{font-family:var(--font-mono);font-size:.65rem;color:#555;margin-top:3px}\n.qr-mock{width:80px;height:80px;background:white;border-radius:8px;display:flex;align-items:center;justify-content:center;overflow:hidden}\n.qr-inner{display:grid;grid-template-columns:repeat(7,1fr);gap:1px;width:64px;height:64px}\n.q1{background:#000;border-radius:1px}\n.q0{background:white;border-radius:1px}\n.ticket-divider{border:none;border-top:1px dashed rgba(255,255,255,0.08);margin:16px -28px;padding:0 28px}\n.ticket-row{display:flex;justify-content:space-between;margin-bottom:8px}\n.ticket-lbl{font-family:var(--font-mono);font-size:.65rem;color:#555;letter-spacing:.06em}\n.ticket-val{font-family:var(--font-mono);font-size:.72rem;color:#aaa;font-weight:600}\n.ticket-team-id{font-size:1.4rem;font-weight:800;letter-spacing:.1em;color:#C6A969;text-align:center;margin-top:16px;font-family:var(--font-mono)}\n.dash-card{background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.07);border-radius:16px;padding:20px;overflow:hidden}\n.dash-header{display:flex;justify-content:space-between;align-items:center;margin-bottom:20px}\n.dash-title-txt{font-size:.85rem;font-weight:600;color:#eaeaea}\n.dash-badge-live{font-family:var(--font-mono);font-size:10px;padding:3px 10px;border-radius:9999px;background:rgba(74,222,128,.1);border:1px solid rgba(74,222,128,.25);color:#4ADE80;display:flex;align-items:center;gap:5px}\n.mini-stat{background:rgba(255,255,255,0.04);border-radius:10px;padding:12px;text-align:center;flex:1}\n.mini-stat-val{font-size:1.4rem;font-weight:700;color:#C6A969}\n.mini-stat-lbl{font-family:var(--font-mono);font-size:.63rem;color:#555;margin-top:3px}\n.mini-stats-row{display:flex;gap:10px;margin-bottom:16px}\n.team-row{display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:1px solid rgba(255,255,255,0.05)}\n.team-row:last-child{border-bottom:none}\n.team-avatar{width:30px;height:30px;border-radius:8px;background:linear-gradient(135deg,rgba(198,169,105,0.2),rgba(198,169,105,0.08));border:1px solid rgba(198,169,105,0.2);display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:600;color:#C6A969;flex-shrink:0}\n.team-name{font-size:.8rem;color:#ccc;flex:1}\n.team-status{font-family:var(--font-mono);font-size:10px;padding:2px 8px;border-radius:9999px}\n.present{background:rgba(74,222,128,.1);border:1px solid rgba(74,222,128,.2);color:#4ADE80}\n.pending{background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);color:#555}\n.benefits-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:20px}\n.benefit-card{background:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.06);border-radius:16px;padding:28px 24px;text-align:center;transition:border-color .25s}\n.benefit-card:hover{border-color:rgba(198,169,105,0.2)}\n.benefit-icon{font-size:28px;margin-bottom:14px}\n.benefit-title{font-size:1.05rem;font-weight:600;color:#eaeaea;margin-bottom:8px}\n.benefit-desc{font-family:var(--font-mono);font-size:.73rem;color:#666;line-height:1.6}\n.cta-section{max-width:720px;margin:0 auto;padding:40px 24px 80px;text-align:center}\n.cta-box{background:linear-gradient(135deg,rgba(198,169,105,0.08),rgba(198,169,105,0.03));border:1px solid rgba(198,169,105,0.2);border-radius:24px;padding:56px 40px}\n.cta-title{font-size:clamp(1.6rem,4vw,2.4rem);font-weight:700;color:#eaeaea;margin-bottom:12px}\n.cta-sub{font-family:var(--font-mono);font-size:.82rem;color:#666;margin-bottom:32px;line-height:1.7}\nfooter{border-top:1px solid rgba(255,255,255,0.05);padding:32px 24px;text-align:center}\n.footer-inner{max-width:900px;margin:0 auto;display:flex;flex-wrap:wrap;justify-content:space-between;align-items:center;gap:16px}\n.footer-brand{font-size:1.1rem;font-weight:700}\n.footer-links{display:flex;gap:24px;flex-wrap:wrap}\n.footer-links a{font-family:var(--font-mono);font-size:.72rem;color:#555;text-decoration:none;letter-spacing:.06em;transition:color .2s}\n.footer-links a:hover{color:#C6A969}\n.footer-copy{font-family:var(--font-mono);font-size:.68rem;color:#3a3a3a;width:100%;text-align:center;margin-top:20px}\n.steps-wrap{background:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.05);border-radius:20px;overflow:hidden}\n"
    }}
  />
  <div className="page">
    <div className="hero">
      <div className="badge">
        <span className="dot-live" />
        v1.0 — Now Live
      </div>
      <h1 className="headline">
        Manage Events Smarter
        <br />
        with <span className="gold">Eventra</span>
      </h1>
      <p className="sub">
        Eventra is a complete event management product built to simplify
        registrations, automate workflows, and deliver a seamless experience for
        organizers and participants.
      </p>
      <div className="ctas">
        <button
          className="btn-gold"
          onClick={() => sendPrompt('Show me how to create an event on Eventra')}
        >
          <svg
            width={16}
            height={16}
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            viewBox="0 0 24 24"
          >
            <path d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          Create an Event
        </button>
        <button
          className="btn-outline"
          onClick={() => sendPrompt('Tell me about all Eventra features')}
        >
          Explore Features ↓
        </button>
      </div>
      <div className="stats-row">
        <div>
          <div className="stat-val">QR</div>
          <div className="stat-lbl">Ticket System</div>
        </div>
        <div>
          <div className="stat-val">Auto</div>
          <div className="stat-lbl">Email Alerts</div>
        </div>
        <div>
          <div className="stat-val">Live</div>
          <div className="stat-lbl">Dashboard</div>
        </div>
        <div>
          <div className="stat-val">0 App</div>
          <div className="stat-lbl">Downloads Needed</div>
        </div>
      </div>
    </div>
    <div className="divider" />
    <section className="wrap">
      <div className="sec-label">FEATURES</div>
      <h2 className="sec-title">Everything you need to run events</h2>
      <p className="sec-sub">
        One platform, end-to-end — from creation to closure
      </p>
      <div className="feat-grid">
        <div className="glass-card">
          <div className="feat-icon">⚡</div>
          <div className="feat-title">Smart Event Creation</div>
          <div className="feat-desc">
            Create events with a custom Event ID, organizer credentials, and
            full event details — ready to share in seconds.
          </div>
          <div className="feat-tags">
            <span className="tag">Custom ID</span>
            <span className="tag">Secure Login</span>
            <span className="tag">Full Control</span>
          </div>
        </div>
        <div className="glass-card">
          <div className="feat-icon">👥</div>
          <div className="feat-title">Team Registration System</div>
          <div className="feat-desc">
            Share a unique link and let teams register themselves.
            Auto-generated Team IDs prevent duplicates and keep things clean.
          </div>
          <div className="feat-tags">
            <span className="tag">Shareable Link</span>
            <span className="tag">Duplicate Guard</span>
            <span className="tag">Team-based</span>
          </div>
        </div>
        <div className="glass-card">
          <div className="feat-icon">🎫</div>
          <div className="feat-title">QR-Based Ticket System</div>
          <div className="feat-desc">
            Every registered team gets a downloadable digital pass with a unique
            QR code — just like a real event ticket.
          </div>
          <div className="feat-tags">
            <span className="tag">Auto-generated</span>
            <span className="tag">Downloadable</span>
            <span className="tag">QR Code</span>
          </div>
        </div>
        <div className="glass-card">
          <div className="feat-icon">📷</div>
          <div className="feat-title">QR Attendance System</div>
          <div className="feat-desc">
            Scan team QR codes at entry. Mark member-wise attendance, prevent
            duplicates, or use manual Team ID lookup.
          </div>
          <div className="feat-tags">
            <span className="tag">Camera Scanner</span>
            <span className="tag">Member-wise</span>
            <span className="tag">Manual Lookup</span>
          </div>
        </div>
        <div className="glass-card">
          <div className="feat-icon">📧</div>
          <div className="feat-title">Email Automation</div>
          <div className="feat-desc">
            Auto-send confirmation emails with ticket details on registration.
            Broadcast announcements to all teams at once.
          </div>
          <div className="feat-tags">
            <span className="tag">Auto Confirm</span>
            <span className="tag">Ticket Attached</span>
            <span className="tag">Broadcast</span>
          </div>
        </div>
        <div className="glass-card">
          <div className="feat-icon">🔒</div>
          <div className="feat-title">Registration Control</div>
          <div className="feat-desc">
            Open or close registrations on demand. Set deadlines, auto-close on
            timer expiry, and define team slot limits.
          </div>
          <div className="feat-tags">
            <span className="tag">Countdown Timer</span>
            <span className="tag">Auto-close</span>
            <span className="tag">Slot Limits</span>
          </div>
        </div>
        <div className="glass-card">
          <div className="feat-icon">📊</div>
          <div className="feat-title">Organizer Dashboard</div>
          <div className="feat-desc">
            See all teams, track attendance live, send announcements, and manage
            every aspect of your event from one place.
          </div>
          <div className="feat-tags">
            <span className="tag">Live Stats</span>
            <span className="tag">CSV Export</span>
            <span className="tag">Announcements</span>
          </div>
        </div>
        <div className="glass-card">
          <div className="feat-icon">🎯</div>
          <div className="feat-title">Team Limit System</div>
          <div className="feat-desc">
            Set a maximum team cap. Track remaining slots in real time.
            Registration auto-stops when the limit is reached.
          </div>
          <div className="feat-tags">
            <span className="tag">Slot Counter</span>
            <span className="tag">Auto Stop</span>
            <span className="tag">Live Tracking</span>
          </div>
        </div>
      </div>
    </section>
    <section className="wrap" style={{ paddingBottom: 80 }}>
      <div className="sec-label">HOW IT WORKS</div>
      <h2 className="sec-title">Get started in minutes</h2>
      <p className="sec-sub">Five simple steps from idea to successful event</p>
      <div className="steps-wrap">
        <div className="steps-row">
          <div className="step-card">
            <div className="step-num">01</div>
            <div className="step-title">Create Event</div>
            <div className="step-desc">
              Generate a unique Event ID and configure all your event details.
            </div>
          </div>
          <div className="step-card">
            <div className="step-num">02</div>
            <div className="step-title">Share the Link</div>
            <div className="step-desc">
              Distribute the registration link to participants via any channel.
            </div>
          </div>
          <div className="step-card">
            <div className="step-num">03</div>
            <div className="step-title">Teams Register</div>
            <div className="step-desc">
              Participants fill in their team details — Eventra handles the
              rest.
            </div>
          </div>
          <div className="step-card">
            <div className="step-num">04</div>
            <div className="step-title">Ticket Generated</div>
            <div className="step-desc">
              Each team receives a QR digital pass automatically by email.
            </div>
          </div>
          <div className="step-card">
            <div className="step-num">05</div>
            <div className="step-title">Scan &amp; Manage</div>
            <div className="step-desc">
              Use the camera scanner at the door to mark attendance instantly.
            </div>
          </div>
        </div>
      </div>
    </section>
    <section className="wrap" style={{ paddingBottom: 80 }}>
      <div className="sec-label">PRODUCT PREVIEW</div>
      <h2 className="sec-title">See Eventra in action</h2>
      <p className="sec-sub">
        Real UI previews — what your participants and dashboard look like
      </p>
      <div className="preview-grid">
        <div className="ticket-card">
          <div className="ticket-header">
            <div>
              <div className="ticket-event">TechFest 2025</div>
              <div className="ticket-id">EVENT · TF2025</div>
            </div>
            <div className="qr-mock">
              <svg
                width={64}
                height={64}
                viewBox="0 0 7 7"
                xmlns="http://www.w3.org/2000/svg"
                shapeRendering="crispEdges"
              >
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
            <span className="ticket-lbl">TEAM NAME</span>
            <span className="ticket-val">Phantom Coders</span>
          </div>
          <div className="ticket-row">
            <span className="ticket-lbl">MEMBERS</span>
            <span className="ticket-val">3 / 4</span>
          </div>
          <div className="ticket-row">
            <span className="ticket-lbl">DATE</span>
            <span className="ticket-val">14 Dec 2025 · 10:00 AM</span>
          </div>
          <div className="ticket-row">
            <span className="ticket-lbl">VENUE</span>
            <span className="ticket-val">Main Auditorium</span>
          </div>
          <div className="ticket-team-id">TEAM · PC-8472</div>
          <div
            style={{
              marginTop: 18,
              padding: "10px 16px",
              background: "rgba(74,222,128,0.08)",
              border: "1px solid rgba(74,222,128,0.2)",
              borderRadius: 10,
              display: "flex",
              alignItems: "center",
              gap: 8
            }}
          >
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                background: "#4ADE80",
                boxShadow: "0 0 6px #4ADE80",
                flexShrink: 0
              }}
            />
            <span
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: ".7rem",
                color: "#4ADE80"
              }}
            >
              Registration Confirmed · Email Sent
            </span>
          </div>
        </div>
        <div className="dash-card">
          <div className="dash-header">
            <div className="dash-title-txt">Organizer Dashboard</div>
            <div className="dash-badge-live">
              <span
                style={{
                  width: 5,
                  height: 5,
                  borderRadius: "50%",
                  background: "#4ADE80"
                }}
              />
              Live
            </div>
          </div>
          <div className="mini-stats-row">
            <div className="mini-stat">
              <div className="mini-stat-val">142</div>
              <div className="mini-stat-lbl">Teams Registered</div>
            </div>
            <div className="mini-stat">
              <div className="mini-stat-val">89</div>
              <div className="mini-stat-lbl">Checked In</div>
            </div>
            <div className="mini-stat">
              <div className="mini-stat-val">8</div>
              <div className="mini-stat-lbl">Slots Left</div>
            </div>
          </div>
          <div
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: ".65rem",
              color: "#444",
              letterSpacing: ".08em",
              marginBottom: 10
            }}
          >
            RECENT TEAMS
          </div>
          <div className="team-row">
            <div className="team-avatar">PC</div>
            <div className="team-name">Phantom Coders</div>
            <span className="team-status present">Present</span>
          </div>
          <div className="team-row">
            <div className="team-avatar">BX</div>
            <div className="team-name">Binary Foxes</div>
            <span className="team-status present">Present</span>
          </div>
          <div className="team-row">
            <div className="team-avatar">NX</div>
            <div className="team-name">NexGen Squad</div>
            <span className="team-status pending">Pending</span>
          </div>
          <div className="team-row">
            <div className="team-avatar">QH</div>
            <div className="team-name">Quantum Hawks</div>
            <span className="team-status pending">Pending</span>
          </div>
          <div style={{ marginTop: 16, display: "flex", gap: 8 }}>
            <button
              className="btn-outline"
              style={{ fontSize: ".72rem", padding: "6px 14px", flex: 1 }}
            >
              📢 Broadcast
            </button>
            <button
              className="btn-outline"
              style={{ fontSize: ".72rem", padding: "6px 14px", flex: 1 }}
            >
              ⬇ Export CSV
            </button>
          </div>
        </div>
      </div>
    </section>
    <section className="wrap" style={{ paddingBottom: 80 }}>
      <div className="sec-label">WHY EVENTRA</div>
      <h2 className="sec-title">Built for organizers who demand more</h2>
      <p className="sec-sub">
        No compromises — professional grade from day one
      </p>
      <div className="benefits-grid">
        <div className="benefit-card">
          <div className="benefit-icon">⚡</div>
          <div className="benefit-title">Instant &amp; Fast</div>
          <div className="benefit-desc">
            Zero lag. QR scanning, ticket generation, and email delivery happen
            in real time — no waiting.
          </div>
        </div>
        <div className="benefit-card">
          <div className="benefit-icon">🔐</div>
          <div className="benefit-title">Secure by Design</div>
          <div className="benefit-desc">
            Hashed passwords, validated operations, and controlled organizer
            access protect every event.
          </div>
        </div>
        <div className="benefit-card">
          <div className="benefit-icon">🤖</div>
          <div className="benefit-title">Fully Automated</div>
          <div className="benefit-desc">
            Emails, ticket IDs, slot counters, and deadline closures — automated
            so you focus on the event.
          </div>
        </div>
        <div className="benefit-card">
          <div className="benefit-icon">📱</div>
          <div className="benefit-title">No App Needed</div>
          <div className="benefit-desc">
            QR scanning and participant registration work entirely in the
            browser — no downloads required.
          </div>
        </div>
      </div>
    </section>
    <div className="cta-section">
      <div className="cta-box">
        <div className="cta-title">
          Start Managing Your
          <br />
          Event <span className="gold">Today</span>
        </div>
        <div className="cta-sub">
          Join the organizers who've switched to Eventra for a smoother, more
          professional event experience.
        </div>
        <div className="ctas" style={{ marginBottom: 0 }}>
          <button
            className="btn-gold"
            onClick={() => sendPrompt('How do I create my first event on Eventra?')}
          >
            <svg
              width={16}
              height={16}
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              viewBox="0 0 24 24"
            >
              <path d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            Create Your First Event
          </button>
        </div>
      </div>
    </div>
    <footer>
      <div className="footer-inner">
        <div className="footer-brand">
          <span className="gold">Eventra</span>
        </div>
        <div className="footer-links">
          <a href="#">Create Event</a>
          <a href="#">Register Team</a>
          <a href="#">Organizer Login</a>
          <a href="#">Scanner</a>
          <a href="#">Dashboard</a>
        </div>
      </div>
      <div className="footer-copy">
        Built with care · Eventra v1.0 · Event management, reimagined
      </div>
    </footer>
  </div>
    </>
  );
};
