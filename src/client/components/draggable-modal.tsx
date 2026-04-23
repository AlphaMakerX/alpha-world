/**
 * 可拖拽模态框组件
 * 基于 Ant Design Modal 封装，支持通过鼠标拖拽标题栏来移动模态框位置。
 */

"use client";

import { Modal } from "antd";
import type { ModalProps } from "antd";
import { useEffect, useState } from "react";

/** 拖拽过程中的状态：记录鼠标起始坐标和模态框的原始偏移量 */
type DragState = {
  startX: number;
  startY: number;
  originX: number;
  originY: number;
};

/** 可拖拽模态框的 Props，继承 Ant Design ModalProps，额外支持关闭时重置位置 */
type DraggableModalProps = ModalProps & {
  /** 关闭时是否重置位置到初始状态，默认 true */
  resetPositionOnClose?: boolean;
};

/** 可拖拽模态框组件，通过监听标题栏的鼠标事件实现拖拽移动 */
export function DraggableModal({
  title,
  open,
  modalRender,
  resetPositionOnClose = true,
  ...restProps
}: DraggableModalProps) {
  const [position, setPosition] = useState({ x: 0, y: 0 }); // 当前偏移位置
  const [dragState, setDragState] = useState<DragState | null>(null); // 拖拽中的状态，null 表示未在拖拽
  const modalWidth = restProps.width ?? 800; // 模态框宽度，默认 800

  // 拖拽进行中：监听全局鼠标移动和释放事件，计算新的偏移位置
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

  // 模态框关闭时，根据配置重置位置
  useEffect(() => {
    if (!open && resetPositionOnClose) {
      setPosition({ x: 0, y: 0 });
      setDragState(null);
    }
  }, [open, resetPositionOnClose]);

  // 可拖拽的标题栏：鼠标按下时记录起始坐标，触发拖拽
  const draggableTitle = (
    <div
      className="cursor-move select-none pr-8"
      onMouseDown={(event) => {
        if (event.button !== 0) { // 仅响应鼠标左键
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
