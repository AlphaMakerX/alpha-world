import { DomainError } from "@/server/features/shared-kernel/domain/domain-error";

export class Username {
  private constructor(private readonly value: string) {}

  static create(raw: string): Username {
    const normalized = raw.trim().toLowerCase();
    if (normalized.length < 3 || normalized.length > 32) {
      throw new DomainError("用户名长度必须在 3 到 32 之间");
    }
    return new Username(normalized);
  }

  getValue() {
    return this.value;
  }
}
