import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle as CheckCircle2, ChatCircleText as MessageSquarePlus, Clock as Clock3, MapPin, Question as CircleHelp, UserCircle as UserRound } from "@phosphor-icons/react";
import { api } from "../api/client";
import { EmptyState, LoadingPanel } from "../components/StateViews";
import { useAuthStore } from "../store/auth";
import type { Complaint } from "../types/api";

export default function Complaints() {
  const user = useAuthStore((state) => state.user);
  const roles = user?.roles.map((role) => role.name) ?? [];
  const manager = Boolean(user?.is_superuser || roles.some((role) => ["admin", "committee"].includes(role)));
  const resident = roles.includes("resident");
  const [form, setForm] = useState({ title: "", description: "", priority: "medium" });
  const [reason, setReason] = useState<Record<number, string>>({});
  const [message, setMessage] = useState("");
  const client = useQueryClient();
  const list = useQuery({ queryKey: ["complaints"], queryFn: async () => (await api.get<Complaint[]>("/complaints/?limit=200")).data });
  const refresh = () => client.invalidateQueries({ queryKey: ["complaints"] });
  const create = useMutation({ mutationFn: () => api.post("/complaints/", form), onSuccess: async () => { setMessage("Complaint submitted. You can follow every update below."); setForm({ title: "", description: "", priority: "medium" }); await refresh(); }, onError: (error: any) => setMessage(error?.response?.data?.detail || "The complaint could not be submitted. Check the details and try again.") });
  const transition = useMutation({ mutationFn: ({ complaint, status }: { complaint: Complaint; status: string }) => api.post(status === "withdrawn" ? `/complaints/${complaint.id}/withdraw` : `/complaints/${complaint.id}/transition`, { status, reason: reason[complaint.id] || "" }), onSuccess: async () => refresh(), onError: (error: any) => setMessage(error?.response?.data?.detail || "The complaint status could not be changed.") });
  if (list.isLoading) return <LoadingPanel />;
  return <div className="page"><header className="page-header"><div className="page-title"><p className="eyebrow">Private help desk</p><h1>{manager ? "Resolve what matters." : "Get a problem sorted."}</h1><p>{manager ? "Review the resident, location, urgency, and full decision history before taking action." : "Only you and authorised society managers can see the complaints you submit."}</p></div></header>
    {message ? <div className={`feedback ${message.includes("could not") ? "error" : "success"}`} role="status">{message}</div> : null}
    <div className="section-grid">
      {resident ? <section className="surface surface-pad"><p className="eyebrow">New complaint</p><h2 className="section-title">What needs attention?</h2><form className="auth-form" onSubmit={(event) => { event.preventDefault(); create.mutate(); }}><div className="field"><label>Short title</label><input required placeholder="Water leakage near lift" value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} /></div><div className="field"><label>Tell us what happened</label><textarea required placeholder="Include the location and when you first noticed it." value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} /></div><div className="field"><label>Priority</label><select value={form.priority} onChange={(event) => setForm({ ...form, priority: event.target.value })}><option value="low">Low — can wait</option><option value="medium">Medium — needs attention</option><option value="high">High — affecting daily life</option><option value="urgent">Urgent — safety or major damage</option></select></div><button className="button" type="submit" disabled={create.isPending}><MessageSquarePlus size={18} />{create.isPending ? "Submitting..." : "Submit complaint"}</button></form></section> : <section className="surface surface-pad"><CircleHelp size={34} /><h2>Management queue</h2><p>Use the decision controls inside each complaint to start, resolve, or reject the work.</p></section>}
      <section><div className="record-header"><div><p className="eyebrow">{manager ? "Society queue" : "Your requests"}</p><h2 className="section-title">{list.data?.length ?? 0} complaints</h2></div></div><div className="record-list">{list.data?.map((complaint) => <ComplaintRecord key={complaint.id} complaint={complaint} manager={manager} currentUserId={user?.id} reason={reason[complaint.id] || ""} onReason={(value) => setReason({ ...reason, [complaint.id]: value })} onTransition={(status) => transition.mutate({ complaint, status })} busy={transition.isPending} />)}{!list.data?.length ? <EmptyState title="No complaints yet" body={resident ? "Your complaints and their progress will appear here." : "There is nothing waiting for the committee."} /> : null}</div></section>
    </div>
  </div>;
}

function ComplaintRecord({ complaint, manager, currentUserId, reason, onReason, onTransition, busy }: { complaint: Complaint; manager: boolean; currentUserId?: number; reason: string; onReason: (value: string) => void; onTransition: (status: string) => void; busy: boolean }) {
  const terminal = ["rejected", "resolved", "withdrawn"].includes(complaint.status);
  const canWithdraw = complaint.reporter_id === currentUserId && !terminal;
  return <article className="record"><div className="record-header"><div><h3>{complaint.title}</h3><div className="record-meta"><span><UserRound size={14} /> {complaint.reporter?.full_name || "Resident"}</span><span><MapPin size={14} /> {complaint.flat ? `Wing ${complaint.flat.block.name}, Flat ${complaint.flat.number}` : "Address not linked"}</span><span><Clock3 size={14} /> {new Date(complaint.created_at).toLocaleDateString()}</span></div></div><span className={`status ${complaint.status}`}>{complaint.status.replaceAll("_", " ")}</span></div><p>{complaint.description}</p><div className="record-meta"><span>Priority: {complaint.priority}</span><span>Updates: {complaint.events.length}</span></div><details><summary>View progress history</summary><ol>{complaint.events.map((event) => <li key={event.id}><strong>{event.to_status.replaceAll("_", " ")}</strong> · {new Date(event.created_at).toLocaleString()}{event.reason ? ` — ${event.reason}` : ""}</li>)}</ol></details>
    {manager && !terminal ? <div className="soft-surface"><div className="field"><label>Decision note</label><input placeholder="Required when rejecting" value={reason} onChange={(event) => onReason(event.target.value)} /></div><div className="record-actions"><button className="button small" disabled={busy} onClick={() => onTransition("in_progress")}>Start progress</button><button className="button secondary small" disabled={busy} onClick={() => onTransition("resolved")}><CheckCircle2 size={15} />Resolve</button><button className="button danger small" disabled={busy || !reason.trim()} onClick={() => onTransition("rejected")}>Reject</button></div></div> : null}
    {canWithdraw ? <div className="record-actions"><button className="button ghost small" disabled={busy} onClick={() => onTransition("withdrawn")}>Withdraw complaint</button></div> : null}
  </article>;
}
