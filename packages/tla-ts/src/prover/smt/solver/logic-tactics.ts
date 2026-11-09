// Ported from Z3 (src/tactic/smtlogics/*.cpp, src/tactic/portfolio/default_tactic.cpp,
// src/tactic/ufbv/ufbv_tactic.cpp, src/nlsat/tactic/qfnra_nlsat_tactic.cpp), MIT license, see
// z3-license.txt.

const BV2SAT =
  "(using-params (and-then simplify propagate-values solve-eqs max-bv-sharing bit-blast aig " +
  "(using-params sat :flat false :som false :gc dyn_psm)) :flat false :som false :gc dyn_psm)";

const QFLIA_PREAMBLE =
  "(and-then simplify propagate-values (using-params ctx-simplify :max_depth 30 " +
  ":max_steps 5000000) (using-params simplify :pull_cheap_ite true :push_ite_arith false " +
  ":local_ctx true :local_ctx_limit 10000000 :hoist_ite true) solve-eqs (using-params lia2card " +
  ":lia2card.max_range 1 :lia2card.max_ite_nesting 1) elim-uncnstr)";

const getNoCutSmt = (seed: number) =>
  `(using-params smt :smt.logic QF_LIA :arith.branch_cut_ratio 10000000 :random_seed ${seed})`;

const LIA2SAT =
  "(and-then (fail-if is-unbounded) (fail-if produce-proofs) (fail-if produce-unsat-cores) " +
  "propagate-ineqs normalize-bounds lia2pb (using-params pb2bv :pb2bv_all_clauses_limit 8) " +
  `(fail-if (not is-qfbv)) (using-params ${BV2SAT} :ite_extra true))`;

const ILP_MODEL_FINDER =
  "(and-then (fail-if (not (and is-ilp is-unbounded))) (fail-if produce-proofs) " +
  `(fail-if produce-unsat-cores) propagate-ineqs (or-else (try-for ${getNoCutSmt(100)} 2000) ` +
  `(and-then (using-params add-bounds :add_bound_lower -16 :add_bound_upper 15) ` +
  `(try-for ${LIA2SAT} 5000)) (try-for ${getNoCutSmt(200)} 5000) (and-then ` +
  `(using-params add-bounds :add_bound_lower -32 :add_bound_upper 31) (try-for ${LIA2SAT} ` +
  "10000))) fail-if-undecided)";

const PB =
  "(and-then (fail-if (not is-pb)) (fail-if produce-proofs) (fail-if produce-unsat-cores) " +
  "(or-else (and-then (fail-if (>= num-exprs 80000)) (fail-if (not is-ilp)) " +
  "fail-if-undecided) (and-then (using-params pb2bv :pb2bv_all_clauses_limit 8) " +
  `(fail-if (not is-qfbv)) (using-params ${BV2SAT} :ite_extra true))))`;

const BOUNDED =
  `(and-then (fail-if is-unbounded) (or-else (try-for ${getNoCutSmt(100)} 5000) (try-for ` +
  "(using-params smt :arith.branch_cut_ratio 10000000 :random_seed 200 :relevancy 0) 5000) " +
  `(try-for ${getNoCutSmt(300)} 15000)) fail-if-undecided)`;

const QFLIA =
  `(using-params (and-then ${QFLIA_PREAMBLE} (using-params simplify :arith_lhs true) ` +
  `(or-else ${ILP_MODEL_FINDER} ${PB} (and-then (fail-if (not is-quasi-pb)) ` +
  `(using-params ${LIA2SAT} :lia2pb_max_bits 64) fail-if-undecided) ${BOUNDED} smt)) ` +
  ":elim_and true :som true :blast_distinct true :blast_distinct_threshold 128 " +
  ":lia2card.max_range 1 :lia2card.max_ite_nesting 1)";

const QFIDL_BV_SOLVER =
  "(using-params (and-then simplify propagate-values solve-eqs max-bv-sharing bit-blast aig " +
  "sat) :flat false :som false :gc dyn_psm)";

