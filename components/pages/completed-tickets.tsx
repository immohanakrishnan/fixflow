"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, FileText, X } from "lucide-react";
import { AdminShell } from "../layout/AdminShell";
import { TicketEditor } from "../ui/admin/AdminSectionPage";
import { toTitleCase } from "../../lib/text";

type Ticket = any;

export default function CompletedTicketsPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [selected, setSelected] = useState<Ticket | null>(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetch("/api/tickets")
      .then((response) => response.json())
      .then((rows) =>
        setTickets(
          (Array.isArray(rows) ? rows : []).filter((ticket) =>
            ["RESOLVED", "CLOSED"].includes(ticket.status),
          ),
        ),
      );
  }, []);

  async function completeBilling() {
    if (!selected) return;
    const response = await fetch(`/api/tickets/${selected.id}/billing`, {
      method: "POST",
    });
    const result = await response.json();
    if (!response.ok) {
      setMessage(result.error ?? "Unable to complete billing");
      return;
    }
    setTickets((current) =>
      current.map((ticket) => (ticket.id === selected.id ? result : ticket)),
    );
    setSelected(null);
    setMessage("Billing completed. Ticket closed.");
  }

  async function updateTicket(payload: Record<string, unknown>) {
    if (!selected) return;
    const response = await fetch(`/api/tickets/${selected.id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });
    const result = await response.json();
    if (!response.ok) {
      setMessage(result.error ?? "Unable to update ticket");
      return;
    }
    setTickets((current) =>
      current.map((ticket) => (ticket.id === result.id ? result : ticket)),
    );
    setSelected(null);
    setMessage("Ticket updated successfully.");
  }

  async function reopenTicket() {
    if (!selected) return;
    const response = await fetch(`/api/tickets/${selected.id}/status`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ status: "OPEN", note: "Ticket reopened by administrator" }),
    });
    const result = await response.json();
    if (!response.ok) {
      setMessage(result.error ?? "Unable to reopen ticket");
      return;
    }
    setTickets((current) => current.filter((ticket) => ticket.id !== result.id));
    setSelected(null);
    setMessage("Ticket reopened successfully.");
  }

  return (
    <AdminShell active="Completed Tickets">
      <div className="admin-page-head">
        <div>
          <h1>Completed Tickets</h1>
          <p>Review resolved and closed maintenance work.</p>
        </div>
        <span className="record-count">{tickets.length} completed</span>
      </div>
      <div className="admin-card data-card maintenance-table-card">
        <div className="data-toolbar">
          <div className="search">
            <span>⌕</span>
            <input placeholder="Search completed tickets..." />
          </div>
          <span className="record-count">History</span>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Ticket</th>
                <th>Property & unit</th>
                <th>Issue</th>
                <th>Priority</th>
                <th>Assigned to</th>
                <th>Status</th>
                <th>Completed</th>
              </tr>
            </thead>
            <tbody>
              {tickets.map((ticket, index) => {
                const technician =
                  ticket.assignments?.[0]?.technician?.user?.name ??
                  "Unassigned";
                return (
                  <tr
                    key={ticket.id ?? index}
                    className="ticket-row"
                    onClick={() => setSelected(ticket)}
                  >
                    <td>
                      <b className="ticket-link">{ticket.code}</b>
                      <small>{ticket.category}</small>
                    </td>
                    <td>
                      <b>{ticket.property?.name ?? "Property unavailable"}</b>
                      <small>{ticket.unit?.label ?? "Unit unavailable"}</small>
                    </td>
                    <td className="issue-cell">{ticket.issue}</td>
                    <td>
                      <span
                        className={`priority ${(ticket.priority ?? "MEDIUM").toLowerCase()}`}
                      >
                        <i />
                        {ticket.priority}
                      </span>
                    </td>
                    <td>{technician}</td>
                    <td>
                      <span className={`status ${ticket.status.toLowerCase()}`}>
                        {ticket.status}
                      </span>
                    </td>
                    <td>
                      {new Date(
                        ticket.updatedAt ?? ticket.createdAt,
                      ).toLocaleDateString()}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {!tickets.length && (
            <div className="empty">No completed tickets found.</div>
          )}
        </div>
      </div>
      {message && <div className="admin-notice">{toTitleCase(message)}</div>}
      {selected && (
        <TicketEditor
          record={selected}
          mode="ticket"
          onClose={() => setSelected(null)}
          onConvert={(payload) =>
            updateTicket({
              issue: payload.title,
              description: payload.description,
              category: payload.category,
              priority: payload.priority,
              propertyId: payload.propertyId,
              unitId: payload.unitId,
              technicianId: payload.technicianId,
              slaDue: payload.slaDue,
            })
          }
          secondaryAction={selected.status === "RESOLVED" ? completeBilling : undefined}
          secondaryLabel={selected.status === "RESOLVED" ? "Billing complete & close" : undefined}
          reopenAction={selected.status === "CLOSED" ? reopenTicket : undefined}
        />
      )}
      {false && selected && (
        <div className="modal-backdrop" onClick={() => setSelected(null)}>
          <div
            className="modal ticket-details-modal"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="modal-head">
              <div>
                <span className="eyebrow">
                  <FileText size={13} /> Completed ticket
                </span>
                <h2>{selected.code}</h2>
                <p>{selected.issue}</p>
              </div>
              <button className="close-btn" onClick={() => setSelected(null)}>
                <X size={18} />
              </button>
            </div>
            <div className="ticket-detail-grid">
              <div>
                <small>Property</small>
                <b>{selected.property?.name ?? "—"}</b>
              </div>
              <div>
                <small>Unit</small>
                <b>{selected.unit?.label ?? "—"}</b>
              </div>
              <div>
                <small>Category</small>
                <b>{selected.category}</b>
              </div>
              <div>
                <small>Priority</small>
                <b>{selected.priority}</b>
              </div>
              <div>
                <small>Status</small>
                <b>{selected.status}</b>
              </div>
              <div>
                <small>Assigned to</small>
                <b>
                  {selected.assignments?.[0]?.technician?.user?.name ??
                    "Unassigned"}
                </b>
              </div>
            </div>
            <div className="modal-actions">
              <button
                type="button"
                className="ghost-btn"
                onClick={() => setSelected(null)}
              >
                Close
              </button>
              {selected.status === "RESOLVED" && (
                <button
                  type="button"
                  className="primary-btn large-action"
                  onClick={completeBilling}
                >
                  Billing complete &amp; close
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </AdminShell>
  );
}
