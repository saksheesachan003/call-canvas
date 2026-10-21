import { ReactFlowProvider } from "@xyflow/react";
import { CallCanvasInner } from "./CallCanvasInner";
import { CallCanvasProvider } from "../../context/CallCanvasContext";

export const CallCanvas = () => {
  return (
    <CallCanvasProvider>
      <ReactFlowProvider>
        <CallCanvasInner />
      </ReactFlowProvider>
    </CallCanvasProvider>
  );
};
