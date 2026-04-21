import axios from "axios";
import type { Country, PlanRequest, PlanResponse } from "../types/schemas";

const api = axios.create({ baseURL: "/api" });

export async function createPlan(req: PlanRequest): Promise<PlanResponse> {
  const { data } = await api.post<PlanResponse>("/plan", req);
  return data;
}

export async function updatePlan(id: number, req: PlanRequest): Promise<PlanResponse> {
  const { data } = await api.put<PlanResponse>(`/plan/${id}`, req);
  return data;
}

export async function listCountries(): Promise<Country[]> {
  const { data } = await api.get<Country[]>("/countries");
  return data;
}
