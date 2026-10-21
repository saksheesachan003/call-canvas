import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ReactFlow,
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  applyEdgeChanges,
  applyNodeChanges,
  useReactFlow,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { LuMousePointerClick, LuX } from "react-icons/lu";
import { findGenericOf, useCallCanvasContext } from "../context/CallCanvasContext";
import { StateNode } from "./nodes/StateNode";
import { GenericNode } from "./nodes/GenericNode";
import FlowEdge from "./edges/FlowEdge";
import { GroupEdge } from "./edges/GroupEdge";
import { EdgeMarkers } from "./edges/EdgeMarkers";
import { Sidebar } from "./layout/Sidebar";
import { Toolbar } from "./layout/Toolbar";
import { DescriptionPanel } from "./layout/DescriptionPanel";
import { EDGE_KINDS, GROUP_EDGE_PREFIX, edgeKindOf, getStateType } from "../constants";
import "./CallCanvas.css";

// The type keys are stored in saved and exported flows, so they must not be renamed
const nodeTypes = {
  custom: StateNode,
  botUtterance: GenericNode,
};

const edgeTypes = {
  customEdge: FlowEdge,
  groupLink: GroupEdge,
};

const isGroupEdge = (id) => id?.startsWith(GROUP_EDGE_PREFIX);

