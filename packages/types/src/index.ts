export type ServiceKey = "tuejecutiva" | "leados" | "billing" | (string & {});

export type SubscriptionStatus =
  | "trial"
  | "active"
  | "past_due"
  | "canceled"
  | "paused"
  | "inactive";

export type AccessDecision = {
  allowed: boolean;
  reason: "active_subscription" | "subscription_not_found" | "subscription_inactive";
  status: SubscriptionStatus | null;
};

export type GlobalRole =
  | "superadmin"
  | "admin_billing"
  | "admin_tuejecutiva"
  | "admin_leados";
