import { getChildren, type Expression, type OperatorDefinition } from "../../ast";
import { TlaTypeScriptError } from "../../errors";
import { mapChildren } from "../../instances";
import { parseModule } from "../../parser";
import { printDefinition } from "../../printer";

const printText = (definition: OperatorDefinition) => printDefinition(definition).join("\n");

interface CodeDefinition {
  name: string;
  arity: number;
  text: string;
}

// The steps whose results suspend the body that evaluates them: a yield, a delegated yield, an
// await, and an async generator's return, which awaits its value.
const SUSPENDING = ["YieldThen", "YieldStarThen", "AwaitThen", "ReturnThen"];

const LOCATION = { line: 0, column: 0 };

// The expressions that evaluate each of their parts, whose part that suspends can go first. The
// generated code applies operators to results that they read.
const STRICT_KINDS = new Set<Expression["kind"]>([
  "Apply",
  "If",
  "FunctionApplication",
  "FieldAccess",
  "Tuple",
  "Record",
  "SetEnumeration",
  "Except",
]);

const identifier = (name: string): Expression => ({ kind: "Identifier", name, location: LOCATION });

const apply = (operator: string, args: Expression[]): Expression => ({
  kind: "Apply",
  operator,
  args,
  location: LOCATION,
});

// The names a definition's text reads, with LoopN for each loop N that it runs, whose iterations
// the runtime runs through LoopIteration.
const getReferencedNames = (text: string) =>
  new Set([
    ...(text.match(/\b[A-Za-z_]\w*\b/g) ?? []),
    ...[...text.matchAll(/\bid \|-> (\d+), labels \|->/g)].map((match) => `Loop${match[1]}`),
  ]);

const getNames = (expression: Expression, names = new Set<string>()): Set<string> => {
  if (expression.kind === "Identifier") names.add(expression.name);
  if (expression.kind === "Apply") names.add(expression.operator);
  if (expression.kind === "Let") {
    expression.definitions.forEach((definition) => getNames(definition.body, names));
  }
  getChildren(expression).forEach((child) => getNames(child, names));
  return names;
};

