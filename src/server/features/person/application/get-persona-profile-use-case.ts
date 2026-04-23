/**
 * 获取角色（Persona）档案用例
 *
 * 根据角色 ID 查询角色的展示信息，包括名称、标签、技能和灵魂描述。
 */
import type { PersonaId, PersonaSkillKey } from "@/server/features/person/domain/personas";
import { getPersonaDefinition } from "@/server/features/person/domain/personas";

/** 查询成功的返回结构 */
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

/** 执行获取角色档案用例 */
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
