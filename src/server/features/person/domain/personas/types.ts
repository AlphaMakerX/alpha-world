/**
 * 系统角色（Persona）类型定义
 *
 * 定义系统内置角色的 ID、技能键、角色定义等核心类型。
 * 每个 Persona 代表一个系统级虚拟角色（如 Adam、Bot1 Manager）。
 */

/** 所有可用角色 ID 常量数组 */
export const PERSONA_IDS = ["adam", "bot1-manager"] as const;

/** 角色 ID 联合类型 */
export type PersonaId = (typeof PERSONA_IDS)[number];

/** 角色技能键，标识 Persona 所具备的能力 */
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

/** 角色完整定义，描述一个系统角色的所有元数据 */
export type PersonaDefinition = {
  personaId: PersonaId;
  displayName: string;
  roleTags: string[];
  skillKeys: PersonaSkillKey[];
  soulSummary: string;
  config: Record<string, string | number>;
};
