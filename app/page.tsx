"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

const Arrow = () => <span aria-hidden="true">↗</span>;

export default function Home() {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  return (
    <main>
      <nav className="nav">
        <a className="brand" href="#top" aria-label="OpenHostel home">
          <i>O</i>
          <span>OpenHostel</span>
        </a>
        <button
          className="menu"
          aria-expanded={menuOpen}
          aria-label="Toggle menu"
          onClick={() => setMenuOpen(!menuOpen)}
        >
          <b></b>
          <b></b>
        </button>
        <div className={menuOpen ? "nav-links open" : "nav-links"}>
          <a href="#how" onClick={() => setMenuOpen(false)}>
            How it works
          </a>
          <a href="#roles" onClick={() => setMenuOpen(false)}>
            For everyone
          </a>
          <a href="#about" onClick={() => setMenuOpen(false)}>
            Why OpenHostel
          </a>
          <a
            className="nav-cta"
            onClick={() => {
              setMenuOpen(false);
              router.push("/register");
            }}
          >
            Register <Arrow />
          </a>
        </div>
      </nav>

      <section className="hero" id="top">
        <div className="hero-copy">
          <p className="eyebrow">
            <span></span> Built for better hostel life
          </p>
          <h1>
            The simpler way
            <br />
            to run a <em>hostel.</em>
          </h1>
          <p className="hero-text">
            One clear, connected space for students, staff and mess
            vendors—without the paperwork.
          </p>
          <a
            id="register"
            className="primary-cta"
            onClick={() => router.push("/register")}
          >
            Register your hostel <Arrow />
          </a>
          <div className="trust">
            <div className="avatars">
              <span>R</span>
              <span>M</span>
              <span>S</span>
              <span>+</span>
            </div>
            <p>
              Made openly with
              <br />
              <strong>students &amp; colleges</strong>
            </p>
          </div>
        </div>
        <div
          className="hero-art"
          aria-label="OpenHostel student dashboard preview"
        >
          <div className="sun"></div>
          <div className="arch a1"></div>
          <div className="arch a2"></div>
          <div className="plant">
            <i></i>
            <i></i>
            <i></i>
          </div>
          <div className="dashboard">
            <div className="dash-top">
              <span className="tiny-logo">O</span>
              <span className="dots">•••</span>
            </div>
            <p className="welcome">Good morning, Riya</p>
            <h3>Your hostel, at a glance.</h3>
            <div className="active-card">
              <span className="check">✓</span>
              <div>
                <small>MESS SUBSCRIPTION</small>
                <b>Active · August</b>
              </div>
            </div>
            <div className="dash-grid">
              <div>
                <span>⌂</span>
                <small>Room</small>
                <b>A–204</b>
              </div>
              <div>
                <span>◷</span>
                <small>Next meal</small>
                <b>Lunch · 1 PM</b>
              </div>
            </div>
          </div>
          <div className="floating qr">
            <span>▦</span>
            <b>Ready to scan</b>
          </div>
          <div className="floating room">
            <span>●</span> Room allocated
          </div>
        </div>
      </section>

      <section className="strip ">
        <p className="pl-4">
          ONE PLATFORM. <i>EVERYDAY CLARITY.</i>
        </p>
        <span className="max-sm:hidden">✦</span>
        <p>
          ONE PLATFORM. <i>EVERYDAY CLARITY.</i>
        </p>
      </section>

      <section className="intro" id="about">
        <p className="eyebrow">
          <span></span> A better foundation
        </p>
        <h2>
          Less administration.
          <br />
          <em>More belonging.</em>
        </h2>
        <p>
          OpenHostel brings the everyday rhythm of hostel life into one
          thoughtfully simple platform.
        </p>
      </section>

      <section className="flows" id="how">
        <article className="flow-card red">
          <p>01 / STUDENT ONBOARDING</p>
          <h3>
            From application
            <br />
            to <em>settled in.</em>
          </h3>
          <div className="flow-line">
            <span>Register</span>
            <b>→</b>
            <span>Approve</span>
            <b>→</b>
            <span>Welcome</span>
          </div>
          <div className="number">01</div>
        </article>
        <article className="flow-card green">
          <p>02 / MESS, MADE EASY</p>
          <h3>
            Good food. Clear
            <br />
            <em>plans.</em>
          </h3>
          <div className="meal">
            <span>☀</span>
            <div>
              <small>UP NEXT</small>
              <b>Lunch · 01:00 PM</b>
            </div>
            <i>›</i>
          </div>
          <div className="number">02</div>
        </article>
      </section>

      <section className="roles" id="roles">
        <div className="roles-heading">
          <p className="eyebrow">
            <span></span> Designed around people
          </p>
          <h2>
            One home.
            <br />
            <em>Every role.</em>
          </h2>
        </div>
        <div className="role-list">
          {[
            [
              "01",
              "Students",
              "Your room, meals, leave and notices—in your pocket.",
            ],
            [
              "02",
              "Caretakers",
              "Approvals and records without the endless register.",
            ],
            [
              "03",
              "Mess vendors",
              "Plans, payments, menus and daily demand—clear.",
            ],
            [
              "04",
              "Gatekeepers",
              "Leave details that automatically keep mess in sync.",
            ],
          ].map(([n, title, text]) => (
            <div className="role" key={n}>
              <span>{n}</span>
              <div>
                <h3>{title}</h3>
                <p>{text}</p>
              </div>
              <b>↗</b>
            </div>
          ))}
        </div>
      </section>

      <section className="final">
        <p className="eyebrow light">
          <span></span> Start with what matters
        </p>
        <h2>
          Hostel life,
          <br />
          <em>opened up.</em>
        </h2>
        <p>
          Build a calmer, clearer experience for your whole hostel community.
        </p>
        <a
          className="primary-cta pale"
          href="mailto:hello@openhostel.org?subject=OpenHostel%20registration"
        >
          Register your hostel <Arrow />
        </a>
      </section>

      <footer>
        <a className="brand footer-brand" href="#top">
          <i>O</i>
          <span>OpenHostel</span>
        </a>
        <p>
          An open-source operating system
          <br />
          for college hostels.
        </p>
        <div className="foot-links">
          <a href="#how">How it works</a>
          <a href="#roles">Roles</a>
          <a href="mailto:hello@openhostel.org">Contact</a>
        </div>
        <small>© 2025 OpenHostel. Built for the community.</small>
      </footer>
    </main>
  );
}