const QFIDL =
  "(if (and (< num-consts 5000) (not produce-proofs) (not produce-unsat-cores)) " +
  "(using-params (and-then (and-then (and-then simplify fix-dl-var propagate-values " +
  "elim-uncnstr) (and-then solve-eqs (using-params simplify :arith_lhs true) propagate-values " +
  "normalize-bounds solve-eqs)) (or-else (using-params diff-neq :diff_neq_max_k 25) (and-then " +
  "(using-params lia2pb :lia2pb_max_bits 4) propagate-ineqs (using-params pb2bv " +
  `:pb2bv_all_clauses_limit 8) (fail-if (not is-qfbv)) ${QFIDL_BV_SOLVER}) smt)) ` +
  ":elim_and true :blast_distinct true :som true) smt)";

const getQfnraNlsat = (isFactoring: boolean) =>
  "(and-then (and-then (using-params simplify :elim_and true :blast_distinct true) " +
  "(using-params purify-arith :complete false) propagate-values solve-eqs elim-uncnstr " +
  "elim-term-ite (using-params purify-arith :complete false)) (and-then " +
  `${isFactoring ? "factor" : "skip"} solve-eqs (using-params purify-arith :complete false) ` +
  "(using-params simplify :elim_and true :blast_distinct true) tseitin-cnf-core " +
  "(using-params simplify :elim_and true :blast_distinct true) nlsat))";

const QFNIA_BV_SOLVER =
  "(using-params (and-then simplify propagate-values (using-params simplify :local_ctx true " +
  ":local_ctx_limit 10000000) max-bv-sharing (using-params bit-blast :max_memory 100 " +
  ":max_conflicts 500) (using-params sat :max_memory 100 :max_conflicts 500)) :flat false " +
  ":hi_div0 true :elim_and true :blast_distinct true)";

const QFNIA_SMT_SOLVER = "(and-then (using-params simplify :som true) smt)";

const QFNIA =
  "(and-then (and-then simplify propagate-values solve-eqs (using-params ctx-simplify " +
  ":max_depth 30 :max_steps 5000000) (using-params simplify :pull_cheap_ite true :local_ctx " +
  "true :local_ctx_limit 10000000) elim-uncnstr (using-params lia2card :lia2card.max_range 1 " +
  ":lia2card.max_ite_nesting 1) card2bv (skip-if-failed (using-params cofactor-term-ite " +
  ":max_memory 20))) (or-else (and-then (using-params simplify :hoist_mul true) (using-params " +
  `nla2bv :nla2bv_max_bv_size 64) (skip-if-failed ${QFNIA_BV_SOLVER}) fail-if-undecided) ` +
  `(try-for ${QFNIA_SMT_SOLVER} 2000) (and-then (using-params simplify :som true) (try-for ` +
  `(using-params ${getQfnraNlsat(false)} :som true) 3000) fail-if-undecided) ` +
  `${QFNIA_SMT_SOLVER}))`;

const QUANT_PREPROCESSOR = (isSolvingEqs: boolean) =>
  "(and-then simplify propagate-values (using-params ctx-simplify :max_depth 30 :max_steps " +
  "5000000) (using-params simplify :pull_cheap_ite true :local_ctx true :local_ctx_limit " +
  `10000000) ${isSolvingEqs ? "(when (not has-patterns) solve-eqs)" : "skip"} elim-uncnstr ` +
  "simplify)";

const LRA =
  `(and-then ${QUANT_PREPROCESSOR(true)} qe-light (if has-quantifiers (if is-lira (or-else ` +
  "qsat smt) smt) smt))";

const DER_FP = "(repeat (and-then der simplify) 5)";

const UFBV_PREPROCESSOR =
  "(and-then (and-then simplify propagate-values (and-then (if-no-proofs (if-no-unsat-cores " +
  "(using-params macro-finder :elim_and false))) simplify) (and-then snf simplify) elim-and " +
  `solve-eqs (and-then ${DER_FP} simplify) (and-then distribute-forall simplify)) ` +
  "(if-no-unsat-cores (and-then (and-then reduce-args simplify) (and-then macro-finder " +
  "simplify) (and-then ufbv-rewriter simplify) (and-then quasi-macros simplify))) " +
  `(and-then ${DER_FP} simplify) simplify)`;

