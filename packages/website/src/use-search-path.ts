import { useMemo, useState } from "react";
import { getPath, type Search } from "./search";

// The steps from the first state to the one under the pointer.
export const useSearchPath = (search: Search | undefined) => {
  const [hoveredStateId, setHoveredStateId] = useState<string>();
  const statesById = useMemo(
    () => new Map(search?.listedStates.map((state) => [state.id, state])),
    [search],
  );
  const states = useMemo(() => getPath(statesById, hoveredStateId), [statesById, hoveredStateId]);
  return { states, hover: setHoveredStateId };
};
