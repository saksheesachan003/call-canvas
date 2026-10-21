import { EDGE_KINDS } from "../../constants";

// Arrow heads for each edge kind, referenced by FlowEdge as url(#callcanvas-arrow-<kind>)
export const EdgeMarkers = () => (
  <svg className="edge-markers" aria-hidden>
    <defs>
      {Object.entries(EDGE_KINDS).map(([kind, { color }]) => (
        <marker
          key={kind}
          id={`callcanvas-arrow-${kind}`}
          viewBox="0 0 10 10"
          refX="9"
          refY="5"
          markerWidth="7"
          markerHeight="7"
          orient="auto-start-reverse"
        >
          <path d="M0,0 L10,5 L0,10 z" fill={color} />
        </marker>
      ))}
    </defs>
  </svg>
);
