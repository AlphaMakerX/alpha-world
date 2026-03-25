import { DomainError } from "@/server/features/shared-kernel/domain/domain-error";
import { Username } from "@/server/features/person/domain/value-objects/username";
import {
  PLAYER_MAX_STAMINA,
  PLAYER_STAMINA_RECOVERY_DELAY_MS,
  PLAYER_STAMINA_RECOVERY_PER_SECOND,
} from "@/shared/gameplay/player-stamina";

type UserProps = {
  id: string;
  username: Username;
  passwordHash: string;
  money: number;
  positionX: number;
  positionY: number;
  staminaCurrent: number;
  staminaMax: number;
  staminaUpdatedAt: Date;
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
    initialStaminaMax?: number;
    initialStaminaCurrent?: number;
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
    const staminaMax = input.initialStaminaMax ?? PLAYER_MAX_STAMINA;
    const staminaCurrent = input.initialStaminaCurrent ?? staminaMax;
    if (staminaMax <= 0 || !Number.isFinite(staminaMax)) {
      throw new DomainError("体力上限必须是正数");
    }
    if (staminaCurrent < 0 || staminaCurrent > staminaMax || !Number.isFinite(staminaCurrent)) {
      throw new DomainError("初始体力不合法");
    }

    const now = new Date();
    return new User({
      id: input.id,
      username: Username.create(input.username),
      passwordHash: input.passwordHash,
      money: initialMoney,
      positionX,
      positionY,
      staminaCurrent,
      staminaMax,
      staminaUpdatedAt: now,
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
    if (!Number.isFinite(props.staminaMax) || props.staminaMax <= 0) {
      throw new DomainError("体力上限必须是正数");
    }
    if (
      !Number.isFinite(props.staminaCurrent) ||
      props.staminaCurrent < 0 ||
      props.staminaCurrent > props.staminaMax
    ) {
      throw new DomainError("用户体力数据不合法");
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

  recoverStamina(at: Date = new Date()): void {
    if (this.props.staminaCurrent >= this.props.staminaMax) {
      return;
    }
    const elapsedMs = at.getTime() - this.props.staminaUpdatedAt.getTime();
    if (elapsedMs <= PLAYER_STAMINA_RECOVERY_DELAY_MS) {
      return;
    }
    const recoveryWindowMs = elapsedMs - PLAYER_STAMINA_RECOVERY_DELAY_MS;
    const recoverAmount = (recoveryWindowMs / 1000) * PLAYER_STAMINA_RECOVERY_PER_SECOND;
    if (recoverAmount <= 0) {
      return;
    }
    this.props.staminaCurrent = Math.min(this.props.staminaMax, this.props.staminaCurrent + recoverAmount);
    this.props.staminaUpdatedAt = at;
    this.props.updatedAt = at;
  }

  consumeStamina(amount: number, at: Date = new Date()): boolean {
    if (amount < 0 || !Number.isFinite(amount)) {
      throw new DomainError("消耗体力值必须是非负有效数字");
    }
    if (amount === 0) {
      return true;
    }
    if (this.props.staminaCurrent < amount) {
      return false;
    }
    this.props.staminaCurrent -= amount;
    this.props.staminaUpdatedAt = at;
    this.props.updatedAt = at;
    return true;
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

  get staminaCurrent() {
    return this.props.staminaCurrent;
  }

  get staminaMax() {
    return this.props.staminaMax;
  }

  get staminaUpdatedAt() {
    return this.props.staminaUpdatedAt;
  }
}
