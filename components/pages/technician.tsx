"use client";
import { useEffect, useState } from "react";
import { CheckCircle2, Clock3, LogOut, Wrench } from "lucide-react";
import { signOut } from "next-auth/react";
type Ticket = {
  id: string;
  code: string;
  issue: string;
  status: string;
  priority: string;
  property: { name: string };
  unit: { label: string };
};
export default function TechnicianPortal() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [message, setMessage] = useState("");
  useEffect(() => {
    fetch("/api/technician-tickets")
      .then((r) => r.json())
      .then(setTickets);
  }, []);
  async function update(id: string, status: string) {
    const r = await fetch(`/api/tickets/${id}/status`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (r.ok) {
      setTickets(tickets.map((t) => (t.id === id ? { ...t, status } : t)));
      setMessage("Ticket status updated.");
    }
  }
  return (
    <main className="portal">
      <header>
        <div className="portal-brand">
          <div className="brand-mark">
            <Wrench size={17} />
          </div>
          <b>
            FixFlow<span>AI</span>
          </b>
        </div>
        <button onClick={() => signOut({ callbackUrl: "/login" })}>
          <LogOut size={15} /> Sign out
        </button>
      </header>
      <div className="portal-wrap">
        <div className="portal-intro">
          <span className="eyebrow">
            <Wrench size={13} /> Technician workspace
          </span>
          <h1>Your assigned work</h1>
          <p>Keep residents and property managers updated as you work.</p>
        </div>
        <section className="portal-card">
          <h2>
            <Clock3 size={17} /> Assigned tickets <span>{tickets.length}</span>
          </h2>
          {tickets.map((t) => (
            <div className="work-row" key={t.id}>
              <div>
                <b>
                  {t.code} · {t.issue}
                </b>
                <small>
                  {t.property.name} · {t.unit.label} · {t.priority}
                </small>
              </div>
              <div className="work-actions">
                <span className={`status ${t.status.toLowerCase()}`}>
                  {t.status}
                </span>
                {t.status !== "IN_PROGRESS" && t.status !== "RESOLVED" && (
                  <button
                    className="primary-btn"
                    onClick={() => update(t.id, "IN_PROGRESS")}
                  >
                    Start work
                  </button>
                )}
                {t.status === "IN_PROGRESS" && (
                  <button
                    className="primary-btn"
                    onClick={() => update(t.id, "RESOLVED")}
                  >
                    <CheckCircle2 size={14} /> Submit completion
                  </button>
                )}
              </div>
            </div>
          ))}
          {message && <div className="portal-message">{message}</div>}
        </section>
      </div>
    </main>
  );
}
