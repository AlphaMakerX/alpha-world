/**
 * 获取当前用户信息用例
 *
 * 根据用户 ID 查询用户详情，同时触发体力自动恢复计算。
 * 若体力值发生变化则持久化更新后的体力数据。
 */
import type { UserRepository } from "@/server/features/person/domain/repositories/user-repository";

/** 查询成功的返回结构 */
type GetCurrentUserSuccessResult = {
  ok: true;
  user: {
    id: string;
    username: string;
    money: number;
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

/** 查询失败的返回结构 */
type GetCurrentUserFailureResult = {
  ok: false;
  error: string;
  status: 400 | 404;
};

export type GetCurrentUserResult =
  | GetCurrentUserSuccessResult
  | GetCurrentUserFailureResult;

export type GetCurrentUserUseCaseDeps = {
  userRepository: UserRepository;
};

/** 执行获取当前用户信息用例，自动恢复体力后返回用户数据 */
export async function executeGetCurrentUserUseCase(input: {
  userId: string;
}, deps: GetCurrentUserUseCaseDeps): Promise<GetCurrentUserResult> {
  const user = await deps.userRepository.findById(input.userId);
  if (!user) {
    return {
      ok: false,
      error: "用户不存在",
      status: 404,
    };
  }

  // 记录恢复前的体力值，用于判断是否需要持久化
  const staminaCurrentBefore = user.staminaCurrent;
  const staminaUpdatedAtBefore = user.staminaUpdatedAt.getTime();
  user.recoverStamina(new Date());
  if (
    user.staminaCurrent !== staminaCurrentBefore ||
    user.staminaUpdatedAt.getTime() !== staminaUpdatedAtBefore
  ) {
    await deps.userRepository.save(user);
  }

  return {
    ok: true,
    user: {
      id: user.id,
      username: user.username.getValue(),
      money: user.money,
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
