/**
 * Bot1 Manager 角色元数据
 *
 * Bot1 Manager 是系统大管家角色，负责建造收购站、发布收购订单并维持经济系统流动性。
 */
import type { PersonaDefinition } from "@/server/features/person/domain/personas/types";

/** Bot1 Manager 角色的基础配置 */
export const BOT1_MANAGER_PERSONA_CONFIG = {
  username: "bot1-manager",
  transferAmount: 10_000_000,
  transferReferenceId: "system_init_bot1_manager_transfer_v1",
  initialPasswordEnvKey: "BOT_INITIAL_PASSWORD",
};

/** Bot1 Manager 角色的完整定义 */
export const BOT1_MANAGER_PERSONA_DEFINITION: PersonaDefinition = {
  personaId: "bot1-manager",
  displayName: "Bot1 Manager",
  roleTags: ["system", "economy", "purchasing-station"],
  skillKeys: [
    "purchasing_station_operations",
    "buy_order_management",
    "economic_stabilization",
    "budget_governance",
  ],
  soulSummary:
    "系统大管家，负责建造收购站、定期发布收购订单并维持经济系统流动性，让玩家可持续盈利。",
  config: BOT1_MANAGER_PERSONA_CONFIG,
};