// A program's definitions where a body of a generator or an async function that a yield or an await
// suspends passes on, with each step that waits on such a suspension, a frame of what the step needs
// to go on: ESCore's scheme for its interpreter, whose steps that end in Then pass a suspension on,
// and whose ResumeFrame runs a frame's step on the result that the body resumes with. A step of the
// program's code is a definition ResumeN(captures, r) of what remains of a definition once r, the
// result it waits on, is known, with the values it reads of the definition's parameters and LET
// definitions as captures. Its frame is [step |-> "Code", args |-> <<N, captures>>], which
// ResumeCode dispatches on. A runtime step in resumable passes a suspension of its last parameter on
// by itself. A function's code, CodeN, starts a body's driver rather than waits on its suspension.
export const suspendDefinitions = (
  definitions: readonly CodeDefinition[],
  resumable: ReadonlySet<string>,
): CodeDefinition[] => {
  // The definitions that read each name, but CodeN, which starts a driver rather than suspends.
  const readers = new Map<string, string[]>();
  definitions.forEach((definition) => {
    if (/^Code\d+$/.test(definition.name)) return;
    getReferencedNames(definition.text.slice(definition.text.indexOf("=="))).forEach((name) => {
      const names = readers.get(name);
      if (names === undefined) readers.set(name, [definition.name]);
      else names.push(definition.name);
    });
  });
  // The steps that suspend, and each definition that reads one.
  const suspending = new Set(SUSPENDING);
  const pending = [...SUSPENDING];
  while (pending.length > 0) {
    readers.get(pending.pop() ?? "")?.forEach((name) => {
      if (suspending.has(name)) return;
      suspending.add(name);
      pending.push(name);
    });
  }
  // A loop's record, [id |-> N, labels |-> ...], whose iterations LoopN runs, which makes an
  // operator applied to it suspend.
  const isSuspendingLoop = (expression: Expression) =>
    expression.kind === "Record" &&
    expression.fields.some((field) => field.name === "labels") &&
    expression.fields.some(
      (field) =>
        field.name === "id" &&
        field.value.kind === "Number" &&
        suspending.has(`Loop${field.value.value}`),
    );
  const isSuspending = (expression: Expression): boolean =>
    (expression.kind === "Apply" &&
      (suspending.has(expression.operator) || expression.args.some(isSuspendingLoop))) ||
    (expression.kind === "Identifier" && suspending.has(expression.name)) ||
    (expression.kind === "Let" &&
      expression.definitions.some((definition) => isSuspending(definition.body))) ||
    getChildren(expression).some(isSuspending);
  const steps: { name: string; captures: string[] }[] = [];
  const resumptions: OperatorDefinition[] = [];
  // Evaluates value, then goes on with rest, which reads value as name, through a step that the
  // body resumes where value suspends.
  const waitOn = (
    value: Expression,
    name: string,
    rest: Expression,
    scope: readonly string[],
  ): Expression => {
    const read = getNames(rest);
    const captures = scope.filter((local) => local !== name && read.has(local));
    const id = steps.length + 1;
    const step = `Resume${id}`;
    steps.push({ name: step, captures });
    resumptions.push({
      kind: "Operator",
      name: step,
      params: [...captures, name].map((param) => ({ name: param, arity: 0, location: LOCATION })),
      body: transform(rest, [...captures, name]),
      isLocal: false,
      isRecursive: false,
      location: LOCATION,
    });
    return {
      kind: "Let",
      definitions: [
        {
          kind: "Operator",
          name,
          params: [],
          body: transform(value, scope),
          isLocal: false,
          isRecursive: false,
          location: LOCATION,
        },
      ],
      body: {
        kind: "If",
        condition: apply("IsSuspended", [identifier(name)]),
        consequent: apply("Pass", [
          identifier(name),
          { kind: "String", value: "Code", location: LOCATION },
          {
            kind: "Tuple",
            elements: [
              { kind: "Number", value: id, location: LOCATION },
              ...captures.map(identifier),
            ],
            location: LOCATION,
          },
        ]),
        alternative: apply(step, [...captures, name].map(identifier)),
        location: LOCATION,
      },
      location: LOCATION,
    };
  };
  // The expression with every suspension it waits on passed on: where a part suspends, the rest of
  // the expression is a step that the body resumes.
  const transform = (expression: Expression, scope: readonly string[]): Expression => {
    // An operator that suspends, applied to parts that don't, passes the suspension on as it is.
    if (!isSuspending(expression) || !getChildren(expression).some(isSuspending)) {
      return expression;
    }
    if (expression.kind === "Let") {
      const index = expression.definitions.findIndex((definition) => isSuspending(definition.body));
      const before = expression.definitions.slice(0, Math.max(index, 0));
      const inner = [...scope, ...before.map((definition) => definition.name)];
      if (index === -1) {
        return {
          ...expression,
          body: transform(
            expression.body,
            expression.definitions.reduce(
              (names, definition) => [...names, definition.name],
              inner,
            ),
          ),
        };
      }
      const definition = expression.definitions[index];
      if (definition.kind !== "Operator" || definition.params.length > 0) {
        throw new TlaTypeScriptError("tla-ts can't suspend inside a LET operator");
      }
      const after = expression.definitions.slice(index + 1);
      const rest = after.length === 0 ? expression.body : { ...expression, definitions: after };
      const waited = waitOn(definition.body, definition.name, rest, inner);
      return before.length === 0 ? waited : { ...expression, definitions: before, body: waited };
    }
    if (expression.kind === "If" && !isSuspending(expression.condition)) {
      return {
        ...expression,
        consequent: transform(expression.consequent, scope),
        alternative: transform(expression.alternative, scope),
      };
    }
    if (
      expression.kind === "Case" &&
      expression.arms.every((arm) => !isSuspending(arm.condition))
    ) {
      return {
        ...expression,
        arms: expression.arms.map((arm) => ({ ...arm, body: transform(arm.body, scope) })),
        other: expression.other && transform(expression.other, scope),
      };
    }
    // A resumable step passes on a suspension of its last argument itself.
    if (
      expression.kind === "Apply" &&
      resumable.has(expression.operator) &&
      expression.args.slice(0, -1).every((arg) => !isSuspending(arg))
    ) {
      const last = expression.args.length - 1;
      return {
        ...expression,
        args: expression.args.map((arg, index) => (index === last ? transform(arg, scope) : arg)),
      };
    }
    // Otherwise the first part that suspends is evaluated first, and the rest waits on it, where
    // the expression evaluates each of its parts.
    if (!STRICT_KINDS.has(expression.kind)) {
      throw new TlaTypeScriptError(`tla-ts can't suspend inside a ${expression.kind} expression`);
    }
    let waited: Expression | undefined;
    // The step that waits on the part has the next number, which no other name of the program has.
    const name = `susp${steps.length + 1}`;
    const rest = mapChildren(expression, (child, bound) => {
      if (waited !== undefined || !isSuspending(child)) return child;
      if (bound.length > 0) {
        throw new TlaTypeScriptError("tla-ts can't suspend inside a bound variable's scope");
      }
      waited = child;
      return identifier(name);
    });
    if (waited === undefined) {
      throw new TlaTypeScriptError(`tla-ts can't suspend inside a ${expression.kind} expression`);
    }
    return waitOn(waited, name, rest, scope);
  };
  const transformed = definitions.map((definition) => {
    if (!suspending.has(definition.name)) return definition;
    const parsed = parseModule(`---- MODULE Suspended ----\n${definition.text}\n====`)
      .definitions[0];
    if (parsed.kind !== "Operator") return definition;
    return {
      ...definition,
      text: printText({
        ...parsed,
        body: transform(
          parsed.body,
          parsed.params.map((param) => param.name),
        ),
      }),
    };
  });
  return [
    ...transformed,
    ...resumptions.map((resumption) => ({
      name: resumption.name,
      arity: resumption.params.length,
      text: printText(resumption),
    })),
    {
      name: "ResumeCode",
      arity: 2,
      text: [
        "ResumeCode(args, r) ==",
        steps.length === 0
          ? `  Assert(FALSE, "tla-ts can't resume a program without a step")`
          : `  ${getDispatch(steps.length, (id) => `${steps[id - 1].name}(${[...steps[id - 1].captures.map((_, index) => `args[${index + 2}]`), "r"].join(", ")})`)}`,
      ].join("\n"),
    },
  ];
};

// A balanced tree of comparisons on args[1] from 1 to count.
const getDispatch = (count: number, getArm: (id: number) => string) => {
  const dispatch = (low: number, high: number): string => {
    if (low === high) return getArm(low);
    const middle = Math.floor((low + high) / 2);
    return `IF args[1] <= ${middle} THEN ${dispatch(low, middle)} ELSE ${dispatch(middle + 1, high)}`;
  };
  return dispatch(1, count);
};
