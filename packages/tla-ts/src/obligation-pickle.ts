// tlapm's Tla_parser.pickle, which turns a TLA+ identifier into one every backend accepts: a name
// with a character other than a letter or digit, one that starts or ends with a non-letter, or one
// that a prover reserves becomes a_, the name with each special character spelled out, and a.

import { TlapmBugError } from "./errors";

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
