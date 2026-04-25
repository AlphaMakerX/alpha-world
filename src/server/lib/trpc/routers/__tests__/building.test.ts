import { describe, it, expect, vi, beforeEach } from "vitest";
import { TRPCError } from "@trpc/server";
import type { Session } from "next-auth";

vi.mock("@/server/features/building/composition", async () => {
  const { z } = await import("zod");
  return {
    executeBuildBuildingUseCase: vi.fn(),
    executeListMyBuildingsUseCase: vi.fn(),
    buildBuildingSchema: z.object({
      ownerUserId: z.string().uuid(),
      plotId: z.number().int().positive(),
      buildingType: z.enum(["residential", "factory", "shop", "purchasing_station"]),
      factorySubtype: z.string().optional(),
    }),
    listMyBuildingsSchema: z.object({
      ownerUserId: z.string().uuid(),
    }),
  };
});

import { createTRPCRouter } from "@/server/lib/trpc/core";
import { buildingRouter } from "@/server/lib/trpc/routers/building";
import { executeBuildBuildingUseCase } from "@/server/features/building/composition";

const mockedBuild = vi.mocked(executeBuildBuildingUseCase);

const router = createTRPCRouter({ building: buildingRouter });

type CallerCtx = { userId: string | null; session: Session | null; tokenPresentButInvalid: boolean };

function makeCaller(overrides?: Partial<CallerCtx>) {
  return router.createCaller({
    userId: overrides?.userId ?? "00000000-0000-0000-0000-000000000001",
    session: overrides?.session ?? ({ user: { id: "u1" }, expires: "" } as Session),
    tokenPresentButInvalid: false,
  });
}

describe("building.build mutation — factorySubtype", () => {
  beforeEach(() => mockedBuild.mockReset());

  it("接受 factorySubtype 参数并透传给用例", async () => {
    mockedBuild.mockResolvedValue({
      ok: true,
      building: {
        id: 1, plotId: 10, type: "factory", subtype: "mine", level: 1,
        status: "active", createdAt: new Date(), updatedAt: new Date(),
      },
    });
    const caller = makeCaller();
    await caller.building.build({ plotId: 10, buildingType: "factory", factorySubtype: "mine" });
    expect(mockedBuild).toHaveBeenCalledWith(
      expect.objectContaining({ factorySubtype: "mine" }),
    );
  });

  it("type=factory 不传 factorySubtype 时用例可以返回错误", async () => {
    mockedBuild.mockResolvedValue({
      ok: false,
      error: "工厂类型建筑必须指定子类型",
      code: "CONFLICT",
    });
    const caller = makeCaller();
    await expect(
      caller.building.build({ plotId: 10, buildingType: "factory" }),
    ).rejects.toThrow(TRPCError);
  });

  it("type=residential 不传 factorySubtype 正常成功", async () => {
    mockedBuild.mockResolvedValue({
      ok: true,
      building: {
        id: 2, plotId: 10, type: "residential", subtype: null, level: 1,
        status: "active", createdAt: new Date(), updatedAt: new Date(),
      },
    });
    const caller = makeCaller();
    const result = await caller.building.build({ plotId: 10, buildingType: "residential" });
    expect(result.ok).toBe(true);
  });
});
