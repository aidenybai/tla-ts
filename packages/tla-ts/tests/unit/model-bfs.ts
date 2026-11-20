import ts from "@typescript/typescript6";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import type { Expression } from "../../src/ast";
import { parseConfig } from "../../src/config";
import { createProgram } from "../../src/typescript/program";
import { frameModel } from "../../src/typescript/spec/frame";

// What a breadth-first search of a model finds as Node runs its module: the verdict on its
// invariants and deadlocks, the states it generates and the distinct ones, and its depth.
export interface Explored {
  status: string;
  generatedStates: number;
  distinctStates: number;
  depth: number;
}

// A step that the search takes: an exported function, with the guarded sets of its parameters,
// and the values of each parameter.
interface Step {
  name: string;
  domains: (unknown[] | { guard: string })[];
  isTerminating: boolean;
}

const MUTATORS = new Map<string, Set<string>>([
  ["Map", new Set(["set", "delete", "clear", "getOrInsert", "getOrInsertComputed"])],
  ["Set", new Set(["add", "delete", "clear"])],
  [
    "Array",
    new Set(["push", "pop", "shift", "unshift", "splice", "sort", "reverse", "fill", "copyWithin"]),
  ],
]);

const ITERATING = new Set(["values", "keys", "entries", "forEach", Symbol.iterator]);

const isObject = (value: unknown): value is object => typeof value === "object" && value !== null;

const isIterator = (value: unknown): value is Iterator<unknown> =>
  isObject(value) && "next" in value && typeof value.next === "function";

const getKind = (value: object) =>
  value instanceof Map
    ? "Map"
    : value instanceof Set
      ? "Set"
      : Array.isArray(value)
        ? "Array"
        : "Object";

// Every value of a domain that the model's frame gives, in JavaScript, as the model's converters
// make them.
const getValues = (domain: Expression): unknown[] => {
  switch (domain.kind) {
    case "Identifier":
      if (domain.name === "BOOLEAN") return [false, true];
      return [getScalar(domain)];
    case "SetEnumeration":
      return domain.elements.map(getScalar);
    case "Product": {
      const factors = domain.factors.map(getValues);
      return factors.reduce<unknown[][]>(
        (tuples, factor) => tuples.flatMap((tuple) => factor.map((value) => [...tuple, value])),
        [[]],
      );
    }
    case "RecordSet": {
      const fields = domain.fields.map((field) => ({
        name: field.name,
        values: getValues(field.value),
      }));
      return fields.reduce<Record<string, unknown>[]>(
        (records, field) =>
          records.flatMap((record) =>
            field.values.map((value) => ({ ...record, [field.name]: value })),
          ),
        [{}],
      );
    }
    case "SetMap":
      if (domain.expression.kind === "Tuple" && domain.expression.elements.length === 1) {
        return getValues(domain.bounds[0].set).map((value) => [value]);
      }
      break;
    case "FunctionSet": {
      const keys = getValues(domain.domain);
      const range = getValues(domain.range);
      return keys.reduce<Record<string, unknown>[]>(
        (records, key) =>
          records.flatMap((record) => range.map((value) => ({ ...record, [String(key)]: value }))),
        [{}],
      );
    }
    case "Apply": {
      const args = domain.args;
      if (domain.operator === "..") {
        const low = Number(getScalar(args[0]));
        const high = Number(getScalar(args[1]));
        return Array.from({ length: high - low + 1 }, (_, offset) => low + offset);
      }
      if (domain.operator === "\\cup") return args.flatMap(getValues);
      if (domain.operator === "SUBSET") {
        return getValues(args[0])
          .reduce<unknown[][]>(
            (subsets, value) => [...subsets, ...subsets.map((subset) => [...subset, value])],
            [[]],
          )
          .map((subset) => new Set(subset));
      }
      if (domain.operator === "UNION" && args[0].kind === "SetMap") {
        const set = args[0].expression;
        const bound = args[0].bounds[0].set;
        if (set.kind !== "FunctionSet") break;
        const range = getValues(set.range);
        const getFunctions = (keys: unknown[]) =>
          keys.reduce<[unknown, unknown][][]>(
            (functions, key) =>
              functions.flatMap((entries) =>
                range.map((value): [unknown, unknown][] => [...entries, [key, value]]),
              ),
            [[]],
          );
        if (set.domain.kind === "Apply" && set.domain.operator === "..") {
          return getValues(bound).flatMap((length) =>
            getFunctions(Array.from({ length: Number(length) }, (_, index) => index)).map(
              (entries) => entries.map((entry) => entry[1]),
            ),
          );
        }
        if (bound.kind === "Apply" && bound.operator === "SUBSET") {
          return getValues(bound).flatMap((keys) =>
            keys instanceof Set ? getFunctions([...keys]).map((entries) => new Map(entries)) : [],
          );
        }
      }
      break;
    }
    default:
      break;
  }
  throw new Error(`The search can't list the values of a ${domain.kind}`);
};

