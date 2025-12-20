import { useEffect, useRef, useState } from "react";
import { selectionModeEnum } from "./NodeTypes";
import { NodeConfigurePopup } from './NodePopup/NodeConfigPopup';

export const Node = ({ node, setNodes, updatePosition, canvasRef, selectedMode, edgeList }) => {
  // using useRef doesn't cause rerender
  const dragging = useRef(false);
  const offsetFromTopLeftCorner = useRef({ x: 0, y: 0 }); // Offset from top left corder of the shape
  const [popupIsOpen, setPopupIsOpen] = useState(false);

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!dragging.current) return;
      if (e.buttons !== 1) {
        dragging.current = false;
        return;
      }
      const canvas = canvasRef.current.getBoundingClientRect();
      const newX = e.clientX - canvas.left - offsetFromTopLeftCorner.current.x;
      const newY = e.clientY - canvas.top - offsetFromTopLeftCorner.current.y;

      // Clammping. A much better appraoch than using an if statement and checking bounds.
      const restrictedX = Math.max(0, Math.min(newX, canvas.width - node.width));
      const restrictedY = Math.max(node.height, Math.min(newY, canvas.height - node.height));
      updatePosition({ x: restrictedX, y: restrictedY });

      e.preventDefault();
    };

    const handleMouseUp = (e) => {
      dragging.current = false;
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  }, [updatePosition, canvasRef]);

  const handleMouseDown = (e) => {
    if (e.button != 0) return; // 0 is left btn, 1 is middle btn, 2 is the right btn
    const nodeRect = e.currentTarget.getBoundingClientRect();

    dragging.current = true;
    offsetFromTopLeftCorner.current = {
      x: e.clientX - nodeRect.left,
      y: e.clientY - nodeRect.top,
    };

    e.preventDefault();
    e.stopPropagation();
  };

  const getIncomingPorts = () => {
    let list = [];
    for (let i = 0; i < edgeList.length; i++) {
      if (edgeList[i].to.id == node.id)
        list.push(edgeList[i].from);
    }
    return list;
  }

  return (
    <>
      <NodeConfigurePopup
        node={node}
        setNodes={setNodes}
        isOpen={popupIsOpen}
        onClose={() => setPopupIsOpen(false)}
        incomingPorts={getIncomingPorts()}
      />
      <div
        onMouseDown={selectedMode == selectionModeEnum.MOVE ? handleMouseDown : undefined}
        onDoubleClick={() => setPopupIsOpen(true)}
        style={{
          position: "absolute",
          left: node.x,
          top: node.y,
          width: node.width,
          height: node.height,
        }}
        className={`${node.style} flex rounded-lg text-black items-center justify-center justify-center select-none cursor-pointer`}
      >
        {node.displayName === 'Sum'
          ? String.fromCodePoint(120506)
          : node.displayName === 'junction'
            ? String.fromCodePoint(9679)
            : node.displayName
        }
      </div>
    </>

  );
};
