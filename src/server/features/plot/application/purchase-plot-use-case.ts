import { z } from "zod";
import { DomainError } from "@/server/features/shared-kernel/domain/domain-error";
import { plotRepository } from "@/server/features/plot/infrastructure";

const purchasePlotSchema = z.object({
  plotId: z.number().int().positive(),
  buyerUserId: z.string().uuid("用户 ID 不合法"),
});

type PurchasePlotSuccessResult = {
  ok: true;
  plot: {
    id: number;
    x: number;
    y: number;
    ownerUserId: string | null;
    status: "available" | "owned" | "locked";
    price: number;
    createdAt: Date;
    updatedAt: Date;
  };
};

type PurchasePlotFailureResult = {
  ok: false;
  error: string;
  status: 400 | 404 | 409;
};

export type PurchasePlotResult = PurchasePlotSuccessResult | PurchasePlotFailureResult;

export async function executePurchasePlotUseCase(
  input: unknown,
): Promise<PurchasePlotResult> {
  const parsed = purchasePlotSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "参数校验失败",
      status: 400,
    };
  }

  const plot = await plotRepository.findById(parsed.data.plotId);
  if (!plot) {
    return {
      ok: false,
      error: "地块不存在",
      status: 404,
    };
  }

  try {
    plot.purchaseBy(parsed.data.buyerUserId);
  } catch (error) {
    if (error instanceof DomainError) {
      return {
        ok: false,
        error: error.message,
        status: 409,
      };
    }
    throw error;
  }

  await plotRepository.save(plot);

  return {
    ok: true,
    plot: {
      id: plot.id,
      x: plot.coordinate.getX(),
      y: plot.coordinate.getY(),
      ownerUserId: plot.ownerUserId,
      status: plot.status,
      price: plot.price,
      createdAt: plot.createdAt,
      updatedAt: plot.updatedAt,
    },
  };
}
