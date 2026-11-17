import ts from "@typescript/typescript6";
import type { Effects } from "./context";
import { getLowerBound, getPosition, hasBit, type ProgramNodes, setBit } from "./program-nodes";

// What each function that the model's code runs changes, with what the functions that it runs
// change, where no parameter holds a function, found once for the program. The functions that run
// one another, a strongly connected component of the call graph, change the same things, so they
// share a summary, which Tarjan's algorithm makes once the components that they run have theirs.
// A summary is a row of bits over the symbols that any of the functions changes, and one over the
// parameters that any calls or passes, each field a column of rows, one per component.
export interface ChangeTable {
  // The index of each function plus one, by its node's position, or 0, and the indexes of the
  // functions that no file walks to, such as a declaration file's, by their node ids in order.
  functions: Int32Array;
  elsewhereIds: Int32Array;
  elsewhereIndexes: Int32Array;
  // The component of each function.
  components: Int32Array;
  changed: Bits;
  parameters: Bits;
  // A bit per component: whether it makes an error.
  errors: Uint32Array;
  // The components that each component runs, from each one's start, and the components that run
  // each one.
  calleeStarts: Int32Array;
  callees: Int32Array;
  callerStarts: Int32Array;
  callers: Int32Array;
  // The ids of the symbols that the calls of each component's own nodes name as their callees and
  // arguments, and that a call whose effects findEffects didn't find names through call or apply,
  // in order, with each one's component, which tell the components whose effects a path's bindings
  // of functions to symbols change.
  calledIds: Int32Array;
  calledComponents: Int32Array;
  // Each function's node, by its index, and its own effects, those of the nodes of its subtree, in
  // columns that run from each function's start: the symbols that they change and the parameters
  // that they call or pass, whether they make an error, the indexes of the functions that they
  // run, and the ids of the symbols that getCalled gives, which tell whether bindings change them.
  functionNodes: ts.Node[];
  changedStarts: Int32Array;
  ownChanged: ts.Symbol[];
  parameterStarts: Int32Array;
  ownParameters: ts.Symbol[];
  ownErrors: Uint32Array;
  edgeStarts: Int32Array;
  edges: Int32Array;
  calledStarts: Int32Array;
  ownCalled: Int32Array;
  // The mark of each component that a walk of the components that bindings change has reached,
  // with the walk's own generation.
  marks: Int32Array;
  generation: number;
}

// Rows of bits over symbols: the ids of the symbols that the bits stand for, in order, the symbols,
// and the words of each row.
export interface Bits {
  ids: Int32Array;
  symbols: ts.Symbol[];
  words: number;
  rows: Uint32Array;
}

// The bit of a symbol, or -1 where no row has one for it.
export const getSymbolBit = (bits: Bits, symbol: ts.Symbol) => {
  const id = ts.getSymbolId(symbol);
  const index = getLowerBound(bits.ids, 0, bits.ids.length, id);
  return bits.ids[index] === id ? index : -1;
};

const createBits = (symbols: readonly ts.Symbol[], count: number): Bits => {
  const ids = Int32Array.from(new Set(symbols.map((symbol) => ts.getSymbolId(symbol)))).sort();
  const ordered: ts.Symbol[] = [];
  symbols.forEach((symbol) => {
    ordered[getLowerBound(ids, 0, ids.length, ts.getSymbolId(symbol))] = symbol;
  });
  const words = (ids.length + 31) >>> 5;
  return { ids, symbols: ordered, words, rows: new Uint32Array(count * words) };
};

// The index of a function that the table has, or -1.
const getFunctionIndex = (table: ChangeTable, nodes: ProgramNodes, node: ts.Node) => {
  const position = getPosition(nodes, node);
  const id = position < 0 ? ts.getNodeId(node) : -1;
  const elsewhere =
    position < 0 ? getLowerBound(table.elsewhereIds, 0, table.elsewhereIds.length, id) : -1;
  return position >= 0
    ? table.functions[position] - 1
    : table.elsewhereIds[elsewhere] === id
      ? table.elsewhereIndexes[elsewhere]
      : -1;
};

// The component of a function whose summary the table has, or -1.
export const getComponent = (table: ChangeTable, nodes: ProgramNodes, node: ts.Node) => {
  const index = getFunctionIndex(table, nodes, node);
  return index < 0 ? -1 : table.components[index];
};

