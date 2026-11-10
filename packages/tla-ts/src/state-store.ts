import type { StoredCells } from "./tlc/fingerprint";
import { createValueTable, isSameValue, type Value } from "./values";

// A chunk never moves, so adding a state doesn't copy the states before it.
const CHUNK_BITS = 14;
const CHUNK_MASK = (1 << CHUNK_BITS) - 1;
const MAX_NARROW = 0xffff;

interface Chunk {
  parents: Int32Array;
  // Twice each state's action id, plus one when the state violates an invariant, which TLC goes
  // on past with -continue.
  actions: Uint16Array | Int32Array;
  cells: Uint16Array | Int32Array;
}

// An array of a chunk stays 16 bits until a value doesn't fit.
const fit = (array: Uint16Array | Int32Array, value: number) =>
  array instanceof Uint16Array && (value < 0 || value > MAX_NARROW) ? Int32Array.from(array) : array;

// The states the checker has found, in chunks. Each state has its parent, its action, and a row of
// cells: those of its variables, and those of its fingerprint state, when that differs from the
// state.
export const createStateStore = (isSymmetric: boolean) => {
  const table = createValueTable();
  const chunks: Chunk[] = [];
  // The index of the first state at each depth, since the search adds states in order of depth.
  const levelStarts: number[] = [];
  const getDepth = (index: number) => {
    let low = 0;
    let high = levelStarts.length;
    while (low < high) {
      const middle = (low + high) >>> 1;
      if (levelStarts[middle] <= index) low = middle + 1;
      else high = middle;
    }
    return low;
  };
  const actionIds = new Map<string, number>();
  const actionNames: (string | undefined)[] = [undefined];
  const layout = {
    count: 0,
    cellLength: 0,
    variableCount: 0,
    fingerprintStart: 0,
    // A copy of the first state, which a state read back starts from, so its array is packed.
    stateTemplate: [] as Value[],
  };
  const getRowStart = (index: number) => (index & CHUNK_MASK) * layout.cellLength;
  const getChunk = (index: number) => chunks[index >>> CHUNK_BITS];
  const getActionWord = (index: number) => getChunk(index).actions[index & CHUNK_MASK];
  const setCell = (chunk: Chunk, offset: number, cell: number) => {
    chunk.cells = fit(chunk.cells, cell);
    chunk.cells[offset] = cell;
  };
  const getActionId = (action: string | undefined) => {
    if (action === undefined) return 0;
    const existing = actionIds.get(action);
    if (existing !== undefined) return existing;
    actionIds.set(action, actionNames.length);
    actionNames.push(action);
    return actionNames.length - 1;
  };
  return {
    canonicalizeState: table.canonicalizeState,
    getCount: () => layout.count,
    add: (
      state: Value[],
      fingerprintState: Value[],
      parent: number,
      action: string | undefined,
      isViolating: boolean,
    ) => {
      // A symmetry's representative or a view is a new state, which shares values with the others
      // only once it is canonicalized too.
      if (fingerprintState !== state) table.canonicalizeState(fingerprintState);
      // A symmetric state can be its own representative, but the next one may not be.
      const isFingerprintStored = isSymmetric || fingerprintState !== state;
      if (layout.count === 0) {
        layout.variableCount = state.length;
        layout.stateTemplate = state.slice();
        layout.cellLength = state.length + (isFingerprintStored ? fingerprintState.length : 0);
        layout.fingerprintStart = isFingerprintStored ? state.length : 0;
      }
      const index = layout.count++;
      if ((index & CHUNK_MASK) === 0) {
        chunks.push({
          parents: new Int32Array(CHUNK_MASK + 1),
          actions: new Uint16Array(CHUNK_MASK + 1),
          cells: new Uint16Array((CHUNK_MASK + 1) * layout.cellLength),
        });
      }
      if ((parent === -1 ? 1 : getDepth(parent) + 1) > levelStarts.length) levelStarts.push(index);
      const chunk = getChunk(index);
      const actionWord = getActionId(action) * 2 + (isViolating ? 1 : 0);
      chunk.parents[index & CHUNK_MASK] = parent;
      chunk.actions = fit(chunk.actions, actionWord);
      chunk.actions[index & CHUNK_MASK] = actionWord;
      const start = getRowStart(index);
      for (let position = 0; position < state.length; position++) {
        setCell(chunk, start + position, table.getCell(state[position]));
      }
      if (!isFingerprintStored) return;
      for (let position = 0; position < fingerprintState.length; position++) {
        setCell(
          chunk,
          start + layout.fingerprintStart + position,
          table.getCell(fingerprintState[position]),
        );
      }
    },
    getParent: (index: number) => getChunk(index).parents[index & CHUNK_MASK],
    getDepth,
    getAction: (index: number) => actionNames[getActionWord(index) >>> 1],
    isViolating: (index: number) => (getActionWord(index) & 1) !== 0,
    getState: (index: number) => {
      const cells = getChunk(index).cells;
      const cellStart = getRowStart(index);
      const state = layout.stateTemplate.slice();
      for (let position = 0; position < state.length; position++) {
        state[position] = table.getValue(cells[cellStart + position]);
      }
      return state;
    },
    getFingerprintCells: (): StoredCells => ({
      count: layout.count,
      valueCount: table.getValueCount(),
      getCell: (index, position) =>
        getChunk(index).cells[getRowStart(index) + layout.fingerprintStart + position],
      getValue: table.getValue,
    }),
    isSameFingerprint: (index: number, state: Value[]) => {
      const cells = getChunk(index).cells;
      const cellStart = getRowStart(index) + layout.fingerprintStart;
      for (let position = 0; position < state.length; position++) {
        if (!isSameValue(table.getValue(cells[cellStart + position]), state[position])) {
          return false;
        }
      }
      return true;
    },
    isStoredIdentically: (index: number, state: Value[]) => {
      const cells = getChunk(index).cells;
      const cellStart = getRowStart(index);
      for (let position = 0; position < layout.variableCount; position++) {
        if (table.getValue(cells[cellStart + position]) !== state[position]) return false;
      }
      return true;
    },
  };
};
