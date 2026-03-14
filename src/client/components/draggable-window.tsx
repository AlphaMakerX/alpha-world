"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import type { ReactNode } from "react";

type DragState = {
  startX: number;
  startY: number;
  originX: number;
  originY: number;
};

export type DraggableWindowProps = {
  open: boolean;
  title: ReactNode;
  onClose: () => void;
  children: ReactNode;
  width?: number | string;
  initialPosition?: { x: number; y: number };
  resetPositionOnClose?: boolean;
  className?: string;
  bodyClassName?: string;
};

let topWindowZIndex = 1200;

const nextWindowZIndex = () => {
  topWindowZIndex += 1;
  return topWindowZIndex;
};

export function DraggableWindow({
  open,
  title,
  onClose,
  children,
  width = 800,
  initialPosition = { x: 80, y: 80 },
  resetPositionOnClose = false,
  className,
  bodyClassName,
}: DraggableWindowProps) {
  const [mounted, setMounted] = useState(false);
  const [dragState, setDragState] = useState<DragState | null>(null);
  const [position, setPosition] = useState(initialPosition);
  const [zIndex, setZIndex] = useState(() => nextWindowZIndex());

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!dragState) {
      return;
    }

    const handleMouseMove = (event: MouseEvent) => {
      setPosition({
        x: dragState.originX + (event.clientX - dragState.startX),
        y: dragState.originY + (event.clientY - dragState.startY),
      });
    };

    const handleMouseUp = () => {
      setDragState(null);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [dragState]);

  useEffect(() => {
    if (!open || !resetPositionOnClose) {
      return;
    }

    setPosition(initialPosition);
  }, [initialPosition, open, resetPositionOnClose]);

  useEffect(() => {
    if (!open) {
      return;
    }

    setZIndex(nextWindowZIndex());
  }, [open]);

  const windowClassName = useMemo(
    () =>
      [
        "absolute overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl",
        "pointer-events-auto",
        className,
      ]
        .filter(Boolean)
        .join(" "),
    [className],
  );

  const content = open ? (
    <div className="pointer-events-none fixed inset-0">
      <section
        role="dialog"
        aria-modal={false}
        className={windowClassName}
        style={{
          width,
          transform: `translate(${position.x}px, ${position.y}px)`,
          zIndex,
        }}
        onMouseDown={() => setZIndex(nextWindowZIndex())}
      >
        <header
          className="flex cursor-move select-none items-center justify-between border-b border-slate-200 bg-slate-50 px-3 py-2"
          onMouseDown={(event) => {
            if (event.button !== 0) {
              return;
            }

            setZIndex(nextWindowZIndex());
            setDragState({
              startX: event.clientX,
              startY: event.clientY,
              originX: position.x,
              originY: position.y,
            });
          }}
        >
          <div className="truncate pr-4 text-sm font-semibold text-slate-700">{title}</div>
          <button
            type="button"
            onClick={onClose}
            className="h-7 w-7 rounded-md text-slate-500 transition hover:bg-slate-200 hover:text-slate-700"
            aria-label="关闭窗口"
          >
            ×
          </button>
        </header>
        <div className={["p-4", bodyClassName].filter(Boolean).join(" ")}>{children}</div>
      </section>
    </div>
  ) : null;

  if (!mounted) {
    return null;
  }

  return createPortal(content, document.body);
}
