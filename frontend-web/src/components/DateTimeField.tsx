import { CalendarBlank, CaretLeft, CaretRight, Clock } from "@phosphor-icons/react";
import { useMemo, useRef, useState } from "react";

type Props = { label: string; value: string; onChange: (value: string) => void; required?: boolean; includeTime?: boolean; optional?: boolean; min?: string };
const pad = (value: number) => String(value).padStart(2, "0");
const datePart = (date: Date) => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

export default function DateTimeField({ label, value, onChange, required, includeTime, optional, min }: Props) {
  const initial = value ? new Date(value) : new Date();
  const [open, setOpen] = useState(false);
  const [month, setMonth] = useState(new Date(initial.getFullYear(), initial.getMonth(), 1));
  const root = useRef<HTMLDivElement>(null);
  const days = useMemo(() => {
    const first = new Date(month.getFullYear(), month.getMonth(), 1);
    const start = new Date(month.getFullYear(), month.getMonth(), 1 - first.getDay());
    return Array.from({ length: 42 }, (_, index) => new Date(start.getFullYear(), start.getMonth(), start.getDate() + index));
  }, [month]);
  const selected = value ? value.slice(0, 10) : "";
  const time = includeTime && value.includes("T") ? value.slice(11, 16) : "09:00";
  const choose = (day: Date) => { const next = datePart(day); onChange(includeTime ? `${next}T${time}` : next); if (!includeTime) setOpen(false); };
  return <div className="field date-field" ref={root}>
    <label>{label}{optional ? <small> (optional)</small> : null}</label>
    <button className="date-trigger" type="button" aria-haspopup="dialog" aria-expanded={open} aria-required={required} onClick={() => setOpen((current) => !current)}>
      <CalendarBlank size={20} /><span>{selected ? new Date(`${selected}T12:00:00`).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" }) : "Choose a date"}</span>{includeTime && value ? <small><Clock size={15} />{new Date(value).toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" })}</small> : null}
    </button>
    <input type="hidden" value={value} readOnly />
    {open ? <div className="calendar-popover" role="dialog" aria-label={`${label} calendar`}>
      <div className="calendar-head"><button type="button" aria-label="Previous month" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))}><CaretLeft /></button><strong>{month.toLocaleDateString("en-IN", { month: "long", year: "numeric" })}</strong><button type="button" aria-label="Next month" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))}><CaretRight /></button></div>
      <div className="calendar-week">{["S", "M", "T", "W", "T", "F", "S"].map((day, index) => <span key={`${day}-${index}`}>{day}</span>)}</div>
      <div className="calendar-grid">{days.map((day) => { const iso = datePart(day); const disabled = Boolean(min && iso < min.slice(0, 10)); return <button type="button" key={iso} disabled={disabled} className={`${day.getMonth() !== month.getMonth() ? "outside" : ""} ${iso === selected ? "selected" : ""}`} onClick={() => choose(day)}>{day.getDate()}</button>; })}</div>
      {includeTime ? <div className="calendar-time"><Clock size={18} /><label htmlFor={`${label}-time`}>Time</label><input id={`${label}-time`} type="time" value={time} onChange={(event) => selected && onChange(`${selected}T${event.target.value}`)} /><button className="button small" type="button" disabled={!selected} onClick={() => setOpen(false)}>Done</button></div> : null}
    </div> : null}
  </div>;
}
