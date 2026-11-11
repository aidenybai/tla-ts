// Encodes a prepared proof obligation in SMT-LIB as tlapm's SMT backend does (encode/ and
// backend/smtlib.ml).

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
import { simplifySets } from "./simplify";
import { layOutCommand } from "./layout";
import { getSymbolSpec, type CollectState, type SymbolSpec } from "./data";
import type { Entry } from "./flatten";
import { declare, getTlaName, MEM } from "./format";
import {
  createEncoder,
  type Binding,
  type EncodingSession,
  type Env,
  type Mode,
  type SmtEncoding,
} from "./rewrite";
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

// Like tlapm's N_rewrite.sort_recfields, it doesn't visit field values, so a nested record keeps
// its written order.
const sortRecordFields = (expression: Expr): Expr =>
  expression.kind === "Record" || expression.kind === "Rect"
    ? {
        ...expression,
        fields: expression.fields.toSorted((left, right) => compareStrings(left.name, right.name)),
      }
    : mapChildren(expression, sortRecordFields);

// Each symbol brings its dependencies in the order tlapm's N_axiomatize.collect visits them,
// smallest name first.
const collectSymbols = (entries: Entry[], encoder: Encoder, encoding: SmtEncoding) => {
  const state: CollectState = {
    isArithmetic: encoding.isArithmetic,
    isSetExtensional: encoding.isSetExtensional,
    recordFields: encoder.recordFields,
    strings: [],
    integers: [],
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
  // A flattened symbol stands for a builtin applied to its first-order arguments and then its
  // higher-order ones, so its higher-order text is visited after its arguments.
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

// Prep.expand_defs substitutes visible definitions and pragmas, so they declare nothing.
const isExpanded = (hyp: Extract<Hyp, { kind: "Defn" }>) =>
  hyp.definition.kind === "Bpragma" ||
  (hyp.definition.kind === "Operator" && hyp.visibility === "Visible");

// Smtlib.is_sndord_fact: an ASSUME that declares an operator, which tlapm leaves out.
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
      const next = (binding: Binding, entries: Entry[] = []) => ({
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
          if (!hyp.domain || hyp.domainVisibility === "Hidden") return next(binding, [declaration]);
          const fact = `(assert (${MEM} ${symbol} ${encoder.encodeIdv(hyp.domain, state.env, HYPOTHESIS)}))`;
          return next(binding, [declaration, ...encoder.getEntries(fact)]);
        }
        case "Flex": {
          const symbol = encoder.getUniqueName(hyp.name);
          const primed = encoder.getUniqueName(`${hyp.name}_prime`);
          return next({ kind: "variable", name: hyp.name, symbol, primed }, [
            declare(symbol, 0),
            declare(primed, 0),
          ]);
        }
        case "Defn": {
          const definition = hyp.definition;
          if (isExpanded(hyp))
            return next({ kind: "unsupported", reason: "an expanded definition" });
          if (definition.kind === "Instance")
            return next({ kind: "unsupported", reason: "an instance" }, [
              `; omitted declaration of '${definition.name}' (missing type)`,
            ]);
          if (definition.kind === "Recursive") {
            const symbol = encoder.getUniqueName(`CONSTANT_${definition.name}_`);
            return next({ kind: "operator", symbol, arity: definition.shape }, [
              declare(symbol, definition.shape),
            ]);
          }
          if (definition.kind !== "Operator")
            return next({ kind: "unsupported", reason: "a definition" });
          const body = definition.body;
          const params = body.kind === "Lambda" ? body.params : [];
          if (params.some((param) => param.shape > 0))
            return next(
              {
                kind: "secondOrder",
                name: definition.name,
                shapes: params.map((param) => param.shape),
              },
              [`; omitted declaration of '${definition.name}' (second-order)`],
            );
          const symbol = encoder.getUniqueName(definition.name);
          return next({ kind: "operator", symbol, arity: params.length }, [
            declare(symbol, params.length),
          ]);
        }
        case "Fact": {
          const binding: Binding = { kind: "unsupported", reason: "a reference to a fact" };
          if (hyp.visibility === "Hidden") return next(binding, ["; hidden fact"]);
          const isOmitted = isSecondOrder(hyp.expression);
          const entries = encoder.getEntries(
            `(assert ${encoder.encodeBool(hyp.expression, state.env, { ...HYPOTHESIS, isOmitted })})`,
          );
          return next(
            binding,
            isOmitted
              ? [
                  ...entries.map((entry) =>
                    typeof entry === "string" ? { omitted: entry } : entry,
                  ),
                  "; omitted fact (second-order)",
                ]
              : entries,
          );
        }
      }
    },
    { env: undefined, entries: [] },
  );

