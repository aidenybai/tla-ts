// Decides satisfiability of propositional linear temporal logic over infinite traces, the logic LS4
// decides. A tableau node is the set of formulas that must hold now. A SAT call per step picks the
// atoms and the formulas the next node must hold, and the formula is satisfiable when a reachable
// strongly connected component can fulfill every eventuality it postpones.

import type { Verdict } from "../verdict";
import { createSolver } from "./sat";

export type PtlFormula =
  | { kind: "Atom"; name: string }
  | { kind: "Not" | "Next" | "Always" | "Eventually"; body: PtlFormula }
  | { kind: "And" | "Or" | "Implies" | "Equiv"; left: PtlFormula; right: PtlFormula };

// Formulas in negation normal form, numbered so that equal formulas share a number.
type Normal =
  | { kind: "Constant"; value: boolean }
  | { kind: "Literal"; atom: string; isPositive: boolean }
  | { kind: "And" | "Or"; children: number[] }
  | { kind: "Next" | "Always" | "Eventually"; body: number };

interface Step {
  next: number[];
  pending: number[];
}

interface Edge {
  target: number;
  pending: number[];
}

const createTable = () => {
  const normals: Normal[] = [];
  const numbers = new Map<string, number>();
  const intern = (key: string, normal: Normal) => {
    const existing = numbers.get(key);
    if (existing !== undefined) return existing;
    numbers.set(key, normals.length);
    normals.push(normal);
    return normals.length - 1;
  };
  const getConstant = (value: boolean) => intern(String(value), { kind: "Constant", value });
  const getJunction = (kind: "And" | "Or", operands: number[]): number => {
    const absorbing = kind === "Or";
    const children = new Set<number>();
    for (const operand of operands) {
      const normal = normals[operand];
      if (normal.kind === "Constant") {
        if (normal.value === absorbing) return operand;
        continue;
      }
      if (normal.kind === kind) normal.children.forEach((child) => children.add(child));
      else children.add(operand);
    }
    const sorted = [...children].sort((left, right) => left - right);
    if (sorted.length === 0) return getConstant(!absorbing);
    if (sorted.length === 1) return sorted[0];
    return intern(`${kind}(${sorted.join(",")})`, { kind, children: sorted });
  };
  const getModal = (kind: "Next" | "Always" | "Eventually", body: number) => {
    const normal = normals[body];
    if (normal.kind === "Constant" || (kind !== "Next" && normal.kind === kind)) return body;
    return intern(`${kind}(${body})`, { kind, body });
  };
  const memo = [new WeakMap<PtlFormula, number>(), new WeakMap<PtlFormula, number>()];
  const normalize = (formula: PtlFormula, isNegated: boolean): number => {
    const cache = memo[isNegated ? 1 : 0];
    const cached = cache.get(formula);
    if (cached !== undefined) return cached;
    const result = ((): number => {
      switch (formula.kind) {
        case "Atom":
          return intern(`${isNegated ? "-" : "+"}${formula.name}`, {
            kind: "Literal",
            atom: formula.name,
            isPositive: !isNegated,
          });
        case "Not":
          return normalize(formula.body, !isNegated);
        case "Next":
          return getModal("Next", normalize(formula.body, isNegated));
        case "Always":
        case "Eventually":
          return getModal(
            (formula.kind === "Always") === isNegated ? "Eventually" : "Always",
            normalize(formula.body, isNegated),
          );
        case "And":
        case "Or":
          return getJunction((formula.kind === "And") === isNegated ? "Or" : "And", [
            normalize(formula.left, isNegated),
            normalize(formula.right, isNegated),
          ]);
        case "Implies":
          return getJunction(isNegated ? "And" : "Or", [
            normalize(formula.left, !isNegated),
            normalize(formula.right, isNegated),
          ]);
        case "Equiv":
          return getJunction(isNegated ? "Or" : "And", [
            getJunction(isNegated ? "And" : "Or", [
              normalize(formula.left, !isNegated),
              normalize(formula.right, isNegated),
            ]),
            getJunction(isNegated ? "And" : "Or", [
              normalize(formula.left, isNegated),
              normalize(formula.right, !isNegated),
            ]),
          ]);
      }
    })();
    cache.set(formula, result);
    return result;
  };
  return { normals, normalize };
};

