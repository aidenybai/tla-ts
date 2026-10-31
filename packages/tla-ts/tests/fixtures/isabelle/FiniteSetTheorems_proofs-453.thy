(* automatically generated -- do not edit manually *)
theory tlapm_a4ff3d imports Constant Zenon begin
consts
  "isReal" :: c
  "isa_slas_a" :: "[c,c] => c"
  "isa_bksl_diva" :: "[c,c] => c"
  "isa_perc_a" :: "[c,c] => c"
  "isa_peri_peri_a" :: "[c,c] => c"
  "isInfinity" :: c
  "isa_lbrk_rbrk_a" :: "[c] => c"
  "isa_less_more_a" :: "[c] => c"

(* Generated from file "./FiniteSetTheorems_proofs.tla", line 624, characters 3-4 *)
lemma ob'453: (* c9ba5e52010c089dad14297009b82b6e *)
(* usable definition CONSTANT_IsFiniteSet_ suppressed *)
(* usable definition CONSTANT_Cardinality_ suppressed *)
(* usable definition CONSTANT_MapThenFoldSet_ suppressed *)
(* usable definition CONSTANT_Restrict_ suppressed *)
(* usable definition CONSTANT_RestrictDomain_ suppressed *)
(* usable definition CONSTANT_RestrictValues_ suppressed *)
(* usable definition CONSTANT_IsRestriction_ suppressed *)
(* usable definition CONSTANT_Range_ suppressed *)
(* usable definition CONSTANT_Pointwise_ suppressed *)
(* usable definition CONSTANT_Inverse_ suppressed *)
(* usable definition CONSTANT_AntiFunction_ suppressed *)
(* usable definition CONSTANT_IsInjective_ suppressed *)
(* usable definition CONSTANT_Injection_ suppressed *)
(* usable definition CONSTANT_Surjection_ suppressed *)
(* usable definition CONSTANT_Bijection_ suppressed *)
(* usable definition CONSTANT_ExistsInjection_ suppressed *)
(* usable definition CONSTANT_ExistsSurjection_ suppressed *)
(* usable definition CONSTANT_ExistsBijection_ suppressed *)
(* usable definition CONSTANT_FoldFunctionOnSet_ suppressed *)
(* usable definition CONSTANT_FoldFunction_ suppressed *)
(* usable definition CONSTANT_SumFunctionOnSet_ suppressed *)
(* usable definition CONSTANT_SumFunction_ suppressed *)
(* usable definition CONSTANT_NatInductiveDefHypothesis_ suppressed *)
(* usable definition CONSTANT_NatInductiveDefConclusion_ suppressed *)
(* usable definition CONSTANT_FiniteNatInductiveDefHypothesis_ suppressed *)
(* usable definition CONSTANT_FiniteNatInductiveDefConclusion_ suppressed *)
(* usable definition CONSTANT_IsTransitivelyClosedOn_ suppressed *)
(* usable definition CONSTANT_IsWellFoundedOn_ suppressed *)
(* usable definition CONSTANT_SetLessThan_ suppressed *)
(* usable definition CONSTANT_WFDefOn_ suppressed *)
(* usable definition CONSTANT_OpDefinesFcn_ suppressed *)
(* usable definition CONSTANT_WFInductiveDefines_ suppressed *)
(* usable definition CONSTANT_WFInductiveUnique_ suppressed *)
(* usable definition CONSTANT_TransitiveClosureOn_ suppressed *)
(* usable definition CONSTANT_OpToRel_ suppressed *)
(* usable definition CONSTANT_PreImage_ suppressed *)
(* usable definition CONSTANT_LexPairOrdering_ suppressed *)
(* usable definition CONSTANT_LexProductOrdering_ suppressed *)
(* usable definition CONSTANT_EnabledWrapper_ suppressed *)
(* usable definition CONSTANT_CdotWrapper_ suppressed *)
(* usable definition CONSTANT_FiniteSubsetsOf_ suppressed *)
(* usable definition CONSTANT_StrictSubsetOrdering_ suppressed *)
fixes a_CONSTANTunde_Sunde_a
assumes v'189: "(\<forall> a_CONSTANTunde_Tunde_a \<in> ((a_CONSTANTunde_FiniteSubsetsOfunde_a ((a_CONSTANTunde_Sunde_a)))) : ((((a_CONSTANTunde_Cardinalityunde_a ((a_CONSTANTunde_Tunde_a)))) \<in> (Nat))))"
assumes v'190: "((\<And> a_CONSTANTunde_Sunde_a_1 :: c. (\<And> a_CONSTANTunde_Tunde_a :: c. (\<And> a_CONSTANTunde_Runde_a :: c. (\<And> a_CONSTANTunde_funde_a :: c => c. ((\<forall> a_CONSTANTunde_sunde_a \<in> (a_CONSTANTunde_Sunde_a_1) : ((((a_CONSTANTunde_funde_a ((a_CONSTANTunde_sunde_a)))) \<in> (a_CONSTANTunde_Tunde_a)))) \<Longrightarrow> (((a_CONSTANTunde_IsWellFoundedOnunde_a ((a_CONSTANTunde_Runde_a), (a_CONSTANTunde_Tunde_a)))) \<Longrightarrow> ((a_CONSTANTunde_IsWellFoundedOnunde_a (((a_CONSTANTunde_PreImageunde_a ((a_CONSTANTunde_funde_a), (a_CONSTANTunde_Sunde_a_1), (a_CONSTANTunde_Runde_a)))), (a_CONSTANTunde_Sunde_a_1)))))))))))"
assumes v'191: "((a_CONSTANTunde_IsWellFoundedOnunde_a (((a_CONSTANTunde_OpToRelunde_a ((\<lambda> a_Unknownunde_x1unde_a a_Unknownunde_x2unde_a . ((less ((a_Unknownunde_x1unde_a), (a_Unknownunde_x2unde_a))))), (Nat)))), (Nat))))"
shows "((a_CONSTANTunde_IsWellFoundedOnunde_a (((a_CONSTANTunde_PreImageunde_a ((a_CONSTANTunde_Cardinalityunde_a), ((a_CONSTANTunde_FiniteSubsetsOfunde_a ((a_CONSTANTunde_Sunde_a)))), ((a_CONSTANTunde_OpToRelunde_a ((\<lambda> a_Unknownunde_x1unde_a a_Unknownunde_x2unde_a . ((less ((a_Unknownunde_x1unde_a), (a_Unknownunde_x2unde_a))))), (Nat))))))), ((a_CONSTANTunde_FiniteSubsetsOfunde_a ((a_CONSTANTunde_Sunde_a)))))))"(is "PROP ?ob'453")
proof -
show "PROP ?ob'453"
using assms by blast
qed
end
