import { SmtInvariantError, SmtParseError } from "../../../errors";
import { Rational } from "./rational";
import type { SExpr } from "./smtlib-parser";
import { Z3_PARAMETERS } from "./z3-parameters-text";

export const PARAM_BOOL = "bool";
export const PARAM_UINT = "unsigned int";
export const PARAM_SYMBOL = "symbol";
export const PARAM_NUMERAL = "double";
export const PARAM_STRING = "string";

interface Z3Parameter {
  kind: string;
  defaultValue: string;
}

const getModuleRows = (moduleName: string) => {
  const header = moduleName === "" ? "Global parameters\n" : `\n[module] ${moduleName}\n`;
  const start = Z3_PARAMETERS.indexOf(header);
  if (start === -1) return undefined;
  const rowsStart = start + header.length - 1;
  const end = Z3_PARAMETERS.indexOf("\n[module] ", rowsStart);
  return Z3_PARAMETERS.slice(rowsStart, end === -1 ? Z3_PARAMETERS.length : end);
};

const findParameter = (rows: string, parameterName: string) => {
  const rowStart = `\n  ${parameterName} (`;
  const start = rows.indexOf(rowStart);
  if (start === -1) return undefined;
  const kindStart = start + rowStart.length;
  const kindEnd = rows.indexOf(")", kindStart);
  const rowEnd = rows.indexOf("\n", kindEnd);
  const end = rowEnd === -1 ? rows.length : rowEnd;
  return {
    kind: rows.slice(kindStart, kindEnd),
    defaultValue: kindEnd === end - 1 ? "" : rows.slice(kindEnd + ") (default: ".length, end - 1),
  };
};

const OLD_PARAMETER_NAMES =
  "arith_adaptive arith_adaptive_assertion_threshold arith_adaptive_gcd arith_adaptive_propagation_threshold arith_add_binary_bounds arith_blands_rule_threshold arith_branch_cut_ratio arith_dump_lemmas arith_eager_eq_axioms arith_eager_gcd arith_eq_bounds arith_euclidean_solver arith_expand_eqs arith_force_simplex arith_gcd_test arith_ignore_int arith_lazy_adapter arith_lazy_pivoting arith_max_lemma_size arith_process_all_eqs arith_propagate_eqs arith_propagation_mode arith_propagation_threshold arith_prop_strategy arith_random_initial_value arith_random_lower arith_random_seed arith_random_upper arith_reflect arith_skip_big_coeffs arith_small_lemma_size arith_solver arith_stronger_lemmas array_always_prop_upward array_canonize array_cg array_delay_exp_axiom array_extensional array_laziness array_lazy_ieq array_lazy_ieq_delay array_solver array_weak async_commands at_labels_cex auto_config bb_eager bb_ext_gates bb_quantifiers bin_clauses bit2int bv2int_distribute bv_blast_max_size bv_cc bv_enable_int2bv_propagation bv_lazy_le bv_max_sharing bv_reflect bv_solver case_split check_at_labels check_proof cnf_factor cnf_mode context_simplifier dack dack_eq dack_factor dack_gc dack_gc_inv_decay dack_threshold default_qid default_table default_table_checked delay_units delay_units_threshold der display_config display_dot_proof display_error_for_visual_studio display_features display_proof display_unsat_core distribute_forall dt_lazy_splits dump_goal_as_smt elim_and elim_bounds elim_nlarith_quantifiers elim_quantifiers elim_term_ite ematching engine eq_propagation hi_div0 ignore_bad_patterns ignore_setparameter instruction_max inst_gen interactive internalizer_nnf lemma_gc_factor lemma_gc_half lemma_gc_initial lemma_gc_new_clause_activity lemma_gc_new_clause_relevancy lemma_gc_new_old_ratio lemma_gc_old_clause_activity lemma_gc_old_clause_relevancy lemma_gc_strategy lift_ite lookahead_diseq macro_finder max_conflicts max_counterexamples mbqi mbqi_force_template mbqi_max_cexs mbqi_max_cexs_incr mbqi_max_iterations mbqi_trace minimize_lemmas model model_compact model_completion model_display_arg_sort model_hide_unused_partitions model_on_final_check model_on_timeout model_partial model_v1 model_v2 model_validate new_core2th_eq ng_lift_ite nl_arith nl_arith_branching nl_arith_gb nl_arith_gb_eqs nl_arith_gb_perturbate nl_arith_gb_threshold nl_arith_max_degree nl_arith_rounds nnf_factor nnf_ignore_labels nnf_mode nnf_sk_hack order order_var_weight order_weights phase_selection pi_arith pi_arith_weight pi_avoid_skolems pi_block_looop_patterns pi_max_multi_patterns pi_non_nested_arith_weight pi_nopat_weight pi_pull_quantifiers pi_use_database pi_warnings pp_bounded pp_bv_literals pp_bv_neg pp_decimal pp_decimal_precision pp_fixed_indent pp_flat_assoc pp_max_depth pp_max_indent pp_max_num_lines pp_max_ribbon pp_max_width pp_min_alias_size pp_simplify_implies pp_single_line precedence precedence_gen pre_demodulator pre_simplifier pre_simplify_expr profile_res_sub progress_sampling_freq proof_mode propagate_booleans propagate_values pull_cheap_ite_trees pull_nested_quantifiers qi_conservative_final_check qi_cost qi_eager_threshold qi_lazy_instantiation qi_lazy_quick_checker qi_lazy_threshold qi_max_eager_multi_patterns qi_max_instances qi_max_lazy_multi_pattern_matching qi_new_gen qi_profile qi_profile_freq qi_promote_unsat qi_quick_checker quasi_macros random_case_split_freq random_initial_activity random_seed recent_lemma_threshold reduce_args refine_inj_axiom relevancy relevancy_lemma rel_case_split_order restart_adaptive restart_agility_threshold restart_factor restart_initial restart_strategy restricted_quasi_macros simplify_clauses smtlib2_compliant smtlib_category smtlib_dump_lemmas smtlib_logic smtlib_source_info smtlib_trace_path soft_timeout solver spc_bs spc_es spc_factor_subsumption_index_opt spc_initial_subsumption_index_opt spc_max_subsumption_index_features spc_min_func_freq_subsumption_index spc_num_iterations spc_trace statistics strong_context_simplifier tick trace trace_file_name type_check user_theory_persist_axioms user_theory_preprocess_axioms verbose warning well_sorted_check z3_solver_ll_pp z3_solver_smt_pp";

