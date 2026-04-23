/**
 * 可拖拽窗口组件
 * 自定义的浮动窗口，支持拖拽移动、多方向缩放、层级管理（点击置顶），
 * 通过 React Portal 渲染到 document.body 上。
 */

"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { ReactNode } from "react";

/** 拖拽状态：记录鼠标起始位置和窗口原始位置 */
type DragState = {
  startX: number;
  startY: number;
  originX: number;
  originY: number;
};

/** 缩放状态：记录鼠标起始位置、窗口原始尺寸和位置、缩放方向 */
type ResizeState = {
  startX: number;
  startY: number;
  originWidth: number;
  originHeight: number;
  originX: number;
  originY: number;
  direction: ResizeDirection;
};

/** 缩放方向：上(n)、下(s)、左(w)、右(e) 及四个对角 */
type ResizeDirection = "n" | "s" | "e" | "w" | "ne" | "nw" | "se" | "sw";

/** 可拖拽窗口组件的 Props */
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

/** 全局窗口层级计数器，确保最新激活的窗口始终在最上层 */
let topWindowZIndex = 1200;

/** 获取下一个窗口层级值，每次调用递增 */
const nextWindowZIndex = () => {
  topWindowZIndex += 1;
  return topWindowZIndex;
};

/** 缩放手柄的像素大小 */
const RESIZE_HANDLE_SIZE = 6;

/**
 * 可拖拽窗口组件
 * 支持拖拽标题栏移动、8个方向缩放、点击置顶、Portal 渲染。
 */
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

  // 客户端挂载检测，确保 Portal 在 SSR 时不渲染
  useEffect(() => {
    setMounted(true);
  }, []);

  // 拖拽逻辑：监听全局鼠标事件，根据鼠标偏移量更新窗口位置
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

  // 缩放逻辑：根据缩放方向计算新尺寸和位置，确保不小于最小尺寸
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

      // 根据方向分别计算宽高和位置偏移
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

  // 窗口打开时，如果启用了关闭重置，则恢复初始位置和尺寸
  useEffect(() => {
    if (!open || !resetPositionOnClose) {
      return;
    }

    setPosition(initialPosition);
    setSize({ width: initialWidth, height: initialHeight });
  }, [initialPosition, initialWidth, initialHeight, open, resetPositionOnClose]);

  // 窗口打开时自动提升层级到最上层
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

  /** 开始缩放：记录当前窗口的尺寸和位置，设置缩放方向 */
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

  // 8 个方向的缩放手柄：上、下、左、右、左上、右上、左下、右下
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
