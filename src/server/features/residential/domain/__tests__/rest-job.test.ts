import { describe, it, expect } from "vitest";
import { RestJob } from "@/server/features/residential/domain/entities/rest-job";

function createRestJob(overrides?: Partial<Parameters<typeof RestJob.start>[0]>) {
  return RestJob.start({
    buildingId: 1,
    ownerUserId: "owner-1",
    resterUserId: "rester-1",
    restType: "full_rest",
    staminaGain: 1000,
    cost: 500,
    durationSeconds: 300,
    ...overrides,
  });
}

describe("RestJob.start()", () => {
  it("当传入合法参数时，应创建 status=in_progress 的任务", () => {
    const job = createRestJob();
    expect(job.status).toBe("in_progress");
    expect(job.buildingId).toBe(1);
    expect(job.ownerUserId).toBe("owner-1");
    expect(job.resterUserId).toBe("rester-1");
    expect(job.restType).toBe("full_rest");
    expect(job.staminaGain).toBe(1000);
    expect(job.cost).toBe(500);
  });

  it("finishAt 应等于 startedAt + 300s", () => {
    const job = createRestJob();
    const diff = job.finishAt.getTime() - job.startedAt.getTime();
    expect(diff).toBe(300 * 1000);
  });

  it("当 durationSeconds ≤ 0 时，应抛出 DomainError", () => {
    expect(() => createRestJob({ durationSeconds: 0 })).toThrow();
    expect(() => createRestJob({ durationSeconds: -1 })).toThrow();
  });

  it("当 cost < 0 时，应抛出 DomainError", () => {
    expect(() => createRestJob({ cost: -1 })).toThrow();
  });

  it("当 staminaGain ≤ 0 时，应抛出 DomainError", () => {
    expect(() => createRestJob({ staminaGain: 0 })).toThrow();
    expect(() => createRestJob({ staminaGain: -1 })).toThrow();
  });
});

describe("canCollect(now)", () => {
  it("当 status=in_progress 且 now ≥ finishAt 时，应返回 true", () => {
    const job = createRestJob();
    const futureTime = new Date(job.finishAt.getTime() + 1000);
    expect(job.canCollect(futureTime)).toBe(true);
  });

  it("当 status=in_progress 且 now < finishAt 时，应返回 false", () => {
    const job = createRestJob();
    const earlyTime = new Date(job.startedAt.getTime() + 1000);
    expect(job.canCollect(earlyTime)).toBe(false);
  });

  it("当 status=collected 时，应返回 false", () => {
    const job = createRestJob();
    const futureTime = new Date(job.finishAt.getTime() + 1000);
    job.collect(futureTime);
    expect(job.canCollect(futureTime)).toBe(false);
  });
});

describe("collect(now)", () => {
  it("当可收取时，应将 status 改为 collected 并设置 collectedAt", () => {
    const job = createRestJob();
    const collectTime = new Date(job.finishAt.getTime() + 1000);
    job.collect(collectTime);
    expect(job.status).toBe("collected");
    expect(job.collectedAt).toEqual(collectTime);
  });

  it("当 status 不是 in_progress 时，应抛出 DomainError", () => {
    const job = createRestJob();
    const collectTime = new Date(job.finishAt.getTime() + 1000);
    job.collect(collectTime);
    expect(() => job.collect(collectTime)).toThrow();
  });

  it("当 now < finishAt 时，应抛出 DomainError", () => {
    const job = createRestJob();
    const earlyTime = new Date(job.startedAt.getTime() + 1000);
    expect(() => job.collect(earlyTime)).toThrow();
  });
});

describe("ensureRester(userId)", () => {
  it("当 userId 匹配 resterUserId 时，应不抛出", () => {
    const job = createRestJob();
    expect(() => job.ensureRester("rester-1")).not.toThrow();
  });

  it("当 userId 不匹配时，应抛出 DomainError", () => {
    const job = createRestJob();
    expect(() => job.ensureRester("other-user")).toThrow();
  });
});

describe("rehydrate", () => {
  it("当从持久化数据恢复时，应正确还原所有属性", () => {
    const now = new Date();
    const finishAt = new Date(now.getTime() + 300_000);
    const job = RestJob.rehydrate({
      id: 42,
      buildingId: 1,
      ownerUserId: "owner-1",
      resterUserId: "rester-1",
      restType: "full_rest",
      staminaGain: 1000,
      cost: 500,
      status: "in_progress",
      startedAt: now,
      finishAt,
      collectedAt: null,
      createdAt: now,
      updatedAt: now,
    });
    expect(job.id).toBe(42);
    expect(job.buildingId).toBe(1);
    expect(job.status).toBe("in_progress");
    expect(job.staminaGain).toBe(1000);
  });
});
