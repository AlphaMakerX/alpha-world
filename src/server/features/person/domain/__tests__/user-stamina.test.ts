import { describe, it, expect } from "vitest";
import { User } from "@/server/features/person/domain/entities/user";
import {
  PLAYER_MAX_STAMINA,
  PLAYER_STAMINA_RECOVERY_PER_SECOND,
  STAMINA_COST_PER_SECOND,
} from "@/shared/gameplay/player-stamina";

function createUser(staminaCurrent = 500, staminaMax = 1000) {
  return User.rehydrate({
    id: "user-1",
    username: { getValue: () => "test" } as any,
    passwordHash: "hash",
    money: 10000,
    positionX: 0,
    positionY: 0,
    staminaCurrent,
    staminaMax,
    staminaUpdatedAt: new Date("2026-01-01T00:00:00Z"),
    createdAt: new Date("2026-01-01T00:00:00Z"),
    updatedAt: new Date("2026-01-01T00:00:00Z"),
  });
}

describe("consumeStamina", () => {
  it("当体力充足（500）且消耗 60 时，应扣除体力至 440", () => {
    const user = createUser(500);
    user.consumeStamina(60);
    expect(user.staminaCurrent).toBeCloseTo(440);
  });

  it("消耗后应更新 staminaUpdatedAt", () => {
    const user = createUser(500);
    const before = user.staminaUpdatedAt;
    user.consumeStamina(60);
    expect(user.staminaUpdatedAt.getTime()).toBeGreaterThanOrEqual(before.getTime());
  });

  it("当体力恰好等于消耗量时，应扣除至 0", () => {
    const user = createUser(60);
    user.consumeStamina(60);
    expect(user.staminaCurrent).toBeCloseTo(0);
  });

  it("当体力不足（30）且消耗 60 时，应抛出 DomainError", () => {
    const user = createUser(30);
    expect(() => user.consumeStamina(60)).toThrow("体力不足");
  });

  it("当消耗量为 0 时，应不改变体力值", () => {
    const user = createUser(500);
    user.consumeStamina(0);
    expect(user.staminaCurrent).toBe(500);
  });

  it("当消耗量为负数时，应抛出 DomainError", () => {
    const user = createUser(500);
    expect(() => user.consumeStamina(-10)).toThrow();
  });

  it("当消耗量为小数（0.5）时，应正确扣除", () => {
    const user = createUser(500);
    user.consumeStamina(0.5);
    expect(user.staminaCurrent).toBeCloseTo(499.5);
  });
});

describe("recoverStaminaByAmount", () => {
  it("当当前体力 200、恢复 300 时，应增至 500", () => {
    const user = createUser(200);
    user.recoverStaminaByAmount(300);
    expect(user.staminaCurrent).toBeCloseTo(500);
  });

  it("当当前体力 800、恢复 1000 时，应截断至上限 1000", () => {
    const user = createUser(800);
    user.recoverStaminaByAmount(1000);
    expect(user.staminaCurrent).toBe(1000);
  });

  it("当当前体力已满（1000）时，应保持 1000 不变", () => {
    const user = createUser(1000);
    user.recoverStaminaByAmount(500);
    expect(user.staminaCurrent).toBe(1000);
  });

  it("当恢复量为 0 时，应不改变体力值", () => {
    const user = createUser(200);
    user.recoverStaminaByAmount(0);
    expect(user.staminaCurrent).toBe(200);
  });

  it("当恢复量为负数时，应抛出 DomainError", () => {
    const user = createUser(200);
    expect(() => user.recoverStaminaByAmount(-10)).toThrow();
  });

  it("恢复后应更新 staminaUpdatedAt", () => {
    const user = createUser(200);
    const before = user.staminaUpdatedAt;
    user.recoverStaminaByAmount(100);
    expect(user.staminaUpdatedAt.getTime()).toBeGreaterThanOrEqual(before.getTime());
  });
});

describe("体力常量", () => {
  it("PLAYER_MAX_STAMINA 应为 1000", () => {
    expect(PLAYER_MAX_STAMINA).toBe(1000);
  });

  it("PLAYER_STAMINA_RECOVERY_PER_SECOND 应等于 10/3600", () => {
    expect(PLAYER_STAMINA_RECOVERY_PER_SECOND).toBeCloseTo(10 / 3600);
  });

  it("STAMINA_COST_PER_SECOND 应等于 0.1", () => {
    expect(STAMINA_COST_PER_SECOND).toBe(0.1);
  });

  it("新玩家注册时初始体力应为 1000", () => {
    const user = User.register({
      id: "new-user",
      username: "newbie",
      passwordHash: "hash",
    });
    expect(user.staminaCurrent).toBe(1000);
    expect(user.staminaMax).toBe(1000);
  });
});