const PARAMETER_RENAMES =
  "proof_mode proof soft_timeout timeout mbqi smt.mbqi relevancy smt.relevancy ematching smt.ematching macro_finder smt.macro_finder delay_units smt.delay_units case_split smt.case_split phase_selection smt.phase_selection restart_strategy smt.restart_strategy restart_factor smt.restart_factor arith_random_initial_value smt.arith.random_initial_value bv_reflect smt.bv.reflect bv_enable_int2bv_propagation smt.bv.enable_int2bv qi_cost smt.qi.cost qi_eager_threshold smt.qi.eager_threshold nl_arith smt.arith.nl pull_nested_quantifiers smt.pull_nested_quantifiers nnf_sk_hack nnf.sk_hack model_v2 model.v2 pi_non_nested_arith_weight pi.non_nested_arith_weight pi_warnings pi.warnings pp_decimal pp.decimal pp_decimal pp.decimal_precision pp_bv_literals pp.bv_literals pp_bv_neg pp.bv_neg pp_max_depth pp.max_depth pp_min_alias_size pp.min_alias_size";

// smt.arith.nl.rounds only bounds arith.solver 2, which the port does not use.
const PORTED_PARAMETERS = new Map([
  [
    "rewriter",
    "algebraic_number_evaluator arith_ineq_lhs arith_lhs blast_distinct blast_distinct_threshold bv_ineq_consistency_test_max elim_and expand_power expand_tan flat flat_and_or gcd_rounding hi_div0 hoist_ite hoist_mul local_ctx local_ctx_limit max_degree max_memory mul2concat pull_cheap_ite push_ite_bv som sort_store sort_sums split_concat_eq",
  ],
  [
    "smt",
    "arith.branch_cut_ratio arith.nl.rounds auto_config case_split ematching mbqi mbqi.max_iterations qi.cost qi.eager_threshold qi.lazy_threshold random_seed relevancy",
  ],
  ["nnf", "ignore_labels max_memory mode"],
  ["nlsat", "factor seed shuffle_vars variable_ordering_strategy"],
  [
    "sat",
    "abce acce asymm_branch asymm_branch.all asymm_branch.delay asymm_branch.limit asymm_branch.rounds asymm_branch.sampled ate backtrack.conflicts backtrack.scopes bce bce_at bce_delay blocked_clause_limit burst_search cce dyn_sub_res elim_vars enable_pre_simplify euf force_cleanup gc gc.burst gc.defrag gc.increment gc.initial gc.k gc.small_lbd inprocess.max max_conflicts max_memory minimize_lemmas override_incremental phase probing probing_binary probing_cache probing_cache_limit probing_limit random_seed rephase.base resolution.cls_cutoff1 resolution.cls_cutoff2 resolution.limit resolution.lit_cutoff_range1 resolution.lit_cutoff_range2 resolution.lit_cutoff_range3 resolution.occ_cutoff resolution.occ_cutoff_range1 resolution.occ_cutoff_range2 resolution.occ_cutoff_range3 restart restart.fast restart.initial restart.max scc scc.tr search.sat.conflicts search.unsat.conflicts simplify.delay subsumption subsumption.limit variable_decay",
  ],
]);

