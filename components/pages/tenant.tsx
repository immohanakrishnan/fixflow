"use client";
import { FormEvent, useEffect, useState } from "react";
import { ClipboardList, ImagePlus, LogOut, Plus, Sparkles, Star, X } from "lucide-react";
import { signOut } from "next-auth/react";
type Property = {
  id: string;
  name: string;
  units: { id: string; label: string }[];
};
type Request = {
  id: string;
  title: string;
  description: string;
  submittedAt: string;
  category: string;
  priority: string;
  status: string;
  attachments?: { id: string; filename: string; mimeType: string; url: string }[];
  ticket?: {
    id: string;
    code: string;
    issue: string;
    category: string;
    status: string;
    priority: string;
    billingCompleted?: boolean;
    history?: {
      id: string;
      fromStatus?: string | null;
      toStatus: string;
      note?: string | null;
      createdAt: string;
    }[];
    assignments?: {
      technician?: { phone?: string | null; user?: { name?: string | null } };
    }[];
  };
};
type Comment = {
  id: string;
  body: string;
  createdAt: string;
  author?: { name?: string | null; role?: string | null };
};
export default function TenantPortal() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [requests, setRequests] = useState<Request[]>([]);
  const [propertyId, setPropertyId] = useState("");
  const [unitId, setUnitId] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [attachment, setAttachment] = useState<{
    filename: string;
    mimeType: string;
    url: string;
  } | null>(null);
  const [message, setMessage] = useState("");
  const [selectedRequest, setSelectedRequest] = useState<string | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentText, setCommentText] = useState("");
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [reviewRating, setReviewRating] = useState(0);
  const property = properties.find((p) => p.id === propertyId);
  useEffect(() => {
    Promise.all([
      fetch("/api/properties").then((r) => r.json()),
      fetch("/api/requests").then((r) => r.json()),
    ]).then(([p, r]) => {
      setProperties(p);
      setRequests(r);
      setPropertyId(p[0]?.id ?? "");
      setUnitId(p[0]?.units?.[0]?.id ?? "");
    });
  }, []);
  async function submit(e: FormEvent) {
    e.preventDefault();
    const r = await fetch("/api/requests", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ title, description, propertyId, unitId, attachment }),
    });
    if (r.ok) {
      const created = await r.json();
      const ticket = created.ticket;
      setMessage(
        ticket
          ? `Request classified: ${created.category} · ${created.priority}`
          : `Request submitted: ${created.category} · ${created.priority}`,
      );
      setTitle("");
      setDescription("");
      setAttachment(null);
      setRequests([created, ...requests]);
    } else setMessage("Please check the form and try again.");
  }
  async function selectRequest(request: Request) {
    setSelectedRequest((current) => (current === request.id ? null : request.id));
    if (!request.ticket) return;
    setCommentsLoading(true);
    const response = await fetch(`/api/tickets/${request.ticket.id}/comments`);
    setComments(response.ok ? await response.json() : []);
    setCommentsLoading(false);
  }
  async function submitComment(ticketId: string) {
    if (!commentText.trim()) return;
    const response = await fetch(`/api/tickets/${ticketId}/comments`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ body: commentText.trim() }),
    });
    if (response.ok) {
      setComments([...comments, await response.json()]);
      setCommentText("");
    }
  }
  return (
    <main className="portal">
      <header>
        <div className="portal-brand">
          <div className="brand-mark">
            <Sparkles size={17} />
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
            <Sparkles size={13} /> Resident portal
          </span>
          <h1>How can we help today?</h1>
          <p>
            Tell us what needs attention and our team will take it from there.
          </p>
        </div>
        <div className="portal-grid">
          <section className="portal-card">
            <h2>
              <Plus size={17} /> Submit a request
            </h2>
            <form onSubmit={submit}>
              <label>
                Property
                <select
                  value={propertyId}
                  onChange={(e) => {
                    setPropertyId(e.target.value);
                    setUnitId(
                      properties.find((p) => p.id === e.target.value)?.units[0]
                        ?.id ?? "",
                    );
                  }}
                >
                  {properties.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Unit
                <select
                  value={unitId}
                  onChange={(e) => setUnitId(e.target.value)}
                >
                  {property?.units.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.label}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Issue title
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. AC is not cooling"
                  required
                />
              </label>
              <label>
                Describe the issue
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Include any details that may help our team..."
                  required
                />
              </label>
              <div className="complaint-photo-field">
                <span className="field-label">Complaint photo <small>Optional</small></span>
                <label className="photo-upload" htmlFor="complaint-photo">
                  {attachment ? (
                    <>
                      <img src={attachment.url} alt="Complaint preview" />
                      <span>{attachment.filename}</span>
                      <button
                        type="button"
                        className="remove-photo"
                        aria-label="Remove complaint photo"
                        onClick={(event) => {
                          event.preventDefault();
                          setAttachment(null);
                        }}
                      >
                        <X size={15} />
                      </button>
                    </>
                  ) : (
                    <>
                      <ImagePlus size={20} />
                      <span><b>Click to add a photo</b><small>JPG, PNG up to 5 MB</small></span>
                    </>
                  )}
                  <input
                    id="complaint-photo"
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    capture="environment"
                    onChange={(event) => {
                      const file = event.target.files?.[0];
                      if (!file) return;
                      if (file.size > 5 * 1024 * 1024) {
                        setMessage("Photo must be smaller than 5 MB.");
                        event.currentTarget.value = "";
                        return;
                      }
                      const reader = new FileReader();
                      reader.onload = () => {
                        if (typeof reader.result === "string") {
                          setAttachment({ filename: file.name, mimeType: file.type, url: reader.result });
                        }
                      };
                      reader.readAsDataURL(file);
                    }}
                  />
                </label>
              </div>
              <button className="primary-btn" type="submit">
                <Sparkles size={15} /> Submit request
              </button>
              <small className="ai-triage-hint">
                Gemini AI classifies within the approved category and priority masters.
              </small>
              {message && <div className="portal-message">{message}</div>}
            </form>
          </section>
          <section className="portal-card">
            <h2>
              <ClipboardList size={17} /> My requests
            </h2>
            {requests.map((r) => (
              <div className="request-entry" key={r.id}>
                <button
                  type="button"
                  className="request-row"
                  onClick={() => selectRequest(r)}
                >
                  <div>
                    <b>{r.title}</b>
                    <small>
                      {r.ticket?.code ?? "Pending ticket"} -{" "}
                      {new Date(r.submittedAt).toLocaleDateString()}
                    </small>
                  </div>
                  <span
                    className={`status ${(r.ticket?.status ?? "OPEN").toLowerCase()}`}
                  >
                    {r.ticket?.status ?? r.status ?? "PENDING"}
                  </span>
                </button>
                {selectedRequest === r.id && (
                  <div className="request-details">
                    <div className="request-detail-heading">
                      <div>
                        <small>Request details</small>
                        <h3>{r.title}</h3>
                      </div>
                    </div>
                    <p className="request-description">{r.description}</p>
                    <div className="request-meta-grid">
                      <span><b>Category</b><strong>{r.ticket?.category ?? r.category ?? "General"}</strong></span>
                      <span><b>Priority</b><strong>{r.ticket?.priority ?? r.priority ?? "MEDIUM"}</strong></span>
                      <span><b>Assigned technician</b><strong>{r.ticket?.assignments?.[0]?.technician?.user?.name ?? "Not assigned"}</strong></span>
                      <span><b>Phone</b><strong>{r.ticket?.assignments?.[0]?.technician?.phone ?? "Not available"}</strong></span>
                      <span><b>Resolution</b><strong>{r.ticket ? (r.ticket.billingCompleted ? "Resolved and billed" : "In progress") : "Awaiting admin assignment"}</strong></span>
                      <span><b>Amount</b><strong>Not recorded</strong></span>
                    </div>
                    <div className="request-timeline">
                      <b>Activity timeline</b>
                      <div className="timeline-list">
                        <div className="timeline-item">
                          <span className="timeline-dot" />
                            <div><strong>Request submitted</strong><small>{new Date(r.submittedAt).toLocaleString()}</small></div>
                        </div>
                        {r.ticket?.history?.map((event) => (
                          <div className="timeline-item" key={event.id}>
                            <span className="timeline-dot" />
                            <div>
                              <strong>Request updated</strong>
                              <small>{new Date(event.createdAt).toLocaleString()}{event.note ? ` · ${event.note}` : ""}</small>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    {r.ticket?.status === "RESOLVED" && (
                      <>
                    <div className="request-comments">
                      <b>Updates and comments</b>
                      {commentsLoading && <small>Loading comments...</small>}
                      {!commentsLoading && comments.length === 0 && (
                        <small>No comments yet.</small>
                      )}
                      {comments.map((comment) => (
                        <p className="request-comment" key={comment.id}>
                          <strong>{comment.author?.name ?? "Team"}</strong>{" "}
                          {comment.body}
                        </p>
                      ))}
                      {r.ticket && (
                        <div className="request-comment-form">
                          <input
                            value={commentText}
                            onChange={(event) => setCommentText(event.target.value)}
                            placeholder="Add a comment"
                          />
                          <button
                            type="button"
                            onClick={() => submitComment(r.ticket!.id)}
                          >
                            Comment
                          </button>
                        </div>
                      )}
                    </div>
                      <div className="request-review">
                        <b>How was the resolution?</b>
                        <div className="review-stars">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <button
                              type="button"
                              key={star}
                              aria-label={`${star} star${star === 1 ? "" : "s"}`}
                              className={star <= reviewRating ? "selected" : ""}
                              onClick={() => setReviewRating(star)}
                            >
                              <Star size={16} fill="currentColor" />
                            </button>
                          ))}
                        </div>
                        {reviewRating > 0 && <small>Thanks for your feedback.</small>}
                      </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            ))}            {requests.length === 0 && (
              <p className="portal-empty">
                Your submitted requests will appear here.
              </p>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}