const getScalar = (expression: Expression): unknown => {
  if (expression.kind === "Number" || expression.kind === "String") return expression.value;
  if (expression.kind === "Tuple") return expression.elements.map(getScalar);
  if (expression.kind === "Apply" && expression.operator === "-.") {
    return -Number(getScalar(expression.args[0]));
  }
  if (expression.kind === "Identifier") {
    const scalars = new Map<string, unknown>([
      ["TRUE", true],
      ["FALSE", false],
      ["Null", null],
      ["Undefined", undefined],
    ]);
    if (scalars.has(expression.name)) return scalars.get(expression.name);
  }
  throw new Error(`The search can't read a ${expression.kind} as a value`);
};

// The steps of Next, each of the exported function it calls with the domains of its parameters.
const getSteps = (next: Expression, guards: Map<string, string>): Step[] => {
  const visit = (expression: Expression, bounds: Map<string, Expression>): Step[] => {
    if (expression.kind === "Or")
      return expression.operands.flatMap((inner) => visit(inner, bounds));
    if (expression.kind === "Exists") {
      const inner = new Map(bounds);
      expression.bounds.forEach((bound) => {
        if (bound.pattern.kind === "Name") inner.set(bound.pattern.name, bound.set);
      });
      return visit(expression.body, inner);
    }
    if (expression.kind === "And" && expression.operands[0].kind === "Identifier") {
      return [{ name: expression.operands[0].name, domains: [], isTerminating: true }];
    }
    if (expression.kind === "Identifier")
      return [{ name: expression.name, domains: [], isTerminating: false }];
    if (expression.kind === "Apply") {
      return [
        {
          name: expression.operator,
          domains: expression.args.map((arg, index) => {
            const set = arg.kind === "Identifier" ? bounds.get(arg.name) : undefined;
            if (set === undefined)
              throw new Error(`The search can't bind ${expression.operator}'s argument`);
            const guard = guards.get(`${expression.operator} ${index}`);
            return set.kind === "Identifier" && set.name === "GuardedSet" && guard !== undefined
              ? { guard }
              : getValues(set);
          }),
          isTerminating: false,
        },
      ];
    }
    throw new Error(`The search can't read a step of kind ${expression.kind}`);
  };
  return next.kind === "Identifier" && next.name === "FALSE" ? [] : visit(next, new Map());
};

