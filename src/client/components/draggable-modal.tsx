"use client";

import { Modal } from "antd";
import type { ModalProps } from "antd";
import { useEffect, useState } from "react";

type DragState = {
  startX: number;
  startY: number;
  originX: number;
  originY: number;
};

type DraggableModalProps = ModalProps & {
  resetPositionOnClose?: boolean;
};

export function DraggableModal({
  title,
  open,
  modalRender,
  resetPositionOnClose = true,
  ...restProps
}: DraggableModalProps) {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [dragState, setDragState] = useState<DragState | null>(null);
  const modalWidth = restProps.width ?? 800;

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
    if (!open && resetPositionOnClose) {
      setPosition({ x: 0, y: 0 });
      setDragState(null);
    }
  }, [open, resetPositionOnClose]);

  const draggableTitle = (
    <div
      className="cursor-move select-none pr-8"
      onMouseDown={(event) => {
        if (event.button !== 0) {
          return;
        }

        setDragState({
          startX: event.clientX,
          startY: event.clientY,
          originX: position.x,
          originY: position.y,
        });
      }}
    >
      {title}
    </div>
  );

  return (
    <Modal
      {...restProps}
      width={modalWidth}
      open={open}
      title={draggableTitle}
      modalRender={(node) => {
        const wrappedNode = (
          <div
            style={{
              transform: `translate(${position.x}px, ${position.y}px)`,
            }}
          >
            {node}
          </div>
        );

        if (!modalRender) {
          return wrappedNode;
        }

        return modalRender(wrappedNode);
      }}
    />
  );
}
