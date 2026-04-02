import { useEffect, useMemo, useState } from "react";
import { Link, Navigate, Route, Routes, useLocation, useNavigate, useParams } from "react-router-dom";

const API_URL = "http://localhost:5000/api";
const AUTH_TOAST = "Authentication Required. Please login to book a class.";
const scheduleFilters = ["ALL", "БОКС", "КАРАТЕ", "СИЛОВАЯ ЛАБОРАТОРИЯ", "HIIT", "ЙОГА"];
const premiumMembershipMeta = {
  starter: { title: "НАЧИНАЮЩИЙ", price: "$29.99" },
  pro: { title: "ПРО", price: "$59.99" },
  elite: { title: "ЭЛИТНЫЙ", price: "$99.99" }
};
const premiumTrainerPresets = [
  {
    name: "MARCUS SILVA",
    discipline: "Boxing & MMA",
    availability: [
      { day: "ПОНЕДЕЛЬНИК", slots: ["18:00 - 20:00"] },
      { day: "СРЕДА", slots: ["18:00 - 20:00"] },
      { day: "ПЯТНИЦА", slots: ["18:00 - 20:00"] }
    ]
  },
  {
    name: "KEIKO TANAKA",
    discipline: "Karate & Martial Arts",
    availability: [
      { day: "ВТОРНИК", slots: ["17:00 - 19:00"] },
      { day: "ЧЕТВЕРГ", slots: ["17:00 - 19:00"] },
      { day: "СУББОТА", slots: ["12:00 - 14:00"] }
    ]
  },
  {
    name: "ALEX ROWE",
    discipline: "Strength & Conditioning",
    availability: [
      { day: "ПОНЕДЕЛЬНИК", slots: ["07:00 - 09:00"] },
      { day: "ЧЕТВЕРГ", slots: ["19:00 - 21:00"] },
      { day: "ВОСКРЕСЕНЬЕ", slots: ["10:00 - 12:00"] }
    ]
  }
];
const initialRegisterForm = { name: "", email: "", password: "", phone: "", membership: "", goal: "" };
const initialLoginForm = { email: "", password: "" };
const initialForgotForm = { email: "" };
const initialRequestForm = { trainerId: "", preferredDay: "", preferredTime: "", notes: "" };

