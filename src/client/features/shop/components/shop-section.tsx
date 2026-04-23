/**
 * 商店区域组件
 *
 * 商店地块详情中的商店面板，包括：
 * - 所有者专属的上架表单
 * - 物品分类筛选器（按品阶过滤）
 * - 在售商品列表
 */
import { useState } from "react";
import type { InventoryItem, ShopListing } from "@/client/features/building/types/building-ui";
import { ShopListingCard } from "./shop-listing-card";
import { ShopCreateListingForm } from "./shop-create-listing-form";
import { ItemTierFilter, type FilterOption } from "@/client/features/item/components/item-tier-filter";
import { getItemDisplay } from "@/client/features/item/utils/item-display";

/** ShopSection 组件的 props 类型 */
type ShopSectionProps = {
  isOwner: boolean;
  listings: ShopListing[];
  inventoryItems: InventoryItem[];
  createListingLoading: boolean;
  purchaseLoading: boolean;
  cancelLoading: boolean;
  onCreateListing: (itemKey: string, quantity: number, unitPrice: number) => void;
  onPurchase: (listingId: number, quantity: number) => void;
  onCancel: (listingId: number) => void;
};

/** 商店面板：含上架表单、品阶筛选和商品列表 */
export function ShopSection({
  isOwner,
  listings,
  inventoryItems,
  createListingLoading,
  purchaseLoading,
  cancelLoading,
  onCreateListing,
  onPurchase,
  onCancel,
}: ShopSectionProps) {
  const [filter, setFilter] = useState<FilterOption>("all");

  // 根据品阶筛选条件过滤商品列表
  const filteredListings =
    filter === "all" ? listings : listings.filter((l) => getItemDisplay(l.itemKey).tier === filter);

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

        <ItemTierFilter value={filter} onChange={setFilter} />

        {listings.length > 0 ? (
          filteredListings.length > 0 ? (
            <div className="space-y-2">
              {filteredListings.map((listing) => (
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
              该分类下暂无商品
            </p>
          )
        ) : (
          <p className="rounded-md border border-dashed border-slate-200 py-6 text-center text-xs text-slate-400">
            暂无在售商品
          </p>
        )}
      </div>
    </div>
  );
}
