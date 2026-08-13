import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { MagnifyingGlass as Search, ShieldCheck, UserGear as UserCog, Users } from "@phosphor-icons/react";
import { api } from "../api/client";
import { EmptyState, LoadingPanel } from "../components/StateViews";
import { useAuthStore } from "../store/auth";
import type { User } from "../types/api";

export default function Residents() {
  const me = useAuthStore((state) => state.user);
  const admin = Boolean(me?.is_superuser || me?.roles.some((role) => role.name === "admin"));
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [message, setMessage] = useState("");
  const client = useQueryClient();
  const users = useQuery({ queryKey: ["users"], queryFn: async () => (await api.get<User[]>("/admin/users?limit=200")).data });
  const role = useMutation({ mutationFn: ({ user, role, add }: { user: User; role: string; add: boolean }) => add ? api.post(`/admin/users/${user.id}/roles/${role}`) : api.delete(`/admin/users/${user.id}/roles/${role}`), onSuccess: async () => { setMessage("Access updated. The change applies at the user’s next sign-in."); await client.invalidateQueries({ queryKey: ["users"] }); }, onError: (error: any) => setMessage(error?.response?.data?.detail || "Access could not be changed.") });
  const filtered = useMemo(() => (users.data ?? []).filter((user) => { const matchesText = `${user.full_name} ${user.email} ${user.phone || ""}`.toLowerCase().includes(search.toLowerCase()); const matchesRole = filter === "all" || user.roles.some((item) => item.name === filter); return matchesText && matchesRole; }), [users.data, search, filter]);
  if (users.isLoading) return <LoadingPanel />;
  const count = (name: string) => users.data?.filter((user) => user.roles.some((role) => role.name === name)).length ?? 0;
  return <div className="page"><header className="page-header"><div className="page-title"><p className="eyebrow">Verified people</p><h1>Your community directory.</h1><p>Find the right person and understand who can help. Only administrators can change access.</p></div></header>
    <section className="stats-row"><Stat label="Residents" value={count("resident")} /><Stat label="Committee" value={count("committee")} /><Stat label="Security" value={count("security")} /><Stat label="Administrators" value={count("admin")} /></section>
    {message ? <div className={`feedback ${message.includes("could not") ? "error" : "success"}`}>{message}</div> : null}
    <section className="surface"><div className="filters"><Search size={18} /><input aria-label="Search people" placeholder="Search name, email, or phone" value={search} onChange={(event) => setSearch(event.target.value)} /><select aria-label="Filter by role" value={filter} onChange={(event) => setFilter(event.target.value)}><option value="all">Every role</option><option value="resident">Residents</option><option value="committee">Committee</option><option value="security">Security</option><option value="admin">Administrators</option></select></div>{filtered.length ? <div className="table-wrap"><table><thead><tr><th>Person</th><th>Contact</th><th>Roles</th><th>Status</th>{admin ? <th>Access</th> : null}</tr></thead><tbody>{filtered.map((user) => { const has = (name: string) => user.roles.some((item) => item.name === name); return <tr key={user.id}><td><strong>{user.full_name}</strong></td><td>{user.email}<br />{user.phone || "No phone listed"}</td><td>{user.roles.map((item) => <span className={`status ${item.name === "admin" ? "rejected" : "approved"}`} key={item.id}>{item.name}</span>)}</td><td><span className={`status ${user.status === "active" ? "resolved" : "pending"}`}>{user.status}</span></td>{admin ? <td><details><summary className="button ghost small"><UserCog size={15} />Manage access</summary><div className="soft-surface">{["resident", "committee", "security"].map((name) => <p key={name}><button className="button ghost small" onClick={() => role.mutate({ user, role: name, add: !has(name) })}>{has(name) ? `Remove ${name}` : `Add ${name}`}</button></p>)}{has("admin") ? <p><ShieldCheck size={15} /> Administrator access is permanent.</p> : <button className="button danger small" onClick={() => window.confirm("Administrator access cannot be removed through the application. Continue?") && role.mutate({ user, role: "admin", add: true })}>Grant administrator</button>}</div></details></td> : null}</tr>; })}</tbody></table></div> : <EmptyState title="No people match this view" body="Change the search or role filter." />}</section>
  </div>;
}
function Stat({ label, value }: { label: string; value: number }) { return <article className="surface stat"><span className="metric-icon"><Users size={20} /></span><strong>{value}</strong><span>{label}</span></article>; }
