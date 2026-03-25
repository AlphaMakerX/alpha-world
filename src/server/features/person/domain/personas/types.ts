export const PERSONA_IDS = ["adam", "bot1-manager"] as const;

export type PersonaId = (typeof PERSONA_IDS)[number];

export type PersonaSkillKey =
  | "treasury_management"
  | "onboarding_grant_management"
  | "economy_observability"
  | "scripted_playbook"
  | "transaction_demo"
  | "user_guidance"
  | "purchasing_station_operations"
  | "buy_order_management"
  | "economic_stabilization"
  | "budget_governance";

export type PersonaDefinition = {
  personaId: PersonaId;
  displayName: string;
  roleTags: string[];
  skillKeys: PersonaSkillKey[];
  soulSummary: string;
  config: Record<string, string | number>;
};
