import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Calendar as CalendarClock,
  Check,
  DoorOpen,
  MagnifyingGlass as Search,
  ShieldCheck,
  SignIn as LogIn,
  SignOut as LogOut,
  UserPlus,
  X,
} from "@phosphor-icons/react";
import DateTimeField from "../components/DateTimeField";
import { api } from "../api/client";
import { EmptyState, LoadingPanel } from "../components/StateViews";
import { useAuthStore } from "../store/auth";
import type { Flat, Visitor } from "../types/api";
import {
  formatSocietyDateTime,
  societyInputToUtc,
  toSocietyDateTimeInput,
} from "../utils/dateTime";

type ResidentProfile = { flat_id: number };
const blank = () => ({
  wing: "",
  flat_number: "",
  name: "",
  phone: "",
  purpose: "",
  vehicle_number: "",
  expected_at: toSocietyDateTimeInput(),
});
export default function Visitors() {
  const user = useAuthStore((state) => state.user);
  const roles = new Set(user?.roles.map((role) => role.name) ?? []);
  const canApprove = Boolean(
    user?.is_superuser || roles.has("admin") || roles.has("committee"),
  );
  const canOperate = canApprove || roles.has("security");
  const [form, setForm] = useState(blank);
  const [search, setSearch] = useState("");
  const [message, setMessage] = useState("");
  const client = useQueryClient();
  const profile = useQuery({
    queryKey: ["resident-profile"],
    queryFn: async () => (await api.get<ResidentProfile>("/residents/me")).data,
    enabled: roles.has("resident"),
    retry: false,
  });
  const flats = useQuery({
    queryKey: ["society-flats"],
    queryFn: async () => (await api.get<Flat[]>("/societies/flats")).data,
  });
  const list = useQuery({
    queryKey: ["visitors"],
    queryFn: async () =>
      (await api.get<Visitor[]>("/visitors/?limit=200")).data,
  });
  const selectedFlat = canOperate
    ? flats.data?.find(
        (flat) =>
          flat.block_name === form.wing && flat.number === form.flat_number,
      )
    : flats.data?.find((flat) => flat.id === profile.data?.flat_id);
  const create = useMutation({
    mutationFn: () =>
      api.post("/visitors/", {
        society_id: user?.society_id,
        flat_id: selectedFlat?.id ?? profile.data?.flat_id,
        name: form.name.trim(),
        phone: form.phone.trim() || null,
        purpose: form.purpose.trim() || null,
        vehicle_number: form.vehicle_number.trim() || null,
        expected_at: societyInputToUtc(form.expected_at),
      }),
    onSuccess: async () => {
      setMessage("Visitor pass sent for approval.");
      setForm(blank());
      await client.invalidateQueries({ queryKey: ["visitors"] });
    },
    onError: (error: any) =>
      setMessage(
        error?.response?.data?.detail ||
          "The visitor request could not be submitted.",
      ),
  });
  const action = useMutation({
    mutationFn: ({ id, action }: { id: number; action: string }) =>
      api.post(`/visitors/${id}/action`, { action }),
    onSuccess: async () => client.invalidateQueries({ queryKey: ["visitors"] }),
  });
  const records = useMemo(
    () =>
      (list.data ?? []).filter((visitor) =>
        `${visitor.name} ${visitor.wing_name} ${visitor.flat_number} ${visitor.purpose} ${visitor.vehicle_number}`
          .toLowerCase()
          .includes(search.toLowerCase()),
      ),
    [list.data, search],
  );
  if (list.isLoading) return <LoadingPanel />;
  const all = list.data ?? [];
  return (
    <div className="page">
      <header className="page-header">
        <div className="page-title">
          <p className="eyebrow">Gate and visitor access</p>
          <h1>
            {canApprove
              ? "Know who is expected."
              : "A smoother welcome at the gate."}
          </h1>
          <p>
            {canApprove
              ? "Approve resident requests before security admits a visitor, then follow their entry and exit."
              : "Request a pass in advance. The committee reviews it and security is notified after approval."}
          </p>
        </div>
      </header>
      <section className="stats-row">
        <Stat
          icon={<DoorOpen size={20} />}
          label="Inside now"
          value={all.filter((item) => item.status === "checked_in").length}
        />
        <Stat
          icon={<CalendarClock size={20} />}
          label="Expected"
          value={all.filter((item) => item.status === "approved").length}
        />
        <Stat
          icon={<ShieldCheck size={20} />}
          label="Awaiting approval"
          value={all.filter((item) => item.status === "pending").length}
        />
        <Stat
          icon={<Check size={20} />}
          label="Completed"
          value={all.filter((item) => item.status === "checked_out").length}
        />
      </section>
      {message ? (
        <div
          className={`feedback ${message.includes("could not") ? "error" : "success"}`}
        >
          {message}
        </div>
      ) : null}
      <div className="section-grid">
        <section className="surface surface-pad">
          <p className="eyebrow">New request</p>
          <h2 className="section-title">Who are you expecting?</h2>
          <form
            className="auth-form"
            onSubmit={(event) => {
              event.preventDefault();
              create.mutate();
            }}
          >
            <div className="field">
              <label>Visitor name</label>
              <input
                required
                minLength={2}
                placeholder="For example, Ajay Patil"
                value={form.name}
                onChange={(event) =>
                  setForm({ ...form, name: event.target.value })
                }
              />
            </div>
            {canOperate ? (
              <div className="form-grid">
                <div className="field">
                  <label>Wing</label>
                  <select
                    required
                    value={form.wing}
                    onChange={(event) =>
                      setForm({ ...form, wing: event.target.value })
                    }
                  >
                    <option value="">Choose wing</option>
                    {["A", "B", "C", "D"].map((wing) => (
                      <option key={wing}>{wing}</option>
                    ))}
                  </select>
                </div>
                <div className="field">
                  <label>Flat number</label>
                  <input
                    required
                    pattern="[1-4]0[1-4]"
                    placeholder="101"
                    value={form.flat_number}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        flat_number: event.target.value
                          .replace(/\D/g, "")
                          .slice(0, 3),
                      })
                    }
                  />
                </div>
              </div>
            ) : (
              <div className="feedback">
                Pass location:{" "}
                {selectedFlat
                  ? `Wing ${selectedFlat.block_name}, Flat ${selectedFlat.number}`
                  : "Loading your approved address..."}
              </div>
            )}
            <DateTimeField
              label="Expected date and time"
              includeTime
              required
              min={new Date().toISOString()}
              value={form.expected_at}
              onChange={(value) => setForm({ ...form, expected_at: value })}
            />
            <div className="field">
              <label>
                Purpose <small>(optional)</small>
              </label>
              <input
                placeholder="Guest visit, delivery, repair..."
                value={form.purpose}
                onChange={(event) =>
                  setForm({ ...form, purpose: event.target.value })
                }
              />
            </div>
            <div className="form-grid">
              <div className="field">
                <label>
                  Phone <small>(optional)</small>
                </label>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(event) =>
                    setForm({ ...form, phone: event.target.value })
                  }
                />
              </div>
              <div className="field">
                <label>
                  Vehicle <small>(optional)</small>
                </label>
                <input
                  value={form.vehicle_number}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      vehicle_number: event.target.value.toUpperCase(),
                    })
                  }
                />
              </div>
            </div>
            <button
              className="button"
              type="submit"
              disabled={!selectedFlat || create.isPending}
            >
              <UserPlus size={18} />
              Send for approval
            </button>
          </form>
        </section>
        <section>
          <div className="surface filters">
            <Search size={18} />
            <input
              aria-label="Search visitors"
              placeholder="Search visitor, wing, flat, or vehicle"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>
          <div className="record-list">
            {records.map((visitor) => (
              <article className="record" key={visitor.id}>
                <div className="record-header">
                  <div>
                    <h3>{visitor.name}</h3>
                    <div className="record-meta">
                      <span>
                        Wing {visitor.wing_name || "—"}, Flat{" "}
                        {visitor.flat_number || "—"}
                      </span>
                      <span>
                        {visitor.expected_at
                          ? formatSocietyDateTime(visitor.expected_at)
                          : formatSocietyDateTime(visitor.created_at)}{" "}
                        IST
                      </span>
                    </div>
                  </div>
                  <span className={`status ${visitor.status}`}>
                    {visitor.status.replaceAll("_", " ")}
                  </span>
                </div>
                <p>
                  {visitor.purpose || "No purpose provided"}
                  {visitor.vehicle_number ? ` · ${visitor.vehicle_number}` : ""}
                </p>
                <div className="record-actions">
                  {canApprove && visitor.status === "pending" ? (
                    <>
                      <button
                        className="button small"
                        onClick={() =>
                          action.mutate({ id: visitor.id, action: "approve" })
                        }
                      >
                        <Check size={15} />
                        Approve
                      </button>
                      <button
                        className="button danger small"
                        onClick={() =>
                          action.mutate({ id: visitor.id, action: "reject" })
                        }
                      >
                        <X size={15} />
                        Reject
                      </button>
                    </>
                  ) : null}
                  {canOperate && visitor.status === "approved" ? (
                    <button
                      className="button small"
                      onClick={() =>
                        action.mutate({ id: visitor.id, action: "check_in" })
                      }
                    >
                      <LogIn size={15} />
                      Check in
                    </button>
                  ) : null}
                  {canOperate && visitor.status === "checked_in" ? (
                    <button
                      className="button ghost small"
                      onClick={() =>
                        action.mutate({ id: visitor.id, action: "check_out" })
                      }
                    >
                      <LogOut size={15} />
                      Check out
                    </button>
                  ) : null}
                </div>
              </article>
            ))}
            {!records.length ? (
              <EmptyState
                title="No matching visitor records"
                body="Try a different search or create a new pass."
              />
            ) : null}
          </div>
        </section>
      </div>
    </div>
  );
}
function Stat({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
}) {
  return (
    <article className="surface stat">
      <span className="metric-icon">{icon}</span>
      <strong>{value}</strong>
      <span>{label}</span>
    </article>
  );
}
