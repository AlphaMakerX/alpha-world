import type { PersonaDefinition } from "@/server/features/person/domain/personas/types";

export const ADAM_PERSONA_CONFIG = {
  userId: "00000000-0000-0000-0000-000000000001",
  username: "adam",
  initialMoney: 1_000_000_000,
  initialPassword: process.env.ADAM_INITIAL_PASSWORD ?? "",
};

export const ADAM_PERSONA_DEFINITION: PersonaDefinition = {
  personaId: "adam",
  displayName: "Adam",
  roleTags: ["system", "treasury", "stability"],
  skillKeys: [
    "treasury_management",
    "onboarding_grant_management",
    "economy_observability",
  ],
  soulSummary: "系统资金池托管者，负责初始经济秩序与新手赠金治理。",
  config: ADAM_PERSONA_CONFIG,
};
