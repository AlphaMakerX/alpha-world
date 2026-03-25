export type ShopTransactionRecord = {
  id: number;
  buyerUsername: string;
  amount: number;
  description: string | null;
  createdAt: Date;
};

export interface ShopTransactionQueryRepository {
  listByBuildingId(buildingId: number, limit: number): Promise<ShopTransactionRecord[]>;
}
