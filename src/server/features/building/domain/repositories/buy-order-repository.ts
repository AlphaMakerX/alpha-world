export type BuyOrderStatus = "active" | "fulfilled" | "cancelled";

export type BuyOrder = {
  id: number;
  buildingId: number;
  buyerUserId: string;
  itemKey: string;
  quantity: number;
  unitPrice: number;
  status: BuyOrderStatus;
  createdAt: Date;
  updatedAt: Date;
};

export interface BuyOrderRepository {
  create(input: Omit<BuyOrder, "id" | "createdAt" | "updatedAt">): Promise<BuyOrder>;
  findById(id: number): Promise<BuyOrder | null>;
  findActiveByBuildingId(buildingId: number): Promise<BuyOrder[]>;
  updateStatus(id: number, status: BuyOrderStatus): Promise<void>;
  updateQuantity(id: number, quantity: number): Promise<void>;
}
