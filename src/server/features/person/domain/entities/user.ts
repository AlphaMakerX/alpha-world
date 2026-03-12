import { DomainError } from "@/server/features/shared-kernel/domain/domain-error";
import { Username } from "@/server/features/person/domain/value-objects/username";

type UserProps = {
  id: string;
  username: Username;
  passwordHash: string;
  createdAt: Date;
  updatedAt: Date;
};

export class User {
  private constructor(private readonly props: UserProps) {}

  static register(input: { id: string; username: string; passwordHash: string }): User {
    if (!input.id) {
      throw new DomainError("用户 ID 不能为空");
    }
    if (!input.passwordHash) {
      throw new DomainError("密码哈希不能为空");
    }

    const now = new Date();
    return new User({
      id: input.id,
      username: Username.create(input.username),
      passwordHash: input.passwordHash,
      createdAt: now,
      updatedAt: now,
    });
  }

  static rehydrate(props: UserProps): User {
    return new User(props);
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

  get createdAt() {
    return this.props.createdAt;
  }

  get updatedAt() {
    return this.props.updatedAt;
  }
}
