import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Calendar as CalendarDays,
  CheckCircle as CheckCircle2,
  CurrencyInr as IndianRupee,
  Download,
  Receipt as ReceiptText,
  Wallet as WalletCards,
} from "@phosphor-icons/react";
import DateTimeField from "../components/DateTimeField";
import { api } from "../api/client";
import { EmptyState, LoadingPanel } from "../components/StateViews";
import { useAuthStore } from "../store/auth";
import type { Bill } from "../types/api";

export default function Bills() {
  const user = useAuthStore((state) => state.user);
  const roles = user?.roles.map((role) => role.name) ?? [];
  const manager = Boolean(
    user?.is_superuser ||
      roles.some((role) => ["admin", "committee"].includes(role)),
  );
  const admin = Boolean(user?.is_superuser || roles.includes("admin"));
  const now = new Date();
  const [form, setForm] = useState({
    billing_year: now.getFullYear(),
    billing_month: now.getMonth() + 1,
    maintenance_amount: 2500,
    due_date: new Date(now.getTime() + 15 * 86400000)
      .toISOString()
      .slice(0, 10),
  });
  const [message, setMessage] = useState("");
  const client = useQueryClient();
  const bills = useQuery({
    queryKey: ["bills"],
    queryFn: async () => (await api.get<Bill[]>("/bills/?limit=200")).data,
  });
  const config = useQuery({
    queryKey: ["payment-config"],
    queryFn: async () => (await api.get("/bills/payment-config")).data,
  });
  const rows = bills.data ?? [];
  const unpaid = rows.filter(
    (bill) => !["paid", "cancelled"].includes(bill.status),
  );
  const outstanding = unpaid.reduce(
    (sum, bill) => sum + Math.max(0, bill.total_amount - bill.paid_amount),
    0,
  );
  const periods = useMemo(
    () =>
      new Set(rows.map((bill) => `${bill.billing_year}-${bill.billing_month}`)),
    [rows],
  );
  const duplicate = periods.has(`${form.billing_year}-${form.billing_month}`);
  const refresh = () => client.invalidateQueries({ queryKey: ["bills"] });
  const monthly = useMutation({
    mutationFn: () => api.post("/bills/monthly", form),
    onSuccess: async ({ data }) => {
      setMessage(`${data.created} resident accounts were billed.`);
      await refresh();
    },
    onError: (error: any) =>
      setMessage(
        error?.response?.data?.detail ||
          "Monthly maintenance could not be created.",
      ),
  });
  const pay = useMutation({
    mutationFn: async () => {
      if (config.data?.demo_enabled)
        return (await api.post("/bills/payments/demo")).data;
      const { data: order } = await api.post("/bills/payment-order");
      await loadRazorpay();
      return new Promise((resolve, reject) =>
        new (window as any).Razorpay({
          key: order.key_id,
          amount: order.amount_paise,
          currency: "INR",
          name: "Panchayat AI",
          description: "Combined maintenance dues",
          order_id: order.order_id,
          handler: async (response: any) =>
            resolve((await api.post("/bills/payments/verify", response)).data),
          modal: { ondismiss: () => reject(new Error("Payment cancelled")) },
        }).open(),
      );
    },
    onSuccess: async () => {
      setMessage("Payment completed. Your maintenance account is updated.");
      await refresh();
    },
    onError: (error: any) =>
      setMessage(
        error?.response?.data?.detail ||
          error?.message ||
          "Payment could not be completed.",
      ),
  });
  if (bills.isLoading) return <LoadingPanel />;
  return (
    <div className="page">
      <header className="page-header">
        <div className="page-title">
          <p className="eyebrow">Monthly maintenance</p>
          <h1>
            {manager ? "Collection, made visible." : "One clear amount to pay."}
          </h1>
          <p>
            {manager
              ? "See every resident account. Only administrators can create the monthly charge."
              : "All older unpaid months are combined so nothing is hidden across separate bills."}
          </p>
        </div>
        {!manager && outstanding > 0 ? (
          <button
            className="button secondary"
            disabled={pay.isPending}
            onClick={() => pay.mutate()}
          >
            <WalletCards size={18} />
            {pay.isPending
              ? "Opening payment..."
              : config.data?.demo_enabled
                ? "Pay with demo checkout"
                : "Pay all dues"}
          </button>
        ) : null}
      </header>
      {message ? (
        <div
          className={`feedback ${message.includes("could not") ? "error" : "success"}`}
        >
          {message}
        </div>
      ) : null}
      <section className="stats-row">
        <Stat
          icon={<IndianRupee size={20} />}
          label={manager ? "Society outstanding" : "Total outstanding"}
          value={`₹${outstanding.toLocaleString("en-IN")}`}
        />
        <Stat
          icon={<CalendarDays size={20} />}
          label="Unpaid months"
          value={String(unpaid.length)}
        />
        <Stat
          icon={<CheckCircle2 size={20} />}
          label="Paid bills"
          value={String(rows.filter((bill) => bill.status === "paid").length)}
        />
        <Stat
          icon={<ReceiptText size={20} />}
          label="Total records"
          value={String(rows.length)}
        />
      </section>
      {admin ? (
        <section className="surface surface-pad">
          <div className="record-header">
            <div>
              <p className="eyebrow">Administrator action</p>
              <h2 className="section-title">
                Create monthly maintenance for everyone
              </h2>
            </div>
            <span className="status approved">Admin only</span>
          </div>
          <form
            className="form-grid"
            onSubmit={(event) => {
              event.preventDefault();
              monthly.mutate();
            }}
          >
            <div className="field">
              <label>Billing year</label>
              <input
                type="number"
                value={form.billing_year}
                onChange={(event) =>
                  setForm({ ...form, billing_year: Number(event.target.value) })
                }
              />
            </div>
            <div className="field">
              <label>Billing month</label>
              <select
                value={form.billing_month}
                onChange={(event) =>
                  setForm({
                    ...form,
                    billing_month: Number(event.target.value),
                  })
                }
              >
                {Array.from({ length: 12 }, (_, index) => (
                  <option key={index} value={index + 1}>
                    {new Date(2000, index).toLocaleString("en", {
                      month: "long",
                    })}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label>Maintenance amount per resident</label>
              <input
                type="number"
                min="1"
                value={form.maintenance_amount}
                onChange={(event) =>
                  setForm({
                    ...form,
                    maintenance_amount: Number(event.target.value),
                  })
                }
              />
            </div>
            <DateTimeField
              label="Due date"
              required
              value={form.due_date}
              onChange={(value) => setForm({ ...form, due_date: value })}
            />
            <div>
              {duplicate ? (
                <div className="feedback error">
                  This month has already been billed. Choose another month.
                </div>
              ) : (
                <div className="feedback">
                  Every approved resident with a linked flat receives the same
                  charge.
                </div>
              )}
            </div>
            <div className="form-actions">
              <button
                className="button"
                type="submit"
                disabled={duplicate || monthly.isPending}
              >
                Bill every resident
              </button>
            </div>
          </form>
        </section>
      ) : null}
      <section className="surface">
        <div className="surface-pad record-header">
          <div>
            <p className="eyebrow">Account history</p>
            <h2 className="section-title">
              {manager
                ? "Resident collection status"
                : "Your maintenance bills"}
            </h2>
          </div>
        </div>
        {rows.length ? (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  {manager ? <th>Resident</th> : null}
                  <th>Period</th>
                  <th>Bill number</th>
                  <th>Total</th>
                  <th>Paid</th>
                  <th>Status</th>
                  <th>Receipt</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((bill) => (
                  <tr key={bill.id}>
                    {manager ? (
                      <td>{bill.billed_user?.full_name || "Resident"}</td>
                    ) : null}
                    <td>
                      {new Date(
                        bill.billing_year ?? 2000,
                        (bill.billing_month ?? 1) - 1,
                      ).toLocaleString("en", {
                        month: "long",
                        year: "numeric",
                      })}
                    </td>
                    <td>{bill.bill_number}</td>
                    <td>₹{bill.total_amount.toLocaleString("en-IN")}</td>
                    <td>₹{bill.paid_amount.toLocaleString("en-IN")}</td>
                    <td>
                      <span className={`status ${bill.status}`}>
                        {bill.status}
                      </span>
                    </td>
                    <td>
                      <button
                        className="icon-button"
                        aria-label={`Download receipt for ${bill.bill_number}`}
                        onClick={() => download(bill)}
                      >
                        <Download size={17} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState
            title="No maintenance records"
            body="Monthly charges will appear here after an administrator publishes them."
          />
        )}
      </section>
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
  value: string;
}) {
  return (
    <article className="surface stat">
      <span className="metric-icon">{icon}</span>
      <strong>{value}</strong>
      <span>{label}</span>
    </article>
  );
}
async function download(bill: Bill) {
  const response = await api.get(`/bills/${bill.id}/pdf`, {
    responseType: "blob",
  });
  const url = URL.createObjectURL(response.data);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${bill.bill_number}.pdf`;
  link.click();
  URL.revokeObjectURL(url);
}
async function loadRazorpay() {
  if ((window as any).Razorpay) return;
  await new Promise<void>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Payment checkout could not load"));
    document.body.appendChild(script);
  });
}
