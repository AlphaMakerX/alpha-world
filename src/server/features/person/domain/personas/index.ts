import {
  ADAM_PERSONA_CONFIG,
  ADAM_PERSONA_DEFINITION,
} from "@/server/features/person/domain/personas/adam/meta";
import {
  BOT1_MANAGER_PERSONA_CONFIG,
  BOT1_MANAGER_PERSONA_DEFINITION,
} from "@/server/features/person/domain/personas/bot1-manager/meta";
import type { PersonaDefinition, PersonaId } from "@/server/features/person/domain/personas/types";

export { PERSONA_IDS } from "@/server/features/person/domain/personas/types";
export type {
  PersonaDefinition,
  PersonaId,
  PersonaSkillKey,
} from "@/server/features/person/domain/personas/types";
export {
  ADAM_PERSONA_CONFIG,
  ADAM_PERSONA_DEFINITION,
  BOT1_MANAGER_PERSONA_CONFIG,
  BOT1_MANAGER_PERSONA_DEFINITION,
};

export const PERSONA_DEFINITIONS: Record<PersonaId, PersonaDefinition> = {
  adam: ADAM_PERSONA_DEFINITION,
  "bot1-manager": BOT1_MANAGER_PERSONA_DEFINITION,
};

export function getPersonaDefinition(personaId: PersonaId): PersonaDefinition {
  return PERSONA_DEFINITIONS[personaId];
}
