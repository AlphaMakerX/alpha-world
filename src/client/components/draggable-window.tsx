"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { ReactNode } from "react";

type DragState = {
  startX: number;
  startY: number;
  originX: number;
  originY: number;
};

type ResizeState = {
  startX: number;
  startY: number;
  originWidth: number;
  originHeight: number;
  originX: number;
  originY: number;
  direction: ResizeDirection;
};

type ResizeDirection = "n" | "s" | "e" | "w" | "ne" | "nw" | "se" | "sw";

export type DraggableWindowProps = {
  open: boolean;
  title: ReactNode;
  onClose: () => void;
  children: ReactNode;
  width?: number | string;
  height?: number | string;
  minWidth?: number;
  minHeight?: number;
  initialPosition?: { x: number; y: number };
  resetPositionOnClose?: boolean;
  resizable?: boolean;
  className?: string;
  bodyClassName?: string;
};

let topWindowZIndex = 1200;

const nextWindowZIndex = () => {
  topWindowZIndex += 1;
  return topWindowZIndex;
};

const RESIZE_HANDLE_SIZE = 6;

export function DraggableWindow({
  open,
  title,
  onClose,
  children,
  width: initialWidth = 800,
  height: initialHeight,
  minWidth = 280,
  minHeight = 160,
  initialPosition = { x: 80, y: 80 },
  resetPositionOnClose = false,
  resizable = true,
  className,
  bodyClassName,
}: DraggableWindowProps) {
  const [mounted, setMounted] = useState(false);
  const [dragState, setDragState] = useState<DragState | null>(null);
  const [resizeState, setResizeState] = useState<ResizeState | null>(null);
  const [position, setPosition] = useState(initialPosition);
  const [size, setSize] = useState<{ width: number | string; height?: number | string }>({
    width: initialWidth,
    height: initialHeight,
  });
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
    if (!resizeState) {
      return;
    }

    const handleMouseMove = (event: MouseEvent) => {
      const dx = event.clientX - resizeState.startX;
      const dy = event.clientY - resizeState.startY;
      const dir = resizeState.direction;

      let newWidth = resizeState.originWidth;
      let newHeight = resizeState.originHeight;
      let newX = resizeState.originX;
      let newY = resizeState.originY;

      if (dir.includes("e")) {
        newWidth = Math.max(minWidth, resizeState.originWidth + dx);
      }
      if (dir.includes("w")) {
        const w = Math.max(minWidth, resizeState.originWidth - dx);
        newX = resizeState.originX + (resizeState.originWidth - w);
        newWidth = w;
      }
      if (dir.includes("s")) {
        newHeight = Math.max(minHeight, resizeState.originHeight + dy);
      }
      if (dir.includes("n")) {
        const h = Math.max(minHeight, resizeState.originHeight - dy);
        newY = resizeState.originY + (resizeState.originHeight - h);
        newHeight = h;
      }

      setSize({ width: newWidth, height: newHeight });
      setPosition({ x: newX, y: newY });
    };

    const handleMouseUp = () => {
      setResizeState(null);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [resizeState, minWidth, minHeight]);

  useEffect(() => {
    if (!open || !resetPositionOnClose) {
      return;
    }

    setPosition(initialPosition);
    setSize({ width: initialWidth, height: initialHeight });
  }, [initialPosition, initialWidth, initialHeight, open, resetPositionOnClose]);

  useEffect(() => {
    if (!open) {
      return;
    }

    setZIndex(nextWindowZIndex());
  }, [open]);

  const windowClassName = useMemo(
    () =>
      [
        "absolute flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl",
        "pointer-events-auto",
        className,
      ]
        .filter(Boolean)
        .join(" "),
    [className],
  );

  const sectionRef = useRef<HTMLElement>(null);

  const startResize = (event: React.MouseEvent, direction: ResizeDirection) => {
    if (event.button !== 0) return;
    event.preventDefault();
    event.stopPropagation();

    const el = sectionRef.current;
    if (!el) return;

    setZIndex(nextWindowZIndex());
    setResizeState({
      startX: event.clientX,
      startY: event.clientY,
      originWidth: el.offsetWidth,
      originHeight: el.offsetHeight,
      originX: position.x,
      originY: position.y,
      direction,
    });
  };

  const h = RESIZE_HANDLE_SIZE;
  const h2 = RESIZE_HANDLE_SIZE * 2;

  const resizeHandles = resizable ? (
    <>
      <div style={{ position: "absolute", top: 0, left: h2, right: h2, height: h, cursor: "ns-resize" }} onMouseDown={(e) => startResize(e, "n")} />
      <div style={{ position: "absolute", bottom: 0, left: h2, right: h2, height: h, cursor: "ns-resize" }} onMouseDown={(e) => startResize(e, "s")} />
      <div style={{ position: "absolute", left: 0, top: h2, bottom: h2, width: h, cursor: "ew-resize" }} onMouseDown={(e) => startResize(e, "w")} />
      <div style={{ position: "absolute", right: 0, top: h2, bottom: h2, width: h, cursor: "ew-resize" }} onMouseDown={(e) => startResize(e, "e")} />
      <div style={{ position: "absolute", top: 0, left: 0, width: h2, height: h2, cursor: "nwse-resize" }} onMouseDown={(e) => startResize(e, "nw")} />
      <div style={{ position: "absolute", top: 0, right: 0, width: h2, height: h2, cursor: "nesw-resize" }} onMouseDown={(e) => startResize(e, "ne")} />
      <div style={{ position: "absolute", bottom: 0, left: 0, width: h2, height: h2, cursor: "nesw-resize" }} onMouseDown={(e) => startResize(e, "sw")} />
      <div style={{ position: "absolute", bottom: 0, right: 0, width: h2, height: h2, cursor: "nwse-resize" }} onMouseDown={(e) => startResize(e, "se")} />
    </>
  ) : null;

  const content = open ? (
    <div className="pointer-events-none fixed inset-0">
      <section
        ref={sectionRef}
        role="dialog"
        aria-modal={false}
        className={windowClassName}
        style={{
          width: size.width,
          height: size.height,
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
        <div className={["flex-1 overflow-auto p-4", bodyClassName].filter(Boolean).join(" ")}>{children}</div>
        {resizeHandles}
      </section>
    </div>
  ) : null;

  if (!mounted) {
    return null;
  }

  return createPortal(content, document.body);
}
