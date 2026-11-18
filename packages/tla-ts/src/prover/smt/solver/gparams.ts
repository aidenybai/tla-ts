import { SmtParseError } from "../../../errors";
import type { SExpr } from "./smtlib-parser";

interface ParameterKinds {
  bools: string;
  uints: string;
  doubles: string;
}

const PARAMETER_KINDS = new Map<string, ParameterKinds>([
  [
    "",
    {
      bools:
        "auto_config ctrl_c debug_ref_count dump_models model model_validate proof smtlib2_compliant stats suppress_platform_verbose trace type_check unsat_core warning well_sorted_check",
      uints:
        "memory_high_watermark memory_high_watermark_mb memory_max_alloc_count memory_max_size rlimit timeout verbose",
      doubles: "",
    },
  ],
  [
    "pi",
    {
      bools:
        "avoid_skolems block_loop_patterns decompose_patterns enabled pull_quantifiers use_database warnings",
      uints: "arith arith_weight max_multi_patterns non_nested_arith_weight",
      doubles: "",
    },
  ],
  [
    "tactic",
    {
      bools: "solve_eqs.context_solve solve_eqs.ite_solver solve_eqs.theory_solver",
      uints:
        "blast_term_ite.max_inflation blast_term_ite.max_steps lia2card.max_ite_nesting lia2card.max_range propagate_values.max_rounds randomizer.seed solve_eqs.max_occs",
      doubles: "",
    },
  ],
  [
    "pp",
    {
      bools:
        "bounded bv_literals bv_neg decimal fixed_indent flat_assoc fp_real_literals no_lets pretty_proof simplify_implies single_line",
      uints:
        "decimal_precision max_depth max_indent max_num_lines max_ribbon max_width min_alias_size",
      doubles: "",
    },
  ],
  [
    "sat",
    {
      bools:
        "abce acce anf anf.exlin asymm_branch asymm_branch.all asymm_branch.sampled ate bca bce branching.anti_exploration cardinality.solver cce core.minimize core.minimize_partial ddfw_search dimacs.core drat.activity drat.binary drat.check_sat drat.check_unsat drat.disable dyn_sub_res elim_vars enable_pre_simplify euf force_cleanup gc.burst gc.defrag local_search local_search_dbg_flips lookahead.double lookahead.global_autarky lookahead.preselect lookahead.use_learned lookahead_scores lookahead_simplify lookahead_simplify.bca minimize_lemmas override_incremental phase.sticky prob_search probing probing_binary probing_cache propagate.prefetch restart.fast retain_blocked_clauses scc scc.tr smt smt.proof.check subsumption",
      uints:
        "anf.delay asymm_branch.delay asymm_branch.limit asymm_branch.rounds backtrack.conflicts backtrack.scopes bce_at bce_delay blocked_clause_limit burst_search ddfw.init_clause_weight ddfw.reinit_base ddfw.restart_base ddfw.threads ddfw.use_reward_pct gc.increment gc.initial gc.k gc.small_lbd inprocess.max local_search_threads lookahead.cube.depth max_conflicts max_memory pb.min_arity probing_cache_limit probing_limit random_seed reorder.activity_scale reorder.base rephase.base resolution.cls_cutoff1 resolution.cls_cutoff2 resolution.limit resolution.lit_cutoff_range1 resolution.lit_cutoff_range2 resolution.lit_cutoff_range3 resolution.occ_cutoff resolution.occ_cutoff_range1 resolution.occ_cutoff_range2 resolution.occ_cutoff_range3 restart.initial restart.max search.sat.conflicts search.unsat.conflicts simplify.delay subsumption.limit threads variable_decay",
      doubles:
        "lookahead.cube.fraction lookahead.cube.freevars lookahead.cube.psat.clause_base lookahead.cube.psat.trigger lookahead.cube.psat.var_exp lookahead.delta_fraction random_freq reorder.itau restart.emafastglue restart.emaslowglue restart.factor restart.margin",
    },
  ],
  [
    "model",
    { bools: "compact completion inline_def partial user_functions v1 v2", uints: "", doubles: "" },
  ],
  [
    "solver",
    {
      bools:
        "axioms2files instantiations2console lemmas2console proof.check proof.check_rup proof.save proof.trim slice",
      uints: "timeout",
      doubles: "",
    },
  ],
  ["tptp", { bools: "leibniz_instantiation unfold_lambda_macros", uints: "", doubles: "" }],
  ["factor", { bools: "", uints: "max_prime max_search_size num_primes", doubles: "" }],
  [
    "parallel",
    {
      bools: "ablate_backtracking core_minimize cube.lookahead enable",
      uints:
        "conquer.backtrack_frequency conquer.batch_size conquer.delay conquer.restart.max num_bb_threads simplify.inprocess.max simplify.max_conflicts simplify.restart.max threads.max",
      doubles: "simplify.exp",
    },
  ],
  [
    "opt",
    {
      bools:
        "dump_benchmarks dump_models elim_01 enable_core_rotate enable_lns enable_sat enable_sls incremental maxlex.enable maxres.add_upper_bound_block maxres.hill_climb maxres.maximize_assignment maxres.pivot_on_correction_set maxres.wmax optsmt_dual_bounds optsmt_lex_after_unbounded optsmt_nlsat pareto_nlsat pareto_nlsat_reuse pb.compile_equality pp.neat pp.wcnf rc2.totalizer",
      uints:
        "lns_conflicts maxres.max_core_size maxres.max_correction_set_size maxres.max_num_cores optsmt_bisect_rounds optsmt_dual_bound_rlimit optsmt_nlsat_supremum_rlimit pareto_nlsat_max_lemmas rlimit timeout",
      doubles: "",
    },
  ],
  [
    "lp",
    {
      bools:
        "dio dio_cuts_enable_gomory dio_cuts_enable_hnf dio_ignore_big_nums dio_run_gcd lcube random_hammers",
      uints:
        "dio_branching_period dio_calls_period dio_calls_period_decrease dio_gomory_enable_period dio_undo_max_work int_hammer_period lcube_flips",
      doubles: "",
    },
  ],
  ["nnf", { bools: "ignore_labels sk_hack", uints: "max_memory", doubles: "" }],
  [
    "combined_solver",
    { bools: "ignore_solver1", uints: "solver2_timeout solver2_unknown", doubles: "" },
  ],
  [
    "algebraic",
    {
      bools: "factor",
      uints: "factor_max_prime factor_num_primes factor_search_size min_mag zero_accuracy",
      doubles: "",
    },
  ],
  [
    "rcf",
    {
      bools: "clean_denominators lazy_algebraic_normalization use_prem",
      uints: "inf_precision initial_precision max_precision",
      doubles: "",
    },
  ],
  [
    "model_evaluator",
    {
      bools: "array_as_stores array_equalities completion",
      uints: "max_memory max_steps",
      doubles: "",
    },
  ],
  ["ackermannization", { bools: "eager inc_sat_backend sat_backend", uints: "", doubles: "" }],
  [
    "sls",
    {
      bools:
        "arith_allow_plateau arith_use_clausal_lookahead arith_use_lookahead bv_allow_rotation bv_use_lookahead bv_use_top_level_assertions dt_axiomatic early_prune random_offset rescore restart_init track_unsat vns_repick walksat walksat_repick walksat_ucb walksat_ucb_init",
      uints:
        "max_memory max_repairs max_restarts paws_init paws_sp random_seed restart_base str_update_strategy vns_mc wp",
      doubles: "scale_unsat walksat_ucb_constant walksat_ucb_forget walksat_ucb_noise",
    },
  ],
  [
    "nlsat",
    {
      bools:
        "add_all_coeffs canonicalize check_lemmas dump_mathematica factor inline_vars log_lemma_smtrat log_lemmas lws lws_witness_subs_disc lws_witness_subs_lc minimize_conflicts randomize reorder shuffle_vars simple_check simplify_conflicts zero_disc",
      uints: "lazy lws_spt_threshold max_conflicts max_memory seed variable_ordering_strategy",
      doubles: "",
    },
  ],
  [
    "fp",
    {
      bools:
        "datalog.all_or_nothing_deltas datalog.compile_with_widening datalog.dbg_fpr_nonempty_relation_signature datalog.default_table_checked datalog.explanations_on_relation_level datalog.generate_explanations datalog.magic_sets_for_queries datalog.output_profile datalog.print.tuples datalog.similarity_compressor datalog.subsumption datalog.unbound_compressor datalog.use_map_names generate_proof_trace print_answer print_boogie_certificate print_certificate print_fixedpoint_extensions print_low_level_smt2 print_statistics print_with_variable_declarations spacer.ctp spacer.dump_benchmarks spacer.elim_aux spacer.eq_prop spacer.expand_bnd spacer.gg.concretize spacer.gg.conjecture spacer.gg.subsume spacer.global spacer.gpdr spacer.gpdr.bfs spacer.ground_pobs spacer.iuc.debug_proof spacer.iuc.old_hyp_reducer spacer.iuc.print_farkas_stats spacer.iuc.split_farkas_literals spacer.keep_proxy spacer.mbqi spacer.native_mbp spacer.p3.share_invariants spacer.p3.share_lemmas spacer.propagate spacer.push_pob spacer.q3 spacer.q3.instantiate spacer.q3.qgen.normalize spacer.q3.use_qgen spacer.reach_dnf spacer.reset_pob_queue spacer.restarts spacer.simplify_lemmas_post spacer.simplify_lemmas_pre spacer.simplify_pob spacer.use_array_eq_generalizer spacer.use_bg_invs spacer.use_derivations spacer.use_euf_gen spacer.use_inc_clause spacer.use_inductive_generalizer spacer.use_iuc spacer.use_lemma_as_cti spacer.use_lim_num_gen spacer.validate_lemmas spacer.weak_abs validate xform.array_blast xform.array_blast_full xform.bit_blast xform.coalesce_rules xform.coi xform.compress_unbound xform.elim_term_ite xform.fix_unbound_vars xform.inline_eager xform.inline_linear xform.inline_linear_branch xform.instantiate_arrays xform.instantiate_arrays.enforce xform.instantiate_quantifiers xform.magic xform.quantify_arrays xform.scale xform.slice xform.subsumption_checker xform.tail_simplifier_pve xform.transform_arrays",
      uints:
        "bmc.linear_unrolling_depth datalog.initial_restart_timeout datalog.profile_timeout_milliseconds datalog.similarity_compressor_threshold datalog.timeout rlimit spacer.arith.solver spacer.blast_term_ite_inflation spacer.iuc spacer.iuc.arith spacer.max_level spacer.max_num_contexts spacer.min_level spacer.order_children spacer.push_pob_max_depth spacer.random_seed spacer.restart_initial_threshold xform.elim_term_ite.inflation xform.instantiate_arrays.nb_quantifier xform.unfold_rules",
      doubles: "spacer.dump_threshold",
    },
  ],
  [
    "rewriter",
    {
      bools:
        "algebraic_number_evaluator arith_ineq_lhs arith_lhs bit2bool blast_distinct blast_eq_value blast_select_store bv_extract_prop bv_ite2id bv_le2extract bv_le_extra bv_not_simpl bv_sort_ac cache_all coalesce_chars elim_and elim_ite elim_rem elim_sign_ext elim_to_real enable_der eq2ineq expand_nested_stores expand_power expand_select_ite expand_select_store expand_store_eq expand_tan flat flat_and_or gcd_rounding hi_div0 hi_fp_unspecified hoist_ite hoist_mul ignore_patterns_on_ground_qbody ite_extra_rules local_ctx mul2concat mul_to_power pull_cheap_ite push_ite_arith push_ite_bv push_to_real rewrite_patterns som sort_disjunctions sort_store sort_sums split_concat_eq unfold_recursive_functions",
      uints:
        "blast_distinct_threshold bv_ineq_consistency_test_max div0_ackermann_limit local_ctx_limit max_degree max_memory max_power_expansion max_steps som_blowup",
      doubles: "",
    },
  ],
  [
    "parser",
    {
      bools: "error_for_visual_studio ignore_bad_patterns ignore_user_patterns",
      uints: "",
      doubles: "",
    },
  ],
  [
    "smt",
    {
      bools:
        "arith.auto_config_simplex arith.bprop_on_pivoted_rows arith.dump_bound_lemmas arith.dump_lemmas arith.eager_eq_axioms arith.enable_hnf arith.greatest_error_pivot arith.ignore_int arith.int_eq_branch arith.min arith.nl arith.nl.branching arith.nl.cross_nested arith.nl.expensive_patching arith.nl.expp arith.nl.grobner arith.nl.grobner_adaptive arith.nl.grobner_exp_delay arith.nl.grobner_expand_terms arith.nl.grobner_gcd_test arith.nl.grobner_perfect_squares arith.nl.grobner_propagate_quotients arith.nl.horner arith.nl.linearize_violated_monomials arith.nl.log arith.nl.monomial_binomial_sign arith.nl.monomial_sandwich arith.nl.nra arith.nl.nra_check_assignment arith.nl.optimize_bounds arith.nl.order arith.nl.order.binomial_sign arith.nl.propagate_linear_monomials arith.nl.reduce_pseudo_linear arith.nl.tangents arith.nl.tangents.box_corners arith.nl.transcendental arith.print_ext_var_names arith.print_stats arith.propagate_eqs arith.random_initial_value arith.validate array.extensional array.weak auto_config bound_simplifier bv.delay bv.enable_int2bv bv.reflect bv.size_reduce bv.watch_diseq candidate_models clause_proof core.extend_nonlocal_patterns core.extend_patterns core.minimize core.validate dack.eq delay_units distribute_forall elim_unconstrained ematching ff.adaptive_basis ff.adaptive_matrix ff.adaptive_reduction ff.basis_bits ff.basis_cache ff.batch ff.bit_bounds ff.bit_propagation ff.boolean_split ff.bounded_elimination ff.compact_encoding ff.compact_matrix ff.compact_retry ff.disjunctive_bits ff.div_masks ff.f4 ff.f4_value_split ff.factor_split ff.fused_reduction ff.geobucket ff.gm_pairs ff.lazy_matrix ff.linear_split ff.model_search ff.quotient_field ff.root_completion ff.root_split ff.small_coefficients ff.sparse_matrix_reducers ff.sparse_witness ff.sugar_pairs ff.tiny ff.unique ff.unique_equalities ho_matching ho_qmatcher induction macro_finder mbqi mbqi.trace pb.learn_complements propagate_values pull_nested_quantifiers q.lite qi.persist_instances qi.profile qi.update_generation qsat_use_qel quasi_macros recfun_finder refine_inj_axioms restricted_quasi_macros seq.regex_monadic seq.split_w_len seq.validate sls.enable sls.parallel solve_eqs solve_eqs.linear solve_eqs.non_ground term_enumeration theory_aware_branching theory_case_split up.persist_clauses",
      uints:
        "arith.branch_cut_ratio arith.nl.delay arith.nl.gr_q arith.nl.grobner_cnfl_to_report arith.nl.grobner_eqs_growth arith.nl.grobner_expr_degree_growth arith.nl.grobner_expr_size_growth arith.nl.grobner_frequency arith.nl.grobner_max_simplified arith.nl.grobner_row_length_limit arith.nl.grobner_subs_fixed arith.nl.horner_frequency arith.nl.horner_row_length_limit arith.nl.horner_subs_fixed arith.nl.monomial_sandwich.max_fanout arith.nl.nra_check_assignment_max_fail arith.nl.optimize_bounds_lp_max_vars arith.nl.rounds arith.propagation_mode arith.rep_freq arith.simplex_strategy arith.solver bv.solver case_split core.extend_patterns.max_distance cube_depth dack dack.gc dack.threshold delay_units_threshold dt_lazy_splits ff.basis_max_bytes ff.bv_fallback_limit ff.f4_budget ff.f4_max_quotient ff.f4_short_budget ff.f4_slice ff.max_factor_splits ff.max_steps ff.max_terms ff.tiny_budget ff.unique_depth ff.unique_nodes ff.unique_work ho_matching_bound lemma_gc_strategy max_conflicts mbqi.force_template mbqi.max_cexs mbqi.max_cexs_incr mbqi.max_iterations pb.conflict_frequency phase_caching_off phase_caching_on phase_selection q.lift_ite qi.max_instances qi.max_multi_patterns qi.max_persistent_instances qi.profile_freq qi.quick_checker random_seed relevancy restart.max restart_strategy seq.max_unfolding seq.min_unfolding seq.parikh_chars seq.parikh_k seq.parikh_n seq.regex_budget seq.regex_split threads threads.cube_frequency threads.max_conflicts",
      doubles:
        "arith.epsilon arith.nl.transcendental_tolerance dack.factor dack.gc_inv_decay qi.eager_threshold qi.lazy_threshold restart_factor",
    },
  ],
]);

const UINT_MAX = 4294967295n;

export const checkParameterValue = (name: string, value: string, token: SExpr) => {
  const dot = name.indexOf(".");
  const parameter = name.slice(dot + 1);
  const kinds = PARAMETER_KINDS.get(dot === -1 ? "" : name.slice(0, dot));
  if (kinds === undefined) return;
  if (kinds.uints.split(" ").includes(parameter)) {
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
  if (kinds.doubles.split(" ").includes(parameter) && !/^[0-9./-]*$/.test(value))
    throw new SmtParseError(
      `Expected values for parameter ${parameter} is a double. It was given argument '${value}'`,
      token,
    );
  if (kinds.bools.split(" ").includes(parameter) && value !== "true" && value !== "false")
    throw new SmtParseError(
      `Expected values for parameter ${parameter} are 'true' or 'false'. It was given argument '${value}'`,
      token,
    );
};
