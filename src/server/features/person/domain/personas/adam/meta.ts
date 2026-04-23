/**
 * Adam 角色元数据
 *
 * Adam 是系统核心角色，作为资金池托管者负责初始经济秩序和新手赠金治理。
 * 其固定 UUID 用于系统初始化时创建账户。
 */
import type { PersonaDefinition } from "@/server/features/person/domain/personas/types";

/** Adam 角色的基础配置（用户 ID、用户名、初始资金、初始密码） */
export const ADAM_PERSONA_CONFIG = {
  userId: "00000000-0000-0000-0000-000000000001",
  username: "adam",
  initialMoney: 1_000_000_000,
  initialPassword: process.env.ADAM_INITIAL_PASSWORD ?? "",
};

/** Adam 角色的完整定义，包含技能、标签和灵魂描述 */
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