// A copy of a state's values, read through the proxies that watch them, with each object once,
// so that two names of one object stay one object.
const copy = (
  value: unknown,
  targets: WeakMap<object, object>,
  copies = new Map<object, unknown>(),
): unknown => {
  if (!isObject(value)) return value;
  const target = targets.get(value) ?? value;
  if (copies.has(target)) return copies.get(target);
  const kind = getKind(target);
  if (kind === "Map") {
    const made = new Map();
    copies.set(target, made);
    (target as Map<unknown, unknown>).forEach((inner, key) =>
      made.set(copy(key, targets, copies), copy(inner, targets, copies)),
    );
    return made;
  }
  if (kind === "Set") {
    const made = new Set();
    copies.set(target, made);
    (target as Set<unknown>).forEach((inner) => made.add(copy(inner, targets, copies)));
    return made;
  }
  if (
    typeof target === "function" ||
    (kind === "Object" &&
      Object.getPrototypeOf(target) !== Object.prototype &&
      Object.getPrototypeOf(target) !== null)
  ) {
    throw new Error("The search can't copy a function or an instance of a class");
  }
  const made: Record<string, unknown> | unknown[] =
    kind === "Array" ? new Array((target as unknown[]).length) : {};
  copies.set(target, made);
  Object.keys(target).forEach((key) => {
    (made as Record<string, unknown>)[key] = copy(
      (target as Record<string, unknown>)[key],
      targets,
      copies,
    );
  });
  return made;
};

// The encoding of a state that tells states apart as the model's canonical state does: each
// collection in its order, and each object by the first place it's reached.
const encode = (value: unknown, seen = new Map<object, number>()): string => {
  if (!isObject(value)) {
    return value === undefined
      ? "u"
      : Object.is(value, -0)
        ? "-0"
        : `${typeof value}:${JSON.stringify(value)}`;
  }
  const known = seen.get(value);
  if (known !== undefined) return `#${known}`;
  seen.set(value, seen.size);
  const kind = getKind(value);
  if (kind === "Map") {
    return `M(${[...(value as Map<unknown, unknown>)].map((entry) => `${encode(entry[0], seen)}=${encode(entry[1], seen)}`).join(",")})`;
  }
  if (kind === "Set")
    return `S(${[...(value as Set<unknown>)].map((inner) => encode(inner, seen)).join(",")})`;
  const keys = Object.keys(value);
  return `${kind === "Array" ? `A${(value as unknown[]).length}` : "O"}(${keys.map((key) => `${key}:${encode((value as Record<string, unknown>)[key], seen)}`).join(",")})`;
};

