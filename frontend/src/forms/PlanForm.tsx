/**
 * Owner: Person 4 (Input Forms).
 */
import { useEffect, useState } from "react";
import { listCountries } from "../api/client";
import type { Country, PlanRequest, PlanResponse, RecurringExpense } from "../types/schemas";

interface Props {
  onPlan: (plan: PlanResponse) => void;
  submitPlan: (req: PlanRequest) => Promise<PlanResponse>;
}

const CATEGORIES = ["subscription", "fitness", "transport", "other"];

const MONTHS_OPTIONS = [3, 6, 12, 18, 24, 36, 48, 60];

function monthsFromNow(months: number): string {
  const d = new Date();
  d.setMonth(d.getMonth() + months);
  return d.toISOString().slice(0, 10);
}

function monthsUntil(dateStr: string): number {
  const now = new Date();
  const target = new Date(dateStr);
  return Math.max(
    1,
    Math.round((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24 * 30))
  );
}

function validate(form: PlanRequest): string[] {
  const errors: string[] = [];
  if (form.monthly_income <= 0) errors.push("Monthly income must be greater than 0.");
  if (form.savings_goal <= 0) errors.push("Savings goal must be greater than 0.");
  if (form.savings_goal <= form.current_savings) errors.push("Savings goal must be greater than current savings.");
  if (new Date(form.deadline) <= new Date()) errors.push("Deadline must be in the future.");
  form.recurring.forEach((r, i) => {
    if (!r.name.trim()) errors.push(`Recurring expense #${i + 1} needs a name.`);
    if (r.monthly_amount < 0) errors.push(`Recurring expense "${r.name}" amount cannot be negative.`);
  });
  return errors;
}

export function PlanForm({ onPlan, submitPlan }: Props) {
  const [countries, setCountries] = useState<Country[]>([]);
  const [months, setMonths] = useState(12);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  const [form, setForm] = useState<PlanRequest>({
    country: "US",
    currency: "USD",
    monthly_income: 5000,
    recurring: [],
    savings_goal: 10000,
    deadline: monthsFromNow(12),
    current_savings: 0,
  });

  useEffect(() => {
    listCountries().then(setCountries).catch(console.error);
  }, []);

  const setDeadlineFromMonths = (m: number) => {
    setMonths(m);
    setForm((f) => ({ ...f, deadline: monthsFromNow(m) }));
  };

  const addRecurring = () => {
    setForm((f) => ({
      ...f,
      recurring: [...f.recurring, { name: "", monthly_amount: 0, category: "other" }],
    }));
  };

  const updateRecurring = (i: number, field: keyof RecurringExpense, value: string | number) => {
    setForm((f) => {
      const updated = [...f.recurring];
      updated[i] = { ...updated[i], [field]: value };
      return { ...f, recurring: updated };
    });
  };

  const removeRecurring = (i: number) => {
    setForm((f) => ({ ...f, recurring: f.recurring.filter((_, idx) => idx !== i) }));
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate(form);
    if (errs.length > 0) { setErrors(errs); return; }
    setErrors([]);
    setLoading(true);
    try {
      const plan = await submitPlan(form);
      onPlan(plan);
    } catch (err) {
      setErrors(["Failed to calculate plan. Is the backend running?"]);
    } finally {
      setLoading(false);
    }
  };

  const totalRecurring = form.recurring.reduce((s, r) => s + Number(r.monthly_amount), 0);

  return (
    <form onSubmit={submit} style={styles.form}>
      <h2 style={styles.heading}>Your Details</h2>

      {/* Country */}
      <div style={styles.field}>
        <label style={styles.label}>Country</label>
        <select
          style={styles.input}
          value={form.country}
          onChange={(e) => {
            const country = countries.find((c) => c.code === e.target.value);
            setForm({ ...form, country: e.target.value, currency: country?.currency ?? form.currency });
          }}
        >
          {countries.map((c) => (
            <option key={c.code} value={c.code}>{c.name}</option>
          ))}
        </select>
      </div>

      {/* Income */}
      <div style={styles.field}>
        <label style={styles.label}>Monthly income ({form.currency})</label>
        <input
          style={styles.input}
          type="number"
          min={0}
          value={form.monthly_income}
          onChange={(e) => setForm({ ...form, monthly_income: Number(e.target.value) })}
        />
      </div>

      {/* Savings goal */}
      <div style={styles.field}>
        <label style={styles.label}>
          Savings goal ({form.currency})
          <span style={styles.hint}> — how much do you want to save?</span>
        </label>
        <input
          style={styles.input}
          type="number"
          min={0}
          value={form.savings_goal}
          onChange={(e) => setForm({ ...form, savings_goal: Number(e.target.value) })}
        />
      </div>

      {/* Current savings */}
      <div style={styles.field}>
        <label style={styles.label}>Current savings ({form.currency})</label>
        <input
          style={styles.input}
          type="number"
          min={0}
          value={form.current_savings}
          onChange={(e) => setForm({ ...form, current_savings: Number(e.target.value) })}
        />
      </div>

      {/* Deadline slider */}
      <div style={styles.field}>
        <label style={styles.label}>
          Time to save: <strong>{months} month{months !== 1 ? "s" : ""}</strong>
          <span style={styles.hint}> (deadline: {form.deadline})</span>
        </label>
        <input
          type="range"
          min={1}
          max={60}
          step={1}
          value={months}
          style={{ width: "100%" }}
          onChange={(e) => setDeadlineFromMonths(Number(e.target.value))}
        />
        <div style={styles.sliderTicks}>
          {MONTHS_OPTIONS.map((m) => (
            <button
              key={m}
              type="button"
              style={styles.tickBtn(m === months)}
              onClick={() => setDeadlineFromMonths(m)}
            >
              {m}m
            </button>
          ))}
        </div>
      </div>

      {/* Recurring expenses */}
      <div style={styles.field}>
        <label style={styles.label}>
          Recurring expenses
          {totalRecurring > 0 && (
            <span style={styles.hint}> — {form.currency} {totalRecurring.toFixed(0)}/mo total</span>
          )}
        </label>

        {form.recurring.map((r, i) => (
          <div key={i} style={styles.recurringRow}>
            <input
              style={{ ...styles.input, flex: 2 }}
              placeholder="Name (e.g. Netflix)"
              value={r.name}
              onChange={(e) => updateRecurring(i, "name", e.target.value)}
            />
            <input
              style={{ ...styles.input, flex: 1 }}
              type="number"
              min={0}
              placeholder="Amount"
              value={r.monthly_amount}
              onChange={(e) => updateRecurring(i, "monthly_amount", Number(e.target.value))}
            />
            <select
              style={{ ...styles.input, flex: 1 }}
              value={r.category}
              onChange={(e) => updateRecurring(i, "category", e.target.value)}
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            <button
              type="button"
              style={styles.removeBtn}
              onClick={() => removeRecurring(i)}
              title="Remove"
            >
              ✕
            </button>
          </div>
        ))}

        <button type="button" style={styles.addBtn} onClick={addRecurring}>
          + Add recurring expense
        </button>
      </div>

      {/* Validation errors */}
      {errors.length > 0 && (
        <div style={styles.errorBox}>
          {errors.map((e, i) => <div key={i}>⚠ {e}</div>)}
        </div>
      )}

      <button type="submit" style={styles.submitBtn} disabled={loading}>
        {loading ? "Calculating…" : "Calculate my plan"}
      </button>
    </form>
  );
}

