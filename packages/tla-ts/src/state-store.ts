import type { StoredCells } from "./tlc/fingerprint";
import { createValueTable, isSameValue, type Value } from "./values";

// A chunk never moves, so adding a state doesn't copy the states before it.
const CHUNK_BITS = 14;
const CHUNK_MASK = (1 << CHUNK_BITS) - 1;
const PARENT = 0;
const DEPTH = 1;
const ACTION = 2;
const HEADER_LENGTH = 3;
const MAX_NARROW_CELL = 0xffff;
// Set in the action word of a state that violates an invariant, which TLC goes on past with
// -continue.
const VIOLATING = 1 << 30;

interface Chunk {
  headers: Int32Array;
  cells: Uint16Array | Int32Array;
}

// The states the checker has found, in chunks. Each state has a row of integers in its chunk's
// headers, its parent, depth, and action, and a row of cells: those of its variables, and those of
// its fingerprint state, when that differs from the state. A chunk keeps its cells in 16 bits until
// one doesn't fit.
export const createStateStore = (isSymmetric: boolean) => {
  const table = createValueTable();
  const chunks: Chunk[] = [];
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
  const getHeaderStart = (index: number) => (index & CHUNK_MASK) * HEADER_LENGTH;
  const getRowStart = (index: number) => (index & CHUNK_MASK) * layout.cellLength;
  const getChunk = (index: number) => chunks[index >>> CHUNK_BITS];
  const getHeader = (index: number, field: number) =>
    getChunk(index).headers[getHeaderStart(index) + field];
  const setCell = (chunk: Chunk, offset: number, cell: number) => {
    if (chunk.cells instanceof Uint16Array && (cell < 0 || cell > MAX_NARROW_CELL)) {
      chunk.cells = Int32Array.from(chunk.cells);
    }
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
          headers: new Int32Array((CHUNK_MASK + 1) * HEADER_LENGTH),
          cells: new Uint16Array((CHUNK_MASK + 1) * layout.cellLength),
        });
      }
      const chunk = getChunk(index);
      const headerStart = getHeaderStart(index);
      chunk.headers[headerStart + PARENT] = parent;
      chunk.headers[headerStart + DEPTH] = parent === -1 ? 1 : getHeader(parent, DEPTH) + 1;
      chunk.headers[headerStart + ACTION] = getActionId(action) | (isViolating ? VIOLATING : 0);
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
    getParent: (index: number) => getHeader(index, PARENT),
    getDepth: (index: number) => getHeader(index, DEPTH),
    getAction: (index: number) => actionNames[getHeader(index, ACTION) & ~VIOLATING],
    isViolating: (index: number) => (getHeader(index, ACTION) & VIOLATING) !== 0,
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
