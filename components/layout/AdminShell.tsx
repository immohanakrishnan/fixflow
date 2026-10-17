"use client";
import { useEffect, useRef, useState } from "react";
import { signOut } from "next-auth/react";
import {
  Bell,
  Building2,
  CheckCircle2,
  ClipboardList,
  FileText,
  LayoutDashboard,
  Users,
  UserRound,
  Search,
  KeyRound,
  Zap,
} from "lucide-react";

const items = [
  { label: "Dashboard", href: "/", icon: LayoutDashboard },
  {
    label: "Requests",
    href: "/requests",
    icon: ClipboardList,
  },
  { label: "Tickets", href: "/tickets", icon: FileText },
  {
    label: "C-Tickets",
    href: "/completed-tickets",
    icon: CheckCircle2,
  },
  { label: "Technicians", href: "/technicians", icon: Users },
  { label: "Tenants", href: "/tenants", icon: UserRound },
  { label: "Users", href: "/users", icon: KeyRound },
  { label: "Properties", href: "/properties", icon: Building2 },
];
export function AdminShell({
  active,
  children,
}: {
  active: string;
  children: React.ReactNode;
}) {
  const [requestCount, setRequestCount] = useState(0);
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const closeOnOutsideClick = (event: MouseEvent) => {
      if (!profileRef.current?.contains(event.target as Node)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener("mousedown", closeOnOutsideClick);
    return () => document.removeEventListener("mousedown", closeOnOutsideClick);
  }, []);
  useEffect(() => {
    fetch("/api/requests?summary=count")
      .then((response) => (response.ok ? response.json() : []))
      .then((result) => setRequestCount(typeof result?.count === "number" ? result.count : 0))
      .catch(() => setRequestCount(0));
  }, []);
  return (
    <main className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">
            <Zap size={18} fill="currentColor" />
          </div>
          <div>
            <strong>
              FixFlow<span>AI</span>
            </strong>
            <small>Property operations</small>
          </div>
        </div>
        <p className="nav-label">WORKSPACE</p>
        <nav>
          {items.map((item) => {
            const I = item.icon;
            return (
              <a
                key={item.label}
                className={
                  active === item.label ? "nav-item active" : "nav-item"
                }
                href={item.href}
              >
                <I size={17} />
                <span>{item.label}</span>
                {item.label === "Requests" && <em>{requestCount}</em>}
              </a>
            );
          })}
        </nav>
      </aside>
      <section className="content admin-content">
        <header className="topbar">
          <div className="breadcrumbs">
            <span>Admin</span>
            <b>/</b>
            <span>Workspace</span>
            <b>/</b>
            <strong>{active}</strong>
          </div>
          <div className="top-actions">
            <button className="icon-btn">
              <Search size={18} />
            </button>
            <button className="icon-btn notification">
              <Bell size={18} />
              <i />
            </button>
            <div className="profile-menu-wrap" ref={profileRef}>
              <button
                className="top-avatar profile-trigger"
                onClick={() => setProfileOpen((open) => !open)}
                aria-label="Open profile menu"
                aria-expanded={profileOpen}
              >
                AK
              </button>
              {profileOpen && (
                <div className="profile-menu">
                  <div className="profile-summary">
                    <div className="profile-menu-avatar">AK</div>
                    <div>
                      <b>Ahmed Khalid</b>
                      <small>Administrator</small>
                    </div>
                  </div>
                  <div className="profile-divider" />
                  <button
                    className="profile-menu-item"
                    onClick={() => signOut({ callbackUrl: "/login" })}
                  >
                    Log out
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>
        <div className="page-wrap">{children}</div>
      </section>
    </main>
  );
}
