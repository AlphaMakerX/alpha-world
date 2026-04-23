/**
 * 领域错误基类
 *
 * 用于表示违反业务规则时抛出的错误，与技术性错误区分开来。
 * 所有领域层的自定义错误都应继承此类。
 */
export class DomainError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DomainError";
  }
}
