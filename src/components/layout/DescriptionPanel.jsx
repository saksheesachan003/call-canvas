import React, { useEffect, useRef, useState } from "react";
import { useReactFlow } from "@xyflow/react";
import { LuMessageSquare, LuPanelRightClose, LuTrash2 } from "react-icons/lu";
import { findGenericOf, useCallCanvasContext } from "../../context/CallCanvasContext";
import { FOCUS_DESC_EVENT, getStateType } from "../../constants";

const DescCard = ({ desc, displayId, genericId, onLocate, onDelete, onSave }) => {
  const [text, setText] = useState(desc.data.label || "");
  const type = getStateType(desc.data.parentType);

  useEffect(() => setText(desc.data.label || ""), [desc.data.label]);

  return (
    <li className="desc-card" style={{ "--state-color": type?.color }}>
      <div className="desc-card-head">
        <button className="desc-chip" onClick={onLocate} title="Show on canvas">
          <span className="desc-chip-state">{desc.data.parentType}</span>
          {displayId}
        </button>
        <button className="icon-btn danger" onClick={onDelete} title="Delete description">
          <LuTrash2 />
        </button>
      </div>
      <textarea
        data-desc-id={desc.id}
        className="desc-input"
        value={text}
        placeholder={`Describe what happens on ${type?.name ?? desc.data.parentType}…`}
        rows={3}
        onChange={(e) => setText(e.target.value)}
        onBlur={() => text !== desc.data.label && onSave(text)}
      />
      <div className="desc-meta">
        {genericId ? `Attached to ${genericId}` : "Not attached to a Generic node"}
      </div>
    </li>
  );
};

// Right-hand panel listing all state descriptions
export const DescriptionPanel = ({ open, onOpenChange }) => {
  const ctx = useCallCanvasContext();
  const { getNode, setCenter } = useReactFlow();
  const listRef = useRef(null);

  const descs = ctx.nodes.filter((n) => n.type === "descNode");

  // Hover "+" / edit on a state node asks us to focus its description
  useEffect(() => {
    const onFocus = (e) => {
      onOpenChange(true);
      setTimeout(() => {
        const el = listRef.current?.querySelector(`[data-desc-id="${e.detail}"]`);
        el?.scrollIntoView({ block: "nearest", behavior: "smooth" });
        el?.focus();
      }, 50);
    };
    window.addEventListener(FOCUS_DESC_EVENT, onFocus);
    return () => window.removeEventListener(FOCUS_DESC_EVENT, onFocus);
  }, [onOpenChange]);

  const locate = (stateId) => {
    const node = getNode(stateId);
    if (!node) return;
    const w = node.measured?.width ?? 0;
    const h = node.measured?.height ?? 0;
    setCenter(node.position.x + w / 2, node.position.y + h / 2, { zoom: 1.4, duration: 400 });
    ctx.setNodes((nds) => nds.map((n) => ({ ...n, selected: n.id === stateId })));
  };

  if (!open) {
    return (
      <button className="desc-panel-tab" onClick={() => onOpenChange(true)}>
        <LuMessageSquare /> Descriptions <span className="count">{descs.length}</span>
      </button>
    );
  }

  return (
    <aside className="desc-panel">
      <div className="panel-head">
        <h3 className="sidebar-title">
          Descriptions <span className="count">{descs.length}</span>
        </h3>
        <button className="icon-btn" onClick={() => onOpenChange(false)} title="Hide panel">
          <LuPanelRightClose />
        </button>
      </div>

      {descs.length === 0 ? (
        <div className="empty-hint">
          <LuMessageSquare size={22} />
          <p>No descriptions yet.</p>
          <p>Hover a WFM, FTU or OOC node on the canvas and click + to add one.</p>
        </div>
      ) : (
        <ul className="desc-list" ref={listRef}>
          {descs.map((d) => {
            const genericId = findGenericOf(d.data.descOf, ctx.groups, ctx.nodes);
            // e.g. node_3_WFM when attached, otherwise the state node id
            const displayId = genericId
              ? `${genericId}_${d.data.parentType}`
              : d.data.descOf;
            return (
              <DescCard
                key={d.id}
                desc={d}
                displayId={displayId}
                genericId={genericId}
                onLocate={() => locate(d.data.descOf)}
                onDelete={() => ctx.removeNodes([d.id])}
                onSave={(label) => ctx.updateNodeData(d.id, { label })}
              />
            );
          })}
        </ul>
      )}
    </aside>
  );
};
