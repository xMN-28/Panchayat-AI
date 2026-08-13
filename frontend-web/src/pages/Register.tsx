import {
  ArrowLeft,
  ArrowRight,
  CheckCircle as CheckCircle2,
} from "@phosphor-icons/react";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { api } from "../api/client";
import Brand from "../components/Brand";
import DateTimeField from "../components/DateTimeField";

type SocietyOption = {
  id: number;
  name: string;
  buildings: {
    id: number;
    name: string;
    flats: { id: number; number: string }[];
  }[];
};
const initial = {
  full_name: "",
  email: "",
  phone: "",
  date_of_birth: "",
  password: "",
  society_id: "",
  building_name: "",
  flat_number: "",
};
export default function Register() {
  const [form, setForm] = useState(initial);
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const societies = useQuery({
    queryKey: ["public-societies"],
    queryFn: async () =>
      (await api.get<SocietyOption[]>("/auth/societies")).data,
  });
  const society = societies.data?.find(
    (item) => item.id === Number(form.society_id),
  );
  const building = society?.buildings.find(
    (item) => item.name === form.building_name,
  );
  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    try {
      await api.post("/auth/join-requests", {
        ...form,
        society_id: Number(form.society_id),
        phone: form.phone || null,
      });
      setSubmitted(true);
    } catch (error: any) {
      setError(
        error?.response?.data?.detail ||
          "Your access request could not be sent. Check the details and try again.",
      );
    }
  }
  return (
    <main className="auth-page register-page">
      <section className="auth-story">
        <Brand inverse />
        <div className="auth-story-copy">
          <p>Verified membership only</p>
          <h1>
            Your home deserves <em>the right access.</em>
          </h1>
          <p>
            Every request is checked against the society register before an
            account becomes active.
          </p>
        </div>
        <div className="address-graphic" aria-hidden="true">
          <span>A</span>
          <span>B</span>
          <span>C</span>
          <span>D</span>
        </div>
      </section>
      <section className="auth-panel">
        <div className="auth-card register-card">
          <Link to="/login" className="back-link">
            <ArrowLeft size={16} />
            Back to sign in
          </Link>
          {submitted ? (
            <div className="auth-success">
              <CheckCircle2 size={46} weight="duotone" />
              <h2>Request received</h2>
              <p>
                An administrator will verify your building and flat. You can
                sign in after approval.
              </p>
              <Link className="button" to="/login">
                Return to sign in
              </Link>
            </div>
          ) : (
            <>
              <div className="auth-heading">
                <h2>Request access</h2>
                <p>
                  Tell us where you live so the committee can verify your
                  membership.
                </p>
              </div>
              <form className="auth-form" onSubmit={submit}>
                <div className="form-grid">
                  <div className="field">
                    <label>Full name</label>
                    <input
                      required
                      value={form.full_name}
                      onChange={(e) =>
                        setForm({ ...form, full_name: e.target.value })
                      }
                    />
                  </div>
                  <DateTimeField
                    label="Date of birth"
                    required
                    value={form.date_of_birth}
                    onChange={(value) =>
                      setForm({ ...form, date_of_birth: value })
                    }
                  />
                  <div className="field">
                    <label>Society</label>
                    <select
                      required
                      value={form.society_id}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          society_id: e.target.value,
                          building_name: "",
                          flat_number: "",
                        })
                      }
                    >
                      <option value="">Choose society</option>
                      {societies.data?.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="field">
                    <label>Wing / building</label>
                    <select
                      required
                      value={form.building_name}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          building_name: e.target.value,
                          flat_number: "",
                        })
                      }
                    >
                      <option value="">Choose wing</option>
                      {society?.buildings.map((item) => (
                        <option key={item.id}>{item.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="field">
                    <label>Flat number</label>
                    <select
                      required
                      value={form.flat_number}
                      onChange={(e) =>
                        setForm({ ...form, flat_number: e.target.value })
                      }
                    >
                      <option value="">Choose flat</option>
                      {building?.flats.map((item) => (
                        <option key={item.id}>{item.number}</option>
                      ))}
                    </select>
                  </div>
                  <div className="field">
                    <label>
                      Phone <small>(optional)</small>
                    </label>
                    <input
                      type="tel"
                      value={form.phone}
                      onChange={(e) =>
                        setForm({ ...form, phone: e.target.value })
                      }
                    />
                  </div>
                </div>
                <div className="field">
                  <label>Email address</label>
                  <input
                    type="email"
                    required
                    value={form.email}
                    onChange={(e) =>
                      setForm({ ...form, email: e.target.value })
                    }
                  />
                </div>
                <div className="field">
                  <label>Create password</label>
                  <input
                    type="password"
                    required
                    value={form.password}
                    onChange={(e) =>
                      setForm({ ...form, password: e.target.value })
                    }
                  />
                  <small>Administrators can never see your password.</small>
                </div>
                {error ? (
                  <div className="feedback error" role="alert">
                    {error}
                  </div>
                ) : null}
                <button className="button button-shift" type="submit">
                  <span>Send access request</span>
                  <ArrowRight size={18} />
                </button>
              </form>
            </>
          )}
        </div>
      </section>
    </main>
  );
}
