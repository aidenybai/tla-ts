import type { Search, SearchState } from "./search";

export interface GraphRow {
  state: SearchState;
  depth: number;
  link: "root" | "chain" | "branch";
  rails: number[];
  hasNextSibling: boolean;
}

// Each state hangs under the state whose step found it, so every state is connected. A state with
// one next state continues straight down, and one with several branches one level to the right.
export const getGraphRows = (search: Search, limit: number) => {
  const states = search.listedStates.slice(0, limit);
  const indexes = new Map(states.map((state, index) => [state.id, index]));
  const finders = new Map<string, string>();
  for (const edge of search.edges) {
    const fromIndex = indexes.get(edge.fromId);
    const toIndex = indexes.get(edge.toId);
    const finder = finders.get(edge.toId);
    if (fromIndex === undefined || toIndex === undefined || fromIndex >= toIndex) continue;
    if (finder === undefined || fromIndex < (indexes.get(finder) ?? 0)) {
      finders.set(edge.toId, edge.fromId);
    }
  }
  const childrenById = new Map<string, SearchState[]>();
  const roots = states.filter((state) => {
    const parentId = state.parentId ?? finders.get(state.id);
    if (parentId === undefined || !indexes.has(parentId)) return true;
    childrenById.set(parentId, [...(childrenById.get(parentId) ?? []), state]);
    return false;
  });
  const rows: GraphRow[] = [];
  const pending: GraphRow[] = roots
    .map((state): GraphRow => ({ state, depth: 0, link: "root", rails: [], hasNextSibling: false }))
    .toReversed();
  for (let row = pending.pop(); row !== undefined; row = pending.pop()) {
    rows.push(row);
    const children = childrenById.get(row.state.id) ?? [];
    const rails =
      row.link === "branch" && row.hasNextSibling ? [...row.rails, row.depth - 1] : row.rails;
    pending.push(
      ...children
        .map((state, index): GraphRow => ({
          state,
          depth: children.length === 1 ? row.depth : row.depth + 1,
          link: children.length === 1 ? "chain" : "branch",
          rails,
          hasNextSibling: index < children.length - 1,
        }))
        .toReversed(),
    );
  }
  return {
    rows,
    // The states form one chain whose last state leads back to the first.
    isLoop:
      roots.length === 1 &&
      rows.every((row) => row.link !== "branch") &&
      search.edges.some(
        (edge) => edge.fromId === rows.at(-1)?.state.id && edge.toId === roots[0].id,
      ),
  };
};
