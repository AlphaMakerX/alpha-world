import { getItemDisplay } from "@/client/features/item/utils/item-display";

type ItemTileProps = {
  itemKey: string;
  quantity: number;
  ownedQuantity?: number;
  isInsufficient?: boolean;
};

export function ItemTile({ itemKey, quantity, ownedQuantity, isInsufficient = false }: ItemTileProps) {
  const display = getItemDisplay(itemKey);
  const showOwnedQuantity = typeof ownedQuantity === "number";
  return (
    <div
      className={[
        "relative flex w-16 shrink-0 flex-col items-center justify-center rounded-lg border shadow-sm transition",
        showOwnedQuantity ? "h-20" : "h-16",
        "hover:-translate-y-0.5 hover:shadow-md",
        display.tileClassName,
        isInsufficient ? "border-red-300 ring-1 ring-red-200" : "",
      ].join(" ")}
    >
      <div
        className={[
          "flex h-7 w-7 items-center justify-center rounded-md text-sm shadow-sm",
          display.iconClassName,
        ].join(" ")}
      >
        {display.icon}
      </div>
      <p className="mt-1 w-full truncate px-0.5 text-center text-[10px] font-medium leading-none text-slate-700">
        {display.name}
      </p>
      {showOwnedQuantity ? (
        <p className={["mt-1 text-[10px] leading-none", isInsufficient ? "text-red-600" : "text-slate-500"].join(" ")}>
          背包 {ownedQuantity}
        </p>
      ) : null}
      <span className="absolute -right-1.5 -top-1.5 min-w-[18px] rounded-full bg-white/90 px-1 py-0.5 text-center text-[10px] font-bold leading-none text-slate-700 shadow-sm">
        {quantity}
      </span>
    </div>
  );
}
