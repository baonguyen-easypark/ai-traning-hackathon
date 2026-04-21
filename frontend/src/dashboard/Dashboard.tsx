/**
 * Owner: Person 5 (Dashboard & Charts).
 */
import { useEffect, useState } from "react";
import {
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { PlanRequest, PlanResponse } from "../types/schemas";

interface Props {
  plan: PlanResponse;
  request: PlanRequest;
  onReplan: (req: PlanRequest) => Promise<void>;
}

const ESSENTIAL_COLOR = "#4f46e5";
const DISC_COLORS = ["#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#14b8a6", "#ec4899"];

export function Dashboard({ plan, request, onReplan }: Props) {
  const [localGoal, setLocalGoal] = useState(request.savings_goal);
  const [localDeadline, setLocalDeadline] = useState(request.deadline);
  const [replanning, setReplanning] = useState(false);
  const [replanError, setReplanError] = useState<string | null>(null);

  // Reset sliders when the form submits a brand-new plan (different income/country/etc.)
  useEffect(() => { setLocalGoal(request.savings_goal); }, [request.savings_goal]);
  useEffect(() => { setLocalDeadline(request.deadline); }, [request.deadline]);

  const fmt = (v: number) =>
    new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: request.currency,
      maximumFractionDigits: 2,
    }).format(v);

  // Cap months so Infinity (income barely covers essentials) doesn't crash Array.from
  const safeMonths = isFinite(plan.months_to_goal) ? plan.months_to_goal : 60;
  const months = Math.min(Math.max(Math.ceil(safeMonths) + 3, 6), 120);
  const trajectoryData = Array.from({ length: months + 1 }, (_, i) => ({
    month: `M${i}`,
    Savings: +(request.current_savings + i * plan.monthly_savings).toFixed(2),
  }));

  // Pie data — essentials first (indigo), then discretionary (multi-colour)
  const essentials = plan.breakdown.filter((b) => b.is_essential && b.monthly_amount > 0);
  const discretionary = plan.breakdown.filter((b) => !b.is_essential && b.monthly_amount > 0);
  const chartData = [...essentials, ...discretionary];

  const handleReplan = async () => {
    setReplanning(true);
    setReplanError(null);
    try {
      await onReplan({ ...request, savings_goal: localGoal, deadline: localDeadline });
    } catch {
      setReplanError("Recalculation failed — check that the backend is running and try again.");
    } finally {
      setReplanning(false);
    }
  };

  const sliderChanged = localGoal !== request.savings_goal || localDeadline !== request.deadline;

  return (
    <section style={{ marginTop: 32 }}>

      {/* On-track banner */}
      <div
        style={{
          padding: "12px 16px",
          borderRadius: 8,
          marginBottom: 24,
          background: plan.on_track ? "#d1fae5" : "#fee2e2",
          borderLeft: `4px solid ${plan.on_track ? "#10b981" : "#ef4444"}`,
          color: plan.on_track ? "#065f46" : "#991b1b",
          fontWeight: 500,
        }}
      >
        {plan.on_track
          ? `On track — projected to hit your goal by ${plan.projected_date}`
          : `Behind schedule — projected date ${plan.projected_date} is after your deadline`}
      </div>

      <h2 style={{ marginBottom: 16 }}>Your plan</h2>

      {/* Budget stat cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
        <Stat label="Per day" value={fmt(plan.daily_budget)} accent={plan.on_track ? "#10b981" : "#ef4444"} />
        <Stat label="Per week" value={fmt(plan.weekly_budget)} accent={plan.on_track ? "#10b981" : "#ef4444"} />
        <Stat label="Per month" value={fmt(plan.monthly_budget)} accent={plan.on_track ? "#10b981" : "#ef4444"} />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginTop: 12 }}>
        <Stat label="Monthly savings" value={fmt(plan.monthly_savings)} />
        <Stat label="Total essentials" value={fmt(plan.total_essentials)} />
        <Stat label="Total recurring" value={fmt(plan.total_recurring)} />
      </div>

      {/* Savings trajectory line chart */}
      <h3 style={{ marginTop: 36, marginBottom: 12 }}>Savings trajectory</h3>
      <div style={{ height: 280 }}>
        <ResponsiveContainer>
          <LineChart data={trajectoryData} margin={{ top: 8, right: 24, bottom: 8, left: 8 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
            <XAxis dataKey="month" tick={{ fontSize: 12 }} />
            <YAxis tickFormatter={(v) => fmt(v)} tick={{ fontSize: 11 }} width={90} />
            <Tooltip formatter={(v: number) => [fmt(v), "Savings"]} />
            <ReferenceLine
              y={request.savings_goal}
              stroke="#4f46e5"
              strokeDasharray="6 3"
              label={{ value: "Goal", position: "insideTopRight", fontSize: 12, fill: "#4f46e5" }}
            />
            <Line
              type="monotone"
              dataKey="Savings"
              stroke="#10b981"
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Spending breakdown pie chart */}
      <h3 style={{ marginTop: 36, marginBottom: 4 }}>Monthly breakdown</h3>
      <p style={{ fontSize: 12, color: "#6b7280", margin: "0 0 12px" }}>
        <span style={{ color: ESSENTIAL_COLOR, fontWeight: 700 }}>■</span> Essential &nbsp;
        <span style={{ color: DISC_COLORS[0], fontWeight: 700 }}>■</span> Discretionary
      </p>

      {chartData.length === 0 ? (
        <p style={{ color: "#9ca3af", fontStyle: "italic" }}>No spending categories to display.</p>
      ) : (
        <div style={{ height: 320 }}>
          <ResponsiveContainer>
            <PieChart>
              <Pie
                data={chartData}
                dataKey="monthly_amount"
                nameKey="category"
                label={({ category, percent }: { category: string; percent: number }) =>
                  `${category} ${(percent * 100).toFixed(0)}%`
                }
              >
                {chartData.map((entry, i) => {
                  const color = entry.is_essential
                    ? ESSENTIAL_COLOR
                    : DISC_COLORS[discretionary.findIndex((d) => d.category === entry.category) % DISC_COLORS.length];
                  return <Cell key={i} fill={color} />;
                })}
              </Pie>
              <Tooltip formatter={(v: number) => fmt(v)} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Adjustable goal / deadline — recalculates via POST /plan until PUT is available */}
      <h3 style={{ marginTop: 36, marginBottom: 16 }}>Adjust your plan</h3>
      <div style={{ display: "grid", gap: 20, maxWidth: 480 }}>
        <label style={{ display: "grid", gap: 6 }}>
          <span style={{ fontSize: 13, color: "#374151" }}>
            Savings goal: <strong>{fmt(localGoal)}</strong>
          </span>
          <input
            type="range"
            min={Math.max(request.current_savings, 0)}
            max={request.monthly_income * 36}
            step={100}
            value={localGoal}
            onChange={(e) => setLocalGoal(Number(e.target.value))}
            style={{ accentColor: "#4f46e5" }}
          />
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#9ca3af" }}>
            <span>{fmt(request.current_savings)}</span>
            <span>{fmt(request.monthly_income * 36)}</span>
          </div>
        </label>

        <label style={{ display: "grid", gap: 6 }}>
          <span style={{ fontSize: 13, color: "#374151" }}>
            Deadline: <strong>{localDeadline}</strong>
          </span>
          <input
            type="date"
            value={localDeadline}
            min={new Date().toISOString().slice(0, 10)}
            onChange={(e) => setLocalDeadline(e.target.value)}
            style={{ padding: "6px 8px", borderRadius: 6, border: "1px solid #d1d5db", fontSize: 14 }}
          />
        </label>

        <button
          onClick={handleReplan}
          disabled={replanning || !sliderChanged}
          style={{
            padding: "10px 24px",
            background: sliderChanged && !replanning ? "#4f46e5" : "#e5e7eb",
            color: sliderChanged && !replanning ? "white" : "#9ca3af",
            border: "none",
            borderRadius: 6,
            cursor: replanning || !sliderChanged ? "not-allowed" : "pointer",
            fontWeight: 600,
            fontSize: 14,
            transition: "background 0.15s",
          }}
        >
          {replanning ? "Recalculating…" : "Recalculate"}
        </button>

        {replanError && (
          <p style={{ color: "#ef4444", fontSize: 13, margin: 0 }}>{replanError}</p>
        )}
      </div>
    </section>
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <div
      style={{
        background: "white",
        padding: 16,
        borderRadius: 8,
        boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
        borderTop: accent ? `3px solid ${accent}` : undefined,
      }}
    >
      <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 20, fontWeight: 600, color: "#111827" }}>{value}</div>
    </div>
  );
}