// A function's own effects, as one, where none of its nodes names a symbol of the sorted ids that
// bindings bind, so that they are what the table found, or undefined.
export const getOwnEffects = (
  table: ChangeTable,
  nodes: ProgramNodes,
  node: ts.Node,
  boundIds: Int32Array,
) => {
  const index = getFunctionIndex(table, nodes, node);
  if (index < 0) return undefined;
  for (let own = table.calledStarts[index]; own < table.calledStarts[index + 1]; own += 1) {
    const id = table.ownCalled[own];
    if (boundIds[getLowerBound(boundIds, 0, boundIds.length, id)] === id) return undefined;
  }
  return {
    changed: table.ownChanged.slice(table.changedStarts[index], table.changedStarts[index + 1]),
    isErrorMade: hasBit(table.ownErrors, index),
    called: Array.from(
      table.edges.subarray(table.edgeStarts[index], table.edgeStarts[index + 1]),
      (edge) => table.functionNodes[edge],
    ),
    parameters: table.ownParameters.slice(
      table.parameterStarts[index],
      table.parameterStarts[index + 1],
    ),
  };
};

// Whether a walk of markBound's generation reached a component.
export const isMarked = (table: ChangeTable, component: number, generation: number) =>
  table.marks[component] === generation;

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
  const found: ts.Symbol[] = [];
  for (let word = 0; word < words; word += 1) {
    const bits = table.parameters.rows[component * words + word];
    for (let bit = 0; bits !== 0 && bit < 32; bit += 1) {
      if ((bits & (1 << bit)) !== 0) found.push(table.parameters.symbols[word * 32 + bit]);
    }
  }
  return found;
};

// Summarizes the functions that the roots run, and those that they run in turn. Each function's
// own effects are those of the nodes of its subtree, which getEffects gives.
// Marks the components whose summaries a path's bindings change: those whose own nodes call or pass
// a bound symbol, and those that run them. Gives the walk's generation, which marks them.
export const markBound = (table: ChangeTable, bound: readonly ts.Symbol[]) => {
  table.generation += 1;
  const generation = table.generation;
  const pending: number[] = [];
  const mark = (component: number) => {
    if (table.marks[component] === generation) return;
    table.marks[component] = generation;
    pending.push(component);
  };
  bound.forEach((symbol) => {
    const id = ts.getSymbolId(symbol);
    const last = getLowerBound(table.calledIds, 0, table.calledIds.length, id + 1);
    for (let index = getLowerBound(table.calledIds, 0, last, id); index < last; index += 1) {
      mark(table.calledComponents[index]);
    }
  });
  while (pending.length > 0) {
    const component = pending.pop() ?? 0;
    for (
      let caller = table.callerStarts[component];
      caller < table.callerStarts[component + 1];
      caller += 1
    ) {
      mark(table.callers[caller]);
    }
  }
  return generation;
};

