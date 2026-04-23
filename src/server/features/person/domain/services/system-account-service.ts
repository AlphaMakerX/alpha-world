/**
 * 系统账户领域服务
 *
 * 提供获取系统账户（Adam）的能力，用于资金流转等需要系统账户参与的业务场景。
 */
import { DomainError } from "@/server/features/shared-kernel/domain/domain-error";
import { ADAM_PERSONA_CONFIG } from "@/server/features/person/domain/personas";
import type { UserRepository } from "@/server/features/person/domain/repositories/user-repository";
import type { User } from "@/server/features/person/domain/entities/user";

/** 系统账户服务接口 */
export interface SystemAccountService {
  /** 获取系统账户（Adam），若未初始化则抛出异常 */
  getSystemAccount(): Promise<User>;
}

/** 系统账户服务的默认实现，基于 UserRepository 查询 Adam 用户 */
export class SystemAccountServiceImpl implements SystemAccountService {
  constructor(private readonly userRepository: UserRepository) {}

  async getSystemAccount(): Promise<User> {
    const account = await this.userRepository.findById(ADAM_PERSONA_CONFIG.userId);
    if (!account) {
      throw new DomainError("系统尚未初始化，请先运行 init:system");
    }
    return account;
  }
}
