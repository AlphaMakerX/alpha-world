import { DomainError } from "@/server/features/shared-kernel/domain/domain-error";
import { ADAM_USER_ID } from "@/server/features/person/domain/constants/adam";
import type { UserRepository } from "@/server/features/person/domain/repositories/user-repository";
import type { User } from "@/server/features/person/domain/entities/user";

export interface SystemAccountService {
  getSystemAccount(): Promise<User>;
}

export class SystemAccountServiceImpl implements SystemAccountService {
  constructor(private readonly userRepository: UserRepository) {}

  async getSystemAccount(): Promise<User> {
    const account = await this.userRepository.findById(ADAM_USER_ID);
    if (!account) {
      throw new DomainError("系统尚未初始化，请先运行 init:system");
    }
    return account;
  }
}
