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
import { declare, getTlaName, NATIVE_OPERATORS, replaceTokens } from "./format";
import { getSort } from "./types";
import {
  createEncoder,
  declareConstant,
  encodeBool,
  getEntries,
  getUniqueName,
  push,
  searchDeclarationType,
  type Binding,
  type Encoder,
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
    isArithmetic: encoder.encoding.isArithmetic,
    isSetExtensional: encoder.encoding.isSetExtensional,
    recordFields: encoder.recordFields,
    setTypes: encoder.setTypes,
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
  const visit = (text: string) => {
    const tokens = text.match(/[()]|[^\s()]+/g) ?? [];
    const pending: { depth: number; text: string }[] = [];
    tokens.reduce((depth, token, index) => {
      if (token === "(") return depth + 1;
      if (token === ")") {
        if (pending.at(-1)?.depth === depth) visit(pending.pop()?.text ?? "");
        return depth - 1;
      }
      const flat = encoder.flattener.flattened.get(token);
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

const encodeContext = (sequent: Sequent, encoder: Encoder) =>
  sequent.context.reduce<EncodedContext>(
    (state, hyp, index) => {
      const extend = (binding: Binding, entries: Entry[] = []) => ({
        env: push(state.env, binding),
        entries: [...state.entries, ...entries],
      });
      const rest: Expr = {
        kind: "Sequent",
        sequent: { context: sequent.context.slice(index + 1), active: sequent.active },
      };
      switch (hyp.kind) {
        case "Fresh": {
          const symbol = getUniqueName(encoder, hyp.name);
          if (hyp.shape > 0)
            return extend({ kind: "operator", symbol, arity: hyp.shape }, [
              declare(symbol, hyp.shape),
            ]);
          const declared = declareConstant(
            encoder,
            hyp,
            hyp.domainVisibility === "Visible" ? hyp.domain : undefined,
            rest.sequent,
            state.env,
            HYPOTHESIS,
          );
          const binding: Binding = { kind: "constant", symbol, type: declared.type };
          const declaration = declare(symbol, 0, getSort(declared.type));
          const guard = declared.getGuard(symbol);
          if (guard === undefined) return extend(binding, [declaration]);
          return extend(binding, [declaration, ...getEntries(encoder, `(assert ${guard})`)]);
        }
        // Rewrite.elim_flex declares a variable and then its primed copy, so the hypotheses after
        // it type both.
        case "Flex": {
          const symbol = getUniqueName(encoder, hyp.name);
          const primed = getUniqueName(encoder, `${hyp.name}_prime`);
          const type = searchDeclarationType(encoder, rest, true, state.env, HYPOTHESIS);
          const variable: Binding = { kind: "variable", name: hyp.name, symbol, primed, type };
          const primedType = searchDeclarationType(
            encoder,
            rest,
            true,
            push(state.env, variable),
            HYPOTHESIS,
            `${hyp.name}#prime`,
          );
          return extend({ ...variable, primedType }, [
            declare(symbol, 0, getSort(type)),
            declare(primed, 0, getSort(primedType)),
          ]);
        }
        case "Defn": {
          const definition = hyp.definition;
          if (isExpanded(hyp))
            return extend({ kind: "unsupported", reason: "an expanded definition" });
          if (definition.kind === "Instance")
            return extend({ kind: "unsupported", reason: "an instance" }, [
              `; omitted declaration of '${definition.name}' (missing type)`,
            ]);
          if (definition.kind === "Recursive") {
            const symbol = getUniqueName(encoder, `CONSTANT_${definition.name}_`);
            return extend({ kind: "operator", symbol, arity: definition.shape }, [
              declare(symbol, definition.shape),
            ]);
          }
          if (definition.kind !== "Operator")
            return extend({ kind: "unsupported", reason: "a definition" });
          const body = definition.body;
          const params = body.kind === "Lambda" ? body.params : [];
          if (params.some((param) => param.shape > 0))
            return extend(
              {
                kind: "secondOrder",
                name: definition.name,
                shapes: params.map((param) => param.shape),
              },
              [`; omitted declaration of '${definition.name}' (second-order)`],
            );
          const symbol = getUniqueName(encoder, definition.name);
          // Type.Synthesize types a hidden constant definition as it types a NEW constant.
          const type =
            hyp.visibility === "Hidden" && body.kind !== "Lambda"
              ? searchDeclarationType(encoder, rest, true, state.env, HYPOTHESIS)
              : undefined;
          if (type !== undefined)
            return extend({ kind: "constant", symbol, type }, [declare(symbol, 0, getSort(type))]);
          return extend({ kind: "operator", symbol, arity: params.length }, [
            declare(symbol, params.length),
          ]);
        }
        case "Fact": {
          const binding: Binding = { kind: "unsupported", reason: "a reference to a fact" };
          if (hyp.visibility === "Hidden") return extend(binding, ["; hidden fact"]);
          const isOmitted = isSecondOrder(hyp.expression);
          const entries = getEntries(
            encoder,
            `(assert ${encodeBool(encoder, hyp.expression, state.env, { ...HYPOTHESIS, isOmitted })})`,
          );
          return extend(
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
  const context = encodeContext(sequent, encoder);
  const goal = isSecondOrder(sequent.active)
    ? []
    : getEntries(
        encoder,
        `(assert (! (not ${encodeBool(encoder, sequent.active, context.env, { ...HYPOTHESIS, polarity: "Positive" })}) :named |Goal|))`,
      );
  const resolve = createPrinter(encoder.declared);
  const collected = collectSymbols([...context.entries, ...goal], encoder);
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
    const command = layOutCommand(replaceTokens(resolve(line), NATIVE_OPERATORS));
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
