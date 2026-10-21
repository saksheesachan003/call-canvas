import React, { useRef } from "react";
import { useReactFlow } from "@xyflow/react";
import { LuDownload, LuMaximize, LuTrash2, LuUpload } from "react-icons/lu";
import { useCallCanvasContext } from "../../context/CallCanvasContext";
import log from "../../utils/logger";

export const Toolbar = () => {
  const ctx = useCallCanvasContext();
  const { fitView } = useReactFlow();
  const fileRef = useRef(null);

  const canvasNodes = ctx.nodes.filter((n) => n.type !== "descNode");
  const isEmpty = ctx.nodes.length === 0;

  const handleExport = () => {
    const blob = new Blob([JSON.stringify(ctx.exportFlow(), null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `callcanvas-flow-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!isEmpty && !window.confirm("Replace the current flow with the imported one?")) return;
    try {
      ctx.importFlow(JSON.parse(await file.text()));
      setTimeout(() => fitView({ padding: 0.2, duration: 300 }), 50);
    } catch (err) {
      log.error("Import failed:", err);
      window.alert(`Could not import this file.\n${err.message}`);
    }
  };

  const handleClear = () => {
    if (isEmpty) return;
    if (window.confirm("Clear the whole canvas? This cannot be undone.")) ctx.clearFlow();
  };

  return (
    <header className="callCanvasHeader">
      <div className="brand">
        <div className="brand-mark">C</div>
        <div>
          <h1>CallCanvas</h1>
          <span className="brand-sub">Call flow designer</span>
        </div>
      </div>

      <div className="header-stats">
        <span>{canvasNodes.length} nodes</span>
        <span>{ctx.edges.length} edges</span>
        <span className="saved-pill" title="The flow is saved in this browser automatically">
          Autosaved
        </span>
      </div>

      <div className="header-actions">
        <button className="btn" onClick={() => fitView({ padding: 0.2, duration: 300 })} title="Fit flow to screen">
          <LuMaximize /> Fit
        </button>
        <button className="btn" onClick={() => fileRef.current?.click()} title="Import a flow from JSON">
          <LuUpload /> Import
        </button>
        <button className="btn" onClick={handleExport} disabled={isEmpty} title="Download the flow as JSON">
          <LuDownload /> Export
        </button>
        <button className="btn danger" onClick={handleClear} disabled={isEmpty} title="Clear canvas">
          <LuTrash2 /> Clear
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="application/json,.json"
          hidden
          onChange={handleImport}
        />
      </div>
    </header>
  );
};