// Summarizes the functions that the roots run, and those that they run in turn. Each function's
// own effects are those of the nodes of its subtree, which getEffects gives, or undefined where
// findEffects found none, and getCalled gives the symbols whose bindings a node's effects read:
// those that its call names as its callee and arguments, and for a call whose effects findEffects
// didn't find, the function that it runs through call or apply.
export const summarizeFunctions = (
  roots: readonly ts.Node[],
  nodes: ProgramNodes,
  getFound: (node: ts.Node) => Effects | undefined,
  getEffects: (node: ts.Node) => Effects,
  getCalled: (node: ts.Node, isFound: boolean) => readonly ts.Symbol[],
): ChangeTable => {
  const functions = new Int32Array(nodes.nodes.length);
  const order: ts.Node[] = [];
  // The functions that no file walks to, which are few, by their nodes while the walk finds them.
  const elsewhere = new Map<ts.Node, number>();
  const getIndex = (node: ts.Node) => {
    const position = getPosition(nodes, node);
    const known = position < 0 ? (elsewhere.get(node) ?? -1) : functions[position] - 1;
    if (known >= 0) return known;
    order.push(node);
    if (position < 0) elsewhere.set(node, order.length - 1);
    else functions[position] = order.length;
    return order.length - 1;
  };
  roots.forEach(getIndex);
  // Visits the nodes of a function's subtree, in its table or, for one that no file walks to, by a
  // walk.
  const forEachInSubtree = (node: ts.Node, visit: (inner: ts.Node) => void) => {
    const start = getPosition(nodes, node);
    if (start < 0) {
      const walk = (inner: ts.Node): undefined => {
        visit(inner);
        return ts.forEachChild(inner, walk);
      };
      walk(node);
      return;
    }
    for (let position = start; position < nodes.ends[start]; position += 1) {
      visit(nodes.nodes[position]);
    }
  };
  // Each function's own effects, in columns that run from each function's start.
  const changedStarts: number[] = [];
  const ownChanged: ts.Symbol[] = [];
  const parameterStarts: number[] = [];
  const ownParameters: ts.Symbol[] = [];
  const edgeStarts: number[] = [];
  const edges: number[] = [];
  const ownErrors: boolean[] = [];
  const calledStarts: number[] = [];
  const ownCalled: number[] = [];
  for (let index = 0; index < order.length; index += 1) {
    calledStarts.push(ownCalled.length);
    changedStarts.push(ownChanged.length);
    parameterStarts.push(ownParameters.length);
    edgeStarts.push(edges.length);
    const isErrorMade = { value: false };
    forEachInSubtree(order[index], (node) => {
      const found = getFound(node);
      const effects = found ?? getEffects(node);
      getCalled(node, found !== undefined).forEach((symbol) =>
        ownCalled.push(ts.getSymbolId(symbol)),
      );
      ownChanged.push(...effects.changed);
      ownParameters.push(...effects.parameters);
      if (effects.isErrorMade) isErrorMade.value = true;
      effects.called.forEach((called) => edges.push(getIndex(called)));
    });
    ownErrors.push(isErrorMade.value);
  }
  changedStarts.push(ownChanged.length);
  parameterStarts.push(ownParameters.length);
  edgeStarts.push(edges.length);
  calledStarts.push(ownCalled.length);
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
      for (let edge = edgeStarts[member]; edge < edgeStarts[member + 1]; edge += 1) {
        const callee = components[edges[edge]];
        if (callee === component || lastAdder[callee] === component) continue;
        lastAdder[callee] = component;
        addRow(changed, callee, component);
        addRow(parameters, callee, component);
        if (hasBit(errors, callee)) setBit(errors, component);
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
  // The components' edges, each once, and the calls' symbols by id, in flat columns.
  const componentCount = visited.components;
  const callees: number[] = [];
  const calleeStarts = new Int32Array(componentCount + 1);
  const membersStarts = new Int32Array(componentCount + 1);
  components.forEach((component) => {
    membersStarts[component + 1] += 1;
  });
  membersStarts.forEach((size, component) => {
    if (component > 0) membersStarts[component] = membersStarts[component - 1] + size;
  });
  const memberEnds = membersStarts.slice(0, -1);
  const members = new Int32Array(count);
  components.forEach((component, member) => {
    members[memberEnds[component]] = member;
    memberEnds[component] += 1;
  });
  lastAdder.fill(-1);
  const namedCalls: { id: number; component: number }[] = [];
  for (let component = 0; component < componentCount; component += 1) {
    calleeStarts[component] = callees.length;
    for (let index = membersStarts[component]; index < membersStarts[component + 1]; index += 1) {
      const member = members[index];
      for (let edge = edgeStarts[member]; edge < edgeStarts[member + 1]; edge += 1) {
        const callee = components[edges[edge]];
        if (callee === component || lastAdder[callee] === component) continue;
        lastAdder[callee] = component;
        callees.push(callee);
      }
      for (let own = calledStarts[member]; own < calledStarts[member + 1]; own += 1) {
        namedCalls.push({ id: ownCalled[own], component });
      }
    }
  }
  calleeStarts[componentCount] = callees.length;
  const callerStarts = new Int32Array(componentCount + 1);
  callees.forEach((callee) => {
    callerStarts[callee + 1] += 1;
  });
  callerStarts.forEach((size, component) => {
    if (component > 0) callerStarts[component] = callerStarts[component - 1] + size;
  });
  const callerEnds = callerStarts.slice(0, -1);
  const callers = new Int32Array(callees.length);
  for (let component = 0; component < componentCount; component += 1) {
    for (let edge = calleeStarts[component]; edge < calleeStarts[component + 1]; edge += 1) {
      callers[callerEnds[callees[edge]]] = component;
      callerEnds[callees[edge]] += 1;
    }
  }
  namedCalls.sort((left, right) => left.id - right.id || left.component - right.component);
  const elsewhereEntries = [...elsewhere].toSorted(
    (left, right) => ts.getNodeId(left[0]) - ts.getNodeId(right[0]),
  );
  return {
    functions,
    elsewhereIds: Int32Array.from(elsewhereEntries, (entry) => ts.getNodeId(entry[0])),
    elsewhereIndexes: Int32Array.from(elsewhereEntries, (entry) => entry[1]),
    components,
    changed,
    parameters,
    errors,
    calleeStarts,
    callees: Int32Array.from(callees),
    callerStarts,
    callers,
    calledIds: Int32Array.from(namedCalls, (call) => call.id),
    calledComponents: Int32Array.from(namedCalls, (call) => call.component),
    functionNodes: order,
    changedStarts: Int32Array.from(changedStarts),
    ownChanged,
    parameterStarts: Int32Array.from(parameterStarts),
    ownParameters,
    ownErrors: ownErrors.reduce(
      (bits, isErrorMade, index) => {
        if (isErrorMade) setBit(bits, index);
        return bits;
      },
      new Uint32Array((count + 31) >>> 5),
    ),
    edgeStarts: Int32Array.from(edgeStarts),
    edges: Int32Array.from(edges),
    calledStarts: Int32Array.from(calledStarts),
    ownCalled: Int32Array.from(ownCalled),
    marks: new Int32Array(componentCount),
    generation: 0,
  };
};
