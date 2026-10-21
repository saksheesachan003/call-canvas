import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import log from "../utils/logger";

const CallCanvasContext = createContext();

const STORAGE_KEY = "callcanvas:flow:v1";
// Key used before the app was renamed; read once so existing flows are kept
const LEGACY_STORAGE_KEY = "crafa:flow:v1";

const loadSaved = () => {
  try {
    const raw =
      localStorage.getItem(STORAGE_KEY) ?? localStorage.getItem(LEGACY_STORAGE_KEY);
    if (!raw) return null;
    const flow = JSON.parse(raw);
    if (!Array.isArray(flow.nodes) || !Array.isArray(flow.edges)) return null;
    return { nodes: flow.nodes, edges: flow.edges, groups: flow.groups || [] };
  } catch (err) {
    log.warn("Could not restore saved flow:", err);
    return null;
  }
};

// Next free numeric suffix for `node_<n>` ids
const nextIdAfter = (nodes) =>
  nodes.reduce((max, n) => {
    const m = /^node_(\d+)$/.exec(n.id);
    return m ? Math.max(max, Number(m[1]) + 1) : max;
  }, 0);

// Drop transient react-flow UI flags before persisting/exporting
const cleanNode = ({ selected, dragging, ...rest }) => rest;
const cleanEdge = ({ selected, ...rest }) => rest;

export const CallCanvasProvider = ({ children }) => {
  const saved = useMemo(loadSaved, []);

  const [nodes, setNodes] = useState(saved?.nodes ?? []);
  const [edges, setEdges] = useState(saved?.edges ?? []);
  const [groups, setGroups] = useState(saved?.groups ?? []);
  // Generic node id whose state nodes are being attached (grouping mode)
  const [groupingNode, setGroupingNode] = useState(null);
  // Palette item waiting to be placed with a click on the canvas
  const [placing, setPlacing] = useState(null);

  const idCounter = useRef(nextIdAfter(saved?.nodes ?? []));
  const nextId = useCallback(() => `node_${idCounter.current++}`, []);

  // Autosave to the browser
  useEffect(() => {
    const handle = setTimeout(() => {
      try {
        localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({
            nodes: nodes.map(cleanNode),
            edges: edges.map(cleanEdge),
            groups,
          }),
        );
      } catch (err) {
        log.warn("Autosave failed:", err);
      }
    }, 300);
    return () => clearTimeout(handle);
  }, [nodes, edges, groups]);

  // Attach a state node to a Generic node. A state node belongs to one Generic.
  const attach = useCallback((genericId, stateId) => {
    setGroups((prev) => {
      const without = prev
        .map((g) => g.filter((nid) => nid !== stateId))
        .filter((g) => g.length > 1);
      const idx = without.findIndex((g) => g.includes(genericId));
      if (idx === -1) return [...without, [genericId, stateId]];
      return without.map((g, i) => (i === idx ? [...g, stateId] : g));
    });
  }, []);

  const detach = useCallback((stateId) => {
    setGroups((prev) =>
      prev
        .map((g) => g.filter((nid) => nid !== stateId))
        .filter((g) => g.length > 1),
    );
  }, []);

  // Remove nodes and everything that depends on them:
  // Generic -> its attached state nodes -> their descriptions, plus edges and groups.
  const removeNodes = useCallback(
    (ids) => {
      const toDelete = new Set(ids);

      groups.forEach((g) => {
        g.forEach((gid) => {
          const n = nodes.find((x) => x.id === gid);
          if (toDelete.has(gid) && n?.type === "botUtterance") {
            g.forEach((member) => toDelete.add(member));
          }
        });
      });
      nodes.forEach((n) => {
        if (n.type === "descNode" && toDelete.has(n.data?.descOf)) {
          toDelete.add(n.id);
        }
      });

      setNodes((nds) => nds.filter((n) => !toDelete.has(n.id)));
      setEdges((eds) =>
        eds.filter((e) => !toDelete.has(e.source) && !toDelete.has(e.target)),
      );
      setGroups((gs) =>
        gs
          .map((g) => g.filter((nid) => !toDelete.has(nid)))
          .filter((g) => g.length > 1),
      );
      if (toDelete.has(groupingNode)) setGroupingNode(null);
    },
    [nodes, groups, groupingNode],
  );

  const updateNodeData = useCallback((id, patch) => {
    setNodes((nds) =>
      nds.map((n) => (n.id === id ? { ...n, data: { ...n.data, ...patch } } : n)),
    );
  }, []);

  // Description of a state node (stored as a `descNode`, shown in the side panel)
  const addDescription = useCallback(
    (stateNode) => {
      const descId = `desc_${stateNode.id}`;
      if (nodes.some((n) => n.id === descId)) return descId;
      setNodes((nds) =>
        nds.concat({
          id: descId,
          type: "descNode",
          position: { x: 0, y: 0 },
          data: {
            label: "",
            descOf: stateNode.id,
            parentType: stateNode.data.stateLabel,
          },
        }),
      );
      return descId;
    },
    [nodes],
  );

  const clearFlow = useCallback(() => {
    idCounter.current = 0;
    setNodes([]);
    setEdges([]);
    setGroups([]);
    setGroupingNode(null);
    setPlacing(null);
  }, []);

  const exportFlow = useCallback(
    () => ({
      version: 1,
      nodes: nodes.map(cleanNode),
      edges: edges.map(cleanEdge),
      groups,
    }),
    [nodes, edges, groups],
  );

  const importFlow = useCallback((flow) => {
    if (!Array.isArray(flow?.nodes) || !Array.isArray(flow?.edges)) {
      throw new Error("File is not a CallCanvas flow (missing nodes/edges).");
    }
    idCounter.current = nextIdAfter(flow.nodes);
    setNodes(flow.nodes);
    setEdges(flow.edges);
    setGroups(Array.isArray(flow.groups) ? flow.groups : []);
    setGroupingNode(null);
    setPlacing(null);
  }, []);

  const providerValue = useMemo(
    () => ({
      nodes,
      setNodes,
      edges,
      setEdges,
      groups,
      groupingNode,
      setGroupingNode,
      placing,
      setPlacing,
      nextId,
      attach,
      detach,
      removeNodes,
      updateNodeData,
      addDescription,
      clearFlow,
      exportFlow,
      importFlow,
    }),
    [
      nodes,
      edges,
      groups,
      groupingNode,
      placing,
      nextId,
      attach,
      detach,
      removeNodes,
      updateNodeData,
      addDescription,
      clearFlow,
      exportFlow,
      importFlow,
    ],
  );

  return (
    <CallCanvasContext.Provider value={providerValue}>
      {children}
    </CallCanvasContext.Provider>
  );
};

export const useCallCanvasContext = () => useContext(CallCanvasContext);

// Generic node a state node is attached to (or null)
export const findGenericOf = (stateId, groups, nodes) => {
  const group = groups.find((g) => g.includes(stateId));
  if (!group) return null;
  return (
    group.find(
      (nid) => nid !== stateId && nodes.find((n) => n.id === nid)?.type === "botUtterance",
    ) ?? null
  );
};
