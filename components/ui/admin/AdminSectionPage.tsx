"use client";
import { FormEvent, useEffect, useState } from "react";
import { AdminShell } from "../../layout/AdminShell";
import { toTitleCase } from "../../../lib/text";
import {
  AlertTriangle,
  Building2,
  CheckCircle2,
  ClipboardList,
  FileText,
  Pencil,
  Plus,
  Settings,
  Sparkles,
  Trash2,
  Users,
  X,
  KeyRound,
} from "lucide-react";

const config: Record<
  string,
  { title: string; subtitle: string; icon: typeof FileText; singular: string }
> = {
  requests: {
    title: "Requests",
    subtitle: "Review incoming resident complaints and AI triage status.",
    icon: ClipboardList,
    singular: "request",
  },
  tickets: {
    title: "Tickets",
    subtitle: "Manage the complete maintenance queue and SLA progress.",
    icon: FileText,
    singular: "ticket",
  },
  technicians: {
    title: "Technicians",
    subtitle: "Manage skills, workload, availability, and coverage.",
    icon: Users,
    singular: "technician",
  },
  tenants: {
    title: "Tenants",
    subtitle: "Manage resident contacts, properties, and unit occupancy.",
    icon: Users,
    singular: "tenant",
  },
  users: {
    title: "Users",
    subtitle: "Manage tenant and technician login access.",
    icon: KeyRound,
    singular: "user",
  },
  properties: {
    title: "Properties",
    subtitle: "View the Riyadh portfolio, units, and maintenance volume.",
    icon: Building2,
    singular: "property",
  },
  "ai-insights": {
    title: "AI Insights",
    subtitle: "Grounded signals calculated from your maintenance data.",
    icon: Sparkles,
    singular: "insight",
  },
  settings: {
    title: "Settings",
    subtitle: "Workspace preferences and operational controls.",
    icon: Settings,
    singular: "setting",
  },
};
const endpoint = (section: string) =>
  section === "requests"
    ? "/api/requests"
    : section === "tickets"
      ? "/api/tickets"
      : section === "technicians"
        ? "/api/technicians"
        : section === "tenants"
          ? "/api/tenants"
          : "/api/properties";

