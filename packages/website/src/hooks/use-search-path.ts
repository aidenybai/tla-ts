import { useMemo } from "react";
import { getPath, type Search } from "@/lib/search";

// The steps from the first state to the hovered one.
export const useSearchPath = (search: Search | undefined, hoveredStateId: string | undefined) => {
  const statesById = useMemo(
    () => new Map(search?.listedStates.map((state) => [state.id, state])),
    [search],
  );
  return useMemo(() => getPath(statesById, hoveredStateId), [statesById, hoveredStateId]);
};
