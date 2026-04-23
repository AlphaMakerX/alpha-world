/**
 * 用户名值对象
 *
 * 封装用户名的创建与校验规则：自动转小写、去空格，长度限制 3~32 字符。
 * 值对象不可变，一旦创建不可修改。
 */
import { DomainError } from "@/server/features/shared-kernel/domain/domain-error";

/** 用户名值对象，封装用户名的标准化规则和校验逻辑 */
export class Username {
  private constructor(private readonly value: string) {}

  /** 创建用户名，自动 trim 并转小写，校验长度 3~32 */
  static create(raw: string): Username {
    const normalized = raw.trim().toLowerCase();
    if (normalized.length < 3 || normalized.length > 32) {
      throw new DomainError("用户名长度必须在 3 到 32 之间");
    }
    return new Username(normalized);
  }

  /** 获取标准化后的用户名字符串 */
  getValue() {
    return this.value;
  }
}
