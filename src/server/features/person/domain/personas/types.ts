export const PERSONA_IDS = ["adam", "bot1"] as const;

export type PersonaId = (typeof PERSONA_IDS)[number];

export type PersonaSkillKey =
  | "treasury_management"
  | "onboarding_grant_management"
  | "economy_observability"
  | "scripted_playbook"
  | "transaction_demo"
  | "user_guidance";

export type PersonaDefinition = {
  personaId: PersonaId;
  displayName: string;
  roleTags: string[];
  skillKeys: PersonaSkillKey[];
  soulSummary: string;
  config: Record<string, string | number>;
};
