import { DomainError } from "@/server/features/shared-kernel/domain/domain-error";
import { Username } from "@/server/features/person/domain/value-objects/username";

type UserProps = {
  id: string;
  username: Username;
  passwordHash: string;
  money: number;
  positionX: number;
  positionY: number;
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
    positionX?: number;
    positionY?: number;
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
    const positionX = input.positionX ?? 140;
    const positionY = input.positionY ?? 600;

    const now = new Date();
    return new User({
      id: input.id,
      username: Username.create(input.username),
      passwordHash: input.passwordHash,
      money: initialMoney,
      positionX,
      positionY,
      createdAt: now,
      updatedAt: now,
    });
  }

  static rehydrate(props: UserProps): User {
    if (props.money < 0) {
      throw new DomainError("用户余额不能小于 0");
    }
    if (!Number.isFinite(props.positionX) || !Number.isFinite(props.positionY)) {
      throw new DomainError("用户坐标必须是有效数字");
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

  receiveMoney(amount: number): void {
    if (amount < 0) {
      throw new DomainError("收款金额不能小于 0");
    }
    this.props.money += amount;
    this.props.updatedAt = new Date();
  }

  updatePosition(position: { x: number; y: number }): void {
    if (!Number.isFinite(position.x) || !Number.isFinite(position.y)) {
      throw new DomainError("用户坐标必须是有效数字");
    }
    this.props.positionX = position.x;
    this.props.positionY = position.y;
    this.props.updatedAt = new Date();
  }

  changePasswordHash(passwordHash: string): void {
    if (!passwordHash) {
      throw new DomainError("密码哈希不能为空");
    }
    this.props.passwordHash = passwordHash;
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

  get positionX() {
    return this.props.positionX;
  }

  get positionY() {
    return this.props.positionY;
  }

  get updatedAt() {
    return this.props.updatedAt;
  }
}
