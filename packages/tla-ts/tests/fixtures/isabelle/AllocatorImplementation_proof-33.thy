(* automatically generated -- do not edit manually *)
theory tlapm_e3fc79 imports Constant Zenon begin
consts
  "isReal" :: c
  "isa_slas_a" :: "[c,c] => c"
  "isa_bksl_diva" :: "[c,c] => c"
  "isa_perc_a" :: "[c,c] => c"
  "isa_peri_peri_a" :: "[c,c] => c"
  "isInfinity" :: c
  "isa_lbrk_rbrk_a" :: "[c] => c"
  "isa_less_more_a" :: "[c] => c"

(* Generated from file "./AllocatorImplementation_proof.tla", line 105, characters 7-8 *)
lemma ob'33: (* 8175000ac5377052af689a946bb81bdf *)
(* usable definition CONSTANT_IsFiniteSet_ suppressed *)
(* usable definition CONSTANT_Cardinality_ suppressed *)
fixes a_CONSTANTunde_Clientsunde_a
fixes a_CONSTANTunde_Resourcesunde_a
fixes a_VARIABLEunde_unsatunde_a a_VARIABLEunde_unsatunde_a'
fixes a_VARIABLEunde_allocunde_a a_VARIABLEunde_allocunde_a'
fixes a_VARIABLEunde_schedunde_a a_VARIABLEunde_schedunde_a'
fixes a_VARIABLEunde_requestsunde_a a_VARIABLEunde_requestsunde_a'
fixes a_VARIABLEunde_holdingunde_a a_VARIABLEunde_holdingunde_a'
fixes a_VARIABLEunde_networkunde_a a_VARIABLEunde_networkunde_a'
(* usable definition CONSTANT_Sched!IsFiniteSet_ suppressed *)
(* usable definition CONSTANT_Sched!Cardinality_ suppressed *)
(* usable definition STATE_Sched!TypeInvariant_ suppressed *)
(* usable definition CONSTANT_Sched!PermSeqs_ suppressed *)
(* usable definition CONSTANT_Sched!Drop_ suppressed *)
(* usable definition STATE_Sched!available_ suppressed *)
(* usable definition CONSTANT_Sched!Range_ suppressed *)
(* usable definition STATE_Sched!toSchedule_ suppressed *)
(* usable definition STATE_Sched!Init_ suppressed *)
(* usable definition ACTION_Sched!Request_ suppressed *)
(* usable definition ACTION_Sched!Allocate_ suppressed *)
(* usable definition ACTION_Sched!Return_ suppressed *)
(* usable definition ACTION_Sched!Schedule_ suppressed *)
(* usable definition ACTION_Sched!Next_ suppressed *)
(* usable definition STATE_Sched!vars_ suppressed *)
(* usable definition TEMPORAL_Sched!Liveness_ suppressed *)
(* usable definition TEMPORAL_Sched!Allocator_ suppressed *)
(* usable definition STATE_Sched!ResourceMutex_ suppressed *)
(* usable definition STATE_Sched!UnscheduledClients_ suppressed *)
(* usable definition STATE_Sched!PrevResources_ suppressed *)
(* usable definition STATE_Sched!AllocatorInvariant_ suppressed *)
(* usable definition TEMPORAL_Sched!ClientsWillReturn_ suppressed *)
(* usable definition TEMPORAL_Sched!ClientsWillObtain_ suppressed *)
(* usable definition TEMPORAL_Sched!InfOftenSatisfied_ suppressed *)
(* usable definition CONSTANT_Sched!Symmetry_ suppressed *)
(* usable definition CONSTANT_Messages_ suppressed *)
(* usable definition STATE_TypeInvariant_ suppressed *)
(* usable definition STATE_Init_ suppressed *)
(* usable definition ACTION_Request_ suppressed *)
(* usable definition ACTION_RReq_ suppressed *)
(* usable definition ACTION_Allocate_ suppressed *)
(* usable definition ACTION_RAlloc_ suppressed *)
(* usable definition ACTION_Return_ suppressed *)
(* usable definition ACTION_RRet_ suppressed *)
(* usable definition ACTION_Schedule_ suppressed *)
(* usable definition ACTION_Next_ suppressed *)
(* usable definition STATE_vars_ suppressed *)
(* usable definition TEMPORAL_Liveness_ suppressed *)
(* usable definition TEMPORAL_Specification_ suppressed *)
(* usable definition STATE_RequestsInTransit_ suppressed *)
(* usable definition STATE_AllocsInTransit_ suppressed *)
(* usable definition STATE_ReturnsInTransit_ suppressed *)
(* usable definition STATE_Invariant_ suppressed *)
(* usable definition STATE_ResourceMutex_ suppressed *)
(* usable definition TEMPORAL_ClientsWillReturn_ suppressed *)
(* usable definition TEMPORAL_ClientsWillObtain_ suppressed *)
(* usable definition TEMPORAL_InfOftenSatisfied_ suppressed *)
(* usable definition TEMPORAL_SchedAllocator_ suppressed *)
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
(* usable definition CONSTANT_EnabledWrapper_ suppressed *)
(* usable definition CONSTANT_CdotWrapper_ suppressed *)
(* usable definition CONSTANT_NatInductiveDefHypothesis_ suppressed *)
(* usable definition CONSTANT_NatInductiveDefConclusion_ suppressed *)
(* usable definition CONSTANT_FiniteNatInductiveDefHypothesis_ suppressed *)
(* usable definition CONSTANT_FiniteNatInductiveDefConclusion_ suppressed *)
(* usable definition CONSTANT_IsTransitivelyClosedOn_ suppressed *)
(* usable definition CONSTANT_IsWellFoundedOn_ suppressed *)
(* usable definition CONSTANT_SetLessThan_ suppressed *)
(* usable definition CONSTANT_OpDefinesFcn_ suppressed *)
(* usable definition CONSTANT_WFInductiveDefines_ suppressed *)
(* usable definition CONSTANT_WFInductiveUnique_ suppressed *)
(* usable definition CONSTANT_TransitiveClosureOn_ suppressed *)
(* usable definition CONSTANT_OpToRel_ suppressed *)
(* usable definition CONSTANT_PreImage_ suppressed *)
(* usable definition CONSTANT_LexPairOrdering_ suppressed *)
(* usable definition CONSTANT_LexProductOrdering_ suppressed *)
(* usable definition CONSTANT_FiniteSubsetsOf_ suppressed *)
(* usable definition CONSTANT_StrictSubsetOrdering_ suppressed *)
(* usable definition CONSTANT_EnabledWrapper_ suppressed *)
(* usable definition CONSTANT_CdotWrapper_ suppressed *)
(* usable definition CONSTANT_PermsRec_ suppressed *)
(* usable definition CONSTANT_PermsFn_ suppressed *)
fixes a_CONSTANTunde_Sunde_a
assumes v'250: "((a_CONSTANTunde_IsFiniteSetunde_a ((a_CONSTANTunde_Sunde_a))))"
fixes a_CONSTANTunde_ssunde_a
assumes a_CONSTANTunde_ssunde_a_in : "(a_CONSTANTunde_ssunde_a \<in> ((SUBSET (a_CONSTANTunde_Sunde_a))))"
assumes v'256: "((\<And> a_CONSTANTunde_gunde_a :: c. (\<And> a_CONSTANTunde_hunde_a :: c. (\<And> a_CONSTANTunde_Uunde_a :: c. a_CONSTANTunde_Uunde_a \<in> ((a_CONSTANTunde_FiniteSubsetsOfunde_a ((a_CONSTANTunde_Sunde_a)))) \<Longrightarrow> ((\<forall> a_CONSTANTunde_Vunde_a \<in> ((a_CONSTANTunde_SetLessThanunde_a ((a_CONSTANTunde_Uunde_a), ((a_CONSTANTunde_StrictSubsetOrderingunde_a ((a_CONSTANTunde_Sunde_a)))), ((a_CONSTANTunde_FiniteSubsetsOfunde_a ((a_CONSTANTunde_Sunde_a))))))) : (((fapply ((a_CONSTANTunde_gunde_a), (a_CONSTANTunde_Vunde_a))) = (fapply ((a_CONSTANTunde_hunde_a), (a_CONSTANTunde_Vunde_a)))))) \<Longrightarrow> ((((a_CONSTANTunde_PermsRecunde_a ((a_CONSTANTunde_gunde_a), (a_CONSTANTunde_Uunde_a)))) = ((a_CONSTANTunde_PermsRecunde_a ((a_CONSTANTunde_hunde_a), (a_CONSTANTunde_Uunde_a)))))))))))"
shows "(\<forall>a_CONSTANTunde_gunde_a : (\<forall>a_CONSTANTunde_hunde_a : (\<forall> a_CONSTANTunde_xunde_a \<in> ((a_CONSTANTunde_FiniteSubsetsOfunde_a ((a_CONSTANTunde_Sunde_a)))) : (((\<forall> a_CONSTANTunde_yunde_a \<in> ((a_CONSTANTunde_SetLessThanunde_a ((a_CONSTANTunde_xunde_a), ((a_CONSTANTunde_StrictSubsetOrderingunde_a ((a_CONSTANTunde_Sunde_a)))), ((a_CONSTANTunde_FiniteSubsetsOfunde_a ((a_CONSTANTunde_Sunde_a))))))) : (((fapply ((a_CONSTANTunde_gunde_a), (a_CONSTANTunde_yunde_a))) = (fapply ((a_CONSTANTunde_hunde_a), (a_CONSTANTunde_yunde_a)))))) \<Rightarrow> ((((a_CONSTANTunde_PermsRecunde_a ((a_CONSTANTunde_gunde_a), (a_CONSTANTunde_xunde_a)))) = ((a_CONSTANTunde_PermsRecunde_a ((a_CONSTANTunde_hunde_a), (a_CONSTANTunde_xunde_a)))))))))))"(is "PROP ?ob'33")
proof -
show "PROP ?ob'33"
using assms by auto
qed
end
