import type { PersonaId, PersonaSkillKey } from "@/server/features/person/domain/personas";
import { getPersonaDefinition } from "@/server/features/person/domain/personas";

type GetPersonaProfileSuccessResult = {
  ok: true;
  profile: {
    id: PersonaId;
    displayName: string;
    roleTags: string[];
    soulSummary: string;
    skills: PersonaSkillKey[];
  };
};

export type GetPersonaProfileResult = GetPersonaProfileSuccessResult;

export async function executeGetPersonaProfileUseCase(input: {
  personaId: PersonaId;
}): Promise<GetPersonaProfileResult> {
  const persona = getPersonaDefinition(input.personaId);

  return {
    ok: true,
    profile: {
      id: persona.personaId,
      displayName: persona.displayName,
      roleTags: persona.roleTags,
      soulSummary: persona.soulSummary,
      skills: persona.skillKeys,
    },
  };
}
