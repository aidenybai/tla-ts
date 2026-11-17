import ts from "@typescript/typescript6";
import type { Effects } from "./context";
import { getLowerBound, getPosition, type ProgramNodes } from "./program-nodes";

// What each function that the model's code runs changes, with what the functions that it runs
// change, where no parameter holds a function, found once for the program. The functions that run
// one another, a strongly connected component of the call graph, change the same things, so they
// share a summary, which Tarjan's algorithm makes once the components that they run have theirs.
// A summary is a row of bits over the symbols that any of the functions changes, and one over the
// parameters that any calls or passes, each field a column of rows, one per component.
export interface ChangeTable {
  // The index of each function plus one, by its node's position, or 0.
  functions: Int32Array;
  // The component of each function.
  components: Int32Array;
  changed: Bits;
  parameters: Bits;
  // A bit per component: whether it makes an error, and whether it runs a function that no file
  // walks to, which only a walk of its own summarizes.
  errors: Uint32Array;
  incomplete: Uint32Array;
}

// Rows of bits over symbols: the ids of the symbols that the bits stand for, in order, the symbols,
// and the words of each row.
export interface Bits {
  ids: Int32Array;
  symbols: ts.Symbol[];
  words: number;
  rows: Uint32Array;
}

const hasBit = (bits: Uint32Array, index: number) =>
  (bits[index >>> 5] & (1 << (index & 31))) !== 0;

// The bit of a symbol, or -1 where no row has one for it.
export const getSymbolBit = (bits: Bits, symbol: ts.Symbol) => {
  const id = ts.getSymbolId(symbol);
  const index = getLowerBound(bits.ids, 0, bits.ids.length, id);
  return bits.ids[index] === id ? index : -1;
};

const createBits = (symbols: readonly ts.Symbol[], count: number): Bits => {
  const ids = Int32Array.from(new Set(symbols.map((symbol) => ts.getSymbolId(symbol)))).sort();
  const ordered = new Array<ts.Symbol>(ids.length);
  symbols.forEach((symbol) => {
    ordered[getLowerBound(ids, 0, ids.length, ts.getSymbolId(symbol))] = symbol;
  });
  const words = (ids.length + 31) >>> 5;
  return { ids, symbols: ordered, words, rows: new Uint32Array(count * words) };
};

// The component of a function whose summary the table has, or -1.
export const getComponent = (table: ChangeTable, nodes: ProgramNodes, node: ts.Node) => {
  const position = getPosition(nodes, node);
  const index = position < 0 ? -1 : table.functions[position] - 1;
  const component = index < 0 ? -1 : table.components[index];
  return component < 0 || hasBit(table.incomplete, component) ? -1 : component;
};

export const isComponentErrorMade = (table: ChangeTable, component: number) =>
  hasBit(table.errors, component);

// Adds a component's changed symbols to a row.
export const addChanged = (table: ChangeTable, component: number, row: Uint32Array) => {
  const start = component * table.changed.words;
  row.forEach((word, index) => {
    row[index] = word | table.changed.rows[start + index];
  });
};

// Whether a row has a symbol's bit.
export const hasChanged = (table: ChangeTable, row: Uint32Array, symbol: ts.Symbol) => {
  const bit = getSymbolBit(table.changed, symbol);
  return bit >= 0 && hasBit(row, bit);
};

// The parameters that a component calls or passes.
export const getComponentParameters = (table: ChangeTable, component: number) => {
  const words = table.parameters.words;
  const row = table.parameters.rows.subarray(component * words, (component + 1) * words);
  return table.parameters.symbols.filter((_, bit) => hasBit(row, bit));
};

