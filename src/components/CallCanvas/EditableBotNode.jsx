import { Handle, Position, NodeResizer } from "@xyflow/react";
import React, { useEffect, useRef, useState } from "react";
import { LuLink, LuPencil, LuX } from "react-icons/lu";
import { useCallCanvasContext } from "../../context/CallCanvasContext";
import { EDGE_KINDS } from "./constants";
import "./CallCanvasInner.css";

const BOTTOM_HANDLES = [
  { id: "bottom-a", kind: "positive", left: "25%", short: "+" },
  { id: "bottom-b", kind: "negative", left: "50%", short: "−" },
  { id: "bottom-c", kind: "ftu", left: "75%", short: "?" },
];

// Generic node: an editable bot utterance
export const EditableBotNode = React.memo(({ data, id, selected }) => {
  const ctx = useCallCanvasContext();
  const [isEditing, setIsEditing] = useState(false);
  const [label, setLabel] = useState(data.label || "");
  const [hovered, setHovered] = useState(false);
  const inputRef = useRef(null);

  const isGrouping = ctx.groupingNode === id;
  const attachedCount =
    ctx.groups.find((g) => g.includes(id))?.filter((nid) => nid !== id).length ?? 0;

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  // keep local label in sync when node data changes (import, undo of edits, ...)
  useEffect(() => {
    if (!isEditing) setLabel(data.label || "");
  }, [data.label, isEditing]);

  // new nodes open straight in edit mode
  useEffect(() => {
    if (data.isNew) {
      setIsEditing(true);
      ctx.updateNodeData(id, { isNew: undefined });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const commit = () => {
    setIsEditing(false);
    const text = label.trim() || "Enter Text";
    setLabel(text);
    if (text !== data.label) ctx.updateNodeData(id, { label: text });
  };

  const cancel = () => {
    setIsEditing(false);
    setLabel(data.label || "");
  };

  const toggleGrouping = (e) => {
    e.stopPropagation();
    ctx.setPlacing(null);
    ctx.setGroupingNode(isGrouping ? null : id);
  };

  const showHandleHints = hovered || selected;

  return (
    <div
      className={[
        "generic-node",
        selected ? "is-selected" : "",
        isGrouping ? "grouping-active" : "",
      ].join(" ")}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <NodeResizer
        minWidth={140}
        minHeight={44}
        isVisible={selected && !isEditing}
        lineClassName="generic-resize-line"
        handleClassName="generic-resize-handle"
      />

      <div className="generic-node-header">
        <span className="node-id">{id}</span>
        {attachedCount > 0 && (
          <span className="attached-badge" title={`${attachedCount} state node(s) attached`}>
            <LuLink /> {attachedCount}
          </span>
        )}
      </div>

      <div
        className="generic-node-body"
        onDoubleClick={(e) => {
          e.stopPropagation();
          setIsEditing(true);
        }}
      >
        {isEditing ? (
          <textarea
            ref={inputRef}
            className="nodrag nowheel generic-input"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            onBlur={commit}
            // Enter saves, Shift+Enter adds a new line, Esc cancels
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                commit();
              } else if (e.key === "Escape") {
                e.preventDefault();
                cancel();
              }
            }}
          />
        ) : (
          <div className={`generic-text ${label === "Enter Text" ? "placeholder" : ""}`}>
            {label}
          </div>
        )}
      </div>

      <Handle type="target" position={Position.Top} id="top" className="generic-handle" />
      {/* anchor for the dashed group links; not user-connectable */}
      <Handle
        type="source"
        position={Position.Left}
        id="group"
        isConnectable={false}
        className="group-anchor"
      />
      <Handle
        type="source"
        position={Position.Right}
        id="right"
        className="generic-handle"
        style={{ "--handle-color": EDGE_KINDS.intent.color }}
        title="Intent"
      />
      {BOTTOM_HANDLES.map((h) => (
        <Handle
          key={h.id}
          type="source"
          position={Position.Bottom}
          id={h.id}
          className="generic-handle"
          style={{ left: h.left, "--handle-color": EDGE_KINDS[h.kind].color }}
          title={EDGE_KINDS[h.kind].label}
        />
      ))}
      {showHandleHints && !isEditing && (
        <div className="handle-hints">
          {BOTTOM_HANDLES.map((h) => (
            <span key={h.id} style={{ left: h.left, color: EDGE_KINDS[h.kind].color }}>
              {EDGE_KINDS[h.kind].label}
            </span>
          ))}
        </div>
      )}

      {hovered && !isEditing && (
        <div className="node-actions">
          <button
            className={`node-action-btn ${isGrouping ? "active" : ""}`}
            onClick={toggleGrouping}
            title={isGrouping ? "Finish attaching" : "Attach state nodes"}
          >
            <LuLink />
          </button>
          <button
            className="node-action-btn"
            onClick={(e) => {
              e.stopPropagation();
              setIsEditing(true);
            }}
            title="Edit text"
          >
            <LuPencil />
          </button>
          <button
            className="node-action-btn danger"
            onClick={(e) => {
              e.stopPropagation();
              ctx.removeNodes([id]);
            }}
            title="Delete node (and its attached state nodes)"
          >
            <LuX />
          </button>
        </div>
      )}
    </div>
  );
});
