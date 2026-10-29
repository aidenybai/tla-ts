// Encodes a prepared proof obligation in SMT-LIB as tlapm's SMT backend does (encode/ and
// backend/smtlib.ml): TLA+ values share one sort Idv, set membership is the predicate TLA__Mem,
// and each symbol the obligation uses brings the symbols and axioms encode/n_data.ml lists for it.

import { adjoin, type Expr, type Hyp, type Scope, type Sequent } from "../../obligation-expression";
import { compareStrings } from "../ocaml";
import { collectSymbols } from "./axiomatize";
import { createPrinter } from "./context";
import type { Entry } from "./flatten";
import { declare, MEM } from "./format";
import { simplifyRecordEqualities, sortRecordFields } from "./simplify";
import { createEncoder, type Binding, type EncodingSession, type Env, type Mode } from "./rewrite";
import { compareAxioms } from "./table";

type Encoder = ReturnType<typeof createEncoder>;

const HYPOTHESIS: Mode = { polarity: "Negative", at: undefined, depth: 0 };

// Prep.expand_defs substitutes visible definitions and pragmas, so they declare nothing.
const isExpanded = (hyp: Extract<Hyp, { kind: "Defn" }>) =>
  hyp.definition.kind === "Bpragma" ||
  (hyp.definition.kind === "Operator" && hyp.visibility === "Visible");

// Smtlib.is_sndord_fact: an ASSUME that declares an operator, which tlapm leaves out.
const isSecondOrder = (expression: Expr) =>
  expression.kind === "Sequent" &&
  expression.sequent.context.some((hyp) => hyp.kind === "Fresh" && hyp.shape > 0);

// Declares each hypothesis's names and asserts its facts, in order, as Smtlib.pp_print_obligation.
// Visible definitions and TLAPS's pragmas are expanded, so they declare nothing.
const encodeContext = (context: Hyp[], encoder: Encoder) =>
  context.reduce<{ env: Env | undefined; scope: Scope | undefined; entries: Entry[] }>(
    (state, hyp) => {
      const next = (binding: Binding, entries: Entry[] = []) => ({
        env: encoder.push(state.env, binding),
        scope: adjoin(state.scope, hyp),
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
          const domain = hyp.domain;
          if (!domain || hyp.domainVisibility === "Hidden") return next(binding, [declaration]);
          // Rewrite.elim_bounds: NEW x \in S is NEW x and the fact x \in S.
          const fact = `(assert (${MEM} ${symbol} ${encoder.encodeIdv(domain, state.env, HYPOTHESIS)}))`;
          return next(binding, [declaration, ...encoder.getEntries(fact)]);
        }
        // Rewrite.elim_flex: a variable is two constants, the second for its primed value.
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
            return next({ kind: "unsupported", reason: "an instance" });
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
            return next({
              kind: "secondOrder",
              name: definition.name,
              shapes: params.map((param) => param.shape),
            });
          const symbol = encoder.getUniqueName(definition.name);
          return next({ kind: "operator", symbol, arity: params.length }, [
            declare(symbol, params.length),
          ]);
        }
        case "Fact": {
          const binding: Binding = { kind: "unsupported", reason: "a reference to a fact" };
          if (hyp.visibility === "Hidden") return next(binding);
          if (!isSecondOrder(hyp.expression)) {
            const fact = `(assert ${encoder.encodeBool(hyp.expression, state.env, HYPOTHESIS)})`;
            return next(binding, encoder.getEntries(fact));
          }
          const fact = `(assert ${encoder.encodeBool(hyp.expression, state.env, { ...HYPOTHESIS, isOmitted: true })})`;
          return next(
            binding,
            encoder
              .getEntries(fact)
              .map((entry) => (typeof entry === "string" ? { omitted: entry } : entry)),
          );
        }
      }
    },
    { env: undefined, scope: undefined, entries: [] },
  );

// Smtlib.pp_print_obligation: the logic, the sort, the builtin symbols by name, their axioms,
// then the hypotheses in order, the goal last. It throws a TlaUnsupportedError for what the
// encoding can't express, where tlapm's encoder fails.
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
  const printer = createPrinter(encoder.declared);
  const collected = collectSymbols(
    entries,
    encoder.flattened,
    encoder.anonymous,
    encoder.recordFields,
  );
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
  return ["(set-logic UFNIA)", ...(isIdvUsed ? ["(declare-sort Idv 0)"] : []), ...lines]
    .map(printer.resolve)
    .concat("(check-sat)", "(exit)")
    .join("\n");
};