const UINT_MAX = 4294967295n;

const splitParameterName = (name: string) => {
  const dot = name.indexOf(".");
  return { moduleName: dot === -1 ? "" : name.slice(0, dot), parameterName: name.slice(dot + 1) };
};

const findZ3Parameter = (moduleName: string, parameterName: string) => {
  const rows = getModuleRows(moduleName);
  return rows === undefined ? undefined : findParameter(rows, parameterName);
};

export const getZ3Parameter = (moduleName: string, parameterName: string): Z3Parameter => {
  const parameter = findZ3Parameter(moduleName, parameterName);
  if (parameter === undefined)
    throw new SmtInvariantError(`Z3 has no parameter ${parameterName} at module ${moduleName}`);
  return parameter;
};

export const isPortedParameter = (moduleName: string, parameterName: string) =>
  PORTED_PARAMETERS.get(moduleName)?.split(" ").includes(parameterName) === true;

export const isDoubleParameter = (name: string) => {
  const split = splitParameterName(name);
  return findZ3Parameter(split.moduleName, split.parameterName)?.kind === PARAM_NUMERAL;
};

export const getDoubleParameter = (parameters: ReadonlyMap<string, string>, name: string) => {
  const value = parameters.get(name);
  return value === undefined ? undefined : Number(value);
};

const getNewParameterName = (parameterName: string) => {
  const renames = PARAMETER_RENAMES.split(" ");
  for (let index = 0; index < renames.length; index += 2)
    if (renames[index] === parameterName) return renames[index + 1];
  return undefined;
};

const getUnknownParameterMessage = (parameterName: string, listing: string, moduleName: string) => {
  if (moduleName !== "")
    return `unknown parameter '${parameterName}' at module '${moduleName}'\nLegal parameters are:\n${listing}`;
  const newName = getNewParameterName(parameterName);
  if (newName !== undefined)
    return `the parameter '${parameterName}', invoke 'z3 -p' to obtain the new parameter list, and 'z3 -pp:${newName}' for the full description of the parameter`;
  if (OLD_PARAMETER_NAMES.split(" ").includes(parameterName))
    return `unknown parameter '${parameterName}', this is an old parameter name, invoke 'z3 -p' to obtain the new parameter list`;
  return `unknown parameter '${parameterName}'\nLegal parameters are:\n${listing}`;
};

// Z3's rational parser skips any character it doesn't expect.
const getDigits = (text: string) => BigInt(`0${text.replace(/[^0-9]/g, "")}`);

const getDouble = (value: string, token: SExpr) => {
  const split = value.search(/[./]/);
  const whole = getDigits(split === -1 ? value : value.slice(0, split));
  const rest = split === -1 ? "" : value.slice(split + 1).replace(/[^0-9]/g, "");
  if (value[split] === "/" && getDigits(rest) === 0n)
    throw new SmtParseError("division by zero", token);
  const scale = 10n ** BigInt(rest.length);
  const magnitude =
    value[split] === "/"
      ? Rational.of(whole, getDigits(rest))
      : Rational.of(whole * scale + getDigits(rest), scale);
  return (value.startsWith("-") ? magnitude.neg() : magnitude).toDouble();
};

export const getParameterValue = (name: string, value: string, token: SExpr) => {
  const split = splitParameterName(name);
  const parameter = split.parameterName;
  const rows = getModuleRows(split.moduleName);
  if (rows === undefined)
    throw new SmtParseError(`invalid parameter, unknown module '${split.moduleName}'`, token);
  const kind = findParameter(rows, parameter)?.kind;
  if (kind === undefined)
    throw new SmtParseError(
      getUnknownParameterMessage(parameter, rows.slice(1), split.moduleName),
      token,
    );
  if (kind === PARAM_UINT) {
    if (!/^[0-9]*$/.test(value))
      throw new SmtParseError(
        `Expected values for parameter ${parameter} is an unsigned integer. It was given argument '${value}'`,
        token,
      );
    if (value === "" || BigInt(value) > UINT_MAX)
      throw new SmtParseError(
        `invalid value '${value}' for unsigned int parameter '${parameter}'`,
        token,
      );
  }
  if (kind === PARAM_BOOL && value !== "true" && value !== "false")
    throw new SmtParseError(
      `Expected values for parameter ${parameter} are 'true' or 'false'. It was given argument '${value}'`,
      token,
    );
  if (kind !== PARAM_NUMERAL) return value;
  if (!/^[0-9./-]*$/.test(value))
    throw new SmtParseError(
      `Expected values for parameter ${parameter} is a double. It was given argument '${value}'`,
      token,
    );
  return String(getDouble(value, token));
};
