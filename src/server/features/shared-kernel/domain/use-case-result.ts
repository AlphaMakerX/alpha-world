/**
 * 用例层统一错误码定义
 *
 * 定义用例执行失败时返回的错误码类型，供上层（如 tRPC 路由）映射为对应的 HTTP 状态码。
 */

/** 用例错误码：NOT_FOUND(资源不存在)、CONFLICT(冲突)、BAD_REQUEST(请求参数错误) */
export type UseCaseErrorCode = "NOT_FOUND" | "CONFLICT" | "BAD_REQUEST";
