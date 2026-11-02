// What backend/zenon.ml and backend/isabelle.ml share in printing an obligation that Backend.Prep
// has shipped.

import { TlapmBugError, TlaProverError, TlaUnsupportedError } from "../errors";
import { popNames, type Context } from "../obligations/printer";
import { shiftExpr } from "../obligations/substitution";
import type { Bound, Builtin, Expr } from "../obligations/expression";

const CHARACTER_NAMES: Record<string, string> = {
  "!": "excl_",
  "#": "hash_",
  $: "doll_",
  "%": "perc_",
  "&": "ampe_",
  "'": "quot_",
  "(": "lpar_",
  ")": "rpar_",
  "*": "star_",
  "+": "plus_",
  "-": "dash_",
  ".": "peri_",
  "/": "slas_",
  ":": "colo_",
  "<": "less_",
  "=": "equa_",
  ">": "more_",
  "?": "ques_",
  "@": "atsi_",
  "[": "lbrk_",
  "\\": "bksl_",
  "]": "rbrk_",
  "^": "care_",
  _: "unde_",
  "|": "vert_",
  "~": "tild_",
};

// isabelle_tlaplus_keys, then Isabelle_keywords.v, then other_keys.
const FORBIDDEN = new Set(
  [
    "All Append Bijections Case CaseArm CaseOther Char Choice EnumFuncSet Ex Fcn FuncSet INTER Id",
    "Image Injections Injective InjectiveOn Int Inverse Len Let Monotonic Nat Nibble Not PeanoAxioms",
    "Pred Product Range Seq String Succ Surjections Surjective TYPE Trueprop Zero abs addElt addnat",
    "all antisymmetric any aprop arbitrary args arith_add asms bAll bChoice bEx boolify c cap cargs",
    "case_arm case_arms cases_conj cases_equal cases_forall cases_implies char cidts classes cond",
    "conj conjunction converse cs cup default diff diffnat disj div divmodNat divmod_rel domrng",
    "domrngs dummy dummy_pattern dvd emptySeq eq equivalence except extend fapply float_const",
    "float_token fun geq gfp greater id idt idts iff imp in index infinity irreflexive isAFcn isASeq",
    "isBool isNeg isPos itself leq less letbind letbinds lfp logic longid minus mod mult multnat",
    "natInterval num num_const oneArg prod prop psubset psupset pttrn pttrns reflexive rel_comp",
    "rel_domain rel_image rel_range setOfAll setOfPairs setminus sgn sort sort_constraint struct",
    "subsetOf subseteq symmetric term tid tpl transitive tvar type types upair upto var xcpt xnum",
    "xstr",
    "ML ML_command ML_export ML_file ML_file_debug ML_file_no_debug ML_prf ML_val ROOTS_file",
    "SML_export SML_file SML_file_debug SML_file_no_debug SML_import abbreviation abbrevs alias also",
    "and apply apply_end assume assumes attribute_setup axiomatization back begin bibtex_file binder",
    "bundle by case chapter class class_deps code_datatype compile_generated_files consider",
    "constrains consts context corollary declaration declare default_sort defer define defines",
    "definition done end experiment export_files export_generated_files export_prefix external_file",
    "external_files extract extract_type finally find_consts find_theorems fix fixes for from",
    "full_prf generate_file global_interpretation guess have help hence hide_class hide_const",
    "hide_fact hide_type if imports in include includes including infix infixl infixr instance",
    "instantiation interpret interpretation is judgment keywords lemma lemmas let local_setup locale",
    "locale_deps method_setup moreover named_theorems next no_notation no_syntax no_translations",
    "no_type_notation nonterminal notation note notepad notes obtain obtains oops open opening oracle",
    "output overloaded overloading paragraph parse_ast_translation parse_translation pervasive prefer",
    "premises presume prf print_ML_antiquotations print_abbrevs print_antiquotations",
    "print_ast_translation print_attributes print_bundles print_cases print_classes print_codesetup",
    "print_commands print_context print_definitions print_defn_rules print_facts print_interps",
    "print_locale print_locales print_methods print_options print_rules print_simpset print_state",
    "print_statement print_syntax print_term_bindings print_theorems print_theory print_trans_rules",
    "print_translation private proof prop proposition qed qualified realizability realizers rewrites",
    "schematic_goal section setup show shows simproc_setup sorry structure subclass subgoal sublocale",
    "subparagraph subsection subsubsection supply syntax syntax_declaration term text text_raw then",
    "theorem theory thm thm_deps thm_oracles thus thy_deps translations txt typ type_alias",
    "type_notation type_synonym typed_print_translation typedecl ultimately unbundle unchecked",
    "unfolding unused_thms using welcome when where with write",
    "O max status",
  ]
    .join(" ")
    .split(" "),
);

