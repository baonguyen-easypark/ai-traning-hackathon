/**
 * Owner: Person 4 (Input Forms).
 *
 * TODO:
 *  - Full recurring-expenses editor (add/remove rows: name, amount, category)
 *  - Deadline slider (not just date picker) so users can drag to re-plan
 *  - Goal slider tied to a preview of "months to goal"
 *  - Validation: income > 0, goal > current_savings, deadline in future
 */
import { useEffect, useState } from "react";
import { createPlan, listCountries } from "../api/client";
import type { Country, PlanRequest, PlanResponse } from "../types/schemas";

interface Props {
  onPlan: (plan: PlanResponse) => void;
}

export function PlanForm({ onPlan }: Props) {
  const [countries, setCountries] = useState<Country[]>([]);
  const [form, setForm] = useState<PlanRequest>({
    country: "US",
    currency: "USD",
    monthly_income: 5000,
    recurring: [],
    savings_goal: 10000,
    deadline: new Date(Date.now() + 365 * 86400000).toISOString().slice(0, 10),
    current_savings: 0,
  });

  useEffect(() => {
    listCountries().then(setCountries).catch(console.error);
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const plan = await createPlan(form);
    onPlan(plan);
  };

  return (
    <form onSubmit={submit} style={{ display: "grid", gap: 12, maxWidth: 420 }}>
      <label>
        Country
        <select
          value={form.country}
          onChange={(e) => {
            const country = countries.find((c) => c.code === e.target.value);
            setForm({
              ...form,
              country: e.target.value,
              currency: country?.currency ?? form.currency,
            });
          }}
        >
          {countries.map((c) => (
            <option key={c.code} value={c.code}>
              {c.name}
            </option>
          ))}
        </select>
      </label>

      <label>
        Monthly income ({form.currency})
        <input
          type="number"
          value={form.monthly_income}
          onChange={(e) => setForm({ ...form, monthly_income: Number(e.target.value) })}
        />
      </label>

      <label>
        Savings goal ({form.currency})
        <input
          type="number"
          value={form.savings_goal}
          onChange={(e) => setForm({ ...form, savings_goal: Number(e.target.value) })}
        />
      </label>

      <label>
        Current savings ({form.currency})
        <input
          type="number"
          value={form.current_savings}
          onChange={(e) => setForm({ ...form, current_savings: Number(e.target.value) })}
        />
      </label>

      <label>
        Deadline
        <input
          type="date"
          value={form.deadline}
          onChange={(e) => setForm({ ...form, deadline: e.target.value })}
        />
      </label>

      <button type="submit">Calculate plan</button>
    </form>
  );
}
