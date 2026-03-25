import type { UserRepository } from "@/server/features/person/domain/repositories/user-repository";
import { calculateStaminaCostByDistance } from "@/shared/gameplay/player-stamina";

type UpdateUserPositionSuccessResult = {
  ok: true;
  user: {
    position: {
      x: number;
      y: number;
    };
    stamina: {
      current: number;
      max: number;
    };
  };
};

type UpdateUserPositionFailureResult = {
  ok: false;
  error: string;
  status: 400 | 404;
};

export type UpdateUserPositionResult =
  | UpdateUserPositionSuccessResult
  | UpdateUserPositionFailureResult;

export type UpdateUserPositionUseCaseDeps = {
  userRepository: UserRepository;
};

export async function executeUpdateUserPositionUseCase(
  input: {
    userId: string;
    position: { x: number; y: number };
  },
  deps: UpdateUserPositionUseCaseDeps,
): Promise<UpdateUserPositionResult> {
  const user = await deps.userRepository.findById(input.userId);
  if (!user) {
    return {
      ok: false,
      error: "用户不存在",
      status: 404,
    };
  }

  const now = new Date();
  user.recoverStamina(now);
  const distance = Math.hypot(input.position.x - user.positionX, input.position.y - user.positionY);
  const staminaCost = calculateStaminaCostByDistance(distance);
  if (user.consumeStamina(staminaCost, now)) {
    user.updatePosition(input.position);
  }
  await deps.userRepository.save(user);

  return {
    ok: true,
    user: {
      position: {
        x: user.positionX,
        y: user.positionY,
      },
      stamina: {
        current: user.staminaCurrent,
        max: user.staminaMax,
      },
    },
  };
}
