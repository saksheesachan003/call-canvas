import { getStateType } from "../../constants";

// Coloured state label, used both on the canvas and in the palette
export const StatePill = ({ state }) => {
  const type = getStateType(state);
  return (
    <div className="state-pill" style={{ "--state-color": type?.color }}>
      {state}
    </div>
  );
};
