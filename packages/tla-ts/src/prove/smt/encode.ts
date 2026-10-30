// Encodes a prepared proof obligation in SMT-LIB as tlapm's SMT backend does (encode/ and
// backend/smtlib.ml): TLA+ values share one sort Idv, set membership is the predicate TLA__Mem,
// and each symbol the obligation uses brings the symbols and axioms encode/n_data.ml lists for it.

import {
  adjoin,
  type Builtin,
  type Hyp,
  type Scope,
  type Sequent,
} from "../../obligation-expression";
import { getLevelInfo } from "../../obligation-levels";
import { compareStrings } from "../ocaml";
import { getMd5 } from "../prep/md5";
import { getPragmaProver } from "../prep/pragma";
import { collectSymbols } from "./axiomatize";
import { createPrinter } from "./context";
import type { Entry } from "./flatten";
import { declare, MEM } from "./format";
import { simplifyRecordEqualities, sortRecordFields } from "./simplify";
import { createEncoder, type Binding, type EncodingSession, type Env, type Mode } from "./rewrite";
import { compareAxioms } from "./table";

const LEVEL_PREFIXES = ["CONSTANT", "STATE", "ACTION", "TEMPORAL"];

const COMMUTED_BUILTINS = new Set<Builtin>(["Prime", "UNCHANGED", "BoxTrue", "Diamond"]);

type Encoder = ReturnType<typeof createEncoder>;

const HYPOTHESIS: Mode = { isPrimed: false, polarity: "Negative", at: undefined, depth: 0 };

// Prep.expand_defs substitutes visible definitions and pragmas, so they declare nothing.
const isExpanded = (hyp: Extract<Hyp, { kind: "Defn" }>) =>
  hyp.definition.kind === "Bpragma" ||
  getPragmaProver(hyp) !== undefined ||
  (hyp.definition.kind === "Operator" && hyp.visibility === "Visible");

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
          if (hyp.level === "Temporal" || (hyp.shape > 0 && hyp.level !== "Constant"))
            return next({ kind: "unsupported", reason: "a temporal declaration" });
          const prefix =
            hyp.level === "State" ? "STATE" : hyp.level === "Action" ? "ACTION" : "CONSTANT";
          const symbol = encoder.getUniqueName(`${prefix}_${hyp.name}_`);
          const binding: Binding =
            hyp.shape === 0
              ? { kind: "constant", symbol }
              : { kind: "operator", symbol, arity: hyp.shape, opaque: undefined };
          const declaration = declare(symbol, hyp.shape);
          const domain = hyp.domain;
          if (!domain || hyp.domainVisibility === "Hidden") return next(binding, [declaration]);
          // Rewrite.elim_bounds: NEW x \in S is NEW x and the fact x \in S.
          const fact = `(assert (${MEM} ${symbol} ${encoder.encodeIdv(domain, state.env, HYPOTHESIS)}))`;
          return next(binding, [declaration, ...encoder.getEntries(fact)]);
        }
        case "Flex": {
          const symbol = encoder.getUniqueName(`VARIABLE_${hyp.name}_`);
          const primed = `${symbol}__prime`;
          return next({ kind: "variable", symbol, primed }, [
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
            return next({ kind: "operator", symbol, arity: definition.shape, opaque: undefined }, [
              declare(symbol, definition.shape),
            ]);
          }
          if (definition.kind !== "Operator")
            return next({ kind: "unsupported", reason: "a definition" });
          const body = definition.body;
          const params = body.kind === "Lambda" ? body.params : [];
          // Action.process_eob expands an UNCHANGED, and commutes a prime, [] or <>, at the root
          // of a definition into its argument. Levels.compute_level then keeps the level the
          // argument had for the new root.
          const isCommuted =
            body.kind === "Apply" &&
            body.operator.kind === "Internal" &&
            COMMUTED_BUILTINS.has(body.operator.builtin);
          const level = Math.min(
            getLevelInfo(state.scope, isCommuted ? body.args[0] : body).level,
            3,
          );
          const name = `${LEVEL_PREFIXES[level]}_${definition.name}_`;
          if (params.some((param) => param.shape > 0))
            return next({ kind: "secondOrder", name, shapes: params.map((param) => param.shape) });
          const symbol = encoder.getUniqueName(name);
          // Coalesce.crypthash: the digest of the primed name.
          const opaque = level > 0 ? `h${getMd5(`${name}'`).slice(0, 5)}` : undefined;
          return next({ kind: "operator", symbol, arity: params.length, opaque }, [
            declare(symbol, params.length),
          ]);
        }
        case "Fact": {
          const binding: Binding = { kind: "unsupported", reason: "a reference to a fact" };
          if (hyp.visibility === "Hidden") return next(binding);
          const fact = `(assert ${encoder.encodeBool(hyp.expression, state.env, HYPOTHESIS)})`;
          return next(binding, encoder.getEntries(fact));
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
  const goal = encoder.encodeBool(sequent.active, context.env, {
    ...HYPOTHESIS,
    polarity: "Positive",
  });
  const entries = [
    ...context.entries,
    ...encoder.getEntries(`(assert (! (not ${goal}) :named |Goal|))`),
  ];
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
    ...entries.flatMap((entry) => (typeof entry === "string" ? [entry] : entry.getLines(keys))),
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