interface SmtHeader {
  version: string;
  id: number;
  location: string;
  logic: string;
}

export const encodeSmt = (
  prepared: Sequent,
  session: EncodingSession,
  header: SmtHeader,
  encoding: SmtEncoding,
) => {
  const simplified = sortRecordFields(
    simplifyRecordEqualities({ kind: "Sequent", sequent: prepared }),
  );
  const sequent = simplifySets(
    simplified.kind === "Sequent" ? simplified.sequent : prepared,
    encoding.rewriteLevel,
  );
  const encoder = createEncoder(session, encoding);
  const context = encodeContext(sequent.context, encoder);
  const goal = isSecondOrder(sequent.active)
    ? []
    : encoder.getEntries(
        `(assert (! (not ${encoder.encodeBool(sequent.active, context.env, { ...HYPOTHESIS, polarity: "Positive" })}) :named |Goal|))`,
      );
  const printer = createPrinter(encoder.declared);
  const collected = collectSymbols([...context.entries, ...goal], encoder, encoding);
  const declarations = [...collected.symbols]
    .toSorted((left, right) => compareStrings(left[0], right[0]))
    .flatMap((symbol) => (symbol[1].declaration === undefined ? [] : [symbol[1].declaration]));
  const axioms = [...collected.axioms.values()]
    .toSorted(compareAxioms)
    .map((entry) =>
      entry.formula === undefined
        ? "; omitted fact (second-order)"
        : `(assert (! ${entry.formula} :named |${entry.label}|))`,
    );
  const keys = new Set(collected.axioms.keys());
  const getLines = (entries: Entry[]) =>
    entries.flatMap((entry) => {
      if (typeof entry === "string") return [entry];
      return "omitted" in entry ? [] : entry.getLines(keys);
    });
  const hypotheses = [...declarations, ...axioms, ...getLines(context.entries)];
  const lines = [...hypotheses, ...getLines(goal)];
  // Smtlib.collect_sorts declares Idv only when a symbol or a bound variable has that sort.
  // Type.Synthesize gives that sort to each definition left in the context, though none is printed.
  const isIdvUsed =
    lines.some((line) => /\bIdv\b/.test(line)) ||
    sequent.context.some(
      (hyp) =>
        hyp.kind === "Defn" &&
        (hyp.definition.kind === "Operator" || hyp.definition.kind === "Recursive") &&
        !isExpanded(hyp),
    );
  const printCommand = (line: string) => {
    if (line.startsWith(";")) return line;
    const command = layOutCommand(printer.resolve(line));
    const name = /:named \|([^|]*)\|\)\)$/.exec(line)?.[1];
    if (name === undefined) return command;
    return `;; ${name === "Goal" ? name : `Axiom: ${name}`}\n${command}`;
  };
  return [
    `;; TLA+ Proof Manager ${header.version}\n`,
    `;; Proof obligation #${header.id}\n`,
    `;; Generated from ${header.location}\n\n`,
    `(set-logic ${header.logic})\n\n`,
    ";; Sorts\n\n",
    isIdvUsed ? "(declare-sort Idv 0)\n" : "",
    "\n;; Hypotheses\n\n",
    hypotheses.length === 0 ? "\n" : "",
    ...lines.map((line) => `${printCommand(line)}\n\n`),
    "(check-sat)\n(exit)\n",
  ].join("");
};