// Summarizes the functions that the roots run, and those that they run in turn. Each function's
// own effects are those of the nodes of its subtree, which getEffects gives.
export const summarizeFunctions = (
  roots: readonly ts.Node[],
  nodes: ProgramNodes,
  getEffects: (node: ts.Node) => Effects,
): ChangeTable => {
  const functions = new Int32Array(nodes.nodes.length);
  const order: number[] = [];
  const getIndex = (node: ts.Node) => {
    const position = getPosition(nodes, node);
    if (position < 0) return -1;
    if (functions[position] === 0) {
      order.push(position);
      functions[position] = order.length;
    }
    return functions[position] - 1;
  };
  roots.forEach(getIndex);
  // Each function's own effects, in columns that run from each function's start.
  const changedStarts: number[] = [];
  const ownChanged: ts.Symbol[] = [];
  const parameterStarts: number[] = [];
  const ownParameters: ts.Symbol[] = [];
  const edgeStarts: number[] = [];
  const edges: number[] = [];
  const ownErrors: boolean[] = [];
  const ownIncomplete: boolean[] = [];
  for (let index = 0; index < order.length; index += 1) {
    changedStarts.push(ownChanged.length);
    parameterStarts.push(ownParameters.length);
    edgeStarts.push(edges.length);
    const start = order[index];
    const isErrorMade = { value: false };
    const isIncomplete = { value: false };
    for (let position = start; position < nodes.ends[start]; position += 1) {
      const effects = getEffects(nodes.nodes[position]);
      ownChanged.push(...effects.changed);
      ownParameters.push(...effects.parameters);
      if (effects.isErrorMade) isErrorMade.value = true;
      effects.called.forEach((called) => {
        const target = getIndex(called);
        if (target < 0) isIncomplete.value = true;
        else edges.push(target);
      });
    }
    ownErrors.push(isErrorMade.value);
    ownIncomplete.push(isIncomplete.value);
  }
  changedStarts.push(ownChanged.length);
  parameterStarts.push(ownParameters.length);
  edgeStarts.push(edges.length);
  const count = order.length;
  const changed = createBits(ownChanged, count);
  const parameters = createBits(ownParameters, count);
  const changedBits = Int32Array.from(ownChanged, (symbol) => getSymbolBit(changed, symbol));
  const parameterBits = Int32Array.from(ownParameters, (symbol) =>
    getSymbolBit(parameters, symbol),
  );
  // Tarjan's algorithm, with its own stack of the functions whose edges it follows.
  const indexes = new Int32Array(count).fill(-1);
  const lowLinks = new Int32Array(count);
  const components = new Int32Array(count).fill(-1);
  const isOnStack = new Uint32Array((count + 31) >>> 5);
  const errors = new Uint32Array((count + 31) >>> 5);
  const incomplete = new Uint32Array((count + 31) >>> 5);
  // The component that last added each component's rows to its own.
  const lastAdder = new Int32Array(count).fill(-1);
  const stack: number[] = [];
  const calls: number[] = [];
  const nextEdges: number[] = [];
  const visited = { count: 0, components: 0 };
  const addRow = (bits: Bits, from: number, to: number) => {
    for (let word = 0; word < bits.words; word += 1) {
      bits.rows[to * bits.words + word] |= bits.rows[from * bits.words + word];
    }
  };
  const setBit = (bits: Uint32Array, index: number) => {
    bits[index >>> 5] |= 1 << (index & 31);
  };
  const setRowBit = (bits: Bits, row: number, bit: number) => {
    bits.rows[row * bits.words + (bit >>> 5)] |= 1 << (bit & 31);
  };
  const finish = (head: number) => {
    const component = visited.components;
    visited.components += 1;
    const members: number[] = [];
    for (let member = stack.pop() ?? head; ; member = stack.pop() ?? head) {
      isOnStack[member >>> 5] &= ~(1 << (member & 31));
      components[member] = component;
      members.push(member);
      if (member === head) break;
    }
    members.forEach((member) => {
      for (let own = changedStarts[member]; own < changedStarts[member + 1]; own += 1) {
        setRowBit(changed, component, changedBits[own]);
      }
      for (let own = parameterStarts[member]; own < parameterStarts[member + 1]; own += 1) {
        setRowBit(parameters, component, parameterBits[own]);
      }
      if (ownErrors[member]) setBit(errors, component);
      if (ownIncomplete[member]) setBit(incomplete, component);
      for (let edge = edgeStarts[member]; edge < edgeStarts[member + 1]; edge += 1) {
        const callee = components[edges[edge]];
        if (callee === component || lastAdder[callee] === component) continue;
        lastAdder[callee] = component;
        addRow(changed, callee, component);
        addRow(parameters, callee, component);
        if (hasBit(errors, callee)) setBit(errors, component);
        if (hasBit(incomplete, callee)) setBit(incomplete, component);
      }
    });
  };
  const open = (node: number) => {
    indexes[node] = visited.count;
    lowLinks[node] = visited.count;
    visited.count += 1;
    stack.push(node);
    setBit(isOnStack, node);
    calls.push(node);
    nextEdges.push(edgeStarts[node]);
  };
  for (let root = 0; root < count; root += 1) {
    if (indexes[root] >= 0) continue;
    open(root);
    while (calls.length > 0) {
      const node = calls[calls.length - 1];
      const edge = nextEdges[nextEdges.length - 1];
      if (edge < edgeStarts[node + 1]) {
        nextEdges[nextEdges.length - 1] = edge + 1;
        const callee = edges[edge];
        if (indexes[callee] < 0) open(callee);
        else if (hasBit(isOnStack, callee)) {
          lowLinks[node] = Math.min(lowLinks[node], indexes[callee]);
        }
        continue;
      }
      calls.pop();
      nextEdges.pop();
      if (lowLinks[node] === indexes[node]) finish(node);
      const caller = calls.at(-1);
      if (caller !== undefined) lowLinks[caller] = Math.min(lowLinks[caller], lowLinks[node]);
    }
  }
  return { functions, components, changed, parameters, errors, incomplete };
};
