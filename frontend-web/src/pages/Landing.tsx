import { useEffect, useLayoutEffect, useRef, useState } from "react";
import {
  ArrowRight,
  Check,
  LockKey,
  Microphone,
  ShieldCheck,
  Waveform,
} from "@phosphor-icons/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Link } from "react-router-dom";
import Brand from "../components/Brand";
import KineticGrid from "../components/KineticGrid";
import { useAuthStore } from "../store/auth";

gsap.registerPlugin(ScrollTrigger);

const principles = [
  "Hindi, Marathi, and English",
  "Permission-aware actions",
  "Resident privacy",
  "Committee oversight",
  "Audited decisions",
  "Manual fallback",
];

export default function Landing() {
  const root = useRef<HTMLElement>(null);
  const token = useAuthStore((state) => state.accessToken);
  const [navigationRaised, setNavigationRaised] = useState(false);
  useEffect(() => {
    const updateNavigation = () => setNavigationRaised(window.scrollY > 42);
    updateNavigation();
    window.addEventListener("scroll", updateNavigation, { passive: true });
    return () => window.removeEventListener("scroll", updateNavigation);
  }, []);
  useLayoutEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const context = gsap.context(() => {
      gsap.matchMedia().add("(min-width: 761px)", () => {
        gsap.from(".hero-reveal", {
          y: 42,
          opacity: 0,
          duration: 0.9,
          stagger: 0.09,
          ease: "power3.out",
        });
      });
      gsap.utils
        .toArray<HTMLElement>(".capability-panel")
        .forEach((panel) =>
          gsap.fromTo(
            panel,
            { y: 70, scale: 0.94, opacity: 0.4 },
            {
              y: 0,
              scale: 1,
              opacity: 1,
              ease: "none",
              scrollTrigger: {
                trigger: panel,
                start: "top 88%",
                end: "top 35%",
                scrub: true,
              },
            },
          ),
        );
      const words = gsap.utils.toArray<HTMLElement>(".trust-statement span");
      gsap.fromTo(
        words,
        { opacity: 0.12 },
        {
          opacity: 1,
          stagger: 0.08,
          scrollTrigger: {
            trigger: ".trust-statement",
            start: "top 76%",
            end: "bottom 44%",
            scrub: true,
          },
        },
      );
    }, root);
    return () => context.revert();
  }, []);

  return (
    <main className="landing" ref={root}>
      <nav className={`landing-nav ${navigationRaised ? "raised" : "over-hero"}`} aria-label="Public navigation">
        <Brand />
        <div className="landing-nav-links">
          <a href="#capabilities">Capabilities</a>
          <a href="#trust">Trust</a>
          <a href="#access">Access</a>
        </div>
        <div className="landing-actions">
          <Link className="button ghost small" to="/login">
            Sign in
          </Link>
          <Link className="button small" to={token ? "/home" : "/register"}>
            {token ? "Open dashboard" : "Request access"}
            <ArrowRight size={16} />
          </Link>
        </div>
      </nav>
      <KineticGrid className="landing-hero">
        <div className="hero-copy">
          <p className="hero-kicker hero-reveal">
            Society work, understood in your language
          </p>
          <h1 className="hero-reveal">
            <span>Say what needs doing.</span> <em>Panchayat handles the path.</em>
          </h1>
          <p className="hero-reveal">
            A voice-first community operating system for complaints,
            maintenance, visitors, and official updates—with every action
            visible and under your control.
          </p>
          <div className="hero-ctas hero-reveal">
            <Link
              className="button hero-primary"
              to={token ? "/home" : "/login"}
            >
              {token ? "Open your workspace" : "Try the resident demo"}
              <ArrowRight size={18} />
            </Link>
            <Link className="button hero-ghost" to="/register">
              Request society access
            </Link>
          </div>
        </div>
      </KineticGrid>

      <div className="trust-row" aria-label="Product principles">
        <div className="trust-track">
          {[...principles, ...principles].map((item, index) => (
            <span key={`${item}-${index}`}>{item}</span>
          ))}
        </div>
      </div>

      <section className="landing-section" id="capabilities">
        <header className="section-heading">
          <h2>
            One quiet interface. <em>Everyday work, finally connected.</em>
          </h2>
          <p>
            The assistant uses the same secure workflows as the manual screens.
            It simply removes the need to know which form, field, or menu comes
            next.
          </p>
        </header>
        <div className="capability-grid">
          <article className="capability-panel capability-voice">
            <div className="capability-symbol">
              <Microphone size={38} weight="duotone" />
            </div>
            <div>
              <h3>
                Speak naturally.
                <br />
                Get a real action.
              </h3>
              <p>
                Describe the task in Hindi, Marathi, or English. The system
                detects your language, gathers only what is missing, and asks
                before writing data.
              </p>
            </div>
            <ul className="capability-list">
              <li>
                <Check />
                Automatic language detection
              </li>
              <li>
                <Check />
                Typed or spoken requests
              </li>
              <li>
                <Check />
                Readable audio replies
              </li>
            </ul>
          </article>
          <article className="capability-panel capability-control">
            <div className="capability-symbol">
              <ShieldCheck size={38} weight="duotone" />
            </div>
            <h3>Your role decides what AI can do.</h3>
            <p>
              Residents, committee members, administrators, and security keep
              the exact permissions they have in the manual product.
            </p>
            <div className="role-lines">
              <span>
                Resident <i>personal services</i>
              </span>
              <span>
                Committee <i>service decisions</i>
              </span>
              <span>
                Admin <i>billing and audit</i>
              </span>
            </div>
          </article>
          <article className="capability-panel capability-service">
            <h3>Complaint</h3>
            <p>Private reporting and progress tracking.</p>
            <span>01</span>
          </article>
          <article className="capability-panel capability-service">
            <h3>Maintenance</h3>
            <p>Clear monthly dues and receipts.</p>
            <span>02</span>
          </article>
          <article className="capability-panel capability-service">
            <h3>Visitor</h3>
            <p>Gate requests with approval trails.</p>
            <span>03</span>
          </article>
        </div>
      </section>

      <section className="trust-story" id="trust">
        <div className="trust-statement">
          {"Helpful enough to act. Disciplined enough to ask. Accountable enough to trust."
            .split(" ")
            .map((word, index) => (
              <span key={`${word}-${index}`}>{word} </span>
            ))}
        </div>
        <div className="trust-details">
          <article>
            <LockKey size={24} />
            <h3>It stays in society scope.</h3>
            <p>
              Requests outside community services are declined instead of
              quietly becoming general-purpose AI.
            </p>
          </article>
          <article>
            <ShieldCheck size={24} />
            <h3>It respects who is asking.</h3>
            <p>
              Every tool call inherits account permissions, society boundaries,
              and explicit confirmation.
            </p>
          </article>
          <article>
            <Waveform size={24} />
            <h3>It remains usable without AI.</h3>
            <p>
              Every service has a clear manual route for confidence,
              accessibility, and continuity.
            </p>
          </article>
        </div>
      </section>

      <section className="landing-cta" id="access">
        <Brand inverse />
        <h2>Let your society run on conversation, not confusion.</h2>
        <div className="hero-ctas">
          <Link className="button hero-primary" to="/register">
            Request access
            <ArrowRight size={18} />
          </Link>
          <Link className="button hero-ghost" to="/login">
            Sign in to demo
          </Link>
        </div>
      </section>
      <footer className="landing-footer">
        <span>Panchayat AI</span>
        <span>Voice-first society services with manual control.</span>
        <span>Prototype 2026</span>
      </footer>
    </main>
  );
}
