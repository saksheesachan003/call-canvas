// State nodes that can be dropped on the canvas and attached to a Generic node
export const STATE_TYPES = [
  { state: "WFM", name: "Wait For Me", color: "#16a34a", describable: true },
  { state: "FTU", name: "Fail To Understand", color: "#2563eb", describable: true },
  { state: "OOC", name: "Out Of Context", color: "#ea580c", describable: true },
  { state: "HUP", name: "Hangup", color: "#0891b2", describable: false },
];

export const getStateType = (state) => STATE_TYPES.find((s) => s.state === state);

// Outgoing handles of a Generic node and the edge kind each one creates
export const EDGE_KINDS = {
  intent: { label: "Intent", color: "#64748b" },
  positive: { label: "Positive", color: "#16a34a" },
  negative: { label: "Negative", color: "#dc2626" },
  ftu: { label: "FTU", color: "#2563eb" },
};

export const HANDLE_TO_KIND = {
  "bottom-a": "positive",
  "bottom-b": "negative",
  "bottom-c": "ftu",
};

export const edgeKindOf = (sourceHandle) => HANDLE_TO_KIND[sourceHandle] || "intent";

// Prefix for the computed (non-persisted) edges that visualise groups
export const GROUP_EDGE_PREFIX = "group:";