export default function PremiumSiteApp() {
  const [content, setContent] = useState({ club: {}, memberships: [], schedule: [], trainers: [], dashboardStats: [] });
  const [registerForm, setRegisterForm] = useState(initialRegisterForm);
  const [loginForm, setLoginForm] = useState(initialLoginForm);
  const [forgotForm, setForgotForm] = useState(initialForgotForm);
  const [requestForm, setRequestForm] = useState(initialRequestForm);
  const [dashboard, setDashboard] = useState(null);
  const [activeFilter, setActiveFilter] = useState("ALL");
  const [authTab, setAuthTab] = useState("login");
  const [authMessage, setAuthMessage] = useState("");
  const [forgotMessage, setForgotMessage] = useState("");
  const [membershipMessage, setMembershipMessage] = useState("");
  const [requestMessage, setRequestMessage] = useState("");
  const [toast, setToast] = useState("");
  const [selectedTrainer, setSelectedTrainer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [navScrolled, setNavScrolled] = useState(false);
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem("alfafitness_user");
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem("alfafitness_token") || "");
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const loadContent = async () => {
      try {
        const response = await fetch(`${API_URL}/content`);
        const data = await response.json();
        const trainers = buildPremiumTrainers(data.trainers || []);
        setContent({
          ...data,
          memberships: buildPremiumPlans(data.memberships || []),
          trainers,
          schedule: buildPremiumSchedule(data.schedule || [], trainers)
        });
      } catch {
        setAuthMessage("Unable to load ALFA FITNESS data.");
      } finally {
        setLoading(false);
      }
    };

    loadContent();
  }, []);

  useEffect(() => {
    if (!token) {
      setDashboard(null);
      return;
    }

    const syncProfile = async () => {
      try {
        const [profileResponse, dashboardResponse] = await Promise.all([
          fetch(`${API_URL}/auth/me`, { headers: { Authorization: `Bearer ${token}` } }),
          fetch(`${API_URL}/member/dashboard`, { headers: { Authorization: `Bearer ${token}` } })
        ]);

        if (!profileResponse.ok || !dashboardResponse.ok) throw new Error();

        const profile = await profileResponse.json();
        const dashboardData = await dashboardResponse.json();
        setUser(profile);
        setDashboard(dashboardData);
        localStorage.setItem("alfafitness_user", JSON.stringify(profile));
      } catch {
        handleLogout(false);
      }
    };

    syncProfile();
  }, [token]);

  useEffect(() => {
    const onScroll = () => setNavScrolled(window.scrollY > 16);
    onScroll();
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (location.pathname === "/register") setAuthTab("register");
    if (location.pathname === "/login") setAuthTab("login");
  }, [location.pathname]);

  useEffect(() => {
    document.documentElement.classList.add("reveal-ready");
    const nodes = document.querySelectorAll("[data-reveal]");
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("revealed");
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -60px 0px" });

    nodes.forEach((node) => observer.observe(node));
    return () => {
      observer.disconnect();
      document.documentElement.classList.remove("reveal-ready");
    };
  }, [location.pathname, content, dashboard, user, activeFilter]);

  useEffect(() => {
    if (!toast) return undefined;
    const timeoutId = window.setTimeout(() => setToast(""), 2800);
    return () => window.clearTimeout(timeoutId);
  }, [toast]);

  const updateForm = (setter) => ({ target: { name, value } }) => setter((current) => {
    if (name === "preferredDay") {
      return { ...current, preferredDay: value, preferredTime: "" };
    }
    return { ...current, [name]: value };
  });

  const persistSession = (data) => {
    setToken(data.token);
    setUser(data.user);
    localStorage.setItem("alfafitness_token", data.token);
    localStorage.setItem("alfafitness_user", JSON.stringify(data.user));
  };

  const refreshDashboard = async (sessionToken) => {
    const response = await fetch(`${API_URL}/member/dashboard`, {
      headers: { Authorization: `Bearer ${sessionToken}` }
    });
    if (!response.ok) return;
    setDashboard(await response.json());
  };

  const handleLogout = (announce = true) => {
    setToken("");
    setUser(null);
    setDashboard(null);
    localStorage.removeItem("alfafitness_token");
    localStorage.removeItem("alfafitness_user");
    if (announce) setToast("Session closed.");
    navigate("/");
  };

  const handleAuthSubmit = async (event) => {
    event.preventDefault();
    setAuthMessage("");
    const isRegister = authTab === "register";
    const payload = isRegister
      ? { ...registerForm, email: registerForm.email.trim().toLowerCase(), password: registerForm.password.trim(), name: registerForm.name.trim(), phone: registerForm.phone.trim() }
      : { ...loginForm, email: loginForm.email.trim().toLowerCase(), password: loginForm.password.trim() };

    try {
      const response = await fetch(`${API_URL}/auth/${isRegister ? "register" : "login"}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Authentication failed");
      persistSession(data);
      setRegisterForm(initialRegisterForm);
      setLoginForm(initialLoginForm);
      navigate("/profile");
    } catch (error) {
      if (isRegister && /already registered|already exists|login instead/i.test(error.message)) {
        setAuthTab("login");
      }
      setAuthMessage(error.message);
    }
  };

  const handleForgotSubmit = async (event) => {
    event.preventDefault();
    setForgotMessage("");

    try {
      const response = await fetch(`${API_URL}/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(forgotForm)
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Password reset request failed");
      setForgotMessage(data.message);
      setForgotForm(initialForgotForm);
    } catch (error) {
      setForgotMessage(error.message);
    }
  };

  const handleResetSubmit = async (password, confirmPassword, resetToken) => {
    if (password !== confirmPassword) throw new Error("Passwords do not match.");

    const response = await fetch(`${API_URL}/auth/reset-password/${resetToken}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password })
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || "Password reset failed");
    return data.message;
  };

  const handleSubscribe = async (membershipId) => {
    setMembershipMessage("");

    if (!token) {
      navigate("/register");
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
      setMembershipMessage("Membership activated.");
      refreshDashboard(token);
      navigate("/profile");
    } catch (error) {
      setMembershipMessage(error.message);
    }
  };

  const handleBooking = async (scheduleId) => {
    if (!token) {
      setToast(AUTH_TOAST);
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
      setToast("Class reserved.");
      refreshDashboard(token);
    } catch (error) {
      setToast(error.message);
    }
  };

  const handleRequestSubmit = async (event) => {
    event.preventDefault();
    setRequestMessage("");

    if (!token || !selectedTrainer) {
      setToast(AUTH_TOAST);
      return;
    }

    try {
      const response = await fetch(`${API_URL}/member/trainer-requests`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          trainerId: selectedTrainer.id,
          goal: selectedTrainer.discipline,
          preferredTime: `${requestForm.preferredDay} • ${requestForm.preferredTime}`,
          notes: requestForm.notes
        })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Request failed");
      setRequestMessage("Request sent.");
      setRequestForm(initialRequestForm);
      setSelectedTrainer(null);
      refreshDashboard(token);
      setToast("Trainer request sent.");
    } catch (error) {
      setRequestMessage(error.message);
    }
  };

  const filteredSchedule = useMemo(() => {
    if (activeFilter === "ALL") return content.schedule;
    return content.schedule.filter((item) => item.filterTag === activeFilter);
  }, [activeFilter, content.schedule]);

  const dashboardCards = useMemo(() => buildDashboardCards(user, dashboard, content.trainers), [content.trainers, dashboard, user]);

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-mark">
          <span className="brand-white">ALFA</span>
          <span className="brand-red">FITNESS</span>
        </div>
      </div>
    );
  }

  return (
    <div className="site-shell">
      <BackgroundEffects />
      <Navbar user={user} navScrolled={navScrolled} />
      <Routes>
        <Route
          path="/"
          element={
            <>
              <HomePage
                content={content}
                filteredSchedule={filteredSchedule}
                activeFilter={activeFilter}
                setActiveFilter={setActiveFilter}
                membershipMessage={membershipMessage}
                onSubscribe={handleSubscribe}
                onBooking={handleBooking}
                onSelectTrainer={(trainer) => {
                  setSelectedTrainer(trainer);
                  setRequestForm((current) => ({ ...current, trainerId: trainer.id }));
                }}
              />
              <Footer club={content.club} />
            </>
          }
        />
        <Route
          path="/login"
          element={
            <>
              <AuthPage
                authTab={authTab}
                setAuthTab={setAuthTab}
                authMessage={authMessage}
                forgotMessage={forgotMessage}
                loginForm={loginForm}
                registerForm={registerForm}
                updateLoginField={updateForm(setLoginForm)}
                updateRegisterField={updateForm(setRegisterForm)}
                forgotForm={forgotForm}
                updateForgotField={updateForm(setForgotForm)}
                onAuthSubmit={handleAuthSubmit}
                onForgotSubmit={handleForgotSubmit}
              />
              <Footer club={content.club} />
            </>
          }
        />
        <Route path="/register" element={<Navigate to="/login" replace />} />
        <Route path="/reset-password/:token" element={<ResetPage onResetSubmit={handleResetSubmit} club={content.club} />} />
        <Route path="/profile" element={user ? <DashboardPage user={user} dashboardCards={dashboardCards} onLogout={handleLogout} club={content.club} /> : <Navigate to="/login" replace />} />
      </Routes>

      {selectedTrainer ? (
        <RequestModal
          trainer={selectedTrainer}
          requestForm={requestForm}
          updateRequestField={updateForm(setRequestForm)}
          onClose={() => {
            setSelectedTrainer(null);
            setRequestMessage("");
          }}
          onSubmit={handleRequestSubmit}
          requestMessage={requestMessage}
        />
      ) : null}

      {toast ? <div className="toast-banner">{toast}</div> : null}
    </div>
  );
}

function Navbar({ user, navScrolled }) {
  const navItems = [
    { label: "HOME", href: "#home" },
    { label: "PRICING", href: "#pricing" },
    { label: "TRAINERS", href: "#trainers" },
    { label: "SCHEDULE", href: "#schedule" }
  ];

  return (
    <header className={`site-header ${navScrolled ? "is-scrolled" : ""}`}>
      <div className="nav-shell">
        <Link className="brand-mark" to="/">
          <span className="brand-white">ALFA</span>
          <span className="brand-red">FITNESS</span>
        </Link>
        <nav className="nav-center">
          {navItems.map((item) => <a key={item.label} href={`/${item.href}`}>{item.label}</a>)}
        </nav>
        <div className="nav-actions">
          <Link className="button-outline join-button" to={user ? "/profile" : "/login"}>
            {user ? "PROFILE" : "JOIN NOW"}
          </Link>
        </div>
      </div>
    </header>
  );
}

function HomePage({ content, filteredSchedule, activeFilter, setActiveFilter, membershipMessage, onSubscribe, onBooking, onSelectTrainer }) {
  const features = [
    { icon: "01", title: "ЭЛИТНЫЕ ТРЕНЕРЫ", text: "Тренеры мирового уровня, сочетающие техническую точность, дисциплину и ответственность." },
    { icon: "02", title: "ВЫСОКАЯ ИНТЕНСИВНОСТЬ", text: "Бокс, боевые искусства, функциональные тренировки и занятия на результат, созданные для максимальной отдачи." },
    { icon: "03", title: "ПРЕМИАЛЬНОЕ ВОССТАНОВЛЕНИЕ", text: "Зоны восстановления, поддержка мобильности и грамотное распределение нагрузки для долгосрочного прогресса." },
    { icon: "04", title: "ПЕРСОНАЛИЗИРОВАННЫЕ ПЛАНЫ", text: "Индивидуальный путь для каждого члена, от первого сеанса до уровня чемпионства." }
  ];

  return (
    <main>
      <section className="hero-section" id="home">
        <div className="hero-backdrop" />
        <div className="hero-copy">
          <p className="hero-kicker" data-reveal="up">ПЕРЕОСМЫСЛИ СВОИ ПРЕДЕЛЫ</p>
          <h1 data-reveal="up">РАСКРОЙ СВОЙ <span>АЛЬФА</span></h1>
          <p className="hero-description" data-reveal="up">Коротко и по смыслу:Пространство силы: премиум-зал, топ-тренеры и атмосфера для роста.</p>
          <div className="hero-actions" data-reveal="up">
            <Link className="button-light pulse-button" to="/login">ПРИСОЕДИНЯЙСЯ К ALFAFITNESS</Link>
            <a className="button-outline" href="/#schedule">СМОТРЕТЬ РАСПИСАНИЕ</a>
          </div>
        </div>
      </section>

      <section className="content-section standard-section" data-reveal="up">
        <div className="section-heading">
          <span className="section-kicker">СТАНДАРТ ALFA</span>
          <h2>Коротко и по смыслу:Среда, где амбиции превращаются в результат.</h2>
        </div>
        <div className="feature-grid">
          {features.map((feature, index) => (
            <article key={feature.title} className="premium-card feature-card" style={{ transitionDelay: `${index * 70}ms` }}>
              <div className="feature-icon">{feature.icon}</div>
              <h3>{feature.title}</h3>
              <p>{feature.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="content-section" id="pricing" data-reveal="up">
        <div className="section-heading">
          <span className="section-kicker">АБОНЕМЕНТЫ</span>
          <h2>Коротко и по смыслу:Абонементы для роста, дисциплины и стабильного прогресса.</h2>
        </div>
        <div className="pricing-grid">
          {content.memberships.map((plan) => (
            <article key={plan.id} className={`premium-card pricing-card ${plan.featured ? "featured" : ""}`}>
              {plan.featured ? <div className="popular-label">САМЫЙ ПОПУЛЯРНЫЙ</div> : null}
              <span className="plan-eyebrow">{plan.title}</span>
              <h3>{plan.price} <small>/ месяц</small></h3>
              <p>{plan.description}</p>
              <ul>{plan.features.map((feature) => <li key={feature}>{feature}</li>)}</ul>
              <button className="button-primary" onClick={() => onSubscribe(plan.id)}>ВЫБРАТЬ АБОНЕМЕНТ</button>
            </article>
          ))}
        </div>
        {membershipMessage ? <div className="inline-status">{membershipMessage}</div> : null}
      </section>

      <section className="content-section" id="trainers" data-reveal="up">
        <div className="section-heading">
          <span className="section-kicker">ЭЛИТНЫЕ ТРЕНЕРЫ</span>
          <h2>Коротко и по смыслу:Тренеры, превращающие давление в точность.</h2>
        </div>
        <div className="trainer-grid">
          {content.trainers.map((trainer) => (
            <article key={trainer.id} className="trainer-card-premium">
              <img src={trainer.image} alt={trainer.name} />
              <div className="trainer-overlay">
                <div>
                  <span className="trainer-rating">★ 4.8 / 5</span>
                  <h3>{trainer.name}</h3>
                  <p>{trainer.discipline}</p>
                </div>
                <button className="button-primary trainer-cta" onClick={() => onSelectTrainer(trainer)}>ЗАКАЗАТЬ ТРЕНЕРА</button>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="content-section" id="schedule" data-reveal="up">
        <div className="section-heading">
          <span className="section-kicker">РАСПИСАНИЕ ЗАНЯТИЙ</span>
          <h2>Коротко и по смыслу:Занятия высокой производительности с четкой структурой и живой доступностью.</h2>
        </div>
        <div className="filter-row">
          {scheduleFilters.map((filter) => (
            <button key={filter} className={`filter-pill ${activeFilter === filter ? "active" : ""}`} onClick={() => setActiveFilter(filter)}>
              {filter}
            </button>
          ))}
        </div>
        <div className="schedule-grid">
          {filteredSchedule.map((item) => (
            <article key={item.id} className="premium-card schedule-card">
              <div className="schedule-card-top">
                <div>
                  <h3>{item.className}</h3>
                  <p>{item.day} • {item.time}</p>
                </div>
                <span className="spots-badge">{item.spots} места</span>
              </div>
              <div className="schedule-meta">
                <span>{item.trainer}</span>
                <span>{item.level}</span>
              </div>
              <button className="button-primary" onClick={() => onBooking(item.id)}>ЗАПИСАТЬСЯ НА ЗАНЯТИЕ</button>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}

function AuthPage({
  authTab,
  setAuthTab,
  authMessage,
  forgotMessage,
  loginForm,
  registerForm,
  updateLoginField,
  updateRegisterField,
  forgotForm,
  updateForgotField,
  onAuthSubmit,
  onForgotSubmit
}) {
  return (
    <main className="auth-page-shell">
      <section className="auth-layout">
        <div className="auth-copy" data-reveal="left">
          <span className="section-kicker">ALFA ДОСТУП</span>
          <h1>БЕЗ ОТГОВОРОК. ТОЛЬКО РЕЗУЛЬТАТ.</h1>
          <p>Войди в систему ALFA FITNESS и управляй абонементом, занятиями и тренировками.</p>
        </div>
        <div className="premium-card auth-panel" data-reveal="up">
          <div className="auth-tabs">
            <button className={authTab === "login" ? "active" : ""} onClick={() => setAuthTab("login")}>ВХОД</button>
            <button className={authTab === "register" ? "active" : ""} onClick={() => setAuthTab("register")}>РЕГИСТРАЦИЯ</button>
          </div>
          <form className="auth-form" onSubmit={onAuthSubmit}>
            {authTab === "register" ? (
              <>
                <input name="name" value={registerForm.name} onChange={updateRegisterField} placeholder="Name" required />
                <input name="phone" value={registerForm.phone} onChange={updateRegisterField} placeholder="Phone" required />
                <input type="email" name="email" value={registerForm.email} onChange={updateRegisterField} placeholder="Email" required />
                <input type="password" name="password" value={registerForm.password} onChange={updateRegisterField} placeholder="Password" required />
                <button className="button-primary pulse-button" type="submit">ПРИСОЕДИНИТЬСЯ СЕЙЧАС</button>
              </>
            ) : (
              <>
                <input type="email" name="email" value={loginForm.email} onChange={updateLoginField} placeholder="Email" required />
                <input type="password" name="password" value={loginForm.password} onChange={updateLoginField} placeholder="Password" required />
                <button className="button-primary pulse-button" type="submit">ВОЙТИ В АРЕНУ</button>
              </>
            )}
          </form>
          {authMessage ? <div className="inline-status">{authMessage}</div> : null}
          {authTab === "login" ? (
            <>
              <form className="forgot-form" onSubmit={onForgotSubmit}>
                <input type="email" name="email" value={forgotForm.email} onChange={updateForgotField} placeholder="Forgot password email" required />
                <button className="button-outline" type="submit">SEND RESET LINK</button>
              </form>
              {forgotMessage ? <div className="inline-status subtle">{forgotMessage}</div> : null}
            </>
          ) : null}
        </div>
      </section>
    </main>
  );
}

function ResetPage({ onResetSubmit, club }) {
  const { token } = useParams();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");

  const submit = async (event) => {
    event.preventDefault();
    setMessage("");
    try {
      const response = await onResetSubmit(password, confirmPassword, token);
      setMessage(response);
      setPassword("");
      setConfirmPassword("");
    } catch (error) {
      setMessage(error.message);
    }
  };

  return (
    <>
      <main className="auth-page-shell">
        <section className="auth-layout">
          <div className="auth-copy" data-reveal="left">
            <span className="section-kicker">RESET ACCESS</span>
            <h1>RESET YOUR ALFA PASSWORD</h1>
            <p>Коротко и по смыслу:Защити аккаунт и возвращайся в арену.</p>
          </div>
          <div className="premium-card auth-panel" data-reveal="up">
            <form className="auth-form" onSubmit={submit}>
              <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="New password" required />
              <input type="password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} placeholder="Confirm password" required />
              <button className="button-primary pulse-button" type="submit">ОБНОВИТЬ ПАРОЛЬ</button>
            </form>
            {message ? <div className="inline-status">{message}</div> : null}
            <Link className="button-outline auth-link-button" to="/login">НАЗАД К ВХОДУ</Link>
          </div>
        </section>
      </main>
      <Footer club={club} />
    </>
  );
}

function DashboardPage({ user, dashboardCards, onLogout, club }) {
  return (
    <>
      <main className="dashboard-shell">
        <section className="content-section">
          <div className="section-heading" data-reveal="up">
            <span className="section-kicker">С ВОЗВРАЩЕНИЕМ, АЛЬФА</span>
            <h2>Панель участника с быстрым управлением и полной прозрачностью</h2>
          </div>
          <div className="dashboard-grid">
            {dashboardCards.map((card, index) => (
              <article key={card.title} className="premium-card dashboard-card" data-reveal="up" style={{ transitionDelay: `${index * 70}ms` }}>
                <span className={`dashboard-badge ${card.badgeTone || ""}`}>{card.badge}</span>
                <h3>{card.title}</h3>
                <p>{card.primary}</p>
                <span>{card.secondary}</span>
              </article>
            ))}
          </div>
          <div className="dashboard-actions" data-reveal="up">
            <div className="premium-card dashboard-hero-card">
              <span className="section-kicker">ПРОФИЛЬ</span>
              <h3>{user.name}</h3>
              <p>{user.email}</p>
              <p>{user.phone || "Phone not added"}</p>
            </div>
            <button className="button-outline" onClick={onLogout}>ВЫЙТИ</button>
          </div>
        </section>
      </main>
      <Footer club={club} />
    </>
  );
}

function RequestModal({ trainer, requestForm, updateRequestField, onClose, onSubmit, requestMessage }) {
  const availableDays = trainer.availability || [];
  const selectedDayData = availableDays.find((item) => item.day === requestForm.preferredDay);
  const availableSlots = selectedDayData?.slots || [];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="premium-card request-modal" onClick={(event) => event.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>CLOSE</button>
        <span className="section-kicker">ЗАПРОС СЕАНСА</span>
        <h3>{trainer.name}</h3>
        <p>{trainer.discipline}</p>
        <p className="request-help-text">Доступные дни и время для этого тренера:</p>
        <div className="trainer-availability-list">
          {availableDays.length ? availableDays.map((item) => (
            <div key={item.day} className="availability-chip">
              <strong>{item.day}</strong>
              <span>{item.slots.join(", ")}</span>
            </div>
          )) : <div className="availability-chip"><strong>НЕТ МЕСТ</strong><span>У этого тренера пока нет мест</span></div>}
        </div>
        <form className="auth-form" onSubmit={onSubmit}>
          <label className="field-label" htmlFor="preferredDay">ВЫБРАТЬ ДЕНЬ</label>
          <select name="preferredDay" value={requestForm.preferredDay} onChange={updateRequestField} required>
            <option value="">ВЫБРАТЬ ДЕНЬ</option>
            {availableDays.map((item) => <option key={item.day} value={item.day}>{item.day}</option>)}
          </select>
          <label className="field-label" htmlFor="preferredTime">ВЫБРАТЬ ВРЕМЯ</label>
          <select name="preferredTime" value={requestForm.preferredTime} onChange={updateRequestField} required>
            <option value="">{requestForm.preferredDay ? "ВЫБРАТЬ ВРЕМЯ" : "СНАЧАЛА ВЫБЕРИТЕ ДЕНЬ"}</option>
            {availableSlots.map((time) => <option key={time} value={time}>{time}</option>)}
          </select>
          <label className="field-label" htmlFor="notes">СООБЩЕНИЕ</label>
          <textarea name="notes" value={requestForm.notes} onChange={updateRequestField} placeholder="Сообщение" rows="5" required />
          <button className="button-primary pulse-button" type="submit">ОТПРАВИТЬ ЗАПРОС</button>
        </form>
        {requestMessage ? <div className="inline-status">{requestMessage}</div> : null}
      </div>
    </div>
  );
}

function Footer({ club }) {
  return (
    <footer className="site-footer">
      <div>
        <div className="brand-mark footer-brand">
          <span className="brand-white">АЛЬФА</span>
          <span className="brand-red">ФИТНЕСС</span>
        </div>
        <p>Коротко и по смыслу:Премиум-клуб для силы, дисциплины и максимального результата.</p>
      </div>
      <div>
        <h4>Быстрые ссылки</h4>
        <a href="/#home">Home</a>
        <a href="/#pricing">Pricing</a>
        <a href="/#trainers">Trainers</a>
        <a href="/#schedule">Schedule</a>
      </div>
      <div>
        <h4>Contact</h4>
        <p>{club.phone}</p>
        <p>{club.address}</p>
      </div>
      <div className="footer-bottom">© 2026 ALFAFitness</div>
    </footer>
  );
}

function BackgroundEffects() {
  return (
    <div className="background-effects" aria-hidden="true">
      <span className="glow glow-top" />
      <span className="glow glow-right" />
      <span className="glow glow-bottom" />
      <span className="grid-layer" />
      <span className="noise-layer" />
      <span className="scan-line" />
    </div>
  );
}

function buildPremiumPlans(memberships) {
  const presets = {
    starter: { title: "Начинающий", price: "$29.99", featured: false },
    pro: { title: "Про", price: "$59.99", featured: true },
    elite: { title: "Элитный", price: "$99.99", featured: false }
  };
  return memberships.map((plan) => ({ ...plan, ...presets[plan.id] }));
}

function buildPremiumTrainers(trainers) {
  return trainers.slice(0, 3).map((trainer, index) => ({
    ...trainer,
    originalName: trainer.name,
    name: premiumTrainerPresets[index]?.name || trainer.name,
    discipline: premiumTrainerPresets[index]?.discipline || trainer.specialty
  }));
}

function buildPremiumSchedule(schedule, trainers) {
  const trainerMap = Object.fromEntries((trainers || []).map((trainer) => [trainer.originalName || trainer.name, trainer.name]));
  return schedule.map((item) => {
    const raw = `${item.className} ${item.category || ""}`.toUpperCase();
    const filterTag = raw.includes("BOX") ? "BOXING"
      : raw.includes("KARATE") ? "KARATE"
      : raw.includes("HIIT") ? "HIIT"
      : raw.includes("YOGA") ? "YOGA"
      : "GYM";
    return { ...item, trainer: trainerMap[item.trainer] || item.trainer, filterTag };
  });
}

function buildDashboardCards(user, dashboard, trainers) {
  const upcoming = dashboard?.bookings?.slice(0, 2) || [];
  const membershipId = dashboard?.subscriptions?.[0]?.membership || user?.membership || "";
  const membershipMeta = premiumMembershipMeta[membershipId];
  const latestTrainerRequest = dashboard?.trainerRequests?.[0];
  const mappedTrainer = trainers.find((trainer) => trainer.id === latestTrainerRequest?.trainerId || trainer.originalName === latestTrainerRequest?.trainerName);
  return [
    { title: "Профиль", badge: "LIVE", primary: user?.name || "ALFA Member", secondary: user?.email || "НЕТ email" },
    { title: "СТАТУС", badge: "АКТИВНЫЙ", badgeTone: "green", primary: (user?.subscriptionStatus || "ACTIVE").toUpperCase(), secondary: "Система абонементов онлайн" },
    {
      title: "ЧЛЕНСТВО",
      badge: "ПЛАН",
      primary: membershipMeta?.title || (membershipId ? membershipId.toUpperCase() : "НЕ ВЫБРАНО"),
      secondary: membershipMeta?.price || "Выбери свой премиум-абонемент"
    },
    {
      title: "ПРЕДСТОЯЩИЕ ЗАНЯТИЯ",
      badge: `${upcoming.length} ЗАКАЗАНО`,
      primary: upcoming[0] ? `${upcoming[0].className} • ${upcoming[0].day}` : "Нет предстоящих занятий",
      secondary: upcoming[1] ? `${upcoming[1].className} • ${upcoming[1].day}` : "Закажите ваш следующий сеанс"
    },
    {
      title: "ТРЕНЕР",
      badge: latestTrainerRequest ? "ASSIGNED" : "PENDING",
      primary: mappedTrainer?.name || "Тренер пока не выбран.",
      secondary: mappedTrainer?.discipline || "Запросите тренера в разделе тренеров."
    }
  ];
}