const UFBV =
  `(using-params (and-then (repeat ${UFBV_PREPROCESSOR} 2) smt) :mbqi true ` +
  ":mbqi.max_iterations 4294967295 :elim_and true)";

const QFBV_PREAMBLE =
  "(and-then (using-params simplify :flat_and_or false) (using-params propagate-values " +
  ":flat_and_or false) (using-params solve-eqs :solve_eqs_max_occs 2) elim-uncnstr " +
  "bv-divrem-bounds (if-no-proofs (if-no-unsat-cores reduce-bv-size)) (using-params simplify " +
  ":som true :pull_cheap_ite true :push_ite_bv false :local_ctx true :local_ctx_limit 10000000 " +
  ":flat true :hoist_mul false :flat_and_or false) (using-params simplify :hoist_mul true :som " +
  "false :flat_and_or false) max-bv-sharing (if-no-proofs (if-no-unsat-cores ackermannize_bv)))";

// Z3 skips this simplification past 300 MB of memory, which the port does not track.
const QFBV =
  `(using-params (and-then ${QFBV_PREAMBLE} (if is-qfbv-eq (and-then bv1-blast (using-params ` +
  "smt :preprocess false)) (if is-qfbv (and-then bit-blast (and-then (using-params (and-then " +
  "simplify solve-eqs) :local_ctx true :flat false :flat_and_or false) (if-no-proofs aig)) " +
  "(if produce-proofs (and-then simplify smt) psat)) smt))) :elim_and true " +
  ":push_ite_bv true :blast_distinct true)";

const QFAUFLIA =
  "(and-then (using-params (and-then simplify propagate-values solve-eqs elim-uncnstr simplify) " +
  ":elim_and true :som true :sort_store true) (using-params smt :array.simplify false))";

const QFUF =
  "(and-then simplify propagate-values solve-eqs (using-params simplify :pull_cheap_ite true " +
  ":local_ctx true :local_ctx_limit 10000000) (if-no-proofs (if-no-unsat-cores " +
  "symmetry-reduce)) smt)";

const DEFAULT =
  "(and-then simplify (if (and is-propositional (not produce-proofs)) qffd (if is-qfbv qfbv " +
  "(if is-qfaufbv qfaufbv (if is-qflia qflia (if is-qfauflia qfauflia (if is-qflra qflra (if " +
  "is-qfnra qfnra (if is-qfnia qfnia (if is-lira lira (if is-nra nra (if is-qffp qffp (if " +
  `is-qffplra qffplra (and-then ${QFLIA_PREAMBLE} smt))))))))))))))`;

export const LOGIC_TACTICS: ReadonlyMap<string, string> = new Map([
  ["qflia", QFLIA],
  ["qfidl", QFIDL],
  ["qfnia", QFNIA],
  ["qfnra-nlsat", getQfnraNlsat(true)],
  ["qflra", "(using-params smt :arith.greatest_error_pivot true)"],
  ["lra", LRA],
  ["lia", LRA],
  ["lira", LRA],
  ["uflra", `(and-then ${QUANT_PREPROCESSOR(true)} smt)`],
  ["auflira", `(and-then ${QUANT_PREPROCESSOR(true)} smt)`],
  ["aufnira", `(and-then ${QUANT_PREPROCESSOR(true)} smt)`],
  [
    "auflia",
    `(and-then ${QUANT_PREPROCESSOR(false)} (or-else (and-then (fail-if (> num-exprs 128)) ` +
      "(using-params smt :qi.cost 0) fail-if-undecided) smt))",
  ],
  ["ufnia", `(and-then ${QUANT_PREPROCESSOR(false)} qe-light smt)`],
  ["ufbv", UFBV],
  ["bv", UFBV],
  ["qfbv", QFBV],
  ["qfauflia", QFAUFLIA],
  ["qfuf", QFUF],
  ["default", DEFAULT],
]);
