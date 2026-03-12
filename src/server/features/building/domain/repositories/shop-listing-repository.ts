export type ShopListing = {
  id: number;
  buildingId: number;
  sellerUserId: string;
  itemKey: string;
  quantity: number;
  unitPrice: number;
  status: "active" | "sold" | "cancelled";
  createdAt: Date;
  updatedAt: Date;
};

export interface ShopListingRepository {
  create(input: Omit<ShopListing, "id" | "createdAt" | "updatedAt">): Promise<ShopListing>;
}
