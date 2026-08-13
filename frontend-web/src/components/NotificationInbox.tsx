import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Bell } from "@phosphor-icons/react";
import { api } from "../api/client";
import { useAuthStore } from "../store/auth";

type Notification = { id: number; title: string; body: string; is_read: boolean; created_at: string };
type JoinRequest = { id: number; full_name: string; email: string; building_name: string; flat_number: string; status: string };
export default function NotificationInbox() {
  const user = useAuthStore((state) => state.user);
  const admin = Boolean(user?.is_superuser || user?.roles.some((role) => role.name === "admin"));
  const client = useQueryClient();
  const notifications = useQuery({ queryKey: ["notifications"], queryFn: async () => (await api.get<Notification[]>("/notifications/")).data, refetchInterval: 30000 });
  const requests = useQuery({ queryKey: ["join-requests"], queryFn: async () => (await api.get<JoinRequest[]>("/admin/join-requests")).data, enabled: admin, refetchInterval: 30000 });
  const read = useMutation({ mutationFn: (id: number) => api.post(`/notifications/${id}/read`), onSuccess: () => client.invalidateQueries({ queryKey: ["notifications"] }) });
  const decide = useMutation({ mutationFn: ({ id, decision }: { id: number; decision: "approve" | "reject" }) => api.post(`/admin/join-requests/${id}/${decision}`), onSuccess: async () => Promise.all([client.invalidateQueries({ queryKey: ["join-requests"] }), client.invalidateQueries({ queryKey: ["notifications"] })]) });
  const unread = (notifications.data ?? []).filter((item) => !item.is_read);
  const pending = (requests.data ?? []).filter((item) => item.status === "pending");
  return <details className="inbox"><summary className="icon-button" aria-label={`Inbox with ${unread.length + pending.length} new items`}><Bell size={19} />{unread.length + pending.length > 0 ? <span className="count-badge">{unread.length + pending.length}</span> : null}</summary><div className="inbox-panel">
    <h2>Inbox</h2>{pending.map((request) => <article className="inbox-item" key={request.id}><h3>{request.full_name} requested access</h3><p>{request.email} · Wing {request.building_name}, Flat {request.flat_number}</p><div className="form-actions"><button className="button small" onClick={() => decide.mutate({ id: request.id, decision: "approve" })}>Approve</button><button className="button ghost small" onClick={() => decide.mutate({ id: request.id, decision: "reject" })}>Reject</button></div></article>)}
    {unread.map((item) => <article className="inbox-item" key={item.id}><h3>{item.title}</h3><p>{item.body}</p><button className="button ghost small" onClick={() => read.mutate(item.id)}>Mark as read</button></article>)}
    {!pending.length && !unread.length ? <p>No new updates.</p> : null}
  </div></details>;
}
