export type PurchasingStationTransactionRecord = {
  id: number;
  sellerUsername: string;
  amount: number;
  description: string | null;
  createdAt: Date;
};

export interface PurchasingStationTransactionQueryRepository {
  listByBuildingId(
    buildingId: number,
    limit: number,
  ): Promise<PurchasingStationTransactionRecord[]>;
}
