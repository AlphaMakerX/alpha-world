import { getItemDisplay } from "@/client/features/inventory/utils/item-display";

type ItemTileProps = {
  itemKey: string;
  quantity: number;
};

export function ItemTile({ itemKey, quantity }: ItemTileProps) {
  const display = getItemDisplay(itemKey);
  return (
    <div
      className={[
        "relative flex h-16 w-16 shrink-0 flex-col items-center justify-center rounded-lg border shadow-sm transition",
        "hover:-translate-y-0.5 hover:shadow-md",
        display.tileClassName,
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
      <span className="absolute -right-1.5 -top-1.5 min-w-[18px] rounded-full bg-white/90 px-1 py-0.5 text-center text-[10px] font-bold leading-none text-slate-700 shadow-sm">
        {quantity}
      </span>
    </div>
  );
}
