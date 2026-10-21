import React, { memo, useState, useEffect, useRef } from "react";
import { BaseEdge, EdgeLabelRenderer, getBezierPath, getStraightPath } from "@xyflow/react";
import { LuX } from "react-icons/lu";
import { useCallCanvasContext } from "../../context/CallCanvasContext";
import { EDGE_KINDS, edgeKindOf } from "./constants";

// Labelled flow edge between two Generic nodes. Colour follows the source handle.
function CustomEdge(props) {
  const {
    id,
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    sourceHandleId,
    data,
    selected,
  } = props;

  const { setEdges } = useCallCanvasContext();
  const [isEditing, setIsEditing] = useState(false);
  const [label, setLabel] = useState(data?.label || "Intent");
  const inputRef = useRef(null);

  const kind = data?.kind || edgeKindOf(sourceHandleId);
  const color = EDGE_KINDS[kind]?.color ?? EDGE_KINDS.intent.color;

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  useEffect(() => {
    if (!isEditing) setLabel(data?.label || "Intent");
  }, [data?.label, isEditing]);

  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
  });

  const commit = () => {
    setIsEditing(false);
    const text = label.trim() || EDGE_KINDS[kind].label;
    setLabel(text);
    setEdges((eds) =>
      eds.map((edge) =>
        edge.id === id ? { ...edge, data: { ...edge.data, label: text } } : edge,
      ),
    );
  };

  const remove = (e) => {
    e.stopPropagation();
    setEdges((eds) => eds.filter((edge) => edge.id !== id));
  };

  return (
    <>
      <BaseEdge
        path={edgePath}
        markerEnd={`url(#callcanvas-arrow-${kind})`}
        interactionWidth={18}
        style={{ stroke: color, strokeWidth: selected ? 2.5 : 1.75 }}
      />

      <EdgeLabelRenderer>
        <div
          className={`nodrag nopan edge-label ${selected ? "is-selected" : ""}`}
          style={{
            transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
            "--edge-color": color,
          }}
        >
          {isEditing ? (
            <input
              ref={inputRef}
              className="edge-label-input"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              onBlur={commit}
              onKeyDown={(e) => {
                if (e.key === "Enter") commit();
                if (e.key === "Escape") {
                  setLabel(data?.label || "Intent");
                  setIsEditing(false);
                }
              }}
            />
          ) : (
            <>
              <button
                className="edge-label-chip"
                onClick={() => setIsEditing(true)}
                title="Click to rename"
              >
                {label}
              </button>
              <button className="edge-remove" onClick={remove} title="Delete edge">
                <LuX />
              </button>
            </>
          )}
        </div>
      </EdgeLabelRenderer>
    </>
  );
}

export default memo(CustomEdge);

// Dashed line showing that a state node is attached to a Generic node
export const GroupEdge = memo(({ sourceX, sourceY, targetX, targetY, selected }) => {
  // straight line ending under the state pill (its handle sits on the pill's top edge)
  const [edgePath] = getStraightPath({ sourceX, sourceY, targetX, targetY: targetY + 12 });
  return (
    <BaseEdge
      path={edgePath}
      interactionWidth={14}
      className="group-edge"
      style={{ strokeWidth: selected ? 2 : 1.25 }}
    />
  );
});
