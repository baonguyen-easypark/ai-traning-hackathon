import { useState } from "react";
import { createPlan } from "./api/client";
import { Dashboard } from "./dashboard/Dashboard";
import { PlanForm } from "./forms/PlanForm";
import type { PlanRequest, PlanResponse } from "./types/schemas";

export default function App() {
  const [plan, setPlan] = useState<PlanResponse | null>(null);
  const [request, setRequest] = useState<PlanRequest | null>(null);

  const handlePlan = (req: PlanRequest, res: PlanResponse) => {
    setRequest(req);
    setPlan(res);
  };

  const handleReplan = async (req: PlanRequest) => {
    const res = await createPlan(req);
    setRequest(req);
    setPlan(res);
  };

  return (
    <div style={{ maxWidth: 960, margin: "40px auto", padding: "0 16px" }}>
      <h1>Budget Planner</h1>
      <PlanForm onPlan={handlePlan} />
      {plan && request && (
        <Dashboard plan={plan} request={request} onReplan={handleReplan} />
      )}
    </div>
  );
}
