import { useRef, useState } from "react";
import { createPlan, updatePlan } from "./api/client";
import { Dashboard } from "./dashboard/Dashboard";
import { PlanForm } from "./forms/PlanForm";
import type { PlanRequest, PlanResponse } from "./types/schemas";

export default function App() {
  const [plan, setPlan] = useState<PlanResponse | null>(null);
  const planIdRef = useRef<number | null>(null);

  const handleReplan = async (req: PlanRequest): Promise<PlanResponse> => {
    const id = planIdRef.current;
    const result = id !== null ? await updatePlan(id, req) : await createPlan(req);
    if (result.id !== undefined) planIdRef.current = result.id;
    return result;
  };

  return (
    <div style={{ maxWidth: 960, margin: "40px auto", padding: "0 16px" }}>
      <h1>Budget Planner</h1>
      <PlanForm onPlan={setPlan} submitPlan={handleReplan} />
      {plan && <Dashboard plan={plan} />}
    </div>
  );
}
