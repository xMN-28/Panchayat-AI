import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Calendar as CalendarDays,
  MapPin as Pin,
  Megaphone,
  Plus,
  Trash as Trash2,
} from "@phosphor-icons/react";
import DateTimeField from "../components/DateTimeField";
import { api } from "../api/client";
import { EmptyState, LoadingPanel } from "../components/StateViews";
import { useAuthStore } from "../store/auth";
import type { Notice } from "../types/api";

export default function Notices() {
  const user = useAuthStore((state) => state.user);
  const admin = Boolean(
    user?.is_superuser || user?.roles.some((role) => role.name === "admin"),
  );
  const client = useQueryClient();
  const [form, setForm] = useState({
    society_id: user?.society_id,
    title: "",
    body: "",
    is_pinned: false,
    audience: "all",
    expires_at: "",
  });
  const [message, setMessage] = useState("");
  const list = useQuery({
    queryKey: ["notices"],
    queryFn: async () => (await api.get<Notice[]>("/notices/")).data,
  });
  const create = useMutation({
    mutationFn: () =>
      api.post("/notices/", { ...form, expires_at: form.expires_at || null }),
    onSuccess: async () => {
      setMessage("Notice published.");
      setForm({
        ...form,
        title: "",
        body: "",
        is_pinned: false,
        expires_at: "",
      });
      await client.invalidateQueries({ queryKey: ["notices"] });
    },
    onError: (error: any) =>
      setMessage(
        error?.response?.data?.detail || "The notice could not be published.",
      ),
  });
  const remove = useMutation({
    mutationFn: (id: number) => api.delete(`/notices/${id}`),
    onSuccess: async () => {
      setMessage("Notice removed.");
      await client.invalidateQueries({ queryKey: ["notices"] });
    },
  });
  if (list.isLoading) return <LoadingPanel />;
  const pinned = list.data?.find((notice) => notice.is_pinned);
  return (
    <div className="page">
      <header className="page-header">
        <div className="page-title">
          <p className="eyebrow">Official society updates</p>
          <h1>Know what is happening.</h1>
          <p>
            Important information is surfaced on Home. Every active circular
            remains available here.
          </p>
        </div>
      </header>
      {message ? (
        <div
          className={`feedback ${message.includes("could not") ? "error" : "success"}`}
        >
          {message}
        </div>
      ) : null}
      {pinned ? (
        <article className="surface dashboard-notice">
          <div className="record-header">
            <span className="metric-icon">
              <Pin size={20} />
            </span>
            <span className="status pending">Important</span>
          </div>
          <div className="notice-body">
            <h2>{pinned.title}</h2>
            <p>{pinned.body}</p>
            <div className="record-meta">
              <span>
                <CalendarDays size={14} />{" "}
                {new Date(pinned.published_at).toLocaleString()}
              </span>
              <span>Audience: {pinned.audience}</span>
            </div>
          </div>
        </article>
      ) : null}
      <div className={admin ? "section-grid" : ""}>
        {admin ? (
          <section className="surface surface-pad">
            <p className="eyebrow">Administrator action</p>
            <h2 className="section-title">Publish an update</h2>
            <form
              className="auth-form"
              onSubmit={(event) => {
                event.preventDefault();
                create.mutate();
              }}
            >
              <div className="field">
                <label>Notice title</label>
                <input
                  required
                  value={form.title}
                  onChange={(event) =>
                    setForm({ ...form, title: event.target.value })
                  }
                />
              </div>
              <div className="field">
                <label>Message</label>
                <textarea
                  required
                  value={form.body}
                  onChange={(event) =>
                    setForm({ ...form, body: event.target.value })
                  }
                />
              </div>
              <div className="form-grid">
                <div className="field">
                  <label>Audience</label>
                  <select
                    value={form.audience}
                    onChange={(event) =>
                      setForm({ ...form, audience: event.target.value })
                    }
                  >
                    <option value="all">Everyone</option>
                    <option value="residents">Residents</option>
                    <option value="committee">Committee</option>
                  </select>
                </div>
                <DateTimeField
                  label="Expires"
                  optional
                  includeTime
                  value={form.expires_at}
                  onChange={(value) => setForm({ ...form, expires_at: value })}
                />
              </div>
              <label className="field-label">
                <input
                  type="checkbox"
                  checked={form.is_pinned}
                  onChange={(event) =>
                    setForm({ ...form, is_pinned: event.target.checked })
                  }
                />{" "}
                Show as important on Home
              </label>
              <button
                className="button"
                type="submit"
                disabled={create.isPending}
              >
                <Plus size={18} />
                Publish notice
              </button>
            </form>
          </section>
        ) : null}
        <section>
          <div className="record-header">
            <div>
              <p className="eyebrow">Notice board</p>
              <h2 className="section-title">
                {list.data?.length ?? 0} active updates
              </h2>
            </div>
          </div>
          <div className="record-list">
            {list.data?.map((notice) => (
              <article className="record" key={notice.id}>
                <div className="record-header">
                  <span className="metric-icon">
                    <Megaphone size={19} />
                  </span>
                  {notice.is_pinned ? (
                    <span className="status pending">Pinned</span>
                  ) : (
                    <span className="status approved">Published</span>
                  )}
                </div>
                <h3>{notice.title}</h3>
                <p>{notice.body}</p>
                <div className="record-meta">
                  <span>{new Date(notice.published_at).toLocaleString()}</span>
                  <span>Audience: {notice.audience}</span>
                </div>
                {admin ? (
                  <div className="record-actions">
                    <button
                      className="button danger small"
                      onClick={() =>
                        window.confirm("Remove this notice permanently?") &&
                        remove.mutate(notice.id)
                      }
                    >
                      <Trash2 size={15} />
                      Remove
                    </button>
                  </div>
                ) : null}
              </article>
            ))}
            {!list.data?.length ? (
              <EmptyState
                title="No active notices"
                body="New society announcements will appear here."
              />
            ) : null}
          </div>
        </section>
      </div>
    </div>
  );
}