// Searches the model of a module breadth first, as TLC searches the model's spec, running the
// module itself in Node. The frame gives the state variables, the steps and their parameters'
// values. A call is a step where it writes what existed before it, as the model's step is: its
// module's text marks each write to a state variable, and a Proxy each write to an object or a
// collection that the state holds, though the write stores the value that was there.
export const exploreModel = async (source: string, fileName: string): Promise<Explored> => {
  const frame = frameModel(source, fileName);
  const config = parseConfig(frame.config);
  if (config.actionConstraints.length > 0 || config.view !== undefined) {
    throw new Error("The search can't follow an action constraint or a view");
  }
  const definitions = new Map(
    frame.source.definitions.map((definition) => [definition.name, definition]),
  );
  const names = frame.variables.map((variable) => variable.name);
  const program = createProgram(source, fileName);
  const file = program.sourceFile;
  const checker = program.checker;
  const declarations = new Map<string, ts.VariableDeclaration>();
  file.statements.forEach((statement) => {
    if (!ts.isVariableStatement(statement)) return;
    statement.declarationList.declarations.forEach((declaration) => {
      if (ts.isIdentifier(declaration.name) && names.includes(declaration.name.text)) {
        declarations.set(declaration.name.text, declaration);
      }
    });
  });
  const symbols = new Set(
    [...declarations.values()].map((declaration) => checker.getSymbolAtLocation(declaration.name)),
  );
  const isStateName = (node: ts.Node) =>
    ts.isIdentifier(node) && symbols.has(checker.getSymbolAtLocation(node));
  const getRoots = (target: ts.Expression): ts.Expression[] =>
    ts.isArrayLiteralExpression(target)
      ? target.elements.flatMap(getRoots)
      : ts.isObjectLiteralExpression(target)
        ? target.properties.flatMap((property) =>
            ts.isPropertyAssignment(property)
              ? getRoots(property.initializer)
              : ts.isShorthandPropertyAssignment(property)
                ? [property.name]
                : [],
          )
        : ts.isParenthesizedExpression(target) || ts.isNonNullExpression(target)
          ? getRoots(target.expression)
          : [target];
  const edits: { start: number; end: number; text: string }[] = [];
  // Each write to a state variable's binding marks a write.
  const visit = (node: ts.Node): void => {
    const written =
      ts.isBinaryExpression(node) &&
      node.operatorToken.kind >= ts.SyntaxKind.FirstAssignment &&
      node.operatorToken.kind <= ts.SyntaxKind.LastAssignment
        ? node.left
        : (ts.isPrefixUnaryExpression(node) || ts.isPostfixUnaryExpression(node)) &&
            (node.operator === ts.SyntaxKind.PlusPlusToken ||
              node.operator === ts.SyntaxKind.MinusMinusToken)
          ? node.operand
          : undefined;
    if (written !== undefined && getRoots(written).some(isStateName)) {
      edits.push({
        start: node.getStart(),
        end: node.getStart(),
        text: "(globalThis.__tlaTsWrote(), ",
      });
      edits.push({ start: node.getEnd(), end: node.getEnd(), text: ")" });
    }
    ts.forEachChild(node, visit);
  };
  visit(file);
  // A state variable is a let, which the search sets, and one without an initializer starts at
  // a value of $tlaTsInitial.
  const init = definitions.get("Init");
  const conjuncts =
    init?.kind === "Operator" ? (init.body.kind === "And" ? init.body.operands : [init.body]) : [];
  const choices = conjuncts.flatMap((conjunct) =>
    conjunct.kind === "Apply" &&
    conjunct.operator === "\\in" &&
    conjunct.args[0].kind === "Identifier"
      ? [{ name: conjunct.args[0].name, values: getValues(conjunct.args[1]) }]
      : [],
  );
  declarations.forEach((declaration, name) => {
    const list = declaration.parent;
    if ((list.flags & ts.NodeFlags.Const) !== 0) {
      const keyword = list.getFirstToken();
      if (keyword !== undefined)
        edits.push({ start: keyword.getStart(), end: keyword.getEnd(), text: "let" });
    }
    const index = choices.findIndex((choice) => choice.name === name);
    if (index >= 0) {
      edits.push({
        start: declaration.getStart(),
        end: declaration.getEnd(),
        text: `${name} = globalThis.__tlaTsInitial[${index}]`,
      });
    }
  });
  // The guards that choose a parameter from a set, as the model's steps read them.
  const guards = new Map<string, string>();
  const appended: string[] = [];
  file.statements.forEach((statement) => {
    const fn = ts.isVariableStatement(statement)
      ? statement.declarationList.declarations[0]?.initializer
      : ts.isFunctionDeclaration(statement)
        ? statement
        : undefined;
    const name = ts.isVariableStatement(statement)
      ? statement.declarationList.declarations[0]?.name.getText()
      : ts.isFunctionDeclaration(statement)
        ? statement.name?.text
        : undefined;
    if (
      fn === undefined ||
      name === undefined ||
      !(ts.isArrowFunction(fn) || ts.isFunctionExpression(fn) || ts.isFunctionDeclaration(fn))
    )
      return;
    const parameters = fn.parameters.map((parameter) => parameter.name.getText());
    const body = fn.body;
    if (body === undefined || !ts.isBlock(body)) return;
    for (const inner of body.statements) {
      if (!ts.isIfStatement(inner) || !ts.isPrefixUnaryExpression(inner.expression)) break;
      const operand = inner.expression.operand;
      const call = ts.isParenthesizedExpression(operand) ? operand.expression : operand;
      if (
        !ts.isCallExpression(call) ||
        !ts.isPropertyAccessExpression(call.expression) ||
        call.expression.name.text !== "has"
      )
        break;
      const position = parameters.indexOf(call.arguments[0]?.getText() ?? "");
      if (position < 0) break;
      const guard = `__tlaTsGuard${appended.length}`;
      appended.push(
        `export const ${guard} = (${parameters.join(", ")}) => ${call.expression.expression.getText()};`,
      );
      guards.set(`${name} ${position}`, guard);
    }
  });
  appended.push(`export const __tlaTsGet = () => ({ ${names.join(", ")} });`);
  appended.push(
    `export const __tlaTsSet = (state) => { ${names.map((name) => `${name} = state.${name};`).join(" ")} };`,
  );
  const text = edits
    .toSorted((left, right) => right.start - left.start || (left.text === ")" ? 1 : -1))
    .reduce(
      (current, edit) => current.slice(0, edit.start) + edit.text + current.slice(edit.end),
      source,
    );
  const directory = mkdtempSync(join(tmpdir(), "model-bfs-"));
  const path = join(
    directory,
    fileName.slice(fileName.lastIndexOf("/") + 1).replace(/\.[cm]?[jt]sx?$/, ".ts"),
  );
  // The search writes each state's values back before each call.
  writeFileSync(path, `${text}\n${appended.join("\n")}\n`);
  const steps = getSteps(
    definitions.get("Next")?.kind === "Operator"
      ? (definitions.get("Next") as { body: Expression }).body
      : { kind: "Identifier", name: "FALSE", location: frame.source.location },
    guards,
  );
  // The tags of each top-level function, by its name.
  const tags = file.statements.flatMap((statement) => {
    const name = ts.isVariableStatement(statement)
      ? statement.declarationList.declarations[0]?.name.getText()
      : ts.isFunctionDeclaration(statement)
        ? statement.name?.text
        : undefined;
    return name === undefined
      ? []
      : ts.getJSDocTags(statement).map((tag) => [name, tag.tagName.text] as const);
  });
  let wrote = false;
  Reflect.set(globalThis, "__tlaTsWrote", () => {
    wrote = true;
  });
  const targets = new WeakMap<object, object>();
  const proxies = new WeakMap<object, object>();
  const watch = (value: unknown): unknown => {
    if (!isObject(value) || typeof value === "function") return value;
    const known = proxies.get(value);
    if (known !== undefined) return known;
    const mutators = MUTATORS.get(getKind(value)) ?? new Set<string>();
    const proxy = new Proxy(value, {
      get: (target, key) => {
        const found = Reflect.get(target, key, target);
        if (typeof found !== "function") return watch(found);
        if (typeof key === "string" && mutators.has(key)) {
          return (...args: unknown[]) => {
            wrote = true;
            return found.apply(target, args);
          };
        }
        if (
          ITERATING.has(key) &&
          (target instanceof Map || target instanceof Set || Array.isArray(target))
        ) {
          return (...args: unknown[]) => {
            const result = found.apply(
              target,
              args.map((arg) =>
                typeof arg === "function" ? (...inner: unknown[]) => arg(...inner.map(watch)) : arg,
              ),
            );
            return isIterator(result) ? Iterator.from(result).map(watch) : result;
          };
        }
        return found.bind(target);
      },
      set: (target, key, value) => {
        wrote = true;
        return Reflect.set(target, key, value, target);
      },
      defineProperty: (target, key, descriptor) => {
        wrote = true;
        return Reflect.defineProperty(target, key, descriptor);
      },
      deleteProperty: (target, key) => {
        wrote = true;
        return Reflect.deleteProperty(target, key);
      },
    });
    proxies.set(value, proxy);
    targets.set(proxy, value);
    return proxy;
  };
  const choicesProduct = choices.reduce<unknown[][]>(
    (tuples, choice) => tuples.flatMap((tuple) => choice.values.map((value) => [...tuple, value])),
    [[]],
  );
  const invariants = config.invariants.map((name) => {
    const definition = definitions.get(name);
    return {
      name,
      isCall:
        definition?.kind === "Operator" &&
        (definition.body.kind === "Let" || definition.body.kind === "Forall"),
      isAssumed: tags.some((entry) => entry[0] === name && entry[1] === "assume"),
    };
  });
  const initially = tags.filter((entry) => entry[1] === "initially").map((entry) => entry[0]);
  type Module = Record<string, (...args: unknown[]) => unknown>;
  const loaded = new Map<string, Module>();
  // A module of each initial choice, whose top level ran with the choice's values.
  const load = async (choice: unknown[], index: number) => {
    Reflect.set(globalThis, "__tlaTsInitial", choice);
    const module: Module = await import(`${pathToFileURL(path).href}?choice=${index}`);
    loaded.set(String(index), module);
    return module;
  };
  const states = new Map<string, { state: unknown; level: number; module: Module }>();
  const queue: string[] = [];
  let generated = 0;
  let depth = 0;
  const holds = (module: Module, isInitial: boolean) =>
    invariants.every((invariant) => {
      if (invariant.isAssumed && !isInitial) return true;
      if (invariant.isCall) return true;
      return module[invariant.name]() === true;
    });
  const restore = (module: Module, state: unknown) => {
    const fresh = copy(state, targets) as Record<string, unknown>;
    module.__tlaTsSet(Object.fromEntries(names.map((name) => [name, watch(fresh[name])])));
  };
  // A state that a constraint fails is generated, and the search goes no further from it.
  const add = (state: unknown, level: number, module: Module): string | undefined => {
    const key = encode(state);
    if (states.has(key)) return undefined;
    restore(module, state);
    if (!config.constraints.every((name) => module[name]() === true)) return undefined;
    states.set(key, { state, level, module });
    depth = Math.max(depth, level);
    queue.push(key);
    return key;
  };
  // The assumptions, which read no state, hold as the module's top level leaves it.
  const assumptions = frame.source.assumptions.flatMap((assumption) =>
    assumption.expression.kind === "Identifier" ? [assumption.expression.name] : [],
  );
  for (const [index, choice] of choicesProduct.entries()) {
    const module = await load(choice, index);
    if (!assumptions.every((name) => module[name]() !== false)) {
      return { status: "assumption-violation", generatedStates: 0, distinctStates: 0, depth: 0 };
    }
    if (!initially.every((name) => module[name]() === true)) continue;
    generated += 1;
    const state = copy(module.__tlaTsGet(), targets);
    if (add(state, 1, module) !== undefined && !holds(module, true)) {
      return {
        status: "invariant-violation",
        generatedStates: generated,
        distinctStates: states.size,
        depth,
      };
    }
  }
  while (queue.length > 0) {
    const key = queue.shift() ?? "";
    const entry = states.get(key);
    if (entry === undefined) continue;
    let successors = 0;
    for (const step of steps) {
      if (step.isTerminating) {
        restore(entry.module, entry.state);
        if (entry.module[step.name]() === true) {
          generated += 1;
          successors += 1;
        }
        continue;
      }
      const getArguments = (position: number, chosen: unknown[]): unknown[][] => {
        if (position === step.domains.length) return [chosen];
        const domain = step.domains[position];
        if (Array.isArray(domain))
          return domain.flatMap((value) => getArguments(position + 1, [...chosen, value]));
        restore(entry.module, entry.state);
        const set = entry.module[domain.guard](...chosen) as Set<unknown>;
        return [...set].flatMap((value) =>
          getArguments(position + 1, [...chosen, copy(value, targets)]),
        );
      };
      for (const args of getArguments(0, [])) {
        restore(entry.module, entry.state);
        wrote = false;
        try {
          entry.module[step.name](...args);
        } catch {
          return {
            status: "error",
            generatedStates: generated,
            distinctStates: states.size,
            depth,
          };
        }
        if (!wrote) continue;
        generated += 1;
        successors += 1;
        const next = copy(entry.module.__tlaTsGet(), targets);
        if (add(next, entry.level + 1, entry.module) !== undefined) {
          restore(entry.module, next);
          if (!holds(entry.module, false)) {
            return {
              status: "invariant-violation",
              generatedStates: generated,
              distinctStates: states.size,
              depth,
            };
          }
        }
      }
    }
    if (successors === 0 && config.checkDeadlock) {
      return { status: "deadlock", generatedStates: generated, distinctStates: states.size, depth };
    }
  }
  return { status: "success", generatedStates: generated, distinctStates: states.size, depth };
};