// Every way to satisfy the formulas now, keeping only the steps that require the fewest next
// formulas and leave the fewest eventualities pending. A step that requires more of both can only
// do what a smaller one can, so dropping it keeps the decision complete. Undefined once isExpired
// turns true.
const getSteps = (
  normals: Normal[],
  formulas: number[],
  isExpired: () => boolean,
): Step[] | undefined => {
  const clauses: number[][] = [];
  const atoms = new Map<string, number>();
  const nexts = new Map<number, number>();
  const pendings = new Map<number, number>();
  const literals = new Map<number, number>();
  const counter = { value: 0 };
  const createVariable = () => ++counter.value;
  const getVariable = <Key>(variables: Map<Key, number>, key: Key) => {
    const existing = variables.get(key);
    if (existing !== undefined) return existing;
    const variable = createVariable();
    variables.set(key, variable);
    return variable;
  };
  // Plaisted-Greenbaum: a formula's literal implies the formula, which suffices in normal form.
  const encode = (formula: number): number => {
    const cached = literals.get(formula);
    if (cached !== undefined) return cached;
    const normal = normals[formula];
    const literal = ((): number => {
      switch (normal.kind) {
        case "Constant": {
          const variable = createVariable();
          clauses.push([normal.value ? variable : -variable]);
          return variable;
        }
        case "Literal": {
          const variable = getVariable(atoms, normal.atom);
          return normal.isPositive ? variable : -variable;
        }
        case "Next":
          return getVariable(nexts, normal.body);
        case "And": {
          const variable = createVariable();
          normal.children.forEach((child) => clauses.push([-variable, encode(child)]));
          return variable;
        }
        case "Or": {
          const variable = createVariable();
          clauses.push([-variable, ...normal.children.map(encode)]);
          return variable;
        }
        case "Always": {
          const variable = createVariable();
          clauses.push([-variable, encode(normal.body)], [-variable, getVariable(nexts, formula)]);
          return variable;
        }
        case "Eventually": {
          const variable = createVariable();
          const body = encode(normal.body);
          const next = getVariable(nexts, formula);
          clauses.push([-variable, body, next], [-next, body, getVariable(pendings, formula)]);
          return variable;
        }
      }
    })();
    literals.set(formula, literal);
    return literal;
  };
  formulas.forEach((formula) => clauses.push([encode(formula)]));
  const choices = [...nexts.values(), ...pendings.values()];
  const solver = createSolver(counter.value, isExpired);
  clauses.forEach(solver.addClause);
  const steps: Step[] = [];
  for (;;) {
    const model = solver.solve([]);
    if (typeof model === "string") return model === "unsat" ? steps : undefined;
    // Drops each chosen variable that a model with no other choice can do without. A variable one
    // pass keeps stays needed as the set shrinks, so the set that remains is minimal.
    const minimal = choices.reduce<Int8Array | undefined>((current, choice) => {
      if (current?.[choice] !== 1) return current;
      const unchosen = choices.filter((other) => current[other] !== 1);
      const smaller = solver.solve([-choice, ...unchosen.map((other) => -other)]);
      if (smaller === "unknown") return undefined;
      return smaller === "unsat" ? current : smaller;
    }, model);
    if (!minimal) return undefined;
    const isChosen = (variable: number) => minimal[variable] === 1;
    steps.push({
      next: [...nexts].flatMap((entry) => (isChosen(entry[1]) ? [entry[0]] : [])),
      pending: [...pendings].flatMap((entry) => (isChosen(entry[1]) ? [entry[0]] : [])),
    });
    solver.addClause(choices.filter(isChosen).map((choice) => -choice));
  }
};

// Whether the formula is satisfiable, or unknown once isExpired turns true.
export const getSatisfiability = (formula: PtlFormula, isExpired: () => boolean): Verdict => {
  const table = createTable();
  const nodes: number[][] = [];
  const numbers = new Map<string, number>();
  const getNode = (formulas: number[]) => {
    const sorted = [...new Set(formulas)].sort((left, right) => left - right);
    const key = sorted.join(",");
    const existing = numbers.get(key);
    if (existing !== undefined) return existing;
    numbers.set(key, nodes.length);
    nodes.push(sorted);
    return nodes.length - 1;
  };
  getNode([table.normalize(formula, false)]);
  const edges: Edge[][] = [];
  for (let node = 0; node < nodes.length; node++) {
    const steps = isExpired() ? undefined : getSteps(table.normals, nodes[node], isExpired);
    if (!steps) return "unknown";
    edges.push(steps.map((step) => ({ target: getNode(step.next), pending: step.pending })));
  }
  // Tarjan's algorithm, checking each component as it closes.
  const indices = new Int32Array(nodes.length).fill(-1);
  const lowlinks = new Int32Array(nodes.length);
  const components = new Int32Array(nodes.length).fill(-1);
  const stack: number[] = [];
  const counter = { index: 0, component: 0 };
  const isFair = (component: number) => {
    const inner = edges.flatMap((outgoing, source) =>
      components[source] === component
        ? outgoing.filter((edge) => components[edge.target] === component)
        : [],
    );
    if (inner.length === 0) return false;
    const unfulfilled = inner
      .slice(1)
      .reduce(
        (always, edge) => always.filter((eventuality) => edge.pending.includes(eventuality)),
        inner[0].pending,
      );
    return unfulfilled.length === 0;
  };
  const visit = (node: number): boolean => {
    indices[node] = counter.index;
    lowlinks[node] = counter.index;
    counter.index++;
    stack.push(node);
    for (const edge of edges[node]) {
      if (indices[edge.target] === -1) {
        if (visit(edge.target)) return true;
        lowlinks[node] = Math.min(lowlinks[node], lowlinks[edge.target]);
      } else if (components[edge.target] === -1) {
        lowlinks[node] = Math.min(lowlinks[node], indices[edge.target]);
      }
    }
    if (lowlinks[node] !== indices[node]) return false;
    const component = counter.component++;
    for (let member = stack.pop(); member !== undefined; member = stack.pop()) {
      components[member] = component;
      if (member === node) break;
    }
    return isFair(component);
  };
  return visit(0) ? "sat" : "unsat";
};
