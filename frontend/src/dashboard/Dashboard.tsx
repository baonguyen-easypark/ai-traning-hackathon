/**
 * Owner: Person 5 (Dashboard & Charts).
 *
 * TODO:
 *  - Savings-trajectory line chart (cumulative savings vs time, to projected_date)
 *  - Editable goal/deadline sliders that call PUT /plan/{id} and update in place
 *  - Highlight "on track" vs "behind schedule" styling
 *  - Localize currency formatting (use form.currency from the request)
 */
import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import type { PlanResponse } from "../types/schemas";

interface Props {
  plan: PlanResponse;
}

const COLORS = ["#4f46e5", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#14b8a6", "#ec4899"];

export function Dashboard({ plan }: Props) {
  const chartData = plan.breakdown
    .filter((b) => b.monthly_amount > 0)
    .map((b) => ({ name: b.category, value: b.monthly_amount }));

  return (
    <section style={{ marginTop: 32 }}>
      <h2>Your plan</h2>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
        <Stat label="Per day" value={plan.daily_budget} />
        <Stat label="Per week" value={plan.weekly_budget} />
        <Stat label="Per month" value={plan.monthly_budget} />
      </div>

      <p style={{ marginTop: 16 }}>
        Projected to hit goal on <strong>{plan.projected_date}</strong>{" "}
        <span style={{ color: plan.on_track ? "#10b981" : "#ef4444" }}>
          ({plan.on_track ? "on track" : "behind"})
        </span>
      </p>

      <div style={{ height: 320, marginTop: 24 }}>
        <ResponsiveContainer>
          <PieChart>
            <Pie data={chartData} dataKey="value" nameKey="name" label>
              {chartData.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div style={{ background: "white", padding: 16, borderRadius: 8, boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
      <div style={{ fontSize: 12, color: "#6b7280" }}>{label}</div>
      <div style={{ fontSize: 24, fontWeight: 600 }}>${value.toFixed(2)}</div>
    </div>
  );
}
