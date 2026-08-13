import { useQuery } from "@tanstack/react-query";
import { ArrowRight, CreditCard, DoorOpen, Megaphone, Question as CircleHelp, Robot as Bot, Users } from "@phosphor-icons/react";
import { Link } from "react-router-dom";
import { api } from "../api/client";
import { useAuthStore } from "../store/auth";
import type { Bill, Complaint, Notice, Visitor } from "../types/api";

export default function Dashboard() {
  const user = useAuthStore((state) => state.user);
  const complaints = useQuery({ queryKey: ["complaints", "home"], queryFn: async () => (await api.get<Complaint[]>("/complaints/?limit=20")).data });
  const bills = useQuery({ queryKey: ["bills", "home"], queryFn: async () => (await api.get<Bill[]>("/bills/?limit=20")).data });
  const notices = useQuery({ queryKey: ["notices", "home"], queryFn: async () => (await api.get<Notice[]>("/notices/")).data });
  const visitors = useQuery({ queryKey: ["visitors", "home"], queryFn: async () => (await api.get<Visitor[]>("/visitors/?limit=20")).data });
  const open = complaints.data?.filter((item) => !["rejected", "resolved", "withdrawn"].includes(item.status)).length ?? 0;
  const due = bills.data?.reduce((sum, bill) => sum + Math.max(0, bill.total_amount - bill.paid_amount), 0) ?? 0;
  const inside = visitors.data?.filter((item) => item.status === "checked_in").length ?? 0;
  const notice = notices.data?.[0];
  return <div className="page"><header className="page-header"><div className="page-title"><p className="eyebrow">Good to see you, {user?.full_name?.split(" ")[0]}</p><h1>Your society at a glance.</h1><p>Everything that needs your attention, arranged around the actions you use most.</p></div><Link className="button" to="/ai"><Bot size={18} />Ask Panchayat</Link></header>
    <section className="dashboard-grid">
      <article className="surface dashboard-welcome"><div><p className="eyebrow">Voice service is ready</p><h2>Tell us what you need. <span className="display-italic">We’ll guide the work.</span></h2><p>Speak in Hindi, Marathi, or English. Review the action before Panchayat AI completes it.</p><Link className="button secondary" to="/ai">Start a conversation<ArrowRight size={18} /></Link></div><div className="dashboard-voice-mark"><Bot size={92} weight="duotone" /></div></article>
      <article className="surface dashboard-notice"><div className="record-header"><span className="metric-icon"><Megaphone size={20} /></span><span className={`status ${notice?.is_pinned ? "pending" : "approved"}`}>{notice?.is_pinned ? "Important" : "Latest"}</span></div><div className="notice-body"><h2>{notice?.title || "No new notice"}</h2><p>{notice?.body || "Society updates will appear here as soon as they are published."}</p>{notice ? <Link className="button ghost small" to="/notices">Open notice<ArrowRight size={15} /></Link> : null}</div></article>
      <Metric icon={<CircleHelp size={20} />} value={String(open)} label="Active complaints" href="/complaints" />
      <Metric icon={<CreditCard size={20} />} value={`₹${due.toLocaleString("en-IN")}`} label="Maintenance due" href="/bills" />
      <Metric icon={<DoorOpen size={20} />} value={String(inside)} label="Visitors inside" href="/visitors" />
      <article className="surface dashboard-services"><div className="record-header"><div><p className="eyebrow">Manual services</p><h2 className="section-title">Choose a service</h2></div></div><div className="service-links"><Service icon={<CircleHelp size={21} />} title="Report a problem" detail="Private complaint and tracking" href="/complaints" /><Service icon={<CreditCard size={21} />} title="Check maintenance" detail="Dues, payments, and receipts" href="/bills" /><Service icon={<DoorOpen size={21} />} title="Request a visitor" detail="Create and follow a gate pass" href="/visitors" /><Service icon={<Megaphone size={21} />} title="Read society notices" detail="Official updates in one place" href="/notices" /></div></article>
      <article className="surface metric-card primary"><span className="metric-icon"><Users size={20} /></span><div><span className="metric-value">24/7</span><div className="metric-label">Society services remain available</div></div></article>
    </section>
  </div>;
}
function Metric({ icon, value, label, href }: { icon: React.ReactNode; value: string; label: string; href: string }) { return <Link className="surface metric-card primary" to={href}><span className="metric-icon">{icon}</span><div><span className="metric-value">{value}</span><div className="metric-label">{label}</div></div></Link>; }
function Service({ icon, title, detail, href }: { icon: React.ReactNode; title: string; detail: string; href: string }) { return <Link className="service-link" to={href}>{icon}<span><strong>{title}</strong><small>{detail}</small></span><ArrowRight size={17} /></Link>; }
