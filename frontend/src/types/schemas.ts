// Mirrors backend/app/schemas.py. Keep in sync — this is the cross-team contract.

export interface RecurringExpense {
  name: string;
  monthly_amount: number;
  category: string;
}

export interface PlanRequest {
  country: string;              // ISO-3166-1 alpha-2
  currency: string;
  monthly_income: number;
  recurring: RecurringExpense[];
  savings_goal: number;
  deadline: string;             // ISO date (YYYY-MM-DD)
  current_savings: number;
}

export interface CategoryBudget {
  category: string;
  monthly_amount: number;
  is_essential: boolean;
}

export interface PlanResponse {
  id?: number;
  daily_budget: number;
  weekly_budget: number;
  monthly_budget: number;
  months_to_goal: number;
  projected_date: string;
  on_track: boolean;
  breakdown: CategoryBudget[];
  total_essentials: number;
  total_recurring: number;
  monthly_savings: number;
}

export interface Country {
  code: string;
  name: string;
  currency: string;
}
