import { Handle, Position } from "@xyflow/react";
import React, { useState } from "react";
import { LuMessageSquareText, LuPlus, LuUnlink, LuX } from "react-icons/lu";
import { findGenericOf, useCallCanvasContext } from "../../context/CallCanvasContext";
import { FOCUS_DESC_EVENT, getStateType } from "../../constants";
import { StatePill } from "./StatePill";

const focusDescription = (descId) =>
  window.dispatchEvent(new CustomEvent(FOCUS_DESC_EVENT, { detail: descId }));

// WFM / FTU / OOC / HUP node on the canvas
export const StateNode = React.memo(({ id, data, selected }) => {
  const ctx = useCallCanvasContext();
  const [hovered, setHovered] = useState(false);

  const type = getStateType(data.stateLabel);
  const genericId = findGenericOf(id, ctx.groups, ctx.nodes);
  const descId = `desc_${id}`;
  const hasDesc = ctx.nodes.some((n) => n.id === descId);
  const inGrouping = !!ctx.groupingNode;
  const attachedToActive = inGrouping && genericId === ctx.groupingNode;

  const handleDescribe = (e) => {
    e.stopPropagation();
    const newId = ctx.addDescription({ id, data });
    // wait for the panel to render the new card
    setTimeout(() => focusDescription(newId), 0);
  };

  const handleDetach = (e) => {
    e.stopPropagation();
    ctx.detach(id);
  };

  const handleDelete = (e) => {
    e.stopPropagation();
    ctx.removeNodes([id]);
  };

  return (
    <div
      className={[
        "state-node",
        selected ? "is-selected" : "",
        inGrouping ? "is-groupable" : "",
        attachedToActive ? "is-attached-active" : "",
      ].join(" ")}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      title={`${type?.name ?? data.stateLabel}${genericId ? ` · attached to ${genericId}` : ""}`}
    >
      <Handle type="target" position={Position.Top} id="top" className="state-handle" />
      <StatePill state={data.stateLabel} />

      {hasDesc && <span className="state-desc-dot" title="Has a description" />}
      <div className="node-id-label">{id}</div>

      {hovered && !inGrouping && (
        <div className="node-actions">
          {type?.describable && (
            <button
              className="node-action-btn"
              onClick={hasDesc ? (e) => { e.stopPropagation(); focusDescription(descId); } : handleDescribe}
              title={hasDesc ? "Edit description" : "Add description"}
            >
              {hasDesc ? <LuMessageSquareText /> : <LuPlus />}
            </button>
          )}
          {genericId && (
            <button className="node-action-btn" onClick={handleDetach} title={`Detach from ${genericId}`}>
              <LuUnlink />
            </button>
          )}
          <button className="node-action-btn danger" onClick={handleDelete} title="Delete node">
            <LuX />
          </button>
        </div>
      )}
    </div>
  );
});
