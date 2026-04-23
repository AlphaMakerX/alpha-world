/**
 * 更新用户位置用例
 *
 * 接收用户 ID 和新坐标，更新用户在地图中的位置并持久化。
 */
import type { UserRepository } from "@/server/features/person/domain/repositories/user-repository";

/** 更新成功的返回结构 */
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

/** 更新失败的返回结构 */
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

/** 执行更新用户位置用例 */
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

  user.updatePosition(input.position);
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
