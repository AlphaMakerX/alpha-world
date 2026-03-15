export type ShopListingStatus = "active" | "sold" | "cancelled";

export type ShopListing = {
  id: number;
  buildingId: number;
  sellerUserId: string;
  itemKey: string;
  quantity: number;
  unitPrice: number;
  status: ShopListingStatus;
  createdAt: Date;
  updatedAt: Date;
};

export interface ShopListingRepository {
  create(input: Omit<ShopListing, "id" | "createdAt" | "updatedAt">): Promise<ShopListing>;
  findById(id: number): Promise<ShopListing | null>;
  findActiveByBuildingId(buildingId: number): Promise<ShopListing[]>;
  updateStatus(id: number, status: ShopListingStatus): Promise<void>;
  updateQuantity(id: number, quantity: number): Promise<void>;
}
