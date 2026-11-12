import {
  applyBuiltin,
  at,
  mapChildren,
  type Expr,
  type Hyp,
  type Sequent,
} from "../../obligations/expression";
import { compareStrings } from "../ocaml";
import { createPrinter } from "./context";
import { getSymbolSpec, type CollectState, type SymbolSpec } from "./data";
import type { Entry } from "./flatten";
import { declare, getTlaName, MEM } from "./format";
import { createEncoder, type Binding, type EncodingSession, type Env, type Mode } from "./rewrite";
import { compareAxioms, getAxiomKey, type Axiom } from "./table";

type RecordExpr = Extract<Expr, { kind: "Record" }>;

const isSameFieldSet = (left: RecordExpr, right: RecordExpr) =>
  left.fields.length === right.fields.length &&
  left.fields.every((field) => right.fields.some((other) => other.name === field.name)) &&
  right.fields.every((field) => left.fields.some((other) => other.name === field.name));

const conjoinRight = (items: Expr[]): Expr =>
  items.length === 1
    ? items[0]
    : applyBuiltin("Conj", [items[0], conjoinRight(items.slice(1))], items[0]);

const decompose = (left: Expr, right: Expr, from: Expr): Expr => {
  if (left.kind !== "Record" || right.kind !== "Record" || !isSameFieldSet(left, right))
    return applyBuiltin("Eq", [left, right], from);
  return conjoinRight(
    left.fields.map((field) =>
      decompose(
        field.value,
        right.fields.find((other) => other.name === field.name)?.value ?? field.value,
        from,
      ),
    ),
  );
};

const simplifyRecordEqualities = (expression: Expr): Expr => {
  const inner = mapChildren(expression, simplifyRecordEqualities);
  if (
    inner.kind !== "Apply" ||
    inner.operator.kind !== "Internal" ||
    inner.operator.builtin !== "Eq" ||
    inner.args.length !== 2 ||
    inner.args[0].kind !== "Record" ||
    inner.args[1].kind !== "Record"
  )
    return inner;
  return at(decompose(inner.args[0], inner.args[1], inner), inner);
};

// tlapm doesn't visit the field values, so a record inside a record keeps its written order.
const sortRecordFields = (expression: Expr): Expr =>
  expression.kind === "Record" || expression.kind === "Rect"
    ? {
        ...expression,
        fields: expression.fields.toSorted((left, right) => compareStrings(left.name, right.name)),
      }
    : mapChildren(expression, sortRecordFields);

const collectSymbols = (entries: Entry[], encoder: Encoder) => {
  const state: CollectState = {
    recordFields: encoder.recordFields,
    strings: [],
    isFunConstr: false,
    isFunSet: false,
    isExcept: false,
    tuples: [],
    records: [],
    anonymous: encoder.anonymous,
  };
  const symbols = new Map<string, SymbolSpec>();
  const axioms = new Map<string, Axiom>();
  const add = (name: string) => {
    const work = new Set([name]);
    while (work.size > 0) {
      const next = [...work].toSorted(compareStrings)[0];
      work.delete(next);
      if (symbols.has(next)) continue;
      const spec = getSymbolSpec(next, state);
      symbols.set(next, spec);
      spec.deps.forEach((dep) => work.add(dep));
      spec.axioms.forEach((entry) => axioms.set(getAxiomKey(entry), entry));
    }
  };
  const visit = (text: string) => {
    const tokens = text.match(/[()]|[^\s()]+/g) ?? [];
    const pending: { depth: number; text: string }[] = [];
    tokens.reduce((depth, token, index) => {
      if (token === "(") return depth + 1;
      if (token === ")") {
        if (pending.at(-1)?.depth === depth) visit(pending.pop()?.text ?? "");
        return depth - 1;
      }
      const flat = encoder.flattened.get(token);
      if (!flat) {
        const builtin = getTlaName(token);
        if (builtin !== undefined) add(builtin);
        return depth;
      }
      if (flat.kind !== "") add(flat.kind);
      if (tokens[index - 1] === "(") pending.push({ depth, text: flat.visit });
      else visit(flat.visit);
      return depth;
    }, 0);
  };
  entries.forEach((entry) => {
    if (typeof entry === "string") visit(entry);
    else if ("omitted" in entry) visit(entry.omitted);
  });
  return { symbols, axioms };
};

type Encoder = ReturnType<typeof createEncoder>;

const HYPOTHESIS: Mode = { isOmitted: false, polarity: "Negative", at: undefined, depth: 0 };

const isExpanded = (hyp: Extract<Hyp, { kind: "Defn" }>) =>
  hyp.definition.kind === "Bpragma" ||
  (hyp.definition.kind === "Operator" && hyp.visibility === "Visible");

const isSecondOrder = (expression: Expr) =>
  expression.kind === "Sequent" &&
  expression.sequent.context.some((hyp) => hyp.kind === "Fresh" && hyp.shape > 0);

interface EncodedContext {
  env: Env | undefined;
  entries: Entry[];
}

