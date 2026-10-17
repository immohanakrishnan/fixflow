"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { signOut } from "next-auth/react";
import {
  BarChart3,
  Bell,
  Building2,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  Clock3,
  FileText,
  Filter,
  Home,
  LayoutDashboard,
  LifeBuoy,
  Menu,
  MoreHorizontal,
  Plus,
  Search,
  ShieldCheck,
  Sparkles,
  UserRound,
  Users,
  X,
  Zap,
} from "lucide-react";

type Ticket = {
  id: string;
  property: string;
  unit: string;
  issue: string;
  severity: "Emergency" | "High" | "Medium" | "Low";
  due: string;
  tech: string;
  status: string;
  category: string;
};
const nav = [
  { label: "Dashboard", icon: LayoutDashboard },
  { label: "Requests", icon: ClipboardList },
  { label: "Tickets", icon: FileText },
  { label: "Completed Tickets", icon: CheckCircle2 },
  { label: "Technicians", icon: Users },
  { label: "Tenants", icon: UserRound },
  { label: "Properties", icon: Building2 },
];
const severityClass = (s: Ticket["severity"]) => s.toLowerCase();
const displayLabel = (value: unknown) =>
  String(value ?? "")
    .toLowerCase()
    .replaceAll("_", " ")
    .replace(/(^|\s)\S/g, (letter) => letter.toUpperCase());
const toTicket = (ticket: any): Ticket => ({
  id: ticket.code,
  property: ticket.property?.name ?? "Property not assigned",
  unit: ticket.unit?.label ?? "Unit not assigned",
  issue: ticket.issue,
  severity: displayLabel(ticket.priority) as Ticket["severity"],
  due: ticket.slaDue
    ? new Date(ticket.slaDue).toLocaleString()
    : "Not set",
  tech: ticket.assignments?.[0]?.technician?.user?.name ?? "Unassigned",
  status: displayLabel(ticket.status ?? "OPEN"),
  category: ticket.category ?? "General",
});

