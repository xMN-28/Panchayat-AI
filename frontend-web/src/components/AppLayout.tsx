import { useEffect, useState } from "react";
import {
  Buildings,
  CreditCard,
  DoorOpen,
  Gear,
  House,
  List,
  Megaphone,
  Question,
  Robot,
  SignOut,
  Users,
  X,
} from "@phosphor-icons/react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import Brand from "./Brand";
import { useAuthStore } from "../store/auth";
import NotificationInbox from "./NotificationInbox";

const residentLinks = [
  { to: "/home", label: "Overview", icon: House },
  { to: "/ai", label: "Ask Panchayat", icon: Robot },
  { to: "/complaints", label: "Complaints", icon: Question },
  { to: "/bills", label: "Maintenance", icon: CreditCard },
  { to: "/visitors", label: "Visitors", icon: DoorOpen },
  { to: "/notices", label: "Notices", icon: Megaphone },
];

export default function AppLayout() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { user, logout } = useAuthStore();
  const [menuOpen, setMenuOpen] = useState(false);
  const roles = user?.roles.map((role) => role.name) ?? [];
  const admin = Boolean(user?.is_superuser || roles.includes("admin"));
  const committee = roles.includes("committee");
  const links = [
    ...residentLinks,
    ...(admin || committee
      ? [{ to: "/residents", label: "People", icon: Users }]
      : []),
    ...(admin
      ? [{ to: "/admin", label: "Admin console", icon: Gear }]
      : committee
        ? [{ to: "/committee", label: "Committee", icon: Buildings }]
        : []),
  ];
  const title =
    links.find((link) => pathname.startsWith(link.to))?.label ?? "Panchayat AI";
  const role = admin
    ? "Administrator"
    : committee
      ? "Committee member"
      : (roles[0] ?? "Resident");
  function signOut() {
    logout();
    navigate("/login");
  }
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [pathname]);
  return (
    <div className="app-shell">
      <aside className={`sidebar ${menuOpen ? "open" : ""}`}>
        <div onClick={() => setMenuOpen(false)}>
          <Brand to="/home" />
        </div>
        <nav className="sidebar-nav" aria-label="Product navigation">
          {links.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              className={({ isActive }) =>
                `sidebar-link ${isActive ? "active" : ""}`
              }
              to={to}
              onClick={() => setMenuOpen(false)}
            >
              <Icon size={20} />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-footer">
          <div className="user-card">
            <span className="user-avatar">
              {user?.full_name?.slice(0, 1).toUpperCase()}
            </span>
            <span className="user-copy">
              <strong>{user?.full_name}</strong>
              <span>{role}</span>
            </span>
          </div>
          <button className="sidebar-link" type="button" onClick={signOut}>
            <SignOut size={20} />
            <span>Sign out</span>
          </button>
        </div>
      </aside>
      <section className="app-stage">
        <header className="topbar">
          <div className="topbar-actions">
            <button
              className="icon-button mobile-menu"
              type="button"
              aria-label={menuOpen ? "Close menu" : "Open menu"}
              onClick={() => setMenuOpen((open) => !open)}
            >
              {menuOpen ? <X size={20} /> : <List size={20} />}
            </button>
            <div className="topbar-copy">
              <strong>{title}</strong>
              <span>Green Park Cooperative Society</span>
            </div>
          </div>
          <div className="topbar-actions">
            <span className="connection">
              <span className="status-dot" />
              System connected
            </span>
            <NotificationInbox />
            <button
              className="icon-button"
              type="button"
              aria-label="Sign out"
              onClick={signOut}
            >
              <SignOut size={19} />
            </button>
          </div>
        </header>
        <main className="workspace">
          <Outlet />
        </main>
      </section>
    </div>
  );
}
