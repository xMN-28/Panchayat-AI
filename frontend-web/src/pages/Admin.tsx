import { useQuery } from "@tanstack/react-query";
import { ArrowRight, ClockCounterClockwise as FileClock, CreditCard, CurrencyInr as IndianRupee, Megaphone, Question as CircleHelp, Users } from "@phosphor-icons/react";
import { Link } from "react-router-dom";
import { api } from "../api/client";
import { LoadingPanel } from "../components/StateViews";
import type { AdminStats } from "../types/api";

type AuditRow = { id: number; action: string; entity_type: string | null; entity_id: number | null; details: string | null; created_at: string };
export default function Admin() {
  const stats = useQuery({ queryKey: ["admin-stats"], queryFn: async () => (await api.get<AdminStats>("/admin/stats")).data });
  const logs = useQuery({ queryKey: ["audit-logs"], queryFn: async () => (await api.get<AuditRow[]>("/admin/audit-logs?limit=30")).data });
  if (stats.isLoading || logs.isLoading) return <LoadingPanel />;
  return <div className="page"><header className="page-header"><div className="page-title"><p className="eyebrow">Administration</p><h1>Operate with a clear trail.</h1><p>Monthly billing and audit history live here. Daily service decisions remain in their regular workspaces.</p></div><Link className="button secondary" to="/bills"><CreditCard size={18} />Create monthly billing</Link></header>
    <section className="stats-row"><Stat icon={<Users size={20} />} label="Active users" value={stats.data?.users_active ?? 0} /><Stat icon={<CircleHelp size={20} />} label="Open complaints" value={stats.data?.complaints_open ?? 0} /><Stat icon={<CreditCard size={20} />} label="Overdue bills" value={stats.data?.bills_overdue ?? 0} /><Stat icon={<IndianRupee size={20} />} label="Outstanding" value={`₹${(stats.data?.outstanding_amount ?? 0).toLocaleString("en-IN")}`} /></section>
    <div className="section-grid"><section className="surface surface-pad"><p className="eyebrow">Admin actions</p><h2 className="section-title">What do you need to manage?</h2><div className="record-list"><Quick icon={<CreditCard size={19} />} label="Bill every resident" detail="Create the single maintenance charge for a month" href="/bills" /><Quick icon={<Users size={19} />} label="People and roles" detail="Grant committee, security, or administrator access" href="/residents" /><Quick icon={<Megaphone size={19} />} label="Publish a notice" detail="Send an official society update" href="/notices" /><Quick icon={<CircleHelp size={19} />} label="Complaint decisions" detail="Start, resolve, or reject resident complaints" href="/complaints" /></div></section>
      <section className="surface"><div className="surface-pad record-header"><div><p className="eyebrow">Audit trail</p><h2 className="section-title">Recent administrative activity</h2></div><span className="metric-icon"><FileClock size={19} /></span></div><div className="table-wrap"><table><thead><tr><th>Time</th><th>Action</th><th>Record</th><th>Details</th></tr></thead><tbody>{logs.data?.map((row) => <tr key={row.id}><td>{new Date(row.created_at).toLocaleString()}</td><td><strong>{row.action.replaceAll("_", " ")}</strong></td><td>{row.entity_type} #{row.entity_id}</td><td>{row.details || "—"}</td></tr>)}</tbody></table></div></section></div>
  </div>;
}
function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: number | string }) { return <article className="surface stat"><span className="metric-icon">{icon}</span><strong>{value}</strong><span>{label}</span></article>; }
function Quick({ icon, label, detail, href }: { icon: React.ReactNode; label: string; detail: string; href: string }) { return <Link className="service-link" to={href}>{icon}<span><strong>{label}</strong><small>{detail}</small></span><ArrowRight size={16} /></Link>; }