export default function AdminSectionPage({
  section: initialSection,
}: {
  section: string;
}) {
  const [section, setSection] = useState(initialSection);
  const [data, setData] = useState<any[]>([]);
  const [report, setReport] = useState<any>(null);
  const [editing, setEditing] = useState<any | null>(null);
  const [creating, setCreating] = useState(false);
  const [notice, setNotice] = useState("");
  const [selectedTicket, setSelectedTicket] = useState<any | null>(null);
  const [selectedTenant, setSelectedTenant] = useState<any | null>(null);
  const [confirm, setConfirm] = useState<{
    title: string;
    message: string;
    action: () => void;
  } | null>(null);
  const askConfirm = (title: string, message: string, action: () => void) =>
    setConfirm({ title, message, action });
  const meta = config[section] ?? config.tickets;
  const load = async () => {
    if (section === "ai-insights") {
      const [reports, dashboard] = await Promise.all([
        fetch("/api/reports").then((r) => r.json()),
        fetch("/api/dashboard").then((r) => r.json()),
      ]);
      setReport({ reports, dashboard });
      return;
    }
    if (section === "settings") return;
    if (section === "users") {
      const [tenants, technicians] = await Promise.all([
        fetch("/api/tenants").then((r) => r.json()),
        fetch("/api/technicians").then((r) => r.json()),
      ]);
      setData([
        ...(Array.isArray(tenants) ? tenants : []).map((item) => ({ ...item, userType: "TENANT" })),
        ...(Array.isArray(technicians) ? technicians : []).map((item) => ({ ...item, userType: "TECHNICIAN" })),
      ]);
      return;
    }
    const url =
      section === "requests"
        ? "/api/requests?view=admin"
        : section === "tickets"
          ? "/api/tickets?view=active"
          : endpoint(section);
    const result = await fetch(url).then((r) => r.json());
    const rows = Array.isArray(result) ? result : (result.tickets ?? []);
    setData(rows);
  };
  useEffect(() => {
    setSection(initialSection);
  }, [initialSection]);
  useEffect(() => {
    if (section) load();
  }, [section]);
  const save = async (payload: Record<string, unknown>, confirmed = false) => {
    if (editing && !confirmed) {
      askConfirm(
        "Confirm update",
        `Save changes to this ${meta.singular}?`,
        () => save(payload, true),
      );
      return;
    }
    const id = editing?.id;
    const response = await fetch(
      id ? `${endpoint(section)}/${id}` : endpoint(section),
      {
        method: id ? "PATCH" : "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      },
    );
    if (!response.ok) {
      const result = await response.json();
      setNotice(result.error ?? "Unable to save record");
      return;
    }
    setNotice(`${meta.singular} saved successfully.`);
    setEditing(null);
    setCreating(false);
    load();
  };
  const convert = async (record: any, payload: Record<string, unknown>) => {
    const response = await fetch(`/api/requests/${record.id}/convert`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      const result = await response.json();
      setNotice(result.error ?? "Unable to create ticket");
      return;
    }
    setNotice("Request converted to ticket.");
    setEditing(null);
    setSelectedTicket(null);
    load();
  };
  const remove = async (item: any) => {
    askConfirm(
      "Confirm delete",
      `Delete this ${meta.singular}? This action cannot be undone.`,
      () => executeRemove(item),
    );
  };
  const executeRemove = async (item: any) => {
    const response = await fetch(`${endpoint(section)}/${item.id}`, {
      method: "DELETE",
    });
    if (response.ok) {
      setNotice(`${meta.singular} deleted.`);
      load();
    } else
      setNotice((await response.json()).error ?? "Unable to delete record");
  };
  return (
    <AdminShell active={meta.title}>
      <div className="admin-page-head">
        <div>
          <h1>{meta.title}</h1>
          <p>{meta.subtitle}</p>
        </div>
        {["requests", "technicians", "properties", "tenants"].includes(
          section,
        ) && (
          <button
            className="primary-btn"
            onClick={() => {
              setEditing(null);
              setCreating(true);
            }}
          >
            <Plus size={15} />
            {section === "tenants"
              ? "Bulk upload tenants"
              : `New ${meta.singular}`}
          </button>
        )}
      </div>
      {notice && (
        <div className="admin-notice">
          {toTitleCase(notice)}
          <button onClick={() => setNotice("")}>
            <X size={14} />
          </button>
        </div>
      )}
      {section === "ai-insights" ? (
        <Insights report={report} />
      ) : section === "settings" ? (
        <SettingsPanel />
      ) : section === "users" ? (
        <UsersManagement data={data} onUpdated={load} />
      ) : section === "requests" || section === "tickets" ? (
        <MaintenanceTable
          section={section}
          data={data}
          onEdit={setEditing}
          onDelete={remove}
          onOpen={setSelectedTicket}
        />
      ) : section === "technicians" ? (
        <TechnicianTable data={data} onEdit={setEditing} onDelete={remove} />
      ) : section === "tenants" ? (
        <TenantTable data={data} onOpen={setSelectedTenant} onDelete={remove} />
      ) : (
        <RecordList data={data} onEdit={setEditing} onDelete={remove} />
      )}{" "}
      {(creating || editing) &&
        (section === "tickets" ? (
          <TicketEditor
            record={editing}
            mode="ticket"
            onClose={() => {
              setCreating(false);
              setEditing(null);
            }}
            onConvert={(payload) =>
              editing &&
              save({
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
          />
        ) : section === "requests" ? (
          <TicketEditor
            record={editing}
            onClose={() => {
              setCreating(false);
              setEditing(null);
            }}
            onConvert={(payload) => editing && convert(editing, payload)}
          />
        ) : section === "tenants" ? (
          <TenantUpload
            onClose={() => {
              setCreating(false);
              setEditing(null);
            }}
            onComplete={() => {
              setCreating(false);
              load();
            }}
          />
        ) : (
          <RecordForm
            section={section}
            record={editing}
            onClose={() => {
              setCreating(false);
              setEditing(null);
            }}
            onSave={save}
          />
        ))}
      {selectedTicket &&
        (section === "requests" ? (
          <RequestDetails
            record={selectedTicket}
            onClose={() => setSelectedTicket(null)}
            onEdit={() =>
              askConfirm(
                "Confirm edit",
                "Open this ticket for editing?",
                () => {
                  setSelectedTicket(null);
                  setEditing(selectedTicket);
                },
              )
            }
          />
        ) : (
          <TicketDetails
            record={selectedTicket}
            onClose={() => setSelectedTicket(null)}
            onEdit={() =>
              askConfirm(
                "Confirm edit",
                "Open this ticket for editing?",
                () => {
                  setSelectedTicket(null);
                  setEditing(selectedTicket);
                },
              )
            }
          />
        ))}
      {selectedTenant && (
        <TenantEditor
          record={selectedTenant}
          onClose={() => setSelectedTenant(null)}
          onSaved={() => {
            setSelectedTenant(null);
            load();
          }}
          onConfirm={askConfirm}
        />
      )}
      {confirm && (
        <ConfirmDialog
          title={confirm.title}
          message={confirm.message}
          onCancel={() => setConfirm(null)}
          onConfirm={() => {
            const action = confirm.action;
            setConfirm(null);
            action();
          }}
        />
      )}
    </AdminShell>
  );
}

function TechnicianTable({
  data,
  onEdit,
  onDelete,
}: {
  data: any[];
  onEdit: (item: any) => void;
  onDelete: (item: any) => void;
}) {
  return (
    <div className="admin-card data-card technician-table-card">
      <div className="data-toolbar">
        <div className="search">
          <span>⌕</span>
          <input placeholder="Search technicians..." />
        </div>
        <span className="record-count">{data.length} technicians</span>
      </div>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Technician</th>
              <th>Phone</th>
              <th>Skills</th>
              <th>Availability</th>
              <th>Workload</th>
              <th>Status</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {data.map((item, i) => {
              const available =
                (item.availability ?? "AVAILABLE") === "AVAILABLE";
              return (
                <tr
                  key={item.id ?? i}
                  className="ticket-row"
                  onClick={() => onEdit(item)}
                >
                  <td>
                    <b>{item.user?.name ?? item.name}</b>
                    <small>{item.user?.email ?? "No email"}</small>
                  </td>
                  <td>{item.phone ?? "—"}</td>
                  <td>
                    <div className="skill-list">
                      {(item.skills ?? []).map((skill: any) => (
                        <span key={skill.id ?? skill.name}>{skill.name}</span>
                      ))}
                    </div>
                  </td>
                  <td>
                    <span
                      className={`availability-indicator ${available ? "available" : "unavailable"}`}
                    >
                      <i />
                      {available ? "Available" : "Unavailable"}
                    </span>
                  </td>
                  <td>
                    {item.assignments?.length ?? item.workload ?? 0} active
                  </td>
                  <td>
                    <span
                      className={`status ${item.active === false ? "inactive" : "active"}`}
                    >
                      {item.active === false ? "Inactive" : "Active"}
                    </span>
                  </td>
                  <td>
                    <div className="row-actions">
                      <button
                        aria-label="Delete technician"
                        onClick={(event) => {
                          event.stopPropagation();
                          onDelete(item);
                        }}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function UsersManagement({
  data,
  onUpdated,
}: {
  data: any[];
  onUpdated: () => void;
}) {
  const [tab, setTab] = useState<"TENANT" | "TECHNICIAN">("TENANT");
  const [selected, setSelected] = useState<any | null>(null);
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const rows = data.filter((item) => item.userType === tab);

  async function changePassword(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    const response = await fetch("/api/users/password", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ userId: selected.user.id, password }),
    });
    const result = await response.json();
    setBusy(false);
    if (!response.ok) {
      setMessage(result.error ?? "Unable to update password.");
      return;
    }
    setMessage("Password updated successfully.");
    setPassword("");
    setSelected(null);
    onUpdated();
  }

  return (
    <div className="users-management">
      <div className="user-tabs" role="tablist">
        {(["TENANT", "TECHNICIAN"] as const).map((role) => (
          <button
            key={role}
            className={tab === role ? "active" : ""}
            onClick={() => {
              setTab(role);
              setSelected(null);
              setMessage("");
            }}
          >
            {role === "TENANT" ? "Tenants" : "Technicians"}
            <span>{data.filter((item) => item.userType === role).length}</span>
          </button>
        ))}
      </div>
      <div className="admin-card data-card user-table-card">
        <div className="data-toolbar">
          <div>
            <b>{tab === "TENANT" ? "Tenant accounts" : "Technician accounts"}</b>
            <small>Change login passwords securely</small>
          </div>
          <span className="record-count">{rows.length} users</span>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>User</th>
                <th>Email</th>
                <th>Status</th>
                <th>Access</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((item) => {
                const active =
                  item.userType === "TENANT"
                    ? item.status === "ACTIVE" && !item.deletedAt
                    : item.active !== false && !item.deletedAt;
                return (
                <tr key={item.user?.id ?? item.id}>
                  <td><b>{item.user?.name ?? "Unnamed user"}</b></td>
                  <td>{item.user?.email ?? "No email"}</td>
                  <td>
                    <span className={`status ${active ? "active" : "inactive"}`}>
                      {active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td>
                    <button
                      className="password-action"
                      disabled={!active}
                      onClick={() => setSelected(item)}
                    >
                      <KeyRound size={14} /> {active ? "Change password" : "Access disabled"}
                    </button>
                  </td>
                </tr>
                );
              })}
            </tbody>
          </table>
          {!rows.length && <div className="empty">No users found.</div>}
        </div>
      </div>
      {selected && (
        <div className="modal-backdrop" onClick={() => setSelected(null)}>
          <div className="modal password-modal" onClick={(event) => event.stopPropagation()}>
            <div className="modal-head">
              <div>
                <span className="eyebrow"><KeyRound size={13} /> Account security</span>
                <h2>Change password</h2>
                <p>{selected.user?.name} · {selected.user?.email}</p>
              </div>
              <button className="close-btn" onClick={() => setSelected(null)}><X size={18} /></button>
            </div>
            <form onSubmit={changePassword}>
              <label>
                New password
                <input
                  type="password"
                  minLength={8}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="At least 8 characters"
                  required
                />
              </label>
              {message && <div className="admin-notice">{toTitleCase(message)}</div>}
              <div className="modal-actions">
                <button type="button" className="ghost-btn" onClick={() => setSelected(null)}>Cancel</button>
                <button className="primary-btn" disabled={busy}>{busy ? "Saving..." : "Update password"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function MaintenanceTable({
  section,
  data,
  onEdit,
  onDelete,
  onOpen,
}: {
  section: string;
  data: any[];
  onEdit: (item: any) => void;
  onDelete: (item: any) => void;
  onOpen: (item: any) => void;
}) {
  const request = section === "requests";
  return (
    <div className="admin-card data-card maintenance-table-card">
      <div className="data-toolbar">
        <div className="search">
          <span>⌕</span>
          <input placeholder={`Search ${section}...`} />
        </div>
        <span className="record-count">{data.length} records</span>
      </div>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>{request ? "Request code" : "Ticket"}</th>
              <th>Property & unit</th>
              <th>Issue</th>
              <th>Severity</th>
              <th>SLA due</th>
              <th>Assigned to</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {data.map((item, i) => {
              const ticket = request ? item.ticket : item;
              const requestRecord = request ? item : null;
              const name =
                ticket?.assignments?.[0]?.technician?.user?.name ??
                "Unassigned";
              return (
                <tr
                  key={item.id ?? i}
                  className="ticket-row"
                  onClick={() =>
                    request ? onEdit(item) : onEdit(ticket ?? item)
                  }
                >
                  <td>
                    <b className="ticket-link">
                      {ticket?.code ?? `REQ-${String(item.id ?? i).slice(-6).toUpperCase()}`}
                    </b>
                    <small>{ticket?.category ?? requestRecord?.category ?? "Pending ticket"}</small>
                  </td>
                  <td>
                    <b>{ticket?.property?.name ?? requestRecord?.property?.name ?? "Property required"}</b>
                    <small>{ticket?.unit?.label ?? requestRecord?.unit?.label ?? "Unit required"}</small>
                  </td>
                  <td className="issue-cell">{ticket?.issue ?? item.title}</td>
                  <td>
                    <span
                      className={`priority ${(ticket?.priority ?? requestRecord?.priority ?? "MEDIUM").toLowerCase()}`}
                    >
                      <i />
                      {ticket?.priority ?? requestRecord?.priority ?? "Pending"}
                    </span>
                  </td>
                  <td>
                    {ticket?.slaDue
                      ? new Date(ticket.slaDue).toLocaleDateString()
                      : "Not set"}
                  </td>
                  <td>
                    <div className="assignee">
                      <span
                        className={
                          name === "Unassigned"
                            ? "mini-avatar empty"
                            : "mini-avatar"
                        }
                      >
                        {name === "Unassigned"
                          ? "?"
                          : name
                              .split(" ")
                              .map((x: string) => x[0])
                              .join("")
                              .slice(0, 2)}
                      </span>
                      {name}
                    </div>
                  </td>
                  <td>
                    <span
                      className={`status ${(ticket?.status ?? "OPEN").toLowerCase().replaceAll("_", "-")}`}
                    >
                      {ticket?.status ?? requestRecord?.status ?? "REQUEST"}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {!data.length && <div className="empty">No records found.</div>}
      </div>
    </div>
  );
}

function RecordList({
  data,
  onEdit,
  onDelete,
}: {
  data: any[];
  onEdit: (item: any) => void;
  onDelete: (item: any) => void;
}) {
  return (
    <div className="admin-card data-card property-table-card">
      <div className="data-toolbar">
        <div className="search">
          <span>⌕</span>
          <input placeholder="Search properties..." />
        </div>
        <span className="record-count">{data.length} properties</span>
      </div>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Address</th>
              <th>City</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {data.map((item, i) => {
              const inactive = item.status === "INACTIVE" || item.deletedAt;
              return (
                <tr
                  className="ticket-row"
                  key={item.id ?? i}
                  onClick={() => onEdit(item)}
                >
                  <td>
                    <b>{item.name ?? "Unnamed property"}</b>
                  </td>
                  <td>{item.address ?? "—"}</td>
                  <td>{item.city ?? "Riyadh"}</td>
                  <td>
                    <div className="record-actions">
                      {!inactive && (
                        <button
                          className="record-action delete"
                          aria-label="Delete property"
                          onClick={(event) => {
                            event.stopPropagation();
                            onDelete(item);
                          }}
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {!data.length && <div className="empty">No properties found.</div>}
      </div>
    </div>
  );
}

function RecordForm({
  section,
  record,
  onClose,
  onSave,
}: {
  section: string;
  record: any;
  onClose: () => void;
  onSave: (payload: Record<string, unknown>) => void;
}) {
  const initial: any =
    section === "requests"
      ? { title: record?.title ?? "", description: record?.description ?? "" }
      : section === "technicians"
        ? {
            name: record?.user?.name ?? "",
            phone: record?.phone ?? "",
            availability: record?.availability ?? "AVAILABLE",
            skills: record?.skills?.map((x: any) => x.name) ?? [],
          }
        : {
            name: record?.name ?? "",
            address: record?.address ?? "",
            city: record?.city ?? "Riyadh",
          };
  const [form, setForm] = useState<any>(initial);
  const dirty = JSON.stringify(form) !== JSON.stringify(initial);
  const set = (key: string, value: any) =>
    setForm((current: any) => ({ ...current, [key]: value }));
  return (
    <div className="modal-backdrop">
      <div className="modal">
        <div className="modal-head">
          <div>
            <span className="eyebrow">
              <Pencil size={13} /> Record editor
            </span>
            <h2>
              {record ? "Edit" : "Create"} {section.slice(0, -1)}
            </h2>
          </div>
          <button className="close-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            onSave(form);
          }}
        >
          {section === "requests" && (
            <>
              <Field
                label="Title"
                value={form.title}
                onChange={(v) => set("title", v)}
              />
              <Field
                label="Description"
                value={form.description}
                onChange={(v) => set("description", v)}
                area
              />
            </>
          )}
          {section === "technicians" && (
            <>
              <Field
                label="Name"
                value={form.name}
                onChange={(v) => set("name", v)}
              />
              <Field
                label="Phone"
                value={form.phone}
                onChange={(v) => set("phone", v)}
              />
              <SkillMultiSelect
                value={form.skills}
                onChange={(value) => set("skills", value)}
              />
              <label>
                Availability
                <select
                  value={form.availability}
                  onChange={(e) => set("availability", e.target.value)}
                >
                  <option>AVAILABLE</option>
                  <option>BUSY</option>
                  <option>OFFLINE</option>
                </select>
              </label>
            </>
          )}
          {section === "properties" && (
            <>
              <Field
                label="Name"
                value={form.name}
                onChange={(v) => set("name", v)}
              />
              <Field
                label="Address"
                value={form.address}
                onChange={(v) => set("address", v)}
              />
              <Field
                label="City"
                value={form.city}
                onChange={(v) => set("city", v)}
              />
            </>
          )}
          <div className="modal-actions">
            <button type="button" className="ghost-btn" onClick={onClose}>
              Cancel
            </button>
            <button className="primary-btn" disabled={!!record && !dirty}>
              {record ? "Update" : "Save"} changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function TicketForm({
  record,
  onClose,
  onSave,
}: {
  record: any;
  onClose: () => void;
  onSave: (payload: Record<string, unknown>) => void;
}) {
  const [techs, setTechs] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [properties, setProperties] = useState<any[]>([]);
  const initial = {
    issue: record?.issue ?? "",
    description: record?.request?.description ?? "",
    category: record?.category ?? "General",
    priority: record?.priority ?? "MEDIUM",
    technicianId: record?.assignments?.[0]?.technicianId ?? "",
    propertyId: record?.propertyId ?? "",
    unitId: record?.unitId ?? "",
  };
  const [form, setForm] = useState(initial);
  const dirty = JSON.stringify(form) !== JSON.stringify(initial);
  useEffect(() => {
    Promise.all([
      fetch("/api/technicians").then((r) => r.json()),
      fetch("/api/properties").then((r) => r.json()),
    ]).then(([technicians, propertyRows]) => {
      setTechs(Array.isArray(technicians) ? technicians : []);
      setProperties(Array.isArray(propertyRows) ? propertyRows : []);
    });
  }, []);
  const selectedProperty = properties.find((property) => property.id === form.propertyId);
  const matches = techs.filter((t) => {
    const skills = (t.skills ?? []).map((s: any) => s.name.toLowerCase());
    return (
      (t.availability ?? "AVAILABLE") === "AVAILABLE" &&
      (skills.includes(form.category.toLowerCase()) || skills.includes("general"))
    );
  });
  const selected = matches.find((t) => t.id === form.technicianId);
  const set = (key: string, value: string) =>
    setForm((current) => ({
      ...current,
      [key]: value,
      ...(key === "category" ? { technicianId: "" } : {}),
    }));
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal request-convert-modal"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="modal-head">
          <div>
            <span className="eyebrow">
              <Sparkles size={13} /> Request triage
            </span>
            <h2>{record ? "Edit ticket" : "Create ticket"}</h2>
            <p>Review the complaint, then complete the ticket details below.</p>
          </div>
          <button className="close-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            onSave(form);
          }}
        >
          <div className="request-fields">
            <Field
              label="Complaint"
              value={form.issue}
              onChange={(v) => set("issue", v)}
            />
            <Field
              label="Description"
              value={form.description}
              onChange={(v) => set("description", v)}
              area
            />
          </div>
          <div className="form-grid">
          <Field
            label="Category"
            value={form.category}
            onChange={(v) => set("category", v)}
          />
          <label>
            Priority
            <select
              value={form.priority}
              onChange={(e) => set("priority", e.target.value)}
            >
              {["EMERGENCY", "HIGH", "MEDIUM", "LOW"].map((x) => (
                <option key={x}>{x}</option>
              ))}
            </select>
          </label>
          <label className="picker-label">
            Assigned to
            <div className="technician-picker">
              <button
                type="button"
                className="technician-picker-trigger"
                onClick={() => setOpen((value) => !value)}
              >
                <span>{selected?.user?.name ?? "Unassigned"}</span>
                <b>{open ? "⌃" : "⌄"}</b>
              </button>
              {open && (
                <div className="technician-picker-menu">
                  <button
                    type="button"
                    className="technician-option unassigned"
                    onClick={() => {
                      set("technicianId", "");
                      setOpen(false);
                    }}
                  >
                    <span className="tech-name">Unassigned</span>
                    <span className="tech-category">
                      No technician selected
                    </span>
                  </button>
                  {matches.map((tech) => (
                    <button
                      type="button"
                      className="technician-option"
                      key={tech.id}
                      onClick={() => {
                        set("technicianId", tech.id);
                        setOpen(false);
                      }}
                    >
                      <span className="tech-name">
                        {tech.user?.name ?? "Unnamed technician"}
                      </span>
                      <span className="tech-category">
                        {(tech.skills ?? [])
                          .map((s: any) => s.name)
                          .join(" · ")}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <small className="field-hint">
              Showing technicians skilled for {form.category} and general
              maintenance.
            </small>
          </label>
          <label>
            Property
            <select
              value={form.propertyId}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  propertyId: event.target.value,
                  unitId:
                    properties.find((property) => property.id === event.target.value)
                      ?.units?.[0]?.id ?? "",
                }))
              }
              required
            >
              <option value="">Select property</option>
              {properties.map((property) => (
                <option key={property.id} value={property.id}>{property.name}</option>
              ))}
            </select>
          </label>
          <label>
            Unit
            <select
              value={form.unitId}
              onChange={(event) => set("unitId", event.target.value)}
              required
            >
              <option value="">Select unit</option>
              {(selectedProperty?.units ?? []).map((unit: any) => (
                <option key={unit.id} value={unit.id}>{unit.label}</option>
              ))}
            </select>
          </label>
          </div>
          <div className="modal-actions">
            <button type="button" className="ghost-btn" onClick={onClose}>
              Cancel
            </button>
            <button className="primary-btn" disabled={!!record && !dirty}>
              {record ? "Update" : "Save"} changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  area = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  area?: boolean;
}) {
  return (
    <label>
      {label}
      {area ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required
        />
      ) : (
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required
        />
      )}
    </label>
  );
}
function Insights({ report }: { report: any }) {
  return (
    <div className="insight-grid">
      <div className="admin-card">
        <h2>
          <Sparkles size={16} /> Queue intelligence
        </h2>
        <div className="insight-number">
          {report?.dashboard?.kpis?.opened ?? "—"}
          <small>open tickets in the live queue</small>
        </div>
      </div>
      <div className="admin-card">
        <h2>Frequent categories</h2>
        {(report?.reports?.byCategory ?? []).map((x: any) => (
          <div className="metric-row" key={x.category}>
            <span>{x.category}</span>
            <b>{x._count._all}</b>
          </div>
        ))}
      </div>
    </div>
  );
}
function SettingsPanel() {
  return (
    <div className="settings-grid">
      <div className="admin-card">
        <h2>
          <Settings size={16} /> Workspace settings
        </h2>
        {[
          "Require admin approval for assignment",
          "Flag emergency tickets for human review",
          "Send technician notifications",
        ].map((label) => (
          <label className="setting-row" key={label}>
            <span>{label}</span>
            <input type="checkbox" defaultChecked />
          </label>
        ))}
      </div>
    </div>
  );
}

function TicketDetails({
  record,
  onClose,
  onEdit,
}: {
  record: any;
  onClose: () => void;
  onEdit: () => void;
}) {
  const ticket = record?.ticket ?? record;
  const assigned =
    ticket?.assignments?.[0]?.technician?.user?.name ?? "Unassigned";
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal ticket-details-modal"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="modal-head">
          <div>
            <span className="eyebrow">
              <FileText size={13} /> Ticket details
            </span>
            <h2>{ticket?.code ?? "Maintenance ticket"}</h2>
            <p>
              {ticket?.issue ??
                record?.title ??
                "No issue description provided."}
            </p>
          </div>
          <button className="close-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>
        <div className="ticket-detail-grid">
          <div>
            <small>Property</small>
            <b>{ticket?.property?.name ?? "Property required"}</b>
          </div>
          <div>
            <small>Unit</small>
            <b>{ticket?.unit?.label ?? "Unit required"}</b>
          </div>
          <div>
            <small>Category</small>
            <b>{ticket?.category ?? "General"}</b>
          </div>
          <div>
            <small>Priority</small>
            <b>{ticket?.priority ?? "Pending"}</b>
          </div>
          <div>
            <small>Status</small>
            <b>{ticket?.status ?? "REQUEST"}</b>
          </div>
          <div>
            <small>Assigned to</small>
            <b>{assigned}</b>
          </div>
        </div>
        <div className="modal-actions">
          <button type="button" className="ghost-btn" onClick={onClose}>
            Close
          </button>
          <button type="button" className="primary-btn" onClick={onEdit}>
            <Pencil size={14} /> Edit ticket
          </button>
        </div>
      </div>
    </div>
  );
}

function RequestDetails({
  record,
  onClose,
  onEdit,
}: {
  record: any;
  onClose: () => void;
  onEdit: () => void;
}) {
  const ticket = record?.ticket;
  const assigned =
    ticket?.assignments?.[0]?.technician?.user?.name ?? "Unassigned";
  const status = ticket?.status ?? record?.status ?? "PENDING";
  const property = ticket?.property ?? record?.property;
  const unit = ticket?.unit ?? record?.unit;
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal ticket-details-modal"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="modal-head">
          <div>
            <span className="eyebrow">
              <ClipboardList size={13} /> Customer request
            </span>
            <h2>{record?.title ?? "Maintenance request"}</h2>
            <p>{record?.description ?? "No description provided."}</p>
          </div>
          <button className="close-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>
        <div className="request-status-banner">
          <span className={`status ${status.toLowerCase().replaceAll("_", "-")}`}>
            {status}
          </span>
          <span>
            {ticket
              ? "Linked maintenance ticket is active in the workflow"
              : "Waiting for ticket creation"}
          </span>
        </div>
        {record?.attachments?.length > 0 && (
          <div className="request-attachments">
            <small>Complaint photo</small>
            <div>
              {record.attachments.map((attachment: any) => (
                <a
                  href={attachment.url}
                  target="_blank"
                  rel="noreferrer"
                  key={attachment.id}
                >
                  <img src={attachment.url} alt={attachment.filename} />
                </a>
              ))}
            </div>
          </div>
        )}
        <div className="ticket-detail-grid">
          <div>
            <small>Property</small>
            <b>{property?.name ?? "Property not assigned"}</b>
          </div>
          <div>
            <small>Unit</small>
            <b>{unit?.label ?? "Unit not assigned"}</b>
          </div>
          <div>
            <small>Category</small>
            <b>{ticket?.category ?? record?.category ?? "Pending triage"}</b>
          </div>
          <div>
            <small>Priority</small>
            <b>{ticket?.priority ?? record?.priority ?? "Pending"}</b>
          </div>
          <div>
            <small>SLA due</small>
            <b>
              {ticket?.slaDue
                ? new Date(ticket.slaDue).toLocaleString()
                : "Not set"}
            </b>
          </div>
          <div>
            <small>Assigned to</small>
            <b>{assigned}</b>
          </div>
        </div>
        <div className="modal-actions">
          <button type="button" className="ghost-btn" onClick={onClose}>
            Close
          </button>
          <button
            type="button"
            className="primary-btn large-action"
            onClick={onEdit}
          >
            <Pencil size={14} /> {ticket ? "Edit ticket" : "Create as ticket"}
          </button>
        </div>
      </div>
    </div>
  );
}

export function TicketEditor({
  record,
  mode = "request",
  onClose,
  onConvert,
  secondaryAction,
  secondaryLabel,
  reopenAction,
}: {
  record: any;
  mode?: "request" | "ticket";
  onClose: () => void;
  onConvert: (payload: Record<string, unknown>) => void;
  secondaryAction?: () => void | Promise<void>;
  secondaryLabel?: string;
  reopenAction?: () => void | Promise<void>;
}) {
  const source = record?.ticket ?? record;
  const isClosed = mode === "ticket" && source?.status === "CLOSED";
  const [properties, setProperties] = useState<any[]>([]);
  const [form, setForm] = useState({
    title: record?.title ?? record?.issue ?? "",
    description: record?.description ?? record?.request?.description ?? "",
    propertyId: source?.propertyId ?? "",
    unitId: source?.unitId ?? "",
    category: source?.category ?? "General",
    priority: source?.priority ?? "MEDIUM",
    technicianId: source?.assignments?.[0]?.technicianId ?? "",
    slaDue: source?.slaDue
      ? new Date(source.slaDue).toISOString().slice(0, 16)
      : "",
  });
  useEffect(() => {
    fetch("/api/properties")
      .then((response) => (response.ok ? response.json() : []))
      .then((rows) => setProperties(Array.isArray(rows) ? rows : []));
  }, []);
  const selectedProperty = properties.find((property) => property.id === form.propertyId);
  const set = (key: string, value: string) =>
    setForm((current) => ({
      ...current,
      [key]: value,
      ...(key === "propertyId"
        ? {
            unitId:
              properties.find((property) => property.id === value)?.units?.[0]
                ?.id ?? "",
          }
        : {}),
    }));
  return (
    <div className="modal-backdrop">
      <div className="modal request-convert-modal">
        <div className="modal-head">
          <div>
            <span className="eyebrow">
              <Sparkles size={13} /> Request triage
            </span>
            <h2>{mode === "ticket" ? "Edit ticket" : "Create ticket from request"}</h2>
            <p>Review the complaint, then complete the ticket details below.</p>
          </div>
          <button className="close-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>
        <div className="request-source">
          <b>Customer complaint</b>
          <span>
            These fields are carried into the maintenance ticket and can be
            corrected by the administrator.
          </span>
        </div>
        <div className="request-fields">
          <Field
            label="Complaint"
            value={form.title}
            onChange={(v) => set("title", v)}
          />
          <Field
            label="Description"
            value={form.description}
            onChange={(v) => set("description", v)}
            area
          />
        </div>
        <div className="form-grid">
          <label>
            Property
            <select
              value={form.propertyId}
              onChange={(event) => set("propertyId", event.target.value)}
              required
            >
              <option value="">Select property</option>
              {properties.map((property) => (
                <option key={property.id} value={property.id}>
                  {property.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            Unit
            <select
              value={form.unitId}
              onChange={(event) => setForm((current) => ({ ...current, unitId: event.target.value }))}
              required
            >
              <option value="">Select unit</option>
              {(selectedProperty?.units ?? []).map((unit: any) => (
                <option key={unit.id} value={unit.id}>
                  {unit.label}
                </option>
              ))}
            </select>
          </label>
          <Field
            label="Category"
            value={form.category}
            onChange={(v) => set("category", v)}
          />
          <label>
            Priority
            <select
              value={form.priority}
              onChange={(e) => set("priority", e.target.value)}
            >
              {["EMERGENCY", "HIGH", "MEDIUM", "LOW"].map((x) => (
                <option key={x}>{x}</option>
              ))}
            </select>
          </label>
          <TechnicianPicker
            value={form.technicianId}
            onChange={(v) => set("technicianId", v)}
            category={form.category}
          />
          <label>
            SLA due date
            <input
              type="datetime-local"
              value={form.slaDue}
              onChange={(e) => set("slaDue", e.target.value)}
            />
          </label>
        </div>
        <div className="modal-actions">
          <button type="button" className="ghost-btn" onClick={onClose}>
            Cancel
          </button>
          {secondaryAction && secondaryLabel && (
            <button
              type="button"
              className="ghost-btn"
              onClick={secondaryAction}
            >
              {secondaryLabel}
            </button>
          )}
          {isClosed ? (
            <button
              type="button"
              className="primary-btn large-action"
              onClick={reopenAction}
            >
              <Plus size={16} /> Reopen ticket
            </button>
          ) : (
            <button
              type="button"
              className="primary-btn large-action"
              onClick={() => onConvert(form)}
            >
              <Plus size={16} /> {mode === "ticket" ? "Update ticket" : "Create as ticket"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
function TechnicianPicker({
  value,
  onChange,
  category,
}: {
  value: string;
  onChange: (value: string) => void;
  category: string;
}) {
  const [techs, setTechs] = useState<any[]>([]);
  useEffect(() => {
    fetch("/api/technicians")
      .then((r) => r.json())
      .then(setTechs);
  }, []);
  const matches = techs.filter((tech) => {
    const skills = (tech.skills ?? []).map((skill: any) =>
      skill.name.toLowerCase(),
    );
    return (
      (tech.availability ?? "AVAILABLE") === "AVAILABLE" &&
      (skills.includes(category.toLowerCase()) || skills.includes("general"))
    );
  });
  return (
    <label>
      Assign technician
      <select value={value} onChange={(event) => onChange(event.target.value)}>
        <option value="">Unassigned</option>
        {matches.map((tech) => (
          <option key={tech.id} value={tech.id}>
            {tech.user?.name ?? "Unnamed technician"} ·{" "}
            {(tech.skills ?? []).map((skill: any) => skill.name).join(", ")} ·{" "}
          </option>
        ))}
      </select>
    </label>
  );
}
function TenantTable({
  data,
  onOpen,
  onDelete,
}: {
  data: any[];
  onOpen: (item: any) => void;
  onDelete: (item: any) => void;
}) {
  return (
    <div className="admin-card data-card tenant-table-card">
      <div className="data-toolbar">
        <div className="search">
          <span>⌕</span>
          <input placeholder="Search tenants..." />
        </div>
        <span className="record-count">{data.length} tenants</span>
      </div>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Tenant name</th>
              <th>Mobile</th>
              <th>Email</th>
              <th>Property</th>
              <th>Unit</th>
              <th>Occupancy</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {data.map((item, i) => {
              const inactive = item.status !== "ACTIVE" || item.deletedAt;
              return (
                <tr
                  key={item.id ?? i}
                  className="ticket-row"
                  onClick={() => onOpen(item)}
                >
                  <td>
                    <b>{item.user?.name ?? "Unnamed tenant"}</b>
                  </td>
                  <td>{item.user?.phone ?? "No mobile"}</td>
                  <td>{item.user?.email ?? "No email"}</td>
                  <td>
                    {item.property?.name ??
                      item.unit?.property?.name ??
                      "Property unavailable"}
                  </td>
                  <td>{item.unit?.label ?? "Unit unavailable"}</td>
                  <td>
                    <span
                      className={`status ${inactive ? "inactive" : "active"}`}
                    >
                      {inactive ? "Inactive" : "Active"}
                    </span>
                  </td>
                  <td>
                    <div className="record-actions">
                      {!inactive && (
                        <button
                          className="record-action delete"
                          aria-label="Delete tenant"
                          onClick={(event) => {
                            event.stopPropagation();
                            onDelete(item);
                          }}
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {!data.length && <div className="empty">No tenants imported yet.</div>}
      </div>
    </div>
  );
}

function TenantUpload({
  onClose,
  onComplete,
}: {
  onClose: () => void;
  onComplete: () => void;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const importFile = async () => {
    if (!file) return;
    setBusy(true);
    setMessage("");
    try {
      const text = await file.text();
      const lines = text
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter(Boolean);
      if (lines.length < 2)
        throw new Error("CSV must include a header and at least one row.");
      const headers = lines[0]
        .split(",")
        .map((value) => value.trim().toLowerCase());
      const required = ["tenantname", "email", "phone", "propertyname", "unit"];
      if (required.some((value) => !headers.includes(value)))
        throw new Error(
          "Headers required: tenantName,email,phone,propertyName,unit",
        );
      const rows = lines.slice(1).map((line) => {
        const values = line.split(",").map((value) => value.trim());
        return Object.fromEntries(
          headers.map((header, index) => [header, values[index] ?? ""]),
        );
      });
      const response = await fetch("/api/tenants", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ rows }),
      });
      const result = await response.json();
      if (!response.ok)
        throw new Error(result.error ?? "Unable to import tenants");
      setMessage(`${result.imported} tenant records imported.`);
      onComplete();
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Unable to import tenants",
      );
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="modal-backdrop">
      <div className="modal tenant-upload-modal">
        <div className="modal-head">
          <div>
            <span className="eyebrow">
              <Users size={13} /> Tenant import
            </span>
            <h2>Bulk upload tenants</h2>
            <p>Import resident assignments using a CSV file.</p>
          </div>
          <button className="close-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>
        <div className="upload-instructions">
          <b>CSV columns</b>
          <code>tenantName,email,phone,propertyName,unit</code>
          <span>
            Existing tenants are updated by email. New tenant accounts receive a
            temporary password.
          </span>
        </div>
        <label className="file-drop">
          Choose CSV file
          <input
            type="file"
            accept=".csv,text/csv"
            onChange={(event) => setFile(event.target.files?.[0] ?? null)}
          />
          <strong>{file?.name ?? "No file selected"}</strong>
        </label>
        {message && <div className="admin-notice">{toTitleCase(message)}</div>}
        <div className="modal-actions">
          <button type="button" className="ghost-btn" onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            className="primary-btn large-action"
            disabled={!file || busy}
            onClick={importFile}
          >
            {busy ? "Importing..." : "Import tenants"}
          </button>
        </div>
      </div>
    </div>
  );
}
function TenantEditor({
  record,
  onClose,
  onSaved,
  onConfirm,
}: {
  record: any;
  onClose: () => void;
  onSaved: () => void;
  onConfirm: (title: string, message: string, action: () => void) => void;
}) {
  const initial = {
    name: record.user?.name ?? "",
    email: record.user?.email ?? "",
    phone: record.user?.phone ?? "",
    propertyName: record.property?.name ?? record.unit?.property?.name ?? "",
    unit: record.unit?.label ?? "",
  };
  const [form, setForm] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const dirty = JSON.stringify(form) !== JSON.stringify(initial);
  const set = (key: string, value: string) =>
    setForm((current) => ({ ...current, [key]: value }));
  const update = async (confirmed = false) => {
    if (!confirmed) {
      onConfirm("Confirm update", "Save changes to this tenant?", () =>
        update(true),
      );
      return;
    }
    setBusy(true);
    setError("");
    const response = await fetch(`/api/tenants/${record.id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(form),
    });
    if (!response.ok) {
      const result = await response.json();
      setError(result.error ?? "Unable to update tenant");
      setBusy(false);
      return;
    }
    setBusy(false);
    onSaved();
  };
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal tenant-editor-modal"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="modal-head">
          <div>
            <span className="eyebrow">
              <Pencil size={13} /> Tenant editor
            </span>
            <h2>Edit tenant</h2>
            <p>Update the resident contact and property assignment.</p>
          </div>
          <button className="close-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>
        <div className="form-grid">
          <Field
            label="Tenant name"
            value={form.name}
            onChange={(value) => set("name", value)}
          />
          <Field
            label="Mobile number"
            value={form.phone}
            onChange={(value) => set("phone", value)}
          />
          <Field
            label="Email"
            value={form.email}
            onChange={(value) => set("email", value)}
          />
          <Field
            label="Property"
            value={form.propertyName}
            onChange={(value) => set("propertyName", value)}
          />
          <Field
            label="Unit"
            value={form.unit}
            onChange={(value) => set("unit", value)}
          />
        </div>
        {error && <div className="form-error">{error}</div>}
        <div className="modal-actions">
          <button type="button" className="ghost-btn" onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            className="primary-btn large-action"
            disabled={!dirty || busy}
            onClick={() => update()}
          >
            {busy ? "Updating..." : "Update tenant"}
          </button>
        </div>
      </div>
    </div>
  );
}
function SkillMultiSelect({
  value,
  onChange,
}: {
  value: string[];
  onChange: (value: string[]) => void;
}) {
  const options = ["HVAC", "Plumbing", "Electrical", "Lift", "General"];
  const toggle = (skill: string) =>
    onChange(
      value.includes(skill)
        ? value.filter((item) => item !== skill)
        : [...value, skill],
    );
  return (
    <div className="skill-picker">
      <span className="skill-picker-label">Skills</span>
      <div className="skill-picker-options">
        {options.map((skill) => (
          <button
            type="button"
            key={skill}
            className={value.includes(skill) ? "selected" : ""}
            onClick={() => toggle(skill)}
          >
            {value.includes(skill) ? "✓ " : ""}
            {skill}
          </button>
        ))}
      </div>
      <small>Select all skills this technician can handle.</small>
    </div>
  );
}
function ConfirmDialog({
  title,
  message,
  onCancel,
  onConfirm,
}: {
  title: string;
  message: string;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <div className="modal-backdrop confirm-backdrop" onClick={onCancel}>
      <div
        className="confirm-dialog"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="confirm-main">
          <div className="confirm-icon">
            <AlertTriangle size={20} />
          </div>
          <div className="confirm-copy">
            <h2>{title}</h2>
            <p>{message}</p>
          </div>
        </div>
        <div className="modal-actions">
          <button type="button" className="ghost-btn" onClick={onCancel}>
            Cancel
          </button>
          <button type="button" className="primary-btn" onClick={onConfirm}>
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
}
