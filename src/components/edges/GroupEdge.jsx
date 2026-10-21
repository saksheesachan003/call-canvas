import { memo } from "react";
import { BaseEdge, getStraightPath } from "@xyflow/react";

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
