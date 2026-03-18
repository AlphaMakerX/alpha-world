import type { PersonaDefinition } from "@/server/features/person/domain/personas/types";

export const BOT1_PERSONA_CONFIG = {
  username: "bot1",
  transferAmount: 10_000_000,
  transferReferenceId: "system_init_bot1_transfer_v1",
  initialPasswordEnvKey: "BOT_INITIAL_PASSWORD",
};

export const BOT1_PERSONA_DEFINITION: PersonaDefinition = {
  personaId: "bot1",
  displayName: "Bot1",
  roleTags: ["system", "demo", "onboarding"],
  skillKeys: ["scripted_playbook", "transaction_demo", "user_guidance"],
  soulSummary: "可复现的示例玩家，负责演示标准玩法流程与资金流。",
  config: BOT1_PERSONA_CONFIG,
};
