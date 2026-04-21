import { useState } from "react";
import { PlanForm } from "./forms/PlanForm";
import { Dashboard } from "./dashboard/Dashboard";
import type { PlanResponse } from "./types/schemas";

export default function App() {
  const [plan, setPlan] = useState<PlanResponse | null>(null);

  return (
    <div style={{ maxWidth: 960, margin: "40px auto", padding: "0 16px" }}>
      <h1>Budget Planner</h1>
      <PlanForm onPlan={setPlan} />
      {plan && <Dashboard plan={plan} />}
    </div>
  );
}
