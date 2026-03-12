import { DomainError } from "@/server/features/shared-kernel/domain/domain-error";
import { Username } from "@/server/features/person/domain/value-objects/username";

type UserProps = {
  id: string;
  username: Username;
  passwordHash: string;
  money: number;
  createdAt: Date;
  updatedAt: Date;
};

export class User {
  private constructor(private readonly props: UserProps) {}

  static register(input: {
    id: string;
    username: string;
    passwordHash: string;
    initialMoney?: number;
  }): User {
    if (!input.id) {
      throw new DomainError("用户 ID 不能为空");
    }
    if (!input.passwordHash) {
      throw new DomainError("密码哈希不能为空");
    }
    const initialMoney = input.initialMoney ?? 10000;
    if (initialMoney < 0) {
      throw new DomainError("用户余额不能小于 0");
    }

    const now = new Date();
    return new User({
      id: input.id,
      username: Username.create(input.username),
      passwordHash: input.passwordHash,
      money: initialMoney,
      createdAt: now,
      updatedAt: now,
    });
  }

  static rehydrate(props: UserProps): User {
    if (props.money < 0) {
      throw new DomainError("用户余额不能小于 0");
    }
    return new User(props);
  }

  spendMoney(amount: number): void {
    if (amount < 0) {
      throw new DomainError("扣款金额不能小于 0");
    }
    if (this.props.money < amount) {
      throw new DomainError("余额不足，购买失败");
    }
    this.props.money -= amount;
    this.props.updatedAt = new Date();
  }

  get id() {
    return this.props.id;
  }

  get username() {
    return this.props.username;
  }

  get passwordHash() {
    return this.props.passwordHash;
  }

  get money() {
    return this.props.money;
  }

  get createdAt() {
    return this.props.createdAt;
  }

  get updatedAt() {
    return this.props.updatedAt;
  }
}
