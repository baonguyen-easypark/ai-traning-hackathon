import { useRef, useState } from "react";
import { createPlan, updatePlan } from "./api/client";
import { Dashboard } from "./dashboard/Dashboard";
import { PlanForm } from "./forms/PlanForm";
import type { PlanRequest, PlanResponse } from "./types/schemas";

export default function App() {
  const [plan, setPlan] = useState<PlanResponse | null>(null);
  const [request, setRequest] = useState<PlanRequest | null>(null);
  const planIdRef = useRef<number | null>(null);

  const handlePlan = (req: PlanRequest, res: PlanResponse) => {
    if (res.id !== undefined) planIdRef.current = res.id;
    setRequest(req);
    setPlan(res);
  };

  const handleReplan = async (req: PlanRequest) => {
    const id = planIdRef.current;
    const res = id !== null ? await updatePlan(id, req) : await createPlan(req);
    if (res.id !== undefined) planIdRef.current = res.id;
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
