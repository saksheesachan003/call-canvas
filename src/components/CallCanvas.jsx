import { ReactFlowProvider } from "@xyflow/react";
import { Canvas } from "./Canvas";
import { CallCanvasProvider } from "../context/CallCanvasContext";

export const CallCanvas = () => {
  return (
    <CallCanvasProvider>
      <ReactFlowProvider>
        <Canvas />
      </ReactFlowProvider>
    </CallCanvasProvider>
  );
};
