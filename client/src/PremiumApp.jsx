import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { BrowserRouter, Link, NavLink, Route, Routes } from "react-router-dom";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const API_URL = "http://localhost:5000/api";

const initialAuthForm = {
  name: "",
  email: "",
  password: "",
  phone: "",
  membership: "pro",
  goal: ""
};

const initialRequestForm = {
  trainerId: "",
  goal: "",
  notes: "",
  preferredTime: "Flexible"
};

const fadeUp = {
  hidden: { opacity: 0, y: 32 },
  show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] } }
};

function App() {
  return (
    <BrowserRouter>
      <AppShell />
    </BrowserRouter>
  );
}

function AppShell() {
  const [content, setContent] = useState({
    club: {},
    memberships: [],
    schedule: [],
    trainers: [],
    testimonials: [],
    dashboardStats: [],
    directions: []
  });
  const [authMode, setAuthMode] = useState("login");
  const [authForm, setAuthForm] = useState(initialAuthForm);
  const [trainerRequestForm, setTrainerRequestForm] = useState(initialRequestForm);
  const [selectedTrainer, setSelectedTrainer] = useState(null);
  const [authMessage, setAuthMessage] = useState("");
  const [trainerMessage, setTrainerMessage] = useState("");
  const [bookingMessage, setBookingMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [dashboard, setDashboard] = useState(null);
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem("alfafitness_user");
    return savedUser ? JSON.parse(savedUser) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem("alfafitness_token") || "");
  const heroRef = useRef(null);

  useEffect(() => {
    const loadContent = async () => {
      try {
        const response = await fetch(`${API_URL}/content`);
        const data = await response.json();
        setContent(data);
      } catch (error) {
        setAuthMessage("Unable to load ALFAFitness content.");
      } finally {
        setLoading(false);
      }
    };

    loadContent();
  }, []);

  useEffect(() => {
    if (!heroRef.current) return undefined;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        ".parallax-panel",
        { y: 0 },
        {
          y: -90,
          ease: "none",
          scrollTrigger: {
            trigger: ".hero",
            start: "top top",
            end: "bottom top",
            scrub: true
          }
        }
      );

      gsap.utils.toArray(".reveal").forEach((item) => {
        gsap.fromTo(
          item,
          { autoAlpha: 0, y: 40 },
          {
            autoAlpha: 1,
            y: 0,
            duration: 1,
            ease: "power3.out",
            scrollTrigger: {
              trigger: item,
              start: "top 82%"
            }
          }
        );
      });
    }, heroRef);

    return () => ctx.revert();
  }, [content]);

  useEffect(() => {
    if (!token) {
      setDashboard(null);
      return;
    }

    const syncUser = async () => {
      try {
        const [profileResponse, dashboardResponse] = await Promise.all([
          fetch(`${API_URL}/auth/me`, {
            headers: { Authorization: `Bearer ${token}` }
          }),
          fetch(`${API_URL}/member/dashboard`, {
            headers: { Authorization: `Bearer ${token}` }
          })
        ]);

        if (!profileResponse.ok || !dashboardResponse.ok) {
          throw new Error("Session expired");
        }

        const profile = await profileResponse.json();
        const dashboardData = await dashboardResponse.json();
        setUser(profile);
        setDashboard(dashboardData);
        localStorage.setItem("alfafitness_user", JSON.stringify(profile));
      } catch (error) {
        logout(false);
      }
    };

    syncUser();
  }, [token]);

  const handleAuthField = ({ target: { name, value } }) => {
    setAuthForm((current) => ({ ...current, [name]: value }));
  };

  const handleTrainerRequestField = ({ target: { name, value } }) => {
    setTrainerRequestForm((current) => ({ ...current, [name]: value }));
  };

  const handleAuthSubmit = async (event) => {
    event.preventDefault();
    setAuthMessage("");

    const endpoint = authMode === "register" ? "register" : "login";
    const payload = authMode === "register" ? authForm : { email: authForm.email, password: authForm.password };

    try {
      const response = await fetch(`${API_URL}/auth/${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Authentication failed");

      setToken(data.token);
      setUser(data.user);
      localStorage.setItem("alfafitness_token", data.token);
      localStorage.setItem("alfafitness_user", JSON.stringify(data.user));
      setAuthForm(initialAuthForm);
      setAuthMessage(authMode === "register" ? "Welcome to ALFAFitness." : "Signed in successfully.");
    } catch (error) {
      setAuthMessage(error.message);
    }
  };

  const createBooking = async (scheduleId) => {
    if (!token) {
      setBookingMessage("Sign in to reserve a class.");
      return;
    }

    try {
      const response = await fetch(`${API_URL}/member/bookings`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ scheduleId })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Booking failed");
      setBookingMessage("Class reserved.");
      refreshDashboard(token);
    } catch (error) {
      setBookingMessage(error.message);
    }
  };

  const createSubscription = async (membershipId) => {
    if (!token) {
      setAuthMessage("Create an account to activate a membership.");
      return;
    }

    try {
      const response = await fetch(`${API_URL}/member/subscriptions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ membershipId })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Subscription failed");
      setAuthMessage(`Membership upgraded to ${membershipId}.`);
      refreshDashboard(token);
    } catch (error) {
      setAuthMessage(error.message);
    }
  };

  const submitTrainerRequest = async (event) => {
    event.preventDefault();
    if (!token) {
      setTrainerMessage("Sign in to request a trainer.");
      return;
    }

    try {
      const response = await fetch(`${API_URL}/member/trainer-requests`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(trainerRequestForm)
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Request failed");
      setTrainerMessage("Trainer request sent.");
      setTrainerRequestForm(initialRequestForm);
      refreshDashboard(token);
    } catch (error) {
      setTrainerMessage(error.message);
    }
  };

  const refreshDashboard = async (sessionToken) => {
    const response = await fetch(`${API_URL}/member/dashboard`, {
      headers: { Authorization: `Bearer ${sessionToken}` }
    });

    if (!response.ok) return;
    const data = await response.json();
    setDashboard(data);
  };

  const logout = (announce = true) => {
    setToken("");
    setUser(null);
    setDashboard(null);
    localStorage.removeItem("alfafitness_token");
    localStorage.removeItem("alfafitness_user");
    if (announce) setAuthMessage("Signed out.");
  };

  const metrics = useMemo(
    () => content.dashboardStats.length
      ? content.dashboardStats
      : [
          { label: "Active athletes", value: "1.8K" },
          { label: "Weekly classes", value: "42" },
          { label: "Private sessions", value: "310" },
          { label: "Member rating", value: "4.9/5" }
        ],
    [content.dashboardStats]
  );

  return (
    <div className="site-shell" ref={heroRef}>
      <BackgroundOrbs />
      <Header user={user} />
      {loading ? (
        <LoadingScreen />
      ) : (
        <>
          <AnimatePresence mode="wait">
            <Routes>
              <Route path="/" element={<PageFrame><HomePage content={content} metrics={metrics} onSubscribe={createSubscription} onSelectTrainer={setSelectedTrainer} onBook={createBooking} /></PageFrame>} />
              <Route path="/pricing" element={<PageFrame><PricingPage memberships={content.memberships} onSubscribe={createSubscription} /></PageFrame>} />
              <Route path="/trainers" element={<PageFrame><TrainersPage trainers={content.trainers} onSelectTrainer={setSelectedTrainer} /></PageFrame>} />
              <Route path="/schedule" element={<PageFrame><SchedulePage schedule={content.schedule} onBook={createBooking} bookingMessage={bookingMessage} /></PageFrame>} />
              <Route path="/auth" element={<PageFrame><AuthPage authMode={authMode} setAuthMode={setAuthMode} authForm={authForm} handleAuthField={handleAuthField} handleAuthSubmit={handleAuthSubmit} authMessage={authMessage} /></PageFrame>} />
              <Route path="/dashboard" element={<PageFrame><DashboardPage user={user} dashboard={dashboard} logout={logout} trainerRequestForm={trainerRequestForm} handleTrainerRequestField={handleTrainerRequestField} submitTrainerRequest={submitTrainerRequest} trainerMessage={trainerMessage} trainers={content.trainers} /></PageFrame>} />
            </Routes>
          </AnimatePresence>
          <Footer club={content.club} />
          <TrainerModal trainer={selectedTrainer} onClose={() => setSelectedTrainer(null)} />
        </>
      )}
    </div>
  );
}