const encodeContext = (context: Hyp[], encoder: Encoder) =>
  context.reduce<EncodedContext>(
    (state, hyp) => {
      const extend = (binding: Binding, entries: Entry[] = []) => ({
        env: encoder.push(state.env, binding),
        entries: [...state.entries, ...entries],
      });
      switch (hyp.kind) {
        case "Fresh": {
          const symbol = encoder.getUniqueName(hyp.name);
          const binding: Binding =
            hyp.shape === 0
              ? { kind: "constant", symbol }
              : { kind: "operator", symbol, arity: hyp.shape };
          const declaration = declare(symbol, hyp.shape);
          if (!hyp.domain || hyp.domainVisibility === "Hidden")
            return extend(binding, [declaration]);
          const fact = `(assert (${MEM} ${symbol} ${encoder.encodeIdv(hyp.domain, state.env, HYPOTHESIS)}))`;
          return extend(binding, [declaration, ...encoder.getEntries(fact)]);
        }
        case "Flex": {
          const symbol = encoder.getUniqueName(hyp.name);
          const primed = encoder.getUniqueName(`${hyp.name}_prime`);
          return extend({ kind: "variable", name: hyp.name, symbol, primed }, [
            declare(symbol, 0),
            declare(primed, 0),
          ]);
        }
        case "Defn": {
          const definition = hyp.definition;
          if (isExpanded(hyp))
            return extend({ kind: "unsupported", reason: "an expanded definition" });
          if (definition.kind === "Instance")
            return extend({ kind: "unsupported", reason: "an instance" });
          if (definition.kind === "Recursive") {
            const symbol = encoder.getUniqueName(`CONSTANT_${definition.name}_`);
            return extend({ kind: "operator", symbol, arity: definition.shape }, [
              declare(symbol, definition.shape),
            ]);
          }
          if (definition.kind !== "Operator")
            return extend({ kind: "unsupported", reason: "a definition" });
          const body = definition.body;
          const params = body.kind === "Lambda" ? body.params : [];
          if (params.some((param) => param.shape > 0))
            return extend({
              kind: "secondOrder",
              name: definition.name,
              shapes: params.map((param) => param.shape),
            });
          const symbol = encoder.getUniqueName(definition.name);
          return extend({ kind: "operator", symbol, arity: params.length }, [
            declare(symbol, params.length),
          ]);
        }
        case "Fact": {
          const binding: Binding = { kind: "unsupported", reason: "a reference to a fact" };
          if (hyp.visibility === "Hidden") return extend(binding);
          const isOmitted = isSecondOrder(hyp.expression);
          const entries = encoder.getEntries(
            `(assert ${encoder.encodeBool(hyp.expression, state.env, { ...HYPOTHESIS, isOmitted })})`,
          );
          return extend(
            binding,
            isOmitted
              ? entries.map((entry) => (typeof entry === "string" ? { omitted: entry } : entry))
              : entries,
          );
        }
      }
    },
    { env: undefined, entries: [] },
  );

export const encodeSmt = (prepared: Sequent, session: EncodingSession) => {
  const simplified = sortRecordFields(
    simplifyRecordEqualities({ kind: "Sequent", sequent: prepared }),
  );
  const sequent = simplified.kind === "Sequent" ? simplified.sequent : prepared;
  const encoder = createEncoder(session);
  const context = encodeContext(sequent.context, encoder);
  const goal = isSecondOrder(sequent.active)
    ? []
    : encoder.getEntries(
        `(assert (! (not ${encoder.encodeBool(sequent.active, context.env, { ...HYPOTHESIS, polarity: "Positive" })}) :named |Goal|))`,
      );
  const entries = [...context.entries, ...goal];
  const resolve = createPrinter(encoder.declared);
  const collected = collectSymbols(entries, encoder);
  const declarations = [...collected.symbols]
    .toSorted((left, right) => compareStrings(left[0], right[0]))
    .flatMap((symbol) => (symbol[1].declaration === undefined ? [] : [symbol[1].declaration]));
  const axioms = [...collected.axioms.values()]
    .toSorted(compareAxioms)
    .flatMap((entry) =>
      entry.formula === undefined ? [] : [`(assert (! ${entry.formula} :named |${entry.label}|))`],
    );
  const keys = new Set(collected.axioms.keys());
  const lines = [
    ...declarations,
    ...axioms,
    ...entries.flatMap((entry) => {
      if (typeof entry === "string") return [entry];
      return "omitted" in entry ? [] : entry.getLines(keys);
    }),
  ];
  const isIdvUsed =
    lines.some((line) => /\bIdv\b/.test(line)) ||
    sequent.context.some(
      (hyp) =>
        hyp.kind === "Defn" &&
        (hyp.definition.kind === "Operator" || hyp.definition.kind === "Recursive") &&
        !isExpanded(hyp),
    );
  return ["(set-logic UFNIA)", ...(isIdvUsed ? ["(declare-sort Idv 0)"] : []), ...lines]
    .map(resolve)
    .concat("(check-sat)", "(exit)")
    .join("\n");
};
