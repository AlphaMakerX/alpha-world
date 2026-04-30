/**
 * 收取住宅休息用例
 *
 * 休息时间到后，玩家手动收取，恢复体力。
 */
import type { RestJobRepository } from "@/server/features/residential/domain/repositories/rest-job-repository";
import type { UserRepository } from "@/server/features/person/domain/repositories/user-repository";
import type { UseCaseErrorCode } from "@/server/features/shared-kernel/domain/use-case-result";
import { DomainError } from "@/server/features/shared-kernel/domain/domain-error";

/** 收取休息的命令参数 */
export type CollectRestCommand = {
  userId: string;
  jobId: number;
  now?: Date;
};

type CollectRestResult =
  | { ok: true }
  | { ok: false; error: string; code: UseCaseErrorCode };

/** 用例所需的外部依赖 */
export type CollectRestUseCaseDeps = {
  restJobRepository: RestJobRepository;
  userRepository: UserRepository;
  transact: <T>(fn: () => Promise<T>) => Promise<T>;
};

/** 执行收取休息用例 */
export async function executeCollectRestUseCase(
  command: CollectRestCommand,
  deps: CollectRestUseCaseDeps,
): Promise<CollectRestResult> {
  const now = command.now ?? new Date();

  const job = await deps.restJobRepository.findById(command.jobId);
  if (!job) {
    return { ok: false, error: "休息任务不存在", code: "NOT_FOUND" };
  }

  // 校验是休息发起人
  try {
    job.ensureRester(command.userId);
  } catch (e) {
    if (e instanceof DomainError) {
      return { ok: false, error: e.message, code: "CONFLICT" };
    }
    throw e;
  }

  // 校验可收取
  if (!job.canCollect(now)) {
    if (job.status === "collected") {
      return { ok: false, error: "休息任务已收取", code: "CONFLICT" };
    }
    return { ok: false, error: "休息尚未完成", code: "CONFLICT" };
  }

  // 获取用户
  const user = await deps.userRepository.findById(command.userId);
  if (!user) {
    return { ok: false, error: "用户不存在", code: "NOT_FOUND" };
  }

  // 事务：收取 + 恢复体力
  await deps.transact(async () => {
    job.collect(now);
    user.recoverStamina(now);
    user.recoverStaminaByAmount(job.staminaGain);
    await deps.restJobRepository.save(job);
    await deps.userRepository.save(user);
  });

  return { ok: true };
}