export const Canvas = () => {
  const ctx = useCallCanvasContext();
  const { screenToFlowPosition, getNode } = useReactFlow();
  const dragRef = useRef(null);
  const [descOpen, setDescOpen] = useState(true);

  const flowNodes = useMemo(
    () => ctx.nodes.filter((n) => n.type !== "descNode"),
    [ctx.nodes],
  );

  // Groups are drawn as dashed links from the Generic node to each attached state node
  const displayEdges = useMemo(() => {
    const links = [];
    ctx.groups.forEach((g) => {
      const genericId = g.find(
        (nid) => ctx.nodes.find((n) => n.id === nid)?.type === "botUtterance",
      );
      if (!genericId) return;
      g.forEach((nid) => {
        if (nid === genericId) return;
        links.push({
          id: `${GROUP_EDGE_PREFIX}${genericId}:${nid}`,
          source: genericId,
          sourceHandle: "group",
          target: nid,
          targetHandle: "top",
          type: "groupLink",
        });
      });
    });
    return [...ctx.edges, ...links];
  }, [ctx.edges, ctx.groups, ctx.nodes]);

  const makeNode = useCallback(
    (kind, position) => {
      if (kind === "generic" || kind === "botUtterance") {
        return {
          id: ctx.nextId(),
          type: "botUtterance",
          position,
          origin: [0.5, 0],
          data: { label: "Enter Text", isNew: true },
        };
      }
      return {
        id: ctx.nextId(),
        type: "custom",
        position,
        origin: [0.5, 0.5],
        data: { stateLabel: kind },
      };
    },
    [ctx.nextId],
  );

  // Esc cancels placing / attaching
  useEffect(() => {
    const onKey = (e) => {
      if (e.key !== "Escape") return;
      ctx.setPlacing(null);
      ctx.setGroupingNode(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [ctx.setPlacing, ctx.setGroupingNode]);

  /* ---------- nodes ---------- */

  const onNodesChange = useCallback(
    (changes) => ctx.setNodes((nds) => applyNodeChanges(changes, nds)),
    [ctx.setNodes],
  );

  // Keyboard deletes also cascade to attached state nodes, descriptions and groups
  const onNodesDelete = useCallback(
    (deleted) => ctx.removeNodes(deleted.map((n) => n.id)),
    [ctx.removeNodes],
  );

  // While attaching, clicking a state node toggles whether it is attached
  const onNodeClick = useCallback(
    (event, node) => {
      if (!ctx.groupingNode || node.type !== "custom") return;
      const current = findGenericOf(node.id, ctx.groups, ctx.nodes);
      if (current === ctx.groupingNode) ctx.detach(node.id);
      else ctx.attach(ctx.groupingNode, node.id);
    },
    [ctx.groupingNode, ctx.groups, ctx.nodes, ctx.attach, ctx.detach],
  );

  // Attached nodes follow the dragged node live
  const onNodeDragStart = useCallback(
    (event, node, dragged) => {
      const draggedIds = new Set(dragged.map((n) => n.id));
      const followers = {};
      ctx.groups.forEach((g) => {
        if (!g.some((nid) => draggedIds.has(nid))) return;
        g.forEach((nid) => {
          if (draggedIds.has(nid)) return;
          const n = ctx.nodes.find((x) => x.id === nid);
          if (n) followers[nid] = n.position;
        });
      });
      dragRef.current = Object.keys(followers).length
        ? { anchorId: node.id, anchorStart: node.position, followers }
        : null;
    },
    [ctx.groups, ctx.nodes],
  );

  const onNodeDrag = useCallback(
    (event, node) => {
      const drag = dragRef.current;
      if (!drag || drag.anchorId !== node.id) return;
      const dx = node.position.x - drag.anchorStart.x;
      const dy = node.position.y - drag.anchorStart.y;
      ctx.setNodes((nds) =>
        nds.map((n) => {
          const start = drag.followers[n.id];
          return start ? { ...n, position: { x: start.x + dx, y: start.y + dy } } : n;
        }),
      );
    },
    [ctx.setNodes],
  );

  const onNodeDragStop = useCallback(() => {
    dragRef.current = null;
  }, []);

  /* ---------- edges ---------- */

  const onEdgesChange = useCallback(
    (changes) => {
      const real = [];
      changes.forEach((c) => {
        if (!isGroupEdge(c.id)) real.push(c);
        // deleting a dashed group link detaches the state node
        else if (c.type === "remove") ctx.detach(c.id.split(":").pop());
      });
      if (real.length) ctx.setEdges((eds) => applyEdgeChanges(real, eds));
    },
    [ctx.setEdges, ctx.detach],
  );

  const onEdgeDoubleClick = useCallback(
    (event, edge) => {
      event.stopPropagation();
      if (isGroupEdge(edge.id)) ctx.detach(edge.target);
    },
    [ctx.detach],
  );

  const isValidConnection = useCallback(
    (c) => c.source !== c.target,
    [],
  );

  const addEdge = useCallback(
    ({ source, sourceHandle, target, targetHandle }) => {
      const kind = edgeKindOf(sourceHandle);
      const id = `${source}${sourceHandle || ""}-${target}${targetHandle || ""}`;
      ctx.setEdges((eds) =>
        eds.some((e) => e.id === id)
          ? eds
          : [
              ...eds,
              {
                id,
                source,
                sourceHandle,
                target,
                targetHandle,
                type: "customEdge",
                data: { label: EDGE_KINDS[kind].label, kind },
              },
            ],
      );
    },
    [ctx.setEdges],
  );

  const onConnect = useCallback(
    (params) => {
      const sourceNode = getNode(params.source);
      const targetNode = getNode(params.target);

      // Generic -> state node attaches the state instead of drawing an edge
      if (sourceNode?.type === "botUtterance" && targetNode?.type === "custom") {
        ctx.attach(sourceNode.id, targetNode.id);
        return;
      }
      addEdge(params);
    },
    [getNode, ctx.attach, addEdge],
  );

  // Dropping a connection on empty canvas creates a new connected Generic node
  const onConnectEnd = useCallback(
    (event, connectionState) => {
      if (connectionState.isValid) return;
      const fromNode = connectionState.fromNode;
      const fromHandle = connectionState.fromHandle;
      if (fromNode?.type !== "botUtterance" || fromHandle?.type !== "source") return;
      if (!event.target?.classList?.contains("react-flow__pane")) return;

      const { clientX, clientY } = event.changedTouches?.[0] ?? event;
      const newNode = makeNode("generic", screenToFlowPosition({ x: clientX, y: clientY }));
      ctx.setNodes((nds) => nds.concat(newNode));
      addEdge({
        source: fromNode.id,
        sourceHandle: fromHandle.id,
        target: newNode.id,
        targetHandle: "top",
      });
    },
    [screenToFlowPosition, makeNode, addEdge, ctx.setNodes],
  );

  /* ---------- palette ---------- */

  const onDragOver = useCallback((event) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  }, []);

  const onDrop = useCallback(
    (event) => {
      event.preventDefault();
      const raw = event.dataTransfer.getData("application/reactflow");
      if (!raw) return;
      let payload;
      try {
        payload = JSON.parse(raw);
      } catch {
        return;
      }
      const kind = payload.type === "custom" ? payload.state : "generic";
      const newNode = makeNode(kind, screenToFlowPosition({ x: event.clientX, y: event.clientY }));
      ctx.setNodes((nds) => nds.concat(newNode));
      ctx.setPlacing(null);
    },
    [screenToFlowPosition, makeNode, ctx.setNodes, ctx.setPlacing],
  );

  const onPaneClick = useCallback(
    (event) => {
      if (ctx.groupingNode) {
        ctx.setGroupingNode(null);
        return;
      }
      if (!ctx.placing) return;
      const newNode = makeNode(
        ctx.placing,
        screenToFlowPosition({ x: event.clientX, y: event.clientY }),
      );
      ctx.setNodes((nds) => nds.concat(newNode));
      ctx.setPlacing(null);
    },
    [ctx.placing, ctx.groupingNode, ctx.setNodes, ctx.setPlacing, ctx.setGroupingNode, makeNode, screenToFlowPosition],
  );

  const placingName =
    ctx.placing === "generic" ? "Generic" : getStateType(ctx.placing)?.state;

  return (
    <div className="callCanvasMainCtnr">
      <Toolbar />

      <div className="callCanvasBody">
        <Sidebar />

        <main
          className={[
            "canvasWrap",
            ctx.placing ? "placing" : "",
            ctx.groupingNode ? "grouping" : "",
          ].join(" ")}
        >
          <EdgeMarkers />

          {(ctx.placing || ctx.groupingNode) && (
            <div className="mode-banner" role="status">
              <LuMousePointerClick />
              {ctx.placing ? (
                <span>
                  Click on the canvas to place a <strong>{placingName}</strong> node
                </span>
              ) : (
                <span>
                  Attaching to <strong>{ctx.groupingNode}</strong> — click state nodes to
                  attach or detach them
                </span>
              )}
              <button
                className="mode-banner-close"
                onClick={() => {
                  ctx.setPlacing(null);
                  ctx.setGroupingNode(null);
                }}
                title="Done (Esc)"
              >
                {ctx.groupingNode ? "Done" : <LuX />}
              </button>
            </div>
          )}

          {flowNodes.length === 0 && (
            <div className="canvas-empty">
              <h2>Start your call flow</h2>
              <p>Drag a Generic node from the left panel onto the canvas,</p>
              <p>then connect it to other nodes and attach states.</p>
            </div>
          )}

          <ReactFlow
            nodes={flowNodes}
            edges={displayEdges}
            nodeTypes={nodeTypes}
            edgeTypes={edgeTypes}
            onNodesChange={onNodesChange}
            onNodesDelete={onNodesDelete}
            onEdgesChange={onEdgesChange}
            onNodeClick={onNodeClick}
            onNodeDragStart={onNodeDragStart}
            onNodeDrag={onNodeDrag}
            onNodeDragStop={onNodeDragStop}
            onConnect={onConnect}
            onConnectEnd={onConnectEnd}
            isValidConnection={isValidConnection}
            onEdgeDoubleClick={onEdgeDoubleClick}
            onDragOver={onDragOver}
            onDrop={onDrop}
            onPaneClick={onPaneClick}
            deleteKeyCode={["Backspace", "Delete"]}
            panOnScroll
            zoomOnDoubleClick={false}
            snapToGrid
            snapGrid={[10, 10]}
            connectionRadius={30}
            fitView={flowNodes.length > 0}
            fitViewOptions={{ padding: 0.2, maxZoom: 1.2 }}
            defaultViewport={{ x: 0, y: 0, zoom: 1 }}
          >
            <Background variant={BackgroundVariant.Dots} gap={20} size={1.2} color="#cbd5e1" />
            <Controls showInteractive={false} position="bottom-left" />
            {flowNodes.length > 0 && (
            <MiniMap
              pannable
              zoomable
              position="bottom-right"
              nodeColor={(n) =>
                n.type === "custom" ? getStateType(n.data?.stateLabel)?.color ?? "#94a3b8" : "#e2e8f0"
              }
              nodeStrokeColor={(n) => (n.type === "botUtterance" ? "#228aa7" : "transparent")}
              nodeStrokeWidth={3}
            />
            )}
          </ReactFlow>
        </main>

        <DescriptionPanel open={descOpen} onOpenChange={setDescOpen} />
      </div>
    </div>
  );
};