const isLetter = (character: string) => /^[A-Za-z]$/.test(character);

const getCharacterName = (character: string) => {
  if (/^[A-Za-z0-9]$/.test(character)) return undefined;
  const name = CHARACTER_NAMES[character];
  if (name === undefined) throw new TlapmBugError();
  return name;
};

// Tla_parser.pickle: renames an identifier that some backend would reject.
export const pickle = (name: string) => {
  const characters = [...name];
  const isPlain =
    isLetter(characters[0] ?? "") &&
    isLetter(characters.at(-1) ?? "") &&
    characters.every((character) => getCharacterName(character) === undefined) &&
    !FORBIDDEN.has(name);
  if (isPlain) return name;
  return `a_${characters.map((character) => getCharacterName(character) ?? character).join("")}a`;
};

// The temporal operators neither backend has a counterpart for, by the name tlapm reports.
const TEMPORAL_OPERATORS: Partial<Record<Builtin, [string, number]>> = {
  Leadsto: ["Leadsto", 2],
  ENABLED: ["ENABLED", 1],
  Cdot: ["\\cdot", 2],
  Actplus: ["-+->", 2],
  BoxTrue: ["[]", 1],
  BoxFalse: ["[]", 1],
  Diamond: ["<>", 1],
};

// Why a backend can't print an application of builtin, which it reports as where.
export const getUnprintableError = (builtin: Builtin, arity: number, where: string) => {
  const isFrontend = builtin === "Prime" || builtin === "StrongPrime" || builtin === "UNCHANGED";
  if (isFrontend && arity === 1) return new TlapmBugError();
  const temporal = TEMPORAL_OPERATORS[builtin];
  return temporal && temporal[1] === arity
    ? new TlaProverError(`Unsupported operator \`${temporal[0]}\`.\n`)
    : new TlaProverError(where);
};

interface SplitQuantifier {
  first: Bound;
  inner: Expr;
}

// A quantifier's first bound binds around a quantifier over the others, which move under it. A
// ditto after the first bound copies its domain.
export const splitFirstBound = (
  quantifier: "Forall" | "Exists",
  bounds: Bound[],
  body: Expr,
): SplitQuantifier => {
  const first = bounds[0];
  const rest = bounds.slice(1);
  const undittoed =
    rest[0]?.domain.kind === "Ditto"
      ? [{ ...rest[0], domain: first.domain }, ...rest.slice(1)]
      : rest;
  if (undittoed.length === 0) return { first, inner: body };
  return {
    first,
    inner: {
      kind: "Quant",
      quantifier,
      bounds: undittoed.map((other) =>
        other.domain.kind === "Domain"
          ? {
              ...other,
              domain: { kind: "Domain", expression: shiftExpr(1, other.domain.expression) },
            }
          : other,
      ),
      body,
      location: body.location,
    },
  };
};

// tlapm prints a fact to a formatter that drops its output first, to omit an unsupported one: the
// fact's print, or the error that omits it once the names it bound are out of scope.
export const printFact = <Printed>(context: Context, print: () => Printed) => {
  const depth = context.stack.length;
  try {
    return print();
  } catch (error) {
    if (!(error instanceof TlaUnsupportedError)) throw error;
    popNames(context, context.stack.length - depth);
    return error;
  }
};
