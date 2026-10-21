import React from "react";
import { LuCircleHelp, LuGripVertical } from "react-icons/lu";
import { useCallCanvasContext } from "../../context/CallCanvasContext";
import { STATE_TYPES } from "../../constants";
import { StatePill } from "../nodes/StatePill";

const guide = [
  {
    title: "Add",
    items: [
      "Drag a node from the palette onto the canvas — or click it, then click the canvas.",
      "Drag from a Generic node's handle to empty space to create a connected Generic node.",
    ],
  },
  {
    title: "Connect",
    items: [
      "Bottom handles create Positive, Negative and FTU edges (left to right); the right handle creates an Intent edge.",
      "Click an edge label to rename it.",
    ],
  },
  {
    title: "Attach states",
    items: [
      "Drag from a Generic node's handle onto a state node, or hover a Generic node, click the link icon, then click state nodes.",
      "Attached nodes move together and show a dashed link. Detach from the state node's hover menu or by selecting the dashed link and pressing Delete.",
    ],
  },
  {
    title: "Edit & delete",
    items: [
      "Double-click a Generic node to edit its text (Shift + Enter for a new line).",
      "Hover a WFM / FTU / OOC node and click + to describe it.",
      "Select anything and press Delete, or use the × on hover.",
    ],
  },
];

const shortcuts = [
  ["Delete", "Remove selection"],
  ["Esc", "Cancel placing / attaching"],
  ["Ctrl + Scroll", "Zoom"],
  ["Shift + Drag", "Box-select"],
];

const setDragData = (event, payload) => {
  event.dataTransfer.setData("application/reactflow", JSON.stringify(payload));
  event.dataTransfer.effectAllowed = "move";
};

export const Sidebar = () => {
  const ctx = useCallCanvasContext();

  const togglePlacing = (key) => {
    ctx.setGroupingNode(null);
    ctx.setPlacing((prev) => (prev === key ? null : key));
  };

  return (
    <aside className="callCanvasSidebar">
      <section className="sidebar-section">
        <h3 className="sidebar-title">Nodes</h3>

        <div
          className={`palette-item ${ctx.placing === "generic" ? "is-active" : ""}`}
          draggable
          onDragStart={(e) => setDragData(e, { type: "botUtterance" })}
          onClick={() => togglePlacing("generic")}
        >
          <LuGripVertical className="palette-grip" />
          <div className="palette-generic-preview">Aa</div>
          <div className="palette-text">
            <strong>Generic</strong>
            <span>What the bot says, e.g. "Hi, how may I assist you?"</span>
          </div>
        </div>

        <div className="palette-subtitle">States</div>
        {STATE_TYPES.map((s) => (
          <div
            key={s.state}
            className={`palette-item ${ctx.placing === s.state ? "is-active" : ""}`}
            draggable
            onDragStart={(e) => setDragData(e, { type: "custom", state: s.state })}
            onClick={() => togglePlacing(s.state)}
          >
            <LuGripVertical className="palette-grip" />
            <StatePill state={s.state} />
            <div className="palette-text">
              <strong>{s.name}</strong>
              <span>{s.describable ? "Can have a description" : "Ends the call"}</span>
            </div>
          </div>
        ))}
      </section>

      <details className="sidebar-section guide" open>
        <summary className="sidebar-title">
          <LuCircleHelp /> How to use
        </summary>
        {guide.map((g) => (
          <div key={g.title} className="guide-group">
            <h4>{g.title}</h4>
            <ul>
              {g.items.map((t) => (
                <li key={t}>{t}</li>
              ))}
            </ul>
          </div>
        ))}
        <div className="guide-group">
          <h4>Shortcuts</h4>
          <dl className="shortcuts">
            {shortcuts.map(([k, v]) => (
              <React.Fragment key={k}>
                <dt>
                  <kbd>{k}</kbd>
                </dt>
                <dd>{v}</dd>
              </React.Fragment>
            ))}
          </dl>
        </div>
      </details>
    </aside>
  );
};