const styles = {
  form: {
    display: "grid" as const,
    gap: 20,
    maxWidth: 520,
  },
  heading: {
    margin: 0,
    fontSize: "1.2rem",
  },
  field: {
    display: "flex" as const,
    flexDirection: "column" as const,
    gap: 6,
  },
  label: {
    fontWeight: 600,
    fontSize: "0.9rem",
  },
  hint: {
    fontWeight: 400,
    color: "#666",
    fontSize: "0.85rem",
  },
  input: {
    padding: "8px 10px",
    borderRadius: 6,
    border: "1px solid #ccc",
    fontSize: "0.95rem",
    width: "100%",
    boxSizing: "border-box" as const,
  },
  recurringRow: {
    display: "flex" as const,
    gap: 8,
    alignItems: "center" as const,
  },
  removeBtn: {
    background: "none",
    border: "none",
    cursor: "pointer",
    color: "#c00",
    fontSize: "1rem",
    padding: "0 4px",
    flexShrink: 0,
  },
  addBtn: {
    background: "none",
    border: "1px dashed #999",
    borderRadius: 6,
    padding: "8px 12px",
    cursor: "pointer",
    color: "#555",
    fontSize: "0.9rem",
    textAlign: "left" as const,
  },
  sliderTicks: {
    display: "flex" as const,
    gap: 6,
    flexWrap: "wrap" as const,
    marginTop: 4,
  },
  tickBtn: (active: boolean) => ({
    padding: "2px 8px",
    borderRadius: 4,
    border: "1px solid #ccc",
    background: active ? "#2563eb" : "#f5f5f5",
    color: active ? "#fff" : "#333",
    cursor: "pointer",
    fontSize: "0.8rem",
  }),
  errorBox: {
    background: "#fff3f3",
    border: "1px solid #f99",
    borderRadius: 6,
    padding: "10px 14px",
    color: "#c00",
    fontSize: "0.9rem",
    display: "grid" as const,
    gap: 4,
  },
  submitBtn: {
    padding: "12px",
    background: "#2563eb",
    color: "#fff",
    border: "none",
    borderRadius: 8,
    fontSize: "1rem",
    fontWeight: 600,
    cursor: "pointer",
  },
};