function Header({ user }) {
  return (
    <header className="navbar-shell">
      <div className="navbar-inner">
        <Link className="brand" to="/">ALFA<span>Fitness</span></Link>
        <nav className="nav-links">
          <NavLink to="/">Home</NavLink>
          <NavLink to="/pricing">Pricing</NavLink>
          <NavLink to="/trainers">Trainers</NavLink>
          <NavLink to="/schedule">Schedule</NavLink>
        </nav>
        <div className="nav-actions">
          <NavLink className="ghost-link" to="/dashboard">{user ? "Dashboard" : "Profile"}</NavLink>
          <NavLink className="cta-link" to="/auth">{user ? "Member Access" : "Join ALFAFitness"}</NavLink>
        </div>
      </div>
    </header>
  );
}

function PageFrame({ children }) {
  return (
    <motion.div className="page-shell" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }} transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}>
      {children}
    </motion.div>
  );
}

function HomePage({ content, metrics, onSubscribe, onSelectTrainer, onBook }) {
  const heroVideo = "https://cdn.coverr.co/videos/coverr-boxer-training-in-the-gym-1566668733107?download=1080p";

  return (
    <>
      <section className="hero reveal">
        <video className="hero-video" autoPlay muted loop playsInline poster="/hero-bg.png">
          <source src={heroVideo} type="video/mp4" />
        </video>
        <div className="hero-overlay" />
        <div className="hero-grid">
          <motion.div className="hero-copy" initial="hidden" animate="show" variants={fadeUp}>
            <p className="eyebrow">{content.club.tagline}</p>
            <h1>{content.club.heroHeadline}</h1>
            <p className="hero-text">{content.club.heroSubtitle}</p>
            <div className="hero-actions">
              <Link className="primary-button" to="/auth">Join ALFAFitness</Link>
              <Link className="secondary-button" to="/schedule">View Schedule</Link>
            </div>
          </motion.div>
          <motion.div className="glass-card parallax-panel hero-panel" initial="hidden" animate="show" variants={fadeUp}>
            <p className="panel-label">Performance club</p>
            <h2>Boxing. Karate. Gym. Recovery.</h2>
            <p>Apple-caliber polish, Tesla-grade confidence, and startup-level momentum in one cinematic training system.</p>
            <div className="tag-row">
              {content.directions.map((item) => <span key={item}>{item}</span>)}
            </div>
          </motion.div>
        </div>
      </section>

      <section className="metrics reveal">
        {metrics.map((item) => (
          <div className="metric-card glass-card" key={item.label}>
            <strong>{item.value}</strong>
            <span>{item.label}</span>
          </div>
        ))}
      </section>

      <section className="content-section reveal">
        <SectionHeader overline="Why ALFA" title="A premium startup product, reimagined as a fitness destination." />
        <div className="feature-grid">
          {[
            ["Cinematic environment", "Neon-lit spaces, premium acoustics, and a controlled visual atmosphere built for focus."],
            ["Smooth member flow", "Fast onboarding, one-tap booking, concierge-style trainer requests, and a calm dashboard."],
            ["Results-first programming", "Structured boxing, karate, and strength blocks that feel intentional from first session to renewal."]
          ].map(([title, text]) => (
            <article className="glass-card feature-card" key={title}>
              <h3>{title}</h3>
              <p>{text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="content-section reveal">
        <SectionHeader overline="Subscriptions" title="Choose the tempo that matches your ambition." />
        <div className="pricing-grid">
          {content.memberships.map((plan) => (
            <motion.article className={`glass-card pricing-card ${plan.accent}`} key={plan.id} whileHover={{ y: -10, scale: 1.01 }}>
              <div className="card-topline">
                <span>{plan.highlight}</span>
                <p>{plan.title}</p>
              </div>
              <h3>{plan.price}<small>{plan.period}</small></h3>
              <p>{plan.description}</p>
              <ul>
                {plan.features.map((feature) => <li key={feature}>{feature}</li>)}
              </ul>
              <button className="primary-button" onClick={() => onSubscribe(plan.id)}>Activate plan</button>
            </motion.article>
          ))}
        </div>
      </section>

      <section className="content-section reveal">
        <SectionHeader overline="Coaches" title="Meet the trainers behind the discipline." />
        <div className="trainer-grid">
          {content.trainers.map((trainer) => (
            <motion.article className="trainer-card glass-card" key={trainer.id} whileHover={{ y: -8 }}>
              <img src={trainer.image} alt={trainer.name} loading="lazy" />
              <div className="trainer-content">
                <p>{trainer.specialty}</p>
                <h3>{trainer.name}</h3>
                <span>{trainer.experience}</span>
                <button className="secondary-button" onClick={() => onSelectTrainer(trainer)}>View profile</button>
              </div>
            </motion.article>
          ))}
        </div>
      </section>

      <section className="content-section reveal">
        <SectionHeader overline="Testimonials" title="Loved by founders, operators, and athletes." />
        <div className="testimonial-grid">
          {content.testimonials.map((item) => (
            <article className="glass-card testimonial-card" key={item.id}>
              <p className="quote">“{item.quote}”</p>
              <strong>{item.name}</strong>
              <span>{item.role}</span>
            </article>
          ))}
        </div>
      </section>

      <section className="content-section reveal split-layout">
        <div>
          <SectionHeader overline="Weekly flow" title="Book the next session in seconds." />
          <p className="section-copy">Reserve boxing, karate, or gym classes directly from the schedule and keep your week in motion.</p>
        </div>
        <div className="schedule-preview glass-card">
          {content.schedule.slice(0, 4).map((item) => (
            <div className="schedule-row" key={item.id}>
              <div>
                <strong>{item.className}</strong>
                <span>{item.day} • {item.time}</span>
              </div>
              <button className="mini-button" onClick={() => onBook(item.id)}>Book</button>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}

function PricingPage({ memberships, onSubscribe }) {
  return (
    <section className="page-section reveal">
      <SectionHeader overline="Pricing" title="Memberships designed like product tiers, not generic gym packages." />
      <div className="pricing-grid">
        {memberships.map((plan) => (
          <motion.article className={`glass-card pricing-card tall ${plan.accent}`} key={plan.id} whileHover={{ y: -10, scale: 1.01 }}>
            <div className="card-topline">
              <span>{plan.highlight}</span>
              <p>{plan.title}</p>
            </div>
            <h3>{plan.price}<small>{plan.period}</small></h3>
            <p>{plan.description}</p>
            <ul>
              {plan.features.map((feature) => <li key={feature}>{feature}</li>)}
            </ul>
            <button className="primary-button" onClick={() => onSubscribe(plan.id)}>Choose {plan.title}</button>
          </motion.article>
        ))}
      </div>
    </section>
  );
}

function TrainersPage({ trainers, onSelectTrainer }) {
  return (
    <section className="page-section reveal">
      <SectionHeader overline="Trainers" title="Elite combat and performance coaches with modern systems thinking." />
      <div className="trainer-grid">
        {trainers.map((trainer) => (
          <motion.article className="trainer-card glass-card" key={trainer.id} whileHover={{ y: -8 }}>
            <img src={trainer.image} alt={trainer.name} loading="lazy" />
            <div className="trainer-content">
              <p>{trainer.specialty}</p>
              <h3>{trainer.name}</h3>
              <span>{trainer.experience}</span>
              <button className="secondary-button" onClick={() => onSelectTrainer(trainer)}>Open details</button>
            </div>
          </motion.article>
        ))}
      </div>
    </section>
  );
}

function SchedulePage({ schedule, onBook, bookingMessage }) {
  return (
    <section className="page-section reveal">
      <SectionHeader overline="Schedule" title="An interactive weekly timetable for boxing, karate, and gym sessions." />
      <div className="glass-card timetable">
        <div className="timetable-header">
          <span>Reserve your place</span>
          {bookingMessage && <p>{bookingMessage}</p>}
        </div>
        <div className="timetable-list">
          {schedule.map((item) => (
            <div className="timetable-row" key={item.id}>
              <div>
                <strong>{item.className}</strong>
                <span>{item.category} • {item.level}</span>
              </div>
              <div>
                <strong>{item.day}</strong>
                <span>{item.time} • {item.trainer}</span>
              </div>
              <div>
                <strong>{item.spots} spots</strong>
                <button className="mini-button" onClick={() => onBook(item.id)}>Book</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function AuthPage({ authMode, setAuthMode, authForm, handleAuthField, handleAuthSubmit, authMessage }) {
  return (
    <section className="page-section auth-layout reveal">
      <div>
        <SectionHeader overline="Member access" title="Modern login and registration with a premium dark UI." />
        <p className="section-copy">Secure JWT auth, bcrypt password hashing, and a smooth onboarding flow ready for MERN expansion.</p>
      </div>
      <div className="glass-card auth-panel">
        <div className="pill-switch">
          <button className={authMode === "login" ? "active" : ""} onClick={() => setAuthMode("login")}>Login</button>
          <button className={authMode === "register" ? "active" : ""} onClick={() => setAuthMode("register")}>Register</button>
        </div>
        <form className="auth-form" onSubmit={handleAuthSubmit}>
          {authMode === "register" && (
            <>
              <input name="name" value={authForm.name} onChange={handleAuthField} placeholder="Full name" required />
              <input name="phone" value={authForm.phone} onChange={handleAuthField} placeholder="Phone" />
              <select name="membership" value={authForm.membership} onChange={handleAuthField}>
                <option value="starter">Starter</option>
                <option value="pro">Pro</option>
                <option value="elite">Elite</option>
              </select>
              <textarea name="goal" value={authForm.goal} onChange={handleAuthField} placeholder="Training goal" rows="3" />
            </>
          )}
          <input type="email" name="email" value={authForm.email} onChange={handleAuthField} placeholder="Email" required />
          <input type="password" name="password" value={authForm.password} onChange={handleAuthField} placeholder="Password" required />
          <button className="primary-button" type="submit">{authMode === "register" ? "Create account" : "Login"}</button>
        </form>
        {authMessage && <p className="status-line">{authMessage}</p>}
      </div>
    </section>
  );
}

function DashboardPage({ user, dashboard, logout, trainerRequestForm, handleTrainerRequestField, submitTrainerRequest, trainerMessage, trainers }) {
  if (!user) {
    return (
      <section className="page-section reveal">
        <SectionHeader overline="Dashboard" title="Sign in to view your bookings, subscription, and trainer requests." />
        <Link className="primary-button inline" to="/auth">Go to member access</Link>
      </section>
    );
  }

  return (
    <section className="page-section reveal">
      <SectionHeader overline="Dashboard" title={`Welcome back, ${user.name}.`} />
      <div className="dashboard-grid">
        <article className="glass-card dashboard-card">
          <p className="panel-label">Profile</p>
          <h3>{user.email}</h3>
          <span>{user.goal || "Build strength and discipline"}</span>
          <ul className="detail-list">
            <li>Membership: {user.membership}</li>
            <li>Status: {user.subscriptionStatus || "inactive"}</li>
            <li>Phone: {user.phone || "Not added"}</li>
          </ul>
          <button className="secondary-button" onClick={() => logout()}>Logout</button>
        </article>

        <article className="glass-card dashboard-card">
          <p className="panel-label">Subscriptions</p>
          {dashboard?.subscriptions?.length ? dashboard.subscriptions.map((item) => (
            <div className="stack-item" key={item._id}>
              <strong>{item.membership}</strong>
              <span>{item.price} • renews {new Date(item.renewalDate).toLocaleDateString()}</span>
            </div>
          )) : <p className="section-copy">No active subscription records yet.</p>}
        </article>

        <article className="glass-card dashboard-card">
          <p className="panel-label">Bookings</p>
          {dashboard?.bookings?.length ? dashboard.bookings.map((item) => (
            <div className="stack-item" key={item._id}>
              <strong>{item.className}</strong>
              <span>{item.day} • {item.time} • {item.trainer}</span>
            </div>
          )) : <p className="section-copy">Your next training block is ready to be booked.</p>}
        </article>

        <article className="glass-card dashboard-card wide">
          <p className="panel-label">Personal trainer request</p>
          <form className="auth-form compact" onSubmit={submitTrainerRequest}>
            <select name="trainerId" value={trainerRequestForm.trainerId} onChange={handleTrainerRequestField} required>
              <option value="">Select a trainer</option>
              {trainers.map((trainer) => <option key={trainer.id} value={trainer.id}>{trainer.name}</option>)}
            </select>
            <input name="goal" value={trainerRequestForm.goal} onChange={handleTrainerRequestField} placeholder="Primary goal" required />
            <input name="preferredTime" value={trainerRequestForm.preferredTime} onChange={handleTrainerRequestField} placeholder="Preferred time" />
            <textarea name="notes" value={trainerRequestForm.notes} onChange={handleTrainerRequestField} rows="3" placeholder="Anything your coach should know?" />
            <button className="primary-button" type="submit">Request trainer</button>
          </form>
          {trainerMessage && <p className="status-line">{trainerMessage}</p>}
        </article>
      </div>
    </section>
  );
}

function TrainerModal({ trainer, onClose }) {
  return (
    <AnimatePresence>
      {trainer ? (
        <motion.div className="modal-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <motion.div className="modal-card glass-card" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 30 }}>
            <button className="modal-close" onClick={onClose}>Close</button>
            <img src={trainer.image} alt={trainer.name} loading="lazy" />
            <p className="panel-label">{trainer.specialty}</p>
            <h3>{trainer.name}</h3>
            <span>{trainer.experience}</span>
            <p>{trainer.description}</p>
            <ul className="detail-list">
              {trainer.achievements.map((item) => <li key={item}>{item}</li>)}
            </ul>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

function Footer({ club }) {
  return (
    <footer className="footer">
      <div>
        <Link className="brand" to="/">ALFA<span>Fitness</span></Link>
        <p>{club.address}</p>
      </div>
      <div>
        <p>{club.phone}</p>
        <p>{club.hours}</p>
      </div>
    </footer>
  );
}

function SectionHeader({ overline, title }) {
  return (
    <div className="section-heading">
      <p className="eyebrow">{overline}</p>
      <h2>{title}</h2>
    </div>
  );
}

function BackgroundOrbs() {
  return (
    <div className="background-orbs" aria-hidden="true">
      <span className="orb orb-red" />
      <span className="orb orb-green" />
      <span className="grid-overlay" />
    </div>
  );
}

function LoadingScreen() {
  return (
    <div className="loading-screen">
      <motion.div className="loading-mark" animate={{ opacity: [0.3, 1, 0.3], scale: [0.98, 1.02, 0.98] }} transition={{ duration: 1.8, repeat: Infinity }}>
        ALFA<span>Fitness</span>
      </motion.div>
    </div>
  );
}

export default App;