export default function Dashboard() {
  const [active, setActive] = useState("Dashboard");
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("All tickets");
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [ticketPage, setTicketPage] = useState(1);
  const [greeting, setGreeting] = useState("Good morning");
  const [summary, setSummary] = useState<{
    kpis?: any;
    properties?: any[];
    technicians?: any[];
    tenants?: any[];
    requests?: any[];
    tickets?: any[];
  }>({});
  const ticketsPerPage = 5;
  useEffect(() => {
    const hour = new Date().getHours();
    setGreeting(
      hour < 12
        ? "Good morning"
        : hour < 18
          ? "Good afternoon"
          : "Good evening",
    );
  }, []);
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
    Promise.all([
      fetch("/api/dashboard").then((response) =>
        response.ok ? response.json() : null,
      ),
      fetch("/api/properties").then((response) =>
        response.ok ? response.json() : [],
      ),
      fetch("/api/technicians").then((response) =>
        response.ok ? response.json() : [],
      ),
      fetch("/api/tenants").then((response) =>
        response.ok ? response.json() : [],
      ),
      fetch("/api/requests?view=admin").then((response) =>
        response.ok ? response.json() : [],
      ),
    ])
      .then(([dashboard, properties, technicians, tenants, requests]) => {
        setTickets((dashboard?.tickets ?? []).map(toTicket));
        setSummary({
          kpis: dashboard?.kpis,
          properties,
          technicians,
          tenants,
          requests,
          tickets: dashboard?.tickets ?? [],
        });
      })
      .catch(() => undefined);
  }, []);
  const liveTickets = summary.kpis?.opened ?? 0;
  const propertyCount = summary.properties?.length ?? 0;
  const unitCount =
    summary.properties?.reduce(
      (total, property) => total + (property.units?.length ?? 0),
      0,
    ) ?? 0;
  const technicianCount = summary.technicians?.length ?? 0;
  const tenantCount =
    summary.tenants?.filter((tenant) => tenant.status === "ACTIVE").length ??
    0;
  const chartData = [
    { label: "Open", value: liveTickets, color: "#5d83e8" },
    { label: "Triage", value: summary.kpis?.triage ?? 0, color: "#9075ed" },
    {
      label: "Scheduled",
      value: summary.kpis?.scheduled ?? 0,
      color: "#e7a548",
    },
    { label: "Overdue", value: summary.kpis?.overdue ?? 0, color: "#df706d" },
  ];
  const priorityData = [
    {
      label: "Emergency",
      value: summary.kpis?.emergencies ?? 0,
      color: "#db6664",
    },
    { label: "High", value: tickets.filter((ticket) => ticket.severity === "High").length, color: "#e6a449" },
    { label: "Medium", value: tickets.filter((ticket) => ticket.severity === "Medium").length, color: "#5d83e8" },
    { label: "Low", value: tickets.filter((ticket) => ticket.severity === "Low").length, color: "#8e9db2" },
  ];
  const maintenanceRequests = summary.requests ?? [];
  const requestStatuses = [
    {
      label: "Pending review",
      value: maintenanceRequests.filter(
        (r) => !r.ticket && r.status !== "CONVERTED",
      ).length,
      color: "#e6a449",
    },
    {
      label: "Converted to ticket",
      value: maintenanceRequests.filter(
        (r) => Boolean(r.ticket) || r.status === "CONVERTED",
      ).length,
      color: "#5d83e8",
    },
    {
      label: "Resolved",
      value: maintenanceRequests.filter((r) =>
        ["RESOLVED", "CLOSED"].includes(
          String(r.ticket?.status ?? r.status).toUpperCase(),
        ),
      ).length,
      color: "#51b48a",
    },
  ];
  const requestTotal = maintenanceRequests.length;
  const pendingRequestCount = maintenanceRequests.filter(
    (request) => !request.ticket && request.status !== "CONVERTED",
  ).length;
  const propertyRequestCounts = (summary.properties ?? []).map((property) => ({
    name: property.name,
    count: maintenanceRequests.filter(
      (request) =>
        request.property?.id === property.id ||
        request.propertyId === property.id,
    ).length,
  }));
  const propertyColors = ["#5d83e8", "#e6a449", "#51b48a", "#9677e8", "#df706d"];
  const visible = useMemo(
    () =>
      tickets.filter(
        (t) =>
          (filter === "All tickets" ||
            t.status === filter ||
            t.severity === filter) &&
          `${t.id} ${t.issue} ${t.property} ${t.tech}`
            .toLowerCase()
            .includes(query.toLowerCase()),
      ),
    [tickets, query, filter],
  );
  const pageCount = Math.max(1, Math.ceil(visible.length / ticketsPerPage));
  const pagedTickets = visible.slice(
    (ticketPage - 1) * ticketsPerPage,
    ticketPage * ticketsPerPage,
  );
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
          {nav.map((item) => {
            const I = item.icon;
            return (
              <button
                key={item.label}
                className={
                  active === item.label ? "nav-item active" : "nav-item"
                }
                onClick={() => {
                  if (item.label !== "Dashboard") {
                    window.location.href = `/${item.label.toLowerCase().replaceAll(" ", "-")}`;
                    return;
                  }
                  setActive(item.label);
                }}
              >
                <I size={17} />
                <span>{item.label}</span>
                {item.label === "Requests" && <em>{pendingRequestCount}</em>}
              </button>
            );
          })}
        </nav>
      </aside>
      <section className="content">
        <header className="topbar">
          <button className="mobile-menu">
            <Menu size={19} />
          </button>
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
        <div className="page-wrap">
          <div className="welcome-banner">
            <div className="welcome-copy">
              <span className="eyebrow">
                <Sparkles size={14} /> AI operations overview
              </span>
              <h1>{greeting}, Ahmed</h1>
              <p>
                Here&apos;s what&apos;s happening across your properties today.
              </p>
              <div className="banner-meta">
                <span>
                  <span className="status-dot green" /> System operational
                </span>
                <span>Last synced 2 min ago</span>
              </div>
            </div>
            <div className="banner-graphic">
              <div className="sun" />
              <div className="building b1" />
              <div className="building b2" />
              <div className="building b3" />
              <div className="tree" />
            </div>
          </div>
          <div className="kpi-grid">
            {[
              [
                "Opened tickets",
                String(liveTickets).padStart(2, "0"),
                "+12.5%",
                ClipboardList,
                "blue",
              ],
              [
                "In triage",
                String(summary.kpis?.triage ?? 0).padStart(2, "0"),
                "+4.2%",
                Sparkles,
                "purple",
              ],
              [
                "Scheduled visits",
                String(summary.kpis?.scheduled ?? 0).padStart(2, "0"),
                "+8.1%",
                CalendarDays,
                "orange",
              ],
              [
                "Overdue",
                String(summary.kpis?.overdue ?? 0).padStart(2, "0"),
                "-2.4%",
                Clock3,
                "red",
              ],
              [
                "Emergencies",
                String(summary.kpis?.emergencies ?? 0).padStart(2, "0"),
                "Needs action",
                ShieldCheck,
                "dark",
              ],
            ].map(([title, value, trend, icon, color]) => {
              const I = icon as typeof ClipboardList;
              return (
                <div className="kpi" key={title as string}>
                  <div className={`kpi-icon ${color}`}>
                    <I size={18} />
                  </div>
                  <div className="kpi-body">
                    <span>{title as string}</span>
                    <strong>{value as string}</strong>
                    <small
                      className={
                        (trend as string).startsWith("-")
                          ? "good"
                          : trend === "Needs action"
                            ? "warn"
                            : "trend"
                      }
                    >
                      {trend as string}
                      {trend !== "Needs action" && <span> vs last week</span>}
                    </small>
                  </div>
                  <MoreHorizontal size={17} className="muted" />
                </div>
              );
            })}
          </div>
          <section className="portfolio-overview">
            <div className="portfolio-head">
              <div>
                <span className="eyebrow">
                  <BarChart3 size={13} /> Portfolio overview
                </span>
                <h2>Everything in one view</h2>
                <p>Live counts across your Riyadh operations workspace.</p>
              </div>
              <span className="live-pill">
                <i /> Live data
              </span>
            </div>
            <div className="portfolio-stats">
              <div className="portfolio-stat">
                <span className="stat-icon blue">
                  <Building2 size={16} />
                </span>
                <div>
                  <small>Properties</small>
                  <strong>{propertyCount}</strong>
                  <em>managed locations</em>
                </div>
              </div>
              <div className="portfolio-stat">
                <span className="stat-icon purple">
                  <Home size={16} />
                </span>
                <div>
                  <small>Units</small>
                  <strong>{unitCount}</strong>
                  <em>across portfolio</em>
                </div>
              </div>
              <div className="portfolio-stat">
                <span className="stat-icon orange">
                  <Users size={16} />
                </span>
                <div>
                  <small>Technicians</small>
                  <strong>{technicianCount}</strong>
                  <em>service team</em>
                </div>
              </div>
              <div className="portfolio-stat">
                <span className="stat-icon green">
                  <UserRound size={16} />
                </span>
                <div>
                  <small>Tenants</small>
                  <strong>{tenantCount}</strong>
                  <em>active residents</em>
                </div>
              </div>
            </div>
            <div className="chart-grid">
              <div className="mini-chart">
                <div className="chart-title">
                  <div>
                    <b>Queue distribution</b>
                    <small>Current ticket workload</small>
                  </div>
                  <span>{liveTickets} total</span>
                </div>
                <div className="bar-chart">
                  {chartData.map((item) => (
                    <div className="bar-item" key={item.label}>
                      <div className="bar-value">{item.value}</div>
                      <div className="bar-track">
                        <i
                          style={{
                            height: `${Math.max(12, Math.min(100, item.value * 4))}%`,
                            background: item.color,
                          }}
                        />
                      </div>
                      <small>{item.label}</small>
                    </div>
                  ))}
                </div>
              </div>
              <div className="mini-chart">
                <div className="chart-title">
                  <div>
                    <b>Priority mix</b>
                    <small>Tickets requiring attention</small>
                  </div>
                  <span>
                    {priorityData.reduce(
                      (total, item) => total + item.value,
                      0,
                    )}{" "}
                    total
                  </span>
                </div>
                <div className="priority-bars">
                  {priorityData.map((item) => (
                    <div className="priority-bar" key={item.label}>
                      <div>
                        <span>{item.label}</span>
                        <b>{item.value}</b>
                      </div>
                      <div className="progress-track">
                        <i
                          style={{
                            width: `${Math.max(8, item.value * 7)}%`,
                            background: item.color,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>
          <section className="requests-overview">
            <div className="section-heading">
              <div>
                <h2>
                  Tenant maintenance requests <span>{requestTotal}</span>
                </h2>
                <p>Requests submitted by residents before ticket creation</p>
              </div>
              <button
                className="ghost-btn"
                onClick={() => (window.location.href = "/requests")}
              >
                Open requests
              </button>
            </div>
            <div className="request-dashboard-grid">
              <div className="request-status-card panel">
                <div className="panel-head">
                  <div>
                    <h2>Request status</h2>
                    <p>Current resident request pipeline</p>
                  </div>
                  <ClipboardList size={20} className="muted" />
                </div>
                <div className="status-chart-row">
                  <div
                    className="status-donut"
                    style={{
                      background: requestTotal
                        ? `conic-gradient(#e6a449 0 ${(requestStatuses[0].value / requestTotal) * 100}%, #5d83e8 ${(requestStatuses[0].value / requestTotal) * 100}% ${((requestStatuses[0].value + requestStatuses[1].value) / requestTotal) * 100}%, #51b48a ${((requestStatuses[0].value + requestStatuses[1].value) / requestTotal) * 100}% 100%)`
                        : "#e8edf6",
                    }}
                  >
                    <strong>{requestTotal}</strong>
                    <span>requests</span>
                  </div>
                  <div className="status-legend">
                    {requestStatuses.map((status) => (
                      <div key={status.label}>
                        <i style={{ background: status.color }} />
                        <span>{status.label}</span>
                        <b>{status.value}</b>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="property-board panel">
                <div className="panel-head">
                  <div>
                    <h2>Requests by property</h2>
                    <p>Resident activity across your portfolio</p>
                  </div>
                  <Building2 size={20} className="muted" />
                </div>
                <div className="property-request-list">
                  {propertyRequestCounts.slice(0, 5).map((property, index) => (
                    <div className="property-request-row" key={property.name}>
                      <span
                        className="property-avatar"
                        style={{
                          color: propertyColors[index],
                          background: `${propertyColors[index]}18`,
                        }}
                      >
                        <Building2 size={15} />
                      </span>
                      <span className="property-request-name">
                        {property.name}
                      </span>
                      <div className="property-request-track">
                        <i
                          style={{
                            width: `${requestTotal ? Math.max(8, (property.count / requestTotal) * 100) : 8}%`,
                            background: propertyColors[index],
                          }}
                        />
                      </div>
                      <b>{property.count}</b>
                    </div>
                  ))}
                  {!propertyRequestCounts.length && (
                    <div className="empty">No property requests yet.</div>
                  )}
                </div>
              </div>
            </div>
          </section>
          <div className="main-grid">
            <section className="panel tickets-panel">
              <div className="panel-head">
                <div>
                  <h2>Maintenance tickets</h2>
                  <p>Manage and track all active requests</p>
                </div>
                <button
                  className="primary-btn"
                  onClick={() => (window.location.href = "/requests")}
                >
                  <Plus size={16} /> New request
                </button>
              </div>
              <div className="toolbar">
                <div className="search">
                  <Search size={16} />
                  <input
                    placeholder="Search tickets..."
                    value={query}
                    onChange={(e) => {
                      setQuery(e.target.value);
                      setTicketPage(1);
                    }}
                  />
                </div>
                <select
                  value={filter}
                  onChange={(e) => {
                    setFilter(e.target.value);
                    setTicketPage(1);
                  }}
                >
                  <option>All tickets</option>
                  <option>Triage</option>
                  <option>Assigned</option>
                  <option>In progress</option>
                  <option>Emergency</option>
                  <option>High</option>
                </select>
                <button className="filter-btn">
                  <Filter size={15} /> Filters
                </button>
              </div>
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Ticket</th>
                      <th>Property & unit</th>
                      <th>Issue</th>
                      <th>Severity</th>
                      <th>SLA due</th>
                      <th>Assigned to</th>
                      <th>Status</th>
                      <th />
                    </tr>
                  </thead>
                  <tbody>
                    {pagedTickets.map((t) => (
                      <tr
                        key={t.id}
                        className="ticket-row"
                        onClick={() => {
                          setSelectedTicket(t);
                        }}
                      >
                        <td>
                          <b className="ticket-link">{t.id}</b>
                          <small>{t.category}</small>
                        </td>
                        <td>
                          <b>{t.property}</b>
                          <small>{t.unit}</small>
                        </td>
                        <td className="issue-cell">{t.issue}</td>
                        <td>
                          <span
                            className={`priority ${severityClass(t.severity)}`}
                          >
                            <i />
                            {t.severity}
                          </span>
                        </td>
                        <td className="due-cell">{t.due}</td>
                        <td>
                          <div className="assignee">
                            <span
                              className={
                                t.tech === "Unassigned"
                                  ? "mini-avatar empty"
                                  : "mini-avatar"
                              }
                            >
                              {t.tech === "Unassigned"
                                ? "?"
                                : t.tech
                                    .split(" ")
                                    .map((x) => x[0])
                                    .join("")
                                    .slice(0, 2)}
                            </span>
                            {t.tech}
                          </div>
                        </td>
                        <td>
                          <span
                            className={`status ${t.status.toLowerCase().replaceAll(" ", "-")}`}
                          >
                            {t.status}
                          </span>
                        </td>
                        <td>
                          <button
                            className="row-menu"
                            onClick={(event) => {
                              event.stopPropagation();
                              setSelectedTicket(t);
                            }}
                          >
                            <MoreHorizontal size={17} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {visible.length === 0 && (
                  <div className="empty">No tickets match your filters.</div>
                )}
              </div>
              <div className="table-foot">
                <span>
                  Showing{" "}
                  {visible.length === 0
                    ? 0
                    : (ticketPage - 1) * ticketsPerPage + 1}
                  -{Math.min(ticketPage * ticketsPerPage, visible.length)} of{" "}
                  {visible.length} tickets
                </span>
                <div className="pagination">
                  <button
                    disabled={ticketPage === 1}
                    onClick={() => setTicketPage((page) => Math.max(1, page - 1))}
                  >
                    &lt;
                  </button>
                  {Array.from({ length: pageCount }, (_, index) => index + 1).map(
                    (page) => (
                      <button
                        key={page}
                        className={ticketPage === page ? "selected" : ""}
                        onClick={() => setTicketPage(page)}
                      >
                        {page}
                      </button>
                    ),
                  )}
                  <button
                    disabled={ticketPage === pageCount}
                    onClick={() => setTicketPage((page) => Math.min(pageCount, page + 1))}
                  >
                    &gt;
                  </button>
                </div>
              </div>
            </section>
          </div>
          <div className="footer-note">
            <span>
              <ShieldCheck size={14} /> Live data from the FixFlow workspace
            </span>
            <span>Powered by master rules - All systems operational</span>
          </div>
        </div>
      </section>
      {selectedTicket && (
        <div className="modal-backdrop" onClick={() => setSelectedTicket(null)}>
          <div
            className="modal ticket-detail-modal"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="modal-head">
              <div>
                <span className="eyebrow">
                  <FileText size={13} /> Ticket details
                </span>
                <h2>{selectedTicket.id}</h2>
                <p>
                  {selectedTicket.property} - {selectedTicket.unit}
                </p>
              </div>
              <button
                className="close-btn"
                onClick={() => setSelectedTicket(null)}
              >
                <X size={18} />
              </button>
            </div>
            <div className="ticket-detail-grid">
              <div>
                <span>Issue</span>
                <b>{selectedTicket.issue}</b>
              </div>
              <div>
                <span>Category</span>
                <b>{selectedTicket.category}</b>
              </div>
              <div>
                <span>Severity</span>
                <b
                  className={`priority ${severityClass(selectedTicket.severity)}`}
                >
                  <i />
                  {selectedTicket.severity}
                </b>
              </div>
              <div>
                <span>Status</span>
                <b>{selectedTicket.status}</b>
              </div>
              <div>
                <span>SLA due</span>
                <b>{selectedTicket.due}</b>
              </div>
              <div>
                <span>Assigned technician</span>
                <b>{selectedTicket.tech}</b>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
