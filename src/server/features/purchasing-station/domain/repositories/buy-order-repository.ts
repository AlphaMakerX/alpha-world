/**
 * 收购站收购订单仓储接口定义
 *
 * 定义了收购订单（BuyOrder）的领域模型类型和仓储接口，
 * 用于对收购站中的收购订单进行增删改查操作。
 */

/** 收购订单状态：active-进行中 | fulfilled-已完成 | cancelled-已取消 */
export type BuyOrderStatus = "active" | "fulfilled" | "cancelled";

/** 收购订单的领域模型 */
export type BuyOrder = {
  id: number;
  /** 所属建筑 ID */
  buildingId: number;
  /** 收购方用户 ID */
  buyerUserId: string;
  /** 物品标识键 */
  itemKey: string;
  /** 收购数量 */
  quantity: number;
  /** 单价 */
  unitPrice: number;
  /** 当前状态 */
  status: BuyOrderStatus;
  createdAt: Date;
  updatedAt: Date;
};

/** 收购订单仓储接口 */
export interface BuyOrderRepository {
  /** 创建一条新的收购订单 */
  create(input: Omit<BuyOrder, "id" | "createdAt" | "updatedAt">): Promise<BuyOrder>;
  /** 根据 ID 查询收购订单 */
  findById(id: number): Promise<BuyOrder | null>;
  /** 查询指定建筑下所有进行中的收购订单 */
  findActiveByBuildingId(buildingId: number): Promise<BuyOrder[]>;
  /** 更新订单状态（如标记为已完成或已取消） */
  updateStatus(id: number, status: BuyOrderStatus): Promise<void>;
  /** 更新订单剩余需求数量（部分成交后） */
  updateQuantity(id: number, quantity: number): Promise<void>;
}
