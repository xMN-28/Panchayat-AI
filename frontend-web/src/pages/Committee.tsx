import { useQuery } from "@tanstack/react-query";
import { ArrowRight, CreditCard, DoorOpen, Megaphone, Question as CircleHelp, Users } from "@phosphor-icons/react";
import { Link } from "react-router-dom";
import { api } from "../api/client";
import { ErrorPanel, LoadingPanel } from "../components/StateViews";
import type { AdminStats } from "../types/api";

export default function Committee() {
  const stats = useQuery({ queryKey: ["admin-stats"], queryFn: async () => (await api.get<AdminStats>("/admin/stats")).data });
  if (stats.isLoading) return <LoadingPanel />;
  if (stats.isError) return <ErrorPanel message="Committee statistics could not be loaded." />;
  return <div className="page"><header className="page-header"><div className="page-title"><p className="eyebrow">Committee workspace</p><h1>Daily decisions, in one view.</h1><p>Use the regular service areas to exercise committee permissions. Monthly billing and audit logs remain with administrators.</p></div></header>
    <section className="stats-row"><Stat icon={<Users size={20} />} label="Active residents" value={stats.data?.users_active ?? 0} /><Stat icon={<CircleHelp size={20} />} label="Open complaints" value={stats.data?.complaints_open ?? 0} /><Stat icon={<CreditCard size={20} />} label="Overdue accounts" value={stats.data?.bills_overdue ?? 0} /><Stat icon={<Users size={20} />} label="Verified users" value={stats.data?.users_total ?? 0} /></section>
    <section className="surface surface-pad"><p className="eyebrow">Committee responsibilities</p><h2 className="section-title">Open a working area</h2><div className="service-links"><Quick icon={<CircleHelp size={20} />} title="Manage complaints" detail="Review residents and record decisions" href="/complaints" /><Quick icon={<DoorOpen size={20} />} title="Approve visitors" detail="Review passes before security admits entry" href="/visitors" /><Quick icon={<Megaphone size={20} />} title="Society notices" detail="Keep residents informed" href="/notices" /><Quick icon={<Users size={20} />} title="People directory" detail="Find verified residents and staff" href="/residents" /></div></section>
  </div>;
}
function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) { return <article className="surface stat"><span className="metric-icon">{icon}</span><strong>{value}</strong><span>{label}</span></article>; }
function Quick({ icon, title, detail, href }: { icon: React.ReactNode; title: string; detail: string; href: string }) { return <Link className="service-link" to={href}>{icon}<span><strong>{title}</strong><small>{detail}</small></span><ArrowRight size={16} /></Link>; }
