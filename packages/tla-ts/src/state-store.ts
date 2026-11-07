import type { StoredCells } from "./tlc/fingerprint";
import { createValueTable, isSameValue, type Value } from "./values";

// A chunk never moves, so adding a state doesn't copy the states before it.
const CHUNK_BITS = 14;
const CHUNK_MASK = (1 << CHUNK_BITS) - 1;
const PARENT = 0;
const DEPTH = 1;
const ACTION = 2;
const HEADER_LENGTH = 3;
// Set in the action word of a state that violates an invariant, which TLC goes on past with
// -continue.
const VIOLATING = 1 << 30;

// The states the checker has found, one row of integers each: its parent, depth, and action, the
// cells of its variables, and the cells of its fingerprint state, when that differs from the state.
// A state read back is a new array, so a stored state has no identity to compare.
export const createStateStore = (isSymmetric: boolean) => {
  const table = createValueTable();
  const chunks: Int32Array[] = [];
  const actionIds = new Map<string, number>();
  const actionNames: (string | undefined)[] = [undefined];
  const layout = {
    count: 0,
    rowLength: 0,
    variableCount: 0,
    fingerprintStart: HEADER_LENGTH,
    template: [] as Value[],
  };
  const getRowStart = (index: number) => (index & CHUNK_MASK) * layout.rowLength;
  const getActionId = (action: string | undefined) => {
    if (action === undefined) return 0;
    const existing = actionIds.get(action);
    if (existing !== undefined) return existing;
    actionIds.set(action, actionNames.length);
    actionNames.push(action);
    return actionNames.length - 1;
  };
  const readCells = (index: number, start: number, length: number, target: Value[]) => {
    const chunk = chunks[index >>> CHUNK_BITS];
    const cellStart = getRowStart(index) + start;
    for (let position = 0; position < length; position++) {
      target[position] = table.getValue(chunk[cellStart + position]);
    }
    return target;
  };
  const isStoredIdentically = (index: number, state: Value[]) => {
    const chunk = chunks[index >>> CHUNK_BITS];
    const cellStart = getRowStart(index) + HEADER_LENGTH;
    for (let position = 0; position < layout.variableCount; position++) {
      if (table.getValue(chunk[cellStart + position]) !== state[position]) return false;
    }
    return true;
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
      if (fingerprintState !== state) table.canonicalizeState(fingerprintState);
      const isFingerprintStored = isSymmetric || fingerprintState !== state;
      if (layout.count === 0) {
        layout.variableCount = state.length;
        layout.rowLength =
          HEADER_LENGTH + state.length + (isFingerprintStored ? fingerprintState.length : 0);
        layout.fingerprintStart = isFingerprintStored
          ? HEADER_LENGTH + state.length
          : HEADER_LENGTH;
        layout.template = state.slice();
      }
      const index = layout.count++;
      if ((index & CHUNK_MASK) === 0) {
        chunks.push(new Int32Array((CHUNK_MASK + 1) * layout.rowLength));
      }
      const chunk = chunks[index >>> CHUNK_BITS];
      const start = getRowStart(index);
      chunk[start + PARENT] = parent;
      chunk[start + DEPTH] =
        parent === -1 ? 1 : chunks[parent >>> CHUNK_BITS][getRowStart(parent) + DEPTH] + 1;
      chunk[start + ACTION] = getActionId(action) | (isViolating ? VIOLATING : 0);
      for (let position = 0; position < state.length; position++) {
        chunk[start + HEADER_LENGTH + position] = table.getCell(state[position]);
      }
      if (!isFingerprintStored) return;
      for (let position = 0; position < fingerprintState.length; position++) {
        chunk[start + layout.fingerprintStart + position] = table.getCell(
          fingerprintState[position],
        );
      }
    },
    getParent: (index: number) => chunks[index >>> CHUNK_BITS][getRowStart(index) + PARENT],
    getDepth: (index: number) => chunks[index >>> CHUNK_BITS][getRowStart(index) + DEPTH],
    getAction: (index: number) =>
      actionNames[chunks[index >>> CHUNK_BITS][getRowStart(index) + ACTION] & ~VIOLATING],
    isViolating: (index: number) =>
      (chunks[index >>> CHUNK_BITS][getRowStart(index) + ACTION] & VIOLATING) !== 0,
    getState: (index: number) =>
      readCells(index, HEADER_LENGTH, layout.variableCount, layout.template.slice()),
    getFingerprintCells: (): StoredCells => ({
      count: layout.count,
      cellBound: table.getCellBound(),
      getCells: (index) => {
        const start = getRowStart(index);
        return chunks[index >>> CHUNK_BITS].subarray(
          start + layout.fingerprintStart,
          start + layout.rowLength,
        );
      },
      getValue: table.getValue,
    }),
    isSameFingerprint: (index: number, state: Value[]) => {
      const chunk = chunks[index >>> CHUNK_BITS];
      const cellStart = getRowStart(index) + layout.fingerprintStart;
      for (let position = 0; position < state.length; position++) {
        if (!isSameValue(table.getValue(chunk[cellStart + position]), state[position]))
          return false;
      }
      return true;
    },
    isStoredIdentically,
  };
};
