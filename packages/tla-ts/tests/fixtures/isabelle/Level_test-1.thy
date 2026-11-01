(* automatically generated -- do not edit manually *)
theory tlapm_cf8386 imports Constant Zenon begin
consts
  "isReal" :: c
  "isa_slas_a" :: "[c,c] => c"
  "isa_bksl_diva" :: "[c,c] => c"
  "isa_perc_a" :: "[c,c] => c"
  "isa_peri_peri_a" :: "[c,c] => c"
  "isInfinity" :: c
  "isa_lbrk_rbrk_a" :: "[c] => c"
  "isa_less_more_a" :: "[c] => c"

(* Generated from file "./Level_test.tla", line 118, characters 5-6 *)
lemma ob'1: (* e191809be851dc62f76fe7a74dae5abe *)
(* usable definition CONSTANT_EnabledWrapper_ suppressed *)
(* usable definition CONSTANT_CdotWrapper_ suppressed *)
fixes a_CONSTANTunde_cunde_a
fixes a_VARIABLEunde_xunde_a a_VARIABLEunde_xunde_a'
fixes a_VARIABLEunde_yunde_a a_VARIABLEunde_yunde_a'
(* usable definition STATE_P_ suppressed *)
(* usable definition CONSTANT_f_ suppressed *)
(* usable definition CONSTANT_h_ suppressed *)
shows "(\<exists>a_CONSTANTunde_yhash_enabledhash_prime1unde_a : (\<exists>a_CONSTANTunde_xhash_enabledhash_prime1unde_a : ((cond((a_VARIABLEunde_xunde_a), (a_CONSTANTunde_xhash_enabledhash_prime1unde_a), (a_CONSTANTunde_cunde_a))) & ((addint (((succ[0])), ((succ[succ[0]]))))) & (subsetOf(({((succ[0])), ((succ[succ[0]]))}), %a_CONSTANTunde_runde_a. (TRUE))) & (subsetOf(({((succ[0])), ((succ[succ[0]]))}), %a_CONSTANTunde_runde_a. (a_CONSTANTunde_cunde_a))) & (subsetOf(({((succ[0])), ((succ[succ[0]]))}), %a_CONSTANTunde_runde_a. (a_VARIABLEunde_xunde_a))) & (subsetOf(({((succ[0])), ((succ[succ[0]]))}), %a_CONSTANTunde_runde_a. (a_CONSTANTunde_xhash_enabledhash_prime1unde_a))) & (subsetOf(({((succ[0])), ((succ[succ[0]]))}), %a_CONSTANTunde_runde_a. ((addint ((a_CONSTANTunde_runde_a), ((succ[0]))))))) & (subsetOf(({((succ[0])), ((succ[succ[0]]))}), %a_CONSTANTunde_runde_a. ((addint ((a_CONSTANTunde_runde_a), (a_VARIABLEunde_xunde_a)))))) & (subsetOf(({((succ[0])), ((succ[succ[0]]))}), %a_CONSTANTunde_runde_a. ((addint ((a_CONSTANTunde_runde_a), (a_CONSTANTunde_xhash_enabledhash_prime1unde_a)))))) & (subsetOf((a_VARIABLEunde_xunde_a), %a_CONSTANTunde_runde_a. (TRUE))) & (subsetOf((a_CONSTANTunde_xhash_enabledhash_prime1unde_a), %a_CONSTANTunde_runde_a. (TRUE))) & (setOfAll((a_VARIABLEunde_xunde_a), %a_CONSTANTunde_gunde_a. ((a_CONSTANTunde_funde_a ((a_CONSTANTunde_gunde_a)))))) & (setOfAll((a_CONSTANTunde_xhash_enabledhash_prime1unde_a), %a_CONSTANTunde_gunde_a. ((a_CONSTANTunde_funde_a ((a_CONSTANTunde_gunde_a)))))) & (