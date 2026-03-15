import type { InventoryItem, ShopListing, ShopTransaction } from "@/client/features/building/types/building-ui";
import { ShopListingCard } from "./shop-listing-card";
import { ShopCreateListingForm } from "./shop-create-listing-form";
import { ShopTransactionHistory } from "./shop-transaction-history";

type ShopSectionProps = {
  isOwner: boolean;
  listings: ShopListing[];
  transactions: ShopTransaction[];
  inventoryItems: InventoryItem[];
  createListingLoading: boolean;
  purchaseLoading: boolean;
  cancelLoading: boolean;
  onCreateListing: (itemKey: string, quantity: number, unitPrice: number) => void;
  onPurchase: (listingId: number, quantity: number) => void;
  onCancel: (listingId: number) => void;
};

export function ShopSection({
  isOwner,
  listings,
  transactions,
  inventoryItems,
  createListingLoading,
  purchaseLoading,
  cancelLoading,
  onCreateListing,
  onPurchase,
  onCancel,
}: ShopSectionProps) {
  return (
    <div className="space-y-3">
      {isOwner ? (
        <ShopCreateListingForm
          inventoryItems={inventoryItems}
          loading={createListingLoading}
          onCreateListing={onCreateListing}
        />
      ) : null}

      <div className="space-y-2">
        <p className="text-xs font-medium text-slate-600">
          在售商品 {listings.length > 0 ? `(${listings.length})` : ""}
        </p>
        {listings.length > 0 ? (
          <div className="space-y-2">
            {listings.map((listing) => (
              <ShopListingCard
                key={listing.id}
                listing={listing}
                isOwner={isOwner}
                purchaseLoading={purchaseLoading}
                cancelLoading={cancelLoading}
                onPurchase={onPurchase}
                onCancel={onCancel}
              />
            ))}
          </div>
        ) : (
          <p className="rounded-md border border-dashed border-slate-200 py-6 text-center text-xs text-slate-400">
            暂无在售商品
          </p>
        )}
      </div>

      {isOwner ? <ShopTransactionHistory transactions={transactions} /> : null}
    </div>
  );
}
